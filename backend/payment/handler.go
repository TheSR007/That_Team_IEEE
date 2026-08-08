package payment

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// Handler wires HTTP routes to the Payment Service.
type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes mounts all Payment + OTP endpoints on the given router group.
// The group should be /api/v1.
func (h *Handler) RegisterRoutes(rg *gin.RouterGroup) {
	rg.POST("/payments/callback", h.HandleCallback)
	rg.POST("/payments/refund/:booking_ref", h.Refund)
	rg.POST("/otp/send", h.SendOTP)
	rg.POST("/otp/verify", h.VerifyOTP)
}

// ─── POST /api/v1/payments/callback ─────────────────────────────────────────
//
// STRICT RULE: Must always return 200 OK, even for malformed or duplicate payloads.
// Processing is done asynchronously in a goroutine after the 200 is sent.

func (h *Handler) HandleCallback(c *gin.Context) {
	var payload WebhookCallbackPayload

	// Always return 200 immediately — even if body is malformed
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.service.logger.Warn("Callback received with invalid body",
			zap.String("error", err.Error()),
		)
		c.JSON(http.StatusOK, gin.H{"received": true, "notice": "invalid payload — ignored"})
		return
	}

	// Write 200 to the gateway immediately
	c.JSON(http.StatusOK, gin.H{"received": true})

	// Process asynchronously — do not block the gateway's HTTP client
	go h.service.HandleCallback(c.Request.Context(), payload)
}

// ─── POST /api/v1/payments/refund/:booking_ref ───────────────────────────────

func (h *Handler) Refund(c *gin.Context) {
	bookingRef := c.Param("booking_ref")
	if bookingRef == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "MISSING_BOOKING_REF",
			"message": "booking_ref path parameter is required",
		})
		return
	}

	if err := h.service.InitiateRefund(c.Request.Context(), bookingRef); err != nil {
		h.service.logger.Error("Refund failed", zap.String("booking_ref", bookingRef), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "REFUND_FAILED",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{
		"booking_ref": bookingRef,
		"status":      "REFUND_INITIATED",
	})
}

// ─── POST /api/v1/otp/send ───────────────────────────────────────────────────
//
// Proxies to gateway /otp/send. Retries up to 3x.
// Returns 202 on success, 503 if all retries fail.

func (h *Handler) SendOTP(c *gin.Context) {
	var req SendOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "INVALID_INPUT",
			"message": err.Error(),
		})
		return
	}

	if err := h.service.SendOTP(c.Request.Context(), req); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error":   "OTP_DISPATCH_FAILED",
			"message": "OTP could not be delivered. Please try again.",
		})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"message": "OTP dispatched."})
}

// ─── POST /api/v1/otp/verify ─────────────────────────────────────────────────
//
// Proxies to gateway /otp/verify.
// On success: triggers async /charge to gateway, returns 200 with verified=true.
// On wrong code: returns 400 with verified=false.

func (h *Handler) VerifyOTP(c *gin.Context) {
	var req VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "INVALID_INPUT",
			"message": err.Error(),
		})
		return
	}

	result, err := h.service.VerifyOTPAndCharge(c.Request.Context(), req)
	if err != nil {
		// Gateway unreachable / unexpected error
		c.JSON(http.StatusBadGateway, gin.H{
			"verified": false,
			"message":  "OTP verification failed. Gateway error.",
		})
		return
	}

	if !result.Verified {
		c.JSON(http.StatusBadRequest, gin.H{
			"verified": false,
			"message":  "Invalid or expired OTP code.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"verified": true,
		"message":  "OTP verified. Payment processing initiated.",
	})
}
