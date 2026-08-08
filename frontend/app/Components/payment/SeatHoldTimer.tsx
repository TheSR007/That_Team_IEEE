import { useEffect, useState } from "react";

interface SeatHoldTimerProps {
  initialSeconds?: number;
  onExpire?: () => void;
}

export function SeatHoldTimer({ initialSeconds = 599, onExpire }: SeatHoldTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onExpire) onExpire();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");

  const isLowTime = timeLeft < 120; // less than 2 minutes

  return (
    <div
      className={`flex items-center gap-3 border rounded-xl p-3.5 mb-6 transition-colors ${
        isLowTime
          ? "bg-red-950/40 border-red-500/50 text-red-400 animate-pulse"
          : "bg-[#353534]/30 border-[#ffdb3c]/20"
      }`}
    >
      <span
        className={`material-symbols-outlined text-2xl ${
          isLowTime ? "text-red-400" : "text-[#ffdb3c]"
        }`}
      >
        timer
      </span>
      <div className="flex flex-col">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          Seat Hold Period
        </span>
        <span
          className={`font-mono text-xl font-bold leading-tight ${
            isLowTime ? "text-red-400" : "text-[#ffdb3c]"
          }`}
        >
          {formattedMinutes}:{formattedSeconds}
        </span>
      </div>
    </div>
  );
}
