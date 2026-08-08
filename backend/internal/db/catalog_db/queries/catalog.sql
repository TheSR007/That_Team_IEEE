-- name: ListMovies :many
SELECT movie_id, title, description, duration_minutes, poster_url, rating 
FROM movies 
ORDER BY title ASC;

-- name: GetMovieByID :one
SELECT movie_id, title, description, duration_minutes, poster_url, rating 
FROM movies 
WHERE movie_id = $1;

-- name: GetShowtime :one
SELECT s.showtime_id, s.movie_id, s.hall_id, h.name AS theatre_name, s.start_time, s.price
FROM showtimes s
JOIN halls h ON s.hall_id = h.hall_id
WHERE s.showtime_id = $1;

-- name: ListSeatsByHallID :many
SELECT seat_id, hall_id, row_letter, seat_number, seat_type
FROM seats
WHERE hall_id = $1
ORDER BY row_letter, seat_number;
