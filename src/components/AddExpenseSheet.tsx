import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES, PAYMENT_METHODS, PaymentMethod } from "@/lib/types";
import { Currency } from "@/lib/currencies";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddExpenseSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (amount: number, category: string, paymentMethod: PaymentMethod, note?: string) => void;
  currency: Currency;
}

export default function AddExpenseSheet({ open, onClose, onAdd, currency }: AddExpenseSheetProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0].label);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [note, setNote] = useState("");

  const handleQuickAmount = (val: number) => setAmount(String(val));

  const handleSubmit = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return;
    onAdd(num, category, paymentMethod, note || undefined);
    setAmount("");
    setNote("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md animate-slide-up rounded-t-3xl bg-card p-6 pb-8 shadow-elevated">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">Add Expense</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-secondary">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Amount */}
        <div className="mb-4">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-4 py-3">
            <span className="text-2xl font-bold text-primary">{currency.symbol}</span>
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="border-0 bg-transparent text-2xl font-bold shadow-none focus-visible:ring-0 p-0 h-auto"
            />
          </div>
          <div className="mt-2 flex gap-2">
            {currency.quickAmounts.map(val => (
              <Button
                key={val}
                variant="quick"
                size="sm"
                className="flex-1 rounded-xl"
                onClick={() => handleQuickAmount(val)}
              >
                {currency.symbol}{val}
              </Button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Category</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <Button
                key={cat.label}
                variant={category === cat.label ? "chipActive" : "chip"}
                size="sm"
                onClick={() => setCategory(cat.label)}
              >
                {cat.emoji} {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Paid via</p>
          <div className="flex gap-2">
            {PAYMENT_METHODS.map(pm => (
              <Button
                key={pm.value}
                variant={paymentMethod === pm.value ? "chipActive" : "chip"}
                size="sm"
                className="flex-1"
                onClick={() => setPaymentMethod(pm.value)}
              >
                {pm.icon} {pm.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Note */}
        <Input
          placeholder="Add a note (optional)"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="mb-4 rounded-xl"
        />

        <Button onClick={handleSubmit} className="w-full rounded-xl py-6 text-base font-semibold">
          <Plus className="h-5 w-5" /> Add Expense
        </Button>
      </div>
    </div>
  );
}
