import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Coins, 
  CheckCircle2, 
  ExternalLink,
  Wallet
} from 'lucide-react';
import { TaskItem, FinancialTransaction } from '../types';
import { useAppStore } from '../store/useAppStore';
import { 
  formatMoney, 
  getSavedCurrencySymbol, 
  FINANCE_INCOME_CATEGORIES, 
  FINANCE_EXPENSE_CATEGORIES 
} from '../utils/finance';
import { soundFX } from '../utils/audio';

interface DailyFinanceWidgetProps {
  currentDate: string; // YYYY-MM-DD
  tasks?: TaskItem[];
  onOpenStats?: () => void;
}

export const DailyFinanceWidget: React.FC<DailyFinanceWidgetProps> = ({
  currentDate,
  tasks = [],
  onOpenStats,
}) => {
  const { expenses, setExpenses } = useAppStore();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('taskquest_daily_finance_collapsed');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  const [currencySymbol, setCurrency] = useState<string>(getSavedCurrencySymbol);

  // Form State
  const [entryType, setEntryType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>(FINANCE_EXPENSE_CATEGORIES[0]);

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

  const toggleCollapse = () => {
    soundFX.playClick();
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem('taskquest_daily_finance_collapsed', String(next));
    } catch {
      // ignore
    }
  };

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

  // Totals for this date
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    dayTransactions.forEach((t) => {
      if (t.type === 'income') {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    });
    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [dayTransactions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;
    if (!description.trim()) return;

    soundFX.playCoin();

    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
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

  return (
    <div className="scifi-glass-panel rounded-2xl relative overflow-hidden transition-all duration-300 text-white">
      {/* Background Neon Accent Glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* COMPACT 1-LINE HEADER & METRICS BAR */}
      <div
        onClick={toggleCollapse}
        className={`px-3.5 py-2.5 sm:px-4 flex flex-wrap items-center justify-between gap-2 cursor-pointer hover:bg-white/[0.02] transition-colors ${
          !isCollapsed ? 'border-b border-cyan-500/30' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#04020e] border border-emerald-400/70 flex items-center justify-center text-emerald-400">
            <Wallet className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black font-anton text-white uppercase tracking-wider">
            Tesorería
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono ml-auto">
          <span className="text-emerald-400 font-bold flex items-center gap-1" title="Ingresos del día">
            <TrendingUp className="w-3 h-3" />
            +{formatMoney(totals.income, currencySymbol)}
          </span>
          <span className="text-rose-400 font-bold flex items-center gap-1" title="Gastos del día">
            <TrendingDown className="w-3 h-3" />
            -{formatMoney(totals.expense, currencySymbol)}
          </span>
          <span
            className={`font-black px-2 py-0.5 rounded-md border text-[11px] ${
              totals.balance > 0
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : totals.balance < 0
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                : 'bg-black/40 border-white/10 text-slate-300'
            }`}
            title="Flujo Neto"
          >
            {totals.balance >= 0 ? '+' : ''}
            {formatMoney(totals.balance, currencySymbol)}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapse();
            }}
            className="p-1 rounded-lg bg-[#04020e] border border-cyan-500/40 text-cyan-300 hover:text-white transition-colors cursor-pointer"
            title={isCollapsed ? 'Registrar ingreso o gasto' : 'Minimizar'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* EXPANDED CONTENT */}
      {!isCollapsed && (
        <div className="p-3.5 sm:p-4 space-y-4">
          {/* QUICK INPUT FORM */}
          <form
            onSubmit={handleSubmit}
            className="p-3 rounded-xl bg-[#04020e]/90 border border-cyan-500/30 space-y-2.5"
          >
            {/* Toggle Income vs Expense */}
            <div className="flex items-center gap-2">
              <div className="grid grid-cols-2 p-0.5 rounded-lg bg-black/80 border border-cyan-500/30 flex-1 max-w-xs">
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setEntryType('income');
                  }}
                  className={`py-1 text-xs font-black uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    entryType === 'income'
                      ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                      : 'text-slate-400 hover:text-emerald-300'
                  }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  <span>+ Ingreso</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setEntryType('expense');
                  }}
                  className={`py-1 text-xs font-black uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    entryType === 'expense'
                      ? 'bg-rose-600 text-white shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                      : 'text-slate-400 hover:text-rose-300'
                  }`}
                >
                  <TrendingDown className="w-3 h-3" />
                  <span>- Gasto</span>
                </button>
              </div>

              <span className="text-[10px] text-cyan-300/80 font-mono hidden sm:inline">
                Registro rápido
              </span>
            </div>

            {/* Inputs Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              {/* Amount */}
              <div className="sm:col-span-4 relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-cyan-300">
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
                  className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-black/90 border border-cyan-500/40 text-white font-mono text-xs focus:outline-none focus:border-emerald-400 transition-colors placeholder:text-slate-500"
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
                  className="w-full px-3 py-1.5 rounded-lg bg-black/90 border border-cyan-500/40 text-white text-xs focus:outline-none focus:border-emerald-400 transition-colors placeholder:text-slate-500"
                />
              </div>

              {/* Category */}
              <div className="sm:col-span-3">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-black/90 border border-cyan-500/40 text-cyan-200 text-xs focus:outline-none focus:border-emerald-400 transition-colors cursor-pointer"
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
              className={`w-full py-1.5 rounded-lg font-black uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                entryType === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar {entryType === 'income' ? 'Ingreso' : 'Gasto'}</span>
            </button>
          </form>

          {/* DAY'S TRANSACTIONS LIST */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-cyan-300/80 px-1">
              <span>Movimientos de la Jornada ({dayTransactions.length})</span>
              {onOpenStats && (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    onOpenStats();
                  }}
                  className="text-cyan-400 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Análisis Histórico</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            {dayTransactions.length === 0 ? (
              <div className="py-4 text-center rounded-xl bg-[#04020e]/60 border border-cyan-500/20 text-slate-400 text-xs">
                Sin movimientos financieros registrados para esta fecha.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {dayTransactions.map((tx) => {
                  const isInc = tx.type === 'income';
                  return (
                    <div
                      key={tx.id}
                      className="p-2 rounded-xl bg-[#04020e]/80 border border-cyan-500/30 flex items-center justify-between gap-2 hover:border-cyan-400/60 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                            isInc
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/50'
                              : 'bg-rose-950 text-rose-400 border border-rose-500/50'
                          }`}
                        >
                          {isInc ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                            <span>{tx.description}</span>
                            {tx.isTaskIncome && (
                              <span className="text-[9px] font-mono px-1 py-0.1 rounded bg-blue-950 text-blue-300 border border-blue-600/50">
                                Misión
                              </span>
                            )}
                          </p>
                          <span className="text-[10px] text-cyan-300/70 font-medium">
                            {tx.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs font-mono font-black ${
                            isInc ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isInc ? '+' : '-'}
                          {formatMoney(tx.amount, currencySymbol)}
                        </span>

                        {!tx.isTaskIncome && (
                          <button
                            type="button"
                            onClick={() => handleDelete(tx.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
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
      )}
    </div>
  );
};
