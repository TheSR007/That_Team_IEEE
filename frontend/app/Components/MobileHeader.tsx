import React from "react";

interface MobileHeaderProps {
  title?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title = "CinemaSeat",
}) => {
  return (
    <div className="absolute top-4 left-4 lg:hidden flex items-center gap-1">
      <span
        className="material-symbols-outlined text-[#e50914] text-2xl"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        movie
      </span>
      <span className="font-['Anybody'] text-2xl font-extrabold text-[#e50914] tracking-tighter">
        {title}
      </span>
    </div>
  );
};
