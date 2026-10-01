/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Priority = 'low' | 'mid' | 'high';

export const CURRENCIES = ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'] as const;
export type CurrencyCode = typeof CURRENCIES[number];

export type Category =
  | 'Food'
  | 'Bar / dinner'
  | 'Transport'
  | 'Subscriptions'
  | 'Free time / leisure'
  | 'Shopping'
  | 'Grocery'
  | 'Other';

export const CATEGORIES: Category[] = [
  'Bar / dinner',
  'Food',
  'Free time / leisure',
  'Transport',
  'Subscriptions',
  'Shopping',
  'Grocery',
  'Other',
];

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  priority: Priority;
  deadline?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  currency: string;
  note?: string;
  date: string;
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: Category;
  currency: string;
}

export interface AppData {
  goals: Goal[];
  expenses: Expense[];
  recurringExpenses: RecurringExpense[];
  monthlyBudget: number;
  preferredCurrency: string;
  userName: string;
  dismissedAlerts: Alert[];
}

/**
 * A/B experiment flag.
 * 'A' = deposit button on each goal card in the list (one-tap from list)
 * 'B' = deposit button only inside GoalDetail (current default — two-tap flow)
 * Change this value and save to switch between variants.
 */
export const DEPOSIT_BUTTON_VARIANT: 'A' | 'B' = 'A';

export type AlertSeverity = 'warning' | 'danger';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  goalId?: string;
}
