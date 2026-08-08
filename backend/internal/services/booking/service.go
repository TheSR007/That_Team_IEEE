package booking

import (
	"context"

	"github.com/TheSR007/That_Team_IEE/backend/internal/db/booking_db/store"
	"go.uber.org/zap"
)

type HoldSeatRequest struct {
	ShowtimeID string `json:"showtime_id" binding:"required"`
	SeatNumber string `json:"seat_number" binding:"required"`
	UserID     string `json:"user_id" binding:"required"`
}

type HoldSeatResponse struct {
	HoldID     string `json:"hold_id"`
	ShowtimeID string `json:"showtime_id"`
	SeatNumber string `json:"seat_number"`
	Status     string `json:"status"`
	ExpiresAt  string `json:"expires_at"`
}

type CreateBookingRequest struct {
	HoldID string `json:"hold_id" binding:"required"`
	Phone  string `json:"phone" binding:"required"`
}

type CreateBookingResponse struct {
	BookingRef    string  `json:"booking_ref"`
	HoldID        string  `json:"hold_id"`
	Status        string  `json:"status"`
	Amount        float64 `json:"amount"`
	HoldExpiresAt string  `json:"hold_expires_at"`
}

type BookingDetailsResponse struct {
	BookingRef string `json:"booking_ref"`
	ShowtimeID string `json:"showtime_id"`
	SeatNumber string `json:"seat_number"`
	Status     string `json:"status"`
	UpdatedAt  string `json:"updated_at"`
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
	// TODO: Acquire Redis lock, run atomic DB update in booking_db
	return &HoldSeatResponse{
		HoldID:     "hld_882",
		ShowtimeID: req.ShowtimeID,
		SeatNumber: req.SeatNumber,
		Status:     "HELD",
		ExpiresAt:  "2026-08-08T09:05:00Z",
	}, nil
}

func (s *Service) CreateBooking(ctx context.Context, req CreateBookingRequest) (*CreateBookingResponse, error) {
	// TODO: Validate hold TTL, create pending booking record, trigger async charge
	return &CreateBookingResponse{
		BookingRef:    "bk_001",
		HoldID:        req.HoldID,
		Status:        "PENDING",
		Amount:        450,
		HoldExpiresAt: "2026-08-08T09:05:00Z",
	}, nil
}

func (s *Service) GetBooking(ctx context.Context, bookingRef string) (*BookingDetailsResponse, error) {
	// TODO: Fetch booking status from booking_db
	return &BookingDetailsResponse{
		BookingRef: bookingRef,
		ShowtimeID: "sh_101",
		SeatNumber: "F12",
		Status:     "CONFIRMED",
		UpdatedAt:  "2026-08-08T09:02:15Z",
	}, nil
}
