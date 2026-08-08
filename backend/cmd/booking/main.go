package main

import (
	"context"
	"fmt"
	"net"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"

	"github.com/TheSR007/That_Team_IEE/backend/internal/config"
	"github.com/TheSR007/That_Team_IEE/backend/internal/db/booking_db"
	"github.com/TheSR007/That_Team_IEE/backend/internal/db/booking_db/store"
	"github.com/TheSR007/That_Team_IEE/backend/internal/pkg/redis"
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

	// 1. Run DB migrations
	if err := booking_db.RunMigrations(cfg.BookingDBURL); err != nil {
		logger.Warn("Booking DB Migration notice", zap.Error(err))
	} else {
		logger.Info("Booking DB migrations executed successfully")
	}

	// 2. Initialize PostgreSQL connection pool
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	poolCfg, err := pgxpool.ParseConfig(cfg.BookingDBURL)
	if err != nil {
		logger.Warn("Failed to parse booking DB pool config", zap.Error(err))
	}

	var dbStore store.Querier
	if poolCfg != nil {
		poolCfg.MaxConns = 25
		poolCfg.MinConns = 5
		pool, err := pgxpool.NewWithConfig(ctx, poolCfg)
		if err != nil {
			logger.Warn("Failed to connect to Booking DB, fallback to mock store", zap.Error(err))
		} else {
			dbStore = store.New(pool)
			logger.Info("Connected to Booking PostgreSQL DB Pool")
		}
	}

	// 3. Initialize Redis Client
	redisClient, err := redis.NewClient(cfg.RedisURL)
	if err != nil {
		logger.Warn("Failed to connect to Redis, proceeding with DB fallback", zap.Error(err))
	} else {
		logger.Info("Connected to Redis Lock Store")
	}

	// 4. Start gRPC Server (port 50052)
	lis, err := net.Listen("tcp", ":50052")
	if err != nil {
		logger.Warn("Failed to listen on gRPC port 50052", zap.Error(err))
	} else {
		logger.Info("Booking gRPC Server listening", zap.String("addr", lis.Addr().String()))
		// TODO: Register gRPC Protobuf Server
	}

	// 5. Start HTTP Engine (port 8082)
	r := gin.Default()

	apiV1 := r.Group("/api/v1")
	svc := booking.NewService(dbStore, redisClient, cfg.HoldTTLSeconds, logger)
	hdr := booking.NewHandler(svc)
	hdr.RegisterRoutes(apiV1)

	logger.Info("Booking HTTP Server listening on port 8082")
	if err := r.Run(":8082"); err != nil {
		logger.Fatal("Failed to start HTTP server", zap.Error(err))
	}
}
