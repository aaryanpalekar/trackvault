import { Expense } from "@/lib/types";
import { CATEGORIES, PAYMENT_METHODS } from "@/lib/types";
import { Currency } from "@/lib/currencies";
import WeeklyChart from "@/components/WeeklyChart";
import { TrendingDown, CreditCard, Tag, Calendar } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Period = "week" | "month" | "year";

interface StatsPageProps {
  weeklyData: { name: string; total: number; isToday: boolean }[];
  allExpenses: Expense[];
  currency: Currency;
}

export default function StatsPage({ weeklyData, allExpenses, currency }: StatsPageProps) {
  const [period, setPeriod] = useState<Period>("week");

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    let start: Date;
    if (period === "week") {
      const dow = now.getDay();
      start = new Date(now);
      start.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
      start.setHours(0, 0, 0, 0);
    } else if (period === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      start = new Date(now.getFullYear(), 0, 1);
    }
    return allExpenses.filter(e => e.timestamp >= start.getTime());
  }, [allExpenses, period]);

  const periodTotal = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayTotal = allExpenses.filter(e => e.timestamp >= todayStart.getTime()).reduce((s, e) => s + e.amount, 0);

  const daysInPeriod = period === "week" ? 7 : period === "month" ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() : (new Date().getFullYear() % 4 === 0 ? 366 : 365);
  const avgDaily = periodTotal / daysInPeriod;

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([cat, total]) => ({
        category: cat,
        total,
        emoji: CATEGORIES.find(c => c.label === cat)?.emoji ?? "📦",
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenses]);

  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      map[e.paymentMethod] = (map[e.paymentMethod] || 0) + e.amount;
    });
    return Object.entries(map).map(([method, total]) => {
      const pm = PAYMENT_METHODS.find(p => p.value === method);
      return { method: pm?.label ?? method, icon: pm?.icon ?? "💰", total };
    }).sort((a, b) => b.total - a.total);
  }, [filteredExpenses]);

  const periodLabels: Record<Period, string> = { week: "This Week", month: "This Month", year: "This Year" };

  return (
    <div className="animate-slide-up">
      <h1 className="mb-4 font-heading text-2xl font-bold">Statistics</h1>

      {/* Period Selector */}
      <div className="mb-4 flex rounded-xl bg-secondary p-1">
        {(["week", "month", "year"] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "flex-1 rounded-lg py-2 text-xs font-semibold transition-colors capitalize",
              period === p ? "bg-card shadow-card text-foreground" : "text-muted-foreground"
            )}
          >
            {p === "week" ? "Weekly" : p === "month" ? "Monthly" : "Yearly"}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-card p-3 shadow-card">
          <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
            <TrendingDown className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-[10px] text-muted-foreground">Today</p>
          <p className="font-heading text-base font-bold">{currency.symbol}{todayTotal.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl bg-card p-3 shadow-card">
          <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-xl bg-accent/10">
            <Calendar className="h-3.5 w-3.5 text-accent" />
          </div>
          <p className="text-[10px] text-muted-foreground">{periodLabels[period]}</p>
          <p className="font-heading text-base font-bold">{currency.symbol}{periodTotal.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl bg-card p-3 shadow-card">
          <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-xl bg-accent/10">
            <CreditCard className="h-3.5 w-3.5 text-accent" />
          </div>
          <p className="text-[10px] text-muted-foreground">Avg/day</p>
          <p className="font-heading text-base font-bold">{currency.symbol}{Math.round(avgDaily).toLocaleString()}</p>
        </div>
      </div>

      {period === "week" && (
        <div className="mb-4">
          <WeeklyChart data={weeklyData} currency={currency} />
        </div>
      )}

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="mb-4 rounded-2xl bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-heading text-sm font-semibold">By Category</h3>
          </div>
          <div className="space-y-3">
            {categoryBreakdown.map(item => {
              const pct = periodTotal > 0 ? (item.total / periodTotal) * 100 : 0;
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

      {filteredExpenses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <span className="text-4xl mb-2">📊</span>
          <p className="text-sm font-medium">No expenses for this period</p>
        </div>
      )}
    </div>
  );
}
