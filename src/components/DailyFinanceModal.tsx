import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  X, 
  Wallet, 
  ExternalLink,
  Coins,
  CheckCircle2
} from 'lucide-react';
import { TaskItem, FinancialTransaction } from '../types';
import { useAppStore } from '../store/useAppStore';
import { 
  formatMoney, 
  getSavedCurrencySymbol, 
  FINANCE_INCOME_CATEGORIES, 
  FINANCE_EXPENSE_CATEGORIES,
  calculateDayFinanceTotals
} from '../utils/finance';
import { formatDateForDisplay } from '../utils/date';
import { soundFX } from '../utils/audio';

interface DailyFinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string; // YYYY-MM-DD
  tasks?: TaskItem[];
  onOpenStats?: () => void;
}

export const DailyFinanceModal: React.FC<DailyFinanceModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  tasks = [],
  onOpenStats,
}) => {
  const { expenses, setExpenses } = useAppStore();
  const [currencySymbol, setCurrency] = useState<string>(getSavedCurrencySymbol);

  // Form State
  const [entryType, setEntryType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>(FINANCE_EXPENSE_CATEGORIES[0]);

  // ESC key listener to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Listen to external currency changes
  useEffect(() => {
    const handleCurrencyEvent = (e: any) => {
      if (e?.detail) setCurrency(e.detail);
    };
    window.addEventListener('taskquest:currency-change', handleCurrencyEvent);
    return () => window.removeEventListener('taskquest:currency-change', handleCurrencyEvent);
  }, []);

  // Update default category when switching type
  useEffect(() => {
    if (entryType === 'income') {
      setCategory(FINANCE_INCOME_CATEGORIES[0]);
    } else {
      setCategory(FINANCE_EXPENSE_CATEGORIES[0]);
    }
  }, [entryType]);

  // Compile transactions for current view date
  const dayTransactions = useMemo(() => {
    const list: {
      id: string;
      type: 'income' | 'expense';
      description: string;
      amount: number;
      category: string;
      isTaskIncome?: boolean;
    }[] = [];

    // 1. Manual entries for this date
    expenses.forEach((ex) => {
      if (ex.date === currentDate) {
        list.push({
          id: ex.id,
          type: ex.type || 'expense',
          description: ex.description,
          amount: Number(ex.amount) || 0,
          category: ex.category || (ex.type === 'income' ? 'Otros Ingresos' : 'Otros Gastos'),
          isTaskIncome: false,
        });
      }
    });

    // 2. Completed task rewards with incomeAmount for this date
    tasks.forEach((t) => {
      if (t.completed && t.incomeAmount && t.incomeAmount > 0) {
        const taskDate = t.completedAt ? t.completedAt.split('T')[0] : currentDate;
        if (taskDate === currentDate) {
          list.push({
            id: `task-income-${t.id}`,
            type: 'income',
            description: t.title,
            amount: t.incomeAmount,
            category: 'Misión Cumplida',
            isTaskIncome: true,
          });
        }
      }
    });

    return list;
  }, [expenses, tasks, currentDate]);

  const totals = useMemo(() => {
    return calculateDayFinanceTotals(currentDate, expenses, tasks);
  }, [currentDate, expenses, tasks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;
    if (!description.trim()) return;

    soundFX.playCoin();

    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      date: currentDate,
      type: entryType,
      description: description.trim(),
      amount: Math.round(numAmount * 100) / 100,
      category: category || (entryType === 'income' ? 'Ingreso General' : 'Gasto General'),
      createdAt: new Date().toISOString(),
    };

    setExpenses((prev) => [newTx, ...prev]);

    // Reset inputs
    setAmount('');
    setDescription('');
  };

  const handleDelete = (id: string) => {
    soundFX.playClick();
    setExpenses((prev) => prev.filter((ex) => ex.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90dvh] flex flex-col bg-[#020b14]/95 border border-emerald-500/40 rounded-2xl sm:rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.25)] relative text-left overflow-hidden backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow corner ambient effect */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-emerald-500/30 bg-[#01070e] shrink-0 relative z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)] shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-anton tracking-wide text-white uppercase truncate flex items-center gap-2">
                <span>Tesorería Diaria</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold shrink-0">
                  {formatDateForDisplay(currentDate)}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                Flujo de caja, ingresos y control de gastos de la jornada
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-black/50 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
            title="Cerrar modal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 relative z-10 custom-scrollbar">
          {/* SUMMARY METRICS ROW */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-[#03131c]/80 border border-emerald-500/30 flex flex-col">
              <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Ingresos
              </span>
              <span className="text-xs sm:text-sm font-mono font-black text-emerald-300 truncate mt-1">
                +{formatMoney(totals.income, currencySymbol)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#170509]/80 border border-rose-500/30 flex flex-col">
              <span className="text-[10px] uppercase font-mono text-rose-400 font-bold flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> Gastos
              </span>
              <span className="text-xs sm:text-sm font-mono font-black text-rose-300 truncate mt-1">
                -{formatMoney(totals.expense, currencySymbol)}
              </span>
            </div>

            <div className={`p-2.5 rounded-xl border flex flex-col ${
              totals.balance > 0
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : totals.balance < 0
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                : 'bg-black/50 border-white/10 text-slate-300'
            }`}>
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">
                Balance Neto
              </span>
              <span className="text-xs sm:text-sm font-mono font-black truncate mt-1">
                {totals.balance >= 0 ? '+' : ''}{formatMoney(totals.balance, currencySymbol)}
              </span>
            </div>
          </div>

          {/* QUICK INPUT FORM */}
          <form
            onSubmit={handleSubmit}
            className="p-3.5 rounded-2xl bg-[#010810]/90 border border-emerald-500/30 space-y-3 shadow-inner"
          >
            {/* Toggle Income vs Expense */}
            <div className="flex items-center justify-between gap-2">
              <div className="grid grid-cols-2 p-1 rounded-xl bg-black/80 border border-white/10 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setEntryType('income');
                  }}
                  className={`py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    entryType === 'income'
                      ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                      : 'text-slate-400 hover:text-emerald-300'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Ingreso</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setEntryType('expense');
                  }}
                  className={`py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    entryType === 'expense'
                      ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                      : 'text-slate-400 hover:text-rose-300'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Gasto</span>
                </button>
              </div>

              <span className="text-[10px] text-emerald-400/80 font-mono hidden sm:inline">
                Registro Express
              </span>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              {/* Amount */}
              <div className="sm:col-span-4 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-emerald-400">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/90 border border-emerald-500/40 text-white font-mono text-xs focus:outline-none focus:border-emerald-400 transition-colors placeholder:text-slate-600"
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-5">
                <input
                  type="text"
                  required
                  placeholder={entryType === 'income' ? 'Concepto (ej. Cobro Cliente A)' : 'Concepto (ej. Almuerzo, Uber)'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/90 border border-emerald-500/40 text-white text-xs focus:outline-none focus:border-emerald-400 transition-colors placeholder:text-slate-600"
                />
              </div>

              {/* Category */}
              <div className="sm:col-span-3">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-black/90 border border-emerald-500/40 text-emerald-200 text-xs focus:outline-none focus:border-emerald-400 transition-colors cursor-pointer"
                >
                  {(entryType === 'income' ? FINANCE_INCOME_CATEGORIES : FINANCE_EXPENSE_CATEGORIES).map((cat) => (
                    <option key={cat} value={cat} className="bg-black text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`chicle-btn w-full py-2 rounded-xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                entryType === 'income'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Registrar {entryType === 'income' ? 'Ingreso' : 'Gasto'}</span>
            </button>
          </form>

          {/* DAY'S TRANSACTIONS LIST */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">
              <span>Movimientos de Hoy ({dayTransactions.length})</span>
              {onOpenStats && (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    onOpenStats();
                  }}
                  className="text-emerald-400 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Ver Gráficos & Histórico</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            {dayTransactions.length === 0 ? (
              <div className="py-6 text-center rounded-2xl bg-[#010810]/60 border border-white/5 text-slate-400 text-xs">
                Sin movimientos financieros registrados para esta fecha.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {dayTransactions.map((tx) => {
                  const isInc = tx.type === 'income';
                  return (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-xl bg-[#010810]/80 border border-white/10 flex items-center justify-between gap-2 hover:border-emerald-500/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                            isInc
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/50'
                              : 'bg-rose-950/80 text-rose-400 border border-rose-700/50'
                          }`}
                        >
                          {isInc ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{tx.description}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                            <span className="text-emerald-400/80">{tx.category}</span>
                            {tx.isTaskIncome && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                                Misión
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`font-mono text-xs font-black ${
                            isInc ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isInc ? '+' : '-'}{formatMoney(tx.amount, currencySymbol)}
                        </span>
                        {!tx.isTaskIncome && (
                          <button
                            type="button"
                            onClick={() => handleDelete(tx.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Eliminar movimiento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyFinanceModal;
