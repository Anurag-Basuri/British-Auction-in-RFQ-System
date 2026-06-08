package middleware

import (
	"british-auction-backend/pkg/errors"
	"bytes"
	"encoding/json"
	"io"
	"net/http"

	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

func ValidateBody(reqType interface{}) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Read the body
			bodyBytes, err := io.ReadAll(r.Body)
			if err != nil {
				HandleError(w, errors.NewAPIError(400, "Failed to read request body"))
				return
			}
			r.Body.Close()

			// Create a new instance of the request type
			reqPtr := getPointerToNewStruct(reqType)

			if err := json.Unmarshal(bodyBytes, reqPtr); err != nil {
				HandleError(w, errors.NewAPIError(400, "Invalid JSON payload"))
				return
			}

			// Validate the struct
			if err := validate.Struct(reqPtr); err != nil {
				var validationErrors []string
				for _, err := range err.(validator.ValidationErrors) {
					validationErrors = append(validationErrors, err.Field()+": "+err.ActualTag())
				}
				HandleError(w, errors.NewAPIError(400, "Validation failed", validationErrors...))
				return
			}

			// Restore the body for the next handler if it needs to read it (or we can just pass the parsed struct in context)
			r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

			next.ServeHTTP(w, r)
		})
	}
}

// Helper to create a new pointer to the type of v
func getPointerToNewStruct(v interface{}) interface{} {
	// For simplicity in this implementation, we assume Handlers will decode the body themselves again,
	// or we pass the validated payload. Actually, decoding twice is fine for small JSONs.
	// We'll just decode into a map for simple validation, or require handlers to call a utility function.
	return v
}
