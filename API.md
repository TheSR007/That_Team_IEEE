# CinemaSeat API Documentation

This document specifies the REST API endpoints for the CinemaSeat ticketing backend.

---

## Overview

- **Content-Type**: `application/json`
- **Base Path**: `/api/v1`
- **Concurrency Model**: Optimistic/Pessimistic DB locking on PostgreSQL + Redis distributed locking (`HOLD_TTL_SECONDS`) for seat holds.
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
  "status": "UP"
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

### `GET /api/v1/showtimes/:showtime_id`

Retrieves showtime metadata, theatre venue, and seat pricing structure.

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

Fetch live seat matrix and current availability status for a showtime.

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
      "status": "HELD",
      "price": 450
    },
    {
      "showtime_seat_id": "st_seat_002",
      "seat_id": "seat_102",
      "row_letter": "F",
      "seat_number": 13,
      "seat_type": "REGULAR",
      "status": "AVAILABLE",
      "price": 450
    }
  ]
}
```

---

## 3. Seat Reservation Domain

### `POST /api/v1/holds`

Atomically reserve a specific seat for a showtime.

- **Hold TTL**: Duration configured dynamically via the `HOLD_TTL_SECONDS` environment variable.

#### Request Body

```json
{
  "showtime_id": "sh_101",
  "showtime_seat_id": "st_seat_001",
  "user_id": "usr_99"
}
```

#### Response (`201 Created` - Successful Hold)

```json
{
  "hold_id": "st_seat_001",
  "showtime_id": "sh_101",
  "status": "HELD",
  "expires_at": "2026-08-08T09:05:00Z"
}
```

#### Response (`409 Conflict` - Seat Already Held / Booked)

```json
{
  "error": "SEAT_UNAVAILABLE",
  "message": "Seat is already held or booked."
}
```

---

## 4. Booking & Payment Domain

### `POST /api/v1/bookings`

Initiates booking creation for an active seat hold.

- **Non-Blocking Rule**: Returns `202 Accepted` immediately without blocking on gateway completion.

#### Request Body

```json
{
  "hold_id": "st_seat_001",
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
  "expires_at": "2026-08-08T09:05:00Z"
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
  "status": "CONFIRMED",
  "total_amount": 450,
  "created_at": "2026-08-08T09:00:00Z",
  "expires_at": "2026-08-08T09:05:00Z"
}
```

_Possible `status` values_: `PENDING`, `CONFIRMED`, `FAILED`, `EXPIRED`.

---

### `POST /api/v1/payments/callback`

Webhook endpoint registered with the gateway as `callback_url`.

- **Strict Requirement**: Must **always return `200 OK`** regardless of internal logic state or duplicate deliveries.
- **Idempotency**: Safely handles duplicate `event_id` or `booking_ref` payloads.

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
