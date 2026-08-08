package catalog

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
	rg.GET("/movies", h.ListMovies)
	rg.GET("/showtimes/:showtime_id", h.GetShowtime)
	rg.GET("/showtimes/:showtime_id/seats", h.GetSeatMap)
}

func (h *Handler) ListMovies(c *gin.Context) {
	// TODO: implement movie listing
	c.JSON(200, gin.H{"movies": []string{}})
}

func (h *Handler) GetShowtime(c *gin.Context) {
	// TODO: implement get showtime metadata
	c.JSON(200, gin.H{"showtime_id": c.Param("showtime_id")})
}

func (h *Handler) GetSeatMap(c *gin.Context) {
	// TODO: implement live seat map fetching
	c.JSON(200, gin.H{"showtime_id": c.Param("showtime_id"), "seats": []string{}})
}
