import React from "react";

interface CinematicBannerProps {
  backgroundImageUrl?: string;
  title?: string;
  subtitle?: string;
}

export const CinematicBanner: React.FC<CinematicBannerProps> = ({
  backgroundImageUrl = "/cinema-bg.jpg",
  title = "CinemaSeat",
  subtitle = "The premier platform for curating your ultimate cinematic experience. Reserve the best seats in the house.",
}) => {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative bg-[var(--color-surface-container-lowest,#0e0e0e)] items-center justify-center overflow-hidden">
      {/* Background Image with Dark Blend */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60 mix-blend-luminosity"
        style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
      />

      {/* Overlay Gradients for Depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#131313]/80 to-[#131313]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-transparent to-transparent" />

      {/* Brand Intro Overlay */}
      <div className="relative z-10 p-12 lg:p-16 flex flex-col items-start max-w-2xl">
        <h1 className="font-['Anybody'] text-5xl lg:text-6xl font-extrabold text-[#e5e2e1] tracking-tighter mb-3">
          {title}
        </h1>
        <p className="font-['Chivo'] text-lg text-[#e9bcb6] leading-relaxed">
          {subtitle}
        </p>
      </div>
    </div>
  );
};
