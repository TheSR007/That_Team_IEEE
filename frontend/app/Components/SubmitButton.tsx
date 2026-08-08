import React from "react";

interface SubmitButtonProps {
  children: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  children,
  isLoading = false,
  disabled = false,
}) => {
  return (
    <button
      type="submit"
      disabled={disabled || isLoading}
      className="w-full mt-4 bg-[#e50914] hover:bg-[#c0000c] disabled:opacity-50 text-[#fff7f6] font-['Chivo'] font-bold text-sm uppercase py-4 rounded-lg transition-all duration-300 transform active:scale-[0.98] shadow-[0_0_20px_rgba(229,9,20,0.15)] hover:shadow-[0_0_30px_rgba(229,9,20,0.3)] flex justify-center items-center gap-2 cursor-pointer"
    >
      {isLoading ? (
        <span className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
      ) : (
        <>
          {children}
          <span className="material-symbols-outlined text-[18px]">
            arrow_forward
          </span>
        </>
      )}
    </button>
  );
};
