# CinemaSeat API Documentation

This document specifies the REST and WebSocket API endpoints for the CinemaSeat ticketing backend.

---

## Overview

- **Content-Type**: `application/json` (for REST endpoints)
- **Base Path**: `/api/v1`
- **Concurrency Model**: Optimistic/Pessimistic DB locking on PostgreSQL for seat holds.

- **Gateway Interoperability**: Non-blocking asynchronous callback handling with 100% `200 OK` responses on webhooks.

---

## 1. System & Health Domain

### `GET /health`

System health check endpoint used by orchestration tools and automated judging scripts.

- **Response Time**: $< 1.0\text{ second}$.

- **Dependencies**: Checks internal database connectivity. Independent of external mock gateway status.

#### Response (`200 OK`)

```json
{
  "status": "UP",
  "database": "CONNECTED",
  "timestamp": "2026-08-08T09:00:00Z"
}
```

---

## 2. Catalog & Seat Map Domain

### `GET /api/v1/movies`

Retrieves pre-populated list of active movies.

#### Response (`200 OK`)

```json
[
  {
    "id": "mov_101",
    "title": "Spider-Man: Brand New Day",
    "duration_minutes": 150,
    "rating": "PG-13"
  }
]
```

---

### `GET /api/v1/showtimes/:showtime_id`

Retrieves showtime metadata, theatre venue, and seat pricing structure.

#### Response (`200 OK`)

```json
{
  "showtime_id": "sh_101",
  "movie_id": "mov_101",
  "theatre_name": "Hall A",
  "start_time": "2026-08-08T20:00:00Z",
  "base_price": 450
}
```

---

### `GET /api/v1/showtimes/:showtime_id/seats`

Fetch live seat matrix and current availability status for a showtime.

- **Judging Requirement**: Must be documented in `README.md` and accessible via direct HTTP GET.

#### Response (`200 OK`)

```json
{
  "showtime_id": "sh_101",
  "seats": [
    {
      "seat_number": "F12",
      "status": "HELD",
      "price": 450
    },
    {
      "seat_number": "F13",
      "status": "AVAILABLE",
      "price": 450
    },
    {
      "seat_number": "F14",
      "status": "BOOKED",
      "price": 450
    }
  ]
}
```

---

## 3. Seat Reservation Domain

### `POST /api/v1/holds`

Atomically reserve a specific seat for a showtime.

- **Judging Requirement**: Must be documented in `README.md` and subjected to Scenario A concurrency testing (100 concurrent requests on 1 seat).

- **Hold TTL**: Duration configured dynamically via the `HOLD_TTL_SECONDS` environment variable.

#### Request Body

```json
{
  "showtime_id": "sh_101",
  "seat_number": "F12",
  "user_id": "usr_99"
}
```

#### Response (`201 Created` - Successful Hold)

```json
{
  "hold_id": "hld_882",
  "showtime_id": "sh_101",
  "seat_number": "F12",
  "status": "HELD",
  "expires_at": "2026-08-08T09:05:00Z"
}
```

#### Response (`409 Conflict` - Seat Already Held / Booked)

```json
{
  "error": "SEAT_UNAVAILABLE",
  "message": "Seat F12 is already held or booked."
}
```

---

## 4. Booking & Payment Domain

### `POST /api/v1/bookings`

Initiates payment processing for an active seat hold and dispatches an asynchronous `/charge` request to the mock gateway.

- **Non-Blocking Rule**: Must return `202 Accepted` immediately without blocking on gateway completion.

#### Request Body

```json
{
  "hold_id": "hld_882",
  "phone": "+8801700000000"
}
```

#### Response (`202 Accepted`)

```json
{
  "booking_ref": "bk_001",
  "hold_id": "hld_882",
  "status": "PENDING",
  "amount": 450,
  "hold_expires_at": "2026-08-08T09:05:00Z"
}
```

#### Response (`400 Bad Request` - Expired Hold)

```json
{
  "error": "HOLD_EXPIRED",
  "message": "The seat hold has expired. Please reserve a new seat."
}
```

---

### `GET /api/v1/bookings/:booking_ref`

Polling endpoint used by the frontend to verify the status of an in-flight booking.

#### Response (`200 OK`)

```json
{
  "booking_ref": "bk_001",
  "showtime_id": "sh_101",
  "seat_number": "F12",
  "status": "CONFIRMED",
  "updated_at": "2026-08-08T09:02:15Z"
}
```

_Possible `status` values_: `PENDING`, `CONFIRMED`, `FAILED`, `EXPIRED`.

---

### `POST /api/v1/payments/callback`

Webhook endpoint registered with the gateway as `callback_url`.

- **Strict Requirement**: Must **always return `200 OK**` regardless of internal logic state or duplicate deliveries.

- **Idempotency**: Must safely handle duplicate `event_id` or `booking_ref` payloads without updating state or metrics twice.

#### Inbound Webhook Payload (From Gateway)

```json
{
  "event_id": "evt_001",
  "payment_id": "pay_xyz",
  "booking_ref": "bk_001",
  "status": "SUCCEEDED",
  "amount": 450
}
```

#### Response (`200 OK`)

```json
{
  "received": true
}
```

---

## 5. OTP Gateway Proxy Domain

### `POST /api/v1/otp/send`

Relays an OTP request to the external mock gateway (`POST /otp/send`).

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
  "message": "OTP request dispatched."
}
```

---

### `POST /api/v1/otp/verify`

Relays OTP verification payload to the external mock gateway (`POST /otp/verify`).

#### Request Body

```json
{
  "ref": "bk_001",
  "code": "123456"
}
```

#### Response (`200 OK` - Valid OTP)

```json
{
  "verified": true
}
```

#### Response (`400 Bad Request` - Invalid OTP)

```json
{
  "verified": false,
  "message": "Invalid verification code."
}
```

---

## 6. Real-Time Broadcast Domain (WebSocket)

### `GET /ws/showtimes/:showtime_id`

Establish an HTTP Upgrade connection to stream seat state mutations in real time.

- **Protocol**: `wss://` or `ws://`
- **Direction**: Read-only Server-to-Client broadcast events.

#### Outbound Event Payload

```json
{
  "event": "SEAT_STATUS_CHANGED",
  "showtime_id": "sh_101",
  "seat_number": "F12",
  "status": "HELD",
  "timestamp": "2026-08-08T09:00:01Z"
}
```

_Possible `status` values_: `AVAILABLE`, `HELD`, `BOOKED`.
