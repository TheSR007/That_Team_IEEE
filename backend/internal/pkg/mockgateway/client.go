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
