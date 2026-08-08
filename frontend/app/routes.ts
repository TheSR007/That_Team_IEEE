import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("signup", "routes/signup.tsx"),
  route("signin", "routes/signin.tsx"),
  route("browse", "routes/browse.tsx"),
  route("movie/:movie_id", "routes/movie.tsx"),
  route("select_seat/:movie_id", "routes/select_seat.tsx"),
  route("payment/:movie_id/:seat_id", "routes/payment.tsx"),
] satisfies RouteConfig;
