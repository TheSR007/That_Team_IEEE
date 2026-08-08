package catalog

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"go.uber.org/zap"

	"github.com/TheSR007/That_Team_IEE/backend/catalog/db/store"
)

type MovieDTO struct {
	MovieID         string  `json:"movie_id"`
	Title           string  `json:"title"`
	Description     string  `json:"description"`
	DurationMinutes int32   `json:"duration_minutes"`
	PosterURL       string  `json:"poster_url"`
	Rating          float64 `json:"rating"`
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
	if s.store == nil {
		return []MovieDTO{}, nil
	}

	movies, err := s.store.ListMovies(ctx)
	if err != nil {
		s.logger.Error("Failed to query movies list", zap.Error(err))
		return nil, err
	}

	dtos := make([]MovieDTO, 0, len(movies))
	for _, m := range movies {
		dtos = append(dtos, MovieDTO{
			MovieID:         uuidToString(m.MovieID),
			Title:           m.Title,
			Description:     m.Description.String,
			DurationMinutes: m.DurationMinutes,
			PosterURL:       m.PosterUrl.String,
			Rating:          numericToFloat64(m.Rating),
		})
	}

	return dtos, nil
}

func (s *Service) ListShowtimesByMovie(ctx context.Context, movieIDStr string) ([]ShowtimeDTO, error) {
	if s.store == nil {
		return []ShowtimeDTO{}, nil
	}

	movieUUID, err := stringToUUID(movieIDStr)
	if err != nil {
		return nil, fmt.Errorf("invalid movie_id UUID: %w", err)
	}

	showtimes, err := s.store.ListShowtimesByMovieID(ctx, movieUUID)
	if err != nil {
		s.logger.Error("Failed to fetch showtimes for movie", zap.String("movie_id", movieIDStr), zap.Error(err))
		return nil, err
	}

	dtos := make([]ShowtimeDTO, 0, len(showtimes))
	for _, st := range showtimes {
		dtos = append(dtos, ShowtimeDTO{
			ShowtimeID:  uuidToString(st.ShowtimeID),
			MovieID:     uuidToString(st.MovieID),
			HallID:      uuidToString(st.HallID),
			TheatreName: st.TheatreName,
			StartTime:   timestamptzToString(st.StartTime),
			Price:       numericToFloat64(st.Price),
		})
	}

	return dtos, nil
}

func (s *Service) GetShowtime(ctx context.Context, showtimeIDStr string) (*ShowtimeDTO, error) {
	if s.store == nil {
		return &ShowtimeDTO{
			ShowtimeID:  showtimeIDStr,
			MovieID:     "mov_101",
			HallID:      "hall_101",
			TheatreName: "Hall A",
			StartTime:   time.Now().Format(time.RFC3339),
			Price:       450,
		}, nil
	}

	showtimeUUID, err := stringToUUID(showtimeIDStr)
	if err != nil {
		return nil, fmt.Errorf("invalid showtime_id UUID: %w", err)
	}

	st, err := s.store.GetShowtime(ctx, showtimeUUID)
	if err != nil {
		s.logger.Error("Failed to fetch showtime", zap.String("showtime_id", showtimeIDStr), zap.Error(err))
		return nil, err
	}

	return &ShowtimeDTO{
		ShowtimeID:  uuidToString(st.ShowtimeID),
		MovieID:     uuidToString(st.MovieID),
		HallID:      uuidToString(st.HallID),
		TheatreName: st.TheatreName,
		StartTime:   timestamptzToString(st.StartTime),
		Price:       numericToFloat64(st.Price),
	}, nil
}

func (s *Service) GetSeatMap(ctx context.Context, showtimeIDStr string) (*SeatMapDTO, error) {
	// Seatmap fetching will query showtime details and combine seat definitions from catalog_db
	return &SeatMapDTO{
		ShowtimeID: showtimeIDStr,
		Seats:      []SeatMapItemDTO{},
	}, nil
}

// Helpers for pgtype conversions
func uuidToString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	src := u.Bytes
	return fmt.Sprintf("%x-%x-%x-%x-%x", src[0:4], src[4:6], src[6:8], src[8:10], src[10:16])
}

func stringToUUID(s string) (pgtype.UUID, error) {
	var u pgtype.UUID
	err := u.Scan(s)
	return u, err
}

func numericToFloat64(n pgtype.Numeric) float64 {
	if !n.Valid || n.Int == nil {
		return 0.0
	}
	f, err := n.Float64Value()
	if err != nil || !f.Valid {
		return 0.0
	}
	return f.Float64
}

func timestamptzToString(t pgtype.Timestamptz) string {
	if !t.Valid {
		return ""
	}
	return t.Time.Format(time.RFC3339)
}
