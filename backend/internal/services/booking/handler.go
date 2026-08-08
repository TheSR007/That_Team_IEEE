package booking

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
	rg.POST("/holds", h.HoldSeat)
	rg.POST("/bookings", h.CreateBooking)
	rg.GET("/bookings/:booking_ref", h.GetBooking)
}

func (h *Handler) HoldSeat(c *gin.Context) {
	var req HoldSeatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_INPUT", "message": err.Error()})
		return
	}

	resp, err := h.service.HoldSeat(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "SEAT_UNAVAILABLE", "message": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, resp)
}

func (h *Handler) CreateBooking(c *gin.Context) {
	var req CreateBookingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_INPUT", "message": err.Error()})
		return
	}

	resp, err := h.service.CreateBooking(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "BOOKING_FAILED", "message": err.Error()})
		return
	}
	c.JSON(http.StatusAccepted, resp)
}

func (h *Handler) GetBooking(c *gin.Context) {
	bookingRef := c.Param("booking_ref")
	resp, err := h.service.GetBooking(c.Request.Context(), bookingRef)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "BOOKING_NOT_FOUND", "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}
