package worker

type QueueService interface {
	ScheduleClosure(rfqID uint, delayMs int64) error
	CancelClosure(rfqID uint) error
}
