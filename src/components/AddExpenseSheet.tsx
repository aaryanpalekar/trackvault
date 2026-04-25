import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CATEGORIES, PAYMENT_METHODS, PaymentMethod, Expense } from "@/lib/types";
import { Currency } from "@/lib/currencies";
import { Plus, X, Calendar as CalendarIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface AddExpenseSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (
    amount: number,
    category: string,
    paymentMethod: PaymentMethod,
    note?: string,
    expenseDate?: Date,
    customName?: string,
  ) => void;
  onUpdate?: (
    id: string,
    updates: {
      amount?: number;
      category?: string;
      paymentMethod?: PaymentMethod;
      note?: string;
      expenseDate?: Date;
      customName?: string;
    },
  ) => void;
  currency: Currency;
  /** When provided, the sheet is in edit mode */
  editing?: Expense | null;
}

export default function AddExpenseSheet({ open, onClose, onAdd, onUpdate, currency, editing }: AddExpenseSheetProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0].label);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [note, setNote] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [customName, setCustomName] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setAmount(String(editing.amount));
        setCategory(editing.category);
        setPaymentMethod(editing.paymentMethod);
        setNote(editing.note ?? "");
        setDate(new Date(editing.timestamp));
        setCustomName(editing.customName ?? "");
      } else {
        setAmount("");
        setCategory(CATEGORIES[0].label);
        setPaymentMethod("upi");
        setNote("");
        setDate(new Date());
        setCustomName("");
      }
    }
  }, [open, editing]);

  const handleQuickAmount = (val: number) => setAmount(String(val));

  const handleSubmit = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return;
    const isOther = category === "Other";
    const finalCustom = isOther ? customName.trim() || undefined : undefined;
    if (editing && onUpdate) {
      onUpdate(editing.id, {
        amount: num,
        category,
        paymentMethod,
        note: note || undefined,
        expenseDate: date,
        customName: finalCustom,
      });
    } else {
      onAdd(num, category, paymentMethod, note || undefined, date, finalCustom);
    }
    onClose();
  };

  if (!open) return null;

  const isToday =
    date.toDateString() === new Date().toDateString();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up rounded-t-3xl bg-card p-6 pb-24 shadow-elevated">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">{editing ? "Edit Expense" : "Add Expense"}</h2>
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

        {/* Date */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Date</p>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start rounded-xl text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "EEE, dd/MM/yyyy")}
                {isToday && <span className="ml-auto text-xs text-primary font-semibold">Today</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="text-xs font-semibold text-muted-foreground">Pick a date</span>
                <button
                  onClick={() => setDatePickerOpen(false)}
                  className="rounded-full p-1 hover:bg-secondary"
                  aria-label="Close calendar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => { if (d) { setDate(d); setDatePickerOpen(false); } }}
                disabled={(d) => d > new Date()}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
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
          {category === "Other" && (
            <Input
              placeholder="What did you spend on? (e.g. Gift, Movie)"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              className="mt-2 rounded-xl"
            />
          )}
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
          {editing ? <><Check className="h-5 w-5" /> Save changes</> : <><Plus className="h-5 w-5" /> Add Expense</>}
        </Button>
      </div>
    </div>
  );
}
