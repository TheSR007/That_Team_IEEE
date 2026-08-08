import { Link } from "react-router";

export function PaymentFooter() {
  return (
    <footer className="bg-[#0e0e0e] border-t border-white/5 flex flex-col items-center justify-center py-10 px-4 md:px-16 w-full mt-16 text-center">
      <div className="font-extrabold text-2xl text-[#e50914] mb-4 tracking-tighter">
        CinemaSeat
      </div>
      <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-4 text-xs font-semibold text-gray-400">
        <Link to="/browse" className="hover:text-white transition-colors hover:underline">
          About Us
        </Link>
        <Link to="/browse" className="hover:text-white transition-colors hover:underline">
          Terms of Service
        </Link>
        <Link to="/browse" className="hover:text-white transition-colors hover:underline">
          Privacy Policy
        </Link>
        <Link to="/browse" className="hover:text-white transition-colors hover:underline">
          Contact Support
        </Link>
      </div>
      <div className="text-xs text-gray-500 font-medium">
        © 2024 CinemaSeat. Premier Night Out Experience.
      </div>
    </footer>
  );
}
