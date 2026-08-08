import { useParams, Link } from "react-router";
import { useState } from "react";
import {
  getPaymentDataByMovieAndSeat,
  type PaymentMethodType,
} from "../data/paymentData";
import { PaymentHeader } from "../Components/payment/PaymentHeader";
import { PaymentMethodSelector } from "../Components/payment/PaymentMethodSelector";
import { CreditCardForm } from "../Components/payment/CreditCardForm";
import { OrderSummarySidebar } from "../Components/payment/OrderSummarySidebar";
import { PaymentSuccessModal } from "../Components/payment/PaymentSuccessModal";
import { PaymentFooter } from "../Components/payment/PaymentFooter";

export default function PaymentPage() {
  const params = useParams();
  const movieId = params.movie_id;
  const seatId = params.seat_id;

  const paymentData = getPaymentDataByMovieAndSeat(movieId, seatId);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("card");
  const [cardName, setCardName] = useState("JANE DOE");
  const [cardNumber, setCardNumber] = useState("4532 1123 9081 2244");
  const [expiry, setExpiry] = useState("12/28");
  const [cvv, setCvv] = useState("888");

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

  const handlePayNow = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const randomRef = "CS-" + Math.floor(100000 + Math.random() * 900000);
      setBookingRef(randomRef);
      setIsProcessing(false);
      setIsSuccessModalOpen(true);
    }, 1200);
  };

  return (
    <div className="bg-[#131313] text-[#e5e2e1] min-h-screen flex flex-col font-sans selection:bg-[#e50914] selection:text-white">
      {/* Top Header */}
      <PaymentHeader />

      {/* Main Content Container */}
      <main className="flex-grow container mx-auto px-4 md:px-16 py-8 max-w-[1600px] w-full">
        {/* Back Link & Title */}
        <div className="mb-8">
          <Link
            to={`/select_seat/${paymentData.movieId}`}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-[#e50914] transition-colors font-bold text-sm mb-3 group"
          >
            <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">
              arrow_back
            </span>
            Back to Seat Selection
          </Link>
          <h1 className="font-extrabold text-3xl md:text-4xl text-white tracking-tight">
            Complete Payment
          </h1>
        </div>

        {/* 12-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Payment Form Section (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-[#1c1b1b] rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl">
              {/* Payment Method Tabs */}
              <PaymentMethodSelector
                selectedMethod={paymentMethod}
                onSelectMethod={setPaymentMethod}
              />

              {/* Card / Method Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePayNow();
                }}
                className="mt-6 border-t border-white/10 pt-6"
              >
                <CreditCardForm
                  method={paymentMethod}
                  cardName={cardName}
                  setCardName={setCardName}
                  cardNumber={cardNumber}
                  setCardNumber={setCardNumber}
                  expiry={expiry}
                  setExpiry={setExpiry}
                  cvv={cvv}
                  setCvv={setCvv}
                />
              </form>
            </div>
          </div>

          {/* Order Summary Sidebar Section (4 Cols) */}
          <div className="lg:col-span-4">
            <OrderSummarySidebar
              data={paymentData}
              onPayNow={handlePayNow}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <PaymentFooter />

      {/* Payment Success Confirmation Modal */}
      {isSuccessModalOpen && (
        <PaymentSuccessModal
          data={paymentData}
          bookingRef={bookingRef}
          onClose={() => setIsSuccessModalOpen(false)}
        />
      )}
    </div>
  );
}
