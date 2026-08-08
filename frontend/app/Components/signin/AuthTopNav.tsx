import React from "react";
import { Link } from "react-router";
import { UserButton } from "@clerk/clerk-react";
import { useAuth } from "../../context/AuthContext";

export const AuthTopNav: React.FC = () => {
  const { isSignedIn } = useAuth();

  return (
    <header className="bg-[#131313]/90 border-b border-white/10 backdrop-blur-md shadow-md flex justify-between items-center px-6 lg:px-16 py-4 w-full sticky top-0 z-50">
      <Link
        to="/"
        className="font-['Anybody'] text-2xl font-extrabold text-[#e50914] tracking-tighter"
      >
        CinemaSeat
      </Link>

      {isSignedIn && (
        <div className="flex items-center gap-4">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-9 h-9 border border-white/20",
              },
            }}
          />
        </div>
      )}
    </header>
  );
};
