package mockgateway

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type Client struct {
	baseURL    string
	httpClient *http.Client
}

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

type OTPSendPayload struct {
	Phone string `json:"phone"`
	Ref   string `json:"ref"`
}

type OTPVerifyPayload struct {
	Ref  string `json:"ref"`
	Code string `json:"code"`
}

func NewClient(baseURL string) *Client {
	return &Client{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (c *Client) Charge(ctx context.Context, payload ChargePayload, headers map[string]string) (*ChargeResponse, error) {
	url := fmt.Sprintf("%s/charge", c.baseURL)
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	for k, v := range headers {
		req.Header.Set(k, v)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusAccepted {
		return nil, fmt.Errorf("unexpected status code from gateway: %d", resp.StatusCode)
	}

	var chargeResp ChargeResponse
	if err := json.NewDecoder(resp.Body).Decode(&chargeResp); err != nil {
		return nil, err
	}

	return &chargeResp, nil
}

// ChargeWithRetry calls Charge with up to maxRetries attempts, using exponential backoff.
func (c *Client) ChargeWithRetry(ctx context.Context, payload ChargePayload, headers map[string]string, maxRetries int) (*ChargeResponse, error) {
	var lastErr error
	backoff := 500 * time.Millisecond
	for i := 0; i < maxRetries; i++ {
		resp, err := c.Charge(ctx, payload, headers)
		if err == nil {
			return resp, nil
		}
		lastErr = err
		if i < maxRetries-1 {
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(backoff):
				backoff *= 2
			}
		}
	}
	return nil, fmt.Errorf("charge failed after %d attempts: %w", maxRetries, lastErr)
}

func (c *Client) SendOTP(ctx context.Context, payload OTPSendPayload) error {
	url := fmt.Sprintf("%s/otp/send", c.baseURL)
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusAccepted {
		return fmt.Errorf("unexpected status code from gateway: %d", resp.StatusCode)
	}

	return nil
}

// SendOTPWithRetry calls SendOTP with up to maxRetries attempts, using exponential backoff.
func (c *Client) SendOTPWithRetry(ctx context.Context, payload OTPSendPayload, maxRetries int) error {
	var lastErr error
	backoff := 500 * time.Millisecond
	for i := 0; i < maxRetries; i++ {
		err := c.SendOTP(ctx, payload)
		if err == nil {
			return nil
		}
		lastErr = err
		if i < maxRetries-1 {
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(backoff):
				backoff *= 2
			}
		}
	}
	return fmt.Errorf("send OTP failed after %d attempts: %w", maxRetries, lastErr)
}

func (c *Client) VerifyOTP(ctx context.Context, payload OTPVerifyPayload) (bool, error) {
	url := fmt.Sprintf("%s/otp/verify", c.baseURL)
	body, err := json.Marshal(payload)
	if err != nil {
		return false, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(body))
	if err != nil {
		return false, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	switch resp.StatusCode {
	case http.StatusOK:
		return true, nil
	case http.StatusBadRequest:
		return false, nil
	}

	return false, fmt.Errorf("unexpected status code from gateway: %d", resp.StatusCode)
}

// RefundPayload is the request body for the gateway /refund endpoint.
type RefundPayload struct {
	PaymentID  string  `json:"payment_id"`
	BookingRef string  `json:"booking_ref"`
	Amount     float64 `json:"amount"`
}

// Refund calls the gateway /refund endpoint.
func (c *Client) Refund(ctx context.Context, payload RefundPayload) error {
	url := fmt.Sprintf("%s/refund", c.baseURL)
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusAccepted {
		return fmt.Errorf("unexpected status code from gateway refund: %d", resp.StatusCode)
	}

	return nil
}
