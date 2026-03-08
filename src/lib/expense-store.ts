import { Expense } from "./types";

const EXPENSES_KEY = "micro_expenses";
const CURRENCY_KEY = "micro_currency";

export function getExpenses(): Expense[] {
  try {
    const data = localStorage.getItem(EXPENSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveExpense(expense: Expense): void {
  const expenses = getExpenses();
  expenses.push(expense);
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

export function deleteExpense(id: string): void {
  const expenses = getExpenses().filter(e => e.id !== id);
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

export function getTodayExpenses(): Expense[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfDay = today.getTime();
  return getExpenses().filter(e => e.timestamp >= startOfDay);
}

export function getWeekExpenses(): Expense[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  startOfWeek.setHours(0, 0, 0, 0);
  return getExpenses().filter(e => e.timestamp >= startOfWeek.getTime());
}

export function getSavedCurrency(): string {
  return localStorage.getItem(CURRENCY_KEY) ?? "INR";
}

export function saveCurrency(code: string): void {
  localStorage.setItem(CURRENCY_KEY, code);
}
