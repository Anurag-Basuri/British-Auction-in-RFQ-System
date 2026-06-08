package websocket

import "british-auction-backend/internal/domain"

type Hub interface {
	BroadcastToRfq(rfqID uint, event string, payload interface{})
	BroadcastBidPlaced(rfqID uint, bid *domain.Bid)
	BroadcastAuctionExtended(rfqID uint, newClose string)
	BroadcastAuctionClosed(rfqID uint)
}
