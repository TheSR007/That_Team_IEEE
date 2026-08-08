# CinemaSeat API Documentation

REST API for the CinemaSeat ticketing backend.

---

## Overview

- **Content-Type**: `application/json`
- **Base URL** (via Nginx): `http://localhost:8080`
- **Base Path**: `/api/v1`

### Services & Routing (via Nginx on port 8080)

| Path Prefix          | Service         | Port |
| -------------------- | --------------- | ---- |
| `/health`            | Health Service  | 8085 |
| `/api/v1/movies*`    | Catalog Service | 8081 |
| `/api/v1/showtimes*` | Catalog Service | 8081 |
| `/api/v1/holds*`     | Booking Service | 8082 |
| `/api/v1/bookings*`  | Booking Service | 8082 |
| `/api/v1/payments*`  | Payment Service | 8083 |
| `/api/v1/otp*`       | Payment Service | 8083 |

### Critical Rules

- `HOLD_TTL_SECONDS` is always read from environment — never hardcoded.
- `POST /api/v1/payments/callback` **must always return `200 OK`**, even for duplicates or errors.
- Idempotency for callbacks is keyed on `event_id` (stored in Redis + `last_event_id` column).
- `GET /health` must respond in under 1 second regardless of gateway status.

---

## 1. Health Domain

### `GET /health`

System health check (checks all services + Gateway). Used by orchestration tools and judge scripts.

- Responds independently of the mock gateway status.
- Response time must be under 1 second always.

#### Response (`200 OK`)

```json
{
  "status": "UP"
}
```

---

## 2. Catalog Domain

### `GET /api/v1/movies`

Returns the pre-populated list of movies.

#### Response (`200 OK`)

```json
[
  {
    "movie_id": "3a0b12c4-5678-4ef9-90ab-cdef12345678",
    "title": "Spider-Man: Brand New Day",
    "description": "The web-slinger returns...",
    "duration_minutes": 150,
    "poster_url": "https://example.com/poster.jpg",
    "rating": "PG-13"
  }
]
```

---

### `GET /api/v1/movies/:movie_id/showtimes`

Returns all showtimes for a given movie.

#### Response (`200 OK`)

```json
[
  {
    "showtime_id": "sh_101",
    "movie_id": "3a0b12c4-5678-4ef9-90ab-cdef12345678",
    "hall_id": "hall_101",
    "theatre_name": "Hall A",
    "start_time": "2026-08-08T20:00:00Z",
    "price": 450
  }
]
```

---

### `GET /api/v1/showtimes/:showtime_id`

Returns showtime metadata including theatre and pricing.

#### Response (`200 OK`)

```json
{
  "showtime_id": "sh_101",
  "movie_id": "3a0b12c4-5678-4ef9-90ab-cdef12345678",
  "hall_id": "hall_101",
  "theatre_name": "Hall A",
  "start_time": "2026-08-08T20:00:00Z",
  "price": 450
}
```

---

## 3. Booking Domain

### `POST /api/v1/holds`

**Judge-verified endpoint.** Atomically reserves a seat for a showtime.

- **Concurrency**: Redis `SETNX hold:{showtime_id}:{showtime_seat_id}` (atomic, primary lock) + PostgreSQL `FOR UPDATE` row lock (second-line guard).
- **TTL**: Configured via `HOLD_TTL_SECONDS` environment variable.
- If the Redis key already exists, the request is rejected immediately with `409` — no DB hit.

#### Request Body

```json
{
  "showtime_id": "sh_101",
  "showtime_seat_id": "st_seat_001",
  "user_email": "[EMAIL_ADDRESS]"
}
```

#### Response (`201 Created` — Hold acquired)

```json
{
  "hold_id": "st_seat_001",
  "showtime_id": "sh_101",
  "showtime_seat_id": "st_seat_001",
  "status": "HELD",
  "expires_at": "2026-08-08T20:02:00Z"
}
```

#### Response (`409 Conflict` — Seat already held or booked)

```json
{
  "error": "SEAT_UNAVAILABLE",
  "message": "Seat is already held or booked."
}
```

---

---

### `GET /api/v1/bookings/:showtime_id/seats`

**Judge-verified endpoint.** Returns the live seat map for a showtime.

- Backed by Redis cache (`seatmap:{showtime_id}`, 5s TTL) for performance under load.
- Status reflects real-time state: `AVAILABLE`, `HELD`, or `BOOKED`.

#### Response (`200 OK`)

```json
{
  "showtime_id": "sh_101",
  "seats": [
    {
      "showtime_seat_id": "st_seat_001",
      "seat_id": "seat_101",
      "row_letter": "F",
      "seat_number": 12,
      "seat_type": "REGULAR",
      "status": "AVAILABLE",
      "price": 450
    },
    {
      "showtime_seat_id": "st_seat_002",
      "seat_id": "seat_102",
      "row_letter": "F",
      "seat_number": 13,
      "seat_type": "REGULAR",
      "status": "HELD",
      "price": 450
    }
  ]
}
```

### `POST /api/v1/bookings`

Creates a booking record for an active hold. Triggers OTP dispatch to the user's email.

- Returns `202 Accepted` immediately. Does not wait for payment or OTP delivery.

#### Request Body

```json
{
  "hold_id": "st_seat_001",
  "showtime_id": "sh_101",
  "phone": "+8801700000000"
}
```

#### Response (`202 Accepted`)

```json
{
  "booking_ref": "bk_001",
  "hold_id": "st_seat_001",
  "status": "PENDING",
  "total_amount": 450,
  "expires_at": "2026-08-08T20:02:00Z"
}
```

---

### `GET /api/v1/bookings/:booking_ref`

Polling endpoint for the frontend to track booking status.

- Frontend polls this every 2 seconds after initiating payment.
- Status transitions: `PENDING` → `CONFIRMED` or `FAILED` or `EXPIRED`.

#### Response (`200 OK`)

```json
{
  "booking_ref": "bk_001",
  "showtime_id": "sh_101",
  "status": "CONFIRMED",
  "total_amount": 450,
  "created_at": "2026-08-08T20:00:00Z",
  "expires_at": "2026-08-08T20:02:00Z"
}
```

Possible `status` values: `PENDING`, `CONFIRMED`, `FAILED`, `EXPIRED`.

---

### `POST /api/v1/bookings/:booking_ref/cancel`

Cancels a pending booking and initiates a refund via the gateway.

#### Response (`202 Accepted`)

```json
{
  "booking_ref": "bk_001",
  "status": "CANCELLED"
}
```

---

## 4. Payment Domain

### `POST /api/v1/payments/callback`

Webhook called by the mock gateway after a charge attempt.

- **STRICT RULE**: Must **always return `200 OK`** — even for duplicates, unknown refs, or internal errors. A non-200 causes the gateway to retry forever.
- **Idempotency**: Deduplicated using `event_id`. On first receipt, Redis key `payment:idempotency:{event_id}` is set (24h TTL). Duplicate deliveries return `200` immediately without reprocessing.
- On `SUCCEEDED`: calls Booking Service (gRPC) to confirm booking and mark seat as `BOOKED`.
- On `FAILED`: calls Booking Service (gRPC) to mark booking as `FAILED` and release the seat.

#### Inbound Payload (From Gateway)

```json
{
  "event_id": "evt_001",
  "payment_id": "pay_xyz",
  "booking_ref": "bk_001",
  "status": "SUCCEEDED",
  "amount": 450
}
```

`status` is one of: `SUCCEEDED`, `FAILED`, `REFUNDED`.

#### Response (`200 OK` — always)

```json
{
  "received": true
}
```

---

## 5. OTP Domain

> Served by the **Payment Service** (port 8083). There is no separate OTP container.
> OTP state is stored in Redis (`otp:{ref}`, 5 min TTL).

### `POST /api/v1/otp/send`

Proxies an OTP request to the mock gateway (`POST /otp/send`).

- Called by the frontend after `POST /api/v1/bookings` succeeds.
- The gateway may delay or drop the OTP (10% rate) — the frontend should show a resend option.

#### Request Body

```json
{
  "phone": "+8801700000000",
  "ref": "bk_001"
}
```

#### Response (`202 Accepted`)

```json
{
  "message": "OTP dispatched."
}
```

---

### `POST /api/v1/otp/verify`

Proxies OTP verification to the mock gateway (`POST /otp/verify`).

- On success, the frontend proceeds to the payment step.

#### Request Body

```json
{
  "ref": "bk_001",
  "code": "123456"
}
```

#### Response (`200 OK` — Valid OTP)

```json
{
  "verified": true
}
```

#### Response (`400 Bad Request` — Invalid or expired OTP)

```json
{
  "verified": false,
  "message": "Invalid or expired OTP code."
}
```

---

## Mock Gateway Reference

The gateway container (`asifmahmoud414/mock-gateway:latest`) runs on port 9000. The backend calls it directly — the frontend never touches it.

### Gateway Endpoints

| Method | Path          | Used By                                             |
| ------ | ------------- | --------------------------------------------------- |
| `POST` | `/charge`     | Payment Service — triggers async payment            |
| `POST` | `/refund`     | Payment Service — on booking cancel                 |
| `POST` | `/otp/send`   | Payment Service — proxied from `/api/v1/otp/send`   |
| `POST` | `/otp/verify` | Payment Service — proxied from `/api/v1/otp/verify` |
| `GET`  | `/health`     | (optional check)                                    |

### Gateway Charge Request

```json
{
  "amount": 450,
  "currency": "BDT",
  "booking_ref": "bk_001",
  "callback_url": "http://nginx:8080/api/v1/payments/callback"
}
```

### Documented Gateway Misbehaviour

| Behaviour                          | Rate   |
| ---------------------------------- | ------ |
| Callback delayed 2–15 seconds      | Always |
| Payment fails (`FAILED`)           | 10%    |
| Same callback delivered twice      | 8%     |
| `/charge` returns 500 or times out | 2%     |
| OTP delayed or never delivered     | 10%    |

### Test Control Headers (send on `/charge`)

| Header                       | Effect                                    |
| ---------------------------- | ----------------------------------------- |
| `X-Mock-Mode: deterministic` | 2s delay, always succeeds, no duplicates  |
| `X-Mock-Force: fail`         | Guaranteed failure                        |
| `X-Mock-Force: duplicate`    | Guaranteed duplicate callback             |
| `X-Mock-Force: timeout`      | Guaranteed timeout on `/charge`           |
| `X-Mock-Force: race`         | Callback arrives before `/charge` returns |
| `X-Mock-Force: success`      | Guaranteed clean success                  |

---

## Data Model Reference

### Redis Keys

| Key                                     | Purpose                | TTL                |
| --------------------------------------- | ---------------------- | ------------------ |
| `hold:{showtime_id}:{showtime_seat_id}` | Distributed seat lock  | `HOLD_TTL_SECONDS` |
| `otp:{ref}`                             | OTP verification state | 5 min              |
| `payment:idempotency:{event_id}`        | Callback dedup         | 24 hrs             |
| `seatmap:{showtime_id}`                 | Seat map cache         | 5 sec              |

### Seat Status Values

| Status      | Meaning                                   |
| ----------- | ----------------------------------------- |
| `AVAILABLE` | Seat is open for selection                |
| `HELD`      | Seat is locked by a user, pending payment |
| `BOOKED`    | Payment confirmed, seat is sold           |

### Booking Status Values

| Status      | Meaning                                       |
| ----------- | --------------------------------------------- |
| `PENDING`   | Booking created, waiting for payment callback |
| `CONFIRMED` | Payment succeeded, booking is final           |
| `FAILED`    | Payment failed                                |
| `EXPIRED`   | Hold TTL expired before payment completed     |
