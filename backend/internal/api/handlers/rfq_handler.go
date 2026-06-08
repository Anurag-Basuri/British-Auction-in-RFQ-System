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

type RfqHandler struct {
	rfqSvc service.RfqService
}

func NewRfqHandler(rfqSvc service.RfqService) *RfqHandler {
	return &RfqHandler{rfqSvc: rfqSvc}
}

type CreateRfqRequest struct {
	Title             string    `json:"title" validate:"required"`
	Description       string    `json:"description"`
	StartTime         string    `json:"start_time" validate:"required"`
	CloseTime         string    `json:"close_time" validate:"required"`
	ForcedCloseTime   string    `json:"forced_close_time" validate:"required"`
	PickupDate        string    `json:"pickup_date"`
	TriggerWindowMins int       `json:"trigger_window_mins" validate:"required,min=0"`
	ExtensionMins     int       `json:"extension_mins" validate:"required,min=0"`
	TriggerType       string    `json:"trigger_type" validate:"required,oneof=ANY_BID RANK_CHANGE L1_CHANGE"`
}

func (h *RfqHandler) CreateRfq(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r.Context())
	
	var req CreateRfqRequest
	if err := utils.DecodeAndValidate(r, &req); err != nil {
		middleware.HandleError(w, err)
		return
	}

	// Manual time parsing to match the domain model
	startTime, _ := time.Parse(time.RFC3339, req.StartTime)
	closeTime, _ := time.Parse(time.RFC3339, req.CloseTime)
	forcedCloseTime, _ := time.Parse(time.RFC3339, req.ForcedCloseTime)

	var descriptionPtr *string
	if req.Description != "" {
		descriptionPtr = &req.Description
	}

	var pickupDatePtr *time.Time
	if req.PickupDate != "" {
		pDate, _ := time.Parse(time.RFC3339, req.PickupDate)
		pickupDatePtr = &pDate
	}

	rfqModel := &domain.Rfq{
		Title:             req.Title,
		Description:       descriptionPtr,
		StartTime:         startTime,
		CloseTime:         closeTime,
		ForcedCloseTime:   forcedCloseTime,
		PickupDate:        pickupDatePtr,
		TriggerWindowMins: req.TriggerWindowMins,
		ExtensionMins:     req.ExtensionMins,
		TriggerType:       domain.TriggerType(req.TriggerType),
	}

	rfq, err := h.rfqSvc.CreateRfq(claims.Sub, rfqModel)
	if err != nil {
		middleware.HandleError(w, err)
		return
	}

	sendSuccess(w, 201, "RFQ created successfully", rfq)
}

func (h *RfqHandler) GetAllRfqs(w http.ResponseWriter, r *http.Request) {
	// Note: Authentication is required, but both BUYER and SUPPLIER can access this
	rfqs, err := h.rfqSvc.FindAll()
	if err != nil {
		middleware.HandleError(w, err)
		return
	}

	sendSuccess(w, 200, "RFQs retrieved", rfqs)
}

func (h *RfqHandler) GetRfq(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		middleware.HandleError(w, errors.NewAPIError(400, "Invalid RFQ ID"))
		return
	}

	rfq, err := h.rfqSvc.FindOne(uint(id))
	if err != nil {
		middleware.HandleError(w, err)
		return
	}

	sendSuccess(w, 200, "RFQ retrieved", rfq)
}

func (h *RfqHandler) EarlyClose(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r.Context())
	
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		middleware.HandleError(w, errors.NewAPIError(400, "Invalid RFQ ID"))
		return
	}

	err = h.rfqSvc.EarlyClose(uint(id), claims.Sub)
	if err != nil {
		middleware.HandleError(w, err)
		return
	}

	sendSuccess(w, 200, "RFQ forcefully closed early", nil)
}
