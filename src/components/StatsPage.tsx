import { Expense } from "@/lib/types";
import { CATEGORIES, PAYMENT_METHODS } from "@/lib/types";
import { Currency } from "@/lib/currencies";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  TrendingDown, CreditCard, Tag, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  format, startOfDay, endOfDay, startOfMonth, endOfMonth,
  startOfYear, endOfYear, addMonths, subMonths, getDaysInMonth,
} from "date-fns";
import ExpenseList from "@/components/ExpenseList";
import DayDetailDrawer from "@/components/DayDetailDrawer";

type View = "day" | "month" | "year";

interface StatsPageProps {
  allExpenses: Expense[];
  currency: Currency;
  onEdit?: (exp: Expense) => void;
  onDelete?: (id: string) => void;
}

// Distinct, theme-friendly category palette using HSL
const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(142 76% 45%)",
  "hsl(38 92% 55%)",
  "hsl(280 70% 60%)",
  "hsl(200 80% 55%)",
  "hsl(0 75% 60%)",
  "hsl(160 65% 45%)",
];

export default function StatsPage({ allExpenses, currency, onEdit, onDelete }: StatsPageProps) {
  const [view, setView] = useState<View>("month");
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const [pickerOpen, setPickerOpen] = useState(false);

  const { rangeStart, rangeEnd, label } = useMemo(() => {
    if (view === "day") {
      return {
        rangeStart: startOfDay(anchorDate),
        rangeEnd: endOfDay(anchorDate),
        label: format(anchorDate, "EEEE, dd MMMM yyyy"),
      };
    }
    if (view === "month") {
      return {
        rangeStart: startOfMonth(anchorDate),
        rangeEnd: endOfMonth(anchorDate),
        label: format(anchorDate, "MMMM yyyy"),
      };
    }
    return {
      rangeStart: startOfYear(anchorDate),
      rangeEnd: endOfYear(anchorDate),
      label: format(anchorDate, "yyyy"),
    };
  }, [view, anchorDate]);

  const filteredExpenses = useMemo(
    () => allExpenses
      .filter(e => e.timestamp >= rangeStart.getTime() && e.timestamp <= rangeEnd.getTime())
      .sort((a, b) => b.timestamp - a.timestamp),
    [allExpenses, rangeStart, rangeEnd],
  );

  const periodTotal = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const txCount = filteredExpenses.length;

  const daysInPeriod =
    view === "day" ? 1 :
    view === "month" ? getDaysInMonth(anchorDate) :
    (anchorDate.getFullYear() % 4 === 0 ? 366 : 365);
  const avgDaily = periodTotal / Math.max(daysInPeriod, 1);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([cat, total]) => ({
        name: cat,
        value: total,
        emoji: CATEGORIES.find(c => c.label === cat)?.emoji ?? "📦",
      }))
      .sort((a, b) => b.value - a.value);
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

  // Bar chart: per day for month, per month for year, per hour for day
  const barData = useMemo(() => {
    if (view === "day") {
      // hourly buckets (collapsed to non-zero hours)
      const map = new Map<number, number>();
      filteredExpenses.forEach(e => {
        const h = new Date(e.timestamp).getHours();
        map.set(h, (map.get(h) || 0) + e.amount);
      });
      return Array.from({ length: 24 }, (_, h) => ({
        name: `${h}h`,
        total: map.get(h) || 0,
      }));
    }
    if (view === "month") {
      const days = getDaysInMonth(anchorDate);
      const monthStart = startOfMonth(anchorDate);
      return Array.from({ length: days }, (_, i) => {
        const day = new Date(monthStart);
        day.setDate(monthStart.getDate() + i);
        const dStart = startOfDay(day).getTime();
        const dEnd = endOfDay(day).getTime();
        const total = filteredExpenses
          .filter(e => e.timestamp >= dStart && e.timestamp <= dEnd)
          .reduce((s, e) => s + e.amount, 0);
        return { name: String(i + 1), total };
      });
    }
    // year
    return Array.from({ length: 12 }, (_, m) => {
      const monthStart = new Date(anchorDate.getFullYear(), m, 1).getTime();
      const monthEnd = new Date(anchorDate.getFullYear(), m + 1, 0, 23, 59, 59, 999).getTime();
      const total = filteredExpenses
        .filter(e => e.timestamp >= monthStart && e.timestamp <= monthEnd)
        .reduce((s, e) => s + e.amount, 0);
      return { name: format(new Date(anchorDate.getFullYear(), m, 1), "MMM"), total };
    });
  }, [filteredExpenses, view, anchorDate]);

  const stepBack = () => {
    if (view === "day") setAnchorDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; });
    else if (view === "month") setAnchorDate(d => subMonths(d, 1));
    else setAnchorDate(d => { const n = new Date(d); n.setFullYear(n.getFullYear() - 1); return n; });
  };
  const stepForward = () => {
    const now = new Date();
    if (view === "day") {
      setAnchorDate(d => {
        const n = new Date(d); n.setDate(n.getDate() + 1);
        return n > now ? d : n;
      });
    } else if (view === "month") {
      setAnchorDate(d => {
        const n = addMonths(d, 1);
        return n > now ? d : n;
      });
    } else {
      setAnchorDate(d => {
        const n = new Date(d); n.setFullYear(n.getFullYear() + 1);
        return n > now ? d : n;
      });
    }
  };

  return (
    <div className="animate-slide-up pb-4">
      <h1 className="mb-4 font-heading text-2xl font-bold">Statistics</h1>

      {/* View Selector */}
      <div className="mb-3 flex rounded-xl bg-secondary p-1">
        {(["day", "month", "year"] as View[]).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "flex-1 rounded-lg py-2 text-xs font-semibold transition-colors capitalize",
              view === v ? "bg-card shadow-card text-foreground" : "text-muted-foreground"
            )}
          >
            {v === "day" ? "Daily" : v === "month" ? "Monthly" : "Yearly"}
          </button>
        ))}
      </div>

      {/* Date navigator */}
      <div className="mb-4 flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-xl shrink-0"
          onClick={stepBack}
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex-1 justify-center rounded-xl font-semibold">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {label}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={anchorDate}
              onSelect={(d) => { if (d) { setAnchorDate(d); setPickerOpen(false); } }}
              disabled={(d) => d > new Date()}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-xl shrink-0"
          onClick={stepForward}
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-card p-3 shadow-card">
          <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
            <TrendingDown className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-[10px] text-muted-foreground">Total</p>
          <p className="font-heading text-base font-bold">{currency.symbol}{periodTotal.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl bg-card p-3 shadow-card">
          <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-xl bg-accent/10">
            <CalendarIcon className="h-3.5 w-3.5 text-accent" />
          </div>
          <p className="text-[10px] text-muted-foreground">Txns</p>
          <p className="font-heading text-base font-bold">{txCount}</p>
        </div>
        <div className="rounded-2xl bg-card p-3 shadow-card">
          <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-xl bg-accent/10">
            <CreditCard className="h-3.5 w-3.5 text-accent" />
          </div>
          <p className="text-[10px] text-muted-foreground">Avg/day</p>
          <p className="font-heading text-base font-bold">{currency.symbol}{Math.round(avgDaily).toLocaleString()}</p>
        </div>
      </div>

      {/* Pie chart - category distribution */}
      {categoryBreakdown.length > 0 && (
        <div className="mb-4 rounded-2xl bg-card p-4 shadow-card">
          <div className="mb-2 flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-heading text-sm font-semibold">Category Distribution</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={2}
                  stroke="hsl(var(--card))"
                  strokeWidth={2}
                >
                  {categoryBreakdown.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                    color: "hsl(var(--popover-foreground))",
                    fontSize: "12px",
                  }}
                  formatter={(v: number) => [`${currency.symbol}${v.toLocaleString()}`, "Spent"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {categoryBreakdown.map((item, i) => {
              const pct = periodTotal > 0 ? (item.value / periodTotal) * 100 : 0;
              return (
                <div key={item.name} className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className="h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="truncate">{item.emoji} {item.name}</span>
                  <span className="ml-auto font-semibold">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bar chart - time distribution */}
      {periodTotal > 0 && (
        <div className="mb-4 rounded-2xl bg-card p-4 shadow-card">
          <h3 className="mb-3 font-heading text-sm font-semibold">
            {view === "day" ? "Hourly spend" : view === "month" ? "Daily spend" : "Monthly spend"}
          </h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barCategoryGap="15%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  interval={view === "month" ? 3 : 0}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={30}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                    color: "hsl(var(--popover-foreground))",
                    fontSize: "12px",
                  }}
                  formatter={(v: number) => [`${currency.symbol}${v.toLocaleString()}`, "Spent"]}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
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
            {paymentBreakdown.map(item => {
              const pct = periodTotal > 0 ? (item.total / periodTotal) * 100 : 0;
              return (
                <div key={item.method}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium">{item.icon} {item.method}</span>
                    <span className="text-xs font-bold">
                      {currency.symbol}{item.total.toLocaleString()}
                      <span className="ml-1 text-muted-foreground font-normal">({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transactions for the selected period */}
      <div className="mb-4">
        <h3 className="mb-2 font-heading text-sm font-semibold">
          Transactions {view === "day" ? "" : `(${txCount})`}
        </h3>
        <ExpenseList
          expenses={filteredExpenses}
          currency={currency}
          onDelete={onDelete ?? (() => {})}
          onEdit={onEdit}
          showFullDate={view !== "day"}
          emptyMessage="No expenses in this period"
        />
      </div>
    </div>
  );
}
