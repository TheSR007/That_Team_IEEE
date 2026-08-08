# Stage 1: Build stage
FROM golang:1.22-alpine AS builder
WORKDIR /app
ENV GOTOOLCHAIN=auto

# Download dependencies
COPY go.mod go.sum* ./
RUN go mod download

# Copy source code and build binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o catalog ./cmd/main.go

# Stage 2: Production runner stage
FROM alpine:3.19
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/catalog .
USER appuser

EXPOSE 8081

HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8081/health || exit 1

STOPSIGNAL SIGTERM

CMD ["./catalog"]
