package otp

import (
	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(rg *gin.RouterGroup) {
	rg.POST("/otp/send", h.SendOTP)
	rg.POST("/otp/verify", h.VerifyOTP)
}

func (h *Handler) SendOTP(c *gin.Context) {
	// TODO: POST /api/v1/otp/send
	c.JSON(202, gin.H{
		"message": "OTP request dispatched.",
	})
}

func (h *Handler) VerifyOTP(c *gin.Context) {
	// TODO: POST /api/v1/otp/verify
	c.JSON(200, gin.H{
		"verified": true,
	})
}
