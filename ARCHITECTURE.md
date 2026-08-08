Here are the Mermaid.js system architecture and data flow diagrams for your Go Modular Monolith solution, formatted for direct inclusion in your `README.md` or architecture documentation.

---

## High-Level System Architecture

```mermaid
flowchart TD
    subgraph Clients["Clients and Test Harness"]
        UI["Web Frontend SPA"]
        K6["k6 Load Generator"]
    end

    subgraph Edge["Edge Layer"]
        NGINX["Nginx Reverse Proxy"]
    end

    subgraph Monolith["Go Modular Monolith Container"]
        Router["HTTP and WS Router"]
        Catalog["Catalog Module<br/>(Movies and Showtimes)"]
        HoldEng["Hold and Reservation Engine<br/>(Atomic DB Locks)"]
        PayMod["Payment and Webhook Processor<br/>(Idempotent)"]
        OTPMod["OTP Proxy Module"]
        WSHub["WebSocket Broadcast Hub"]
        Worker["Hold Expiration Sweeper"]
    end

    subgraph Storage["Persistence Layer"]
        DB[(PostgreSQL Database)]
    end

    subgraph Gateway["External Dependency"]
        MockGW["Mock Gateway Container<br/>(Port 9000)"]
    end

    UI -->|HTTP / WS| NGINX
    K6 -->|HTTP Requests| NGINX
    NGINX -->|Proxy Traffic| Router

    Router --> Catalog
    Router --> HoldEng
    Router --> PayMod
    Router --> OTPMod
    Router --> WSHub

    Catalog -->|Read| DB
    HoldEng -->|Atomic UPDATE| DB
    PayMod -->|Record Booking| DB
    Worker -->|Sweep Expired Holds| DB

    HoldEng -.->|Event Broadcast| WSHub
    PayMod -.->|Event Broadcast| WSHub
    Worker -.->|Event Broadcast| WSHub

    PayMod -->|1. Async POST /charge| MockGW[cite: 1]
    OTPMod -->|POST /otp/send and /verify| MockGW[cite: 1]
    MockGW -.->|2. Async Callback POST /callback| PayMod[cite: 1]
```

---

## Detailed Data Flow Sequences

### 1. Atomic Seat Hold Flow (Scenario A: 100 Concurrent Requests)

```mermaid
sequenceDiagram
    autonumber
    actor User as User / k6 Script
    participant API as Go REST API
    participant DB as PostgreSQL
    participant WS as WebSocket Hub

    User->>API: POST /api/v1/holds { showtime_id, seat_number: "F12" }
    Note over API,DB: Executes Atomic Single-Query Transaction
    API->>DB: UPDATE seats SET status = 'HELD' WHERE status = 'AVAILABLE'

    alt Seat Was Available (Rows Affected == 1)
        DB-->>API: 1 Row Updated
        API->>DB: INSERT INTO seat_holds (expires_at = NOW() + HOLD_TTL_SECONDS)
        API-->>User: 201 Created { hold_id, expires_at }
        API->>WS: Broadcast Event: "SEAT_STATUS_CHANGED (F12: HELD)"
    else Seat Already Held/Booked (Rows Affected == 0)
        DB-->>API: 0 Rows Updated
        API-->>User: 409 Conflict { error: "SEAT_UNAVAILABLE" }
    end

```

---

## Architectural Breakdown & Security Isolation

### 1. Nginx Reverse Proxy

- Exposes a single unified entrypoint on port `80`.

- Routes REST traffic (`/api/v1/*`) and proxies WebSocket connections (`/ws/*`) with `Upgrade` and `Connection` HTTP headers.

### 2. Go Monolith Internal Domains

- **Catalog Module**: Serves static movie, showtime, and seat map queries directly from PostgreSQL read queries.

- **Hold Engine**: Enforces atomic state transitions using single `UPDATE ... WHERE status = 'AVAILABLE'` statements. This guarantees zero oversell when multiple threads compete for seat `F12`.

- **Payment & Webhook Processor**:
- Calls `POST /charge` on the gateway asynchronously without blocking the user request.

- Listens on `POST /api/v1/payments/callback` for gateway webhooks. Processes payload inside a DB transaction and logs the `event_id` into `webhook_events` to ignore duplicate deliveries. Always returns `200 OK`.

- **Hold Expiration Sweeper**: A background Go goroutine running on a ticker interval (e.g., every 1 second) that executes:

```sql
UPDATE seats
SET status = 'AVAILABLE'
WHERE status = 'HELD' AND id IN (
    SELECT hold_id FROM seat_holds WHERE expires_at < NOW()
);

```

### 3. Fault Isolation Guarantee

- If the `mock-gateway` container stops, crashes, or returns `500` errors, the Go Monolith catches the network transport error.

- Catalog browsing, seat map queries, seat holding, and the `/health` endpoint continue executing cleanly without dependency on the gateway.
