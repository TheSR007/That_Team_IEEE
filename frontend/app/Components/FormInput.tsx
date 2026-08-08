import React, { useState } from "react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  iconName: string;
  isPassword?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  id,
  label,
  iconName,
  isPassword = false,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="font-['Chivo'] text-xs text-[#e9bcb6] uppercase tracking-wider font-medium"
      >
        {label}
      </label>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#e9bcb6]/50 text-xl pointer-events-none">
          {iconName}
        </span>
        <input
          id={id}
          name={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full bg-[#0e0e0e] border border-white/10 rounded-lg py-3 pl-10 pr-10 text-[#e5e2e1] font-['Chivo'] text-base placeholder:text-[#e9bcb6]/30 focus:border-[#e50914] focus:outline-none transition-colors input-glow"
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#e9bcb6] hover:text-[#e5e2e1] transition-colors focus:outline-none cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <span className="material-symbols-outlined text-[20px] leading-none">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
