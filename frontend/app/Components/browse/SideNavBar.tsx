import React from "react";
import { Link, useLocation } from "react-router";

interface SideNavBarProps {
  onBookNowClick?: () => void;
}

export function SideNavBar({ onBookNowClick }: SideNavBarProps) {
  const location = useLocation();

  const navItems = [
    { name: "Home", href: "/", icon: "home" },
    { name: "Movies", href: "/browse", icon: "movie" },
    { name: "Cinemas", href: "#", icon: "theater_comedy" },
    { name: "My Bookings", href: "#", icon: "confirmation_number" },
  ];

  return (
    <nav className="bg-[#1c1b1b] text-[#e50914] font-['Chivo'] text-[16px] fixed left-0 top-0 h-full w-64 border-r border-white/5 shadow-xl hidden lg:flex flex-col p-6 space-y-4 z-40">
      <Link 
        to="/browse" 
        className="font-['Anybody'] text-2xl font-extrabold text-[#e50914] mb-8 tracking-tighter hover:opacity-90 transition-opacity"
      >
        CinemaSeat
      </Link>
      
      <div className="flex flex-col space-y-2 flex-grow">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || (item.href === "/browse" && location.pathname === "/browse");
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`rounded-xl font-medium flex items-center p-3 gap-3 transition-all duration-200 ease-out ${
                isActive
                  ? "bg-[#e50914] text-[#fff7f6] font-bold shadow-lg shadow-[#e50914]/20"
                  : "text-[#e9bcb6] hover:text-[#e5e2e1] hover:bg-[#353534] hover:scale-[1.02]"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto flex items-center gap-3 bg-[#201f1f] rounded-xl p-3 border border-white/5">
        <div className="w-10 h-10 rounded-full bg-[#353534] overflow-hidden border border-white/10 shrink-0">
          <img
            className="w-full h-full object-cover"
            alt="User profile avatar"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYOF2BI-g7KIpq1z6CrPXgZh3nODcA5ZUggtScGxmuhbDPjAtndH9zy7m7y1utCm30SH751Kqg0N2t9vH29y2Otn2ltdq44GpXvAN7FJd0ClRl1tzEvTtTxOEjxDlRi11Y4sM1bMevqo-jVTkH6iHK26ku0DzQpvb7qF2lVNG1BdshPIR9JK05mmhuXfJSg90iD-dntknKdrBVgf6bEe4V9lbgXklwUsXTD1bS1aAjZmRsJqubYzXXKA"
          />
        </div>
        <div className="overflow-hidden">
          <p className="text-xs font-semibold text-[#e5e2e1] truncate">Welcome back</p>
          <p className="text-xs text-[#e9bcb6] truncate">Ready for a movie?</p>
        </div>
      </div>

      <button
        onClick={onBookNowClick}
        className="w-full mt-4 bg-[#e50914] text-[#fff7f6] uppercase font-bold text-sm tracking-wider py-3 rounded-lg hover:bg-[#ffb4aa] hover:text-[#690003] transition-all duration-200 ease-out shadow-lg shadow-[#e50914]/25 active:scale-[0.98]"
      >
        Book Now
      </button>
    </nav>
  );
}
