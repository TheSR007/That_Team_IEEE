package payment

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
	"go.uber.org/zap"

	"github.com/TheSR007/That_Team_IEE/backend/internal/db/booking_db/store"
	"github.com/TheSR007/That_Team_IEE/backend/internal/pkg/mockgateway"
	"github.com/TheSR007/That_Team_IEE/backend/internal/pkg/redis"
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
	store         store.Querier
	redis         *redis.Client
	gatewayClient *mockgateway.Client
	logger        *zap.Logger
}

func NewService(store store.Querier, redisClient *redis.Client, gatewayClient *mockgateway.Client, logger *zap.Logger) *Service {
	return &Service{
		store:         store,
		redis:         redisClient,
		gatewayClient: gatewayClient,
		logger:        logger,
	}
}

func (s *Service) HandleCallback(ctx context.Context, payload WebhookCallbackPayload) error {
	s.logger.Info("Processing payment webhook callback",
		zap.String("event_id", payload.EventID),
		zap.String("booking_ref", payload.BookingRef),
		zap.String("status", payload.Status),
	)

	if s.store == nil {
		return nil
	}

	// 1. Idempotency Check & Insert via ON CONFLICT (last_event_id) DO NOTHING
	_, err := s.store.RecordPaymentCallback(ctx, store.RecordPaymentCallbackParams{
		PaymentID:   payload.PaymentID,
		BookingRef:  payload.BookingRef,
		Amount:      numericFromFloat64(payload.Amount),
		Currency:    "BDT",
		Status:      store.PaymentStatus(payload.Status),
		LastEventID: pgtype.Text{String: payload.EventID, Valid: true},
	})
	if err != nil {
		s.logger.Warn("Notice recording payment callback", zap.Error(err))
	}

	// 2. Update Booking and Seat Status if SUCCEEDED
	if payload.Status == "SUCCEEDED" {
		_, _ = s.store.UpdateBookingStatus(ctx, store.UpdateBookingStatusParams{
			Status:     store.BookingStatusCONFIRMED,
			BookingRef: payload.BookingRef,
		})
		_ = s.store.ConfirmShowtimeSeats(ctx, payload.BookingRef)
	} else if payload.Status == "FAILED" {
		_, _ = s.store.UpdateBookingStatus(ctx, store.UpdateBookingStatusParams{
			Status:     store.BookingStatusEXPIRED,
			BookingRef: payload.BookingRef,
		})
	}

	return nil
}

func (s *Service) SendOTP(ctx context.Context, req SendOTPRequest) error {
	if s.gatewayClient != nil {
		return s.gatewayClient.SendOTP(ctx, mockgateway.OTPSendPayload{
			Phone: req.Phone,
			Ref:   req.Ref,
		})
	}
	return nil
}

func (s *Service) VerifyOTP(ctx context.Context, req VerifyOTPRequest) (bool, error) {
	if s.gatewayClient != nil {
		return s.gatewayClient.VerifyOTP(ctx, mockgateway.OTPVerifyPayload{
			Ref:  req.Ref,
			Code: req.Code,
		})
	}
	return true, nil
}

func numericFromFloat64(f float64) pgtype.Numeric {
	var n pgtype.Numeric
	_ = n.Scan(fmt.Sprintf("%.2f", f))
	return n
}

func numericToFloat64(n pgtype.Numeric) float64 {
	if !n.Valid || n.Int == nil {
		return 0.0
	}
	f, err := n.Float64Value()
	if err != nil || !f.Valid {
		return 0.0
	}
	return f.Float64
}
