
# CinemaSeat Hackathon Problem Statement

## Problem Context & Overview

* **Event**: Zero to Production - Phase 2 (The Ultimate Hackathon).
* **Core Issue**: High-demand movie ticket launches create severe traffic spikes. Standard systems crash or experience race conditions leading to missing OTPs, payment failures, ghost seats, or double-selling the same seat to multiple buyers.
* **Primary Objective**: Build a scalable, highly reliable movie ticket booking system that remains functional under intense concurrent traffic and **never double-books a seat**.
---
## Technical & System Requirements

### 1. Functional Scope

* Allow users to browse movies, showtimes, and theatres.


* Display live seat maps for specific showtimes.
* Process seat holds, OTP verifications, payment checkouts, and booking confirmations.
* Automatically expire and release held seats back to the available pool if payment is not finished within `HOLD_TTL_SECONDS`.
* Handle heavy concurrent demand without race conditions or overselling.
* Integrate directly with the provided mock payment and OTP gateway container.
* Expose a minimal frontend with a single base URL.
* Pre-populate database tables with movies, halls, showtimes, seats, and prices (no admin portal required).
## Unreliable Gateway Specifications

### Docker Setup

```yaml
gateway:
  image: asifmahmoud414/mock-gateway:latest
  ports: ["9000:9000"]
```[cite: 1]

### API Endpoints
* `POST /charge` -> Payload: `{ amount, currency, booking_ref, callback_url }` | Response: `202 { payment_id, status: "PENDING" }`[cite: 1]
* `POST /refund` -> Payload: `{ payment_id }` | Response: `202 { status: "PENDING" }`[cite: 1]
* `POST /otp/send` -> Payload: `{ phone, ref }` | Response: `202`[cite: 1]
* `POST /otp/verify` -> Payload: `{ ref, code }` | Response: `200` or `400`[cite: 1]
* `GET /health` -> Response: `200`[cite: 1]

### Asynchronous Callback Format
The gateway sends asynchronous webhooks to your supplied `callback_url`:
```json
{ 
  "event_id": "evt_001", 
  "payment_id": "pay_xyz",
  "booking_ref": "bk_001", 
  "status": "SUCCEEDED", 
  "amount": 450 
}
```[cite: 1]
*(Where `status` is one of `SUCCEEDED`, `FAILED`, or `REFUNDED`)*[cite: 1].

### Built-in Gateway Behaviors (Design For These)
* **Callback Delay**: Always delayed by 2 to 15 seconds[cite: 1].
* **Payment Failures**: 10% of payments report `FAILED`[cite: 1].
* **Duplicate Webhooks**: 8% of callbacks are sent twice[cite: 1].
* **Gateway Timeouts**: 2% of `/charge` calls return HTTP 500 or time out[cite: 1].
* **OTP Delays**: 10% of OTPs are delayed or lost[cite: 1].

### Testing Control Headers (Sent on `/charge`)
* `X-Mock-Mode: deterministic` (2s delay, 100% success, no duplicates)[cite: 1].
* `X-Mock-Force: fail` (Forces failed payment status)[cite: 1].
* `X-Mock-Force: duplicate` (Forces duplicate callback)[cite: 1].
* `X-Mock-Force: timeout` (Forces `/charge` HTTP timeout)[cite: 1].
* `X-Mock-Force: race` (Forces callback to arrive before `/charge` returns)[cite: 1].
* `X-Mock-Force: success` (Forces clean success)[cite: 1].

---

## Non-Negotiable Judging Hooks & Rules

1. **Non-Blocking Checkout**: `/pay` handlers must execute asynchronously without waiting on gateway callbacks[cite: 1].
2. **Idempotent Webhooks**: Callback endpoints must always return HTTP `200` (even for duplicate events) and ensure duplicate events never create extra bookings or double-count revenue[cite: 1].
3. **Health Check**: `GET /health` must return `200` in under 1 second, even when the payment gateway is down[cite: 1].
4. **Dynamic TTL**: `HOLD_TTL_SECONDS` must be dynamically read from environment variables[cite: 1].
5. **Zero-Setup Spinup**: `docker compose up` must build and launch the complete stack from a clean repository clone without manual intervention[cite: 1].

---

## Core Milestones & Proof Requirements

### Milestone 1: Architecture & Design
* Clear service boundaries, concurrency strategy, database models, and API definitions[cite: 1].

### Milestone 2: Implementation & Containerization
* Full backend core logic, unit tests for race conditions/duplicates, Docker setup, and frontend integration[cite: 1].

### Milestone 3: CI/CD Pipeline
* GitHub Actions pipeline executing PR checks and automatic deployment to VM/AWS[cite: 1].

### Milestone 4: Verification Scenarios
* **Scenario A (1 Seat, 100 Buyers)**: Fire 100 simultaneous requests at 1 exact seat[cite: 1]. Exactly 1 request succeeds, 99 fail, and oversell count must be 0[cite: 1].
* **Scenario B (Abandoned Hold)**: Reserve a seat without paying[cite: 1]. Demonstrate that seat status automatically reverts to available upon expiry[cite: 1].
* **Scenario C (Breakpoint - Bonus)**: Conduct load testing from an external machine to identify system bottlenecks[cite: 1].

---

## Required Deliverables
1. **Source Code**: Pushed to a public GitHub repository[cite: 1].
2. **`README.md`**: Architecture diagram, local setup instructions (`docker compose up`), deployed production URL, and exact API schemas for seat holds and map fetching[cite: 1].
3. **`DECISIONS.md`**: Detailed documentation of 3 technical choices/trade-offs debated by the team[cite: 1].

```