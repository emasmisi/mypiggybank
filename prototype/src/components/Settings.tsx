import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Plus, Trash2, Lock, Download, Check, Pencil } from 'lucide-react';
import { RecurringExpense, Category, CATEGORIES, CURRENCIES } from '../types';
import { formatCurrency, cn } from '../lib/utils';

// ── STN states ──────────────────────────────────────────────────────────────
type SettingsView = 'main' | 'currency' | 'recurring' | 'recurring-form' | 'data-privacy' | 'export';

interface SettingsProps {
  monthlyBudget: number;
  preferredCurrency: string;
  recurringExpenses: RecurringExpense[];
  userName: string;
  onSetBudget: (n: number) => void;
  onSetCurrency: (c: string) => void;
  onSetUserName: (name: string) => void;
  onAddRecurring: (e: Omit<RecurringExpense, 'id'>) => void;
  onUpdateRecurring: (id: string, updates: Omit<RecurringExpense, 'id'>) => void;
  onRemoveRecurring: (id: string) => void;
  onExport: (format: 'json' | 'csv') => void;
}

export default function Settings({
  monthlyBudget,
  preferredCurrency,
  recurringExpenses,
  userName,
  onSetBudget,
  onSetCurrency,
  onSetUserName,
  onAddRecurring,
  onUpdateRecurring,
  onRemoveRecurring,
  onExport,
}: SettingsProps) {
  const [view, setView] = useState<SettingsView>('main');
  const [editingRecurring, setEditingRecurring] = useState<RecurringExpense | null>(null);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [nameInput, setNameInput] = useState(userName);
  const [budgetInput, setBudgetInput] = useState(String(monthlyBudget));
  const [budgetSaved, setBudgetSaved] = useState(false);
  // Recurring form fields
  const [recurringName, setRecurringName] = useState('');
  const [recurringAmount, setRecurringAmount] = useState('');
  const [recurringCategory, setRecurringCategory] = useState<Category>('Subscriptions');
  const [recurringCurrency, setRecurringCurrency] = useState(preferredCurrency);

  const recurringTotal = recurringExpenses.reduce((s, e) => s + e.amount, 0);

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const back = () => {
    if (view === 'recurring-form') setView('recurring');
    else if (view === 'export') setView('data-privacy');
    else setView('main');
  };

  const openAdd = () => {
    setEditingRecurring(null);
    setRecurringName('');
    setRecurringAmount('');
    setRecurringCategory('Subscriptions');
    setRecurringCurrency(preferredCurrency);
    setView('recurring-form');
  };

  const openEdit = (e: RecurringExpense) => {
    setEditingRecurring(e);
    setRecurringName(e.name);
    setRecurringAmount(String(e.amount));
    setRecurringCategory(e.category);
    setRecurringCurrency(e.currency);
    setView('recurring-form');
  };

  const saveRecurring = () => {
    const amt = parseFloat(recurringAmount);
    if (!recurringName.trim() || isNaN(amt) || amt <= 0) return;
    const payload = { name: recurringName.trim(), amount: amt, category: recurringCategory, currency: recurringCurrency };
    editingRecurring ? onUpdateRecurring(editingRecurring.id, payload) : onAddRecurring(payload);
    setView('recurring');
  };

  const saveBudget = () => {
    const v = parseFloat(budgetInput);
    if (v > 0) { onSetBudget(v); setBudgetSaved(true); setTimeout(() => setBudgetSaved(false), 1500); }
  };

  const triggerExport = () => {
    onExport(exportFormat);
    setView('data-privacy');
  };

  // ── Shared sub-view header ─────────────────────────────────────────────────
  const SubHeader = ({ title }: { title: string }) => (
    <div className="flex items-center justify-between mb-5">
      <button onClick={back} className="flex items-center gap-0.5 text-blue-600 font-bold text-sm">
        <ChevronLeft size={16} /> Back
      </button>
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      <div className="w-14" />
    </div>
  );

  return (
    <div className="py-4 pb-12">
      <AnimatePresence mode="wait">

        {/* ── Settings Main (hub) ───────────────────────────────────── */}
        {view === 'main' && (
          <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-black text-slate-900">Settings</h2>

            {/* Profile */}
            <section className="space-y-2">
              <SectionLabel>Profile</SectionLabel>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Your name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    placeholder="First name"
                    className="flex-1 h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-300 placeholder:text-slate-300 transition-colors"
                  />
                  <button
                    onClick={() => onSetUserName(nameInput.trim())}
                    className="px-5 h-11 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </section>

            {/* Navigation rows → sub-STN states */}
            <section className="space-y-2">
              <SectionLabel>Preferences</SectionLabel>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
                <NavRow
                  label="Currency & Budget"
                  detail={preferredCurrency}
                  onTap={() => setView('currency')}
                />
                <NavRow
                  label="Recurring Expenses"
                  detail={recurringExpenses.length > 0 ? `${recurringExpenses.length} item${recurringExpenses.length > 1 ? 's' : ''}` : 'None'}
                  onTap={() => setView('recurring')}
                />
              </div>
            </section>

            <section className="space-y-2">
              <SectionLabel>Privacy</SectionLabel>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <NavRow
                  label="Data & Privacy"
                  detail="Local-only"
                  onTap={() => setView('data-privacy')}
                />
              </div>
            </section>
          </motion.div>
        )}

        {/* ── Currency Preferences ──────────────────────────────────── */}
        {view === 'currency' && (
          <motion.div key="currency" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15 }}
            className="space-y-5"
          >
            <SubHeader title="Currency & Budget" />

            {/* Budget — explicit save */}
            <section className="space-y-2">
              <SectionLabel>Monthly spending limit</SectionLabel>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                    <span className="px-3 text-slate-400 font-bold text-sm">{preferredCurrency}</span>
                    <input
                      type="number"
                      value={budgetInput}
                      onChange={e => { setBudgetInput(e.target.value); setBudgetSaved(false); }}
                      className="flex-1 h-11 bg-transparent px-2 text-sm font-bold text-slate-700 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={saveBudget}
                    className={cn(
                      'px-5 h-11 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5',
                      budgetSaved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                    )}
                  >
                    {budgetSaved ? <><Check size={14} /> Saved</> : 'Save'}
                  </button>
                </div>
              </div>
            </section>

            {/* Currency — self-loop: change default / rate updated (immediate save) */}
            <section className="space-y-2">
              <SectionLabel>Default currency</SectionLabel>
              <p className="text-[10px] text-slate-400 -mt-1">Tap to change — updates immediately across the app.</p>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
                {CURRENCIES.map(c => (
                  <button
                    key={c}
                    onClick={() => onSetCurrency(c)}
                    className={cn(
                      'w-full px-5 py-3.5 text-sm font-medium flex justify-between items-center transition-colors',
                      preferredCurrency === c
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    {c}
                    {preferredCurrency === c && <Check size={14} />}
                  </button>
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {/* ── Recurring Expenses ────────────────────────────────────── */}
        {view === 'recurring' && (
          <motion.div key="recurring" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15 }}
            className="space-y-5"
          >
            <SubHeader title="Recurring Expenses" />

            <p className="text-[11px] text-slate-400 leading-relaxed -mt-2">
              Pre-load rent, subscriptions, and utilities. They're deducted from your budget automatically so you always see what's truly left to spend.
            </p>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              {recurringExpenses.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[11px] text-slate-400 italic">No fixed expenses added yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recurringExpenses.map(e => (
                    <div key={e.id} className="flex items-center px-4 py-3 gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{e.name}</p>
                        <p className="text-[10px] text-slate-400">{e.category}</p>
                      </div>
                      <span className="text-sm font-black text-slate-900 shrink-0">
                        {formatCurrency(e.amount, e.currency)}
                      </span>
                      {/* tap item → Add/Edit Recurring form */}
                      <button
                        onClick={() => openEdit(e)}
                        className="text-slate-300 hover:text-blue-500 transition-colors p-1"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => onRemoveRecurring(e.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* tap "Add" → Add/Edit Recurring form */}
              <button
                onClick={openAdd}
                className="w-full p-3.5 border-t border-slate-100 text-[11px] font-bold text-blue-600 flex items-center justify-center gap-1.5 hover:bg-blue-50 transition-colors"
              >
                <Plus size={12} /> Add fixed expense
              </button>
            </div>

            {recurringExpenses.length > 0 && (
              <p className="text-[11px] text-slate-500 px-0.5">
                Total: <strong>{formatCurrency(recurringTotal, preferredCurrency)}</strong> deducted monthly.
              </p>
            )}
          </motion.div>
        )}

        {/* ── Add / Edit Recurring ──────────────────────────────────── */}
        {view === 'recurring-form' && (
          <motion.div key="recurring-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15 }}
            className="space-y-5"
          >
            <SubHeader title={editingRecurring ? 'Edit Expense' : 'Add Expense'} />

            <div className="space-y-4">
              <div className="space-y-1.5">
                <SectionLabel>Name</SectionLabel>
                <input
                  autoFocus
                  type="text"
                  value={recurringName}
                  onChange={e => setRecurringName(e.target.value)}
                  placeholder="e.g. Rent, Netflix, Gym"
                  className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-300 placeholder:text-slate-300 shadow-sm transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <SectionLabel>Amount</SectionLabel>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={recurringAmount}
                    onChange={e => setRecurringAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="flex-1 h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-300 shadow-sm transition-colors"
                  />
                  <select
                    value={recurringCurrency}
                    onChange={e => setRecurringCurrency(e.target.value)}
                    className="h-11 px-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none shadow-sm transition-colors"
                  >
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <SectionLabel>Category</SectionLabel>
                <select
                  value={recurringCategory}
                  onChange={e => setRecurringCategory(e.target.value as Category)}
                  className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-300 shadow-sm transition-colors"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={back}
                className="px-5 h-12 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveRecurring}
                disabled={!recurringName.trim() || !recurringAmount}
                className="flex-1 h-12 bg-blue-600 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-xl text-sm font-bold shadow-sm shadow-blue-200 active:scale-[0.98] transition-all"
              >
                Save
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Data & Privacy ────────────────────────────────────────── */}
        {view === 'data-privacy' && (
          <motion.div key="data-privacy" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15 }}
            className="space-y-5"
          >
            <SubHeader title="Data & Privacy" />

            {/* Privacy notice — prominent placement (survey: importance 4.1/5) */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex gap-3">
              <Lock size={18} className="text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-bold text-green-800">Local-first storage active</p>
                <p className="text-[11px] text-green-700 mt-1 leading-relaxed opacity-90">
                  All your data is stored exclusively on this device using localStorage. Nothing is sent to external servers, no account required, no tracking. Your financial information is entirely private.
                </p>
              </div>
            </div>

            <section className="space-y-2">
              <SectionLabel>Your data</SectionLabel>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {/* tap "Export" → Export Data */}
                <NavRow
                  label="Export data"
                  detail="JSON · CSV"
                  icon={<Download size={14} className="text-slate-400" />}
                  onTap={() => setView('export')}
                />
              </div>
            </section>
          </motion.div>
        )}

        {/* ── Export Data ───────────────────────────────────────────── */}
        {view === 'export' && (
          <motion.div key="export" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15 }}
            className="space-y-5"
          >
            <SubHeader title="Export Data" />

            <p className="text-[11px] text-slate-500 leading-relaxed -mt-2">
              Download a copy of all your data. The file is generated locally — nothing is uploaded.
            </p>

            {/* Format selector */}
            <section className="space-y-2">
              <SectionLabel>File format</SectionLabel>
              <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                {(['json', 'csv'] as const).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    className={cn(
                      'flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all',
                      exportFormat === fmt ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 px-0.5">
                {exportFormat === 'json'
                  ? 'Full export: goals, expenses, recurring, and settings. Can be used to restore data.'
                  : 'Expenses only, one row per transaction. Compatible with Excel and Google Sheets.'}
              </p>
            </section>

            {/* What's included */}
            <section className="space-y-2">
              <SectionLabel>Included in export</SectionLabel>
              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-sm overflow-hidden">
                {[
                  { label: 'Expenses', included: true },
                  { label: 'Savings goals', included: exportFormat === 'json' },
                  { label: 'Recurring expenses', included: exportFormat === 'json' },
                  { label: 'Settings & preferences', included: exportFormat === 'json' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm font-medium text-slate-700">{row.label}</span>
                    {row.included
                      ? <Check size={14} className="text-green-500" />
                      : <span className="text-[10px] text-slate-300 font-medium">not included</span>}
                  </div>
                ))}
              </div>
            </section>

            {/* Actions — confirm / cancel → file generated */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={back}
                className="px-5 h-12 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={triggerExport}
                className="flex-1 h-12 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-200 active:scale-[0.98] transition-all"
              >
                <Download size={15} />
                Export &amp; Download
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

// ── Helper components ────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">
      {children}
    </p>
  );
}

function NavRow({ label, detail, icon, onTap }: {
  label: string;
  detail?: string;
  icon?: React.ReactNode;
  onTap: () => void;
}) {
  return (
    <button
      onClick={onTap}
      className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
    >
      <div className="flex items-center gap-2.5">
        {icon}
        <span className="text-sm font-medium text-slate-800">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {detail && <span className="text-[11px] font-medium text-slate-400">{detail}</span>}
        <ChevronRight size={15} className="text-slate-300" />
      </div>
    </button>
  );
}
