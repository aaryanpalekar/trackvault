import { useMemo, useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, X, ArrowDownCircle, ArrowUpCircle, Users } from "lucide-react";
import { Expense, Income, Borrowing, CATEGORIES } from "@/lib/types";
import { Currency } from "@/lib/currencies";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  expenses: Expense[];
  incomes: Income[];
  borrowings: Borrowing[];
  currency: Currency;
  onEditExpense?: (e: Expense) => void;
}

type Row =
  | { kind: "expense"; ts: number; data: Expense }
  | { kind: "income"; ts: number; data: Income }
  | { kind: "borrow"; ts: number; data: Borrowing };

export default function SearchOverlay({
  open, onClose, expenses, incomes, borrowings, currency, onEditExpense,
}: Props) {
  const [q, setQ] = useState("");
  useEffect(() => { if (open) setQ(""); }, [open]);

  const results = useMemo<Row[]>(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const num = parseFloat(query);
    const matchAmt = (a: number) => !isNaN(num) && Math.abs(a - num) < 0.001;

    const rows: Row[] = [];
    expenses.forEach(e => {
      const hay = `${e.category} ${e.customName ?? ""} ${e.note ?? ""} ${e.paymentMethod}`.toLowerCase();
      if (hay.includes(query) || matchAmt(e.amount)) rows.push({ kind: "expense", ts: e.timestamp, data: e });
    });
    incomes.forEach(i => {
      const hay = `${i.source} ${i.note ?? ""}`.toLowerCase();
      if (hay.includes(query) || matchAmt(i.amount)) rows.push({ kind: "income", ts: i.receivedOn, data: i });
    });
    borrowings.forEach(b => {
      const hay = `${b.personName} ${b.reason ?? ""} ${b.type}`.toLowerCase();
      if (hay.includes(query) || matchAmt(b.amount)) rows.push({ kind: "borrow", ts: b.borrowedOn, data: b });
    });
    return rows.sort((a, b) => b.ts - a.ts).slice(0, 60);
  }, [q, expenses, incomes, borrowings]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg rounded-3xl border-border/60 p-0 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search transactions, dues, income…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {q.trim() === "" ? (
            <p className="p-6 text-center text-xs text-muted-foreground">
              Search by name, category, note, person or amount.
            </p>
          ) : results.length === 0 ? (
            <p className="p-6 text-center text-xs text-muted-foreground">No matches for “{q}”.</p>
          ) : (
            <ul className="space-y-1">
              {results.map((r, idx) => {
                if (r.kind === "expense") {
                  const e = r.data;
                  const cat = CATEGORIES.find(c => c.label === e.category);
                  return (
                    <li key={`e-${e.id}-${idx}`}>
                      <button
                        onClick={() => { onEditExpense?.(e); onClose(); }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-secondary/70"
                      >
                        <span className="text-lg">{cat?.emoji ?? "📦"}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {e.customName || e.category}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {format(new Date(e.timestamp), "dd MMM yyyy")} · {e.category}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-destructive">
                          -{currency.symbol}{e.amount.toLocaleString()}
                        </span>
                      </button>
                    </li>
                  );
                }
                if (r.kind === "income") {
                  const i = r.data;
                  return (
                    <li key={`i-${i.id}-${idx}`}>
                      <div className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5">
                        <ArrowDownCircle className="h-5 w-5 text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{i.source}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {format(new Date(i.receivedOn), "dd MMM yyyy")} · Income
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-primary">
                          +{currency.symbol}{i.amount.toLocaleString()}
                        </span>
                      </div>
                    </li>
                  );
                }
                const b = r.data;
                return (
                  <li key={`b-${b.id}-${idx}`}>
                    <div className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5">
                      <Users className="h-5 w-5 text-accent" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {b.personName}
                          <span className="ml-2 text-[10px] font-medium text-muted-foreground">
                            {b.type === "lent" ? "They owe" : "You owe"}
                          </span>
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {format(new Date(b.borrowedOn), "dd MMM yyyy")}{b.reason ? ` · ${b.reason}` : ""}
                        </p>
                      </div>
                      <span className={cn(
                        "shrink-0 text-sm font-bold",
                        b.settled ? "text-muted-foreground line-through" : "text-foreground"
                      )}>
                        {currency.symbol}{b.amount.toLocaleString()}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
