import { motion } from 'motion/react';
import { Plus, Target, AlertTriangle, PiggyBank, Bell } from 'lucide-react';
import { AppData, Alert } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { format, differenceInDays } from 'date-fns';

interface DashboardProps {
  data: AppData;
  alerts: Alert[];
  onAddExpense: () => void;
  onAddGoal: () => void;
  onViewGoal: (id: string) => void;
  onViewAlerts: () => void;
  onViewGoalAlert: (goalId: string) => void;
}

export default function Dashboard({ data, alerts, onAddExpense, onAddGoal, onViewGoal, onViewAlerts, onViewGoalAlert }: DashboardProps) {
  const today = new Date();

  // Monthly spending (tracked expenses)
  const thisMonthExpenses = data.expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });
  const trackedSpent = thisMonthExpenses.reduce((acc, e) => acc + e.amount, 0);

  // Recurring expenses count toward monthly budget upfront
  const recurringTotal = data.recurringExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalSpent = trackedSpent + recurringTotal;
  const budgetUsage = data.monthlyBudget > 0 ? (totalSpent / data.monthlyBudget) * 100 : 0;
  const remaining = data.monthlyBudget - totalSpent;

  // Goals behind pace (with deadline)
  const goalsAtRisk = data.goals.filter(g => {
    if (!g.deadline) return false;
    const daysLeft = differenceInDays(new Date(g.deadline), today);
    if (daysLeft <= 0) return false;
    const createdDays = Math.max(differenceInDays(today, new Date(g.createdAt)), 1);
    const totalDays = createdDays + daysLeft;
    const expectedProgress = g.targetAmount * (createdDays / totalDays);
    return g.currentAmount < expectedProgress * 0.8;
  });

  const greeting = data.userName ? `Hi, ${data.userName}` : 'Hi there';

  return (
    <div className="space-y-5 py-4">
      {/* Greeting */}
      <header className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-slate-400 font-medium">
            {format(today, 'EEEE, d MMMM yyyy')}
          </p>
          <h2 className="text-2xl font-black text-slate-900 mt-0.5">{greeting}</h2>
        </div>
        <button
          onClick={onViewAlerts}
          className="relative mt-1 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="View notifications"
        >
          <Bell size={20} className={alerts.length > 0 ? 'text-amber-500' : 'text-slate-300'} />
          {alerts.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-black flex items-center justify-center">
              {alerts.length}
            </span>
          )}
        </button>
      </header>

      {/* Monthly Summary — most requested feature (FR4) */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">This month</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900">
            {formatCurrency(totalSpent, data.preferredCurrency)}
          </span>
          <span className="text-sm text-slate-400 font-medium">
            / {formatCurrency(data.monthlyBudget, data.preferredCurrency)}
          </span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(budgetUsage, 100)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full',
              budgetUsage > 90 ? 'bg-red-500' : budgetUsage > 70 ? 'bg-yellow-400' : 'bg-blue-500'
            )}
          />
        </div>
        <div className="flex justify-between text-[10px] font-medium">
          <span className="text-slate-400">{budgetUsage > 999 ? '>999' : Math.round(budgetUsage)}% used</span>
          <span className={remaining >= 0 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
            {remaining >= 0
              ? `${formatCurrency(remaining, data.preferredCurrency)} left`
              : 'Over budget!'}
          </span>
        </div>
        {recurringTotal > 0 && (
          <p className="text-[9px] text-slate-400">
            Includes {formatCurrency(recurringTotal, data.preferredCurrency)} in fixed monthly expenses
          </p>
        )}
      </section>

      {/* Quick Actions */}
      <section className="flex gap-2">
        <button
          onClick={onAddExpense}
          className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm shadow-blue-200"
        >
          <Plus size={16} />
          + Expense
        </button>
        <button
          onClick={onAddGoal}
          className="px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 active:scale-[0.98] transition-all"
        >
          + Goal
        </button>
      </section>

      {/* Savings Goals */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            My Piggy Banks
          </h3>
          <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 font-bold">
            {data.goals.length}
          </span>
        </div>

        {data.goals.length === 0 ? (
          <div className="p-10 border border-dashed border-slate-200 rounded-xl flex flex-col items-center gap-3 text-center">
            <PiggyBank className="w-9 h-9 text-slate-200" />
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              No savings goals yet.
              <br />
              Tap "+ Goal" to start saving!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.goals.map(goal => {
              const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
              return (
                <button
                  key={goal.id}
                  onClick={() => onViewGoal(goal.id)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 hover:border-blue-200 hover:bg-blue-50/20 active:scale-[0.99] transition-all shadow-sm text-left"
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                      goal.priority === 'high'
                        ? 'bg-red-50 text-red-500'
                        : goal.priority === 'mid'
                        ? 'bg-yellow-50 text-yellow-500'
                        : 'bg-green-50 text-green-600'
                    )}
                  >
                    <Target size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[13px] font-bold text-slate-900 truncate">
                        {goal.name}
                      </span>
                      <span className="text-[11px] font-black text-slate-600 ml-2 shrink-0">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          goal.priority === 'high'
                            ? 'bg-red-400'
                            : goal.priority === 'mid'
                            ? 'bg-yellow-400'
                            : 'bg-green-500'
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Goals at risk — tap to open AlertDetailModal with Adjust Goal shortcut (Fix 3) */}
      {goalsAtRisk.map(goal => (
        <button
          key={goal.id}
          onClick={() => onViewGoalAlert(goal.id)}
          className="w-full p-3.5 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 text-amber-700 text-left hover:bg-amber-100/60 active:scale-[0.99] transition-all"
        >
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[11px] font-bold">"{goal.name}" goal at risk</h4>
            <p className="text-[10px] mt-0.5 opacity-80">
              Current pace is behind schedule. Tap to adjust.
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
