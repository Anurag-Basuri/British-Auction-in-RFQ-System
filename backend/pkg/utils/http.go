package utils

import (
	"british-auction-backend/pkg/errors"
	"encoding/json"
	"net/http"

	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

// DecodeAndValidate reads the JSON body into v and validates it.
func DecodeAndValidate(r *http.Request, v interface{}) error {
	if err := json.NewDecoder(r.Body).Decode(v); err != nil {
		return errors.NewAPIError(400, "Invalid JSON payload")
	}

	if err := validate.Struct(v); err != nil {
		var validationErrors []string
		for _, err := range err.(validator.ValidationErrors) {
			validationErrors = append(validationErrors, err.Field()+": "+err.ActualTag())
		}
		return errors.NewAPIError(400, "Validation failed", validationErrors...)
	}

	return nil
}
