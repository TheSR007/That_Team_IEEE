import { Link } from "react-router";
import type { PaymentPageData } from "../../data/paymentData";

interface PaymentSuccessModalProps {
  data: PaymentPageData;
  bookingRef: string;
  onClose: () => void;
}

export function PaymentSuccessModal({
  data,
  bookingRef,
  onClose,
}: PaymentSuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#1c1b1b] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-center relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#e50914]/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Icon */}
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-3xl">
          <span className="material-symbols-outlined text-4xl">check_circle</span>
        </div>

        <h3 className="font-extrabold text-2xl text-white">Payment Successful!</h3>
        <p className="text-xs text-gray-400">
          Your movie tickets have been confirmed and sent to your email.
        </p>

        {/* Booking Reference Code Box */}
        <div className="bg-[#050505] p-4 rounded-xl border border-white/10 space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            Booking Reference
          </span>
          <div className="text-xl font-mono font-extrabold text-[#ffdb3c] tracking-widest">
            {bookingRef}
          </div>
        </div>

        {/* Ticket Summary */}
        <div className="bg-[#131313] p-4 rounded-xl text-left border border-white/5 text-xs space-y-2">
          <div className="flex justify-between text-gray-300">
            <span className="text-gray-400">Movie:</span>
            <span className="font-bold text-white">{data.movieTitle}</span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span className="text-gray-400">Screen & Venue:</span>
            <span>
              {data.cinemaVenue} ({data.screenName})
            </span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span className="text-gray-400">Date & Showtime:</span>
            <span>
              {data.date}, {data.showtime}
            </span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span className="text-gray-400">Confirmed Seats:</span>
            <span className="font-extrabold text-[#ffb4aa]">
              {data.seats.join(", ")}
            </span>
          </div>
          <div className="flex justify-between text-gray-300 pt-2 border-t border-white/10">
            <span className="font-bold text-white">Total Paid:</span>
            <span className="font-extrabold text-emerald-400 text-sm">
              ${data.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex gap-3">
          <Link
            to="/browse"
            className="flex-1 py-3.5 px-4 rounded-xl bg-[#e50914] hover:bg-[#c0000c] text-white font-extrabold transition-all uppercase text-xs tracking-wider shadow-lg glow-hover"
          >
            Back to Movies
          </Link>
        </div>
      </div>
    </div>
  );
}
