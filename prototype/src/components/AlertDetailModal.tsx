import { motion } from 'motion/react';
import { AlertCircle, AlertTriangle, X } from 'lucide-react';
import { Alert } from '../types';
import { cn } from '../lib/utils';

interface AlertDetailModalProps {
  alert: Alert;
  onClose: () => void;
  onDismiss: () => void;
  onAdjustGoal: (goalId: string) => void;
}

export default function AlertDetailModal({ alert, onClose, onDismiss, onAdjustGoal }: AlertDetailModalProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-white rounded-t-2xl shadow-2xl"
      >
        {/* Drag handle */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-200 rounded-full" />

        <div className="px-5 pt-6 pb-8 space-y-5">
          <div className="flex items-start justify-between">
            <div className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center',
              alert.severity === 'danger' ? 'bg-red-50' : 'bg-amber-50'
            )}>
              {alert.severity === 'danger'
                ? <AlertCircle size={22} className="text-red-500" />
                : <AlertTriangle size={22} className="text-amber-500" />
              }
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div>
            <h3 className="text-xl font-black text-slate-900 mb-1.5">{alert.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{alert.message}</p>
          </div>

          <div className="space-y-2.5 pt-1">
            {alert.goalId && (
              <button
                onClick={() => onAdjustGoal(alert.goalId!)}
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 active:scale-[0.99] transition-all"
              >
                Adjust Goal
              </button>
            )}
            <button
              onClick={onDismiss}
              className={cn(
                'w-full py-3.5 rounded-xl font-bold text-sm active:scale-[0.99] transition-all',
                alert.goalId
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              Dismiss
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
