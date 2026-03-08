export type PaymentMethod = "cash" | "upi" | "net_banking";

export interface Expense {
  id: string;
  amount: number;
  category: string;
  paymentMethod: PaymentMethod;
  timestamp: number;
  note?: string;
}

export interface Borrowing {
  id: string;
  personName: string;
  amount: number;
  reason?: string;
  borrowedOn: number; // timestamp
  settled: boolean;
  settledOn?: number;
}

export const QUICK_AMOUNTS = [10, 20, 50, 100] as const;

export const CATEGORIES = [
  { label: "Tea/Coffee", emoji: "☕" },
  { label: "Snacks", emoji: "🍿" },
  { label: "Auto/Cab", emoji: "🛺" },
  { label: "Food", emoji: "🍛" },
  { label: "Shopping", emoji: "🛍️" },
  { label: "Other", emoji: "📦" },
] as const;

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: "cash", label: "Cash", icon: "💵" },
  { value: "upi", label: "UPI", icon: "📱" },
  { value: "net_banking", label: "Net Banking", icon: "🏦" },
];
