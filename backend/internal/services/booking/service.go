package booking

import (
	"context"

	"github.com/TheSR007/That_Team_IEE/backend/internal/db/booking_db/store"
	"go.uber.org/zap"
)

type HoldSeatRequest struct {
	ShowtimeID     string `json:"showtime_id" binding:"required"`
	ShowtimeSeatID string `json:"showtime_seat_id" binding:"required"`
	UserID         string `json:"user_id" binding:"required"`
}

type HoldSeatResponse struct {
	HoldID     string `json:"hold_id"` // Maps to showtime_seat_id
	ShowtimeID string `json:"showtime_id"`
	Status     string `json:"status"`
	ExpiresAt  string `json:"expires_at"`
}

type CreateBookingRequest struct {
	HoldID string `json:"hold_id" binding:"required"`
	Phone  string `json:"phone" binding:"required"`
}

type CreateBookingResponse struct {
	BookingRef  string  `json:"booking_ref"`
	HoldID      string  `json:"hold_id"`
	Status      string  `json:"status"`
	TotalAmount float64 `json:"total_amount"`
	ExpiresAt   string  `json:"expires_at"`
}

type BookingDetailsResponse struct {
	BookingRef  string  `json:"booking_ref"`
	ShowtimeID  string  `json:"showtime_id"`
	Status      string  `json:"status"`
	TotalAmount float64 `json:"total_amount"`
	CreatedAt   string  `json:"created_at"`
	ExpiresAt   string  `json:"expires_at"`
}

type Service struct {
	store   store.Querier
	holdTTL int
	logger  *zap.Logger
}

func NewService(store store.Querier, holdTTL int, logger *zap.Logger) *Service {
	return &Service{
		store:   store,
		holdTTL: holdTTL,
		logger:  logger,
	}
}

func (s *Service) HoldSeat(ctx context.Context, req HoldSeatRequest) (*HoldSeatResponse, error) {
	// TODO: Acquire Redis lock, atomic row lock update in booking_db
	return &HoldSeatResponse{
		HoldID:     req.ShowtimeSeatID,
		ShowtimeID: req.ShowtimeID,
		Status:     "HELD",
		ExpiresAt:  "2026-08-08T09:05:00Z",
	}, nil
}

func (s *Service) CreateBooking(ctx context.Context, req CreateBookingRequest) (*CreateBookingResponse, error) {
	// TODO: Validate hold TTL, insert pending booking in booking_db
	return &CreateBookingResponse{
		BookingRef:  "bk_001",
		HoldID:      req.HoldID,
		Status:      "PENDING",
		TotalAmount: 450,
		ExpiresAt:   "2026-08-08T09:05:00Z",
	}, nil
}

func (s *Service) GetBooking(ctx context.Context, bookingRef string) (*BookingDetailsResponse, error) {
	// TODO: Query booking details from booking_db
	return &BookingDetailsResponse{
		BookingRef:  bookingRef,
		ShowtimeID:  "sh_101",
		Status:      "CONFIRMED",
		TotalAmount: 450,
		CreatedAt:   "2026-08-08T09:00:00Z",
		ExpiresAt:   "2026-08-08T09:05:00Z",
	}, nil
}
