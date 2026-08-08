import React from "react";
import { Link } from "react-router";
import type { Movie } from "../../types/movie";

interface MovieCardProps {
  movie: Movie;
  onBookClick: (movie: Movie) => void;
}

export function MovieCard({ movie, onBookClick }: MovieCardProps) {
  const getBadgeStyle = (badge: Movie["badge"]) => {
    switch (badge) {
      case "IMAX":
      case "4DX":
        return "bg-[#ffe16d] text-[#221b00] font-extrabold";
      case "DOLBY 3D":
        return "bg-[#e50914] text-[#fff7f6] font-extrabold";
      default:
        return "bg-[#3a3939] text-[#e5e2e1] border border-white/20 font-bold";
    }
  };

  return (
    <div className="movie-card group relative rounded-xl overflow-hidden bg-[#1c1b1b] border-t border-white/10 transition-all duration-300 transform aspect-[2/3] cursor-pointer hover:shadow-2xl hover:shadow-[#e50914]/20 hover:-translate-y-1">
      <div className="absolute inset-0 border border-white/5 rounded-xl pointer-events-none z-20"></div>

      {/* Poster Image */}
      <img
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out z-0 relative"
        alt={movie.title}
        src={movie.image}
      />

      {/* Permanent Bottom Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black via-black/80 to-transparent z-10 flex flex-col justify-end">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`px-2 py-0.5 text-[10px] rounded uppercase tracking-wider ${getBadgeStyle(
              movie.badge
            )}`}
          >
            {movie.badge}
          </span>
          <span className="text-[#e9bcb6] text-xs flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">
              schedule
            </span>
            {movie.duration}
          </span>
          {movie.rating && (
            <span className="ml-auto text-amber-400 text-xs font-bold flex items-center gap-0.5">
              ★ {movie.rating}
            </span>
          )}
        </div>
        <h3 className="font-['Anybody'] text-lg font-bold text-[#e5e2e1] leading-tight mb-1 group-hover:text-[#ffb4aa] transition-colors">
          {movie.title}
        </h3>
        <p className="text-[#e9bcb6] text-xs line-clamp-2 font-normal">
          {movie.description}
        </p>
      </div>

      {/* Hover Overlay Action */}
      <div className="movie-overlay absolute inset-0 bg-black/75 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 flex flex-col items-center justify-center p-6 text-center">
        <span className="text-amber-400 font-bold text-sm mb-1">
          ★ {movie.rating || "8.5"} / 10
        </span>
        <h3 className="font-['Anybody'] text-xl font-bold text-[#e5e2e1] mb-2">
          {movie.title}
        </h3>
        <p className="text-[#e9bcb6] text-xs mb-4 line-clamp-3 max-w-[90%]">
          {movie.description}
        </p>

        <div className="flex flex-wrap gap-1 justify-center mb-5">
          {movie.genre.map((g) => (
            <span
              key={g}
              className="text-[10px] bg-[#353534] text-[#e5e2e1] px-2 py-0.5 rounded-full border border-white/10"
            >
              {g}
            </span>
          ))}
        </div>

        <div className="flex gap-3 mb-6 text-[#e9bcb6]">
          <span
            className="material-symbols-outlined text-lg hover:text-[#e50914] transition-colors"
            title="Downtown Cinema"
          >
            apartment
          </span>
          <span
            className="material-symbols-outlined text-lg hover:text-[#e50914] transition-colors"
            title="Mall Multiplex"
          >
            store
          </span>
          <span
            className="material-symbols-outlined text-lg hover:text-[#e50914] transition-colors"
            title="4DX Motion"
          >
            confirmation_number
          </span>
        </div>

        <div className="flex gap-2 w-full">
          <Link
            to={`/movie/${movie.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-[#353534] text-[#e5e2e1] uppercase font-bold text-xs tracking-wider py-3 px-3 rounded-lg hover:bg-white/20 transition-all duration-200 text-center"
          >
            Details
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBookClick(movie);
            }}
            className="flex-1 bg-[#e50914] text-[#fff7f6] uppercase font-bold text-xs tracking-wider py-3 px-3 rounded-lg hover:bg-[#ffb4aa] hover:text-[#690003] transition-all duration-200 shadow-lg shadow-[#e50914]/30 active:scale-95 cursor-pointer"
          >
            Book
          </button>
        </div>
      </div>
    </div>
  );
}
