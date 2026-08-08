import { Navigate } from "react-router";
import type { Route } from "./+types/home";
import BrowsePage from "./browse";
import { useAuth } from "../context/AuthContext";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "CinemaSeat - Premier Cinema Experience" },
    { name: "description", content: "Welcome to CinemaSeat Movie Catalog." },
  ];
}

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#e50914] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <BrowsePage />;
}
