package errors

import "fmt"

type APIError struct {
	StatusCode int
	Message    string
	Errors     []string
}

func (e *APIError) Error() string {
	return fmt.Sprintf("APIError %d: %s", e.StatusCode, e.Message)
}

func NewAPIError(statusCode int, message string, validationErrors ...string) *APIError {
	return &APIError{
		StatusCode: statusCode,
		Message:    message,
		Errors:     validationErrors,
	}
}
