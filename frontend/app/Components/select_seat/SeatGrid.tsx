import type { SeatRow } from "../../data/selectSeatData";
import { SeatLegend } from "./SeatLegend";

interface SeatGridProps {
  rows: SeatRow[];
  selectedSeatIds: string[];
  onToggleSeat: (seatId: string) => void;
}

export function SeatGrid({ rows, selectedSeatIds, onToggleSeat }: SeatGridProps) {
  return (
    <div className="bg-[#0e0e0e] rounded-2xl p-6 md:p-10 border-t border-white/5 flex flex-col items-center gap-10 relative shadow-2xl w-full">
      {/* Screen Indicator */}
      <div className="w-full max-w-2xl relative flex flex-col items-center">
        <div className="w-full h-12 screen-curve"></div>
        <span className="text-xs font-bold text-[#e9bcb6]/70 uppercase tracking-widest mt-4">
          SCREEN
        </span>
      </div>

      {/* Seating Grid */}
      <div className="flex flex-col gap-3 md:gap-4 w-full max-w-4xl overflow-x-auto pb-4 custom-scrollbar">
        {rows.map((row) => (
          <div
            key={row.rowLabel}
            className={`flex items-center gap-4 min-w-max mx-auto ${
              row.isVip ? "mt-4 pt-4 border-t border-white/10 relative" : ""
            }`}
          >
            {row.isVip && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0e0e0e] px-3 text-[10px] font-bold uppercase tracking-widest text-[#ffe16d]">
                Premium Row
              </span>
            )}

            {/* Row Label Left */}
            <span
              className={`text-xs font-bold w-6 text-center ${
                row.isVip ? "text-[#ffe16d]" : "text-[#e9bcb6]/60"
              }`}
            >
              {row.rowLabel}
            </span>

            {/* Seats Row */}
            <div className="flex gap-2">
              {row.seats.map((seat) => {
                const isSelected = selectedSeatIds.includes(seat.id);
                const isOccupied = seat.status === "occupied";
                const isVip = seat.type === "vip";

                let seatClasses = "seat flex items-center justify-center rounded-t-lg ";
                if (isVip) {
                  seatClasses += "w-10 h-10 seat-vip ";
                } else {
                  seatClasses += "w-8 h-8 ";
                }

                if (isOccupied) {
                  seatClasses += "seat-occupied";
                } else if (isSelected) {
                  seatClasses += "seat-selected";
                } else {
                  seatClasses += "seat-available";
                }

                if (seat.spacerBefore) {
                  seatClasses += " ml-4";
                }

                return (
                  <button
                    key={seat.id}
                    type="button"
                    title={`Seat ${seat.id} (${seat.type === "vip" ? "VIP" : "Standard"}) - $${seat.price}`}
                    disabled={isOccupied}
                    onClick={() => onToggleSeat(seat.id)}
                    className={seatClasses}
                  >
                    <span
                      className={`material-symbols-outlined ${
                        isVip ? "text-[20px]" : "text-[18px]"
                      }`}
                      style={{
                        fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0",
                      }}
                    >
                      chair
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Row Label Right */}
            <span
              className={`text-xs font-bold w-6 text-center ${
                row.isVip ? "text-[#ffe16d]" : "text-[#e9bcb6]/60"
              }`}
            >
              {row.rowLabel}
            </span>
          </div>
        ))}
      </div>

      {/* Seat Legend */}
      <SeatLegend />
    </div>
  );
}
