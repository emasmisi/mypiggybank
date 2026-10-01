import { Bell, CheckCircle } from 'lucide-react';
import { Alert } from '../types';

interface AlertsViewProps {
  dismissedAlerts: Alert[];
  onBack: () => void;
  onViewGoal: (id: string) => void;
}

export default function AlertsView({ dismissedAlerts, onBack, onViewGoal }: AlertsViewProps) {
  return (
    <div className="space-y-5 py-4">
      <header>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">History</p>
        <h2 className="text-2xl font-black text-slate-900 mt-0.5">Notification Log</h2>
      </header>

      {dismissedAlerts.length === 0 ? (
        <div className="p-10 border border-dashed border-slate-200 rounded-xl flex flex-col items-center gap-3 text-center">
          <Bell className="w-9 h-9 text-slate-200" />
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
            No dismissed alerts yet.
            <br />
            Alerts you dismiss will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...dismissedAlerts].reverse().map(alert => (
            <div
              key={alert.id}
              className="p-4 rounded-xl border bg-slate-50 border-slate-200 flex gap-3"
            >
              <CheckCircle size={16} className="shrink-0 mt-0.5 text-slate-400" />
              <div className="flex-1 min-w-0">
                <h4 className="text-[13px] font-bold text-slate-600">{alert.title}</h4>
                <p className="text-[11px] mt-1 text-slate-400 leading-relaxed">{alert.message}</p>
                {alert.goalId && (
                  <button
                    onClick={() => onViewGoal(alert.goalId!)}
                    className="mt-2 text-[11px] font-bold text-blue-600 underline underline-offset-2"
                  >
                    View goal →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onBack}
        className="w-full py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 active:scale-[0.99] transition-all"
      >
        Back to Dashboard
      </button>
    </div>
  );
}
