import type { Route } from "./+types/signin";
import { AuthTopNav } from "../Components/signin/AuthTopNav";
import { CinematicBanner } from "../Components/signin/CinematicBanner";
import { SignInHeader } from "../Components/signin/SignInHeader";
import { SignInForm } from "../Components/signin/SignInForm";
import { CinemaFooter } from "../Components/signin/CinemaFooter";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "CinemaSeat - Sign In" },
    {
      name: "description",
      content:
        "Sign in to access exclusive premieres and manage your luxury bookings.",
    },
  ];
}

export default function SignIn() {
  return (
    <div className="bg-[#131313] text-[#e5e2e1] min-h-screen flex flex-col font-['Chivo'] antialiased selection:bg-[#e50914] selection:text-white">
      {/* Top Navbar */}
      <AuthTopNav />

      {/* Main Split Content */}
      <main className="flex-grow flex w-full">
        {/* Left Side: Cinematic Banner */}
        <CinematicBanner />

        {/* Right Side: Sign In Card Container */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-16 bg-[#131313] relative overflow-hidden">
          {/* Accent Glow Effect */}
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#e50914]/5 rounded-full blur-[100px] pointer-events-none" />

          {/* Glass Card */}
          <div className="glass-card w-full max-w-2xl rounded-xl p-6 md:p-8 relative z-10 flex flex-col gap-6">
            <SignInHeader />
            <SignInForm />
          </div>
        </div>
      </main>

      {/* Footer */}
      <CinemaFooter />
    </div>
  );
}
