package healthclient_test

import (
	"context"
	"testing"
	"time"

	"github.com/HasanMdArik/code-ref/services/rest-service/healthclient"
	"go.uber.org/zap/zaptest"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

func TestHealthClientServer(t *testing.T) {
	logger := zaptest.NewLogger(t)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Use port 0 so OS picks available port for reliable testing
	srv := healthclient.NewServer(
		healthclient.WithAddress("127.0.0.1:0"),
		healthclient.WithLogger(logger),
	)

	err := srv.Start(ctx)
	if err != nil {
		t.Fatalf("Failed to start health server: %v", err)
	}
	defer srv.Stop()

	addr := srv.Addr()
	if addr == "" {
		t.Fatalf("Server address is empty")
	}

	// Dial health server
	conn, err := grpc.NewClient(
		addr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		t.Fatalf("Failed to dial health server: %v", err)
	}
	defer conn.Close()

	client := healthpb.NewHealthClient(conn)

	// 1. Check default overall status (should be SERVING)
	resp, err := client.Check(ctx, &healthpb.HealthCheckRequest{Service: ""})
	if err != nil {
		t.Fatalf("Health check RPC failed: %v", err)
	}
	if resp.GetStatus() != healthpb.HealthCheckResponse_SERVING {
		t.Errorf("Expected SERVING, got %v", resp.GetStatus())
	}

	// 2. Set named service status
	srv.SetServingStatus("booking-service", true)
	resp, err = client.Check(ctx, &healthpb.HealthCheckRequest{Service: "booking-service"})
	if err != nil {
		t.Fatalf("Health check RPC for booking-service failed: %v", err)
	}
	if resp.GetStatus() != healthpb.HealthCheckResponse_SERVING {
		t.Errorf("Expected SERVING for booking-service, got %v", resp.GetStatus())
	}

	// 3. Set named service status to NOT_SERVING
	srv.SetServingStatus("booking-service", false)
	resp, err = client.Check(ctx, &healthpb.HealthCheckRequest{Service: "booking-service"})
	if err != nil {
		t.Fatalf("Health check RPC for booking-service failed: %v", err)
	}
	if resp.GetStatus() != healthpb.HealthCheckResponse_NOT_SERVING {
		t.Errorf("Expected NOT_SERVING for booking-service, got %v", resp.GetStatus())
	}

	// 4. Test overall status change
	srv.SetOverallStatus(false)
	resp, err = client.Check(ctx, &healthpb.HealthCheckRequest{Service: ""})
	if err != nil {
		t.Fatalf("Health check RPC failed: %v", err)
	}
	if resp.GetStatus() != healthpb.HealthCheckResponse_NOT_SERVING {
		t.Errorf("Expected NOT_SERVING overall, got %v", resp.GetStatus())
	}
}

func TestHealthClientServerDefaultPort(t *testing.T) {
	srv := healthclient.NewServer()
	if srv.Addr() != ":50050" {
		t.Errorf("Expected default address :50050, got %s", srv.Addr())
	}
}

func TestHealthClientServerContextShutdown(t *testing.T) {
	logger := zaptest.NewLogger(t)
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	srv := healthclient.NewServer(
		healthclient.WithAddress("127.0.0.1:0"),
		healthclient.WithLogger(logger),
	)

	if err := srv.Start(ctx); err != nil {
		t.Fatalf("Failed to start health server: %v", err)
	}

	// Wait for context to expire and trigger auto-shutdown
	<-ctx.Done()
	time.Sleep(50 * time.Millisecond) // brief pause for goroutine cleanup
}
