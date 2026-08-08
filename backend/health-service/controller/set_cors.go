package controller

import (
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func (ctrl *Controller) SetCORS(app *gin.Engine) {
	config := cors.DefaultConfig()

	// TODO Remove development Origins in production
	if os.Getenv("ENV") == "DEVELOPMENT" {
		config.AllowOrigins = []string{"*"}
	} else {
		// TODO add production allow-origins
		config.AllowOrigins = []string{""}
	}

	// TODO tune for finer control
	// config.AllowMethods = []string{"GET", "POST", "DELETE", "OPTIONS"}
	// config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	// config.AllowCredentials = true
	// config.MaxAge = 12 * time.Hour

	app.Use(cors.New(config))
}
