import { Expense, Borrowing } from "./types";

const EXPENSES_KEY = "micro_expenses";
const CURRENCY_KEY = "micro_currency";
const BORROWINGS_KEY = "micro_borrowings";
const USERNAME_KEY = "micro_username";

export function getExpenses(): Expense[] {
  try {
    const data = localStorage.getItem(EXPENSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
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

export function getSavedCurrency(): string {
  return localStorage.getItem(CURRENCY_KEY) ?? "INR";
}

export function saveCurrency(code: string): void {
  localStorage.setItem(CURRENCY_KEY, code);
}

// Borrowings
export function getBorrowings(): Borrowing[] {
  try {
    const data = localStorage.getItem(BORROWINGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export function saveBorrowing(b: Borrowing): void {
  const list = getBorrowings();
  list.push(b);
  localStorage.setItem(BORROWINGS_KEY, JSON.stringify(list));
}

export function updateBorrowing(id: string, updates: Partial<Borrowing>): void {
  const list = getBorrowings().map(b => b.id === id ? { ...b, ...updates } : b);
  localStorage.setItem(BORROWINGS_KEY, JSON.stringify(list));
}

export function deleteBorrowing(id: string): void {
  const list = getBorrowings().filter(b => b.id !== id);
  localStorage.setItem(BORROWINGS_KEY, JSON.stringify(list));
}

// Username
export function getUsername(): string {
  return localStorage.getItem(USERNAME_KEY) ?? "";
}

export function saveUsername(name: string): void {
  localStorage.setItem(USERNAME_KEY, name);
}
