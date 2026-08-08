# Stage 1: Base image
FROM golang:1.26-alpine AS base
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
COPY catalog/go.mod catalog/go.sum* ./catalog/
COPY pkg/go.mod pkg/go.sum* ./pkg/
RUN mkdir -p /go/pkg && (go mod download || true)

# Stage 3: Development target
FROM base AS development
ARG SERVICE=catalog
ENV SERVICE=${SERVICE}
COPY --from=deps /go/pkg /go/pkg
COPY . .
WORKDIR /app/catalog
CMD ["sh", "-c", "go run ./cmd/main.go"]

# Stage 4: Production Builder
FROM base AS builder
ARG SERVICE=catalog
COPY --from=deps /go/pkg /go/pkg
COPY . .
WORKDIR /app/catalog
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o app_binary ./cmd/main.go

# Stage 5: Production Runner target
FROM alpine:3.19 AS production
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/catalog/app_binary .
USER appuser

EXPOSE 8081

HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8081/health || exit 1

STOPSIGNAL SIGTERM

CMD ["./app_binary"]
