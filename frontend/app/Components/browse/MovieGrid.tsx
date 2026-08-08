import React from "react";
import type { Movie } from "../../types/movie";
import { MovieCard } from "./MovieCard";

interface MovieGridProps {
  movies: Movie[];
  onBookClick: (movie: Movie) => void;
  onResetFilters?: () => void;
}

export function MovieGrid({ movies, onBookClick, onResetFilters }: MovieGridProps) {
  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-[#1c1b1b]/50 rounded-2xl border border-white/5 p-8">
        <span className="material-symbols-outlined text-6xl text-[#e9bcb6] mb-4">
          movie_off
        </span>
        <h3 className="font-['Anybody'] text-xl font-bold text-[#e5e2e1] mb-2">
          No Movies Found
        </h3>
        <p className="text-[#e9bcb6] text-sm max-w-md mb-6">
          We couldn't find any movies matching your current search or genre filter. Try exploring a different genre or search term.
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="bg-[#e50914] text-[#fff7f6] px-6 py-2.5 rounded-lg text-xs uppercase font-bold tracking-wider hover:bg-[#ffb4aa] hover:text-[#690003] transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 w-full">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} onBookClick={onBookClick} />
      ))}
    </div>
  );
}
