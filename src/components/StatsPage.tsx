import { Expense } from "@/lib/types";
import { CATEGORIES, PAYMENT_METHODS } from "@/lib/types";
import { Currency } from "@/lib/currencies";
import WeeklyChart from "@/components/WeeklyChart";
import { TrendingDown, CreditCard, Tag } from "lucide-react";
import { useMemo } from "react";

interface StatsPageProps {
  weeklyData: { name: string; total: number; isToday: boolean }[];
  weekExpenses: Expense[];
  todayExpenses: Expense[];
  currency: Currency;
}

export default function StatsPage({ weeklyData, weekExpenses, todayExpenses, currency }: StatsPageProps) {
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    weekExpenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([cat, total]) => ({
        category: cat,
        total,
        emoji: CATEGORIES.find(c => c.label === cat)?.emoji ?? "📦",
      }))
      .sort((a, b) => b.total - a.total);
  }, [weekExpenses]);

  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    weekExpenses.forEach(e => {
      map[e.paymentMethod] = (map[e.paymentMethod] || 0) + e.amount;
    });
    return Object.entries(map).map(([method, total]) => {
      const pm = PAYMENT_METHODS.find(p => p.value === method);
      return { method: pm?.label ?? method, icon: pm?.icon ?? "💰", total };
    }).sort((a, b) => b.total - a.total);
  }, [weekExpenses]);

  const weekTotal = weekExpenses.reduce((s, e) => s + e.amount, 0);
  const todayTotal = todayExpenses.reduce((s, e) => s + e.amount, 0);
  const avgDaily = weekTotal / 7;

  return (
    <div className="animate-slide-up">
      <h1 className="mb-6 font-heading text-2xl font-bold">Statistics</h1>

      {/* Summary Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
            <TrendingDown className="h-4 w-4 text-primary" />
          </div>
          <p className="text-[10px] text-muted-foreground">Today</p>
          <p className="font-heading text-lg font-bold">{currency.symbol}{todayTotal.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10">
            <CreditCard className="h-4 w-4 text-accent" />
          </div>
          <p className="text-[10px] text-muted-foreground">Avg/day</p>
          <p className="font-heading text-lg font-bold">{currency.symbol}{Math.round(avgDaily).toLocaleString()}</p>
        </div>
      </div>

      <div className="mb-4">
        <WeeklyChart data={weeklyData} currency={currency} />
      </div>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="mb-4 rounded-2xl bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-heading text-sm font-semibold">By Category</h3>
          </div>
          <div className="space-y-3">
            {categoryBreakdown.map(item => {
              const pct = weekTotal > 0 ? (item.total / weekTotal) * 100 : 0;
              return (
                <div key={item.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{item.emoji} {item.category}</span>
                    <span className="text-xs font-bold">{currency.symbol}{item.total.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Breakdown */}
      {paymentBreakdown.length > 0 && (
        <div className="mb-4 rounded-2xl bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-heading text-sm font-semibold">By Payment</h3>
          </div>
          <div className="space-y-2">
            {paymentBreakdown.map(item => (
              <div key={item.method} className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2">
                <span className="text-xs font-medium">{item.icon} {item.method}</span>
                <span className="text-xs font-bold">{currency.symbol}{item.total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
