import { useRef } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, AlertTriangle, X } from 'lucide-react';
import { Alert } from '../types';
import { cn } from '../lib/utils';

interface AlertBannerProps {
  alert: Alert;
  onDismiss: () => void;
  onExpand: () => void;
}

export default function AlertBanner({ alert, onDismiss, onExpand }: AlertBannerProps) {
  const touchStartX = useRef(0);

  return (
    <motion.div
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -72, opacity: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 320 }}
      className="fixed top-14 left-1/2 -translate-x-1/2 w-full max-w-md z-50 px-3 pt-1.5"
    >
      <div
        className={cn(
          'rounded-xl shadow-lg flex items-center gap-2.5 pr-1.5 pl-3 py-3 select-none cursor-pointer',
          alert.severity === 'danger'
            ? 'bg-red-600 text-white'
            : 'bg-amber-500 text-white'
        )}
        onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (Math.abs(e.changedTouches[0].clientX - touchStartX.current) > 60) onDismiss();
        }}
        onClick={onExpand}
      >
        {alert.severity === 'danger'
          ? <AlertCircle size={15} className="shrink-0" />
          : <AlertTriangle size={15} className="shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold leading-tight truncate">{alert.title}</p>
          <p className="text-[10px] opacity-85 truncate">{alert.message}</p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDismiss(); }}
          className="p-2 rounded-lg hover:bg-white/20 transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X size={13} />
        </button>
      </div>
    </motion.div>
  );
}
