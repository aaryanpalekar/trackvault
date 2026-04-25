import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { INCOME_SOURCES, Income } from "@/lib/types";
import { Currency } from "@/lib/currencies";
import { Plus, X, Calendar as CalendarIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface AddIncomeSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (amount: number, source: string, note?: string, receivedDate?: Date) => void;
  onUpdate?: (id: string, updates: { amount?: number; source?: string; note?: string; receivedDate?: Date }) => void;
  currency: Currency;
  editing?: Income | null;
}

export default function AddIncomeSheet({ open, onClose, onAdd, onUpdate, currency, editing }: AddIncomeSheetProps) {
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState<string>(INCOME_SOURCES[0].label);
  const [customSource, setCustomSource] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setAmount(String(editing.amount));
        const known = INCOME_SOURCES.find(s => s.label === editing.source);
        setSource(known ? editing.source : "Other");
        setCustomSource(known ? "" : editing.source);
        setNote(editing.note ?? "");
        setDate(new Date(editing.receivedOn));
      } else {
        setAmount("");
        setSource(INCOME_SOURCES[0].label);
        setCustomSource("");
        setNote("");
        setDate(new Date());
      }
    }
  }, [open, editing]);

  const handleSubmit = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return;
    const finalSource = source === "Other" ? (customSource.trim() || "Other") : source;
    if (editing && onUpdate) {
      onUpdate(editing.id, { amount: num, source: finalSource, note: note || undefined, receivedDate: date });
    } else {
      onAdd(num, finalSource, note || undefined, date);
    }
    onClose();
  };

  if (!open) return null;
  const isToday = date.toDateString() === new Date().toDateString();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up rounded-t-3xl bg-card p-6 pb-24 shadow-elevated">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">{editing ? "Edit Income" : "Add Income"}</h2>
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
        </div>

        {/* Date */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Received on</p>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start rounded-xl text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "EEE, dd/MM/yyyy")}
                {isToday && <span className="ml-auto text-xs text-primary font-semibold">Today</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="text-xs font-semibold text-muted-foreground">Pick a date</span>
                <button onClick={() => setDatePickerOpen(false)} className="rounded-full p-1 hover:bg-secondary" aria-label="Close calendar">
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

        {/* Source */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Source</p>
          <div className="flex flex-wrap gap-2">
            {INCOME_SOURCES.map(s => (
              <Button
                key={s.label}
                variant={source === s.label ? "chipActive" : "chip"}
                size="sm"
                onClick={() => setSource(s.label)}
              >
                {s.emoji} {s.label}
              </Button>
            ))}
          </div>
          {source === "Other" && (
            <Input
              placeholder="Source name (e.g. Bonus, Tax refund)"
              value={customSource}
              onChange={e => setCustomSource(e.target.value)}
              className="mt-2 rounded-xl"
            />
          )}
        </div>

        {/* Note */}
        <Input
          placeholder="Add a note (optional)"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="mb-4 rounded-xl"
        />

        <Button onClick={handleSubmit} className="w-full rounded-xl py-6 text-base font-semibold">
          {editing ? <><Check className="h-5 w-5" /> Save changes</> : <><Plus className="h-5 w-5" /> Add Income</>}
        </Button>
      </div>
    </div>
  );
}
