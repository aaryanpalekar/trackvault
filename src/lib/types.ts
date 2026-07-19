export type PaymentMethod = "cash" | "upi" | "net_banking";

export interface Expense {
  id: string;
  amount: number;
  category: string;
  paymentMethod: PaymentMethod;
  /** When the expense actually happened (epoch ms) */
  timestamp: number;
  note?: string;
  /** Custom item name when category is "Other" */
  customName?: string;
}

export type BorrowingType = "lent" | "owed";

export interface Borrowing {
  id: string;
  personName: string;
  amount: number;
  reason?: string;
  borrowedOn: number;
  settled: boolean;
  settledOn?: number;
  type: BorrowingType;
}

export const QUICK_AMOUNTS = [10, 20, 50, 100] as const;

export const CATEGORIES = [
  { label: "Tea/Coffee", emoji: "☕" },
  { label: "Snacks", emoji: "🍿" },
  { label: "Auto/Cab", emoji: "🛺" },
  { label: "Metro", emoji: "🚇" },
  { label: "Food", emoji: "🍛" },
  { label: "Grocery", emoji: "🛒" },
  { label: "Shopping", emoji: "🛍️" },
  { label: "Stationery", emoji: "✏️" },
  { label: "Other", emoji: "📦" },
] as const;

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: "cash", label: "Cash", icon: "💵" },
  { value: "upi", label: "UPI", icon: "📱" },
  { value: "net_banking", label: "Net Banking", icon: "🏦" },
];

export interface Income {
  id: string;
  amount: number;
  source: string;
  note?: string;
  /** Epoch ms when the income was received */
  receivedOn: number;
}

export const INCOME_SOURCES = [
  { label: "Salary", emoji: "💼" },
  { label: "Freelance", emoji: "💻" },
  { label: "Refund", emoji: "↩️" },
  { label: "Gift", emoji: "🎁" },
  { label: "Friend", emoji: "🤝" },
  { label: "Investment", emoji: "📈" },
  { label: "Other", emoji: "💰" },
] as const;
