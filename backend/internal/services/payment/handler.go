package payment

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(rg *gin.RouterGroup) {
	rg.POST("/payments/callback", h.HandleCallback)
	rg.POST("/otp/send", h.SendOTP)
	rg.POST("/otp/verify", h.VerifyOTP)
}

func (h *Handler) HandleCallback(c *gin.Context) {
	var payload WebhookCallbackPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusOK, gin.H{"received": true, "notice": "invalid payload format"})
		return
	}

	if err := h.service.HandleCallback(c.Request.Context(), payload); err != nil {
		c.JSON(http.StatusOK, gin.H{"received": true, "error": err.Error()})
		return
	}

	// Strictly return 200 OK for all webhook requests as per Requirement #2
	c.JSON(http.StatusOK, gin.H{"received": true})
}

func (h *Handler) SendOTP(c *gin.Context) {
	var req SendOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_INPUT", "message": err.Error()})
		return
	}

	if err := h.service.SendOTP(c.Request.Context(), req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "OTP_DISPATCH_FAILED", "message": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"message": "OTP request dispatched."})
}

func (h *Handler) VerifyOTP(c *gin.Context) {
	var req VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_INPUT", "message": err.Error()})
		return
	}

	verified, err := h.service.VerifyOTP(c.Request.Context(), req)
	if err != nil || !verified {
		c.JSON(http.StatusBadRequest, gin.H{"verified": false, "message": "Invalid verification code."})
		return
	}

	c.JSON(http.StatusOK, gin.H{"verified": true})
}
