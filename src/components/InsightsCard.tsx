import { useMemo, useState, useEffect } from "react";
import {
  Sparkles, TrendingUp, TrendingDown, AlertTriangle, Flame,
  CalendarClock, LineChart as LineIcon, Lightbulb, Check,
} from "lucide-react";
import { Expense, Income } from "@/lib/types";
import { Currency } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Props {
  expenses: Expense[];
  incomes: Income[];
  currency: Currency;
}

const DAY_MS = 86400000;
function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  x.setDate(x.getDate() - x.getDay()); // Sunday start (matches app)
  return x;
}

type Insight = {
  key: string;
  score: number; // higher = more relevant
  icon: any;
  tone: "neutral" | "warn" | "good";
  label: string;
  title: string;
  detail: string;
  spark?: number[];
};

const BUDGET_KEY = "tv_category_budgets_v1";
function readBudgets(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(BUDGET_KEY) || "{}"); } catch { return {}; }
}
function writeBudgets(b: Record<string, number>) {
  localStorage.setItem(BUDGET_KEY, JSON.stringify(b));
}

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

export default function InsightsCard({ expenses, incomes, currency }: Props) {
  const sym = currency.symbol;
  const fmt = (n: number) => `${sym}${Math.round(Math.abs(n)).toLocaleString()}`;

  const [budgets, setBudgets] = useState<Record<string, number>>(() => readBudgets());
  const [dismissedTip, setDismissedTip] = useState(false);

  const data = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now).getTime();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();

    // Data horizon
    const earliest = expenses.length ? Math.min(...expenses.map(e => e.timestamp)) : today;
    const daysOfData = Math.max(1, Math.ceil((today - startOfDay(new Date(earliest)).getTime()) / DAY_MS) + 1);
    const sufficient = expenses.length >= 5 && daysOfData >= 7;

    // Month spend so far & forecast
    const monthSpent = expenses.filter(e => e.timestamp >= monthStart && e.timestamp < nextMonthStart)
      .reduce((s, e) => s + e.amount, 0);
    const dailyPace = monthSpent / Math.max(dayOfMonth, 1);
    const forecast = dailyPace * daysInMonth;

    // Previous full month for baseline
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const prevMonthSpent = expenses.filter(e => e.timestamp >= prevMonthStart && e.timestamp < monthStart)
      .reduce((s, e) => s + e.amount, 0);

    // Category totals this month
    const monthByCat = new Map<string, number>();
    expenses.forEach(e => {
      if (e.timestamp >= monthStart && e.timestamp < nextMonthStart) {
        monthByCat.set(e.category, (monthByCat.get(e.category) ?? 0) + e.amount);
      }
    });
    const topCats = [...monthByCat.entries()].sort((a, b) => b[1] - a[1]);

    // Weekly buckets (last 6 weeks incl. current) per category
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

    // Anomaly: this week vs prior 4-week avg per category
    const thisWeek = weekStart0;
    const nextWeek = thisWeek + 7 * DAY_MS;
    const priorStart = thisWeek - 4 * 7 * DAY_MS;
    const catThisWeek = new Map<string, number>();
    const catPrior4 = new Map<string, number>();
    expenses.forEach(e => {
      if (e.timestamp >= thisWeek && e.timestamp < nextWeek) {
        catThisWeek.set(e.category, (catThisWeek.get(e.category) ?? 0) + e.amount);
      } else if (e.timestamp >= priorStart && e.timestamp < thisWeek) {
        catPrior4.set(e.category, (catPrior4.get(e.category) ?? 0) + e.amount);
      }
    });
    let anomaly: { cat: string; now: number; avg: number; pct: number; count: number } | null = null;
    for (const [cat, cur] of catThisWeek.entries()) {
      const avg = (catPrior4.get(cat) ?? 0) / 4;
      if (avg >= 50 && cur > avg * 1.3) {
        const pct = Math.round(((cur - avg) / avg) * 100);
        const count = expenses.filter(e => e.category === cat && e.timestamp >= thisWeek && e.timestamp < nextWeek).length;
        if (!anomaly || pct > anomaly.pct) anomaly = { cat, now: cur, avg, pct, count };
      }
    }

    // Weekend vs weekday pattern (last 30 days)
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

    // Streak: consecutive completed days under trailing daily average
    const trailAvg = (weekendSum + weekdaySum) / 30;
    let streak = 0;
    for (let d = 1; d <= 14; d++) {
      const dayStart = today - d * DAY_MS;
      const dayEnd = dayStart + DAY_MS;
      const total = expenses.filter(e => e.timestamp >= dayStart && e.timestamp < dayEnd)
        .reduce((s, e) => s + e.amount, 0);
      if (total > 0 && total < trailAvg && trailAvg > 0) streak++;
      else break;
    }

    return {
      sufficient, daysOfData,
      monthSpent, forecast, prevMonthSpent, dayOfMonth, daysInMonth,
      topCats, weekBuckets,
      anomaly,
      weekendAvg, weekdayAvg, weekendRatio,
      streak, trailAvg,
    };
  }, [expenses]);

  const insights: Insight[] = useMemo(() => {
    const list: Insight[] = [];
    if (!data.sufficient) return list;

    // 1. Forecast
    if (data.forecast > 0 && data.dayOfMonth >= 3) {
      const baseline = data.prevMonthSpent > 0 ? data.prevMonthSpent : data.forecast;
      const delta = data.forecast - baseline;
      const overPct = baseline > 0 ? Math.round((delta / baseline) * 100) : 0;
      list.push({
        key: "forecast",
        score: 60 + Math.min(Math.abs(overPct), 40),
        icon: delta >= 0 ? TrendingUp : TrendingDown,
        tone: delta > baseline * 0.1 ? "warn" : delta < -baseline * 0.1 ? "good" : "neutral",
        label: "Forecast",
        title: `${fmt(data.forecast)} projected`,
        detail: data.prevMonthSpent > 0
          ? `${delta >= 0 ? "+" : "-"}${fmt(delta)} vs last month at this pace`
          : `Based on ${fmt(data.monthSpent / data.dayOfMonth)}/day so far`,
      });
    }

    // 2. Anomaly
    if (data.anomaly) {
      list.push({
        key: "anomaly",
        score: 70 + Math.min(data.anomaly.pct, 60),
        icon: AlertTriangle,
        tone: "warn",
        label: "Spike",
        title: `${data.anomaly.cat} is ${data.anomaly.pct}% higher`,
        detail: `${fmt(data.anomaly.now)} this week across ${data.anomaly.count} txns vs ${fmt(data.anomaly.avg)} typical`,
      });
    }

    // 3. Category trend sparkline (top category with meaningful history)
    for (const [cat] of data.topCats.slice(0, 2)) {
      const series = data.weekBuckets[cat];
      if (!series || series.filter(v => v > 0).length < 3) continue;
      const last = series[series.length - 1];
      const prevAvg = series.slice(0, -1).reduce((s, v) => s + v, 0) / (series.length - 1);
      const dir = prevAvg > 0 ? (last - prevAvg) / prevAvg : 0;
      list.push({
        key: `trend-${cat}`,
        score: 40 + Math.min(Math.abs(dir) * 100, 30),
        icon: LineIcon,
        tone: dir > 0.15 ? "warn" : dir < -0.15 ? "good" : "neutral",
        label: "6-wk trend",
        title: cat,
        detail: dir > 0.15 ? `Rising · ${Math.round(dir * 100)}% above 5-wk avg`
              : dir < -0.15 ? `Falling · ${Math.round(-dir * 100)}% below 5-wk avg`
              : `Flat at around ${fmt(prevAvg)}/wk`,
        spark: series,
      });
      break; // only one trend card
    }

    // 4. Weekend pattern
    if (data.weekendRatio >= 1.5 && data.weekdayAvg > 0) {
      list.push({
        key: "weekend",
        score: 45 + Math.min((data.weekendRatio - 1) * 20, 25),
        icon: CalendarClock,
        tone: "neutral",
        label: "Pattern",
        title: `Weekends cost ${data.weekendRatio.toFixed(1)}x weekdays`,
        detail: `${fmt(data.weekendAvg)}/day on weekends vs ${fmt(data.weekdayAvg)} on weekdays (30d)`,
      });
    }

    // 5. Streak
    if (data.streak >= 3) {
      list.push({
        key: "streak",
        score: 35 + data.streak * 3,
        icon: Flame,
        tone: "good",
        label: "Streak",
        title: `${data.streak} days under average`,
        detail: `Below ${fmt(data.trailAvg)}/day — your 30-day baseline`,
      });
    }

    return list.sort((a, b) => b.score - a.score).slice(0, 4);
  }, [data, currency.symbol]);

  // Action tip: pick top category without a budget, propose one
  const actionable = useMemo(() => {
    if (!data.sufficient) return null;
    for (const [cat, amount] of data.topCats) {
      if (!budgets[cat] && amount >= 100) {
        // Suggested budget: nice-rounded 90% of current pace projected to month
        const projected = amount * (data.daysInMonth / Math.max(data.dayOfMonth, 1));
        const suggested = Math.max(50, Math.round((projected * 0.85) / 50) * 50);
        return { cat, spent: amount, suggested };
      }
    }
    return null;
  }, [data, budgets]);

  const setBudgetFor = (cat: string, amount: number) => {
    const next = { ...budgets, [cat]: amount };
    writeBudgets(next);
    setBudgets(next);
    toast({ title: "Budget set", description: `${cat} · ${fmt(amount)}/month` });
  };

  useEffect(() => setDismissedTip(false), [actionable?.cat]);

  const toneClass = (t: Insight["tone"]) =>
    t === "warn" ? "text-accent" : t === "good" ? "text-primary" : "text-foreground";

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-card sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-heading text-base font-semibold leading-tight">Insights</h2>
            <p className="text-[11px] text-muted-foreground">Patterns in your spending — computed from your data</p>
          </div>
        </div>
      </div>

      {!data.sufficient ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-background/40 p-5 text-center">
          <p className="font-heading text-sm font-semibold">Still learning your patterns</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Log a few more days of expenses and TrackVault will surface forecasts, spikes, and trends here.
          </p>
        </div>
      ) : insights.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-background/40 p-5 text-center">
          <p className="font-heading text-sm font-semibold">Nothing unusual this week</p>
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
                <p className={`font-heading text-[15px] font-semibold leading-tight ${toneClass(ins.tone)}`}>
                  {ins.title}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{ins.detail}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Actionable tip */}
      {data.sufficient && actionable && !dismissedTip && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 p-3.5">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-card shadow-card">
            <Lightbulb className="h-3.5 w-3.5 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Suggested action</p>
            <p className="text-sm leading-snug text-foreground">
              {actionable.cat} is your biggest category this month ({fmt(actionable.spent)}).
              Set a {fmt(actionable.suggested)} monthly cap?
            </p>
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                className="h-8 rounded-xl px-3 text-xs"
                onClick={() => setBudgetFor(actionable.cat, actionable.suggested)}
              >
                <Check className="mr-1 h-3 w-3" /> Set {fmt(actionable.suggested)} budget
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 rounded-xl px-3 text-xs text-muted-foreground"
                onClick={() => setDismissedTip(true)}
              >
                Not now
              </Button>
            </div>
          </div>
        </div>
      )}

      {data.sufficient && Object.keys(budgets).length > 0 && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Active budgets:{" "}
          {Object.entries(budgets).map(([c, v], i, arr) => (
            <span key={c} className="text-foreground">
              {c} {fmt(v)}{i < arr.length - 1 ? " · " : ""}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
