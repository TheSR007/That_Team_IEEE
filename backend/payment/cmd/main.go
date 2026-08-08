package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"

	"github.com/TheSR007/That_Team_IEE/backend/booking/db/store"
	"github.com/TheSR007/That_Team_IEE/backend/payment"
	"github.com/TheSR007/That_Team_IEE/backend/pkg/config"
	"github.com/TheSR007/That_Team_IEE/backend/pkg/mockgateway"
	"github.com/TheSR007/That_Team_IEE/backend/payment/healthclient"
	redispkg "github.com/TheSR007/That_Team_IEE/backend/pkg/redis"
)

func main() {
	// ── Config ────────────────────────────────────────────────────────────────
	cfg, err := config.LoadConfig()
	if err != nil {
		fmt.Printf("Failed to load config: %v\n", err)
		os.Exit(1)
	}

	// ── Logger ────────────────────────────────────────────────────────────────
	var logger *zap.Logger
	if cfg.Env == "production" {
		logger = zap.Must(zap.NewProduction())
	} else {
		logger = zap.Must(zap.NewDevelopment())
	}
	defer logger.Sync()

	bookingGRPCAddr := os.Getenv("BOOKING_GRPC_ADDR")
	if bookingGRPCAddr == "" {
		bookingGRPCAddr = "booking:50052"
	}
	callbackBaseURL := os.Getenv("CALLBACK_BASE_URL")

	logger.Info("Starting Payment & OTP Microservice",
		zap.String("port", "8083"),
		zap.String("gateway", cfg.GatewayURL),
		zap.String("booking_grpc", bookingGRPCAddr),
		zap.String("callback_base", callbackBaseURL),
	)

	// ── gRPC Health Server ────────────────────────────────────────────────────
	healthCtx, healthCancel := context.WithCancel(context.Background())
	defer healthCancel()

	healthSrv := healthclient.NewServer(
		healthclient.WithLogger(logger),
	)
	if err := healthSrv.Start(healthCtx); err != nil {
		logger.Warn("Failed to start health client gRPC server", zap.Error(err))
	} else {
		logger.Info("Health gRPC server started", zap.String("addr", healthSrv.Addr()))
		defer healthSrv.Stop()
	}

	// ── PostgreSQL (Booking DB) ───────────────────────────────────────────────
	var dbStore store.Querier
	ctx5s, cancel5s := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel5s()

	poolCfg, err := pgxpool.ParseConfig(cfg.BookingDBURL)
	if err != nil {
		logger.Warn("Could not parse Booking DB URL", zap.Error(err))
	} else {
		poolCfg.MaxConns = 25
		poolCfg.MinConns = 5
		pool, err := pgxpool.NewWithConfig(ctx5s, poolCfg)
		if err != nil {
			logger.Warn("Could not connect to Booking DB — running without DB", zap.Error(err))
		} else {
			dbStore = store.New(pool)
			logger.Info("Connected to Booking PostgreSQL")
			defer pool.Close()
		}
	}

	// ── Redis ─────────────────────────────────────────────────────────────────
	var redisClient *redispkg.Client
	redisClient, err = redispkg.NewClient(cfg.RedisURL)
	if err != nil {
		logger.Warn("Could not connect to Redis — idempotency will fall back to DB only", zap.Error(err))
		healthSrv.SetServingStatus("redis", false)
	} else {
		logger.Info("Connected to Redis")
		healthSrv.SetServingStatus("redis", true)
	}

	healthSrv.SetServingStatus("payment", true)

	// ── Mock Gateway Client ───────────────────────────────────────────────────
	gwClient := mockgateway.NewClient(cfg.GatewayURL)
	logger.Info("Initialized mock gateway client")

	// ── Payment Service & Handler ─────────────────────────────────────────────
	svc := payment.NewService(
		dbStore,
		redisClient,
		gwClient,
		bookingGRPCAddr,
		callbackBaseURL,
		logger,
	)
	hdr := payment.NewHandler(svc)

	// ── Gin HTTP Engine ───────────────────────────────────────────────────────
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Recovery())

	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	apiV1 := r.Group("/api/v1")
	hdr.RegisterRoutes(apiV1)

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"service": "payment", "status": "UP"})
	})

	srv := &http.Server{
		Addr:         ":8083",
		Handler:      r,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		logger.Info("Payment/OTP HTTP server listening", zap.String("addr", ":8083"))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("HTTP server error", zap.Error(err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGTERM, syscall.SIGINT)
	<-quit

	logger.Info("Shutdown signal received — draining connections...")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("Graceful shutdown failed", zap.Error(err))
	} else {
		logger.Info("Payment Service stopped cleanly")
	}
}
