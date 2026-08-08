import React from "react";

interface CinematicBannerProps {
  backgroundImageUrl?: string;
  title?: React.ReactNode;
  subtitle?: string;
}

export const CinematicBanner: React.FC<CinematicBannerProps> = ({
  backgroundImageUrl = "/cinema-signin-bg.jpg",
  title = (
    <>
      Your Premier
      <br />
      <span className="text-[#e50914]">Night Out</span> Awaits.
    </>
  ),
  subtitle = "Sign in to access exclusive premieres, manage your luxury bookings, and curate your ultimate cinema experience.",
}) => {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative bg-[#0e0e0e] items-center justify-center overflow-hidden min-h-[calc(100vh-65px)]">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70"
        style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
      />

      {/* Overlay Gradients for Depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#131313]/90 via-[#131313]/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-transparent to-transparent" />

      {/* Brand Intro Overlay */}
      <div className="relative z-10 p-12 lg:p-16 flex flex-col items-start max-w-4xl">
        <h1 className="font-['Anybody'] text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
          {title}
        </h1>
        <p className="font-['Chivo'] text-lg text-[#e9bcb6] leading-relaxed">
          {subtitle}
        </p>
      </div>
    </div>
  );
};
