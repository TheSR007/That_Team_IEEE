# System Architecture

## High-Level Microservice Architecture

```mermaid
flowchart TD
    subgraph Clients["Clients and Test Harness"]
        UI["Web Frontend / SPA"]
        K6["k6 Load Generator / Judge Scripts"]
    end

    subgraph Proxy["Edge / Gateway Layer"]
        NGINX["Nginx HTTP Proxy<br/>(Port 8080)"]
    end

    subgraph Services["gRPC Microservices"]
        Catalog["Catalog Service<br/>(gRPC Port 50051)"]
        Booking["Booking Service<br/>(gRPC Port 50052)"]
        Payment["Payment Service<br/>(gRPC Port 50053)"]
        OTP["OTP Service<br/>(gRPC Port 50054)"]
    end

    subgraph Storage["Persistence & External Dependencies"]
        PG[(PostgreSQL)]
        REDIS[(Redis Cache & Locks)]
        MOCKGW["Mock Gateway<br/>(Port 9000)"]
    end

    UI -->|HTTP REST / JSON| NGINX
    K6 -->|HTTP REST / JSON| NGINX

    NGINX -->|gRPC| Catalog
    NGINX -->|gRPC| Booking
    NGINX -->|gRPC| Payment
    NGINX -->|gRPC| OTP

    Catalog --> PG
    Booking --> PG
    Booking --> REDIS
    Payment --> PG
    Payment --> REDIS
    Payment --> MOCKGW
    OTP --> REDIS
    OTP --> MOCKGW
```

---

## Topology Diagram

```
                                [ External Clients / Frontend / Judge Scripts ]
                                                       │
                                                       │ (HTTP REST / JSON)
                                                       ▼
                                            ┌─────────────────────┐
                                            │        nginx        │ (HTTP - Port 8080)
                                            └──────────┬──────────┘
                                                       │
                     ┌───────────────────┬─────────────┴─────┬───────────────────┐
                     │ (gRPC)            │ (gRPC)            │ (gRPC)            │ (gRPC)
                     ▼                   ▼                   ▼                   ▼
           ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
           │ Catalog Service │ │ Booking Service │ │ Payment Service │ │   OTP Service   │
           │  (gRPC 50051)   │ │  (gRPC 50052)   │ │  (gRPC 50053)   │ │  (gRPC 50054)   │
           └────────┬────────┘ └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
                    │                   │                   │                   │
                    └─────────┬─────────┴───────────┬───────┴───────────────────│
                              ▼                     ▼                           ▼
                       ┌──────────────┐      ┌──────────────┐            ┌──────────────┐
                       │  PostgreSQL  │      │    Redis     │            │ Mock Gateway │
                       └──────────────┘      └──────────────┘            └──────────────┘
```

---

## Service Specifications

### 1. Reverse Proxy / Gateway Layer
- **Nginx HTTP Entrypoint (Port 8080)**: Receives external HTTP REST requests (JSON payloads) from frontends and judge scripts. Translates and routes calls to specific internal microservices over gRPC protocol.

### 2. Microservice Layer (gRPC Decoupled)
- **Catalog Service (`gRPC 50051`)**: Manages movie listings, showtime details, and seat map queries. Connects directly to PostgreSQL.
- **Booking Service (`gRPC 50052`)**: Handles seat reservations and hold logic. Uses Redis (`SETNX`) for atomic distributed locking and PostgreSQL for persistent booking records.
- **Payment Service (`gRPC 50053`)**: Manages transaction charges, idempotency check via Redis, and callback webhooks. Interacts with PostgreSQL, Redis, and Mock Gateway.
- **OTP Service (`gRPC 50054`)**: Handles OTP generation, verification, and dispatch via Mock Gateway and Redis.

### 3. Data & External Layer
- **PostgreSQL**: Primary relational storage for movies, showtimes, seats, holds, and bookings.
- **Redis**: Fast key-value store for atomic locks (`HOLD_TTL_SECONDS`), seatmap caching, and idempotency deduplication.
- **Mock Gateway (Port 9000)**: External gateway dependency providing payment processing (`/charge`) and OTP delivery (`/otp/send`, `/otp/verify`).
