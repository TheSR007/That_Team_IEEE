import React from "react";

export const AuthTopNav: React.FC = () => {
  return (
    <header className="bg-[#131313] border-b border-white/10 backdrop-blur-md shadow-md flex justify-between items-center px-6 lg:px-16 py-4 w-full sticky top-0 z-50">
      <a
        href="/"
        className="font-['Anybody'] text-2xl font-extrabold text-[#e50914] tracking-tighter"
      >
        CinemaSeat
      </a>
    </header>
  );
};
