import { useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface DepositModalProps {
  goalName: string;
  goalCurrency: string;
  onClose: () => void;
  onSave: (amount: number) => void;
}

const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: '€', USD: '$', GBP: '£', JPY: '¥', CHF: 'Fr', CAD: 'C$', AUD: 'A$',
};

export default function DepositModal({ goalName, goalCurrency, onClose, onSave }: DepositModalProps) {
  const [amount, setAmount] = useState('');
  const sym = CURRENCY_SYMBOL[goalCurrency] ?? goalCurrency;

  const handleSave = () => {
    const v = parseFloat(amount);
    if (v > 0) onSave(v);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/50 z-50 flex items-end justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-slate-900">
            Add savings to "{goalName}"
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 border-b-2 border-blue-600 pb-1 mb-5">
          <span className="text-xl font-black text-slate-400">{sym}</span>
          <input
            autoFocus
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="0.00"
            className="bg-transparent text-3xl font-black text-slate-900 focus:outline-none w-full placeholder:text-slate-200"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!amount || parseFloat(amount) <= 0}
            className="flex-1 py-2.5 bg-blue-600 rounded-xl text-sm font-bold text-white disabled:opacity-40 hover:bg-blue-700 transition-all"
          >
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
