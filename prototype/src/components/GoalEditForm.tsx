import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Calendar } from 'lucide-react';
import { Goal, Priority, CURRENCIES } from '../types';
import { cn } from '../lib/utils';

interface GoalEditFormProps {
  goal: Goal;
  onClose: () => void;
  onSave: (updates: {
    name: string;
    targetAmount: number;
    priority: Priority;
    deadline?: string;
    currency: string;
  }) => void;
}

export default function GoalEditForm({ goal, onClose, onSave }: GoalEditFormProps) {
  const [name, setName] = useState(goal.name);
  const [target, setTarget] = useState(String(goal.targetAmount));
  const [priority, setPriority] = useState<Priority>(goal.priority);
  const [deadline, setDeadline] = useState(goal.deadline ?? '');
  const [currency, setCurrency] = useState(goal.currency);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !target) return;
    onSave({
      name: name.trim(),
      targetAmount: parseFloat(target),
      priority,
      deadline: deadline || undefined,
      currency,
    });
  };

  const sym = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Edit goal</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Name
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-300 placeholder:text-slate-300 transition-colors"
            />
          </div>

          {/* Target amount + currency */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Target amount
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  {sym}
                </span>
                <input
                  type="number"
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full h-11 px-3 pl-7 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-300 placeholder:text-slate-300 transition-colors"
                />
              </div>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="h-11 px-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-300 transition-colors"
              >
                {CURRENCIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Priority
            </label>
            <div className="flex bg-slate-50 rounded-xl border border-slate-200 p-1 gap-1">
              {(['low', 'mid', 'high'] as Priority[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all',
                    priority === p
                      ? p === 'high'
                        ? 'bg-red-500 text-white shadow-sm'
                        : p === 'mid'
                        ? 'bg-yellow-400 text-white shadow-sm'
                        : 'bg-green-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Deadline{' '}
              <span className="normal-case font-normal text-slate-300">(optional)</span>
            </label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full h-11 px-3 pl-9 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-300 transition-colors"
              />
            </div>
            <p className="text-[9px] text-slate-400 pl-1">DD / MM / YYYY</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 h-12 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !target}
              className="flex-1 h-12 bg-blue-600 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-xl font-bold text-sm shadow-sm shadow-blue-200 active:scale-[0.98] transition-all"
            >
              Save
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
