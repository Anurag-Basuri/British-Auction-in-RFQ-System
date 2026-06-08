package repository

import (
	"british-auction-backend/internal/domain"
	"british-auction-backend/internal/repository/postgres"
	"errors"

	"gorm.io/gorm"
)

type RfqRepository interface {
	Create(rfq *domain.Rfq) error
	FindAll() ([]domain.Rfq, error)
	FindByIDWithBids(id uint) (*domain.Rfq, error)
	FindByID(id uint) (*domain.Rfq, error)
	Update(rfq *domain.Rfq) error
	UpdateTx(tx *gorm.DB, rfq *domain.Rfq) error
}

type rfqRepository struct {
	db *gorm.DB
}

func NewRfqRepository() RfqRepository {
	return &rfqRepository{db: postgres.DB}
}

func (r *rfqRepository) Create(rfq *domain.Rfq) error {
	return r.db.Create(rfq).Error
}

func (r *rfqRepository) FindAll() ([]domain.Rfq, error) {
	var rfqs []domain.Rfq
	// Includes buyer info, bids (to calculate count and lowest bid)
	err := r.db.Preload("Buyer").Preload("Bids").Find(&rfqs).Error
	if err != nil {
		return nil, err
	}

	// Calculate virtual fields
	for i := range rfqs {
		rfqs[i].Count = &domain.RfqCount{Bids: len(rfqs[i].Bids)}
		if len(rfqs[i].Bids) > 0 {
			lowest := rfqs[i].Bids[0].Price
			for _, b := range rfqs[i].Bids {
				if b.Price < lowest {
					lowest = b.Price
				}
			}
			rfqs[i].CurrentLowestBid = &lowest
		}
		// Clear Bids slice so it doesn't get sent in the JSON response to keep it small
		rfqs[i].Bids = nil 
	}

	return rfqs, nil
}

func (r *rfqRepository) FindByIDWithBids(id uint) (*domain.Rfq, error) {
	var rfq domain.Rfq
	err := r.db.
		Preload("Buyer").
		Preload("Bids", func(db *gorm.DB) *gorm.DB {
			return db.Order("price ASC").Order("timestamp ASC").Preload("Supplier")
		}).
		Preload("ExtensionLogs", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC")
		}).
		First(&rfq, id).Error
	
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &rfq, nil
}

func (r *rfqRepository) FindByID(id uint) (*domain.Rfq, error) {
	var rfq domain.Rfq
	err := r.db.First(&rfq, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &rfq, nil
}

func (r *rfqRepository) Update(rfq *domain.Rfq) error {
	return r.db.Save(rfq).Error
}

func (r *rfqRepository) UpdateTx(tx *gorm.DB, rfq *domain.Rfq) error {
	return tx.Save(rfq).Error
}
