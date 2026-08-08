import { moviesData } from "./moviesData";
import { getMovieById } from "./movieDetailsData";

export type PaymentMethodType = "card" | "wallet" | "gift";

export interface PaymentPageData {
  movieId: string;
  movieTitle: string;
  posterImage: string;
  format: string;
  showtime: string;
  date: string;
  cinemaVenue: string;
  screenName: string;
  seats: string[];
  ticketPricePerSeat: number;
  ticketsSubtotal: number;
  convenienceFee: number;
  totalAmount: number;
  holdTimerInitialSeconds: number;
}

export const defaultStitchPaymentData: PaymentPageData = {
  movieId: "neon-odyssey",
  movieTitle: "Neon Odyssey",
  posterImage:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDcRywzHmojfGqukErKFIHH15sPpe4tts1PpUQ0gjbGYLmQ0cSDdu9_7-TeHEqfq5pZIYt-GUSbplPH9ym2ZoFlA39SAjn9x0d23DbPTXZUyXFAtJG2HYrBDKbPwpYYxdKU3M-qwwSgpuvf4q0g-gMV2SkdlRsccMntK4Mjb1_CXVtAxqC5M4WruSVLTQgiyCymqR8WHxTvJFxky6qlim5GpjjnzKwiMzXaIFcwzur_T9GZdOI_1F_fPw",
  format: "IMAX 3D",
  showtime: "21:00",
  date: "22 Nov",
  cinemaVenue: "Starlight Grand",
  screenName: "Screen 4",
  seats: ["C5", "C6"],
  ticketPricePerSeat: 12.0,
  ticketsSubtotal: 24.0,
  convenienceFee: 3.0,
  totalAmount: 27.0,
  holdTimerInitialSeconds: 599, // 09:59
};

export function getPaymentDataByMovieAndSeat(
  movieId?: string,
  seatIdParam?: string
): PaymentPageData {
  const targetMovieId = movieId || "neon-odyssey";
  const movieDetails = getMovieById(targetMovieId) || moviesData.find((m) => m.id === targetMovieId);

  // Parse seat IDs from string parameter e.g. "C5,C6" or "C5-C6" or "C5"
  let parsedSeats: string[] = [];
  if (seatIdParam) {
    parsedSeats = seatIdParam
      .split(/[,_-]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
  }

  if (parsedSeats.length === 0) {
    parsedSeats = defaultStitchPaymentData.seats;
  }

  const movieTitle = movieDetails ? movieDetails.title : defaultStitchPaymentData.movieTitle;
  const posterImage = movieDetails ? movieDetails.image : defaultStitchPaymentData.posterImage;
  const format = movieDetails?.badge || defaultStitchPaymentData.format;
  const showtime = movieDetails?.showtimes?.[0] || defaultStitchPaymentData.showtime;
  const cinemaVenue = movieDetails?.cinemas?.[0] || defaultStitchPaymentData.cinemaVenue;

  const ticketPrice = 12.0; // standard base seat price
  const ticketsSubtotal = parsedSeats.length * ticketPrice;
  const convenienceFee = defaultStitchPaymentData.convenienceFee;
  const totalAmount = ticketsSubtotal + convenienceFee;

  return {
    movieId: targetMovieId,
    movieTitle,
    posterImage,
    format,
    showtime,
    date: defaultStitchPaymentData.date,
    cinemaVenue,
    screenName: defaultStitchPaymentData.screenName,
    seats: parsedSeats,
    ticketPricePerSeat: ticketPrice,
    ticketsSubtotal,
    convenienceFee,
    totalAmount,
    holdTimerInitialSeconds: defaultStitchPaymentData.holdTimerInitialSeconds,
  };
}
