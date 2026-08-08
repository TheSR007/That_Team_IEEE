import React from "react";

interface SocialLoginButtonsProps {
  onGoogleClick?: () => void;
  onAppleClick?: () => void;
}

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onGoogleClick,
  onAppleClick,
}) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center my-1">
        <div className="flex-grow h-px bg-white/10"></div>
        <span className="px-3 font-['Chivo'] text-xs text-[#e9bcb6]">
          or continue with
        </span>
        <div className="flex-grow h-px bg-white/10"></div>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onGoogleClick}
          className="social-btn flex-1 bg-[#050505] rounded-lg py-3 flex items-center justify-center gap-2 text-[#e5e2e1] font-['Chivo'] font-bold text-sm cursor-pointer"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </button>
        <button
          type="button"
          onClick={onAppleClick}
          className="social-btn flex-1 bg-[#050505] rounded-lg py-3 flex items-center justify-center gap-2 text-[#e5e2e1] font-['Chivo'] font-bold text-sm cursor-pointer"
        >
          <svg
            className="w-5 h-5 fill-current"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.05 20.28c-.98.95-2.05 1.8-3.08 1.8-1.09 0-1.46-.67-2.73-.67-1.28 0-1.71.65-2.71.65-1.05 0-2.22-.96-3.11-2.25-1.51-2.2-2.58-5.74-2.58-8.58 0-3.32 1.76-5.46 4.14-5.46 1.33 0 2.44.82 3.19.82.78 0 2.13-.98 3.73-.98 1.25.04 2.87.53 3.86 1.95-3.31 1.82-2.73 6.64.44 7.91-1.07 2.45-2.26 4.38-3.15 4.81zm-4.73-15.6c-.1-2.12 1.65-4.14 3.76-4.32.25 2.22-1.85 4.16-3.76 4.32z" />
          </svg>
          Apple
        </button>
      </div>
    </div>
  );
};
