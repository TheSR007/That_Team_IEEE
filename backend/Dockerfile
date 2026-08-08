# Stage 1: Base image
FROM golang:1.22-alpine AS base
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
COPY go.mod go.sum* ./
RUN mkdir -p /go/pkg && (go mod download || true)

# Stage 3: Development target (Runs go run with live reload)
FROM base AS development
COPY --from=deps /go/pkg /go/pkg
COPY . .
EXPOSE 8080
CMD ["go", "run", "main.go"]

# Stage 4: Production Builder
FROM base AS builder
COPY --from=deps /go/pkg /go/pkg
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o backend .

# Stage 5: Production Runner target (Runs compiled static binary in minimal image)
FROM alpine:3.19 AS production
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/backend .
USER appuser

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

STOPSIGNAL SIGTERM

CMD ["./backend"]