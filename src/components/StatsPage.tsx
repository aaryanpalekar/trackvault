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
  const [drawerDate, setDrawerDate] = useState<Date | null>(null);
  const [drawerCategory, setDrawerCategory] = useState<string | undefined>(undefined);
  const [drawerRange, setDrawerRange] = useState<{ start: number; end: number; label: string } | null>(null);

  const openDrawer = (d: Date, category?: string) => {
    setDrawerDate(d);
    setDrawerCategory(category);
    setDrawerRange(null);
  };
  const closeDrawer = () => { setDrawerDate(null); setDrawerCategory(undefined); setDrawerRange(null); };

  // For "day" view: clicking a category opens that day filtered to that category.
  // For "month" view: clicking a day opens that day.
  // For "year" view: clicking a month jumps to that month.
  const handleBarClick = (entry: any) => {
    if (!entry || !entry.activePayload?.[0]?.payload) return;
    const payload = entry.activePayload[0].payload;
    if (view === "day") {
      // hourly chart: open the day's full detail
      openDrawer(anchorDate);
    } else if (view === "month") {
      const day = parseInt(payload.name, 10);
      if (!isNaN(day)) {
        const d = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), day);
        openDrawer(d);
      }
    } else {
      // year: jump anchor to that month
      const monthIdx = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(payload.name);
      if (monthIdx >= 0) {
        setAnchorDate(new Date(anchorDate.getFullYear(), monthIdx, 1));
        setView("month");
      }
    }
  };

  const handlePieClick = (entry: any) => {
    if (!entry?.name) return;
    if (view === "day") {
      openDrawer(anchorDate, entry.name);
    } else {
      // Show ALL transactions in the active period for this category
      setDrawerDate(null);
      setDrawerCategory(entry.name);
      setDrawerRange({
        start: rangeStart.getTime(),
        end: rangeEnd.getTime(),
        label: `${entry.name} · ${label}`,
      });
    }
  };

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

      {/* Month-over-month insight */}
      {categoryBreakdown.length > 0 && (() => {
        const prevAnchor =
          view === "day" ? new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate() - 1) :
          view === "month" ? subMonths(anchorDate, 1) :
          new Date(anchorDate.getFullYear() - 1, 0, 1);
        const prevStart =
          view === "day" ? startOfDay(prevAnchor).getTime() :
          view === "month" ? startOfMonth(prevAnchor).getTime() :
          startOfYear(prevAnchor).getTime();
        const prevEnd =
          view === "day" ? endOfDay(prevAnchor).getTime() :
          view === "month" ? endOfMonth(prevAnchor).getTime() :
          endOfYear(prevAnchor).getTime();
        const topCat = categoryBreakdown[0]?.name;
        const topCurrent = categoryBreakdown[0]?.value ?? 0;
        const topPrev = allExpenses
          .filter(e => e.timestamp >= prevStart && e.timestamp <= prevEnd && e.category === topCat)
          .reduce((s, e) => s + e.amount, 0);
        const label = view === "day" ? "yesterday" : view === "month" ? "last month" : "last year";
        let msg: string;
        if (topPrev === 0 && topCurrent > 0) msg = `New spending on ${topCat} vs ${label}.`;
        else if (topPrev === 0) msg = `No comparable spend for ${label}.`;
        else {
          const diffPct = Math.round(((topCurrent - topPrev) / topPrev) * 100);
          if (Math.abs(diffPct) < 3) msg = `${topCat} spending is steady vs ${label}.`;
          else msg = `${Math.abs(diffPct)}% ${diffPct > 0 ? "more" : "less"} on ${topCat} than ${label}.`;
        }
        return (
          <div className="mb-3 rounded-2xl border border-border/60 bg-gradient-to-r from-primary/[0.06] via-accent/[0.05] to-transparent px-4 py-2.5 text-[12px] font-medium text-foreground/85 animate-fade-in">
            <span className="mr-1">✨</span> {msg}
          </div>
        );
      })()}

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
                  onClick={handlePieClick}
                  className="cursor-pointer"
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
                  formatter={(v: number, _n, p: any) => [
                    `${currency.symbol}${v.toLocaleString()}`,
                    `${p?.payload?.emoji ?? ""} ${p?.payload?.name ?? "Spent"}`,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-center text-[10px] text-muted-foreground">Tap a slice to see items</p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {categoryBreakdown.map((item, i) => {
              const pct = periodTotal > 0 ? (item.value / periodTotal) * 100 : 0;
              return (
                <button
                  key={item.name}
                  onClick={() => handlePieClick({ name: item.name })}
                  className="flex items-center gap-1.5 rounded-md px-1 py-0.5 text-[11px] text-left hover:bg-secondary/60 transition-colors"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="truncate">{item.emoji} {item.name}</span>
                  <span className="ml-auto font-semibold">{pct.toFixed(0)}%</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Time distribution: hourly timeline for day view, bar chart otherwise */}
      {periodTotal > 0 && view === "day" && (
        <div className="mb-4 rounded-2xl bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-heading text-sm font-semibold">Hourly timeline</h3>
          </div>
          <div className="space-y-1.5">
            {filteredExpenses.length === 0 ? (
              <p className="text-xs text-muted-foreground">No transactions yet today.</p>
            ) : (
              filteredExpenses
                .slice()
                .sort((a, b) => a.timestamp - b.timestamp)
                .map(exp => {
                  const cat = CATEGORIES.find(c => c.label === exp.category);
                  const pm = PAYMENT_METHODS.find(p => p.value === exp.paymentMethod);
                  const pct = periodTotal > 0 ? (exp.amount / periodTotal) * 100 : 0;
                  return (
                    <button
                      key={exp.id}
                      onClick={() => onEdit?.(exp)}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-secondary/60"
                    >
                      <div className="w-12 shrink-0 text-right">
                        <p className="text-[11px] font-mono font-semibold text-foreground">
                          {format(new Date(exp.timestamp), "HH:mm")}
                        </p>
                      </div>
                      <div className="relative flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{cat?.emoji ?? "📦"}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold">
                              {exp.customName || exp.category}
                              {exp.customName && (
                                <span className="ml-1 text-[9px] font-normal text-muted-foreground">· {exp.category}</span>
                              )}
                            </p>
                            <p className="truncate text-[10px] text-muted-foreground">
                              {pm?.icon} {pm?.label}
                            </p>
                          </div>
                          <p className="shrink-0 text-xs font-bold text-destructive">
                            -{currency.symbol}{exp.amount.toLocaleString()}
                          </p>
                        </div>
                        <div className="mt-1 h-1 rounded-full bg-secondary">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(pct, 4)}%` }} />
                        </div>
                      </div>
                    </button>
                  );
                })
            )}
          </div>
        </div>
      )}

      {periodTotal > 0 && view !== "day" && (
        <div className="mb-4 rounded-2xl bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-heading text-sm font-semibold">
              {view === "month" ? "Daily spend" : "Monthly spend"}
            </h3>
            <span className="text-[10px] text-muted-foreground">Tap a bar for details</span>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barCategoryGap="15%" onClick={handleBarClick}>
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
                  labelFormatter={(l) =>
                    view === "month" ? `Day ${l}, ${format(anchorDate, "MMM yyyy")}` : `${l} ${anchorDate.getFullYear()}`
                  }
                  formatter={(v: number) => [`${currency.symbol}${v.toLocaleString()}`, "Spent"]}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" className="cursor-pointer" />
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

      <DayDetailDrawer
        open={drawerDate !== null || drawerRange !== null}
        date={drawerDate}
        expenses={allExpenses}
        currency={currency}
        onClose={closeDrawer}
        onEdit={(exp) => { closeDrawer(); onEdit?.(exp); }}
        filterCategory={drawerCategory}
        rangeStart={drawerRange?.start}
        rangeEnd={drawerRange?.end}
        rangeLabel={drawerRange?.label}
      />
    </div>
  );
}
