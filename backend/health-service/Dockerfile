# Stage 1: Base image
FROM golang:1.26-alpine AS base
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
COPY health-service/go.mod health-service/go.sum* ./health-service/
RUN mkdir -p /go/pkg && (go mod download || true)

# Stage 3: Development target
FROM base AS development
ARG SERVICE=health-service
ENV SERVICE=${SERVICE}
COPY --from=deps /go/pkg /go/pkg
COPY . .
WORKDIR /app/health-service
CMD ["sh", "-c", "go run ./main.go"]

# Stage 4: Production Builder
FROM base AS builder
ARG SERVICE=health-service
COPY --from=deps /go/pkg /go/pkg
COPY . .
WORKDIR /app/health-service
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o app_binary ./main.go

# Stage 5: Production Runner target
FROM alpine:3.19 AS production
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/health-service/app_binary .
USER appuser

EXPOSE 8085

HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8085/health || exit 1

STOPSIGNAL SIGTERM

CMD ["./app_binary"]
