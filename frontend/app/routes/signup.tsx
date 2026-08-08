import { Navigate } from "react-router";
import type { Route } from "./+types/signup";
import { SignUp as ClerkSignUp } from "@clerk/clerk-react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router";

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
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#e50914] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative min-h-screen flex flex-col font-['Chivo'] antialiased overflow-hidden">
      {/* Full-bleed background image from public folder */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/cinema-bg.jpg')` }}
      />

      {/* Dark overlay — adapts to system light/dark preference */}
      <div className="absolute inset-0 bg-black/60 dark:bg-black/70" />

      {/* Gradient fade at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

      {/* Minimal top navbar — brand only */}
      <header className="relative z-20 flex items-center px-6 lg:px-16 py-5">
        <Link
          to="/"
          className="font-['Anybody'] text-2xl font-extrabold text-[#e50914] tracking-tighter drop-shadow-lg"
        >
          CinemaSeat
        </Link>
      </header>

      {/* Centered auth form */}
      <main
        className="flex-grow relative z-10"
        style={{ display: "grid", placeItems: "center", padding: "1rem" }}
      >
        <div style={{ width: "min(448px, 100%)" }}>
          <ClerkSignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            appearance={{
              variables: {
                colorBackground: "#ffffff",
                colorText: "#111111",
                colorPrimary: "#e50914",
                colorInputBackground: "#f8f8f8",
                colorInputText: "#111111",
                borderRadius: "0.75rem",
              },
              elements: {
                card: "bg-white shadow-2xl rounded-2xl p-6 w-full",
                headerTitle: "text-gray-900 text-2xl font-bold font-['Anybody']",
                headerSubtitle: "text-gray-500 text-sm",
                socialButtonsBlockButton:
                  "bg-gray-50 border border-gray-200 text-gray-800 hover:bg-gray-100 transition-all",
                formButtonPrimary:
                  "bg-[#e50914] hover:bg-[#b80710] text-white font-bold transition-all shadow-lg shadow-[#e50914]/30",
                footerActionLink:
                  "text-[#e50914] hover:text-[#b80710] font-bold transition-colors",
                footerAction: "hidden",
                formFieldLabel:
                  "text-gray-600 text-xs font-semibold uppercase tracking-wider",
                formFieldInput:
                  "bg-gray-50 border border-gray-200 text-gray-900 focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914]",
                dividerLine: "bg-gray-200",
                dividerText: "text-gray-400 text-xs",
              },
            }}
          />
        </div>
      </main>
    </div>
  );
}
