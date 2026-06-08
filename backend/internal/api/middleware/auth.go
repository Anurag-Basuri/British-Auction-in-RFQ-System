package middleware

import (
	"british-auction-backend/internal/service"
	"british-auction-backend/pkg/errors"
	"context"
	"net/http"
	"strings"
)

type contextKey string

const ClaimsContextKey contextKey = "userClaims"

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			HandleError(w, errors.NewAPIError(401, "No authorization header provided"))
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			HandleError(w, errors.NewAPIError(401, "Invalid authorization header format"))
			return
		}

		tokenString := parts[1]
		claims, err := service.VerifyToken(tokenString)
		if err != nil {
			HandleError(w, errors.NewAPIError(401, "Invalid or expired token"))
			return
		}

		ctx := context.WithValue(r.Context(), ClaimsContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func GetClaims(ctx context.Context) *service.Claims {
	claims, ok := ctx.Value(ClaimsContextKey).(*service.Claims)
	if !ok {
		return nil
	}
	return claims
}
