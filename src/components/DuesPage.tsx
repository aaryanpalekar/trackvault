import { useState } from "react";
import { Borrowing, BorrowingType } from "@/lib/types";
import { Currency } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Check, Trash2, Clock, UserCheck, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface DuesPageProps {
  borrowings: Borrowing[];
  pendingBorrowings: Borrowing[];
  totalOwed: number;
  totalIOwe: number;
  currency: Currency;
  onAdd: (personName: string, amount: number, reason?: string, type?: BorrowingType) => void;
  onSettle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function DuesPage({
  borrowings, pendingBorrowings, totalOwed, totalIOwe, currency, onAdd, onSettle, onDelete,
}: DuesPageProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [addType, setAddType] = useState<BorrowingType>("lent");
  const [showSettled, setShowSettled] = useState(false);
  const [tab, setTab] = useState<"lent" | "owed">("lent");

  const settledBorrowings = borrowings.filter(b => b.settled);
  const pendingLent = pendingBorrowings.filter(b => b.type === "lent");
  const pendingOwed = pendingBorrowings.filter(b => b.type === "owed");
  const currentPending = tab === "lent" ? pendingLent : pendingOwed;

  const handleAdd = () => {
    const num = parseFloat(amount);
    if (!name.trim() || !num || num <= 0) return;
    onAdd(name.trim(), num, reason.trim() || undefined, addType);
    setName(""); setAmount(""); setReason(""); setShowAdd(false);
  };

  return (
    <div className="animate-slide-up">
      <h1 className="mb-2 font-heading text-2xl font-bold">Dues</h1>
      <p className="mb-5 text-xs text-muted-foreground">Track money lent & owed</p>

      {/* Summary Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-accent to-accent/80 p-4 text-accent-foreground shadow-elevated">
          <div className="flex items-center gap-1 mb-1">
            <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />
            <p className="text-[10px] opacity-80">They owe you</p>
          </div>
          <p className="font-heading text-xl font-bold">{currency.symbol}{totalOwed.toLocaleString()}</p>
          <p className="text-[10px] opacity-70">{pendingLent.length} pending</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-destructive to-destructive/80 p-4 text-destructive-foreground shadow-elevated">
          <div className="flex items-center gap-1 mb-1">
            <ArrowDownLeft className="h-3.5 w-3.5 opacity-80" />
            <p className="text-[10px] opacity-80">You owe</p>
          </div>
          <p className="font-heading text-xl font-bold">{currency.symbol}{totalIOwe.toLocaleString()}</p>
          <p className="text-[10px] opacity-70">{pendingOwed.length} pending</p>
        </div>
      </div>

      {/* Tab Switch */}
      <div className="mb-4 flex rounded-xl bg-secondary p-1">
        <button
          onClick={() => setTab("lent")}
          className={cn(
            "flex-1 rounded-lg py-2 text-xs font-semibold transition-colors",
            tab === "lent" ? "bg-card shadow-card text-foreground" : "text-muted-foreground"
          )}
        >
          They Owe Me
        </button>
        <button
          onClick={() => setTab("owed")}
          className={cn(
            "flex-1 rounded-lg py-2 text-xs font-semibold transition-colors",
            tab === "owed" ? "bg-card shadow-card text-foreground" : "text-muted-foreground"
          )}
        >
          I Owe Them
        </button>
      </div>

      {/* Add New */}
      {!showAdd ? (
        <Button onClick={() => { setAddType(tab); setShowAdd(true); }} className="mb-4 w-full rounded-xl" variant="outline">
          <Plus className="h-4 w-4" /> Add new {tab === "lent" ? "due" : "payable"}
        </Button>
      ) : (
        <div className="mb-4 rounded-2xl bg-card p-4 shadow-card animate-pop-in">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">{addType === "lent" ? "Someone owes me" : "I owe someone"}</p>
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
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </div>
      )}

      {/* Pending List */}
      {currentPending.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <span className="text-4xl mb-2">✨</span>
          <p className="text-sm font-medium">No pending {tab === "lent" ? "dues" : "payables"}!</p>
          <p className="text-xs">Everything's settled</p>
        </div>
      )}

      <div className="space-y-2 mb-4">
        {currentPending.map(b => (
          <div key={b.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card animate-pop-in">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl font-bold text-sm",
              b.type === "lent" ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
            )}>
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
            <p className={cn("text-sm font-bold", b.type === "lent" ? "text-accent" : "text-destructive")}>
              {currency.symbol}{b.amount.toLocaleString()}
            </p>
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
                      {" · "}{b.type === "lent" ? "They owed you" : "You owed"}
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
