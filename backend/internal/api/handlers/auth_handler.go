package handlers

import (
	"british-auction-backend/internal/api/middleware"
	"british-auction-backend/internal/domain"
	"british-auction-backend/internal/service"
	"british-auction-backend/pkg/errors"
	"british-auction-backend/pkg/utils"
	"encoding/json"
	"net/http"
)

type AuthHandler struct {
	authSvc service.AuthService
}

func NewAuthHandler(authSvc service.AuthService) *AuthHandler {
	return &AuthHandler{authSvc: authSvc}
}

type RegisterRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
	Role     string `json:"role" validate:"required,oneof=BUYER SUPPLIER"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type GoogleLoginRequest struct {
	Token string `json:"token" validate:"required"`
	Role  string `json:"role"`
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := utils.DecodeAndValidate(r, &req); err != nil {
		middleware.HandleError(w, err)
		return
	}

	token, user, err := h.authSvc.Register(req.Email, req.Password, domain.Role(req.Role))
	if err != nil {
		middleware.HandleError(w, err)
		return
	}

	sendSuccess(w, 201, "Registration successful", map[string]interface{}{
		"access_token": token,
		"user": map[string]interface{}{
			"id":    user.ID,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := utils.DecodeAndValidate(r, &req); err != nil {
		middleware.HandleError(w, err)
		return
	}

	token, user, err := h.authSvc.Login(req.Email, req.Password)
	if err != nil {
		middleware.HandleError(w, err)
		return
	}

	sendSuccess(w, 200, "Login successful", map[string]interface{}{
		"access_token": token,
		"user": map[string]interface{}{
			"id":    user.ID,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

func (h *AuthHandler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	var req GoogleLoginRequest
	if err := utils.DecodeAndValidate(r, &req); err != nil {
		middleware.HandleError(w, err)
		return
	}

	role := domain.RoleSupplier
	if req.Role == "BUYER" {
		role = domain.RoleBuyer
	}

	token, user, err := h.authSvc.GoogleLogin(req.Token, role)
	if err != nil {
		middleware.HandleError(w, err)
		return
	}

	sendSuccess(w, 200, "Google login successful", map[string]interface{}{
		"access_token": token,
		"user": map[string]interface{}{
			"id":    user.ID,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r.Context())
	if claims == nil {
		middleware.HandleError(w, errors.NewAPIError(401, "Unauthorized"))
		return
	}

	sendSuccess(w, 200, "User profile", map[string]interface{}{
		"id":    claims.Sub,
		"email": claims.Email,
		"role":  claims.Role,
	})
}

func sendSuccess(w http.ResponseWriter, status int, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": message,
		"data":    data,
	})
}
