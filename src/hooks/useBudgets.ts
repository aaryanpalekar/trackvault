import { useCallback, useEffect, useState } from "react";

const OVERALL_KEY = "tv_overall_budget_v1";
const CATEGORY_KEY = "tv_category_budgets_v1";

export interface Budgets {
  overall: number | null;
  categories: Record<string, number>;
}

function read(): Budgets {
  try {
    const overallRaw = localStorage.getItem(OVERALL_KEY);
    const catsRaw = localStorage.getItem(CATEGORY_KEY);
    return {
      overall: overallRaw ? Number(overallRaw) : null,
      categories: catsRaw ? JSON.parse(catsRaw) : {},
    };
  } catch {
    return { overall: null, categories: {} };
  }
}

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budgets>(() => read());

  // Cross-tab / cross-component sync
  useEffect(() => {
    const handler = () => setBudgets(read());
    window.addEventListener("storage", handler);
    window.addEventListener("tv-budgets-changed", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("tv-budgets-changed", handler);
    };
  }, []);

  const emit = () => window.dispatchEvent(new Event("tv-budgets-changed"));

  const setOverall = useCallback((amount: number | null) => {
    if (amount == null || amount <= 0) {
      localStorage.removeItem(OVERALL_KEY);
    } else {
      localStorage.setItem(OVERALL_KEY, String(amount));
    }
    setBudgets(prev => ({ ...prev, overall: amount && amount > 0 ? amount : null }));
    emit();
  }, []);

  const setCategoryBudget = useCallback((cat: string, amount: number | null) => {
    setBudgets(prev => {
      const next = { ...prev.categories };
      if (amount == null || amount <= 0) delete next[cat];
      else next[cat] = amount;
      localStorage.setItem(CATEGORY_KEY, JSON.stringify(next));
      emit();
      return { ...prev, categories: next };
    });
  }, []);

  return { budgets, setOverall, setCategoryBudget };
}
