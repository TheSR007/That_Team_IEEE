package catalog

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
	rg.GET("/movies", h.ListMovies)
	rg.GET("/movies/:movie_id/showtimes", h.ListShowtimesByMovie)
	rg.GET("/showtimes/:showtime_id", h.GetShowtime)
	rg.GET("/showtimes/:showtime_id/seats", h.GetSeatMap)
}

func (h *Handler) ListMovies(c *gin.Context) {
	movies, err := h.service.ListMovies(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list movies"})
		return
	}
	c.JSON(http.StatusOK, movies)
}

func (h *Handler) ListShowtimesByMovie(c *gin.Context) {
	movieID := c.Param("movie_id")
	showtimes, err := h.service.ListShowtimesByMovie(c.Request.Context(), movieID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list showtimes"})
		return
	}
	c.JSON(http.StatusOK, showtimes)
}

func (h *Handler) GetShowtime(c *gin.Context) {
	showtimeID := c.Param("showtime_id")
	st, err := h.service.GetShowtime(c.Request.Context(), showtimeID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Showtime not found"})
		return
	}
	c.JSON(http.StatusOK, st)
}

func (h *Handler) GetSeatMap(c *gin.Context) {
	showtimeID := c.Param("showtime_id")
	seatMap, err := h.service.GetSeatMap(c.Request.Context(), showtimeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch seat map"})
		return
	}
	c.JSON(http.StatusOK, seatMap)
}
