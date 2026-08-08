package booking

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
	rg.POST("/holds", h.HoldSeat)
	rg.POST("/bookings", h.CreateBooking)
	rg.GET("/bookings/:booking_ref", h.GetBooking)
}

func (h *Handler) HoldSeat(c *gin.Context) {
	// TODO: POST /api/v1/holds
	c.JSON(201, gin.H{
		"hold_id":     "hld_placeholder",
		"status":      "HELD",
		"expires_at":  "2026-08-08T09:05:00Z",
	})
}

func (h *Handler) CreateBooking(c *gin.Context) {
	// TODO: POST /api/v1/bookings (Non-blocking /charge trigger)
	c.JSON(202, gin.H{
		"booking_ref": "bk_placeholder",
		"status":      "PENDING",
	})
}

func (h *Handler) GetBooking(c *gin.Context) {
	// TODO: GET /api/v1/bookings/:booking_ref
	c.JSON(200, gin.H{
		"booking_ref": c.Param("booking_ref"),
		"status":      "CONFIRMED",
	})
}
