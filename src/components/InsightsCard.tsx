import { useMemo, useState } from "react";
import {
  Sparkles, TrendingUp, TrendingDown, AlertTriangle, Flame,
  CalendarClock, LineChart as LineIcon, Target, Wallet, Pencil,
} from "lucide-react";
import { Expense } from "@/lib/types";
import { Currency } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import { useBudgets } from "@/hooks/useBudgets";
import BudgetDialog from "./BudgetDialog";

interface Props {
  expenses: Expense[];
  currency: Currency;
}

const DAY_MS = 86400000;
function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

type Insight = {
  key: string;
  score: number;
  icon: any;
  tone: "neutral" | "warn" | "good";
  label: string;
  headline: string;
  body: string;
  spark?: number[];
};

function Sparkline({ values, tone }: { values: number[]; tone: "warn" | "good" | "neutral" }) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const w = 68, h = 22, step = w / Math.max(values.length - 1, 1);
  const pts = values.map((v, i) => `${i * step},${h - (v / max) * h}`).join(" ");
  const stroke = tone === "warn" ? "hsl(var(--destructive))" : tone === "good" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))";
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" points={pts} />
      <circle cx={(values.length - 1) * step} cy={h - (values[values.length - 1] / max) * h} r={2.2} fill={stroke} />
    </svg>
  );
}

export default function InsightsCard({ expenses, currency }: Props) {
  const sym = currency.symbol;
  const fmt = (n: number) => `${sym}${Math.round(Math.abs(n)).toLocaleString()}`;
  const { budgets } = useBudgets();
  const [budgetOpen, setBudgetOpen] = useState(false);

  const data = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now).getTime();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const daysLeft = daysInMonth - dayOfMonth;

    const earliest = expenses.length ? Math.min(...expenses.map(e => e.timestamp)) : today;
    const daysOfData = Math.max(1, Math.ceil((today - startOfDay(new Date(earliest)).getTime()) / DAY_MS) + 1);
    const sufficient = expenses.length >= 5 && daysOfData >= 7;

    const monthSpent = expenses.filter(e => e.timestamp >= monthStart && e.timestamp < nextMonthStart)
      .reduce((s, e) => s + e.amount, 0);
    const dailyPace = monthSpent / Math.max(dayOfMonth, 1);
    const forecast = dailyPace * daysInMonth;

    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const prevMonthSpent = expenses.filter(e => e.timestamp >= prevMonthStart && e.timestamp < monthStart)
      .reduce((s, e) => s + e.amount, 0);

    // This month by category (with txn counts)
    const monthByCat = new Map<string, { total: number; count: number }>();
    expenses.forEach(e => {
      if (e.timestamp >= monthStart && e.timestamp < nextMonthStart) {
        const cur = monthByCat.get(e.category) ?? { total: 0, count: 0 };
        cur.total += e.amount; cur.count += 1;
        monthByCat.set(e.category, cur);
      }
    });
    const topCats = [...monthByCat.entries()]
      .map(([cat, v]) => ({ cat, ...v }))
      .sort((a, b) => b.total - a.total);

    // Weekly buckets (last 6 weeks) per category
    const weekStart0 = startOfWeek(now).getTime();
    const weekBuckets: Record<string, number[]> = {};
    for (let w = 5; w >= 0; w--) {
      const ws = weekStart0 - w * 7 * DAY_MS;
      const we = ws + 7 * DAY_MS;
      expenses.forEach(e => {
        if (e.timestamp >= ws && e.timestamp < we) {
          if (!weekBuckets[e.category]) weekBuckets[e.category] = [0, 0, 0, 0, 0, 0];
          weekBuckets[e.category][5 - w] += e.amount;
        }
      });
    }

    // Anomaly this week vs prior 4-week avg
    const thisWeek = weekStart0;
    const nextWeek = thisWeek + 7 * DAY_MS;
    const priorStart = thisWeek - 4 * 7 * DAY_MS;
    const catThisWeek = new Map<string, { total: number; count: number; notes: string[] }>();
    const catPrior4 = new Map<string, number>();
    expenses.forEach(e => {
      if (e.timestamp >= thisWeek && e.timestamp < nextWeek) {
        const cur = catThisWeek.get(e.category) ?? { total: 0, count: 0, notes: [] as string[] };
        cur.total += e.amount; cur.count += 1;
        const tag = e.customName || e.note;
        if (tag) cur.notes.push(tag);
        catThisWeek.set(e.category, cur);
      } else if (e.timestamp >= priorStart && e.timestamp < thisWeek) {
        catPrior4.set(e.category, (catPrior4.get(e.category) ?? 0) + e.amount);
      }
    });
    let anomaly: { cat: string; now: number; avg: number; pct: number; count: number; sample?: string } | null = null;
    for (const [cat, cur] of catThisWeek.entries()) {
      const avg = (catPrior4.get(cat) ?? 0) / 4;
      if (avg >= 50 && cur.total > avg * 1.3) {
        const pct = Math.round(((cur.total - avg) / avg) * 100);
        // Most frequent note as the "cause" tag
        const noteCounts = new Map<string, number>();
        cur.notes.forEach(n => noteCounts.set(n, (noteCounts.get(n) ?? 0) + 1));
        const sample = [...noteCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
        if (!anomaly || pct > anomaly.pct) anomaly = { cat, now: cur.total, avg, pct, count: cur.count, sample };
      }
    }

    // Weekend vs weekday (last 30d)
    const trailStart = today - 30 * DAY_MS;
    let weekendSum = 0, weekendDays = 0, weekdaySum = 0, weekdayDays = 0;
    for (let d = 0; d < 30; d++) {
      const dayStart = trailStart + d * DAY_MS;
      const dayEnd = dayStart + DAY_MS;
      const dow = new Date(dayStart).getDay();
      const total = expenses.filter(e => e.timestamp >= dayStart && e.timestamp < dayEnd)
        .reduce((s, e) => s + e.amount, 0);
      if (dow === 0 || dow === 6) { weekendSum += total; weekendDays++; }
      else { weekdaySum += total; weekdayDays++; }
    }
    const weekendAvg = weekendDays ? weekendSum / weekendDays : 0;
    const weekdayAvg = weekdayDays ? weekdaySum / weekdayDays : 0;
    const weekendRatio = weekdayAvg > 0 ? weekendAvg / weekdayAvg : 0;

    return {
      sufficient, daysOfData,
      monthSpent, forecast, prevMonthSpent, dayOfMonth, daysInMonth, daysLeft, dailyPace,
      topCats, weekBuckets, anomaly,
      weekendAvg, weekdayAvg, weekendRatio,
    };
  }, [expenses]);

  const insights: Insight[] = useMemo(() => {
    const list: Insight[] = [];
    if (!data.sufficient) return list;

    // 1. Budget-aware forecast
    if (budgets.overall) {
      const over = data.forecast - budgets.overall;
      const remaining = budgets.overall - data.monthSpent;
      const dailyAllowance = data.daysLeft > 0 ? remaining / data.daysLeft : remaining;
      if (over > 0) {
        list.push({
          key: "budget-over",
          score: 100 + Math.min(Math.round((over / budgets.overall) * 100), 60),
          icon: AlertTriangle,
          tone: "warn",
          label: "Budget pace",
          headline: `On track to go ${fmt(over)} over your ${fmt(budgets.overall)} budget`,
          body: dailyAllowance > 0
            ? `Cut to ${fmt(dailyAllowance)}/day for the next ${data.daysLeft} day${data.daysLeft === 1 ? "" : "s"} to stay under.`
            : `You've already crossed the cap by ${fmt(-remaining)} with ${data.daysLeft} day${data.daysLeft === 1 ? "" : "s"} left.`,
        });
      } else {
        list.push({
          key: "budget-ok",
          score: 80,
          icon: Target,
          tone: "good",
          label: "Budget pace",
          headline: `${fmt(remaining)} left of your ${fmt(budgets.overall)} budget`,
          body: data.daysLeft > 0
            ? `At this pace you'll finish around ${fmt(data.forecast)} — ${fmt(-over)} under budget. Room for ${fmt(dailyAllowance)}/day.`
            : `Final day of the month — you finished under budget.`,
        });
      }
    } else if (data.forecast > 0 && data.dayOfMonth >= 3) {
      // No budget set: forecast vs last month
      const baseline = data.prevMonthSpent > 0 ? data.prevMonthSpent : data.forecast;
      const delta = data.forecast - baseline;
      list.push({
        key: "forecast",
        score: 70,
        icon: delta >= 0 ? TrendingUp : TrendingDown,
        tone: delta > baseline * 0.1 ? "warn" : delta < -baseline * 0.1 ? "good" : "neutral",
        label: "This month",
        headline: `${fmt(data.forecast)} projected by month end`,
        body: data.prevMonthSpent > 0
          ? `${delta >= 0 ? fmt(delta) + " above" : fmt(delta) + " below"} last month's ${fmt(data.prevMonthSpent)} at your current pace of ${fmt(data.dailyPace)}/day.`
          : `Based on ${fmt(data.dailyPace)}/day so far this month. Set a budget for sharper guidance.`,
      });
    }

    // 2. Per-category budget breaches
    for (const { cat, total } of data.topCats) {
      const cap = budgets.categories[cat];
      if (!cap) continue;
      const pct = (total / cap) * 100;
      const projected = total * (data.daysInMonth / Math.max(data.dayOfMonth, 1));
      if (pct >= 80 || projected > cap) {
        list.push({
          key: `catbudget-${cat}`,
          score: 90 + Math.min(Math.round(pct), 40),
          icon: AlertTriangle,
          tone: pct >= 100 ? "warn" : "neutral",
          label: `${cat} budget`,
          headline: pct >= 100
            ? `${cat} is ${Math.round(pct - 100)}% over its ${fmt(cap)} cap`
            : `${cat} at ${Math.round(pct)}% of its ${fmt(cap)} cap`,
          body: projected > cap
            ? `Projected to reach ${fmt(projected)} by month end — ${fmt(projected - cap)} over.`
            : `${fmt(cap - total)} left for the rest of the month.`,
        });
      }
    }

    // 3. Category spike with real cause
    if (data.anomaly) {
      const causeTxt = data.anomaly.sample
        ? `${data.anomaly.count} txns this week, mostly around "${data.anomaly.sample}"`
        : `${data.anomaly.count} transactions this week`;
      list.push({
        key: "anomaly",
        score: 85 + Math.min(data.anomaly.pct, 40),
        icon: AlertTriangle,
        tone: "warn",
        label: "Spike",
        headline: `${data.anomaly.cat} is up ${data.anomaly.pct}% this week`,
        body: `${fmt(data.anomaly.now)} vs your usual ${fmt(data.anomaly.avg)} — ${causeTxt}.`,
      });
    }

    // 4. Trend sparkline on top category
    for (const { cat } of data.topCats.slice(0, 2)) {
      const series = data.weekBuckets[cat];
      if (!series || series.filter(v => v > 0).length < 3) continue;
      const last = series[series.length - 1];
      const prevAvg = series.slice(0, -1).reduce((s, v) => s + v, 0) / (series.length - 1);
      const dir = prevAvg > 0 ? (last - prevAvg) / prevAvg : 0;
      list.push({
        key: `trend-${cat}`,
        score: 50,
        icon: LineIcon,
        tone: dir > 0.15 ? "warn" : dir < -0.15 ? "good" : "neutral",
        label: "6-week trend",
        headline: `${cat} spending is ${dir > 0.15 ? "rising" : dir < -0.15 ? "cooling off" : "steady"}`,
        body: dir > 0.15 ? `This week's ${fmt(last)} is ${Math.round(dir * 100)}% above the 5-week average of ${fmt(prevAvg)}.`
             : dir < -0.15 ? `This week's ${fmt(last)} is ${Math.round(-dir * 100)}% below the 5-week average of ${fmt(prevAvg)}.`
             : `Averaging around ${fmt(prevAvg)}/week over the past six weeks.`,
        spark: series,
      });
      break;
    }

    // 5. Weekend pattern
    if (data.weekendRatio >= 1.5 && data.weekdayAvg > 0) {
      list.push({
        key: "weekend",
        score: 45,
        icon: CalendarClock,
        tone: "neutral",
        label: "Pattern",
        headline: `You spend the most on weekends`,
        body: `Weekend days average ${fmt(data.weekendAvg)} vs ${fmt(data.weekdayAvg)} on weekdays over the past 30 days.`,
      });
    }

    return list.sort((a, b) => b.score - a.score).slice(0, 4);
  }, [data, budgets, currency.symbol]);

  const toneClass = (t: Insight["tone"]) =>
    t === "warn" ? "text-accent" : t === "good" ? "text-primary" : "text-foreground";

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-card sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-heading text-base font-semibold leading-tight">Insights</h2>
            <p className="text-[11px] text-muted-foreground">
              {budgets.overall
                ? `Reasoned from your data · ${fmt(budgets.overall)} monthly cap`
                : "Reasoned from your actual transactions"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setBudgetOpen(true)}
          className="h-8 rounded-xl px-3 text-[11px]"
        >
          <Wallet className="mr-1 h-3.5 w-3.5" />
          {budgets.overall ? "Edit budget" : "Set budget"}
        </Button>
      </div>

      {!data.sufficient ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-background/40 p-5 text-center">
          <p className="font-heading text-sm font-semibold">Still learning your spending patterns</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Log a few more days of expenses and TrackVault will start surfacing budget-aware forecasts, category spikes and habits.
          </p>
        </div>
      ) : insights.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-background/40 p-5 text-center">
          <p className="font-heading text-sm font-semibold">Nothing unusual right now</p>
          <p className="mt-1 text-xs text-muted-foreground">Spending is steady across your usual categories.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {insights.map(ins => {
            const Icon = ins.icon;
            return (
              <div key={ins.key} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    <Icon className={`h-3 w-3 ${toneClass(ins.tone)}`} /> {ins.label}
                  </div>
                  {ins.spark && <Sparkline values={ins.spark} tone={ins.tone} />}
                </div>
                <p className={`font-heading text-[14px] font-semibold leading-snug ${toneClass(ins.tone)}`}>
                  {ins.headline}
                </p>
                <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">{ins.body}</p>
              </div>
            );
          })}
        </div>
      )}

      {!budgets.overall && data.sufficient && (
        <button
          onClick={() => setBudgetOpen(true)}
          className="mt-3 flex w-full items-center gap-2 rounded-2xl border border-dashed border-primary/30 bg-primary/[0.04] px-3 py-2.5 text-left text-[11.5px] transition-smooth hover:bg-primary/[0.08]"
        >
          <Pencil className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground">
            Set a monthly budget to unlock pace-aware guidance like{" "}
            <span className="text-foreground font-semibold">"cut ₹40/day to stay under"</span>.
          </span>
        </button>
      )}

      <BudgetDialog open={budgetOpen} onClose={() => setBudgetOpen(false)} currency={currency} />
    </div>
  );
}
