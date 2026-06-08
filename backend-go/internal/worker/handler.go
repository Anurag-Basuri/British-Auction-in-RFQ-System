package worker

import (
	"british-auction-backend/internal/domain"
	"british-auction-backend/internal/repository"
	"british-auction-backend/internal/websocket"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/hibiken/asynq"
)

type ClosureHandler struct {
	rfqRepo  repository.RfqRepository
	wsHub    websocket.Hub
	queueSvc QueueService
}

func NewClosureHandler(rfqRepo repository.RfqRepository, wsHub websocket.Hub, queueSvc QueueService) *ClosureHandler {
	return &ClosureHandler{
		rfqRepo:  rfqRepo,
		wsHub:    wsHub,
		queueSvc: queueSvc,
	}
}

func (h *ClosureHandler) ProcessTask(ctx context.Context, t *asynq.Task) error {
	var p AuctionClosurePayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %v: %w", err, asynq.SkipRetry)
	}

	log.Printf("Processing closure for RFQ %d", p.RfqID)

	rfq, err := h.rfqRepo.FindByID(p.RfqID)
	if err != nil {
		return fmt.Errorf("finding rfq failed: %v", err)
	}
	if rfq == nil {
		log.Printf("RFQ %d not found, dropping task", p.RfqID)
		return nil
	}

	if rfq.Status == domain.RfqStatusClosed {
		log.Printf("RFQ %d already closed", p.RfqID)
		return nil
	}

	now := time.Now()

	// Handle premature fire bug identified in the audit
	if now.Before(rfq.CloseTime) && now.Before(rfq.ForcedCloseTime) {
		log.Printf("Task fired prematurely for RFQ %d. Rescheduling.", p.RfqID)
		delay := rfq.CloseTime.Sub(now)
		h.queueSvc.ScheduleClosure(p.RfqID, delay.Milliseconds())
		return nil
	}

	// Close the auction
	rfq.Status = domain.RfqStatusClosed
	if err := h.rfqRepo.Update(rfq); err != nil {
		return fmt.Errorf("updating rfq failed: %v", err)
	}

	// Broadcast closure
	h.wsHub.BroadcastAuctionClosed(p.RfqID)
	log.Printf("Successfully closed RFQ %d", p.RfqID)

	return nil
}
