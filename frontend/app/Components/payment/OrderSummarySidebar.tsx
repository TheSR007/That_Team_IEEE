import type { PaymentPageData } from "../../data/paymentData";
import { SeatHoldTimer } from "./SeatHoldTimer";

interface OrderSummarySidebarProps {
  data: PaymentPageData;
  onPayNow: () => void;
  isProcessing?: boolean;
}

export function OrderSummarySidebar({
  data,
  onPayNow,
  isProcessing = false,
}: OrderSummarySidebarProps) {
  return (
    <aside className="w-full flex flex-col">
      <div className="bg-[#1c1b1b] rounded-2xl p-6 border border-white/10 shadow-2xl relative overflow-hidden lg:sticky lg:top-24">
        {/* Seat Hold Timer */}
        <SeatHoldTimer initialSeconds={data.holdTimerInitialSeconds} />

        <h3 className="font-extrabold text-xl text-[#e5e2e1] mb-5">Order Summary</h3>

        {/* Movie Info Card */}
        <div className="flex gap-4 mb-5 items-center">
          <div className="w-20 h-28 rounded-xl bg-[#0e0e0e] overflow-hidden shrink-0 border border-white/10 shadow-md">
            <img
              src={data.posterImage}
              alt={data.movieTitle}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h4 className="font-extrabold text-lg text-white leading-tight mb-1.5">
              {data.movieTitle}
            </h4>
            <span className="inline-block bg-[#353534] text-[#e9bcb6] font-extrabold text-[11px] px-2.5 py-0.5 rounded text-xs w-fit border border-white/5">
              {data.format}
            </span>
          </div>
        </div>

        {/* Details Breakdown */}
        <ul className="space-y-3 mb-6 border-y border-white/10 py-4 text-xs md:text-sm text-gray-300">
          <li className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-base text-[#e50914]">
              calendar_today
            </span>
            <span>
              {data.date}, {data.showtime}
            </span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-base text-[#e50914]">
              location_on
            </span>
            <span>
              {data.cinemaVenue}, {data.screenName}
            </span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-base text-[#e50914]">
              event_seat
            </span>
            <span>
              Seats:{" "}
              <strong className="text-[#ffb4aa]">
                {data.seats.join(", ")}
              </strong>
            </span>
          </li>
        </ul>

        {/* Pricing Calculation */}
        <div className="space-y-2 mb-6 text-xs text-gray-400">
          <div className="flex justify-between">
            <span>Tickets ({data.seats.length})</span>
            <span className="text-gray-200 font-semibold">
              ${data.ticketsSubtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Convenience Fee</span>
            <span className="text-gray-200 font-semibold">
              ${data.convenienceFee.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-end pt-3 border-t border-white/10">
            <span className="font-bold text-sm text-[#e5e2e1]">Total Amount</span>
            <span className="font-extrabold text-2xl text-[#ffdb3c]">
              ${data.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onPayNow}
          disabled={isProcessing}
          className="w-full bg-[#e50914] text-white font-extrabold uppercase py-4 rounded-xl hover:bg-[#c0000c] transition-all shadow-lg hover:shadow-[0_0_25px_rgba(229,9,20,0.4)] flex items-center justify-center gap-2 text-sm tracking-wider cursor-pointer disabled:opacity-50"
        >
          <span
            className="material-symbols-outlined text-lg"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            lock
          </span>
          {isProcessing ? "Processing..." : "Pay Now"}
        </button>

        {/* Security badge */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-gray-400 text-xs">
          <span className="material-symbols-outlined text-sm text-emerald-400">
            verified_user
          </span>
          <span>Payments are 256-bit SSL encrypted</span>
        </div>
      </div>
    </aside>
  );
}
