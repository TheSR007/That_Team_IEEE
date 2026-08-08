import type { Movie } from "../../types/movie";

interface MovieDetailsSidebarProps {
  movie: Movie;
}

export function MovieDetailsSidebar({ movie }: MovieDetailsSidebarProps) {
  return (
    <section className="lg:col-span-4 space-y-6">
      <h2 className="text-2xl font-bold text-[#e5e2e1] tracking-wide mb-6">
        Details
      </h2>

      <div className="grid grid-cols-1 gap-4">
        {/* Director Card */}
        {movie.director && (
          <div className="bg-[#1c1b1b] rounded-xl p-5 border-t border-white/10 shadow-lg hover:border-white/20 transition-all">
            <span className="text-xs text-[#e9bcb6] uppercase tracking-wider block mb-1 font-semibold">
              Director
            </span>
            <p className="text-lg text-[#e5e2e1] font-medium">{movie.director}</p>
          </div>
        )}

        {/* Release Date Card */}
        {movie.releaseDate && (
          <div className="bg-[#1c1b1b] rounded-xl p-5 border-t border-white/10 shadow-lg hover:border-white/20 transition-all">
            <span className="text-xs text-[#e9bcb6] uppercase tracking-wider block mb-1 font-semibold">
              Release Date
            </span>
            <p className="text-lg text-[#e5e2e1] font-medium">
              {movie.releaseDate}
            </p>
          </div>
        )}

        {/* Top Cast Card */}
        {movie.cast && movie.cast.length > 0 && (
          <div className="bg-[#1c1b1b] rounded-xl p-5 border-t border-white/10 shadow-lg hover:border-white/20 transition-all">
            <span className="text-xs text-[#e9bcb6] uppercase tracking-wider block mb-3 font-semibold">
              Top Cast
            </span>
            <ul className="space-y-4">
              {movie.cast.map((actor) => (
                <li key={actor.name} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#353534] overflow-hidden border border-[#af8782]/30 flex-shrink-0">
                    <img
                      src={actor.image}
                      alt={actor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#e5e2e1] leading-tight">
                      {actor.name}
                    </p>
                    <p className="text-xs text-[#e9bcb6]">
                      as {actor.character}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
