package healthchecker

import (
	"context"
	"os"
	"sync"
	"time"

	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

// ServiceTarget defines the name and gRPC address of a service to be health-checked.
type ServiceTarget struct {
	Name    string
	Address string // host:port
}

// getServices returns the list of downstream gRPC services to monitor on port 50050.
func getServices() []ServiceTarget {
	bookingAddr := os.Getenv("BOOKING_SERVICE_ADDR")
	if bookingAddr == "" {
		bookingAddr = "booking:50050"
	}

	paymentAddr := os.Getenv("PAYMENT_SERVICE_ADDR")
	if paymentAddr == "" {
		paymentAddr = "payment:50050"
	}

	catalogAddr := os.Getenv("CATALOG_SERVICE_ADDR")
	if catalogAddr == "" {
		catalogAddr = "catalog:50050"
	}

	return []ServiceTarget{
		{Name: "booking-service", Address: bookingAddr},
		{Name: "payment-service", Address: paymentAddr},
		{Name: "catalog-service", Address: catalogAddr},
	}
}

const pollInterval = 5 * time.Second

// checkOne performs a single gRPC health check against the given target.
// It dials a fresh connection each call (stateless check), times out after 3s.
func checkOne(ctx context.Context, target ServiceTarget, logger *zap.Logger) healthpb.HealthCheckResponse_ServingStatus {
	dialCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	conn, err := grpc.NewClient(
		target.Address,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		logger.Warn("healthchecker: failed to create client", zap.String("service", target.Name), zap.Error(err))
		return healthpb.HealthCheckResponse_NOT_SERVING
	}
	defer conn.Close()

	client := healthpb.NewHealthClient(conn)
	resp, err := client.Check(dialCtx, &healthpb.HealthCheckRequest{
		// Empty service name checks the overall server health.
		Service: "",
	})
	if err != nil {
		logger.Warn("healthchecker: health check RPC failed", zap.String("service", target.Name), zap.Error(err))
		return healthpb.HealthCheckResponse_NOT_SERVING
	}

	return resp.GetStatus()
}

// StatusMap is a goroutine-safe wrapper around the service status map.
type StatusMap struct {
	mu     sync.RWMutex
	status map[string]healthpb.HealthCheckResponse_ServingStatus
}

// Get returns the current status for the given service name.
func (s *StatusMap) Get(name string) healthpb.HealthCheckResponse_ServingStatus {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.status[name]
}

// set updates the status for a service (internal use only).
func (s *StatusMap) set(name string, st healthpb.HealthCheckResponse_ServingStatus) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.status[name] = st
}

// Snapshot returns a copy of the entire status map at this instant.
func (s *StatusMap) Snapshot() map[string]healthpb.HealthCheckResponse_ServingStatus {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make(map[string]healthpb.HealthCheckResponse_ServingStatus, len(s.status))
	for k, v := range s.status {
		out[k] = v
	}
	return out
}

// InitHealthChecker initialises status entries for all 3 services, spawns a
// background goroutine that pings each service every 5 seconds, and returns
// the live status map. The goroutine exits when ctx is cancelled.
func InitHealthChecker(ctx context.Context, logger *zap.Logger) map[string]healthpb.HealthCheckResponse_ServingStatus {
	targetServices := getServices()
	sm := &StatusMap{
		status: make(map[string]healthpb.HealthCheckResponse_ServingStatus, len(targetServices)),
	}

	// Seed every service with UNKNOWN so callers never see a missing key.
	for _, svc := range targetServices {
		sm.status[svc.Name] = healthpb.HealthCheckResponse_UNKNOWN
	}

	// pollAll performs one full sweep across all services.
	pollAll := func() {
		for _, svc := range targetServices {
			if ctx.Err() != nil {
				return // context already cancelled, abort early
			}
			st := checkOne(ctx, svc, logger)
			sm.set(svc.Name, st)
			logger.Info("healthchecker: status updated",
				zap.String("service", svc.Name),
				zap.String("status", st.String()),
			)
		}
	}

	// Run an immediate check before the first tick so the map is populated fast.
	go func() {
		pollAll()

		ticker := time.NewTicker(pollInterval)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				pollAll()
			case <-ctx.Done():
				logger.Info("healthchecker: stopping periodic health checks")
				return
			}
		}
	}()

	logger.Info("healthchecker: started", zap.Duration("interval", pollInterval))
	return sm.status
}
