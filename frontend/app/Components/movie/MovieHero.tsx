import type { Movie } from "../../types/movie";

interface MovieHeroProps {
  movie: Movie;
  onBookTickets?: () => void;
}

export function MovieHero({ movie, onBookTickets }: MovieHeroProps) {
  const backdropUrl = movie.backdropImage || movie.image;

  return (
    <section className="relative w-full h-[70vh] lg:h-[85vh] flex items-end overflow-hidden">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0 after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-t after:from-[#131313] after:via-[#131313]/60 after:to-transparent">
        <div
          className="bg-cover bg-center bg-no-repeat w-full h-full transform scale-105 transition-transform duration-1000 ease-out"
          style={{ backgroundImage: `url('${backdropUrl}')` }}
        />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 w-full px-4 md:px-16 pb-12 md:pb-16 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start md:items-end justify-between">
          <div className="flex-1 space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 items-center">
              {movie.genre.map((g) => (
                <span
                  key={g}
                  className="px-3 py-1 border border-[#af8782]/40 bg-black/30 backdrop-blur-sm rounded-full text-xs uppercase tracking-wider text-[#e5e2e1] font-medium"
                >
                  {g}
                </span>
              ))}

              {movie.rating && (
                <span className="px-3 py-1 bg-[#2a2a2a] rounded-full text-xs font-medium text-[#e5e2e1] flex items-center gap-1 border border-white/5">
                  <span
                    className="material-symbols-outlined text-[#ffe16d] text-[16px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  {movie.rating}/10
                </span>
              )}

              {movie.duration && (
                <span className="px-3 py-1 border border-[#af8782]/40 bg-black/30 backdrop-blur-sm rounded-full text-xs font-medium text-[#e5e2e1] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    schedule
                  </span>
                  {movie.duration}
                </span>
              )}

              {movie.badge && (
                <span className="px-3 py-1 bg-[#e50914] text-white font-bold rounded-full text-xs uppercase tracking-wider">
                  {movie.badge}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-headline-lg md:font-display-lg text-4xl md:text-6xl font-extrabold text-[#e5e2e1] tracking-tight leading-none drop-shadow-lg">
              {movie.title}
            </h1>

            {/* Synopsis */}
            <p className="text-base md:text-lg text-[#e9bcb6]/90 max-w-3xl leading-relaxed font-normal">
              {movie.description}
            </p>
          </div>

          {/* Primary Action */}
          <div className="w-full md:w-auto">
            <button
              onClick={onBookTickets}
              className="w-full md:w-auto bg-[#e50914] hover:bg-[#c0000c] text-[#fff7f6] font-bold text-sm md:text-base uppercase tracking-wider px-8 py-4 rounded-xl glow-hover transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 cursor-pointer"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                confirmation_number
              </span>
              Book Tickets
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
