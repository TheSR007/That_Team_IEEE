import React, { useState } from "react";
import { Link } from "react-router";
import { UserButton } from "@clerk/clerk-react";
import { useAuth } from "../../context/AuthContext";


interface TopHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedLocation: string;
  onLocationChange: (loc: string) => void;
}

export function TopHeader({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  selectedLocation,
  onLocationChange,
}: TopHeaderProps) {
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { isSignedIn } = useAuth();

  const locations = ["Downtown Cinema", "Mall Multiplex", "Drive-In Theatre", "Imax Grand Hall"];
  const navTabs = ["Now Playing", "Coming Soon", "Top Rated"];

  return (
    <header className="bg-[#131313]/90 font-['Chivo'] border-b border-white/10 backdrop-blur-md shadow-md transition-all duration-300 flex justify-between items-center px-4 lg:px-16 py-4 w-full sticky top-0 z-30">
      {/* Mobile Brand Logo & Hamburger */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="text-[#e5e2e1] hover:text-[#e50914] focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          <span className="material-symbols-outlined text-2xl">
            {showMobileMenu ? "close" : "menu"}
          </span>
        </button>
        <Link
          to="/"
          className="font-['Anybody'] text-2xl font-extrabold text-[#e50914] tracking-tighter"
        >
          CinemaSeat
        </Link>
      </div>

      {/* Desktop Nav Links */}
      <nav className="hidden md:flex items-center gap-8">
        {navTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`font-bold text-xs uppercase tracking-wider py-1 border-b-2 transition-all ${
              activeTab === tab
                ? "text-[#e50914] border-[#e50914]"
                : "text-[#e5e2e1] border-transparent hover:text-[#e50914]"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Search & Location Actions */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Search Bar */}
        <div className="relative hidden md:flex items-center bg-[#201f1f] border border-[#353534] rounded-full px-4 py-2 focus-within:border-[#e50914] focus-within:ring-1 focus-within:ring-[#e50914] transition-all w-64">
          <span className="material-symbols-outlined text-[#e9bcb6] mr-2 text-xl">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search movies..."
            className="bg-transparent border-none text-[#e5e2e1] focus:ring-0 w-full text-sm outline-none placeholder-[#e9bcb6]/60"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="text-[#e9bcb6] hover:text-[#e5e2e1]"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>

        {/* Location Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowLocationMenu(!showLocationMenu)}
            className="flex items-center gap-2 text-[#e5e2e1] hover:text-[#e50914] transition-colors font-bold text-xs uppercase tracking-wider bg-[#201f1f] px-3 py-2 rounded-lg border border-white/5"
          >
            <span className="material-symbols-outlined text-lg text-[#e50914]">
              location_on
            </span>
            <span className="hidden md:inline">{selectedLocation}</span>
            <span className="material-symbols-outlined text-sm">
              expand_more
            </span>
          </button>

          {showLocationMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-[#1c1b1b] border border-white/10 rounded-xl shadow-2xl py-2 z-50">
              <div className="px-3 py-1 text-[11px] uppercase font-bold text-[#e9bcb6]">
                Select Theater
              </div>
              {locations.map((loc) => (
                <button
                  key={loc}
                  onClick={() => {
                    onLocationChange(loc);
                    setShowLocationMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between ${
                    selectedLocation === loc
                      ? "text-[#e50914] font-bold bg-[#2a2a2a]"
                      : "text-[#e5e2e1] hover:bg-[#353534]"
                  }`}
                >
                  <span>{loc}</span>
                  {selectedLocation === loc && (
                    <span className="material-symbols-outlined text-sm">check</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Auth Links / User Profile */}
        <div className="flex items-center gap-2">
          {!isSignedIn && (
            <>
              <Link
                to="/sign-in"
                className="text-[#e5e2e1] hover:text-white font-medium text-xs uppercase tracking-wider px-3 py-2 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/sign-up"
                className="bg-[#e50914] hover:bg-[#b80710] text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg transition-colors shadow-md shadow-[#e50914]/20"
              >
                Sign Up
              </Link>
            </>
          )}
          {isSignedIn && (
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 border border-white/20",
                },
              }}
            />
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {showMobileMenu && (
        <div className="absolute top-full left-0 w-full bg-[#1c1b1b] border-b border-white/10 p-4 flex flex-col gap-3 lg:hidden shadow-2xl">
          <div className="relative flex items-center bg-[#201f1f] border border-[#353534] rounded-full px-4 py-2 mb-2">
            <span className="material-symbols-outlined text-[#e9bcb6] mr-2 text-xl">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search movies..."
              className="bg-transparent border-none text-[#e5e2e1] w-full text-sm outline-none placeholder-[#e9bcb6]/60"
            />
          </div>

          <div className="flex flex-col gap-2">
            {navTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  onTabChange(tab);
                  setShowMobileMenu(false);
                }}
                className={`text-left px-3 py-2 rounded-lg font-bold text-sm ${
                  activeTab === tab
                    ? "bg-[#e50914] text-[#fff7f6]"
                    : "text-[#e5e2e1] hover:bg-[#201f1f]"
                }`}
              >
                {tab}
              </button>
            ))}

            {!isSignedIn && (
              <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                <Link
                  to="/sign-in"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#e5e2e1] hover:bg-[#201f1f]"
                >
                  <span className="material-symbols-outlined text-lg">login</span>
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/sign-up"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm bg-[#e50914] text-white font-bold"
                >
                  <span className="material-symbols-outlined text-lg">person_add</span>
                  <span>Sign Up / Register</span>
                </Link>
              </div>
            )}
            {isSignedIn && (
              <div className="pt-2 border-t border-white/10 flex items-center justify-between px-3">
                <span className="text-xs text-[#e9bcb6]">Signed In</span>
                <UserButton />
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
