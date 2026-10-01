import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  PlusCircle,
  Trash2,
  History,
  Bell,
  AlertCircle,
} from 'lucide-react';
import { Goal, Expense, RecurringExpense } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import DepositModal from './DepositModal';
import {
  differenceInDays,
  format,
  isThisWeek,
  isThisMonth,
  parseISO,
  startOfWeek,
  endOfWeek,
  subWeeks,
} from 'date-fns';

interface GoalDetailProps {
  goal: Goal;
  expenses: Expense[];
  monthlyBudget: number;
  recurringExpenses: RecurringExpense[];
  onDeposit: (amount: number) => void;
  onDelete: () => void;
  onEdit: () => void;
  onAddExpense: () => void;
}

type SubView = 'main' | 'history' | 'alerts';

export default function GoalDetail({
  goal,
  expenses,
  monthlyBudget,
  recurringExpenses,
  onDeposit,
  onDelete,
  onEdit,
}: GoalDetailProps) {
  const [subView, setSubView] = useState<SubView>('main');
  const [showDeposit, setShowDeposit] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const today = new Date();
  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const daysLeft = goal.deadline ? differenceInDays(new Date(goal.deadline), today) : null;

  // Estimated completion based on daily savings rate
  const createdDays = Math.max(differenceInDays(today, new Date(goal.createdAt)), 1);
  const dailyRate = goal.currentAmount / createdDays;
  const amountLeft = goal.targetAmount - goal.currentAmount;
  const estimatedDaysLeft = dailyRate > 0 ? Math.ceil(amountLeft / dailyRate) : null;
  const estimatedDate =
    estimatedDaysLeft !== null
      ? new Date(today.getTime() + estimatedDaysLeft * 86_400_000)
      : null;

  // Pace check
  let isBehindPace = false;
  if (goal.deadline && daysLeft !== null && daysLeft > 0) {
    const totalDays = createdDays + daysLeft;
    const expectedNow = goal.targetAmount * (createdDays / totalDays);
    isBehindPace = goal.currentAmount < expectedNow * 0.8;
  }

  // Dining / leisure spending this week vs last week
  const thisWeekExpenses = expenses.filter(e => isThisWeek(parseISO(e.date)));
  const lastWeekStart = startOfWeek(subWeeks(today, 1));
  const lastWeekEnd = endOfWeek(subWeeks(today, 1));
  const lastWeekExpenses = expenses.filter(e => {
    const d = parseISO(e.date);
    return d >= lastWeekStart && d <= lastWeekEnd;
  });

  const socialCategories = ['Bar / dinner', 'Free time / leisure'] as const;
  const thisWeekSocial = thisWeekExpenses
    .filter(e => socialCategories.includes(e.category as any))
    .reduce((s, e) => s + e.amount, 0);
  const lastWeekSocial = lastWeekExpenses
    .filter(e => socialCategories.includes(e.category as any))
    .reduce((s, e) => s + e.amount, 0);
  const diningAlert = lastWeekSocial > 0 && thisWeekSocial > lastWeekSocial * 1.5;

  // Budget usage this month
  const monthlyTracked = expenses
    .filter(e => isThisMonth(parseISO(e.date)))
    .reduce((s, e) => s + e.amount, 0);
  const recurringTotal = recurringExpenses.reduce((s, e) => s + e.amount, 0);
  const monthlyUsagePct =
    monthlyBudget > 0
      ? Math.round(((monthlyTracked + recurringTotal) / monthlyBudget) * 100)
      : 0;

  // Recent expenses (this month)
  const recentExpenses = expenses
    .filter(e => isThisMonth(parseISO(e.date)))
    .slice(0, 8);

  // ── Sub-view: Expense History (S2) ─────────────────────────────────────────
  if (subView === 'history') {
    const grouped = groupByDay(expenses);
    return (
      <div className="space-y-4 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900">History</h2>
          <button
            onClick={() => setSubView('main')}
            className="text-blue-600 text-sm font-bold"
          >
            ← Back
          </button>
        </div>

        {expenses.length === 0 ? (
          <div className="p-10 border border-dashed border-slate-200 rounded-xl text-center">
            <p className="text-[11px] text-slate-400 font-medium">No expenses logged yet.</p>
          </div>
        ) : (
          <div className="space-y-4 pb-12">
            {grouped.map(({ label, items }) => (
              <div key={label}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  {label}
                </p>
                <div className="space-y-1.5">
                  {items.map(expense => (
                    <div
                      key={expense.id}
                      className="bg-white border border-slate-100 rounded-xl p-3 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-[12px] font-bold text-slate-800">
                          {expense.category}
                        </p>
                        {expense.note && (
                          <p className="text-[10px] text-slate-500 mt-0.5">{expense.note}</p>
                        )}
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          {format(parseISO(expense.date), 'HH:mm')}
                        </p>
                      </div>
                      <p className="text-[13px] font-black text-slate-900">
                        -{formatCurrency(expense.amount, expense.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Sub-view: Alerts (S3) ──────────────────────────────────────────────────
  if (subView === 'alerts') {
    return (
      <div className="space-y-4 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900">Alerts</h2>
          <button
            onClick={() => setSubView('main')}
            className="text-blue-600 text-sm font-bold"
          >
            ← Back
          </button>
        </div>

        <div className="space-y-3">
          {isBehindPace && (
            <AlertCard
              color="amber"
              icon={<AlertTriangle size={16} />}
              title={`"${goal.name}" goal at risk`}
              body={`Current savings pace is behind schedule. You need to save more to reach your deadline on ${format(new Date(goal.deadline!), 'd MMM yyyy')}.`}
            />
          )}

          {diningAlert && (
            <AlertCard
              color="amber"
              icon={<TrendingDown size={16} />}
              title="Spending spike"
              body={`${formatCurrency(thisWeekSocial, goal.currency)} on dining and leisure this week — that's significantly more than last week (${formatCurrency(lastWeekSocial, goal.currency)}).`}
            />
          )}

          {monthlyUsagePct > 80 && (
            <AlertCard
              color="red"
              icon={<AlertCircle size={16} />}
              title="Budget watch"
              body={`${monthlyUsagePct}% of your monthly budget has already been spent.`}
            />
          )}

          {!isBehindPace && progress > 0 && (
            <AlertCard
              color="green"
              icon={<CheckCircle size={16} />}
              title={`"${goal.name}" on track`}
              body={
                estimatedDate
                  ? `Keep it up — estimated completion by ${format(estimatedDate, 'd MMM yyyy')}.`
                  : 'Keep saving to reach your goal.'
              }
            />
          )}

          {!isBehindPace && !diningAlert && monthlyUsagePct <= 80 && progress === 0 && (
            <div className="p-6 text-center text-[11px] text-slate-400 font-medium">
              No alerts right now. Keep going!
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Main Goal Detail (S1) ──────────────────────────────────────────────────
  return (
    <div className="space-y-5 py-4">
      {/* Progress Card */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="text-center">
          <p className="text-3xl font-black text-slate-900">
            {formatCurrency(goal.currentAmount, goal.currency)}
          </p>
          <p className="text-sm text-slate-400 font-medium mt-0.5">
            of {formatCurrency(goal.targetAmount, goal.currency)}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-500">
            <span>{Math.round(progress)}%</span>
            <div className="flex gap-3">
              {estimatedDate && (
                <span>est. {format(estimatedDate, 'd MMM yyyy')}</span>
              )}
              {goal.deadline && daysLeft !== null && daysLeft > 0 && (
                <span className="text-slate-400 font-medium">
                  deadline: {format(new Date(goal.deadline), 'd MMM')}
                </span>
              )}
            </div>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={cn(
                'h-full rounded-full',
                goal.priority === 'high'
                  ? 'bg-red-500'
                  : goal.priority === 'mid'
                  ? 'bg-yellow-400'
                  : 'bg-green-500'
              )}
            />
          </div>
        </div>

        {/* Add savings button */}
        <button
          onClick={() => setShowDeposit(true)}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 active:scale-[0.98]"
        >
          <PlusCircle size={16} />
          Add savings
        </button>
      </section>

      {/* Pace / spending alerts */}
      {isBehindPace && (
        <AlertCard
          color="amber"
          icon={<AlertTriangle size={16} />}
          title="Pace slowing"
          body="Recent spending is making it harder to reach your goal by the deadline."
        />
      )}
      {diningAlert && (
        <AlertCard
          color="amber"
          icon={<TrendingDown size={16} />}
          title="Spending spike"
          body={`${formatCurrency(thisWeekSocial, goal.currency)} on dining/leisure this week — that's more than last week. This may erode your savings.`}
        />
      )}
      {!isBehindPace && progress > 0 && goal.deadline && (
        <AlertCard
          color="green"
          icon={<CheckCircle size={16} />}
          title="On track"
          body="Keep it up — you're on pace for your deadline."
        />
      )}

      {/* Navigation buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setSubView('history')}
          className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
        >
          <History size={16} />
          History
        </button>
        <button
          onClick={() => setSubView('alerts')}
          className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
        >
          <Bell size={16} />
          Alerts
        </button>
        <button
          onClick={onEdit}
          className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
        >
          Edit
        </button>
      </div>

      {/* Recent expenses preview */}
      <section className="space-y-2">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Recent expenses
        </h3>
        {recentExpenses.length === 0 ? (
          <p className="text-[11px] text-slate-400 italic px-0.5">
            No expenses logged yet this month.
          </p>
        ) : (
          <div className="space-y-1.5">
            {recentExpenses.map(expense => (
              <div
                key={expense.id}
                className="bg-white border border-slate-100 rounded-xl p-3 flex justify-between items-center"
              >
                <div>
                  <p className="text-[12px] font-bold text-slate-800">{expense.category}</p>
                  {expense.note && (
                    <p className="text-[10px] text-slate-500">{expense.note}</p>
                  )}
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    {format(parseISO(expense.date), 'd MMM · HH:mm')}
                  </p>
                </div>
                <p className="text-[13px] font-black text-slate-900">
                  -{formatCurrency(expense.amount, expense.currency)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Delete goal — routes through Confirm Delete guard (STN safety state) */}
      <button
        onClick={() => setShowConfirmDelete(true)}
        className="w-full py-2.5 text-red-500 border border-red-100 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-all"
      >
        <Trash2 size={14} />
        Delete goal
      </button>

      {/* Confirm Delete dialog — guards against accidental deletion (STN dangerous state) */}
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
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <Trash2 size={16} className="text-red-500" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Delete "{goal.name}"?</h3>
              </div>
              <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                This action cannot be undone. Your savings progress will be permanently lost.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={onDelete}
                  className="flex-1 py-2.5 bg-red-500 rounded-xl text-sm font-bold text-white hover:bg-red-600 active:scale-[0.98] transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Deposit modal — shared DepositModal component */}
      <AnimatePresence>
        {showDeposit && (
          <DepositModal
            goalName={goal.name}
            goalCurrency={goal.currency}
            onClose={() => setShowDeposit(false)}
            onSave={(amount) => { onDeposit(amount); setShowDeposit(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function AlertCard({
  color,
  icon,
  title,
  body,
}: {
  color: 'amber' | 'red' | 'green';
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  const styles = {
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    red: 'bg-red-50 border-red-100 text-red-700',
    green: 'bg-green-50 border-green-100 text-green-700',
  };
  return (
    <section className={cn('p-3.5 border rounded-xl flex gap-3', styles[color])}>
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div>
        <h4 className="text-[11px] font-bold">{title}</h4>
        <p className="text-[10px] mt-0.5 opacity-80 leading-relaxed">{body}</p>
      </div>
    </section>
  );
}

function groupByDay(expenses: Expense[]): { label: string; items: Expense[] }[] {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const map = new Map<string, Expense[]>();
  for (const e of expenses) {
    const d = parseISO(e.date);
    let label: string;
    if (format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      label = 'Today';
    } else if (format(d, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      label = 'Yesterday';
    } else {
      label = format(d, 'd MMMM yyyy');
    }
    const arr = map.get(label) ?? [];
    arr.push(e);
    map.set(label, arr);
  }

  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}
