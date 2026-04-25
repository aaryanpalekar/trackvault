import { Currency } from "@/lib/currencies";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";

interface WeeklyChartDatum {
  name: string;
  total: number;
  isToday: boolean;
  /** Date object for the bar so callers can drill down */
  date: Date;
  count: number;
}

interface WeeklyChartProps {
  data: WeeklyChartDatum[];
  currency: Currency;
  onSelectDay?: (date: Date) => void;
}

export default function WeeklyChart({ data, currency, onSelectDay }: WeeklyChartProps) {
  const handleClick = (state: any) => {
    if (!onSelectDay) return;
    const payload = state?.activePayload?.[0]?.payload as WeeklyChartDatum | undefined;
    if (payload?.date) onSelectDay(payload.date);
  };

  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-sm font-semibold">This Week</h3>
        {onSelectDay && (
          <span className="text-[10px] text-muted-foreground">Tap a day for details</span>
        )}
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%" onClick={handleClick}>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.75rem",
                color: "hsl(var(--popover-foreground))",
                fontSize: "12px",
              }}
              formatter={(v: number, _n, p: any) => [
                `${currency.symbol}${v.toLocaleString()}`,
                `${p?.payload?.count ?? 0} txns`,
              ]}
              labelFormatter={(l) => `${l}`}
            />
            <Bar dataKey="total" radius={[6, 6, 0, 0]} className="cursor-pointer">
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.isToday ? "hsl(var(--primary))" : "hsl(var(--muted))"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
