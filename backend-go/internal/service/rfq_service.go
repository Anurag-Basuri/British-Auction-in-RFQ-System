package service

import (
	"british-auction-backend/internal/domain"
	"british-auction-backend/internal/repository"
	"british-auction-backend/internal/websocket"
	"british-auction-backend/internal/worker"
	"british-auction-backend/pkg/errors"
	"time"
)

type RfqService interface {
	CreateRfq(buyerID uint, rfq *domain.Rfq) (*domain.Rfq, error)
	FindAll() ([]domain.Rfq, error)
	FindOne(id uint) (*domain.Rfq, error)
	EarlyClose(rfqID uint, buyerID uint) error
}

type rfqService struct {
	rfqRepo  repository.RfqRepository
	wsHub    websocket.Hub
	queueSvc worker.QueueService
}

func NewRfqService(rfqRepo repository.RfqRepository, wsHub websocket.Hub, queueSvc worker.QueueService) RfqService {
	return &rfqService{
		rfqRepo:  rfqRepo,
		wsHub:    wsHub,
		queueSvc: queueSvc,
	}
}

func (s *rfqService) CreateRfq(buyerID uint, rfq *domain.Rfq) (*domain.Rfq, error) {
	rfq.BuyerID = buyerID
	rfq.Status = domain.RfqStatusActive

	err := s.rfqRepo.Create(rfq)
	if err != nil {
		return nil, errors.NewAPIError(500, "Failed to create RFQ")
	}

	// Schedule closure
	delayMs := rfq.CloseTime.Sub(time.Now()).Milliseconds()
	if delayMs > 0 {
		s.queueSvc.ScheduleClosure(rfq.ID, delayMs)
	}

	return rfq, nil
}

func (s *rfqService) FindAll() ([]domain.Rfq, error) {
	rfqs, err := s.rfqRepo.FindAll()
	if err != nil {
		return nil, errors.NewAPIError(500, "Failed to fetch RFQs")
	}
	return rfqs, nil
}

func (s *rfqService) FindOne(id uint) (*domain.Rfq, error) {
	rfq, err := s.rfqRepo.FindByIDWithBids(id)
	if err != nil {
		return nil, errors.NewAPIError(500, "Database error")
	}
	if rfq == nil {
		return nil, errors.NewAPIError(404, "RFQ not found")
	}
	return rfq, nil
}

func (s *rfqService) EarlyClose(rfqID uint, buyerID uint) error {
	rfq, err := s.rfqRepo.FindByID(rfqID)
	if err != nil {
		return errors.NewAPIError(500, "Database error")
	}
	if rfq == nil {
		return errors.NewAPIError(404, "RFQ not found")
	}

	if rfq.BuyerID != buyerID {
		return errors.NewAPIError(403, "Only the buyer who created this RFQ can force close it")
	}

	if rfq.Status != domain.RfqStatusActive {
		return errors.NewAPIError(400, "RFQ is not active")
	}

	rfq.Status = domain.RfqStatusClosed
	// Set close time to now so it matches reality
	rfq.CloseTime = time.Now()

	err = s.rfqRepo.Update(rfq)
	if err != nil {
		return errors.NewAPIError(500, "Failed to close RFQ")
	}

	// Cancel the pending BullMQ/Asynq closure job (Fixes bug from audit)
	s.queueSvc.CancelClosure(rfqID)

	// Broadcast closure to connected clients
	s.wsHub.BroadcastAuctionClosed(rfqID)

	return nil
}
