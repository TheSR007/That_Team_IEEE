package controller

import "go.uber.org/zap"

type Controller struct {
	//TODO add controller fields
	logger *zap.Logger
}

func InitController(logger *zap.Logger) (ctrl *Controller) {
	ctrl = &Controller{
		logger: logger,
		//TODO intialize controller fields
	}

	// TODO add additional controller field initialization if necessary

	return
}
