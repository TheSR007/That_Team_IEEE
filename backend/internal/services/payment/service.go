package payment

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	bookingv1 "github.com/TheSR007/That_Team_IEE/backend/gen/go/booking/v1"
	"github.com/TheSR007/That_Team_IEE/backend/internal/db/booking_db/store"
	"github.com/TheSR007/That_Team_IEE/backend/internal/pkg/mockgateway"
	redispkg "github.com/TheSR007/That_Team_IEE/backend/internal/pkg/redis"
)

// ─── Request/Response DTOs ───────────────────────────────────────────────────

type WebhookCallbackPayload struct {
	EventID    string  `json:"event_id"    binding:"required"`
	PaymentID  string  `json:"payment_id"  binding:"required"`
	BookingRef string  `json:"booking_ref" binding:"required"`
	Status     string  `json:"status"      binding:"required"` // SUCCEEDED | FAILED | REFUNDED
	Amount     float64 `json:"amount"      binding:"required"`
}

type SendOTPRequest struct {
	Phone string `json:"phone" binding:"required"`
	Ref   string `json:"ref"   binding:"required"`
}

type VerifyOTPRequest struct {
	Ref  string `json:"ref"  binding:"required"`
	Code string `json:"code" binding:"required"`
}

type VerifyOTPResult struct {
	Verified bool
	Charged  bool // true if /charge was dispatched after verify
}

// ─── Service ─────────────────────────────────────────────────────────────────

type Service struct {
	store           store.Querier
	redis           *redispkg.Client
	gateway         *mockgateway.Client
	bookingGRPCAddr string // e.g. "booking:50052"
	callbackBaseURL string // e.g. "http://nginx:8080"
	logger          *zap.Logger
}

func NewService(
	store store.Querier,
	redisClient *redispkg.Client,
	gatewayClient *mockgateway.Client,
	bookingGRPCAddr string,
	callbackBaseURL string,
	logger *zap.Logger,
) *Service {
	return &Service{
		store:           store,
		redis:           redisClient,
		gateway:         gatewayClient,
		bookingGRPCAddr: bookingGRPCAddr,
		callbackBaseURL: callbackBaseURL,
		logger:          logger,
	}
}

// ─── OTP: Send (with retry) ──────────────────────────────────────────────────

// SendOTP proxies an OTP request to the gateway with up to 3 retries (500ms backoff).
func (s *Service) SendOTP(ctx context.Context, req SendOTPRequest) error {
	err := s.gateway.SendOTPWithRetry(ctx, mockgateway.OTPSendPayload{
		Phone: req.Phone,
		Ref:   req.Ref,
	}, 3)
	if err != nil {
		s.logger.Warn("OTP dispatch failed after retries",
			zap.String("ref", req.Ref),
			zap.Error(err),
		)
		return err
	}
	s.logger.Info("OTP dispatched", zap.String("ref", req.Ref))
	return nil
}

// ─── OTP: Verify + Charge ────────────────────────────────────────────────────

// VerifyOTPAndCharge proxies OTP verification to the gateway.
// On success, it asynchronously dispatches POST /charge to the gateway
// and returns immediately with Verified=true, Charged=true.
func (s *Service) VerifyOTPAndCharge(ctx context.Context, req VerifyOTPRequest) (*VerifyOTPResult, error) {
	// 1. Proxy to gateway /otp/verify
	verified, err := s.gateway.VerifyOTP(ctx, mockgateway.OTPVerifyPayload{
		Ref:  req.Ref,
		Code: req.Code,
	})
	if err != nil {
		s.logger.Error("OTP verify gateway error",
			zap.String("ref", req.Ref),
			zap.Error(err),
		)
		return nil, err
	}

	if !verified {
		s.logger.Info("OTP verification failed (wrong code)", zap.String("ref", req.Ref))
		return &VerifyOTPResult{Verified: false, Charged: false}, nil
	}

	s.logger.Info("OTP verified, dispatching charge", zap.String("booking_ref", req.Ref))

	// 2. Look up booking to get the amount
	var amount float64
	var currency = "BDT"
	if s.store != nil {
		booking, err := s.store.GetBookingByRef(ctx, req.Ref)
		if err == nil {
			amount = numericToFloat64(booking.TotalAmount)
		}
	}

	// 3. Fire charge in a goroutine — non-blocking
	go func() {
		chargeCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		callbackURL := fmt.Sprintf("%s/api/v1/payments/callback", s.callbackBaseURL)
		_, err := s.gateway.ChargeWithRetry(chargeCtx, mockgateway.ChargePayload{
			Amount:      amount,
			Currency:    currency,
			BookingRef:  req.Ref,
			CallbackURL: callbackURL,
		}, nil, 3)
		if err != nil {
			s.logger.Error("Charge dispatch failed",
				zap.String("booking_ref", req.Ref),
				zap.Error(err),
			)
			// Mark booking as FAILED if charge cannot be dispatched at all
			if s.store != nil {
				_, _ = s.store.UpdateBookingStatus(context.Background(), store.UpdateBookingStatusParams{
					Status:     store.BookingStatusFAILED,
					BookingRef: req.Ref,
				})
			}
		} else {
			s.logger.Info("Charge dispatched successfully", zap.String("booking_ref", req.Ref))
		}
	}()

	return &VerifyOTPResult{Verified: true, Charged: true}, nil
}

// ─── Payment Callback ────────────────────────────────────────────────────────

// HandleCallback processes a gateway webhook callback idempotently.
// IMPORTANT: This must always return without error — HTTP handler returns 200 first,
// then calls this in a goroutine.
func (s *Service) HandleCallback(ctx context.Context, payload WebhookCallbackPayload) {
	log := s.logger.With(
		zap.String("event_id", payload.EventID),
		zap.String("booking_ref", payload.BookingRef),
		zap.String("status", payload.Status),
	)

	log.Info("Payment callback received")

	// ── Step 1: Redis fast-path idempotency check ──
	idempotencyKey := fmt.Sprintf("payment:idempotency:%s", payload.EventID)
	if s.redis != nil {
		alreadySeen, err := s.redis.Exists(ctx, idempotencyKey)
		if err == nil && alreadySeen {
			log.Info("Duplicate callback ignored (Redis idempotency key exists)")
			return
		}
		// Acquire idempotency key (24h TTL)
		_ = s.redis.Set(ctx, idempotencyKey, "1", 24*time.Hour)
	}

	// ── Step 2: DB-level idempotency (ON CONFLICT DO NOTHING as second guard) ──
	if s.store != nil {
		_, err := s.store.RecordPaymentCallback(ctx, store.RecordPaymentCallbackParams{
			PaymentID:   payload.PaymentID,
			BookingRef:  payload.BookingRef,
			Amount:      numericFromFloat64(payload.Amount),
			Currency:    "BDT",
			Status:      store.PaymentStatus(payload.Status),
			LastEventID: pgtype.Text{String: payload.EventID, Valid: true},
		})
		if err != nil {
			log.Warn("Failed to record payment callback in DB", zap.Error(err))
			// Do not return — still attempt booking status update
		}
	}

	// ── Step 3: Update booking + seat status via gRPC to Booking Service ──
	switch payload.Status {
	case "SUCCEEDED":
		log.Info("Payment SUCCEEDED — confirming booking via gRPC")
		if err := s.grpcConfirmBooking(ctx, payload.BookingRef, payload.EventID); err != nil {
			log.Error("gRPC ConfirmBooking failed", zap.Error(err))
			// Fallback: direct DB write if Booking service is unreachable
			s.directConfirmBooking(ctx, payload.BookingRef, log)
		}

	case "FAILED":
		log.Info("Payment FAILED — marking booking failed via gRPC")
		if err := s.grpcFailBooking(ctx, payload.BookingRef, payload.EventID); err != nil {
			log.Error("gRPC FailBooking failed", zap.Error(err))
			// Fallback: direct DB write
			s.directFailBooking(ctx, payload.BookingRef, log)
		}

	case "REFUNDED":
		log.Info("Payment REFUNDED — no action needed")

	default:
		log.Warn("Unknown callback status", zap.String("status", payload.Status))
	}
}

// ─── gRPC Calls to Booking Service ───────────────────────────────────────────

func (s *Service) grpcConfirmBooking(ctx context.Context, bookingRef, eventID string) error {
	conn, err := grpc.DialContext(ctx, s.bookingGRPCAddr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithBlock(),
		grpc.WithTimeout(5*time.Second),
	)
	if err != nil {
		return fmt.Errorf("dial booking grpc: %w", err)
	}
	defer conn.Close()

	client := bookingv1.NewBookingServiceClient(conn)
	reply, err := client.ConfirmBooking(ctx, &bookingv1.ConfirmBookingRequest{
		BookingRef: bookingRef,
		EventID:    eventID,
	})
	if err != nil {
		return err
	}
	if !reply.Ok {
		return fmt.Errorf("booking service rejected confirm: %s", reply.Status)
	}
	return nil
}

func (s *Service) grpcFailBooking(ctx context.Context, bookingRef, eventID string) error {
	conn, err := grpc.DialContext(ctx, s.bookingGRPCAddr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithBlock(),
		grpc.WithTimeout(5*time.Second),
	)
	if err != nil {
		return fmt.Errorf("dial booking grpc: %w", err)
	}
	defer conn.Close()

	client := bookingv1.NewBookingServiceClient(conn)
	reply, err := client.FailBooking(ctx, &bookingv1.FailBookingRequest{
		BookingRef: bookingRef,
		EventID:    eventID,
	})
	if err != nil {
		return err
	}
	if !reply.Ok {
		return fmt.Errorf("booking service rejected fail: %s", reply.Status)
	}
	return nil
}

// ─── Direct DB Fallbacks (when gRPC to Booking is unavailable) ───────────────

func (s *Service) directConfirmBooking(ctx context.Context, bookingRef string, log *zap.Logger) {
	if s.store == nil {
		return
	}
	_, err := s.store.UpdateBookingStatus(ctx, store.UpdateBookingStatusParams{
		Status:     store.BookingStatusCONFIRMED,
		BookingRef: bookingRef,
	})
	if err != nil {
		log.Error("direct DB confirm booking failed", zap.Error(err))
		return
	}
	if err := s.store.ConfirmShowtimeSeats(ctx, bookingRef); err != nil {
		log.Error("direct DB confirm seats failed", zap.Error(err))
	}
}

func (s *Service) directFailBooking(ctx context.Context, bookingRef string, log *zap.Logger) {
	if s.store == nil {
		return
	}
	_, err := s.store.UpdateBookingStatus(ctx, store.UpdateBookingStatusParams{
		Status:     store.BookingStatusFAILED,
		BookingRef: bookingRef,
	})
	if err != nil {
		log.Error("direct DB fail booking failed", zap.Error(err))
		return
	}
	if err := s.store.ReleaseShowtimeSeats(ctx, bookingRef); err != nil {
		log.Error("direct DB release seats failed", zap.Error(err))
	}
}

// ─── Refund ──────────────────────────────────────────────────────────────────

// InitiateRefund looks up the payment for a booking ref and calls the gateway /refund.
func (s *Service) InitiateRefund(ctx context.Context, bookingRef string) error {
	if s.store == nil || s.gateway == nil {
		return fmt.Errorf("service not fully initialized")
	}

	payment, err := s.store.GetPaymentByBookingRef(ctx, bookingRef)
	if err != nil {
		return fmt.Errorf("payment not found for booking %s: %w", bookingRef, err)
	}

	err = s.gateway.Refund(ctx, mockgateway.RefundPayload{
		PaymentID:  payment.PaymentID,
		BookingRef: bookingRef,
		Amount:     numericToFloat64(payment.Amount),
	})
	if err != nil {
		s.logger.Error("Refund failed", zap.String("booking_ref", bookingRef), zap.Error(err))
		return err
	}

	s.logger.Info("Refund dispatched", zap.String("booking_ref", bookingRef))
	return nil
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
