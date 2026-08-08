package payment

import (
	"github.com/TheSR007/That_Team_IEE/backend/internal/db/store"
	"go.uber.org/zap"
)

type Service struct {
	store  store.Querier
	logger *zap.Logger
}

func NewService(store store.Querier, logger *zap.Logger) *Service {
	return &Service{
		store:  store,
		logger: logger,
	}
}
