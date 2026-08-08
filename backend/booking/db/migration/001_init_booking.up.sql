CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE seat_status AS ENUM ('AVAILABLE', 'HELD', 'BOOKED');
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'EXPIRED', 'CANCELLED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

CREATE TABLE showtime_seats (
    showtime_seat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    showtime_id UUID NOT NULL, -- Logical ref to catalog_db.showtimes
    seat_id UUID NOT NULL,     -- Logical ref to catalog_db.seats
    status seat_status NOT NULL DEFAULT 'AVAILABLE',
    held_by_user VARCHAR(255),
    held_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    CONSTRAINT unique_showtime_seat UNIQUE (showtime_id, seat_id)
);

CREATE TABLE bookings (
    booking_ref VARCHAR(64) PRIMARY KEY,
    user_phone VARCHAR(30) NOT NULL,
    showtime_id UUID NOT NULL, -- Logical ref to catalog_db.showtimes
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
    payment_id VARCHAR(128) PRIMARY KEY,
    booking_ref VARCHAR(64) NOT NULL REFERENCES bookings(booking_ref) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
    status payment_status NOT NULL DEFAULT 'PENDING',
    last_event_id VARCHAR(128) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_showtime_seats_lookup ON showtime_seats(showtime_id, status);
CREATE INDEX idx_showtime_seats_expired_holds ON showtime_seats(expires_at) WHERE status = 'HELD';
CREATE INDEX idx_payments_booking_ref ON payments(booking_ref);
