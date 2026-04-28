import { useMemo } from "react";
import { Expense } from "@/lib/types";
import { Currency } from "@/lib/currencies";
import { CATEGORIES, PAYMENT_METHODS } from "@/lib/types";
import { X, TrendingDown } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

interface DayDetailDrawerProps {
  open: boolean;
  date: Date | null;
  expenses: Expense[];
  currency: Currency;
  onClose: () => void;
  onEdit?: (exp: Expense) => void;
  /** Optional category filter — only show items matching this category */
  filterCategory?: string;
  /** Optional explicit range (epoch ms). When provided, overrides single-day filtering. */
  rangeStart?: number;
  rangeEnd?: number;
  /** Optional label override shown in the header (e.g. "April 2026") */
  rangeLabel?: string;
}

export default function DayDetailDrawer({
  open, date, expenses, currency, onClose, onEdit, filterCategory, rangeStart, rangeEnd, rangeLabel,
}: DayDetailDrawerProps) {
  const items = useMemo(() => {
    let start: number;
    let end: number;
    if (rangeStart !== undefined && rangeEnd !== undefined) {
      start = rangeStart;
      end = rangeEnd;
    } else if (date) {
      const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
      start = dayStart.getTime();
      end = start + 24 * 60 * 60 * 1000 - 1;
    } else {
      return [];
    }
    return expenses
      .filter(e => e.timestamp >= start && e.timestamp <= end)
      .filter(e => !filterCategory || e.category === filterCategory)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [date, expenses, filterCategory, rangeStart, rangeEnd]);

  const total = items.reduce((s, e) => s + e.amount, 0);

  // Category summary within the day
  const categorySummary = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map)
      .map(([cat, sum]) => ({
        cat, sum,
        emoji: CATEGORIES.find(c => c.label === cat)?.emoji ?? "📦",
        pct: total > 0 ? (sum / total) * 100 : 0,
      }))
      .sort((a, b) => b.sum - a.sum);
  }, [items, total]);

  if (!open) return null;
  const isRange = rangeStart !== undefined && rangeEnd !== undefined;
  if (!isRange && !date) return null;

  let dateLabel = date ? format(date, "EEE, dd/MM/yyyy") : "";
  if (date && isToday(date)) dateLabel = `Today · ${format(date, "dd/MM/yyyy")}`;
  else if (date && isYesterday(date)) dateLabel = `Yesterday · ${format(date, "dd/MM/yyyy")}`;
  if (rangeLabel) dateLabel = rangeLabel;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-stretch md:justify-end">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto animate-slide-up rounded-t-3xl bg-card p-6 pb-10 shadow-elevated md:max-h-screen md:h-screen md:max-w-lg md:rounded-none md:rounded-l-3xl md:animate-slide-in-right md:pb-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">{dateLabel}</p>
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">
              {currency.symbol}{total.toLocaleString()}
            </h2>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3 w-3" /> {items.length} {items.length === 1 ? "transaction" : "transactions"}
              {filterCategory && <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary font-semibold">{filterCategory}</span>}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-secondary" aria-label="Close">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <span className="text-4xl mb-2">🌿</span>
            <p className="text-sm font-medium">No spending {filterCategory ? `on ${filterCategory}` : ""} {isRange ? "in this period" : "this day"}</p>
          </div>
        ) : (
          <>
            {/* Category mini-summary */}
            {!filterCategory && categorySummary.length > 1 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">By category</p>
                <div className="space-y-1.5">
                  {categorySummary.map(c => (
                    <div key={c.cat}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium">{c.emoji} {c.cat}</span>
                        <span className="font-bold">
                          {currency.symbol}{c.sum.toLocaleString()}
                          <span className="ml-1 text-muted-foreground font-normal">({c.pct.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${c.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Item list */}
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Items</p>
            <div className="space-y-2">
              {items.map(exp => {
                const cat = CATEGORIES.find(c => c.label === exp.category);
                const pm = PAYMENT_METHODS.find(p => p.value === exp.paymentMethod);
                const title = exp.customName || exp.category;
                return (
                  <button
                    key={exp.id}
                    onClick={() => onEdit?.(exp)}
                    className="flex w-full items-center gap-3 rounded-2xl bg-secondary/40 p-3 text-left transition-colors hover:bg-secondary"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card text-lg">
                      {cat?.emoji ?? "📦"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {title}
                        {exp.customName && <span className="ml-1 text-[10px] text-muted-foreground font-normal">· {exp.category}</span>}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {pm?.icon} {pm?.label} · {format(new Date(exp.timestamp), "h:mm a")}
                        {exp.note && ` · ${exp.note}`}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-destructive whitespace-nowrap">
                      -{currency.symbol}{exp.amount.toLocaleString()}
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
