package main

import (
	"fmt"
	"net"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/TheSR007/That_Team_IEE/backend/internal/config"
	"github.com/TheSR007/That_Team_IEE/backend/internal/db/catalog_db"
	"github.com/TheSR007/That_Team_IEE/backend/internal/services/catalog"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		fmt.Printf("Failed to load config: %v\n", err)
		os.Exit(1)
	}

	logger := zap.Must(zap.NewDevelopment())
	defer logger.Sync()

	logger.Info("Starting Catalog Microservice...")

	// Run DB migrations
	if err := catalog_db.RunMigrations(cfg.CatalogDBURL); err != nil {
		logger.Warn("Catalog DB Migration notice", zap.Error(err))
	}

	// 1. Start gRPC Server
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		logger.Fatal("Failed to listen on gRPC port 50051", zap.Error(err))
	}
	logger.Info("Catalog gRPC Server listening", zap.String("addr", lis.Addr().String()))
	// TODO: Register gRPC Service Server here

	// 2. Start HTTP Server (for Nginx HTTP proxying)
	r := gin.Default()

	// GET /health
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "UP", "service": "catalog"})
	})

	apiV1 := r.Group("/api/v1")
	svc := catalog.NewService(nil, logger)

	apiV1.GET("/movies", func(c *gin.Context) {
		_ = svc
		c.JSON(http.StatusOK, gin.H{"movies": []string{}})
	})

	apiV1.GET("/showtimes/:showtime_id", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"showtime_id": c.Param("showtime_id")})
	})

	apiV1.GET("/showtimes/:showtime_id/seats", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"seats": []string{}})
	})

	logger.Info("Catalog HTTP Server listening on port 8081")
	if err := r.Run(":8081"); err != nil {
		logger.Fatal("Failed to start HTTP server", zap.Error(err))
	}
}
