-- name: HoldSeatAtomic :one
UPDATE showtime_seats
SET 
    status = 'HELD',
    held_by_user = $1,
    held_at = NOW(),
    expires_at = NOW() + ($2::int || ' seconds')::INTERVAL
WHERE showtime_seat_id = $3
  AND (status = 'AVAILABLE' OR (status = 'HELD' AND expires_at < NOW()))
RETURNING showtime_seat_id, showtime_id, seat_id, status, held_by_user, held_at, expires_at;

-- name: CreateBooking :one
INSERT INTO bookings (booking_ref, user_email, showtime_id, status, total_amount, expires_at)
VALUES ($1, $2, $3, 'PENDING', $4, $5)
RETURNING booking_ref, user_email, showtime_id, status, total_amount, created_at, expires_at;

-- name: LinkBookingSeat :one
INSERT INTO booking_seats (booking_ref, showtime_seat_id)
VALUES ($1, $2)
RETURNING booking_seat_id, booking_ref, showtime_seat_id;

-- name: GetBookingByRef :one
SELECT booking_ref, user_email, showtime_id, status, total_amount, created_at, expires_at
FROM bookings
WHERE booking_ref = $1;

-- name: GetShowtimeSeatStates :many
SELECT showtime_seat_id, showtime_id, seat_id, status, held_by_user, held_at, expires_at
FROM showtime_seats
WHERE showtime_id = $1;

-- name: SweepExpiredHolds :many
UPDATE showtime_seats
SET 
    status = 'AVAILABLE',
    held_by_user = NULL,
    held_at = NULL,
    expires_at = NULL
WHERE status = 'HELD' AND expires_at < NOW()
RETURNING showtime_seat_id, showtime_id, seat_id, status;

-- name: RecordPaymentCallback :one
INSERT INTO payments (payment_id, booking_ref, amount, currency, status, last_event_id)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (last_event_id) DO NOTHING
RETURNING payment_id, booking_ref, amount, currency, status, last_event_id, created_at, updated_at;

-- name: UpdateBookingStatus :one
UPDATE bookings
SET status = $1
WHERE booking_ref = $2
RETURNING booking_ref, user_email, showtime_id, status, total_amount, created_at, expires_at;

-- name: ConfirmShowtimeSeats :exec
UPDATE showtime_seats
SET status = 'BOOKED'
WHERE showtime_seat_id IN (
    SELECT showtime_seat_id FROM booking_seats WHERE booking_ref = $1
);

-- name: GetPaymentByBookingRef :one
SELECT payment_id, booking_ref, amount, currency, status, last_event_id, created_at, updated_at
FROM payments
WHERE booking_ref = $1
ORDER BY created_at DESC
LIMIT 1;

-- name: ReleaseShowtimeSeats :exec
UPDATE showtime_seats
SET status = 'AVAILABLE',
    held_by_user = NULL,
    held_at = NULL,
    expires_at = NULL
WHERE showtime_seat_id IN (
    SELECT showtime_seat_id FROM booking_seats WHERE booking_ref = $1
);
