package worker

import (
	"british-auction-backend/internal/config"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/hibiken/asynq"
)

const (
	TypeAuctionClosure = "auction:closure"
)

type AuctionClosurePayload struct {
	RfqID uint `json:"rfqId"`
}

type queueService struct {
	client *asynq.Client
	inspector *asynq.Inspector
}

func NewQueueService() QueueService {
	client := asynq.NewClient(asynq.RedisClientOpt{Addr: config.AppEnv.RedisURL})
	inspector := asynq.NewInspector(asynq.RedisClientOpt{Addr: config.AppEnv.RedisURL})
	return &queueService{
		client: client,
		inspector: inspector,
	}
}

func (s *queueService) ScheduleClosure(rfqID uint, delayMs int64) error {
	payload, err := json.Marshal(AuctionClosurePayload{RfqID: rfqID})
	if err != nil {
		return err
	}

	task := asynq.NewTask(TypeAuctionClosure, payload)
	
	// Create a unique Task ID so we can cancel/reschedule it if needed
	taskID := fmt.Sprintf("rfq_closure_%d", rfqID)
	
	// Try to delete existing task if we are rescheduling (extending)
	s.inspector.DeleteTask("default", taskID) // ignore errors if it doesn't exist

	delay := time.Duration(delayMs) * time.Millisecond
	info, err := s.client.Enqueue(
		task, 
		asynq.ProcessIn(delay),
		asynq.TaskID(taskID),
	)
	if err != nil {
		log.Printf("could not enqueue closure task: %v", err)
		return err
	}

	log.Printf("enqueued task: id=%s queue=%s", info.ID, info.Queue)
	return nil
}

func (s *queueService) CancelClosure(rfqID uint) error {
	taskID := fmt.Sprintf("rfq_closure_%d", rfqID)
	err := s.inspector.DeleteTask("default", taskID)
	if err != nil {
		log.Printf("could not delete task %s: %v", taskID, err)
		return err
	}
	return nil
}
