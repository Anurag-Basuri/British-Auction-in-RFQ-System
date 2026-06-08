package domain

import (
	"time"
)

type Rfq struct {
	ID                uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	Title             string         `gorm:"not null" json:"title"`
	Description       *string        `json:"description,omitempty"`
	StartTime         time.Time      `gorm:"not null" json:"start_time"`
	CloseTime         time.Time      `gorm:"not null" json:"close_time"`
	ForcedCloseTime   time.Time      `gorm:"not null" json:"forced_close_time"`
	PickupDate        *time.Time     `json:"pickup_date,omitempty"`
	TriggerWindowMins int            `gorm:"not null" json:"trigger_window_mins"`
	ExtensionMins     int            `gorm:"not null" json:"extension_mins"`
	TriggerType       TriggerType    `gorm:"type:varchar(20);not null" json:"trigger_type"`
	Status            RfqStatus      `gorm:"type:varchar(20);default:'DRAFT'" json:"status"`
	BuyerID           uint           `gorm:"not null" json:"buyerId"`
	Buyer             *User          `gorm:"foreignKey:BuyerID" json:"buyer,omitempty"`
	Bids              []Bid          `gorm:"foreignKey:RfqID" json:"bids,omitempty"`
	ExtensionLogs     []ExtensionLog `gorm:"foreignKey:RfqID" json:"extensionLogs,omitempty"`
	CreatedAt         time.Time      `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt         time.Time      `gorm:"autoUpdateTime" json:"updatedAt"`

	// Virtual field for frontend compatibility
	CurrentLowestBid *float64 `gorm:"-" json:"currentLowestBid,omitempty"`
	Count            *RfqCount `gorm:"-" json:"_count,omitempty"`
}

type RfqCount struct {
	Bids int `json:"bids"`
}
