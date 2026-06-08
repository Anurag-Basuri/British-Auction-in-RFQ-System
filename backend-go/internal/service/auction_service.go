package service

import (
	"british-auction-backend/internal/domain"
	"time"
)

type AuctionService interface {
	EvaluateExtension(rfq *domain.Rfq, newBid *domain.Bid, currentLeaderboard []domain.Bid) *ExtensionResult
}

type ExtensionResult struct {
	ExtendedMins int
	NewCloseTime time.Time
	Reason       string
}

type auctionService struct{}

func NewAuctionService() AuctionService {
	return &auctionService{}
}

func (s *auctionService) EvaluateExtension(rfq *domain.Rfq, newBid *domain.Bid, currentLeaderboard []domain.Bid) *ExtensionResult {
	now := time.Now()
	
	// If outside the trigger window, no extension
	windowStart := rfq.CloseTime.Add(-time.Duration(rfq.TriggerWindowMins) * time.Minute)
	if now.Before(windowStart) {
		return nil
	}

	var shouldExtend bool
	var reason string

	switch rfq.TriggerType {
	case domain.TriggerTypeAnyBid:
		shouldExtend = true
		reason = "Extended due to Any Bid rule within the trigger window"
	case domain.TriggerTypeL1Change:
		if len(currentLeaderboard) == 0 {
			shouldExtend = true
			reason = "Extended due to L1 Change (First bid placed)"
		} else {
			l1Price := currentLeaderboard[0].Price
			if newBid.Price < l1Price {
				shouldExtend = true
				reason = "Extended due to L1 Change (New lowest bid)"
			}
		}
	case domain.TriggerTypeRankChange:
		shouldExtend, reason = s.evaluateRankChange(newBid, currentLeaderboard)
	}

	if !shouldExtend {
		return nil
	}

	// Calculate new close time
	newClose := rfq.CloseTime.Add(time.Duration(rfq.ExtensionMins) * time.Minute)

	// Enforce forced close time (Drop-dead)
	if newClose.After(rfq.ForcedCloseTime) {
		newClose = rfq.ForcedCloseTime
	}

	// If the new close time is not actually later than the current close time, don't extend
	if !newClose.After(rfq.CloseTime) {
		return nil
	}

	extendedMins := int(newClose.Sub(rfq.CloseTime).Minutes())

	return &ExtensionResult{
		ExtendedMins: extendedMins,
		NewCloseTime: newClose,
		Reason:       reason,
	}
}

func (s *auctionService) evaluateRankChange(newBid *domain.Bid, currentLeaderboard []domain.Bid) (bool, string) {
	if len(currentLeaderboard) == 0 {
		return true, "Extended due to Rank Change (First participant)"
	}

	// Find the supplier's current rank (if they have one)
	currentRank := -1
	for i, b := range currentLeaderboard {
		if b.SupplierID == newBid.SupplierID {
			currentRank = i
			break
		}
	}

	// Build a hypothetical new leaderboard
	var newLeaderboard []domain.Bid
	added := false
	for _, b := range currentLeaderboard {
		if b.SupplierID == newBid.SupplierID {
			continue // We'll add the new bid instead
		}
		if !added && newBid.Price < b.Price {
			newLeaderboard = append(newLeaderboard, *newBid)
			added = true
		}
		newLeaderboard = append(newLeaderboard, b)
	}
	if !added {
		newLeaderboard = append(newLeaderboard, *newBid)
	}

	// Find the supplier's new rank
	newRank := -1
	for i, b := range newLeaderboard {
		if b.SupplierID == newBid.SupplierID {
			newRank = i
			break
		}
	}

	// Extension rule:
	// 1. Supplier improved their rank
	// 2. Or supplier is a new entrant who didn't just place last
	if currentRank == -1 {
		if newRank < len(newLeaderboard)-1 {
			return true, "Extended due to Rank Change (New supplier entered and ranked above others)"
		}
	} else if newRank < currentRank {
		return true, "Extended due to Rank Change (Supplier improved rank position)"
	}

	return false, ""
}
