import { format, startOfMonth, endOfMonth } from "date-fns";
import { Expense, PAYMENT_METHODS } from "@/lib/types";
import { Currency } from "@/lib/currencies";

interface CsvInput {
  month: Date;
  currency: Currency;
  expenses: Expense[];
}

function escapeCsv(v: string | number): string {
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function generateMonthlyCsv({ month, currency, expenses }: CsvInput) {
  const start = startOfMonth(month).getTime();
  const end = endOfMonth(month).getTime();
  const rows = expenses
    .filter(e => e.timestamp >= start && e.timestamp <= end)
    .sort((a, b) => a.timestamp - b.timestamp);

  const header = ["Date", "Paid For", "Category", "Payment", `Amount (${currency.code})`];
  const body = rows.map(e => {
    const pm = PAYMENT_METHODS.find(p => p.value === e.paymentMethod);
    const item = e.customName?.trim() || e.note?.trim() || e.category;
    return [
      format(new Date(e.timestamp), "dd MMM yyyy"),
      item,
      e.category,
      pm?.label ?? e.paymentMethod,
      e.amount.toFixed(2),
    ];
  });

  const total = rows.reduce((s, e) => s + e.amount, 0);
  body.push(["", "", "", "Total", total.toFixed(2)]);

  const csv = [header, ...body].map(r => r.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Expense-Report-${format(month, "yyyy-MM")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
