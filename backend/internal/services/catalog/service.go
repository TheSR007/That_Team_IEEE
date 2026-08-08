package catalog

import (
	"context"

	"github.com/TheSR007/That_Team_IEE/backend/internal/db/catalog_db/store"
	"go.uber.org/zap"
)

type MovieDTO struct {
	ID              string `json:"id"`
	Title           string `json:"title"`
	DurationMinutes int32  `json:"duration_minutes"`
	Rating          string `json:"rating,omitempty"`
}

type ShowtimeDTO struct {
	ShowtimeID  string  `json:"showtime_id"`
	MovieID     string  `json:"movie_id"`
	TheatreName string  `json:"theatre_name"`
	StartTime   string  `json:"start_time"`
	BasePrice   float64 `json:"base_price"`
}

type SeatMapItemDTO struct {
	SeatNumber string  `json:"seat_number"`
	Status     string  `json:"status"`
	Price      float64 `json:"price"`
}

type SeatMapDTO struct {
	ShowtimeID string           `json:"showtime_id"`
	Seats      []SeatMapItemDTO `json:"seats"`
}

type Service struct {
	store  store.Querier
	logger *zap.Logger
}

func NewService(store store.Querier, logger *zap.Logger) *Service {
	return &Service{
		store:  store,
		logger: logger,
	}
}

func (s *Service) ListMovies(ctx context.Context) ([]MovieDTO, error) {
	// TODO: Fetch movies via store.ListMovies(ctx)
	return []MovieDTO{}, nil
}

func (s *Service) GetShowtime(ctx context.Context, showtimeID string) (*ShowtimeDTO, error) {
	// TODO: Fetch showtime details via store.GetShowtime(ctx, id)
	return &ShowtimeDTO{
		ShowtimeID:  showtimeID,
		MovieID:     "mov_101",
		TheatreName: "Hall A",
		StartTime:   "2026-08-08T20:00:00Z",
		BasePrice:   450,
	}, nil
}

func (s *Service) GetSeatMap(ctx context.Context, showtimeID string) (*SeatMapDTO, error) {
	// TODO: Fetch live seat matrix from Redis cache or Booking DB
	return &SeatMapDTO{
		ShowtimeID: showtimeID,
		Seats:      []SeatMapItemDTO{},
	}, nil
}
