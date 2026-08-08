-- Enable UUID generator extension (supported natively in Postgres 13+)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define Custom ENUM Types
CREATE TYPE seat_status AS ENUM ('AVAILABLE', 'HELD', 'BOOKED');
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'EXPIRED', 'CANCELLED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- =============================================================================
-- 1. CORE CATALOG ENTITIES (Pre-populated)
-- =============================================================================

CREATE TABLE movies (
    movie_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL,
    poster_url VARCHAR(512)
);

CREATE TABLE theatres (
    theatre_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL
);

CREATE TABLE halls (
    hall_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theatre_id UUID NOT NULL REFERENCES theatres(theatre_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE seats (
    seat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hall_id UUID NOT NULL REFERENCES halls(hall_id) ON DELETE CASCADE,
    row_letter VARCHAR(10) NOT NULL,
    seat_number INT NOT NULL,
    seat_type VARCHAR(50) NOT NULL DEFAULT 'REGULAR',
    CONSTRAINT unique_hall_seat UNIQUE (hall_id, row_letter, seat_number)
);

-- =============================================================================
-- 2. BOOKING & CONCURRENCY ENTITIES (Dynamic State)
-- =============================================================================

CREATE TABLE showtimes (
    showtime_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_id UUID NOT NULL REFERENCES movies(movie_id) ON DELETE RESTRICT,
    hall_id UUID NOT NULL REFERENCES halls(hall_id) ON DELETE RESTRICT,
    start_time TIMESTAMPTZ NOT NULL,
    price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE showtime_seats (
    showtime_seat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    showtime_id UUID NOT NULL REFERENCES showtimes(showtime_id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES seats(seat_id) ON DELETE CASCADE,
    status seat_status NOT NULL DEFAULT 'AVAILABLE',
    held_by_user VARCHAR(255),
    held_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    -- Prevent duplicate entries for the exact same seat in a showtime
    CONSTRAINT unique_showtime_seat UNIQUE (showtime_id, seat_id)
);

CREATE TABLE bookings (
    booking_ref VARCHAR(64) PRIMARY KEY, -- e.g. "bk_001"
    user_phone VARCHAR(30) NOT NULL,
    showtime_id UUID NOT NULL REFERENCES showtimes(showtime_id) ON DELETE RESTRICT,
    status booking_status NOT NULL DEFAULT 'PENDING',
    total_amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE booking_seats (
    booking_seat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_ref VARCHAR(64) NOT NULL REFERENCES bookings(booking_ref) ON DELETE CASCADE,
    showtime_seat_id UUID NOT NULL REFERENCES showtime_seats(showtime_seat_id) ON DELETE CASCADE,
    CONSTRAINT unique_booking_seat UNIQUE (booking_ref, showtime_seat_id)
);

CREATE TABLE payments (
    payment_id VARCHAR(128) PRIMARY KEY, -- returned from /charge call
    booking_ref VARCHAR(64) NOT NULL REFERENCES bookings(booking_ref) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
    status payment_status NOT NULL DEFAULT 'PENDING',
    last_event_id VARCHAR(128) UNIQUE, -- Stores callback event_id to prevent duplicate processing
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- PERFORMANCE & CONCURRENCY INDEXES
-- =============================================================================

-- Optimizes fetching seat map state: GET /showtimes/:id/seats
CREATE INDEX idx_showtime_seats_lookup ON showtime_seats(showtime_id, status);

-- Partial index for fast TTL cleanup workers releasing expired holds (Milestone 4 Scenario B)
CREATE INDEX idx_showtime_seats_expired_holds ON showtime_seats(expires_at) WHERE status = 'HELD';

-- Fast lookup for payments by booking reference
CREATE INDEX idx_payments_booking_ref ON payments(booking_ref);
