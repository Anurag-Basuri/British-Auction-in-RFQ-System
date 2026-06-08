package domain

type Role string

const (
	RoleBuyer    Role = "BUYER"
	RoleSupplier Role = "SUPPLIER"
)

type TriggerType string

const (
	TriggerTypeAnyBid    TriggerType = "ANY_BID"
	TriggerTypeRankChange TriggerType = "RANK_CHANGE"
	TriggerTypeL1Change  TriggerType = "L1_CHANGE"
)

type RfqStatus string

const (
	RfqStatusDraft  RfqStatus = "DRAFT"
	RfqStatusActive RfqStatus = "ACTIVE"
	RfqStatusClosed RfqStatus = "CLOSED"
)
