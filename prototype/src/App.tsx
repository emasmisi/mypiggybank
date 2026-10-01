/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, PiggyBank, BarChart3, Settings as SettingsIcon, ArrowLeft } from 'lucide-react';
import { useStorage } from './hooks/useStorage';
import Dashboard from './components/Dashboard';
import GoalList from './components/GoalList';
import GoalDetail from './components/GoalDetail';
import StatsView from './components/StatsView';
import Settings from './components/Settings';
import AlertsView from './components/AlertsView';
import AlertBanner from './components/AlertBanner';
import AlertDetailModal from './components/AlertDetailModal';
import ExpenseForm from './components/ExpenseForm';
import GoalForm from './components/GoalForm';
import GoalEditForm from './components/GoalEditForm';
import { cn, generateAlerts } from './lib/utils';
import type { Alert, Expense } from './types';

type View = 'dashboard' | 'goals' | 'goal-detail' | 'stats' | 'settings' | 'alerts';

export default function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showGoalEditModal, setShowGoalEditModal] = useState(false);
  // activeDetailAlert: which alert is shown in AlertDetailModal (null = modal closed)
  const [activeDetailAlert, setActiveDetailAlert] = useState<Alert | null>(null);
  const [showAlertGoalEdit, setShowAlertGoalEdit] = useState(false);
  // editingExpense: non-null = ExpenseForm is in edit mode for this expense
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const {
    data,
    addGoal,
    updateGoal,
    addExpense,
    updateExpense,
    deleteExpense,
    depositToGoal,
    deleteGoal,
    setMonthlyBudget,
    setPreferredCurrency,
    setUserName,
    addRecurringExpense,
    updateRecurringExpense,
    removeRecurringExpense,
    dismissAlert,
  } = useStorage();

  const handleExport = (format: 'json' | 'csv') => {
    const date = new Date().toISOString().slice(0, 10);
    let content: string;
    let filename: string;
    let mime: string;

    if (format === 'json') {
      content = JSON.stringify(data, null, 2);
      filename = `mypiggybank-${date}.json`;
      mime = 'application/json';
    } else {
      const header = 'date,category,amount,currency,note';
      const rows = data.expenses.map(e =>
        `${e.date},${e.category},${e.amount},${e.currency},"${(e.note ?? '').replace(/"/g, '""')}"`
      );
      content = [header, ...rows].join('\n');
      filename = `mypiggybank-expenses-${date}.csv`;
      mime = 'text/csv';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const alerts = generateAlerts(data);
  const undismissedAlerts = alerts.filter(a => !data.dismissedAlerts.some(d => d.id === a.id));
  const activeAlert = undismissedAlerts[0] ?? null;

  // alertGoal: goal linked to the alert currently shown in the detail modal
  const alertGoal = activeDetailAlert?.goalId
    ? (data.goals.find(g => g.id === activeDetailAlert.goalId) ?? null)
    : null;

  const showBanner =
    activeAlert !== null &&
    activeDetailAlert === null &&
    !showAlertGoalEdit &&
    !showExpenseModal &&
    !showGoalModal &&
    !showGoalEditModal &&
    activeView !== 'alerts';

  // Fix 3: open AlertDetailModal for a specific goal-at-risk alert from the Dashboard
  const handleViewGoalAlert = (goalId: string) => {
    const alert = alerts.find(a => a.goalId === goalId);
    if (alert) {
      setActiveDetailAlert(alert);
    }
  };

  const handleViewGoal = (id: string) => {
    setSelectedGoalId(id);
    setActiveView('goal-detail');
  };

  const handleBackFromGoal = () => {
    setActiveView('goals');
    setSelectedGoalId(null);
  };

  const closeAlertDetail = () => setActiveDetailAlert(null);

  const isGoalDetail = activeView === 'goal-detail';
  const selectedGoal = selectedGoalId ? data.goals.find(g => g.id === selectedGoalId) ?? null : null;

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <Dashboard
            data={data}
            alerts={undismissedAlerts}
            onAddExpense={() => setShowExpenseModal(true)}
            onAddGoal={() => setShowGoalModal(true)}
            onViewGoal={handleViewGoal}
            onViewAlerts={() => setActiveView('alerts')}
            onViewGoalAlert={handleViewGoalAlert}
          />
        );
      case 'goals':
        return (
          <GoalList
            goals={data.goals}
            onAddGoal={() => setShowGoalModal(true)}
            onViewGoal={handleViewGoal}
            onDeposit={(goalId, amount) => depositToGoal(goalId, amount)}
          />
        );
      case 'goal-detail':
        return selectedGoal ? (
          <GoalDetail
            goal={selectedGoal}
            expenses={data.expenses}
            monthlyBudget={data.monthlyBudget}
            recurringExpenses={data.recurringExpenses}
            onDeposit={(amount) => depositToGoal(selectedGoal.id, amount)}
            onDelete={() => { deleteGoal(selectedGoal.id); handleBackFromGoal(); }}
            onEdit={() => setShowGoalEditModal(true)}
            onAddExpense={() => setShowExpenseModal(true)}
          />
        ) : null;
      case 'stats':
        return (
          <StatsView
            expenses={data.expenses}
            monthlyBudget={data.monthlyBudget}
            recurringExpenses={data.recurringExpenses}
            preferredCurrency={data.preferredCurrency}
            onEditExpense={(expense) => { setEditingExpense(expense); setShowExpenseModal(true); }}
            onDeleteExpense={(id) => deleteExpense(id)}
          />
        );
      case 'settings':
        return (
          <Settings
            monthlyBudget={data.monthlyBudget}
            preferredCurrency={data.preferredCurrency}
            recurringExpenses={data.recurringExpenses}
            userName={data.userName}
            onSetBudget={setMonthlyBudget}
            onSetCurrency={setPreferredCurrency}
            onSetUserName={setUserName}
            onAddRecurring={addRecurringExpense}
            onUpdateRecurring={updateRecurringExpense}
            onRemoveRecurring={removeRecurringExpense}
            onExport={handleExport}
          />
        );
      case 'alerts':
        return (
          <AlertsView
            dismissedAlerts={data.dismissedAlerts}
            onBack={() => setActiveView('dashboard')}
            onViewGoal={handleViewGoal}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-slate-50 relative overflow-hidden font-sans border-x border-slate-200 shadow-2xl shadow-slate-200/50">
      {/* Header */}
      <header className="h-14 px-4 flex items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-md fixed top-0 w-full max-w-md z-40">
        {isGoalDetail ? (
          <>
            <button
              onClick={handleBackFromGoal}
              className="flex items-center gap-1.5 text-blue-600 font-bold text-sm"
            >
              <ArrowLeft size={18} />
              Back
            </button>
            <span className="text-sm font-bold text-slate-900 truncate max-w-[180px]">
              {selectedGoal?.name ?? ''}
            </span>
            <div className="w-10" />
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center font-black text-white text-[10px] italic">
                PB
              </div>
              <h1 className="text-xs font-bold uppercase tracking-[0.1em] text-slate-900">MyPiggyBank</h1>
            </div>
            <div className="flex items-center gap-2" title="Your data is stored only on this device">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Local</span>
            </div>
          </>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 pt-18 pb-20 scrollbar-hide">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView + selectedGoalId}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Alert Banner — system-initiated, non-blocking overlay (STN 6) */}
      <AnimatePresence>
        {showBanner && activeAlert && (
          <AlertBanner
            alert={activeAlert}
            onDismiss={() => dismissAlert(activeAlert)}
            onExpand={() => setActiveDetailAlert(activeAlert)}
          />
        )}
      </AnimatePresence>

      {/* Bottom Navigation — global escape arcs, always visible */}
      <nav className="fixed bottom-0 w-full max-w-md px-3 h-14 bg-white border-t border-slate-200 flex items-center justify-around z-40">
        <NavItem icon={<Home size={18} />} label="Home" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
        <NavItem icon={<PiggyBank size={18} />} label="Savings" active={activeView === 'goals' || isGoalDetail} onClick={() => { setSelectedGoalId(null); setActiveView('goals'); }} />
        <NavItem icon={<BarChart3 size={18} />} label="Stats" active={activeView === 'stats'} onClick={() => setActiveView('stats')} />
        <NavItem icon={<SettingsIcon size={18} />} label="Settings" active={activeView === 'settings'} onClick={() => setActiveView('settings')} />
      </nav>

      {/* Alert Detail Modal (STN 6: tap banner → detail expanded; Fix 3: dashboard card → detail) */}
      <AnimatePresence>
        {activeDetailAlert && (
          <AlertDetailModal
            alert={activeDetailAlert}
            onClose={closeAlertDetail}
            onDismiss={() => { dismissAlert(activeDetailAlert); closeAlertDetail(); }}
            onAdjustGoal={() => { closeAlertDetail(); setShowAlertGoalEdit(true); }}
          />
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showExpenseModal && (
          <ExpenseForm
            onClose={() => { setShowExpenseModal(false); setEditingExpense(null); }}
            onSave={(expense) => {
              if (editingExpense) {
                updateExpense(editingExpense.id, expense);
              } else {
                addExpense(expense);
              }
              setShowExpenseModal(false);
              setEditingExpense(null);
            }}
            preferredCurrency={data.preferredCurrency}
            initialExpense={editingExpense ?? undefined}
          />
        )}
        {showGoalModal && (
          <GoalForm
            onClose={() => setShowGoalModal(false)}
            onSave={(goal) => {
              addGoal(goal);
              setShowGoalModal(false);
            }}
            preferredCurrency={data.preferredCurrency}
          />
        )}
        {showGoalEditModal && selectedGoal && (
          <GoalEditForm
            goal={selectedGoal}
            onClose={() => setShowGoalEditModal(false)}
            onSave={(updates) => {
              updateGoal(selectedGoal.id, updates);
              setShowGoalEditModal(false);
            }}
          />
        )}
        {showAlertGoalEdit && alertGoal && activeDetailAlert && (
          <GoalEditForm
            goal={alertGoal}
            onClose={() => { setShowAlertGoalEdit(false); setActiveDetailAlert(activeDetailAlert); }}
            onSave={(updates) => {
              updateGoal(alertGoal.id, updates);
              dismissAlert(activeDetailAlert);
              setShowAlertGoalEdit(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 transition-all duration-150 px-3 py-1 rounded',
        active
          ? 'text-blue-600 bg-blue-50/60'
          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
      )}
    >
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}
