export interface Currency {
  code: string;
  symbol: string;
  name: string;
  quickAmounts: number[];
}

export const CURRENCIES: Currency[] = [
  { code: "INR", symbol: "₹", name: "Indian Rupee", quickAmounts: [10, 20, 50, 100] },
  { code: "USD", symbol: "$", name: "US Dollar", quickAmounts: [1, 2, 5, 10] },
  { code: "EUR", symbol: "€", name: "Euro", quickAmounts: [1, 2, 5, 10] },
  { code: "GBP", symbol: "£", name: "British Pound", quickAmounts: [1, 2, 5, 10] },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", quickAmounts: [100, 200, 500, 1000] },
  { code: "KRW", symbol: "₩", name: "South Korean Won", quickAmounts: [1000, 2000, 5000, 10000] },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka", quickAmounts: [10, 20, 50, 100] },
  { code: "PKR", symbol: "Rs", name: "Pakistani Rupee", quickAmounts: [20, 50, 100, 200] },
  { code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee", quickAmounts: [50, 100, 200, 500] },
  { code: "NPR", symbol: "रू", name: "Nepalese Rupee", quickAmounts: [10, 20, 50, 100] },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", quickAmounts: [1, 5, 10, 20] },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", quickAmounts: [1, 2, 5, 10] },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", quickAmounts: [1, 2, 5, 10] },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", quickAmounts: [1, 2, 5, 10] },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", quickAmounts: [5, 10, 20, 50] },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", quickAmounts: [100, 200, 500, 1000] },
  { code: "PHP", symbol: "₱", name: "Philippine Peso", quickAmounts: [20, 50, 100, 200] },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", quickAmounts: [5000, 10000, 20000, 50000] },
  { code: "THB", symbol: "฿", name: "Thai Baht", quickAmounts: [10, 20, 50, 100] },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", quickAmounts: [1, 2, 5, 10] },
];

export function getCurrency(code: string): Currency {
  return CURRENCIES.find(c => c.code === code) ?? CURRENCIES[0];
}
