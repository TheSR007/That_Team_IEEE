import { useParams, Link, useNavigate } from "react-router";
import { useState, useMemo } from "react";
import { getSeatDataByMovieId, type Seat } from "../data/selectSeatData";
import { SeatNavBar } from "../Components/select_seat/SeatNavBar";
import { ProgressTracker } from "../Components/select_seat/ProgressTracker";
import { MovieSummaryBanner } from "../Components/select_seat/MovieSummaryBanner";
import { SeatGrid } from "../Components/select_seat/SeatGrid";
import { OrderSummary } from "../Components/select_seat/OrderSummary";
import { PaymentModal } from "../Components/select_seat/PaymentModal";
import { SeatFooter } from "../Components/select_seat/SeatFooter";

export default function SelectSeatPage() {
  const params = useParams();
  const navigate = useNavigate();
  const movieId = params.movie_id || "neon-odyssey";
  const movieData = getSeatDataByMovieId(movieId);

  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>(
    movieData.initialSelectedSeatIds
  );
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSuccessAlert, setIsSuccessAlert] = useState(false);

  // Map selected IDs to Seat objects
  const selectedSeats = useMemo(() => {
    const seatMap = new Map<string, Seat>();
    for (const row of movieData.rows) {
      for (const seat of row.seats) {
        seatMap.set(seat.id, seat);
      }
    }
    return selectedSeatIds
      .map((id) => seatMap.get(id))
      .filter((seat): seat is Seat => seat !== undefined);
  }, [movieData, selectedSeatIds]);

  const handleToggleSeat = (seatId: string) => {
    setSelectedSeatIds((prev) =>
      prev.includes(seatId)
        ? prev.filter((id) => id !== seatId)
        : [...prev, seatId]
    );
  };

  const handleConfirmPayment = () => {
    setIsPaymentModalOpen(false);
    const seatsParam = selectedSeatIds.length > 0 ? selectedSeatIds.join(",") : "C5,C6";
    navigate(`/payment/${movieData.movieId}/${seatsParam}`);
  };

  if (!movieData) {
    return (
      <div className="min-h-screen bg-[#131313] text-[#e5e2e1] flex flex-col items-center justify-center p-6 text-center font-sans">
        <SeatNavBar />
        <span className="material-symbols-outlined text-6xl text-[#e50914] mb-4">
          event_seat
        </span>
        <h1 className="text-3xl font-bold mb-2">Movie Seating Not Found</h1>
        <p className="text-gray-400 max-w-md mb-6">
          We couldn't load seat information for "{movieId}".
        </p>
        <Link
          to="/browse"
          className="bg-[#e50914] text-white px-6 py-3 rounded-lg font-bold uppercase text-sm hover:bg-[#c0000c] transition-colors"
        >
          Return to Browse
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#131313] text-[#e5e2e1] min-h-screen flex flex-col font-sans overflow-x-hidden selection:bg-[#e50914] selection:text-white">
      {/* Top Navbar */}
      <SeatNavBar movieId={movieData.movieId} />

      {/* Success Notification Banner */}
      {isSuccessAlert && (
        <div className="bg-[#e50914] text-white py-3 px-6 text-center font-bold text-sm shadow-lg flex items-center justify-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined">check_circle</span>
          Seats booked successfully for {movieData.movieTitle}! Enjoy your movie!
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col lg:flex-row px-4 md:px-16 py-6 gap-6 max-w-[1600px] mx-auto w-full">
        {/* Left/Main Column: Progress, Banner, and Seat Grid */}
        <div className="flex-grow flex flex-col gap-8">
          {/* Progress Tracker */}
          <ProgressTracker />

          {/* Movie Summary Banner */}
          <MovieSummaryBanner
            title={movieData.movieTitle}
            posterImage={movieData.posterImage}
            bgOverlayImage={movieData.bgOverlayImage}
            showtime={movieData.showtime}
            cinemaVenue={movieData.cinemaVenue}
            screenName={movieData.screenName}
            format={movieData.format}
          />

          {/* Interactive Seat Map */}
          <SeatGrid
            rows={movieData.rows}
            selectedSeatIds={selectedSeatIds}
            onToggleSeat={handleToggleSeat}
          />
        </div>

        {/* Right Sidebar: Order Summary */}
        <OrderSummary
          selectedSeats={selectedSeats}
          convenienceFee={movieData.convenienceFee}
          onProceedToPayment={() => setIsPaymentModalOpen(true)}
        />
      </main>

      {/* Footer */}
      <SeatFooter />

      {/* Booking Checkout Modal */}
      {isPaymentModalOpen && (
        <PaymentModal
          movieData={movieData}
          selectedSeats={selectedSeats}
          onClose={() => setIsPaymentModalOpen(false)}
          onConfirm={handleConfirmPayment}
        />
      )}
    </div>
  );
}
