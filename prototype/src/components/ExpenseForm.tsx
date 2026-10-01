import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { Category, CATEGORIES, CURRENCIES, Expense } from '../types';
import { cn } from '../lib/utils';

type Step = 'amount' | 'category' | 'currency' | 'review' | 'saved';

interface ExpenseFormProps {
  onClose: () => void;
  onSave: (expense: { amount: number; category: Category; currency: string; note?: string }) => void;
  preferredCurrency: string;
  initialExpense?: Expense;
}

const SYMBOL: Record<string, string> = {
  EUR: '€', USD: '$', GBP: '£', JPY: '¥', CHF: 'Fr', CAD: 'C$', AUD: 'A$',
};

const STEP_TITLE_NEW: Record<Step, string> = {
  amount: 'New expense',
  category: 'Select category',
  currency: 'Select currency',
  review: 'Review entry',
  saved: '',
};
const STEP_TITLE_EDIT: Record<Step, string> = {
  amount: 'Edit expense',
  category: 'Select category',
  currency: 'Select currency',
  review: 'Review entry',
  saved: '',
};

export default function ExpenseForm({ onClose, onSave, preferredCurrency, initialExpense }: ExpenseFormProps) {
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState(initialExpense ? String(initialExpense.amount) : '');
  const [amountError, setAmountError] = useState('');
  const [category, setCategory] = useState<Category | ''>(initialExpense?.category ?? '');
  const [currency, setCurrency] = useState(initialExpense?.currency ?? preferredCurrency);
  const [note, setNote] = useState(initialExpense?.note ?? '');

  // Entry Saved → auto-return to dashboard after 1.5 s with animated confirmation
  useEffect(() => {
    if (step !== 'saved') return;
    const t = setTimeout(() => {
      onSave({
        amount: parseFloat(amount),
        category: category as Category,
        currency,
        note: note.trim() || undefined,
      });
    }, 1500);
    return () => clearTimeout(t);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Transition handlers ────────────────────────────────────────────────────

  // Enter Amount → Select Category (validates; blocks on invalid input)
  const goToCategory = () => {
    const v = parseFloat(amount);
    if (!amount || isNaN(v) || v <= 0) {
      setAmountError('Enter a valid amount greater than 0');
      return;
    }
    if (v > 1_000_000) {
      setAmountError('Amount too large (max 1,000,000)');
      return;
    }
    setAmountError('');
    setStep('category');
  };

  // Select Category → Review Entry (default currency shortcut — no extra tap for 83% of users)
  // Select Category → Select Currency (explicit override path)
  const selectCategory = (cat: Category) => {
    setCategory(cat);
    setStep('review');
  };

  // Select Currency → Select Category (currency updated; user still picks category if not yet set)
  const selectCurrency = (c: string) => {
    setCurrency(c);
    setStep('category');
  };

  // Review Entry → Enter Amount (Edit arc — all data preserved for correction)
  const handleEdit = () => setStep('amount');

  // Review Entry → Entry Saved
  const handleSave = () => setStep('saved');

  // Generic back
  const back = () => {
    if (step === 'category') setStep('amount');
    else if (step === 'currency') setStep('category');
    else if (step === 'review') setStep('category');
  };

  const sym = SYMBOL[currency] ?? currency;
  const STEP_TITLE = initialExpense ? STEP_TITLE_EDIT : STEP_TITLE_NEW;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center p-4"
      onClick={step !== 'saved' ? onClose : undefined}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header — hidden in saved state */}
        {step !== 'saved' && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            {step === 'amount' ? (
              <button onClick={onClose} className="w-10 flex justify-start text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            ) : (
              <button onClick={back} className="flex items-center gap-0.5 text-blue-600 font-bold text-sm">
                <ChevronLeft size={16} />
                Back
              </button>
            )}
            <h2 className="text-base font-bold text-slate-900">{STEP_TITLE[step]}</h2>
            <div className="w-10" />
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── Enter Amount ─────────────────────────────────────────────── */}
          {step === 'amount' && (
            <motion.div
              key="amount"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.15 }}
              className="p-5 space-y-5"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Amount
                </label>
                <div className={cn(
                  'flex items-center gap-2 border-b-2 pb-1 transition-colors',
                  amountError ? 'border-red-400' : 'border-slate-900'
                )}>
                  <span className="text-2xl font-black text-slate-300">{sym}</span>
                  <input
                    autoFocus
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={e => { setAmount(e.target.value); setAmountError(''); }}
                    onKeyDown={e => e.key === 'Enter' && goToCategory()}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="bg-transparent text-3xl font-black text-slate-900 focus:outline-none w-full placeholder:text-slate-200"
                  />
                </div>
                <AnimatePresence>
                  {amountError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium"
                    >
                      <AlertCircle size={12} />
                      {amountError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              <button
                onClick={goToCategory}
                className="w-full h-12 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-sm shadow-blue-200 active:scale-[0.98] transition-all"
              >
                Next →
              </button>
            </motion.div>
          )}

          {/* ── Select Category ──────────────────────────────────────────── */}
          {step === 'category' && (
            <motion.div
              key="category"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.15 }}
            >
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => selectCategory(cat)}
                    className={cn(
                      'w-full px-5 py-3.5 text-sm font-medium flex justify-between items-center transition-colors',
                      category === cat
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                    )}
                  >
                    {cat}
                    {category === cat
                      ? <Check size={14} className="text-blue-600" />
                      : <ChevronRight size={14} className="text-slate-300" />}
                  </button>
                ))}
              </div>

              {/* Currency row — default currency shortcut label + explicit override */}
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Currency
                </span>
                <button
                  onClick={() => setStep('currency')}
                  className="flex items-center gap-1.5 text-[12px] font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  {currency}
                  {currency === preferredCurrency
                    ? <span className="text-[9px] text-slate-400 font-normal">default</span>
                    : <span className="text-[9px] text-blue-500 font-normal">changed</span>}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Select Currency ──────────────────────────────────────────── */}
          {step === 'currency' && (
            <motion.div
              key="currency"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.15 }}
            >
              <div className="divide-y divide-slate-100">
                {CURRENCIES.map(c => (
                  <button
                    key={c}
                    onClick={() => selectCurrency(c)}
                    className={cn(
                      'w-full px-5 py-3.5 text-sm font-medium flex justify-between items-center transition-colors',
                      currency === c
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <span>{c}</span>
                    <span className="flex items-center gap-2">
                      {c === preferredCurrency && currency !== c && (
                        <span className="text-[10px] text-slate-400 font-normal">default</span>
                      )}
                      {currency === c && <Check size={14} />}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Review Entry ─────────────────────────────────────────────── */}
          {step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.15 }}
              className="p-5 space-y-4"
            >
              {/* Summary */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden">
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</span>
                  <span className="text-base font-black text-slate-900">
                    {sym}{parseFloat(amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</span>
                  <span className="text-sm font-bold text-slate-800">{category}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Currency</span>
                  <span className="text-sm font-bold text-slate-800">{currency}</span>
                </div>
              </div>

              {/* Optional note */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Note{' '}
                  <span className="normal-case font-normal text-slate-300">(optional)</span>
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. dinner with friends"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-300 placeholder:text-slate-300 transition-colors"
                />
              </div>

              {/* Edit arc (→ Enter Amount) + Save */}
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  className="px-5 h-12 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 h-12 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-sm shadow-blue-200 active:scale-[0.98] transition-all"
                >
                  Save
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Entry Saved — animated confirmation, auto-return in 1.5 s ─── */}
          {step === 'saved' && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 px-5 gap-2.5"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.05 }}
                className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center"
              >
                <Check className="text-green-600" size={28} />
              </motion.div>
              <p className="text-base font-black text-slate-800">Expense saved!</p>
              <p className="text-xs text-slate-400 text-center">
                {sym}{parseFloat(amount).toFixed(2)} · {category}
              </p>
              <p className="text-[10px] text-slate-300 font-medium mt-2">Returning to dashboard…</p>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
