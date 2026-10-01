import { useState, useEffect } from 'react';
import { AppData, Goal, Expense, RecurringExpense, Alert } from '../types';

const STORAGE_KEY = 'mypiggybank_data';

const DEFAULT_DATA: AppData = {
  goals: [],
  expenses: [],
  recurringExpenses: [],
  monthlyBudget: 800,
  preferredCurrency: 'EUR',
  userName: '',
  dismissedAlerts: [],
};

export function useStorage() {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrate old data that may be missing new fields
        return { ...DEFAULT_DATA, ...parsed };
      } catch {
        return DEFAULT_DATA;
      }
    }
    return DEFAULT_DATA;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const addGoal = (goal: Omit<Goal, 'id' | 'createdAt' | 'currentAmount'>) => {
    const newGoal: Goal = {
      ...goal,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      currentAmount: 0,
    };
    setData(prev => ({ ...prev, goals: [...prev.goals, newGoal] }));
  };

  const addExpense = (expense: Omit<Expense, 'id' | 'date'>) => {
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };
    setData(prev => ({ ...prev, expenses: [newExpense, ...prev.expenses] }));
  };

  const depositToGoal = (goalId: string, amount: number) => {
    setData(prev => ({
      ...prev,
      goals: prev.goals.map(g =>
        g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g
      ),
    }));
  };

  const updateGoal = (id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt' | 'currentAmount'>>) => {
    setData(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === id ? { ...g, ...updates } : g),
    }));
  };

  const updateExpense = (id: string, updates: Omit<Expense, 'id' | 'date'>) => {
    setData(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => e.id === id ? { ...e, ...updates } : e),
    }));
  };

  const deleteExpense = (id: string) => {
    setData(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
  };

  const deleteGoal = (id: string) => {
    setData(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
  };

  const setMonthlyBudget = (amount: number) => {
    setData(prev => ({ ...prev, monthlyBudget: amount }));
  };

  const setPreferredCurrency = (currency: string) => {
    setData(prev => ({ ...prev, preferredCurrency: currency }));
  };

  const setUserName = (name: string) => {
    setData(prev => ({ ...prev, userName: name }));
  };

  const addRecurringExpense = (expense: Omit<RecurringExpense, 'id'>) => {
    const newExpense: RecurringExpense = {
      ...expense,
      id: crypto.randomUUID(),
    };
    setData(prev => ({ ...prev, recurringExpenses: [...prev.recurringExpenses, newExpense] }));
  };

  const updateRecurringExpense = (id: string, updates: Omit<RecurringExpense, 'id'>) => {
    setData(prev => ({
      ...prev,
      recurringExpenses: prev.recurringExpenses.map(e => e.id === id ? { ...e, ...updates } : e),
    }));
  };

  const removeRecurringExpense = (id: string) => {
    setData(prev => ({
      ...prev,
      recurringExpenses: prev.recurringExpenses.filter(e => e.id !== id),
    }));
  };

  const dismissAlert = (alert: Alert) => {
    setData(prev => ({
      ...prev,
      dismissedAlerts: prev.dismissedAlerts.some(d => d.id === alert.id)
        ? prev.dismissedAlerts
        : [...prev.dismissedAlerts, alert],
    }));
  };

  return {
    data,
    addGoal,
    updateGoal,
    addExpense,
    updateExpense,
    deleteExpense,
    depositToGoal,
    deleteGoal,
    setMonthlyBudget,
    setPreferredCurrency,
    setUserName,
    addRecurringExpense,
    updateRecurringExpense,
    removeRecurringExpense,
    dismissAlert,
  };
}
