package payment

import (
	"context"

	"github.com/TheSR007/That_Team_IEE/backend/internal/db/booking_db/store"
	"go.uber.org/zap"
)

type WebhookCallbackPayload struct {
	EventID    string  `json:"event_id" binding:"required"`
	PaymentID  string  `json:"payment_id" binding:"required"`
	BookingRef string  `json:"booking_ref" binding:"required"`
	Status     string  `json:"status" binding:"required"` // SUCCEEDED, FAILED, REFUNDED
	Amount     float64 `json:"amount" binding:"required"`
}

type SendOTPRequest struct {
	Phone string `json:"phone" binding:"required"`
	Ref   string `json:"ref" binding:"required"`
}

type VerifyOTPRequest struct {
	Ref  string `json:"ref" binding:"required"`
	Code string `json:"code" binding:"required"`
}

type Service struct {
	store  store.Querier
	logger *zap.Logger
}

func NewService(store store.Querier, logger *zap.Logger) *Service {
	return &Service{
		store:  store,
		logger: logger,
	}
}

func (s *Service) HandleCallback(ctx context.Context, payload WebhookCallbackPayload) error {
	// TODO: Idempotent processing using last_event_id in payments table
	return nil
}

func (s *Service) SendOTP(ctx context.Context, req SendOTPRequest) error {
	// TODO: Relay OTP request to external mock gateway (/otp/send) and cache in Redis
	return nil
}

func (s *Service) VerifyOTP(ctx context.Context, req VerifyOTPRequest) (bool, error) {
	// TODO: Relay OTP verification to external mock gateway (/otp/verify) or verify in Redis
	return true, nil
}
