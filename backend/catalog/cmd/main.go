package main

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"

	"github.com/TheSR007/That_Team_IEE/backend/catalog"
	"github.com/TheSR007/That_Team_IEE/backend/catalog/db"
	"github.com/TheSR007/That_Team_IEE/backend/catalog/db/store"
	"github.com/TheSR007/That_Team_IEE/backend/pkg/config"
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

	// 1. Run DB migrations
	if err := catalog_db.RunMigrations(cfg.CatalogDBURL); err != nil {
		logger.Warn("Catalog DB Migration notice", zap.Error(err))
	} else {
		logger.Info("Catalog DB migrations executed successfully")
	}

	// 2. Initialize PostgreSQL connection pool
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	poolCfg, err := pgxpool.ParseConfig(cfg.CatalogDBURL)
	if err != nil {
		logger.Warn("Failed to parse catalog DB pool config, running without DB pool", zap.Error(err))
	}

	var dbStore store.Querier
	if poolCfg != nil {
		poolCfg.MaxConns = 25
		poolCfg.MinConns = 5
		pool, err := pgxpool.NewWithConfig(ctx, poolCfg)
		if err != nil {
			logger.Warn("Failed to connect to Catalog DB, fallback to mock store", zap.Error(err))
		} else {
			dbStore = store.New(pool)
			logger.Info("Connected to Catalog PostgreSQL DB Pool")
		}
	}

	// 3. Start gRPC Server (port 50051)
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		logger.Warn("Failed to listen on gRPC port 50051", zap.Error(err))
	} else {
		logger.Info("Catalog gRPC Server listening", zap.String("addr", lis.Addr().String()))
		// TODO: Register gRPC Protobuf Server
	}

	// 4. Start HTTP Engine (port 8081)
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "UP", "service": "catalog"})
	})

	apiV1 := r.Group("/api/v1")
	svc := catalog.NewService(dbStore, logger)
	hdr := catalog.NewHandler(svc)
	hdr.RegisterRoutes(apiV1)

	logger.Info("Catalog HTTP Server listening on port 8081")
	if err := r.Run(":8081"); err != nil {
		logger.Fatal("Failed to start HTTP server", zap.Error(err))
	}
}
