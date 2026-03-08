import { CURRENCIES } from "@/lib/currencies";
import { Check, Globe, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ProfilePageProps {
  currencyCode: string;
  onChangeCurrency: (code: string) => void;
}

export default function ProfilePage({ currencyCode, onChangeCurrency }: ProfilePageProps) {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [search, setSearch] = useState("");

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  const filteredCurrencies = CURRENCIES.filter(
    c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-slide-up">
      <h1 className="mb-6 font-heading text-2xl font-bold">Settings</h1>

      {/* Theme Toggle */}
      <div className="mb-4 rounded-2xl bg-card p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {dark ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-accent" />}
            <div>
              <p className="text-sm font-semibold">Dark Mode</p>
              <p className="text-[10px] text-muted-foreground">Toggle app theme</p>
            </div>
          </div>
          <button
            onClick={toggleDark}
            className={cn(
              "relative h-7 w-12 rounded-full transition-colors",
              dark ? "bg-primary" : "bg-secondary"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-6 w-6 rounded-full bg-card shadow-md transition-transform",
                dark ? "left-[22px]" : "left-0.5"
              )}
            />
          </button>
        </div>
      </div>

      {/* Currency Selection */}
      <div className="rounded-2xl bg-card p-4 shadow-card">
        <div className="mb-3 flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-heading text-sm font-semibold">Currency</h3>
        </div>
        <input
          type="text"
          placeholder="Search currency..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-3 w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
          {filteredCurrencies.map(c => (
            <button
              key={c.code}
              onClick={() => onChangeCurrency(c.code)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors",
                currencyCode === c.code
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-secondary"
              )}
            >
              <div>
                <span className="text-sm font-semibold">{c.symbol} {c.code}</span>
                <span className="ml-2 text-xs text-muted-foreground">{c.name}</span>
              </div>
              {currencyCode === c.code && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
