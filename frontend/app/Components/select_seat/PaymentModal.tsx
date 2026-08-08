import type { Seat, SelectSeatMovieData } from "../../data/selectSeatData";

interface PaymentModalProps {
  movieData: SelectSeatMovieData;
  selectedSeats: Seat[];
  onClose: () => void;
  onConfirm: () => void;
}

export function PaymentModal({
  movieData,
  selectedSeats,
  onClose,
  onConfirm,
}: PaymentModalProps) {
  const ticketsSubtotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const totalAmount = ticketsSubtotal + movieData.convenienceFee;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#1c1b1b] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-[#e50914] font-bold text-base md:text-lg">
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              confirmation_number
            </span>
            Booking Checkout
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Movie Info */}
        <div className="flex gap-4 items-center bg-[#0e0e0e] p-3 rounded-xl border border-white/5">
          <img
            src={movieData.posterImage}
            alt={movieData.movieTitle}
            className="w-14 h-20 object-cover rounded-lg border border-white/10"
          />
          <div>
            <h3 className="font-extrabold text-[#e5e2e1] text-base">
              {movieData.movieTitle}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {movieData.cinemaVenue} ({movieData.screenName})
            </p>
            <p className="text-xs text-[#e50914] font-bold mt-1">
              Time: {movieData.showtime} | {movieData.format}
            </p>
          </div>
        </div>

        {/* Seats & Price Breakdown */}
        <div className="space-y-2 text-xs text-[#e5e2e1]">
          <div className="flex justify-between items-center py-1">
            <span className="text-gray-400 font-semibold">Selected Seats ({selectedSeats.length}):</span>
            <span className="font-extrabold text-[#ffb4aa]">
              {selectedSeats.map((s) => s.id).join(", ")}
            </span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-gray-400 font-semibold">Seats Subtotal:</span>
            <span className="font-bold">${ticketsSubtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-gray-400 font-semibold">Convenience Fee:</span>
            <span className="font-bold">${movieData.convenienceFee.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-white/10 text-sm">
            <span className="font-extrabold text-[#e5e2e1]">Total Payment:</span>
            <span className="font-extrabold text-lg text-[#e50914]">
              ${totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-gray-300 font-bold hover:bg-white/5 transition-colors uppercase text-xs tracking-wider"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 px-4 rounded-xl bg-[#e50914] hover:bg-[#c0000c] text-white font-bold transition-colors uppercase text-xs tracking-wider shadow-lg glow-hover"
          >
            Confirm & Pay
          </button>
        </div>
      </div>
    </div>
  );
}
