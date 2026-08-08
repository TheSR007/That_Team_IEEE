import React from "react";

interface SignUpHeaderProps {
  title?: string;
  subtitle?: string;
}

export const SignUpHeader: React.FC<SignUpHeaderProps> = ({
  title = "Join the Premiere Club",
  subtitle = "Create your account to unlock exclusive bookings and premium experiences.",
}) => {
  return (
    <div className="flex flex-col gap-1 text-center">
      <h2 className="font-['Anybody'] text-2xl md:text-4xl font-bold text-[#e5e2e1]">
        {title}
      </h2>
      <p className="font-['Chivo'] text-sm md:text-base text-[#e9bcb6]">
        {subtitle}
      </p>
    </div>
  );
};
