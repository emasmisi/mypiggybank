import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Calendar, TrendingUp, Plus, PiggyBank, PlusCircle } from 'lucide-react';
import { Goal, DEPOSIT_BUTTON_VARIANT } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { differenceInDays, format } from 'date-fns';
import DepositModal from './DepositModal';

interface GoalListProps {
  goals: Goal[];
  onAddGoal: () => void;
  onViewGoal: (id: string) => void;
  onDeposit: (goalId: string, amount: number) => void;
}

export default function GoalList({ goals, onAddGoal, onViewGoal, onDeposit }: GoalListProps) {
  // Variant A: track which goal's deposit modal is open
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const depositGoal = goals.find(g => g.id === depositGoalId) ?? null;

  return (
    <div className="space-y-5 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-900">Piggy Banks</h2>
        <button
          onClick={onAddGoal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
        >
          <Plus size={12} />
          New
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="p-14 border border-dashed border-slate-200 rounded-xl flex flex-col items-center gap-3 text-center">
          <PiggyBank size={32} className="text-slate-200" />
          <p className="text-slate-400 text-sm font-medium leading-relaxed">
            No savings goals yet.
            <br />
            Create your first one!
          </p>
          <button
            onClick={onAddGoal}
            className="mt-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
          >
            + New goal
          </button>
        </div>
      ) : (
        <div className="space-y-3 pb-12">
          {goals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onView={() => onViewGoal(goal.id)}
              onDepositTap={
                DEPOSIT_BUTTON_VARIANT === 'A'
                  ? () => setDepositGoalId(goal.id)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Variant A: deposit modal, shared by all cards */}
      <AnimatePresence>
        {depositGoal && (
          <DepositModal
            goalName={depositGoal.name}
            goalCurrency={depositGoal.currency}
            onClose={() => setDepositGoalId(null)}
            onSave={(amount) => {
              onDeposit(depositGoal.id, amount);
              setDepositGoalId(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function GoalCard({
  goal,
  onView,
  onDepositTap,
}: {
  goal: Goal;
  onView: () => void;
  onDepositTap?: () => void;
}) {
  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const daysLeft = goal.deadline
    ? differenceInDays(new Date(goal.deadline), new Date())
    : null;

  return (
    <motion.div
      layout
      className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
    >
      {/* Main tappable area — opens goal detail */}
      <button onClick={onView} className="w-full p-4 text-left">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs',
                goal.priority === 'high'
                  ? 'bg-red-50 text-red-500'
                  : goal.priority === 'mid'
                  ? 'bg-yellow-50 text-yellow-500'
                  : 'bg-green-50 text-green-600'
              )}
            >
              <Target size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{goal.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn('priority-chip selected', goal.priority)}>
                  {goal.priority}
                </span>
                {goal.deadline && (
                  <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                    <Calendar size={9} />
                    {format(new Date(goal.deadline), 'dd MMM yy')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">
                Saved
              </p>
              <p className="text-base font-black text-slate-900">
                {formatCurrency(goal.currentAmount, goal.currency)}
                <span className="text-slate-400 text-xs font-medium ml-1">
                  / {formatCurrency(goal.targetAmount, goal.currency)}
                </span>
              </p>
            </div>
            <p className="text-lg font-black text-blue-600">{Math.round(progress)}%</p>
          </div>

          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
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

        {daysLeft !== null && daysLeft > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <TrendingUp size={10} className="text-green-500" />
            <span>{daysLeft} days to deadline</span>
          </div>
        )}
        {daysLeft !== null && daysLeft <= 0 && progress < 100 && (
          <div className="mt-2 text-[10px] text-red-500 font-bold">Deadline passed</div>
        )}
      </button>

      {/* Variant A: one-tap deposit strip — only rendered when onDepositTap is provided */}
      {onDepositTap && (
        <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between bg-slate-50/60">
          <span className="text-[10px] text-slate-400 font-medium">Quick deposit</span>
          <button
            onClick={onDepositTap}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[11px] font-bold hover:bg-blue-700 active:scale-[0.97] transition-all"
          >
            <PlusCircle size={11} />
            Add
          </button>
        </div>
      )}
    </motion.div>
  );
}
