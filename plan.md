# CinemaSeat - Project Plan
**Zero to Production · Phase 2 · IEEE CUET Hackathon**
**Date:** Saturday, 8 August 2026 | 9:00 AM – 5:00 PM

---

## Team Structure

| Person | Role |
|---|---|
| Person A | Frontend (Next.js) + CI/CD |
| Person B | Backend Engineer |
| Person C | Backend Engineer |

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
                        +------------------+
                        |   Next.js        |
                        |   Frontend       |  (Person A)
                        |   (Port 3000)    |
                        +--------+---------+
                                 |
                        +--------v---------+
                        |   Nginx          |
                        |   Reverse Proxy  |  (Bonus)
                        |   (Port 80)      |
                        +--------+---------+
                                 |
                  +--------------+--------------+
                  |                             |
         +--------v---------+       +-----------v------+
         |   API Gateway /  |       |   Callback       |
         |   Core Backend   |       |   Handler        |
         |   (Go / Node.js) |       |   (Webhook)      |
         +--------+---------+       +-----------+------+
                  |                             |
          +-------+-------+                     |
          |               |                     |
   +------v----+   +------v----+                |
   | PostgreSQL|   |  Redis    |<---------------+
   | (Primary) |   | (Cache +  |
   | Seat data |   |  Locks +  |
   | Bookings  |   |  TTL Jobs)|
   +-----------+   +-----------+

                  +---------------------+
                  | Mock Gateway        |
                  | (Port 9000)         |
                  | /charge /refund     |
                  | /otp/send /verify   |
                  +---------------------+
```

### Service Breakdown (Monolith-First Approach)

We use a **single backend service** (modular monolith) to minimize inter-service overhead and reduce complexity within the hackathon timeframe. Internal packages are clearly separated.

```
backend/
  cmd/server/        — entry point
  internal/
    movies/          — browse movies, theatres, showtimes
    seats/           — seat map, hold, release
    bookings/        — create booking, confirm, cancel
    payments/        — charge, callback handling, idempotency
    otp/             — send/verify OTP
    health/          — /health endpoint
  pkg/
    gateway/         — gateway client (HTTP)
    db/              — database connection + migrations
    cache/           — Redis client
    middleware/       — rate limiting, logging, auth
```

> **Decision rationale:** A monolith ships faster. If we split, every cross-service call adds latency and deployment complexity. We document this as a trade-off in DECISIONS.md.

---

## Data Model

### Tables (PostgreSQL)

```sql
-- Core Catalog Entities (Pre-populated)
movies          (movie_id, title, description, duration_minutes, poster_url)
theatres        (theatre_id, name, location)
halls           (hall_id, theatre_id, name)
seats           (seat_id, hall_id, row_letter, seat_number, seat_type)
showtimes       (showtime_id, movie_id, hall_id, start_time, price)

-- Booking & Concurrency Entities (Dynamic State)
showtime_seats  (showtime_seat_id, showtime_id, seat_id, status, held_by_user, held_at, expires_at)
bookings        (booking_ref, user_phone, showtime_id, status, total_amount, created_at, expires_at)
booking_seats   (booking_seat_id, booking_ref, showtime_seat_id)
payments        (payment_id, booking_ref, amount, currency, status, last_event_id, created_at, updated_at)
```

### Redis Keys

| Key Pattern | Purpose | TTL |
|---|---|---|
| `hold:{showtime_id}:{seat_id}` | Distributed lock for seat hold | `HOLD_TTL_SECONDS` |
| `otp:{ref}` | OTP verification reference | 5 min |
| `payment:idempotency:{payment_id}` | Dedup callback | 24 hrs |
| `seatmap:{showtime_id}` | Cached seat map | 5 sec |

---

## Concurrency Strategy (The Critical Path)

### Seat Hold — Preventing Double-Booking

The core challenge: 100 users hit the same seat simultaneously.

**Strategy: Redis `SET NX` (atomic lock) + PostgreSQL update**

```
User requests HOLD for seat S on showtime T:
  1. SETNX hold:{T}:{S} {user_id} EX {HOLD_TTL_SECONDS}
     → If 0 returned: seat already held → return 409 Conflict
     → If 1 returned: lock acquired
  2. UPDATE seats SET status='HELD' WHERE id=S AND status='AVAILABLE'
     → If 0 rows updated: concurrent DB state → release Redis lock → 409
     → If 1 row updated: hold confirmed → return 200 with hold_id
```

This gives us **two layers of protection:**
- Redis `SETNX` is atomic — only one request wins
- PostgreSQL UPDATE with a WHERE guard is a second-line defense

### Auto-Release Expired Holds

Two mechanisms for TTL expiry:
1. **Redis TTL** — key expires automatically, clearing the distributed lock
2. **Background job** (every 5s) — query `seat_holds WHERE expires_at < NOW() AND status='HELD'`, update seat to AVAILABLE

### Payment Callback Idempotency

```
On callback received:
  1. Check Redis key: payment:idempotency:{payment_id}
     → If exists: return 200 immediately (duplicate)
  2. SET payment:idempotency:{payment_id} "processed" EX 86400
  3. Process: update booking status, confirm seat
  4. Return 200 always
```

---

## API Design

### Core Endpoints (Backend)

```
GET  /health                         → 200 always

GET  /api/movies                     → list movies
GET  /api/movies/:id/showtimes       → list showtimes for movie
GET  /api/showtimes/:id/seats        → live seat map  ← judges verify
POST /api/showtimes/:id/hold         → hold a seat    ← judges verify
POST /api/bookings/:id/pay           → initiate payment (OTP + charge)
POST /api/bookings/:id/verify-otp    → verify OTP
POST /internal/payment-callback      → gateway webhook (always returns 200)
POST /api/bookings/:id/cancel        → cancel + refund

GET  /api/showtimes/:id/seats
  Response:
  {
    "showtime_id": "...",
    "seats": [
      { "id": "...", "row": "F", "col": 12, "type": "standard",
        "status": "available|held|booked" }
    ]
  }

POST /api/showtimes/:id/hold
  Body: { "seat_id": "...", "user_id": "..." }
  Response 200: { "hold_id": "...", "expires_at": "..." }
  Response 409: { "error": "seat already held" }
```

---

## Frontend Design (Next.js)

### Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **State:** React Context + SWR for real-time seat map polling
- **UI Components:** shadcn/ui
- **Icons:** Lucide React

### Pages & Routes

```
/                         → Home: list of movies
/movies/[id]              → Movie detail + showtimes
/showtimes/[id]           → Seat map + hold flow
/booking/[id]/pay         → Payment + OTP page
/booking/[id]/confirm     → Booking confirmation
```

### Seat Map Component

```
SeatMap
  ├── Grid of SeatButton components
  ├── Color coding:
  │     available  → green (clickable)
  │     held       → yellow (not selectable)
  │     booked     → red/gray (not selectable)
  │     selected   → blue (user's pending choice)
  ├── Polling: SWR with 3s refresh interval
  └── Hold timer: countdown shown when user holds a seat
```

### Key UX Flows

**Browse → Hold Flow:**
1. Home page lists movies with posters
2. Click movie → see showtimes
3. Click showtime → seat map loads
4. Click available seat → optimistic UI marks it selected
5. Click "Hold Seat" → POST /hold → seat turns yellow + timer starts
6. Redirect to payment page

**Payment Flow:**
1. Enter phone number → OTP sent via gateway
2. Enter OTP code → verify
3. Click "Pay" → POST /pay → loading spinner
4. Poll booking status OR use SSE for confirmation
5. Show confirmation page with QR-like booking ref

### Environment Variables (Frontend)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
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
      - NEXT_PUBLIC_API_BASE_URL=http://backend:8080

  backend:
    build: ./backend
    ports: ["8080:8080"]
    environment:
      - DATABASE_URL=postgres://...
      - REDIS_URL=redis://redis:6379
      - HOLD_TTL_SECONDS=120
      - GATEWAY_URL=http://gateway:9000
      - CALLBACK_BASE_URL=http://backend:8080
    depends_on: [postgres, redis, gateway]

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: cinemaseat
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./backend/migrations:/docker-entrypoint-initdb.d

  redis:
    image: redis:7-alpine

  gateway:
    image: asifmahmoud414/mock-gateway:latest
    ports: ["9000:9000"]

volumes:
  pgdata:
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

- [ ] Create GitHub repo (public)
- [ ] Initialize Next.js frontend with Tailwind + shadcn
- [ ] Initialize backend (Go or Node.js) with module structure
- [ ] Write `docker-compose.yml` skeleton
- [ ] Pull gateway image: `docker pull asifmahmoud414/mock-gateway:latest`
- [ ] Set up GitHub Actions CI skeleton

---

### Phase 1 — Core Implementation (9:30 AM – 1:00 PM)

#### Person A — Frontend
- [ ] Home page: movie listing
- [ ] Movie detail page: showtimes
- [ ] Seat map page with polling
- [ ] Hold flow (POST + timer display)
- [ ] Payment + OTP pages
- [ ] Confirmation page
- [ ] Connect to backend API (use `NEXT_PUBLIC_API_BASE_URL`)
- [ ] Dockerize Next.js

#### Person B — Backend Core
- [ ] DB schema + seed data (movies, theatres, showtimes, seats)
- [ ] `/health` endpoint
- [ ] `GET /api/movies` + `GET /api/movies/:id/showtimes`
- [ ] `GET /api/showtimes/:id/seats` (seat map)
- [ ] `POST /api/showtimes/:id/hold` with Redis SETNX lock
- [ ] Background job: expire holds after TTL

#### Person C — Backend Payments + Gateway
- [ ] Gateway client wrapper
- [ ] `POST /api/bookings/:id/pay` → trigger OTP + charge (async, 202)
- [ ] `POST /internal/payment-callback` — idempotent, always 200
- [ ] OTP send + verify endpoints
- [ ] Booking status + confirmation logic
- [ ] Unit tests: concurrency hold test + duplicate callback test

---

### Phase 2 — Integration + Testing (1:00 – 2:30 PM)

- [ ] Person A: Connect all frontend pages to real backend
- [ ] Person B + C: Full booking path E2E test in Docker
- [ ] Run Scenario A: 100 concurrent holds on one seat
- [ ] Run Scenario B: Abandoned hold expiry
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
| Frontend | Next.js 14 (App Router), Tailwind CSS, shadcn/ui, SWR |
| Backend | Go (preferred) or Node.js + Express/Fastify |
| Database | PostgreSQL 16 |
| Cache / Locks | Redis 7 |
| Gateway | `asifmahmoud414/mock-gateway:latest` |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Deployment | Poridhi VM (or AWS bonus) |
| Reverse Proxy | Nginx (bonus) |
| Load Testing | k6 |
