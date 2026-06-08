package domain

import (
	"time"
)

type ExtensionLog struct {
	ID            uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	RfqID         uint      `gorm:"not null" json:"rfqId"`
	Rfq           *Rfq      `gorm:"foreignKey:RfqID" json:"rfq,omitempty"`
	TriggerBidID  *uint     `json:"triggerBidId,omitempty"`
	TriggerBid    *Bid      `gorm:"foreignKey:TriggerBidID" json:"triggerBid,omitempty"`
	Reason        string    `gorm:"not null" json:"reason"`
	ExtendedMins  int       `gorm:"not null" json:"extended_mins"`
	PreviousClose time.Time `gorm:"not null" json:"previous_close"`
	NewClose      time.Time `gorm:"not null" json:"new_close"`
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"createdAt"`
}
