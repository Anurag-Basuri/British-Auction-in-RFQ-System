package middleware

import (
	"british-auction-backend/pkg/errors"
	"encoding/json"
	"log"
	"net/http"
)

type ErrorResponse struct {
	Success bool     `json:"success"`
	Message string   `json:"message"`
	Errors  []string `json:"errors,omitempty"`
}

func HandleError(w http.ResponseWriter, err error) {
	if apiErr, ok := err.(*errors.APIError); ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(apiErr.StatusCode)
		json.NewEncoder(w).Encode(ErrorResponse{
			Success: false,
			Message: apiErr.Message,
			Errors:  apiErr.Errors,
		})
		return
	}

	// Unhandled error
	log.Printf("Internal Server Error: %v", err)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusInternalServerError)
	json.NewEncoder(w).Encode(ErrorResponse{
		Success: false,
		Message: "Internal server error",
	})
}
