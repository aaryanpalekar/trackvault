import { useState, useCallback, useMemo, useEffect } from "react";
import { Expense, Borrowing, PaymentMethod, BorrowingType, Income } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getCurrency } from "@/lib/currencies";

function rowToExpense(e: any): Expense {
  return {
    id: e.id,
    amount: Number(e.amount),
    category: e.category,
    paymentMethod: e.payment_method as PaymentMethod,
    timestamp: new Date(e.expense_date ?? e.created_at).getTime(),
    note: e.note ?? undefined,
    customName: e.custom_name ?? undefined,
  };
}

function rowToIncome(i: any): Income {
  return {
    id: i.id,
    amount: Number(i.amount),
    source: i.source,
    note: i.note ?? undefined,
    receivedOn: new Date(i.received_date ?? i.created_at).getTime(),
  };
}

export function useExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [currencyCode, setCurrencyCode] = useState("INR");
  const [username, setUsernameState] = useState("");
  const [loading, setLoading] = useState(true);

  const currency = useMemo(() => getCurrency(currencyCode), [currencyCode]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      supabase.from("expenses").select("*").order("expense_date", { ascending: false }),
      supabase.from("borrowings").select("*").order("created_at", { ascending: false }),
      supabase.from("user_preferences").select("*").single(),
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("incomes" as any).select("*").order("received_date", { ascending: false }),
    ]).then(([expRes, borRes, prefRes, profRes, incRes]) => {
      if (expRes.data) setExpenses(expRes.data.map(rowToExpense));
      if (borRes.data) {
        setBorrowings(borRes.data.map(b => ({
          id: b.id, personName: b.person_name, amount: Number(b.amount),
          reason: b.reason ?? undefined, borrowedOn: new Date(b.borrowed_on).getTime(),
          settled: b.settled, settledOn: b.settled_on ? new Date(b.settled_on).getTime() : undefined,
          type: ((b as any).type as BorrowingType) || "lent",
        })));
      }
      if (prefRes.data) setCurrencyCode(prefRes.data.currency_code);
      if (profRes.data) setUsernameState(profRes.data.display_name);
      if (incRes.data) setIncomes((incRes.data as any[]).map(rowToIncome));
      setLoading(false);
    });
  }, [user]);

  const addExpense = useCallback(async (
    amount: number,
    category: string,
    paymentMethod: PaymentMethod,
    note?: string,
    expenseDate?: Date,
    customName?: string,
  ) => {
    if (!user) return;
    const date = (expenseDate ?? new Date()).toISOString();
    const { data } = await supabase.from("expenses").insert({
      user_id: user.id,
      amount,
      category,
      payment_method: paymentMethod,
      note,
      expense_date: date,
      custom_name: customName,
    } as any).select().single();
    if (data) {
      setExpenses(prev => {
        const next = [rowToExpense(data), ...prev];
        next.sort((a, b) => b.timestamp - a.timestamp);
        return next;
      });
    }
  }, [user]);

  const updateExpense = useCallback(async (
    id: string,
    updates: { amount?: number; category?: string; paymentMethod?: PaymentMethod; note?: string; expenseDate?: Date; customName?: string },
  ) => {
    const payload: any = {};
    if (updates.amount !== undefined) payload.amount = updates.amount;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.paymentMethod !== undefined) payload.payment_method = updates.paymentMethod;
    if (updates.note !== undefined) payload.note = updates.note;
    if (updates.expenseDate !== undefined) payload.expense_date = updates.expenseDate.toISOString();
    if (updates.customName !== undefined) payload.custom_name = updates.customName;
    const { data } = await supabase.from("expenses").update(payload).eq("id", id).select().single();
    if (data) {
      setExpenses(prev => {
        const next = prev.map(e => e.id === id ? rowToExpense(data) : e);
        next.sort((a, b) => b.timestamp - a.timestamp);
        return next;
      });
    }
  }, []);

  const removeExpense = useCallback(async (id: string) => {
    await supabase.from("expenses").delete().eq("id", id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const changeCurrency = useCallback(async (code: string) => {
    if (!user) return;
    setCurrencyCode(code);
    await supabase.from("user_preferences").update({ currency_code: code }).eq("user_id", user.id);
  }, [user]);

  const setUsername = useCallback(async (name: string) => {
    if (!user) return;
    setUsernameState(name);
    await supabase.from("profiles").update({ display_name: name }).eq("user_id", user.id);
  }, [user]);

  const addBorrowing = useCallback(async (personName: string, amount: number, reason?: string, type: BorrowingType = "lent") => {
    if (!user) return;
    const { data } = await supabase.from("borrowings").insert({
      user_id: user.id, person_name: personName, amount, reason, type,
    } as any).select().single();
    if (data) {
      setBorrowings(prev => [{
        id: data.id, personName: data.person_name, amount: Number(data.amount),
        reason: data.reason ?? undefined, borrowedOn: new Date(data.borrowed_on).getTime(),
        settled: data.settled, settledOn: undefined,
        type: ((data as any).type as BorrowingType) || "lent",
      }, ...prev]);
    }
  }, [user]);

  const settleBorrowing = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    await supabase.from("borrowings").update({ settled: true, settled_on: now }).eq("id", id);
    setBorrowings(prev => prev.map(b => b.id === id ? { ...b, settled: true, settledOn: Date.now() } : b));
  }, []);

  const removeBorrowing = useCallback(async (id: string) => {
    await supabase.from("borrowings").delete().eq("id", id);
    setBorrowings(prev => prev.filter(b => b.id !== id));
  }, []);

  const todayExpenses = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = today.getTime() + 24 * 60 * 60 * 1000;
    return expenses.filter(e => e.timestamp >= today.getTime() && e.timestamp < tomorrow);
  }, [expenses]);

  const todayTotal = useMemo(() => todayExpenses.reduce((s, e) => s + e.amount, 0), [todayExpenses]);

  const weekExpenses = useMemo(() => {
    const now = new Date();
    const dow = now.getDay(); // 0 = Sunday
    const start = new Date(now);
    start.setDate(now.getDate() - dow);
    start.setHours(0, 0, 0, 0);
    return expenses.filter(e => e.timestamp >= start.getTime());
  }, [expenses]);

  const weeklyData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const dow = now.getDay();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - dow);
    sunday.setHours(0, 0, 0, 0);
    return days.map((name, i) => {
      const dayStart = new Date(sunday); dayStart.setDate(sunday.getDate() + i);
      const dayEnd = new Date(dayStart); dayEnd.setDate(dayStart.getDate() + 1);
      const dayExpenses = weekExpenses.filter(
        e => e.timestamp >= dayStart.getTime() && e.timestamp < dayEnd.getTime()
      );
      const total = dayExpenses.reduce((s, e) => s + e.amount, 0);
      return {
        name,
        total,
        isToday: i === dow,
        date: dayStart,
        count: dayExpenses.length,
      };
    });
  }, [weekExpenses]);

  const weekTotal = useMemo(() => weekExpenses.reduce((s, e) => s + e.amount, 0), [weekExpenses]);

  const pendingBorrowings = useMemo(() => borrowings.filter(b => !b.settled), [borrowings]);
  const totalOwed = useMemo(() => pendingBorrowings.filter(b => b.type === "lent").reduce((s, b) => s + b.amount, 0), [pendingBorrowings]);
  const totalIOwe = useMemo(() => pendingBorrowings.filter(b => b.type === "owed").reduce((s, b) => s + b.amount, 0), [pendingBorrowings]);

  // ---- Incomes ----
  const addIncome = useCallback(async (amount: number, source: string, note?: string, receivedDate?: Date) => {
    if (!user) return;
    const date = (receivedDate ?? new Date()).toISOString();
    const { data } = await supabase.from("incomes" as any).insert({
      user_id: user.id, amount, source, note, received_date: date,
    } as any).select().single();
    if (data) {
      setIncomes(prev => {
        const next = [rowToIncome(data), ...prev];
        next.sort((a, b) => b.receivedOn - a.receivedOn);
        return next;
      });
    }
  }, [user]);

  const updateIncome = useCallback(async (
    id: string,
    updates: { amount?: number; source?: string; note?: string; receivedDate?: Date },
  ) => {
    const payload: any = {};
    if (updates.amount !== undefined) payload.amount = updates.amount;
    if (updates.source !== undefined) payload.source = updates.source;
    if (updates.note !== undefined) payload.note = updates.note;
    if (updates.receivedDate !== undefined) payload.received_date = updates.receivedDate.toISOString();
    const { data } = await supabase.from("incomes" as any).update(payload).eq("id", id).select().single();
    if (data) {
      setIncomes(prev => {
        const next = prev.map(i => i.id === id ? rowToIncome(data) : i);
        next.sort((a, b) => b.receivedOn - a.receivedOn);
        return next;
      });
    }
  }, []);

  const removeIncome = useCallback(async (id: string) => {
    await supabase.from("incomes" as any).delete().eq("id", id);
    setIncomes(prev => prev.filter(i => i.id !== id));
  }, []);

  const totalReceived = useMemo(() => incomes.reduce((s, i) => s + i.amount, 0), [incomes]);

  return {
    loading, expenses, currency, currencyCode, changeCurrency,
    addExpense, updateExpense, removeExpense,
    todayExpenses, todayTotal,
    weekExpenses, weeklyData, weekTotal,
    username, setUsername,
    borrowings, addBorrowing, settleBorrowing, removeBorrowing,
    pendingBorrowings, totalOwed, totalIOwe,
    incomes, addIncome, updateIncome, removeIncome, totalReceived,
  };
}
