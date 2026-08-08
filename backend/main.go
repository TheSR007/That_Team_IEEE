package main

import (
	"fmt"
	"os"
	"os/signal"
	"runtime"
	"syscall"

	"github.com/TheSR007/That_Team_IEE/backend/controller"
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

	//TODO intialize necessary stuff(e.g. databases, gRPC listeners, prometheus clients, etc.)

	//* Set gin mode
	if os.Getenv("ENV") == "PRODUCTION" {
		gin.SetMode(gin.ReleaseMode)
	}

	//* Initialize the App and Controller and bind them
	logger.Info("Starting the gin server...")
	app := gin.New()
	ctrl := controller.InitController(logger)

	ctrl.SetRoutes(app)
	ctrl.SetCORS(app)

	//* Run the HTTP/2 Server
	app_ErrChan := make(chan error)
	go func() {
		port := os.Getenv("PORT")
		if port == "" {
			port = "8080"
		}

		app_ErrChan <- app.Run(fmt.Sprintf(":%v", port))
		// app_ErrChan <- app.RunTLS(fmt.Sprintf(":%v", port), "./cert/ssl.crt", "./cert/ssl.key")

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

		logger.Error("Closing server due to HTTP server's error.", zap.String("error", app_error.Error()))

	case sysInterrupt := <-sysInterruptChan:
		logger.Info("Closing server due to system interruption.", zap.String("signal", sysInterrupt.String()))
	}

}
