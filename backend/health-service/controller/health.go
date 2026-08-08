package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (ctrl *Controller) health(c *gin.Context) {
	statuses := make(map[string]string, len(ctrl.healthStatus))
	for svc, st := range ctrl.healthStatus {
		statuses[svc] = st.String()
	}

	c.JSON(http.StatusOK, statuses)
}
