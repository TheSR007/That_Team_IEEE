import { Link } from "react-router";

export function PaymentHeader() {
  return (
    <header className="bg-[#131313] border-b border-white/10 backdrop-blur-md shadow-md sticky top-0 z-50">
      <div className="flex justify-between items-center px-4 md:px-16 py-4 max-w-[1600px] mx-auto w-full">
        <Link
          to="/browse"
          className="font-extrabold text-2xl md:text-3xl text-[#e50914] tracking-tighter hover:opacity-90 transition-opacity"
        >
          CinemaSeat
        </Link>
        <div className="flex items-center text-[#e9bcb6] gap-2 text-sm opacity-80 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
          <span
            className="material-symbols-outlined text-base"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            lock
          </span>
          <span className="font-semibold text-xs md:text-sm">Secure Checkout</span>
        </div>
      </div>
    </header>
  );
}
