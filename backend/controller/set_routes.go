package controller

import "github.com/gin-gonic/gin"

func (ctrl *Controller) SetRoutes(app *gin.Engine) {
	//? Example route
	app.Handle("GET", "/ws", ctrl.connectionHandler)

	// TODO Add other routes

}
