import React from "react";

interface SectionHeaderProps {
  selectedGenre: string;
  onGenreSelect: (genre: string) => void;
  totalMovies: number;
}

export function SectionHeader({
  selectedGenre,
  onGenreSelect,
  totalMovies,
}: SectionHeaderProps) {
  const genres = ["All", "Action", "Sci-Fi", "Drama", "Crime", "Fantasy", "Thriller"];

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="font-['Anybody'] text-3xl md:text-5xl font-extrabold text-[#e5e2e1] tracking-tight">
            Now Playing
          </h1>
          <span className="bg-[#e50914]/20 text-[#ffb4aa] text-xs font-bold px-2.5 py-1 rounded-full border border-[#e50914]/30">
            {totalMovies} {totalMovies === 1 ? "Movie" : "Movies"}
          </span>
        </div>
        <p className="font-['Chivo'] text-sm md:text-base text-[#e9bcb6]">
          Experience the latest blockbusters in premium theaters.
        </p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => onGenreSelect(g)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
              selectedGenre === g
                ? "bg-[#e50914] text-[#fff7f6] border-[#e50914] shadow-md shadow-[#e50914]/20"
                : "bg-[#201f1f] text-[#e5e2e1] border-white/10 hover:border-[#e50914] hover:text-[#ffb4aa]"
            }`}
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}
