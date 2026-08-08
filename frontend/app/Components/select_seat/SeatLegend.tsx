export function SeatLegend() {
  return (
    <div className="flex flex-wrap justify-center gap-6 mt-2 pt-6 border-t border-white/5 w-full text-xs font-semibold text-gray-300">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg seat-available flex items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-[14px]">chair</span>
        </div>
        <span className="text-[#4ade80] font-bold">Available</span>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg seat-selected flex items-center justify-center shadow-sm">
          <span
            className="material-symbols-outlined text-[14px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            chair
          </span>
        </div>
        <span className="text-[#facc15] font-bold">Selected</span>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg seat-on-hold flex items-center justify-center shadow-sm">
          <span
            className="material-symbols-outlined text-[14px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            chair
          </span>
        </div>
        <span className="text-[#fb923c] font-bold">On Hold</span>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg seat-occupied flex items-center justify-center shadow-sm">
          <span
            className="material-symbols-outlined text-[14px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            chair
          </span>
        </div>
        <span className="text-[#f87171] font-bold">Occupied</span>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg seat-vip seat-available flex items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-[14px]">chair</span>
        </div>
        <span className="text-[#ffe16d] font-bold">Premium VIP ($18)</span>
      </div>
    </div>
  );
}
