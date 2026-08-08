export function ProgressTracker() {
  return (
    <div className="w-full pt-4">
      <div className="flex justify-between text-xs font-bold text-[#e9bcb6] mb-1.5 uppercase tracking-wider">
        <span className="text-gray-400">1. Showtime</span>
        <span className="text-[#e50914] font-extrabold flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#e50914] animate-pulse"></span>
          2. Seats
        </span>
        <span className="text-gray-400">3. Payment</span>
      </div>
      <div className="w-full h-[3px] bg-[#353534] rounded-full overflow-hidden">
        <div className="h-full bg-[#e50914] progress-bar-fill"></div>
      </div>
    </div>
  );
}
