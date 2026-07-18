import { useMemo } from "react";
import { TrendingDown, TrendingUp, Sparkles, PiggyBank, Target, Lightbulb } from "lucide-react";
import { Expense, Income } from "@/lib/types";
import { Currency } from "@/lib/currencies";

interface Props {
  expenses: Expense[];
  incomes: Income[];
  currency: Currency;
}

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const dow = x.getDay();
  x.setDate(x.getDate() - (dow === 0 ? 6 : dow - 1));
  return x;
}
function startOfMonth(d: Date) { const x = new Date(d.getFullYear(), d.getMonth(), 1); return x; }

function sumBetween(items: { timestamp?: number; receivedOn?: number; amount: number }[], startMs: number, endMs: number, key: "timestamp" | "receivedOn") {
  return items.reduce((s, i) => {
    const t = (i as any)[key] as number;
    return t >= startMs && t < endMs ? s + i.amount : s;
  }, 0);
}

export default function InsightsCard({ expenses, incomes, currency }: Props) {
  const insights = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now).getTime();
    const tomorrowStart = todayStart + 86400000;
    const weekStart = startOfWeek(now).getTime();
    const nextWeekStart = weekStart + 7 * 86400000;
    const lastWeekStart = weekStart - 7 * 86400000;
    const monthStart = startOfMonth(now).getTime();
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

    const spentToday = sumBetween(expenses as any, todayStart, tomorrowStart, "timestamp");
    const spentWeek = sumBetween(expenses as any, weekStart, nextWeekStart, "timestamp");
    const spentLastWeek = sumBetween(expenses as any, lastWeekStart, weekStart, "timestamp");
    const spentMonth = sumBetween(expenses as any, monthStart, nextMonthStart, "timestamp");
    const spentLastMonth = sumBetween(expenses as any, lastMonthStart, monthStart, "timestamp");

    const receivedMonth = sumBetween(incomes as any, monthStart, nextMonthStart, "receivedOn");
    const receivedWeek = sumBetween(incomes as any, weekStart, nextWeekStart, "receivedOn");

    // 30-day trailing daily average (excluding today) as "typical day"
    const trailStart = todayStart - 30 * 86400000;
    const trailSpend = sumBetween(expenses as any, trailStart, todayStart, "timestamp");
    const avgDay = trailSpend / 30;

    const savedToday = Math.max(0, avgDay - spentToday);
    const weekDelta = spentLastWeek - spentWeek; // positive = saved vs last week
    const monthDelta = spentLastMonth - spentMonth;
    const netMonth = receivedMonth - spentMonth;
    const netWeek = receivedWeek - spentWeek;

    const pctWeek = spentLastWeek > 0 ? Math.round((weekDelta / spentLastWeek) * 100) : 0;
    const pctMonth = spentLastMonth > 0 ? Math.round((monthDelta / spentLastMonth) * 100) : 0;

    // Top category this month
    const catMap = new Map<string, number>();
    expenses.forEach(e => {
      if (e.timestamp >= monthStart && e.timestamp < nextMonthStart) {
        catMap.set(e.category, (catMap.get(e.category) ?? 0) + e.amount);
      }
    });
    const topCat = [...catMap.entries()].sort((a, b) => b[1] - a[1])[0];

    // Tip generator
    let tip = "Log every small expense — awareness alone cuts spending ~10%.";
    if (spentToday > avgDay && avgDay > 0) {
      tip = `You're ${currency.symbol}${Math.round(spentToday - avgDay).toLocaleString()} above your typical day. Consider skipping one non-essential tomorrow.`;
    } else if (savedToday > 0 && avgDay > 0) {
      tip = `Nice — you're ${currency.symbol}${Math.round(savedToday).toLocaleString()} under your typical day. Move it to savings before the day ends.`;
    } else if (topCat && spentMonth > 0 && topCat[1] / spentMonth > 0.4) {
      tip = `${topCat[0]} is ${Math.round((topCat[1] / spentMonth) * 100)}% of this month's spend. Try a weekly cap on it.`;
    } else if (netMonth > 0) {
      tip = `You're ${currency.symbol}${Math.round(netMonth).toLocaleString()} net-positive this month. Auto-transfer half to savings.`;
    }

    return {
      spentToday, avgDay, savedToday,
      spentWeek, spentLastWeek, weekDelta, pctWeek,
      spentMonth, spentLastMonth, monthDelta, pctMonth,
      netMonth, netWeek, receivedMonth,
      topCat, tip,
    };
  }, [expenses, incomes, currency.symbol]);

  const sym = currency.symbol;
  const fmt = (n: number) => `${sym}${Math.round(Math.abs(n)).toLocaleString()}`;

  const dailyPositive = insights.savedToday > 0;
  const weekPositive = insights.weekDelta >= 0;
  const monthPositive = insights.monthDelta >= 0;

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-card sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-heading text-base font-semibold leading-tight">Insights</h2>
            <p className="text-[11px] text-muted-foreground">Where your money went — and where you saved</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {/* Daily */}
        <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <Target className="h-3 w-3" /> Today
          </div>
          {insights.avgDay > 0 ? (
            <>
              <p className={`font-heading text-xl font-bold ${dailyPositive ? "text-primary" : "text-accent"}`}>
                {dailyPositive ? "+" : "-"}{fmt(dailyPositive ? insights.savedToday : insights.spentToday - insights.avgDay)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {dailyPositive ? "saved vs typical day" : "over your typical day"} ({fmt(insights.avgDay)}/day avg)
              </p>
            </>
          ) : (
            <>
              <p className="font-heading text-xl font-bold">{fmt(insights.spentToday)}</p>
              <p className="text-[11px] text-muted-foreground">spent today · keep logging to see savings</p>
            </>
          )}
        </div>

        {/* Weekly */}
        <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {weekPositive ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />} This week
          </div>
          <p className={`font-heading text-xl font-bold ${weekPositive ? "text-primary" : "text-accent"}`}>
            {weekPositive ? "+" : "-"}{fmt(insights.weekDelta)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {insights.spentLastWeek > 0
              ? `${weekPositive ? "saved" : "over"} vs last week (${Math.abs(insights.pctWeek)}%)`
              : `${fmt(insights.spentWeek)} spent this week`}
          </p>
        </div>

        {/* Monthly */}
        <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <PiggyBank className="h-3 w-3" /> This month
          </div>
          <p className={`font-heading text-xl font-bold ${insights.netMonth >= 0 ? "text-primary" : "text-accent"}`}>
            {insights.netMonth >= 0 ? "+" : "-"}{fmt(insights.netMonth)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {insights.receivedMonth > 0
              ? `net after ${fmt(insights.spentMonth)} spent`
              : monthPositive && insights.spentLastMonth > 0
                ? `${fmt(insights.monthDelta)} less than last month`
                : `${fmt(insights.spentMonth)} spent so far`}
          </p>
        </div>
      </div>

      {/* Tip strip */}
      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 p-3.5">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-card shadow-card">
          <Lightbulb className="h-3.5 w-3.5 text-accent" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Today's tip</p>
          <p className="text-sm leading-snug text-foreground">{insights.tip}</p>
        </div>
      </div>

      {insights.topCat && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Biggest category this month:{" "}
          <span className="font-semibold text-foreground">{insights.topCat[0]}</span> · {fmt(insights.topCat[1])}
        </p>
      )}
    </div>
  );
}
