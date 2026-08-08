package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Env            string
	Port           string
	CatalogDBURL   string
	BookingDBURL   string
	RedisURL       string
	HoldTTLSeconds int
	GatewayURL     string
}

func LoadConfig() (*Config, error) {
	_ = godotenv.Load()
	_ = godotenv.Load(".env.example")

	env := getEnv("ENV", "DEVELOPMENT")
	port := getEnv("PORT", "8080")
	db1URL := getEnv("CATALOG_DB_URL", "postgres://postgres:postgres@localhost:5432/cinemaseat_catalog?sslmode=disable")
	db2URL := getEnv("BOOKING_DB_URL", "postgres://postgres:postgres@localhost:5432/cinemaseat_booking?sslmode=disable")
	redisURL := getEnv("REDIS_URL", "localhost:6379")
	gatewayURL := getEnv("GATEWAY_URL", "http://localhost:9000")

	ttlStr := getEnv("HOLD_TTL_SECONDS", "120")
	holdTTL, err := strconv.Atoi(ttlStr)
	if err != nil {
		holdTTL = 120
	}

	return &Config{
		Env:            env,
		Port:           port,
		CatalogDBURL:   db1URL,
		BookingDBURL:   db2URL,
		RedisURL:       redisURL,
		HoldTTLSeconds: holdTTL,
		GatewayURL:     gatewayURL,
	}, nil
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
