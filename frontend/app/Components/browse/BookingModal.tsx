import React, { useState } from "react";
import type { Movie } from "../../types/movie";

interface BookingModalProps {
  movie: Movie | null;
  onClose: () => void;
  selectedLocation: string;
}

export function BookingModal({
  movie,
  onClose,
  selectedLocation,
}: BookingModalProps) {
  if (!movie) return null;

  const dates = [
    "Today, Aug 8",
    "Tomorrow, Aug 9",
    "Sun, Aug 10",
    "Mon, Aug 11",
  ];
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedTime, setSelectedTime] = useState(
    movie.showtimes[0] || "18:00",
  );
  const [ticketsCount, setTicketsCount] = useState(2);
  const [isSuccess, setIsSuccess] = useState(false);

  const ticketPrice =
    movie.badge === "IMAX" || movie.badge === "4DX" ? 18.5 : 13.5;
  const totalPrice = (ticketPrice * ticketsCount).toFixed(2);

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-['Chivo']">
      <div className="relative w-full max-w-4xl bg-[#1c1b1b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header banner */}
        <div className="relative h-32 w-full overflow-hidden">
          <img
            src={movie.image}
            alt={movie.title}
            className="w-full h-full object-cover filter blur-xs brightness-50 scale-105"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 text-[#e5e2e1] hover:text-[#e50914] flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c1b1b] via-transparent to-transparent flex items-end p-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#e50914] text-[#fff7f6] px-2 py-0.5 rounded">
                {movie.badge}
              </span>
              <h2 className="font-['Anybody'] text-2xl font-bold text-[#e5e2e1] mt-1">
                {movie.title}
              </h2>
            </div>
          </div>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mb-4 border border-green-500/30">
              <span className="material-symbols-outlined text-3xl">
                check_circle
              </span>
            </div>
            <h3 className="font-['Anybody'] text-2xl font-bold text-[#e5e2e1] mb-2">
              Seats Confirmed!
            </h3>
            <p className="text-sm text-[#e9bcb6] mb-6">
              Your tickets for{" "}
              <strong className="text-white">{movie.title}</strong> at{" "}
              <strong className="text-white">{selectedLocation}</strong> have
              been booked successfully.
            </p>
            <div className="w-full bg-[#201f1f] rounded-xl p-4 text-xs text-left mb-6 space-y-2 border border-white/5">
              <div className="flex justify-between">
                <span className="text-[#e9bcb6]">Date:</span>
                <span className="text-white font-bold">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#e9bcb6]">Showtime:</span>
                <span className="text-white font-bold">{selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#e9bcb6]">Tickets:</span>
                <span className="text-white font-bold">
                  {ticketsCount} Seats
                </span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-sm">
                <span className="text-[#e9bcb6]">Total Paid:</span>
                <span className="text-[#ffb4aa] font-bold">${totalPrice}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-[#e50914] text-[#fff7f6] py-3 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-[#ffb4aa] hover:text-[#690003] transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleConfirmBooking} className="p-6 space-y-5">
            {/* Location indicator */}
            <div className="flex items-center gap-2 text-xs text-[#e9bcb6] bg-[#201f1f] p-3 rounded-xl border border-white/5">
              <span className="material-symbols-outlined text-[#e50914]">
                location_on
              </span>
              <span>
                Showing at <strong>{selectedLocation}</strong>
              </span>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-xs font-bold uppercase text-[#e9bcb6] mb-2">
                Select Date
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {dates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition-all border ${
                      selectedDate === d
                        ? "bg-[#e50914] text-[#fff7f6] border-[#e50914]"
                        : "bg-[#201f1f] text-[#e5e2e1] border-white/5 hover:border-white/20"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-xs font-bold uppercase text-[#e9bcb6] mb-2">
                Select Showtime
              </label>
              <div className="flex flex-wrap gap-2">
                {movie.showtimes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTime(t)}
                    className={`py-2 px-4 rounded-lg text-xs font-bold transition-all border ${
                      selectedTime === t
                        ? "bg-[#e50914] text-[#fff7f6] border-[#e50914]"
                        : "bg-[#201f1f] text-[#e5e2e1] border-white/5 hover:border-white/20"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Tickets Stepper */}
            <div className="flex items-center justify-between bg-[#201f1f] p-3 rounded-xl border border-white/5">
              <div>
                <span className="block text-xs font-bold text-[#e5e2e1]">
                  Number of Tickets
                </span>
                <span className="text-[11px] text-[#e9bcb6]">
                  ${ticketPrice} per ticket
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTicketsCount(Math.max(1, ticketsCount - 1))}
                  className="w-8 h-8 rounded-lg bg-[#353534] text-[#e5e2e1] hover:bg-[#e50914] hover:text-white flex items-center justify-center transition-colors font-bold"
                >
                  -
                </button>
                <span className="font-bold text-sm text-white w-4 text-center">
                  {ticketsCount}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setTicketsCount(Math.min(10, ticketsCount + 1))
                  }
                  className="w-8 h-8 rounded-lg bg-[#353534] text-[#e5e2e1] hover:bg-[#e50914] hover:text-white flex items-center justify-center transition-colors font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Price Summary & Submit */}
            <div className="pt-2 flex items-center justify-between border-t border-white/10">
              <div>
                <span className="block text-xs text-[#e9bcb6]">
                  Total Price
                </span>
                <span className="font-['Anybody'] text-2xl font-bold text-[#ffb4aa]">
                  ${totalPrice}
                </span>
              </div>
              <button
                type="submit"
                className="bg-[#e50914] text-[#fff7f6] uppercase font-bold text-xs tracking-wider py-3 px-8 rounded-xl hover:bg-[#ffb4aa] hover:text-[#690003] transition-all shadow-lg shadow-[#e50914]/30"
              >
                Confirm & Pay
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
