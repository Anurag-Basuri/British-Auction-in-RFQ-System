package domain

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type User struct {
	ID           uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Email        string    `gorm:"uniqueIndex;not null" json:"email"`
	Password     *string   `json:"-"` // Don't expose password in JSON
	AuthProvider string    `gorm:"default:'local'" json:"authProvider"`
	Role         Role      `gorm:"type:varchar(20);default:'SUPPLIER'" json:"role"`
	Rfqs         []Rfq     `gorm:"foreignKey:BuyerID" json:"rfqs,omitempty"`
	Bids         []Bid     `gorm:"foreignKey:SupplierID" json:"bids,omitempty"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

// BeforeSave hook to hash the password
func (u *User) BeforeSave(tx *gorm.DB) (err error) {
	if u.Password != nil && *u.Password != "" {
		// Only hash if it's not already a bcrypt hash (starts with $2a$, $2b$, or $2y$)
		if len(*u.Password) > 3 && (*u.Password)[0:3] != "$2a" && (*u.Password)[0:3] != "$2b" && (*u.Password)[0:3] != "$2y" {
			hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*u.Password), bcrypt.DefaultCost)
			if err != nil {
				return err
			}
			strHash := string(hashedPassword)
			u.Password = &strHash
		}
	}
	return nil
}

func (u *User) CheckPassword(plain string) bool {
	if u.Password == nil {
		return false
	}
	err := bcrypt.CompareHashAndPassword([]byte(*u.Password), []byte(plain))
	return err == nil
}
