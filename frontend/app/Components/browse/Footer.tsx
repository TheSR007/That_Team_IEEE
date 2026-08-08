import React from "react";
import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="bg-[#0e0e0e] text-[#e50914] font-['Chivo'] border-t border-white/5 flex flex-col items-center justify-center py-12 px-6 lg:px-16 w-full mt-20">
      <Link
        to="/browse"
        className="font-['Anybody'] text-2xl font-extrabold text-[#e50914] mb-4 tracking-tighter hover:opacity-90 transition-opacity"
      >
        CinemaSeat
      </Link>
      
      <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm">
        <a
          href="#"
          className="text-[#e9bcb6] hover:text-[#e5e2e1] transition-colors hover:underline opacity-80 hover:opacity-100"
        >
          About Us
        </a>
        <a
          href="#"
          className="text-[#e9bcb6] hover:text-[#e5e2e1] transition-colors hover:underline opacity-80 hover:opacity-100"
        >
          Terms of Service
        </a>
        <a
          href="#"
          className="text-[#e9bcb6] hover:text-[#e5e2e1] transition-colors hover:underline opacity-80 hover:opacity-100"
        >
          Privacy Policy
        </a>
        <a
          href="#"
          className="text-[#e9bcb6] hover:text-[#e5e2e1] transition-colors hover:underline opacity-80 hover:opacity-100"
        >
          Contact Support
        </a>
      </div>
      
      <p className="text-[#e9bcb6] text-xs text-center opacity-60">
        © 2024 CinemaSeat. Premier Night Out Experience.
      </p>
    </footer>
  );
}
