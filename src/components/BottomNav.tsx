import { Home, BarChart3, User, HandCoins, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "home" | "stats" | "income" | "dues" | "profile";

interface BottomNavProps {
  active: Tab;
  onNavigate: (tab: Tab) => void;
}

const tabs = [
  { id: "home" as const, label: "Home", icon: Home },
  { id: "stats" as const, label: "Stats", icon: BarChart3 },
  { id: "income" as const, label: "Income", icon: Wallet },
  { id: "dues" as const, label: "Dues", icon: HandCoins },
  { id: "profile" as const, label: "Profile", icon: User },
];

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-3 left-1/2 z-50 -translate-x-1/2 px-3 sm:bottom-5">
      <div className="flex items-center gap-1 rounded-full border border-border/60 bg-card/80 px-2 py-1.5 shadow-elevated backdrop-blur-xl">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={cn(
                "group relative flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-bounce sm:px-4",
                isActive
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
              aria-label={label}
            >
              <Icon className={cn("h-4 w-4 transition-transform", isActive && "scale-110")} />
              <span className={cn("hidden sm:inline", isActive && "inline")}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
