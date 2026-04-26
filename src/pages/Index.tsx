import { useState } from "react";
import { Plus, Wallet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddExpenseSheet from "@/components/AddExpenseSheet";
import ExpenseList from "@/components/ExpenseList";
import WeeklyChart from "@/components/WeeklyChart";
import BottomNav from "@/components/BottomNav";
import StatsPage from "@/components/StatsPage";
import ProfilePage from "@/components/ProfilePage";
import DuesPage from "@/components/DuesPage";
import IncomePage from "@/components/IncomePage";
import AuthPage from "@/components/AuthPage";
import DayDetailDrawer from "@/components/DayDetailDrawer";
import { useExpenses } from "@/hooks/useExpenses";
import { useAuth } from "@/hooks/useAuth";
import { Expense } from "@/lib/types";

type Tab = "home" | "stats" | "income" | "dues" | "profile";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

const HomePage = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("home");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [drawerDate, setDrawerDate] = useState<Date | null>(null);
  const {
    loading, currency, currencyCode, changeCurrency,
    addExpense, updateExpense, removeExpense, expenses,
    todayExpenses, todayTotal,
    weeklyData, weekTotal, weekExpenses,
    username, setUsername,
    borrowings, addBorrowing, settleBorrowing, removeBorrowing,
    pendingBorrowings, totalOwed, totalIOwe,
    incomes, addIncome, updateIncome, removeIncome, totalReceived,
  } = useExpenses();

  const openAdd = () => { setEditingExpense(null); setSheetOpen(true); };
  const openEdit = (exp: Expense) => { setEditingExpense(exp); setSheetOpen(true); };
  const closeSheet = () => { setSheetOpen(false); setEditingExpense(null); };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const greeting = getGreeting();

  return (
    <div className="relative min-h-screen bg-background pb-24 lg:pb-6">
      {/* Soft gradient mesh background */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-mesh opacity-60" />

      <div className="relative mx-auto max-w-md px-4 pt-6 sm:max-w-2xl sm:px-6 lg:max-w-5xl lg:pt-10">
        {tab === "home" && (
          <div className="animate-slide-up">
            {/* Hero header */}
            <div className="mb-6 flex items-center justify-between sm:mb-8">
              <div>
                <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                  {greeting}, {username} 👋
                </p>
                <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                  {currency.symbol}{todayTotal.toLocaleString()}
                </h1>
                <p className="text-[11px] text-muted-foreground sm:text-xs">spent today</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow sm:h-14 sm:w-14">
                <Wallet className="h-6 w-6 text-primary-foreground sm:h-7 sm:w-7" />
              </div>
            </div>

            {/* Stat cards */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <div className="rounded-3xl bg-gradient-primary p-4 text-primary-foreground shadow-elevated transition-bounce hover:-translate-y-1 hover:shadow-glow sm:p-5">
                <p className="text-[10px] opacity-80 sm:text-xs">This week</p>
                <p className="font-heading text-xl font-bold sm:text-2xl">{currency.symbol}{weekTotal.toLocaleString()}</p>
                <p className="text-[10px] opacity-70 sm:text-xs">{weekExpenses.length} txns</p>
              </div>
              {totalReceived > 0 ? (
                <button
                  onClick={() => setTab("income")}
                  className="rounded-3xl bg-gradient-accent p-4 text-left text-accent-foreground shadow-elevated transition-bounce hover:-translate-y-1 hover:shadow-glow sm:p-5"
                >
                  <p className="text-[10px] opacity-80 sm:text-xs">Received</p>
                  <p className="font-heading text-xl font-bold sm:text-2xl">
                    +{currency.symbol}{totalReceived.toLocaleString()}
                  </p>
                  <p className="text-[10px] opacity-70 sm:text-xs">{incomes.length} entries</p>
                </button>
              ) : totalOwed > 0 || totalIOwe > 0 ? (
                <button
                  onClick={() => setTab("dues")}
                  className="rounded-3xl bg-gradient-accent p-4 text-left text-accent-foreground shadow-elevated transition-bounce hover:-translate-y-1 hover:shadow-glow sm:p-5"
                >
                  <p className="text-[10px] opacity-80 sm:text-xs">Net dues</p>
                  <p className="font-heading text-xl font-bold sm:text-2xl">
                    {totalOwed >= totalIOwe ? "+" : "-"}{currency.symbol}{Math.abs(totalOwed - totalIOwe).toLocaleString()}
                  </p>
                  <p className="text-[10px] opacity-70 sm:text-xs">{pendingBorrowings.length} pending</p>
                </button>
              ) : (
                <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-card transition-bounce hover:-translate-y-1 hover:shadow-elevated sm:p-5">
                  <p className="text-[10px] text-muted-foreground sm:text-xs">Avg/day</p>
                  <p className="font-heading text-xl font-bold sm:text-2xl">
                    {currency.symbol}{Math.round(weekTotal / 7).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground sm:text-xs">this week</p>
                </div>
              )}
              <div className="hidden rounded-3xl border border-border/60 bg-card p-4 shadow-card transition-bounce hover:-translate-y-1 hover:shadow-elevated sm:p-5 lg:block">
                <p className="text-[10px] text-muted-foreground sm:text-xs">Avg/day</p>
                <p className="font-heading text-xl font-bold sm:text-2xl">
                  {currency.symbol}{Math.round(weekTotal / 7).toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground sm:text-xs">this week</p>
              </div>
              <div className="hidden rounded-3xl border border-border/60 bg-card p-4 shadow-card transition-bounce hover:-translate-y-1 hover:shadow-elevated sm:p-5 lg:block">
                <p className="text-[10px] text-muted-foreground sm:text-xs">Today's txns</p>
                <p className="font-heading text-xl font-bold sm:text-2xl">{todayExpenses.length}</p>
                <p className="text-[10px] text-muted-foreground sm:text-xs">recorded</p>
              </div>
            </div>

            {/* Two-column on desktop: chart + recent */}
            <div className="grid gap-4 lg:grid-cols-5 lg:gap-6">
              <div className="lg:col-span-3">
                <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-card sm:p-5">
                  <WeeklyChart data={weeklyData} currency={currency} onSelectDay={setDrawerDate} />
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-card sm:p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-heading text-base font-semibold">Today</h2>
                    <span className="text-xs text-muted-foreground">{todayExpenses.length} items</span>
                  </div>
                  <ExpenseList
                    expenses={todayExpenses}
                    currency={currency}
                    onDelete={removeExpense}
                    onEdit={openEdit}
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={openAdd}
              className="fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full bg-gradient-primary shadow-glow transition-bounce hover:scale-110 hover:shadow-elevated active:scale-95 sm:h-16 sm:w-16 lg:bottom-8 lg:right-8"
              size="icon"
              aria-label="Add expense"
            >
              <Plus className="h-6 w-6 sm:h-7 sm:w-7" />
            </Button>
          </div>
        )}

        {tab === "stats" && (
          <StatsPage
            allExpenses={expenses}
            currency={currency}
            onEdit={openEdit}
            onDelete={removeExpense}
          />
        )}

        {tab === "income" && (
          <IncomePage
            incomes={incomes}
            currency={currency}
            onAdd={addIncome}
            onUpdate={updateIncome}
            onDelete={removeIncome}
          />
        )}

        {tab === "dues" && (
          <DuesPage
            borrowings={borrowings}
            pendingBorrowings={pendingBorrowings}
            totalOwed={totalOwed}
            totalIOwe={totalIOwe}
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
            onSignOut={signOut}
          />
        )}
      </div>

      <AddExpenseSheet
        open={sheetOpen}
        onClose={closeSheet}
        onAdd={addExpense}
        onUpdate={updateExpense}
        currency={currency}
        editing={editingExpense}
      />

      <DayDetailDrawer
        open={drawerDate !== null}
        date={drawerDate}
        expenses={expenses}
        currency={currency}
        onClose={() => setDrawerDate(null)}
        onEdit={(exp) => { setDrawerDate(null); openEdit(exp); }}
      />

      <BottomNav active={tab} onNavigate={setTab} />
    </div>
  );
};

export default HomePage;
