import React from "react";

interface TermsCheckboxProps {
  id?: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

export const TermsCheckbox: React.FC<TermsCheckboxProps> = ({
  id = "terms",
  checked,
  onChange,
  required = true,
}) => {
  return (
    <div className="flex items-start gap-3 mt-2">
      <div className="flex items-center h-5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          required={required}
          className="w-4 h-4 bg-[#0e0e0e] border border-white/20 rounded focus:ring-[#e50914] focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#131313] text-[#e50914] cursor-pointer transition-colors hover:border-[#e50914]/50"
        />
      </div>
      <label
        htmlFor={id}
        className="font-['Chivo'] text-xs text-[#e9bcb6] cursor-pointer select-none"
      >
        I agree to the{" "}
        <a
          href="#"
          className="text-[#e50914] hover:underline hover:text-[#ffb4aa] transition-colors font-semibold"
        >
          Terms of Service
        </a>{" "}
        and{" "}
        <a
          href="#"
          className="text-[#e50914] hover:underline hover:text-[#ffb4aa] transition-colors font-semibold"
        >
          Privacy Policy
        </a>
        .
      </label>
    </div>
  );
};
