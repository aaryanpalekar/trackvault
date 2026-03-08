import { useState, useCallback, useMemo } from "react";
import { Expense, PaymentMethod } from "@/lib/types";
import { getExpenses, saveExpense, deleteExpense, getSavedCurrency, saveCurrency } from "@/lib/expense-store";
import { getCurrency } from "@/lib/currencies";

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>(getExpenses);
  const [currencyCode, setCurrencyCode] = useState(getSavedCurrency);

  const currency = useMemo(() => getCurrency(currencyCode), [currencyCode]);

  const addExpense = useCallback((amount: number, category: string, paymentMethod: PaymentMethod, note?: string) => {
    const expense: Expense = {
      id: crypto.randomUUID(),
      amount,
      category,
      paymentMethod,
      timestamp: Date.now(),
      note,
    };
    saveExpense(expense);
    setExpenses(getExpenses());
  }, []);

  const removeExpense = useCallback((id: string) => {
    deleteExpense(id);
    setExpenses(getExpenses());
  }, []);

  const changeCurrency = useCallback((code: string) => {
    saveCurrency(code);
    setCurrencyCode(code);
  }, []);

  const todayExpenses = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = today.getTime();
    return expenses.filter(e => e.timestamp >= start);
  }, [expenses]);

  const todayTotal = useMemo(() => todayExpenses.reduce((s, e) => s + e.amount, 0), [todayExpenses]);

  const weekExpenses = useMemo(() => {
    const now = new Date();
    const dow = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    start.setHours(0, 0, 0, 0);
    return expenses.filter(e => e.timestamp >= start.getTime());
  }, [expenses]);

  const weeklyData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const now = new Date();
    const dow = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    monday.setHours(0, 0, 0, 0);

    return days.map((name, i) => {
      const dayStart = new Date(monday);
      dayStart.setDate(monday.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);
      const total = weekExpenses
        .filter(e => e.timestamp >= dayStart.getTime() && e.timestamp < dayEnd.getTime())
        .reduce((s, e) => s + e.amount, 0);
      return { name, total, isToday: i === (dow === 0 ? 6 : dow - 1) };
    });
  }, [weekExpenses]);

  const weekTotal = useMemo(() => weekExpenses.reduce((s, e) => s + e.amount, 0), [weekExpenses]);

  return {
    expenses,
    currency,
    currencyCode,
    changeCurrency,
    addExpense,
    removeExpense,
    todayExpenses,
    todayTotal,
    weekExpenses,
    weeklyData,
    weekTotal,
  };
}
