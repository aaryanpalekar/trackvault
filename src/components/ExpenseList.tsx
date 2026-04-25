import { Expense } from "@/lib/types";
import { Currency } from "@/lib/currencies";
import { CATEGORIES, PAYMENT_METHODS } from "@/lib/types";
import { Trash2, Pencil } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

interface ExpenseListProps {
  expenses: Expense[];
  currency: Currency;
  onDelete: (id: string) => void;
  onEdit?: (exp: Expense) => void;
  /** When true, show full date "DD/MM/YYYY · h:mm a"; otherwise show just time */
  showFullDate?: boolean;
  emptyMessage?: string;
}

export default function ExpenseList({
  expenses,
  currency,
  onDelete,
  onEdit,
  showFullDate = false,
  emptyMessage,
}: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <span className="text-4xl mb-2">🎉</span>
        <p className="text-sm font-medium">{emptyMessage ?? "No expenses yet today!"}</p>
        {!emptyMessage && <p className="text-xs">Tap + to add your first one</p>}
      </div>
    );
  }

  const formatWhen = (ts: number) => {
    const d = new Date(ts);
    if (showFullDate) {
      let label = format(d, "dd/MM/yyyy");
      if (isToday(d)) label = "Today";
      else if (isYesterday(d)) label = "Yesterday";
      return `${label} · ${format(d, "h:mm a")}`;
    }
    return format(d, "h:mm a");
  };

  return (
    <div className="space-y-2">
      {expenses.map(exp => {
        const cat = CATEGORIES.find(c => c.label === exp.category);
        const pm = PAYMENT_METHODS.find(p => p.value === exp.paymentMethod);
        const title = exp.customName ? exp.customName : exp.category;
        return (
          <div
            key={exp.id}
            className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card animate-pop-in"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-lg">
              {cat?.emoji ?? "📦"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {title}
                {exp.customName && <span className="ml-1 text-[10px] text-muted-foreground font-normal">· {exp.category}</span>}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {pm?.icon} {pm?.label} · {formatWhen(exp.timestamp)}
                {exp.note && ` · ${exp.note}`}
              </p>
            </div>
            <p className="text-sm font-bold text-destructive whitespace-nowrap">
              -{currency.symbol}{exp.amount}
            </p>
            {onEdit && (
              <button
                onClick={() => onEdit(exp)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                aria-label="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => onDelete(exp.id)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              aria-label="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
