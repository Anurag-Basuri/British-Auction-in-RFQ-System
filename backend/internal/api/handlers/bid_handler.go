package handlers

import (
	"british-auction-backend/internal/api/middleware"
	"british-auction-backend/internal/domain"
	"british-auction-backend/internal/service"
	"british-auction-backend/pkg/errors"
	"british-auction-backend/pkg/utils"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
)

type BidHandler struct {
	bidSvc service.BidService
}

func NewBidHandler(bidSvc service.BidService) *BidHandler {
	return &BidHandler{bidSvc: bidSvc}
}

type PlaceBidRequest struct {
	FreightCharges     float64 `json:"freight_charges" validate:"min=0"`
	OriginCharges      float64 `json:"origin_charges" validate:"min=0"`
	DestinationCharges float64 `json:"destination_charges" validate:"min=0"`
	TransitTime        string  `json:"transit_time" validate:"required"`
	QuoteValidity      string  `json:"quote_validity" validate:"required"`
	ClientBidID        string  `json:"client_bid_id"`
}

func (h *BidHandler) PlaceBid(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r.Context())
	
	idStr := chi.URLParam(r, "id")
	rfqID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		middleware.HandleError(w, errors.NewAPIError(400, "Invalid RFQ ID"))
		return
	}

	var req PlaceBidRequest
	if err := utils.DecodeAndValidate(r, &req); err != nil {
		middleware.HandleError(w, err)
		return
	}

	quoteValidity, _ := time.Parse(time.RFC3339, req.QuoteValidity)

	var clientBidIDPtr *string
	if req.ClientBidID != "" {
		clientBidIDPtr = &req.ClientBidID
	}

	bidModel := &domain.Bid{
		FreightCharges:     req.FreightCharges,
		OriginCharges:      req.OriginCharges,
		DestinationCharges: req.DestinationCharges,
		TransitTime:        req.TransitTime,
		QuoteValidity:      quoteValidity,
		ClientBidID:        clientBidIDPtr,
	}

	bid, err := h.bidSvc.PlaceBid(uint(rfqID), claims.Sub, bidModel)
	if err != nil {
		middleware.HandleError(w, err)
		return
	}

	sendSuccess(w, 201, "Bid placed successfully", bid)
}
