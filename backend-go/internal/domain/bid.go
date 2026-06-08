package domain

import (
	"time"
)

type Bid struct {
	ID                 uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	RfqID              uint           `gorm:"not null;index:idx_rfq_price_timestamp,priority:1" json:"rfqId"`
	Rfq                *Rfq           `gorm:"foreignKey:RfqID" json:"rfq,omitempty"`
	SupplierID         uint           `gorm:"not null" json:"supplierId"`
	Supplier           *User          `gorm:"foreignKey:SupplierID" json:"supplier,omitempty"`
	FreightCharges     float64        `gorm:"not null" json:"freight_charges"`
	OriginCharges      float64        `gorm:"not null" json:"origin_charges"`
	DestinationCharges float64        `gorm:"not null" json:"destination_charges"`
	Price              float64        `gorm:"not null;index:idx_rfq_price_timestamp,priority:2" json:"price"`
	TransitTime        string         `gorm:"not null" json:"transit_time"`
	QuoteValidity      time.Time      `gorm:"not null" json:"quote_validity"`
	Timestamp          time.Time      `gorm:"autoCreateTime;index:idx_rfq_price_timestamp,priority:3" json:"timestamp"`
	ClientBidID        *string        `gorm:"uniqueIndex" json:"client_bid_id,omitempty"`
	TriggeringLogs     []ExtensionLog `gorm:"foreignKey:TriggerBidID" json:"triggeringExtensions,omitempty"`
}
