CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

CREATE TABLE showtimes (
    showtime_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_id UUID NOT NULL REFERENCES movies(movie_id) ON DELETE RESTRICT,
    hall_id UUID NOT NULL REFERENCES halls(hall_id) ON DELETE RESTRICT,
    start_time TIMESTAMPTZ NOT NULL,
    price NUMERIC(10, 2) NOT NULL
);
