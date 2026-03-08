import { useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddExpenseSheet from "@/components/AddExpenseSheet";
import ExpenseList from "@/components/ExpenseList";
import WeeklyChart from "@/components/WeeklyChart";
import BottomNav from "@/components/BottomNav";
import StatsPage from "@/components/StatsPage";
import ProfilePage from "@/components/ProfilePage";
import { useExpenses } from "@/hooks/useExpenses";

const HomePage = () => {
  const [tab, setTab] = useState<"home" | "stats" | "profile">("home");
  const [sheetOpen, setSheetOpen] = useState(false);
  const {
    currency,
    currencyCode,
    changeCurrency,
    addExpense,
    removeExpense,
    todayExpenses,
    todayTotal,
    weeklyData,
    weekTotal,
    weekExpenses,
  } = useExpenses();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-md px-4 pt-6">
        {tab === "home" && (
          <div className="animate-slide-up">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Today's spending</p>
                <h1 className="font-heading text-3xl font-bold">
                  {currency.symbol}{todayTotal.toLocaleString()}
                </h1>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
            </div>

            {/* Summary Card */}
            <div className="mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-elevated">
              <p className="text-xs opacity-80">This week</p>
              <p className="font-heading text-2xl font-bold">{currency.symbol}{weekTotal.toLocaleString()}</p>
              <p className="mt-1 text-xs opacity-70">{weekExpenses.length} transactions</p>
            </div>

            {/* Weekly Chart */}
            <div className="mb-4">
              <WeeklyChart data={weeklyData} currency={currency} />
            </div>

            {/* Today's Expenses */}
            <div className="mb-4">
              <h2 className="mb-2 font-heading text-sm font-semibold">Today</h2>
              <ExpenseList expenses={todayExpenses} currency={currency} onDelete={removeExpense} />
            </div>

            {/* FAB */}
            <Button
              onClick={() => setSheetOpen(true)}
              className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-elevated md:right-[calc(50%-224px+16px)]"
              size="icon"
            >
              <Plus className="h-6 w-6" />
            </Button>

            <AddExpenseSheet
              open={sheetOpen}
              onClose={() => setSheetOpen(false)}
              onAdd={addExpense}
              currency={currency}
            />
          </div>
        )}

        {tab === "stats" && (
          <StatsPage
            weeklyData={weeklyData}
            weekExpenses={weekExpenses}
            todayExpenses={todayExpenses}
            currency={currency}
          />
        )}

        {tab === "profile" && (
          <ProfilePage
            currencyCode={currencyCode}
            onChangeCurrency={changeCurrency}
          />
        )}
      </div>
      <BottomNav active={tab} onNavigate={setTab} />
    </div>
  );
};

export default HomePage;
