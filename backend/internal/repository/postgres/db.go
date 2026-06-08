package postgres

import (
	"log"

	"british-auction-backend/internal/config"
	"british-auction-backend/internal/domain"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() {
	var err error
	
	// Configure GORM logger based on environment
	logLevel := logger.Warn
	if config.AppEnv.NodeEnv == "development" {
		logLevel = logger.Info
	}

	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	}

	DB, err = gorm.Open(postgres.Open(config.AppEnv.DatabaseURL), gormConfig)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Connected to PostgreSQL database successfully")

	// Auto Migrate the schemas
	err = DB.AutoMigrate(
		&domain.User{},
		&domain.Rfq{},
		&domain.Bid{},
		&domain.ExtensionLog{},
	)
	if err != nil {
		log.Fatalf("Failed to auto-migrate database schemas: %v", err)
	}

	log.Println("Database schemas migrated successfully")
}

func CloseDB() {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err == nil {
			sqlDB.Close()
			log.Println("PostgreSQL connection closed")
		}
	}
}
