package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Env struct {
	Port         int
	NodeEnv      string
	DatabaseURL    string
	RedisURL       string
	JWTSecret      string
	GoogleClientID string
}

var AppEnv Env

func InitEnv() {
	// Load .env file if it exists, but don't crash if it doesn't (production might use raw env vars)
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	AppEnv = Env{
		Port:        getEnvAsInt("PORT", 8000),
		NodeEnv:     getEnv("NODE_ENV", "development"),
		DatabaseURL:    getEnv("DATABASE_URL", ""),
		RedisURL:       getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:      getEnv("JWT_SECRET", ""),
		GoogleClientID: getEnv("GOOGLE_CLIENT_ID", ""),
	}

	if AppEnv.DatabaseURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}
	if AppEnv.JWTSecret == "" || len(AppEnv.JWTSecret) < 16 {
		log.Fatal("JWT_SECRET environment variable is required and must be at least 16 characters")
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func getEnvAsInt(key string, fallback int) int {
	strValue := getEnv(key, "")
	if strValue == "" {
		return fallback
	}
	value, err := strconv.Atoi(strValue)
	if err != nil {
		log.Printf("Invalid integer for %s, using default: %d\n", key, fallback)
		return fallback
	}
	return value
}
