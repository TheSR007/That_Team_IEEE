import type { Seat } from "../../data/selectSeatData";

interface OrderSummaryProps {
  selectedSeats: Seat[];
  convenienceFee: number;
  onProceedToPayment: () => void;
}

export function OrderSummary({
  selectedSeats,
  convenienceFee,
  onProceedToPayment,
}: OrderSummaryProps) {
  const ticketsCount = selectedSeats.length;
  const ticketsSubtotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const totalAmount = ticketsCount > 0 ? ticketsSubtotal + convenienceFee : 0;

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6 lg:sticky lg:top-[90px] h-fit">
      <div className="bg-[#1c1b1b] rounded-2xl p-6 border-t border-white/10 shadow-xl flex flex-col gap-6 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#e50914]/10 rounded-full blur-3xl pointer-events-none"></div>

        <h2 className="font-headline-md text-xl font-bold text-[#e5e2e1]">
          Order Summary
        </h2>

        <div className="flex flex-col gap-3">
          {/* Tickets Subtotal */}
          <div className="flex justify-between items-center py-2 border-b border-white/5 text-sm">
            <span className="text-gray-400">Tickets ({ticketsCount})</span>
            <span className="font-bold text-[#e5e2e1]">${ticketsSubtotal.toFixed(2)}</span>
          </div>

          {/* Selected Seats Badges */}
          <div className="bg-[#353534]/40 p-3 rounded-xl flex flex-col gap-2 mt-1 border border-white/5">
            <span className="text-[11px] font-bold text-[#e9bcb6] uppercase tracking-wider">
              Selected Seats
            </span>
            {selectedSeats.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedSeats.map((seat) => (
                  <span
                    key={seat.id}
                    className={`px-2.5 py-1 rounded text-xs font-extrabold border ${
                      seat.type === "vip"
                        ? "bg-[#ffe16d]/20 text-[#ffe16d] border-[#ffe16d]/40"
                        : "bg-[#e50914]/20 text-[#ffb4aa] border-[#e50914]/40"
                    }`}
                  >
                    {seat.id} {seat.type === "vip" ? "(VIP)" : ""}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-gray-500 italic">No seats selected</span>
            )}
          </div>

          {/* Convenience Fee */}
          <div className="flex justify-between items-center py-2 border-b border-white/5 text-sm">
            <span className="text-gray-400">Convenience Fee</span>
            <span className="font-bold text-[#e5e2e1]">
              ${ticketsCount > 0 ? convenienceFee.toFixed(2) : "0.00"}
            </span>
          </div>

          {/* Total Price */}
          <div className="flex justify-between items-center pt-3 mt-1">
            <span className="font-headline-md text-lg font-bold text-[#e5e2e1]">
              Total
            </span>
            <span className="font-headline-md text-2xl font-extrabold text-[#e50914]">
              ${totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          disabled={ticketsCount === 0}
          onClick={onProceedToPayment}
          className={`w-full uppercase font-bold py-4 rounded-xl mt-2 transition-all flex items-center justify-center gap-2 group text-xs tracking-wider ${
            ticketsCount > 0
              ? "bg-[#e50914] text-white hover:bg-[#c0000c] hover:shadow-[0_0_25px_rgba(229,9,20,0.4)] cursor-pointer"
              : "bg-[#353534] text-gray-500 cursor-not-allowed opacity-60"
          }`}
        >
          Proceed to Payment
          <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>
      </div>
    </aside>
  );
}
