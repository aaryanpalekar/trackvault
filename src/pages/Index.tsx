import { useState } from "react";
import { Plus, Wallet } from "lucide-react";
import WelcomeScreen from "@/components/WelcomeScreen";
import { Button } from "@/components/ui/button";
import AddExpenseSheet from "@/components/AddExpenseSheet";
import ExpenseList from "@/components/ExpenseList";
import WeeklyChart from "@/components/WeeklyChart";
import BottomNav from "@/components/BottomNav";
import StatsPage from "@/components/StatsPage";
import ProfilePage from "@/components/ProfilePage";
import DuesPage from "@/components/DuesPage";
import { useExpenses } from "@/hooks/useExpenses";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

const HomePage = () => {
  const [tab, setTab] = useState<"home" | "stats" | "dues" | "profile">("home");
  const [sheetOpen, setSheetOpen] = useState(false);
  const {
    currency, currencyCode, changeCurrency,
    addExpense, removeExpense,
    todayExpenses, todayTotal,
    weeklyData, weekTotal, weekExpenses,
    username, setUsername,
    borrowings, addBorrowing, settleBorrowing, removeBorrowing,
    pendingBorrowings, totalOwed,
  } = useExpenses();

  const greeting = getGreeting();

  if (!username) {
    return <WelcomeScreen onSubmit={setUsername} />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-md px-4 pt-6">
        {tab === "home" && (
          <div className="animate-slide-up">
            {/* Greeting Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  {greeting}, {username} 👋
                </p>
                <h1 className="font-heading text-3xl font-bold">
                  {currency.symbol}{todayTotal.toLocaleString()}
                </h1>
                <p className="text-[10px] text-muted-foreground">spent today</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
            </div>

            {/* Summary Cards */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-4 text-primary-foreground shadow-elevated">
                <p className="text-[10px] opacity-80">This week</p>
                <p className="font-heading text-xl font-bold">{currency.symbol}{weekTotal.toLocaleString()}</p>
                <p className="text-[10px] opacity-70">{weekExpenses.length} txns</p>
              </div>
              {totalOwed > 0 ? (
                <div
                  className="rounded-2xl bg-gradient-to-br from-accent to-accent/80 p-4 text-accent-foreground shadow-elevated cursor-pointer"
                  onClick={() => setTab("dues")}
                >
                  <p className="text-[10px] opacity-80">People owe you</p>
                  <p className="font-heading text-xl font-bold">{currency.symbol}{totalOwed.toLocaleString()}</p>
                  <p className="text-[10px] opacity-70">{pendingBorrowings.length} pending</p>
                </div>
              ) : (
                <div className="rounded-2xl bg-card p-4 shadow-card">
                  <p className="text-[10px] text-muted-foreground">Avg/day</p>
                  <p className="font-heading text-xl font-bold">
                    {currency.symbol}{Math.round(weekTotal / 7).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">this week</p>
                </div>
              )}
            </div>

            <div className="mb-4">
              <WeeklyChart data={weeklyData} currency={currency} />
            </div>

            <div className="mb-4">
              <h2 className="mb-2 font-heading text-sm font-semibold">Today</h2>
              <ExpenseList expenses={todayExpenses} currency={currency} onDelete={removeExpense} />
            </div>

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
          <StatsPage weeklyData={weeklyData} weekExpenses={weekExpenses} todayExpenses={todayExpenses} currency={currency} />
        )}

        {tab === "dues" && (
          <DuesPage
            borrowings={borrowings}
            pendingBorrowings={pendingBorrowings}
            totalOwed={totalOwed}
            currency={currency}
            onAdd={addBorrowing}
            onSettle={settleBorrowing}
            onDelete={removeBorrowing}
          />
        )}

        {tab === "profile" && (
          <ProfilePage
            currencyCode={currencyCode}
            onChangeCurrency={changeCurrency}
            username={username}
            onChangeUsername={setUsername}
          />
        )}
      </div>
      <BottomNav active={tab} onNavigate={setTab} />
    </div>
  );
};

export default HomePage;
