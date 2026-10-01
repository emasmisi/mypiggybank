import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Expense, RecurringExpense } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  addMonths,
  addDays,
  isWithinInterval,
  isSameDay,
} from 'date-fns';

// ── STN states ──────────────────────────────────────────────────────────────
type ReportsTab = 'monthly' | 'weekly' | 'categories';

type DrillDown =
  | { type: 'expense'; item: Expense }
  | { type: 'category'; name: string; items: Expense[] }
  | null;

interface StatsViewProps {
  expenses: Expense[];
  monthlyBudget: number;
  recurringExpenses: RecurringExpense[];
  preferredCurrency: string;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export default function StatsView({ expenses, monthlyBudget, recurringExpenses, preferredCurrency, onEditExpense, onDeleteExpense }: StatsViewProps) {
  // Reports Hub defaults to Monthly (most requested feature, FR3)
  const [tab, setTab] = useState<ReportsTab>('monthly');
  // Self-loop state for period navigation (swipe left/right = prev/next)
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  // Drill-down state — null = hub/summary view, non-null = Expense Detail
  const [drillDown, setDrillDown] = useState<DrillDown>(null);
  // Swipe detection
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const today = new Date();

  // ── Period windows ──────────────────────────────────────────────────────
  const weekStart = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 });
  const weekEnd   = endOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 });
  const monthRef  = addMonths(today, monthOffset);
  const monthStart = startOfMonth(monthRef);
  const monthEnd   = endOfMonth(monthRef);

  const weekExpenses  = expenses.filter(e => isWithinInterval(parseISO(e.date), { start: weekStart, end: weekEnd }));
  const monthExpenses = expenses.filter(e => isWithinInterval(parseISO(e.date), { start: monthStart, end: monthEnd }));
  const recurringTotal = recurringExpenses.reduce((s, e) => s + e.amount, 0);
  // Recurring counts toward budget only for the current month
  const monthSpent = monthExpenses.reduce((s, e) => s + e.amount, 0) + (monthOffset === 0 ? recurringTotal : 0);

  // ── Swipe gesture handlers (self-loops on Weekly / Monthly states) ───────
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd   = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const delta = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 48) {
      const dir = delta > 0 ? -1 : 1; // swipe left → go back in time (-1), right → forward (+1)
      if (tab === 'weekly')  setWeekOffset(o => Math.min(o + dir, 0));
      if (tab === 'monthly') setMonthOffset(o => Math.min(o + dir, 0));
    }
    setTouchStart(null);
  };

  // ── Expense Detail state ─────────────────────────────────────────────────
  if (drillDown?.type === 'expense') {
    const e = drillDown.item;
    return (
      <ExpenseDetailView
        expense={e}
        onBack={() => setDrillDown(null)}
        onEdit={() => { onEditExpense(e); setDrillDown(null); }}
        onDelete={(id) => { onDeleteExpense(id); setDrillDown(null); }}
      />
    );
  }

  // ── Expense Detail state (category filtered list) ─────────────────────────
  if (drillDown?.type === 'category') {
    const total = drillDown.items.reduce((s, e) => s + e.amount, 0);
    return (
      <div className="space-y-4 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setDrillDown(null)}
            className="flex items-center gap-1 text-blue-600 font-bold text-sm"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h2 className="text-sm font-bold text-slate-900">{drillDown.name}</h2>
          <div className="w-16" />
        </div>

        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {drillDown.items.length} expense{drillDown.items.length !== 1 ? 's' : ''} · {format(monthStart, 'MMM yyyy')}
        </p>

        {drillDown.items.length === 0 ? (
          <div className="p-10 border border-dashed border-slate-200 rounded-xl text-center">
            <p className="text-[11px] text-slate-400">No expenses in this category.</p>
          </div>
        ) : (
          <div className="space-y-1.5 pb-12">
            {drillDown.items.map(expense => (
              <div
                key={expense.id}
                className="bg-white border border-slate-100 rounded-xl px-4 py-3 flex justify-between items-center shadow-sm"
              >
                <div>
                  {expense.note && (
                    <p className="text-[11px] font-medium text-slate-700">{expense.note}</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {format(parseISO(expense.date), 'd MMM yyyy · HH:mm')}
                  </p>
                </div>
                <p className="text-sm font-black text-slate-900">
                  -{formatCurrency(expense.amount, expense.currency)}
                </p>
              </div>
            ))}
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total</span>
              <span className="text-sm font-black text-slate-900">
                -{formatCurrency(total, preferredCurrency)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Reports Hub + sub-views ───────────────────────────────────────────────
  return (
    <div
      className="space-y-4 py-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <h2 className="text-xl font-black text-slate-900">Reports</h2>

      {/* Reports Hub — tab bar (3 sub-STN entry points) */}
      <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
        {(['monthly', 'weekly', 'categories'] as ReportsTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2 rounded-lg text-xs font-bold transition-all',
              tab === t
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {t === 'monthly' ? 'Monthly' : t === 'weekly' ? 'Weekly' : 'Categories'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── Monthly Summary ─────────────────────────────────────── */}
        {tab === 'monthly' && (
          <motion.div
            key="monthly"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.15 }}
            className="space-y-4 pb-12"
          >
            <PeriodNav
              label={format(monthStart, 'MMMM yyyy')}
              onPrev={() => setMonthOffset(o => o - 1)}
              onNext={() => setMonthOffset(o => Math.min(o + 1, 0))}
              nextDisabled={monthOffset >= 0}
            />

            <BudgetCard spent={monthSpent} budget={monthlyBudget} currency={preferredCurrency} />

            <section className="space-y-1.5">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Expenses ({monthExpenses.length})
              </h3>
              {monthExpenses.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center">
                  <p className="text-[11px] text-slate-400 italic">
                    No expenses recorded in {format(monthStart, 'MMMM')}.
                  </p>
                </div>
              ) : (
                monthExpenses.map(expense => (
                  <button
                    key={expense.id}
                    onClick={() => setDrillDown({ type: 'expense', item: expense })}
                    className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm hover:bg-blue-50/40 hover:border-blue-100 active:scale-[0.99] transition-all text-left"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">{expense.category}</p>
                      {expense.note && (
                        <p className="text-[10px] text-slate-500">{expense.note}</p>
                      )}
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        {format(parseISO(expense.date), 'd MMM · HH:mm')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <p className="text-sm font-black text-slate-900">
                        -{formatCurrency(expense.amount, expense.currency)}
                      </p>
                      <ChevronRight size={14} className="text-slate-300" />
                    </div>
                  </button>
                ))
              )}
            </section>
          </motion.div>
        )}

        {/* ── Weekly Summary ──────────────────────────────────────── */}
        {tab === 'weekly' && (
          <motion.div
            key="weekly"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.15 }}
            className="space-y-4 pb-12"
          >
            <PeriodNav
              label={`${format(weekStart, 'd MMM')} – ${format(weekEnd, 'd MMM yyyy')}`}
              onPrev={() => setWeekOffset(o => o - 1)}
              onNext={() => setWeekOffset(o => Math.min(o + 1, 0))}
              nextDisabled={weekOffset >= 0}
            />

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-center space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total this week</p>
              <p className="text-3xl font-black text-slate-900">
                {formatCurrency(weekExpenses.reduce((s, e) => s + e.amount, 0), preferredCurrency)}
              </p>
              <p className="text-[11px] text-slate-400">
                avg {formatCurrency(weekExpenses.reduce((s, e) => s + e.amount, 0) / 7, preferredCurrency)}/day
              </p>
            </div>

            <DayBreakdown
              weekStart={weekStart}
              expenses={weekExpenses}
              currency={preferredCurrency}
              onSelectExpense={e => setDrillDown({ type: 'expense', item: e })}
            />
          </motion.div>
        )}

        {/* ── Category Breakdown ──────────────────────────────────── */}
        {tab === 'categories' && (
          <motion.div
            key="categories"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.15 }}
            className="space-y-3 pb-12"
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {format(monthStart, 'MMMM yyyy')} · tap a category to see details
            </p>
            <CategoryBreakdown
              expenses={monthExpenses}
              currency={preferredCurrency}
              onSelect={(name, items) => setDrillDown({ type: 'category', name, items })}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

// ── Expense Detail view with Edit / Delete ────────────────────────────────────

function ExpenseDetailView({ expense: e, onBack, onEdit, onDelete }: {
  expense: Expense;
  onBack: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
}) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  return (
    <div className="space-y-5 py-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-blue-600 font-bold text-sm"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h2 className="text-sm font-bold text-slate-900">Expense Detail</h2>
        <div className="w-16" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="text-center">
          <p className="text-3xl font-black text-slate-900">
            -{formatCurrency(e.amount, e.currency)}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {format(parseISO(e.date), 'EEEE, d MMMM yyyy · HH:mm')}
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          <div className="flex justify-between items-center py-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</span>
            <span className="text-sm font-bold text-slate-800">{e.category}</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Currency</span>
            <span className="text-sm font-bold text-slate-800">{e.currency}</span>
          </div>
          {e.note && (
            <div className="flex justify-between items-center py-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Note</span>
              <span className="text-sm font-medium text-slate-700 max-w-[55%] text-right">{e.note}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
        >
          <Pencil size={14} />
          Edit
        </button>
        <button
          onClick={() => setShowConfirmDelete(true)}
          className="flex-1 py-3 bg-white border border-red-100 rounded-xl font-bold text-sm text-red-500 flex items-center justify-center gap-2 hover:bg-red-50 transition-all"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>

      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-6"
            onClick={() => setShowConfirmDelete(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              onClick={ev => ev.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <Trash2 size={16} className="text-red-500" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Delete expense?</h3>
              </div>
              <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onDelete(e.id)}
                  className="flex-1 py-2.5 bg-red-500 rounded-xl text-sm font-bold text-white hover:bg-red-600 active:scale-[0.98] transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Helper components ────────────────────────────────────────────────────────

function PeriodNav({
  label, onPrev, onNext, nextDisabled,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  nextDisabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={onPrev}
        className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-slate-50 active:scale-[0.95] transition-all"
      >
        <ChevronLeft size={16} className="text-slate-600" />
      </button>
      <span className="text-sm font-bold text-slate-900">{label}</span>
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-slate-50 active:scale-[0.95] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={16} className="text-slate-600" />
      </button>
    </div>
  );
}

function BudgetCard({ spent, budget, currency }: { spent: number; budget: number; currency: string }) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const remaining = budget - spent;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black text-slate-900">{formatCurrency(spent, currency)}</span>
        {budget > 0 && (
          <span className="text-sm text-slate-400 font-medium">/ {formatCurrency(budget, currency)}</span>
        )}
      </div>
      {budget > 0 && (
        <>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={cn('h-full rounded-full', pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-400' : 'bg-blue-500')}
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold">
            <span className="text-slate-400">{Math.round(pct)}% used</span>
            <span className={remaining >= 0 ? 'text-green-600' : 'text-red-500'}>
              {remaining >= 0
                ? `${formatCurrency(remaining, currency)} left`
                : 'Over budget!'}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function DayBreakdown({ weekStart, expenses, currency, onSelectExpense }: {
  weekStart: Date;
  expenses: Expense[];
  currency: string;
  onSelectExpense: (e: Expense) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayTotals = days.map(d =>
    expenses.filter(e => isSameDay(parseISO(e.date), d)).reduce((s, e) => s + e.amount, 0)
  );
  const maxTotal = Math.max(...dayTotals, 1);
  const today = new Date();

  return (
    <div className="space-y-3">
      {days.map((day, i) => {
        const dayExpenses = expenses.filter(e => isSameDay(parseISO(e.date), day));
        const total = dayTotals[i];
        const pct = (total / maxTotal) * 100;
        const isToday = isSameDay(day, today);
        const isFuture = day > today;

        return (
          <div key={day.toISOString()}>
            <div className="flex items-center gap-3 mb-1">
              <span className={cn(
                'text-[11px] font-bold w-7 shrink-0',
                isToday ? 'text-blue-600' : isFuture ? 'text-slate-300' : 'text-slate-500'
              )}>
                {format(day, 'EEE')}
              </span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                {!isFuture && (
                  <div
                    className={cn('h-full rounded-full', isToday ? 'bg-blue-500' : 'bg-slate-400')}
                    style={{ width: `${pct}%` }}
                  />
                )}
              </div>
              <span className={cn('text-[11px] font-bold w-16 text-right shrink-0', isFuture ? 'text-slate-200' : 'text-slate-700')}>
                {!isFuture && total > 0 ? formatCurrency(total, currency) : '—'}
              </span>
            </div>
            {dayExpenses.map(e => (
              <button
                key={e.id}
                onClick={() => onSelectExpense(e)}
                className="w-full ml-10 text-left text-[10px] text-slate-500 hover:text-blue-600 flex justify-between items-center py-0.5 pr-1"
              >
                <span>{e.category}{e.note ? ` · ${e.note}` : ''}</span>
                <span className="font-bold ml-2 shrink-0">{formatCurrency(e.amount, e.currency)}</span>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function CategoryBreakdown({ expenses, currency, onSelect }: {
  expenses: Expense[];
  currency: string;
  onSelect: (name: string, items: Expense[]) => void;
}) {
  const totals = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});
  const sorted = Object.entries(totals).sort(([, a], [, b]) => b - a);
  const grandTotal = sorted.reduce((s, [, v]) => s + v, 0);

  if (sorted.length === 0) {
    return (
      <div className="p-10 border border-dashed border-slate-200 rounded-xl text-center">
        <p className="text-[11px] text-slate-400 italic">No expenses this month.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
      {sorted.map(([cat, amount]) => {
        const pct = grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0;
        const catExpenses = expenses.filter(e => e.category === cat);
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat, catExpenses)}
            className="w-full px-4 py-3.5 text-left hover:bg-blue-50/40 active:bg-blue-50 transition-colors"
          >
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm font-bold text-slate-800">{cat}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-medium">{pct}%</span>
                <span className="text-sm font-black text-slate-900">{formatCurrency(amount, currency)}</span>
                <ChevronRight size={13} className="text-slate-300" />
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
            </div>
          </button>
        );
      })}
      <div className="flex justify-between items-center px-4 py-3 bg-slate-50">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total</span>
        <span className="text-sm font-black text-slate-900">{formatCurrency(grandTotal, currency)}</span>
      </div>
    </div>
  );
}
