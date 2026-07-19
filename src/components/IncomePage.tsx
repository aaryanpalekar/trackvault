import { useMemo, useState } from "react";
import { Income, INCOME_SOURCES } from "@/lib/types";
import { Currency } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Calendar as CalendarIcon, Trash2, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import {
  format, isToday, isYesterday, startOfMonth, endOfMonth,
  startOfYear, endOfYear, addMonths, subMonths, getDaysInMonth, startOfDay, endOfDay,
} from "date-fns";
import { cn } from "@/lib/utils";
import AddIncomeSheet from "./AddIncomeSheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(142 76% 45%)",
  "hsl(38 92% 55%)",
  "hsl(280 70% 60%)",
  "hsl(200 80% 55%)",
  "hsl(0 75% 60%)",
];

type View = "month" | "year";

interface IncomePageProps {
  incomes: Income[];
  currency: Currency;
  onAdd: (amount: number, source: string, note?: string, receivedDate?: Date) => void;
  onUpdate: (id: string, updates: { amount?: number; source?: string; note?: string; receivedDate?: Date }) => void;
  onDelete: (id: string) => void;
}

export default function IncomePage({ incomes, currency, onAdd, onUpdate, onDelete }: IncomePageProps) {
  const [view, setView] = useState<View>("month");
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Income | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { rangeStart, rangeEnd, label } = useMemo(() => {
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

  const filtered = useMemo(
    () => incomes
      .filter(i => i.receivedOn >= rangeStart.getTime() && i.receivedOn <= rangeEnd.getTime())
      .sort((a, b) => b.receivedOn - a.receivedOn),
    [incomes, rangeStart, rangeEnd]
  );

  const periodTotal = filtered.reduce((s, i) => s + i.amount, 0);
  const txCount = filtered.length;

  const sourceBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(i => { map[i.source] = (map[i.source] || 0) + i.amount; });
    return Object.entries(map)
      .map(([src, total]) => ({
        name: src,
        value: total,
        emoji: INCOME_SOURCES.find(s => s.label === src)?.emoji ?? "💰",
      }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const barData = useMemo(() => {
    if (view === "month") {
      const days = getDaysInMonth(anchorDate);
      const monthStart = startOfMonth(anchorDate);
      return Array.from({ length: days }, (_, idx) => {
        const day = new Date(monthStart);
        day.setDate(monthStart.getDate() + idx);
        const dStart = startOfDay(day).getTime();
        const dEnd = endOfDay(day).getTime();
        const total = filtered.filter(i => i.receivedOn >= dStart && i.receivedOn <= dEnd).reduce((s, i) => s + i.amount, 0);
        return { name: String(idx + 1), total };
      });
    }
    return Array.from({ length: 12 }, (_, m) => {
      const ms = new Date(anchorDate.getFullYear(), m, 1).getTime();
      const me = new Date(anchorDate.getFullYear(), m + 1, 0, 23, 59, 59, 999).getTime();
      const total = filtered.filter(i => i.receivedOn >= ms && i.receivedOn <= me).reduce((s, i) => s + i.amount, 0);
      return { name: format(new Date(anchorDate.getFullYear(), m, 1), "MMM"), total };
    });
  }, [filtered, view, anchorDate]);

  const stepBack = () => setAnchorDate(d => view === "month" ? subMonths(d, 1) : new Date(d.getFullYear() - 1, 0, 1));
  const stepForward = () => {
    const now = new Date();
    setAnchorDate(d => {
      const n = view === "month" ? addMonths(d, 1) : new Date(d.getFullYear() + 1, 0, 1);
      return n > now ? d : n;
    });
  };

  const formatWhen = (ts: number) => {
    const d = new Date(ts);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "dd/MM/yyyy");
  };

  return (
    <div className="animate-slide-up pb-24 sm:max-w-2xl sm:mx-auto lg:max-w-5xl">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">Income</h1>
          <p className="text-xs text-muted-foreground">Salary, freelance and other real income — reimbursements belong on the Dues tab.</p>
        </div>
      </div>

      {/* View Selector */}
      <div className="mb-3 flex rounded-2xl border border-border/60 bg-card/60 p-1 shadow-card backdrop-blur sm:max-w-xs">
        {(["month", "year"] as View[]).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "flex-1 rounded-xl py-2 text-xs font-semibold transition-smooth capitalize",
              view === v ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {v === "month" ? "Monthly" : "Yearly"}
          </button>
        ))}
      </div>

      {/* Date navigator */}
      <div className="mb-4 flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl shrink-0" onClick={stepBack} aria-label="Previous">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-10 flex-1 justify-center rounded-xl font-semibold">
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
        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl shrink-0" onClick={stepForward} aria-label="Next">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-3xl bg-gradient-primary p-4 text-primary-foreground shadow-elevated transition-bounce hover:-translate-y-1 hover:shadow-glow sm:p-5">
          <div className="mb-1 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            <p className="text-[10px] opacity-80 sm:text-xs">Received</p>
          </div>
          <p className="font-heading text-xl font-bold sm:text-2xl">{currency.symbol}{periodTotal.toLocaleString()}</p>
          <p className="text-[10px] opacity-70 sm:text-xs">{txCount} entries</p>
        </div>
        <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-card transition-bounce hover:-translate-y-1 hover:shadow-elevated sm:p-5">
          <p className="text-[10px] text-muted-foreground sm:text-xs">Avg per entry</p>
          <p className="font-heading text-xl font-bold sm:text-2xl">
            {currency.symbol}{txCount > 0 ? Math.round(periodTotal / txCount).toLocaleString() : 0}
          </p>
          <p className="text-[10px] text-muted-foreground sm:text-xs">this {view}</p>
        </div>
      </div>

      {/* Pie chart by source */}
      {sourceBreakdown.length > 0 && (
        <div className="mb-4 rounded-2xl bg-card p-4 shadow-card">
          <h3 className="mb-2 font-heading text-sm font-semibold">Source breakdown</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sourceBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={75} paddingAngle={2} stroke="hsl(var(--card))" strokeWidth={2}>
                  {sourceBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", color: "hsl(var(--popover-foreground))", fontSize: "12px" }}
                  formatter={(v: number) => [`${currency.symbol}${v.toLocaleString()}`, "Received"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {sourceBreakdown.map((item, i) => {
              const pct = periodTotal > 0 ? (item.value / periodTotal) * 100 : 0;
              return (
                <div key={item.name} className="flex items-center gap-1.5 text-[11px]">
                  <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="truncate">{item.emoji} {item.name}</span>
                  <span className="ml-auto font-semibold">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bar chart over time */}
      {periodTotal > 0 && (
        <div className="mb-4 rounded-2xl bg-card p-4 shadow-card">
          <h3 className="mb-3 font-heading text-sm font-semibold">{view === "month" ? "Daily" : "Monthly"} trend</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barCategoryGap="15%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} interval={view === "month" ? 3 : 0} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis axisLine={false} tickLine={false} width={30} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", fontSize: "12px" }}
                  formatter={(v: number) => [`${currency.symbol}${v.toLocaleString()}`, "Received"]}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* List */}
      <div className="mb-4">
        <h3 className="mb-2 font-heading text-sm font-semibold">Entries ({txCount})</h3>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <span className="text-4xl mb-2">💰</span>
            <p className="text-sm font-medium">No income recorded</p>
            <p className="text-xs">Tap + to add your first entry</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(inc => {
              const src = INCOME_SOURCES.find(s => s.label === inc.source);
              return (
                <div key={inc.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card animate-pop-in">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-lg">
                    {src?.emoji ?? "💰"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{inc.source}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {formatWhen(inc.receivedOn)}{inc.note && ` · ${inc.note}`}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-primary whitespace-nowrap">+{currency.symbol}{inc.amount.toLocaleString()}</p>
                  <button
                    onClick={() => { setEditing(inc); setSheetOpen(true); }}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    aria-label="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(inc.id)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Button
        onClick={() => { setEditing(null); setSheetOpen(true); }}
        className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-elevated md:right-[calc(50%-224px+16px)]"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <AddIncomeSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditing(null); }}
        onAdd={onAdd}
        onUpdate={onUpdate}
        currency={currency}
        editing={editing}
      />
    </div>
  );
}
