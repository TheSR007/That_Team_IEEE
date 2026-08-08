# CinemaSeat API Documentation

REST API and WebSocket interface for the CinemaSeat ticketing backend.

---

## Overview

- **Content-Type**: `application/json`
- **Base URL** (via Nginx): `http://localhost:8080`
- **Base Path**: `/api/v1`
- **WebSocket Base**: `ws://localhost:8080`

### Services & Routing (via Nginx on port 8080)

| Path Prefix | Service | Port | Nature |
|---|---|---|---|
| `/health` | Health Service | 8085 | Stateful — probes all services + gateway |
| `/api/v1/movies*` | Catalog Service | 8081 | Stateless — DB read-only |
| `/api/v1/showtimes*` | Catalog Service | 8081 | Stateless — DB read-only |
| `/ws/showtimes*` | Booking Service | 8082 | WebSocket — live seat map push |
| `/api/v1/holds*` | Booking Service | 8082 | Stateful — Redis + Postgres write |
| `/api/v1/bookings*` | Booking Service | 8082 | Stateful — orchestrates Payment via gRPC |
| `/api/v1/payments*` | Payment Service | 8083 | Stateful — gateway charge + callback |
| `/api/v1/otp*` | Payment Service | 8083 | Stateful — gateway OTP proxy |

### Critical Rules

- `HOLD_TTL_SECONDS` is always read from environment — never hardcoded.
- `POST /api/v1/payments/callback` **must always return `200 OK`**, even for duplicates or errors.
- Idempotency for callbacks is keyed on `event_id` (Redis + `last_event_id` column in DB).
- `GET /health` must respond in under 1 second regardless of gateway status.

---

## Complete Booking Flow

This diagram shows the full end-to-end flow from seat selection to confirmed booking.

```
  BROWSER                  NGINX           BOOKING SVC         PAYMENT SVC        MOCK GATEWAY
     |                       |               (8082)               (8083)             (9000)
     |                       |                  |                    |                  |
  [1] WS connect             |                  |                    |                  |
     |---ws://..../ws/showtimes/:showtime_id---->|                  |                  |
     |<--------- seat map pushed on connect -----|                  |                  |
     |<--------- seat status pushed on changes --|                  |                  |
     |                       |                  |                    |                  |
  [2] Hold seat              |                  |                    |                  |
     |--POST /api/v1/holds-->|                  |                    |                  |
     |                       |--SETNX (Redis)-->|                    |                  |
     |                       |--FOR UPDATE (PG)->|                   |                  |
     |                       |<--201 hold_id ----|                   |                  |
     |<--201 hold_id --------|                  |                    |                  |
     |                       |                  | WS push: seat=HELD |                  |
     |<----- WS: seat status update (HELD) -----|                   |                  |
     |                       |                  |                    |                  |
  [3] Create booking         |                  |                    |                  |
     |--POST /api/v1/bookings->                 |                    |                  |
     |                       |----------------->|                    |                  |
     |                       |                  |--gRPC: InitPayment->                  |
     |                       |                  |                    |--POST /otp/send-->|
     |                       |                  |                    |<--202 (may delay)-|
     |                       |<--202 booking_ref-|                   |                  |
     |<--202 booking_ref -----|                 |                    |                  |
     |                       |                  |                    |                  |
  [4] OTP send (retry if gateway drops it)      |                    |                  |
     |--POST /api/v1/otp/send->                 |                    |                  |
     |                       |--------------------------------->-------->POST /otp/send-->|
     |                       |                  |                    |<--202 (may fail)--|
     |                       |                  |                    | [retry up to 3x]  |
     |<--202 OTP dispatched--|                  |                    |                  |
     |                       |                  |                    |                  |
  [5] User enters OTP code   |                  |                    |                  |
     |--POST /api/v1/otp/verify->               |                    |                  |
     |                       |------------------------------> POST /otp/verify -------->|
     |                       |                  |                    |<--200/400 --------|
     |<--200 verified=true---|                  |                    |                  |
     |  (or 400 if wrong)    |                  |                    |                  |
     |                       |                  |                    |                  |
  [6] OTP verified -> charge  |                 |                    |                  |
     |                       |                  |                    |--POST /charge --->|
     |                       |                  |                    |  + callback_url   |
     |                       |                  |                    |<--202 PENDING ----|
     |                       |                  |                    |                  |
  [7] Gateway callback (async, 2-15s, may duplicate, may fail)       |                  |
     |                       |                  |                    |<--POST /callback--|
     |                       |------POST /api/v1/payments/callback-->|  (idempotent)    |
     |                       |                  |                    | check event_id    |
     |                       |                  |                    | in Redis          |
     |                       |                  |<--gRPC: ConfirmBkg-|                  |
     |                       |                  | mark seat=BOOKED   |                  |
     |                       |                  | mark booking=CONFIRMED                |
     |                       |<--200 received---|                    |                  |
     |                       |                  |                    |                  |
  [8] Frontend polls booking status             |                    |                  |
     |--GET /api/v1/bookings/:ref-->            |                    |                  |
     |                       |----------------->|                    |                  |
     |<--200 status=CONFIRMED-|                 |                    |                  |
     |                       |                  | WS push: seat=BOOKED                 |
     |<----- WS: seat status update (BOOKED) ---|                   |                  |
```

### Flow Summary

| Step | Who | What |
|---|---|---|
| 1 | Browser → Booking | WebSocket connection — pushes live seat map + status changes |
| 2 | Browser → Booking | `POST /holds` — Redis SETNX + PG FOR UPDATE, returns `hold_id` |
| 3 | Browser → Booking | `POST /bookings` — Booking calls Payment (gRPC) to init, returns `booking_ref` |
| 4 | Browser → Payment | `POST /otp/send` — Payment proxies to gateway (retry on failure) |
| 5 | Browser → Payment | `POST /otp/verify` — Payment proxies to gateway; blocks until verified |
| 6 | Payment → Gateway | `POST /charge` — non-blocking, returns 202 immediately |
| 7 | Gateway → Payment | `POST /payments/callback` — async (2–15s); idempotent by `event_id`; Payment gRPCs Booking to confirm |
| 8 | Browser → Booking | `GET /bookings/:ref` — polls until `CONFIRMED`, `FAILED`, or `EXPIRED` |

---

## 1. Health Domain

### `GET /health`

Aggregated health check across **all services and the mock gateway**.

- The Health Service probes: Catalog DB, Booking DB, Redis, and Gateway `/health`.
- Must respond in under 1 second regardless of gateway reachability.
- If the gateway is down, its status is `DEGRADED` but the endpoint still returns `200` — browsing and holds still work.

#### Response (`200 OK` — all healthy)

```json
{
  "status": "UP",
  "services": {
    "catalog_db": "UP",
    "booking_db": "UP",
    "redis": "UP",
    "gateway": "UP"
  }
}
```

#### Response (`200 OK` — gateway degraded, core still up)

```json
{
  "status": "UP",
  "services": {
    "catalog_db": "UP",
    "booking_db": "UP",
    "redis": "UP",
    "gateway": "DEGRADED"
  }
}
```

---

## 2. Catalog Domain

> **Stateless service.** Reads pre-populated data from Catalog DB (PostgreSQL). No writes occur at runtime.
> All responses may be served from a short-lived Redis cache (`seatmap:{showtime_id}`, 5s TTL).

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
    "rating": 6.7 
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

### `GET /api/v1/showtimes/:showtime_id/seats`

**Judge-verified endpoint.** REST fallback for the live seat map.

- Prefer the WebSocket connection (`ws://.../ws/showtimes/:showtime_id`) for real-time updates.
- This REST endpoint is used for initial page load and as fallback.
- Backed by Redis cache (`seatmap:{showtime_id}`, 5s TTL).

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

---

## 3. Booking Domain

### `WS /ws/showtimes/:showtime_id`

WebSocket connection for real-time seat map updates.

- On connect: the full current seat map is pushed immediately.
- On any seat status change (HELD, BOOKED, AVAILABLE): the updated seat is pushed to all connected clients for that showtime.
- Used during seat selection so all users see live seat availability without polling.

#### Message pushed by server (on connect and on each change)

```json
{
  "type": "SEAT_UPDATE",
  "showtime_id": "sh_101",
  "seats": [
    {
      "showtime_seat_id": "st_seat_001",
      "row_letter": "F",
      "seat_number": 12,
      "status": "HELD"
    }
  ]
}
```

---

### `POST /api/v1/holds`

**Judge-verified endpoint.** Atomically reserves a seat.

- **Primary lock**: Redis `SETNX hold:{showtime_id}:{showtime_seat_id}` with `EX HOLD_TTL_SECONDS`. If key exists → immediate `409`, no DB hit.
- **Secondary guard**: PostgreSQL `SELECT FOR UPDATE` inside a transaction — catches any edge case where Redis key just expired.
- On success: pushes `SEAT_UPDATE` to all WebSocket clients for this showtime.
- Background goroutine in Booking Service releases expired holds every 5s.

#### Request Body

```json
{
  "showtime_id": "sh_101",
  "showtime_seat_id": "st_seat_001",
  "user_email": "user@example.com"
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

Creates a booking record for an active hold. Booking Service calls Payment Service (gRPC) to initiate the payment flow, which triggers OTP dispatch.

- Returns `202 Accepted` immediately. Does not block on OTP delivery or payment.
- The `booking_ref` is used for all subsequent OTP and status polling calls.

#### Request Body

```json
{
  "hold_id": "st_seat_001",
  "showtime_id": "sh_101",
  "user_email": "user@example.com"
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

Polling endpoint. Frontend calls this every 2 seconds after OTP verification to track the final booking outcome.

- `PENDING`: payment callback not yet received — keep polling.
- `CONFIRMED`: payment succeeded, seat is BOOKED — navigate to confirmation page.
- `FAILED`: payment failed — allow user to retry.
- `EXPIRED`: hold TTL elapsed before payment completed — seat released.

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

---

### `POST /api/v1/bookings/:booking_ref/cancel`

Cancels a pending booking. Booking Service calls Payment Service (gRPC) to issue a refund via the gateway.

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

Webhook registered with the gateway as `callback_url`. Called asynchronously by the gateway after a charge attempt.

**Idempotency flow:**
```
1. Return 200 immediately  ← do this first, always
2. Check Redis: payment:idempotency:{event_id}
   → exists: stop (duplicate, already processed)
3. SET payment:idempotency:{event_id} EX 86400
4. On SUCCEEDED: gRPC to Booking Service → mark booking=CONFIRMED, seat=BOOKED
5. On FAILED:    gRPC to Booking Service → mark booking=FAILED, release seat=AVAILABLE
6. Booking Service pushes SEAT_UPDATE to WebSocket clients
```

- **STRICT RULE**: Must **always return `200 OK`**. A non-200 tells the gateway delivery failed and it will retry forever.
- Duplicate callbacks (8% rate) are safely ignored via the Redis idempotency key.

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

> Served by the **Payment Service** (port 8083). No separate OTP container.
> OTP state is stored in Redis (`otp:{ref}`, 5 min TTL).

**OTP failure handling:** The gateway drops or delays OTPs at a 10% rate. The Payment Service implements retry logic (up to 3 attempts with backoff) on `POST /otp/send`. If all retries fail, the frontend receives a retriable error and can call the endpoint again.

### `POST /api/v1/otp/send`

Proxies an OTP request to the mock gateway. Called after `POST /api/v1/bookings` returns.

- Gateway may delay or never deliver (10% rate).
- Payment Service retries up to 3 times before returning an error.
- Frontend should show a "Resend OTP" button after a timeout.

#### Request Body

```json
{
  "phone": "+8801700000000",
  "ref": "bk_001"
}
```

#### Response (`202 Accepted` — dispatched)

```json
{
  "message": "OTP dispatched."
}
```

#### Response (`503 Service Unavailable` — gateway unreachable after retries)

```json
{
  "error": "OTP_DISPATCH_FAILED",
  "message": "OTP could not be delivered. Please try again."
}
```

---

### `POST /api/v1/otp/verify`

Proxies OTP verification to the mock gateway. On success, Payment Service immediately proceeds to call `POST /charge` on the gateway to initiate the payment deduction.

**After successful verification:**
```
Payment Service → POST /charge to gateway (with callback_url)
Gateway         → returns 202 PENDING immediately
Gateway         → calls POST /api/v1/payments/callback async (2–15s later)
```

#### Request Body

```json
{
  "ref": "bk_001",
  "code": "123456"
}
```

#### Response (`200 OK` — OTP valid, charge initiated)

```json
{
  "verified": true,
  "message": "OTP verified. Payment processing initiated."
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

The gateway (`asifmahmoud414/mock-gateway:latest`, port 9000) is called by the backend only — never by the frontend.

### Gateway Endpoints

| Method | Path | Called By | Notes |
|---|---|---|---|
| `POST` | `/charge` | Payment Service | After OTP verified; async callback follows |
| `POST` | `/refund` | Payment Service | On booking cancel |
| `POST` | `/otp/send` | Payment Service | Retry up to 3x on failure |
| `POST` | `/otp/verify` | Payment Service | Validates user-entered code |
| `GET` | `/health` | Health Service | Probed by `/health` aggregate check |

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

| Behaviour | Rate | How We Handle It |
|---|---|---|
| Callback delayed 2–15 seconds | Always | Frontend polls `GET /bookings/:ref`; WS pushes on confirm |
| Payment fails (`FAILED`) | 10% | Callback handler marks booking FAILED, releases seat |
| Same callback delivered twice | 8% | Redis idempotency key on `event_id` |
| `/charge` returns 500 or times out | 2% | Payment Service retries with exponential backoff |
| OTP delayed or never delivered | 10% | Payment Service retries up to 3x; frontend shows Resend |

### Test Control Headers (send on `/charge`)

| Header | Effect |
|---|---|
| `X-Mock-Mode: deterministic` | 2s delay, always succeeds, no duplicates |
| `X-Mock-Force: fail` | Guaranteed failure |
| `X-Mock-Force: duplicate` | Guaranteed duplicate callback |
| `X-Mock-Force: timeout` | Guaranteed timeout on `/charge` |
| `X-Mock-Force: race` | Callback arrives before `/charge` returns |
| `X-Mock-Force: success` | Guaranteed clean success |

---

## Data Model Reference

### Redis Keys

| Key | Purpose | TTL |
|---|---|---|
| `hold:{showtime_id}:{showtime_seat_id}` | Distributed seat lock | `HOLD_TTL_SECONDS` |
| `otp:{ref}` | OTP verification state | 5 min |
| `payment:idempotency:{event_id}` | Callback dedup | 24 hrs |
| `seatmap:{showtime_id}` | Seat map REST cache | 5 sec |

### Seat Status Values

| Status | Meaning |
|---|---|
| `AVAILABLE` | Seat is open for selection |
| `HELD` | Locked by a user, TTL ticking, payment pending |
| `BOOKED` | Payment confirmed, seat is permanently sold |

### Booking Status Values

| Status | Meaning |
|---|---|
| `PENDING` | Booking created, waiting for payment callback |
| `CONFIRMED` | Payment succeeded, booking is final |
| `FAILED` | Payment failed — seat released |
| `EXPIRED` | Hold TTL elapsed before payment — seat released |
