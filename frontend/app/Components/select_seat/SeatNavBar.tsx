import { Link } from "react-router";

interface SeatNavBarProps {
  movieId?: string;
}

export function SeatNavBar({ movieId }: SeatNavBarProps) {
  return (
    <nav className="bg-[#131313] font-sans text-sm border-b border-white/10 backdrop-blur-md shadow-md flex justify-between items-center px-4 md:px-16 py-4 w-full sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link
          to="/browse"
          className="font-headline-md text-xl md:text-2xl font-extrabold text-[#e50914] tracking-tighter hover:opacity-90 transition-opacity"
        >
          CinemaSeat
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/browse"
            className="text-[#e5e2e1] hover:text-[#e50914] transition-colors hover:bg-white/5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider"
          >
            Browse Movies
          </Link>
          {movieId && (
            <Link
              to={`/movie/${movieId}`}
              className="text-[#e9bcb6] hover:text-white transition-colors hover:bg-white/5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Movie Details
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-1 text-[#e50914] hover:bg-white/5 transition-all px-3 py-1.5 rounded cursor-pointer text-xs font-bold">
          <span className="material-symbols-outlined text-sm">location_on</span>
          <span>Starlight Cinema, NY</span>
        </div>
        <button
          type="button"
          aria-label="User Account"
          className="text-[#e50914] hover:bg-white/5 transition-all p-2 rounded-full flex items-center justify-center"
        >
          <span className="material-symbols-outlined">account_circle</span>
        </button>
      </div>
    </nav>
  );
}
