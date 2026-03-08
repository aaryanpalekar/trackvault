import { Currency } from "@/lib/currencies";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";

interface WeeklyChartProps {
  data: { name: string; total: number; isToday: boolean }[];
  currency: Currency;
}

export default function WeeklyChart({ data, currency }: WeeklyChartProps) {
  const maxVal = Math.max(...data.map(d => d.total), 1);

  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <h3 className="mb-3 font-heading text-sm font-semibold">This Week</h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis hide />
            <Bar dataKey="total" radius={[6, 6, 0, 0]}>
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
