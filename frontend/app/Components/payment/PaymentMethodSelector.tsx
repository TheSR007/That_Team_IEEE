import type { PaymentMethodType } from "../../data/paymentData";

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType;
  onSelectMethod: (method: PaymentMethodType) => void;
}

export function PaymentMethodSelector({
  selectedMethod,
  onSelectMethod,
}: PaymentMethodSelectorProps) {
  const methods: { id: PaymentMethodType; label: string; icon: string }[] = [
    { id: "card", label: "Credit Card", icon: "credit_card" },
    { id: "wallet", label: "Digital Wallet", icon: "account_balance_wallet" },
    { id: "gift", label: "Gift Card", icon: "redeem" },
  ];

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-[#e5e2e1] mb-4">Payment Method</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {methods.map((method) => {
          const isSelected = selectedMethod === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelectMethod(method.id)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all cursor-pointer h-full ${
                isSelected
                  ? "border-[#e50914] bg-[#2a1314] text-white shadow-[0_0_20px_rgba(229,9,20,0.25)]"
                  : "border-white/10 bg-[#201f1f] text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200"
              }`}
            >
              <span
                className={`material-symbols-outlined text-3xl mb-2 transition-colors ${
                  isSelected ? "text-[#e50914]" : "text-gray-400"
                }`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {method.icon}
              </span>
              <span
                className={`text-xs md:text-sm font-bold ${
                  isSelected ? "text-white" : "text-gray-300"
                }`}
              >
                {method.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
