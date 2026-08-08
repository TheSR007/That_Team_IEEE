import { useParams, Link } from "react-router";
import { useState, useRef } from "react";
import { getMovieById } from "../data/movieDetailsData";
import { MovieHeader } from "../Components/movie/MovieHeader";
import { MovieHero } from "../Components/movie/MovieHero";
import { MovieDetailsSidebar } from "../Components/movie/MovieDetailsSidebar";
import { MovieLocationsTable } from "../Components/movie/MovieLocationsTable";
import { MovieFooter } from "../Components/movie/MovieFooter";

export default function MoviePage() {
  const params = useParams();
  const movieId = params.movie_id || "neon-odyssey";
  const movie = getMovieById(movieId);

  const locationsRef = useRef<HTMLDivElement>(null);
  const [selectedBooking, setSelectedBooking] = useState<{
    cinema: string;
    showtime: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#131313] text-[#e5e2e1] flex flex-col items-center justify-center p-6 text-center">
        <MovieHeader />
        <span className="material-symbols-outlined text-6xl text-[#e50914] mb-4">
          movie_off
        </span>
        <h1 className="text-3xl font-bold mb-2">Movie Not Found</h1>
        <p className="text-gray-400 max-w-md mb-6">
          We couldn't find the movie details for "{movieId}". It may have been removed or the link might be invalid.
        </p>
        <Link
          to="/browse"
          className="bg-[#e50914] text-white px-6 py-3 rounded-lg font-bold uppercase text-sm hover:bg-[#c0000c] transition-colors"
        >
          Return to Browse
        </Link>
      </div>
    );
  }

  const handleBookTicketsClick = () => {
    if (locationsRef.current) {
      locationsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSelectShowtime = (cinema: string, showtime: string) => {
    setSelectedBooking({ cinema, showtime });
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#131313] text-[#e5e2e1] font-sans overflow-x-hidden selection:bg-[#e50914] selection:text-white">
      {/* Header */}
      <MovieHeader movieTitle={movie.title} />

      <main className="flex-grow">
        {/* Hero Section */}
        <MovieHero movie={movie} onBookTickets={handleBookTicketsClick} />

        {/* Details & Locations Grid */}
        <div
          ref={locationsRef}
          className="px-4 md:px-16 py-16 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12"
        >
          {/* Left Column: Details (Bento Cards) */}
          <MovieDetailsSidebar movie={movie} />

          {/* Right Column: Cinema Locations Table */}
          <MovieLocationsTable
            locations={movie.locationShowtimes}
            onSelectShowtime={handleSelectShowtime}
          />
        </div>
      </main>

      {/* Footer */}
      <MovieFooter />

      {/* Booking Confirmation Modal */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#1c1b1b] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-[#e50914] font-bold text-lg">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  confirmation_number
                </span>
                Confirm Booking
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-sm text-[#e5e2e1]">
              <p>
                <span className="text-[#e9bcb6] font-semibold">Movie:</span>{" "}
                {movie.title}
              </p>
              <p>
                <span className="text-[#e9bcb6] font-semibold">Cinema:</span>{" "}
                {selectedBooking.cinema}
              </p>
              <p>
                <span className="text-[#e9bcb6] font-semibold">Showtime:</span>{" "}
                <span className="bg-[#ffe16d] text-[#221b00] font-bold px-2 py-0.5 rounded ml-1">
                  {selectedBooking.showtime}
                </span>
              </p>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-gray-300 font-bold hover:bg-white/5 transition-colors uppercase text-xs"
              >
                Cancel
              </button>
              <Link
                to={`/select_seat/${movie.id}`}
                className="flex-1 py-3 px-4 rounded-xl bg-[#e50914] hover:bg-[#c0000c] text-white font-bold transition-colors uppercase text-xs shadow-lg glow-hover text-center"
              >
                Select Seats
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
