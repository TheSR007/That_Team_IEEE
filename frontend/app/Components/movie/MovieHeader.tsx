import { Link } from "react-router";

interface MovieHeaderProps {
  movieTitle?: string;
}

export function MovieHeader({ movieTitle }: MovieHeaderProps) {
  return (
    <header className="fixed top-0 left-0 w-full z-50 px-4 md:px-16 py-4 flex items-center justify-between bg-gradient-to-b from-[#131313]/90 via-[#131313]/50 to-transparent backdrop-blur-md">
      <Link
        to="/browse"
        className="flex items-center gap-2 text-gray-200 hover:text-[#e50914] transition-colors font-bold text-xs md:text-sm uppercase tracking-widest group"
      >
        <span
          className="material-symbols-outlined text-lg transition-transform group-hover:-translate-x-1"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          arrow_back
        </span>
        Back to Movies
      </Link>

      {movieTitle && (
        <span className="hidden md:inline-block text-xs font-semibold uppercase tracking-widest text-gray-400 bg-black/40 px-3 py-1 rounded-full border border-white/10">
          {movieTitle}
        </span>
      )}
    </header>
  );
}
