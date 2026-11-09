import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  X, 
  Wallet, 
  ExternalLink,
  Coins,
  Sparkles,
  Eye,
  EyeOff,
  RotateCcw
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

const EXPENSE_PRESETS = [
  { label: '☕ Café', desc: 'Café', category: 'Alimentación / Comida' },
  { label: '🍔 Comida', desc: 'Comida / Almuerzo', category: 'Alimentación / Comida' },
  { label: '🚗 Transporte', desc: 'Transporte / Uber', category: 'Operaciones / Transporte' },
  { label: '🛒 Super', desc: 'Supermercado', category: 'Alimentación / Comida' },
  { label: '⚡ Servicio', desc: 'Pago de Servicio', category: 'Vivienda / Servicios' },
];

const INCOME_PRESETS = [
  { label: '💼 Cliente', desc: 'Cobro Cliente', category: 'Trabajo / Clientes' },
  { label: '📈 Venta', desc: 'Venta de Producto/Servicio', category: 'Ventas' },
  { label: '💰 Nómina', desc: 'Pago Nómina', category: 'Nómina / Salario' },
  { label: '🪙 Extra', desc: 'Ingreso Extra', category: 'Otros Ingresos' },
];

export const DailyFinanceModal: React.FC<DailyFinanceModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  tasks = [],
  onOpenStats,
}) => {
  const { expenses, setExpenses } = useAppStore();
  const [currencySymbol, setCurrency] = useState<string>(getSavedCurrencySymbol);
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('taskquest_finance_privacy_mode') === 'true';
    } catch {
      return false;
    }
  });

  // Form State
  const [entryType, setEntryType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>(FINANCE_EXPENSE_CATEGORIES[0]);

  // Undo deletion state
  const [recentlyDeleted, setRecentlyDeleted] = useState<FinancialTransaction | null>(null);
  const undoTimeoutRef = useRef<number | null>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // ESC key listener to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Listen to external currency & privacy changes
  useEffect(() => {
    const handleCurrencyEvent = (e: any) => {
      if (e?.detail) setCurrency(e.detail);
    };
    const handlePrivacyEvent = (e: any) => {
      if (typeof e?.detail === 'boolean') setIsPrivacyMode(e.detail);
    };

    window.addEventListener('taskquest:currency-change', handleCurrencyEvent);
    window.addEventListener('taskquest:finance-privacy-toggle', handlePrivacyEvent);
    return () => {
      window.removeEventListener('taskquest:currency-change', handleCurrencyEvent);
      window.removeEventListener('taskquest:finance-privacy-toggle', handlePrivacyEvent);
    };
  }, []);

  const togglePrivacyMode = () => {
    soundFX.playClick();
    const next = !isPrivacyMode;
    setIsPrivacyMode(next);
    try {
      localStorage.setItem('taskquest_finance_privacy_mode', String(next));
    } catch {}
    window.dispatchEvent(new CustomEvent('taskquest:finance-privacy-toggle', { detail: next }));
  };

  const renderAmount = (val: number, sign = '') => {
    if (isPrivacyMode) return `${sign}${currencySymbol} •••••`;
    return `${sign}${formatMoney(val, currencySymbol)}`;
  };

  const applyPreset = (preset: { desc: string; category: string }) => {
    soundFX.playClick();
    setDescription(preset.desc);
    setCategory(preset.category);
    amountInputRef.current?.focus();
  };

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
    const txToDelete = expenses.find((ex) => ex.id === id);
    if (!txToDelete) return;

    setRecentlyDeleted(txToDelete);
    setExpenses((prev) => prev.filter((ex) => ex.id !== id));

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = window.setTimeout(() => {
      setRecentlyDeleted(null);
    }, 5000);
  };

  const handleUndo = () => {
    if (!recentlyDeleted) return;
    soundFX.playCoin();
    setExpenses((prev) => [recentlyDeleted, ...prev]);
    setRecentlyDeleted(null);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90dvh] flex flex-col bg-[#030712]/95 border border-emerald-500/40 rounded-2xl sm:rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] relative text-left overflow-hidden backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grano esmerilado táctil Moxen Vidrio */}
        <span className="vi-grano opacity-5" aria-hidden="true" />

        {/* Luces de ambiente cyberpunk */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-white/10 bg-[#010810]/80 shrink-0 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-950 to-[#021510] border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35)] shrink-0">
              <Wallet className="w-5 h-5 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-anton tracking-wide text-white uppercase truncate flex items-center gap-2">
                <span>Tesorería Diaria</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-400/50 font-bold shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                  {formatDateForDisplay(currentDate)}
                </span>
              </h3>
              <p className="text-[11px] text-slate-300 font-mono truncate">
                Flujo de caja, balance y registro rápido de la jornada
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 ml-2 shrink-0">
            <button
              type="button"
              onClick={togglePrivacyMode}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                isPrivacyMode
                  ? 'bg-amber-950/70 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'bg-white/[0.04] hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
              }`}
              title={isPrivacyMode ? 'Mostrar montos (Modo Privacidad activo)' : 'Ocultar montos (Modo Privacidad)'}
              aria-label={isPrivacyMode ? 'Mostrar montos' : 'Ocultar montos'}
            >
              {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
              title="Cerrar modal (Esc)"
              aria-label="Cerrar modal de tesorería"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 relative z-10 custom-scrollbar">
          {/* SUMMARY METRICS ROW */}
          <div className="grid grid-cols-3 gap-2">
            {/* Ingresos */}
            <div className="p-3 rounded-2xl bg-[#001712]/90 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)] flex flex-col justify-between">
              <span className="text-[10px] uppercase font-anton tracking-wider text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Ingresos
              </span>
              <span className="text-sm sm:text-base font-anton font-black text-emerald-300 truncate mt-1.5 drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]">
                {renderAmount(totals.income, '+')}
              </span>
            </div>

            {/* Gastos (Naranja Furia Oficial) */}
            <div className="p-3 rounded-2xl bg-[#1a0700]/90 border border-orange-500/40 shadow-[0_0_15px_rgba(251,86,7,0.15)] flex flex-col justify-between">
              <span className="text-[10px] uppercase font-anton tracking-wider text-orange-400 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> Gastos
              </span>
              <span className="text-sm sm:text-base font-anton font-black text-orange-300 truncate mt-1.5 drop-shadow-[0_0_6px_rgba(251,86,7,0.4)]">
                {renderAmount(totals.expense, '-')}
              </span>
            </div>

            {/* Balance Neto */}
            <div className={`p-3 rounded-2xl border flex flex-col justify-between ${
              totals.balance > 0
                ? 'bg-emerald-950/70 border-emerald-400/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                : totals.balance < 0
                ? 'bg-orange-950/70 border-orange-400/60 text-orange-300 shadow-[0_0_15px_rgba(251,86,7,0.25)]'
                : 'bg-black/50 border-white/10 text-slate-300'
            }`}>
              <span className="text-[10px] uppercase font-anton tracking-wider text-slate-300">
                Balance Neto
              </span>
              <span className="text-sm sm:text-base font-anton font-black truncate mt-1.5">
                {renderAmount(totals.balance, totals.balance >= 0 ? '+' : '')}
              </span>
            </div>
          </div>

          {/* UNDO DELETION BANNER */}
          {recentlyDeleted && (
            <div className="p-2.5 rounded-xl bg-cyan-950/90 border border-cyan-400/60 flex items-center justify-between gap-2 text-xs text-cyan-200 animate-fadeIn shadow-[0_0_15px_rgba(0,240,255,0.25)]">
              <div className="flex items-center gap-2 truncate">
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">Movimiento eliminado: <strong>{recentlyDeleted.description}</strong></span>
              </div>
              <button
                type="button"
                onClick={handleUndo}
                className="px-2.5 py-1 rounded-lg bg-cyan-400 text-black font-anton tracking-wide uppercase hover:bg-cyan-300 transition cursor-pointer text-xs shrink-0 font-bold"
              >
                Deshacer
              </button>
            </div>
          )}

          {/* QUICK INPUT FORM */}
          <form
            onSubmit={handleSubmit}
            className="p-4 rounded-2xl bg-[#010a14]/90 border border-cyan-500/25 space-y-3 shadow-inner"
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
                  aria-pressed={entryType === 'income'}
                  aria-label="Registrar como ingreso"
                  className={`py-1.5 text-xs font-anton tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    entryType === 'income'
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.6)] font-bold'
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
                  aria-pressed={entryType === 'expense'}
                  aria-label="Registrar como gasto"
                  className={`py-1.5 text-xs font-anton tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    entryType === 'expense'
                      ? 'bg-gradient-to-r from-[#fb5607] to-orange-600 text-white shadow-[0_0_15px_rgba(251,86,7,0.6)] font-bold'
                      : 'text-slate-400 hover:text-orange-300'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Gasto</span>
                </button>
              </div>

              <span className="text-[10px] text-cyan-300 font-mono hidden sm:flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" /> Registro Express
              </span>
            </div>

            {/* Quick Concept Presets Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar text-[10px] font-mono">
              <span className="text-slate-400 shrink-0">Presets:</span>
              {(entryType === 'expense' ? EXPENSE_PRESETS : INCOME_PRESETS).map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-2 py-0.5 rounded-lg bg-black/60 border border-white/10 hover:border-cyan-400/50 text-slate-300 hover:text-white transition whitespace-nowrap cursor-pointer shrink-0"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              {/* Amount */}
              <div className="sm:col-span-4 relative">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-black ${
                  entryType === 'income' ? 'text-emerald-400' : 'text-orange-400'
                }`}>
                  {currencySymbol}
                </span>
                <input
                  ref={amountInputRef}
                  type="number"
                  step="any"
                  min="0.01"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  aria-label="Monto de la transacción"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/90 border border-white/15 focus:border-cyan-400 text-white font-mono text-xs focus:outline-none transition-colors placeholder:text-slate-500 focus:ring-1 focus:ring-cyan-400"
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
                  aria-label="Concepto de la transacción"
                  className="w-full px-3 py-2 rounded-xl bg-black/90 border border-white/15 focus:border-cyan-400 text-white text-xs focus:outline-none transition-colors placeholder:text-slate-500 focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              {/* Category */}
              <div className="sm:col-span-3">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  aria-label="Categoría financiera"
                  className="w-full px-2.5 py-2 rounded-xl bg-black/90 border border-white/15 focus:border-cyan-400 text-cyan-200 text-xs focus:outline-none transition-colors cursor-pointer"
                >
                  {(entryType === 'income' ? FINANCE_INCOME_CATEGORIES : FINANCE_EXPENSE_CATEGORIES).map((cat) => (
                    <option key={cat} value={cat} className="bg-black text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button (Chicle elástico & colores de marca) */}
            <button
              type="submit"
              aria-label={`Registrar ${entryType === 'income' ? 'Ingreso' : 'Gasto'}`}
              className={`chicle-btn w-full py-2.5 rounded-xl font-anton uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                entryType === 'income'
                  ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-400 text-black shadow-[0_0_18px_rgba(16,185,129,0.5)] border border-emerald-300'
                  : 'bg-gradient-to-r from-[#fb5607] to-orange-600 text-white shadow-[0_0_18px_rgba(251,86,7,0.5)] border border-orange-400'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Registrar {entryType === 'income' ? 'Ingreso' : 'Gasto'}</span>
            </button>
          </form>

          {/* DAY'S TRANSACTIONS LIST */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-anton uppercase tracking-wider text-slate-400 px-1">
              <span>Movimientos de Hoy ({dayTransactions.length})</span>
              {onOpenStats && (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    onOpenStats();
                  }}
                  className="text-cyan-400 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer transition-colors font-mono"
                >
                  <span>Ver Gráficos & Histórico</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            {dayTransactions.length === 0 ? (
              <div className="py-6 text-center rounded-2xl bg-black/40 border border-white/5 text-slate-400 text-xs font-mono">
                Sin movimientos financieros registrados para esta fecha.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {dayTransactions.map((tx) => {
                  const isInc = tx.type === 'income';
                  return (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between gap-2 hover:border-cyan-500/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                            isInc
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/50'
                              : 'bg-orange-950/80 text-orange-400 border border-orange-500/50'
                          }`}
                        >
                          {isInc ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{tx.description}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                            <span className={isInc ? 'text-emerald-400/80' : 'text-orange-400/80'}>{tx.category}</span>
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
                            isInc ? 'text-emerald-400' : 'text-orange-400'
                          }`}
                        >
                          {renderAmount(tx.amount, isInc ? '+' : '-')}
                        </span>
                        {!tx.isTaskIncome && (
                          <button
                            type="button"
                            onClick={() => handleDelete(tx.id)}
                            className="p-1 text-slate-400 hover:text-orange-400 transition-colors cursor-pointer"
                            title="Eliminar movimiento"
                            aria-label={`Eliminar movimiento: ${tx.description}`}
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
