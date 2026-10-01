import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { differenceInDays } from 'date-fns';
import type { AppData, Alert } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'EUR') {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function generateAlerts(data: AppData): Alert[] {
  const today = new Date();
  const alerts: Alert[] = [];

  const trackedSpent = data.expenses
    .filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    })
    .reduce((acc, e) => acc + e.amount, 0);
  const recurringTotal = data.recurringExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalSpent = trackedSpent + recurringTotal;
  const budgetUsage = data.monthlyBudget > 0 ? (totalSpent / data.monthlyBudget) * 100 : 0;

  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  if (budgetUsage > 80) {
    alerts.push({
      id: `budget-warning-${monthKey}`,
      severity: budgetUsage > 90 ? 'danger' : 'warning',
      title: budgetUsage > 90 ? 'Budget almost depleted' : 'Budget watch',
      message: `You've used ${Math.round(budgetUsage)}% of your monthly budget this month.`,
    });
  }

  data.goals.forEach(g => {
    if (!g.deadline) return;
    const daysLeft = differenceInDays(new Date(g.deadline), today);
    if (daysLeft <= 0) return;
    const createdDays = Math.max(differenceInDays(today, new Date(g.createdAt)), 1);
    const totalDays = createdDays + daysLeft;
    const expectedProgress = g.targetAmount * (createdDays / totalDays);
    if (g.currentAmount < expectedProgress * 0.8) {
      alerts.push({
        id: `goal-risk-${g.id}-${monthKey}`,
        severity: 'warning',
        title: `"${g.name}" behind schedule`,
        message: `This goal is behind pace with ${daysLeft} day${daysLeft === 1 ? '' : 's'} left to the deadline.`,
        goalId: g.id,
      });
    }
  });

  return alerts;
}
