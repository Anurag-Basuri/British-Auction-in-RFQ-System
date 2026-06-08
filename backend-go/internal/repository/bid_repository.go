package repository

import (
	"british-auction-backend/internal/domain"
	"british-auction-backend/internal/repository/postgres"
	"errors"

	"gorm.io/gorm"
)

type BidRepository interface {
	CreateTx(tx *gorm.DB, bid *domain.Bid) error
	FindByID(id uint) (*domain.Bid, error)
	FindByClientBidID(clientBidID string) (*domain.Bid, error)
	FindByClientBidIDTx(tx *gorm.DB, clientBidID string) (*domain.Bid, error)
	FindPreviousBestTx(tx *gorm.DB, rfqID uint, supplierID uint) (*domain.Bid, error)
	GetLeaderboardTx(tx *gorm.DB, rfqID uint) ([]domain.Bid, error)
	CreateExtensionLogTx(tx *gorm.DB, log *domain.ExtensionLog) error
	GetDB() *gorm.DB
}

type bidRepository struct {
	db *gorm.DB
}

func NewBidRepository() BidRepository {
	return &bidRepository{db: postgres.DB}
}

func (r *bidRepository) GetDB() *gorm.DB {
	return r.db
}

func (r *bidRepository) CreateTx(tx *gorm.DB, bid *domain.Bid) error {
	return tx.Create(bid).Error
}

func (r *bidRepository) FindByID(id uint) (*domain.Bid, error) {
	var bid domain.Bid
	err := r.db.Preload("Supplier").First(&bid, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &bid, nil
}

func (r *bidRepository) FindByClientBidID(clientBidID string) (*domain.Bid, error) {
	return r.FindByClientBidIDTx(r.db, clientBidID)
}

func (r *bidRepository) FindByClientBidIDTx(tx *gorm.DB, clientBidID string) (*domain.Bid, error) {
	var bid domain.Bid
	err := tx.Preload("Supplier").Where("client_bid_id = ?", clientBidID).First(&bid).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &bid, nil
}

func (r *bidRepository) FindPreviousBestTx(tx *gorm.DB, rfqID uint, supplierID uint) (*domain.Bid, error) {
	var bid domain.Bid
	err := tx.Where("rfq_id = ? AND supplier_id = ?", rfqID, supplierID).
		Order("price ASC").
		Order("timestamp ASC").
		First(&bid).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &bid, nil
}

func (r *bidRepository) GetLeaderboardTx(tx *gorm.DB, rfqID uint) ([]domain.Bid, error) {
	var bids []domain.Bid
	
	// Equivalent to Prisma groupBy: Get lowest price per supplier
	// Note: We use a subquery to get the exact bid row that represents the minimum price.
	subquery := tx.Table("bids").
		Select("supplier_id, MIN(price) as min_price").
		Where("rfq_id = ?", rfqID).
		Group("supplier_id")

	err := tx.Table("bids as b").
		Joins("INNER JOIN (?) as min_bids ON b.supplier_id = min_bids.supplier_id AND b.price = min_bids.min_price", subquery).
		Where("b.rfq_id = ?", rfqID).
		Order("b.price ASC").
		Order("b.timestamp ASC").
		Find(&bids).Error

	if err != nil {
		return nil, err
	}
	return bids, nil
}

func (r *bidRepository) CreateExtensionLogTx(tx *gorm.DB, log *domain.ExtensionLog) error {
	return tx.Create(log).Error
}
