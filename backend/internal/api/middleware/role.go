package middleware

import (
	"british-auction-backend/internal/domain"
	"british-auction-backend/pkg/errors"
	"net/http"
)

func RequireRole(role domain.Role) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims := GetClaims(r.Context())
			if claims == nil {
				HandleError(w, errors.NewAPIError(401, "Unauthorized"))
				return
			}

			if claims.Role != string(role) {
				HandleError(w, errors.NewAPIError(403, "Access restricted: requires "+string(role)+" role"))
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
