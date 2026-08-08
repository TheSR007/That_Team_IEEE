import React from "react";

export const CinemaFooter: React.FC = () => {
  return (
    <footer className="bg-[#0e0e0e] border-t border-white/5 flex flex-col items-center justify-center py-8 px-6 lg:px-16 w-full mt-auto">
      <div className="font-['Anybody'] text-xl md:text-2xl font-extrabold text-[#e50914] mb-3">
        CinemaSeat
      </div>
      <div className="flex flex-wrap justify-center gap-6 mb-3">
        <a
          href="#"
          className="font-['Chivo'] text-xs text-[#e9bcb6] hover:text-[#e5e2e1] transition-colors hover:underline opacity-80 hover:opacity-100"
        >
          About Us
        </a>
        <a
          href="#"
          className="font-['Chivo'] text-xs text-[#e9bcb6] hover:text-[#e5e2e1] transition-colors hover:underline opacity-80 hover:opacity-100"
        >
          Terms of Service
        </a>
        <a
          href="#"
          className="font-['Chivo'] text-xs text-[#e9bcb6] hover:text-[#e5e2e1] transition-colors hover:underline opacity-80 hover:opacity-100"
        >
          Privacy Policy
        </a>
        <a
          href="#"
          className="font-['Chivo'] text-xs text-[#e9bcb6] hover:text-[#e5e2e1] transition-colors hover:underline opacity-80 hover:opacity-100"
        >
          Contact Support
        </a>
      </div>
      <div className="font-['Chivo'] text-xs text-[#e9bcb6] opacity-60">
        © 2024 CinemaSeat. Premier Night Out Experience.
      </div>
    </footer>
  );
};
