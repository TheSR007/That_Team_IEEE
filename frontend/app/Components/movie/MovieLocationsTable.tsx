import { useState } from "react";
import type { LocationShowtime } from "../../types/movie";

interface MovieLocationsTableProps {
  locations?: LocationShowtime[];
  onSelectShowtime?: (cinema: string, showtime: string) => void;
}

export function MovieLocationsTable({
  locations = [],
  onSelectShowtime,
}: MovieLocationsTableProps) {
  const [selectedSlot, setSelectedSlot] = useState<{
    cinema: string;
    showtime: string;
  } | null>(null);

  const handleSelect = (cinema: string, showtime: string) => {
    setSelectedSlot({ cinema, showtime });
    if (onSelectShowtime) {
      onSelectShowtime(cinema, showtime);
    }
  };

  return (
    <section className="lg:col-span-8 space-y-6">
      <h2 className="text-2xl font-bold text-[#e5e2e1] tracking-wide mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-[#e50914]">
          location_on
        </span>
        Available Locations
      </h2>

      <div className="bg-[#1c1b1b] rounded-xl border-t border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[550px]">
            <thead>
              <tr className="bg-[#201f1f] border-b border-white/10">
                <th className="p-4 text-xs font-bold text-[#e9bcb6] uppercase tracking-wider">
                  Cinema Name
                </th>
                <th className="p-4 text-xs font-bold text-[#e9bcb6] uppercase tracking-wider">
                  Distance
                </th>
                <th className="p-4 text-xs font-bold text-[#e9bcb6] uppercase tracking-wider">
                  Formats
                </th>
                <th className="p-4 text-xs font-bold text-[#e9bcb6] uppercase tracking-wider">
                  Showtimes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {locations.map((loc) => (
                <tr
                  key={loc.cinemaName}
                  className="hover:bg-[#2a2a2a]/50 transition-colors"
                >
                  <td className="p-4 text-sm font-semibold text-[#e5e2e1]">
                    {loc.cinemaName}
                  </td>
                  <td className="p-4 text-sm text-[#e9bcb6]/80">
                    {loc.distance}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1.5 flex-wrap">
                      {loc.formats.map((fmt) => {
                        const isImax = fmt === "IMAX";
                        const is4dx = fmt === "4DX";
                        const isDolby = fmt.includes("DOLBY");

                        let badgeStyle =
                          "bg-[#353534] text-[#e5e2e1] border-[#af8782]/40";
                        if (isImax) {
                          badgeStyle =
                            "bg-[#353534] text-[#ffe16d] border-[#ffe16d]/30";
                        } else if (is4dx || isDolby) {
                          badgeStyle =
                            "bg-[#353534] text-[#e50914] border-[#e50914]/30";
                        }

                        return (
                          <span
                            key={fmt}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase border ${badgeStyle}`}
                          >
                            {fmt}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {loc.showtimes.map((st) => {
                        const isSelected =
                          selectedSlot?.cinema === loc.cinemaName &&
                          selectedSlot?.showtime === st;

                        return (
                          <button
                            key={st}
                            onClick={() => handleSelect(loc.cinemaName, st)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all popcorn-glow-hover cursor-pointer ${
                              isSelected
                                ? "bg-[#ffe16d] text-[#221b00] border border-[#ffe16d] shadow-[0_0_15px_rgba(255,225,109,0.3)]"
                                : "border border-[#af8782]/40 text-[#e5e2e1] hover:bg-[#ffe16d] hover:text-[#221b00] hover:border-[#ffe16d]"
                            }`}
                          >
                            {st}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
