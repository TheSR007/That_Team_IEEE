package main

import (
	"net"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/TheSR007/That_Team_IEE/backend/health"
)

func main() {
	logger := zap.Must(zap.NewDevelopment())
	defer logger.Sync()

	logger.Info("Starting Dedicated Health Microservice...")

	// 1. Start gRPC Server on port 50055
	lis, err := net.Listen("tcp", ":50055")
	if err != nil {
		logger.Fatal("Failed to listen on gRPC port 50055", zap.Error(err))
	}
	logger.Info("Health gRPC Server listening", zap.String("addr", lis.Addr().String()))

	// 2. Start HTTP Server on port 8085
	r := gin.Default()

	svc := health.NewService(logger)
	hdr := health.NewHandler(svc)
	hdr.RegisterRoutes(r)

	logger.Info("Health HTTP Server listening on port 8085")
	if err := http.ListenAndServe(":8085", r); err != nil {
		logger.Fatal("Failed to start HTTP server", zap.Error(err))
	}
}
