package main

import (
	"fmt"
	"os"
	"os/signal"
	"runtime"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/TheSR007/That_Team_IEE/backend/internal/config"
	"github.com/TheSR007/That_Team_IEE/backend/internal/db"
	"github.com/TheSR007/That_Team_IEE/backend/internal/domain/booking"
	"github.com/TheSR007/That_Team_IEE/backend/internal/domain/catalog"
	"github.com/TheSR007/That_Team_IEE/backend/internal/domain/health"
	"github.com/TheSR007/That_Team_IEE/backend/internal/domain/otp"
	"github.com/TheSR007/That_Team_IEE/backend/internal/domain/payment"
)

func main() {
	cfg, err := config.LoadConfig()
	if err != nil {
		fmt.Printf("Failed to load config: %v\n", err)
		os.Exit(1)
	}

	var logger *zap.Logger
	if cfg.Env == "DEVELOPMENT" {
		logger = zap.Must(zap.NewDevelopment())
	} else {
		logger = zap.Must(zap.NewProduction())
	}
	defer logger.Sync()

	logger.Info("Starting application initialization...", zap.String("env", cfg.Env))

	// Run embedded database migrations
	logger.Info("Executing database migrations...")
	if err := db.RunMigrations(cfg.DatabaseURL); err != nil {
		logger.Warn("Migration execution notice", zap.Error(err))
	} else {
		logger.Info("Database migrations applied successfully")
	}

	if cfg.Env == "PRODUCTION" {
		gin.SetMode(gin.ReleaseMode)
	}

	app := gin.New()
	app.Use(gin.Recovery())

	// CORS setup
	app.Use(cors.New(cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Mock-Mode", "X-Mock-Force"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// System & Health Domain: GET /health
	healthHandler := health.NewHandler()
	healthHandler.RegisterRoutes(&app.RouterGroup)

	// Base API Version Group: /api/v1
	apiV1 := app.Group("/api/v1")

	// Catalog & Seat Map Domain: /api/v1/movies, /api/v1/showtimes/:id, /api/v1/showtimes/:id/seats
	catalogSvc := catalog.NewService(nil, logger)
	catalogHdr := catalog.NewHandler(catalogSvc)
	catalogHdr.RegisterRoutes(apiV1)

	// Seat Reservation & Booking Domain: /api/v1/holds, /api/v1/bookings, /api/v1/bookings/:booking_ref
	bookingSvc := booking.NewService(nil, cfg.HoldTTLSeconds, logger)
	bookingHdr := booking.NewHandler(bookingSvc)
	bookingHdr.RegisterRoutes(apiV1)

	// Payment Domain: /api/v1/payments/callback
	paymentSvc := payment.NewService(nil, logger)
	paymentHdr := payment.NewHandler(paymentSvc)
	paymentHdr.RegisterRoutes(apiV1)

	// OTP Gateway Proxy Domain: /api/v1/otp/send, /api/v1/otp/verify
	otpSvc := otp.NewService(nil, logger)
	otpHdr := otp.NewHandler(otpSvc)
	otpHdr.RegisterRoutes(apiV1)

	errChan := make(chan error, 1)
	go func() {
		port := cfg.Port
		logger.Info("Starting HTTP server", zap.String("port", port))
		errChan <- app.Run(":" + port)
	}()

	sysInterruptChan := make(chan os.Signal, 1)
	signal.Notify(sysInterruptChan, syscall.SIGINT, syscall.SIGTERM)

	logger.Info("Server fully online", zap.Int("goroutines", runtime.NumGoroutine()))

	select {
	case err := <-errChan:
		logger.Error("HTTP server error", zap.Error(err))
	case sig := <-sysInterruptChan:
		logger.Info("Received shutdown signal", zap.String("signal", sig.String()))
	}
}
