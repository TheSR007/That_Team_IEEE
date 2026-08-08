package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"runtime"
	"syscall"

	"github.com/HasanMdArik/code-ref/services/rest-service/controller"
	"github.com/HasanMdArik/code-ref/services/rest-service/healthchecker"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

func main() {
	//* Fetch env variables
	// Try .env first if failed then go for .env.example
	err := godotenv.Load()
	if err != nil {
		godotenv.Load(".env.example")
	}

	//? Get Environment Mode
	Environment := os.Getenv("ENV")

	//* Initiate logger
	var logger *zap.Logger
	if Environment == "DEVELOPMENT" {
		logger = zap.Must(zap.NewDevelopment())
	} else {
		logger = zap.Must(zap.NewProduction())
	}
	defer logger.Sync()

	logger.Info("Server intialization started")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	healthStatus := healthchecker.InitHealthChecker(ctx, logger)

	//* Set gin mode
	if os.Getenv("ENV") == "PRODUCTION" {
		gin.SetMode(gin.ReleaseMode)
	}

	//* Initialize the App and Controller and bind them
	logger.Info("Starting the gin server...")
	app := gin.New()
	ctrl := controller.InitController(logger, healthStatus)

	ctrl.SetRoutes(app)
	ctrl.SetCORS(app)

	//* Run the HTTP/2 Server
	app_ErrChan := make(chan error)
	go func() {
		port := os.Getenv("PORT")
		if port == "" {
			port = "8080" // TODO change if needed
		}

		app_ErrChan <- app.Run(fmt.Sprintf(":%v", port))
		// app_ErrChan <- app.RunTLS(fmt.Sprintf(":%v", port), "./cert/ssl.crt", "./cert/ssl.key") // TODO add TLS support if needed

	}()
	logger.Info("Started the goroutine to start the gin server...")

	//* The listener for system interrupt or termination
	sysInterruptChan := make(chan os.Signal, 1)

	//? In case of confusion,
	//? syscall.SIGINT refers to interrupt(ctrl+C)
	//? syscall.SIGTERM refers to termination(systemctl stop)
	signal.Notify(sysInterruptChan, syscall.SIGINT, syscall.SIGTERM)

	logger.Info("Auth API Server Intialization finished. Service fully online...", zap.Int("goroutines", runtime.NumGoroutine()))
	//* The main-thread blocking select to listen for errors
	select {
	case app_error := <-app_ErrChan:
		// TODO add custom logic if necessary
		logger.Error("Closing server due to HTTP server's error.", zap.String("error", app_error.Error()))

	case sysInterrupt := <-sysInterruptChan:
		// TODO add custom logic if necessary
		logger.Info("Closing server due to system interruption.", zap.String("signal", sysInterrupt.String()))
	}

}
