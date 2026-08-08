import { Link } from "react-router";

export function SeatFooter() {
  return (
    <footer className="bg-[#0e0e0e] border-t border-white/5 flex flex-col items-center justify-center py-10 px-6 w-full mt-16 text-center">
      <Link
        to="/browse"
        className="font-headline-md text-2xl font-bold text-[#e50914] mb-4 tracking-wide hover:opacity-90 transition-opacity"
      >
        CinemaSeat
      </Link>
      <nav className="flex flex-wrap justify-center gap-6 mb-6">
        <Link
          to="#"
          className="text-xs text-[#e9bcb6]/80 hover:text-[#e5e2e1] transition-colors hover:underline"
        >
          About Us
        </Link>
        <Link
          to="#"
          className="text-xs text-[#e9bcb6]/80 hover:text-[#e5e2e1] transition-colors hover:underline"
        >
          Terms of Service
        </Link>
        <Link
          to="#"
          className="text-xs text-[#e9bcb6]/80 hover:text-[#e5e2e1] transition-colors hover:underline"
        >
          Privacy Policy
        </Link>
        <Link
          to="#"
          className="text-xs text-[#e9bcb6]/80 hover:text-[#e5e2e1] transition-colors hover:underline"
        >
          Contact Support
        </Link>
      </nav>
      <p className="text-xs text-[#e9bcb6]/60">
        © 2024 CinemaSeat. Premier Night Out Experience.
      </p>
    </footer>
  );
}
