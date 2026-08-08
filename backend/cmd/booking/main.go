package main

import (
	"fmt"
	"net"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/TheSR007/That_Team_IEE/backend/internal/config"
	"github.com/TheSR007/That_Team_IEE/backend/internal/db/booking_db"
	"github.com/TheSR007/That_Team_IEE/backend/internal/services/booking"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		fmt.Printf("Failed to load config: %v\n", err)
		os.Exit(1)
	}

	logger := zap.Must(zap.NewDevelopment())
	defer logger.Sync()

	logger.Info("Starting Booking Microservice...")

	// Run DB migrations
	if err := booking_db.RunMigrations(cfg.BookingDBURL); err != nil {
		logger.Warn("Booking DB Migration notice", zap.Error(err))
	}

	// 1. Start gRPC Server
	lis, err := net.Listen("tcp", ":50052")
	if err != nil {
		logger.Fatal("Failed to listen on gRPC port 50052", zap.Error(err))
	}
	logger.Info("Booking gRPC Server listening", zap.String("addr", lis.Addr().String()))
	// TODO: Register gRPC Service Server here

	// 2. Start HTTP Server (for Nginx HTTP proxying)
	r := gin.Default()

	apiV1 := r.Group("/api/v1")
	svc := booking.NewService(nil, cfg.HoldTTLSeconds, logger)

	apiV1.POST("/holds", func(c *gin.Context) {
		_ = svc
		c.JSON(http.StatusCreated, gin.H{"status": "HELD"})
	})

	apiV1.POST("/bookings", func(c *gin.Context) {
		c.JSON(http.StatusAccepted, gin.H{"status": "PENDING"})
	})

	apiV1.GET("/bookings/:booking_ref", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"booking_ref": c.Param("booking_ref"), "status": "CONFIRMED"})
	})

	logger.Info("Booking HTTP Server listening on port 8082")
	if err := r.Run(":8082"); err != nil {
		logger.Fatal("Failed to start HTTP server", zap.Error(err))
	}
}
