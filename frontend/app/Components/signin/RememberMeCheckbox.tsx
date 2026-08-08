import React from "react";

interface RememberMeCheckboxProps {
  id?: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const RememberMeCheckbox: React.FC<RememberMeCheckboxProps> = ({
  id = "remember",
  checked = false,
  onChange,
}) => {
  return (
    <div className="flex items-center gap-2 mt-1 mb-2">
      <input
        id={id}
        name={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="rounded border border-white/20 bg-[#050505] text-[#e50914] focus:ring-[#e50914] focus:ring-offset-1 focus:ring-offset-[#131313] cursor-pointer accent-[#e50914]"
      />
      <label
        htmlFor={id}
        className="font-['Chivo'] text-xs md:text-sm text-[#e9bcb6] cursor-pointer select-none"
      >
        Remember me for 30 days
      </label>
    </div>
  );
};
