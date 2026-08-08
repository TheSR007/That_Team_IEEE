# CinemaSeat - Project Plan
**Zero to Production · Phase 2 · IEEE CUET Hackathon**
**Date:** Saturday, 8 August 2026 | 9:00 AM – 5:00 PM

---

## Tech Stack (Confirmed)

| Layer | Technology |
|---|---|
| Frontend | React Router v7 (App Mode / SSR), Tailwind CSS |
| Backend | Go Microservices (Catalog, Booking, Payment, Health) |
| Inter-service | gRPC |
| Database | PostgreSQL 16 (Catalog DB + Booking DB — two separate instances) |
| Cache / Locks | Redis 7 |
| Reverse Proxy | Nginx (Port 8080 — single base URL) |
| Gateway | `asifmahmoud414/mock-gateway:latest` (Port 9000) |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Deployment | AWS EC2 |
| Load Testing | k6 |

---

## Team Structure

| Person | Role |
|---|---|
| Person A | Frontend (React Router v7) + CI/CD |
| Person B | Backend — Catalog Service + Booking Service |
| Person C | Backend — Payment Service (includes OTP) + Gateway Integration |

---

## Overview of Requirements

### Core Functional Requirements
- Browse movies, showtimes, and theatres
- Live seat map for a show
- Hold a seat temporarily (TTL-based, from environment variable `HOLD_TTL_SECONDS`)
- Complete payment via the mock gateway and confirm booking
- Automatically release a held seat when TTL expires without payment
- Zero double-bookings under heavy concurrency
- Integrate with the provided gateway container (`asifmahmoud414/mock-gateway:latest`)
- OTP-based verification via gateway

### Non-Functional Requirements
- Survive concurrent traffic spikes (100+ users hitting the same seat simultaneously)
- `GET /health` returns 200 in < 1 second even when the gateway is down
- `docker compose up` works from a clean clone with no manual steps
- `HOLD_TTL_SECONDS` must be an environment variable

### Judging Hooks (Mandatory)
1. `GET /health` — always returns 200 < 1s
2. `HOLD_TTL_SECONDS` — read from environment
3. README lists the exact request for holding a seat + fetching seat map
4. `docker compose up` from clean clone

### Deliverables
- `README.md` — architecture diagram, run instructions, deployed URL, key API requests
- `DECISIONS.md` — 3 real trade-off decisions with options considered, choices, and trade-offs

---

## System Architecture

### High-Level Design

```
[ Browser / React Router v7 App (Port 3000) ]
           |
           | HTTP
           v
  +-------------------+
  |  Nginx Rev Proxy  |  (Port 80 — single base URL for frontend)
  +--------+----------+
           |
     Routes by path prefix:
     /api/v1/movies*    -> Catalog  Service (8081)
     /api/v1/showtimes* -> Catalog  Service (8081)
     /api/v1/holds*     -> Booking  Service (8082)
     /api/v1/bookings*  -> Booking  Service (8082)
     /api/v1/payments*  -> Payment  Service (8083)
     /api/v1/otp*       -> Payment  Service (8083)
     /health            -> Health   Service (8085)
           |
  +---+---+---+---+
  |   |   |       |
Cat  Bk  Payment Hlth
8081 8082 8083   8085
  |   |     |     |
  |   +--gRPC inter-service--+
  v   v     v   v
 DB1  DB2        Redis
 Catalog Booking  Locks/Cache/OTP
 PG 5432 PG 5433  6379

       +---------------------+
       | Mock Gateway        |
       | (Port 9000)         |
       | /charge /refund     |
       | /otp/send /verify   |
       +---------------------+
```

### Microservice Breakdown

| Service | HTTP Port | gRPC Port | Nature | Owns |
|---|---|---|---|---|
| Catalog Service | 8081 | 50051 | Stateless — DB read | movies, theatres, halls, seats, showtimes |
| Booking Service | 8082 | 50052 | Stateful — Redis + PG write + WS | showtime_seats, bookings, booking_seats |
| Payment Service | 8083 | 50053 | Stateful — gateway + OTP | payments, callback webhook, OTP proxy |
| Health Service | 8085 | — | Aggregates all | probes catalog DB, booking DB, Redis, gateway |

### Backend File Structure

```
backend/
  nginx/nginx.conf
  proto/
    catalog/v1/catalog.proto
    booking/v1/booking.proto
    payment/v1/payment.proto
  gen/go/                       # generated gRPC stubs
  cmd/
    catalog/main.go
    booking/main.go
    payment/main.go             # serves both /payments/* and /otp/*
    health/main.go
  internal/
    config/                     # Env loader
    db/
      catalog_db/migration/
      catalog_db/store/         # sqlc generated
      booking_db/migration/
      booking_db/store/         # sqlc generated
    pkg/
      redis/                    # Redis client wrapper
      mockgateway/              # HTTP client for mock gateway
    services/
      catalog/
      booking/
      payment/                  # includes OTP handler
  docker-compose.yml
  sqlc.yaml
  go.mod / go.sum
```

> **Catalog** is stateless — reads only from Catalog DB, no Redis writes.
> **Booking** owns the WebSocket hub for real-time seat map pushes.
> **Payment** handles both `/payments/*` and `/otp/*` — single binary on port 8083.
> **Health** probes catalog DB, booking DB, Redis, and gateway, then aggregates into one `/health` response. Returns 200 even if gateway is degraded.

---

## Data Model

### PostgreSQL — Catalog DB

```sql
movies       (movie_id UUID PK, title, description, duration_minutes, poster_url, rating)
theatres     (theatre_id UUID PK, name, location)
halls        (hall_id UUID PK, theatre_id FK, name)
seats        (seat_id UUID PK, hall_id FK, row_letter, seat_number, seat_type)
showtimes    (showtime_id UUID PK, movie_id FK, hall_id FK, start_time, price)
```

### PostgreSQL — Booking DB

```sql
showtime_seats  (showtime_seat_id UUID PK, showtime_id, seat_id,
                 status ENUM('AVAILABLE','HELD','BOOKED'),
                 held_by_user, held_at, expires_at)
                 -- Atomic row lock: FOR UPDATE

bookings        (booking_ref UUID PK, user_phone, showtime_id,
                 status ENUM('PENDING','CONFIRMED','FAILED','EXPIRED'),
                 total_amount, created_at, expires_at)

booking_seats   (booking_seat_id UUID PK, booking_ref FK, showtime_seat_id FK)

payments        (payment_id UUID PK, booking_ref FK, amount, currency, status,
                 last_event_id VARCHAR UNIQUE,  -- idempotency key is event_id
                 created_at, updated_at)
```

### Redis Keys

| Key Pattern | Purpose | TTL |
|---|---|---|
| `hold:{showtime_id}:{showtime_seat_id}` | Distributed lock for seat hold | `HOLD_TTL_SECONDS` |
| `otp:{ref}` | OTP verification reference | 5 min |
| `payment:idempotency:{event_id}` | Dedup callback by event_id | 24 hrs |
| `seatmap:{showtime_id}` | Cached seat map (short for freshness) | 5 sec |

---

## Concurrency Strategy (The Critical Path)

### Seat Hold — Preventing Double-Booking

The core challenge: 100 users hit the same seat simultaneously.

**Strategy: Redis `SETNX` (atomic lock) + PostgreSQL `FOR UPDATE` row lock as double guard**

```
User requests HOLD for showtime_seat_id S:
  1. SETNX hold:{showtime_id}:{S} {user_id} EX {HOLD_TTL_SECONDS}
     → 0 returned: seat already held → 409 Conflict
     → 1 returned: Redis lock acquired
  2. BEGIN TRANSACTION
     SELECT ... FROM showtime_seats WHERE showtime_seat_id=S FOR UPDATE
     → IF status != 'AVAILABLE': ROLLBACK → release Redis lock → 409
     → UPDATE showtime_seats SET status='HELD', held_by=user, expires_at=now+TTL
     COMMIT
  3. Return 201 with hold_id, expires_at
```

Two layers of protection:
- Redis `SETNX` is atomic — one winner across 100 concurrent requests
- PostgreSQL `FOR UPDATE` row lock — second-line safety net

### Auto-Release Expired Holds

Two mechanisms for TTL expiry:
1. **Redis TTL** — key expires automatically, clearing the distributed lock
2. **Background goroutine** in Booking Service (every 5s):
   `UPDATE showtime_seats SET status='AVAILABLE' WHERE expires_at < NOW() AND status='HELD'`

### Payment Callback Idempotency

```
On callback received (POST /api/v1/payments/callback):
  1. Return 200 immediately  ← gateway always expects 200, do this first
  2. Check Redis: payment:idempotency:{event_id}
     → exists: stop (duplicate)
  3. SET payment:idempotency:{event_id} EX 86400
  4. Update payments table + call Booking Service (gRPC) to confirm/fail booking
```

---

## API Design — See API.md for Full Spec

All endpoints under `/api/v1`, WebSocket under `/ws`, routed through Nginx.

### Critical Endpoints (Judges Verify These)

```
GET  /health                            → 200 always (< 1s) — probes all services + gateway
GET  /api/v1/showtimes/:id/seats        → REST seat map (Redis-cached, 5s TTL)
WS   /ws/showtimes/:id                  → real-time seat map push
POST /api/v1/holds                      → hold a seat (Redis SETNX + Postgres FOR UPDATE)
```

### Full Route Map

| Method | Path | Service | Notes |
|---|---|---|---|
| GET | /health | Health (8085) | Probes all services + gateway, always 200 |
| GET | /api/v1/movies | Catalog | Stateless DB read |
| GET | /api/v1/movies/:id/showtimes | Catalog | Stateless DB read |
| GET | /api/v1/showtimes/:id | Catalog | Stateless DB read |
| GET | /api/v1/showtimes/:id/seats | Catalog | Redis-cached seat map |
| WS | /ws/showtimes/:id | Booking | Live seat map push; pushes on every status change |
| POST | /api/v1/holds | Booking | Redis SETNX + PG FOR UPDATE; WS pushes HELD |
| POST | /api/v1/bookings | Booking | Creates booking; gRPC to Payment to init OTP+charge flow |
| GET | /api/v1/bookings/:ref | Booking | Frontend polls every 2s until CONFIRMED/FAILED/EXPIRED |
| POST | /api/v1/bookings/:ref/cancel | Booking | gRPC to Payment to refund |
| POST | /api/v1/payments/callback | Payment | Gateway webhook — always 200, idempotent by event_id |
| POST | /api/v1/otp/send | Payment | Proxies to gateway; retries up to 3x on failure |
| POST | /api/v1/otp/verify | Payment | Proxies to gateway; on success triggers POST /charge |

### End-to-End Flow

```
[1] Browser opens WS /ws/showtimes/:id  → Booking pushes full seat map
[2] POST /holds                         → Redis SETNX + PG FOR UPDATE → WS pushes seat=HELD
[3] POST /bookings                      → Booking gRPC → Payment initiates OTP
[4] POST /otp/send                      → Payment → gateway /otp/send (retry on failure)
[5] POST /otp/verify                    → Payment → gateway /otp/verify
                                           on success: Payment → gateway POST /charge
[6] Gateway callback (async 2-15s)      → POST /payments/callback (idempotent by event_id)
                                           Payment gRPC → Booking confirms seat=BOOKED
                                           Booking WS pushes seat=BOOKED to all clients
[7] GET /bookings/:ref (poll every 2s)  → returns CONFIRMED when callback processed
```

---

## Frontend Status (React Router v7 — App Mode)

### Stack
- **Framework:** React Router v7 (App Mode, SSR-capable)
- **Styling:** Tailwind CSS
- **State:** React Context (Auth), local useState + polling for seat map
- **Build:** Vite

### Routes (routes.ts — confirmed)

| Route | File | Status |
|---|---|---|
| `/` (index) | `routes/home.tsx` | Done — auth guard |
| `/sign-in` | `routes/signin.tsx` | Done |
| `/sign-up` | `routes/signup.tsx` | Done |
| `/browse` | `routes/browse.tsx` | Done |
| `/movie/:movie_id` | `routes/movie.tsx` | Done |
| `/select_seat/:movie_id` | `routes/select_seat.tsx` | Done — mock data only |
| `/payment/:movie_id/:seat_id` | `routes/payment.tsx` | Done — needs API wiring |
| `/booking/:booking_ref/confirm` | TBD | Not yet created |

### Components Done

- `SeatGrid`, `SeatNavBar`, `ProgressTracker`, `MovieSummaryBanner`, `OrderSummary`, `PaymentModal`, `SeatFooter`
- `FormInput`, `SubmitButton`, `MobileHeader`
- Auth context (`context/AuthContext`)

### Frontend TODO — API Wiring (Critical)

- [ ] Replace mock seat data with real `GET /api/v1/showtimes/:id/seats` (poll every 3s)
- [ ] Wire `POST /api/v1/holds` on seat confirm
- [ ] Wire `POST /api/v1/bookings` on payment page (creates booking)
- [ ] Wire `POST /api/v1/otp/send` and `POST /api/v1/otp/verify`
- [ ] Poll `GET /api/v1/bookings/:ref` for confirmation status
- [ ] Create confirmation route `/booking/:booking_ref/confirm`
- [ ] Set `VITE_API_BASE_URL` env var and use in all fetch calls

### Environment Variables (Frontend)

```env
VITE_API_BASE_URL=http://localhost:8080
```

---

## DevOps & CI/CD (Person A)

### Docker Compose Structure

```yaml
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - VITE_API_BASE_URL=http://localhost:8080

  nginx:
    build: ./backend/nginx
    ports: ["8080:8080"]
    depends_on: [catalog, booking, payment, otp, health]

  catalog:
    build:
      context: ./backend
      target: catalog
    environment:
      - DB1_URL=postgres://app:secret@catalog_db:5432/catalog
      - REDIS_URL=redis://redis:6379
    depends_on: [catalog_db, redis]

  booking:
    build:
      context: ./backend
      target: booking
    environment:
      - DB2_URL=postgres://app:secret@booking_db:5432/booking
      - REDIS_URL=redis://redis:6379
      - CATALOG_GRPC_ADDR=catalog:50051
      - HOLD_TTL_SECONDS=120
    depends_on: [booking_db, redis, catalog]

  payment:
    build:
      context: ./backend
      target: payment
    environment:
      - DB2_URL=postgres://app:secret@booking_db:5432/booking
      - REDIS_URL=redis://redis:6379
      - GATEWAY_URL=http://gateway:9000
      - CALLBACK_BASE_URL=http://nginx:8080
      - BOOKING_GRPC_ADDR=booking:50052
    depends_on: [booking_db, redis, gateway, booking]

  health:
    build:
      context: ./backend
      target: health
    environment:
      - DB1_URL=postgres://app:secret@catalog_db:5432/catalog
      - DB2_URL=postgres://app:secret@booking_db:5432/booking

  catalog_db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: catalog
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
    volumes:
      - catalog_pgdata:/var/lib/postgresql/data
      - ./backend/internal/db/catalog_db/migration:/docker-entrypoint-initdb.d

  booking_db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: booking
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
    volumes:
      - booking_pgdata:/var/lib/postgresql/data
      - ./backend/internal/db/booking_db/migration:/docker-entrypoint-initdb.d

  redis:
    image: redis:7-alpine

  gateway:
    image: asifmahmoud414/mock-gateway:latest
    ports: ["9000:9000"]

volumes:
  catalog_pgdata:
  booking_pgdata:
```

### GitHub Actions CI/CD Pipeline

```
On Pull Request:
  - Lint (ESLint for frontend, golangci-lint / eslint for backend)
  - Unit Tests (backend core: concurrency + idempotency tests)
  - Build Docker images (validate Dockerfile)
  - Integration test: docker compose up + smoke test /health

On Push to main:
  - All CI steps above
  - Build & push Docker images to GHCR
  - SSH into Poridhi VM → docker compose pull && docker compose up -d

Pipeline Diagram:

  PR push ──► Lint ──► Test ──► Build Image ──► (blocked from merge if fails)
  main push ──► Lint ──► Test ──► Build ──► Push to GHCR ──► Deploy to VM
```

### CI/CD Files

```
.github/
  workflows/
    ci.yml           — lint + test on PR
    cd.yml           — build + deploy on main push
```

---

## Milestones & Execution Plan

### Phase 0 — Setup (9:00 – 9:30 AM) | All 3

- [x] GitHub repo (public)
- [x] React Router v7 frontend initialized
- [x] Backend Go module + microservice structure initialized
- [x] docker-compose.yml skeleton
- [ ] Pull gateway image: `docker pull asifmahmoud414/mock-gateway:latest`
- [ ] Set up GitHub Actions CI skeleton

---

### Phase 1 — Core Implementation (9:30 AM – 1:00 PM)

#### Person A — Frontend API Wiring
- [x] Sign-in / Sign-up pages
- [x] Browse page
- [x] Movie detail page
- [x] Seat map page with interactive seat grid (mock data)
- [x] Payment page (mock flow)
- [ ] Replace mock seat data with `GET /api/v1/showtimes/:id/seats` polling (3s interval)
- [ ] Wire `POST /api/v1/holds` on seat confirm
- [ ] Wire `POST /api/v1/bookings` on payment page
- [ ] Wire `POST /api/v1/otp/send` + `POST /api/v1/otp/verify`
- [ ] Poll `GET /api/v1/bookings/:ref` for status (every 2s)
- [ ] Create confirmation page route `/booking/:booking_ref/confirm`
- [ ] Dockerize React Router v7 app

#### Person B — Catalog + Booking Services
- [ ] Catalog DB migrations + seed data (movies, theatres, halls, seats, showtimes)
- [ ] Catalog Service HTTP (stateless reads):
  - `GET /api/v1/movies`
  - `GET /api/v1/movies/:id/showtimes`
  - `GET /api/v1/showtimes/:id`
  - `GET /api/v1/showtimes/:id/seats` (Redis cache, 5s TTL)
- [ ] Booking DB migrations
- [ ] Booking Service HTTP + WS + gRPC:
  - `WS /ws/showtimes/:id` — WebSocket hub, pushes on every seat status change
  - `POST /api/v1/holds` (Redis SETNX + Postgres FOR UPDATE → WS push)
  - `POST /api/v1/bookings` — gRPC to Payment to init OTP + charge
  - `GET /api/v1/bookings/:ref` — frontend polls this
  - `POST /api/v1/bookings/:ref/cancel` — gRPC to Payment to refund
- [ ] Background goroutine: expire holds every 5s → WS push seat=AVAILABLE
- [ ] Health Service: `GET /health` probes catalog DB + booking DB + Redis + gateway
- [ ] Nginx config routing path prefixes to each service

#### Person C — Payment Service (includes OTP)
- [ ] Gateway HTTP client (`internal/pkg/mockgateway/`) with retry logic
- [ ] Payment Service (single binary, port 8083):
  - `POST /api/v1/otp/send` — proxy to gateway `/otp/send`; retry up to 3x on failure
  - `POST /api/v1/otp/verify` — proxy to gateway `/otp/verify`; on success call `POST /charge`
  - `POST /charge` to gateway (after OTP verify) — non-blocking, pass `callback_url`
  - `POST /api/v1/payments/callback` — idempotent by `event_id`, always 200
    - on SUCCEEDED: gRPC to Booking → mark booking=CONFIRMED, seat=BOOKED
    - on FAILED: gRPC to Booking → mark booking=FAILED, release seat=AVAILABLE
- [ ] Unit tests:
  - 100 goroutines → same seat → exactly 1 HELD, 99 rejected
  - Same event_id delivered twice → idempotent, booking confirmed once
  - OTP gateway failure → retry fires, eventually succeeds or returns 503

---

### Phase 2 — Integration + Testing (1:00 – 2:30 PM)

- [ ] Person A: Replace all mock data with real API calls
- [ ] Person B + C: Full booking path E2E in `docker compose up`
- [ ] Run Scenario A: 100 concurrent holds on one seat (k6 script)
- [ ] Run Scenario B: Abandoned hold with short `HOLD_TTL_SECONDS=10`
- [ ] Fix any race conditions found

---

### Phase 3 — DevOps + Deploy (2:30 – 3:30 PM) | Person A

- [ ] Complete GitHub Actions CI workflow
- [ ] Set up GitHub Actions CD workflow (SSH + compose pull)
- [ ] Deploy to Poridhi VM
- [ ] Verify `docker compose up` from clean clone
- [ ] Confirm deployed URL is live + `/health` returns 200
- [ ] (Bonus) Set up Nginx reverse proxy

---

### Phase 4 — Documentation + Polish (3:30 – 4:30 PM) | All 3

- [ ] Write `README.md`:
  - Architecture diagram
  - How to run (`docker compose up`)
  - Deployed URL
  - Exact request: hold a seat
  - Exact request: fetch seat map
- [ ] Write `DECISIONS.md` (3 real trade-offs)
- [ ] Run final smoke test on deployed URL
- [ ] Final commit + push (before code freeze)

---

### Phase 5 — Buffer + Bonus (4:30 – 5:00 PM)

- [ ] Scenario C load test (bonus)
- [ ] Monitoring / structured logging (bonus)
- [ ] Fault isolation test (bonus)

---

## DECISIONS.md Pre-planning

These are the 3 decisions to document:

### Decision 1: Monolith vs Microservices
- **Options:** Full microservices (movies, seats, payments, notifications) vs modular monolith
- **Choice:** Modular monolith
- **Why:** Faster to build and deploy in 8 hours. No inter-service network calls. Simpler Docker setup.
- **Trade-off:** Harder to scale individual components independently if traffic is uneven.

### Decision 2: Concurrency Lock — Redis vs DB-level
- **Options:** PostgreSQL `SELECT FOR UPDATE SKIP LOCKED` vs Redis `SETNX`
- **Choice:** Redis SETNX as primary + DB WHERE guard as fallback
- **Why:** Redis is sub-millisecond; DB-level locks add transaction overhead under heavy concurrency.
- **Trade-off:** Redis is an additional dependency. If Redis is down, the hold endpoint fails.

### Decision 3: Async Payment — Polling vs SSE
- **Options:** Frontend polls booking status every 2s vs Server-Sent Events for push
- **Choice:** Polling with SWR
- **Why:** Simpler to implement correctly under time pressure. SSE requires proper connection management.
- **Trade-off:** Extra network requests; 2-second delay before frontend shows confirmed status.

---

## Scoring Breakdown (90 + 10 bonus)

| Category | Points | Owner |
|---|---|---|
| System Architecture | 25 | B + C |
| Functionality | 25 | B + C |
| Code Quality & Testing | 15 | B + C |
| Containerization & CI | 15 | A |
| Deployment | 10 | A |
| **Bonus** (fault isolation, monitoring, nginx, AWS, Scenario C) | **+10** | All |

---

## Key Rules to Not Forget

> [!IMPORTANT]
> `HOLD_TTL_SECONDS` must be read from environment — never hardcoded.

> [!IMPORTANT]
> `POST /internal/payment-callback` must always return 200, even for duplicates.

> [!IMPORTANT]
> Do NOT write your own payment/OTP mock. Use `asifmahmoud414/mock-gateway:latest`.

> [!WARNING]
> Do not push to the default branch after code freeze.

> [!CAUTION]
> Do NOT run the load generator (k6) on the same machine as the app. Run it from your laptop against the deployed URL.

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React Router v7 (App Mode), Tailwind CSS |
| Backend | Go Microservices (Catalog, Booking, Payment+OTP, Health) |
| Inter-service | gRPC |
| Database | PostgreSQL 16 (Catalog DB + Booking DB) |
| Cache / Locks | Redis 7 |
| Gateway | `asifmahmoud414/mock-gateway:latest` |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Deployment | Poridhi VM |
| Reverse Proxy | Nginx (single entry point at :8080) |
| Load Testing | k6 |
