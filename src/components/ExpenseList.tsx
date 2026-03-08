import { Expense } from "@/lib/types";
import { Currency } from "@/lib/currencies";
import { CATEGORIES, PAYMENT_METHODS } from "@/lib/types";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";

interface ExpenseListProps {
  expenses: Expense[];
  currency: Currency;
  onDelete: (id: string) => void;
}

export default function ExpenseList({ expenses, currency, onDelete }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <span className="text-4xl mb-2">🎉</span>
        <p className="text-sm font-medium">No expenses yet today!</p>
        <p className="text-xs">Tap + to add your first one</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {expenses.map(exp => {
        const cat = CATEGORIES.find(c => c.label === exp.category);
        const pm = PAYMENT_METHODS.find(p => p.value === exp.paymentMethod);
        return (
          <div
            key={exp.id}
            className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card animate-pop-in"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-lg">
              {cat?.emoji ?? "📦"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{exp.category}</p>
              <p className="text-[10px] text-muted-foreground">
                {pm?.icon} {pm?.label} · {format(new Date(exp.timestamp), "h:mm a")}
                {exp.note && ` · ${exp.note}`}
              </p>
            </div>
            <p className="text-sm font-bold text-destructive">
              -{currency.symbol}{exp.amount}
            </p>
            <button
              onClick={() => onDelete(exp.id)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
