import { useMemo } from "react";
import { Expense } from "@/lib/types";
import { Currency } from "@/lib/currencies";
import { useBudgets } from "@/hooks/useBudgets";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  expenses: Expense[];
  currency: Currency;
  className?: string;
}

export default function BudgetProgressBar({ expenses, currency, className }: Props) {
  const { budgets } = useBudgets();

  const { spent, remaining, pct, over, monthLabel } = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
    const s = expenses
      .filter(e => e.timestamp >= monthStart && e.timestamp < nextMonthStart)
      .reduce((sum, e) => sum + e.amount, 0);
    const cap = budgets.overall ?? 0;
    const p = cap > 0 ? Math.min((s / cap) * 100, 100) : 0;
    return {
      spent: s,
      remaining: Math.max(cap - s, 0),
      pct: p,
      over: cap > 0 && s > cap,
      monthLabel: now.toLocaleString("default", { month: "long" }),
    };
  }, [expenses, budgets.overall]);

  if (!budgets.overall) return null;

  const fmt = (n: number) => `${currency.symbol}${Math.round(n).toLocaleString()}`;

  return (
    <div className={cn("mb-4 rounded-3xl border border-border/60 bg-card p-4 shadow-card", className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {monthLabel} budget
            </p>
            <p className="font-heading text-sm font-semibold">
              {fmt(spent)} <span className="text-muted-foreground font-normal">of</span> {fmt(budgets.overall!)}
            </p>
          </div>
        </div>
        <p className={cn(
          "font-heading text-sm font-bold",
          over ? "text-accent" : "text-primary",
        )}>
          {over ? `${fmt(spent - budgets.overall!)} over` : `${fmt(remaining)} left`}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            over ? "bg-gradient-to-r from-accent to-destructive" : "bg-gradient-primary",
          )}
          style={{ width: `${Math.max(pct, 3)}%` }}
        />
      </div>
    </div>
  );
}
