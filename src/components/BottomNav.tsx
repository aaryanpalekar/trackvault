import { Home, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  active: "home" | "stats" | "profile";
  onNavigate: (tab: "home" | "stats" | "profile") => void;
}

const tabs = [
  { id: "home" as const, label: "Home", icon: Home },
  { id: "stats" as const, label: "Stats", icon: BarChart3 },
  { id: "profile" as const, label: "Profile", icon: User },
];

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl transition-all",
              active === id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5", active === id && "scale-110")} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
