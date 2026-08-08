import React, { useState, useMemo } from "react";
import type { Route } from "./+types/browse";
import { SideNavBar } from "../Components/browse/SideNavBar";
import { TopHeader } from "../Components/browse/TopHeader";
import { SectionHeader } from "../Components/browse/SectionHeader";
import { MovieGrid } from "../Components/browse/MovieGrid";
import { Footer } from "../Components/browse/Footer";
import { BookingModal } from "../Components/browse/BookingModal";
import { moviesData } from "../data/moviesData";
import type { Movie } from "../types/movie";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Browse Movies - CinemaSeat" },
    {
      name: "description",
      content: "Browse the latest movies, IMAX releases, and 4DX blockbusters at CinemaSeat.",
    },
  ];
}

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [activeTab, setActiveTab] = useState("Now Playing");
  const [selectedLocation, setSelectedLocation] = useState("Downtown Cinema");
  const [bookingMovie, setBookingMovie] = useState<Movie | null>(null);

  const filteredMovies = useMemo(() => {
    return moviesData.filter((movie) => {
      // Search filter
      const matchesSearch =
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Genre filter
      const matchesGenre =
        selectedGenre === "All" || movie.genre.includes(selectedGenre);

      // Location filter (if selected location exists in movie's cinemas)
      const matchesLocation =
        !selectedLocation ||
        movie.cinemas.includes(selectedLocation) ||
        selectedLocation === "Downtown Cinema";

      return matchesSearch && matchesGenre && matchesLocation;
    });
  }, [searchQuery, selectedGenre, selectedLocation]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedGenre("All");
    setActiveTab("Now Playing");
  };

  const handleOpenBookingModal = (movie?: Movie) => {
    setBookingMovie(movie || moviesData[0]);
  };

  return (
    <div className="bg-[#131313] text-[#e5e2e1] font-['Chivo'] min-h-screen flex flex-col lg:flex-row antialiased selection:bg-[#e50914] selection:text-[#fff7f6] overflow-x-hidden">
      {/* Desktop Navigation Sidebar */}
      <SideNavBar onBookNowClick={() => handleOpenBookingModal()} />

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col lg:ml-64 w-full min-h-screen">
        {/* Top Header Bar */}
        <TopHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedLocation={selectedLocation}
          onLocationChange={setSelectedLocation}
        />

        {/* Main Canvas */}
        <main className="flex-1 p-4 sm:p-8 lg:p-16 space-y-12 w-full max-w-[1600px] mx-auto">
          {/* Section Header & Filters */}
          <SectionHeader
            selectedGenre={selectedGenre}
            onGenreSelect={setSelectedGenre}
            totalMovies={filteredMovies.length}
          />

          {/* Movie Cards Grid */}
          <MovieGrid
            movies={filteredMovies}
            onBookClick={(movie) => setBookingMovie(movie)}
            onResetFilters={handleResetFilters}
          />
        </main>

        {/* Footer Component */}
        <Footer />
      </div>

      {/* Booking Modal */}
      {bookingMovie && (
        <BookingModal
          movie={bookingMovie}
          onClose={() => setBookingMovie(null)}
          selectedLocation={selectedLocation}
        />
      )}
    </div>
  );
}
