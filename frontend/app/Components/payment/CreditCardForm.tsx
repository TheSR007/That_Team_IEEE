import { useState } from "react";
import type { PaymentMethodType } from "../../data/paymentData";

interface CreditCardFormProps {
  method: PaymentMethodType;
  cardName: string;
  setCardName: (val: string) => void;
  cardNumber: string;
  setCardNumber: (val: string) => void;
  expiry: string;
  setExpiry: (val: string) => void;
  cvv: string;
  setCvv: (val: string) => void;
}

export function CreditCardForm({
  method,
  cardName,
  setCardName,
  cardNumber,
  setCardNumber,
  expiry,
  setExpiry,
  cvv,
  setCvv,
}: CreditCardFormProps) {
  const [walletType, setWalletType] = useState<"apple" | "google" | "paypal">("apple");
  const [giftCode, setGiftCode] = useState("");

  const formatCardNumber = (value: string) => {
    const raw = value.replace(/\D/g, "").slice(0, 16);
    const parts = raw.match(/.{1,4}/g);
    return parts ? parts.join(" ") : "";
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const formatExpiry = (value: string) => {
    const raw = value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      return `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    return raw;
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpiry(formatExpiry(e.target.value));
  };

  if (method === "wallet") {
    return (
      <div className="space-y-4 bg-[#050505] p-5 rounded-xl border border-white/10">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
          Select Digital Wallet
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "apple", label: "Apple Pay", icon: "phone_iphone" },
            { id: "google", label: "Google Pay", icon: "account_balance_wallet" },
            { id: "paypal", label: "PayPal", icon: "payments" },
          ].map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setWalletType(w.id as any)}
              className={`p-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                walletType === w.id
                  ? "border-[#e50914] bg-[#2a1314] text-white"
                  : "border-white/10 bg-[#1c1b1b] text-gray-400 hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{w.icon}</span>
              {w.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          You will be redirected to complete payment with {walletType.toUpperCase()}.
        </p>
      </div>
    );
  }

  if (method === "gift") {
    return (
      <div className="space-y-4 bg-[#050505] p-5 rounded-xl border border-white/10">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
          Enter Gift Card or Voucher Code
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={giftCode}
            onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
            placeholder="GIFT-XXXX-XXXX-XXXX"
            className="flex-1 bg-[#131313] border border-white/10 rounded-lg px-4 py-3 text-white uppercase text-sm focus:border-[#e50914] focus:outline-none transition-colors"
          />
          <button
            type="button"
            className="bg-[#e50914] text-white font-bold text-xs uppercase px-5 rounded-lg hover:bg-[#c0000c] transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cardholder Name */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
          Cardholder Name
        </label>
        <input
          type="text"
          value={cardName}
          onChange={(e) => setCardName(e.target.value.toUpperCase())}
          placeholder="JANE DOE"
          className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914] transition-all uppercase placeholder-gray-600"
        />
      </div>

      {/* Card Number */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
          Card Number
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-xl">
            credit_card
          </span>
          <input
            type="text"
            value={cardNumber}
            onChange={handleCardNumberChange}
            placeholder="0000 0000 0000 0000"
            className="w-full bg-[#050505] border border-white/10 rounded-xl pl-12 pr-20 py-3 text-white font-mono tracking-widest focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914] transition-all placeholder-gray-600"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1.5 pointer-events-none">
            <div className="w-7 h-4 bg-white/10 rounded" title="Visa"></div>
            <div className="w-7 h-4 bg-white/10 rounded" title="Mastercard"></div>
          </div>
        </div>
      </div>

      {/* Expiry & CVV */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
            Expiry Date
          </label>
          <input
            type="text"
            value={expiry}
            onChange={handleExpiryChange}
            placeholder="MM/YY"
            className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914] transition-all placeholder-gray-600"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
            CVV
          </label>
          <div className="relative">
            <input
              type="password"
              maxLength={4}
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
              placeholder="123"
              className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914] transition-all placeholder-gray-600"
            />
            <span
              className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-500 text-sm cursor-help"
              title="3 or 4 digit security code on the back of card"
            >
              info
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
