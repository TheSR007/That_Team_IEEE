export function SeatLegend() {
  return (
    <div className="flex flex-wrap justify-center gap-6 mt-2 pt-6 border-t border-white/5 w-full text-xs font-semibold text-gray-300">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-t-md seat-available flex items-center justify-center">
          <span className="material-symbols-outlined text-[12px]">chair</span>
        </div>
        <span>Available</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-t-md seat-selected flex items-center justify-center">
          <span
            className="material-symbols-outlined text-[12px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            chair
          </span>
        </div>
        <span>Selected</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-t-md seat-occupied flex items-center justify-center">
          <span className="material-symbols-outlined text-[12px]">chair</span>
        </div>
        <span>Occupied</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-t-md seat-vip seat-available flex items-center justify-center">
          <span className="material-symbols-outlined text-[12px]">chair</span>
        </div>
        <span className="text-[#ffe16d]">Premium VIP ($18)</span>
      </div>
    </div>
  );
}
