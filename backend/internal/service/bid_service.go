package service

import (
	"british-auction-backend/internal/domain"
	"british-auction-backend/internal/repository"
	"british-auction-backend/internal/websocket"
	"british-auction-backend/internal/worker"
	"british-auction-backend/pkg/errors"
	"time"

	"gorm.io/gorm"
)

type BidService interface {
	PlaceBid(rfqID uint, supplierID uint, dto *domain.Bid) (*domain.Bid, error)
}

type bidService struct {
	bidRepo     repository.BidRepository
	rfqRepo     repository.RfqRepository
	auctionSvc  AuctionService
	wsHub       websocket.Hub
	queueSvc    worker.QueueService
}

func NewBidService(bidRepo repository.BidRepository, rfqRepo repository.RfqRepository, auctionSvc AuctionService, wsHub websocket.Hub, queueSvc worker.QueueService) BidService {
	return &bidService{
		bidRepo:    bidRepo,
		rfqRepo:    rfqRepo,
		auctionSvc: auctionSvc,
		wsHub:      wsHub,
		queueSvc:   queueSvc,
	}
}

func (s *bidService) PlaceBid(rfqID uint, supplierID uint, bid *domain.Bid) (*domain.Bid, error) {
	// Idempotency check
	if bid.ClientBidID != nil {
		existingBid, err := s.bidRepo.FindByClientBidID(*bid.ClientBidID)
		if err != nil {
			return nil, errors.NewAPIError(500, "Database error during idempotency check")
		}
		if existingBid != nil {
			return existingBid, nil
		}
	}

	var newBid *domain.Bid
	var extensionResult *ExtensionResult

	// Use GORM transaction
	err := s.bidRepo.GetDB().Transaction(func(tx *gorm.DB) error {
		// 1. Validate RFQ exists and is active
		var rfq domain.Rfq
		if err := tx.First(&rfq, rfqID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.NewAPIError(404, "RFQ not found")
			}
			return err
		}

		if rfq.Status != domain.RfqStatusActive {
			return errors.NewAPIError(400, "Auction is not active")
		}

		now := time.Now()
		if now.After(rfq.CloseTime) || now.After(rfq.ForcedCloseTime) {
			return errors.NewAPIError(400, "Auction has already closed")
		}

		// Calculate total price
		totalPrice := bid.FreightCharges + bid.OriginCharges + bid.DestinationCharges
		if totalPrice <= 0 {
			return errors.NewAPIError(400, "Total price must be greater than 0")
		}
		bid.Price = totalPrice
		bid.RfqID = rfqID
		bid.SupplierID = supplierID

		// 2. Validate price improvement
		prevBest, err := s.bidRepo.FindPreviousBestTx(tx, rfqID, supplierID)
		if err != nil {
			return err
		}
		if prevBest != nil && bid.Price >= prevBest.Price {
			return errors.NewAPIError(400, "New bid must strictly improve upon your previous best price")
		}

		// 3. Evaluate Extension
		leaderboard, err := s.bidRepo.GetLeaderboardTx(tx, rfqID)
		if err != nil {
			return err
		}

		extensionResult = s.auctionSvc.EvaluateExtension(&rfq, bid, leaderboard)

		// 4. If extended, update RFQ
		if extensionResult != nil {
			oldCloseTime := rfq.CloseTime
			rfq.CloseTime = extensionResult.NewCloseTime
			if err := s.rfqRepo.UpdateTx(tx, &rfq); err != nil {
				return err
			}

			// We need to create the bid first so the extension log can reference it
			if err := s.bidRepo.CreateTx(tx, bid); err != nil {
				return err
			}
			newBid = bid

			extLog := &domain.ExtensionLog{
				RfqID:         rfqID,
				TriggerBidID:  &bid.ID,
				Reason:        extensionResult.Reason,
				ExtendedMins:  extensionResult.ExtendedMins,
				PreviousClose: oldCloseTime,
				NewClose:      rfq.CloseTime,
			}
			if err := s.bidRepo.CreateExtensionLogTx(tx, extLog); err != nil {
				return err
			}
		} else {
			// Just create the bid
			if err := s.bidRepo.CreateTx(tx, bid); err != nil {
				return err
			}
			newBid = bid
		}

		return nil
	})

	if err != nil {
		if apiErr, ok := err.(*APIError); ok {
			return nil, apiErr
		}
		return nil, errors.NewAPIError(500, "Failed to place bid")
	}

	// Post-transaction Side Effects
	s.wsHub.BroadcastBidPlaced(rfqID, newBid)

	if extensionResult != nil {
		s.wsHub.BroadcastAuctionExtended(rfqID, extensionResult.NewCloseTime.Format(time.RFC3339))
		
		// Reschedule closure job
		delayMs := extensionResult.NewCloseTime.Sub(time.Now()).Milliseconds()
		if delayMs > 0 {
			s.queueSvc.ScheduleClosure(rfqID, delayMs)
		}
	}

	return newBid, nil
}
