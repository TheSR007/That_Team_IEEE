package health

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

func (h *Handler) RegisterRoutes(engine *gin.Engine) {
	engine.GET("/health", h.HealthCheck)
}

func (h *Handler) HealthCheck(c *gin.Context) {
	resp, err := h.service.CheckHealth(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "DOWN", "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}
