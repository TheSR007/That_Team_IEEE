package main

import (
	"net"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/TheSR007/That_Team_IEE/backend/internal/services/payment"
)

func main() {
	logger := zap.Must(zap.NewDevelopment())
	defer logger.Sync()

	logger.Info("Starting Payment/OTP Microservice...")

	// 1. Start gRPC Server
	lis, err := net.Listen("tcp", ":50053")
	if err != nil {
		logger.Fatal("Failed to listen on gRPC port 50053", zap.Error(err))
	}
	logger.Info("Payment/OTP gRPC Server listening", zap.String("addr", lis.Addr().String()))
	// TODO: Register gRPC Service Server here

	// 2. Start HTTP Server (for Nginx HTTP proxying & Gateway callbacks)
	r := gin.Default()

	apiV1 := r.Group("/api/v1")
	svc := payment.NewService(nil, logger)

	// Payment endpoints
	apiV1.POST("/payments/callback", func(c *gin.Context) {
		_ = svc
		c.JSON(http.StatusOK, gin.H{"received": true})
	})

	// OTP endpoints (Merged into Payment service)
	apiV1.POST("/otp/send", func(c *gin.Context) {
		c.JSON(http.StatusAccepted, gin.H{"message": "OTP request dispatched."})
	})

	apiV1.POST("/otp/verify", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"verified": true})
	})

	logger.Info("Payment/OTP HTTP Server listening on port 8083")
	if err := r.Run(":8083"); err != nil {
		logger.Fatal("Failed to start HTTP server", zap.Error(err))
	}
}
