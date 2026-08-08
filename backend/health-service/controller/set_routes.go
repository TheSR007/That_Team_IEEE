package controller

import "github.com/gin-gonic/gin"

func (ctrl *Controller) SetRoutes(app *gin.Engine) {
	//? Health check routes
	app.GET("/health", ctrl.health)
}
