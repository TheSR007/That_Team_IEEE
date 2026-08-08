import type { Route } from "./+types/signup";
import { CinematicBanner } from "../Components/signup/CinematicBanner";
import { MobileHeader } from "../Components/MobileHeader";
import { SignUpHeader } from "../Components/SignUpHeader";
import { SignUpForm } from "../Components/signup/SignUpForm";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign Up - CinemaSeat" },
    {
      name: "description",
      content: "Join the Premiere Club and unlock exclusive movie bookings.",
    },
  ];
}

export default function SignUp() {
  return (
    <div className="bg-[#131313] text-[#e5e2e1] min-h-screen flex font-['Chivo'] antialiased overflow-hidden">
      {/* Left Side: Cinematic Atmospheric Imagery */}
      <CinematicBanner />

      {/* Right Side: Sign Up Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-16 relative z-20 bg-[#131313]">
        {/* Mobile Brand Logo */}
        <MobileHeader />

        {/* Card */}
        <div className="w-full max-w-5xl surface-highlight bg-[#1c1b1b] rounded-xl p-8 shadow-2xl flex flex-col gap-8 relative border border-white/5 backdrop-blur-md">
          <SignUpHeader />
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
