package service

import (
	"british-auction-backend/internal/domain"
	"british-auction-backend/internal/repository"
	"british-auction-backend/pkg/errors"
	"context"

	"google.golang.org/api/idtoken"
)

type AuthService interface {
	Register(email, password string, role domain.Role) (string, *domain.User, error)
	Login(email, password string) (string, *domain.User, error)
	GoogleLogin(token string, role domain.Role) (string, *domain.User, error)
}

type authService struct {
	userRepo repository.UserRepository
}

func NewAuthService(userRepo repository.UserRepository) AuthService {
	return &authService{userRepo: userRepo}
}

func (s *authService) Register(email, password string, role domain.Role) (string, *domain.User, error) {
	existingUser, err := s.userRepo.FindByEmail(email)
	if err != nil {
		return "", nil, errors.NewAPIError(500, "Database error during registration")
	}
	if existingUser != nil {
		return "", nil, errors.NewAPIError(409, "Email already in use")
	}

	user := &domain.User{
		Email:        email,
		Password:     &password,
		Role:         role,
		AuthProvider: "local",
	}

	err = s.userRepo.Create(user)
	if err != nil {
		return "", nil, errors.NewAPIError(500, "Failed to create user")
	}

	token, err := GenerateToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		return "", nil, errors.NewAPIError(500, "Failed to generate token")
	}

	return token, user, nil
}

func (s *authService) Login(email, password string) (string, *domain.User, error) {
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		return "", nil, errors.NewAPIError(500, "Database error during login")
	}
	if user == nil {
		return "", nil, errors.NewAPIError(401, "Invalid email or password")
	}
	
	if user.AuthProvider != "local" {
		return "", nil, errors.NewAPIError(401, "Please sign in with "+user.AuthProvider)
	}

	if !user.CheckPassword(password) {
		return "", nil, errors.NewAPIError(401, "Invalid email or password")
	}

	token, err := GenerateToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		return "", nil, errors.NewAPIError(500, "Failed to generate token")
	}

	return token, user, nil
}

func (s *authService) GoogleLogin(token string, role domain.Role) (string, *domain.User, error) {
	payload, err := idtoken.Validate(context.Background(), token, "") // empty audience accepts any client ID for simplicity
	if err != nil {
		return "", nil, errors.NewAPIError(401, "Invalid Google token")
	}

	email, ok := payload.Claims["email"].(string)
	if !ok || email == "" {
		return "", nil, errors.NewAPIError(401, "Google token missing email")
	}

	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		return "", nil, errors.NewAPIError(500, "Database error")
	}

	if user == nil {
		// Create new user
		user = &domain.User{
			Email:        email,
			Role:         role,
			AuthProvider: "google",
		}
		err = s.userRepo.Create(user)
		if err != nil {
			return "", nil, errors.NewAPIError(500, "Failed to create user")
		}
	} else if user.AuthProvider == "local" {
		// Prevent overwriting local auth provider (Fixes the issue from the audit!)
		return "", nil, errors.NewAPIError(409, "An account with this email already exists using password authentication. Please login with your password.")
	}

	jwtToken, err := GenerateToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		return "", nil, errors.NewAPIError(500, "Failed to generate token")
	}

	return jwtToken, user, nil
}
