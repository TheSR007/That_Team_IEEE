package catalog

import (
	"context"

	"github.com/TheSR007/That_Team_IEE/backend/internal/db/catalog_db/store"
	"go.uber.org/zap"
)

type MovieDTO struct {
	MovieID         string `json:"movie_id"`
	Title           string `json:"title"`
	Description     string `json:"description"`
	DurationMinutes int32  `json:"duration_minutes"`
	PosterURL       string `json:"poster_url"`
	Rating          string `json:"rating"`
}

type ShowtimeDTO struct {
	ShowtimeID  string  `json:"showtime_id"`
	MovieID     string  `json:"movie_id"`
	HallID      string  `json:"hall_id"`
	TheatreName string  `json:"theatre_name"`
	StartTime   string  `json:"start_time"`
	Price       float64 `json:"price"`
}

type SeatMapItemDTO struct {
	ShowtimeSeatID string  `json:"showtime_seat_id"`
	SeatID         string  `json:"seat_id"`
	RowLetter      string  `json:"row_letter"`
	SeatNumber     int32   `json:"seat_number"`
	SeatType       string  `json:"seat_type"`
	Status         string  `json:"status"`
	Price          float64 `json:"price"`
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
	// TODO: Query movies from catalog_db
	return []MovieDTO{}, nil
}

func (s *Service) GetShowtime(ctx context.Context, showtimeID string) (*ShowtimeDTO, error) {
	// TODO: Query showtime details joined with hall/theatre
	return &ShowtimeDTO{
		ShowtimeID:  showtimeID,
		MovieID:     "mov_101",
		HallID:      "hall_1",
		TheatreName: "Hall A",
		StartTime:   "2026-08-08T20:00:00Z",
		Price:       450,
	}, nil
}

func (s *Service) GetSeatMap(ctx context.Context, showtimeID string) (*SeatMapDTO, error) {
	// TODO: Fetch live seat matrix joined with seat details
	return &SeatMapDTO{
		ShowtimeID: showtimeID,
		Seats:      []SeatMapItemDTO{},
	}, nil
}
