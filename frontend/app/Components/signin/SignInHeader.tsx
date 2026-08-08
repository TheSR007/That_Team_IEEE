import React from "react";

interface SignInHeaderProps {
  title?: string;
  subtitle?: string;
}

export const SignInHeader: React.FC<SignInHeaderProps> = ({
  title = "Welcome Back",
  subtitle = "Please enter your details to sign in.",
}) => {
  return (
    <div className="text-center mb-2">
      <h2 className="font-['Anybody'] text-2xl md:text-3xl font-bold text-white mb-1">
        {title}
      </h2>
      <p className="font-['Chivo'] text-sm md:text-base text-[#e9bcb6]">
        {subtitle}
      </p>
    </div>
  );
};
