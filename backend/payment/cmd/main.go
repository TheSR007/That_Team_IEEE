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

	"github.com/TheSR007/That_Team_IEE/backend/booking/db/store"
	"github.com/TheSR007/That_Team_IEE/backend/payment"
	"github.com/TheSR007/That_Team_IEE/backend/pkg/config"
	"github.com/TheSR007/That_Team_IEE/backend/pkg/mockgateway"
	"github.com/TheSR007/That_Team_IEE/backend/pkg/redis"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		fmt.Printf("Failed to load config: %v\n", err)
		os.Exit(1)
	}

	logger := zap.Must(zap.NewDevelopment())
	defer logger.Sync()

	logger.Info("Starting Payment & OTP Microservice...")

	// 1. Initialize PostgreSQL connection pool (Booking DB)
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
			logger.Info("Connected to Booking PostgreSQL DB Pool for Payment processing")
		}
	}

	// 2. Initialize Redis Client
	redisClient, err := redis.NewClient(cfg.RedisURL)
	if err != nil {
		logger.Warn("Failed to connect to Redis, proceeding with DB fallback", zap.Error(err))
	} else {
		logger.Info("Connected to Redis Lock Store")
	}

	// 3. Initialize Mock Gateway Client
	gwClient := mockgateway.NewClient(cfg.GatewayURL)
	logger.Info("Initialized Mock Gateway Client", zap.String("url", cfg.GatewayURL))

	// 4. Start gRPC Server (port 50053)
	lis, err := net.Listen("tcp", ":50053")
	if err != nil {
		logger.Warn("Failed to listen on gRPC port 50053", zap.Error(err))
	} else {
		logger.Info("Payment gRPC Server listening", zap.String("addr", lis.Addr().String()))
		// TODO: Register gRPC Protobuf Server
	}

	// 5. Start HTTP Engine (port 8083)
	r := gin.Default()

	apiV1 := r.Group("/api/v1")
	svc := payment.NewService(dbStore, redisClient, gwClient, logger)
	hdr := payment.NewHandler(svc)
	hdr.RegisterRoutes(apiV1)

	logger.Info("Payment/OTP HTTP Server listening on port 8083")
	if err := r.Run(":8083"); err != nil {
		logger.Fatal("Failed to start HTTP server", zap.Error(err))
	}
}
