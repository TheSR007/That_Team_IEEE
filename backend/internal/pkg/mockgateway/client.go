package mockgateway

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// Client is an HTTP client for the mock payment gateway.
type Client struct {
	baseURL    string
	httpClient *http.Client
}

// ─── Request / Response Types ────────────────────────────────────────────────

type ChargePayload struct {
	Amount      float64 `json:"amount"`
	Currency    string  `json:"currency"`
	BookingRef  string  `json:"booking_ref"`
	CallbackURL string  `json:"callback_url"`
}

type ChargeResponse struct {
	PaymentID string `json:"payment_id"`
	Status    string `json:"status"`
}

type RefundPayload struct {
	PaymentID  string  `json:"payment_id"`
	BookingRef string  `json:"booking_ref"`
	Amount     float64 `json:"amount"`
}

type OTPSendPayload struct {
	Phone string `json:"phone"`
	Ref   string `json:"ref"`
}

type OTPVerifyPayload struct {
	Ref  string `json:"ref"`
	Code string `json:"code"`
}

// ─── Constructor ─────────────────────────────────────────────────────────────

func NewClient(baseURL string) *Client {
	return &Client{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 15 * time.Second, // gateway can be slow
		},
	}
}

// ─── Charge ──────────────────────────────────────────────────────────────────

// Charge calls POST /charge on the gateway once.
func (c *Client) Charge(ctx context.Context, payload ChargePayload, headers map[string]string) (*ChargeResponse, error) {
	body, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/charge", bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	for k, v := range headers {
		req.Header.Set(k, v)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("charge request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusAccepted {
		return nil, fmt.Errorf("gateway /charge returned %d", resp.StatusCode)
	}

	var cr ChargeResponse
	if err := json.NewDecoder(resp.Body).Decode(&cr); err != nil {
		return nil, fmt.Errorf("failed to decode charge response: %w", err)
	}
	return &cr, nil
}

// ChargeWithRetry calls POST /charge with exponential backoff.
// maxAttempts=3, initial backoff 500ms, doubles each retry.
func (c *Client) ChargeWithRetry(ctx context.Context, payload ChargePayload, headers map[string]string, maxAttempts int) (*ChargeResponse, error) {
	backoff := 500 * time.Millisecond
	var lastErr error
	for i := 0; i < maxAttempts; i++ {
		if i > 0 {
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(backoff):
				backoff *= 2
			}
		}
		cr, err := c.Charge(ctx, payload, headers)
		if err == nil {
			return cr, nil
		}
		lastErr = err
	}
	return nil, fmt.Errorf("charge failed after %d attempts: %w", maxAttempts, lastErr)
}

// ─── Refund ──────────────────────────────────────────────────────────────────

// Refund calls POST /refund on the gateway.
func (c *Client) Refund(ctx context.Context, payload RefundPayload) error {
	body, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/refund", bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("refund request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusAccepted {
		return fmt.Errorf("gateway /refund returned %d", resp.StatusCode)
	}
	return nil
}

// ─── OTP ─────────────────────────────────────────────────────────────────────

// SendOTP calls POST /otp/send on the gateway once.
func (c *Client) SendOTP(ctx context.Context, payload OTPSendPayload) error {
	body, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/otp/send", bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("otp/send request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusAccepted && resp.StatusCode != http.StatusOK {
		return fmt.Errorf("gateway /otp/send returned %d", resp.StatusCode)
	}
	return nil
}

// SendOTPWithRetry calls POST /otp/send with up to maxAttempts retries.
// Backoff: 500ms → 1s → 2s.
func (c *Client) SendOTPWithRetry(ctx context.Context, payload OTPSendPayload, maxAttempts int) error {
	backoff := 500 * time.Millisecond
	var lastErr error
	for i := 0; i < maxAttempts; i++ {
		if i > 0 {
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(backoff):
				backoff *= 2
			}
		}
		if err := c.SendOTP(ctx, payload); err == nil {
			return nil
		} else {
			lastErr = err
		}
	}
	return fmt.Errorf("otp/send failed after %d attempts: %w", maxAttempts, lastErr)
}

// VerifyOTP calls POST /otp/verify on the gateway.
// Returns true if verified, false if code is wrong (400), error on any other failure.
func (c *Client) VerifyOTP(ctx context.Context, payload OTPVerifyPayload) (bool, error) {
	body, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/otp/verify", bytes.NewBuffer(body))
	if err != nil {
		return false, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return false, fmt.Errorf("otp/verify request failed: %w", err)
	}
	defer resp.Body.Close()

	switch resp.StatusCode {
	case http.StatusOK:
		return true, nil
	case http.StatusBadRequest:
		return false, nil
	default:
		return false, fmt.Errorf("gateway /otp/verify returned %d", resp.StatusCode)
	}
}

// ─── Health ──────────────────────────────────────────────────────────────────

// Health calls GET /health on the gateway. Returns nil if gateway is up.
func (c *Client) Health(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/health", nil)
	if err != nil {
		return err
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("gateway unreachable: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("gateway /health returned %d", resp.StatusCode)
	}
	return nil
}
