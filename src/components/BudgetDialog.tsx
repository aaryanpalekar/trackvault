import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Wallet, Check, Trash2 } from "lucide-react";
import { CATEGORIES } from "@/lib/types";
import { Currency } from "@/lib/currencies";
import { useBudgets } from "@/hooks/useBudgets";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  currency: Currency;
}

export default function BudgetDialog({ open, onClose, currency }: Props) {
  const { budgets, setOverall, setCategoryBudget } = useBudgets();
  const [overallInput, setOverallInput] = useState("");
  const [catInputs, setCatInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setOverallInput(budgets.overall ? String(budgets.overall) : "");
      const next: Record<string, string> = {};
      CATEGORIES.forEach(c => {
        next[c.label] = budgets.categories[c.label] ? String(budgets.categories[c.label]) : "";
      });
      setCatInputs(next);
    }
  }, [open, budgets]);

  if (!open) return null;

  const save = () => {
    const overall = parseFloat(overallInput);
    setOverall(!isNaN(overall) && overall > 0 ? overall : null);
    Object.entries(catInputs).forEach(([cat, val]) => {
      const n = parseFloat(val);
      setCategoryBudget(cat, !isNaN(n) && n > 0 ? n : null);
    });
    toast({ title: "Budgets saved" });
    onClose();
  };

  const clearAll = () => {
    setOverall(null);
    Object.keys(catInputs).forEach(c => setCategoryBudget(c, null));
    toast({ title: "Budgets cleared" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up rounded-t-3xl bg-card p-6 pb-8 shadow-elevated sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
              <Wallet className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold leading-tight">Monthly budgets</h2>
              <p className="text-[11px] text-muted-foreground">Set what you want to stay under</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-secondary">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Overall */}
        <div className="mb-5 rounded-2xl border border-border/60 bg-background/40 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Overall monthly cap
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
            <span className="text-lg font-bold text-primary">{currency.symbol}</span>
            <Input
              type="number"
              placeholder="e.g. 15000"
              value={overallInput}
              onChange={e => setOverallInput(e.target.value)}
              className="border-0 bg-transparent text-lg font-bold shadow-none focus-visible:ring-0 p-0 h-auto"
            />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Insights and progress bars pull from this number. Leave blank to disable.
          </p>
        </div>

        {/* Per-category */}
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Per-category (optional)
          </p>
          <div className="space-y-2">
            {CATEGORIES.map(cat => (
              <div key={cat.label} className="flex items-center gap-2">
                <span className="w-28 text-sm">{cat.emoji} {cat.label}</span>
                <div className="flex flex-1 items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5">
                  <span className="text-sm font-semibold text-muted-foreground">{currency.symbol}</span>
                  <Input
                    type="number"
                    placeholder="—"
                    value={catInputs[cat.label] ?? ""}
                    onChange={e => setCatInputs(prev => ({ ...prev, [cat.label]: e.target.value }))}
                    className="border-0 bg-transparent text-sm shadow-none focus-visible:ring-0 p-0 h-auto"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={save} className="flex-1 rounded-xl">
            <Check className="mr-1 h-4 w-4" /> Save budgets
          </Button>
          <Button onClick={clearAll} variant="outline" className="rounded-xl">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
