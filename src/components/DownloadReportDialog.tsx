import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { Expense, Income, Borrowing } from "@/lib/types";
import { Currency } from "@/lib/currencies";
import { generateMonthlyReport } from "@/lib/monthlyReport";
import { generateMonthlyCsv } from "@/lib/monthlyCsv";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  username: string;
  currency: Currency;
  expenses: Expense[];
  incomes: Income[];
  borrowings: Borrowing[];
}

export default function DownloadReportDialog({ username, currency, expenses, incomes, borrowings }: Props) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(startOfMonth(new Date()));
  const [generating, setGenerating] = useState(false);

  const stats = useMemo(() => {
    const start = startOfMonth(month).getTime();
    const end = endOfMonth(month).getTime();
    const exps = expenses.filter(e => e.timestamp >= start && e.timestamp <= end);
    const incs = incomes.filter(i => i.receivedOn >= start && i.receivedOn <= end);
    const spent = exps.reduce((s, e) => s + e.amount, 0);
    const earned = incs.reduce((s, i) => s + i.amount, 0);
    return { txCount: exps.length, spent, earned, net: earned - spent };
  }, [month, expenses, incomes]);

  const isCurrent = isSameMonth(month, new Date());
  const canForward = month < startOfMonth(new Date());

  const handleDownload = async () => {
    if (stats.txCount === 0 && stats.earned === 0) {
      toast.error("Nothing to export for this month");
      return;
    }
    setGenerating(true);
    try {
      // give UI a tick to show loading state
      await new Promise(r => setTimeout(r, 50));
      generateMonthlyReport({ month, username, currency, expenses, incomes, borrowings });
      toast.success(`Report for ${format(month, "MMMM yyyy")} downloaded`);
      setOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const fmt = (n: number) => `${currency.symbol}${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="group relative w-full overflow-hidden rounded-2xl bg-card p-4 shadow-card hover-lift text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold">Monthly Report</p>
                <Sparkles className="h-3 w-3 text-accent" />
              </div>
              <p className="text-[11px] text-muted-foreground">Download a PDF for any month</p>
            </div>
            <Download className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-y-0.5" />
          </div>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md rounded-3xl border-border/60 p-0 overflow-hidden">
        {/* Header band */}
        <div className="bg-gradient-to-br from-primary via-primary to-primary/70 p-6 text-primary-foreground">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 opacity-80" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">PDF Report</span>
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading text-primary-foreground">
              Download monthly report
            </DialogTitle>
          </DialogHeader>
          <p className="mt-1 text-xs opacity-80">Pick any month — we'll bundle expenses, income and dues into a clean PDF.</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Month switcher */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-secondary/40 p-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 rounded-xl"
              onClick={() => setMonth(m => subMonths(m, 1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <p className="font-heading text-lg font-bold leading-tight">{format(month, "MMMM yyyy")}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {isCurrent ? "Current month" : format(month, "'Month of' MMM")}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className={cn("h-9 w-9 rounded-xl", !canForward && "opacity-30 pointer-events-none")}
              onClick={() => canForward && setMonth(m => addMonths(m, 1))}
              aria-label="Next month"
              disabled={!canForward}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map(offset => {
              const d = startOfMonth(subMonths(new Date(), offset));
              const active = isSameMonth(d, month);
              return (
                <button
                  key={offset}
                  onClick={() => setMonth(d)}
                  className={cn(
                    "rounded-xl border px-2 py-2 text-[11px] font-semibold transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {offset === 0 ? "This month" : format(d, "MMM yyyy")}
                </button>
              );
            })}
          </div>

          {/* Live preview stats */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Preview</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground">Spent</p>
                <p className="font-heading text-sm font-bold text-destructive">{fmt(stats.spent)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Income</p>
                <p className="font-heading text-sm font-bold text-primary">{fmt(stats.earned)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Net</p>
                <p className={cn("font-heading text-sm font-bold", stats.net >= 0 ? "text-primary" : "text-destructive")}>
                  {stats.net >= 0 ? "+" : "-"}{fmt(Math.abs(stats.net))}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[11px]">
              <span className="text-muted-foreground">{stats.txCount} transaction{stats.txCount !== 1 ? "s" : ""}</span>
              <span className="text-muted-foreground">A4 · PDF</span>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Button
              onClick={handleDownload}
              disabled={generating}
              className="rounded-xl gap-2 h-11 font-semibold"
            >
              <Download className="h-4 w-4" />
              {generating ? "Generating..." : `Download PDF`}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (stats.txCount === 0) { toast.error("Nothing to export for this month"); return; }
                generateMonthlyCsv({ month, currency, expenses });
                toast.success(`CSV for ${format(month, "MMMM yyyy")} downloaded`);
              }}
              className="rounded-xl h-11 gap-2 font-semibold"
            >
              CSV
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
