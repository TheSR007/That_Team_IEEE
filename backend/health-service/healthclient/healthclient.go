package healthclient

import (
	"context"
	"fmt"
	"net"
	"os"
	"sync"

	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

const DefaultPort = "50050"

// Config defines options for the health server.
type Config struct {
	Address string // e.g. ":50050"
	Logger  *zap.Logger
}

// Option is a functional option for configuring HealthServer.
type Option func(*Config)

// WithAddress sets a custom listening address/port.
func WithAddress(addr string) Option {
	return func(c *Config) {
		c.Address = addr
	}
}

// WithPort sets a custom port.
func WithPort(port int) Option {
	return func(c *Config) {
		c.Address = fmt.Sprintf(":%d", port)
	}
}

// WithLogger configures a custom zap logger.
func WithLogger(logger *zap.Logger) Option {
	return func(c *Config) {
		c.Logger = logger
	}
}

// Server encapsulates a gRPC Health Server listening on port 50050 (or configured address).
type Server struct {
	mu         sync.Mutex
	config     Config
	grpcServer *grpc.Server
	healthSrv  *health.Server
	listener   net.Listener
	running    bool
}

// NewServer creates a new HealthServer instance.
// If address is not provided in opts, it defaults to HEALTH_PORT env variable or ":50050".
func NewServer(opts ...Option) *Server {
	addr := os.Getenv("HEALTH_PORT")
	if addr == "" {
		addr = ":" + DefaultPort
	} else if addr[0] != ':' {
		addr = ":" + addr
	}

	cfg := Config{
		Address: addr,
		Logger:  zap.NewNop(),
	}

	for _, opt := range opts {
		opt(&cfg)
	}

	healthSrv := health.NewServer()
	// Set overall health (empty service name) to SERVING by default
	healthSrv.SetServingStatus("", healthpb.HealthCheckResponse_SERVING)

	return &Server{
		config:    cfg,
		healthSrv: healthSrv,
	}
}

// Start launches the gRPC server listening on the configured address (default :50050) in a background goroutine.
// It stops gracefully when ctx is cancelled.
func (s *Server) Start(ctx context.Context) error {
	s.mu.Lock()
	if s.running {
		s.mu.Unlock()
		return fmt.Errorf("healthclient: server is already running")
	}

	lis, err := net.Listen("tcp", s.config.Address)
	if err != nil {
		s.mu.Unlock()
		return fmt.Errorf("healthclient: failed to listen on %s: %w", s.config.Address, err)
	}

	s.listener = lis
	s.grpcServer = grpc.NewServer()
	healthpb.RegisterHealthServer(s.grpcServer, s.healthSrv)
	s.running = true
	s.mu.Unlock()

	s.config.Logger.Info("healthclient: starting gRPC health server", zap.String("address", lis.Addr().String()))

	errChan := make(chan error, 1)
	go func() {
		if err := s.grpcServer.Serve(lis); err != nil && err != grpc.ErrServerStopped {
			s.config.Logger.Error("healthclient: server error", zap.Error(err))
			errChan <- err
		}
		close(errChan)
	}()

	// Listen for context cancellation to trigger graceful shutdown
	go func() {
		select {
		case <-ctx.Done():
			s.config.Logger.Info("healthclient: context cancelled, stopping health server...")
			s.Stop()
		case <-errChan:
		}
	}()

	return nil
}

// SetServingStatus sets the health serving status for a specific named service.
func (s *Server) SetServingStatus(service string, serving bool) {
	status := healthpb.HealthCheckResponse_SERVING
	if !serving {
		status = healthpb.HealthCheckResponse_NOT_SERVING
	}
	s.healthSrv.SetServingStatus(service, status)
}

// SetOverallStatus sets the overall server health status (empty service name "").
func (s *Server) SetOverallStatus(serving bool) {
	s.SetServingStatus("", serving)
}

// Addr returns the network address the server is listening on, or empty string if not running.
func (s *Server) Addr() string {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.listener != nil {
		return s.listener.Addr().String()
	}
	return s.config.Address
}

// Stop gracefully stops the health server.
func (s *Server) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !s.running {
		return
	}

	s.config.Logger.Info("healthclient: stopping gRPC health server")
	s.healthSrv.Shutdown()
	if s.grpcServer != nil {
		s.grpcServer.GracefulStop()
	}
	s.running = false
}
