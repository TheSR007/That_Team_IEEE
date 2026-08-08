package payment

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
	rg.POST("/payments/callback", h.HandleCallback)
}

func (h *Handler) HandleCallback(c *gin.Context) {
	// TODO: POST /api/v1/payments/callback (Webhook, strictly returns 200 OK)
	c.JSON(200, gin.H{
		"received": true,
	})
}
