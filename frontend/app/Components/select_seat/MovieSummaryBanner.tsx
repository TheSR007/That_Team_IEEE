interface MovieSummaryBannerProps {
  title: string;
  posterImage: string;
  bgOverlayImage: string;
  showtime: string;
  cinemaVenue: string;
  screenName: string;
  format: string;
}

export function MovieSummaryBanner({
  title,
  posterImage,
  bgOverlayImage,
  showtime,
  cinemaVenue,
  screenName,
  format,
}: MovieSummaryBannerProps) {
  return (
    <div className="bg-[#1c1b1b] rounded-2xl p-6 border-t border-white/10 flex flex-col md:flex-row gap-6 items-start md:items-center relative overflow-hidden group shadow-xl">
      {/* Dynamic Background Image */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity duration-500 bg-cover bg-center"
        style={{ backgroundImage: `url('${bgOverlayImage}')` }}
      ></div>

      {/* Poster Image */}
      <div className="w-24 h-36 flex-shrink-0 rounded-xl overflow-hidden relative z-10 border border-white/10 shadow-2xl">
        <img
          src={posterImage}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Info Content */}
      <div className="flex flex-col gap-2 z-10">
        <h1 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-[#e5e2e1] tracking-tight">
          {title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-bold">
          <span className="bg-[#353534]/80 px-3 py-1.5 rounded-full text-[#e5e2e1] border border-[#5e3f3b]/30 flex items-center gap-1.5 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[16px] text-[#e50914]">
              schedule
            </span>{" "}
            {showtime}
          </span>
          <span className="bg-[#353534]/80 px-3 py-1.5 rounded-full text-[#e5e2e1] border border-[#5e3f3b]/30 flex items-center gap-1.5 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[16px] text-[#e50914]">
              location_on
            </span>{" "}
            {cinemaVenue}, {screenName}
          </span>
          <span className="bg-[#e50914]/20 text-[#ffb4aa] px-3 py-1.5 rounded-full border border-[#e50914]/40 backdrop-blur-sm font-extrabold tracking-wider">
            {format}
          </span>
        </div>
      </div>
    </div>
  );
}
