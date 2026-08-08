package controller

import (
	"go.uber.org/zap"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

type Controller struct {
	logger       *zap.Logger
	healthStatus map[string]healthpb.HealthCheckResponse_ServingStatus
}

func InitController(logger *zap.Logger, healthStatus map[string]healthpb.HealthCheckResponse_ServingStatus) (ctrl *Controller) {
	ctrl = &Controller{
		logger:       logger,
		healthStatus: healthStatus,
	}

	return
}
