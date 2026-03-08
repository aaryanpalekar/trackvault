import { useState } from "react";
import { Borrowing } from "@/lib/types";
import { Currency } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Check, Trash2, Clock, UserCheck } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface DuesPageProps {
  borrowings: Borrowing[];
  pendingBorrowings: Borrowing[];
  totalOwed: number;
  currency: Currency;
  onAdd: (personName: string, amount: number, reason?: string) => void;
  onSettle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function DuesPage({
  borrowings, pendingBorrowings, totalOwed, currency, onAdd, onSettle, onDelete,
}: DuesPageProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [showSettled, setShowSettled] = useState(false);

  const settledBorrowings = borrowings.filter(b => b.settled);

  const handleAdd = () => {
    const num = parseFloat(amount);
    if (!name.trim() || !num || num <= 0) return;
    onAdd(name.trim(), num, reason.trim() || undefined);
    setName(""); setAmount(""); setReason(""); setShowAdd(false);
  };

  return (
    <div className="animate-slide-up">
      <h1 className="mb-2 font-heading text-2xl font-bold">Dues</h1>
      <p className="mb-5 text-xs text-muted-foreground">Track money people owe you</p>

      {/* Total Owed Card */}
      <div className="mb-4 rounded-2xl bg-gradient-to-br from-accent to-accent/80 p-5 text-accent-foreground shadow-elevated">
        <p className="text-xs opacity-80">People owe you</p>
        <p className="font-heading text-3xl font-bold">{currency.symbol}{totalOwed.toLocaleString()}</p>
        <p className="mt-1 text-xs opacity-70">{pendingBorrowings.length} pending</p>
      </div>

      {/* Add New */}
      {!showAdd ? (
        <Button onClick={() => setShowAdd(true)} className="mb-4 w-full rounded-xl" variant="outline">
          <Plus className="h-4 w-4" /> Add new due
        </Button>
      ) : (
        <div className="mb-4 rounded-2xl bg-card p-4 shadow-card animate-pop-in">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">New Due</p>
            <button onClick={() => setShowAdd(false)} className="rounded-full p-1 hover:bg-secondary">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="space-y-2">
            <Input placeholder="Person's name" value={name} onChange={e => setName(e.target.value)} className="rounded-xl" />
            <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-2">
              <span className="text-lg font-bold text-primary">{currency.symbol}</span>
              <Input
                type="number" placeholder="Amount" value={amount}
                onChange={e => setAmount(e.target.value)}
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 h-auto"
              />
            </div>
            <Input placeholder="Reason (optional)" value={reason} onChange={e => setReason(e.target.value)} className="rounded-xl" />
            <Button onClick={handleAdd} className="w-full rounded-xl">
              <Plus className="h-4 w-4" /> Add Due
            </Button>
          </div>
        </div>
      )}

      {/* Pending List */}
      {pendingBorrowings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <span className="text-4xl mb-2">✨</span>
          <p className="text-sm font-medium">No pending dues!</p>
          <p className="text-xs">Everyone's settled up</p>
        </div>
      )}

      <div className="space-y-2 mb-4">
        {pendingBorrowings.map(b => (
          <div key={b.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card animate-pop-in">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent font-bold text-sm">
              {b.personName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{b.personName}</p>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {formatDistanceToNow(new Date(b.borrowedOn), { addSuffix: true })}
                {b.reason && <span> · {b.reason}</span>}
              </div>
            </div>
            <p className="text-sm font-bold text-accent">{currency.symbol}{b.amount.toLocaleString()}</p>
            <div className="flex gap-1">
              <button
                onClick={() => onSettle(b.id)}
                className="rounded-lg p-1.5 text-primary hover:bg-primary/10 transition-colors"
                title="Mark as settled"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDelete(b.id)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Settled History */}
      {settledBorrowings.length > 0 && (
        <div>
          <button
            onClick={() => setShowSettled(!showSettled)}
            className="mb-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {showSettled ? "Hide" : "Show"} settled ({settledBorrowings.length})
          </button>
          {showSettled && (
            <div className="space-y-2">
              {settledBorrowings.map(b => (
                <div key={b.id} className="flex items-center gap-3 rounded-2xl bg-card/60 p-3 opacity-60">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate line-through">{b.personName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Settled {b.settledOn ? format(new Date(b.settledOn), "MMM d") : ""}
                      {b.reason && ` · ${b.reason}`}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-muted-foreground">{currency.symbol}{b.amount.toLocaleString()}</p>
                  <button
                    onClick={() => onDelete(b.id)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
