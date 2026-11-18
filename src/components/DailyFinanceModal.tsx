import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  RotateCcw,
  Mic,
  MicOff,
  Check
} from 'lucide-react';
import { TaskItem, FinancialTransaction } from '../types';
import { useAppStore } from '../store/useAppStore';
import { useUIStore } from '../store/useUIStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { 
  formatMoney, 
  getSavedCurrencySymbol, 
  FINANCE_INCOME_CATEGORIES, 
  FINANCE_EXPENSE_CATEGORIES,
  calculateDayFinanceTotals
} from '../utils/finance';
import { formatDateForDisplay } from '../utils/date';
import { soundFX } from '../utils/audio';
import {
  createVoiceRecognizer,
  isSpeechRecognitionSupported,
  ParsedVoiceFinanceEntry,
  VoiceRecognizerController,
} from '../utils/speechRecognition';
import { parseVoiceFinanceWithAI } from '../services/aiService';
import { speakKaiDialogue, stopKaiDialogue } from '../utils/voice';

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
  const soundEnabled = useUIStore((s) => s.soundEnabled);
  const kaiMood = usePlayerStore((s) => s.stats?.kaiCustomForm?.mood || 'stoic');
  const kaiName = usePlayerStore((s) => s.stats?.kaiCustomForm?.name || 'KAI');
  const [currencySymbol, setCurrency] = useState<string>(getSavedCurrencySymbol);

  // Voice Finance State
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isVoiceParsing, setIsVoiceParsing] = useState(false);
  const [voiceEntries, setVoiceEntries] = useState<ParsedVoiceFinanceEntry[]>([]);
  const [voiceReply, setVoiceReply] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const voiceRecRef = useRef<VoiceRecognizerController | null>(null);
  const voiceTranscriptRef = useRef('');

  useEffect(() => {
    voiceTranscriptRef.current = voiceTranscript;
  }, [voiceTranscript]);

  useEffect(() => {
    if (!isOpen) {
      voiceRecRef.current?.abort();
      voiceRecRef.current = null;
      setIsVoiceListening(false);
      setShowVoicePanel(false);
      setVoiceTranscript('');
      setVoiceEntries([]);
      setVoiceReply(null);
      setVoiceError(null);
    }
    return () => {
      voiceRecRef.current?.abort();
      voiceRecRef.current = null;
    };
  }, [isOpen]);

  const runVoiceFinanceParse = async (textOverride?: string) => {
    const txt = (textOverride ?? voiceTranscriptRef.current).trim();
    if (!txt) return;
    setIsVoiceParsing(true);
    setVoiceError(null);
    try {
      const res = await parseVoiceFinanceWithAI({ transcript: txt, kaiName });
      setVoiceEntries(res.entries);
      setVoiceReply(res.kaiReply);
      if (res.entries.length === 0) {
        setVoiceError('No detecté un monto claro. Ej: "Gasté 180 en comida y recibí 1500 de un cliente".');
      }
    } finally {
      setIsVoiceParsing(false);
    }
  };

  const handleToggleFinanceVoice = () => {
    soundFX.playClick();
    setVoiceError(null);

    if (isVoiceListening) {
      voiceRecRef.current?.stop();
      voiceRecRef.current = null;
      setIsVoiceListening(false);
      setTimeout(() => {
        if (voiceTranscriptRef.current.trim().length >= 3) {
          void runVoiceFinanceParse(voiceTranscriptRef.current);
        }
      }, 280);
      return;
    }

    setShowVoicePanel(true);
    setVoiceEntries([]);
    setVoiceReply(null);

    if (!isSpeechRecognitionSupported()) {
      return;
    }

    stopKaiDialogue();
    const rec = createVoiceRecognizer({
      onInterim: (live) => {
        setVoiceTranscript(live);
        voiceTranscriptRef.current = live;
      },
      onFinal: (fin) => {
        setVoiceTranscript(fin);
        voiceTranscriptRef.current = fin;
      },
      onError: (msg) => {
        setVoiceError(msg);
        setIsVoiceListening(false);
        voiceRecRef.current = null;
      },
      onEnd: () => {
        setIsVoiceListening(false);
        voiceRecRef.current = null;
      },
    });
    if (rec) {
      voiceRecRef.current = rec;
      setIsVoiceListening(true);
      rec.start();
    }
  };

  const handleSaveVoiceEntries = () => {
    if (voiceEntries.length === 0) return;
    soundFX.playCoin();
    const nowIso = new Date().toISOString();
    const nowTs = Date.now();
    const newTxs: FinancialTransaction[] = voiceEntries.map((entry, idx) => ({
      id: `tx-voice-${nowTs}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      date: currentDate,
      type: entry.type,
      description: entry.description,
      amount: entry.amount,
      category: entry.category,
      createdAt: nowIso,
    }));

    setExpenses((prev) => [...newTxs, ...prev]);

    const msg =
      newTxs.length === 1
        ? `Movimiento registrado: ${newTxs[0].description}.`
        : `${newTxs.length} movimientos registrados en tu tesorería.`;
    if (soundEnabled) {
      speakKaiDialogue(msg, kaiMood);
    }

    setVoiceEntries([]);
    setVoiceTranscript('');
    voiceTranscriptRef.current = '';
    setVoiceReply(null);
    setShowVoicePanel(false);
  };
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

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tesorería Diaria"
      className="fixed inset-0 z-[170] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in portal-modal-root"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90dvh] flex flex-col relative isolate bg-[#030712]/[0.98] border border-white/10 rounded-2xl sm:rounded-3xl shadow-[0_20px_55px_rgba(0,0,0,0.85),0_0_32px_rgba(var(--aura-glow-rgb,0,240,255),0.14),inset_0_1px_0_rgba(255,255,255,0.12)] text-left overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grano esmerilado táctil Moxen Vidrio */}
        <span className="vi-grano opacity-5" aria-hidden="true" />
        {/* Filamento especular superior sincronizado con Aura */}
        <div className="absolute top-0 inset-x-0 h-px aura-top-filament pointer-events-none" aria-hidden="true" />

        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-white/10 bg-[#040814]/[0.96] shrink-0 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl aura-bg-soft border flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-anton tracking-wide text-white uppercase truncate flex items-center gap-2">
                <span>Tesorería Diaria</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full aura-bg-soft border font-bold shrink-0">
                  {formatDateForDisplay(currentDate)}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-sans truncate">
                Flujo de caja, balance y registro rápido de la jornada
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 ml-2 shrink-0">
            <button
              type="button"
              onClick={togglePrivacyMode}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                isPrivacyMode
                  ? 'bg-amber-950/60 border-amber-400/60 text-amber-300 optic-active-card'
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
              className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
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
            <div className="p-3 rounded-2xl bg-[#040a1a]/[0.94] border border-emerald-500/30 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-anton tracking-wider text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Ingresos
              </span>
              <span className="text-sm sm:text-base font-mono font-bold tabular-nums text-emerald-300 truncate mt-1.5">
                {renderAmount(totals.income, '+')}
              </span>
            </div>

            {/* Gastos */}
            <div className="p-3 rounded-2xl bg-[#040a1a]/[0.94] border border-orange-500/30 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-anton tracking-wider text-orange-400 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> Gastos
              </span>
              <span className="text-sm sm:text-base font-mono font-bold tabular-nums text-orange-300 truncate mt-1.5">
                {renderAmount(totals.expense, '-')}
              </span>
            </div>

            {/* Balance Neto */}
            <div className={`p-3 rounded-2xl bg-[#040a1a]/[0.94] border flex flex-col justify-between ${
              totals.balance > 0
                ? 'border-emerald-400/50 text-emerald-300'
                : totals.balance < 0
                ? 'border-orange-400/50 text-orange-300'
                : 'border-white/10 text-slate-300'
            }`}>
              <span className="text-[10px] uppercase font-anton tracking-wider text-slate-300">
                Balance Neto
              </span>
              <span className="text-sm sm:text-base font-mono font-bold tabular-nums truncate mt-1.5">
                {renderAmount(totals.balance, totals.balance >= 0 ? '+' : '')}
              </span>
            </div>
          </div>

          {/* UNDO DELETION BANNER */}
          {recentlyDeleted && (
            <div className="p-2.5 rounded-xl aura-bg-soft border flex items-center justify-between gap-2 text-xs animate-fadeIn">
              <div className="flex items-center gap-2 truncate">
                <RotateCcw className="w-3.5 h-3.5 aura-text-primary shrink-0" />
                <span className="truncate">Movimiento eliminado: <strong>{recentlyDeleted.description}</strong></span>
              </div>
              <button
                type="button"
                onClick={handleUndo}
                className="chicle-btn px-2.5 py-1 rounded-lg aura-btn-gradient font-anton tracking-wide uppercase transition cursor-pointer text-xs shrink-0"
              >
                Deshacer
              </button>
            </div>
          )}

          {/* QUICK INPUT FORM */}
          <form
            onSubmit={handleSubmit}
            className="p-4 rounded-2xl bg-[#040a1a]/[0.94] border border-white/10 space-y-3"
          >
            {/* Toggle Income vs Expense */}
            <div className="flex items-center justify-between gap-2">
              <div className="grid grid-cols-2 p-1 rounded-xl bg-black/70 border border-white/10 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setEntryType('income');
                  }}
                  aria-pressed={entryType === 'income'}
                  aria-label="Registrar como ingreso"
                  className={`py-1.5 text-xs font-anton tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                    entryType === 'income'
                      ? 'bg-emerald-400 text-[#030712] optic-active-card'
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
                  className={`py-1.5 text-xs font-anton tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                    entryType === 'expense'
                      ? 'bg-gradient-to-r from-[#fb5607] to-orange-500 text-white optic-active-card'
                      : 'text-slate-400 hover:text-orange-300'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Gasto</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleToggleFinanceVoice}
                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-anton uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95 ${
                  isVoiceListening
                    ? 'bg-rose-500/25 border-rose-400 text-rose-200 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                    : 'bg-fuchsia-950/60 hover:bg-fuchsia-900/70 border-fuchsia-400/50 text-fuchsia-200 shadow-[0_0_10px_rgba(217,70,239,0.2)]'
                }`}
                title='Dictar gastos o ingresos por voz (ej: "Gasté 180 en comida")'
              >
                {isVoiceListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isVoiceListening ? 'Detener' : 'Dictar'}</span>
              </button>
            </div>

            {/* Panel Inline de Finanzas por Voz */}
            {showVoicePanel && (
              <div className="p-3 rounded-xl bg-fuchsia-950/20 border border-fuchsia-400/35 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-fuchsia-300 flex items-center gap-1.5">
                    <Sparkles className={`w-3 h-3 ${isVoiceParsing ? 'animate-spin' : ''}`} />
                    {isVoiceListening
                      ? 'Escuchando movimientos... toca Detener al terminar'
                      : isVoiceParsing
                        ? 'KAI separando montos y categorías...'
                        : 'Dictado Financiero Rápido'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      voiceRecRef.current?.stop();
                      setIsVoiceListening(false);
                      setShowVoicePanel(false);
                    }}
                    className="text-slate-400 hover:text-white text-xs cursor-pointer"
                    aria-label="Cerrar dictado financiero"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={voiceTranscript}
                    onChange={(e) => {
                      setVoiceTranscript(e.target.value);
                      voiceTranscriptRef.current = e.target.value;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void runVoiceFinanceParse();
                      }
                    }}
                    placeholder='Ej: "Gasté 180 en comida y recibí 1500 de un cliente"'
                    className="flex-1 bg-black/60 border border-white/15 focus:border-fuchsia-400/70 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
                  />
                  {!isVoiceListening && voiceTranscript.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => void runVoiceFinanceParse()}
                      disabled={isVoiceParsing}
                      className="px-2.5 py-1.5 rounded-lg bg-fuchsia-500/25 hover:bg-fuchsia-500/40 border border-fuchsia-400/60 text-fuchsia-100 text-[11px] font-mono font-bold cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      Analizar
                    </button>
                  )}
                </div>

                {voiceError && (
                  <p className="text-[11px] text-rose-300 font-mono">{voiceError}</p>
                )}

                {voiceReply && voiceEntries.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-cyan-200 italic">“{voiceReply}”</p>
                    <div className="space-y-1.5">
                      {voiceEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${
                            entry.type === 'income'
                              ? 'bg-emerald-950/40 border-emerald-500/40'
                              : 'bg-orange-950/40 border-orange-500/40'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-white truncate block">{entry.description}</span>
                            <span className="text-[10px] font-mono text-slate-300">{entry.category}</span>
                          </div>
                          <span className={`font-anton text-xs shrink-0 ${entry.type === 'income' ? 'text-emerald-300' : 'text-orange-300'}`}>
                            {entry.type === 'income' ? '+' : '-'}{formatMoney(entry.amount, currencySymbol)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setVoiceEntries((prev) => prev.filter((x) => x.id !== entry.id))}
                            className="text-slate-400 hover:text-rose-300 p-0.5 cursor-pointer"
                            aria-label="Quitar movimiento"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveVoiceEntries}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-anton uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer active:scale-[0.98]"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Registrar {voiceEntries.length} {voiceEntries.length === 1 ? 'movimiento' : 'movimientos'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

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
                              <span className="text-[10px] px-1.5 py-0.5 rounded aura-bg-soft border">
                                Misión
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`font-mono tabular-nums text-xs font-black ${
                            isInc ? 'text-emerald-400' : 'text-orange-400'
                          }`}
                        >
                          {renderAmount(tx.amount, isInc ? '+' : '-')}
                        </span>
                        {!tx.isTaskIncome && (
                          <button
                            type="button"
                            onClick={() => handleDelete(tx.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-orange-400 hover:bg-white/[0.06] transition-colors cursor-pointer"
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
    </div>,
    document.body
  );
};

export default DailyFinanceModal;
