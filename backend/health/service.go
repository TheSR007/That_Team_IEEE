package health

import (
	"context"

	"go.uber.org/zap"
)

type HealthResponse struct {
	Status string `json:"status"`
}

type Service struct {
	logger *zap.Logger
}

func NewService(logger *zap.Logger) *Service {
	return &Service{
		logger: logger,
	}
}

func (s *Service) CheckHealth(ctx context.Context) (*HealthResponse, error) {
	// Non-blocking quick response (< 1s rule)
	return &HealthResponse{
		Status: "UP",
	}, nil
}
