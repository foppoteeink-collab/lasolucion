import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Calendar, 
  FileText, 
  Edit3, 
  CheckCircle2, 
  Sparkles, 
  Tag, 
  X,
  ChevronRight,
  MessageSquarePlus,
  Brain,
  FileDown,
  Mic,
  MicOff,
  Volume2
} from 'lucide-react';
import { TaskItem, TaskCategory, PlayerStats, RecallItem } from '../types';
import { soundFX } from '../utils/audio';
import {
  createVoiceRecognizer,
  isSpeechRecognitionSupported,
  VoiceRecognizerController,
} from '../utils/speechRecognition';
import { speakKaiDialogue, stopKaiDialogue } from '../utils/voice';
import { getTodayDateString, addDaysToDateString } from '../utils/date';
import { loadSavedStats, safeGetItem, safeSetItem } from '../utils/storage';
import { 
  loadRecallItems, 
  saveRecallItems, 
  syncRecallWithTaskNotes, 
  RECALL_LEVEL_LABELS 
} from '../utils/recall';
import { SmartRecallModal } from './SmartRecallModal';
import { WeeklyReportModal } from './WeeklyReportModal';
import { ScrollReveal } from './common/ScrollReveal';
import { TabHeader } from './common/TabHeader';
import { useTaskStore } from '../store/useTaskStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { generateKaiBitacoraAdvice } from '../services/aiService';

interface JournalViewProps {
  tasksByDate?: Record<string, TaskItem[]>;
  stats?: PlayerStats;
  currentDate?: string;
  reflections?: Record<string, string>;
  onSaveReflection?: (date: string, reflection: string) => void;
  onUpdateTaskNote: (date: string, taskId: string, newNote: string | undefined) => void;
  onNavigateToDay: (date: string) => void;
  onBackToMissions: () => void;
  onAddRecallAsTask?: (recallItem: RecallItem) => void;
  onRewardEarned?: (xp: number, coins: number, text?: string) => void;
}

const CATEGORY_LABELS: Record<TaskCategory, { label: string; textClass: string }> = {
  clientes: { label: 'Clientes', textClass: 'text-emerald-400' },
  entrenamiento: { label: 'Entreno', textClass: 'text-rose-400' },
  estudio: { label: 'Estudio', textClass: 'text-purple-400' },
  creativo: { label: 'Creativo', textClass: 'text-pink-400' },
  trabajo: { label: 'Trabajo', textClass: 'text-sky-400' },
  comida: { label: 'Comida', textClass: 'text-amber-400' },
  limpieza: { label: 'Limpieza', textClass: 'text-teal-400' },
  pomodoro: { label: 'Foco', textClass: 'text-rose-400' },
  rutina: { label: 'Rutina', textClass: 'text-slate-400' },
  habito: { label: 'Hábito', textClass: 'text-cyan-400' },
};

export const JournalView: React.FC<JournalViewProps> = ({
  tasksByDate: propTasksByDate,
  stats,
  currentDate,
  reflections: propReflections,
  onSaveReflection: propOnSaveReflection,
  onUpdateTaskNote,
  onNavigateToDay,
  onBackToMissions,
  onAddRecallAsTask,
  onRewardEarned,
}) => {
  const storeTasksByDate = useTaskStore((s) => s.tasksByDate);
  const tasksByDate = propTasksByDate || storeTasksByDate;
  const activeStats = useMemo(() => stats || loadSavedStats(), [stats]);
  const activeDate = currentDate || getTodayDateString();

  // Smart Recall State & Auto-sync
  const [recallItems, setRecallItems] = useState<RecallItem[]>(() => {
    const stored = loadRecallItems();
    return syncRecallWithTaskNotes(tasksByDate, stored);
  });
  const [isRecallOpen, setIsRecallOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Sync recall whenever tasksByDate changes
  React.useEffect(() => {
    setRecallItems((prev) => syncRecallWithTaskNotes(tasksByDate, prev));
  }, [tasksByDate]);

  const dueRecallCount = useMemo(() => {
    return recallItems.filter((item) => item.nextReviewDate <= activeDate).length;
  }, [recallItems, activeDate]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'7' | '14' | '30' | 'all'>('7');
  const [onlyWithNotes, setOnlyWithNotes] = useState<boolean>(true);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const activeFiltersCount = (selectedCategory !== 'all' ? 1 : 0) + (dateRange !== '7' ? 1 : 0) + (!onlyWithNotes ? 1 : 0);

  // Inline Note Editor State
  const [editingTask, setEditingTask] = useState<{ date: string; task: TaskItem } | null>(null);
  const [editText, setEditText] = useState('');
  const [editingReflectionDate, setEditingReflectionDate] = useState<string | null>(null);
  const [reflectionText, setReflectionText] = useState('');
  const [dictatingTarget, setDictatingTarget] = useState<'reflection' | 'note' | null>(null);
  const [speakingDate, setSpeakingDate] = useState<string | null>(null);
  const [isGeneratingKaiAdvice, setIsGeneratingKaiAdvice] = useState<string | null>(null);
  const setPlayerStats = usePlayerStore((s) => s.setStats);
  const kaiName = activeStats?.kaiName || activeStats?.kaiCustomForm?.name || 'KAI';
  const voiceRecRef = React.useRef<VoiceRecognizerController | null>(null);

  const stopJournalDictation = React.useCallback(() => {
    if (voiceRecRef.current) {
      voiceRecRef.current.stop();
      voiceRecRef.current = null;
    }
    setDictatingTarget(null);
  }, []);

  const toggleJournalDictation = React.useCallback(
    (target: 'reflection' | 'note') => {
      soundFX.playClick();
      if (dictatingTarget === target) {
        stopJournalDictation();
        return;
      }
      stopJournalDictation();
      stopKaiDialogue();

      const basePrefix = (target === 'reflection' ? reflectionText : editText).trim();
      const rec = createVoiceRecognizer({
        onInterim: (live) => {
          const combined = basePrefix ? `${basePrefix} ${live}` : live;
          if (target === 'reflection') setReflectionText(combined);
          else setEditText(combined);
        },
        onFinal: (fin) => {
          const combined = basePrefix ? `${basePrefix} ${fin}` : fin;
          if (target === 'reflection') setReflectionText(combined);
          else setEditText(combined);
        },
        onError: () => {
          setDictatingTarget(null);
          voiceRecRef.current = null;
        },
        onEnd: () => {
          setDictatingTarget(null);
          voiceRecRef.current = null;
        },
      });
      if (rec) {
        voiceRecRef.current = rec;
        setDictatingTarget(target);
        rec.start();
      }
    },
    [dictatingTarget, reflectionText, editText, stopJournalDictation]
  );

  React.useEffect(() => {
    return () => {
      voiceRecRef.current?.abort();
      stopKaiDialogue();
    };
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingTask) setEditingTask(null);
        if (editingReflectionDate) setEditingReflectionDate(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingTask, editingReflectionDate]);

  React.useEffect(() => {
    if (!editingTask) return;
    document.body.classList.add('modal-open-hide-floating');
    return () => {
      document.body.classList.remove('modal-open-hide-floating');
    };
  }, [editingTask]);

  // Daily reflections (stored in localStorage or received from cloud context)
  const [localReflections, setLocalReflections] = useState<Record<string, string>>(() => {
    try {
      const saved = safeGetItem('taskquest_daily_reflections');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const reflections = propReflections ?? localReflections;

  const handleSaveReflection = (date: string) => {
    const trimmed = reflectionText.trim();
    if (propOnSaveReflection) {
      propOnSaveReflection(date, trimmed);
    } else {
      const next = { ...localReflections, [date]: trimmed };
      if (!trimmed) {
        delete next[date];
      }
      setLocalReflections(next);
      safeSetItem('taskquest_daily_reflections', JSON.stringify(next));
    }

    // Registrar memoria de reflexión en KAI para sincronización a Firestore
    if (trimmed) {
      setPlayerStats((prev) => {
        const memLog = Array.isArray(prev.kaiMemoryLog) ? [...prev.kaiMemoryLog] : [];
        const newMem = {
          id: `mem-${date}-${Date.now()}`,
          timestamp: new Date().toISOString(),
          date,
          type: 'reflection' as const,
          content: trimmed,
          significance: 'alta' as const,
          author: 'user' as const,
        };
        return {
          ...prev,
          kaiMemoryLog: [newMem, ...memLog.filter((m) => m.date !== date || m.type !== 'reflection')].slice(0, 60),
        };
      });
    }

    setEditingReflectionDate(null);
    soundFX.playClick();
  };

  const handleRequestKaiAdvice = async (date: string) => {
    soundFX.playClick();
    setIsGeneratingKaiAdvice(date);
    try {
      const dayTasks = tasksByDate[date] || [];
      const pastReflections = Object.entries(reflections)
        .filter(([d]) => d !== date)
        .map(([, r]) => r);
      const pastMemories = Array.isArray(activeStats?.kaiMemoryLog)
        ? activeStats.kaiMemoryLog.map((m: any) => m.content)
        : [];

      const res = await generateKaiBitacoraAdvice({
        kaiName,
        stats: activeStats,
        dateStr: date,
        todayTasks: dayTasks,
        recentReflections: pastReflections,
        recentMemories: pastMemories,
      });

      if (res.advice) {
        const newReflection = reflectionText.trim()
          ? `${reflectionText.trim()}\n\n💬 ${kaiName}: "${res.advice}"`
          : `💬 ${kaiName}: "${res.advice}"`;
        setReflectionText(newReflection);
        if (editingReflectionDate !== date) {
          setEditingReflectionDate(date);
        }
        soundFX.playLevelUp();
      }
    } catch (err) {
      console.warn('[JournalView] Error al generar consejo KAI:', err);
    } finally {
      setIsGeneratingKaiAdvice(null);
    }
  };

  // Process and filter dates using local date calibration (no UTC drift)
  const todayStr = getTodayDateString();

  const processedDays = useMemo(() => {
    const dates = Object.keys(tasksByDate).sort().reverse();

    // Determine cutoff date for range filter
    let cutoffStr = '';
    if (dateRange !== 'all') {
      const daysAgo = parseInt(dateRange, 10);
      cutoffStr = addDaysToDateString(todayStr, -daysAgo);
    }

    const result: {
      date: string;
      tasks: TaskItem[];
      notesCount: number;
    }[] = [];

    dates.forEach(date => {
      if (cutoffStr && date < cutoffStr) return;

      const dayTasks = tasksByDate[date] || [];
      
      const filtered = dayTasks.filter(t => {
        // Filter by note existence if toggled
        if (onlyWithNotes && !t.notes?.trim()) return false;

        // Filter by category
        if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;

        // Filter by search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (t.title || "").toLowerCase().includes(q);
          const matchNote = t.notes?.toLowerCase().includes(q);
          const matchCat = t.category.toLowerCase().includes(q);
          if (!matchTitle && !matchNote && !matchCat) return false;
        }

        return true;
      });

      const notesCount = dayTasks.filter(t => t.notes?.trim()).length;

      // Include day if it has matching tasks or if there is a daily reflection and not searching
      const hasReflection = !!reflections[date];
      if (filtered.length > 0 || (hasReflection && !searchQuery.trim() && selectedCategory === 'all')) {
        result.push({
          date,
          tasks: filtered,
          notesCount,
        });
      }
    });

    return result;
  }, [tasksByDate, dateRange, onlyWithNotes, selectedCategory, searchQuery, reflections]);

  // Overall Statistics
  const totalNotesCount = useMemo(() => {
    let count = 0;
    Object.values(tasksByDate).forEach((list: TaskItem[] | undefined) => {
      list?.forEach(t => {
        if (t.notes?.trim()) count++;
      });
    });
    return count;
  }, [tasksByDate]);

  const daysWithNotesCount = useMemo(() => {
    let count = 0;
    Object.keys(tasksByDate).forEach(date => {
      if (tasksByDate[date]?.some(t => t.notes?.trim())) count++;
    });
    return count;
  }, [tasksByDate]);

  const formatDateTitle = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const monthName = dateObj.toLocaleDateString('es-ES', { month: 'long' });
    return `${capitalizedDay}, ${d} de ${monthName}`;
  };

  const handleStartEdit = (date: string, task: TaskItem) => {
    setEditingTask({ date, task });
    setEditText(task.notes || '');
  };

  const handleSaveEdit = () => {
    if (!editingTask) return;
    const finalNote = editText.trim() || undefined;
    onUpdateTaskNote(editingTask.date, editingTask.task.id, finalNote);

    // Guardar en la memoria de KAI para que recuerde los apuntes específicos
    if (finalNote) {
      setPlayerStats((prev) => {
        const memLog = Array.isArray(prev.kaiMemoryLog) ? [...prev.kaiMemoryLog] : [];
        const newMem = {
          id: `mem-task-${editingTask.task.id}-${Date.now()}`,
          timestamp: new Date().toISOString(),
          date: editingTask.date,
          type: 'task_note' as const,
          content: `Apunte en [${editingTask.task.title}]: "${finalNote}"`,
          significance: 'media' as const,
          author: 'user' as const,
          metadata: {
            taskId: editingTask.task.id,
            taskTitle: editingTask.task.title,
            category: editingTask.task.category,
          },
        };
        return {
          ...prev,
          kaiMemoryLog: [newMem, ...memLog.filter((m) => m.metadata?.taskId !== editingTask.task.id)].slice(0, 60),
        };
      });
    }

    soundFX.playClick();
    setEditingTask(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in zoom-in duration-200">
      
      {/* Top Banner & Navigation (Canonical TabHeader) */}
      <TabHeader
        title="Bitácora"
        subtitle="Reflexiones y apuntes diarios"
        icon={<BookOpen className="w-5 h-5" />}
        onBack={onBackToMissions}
        backLabel="Volver a Tareas"
        rightSlot={
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-xl bg-[#040814]/80 border border-white/10 text-xs font-mono tabular-nums text-slate-300 flex items-center gap-1.5">
              <span className="font-bold text-amber-400">{totalNotesCount}</span>
              <span className="text-[10px] text-slate-400 uppercase">notas</span>
              <span className="text-slate-600">·</span>
              <span className="font-bold aura-text-primary">{daysWithNotesCount}</span>
              <span className="text-[10px] text-slate-400 uppercase">días</span>
            </div>
          </div>
        }
      >
        <div className="space-y-2.5 text-left">
          {/* Clean Toolbar: Search bar + Filter toggle + Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Search Bar */}
            <div className="flex-1 min-w-[180px] sm:min-w-[240px] relative">
              <Search className="w-4 h-4 aura-text-primary opacity-75 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar en bitácora..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-[#040814]/80 border border-white/10 focus:border-[var(--aura-color-1,#00f0ff)] text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Toolbar Action Chips */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Filter Toggle */}
              <button
                type="button"
                onClick={() => { soundFX.playClick(); setShowFilters(!showFilters); }}
                className={`chicle-btn px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                  showFilters || activeFiltersCount > 0
                    ? 'aura-bg-soft aura-border-primary aura-text-primary optic-active-card'
                    : 'bg-[#040814]/80 border-white/10 text-slate-300 hover:text-white hover:border-white/20'
                }`}
                title="Filtrar por rango o categoría"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filtros</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full aura-bg-primary text-slate-950 text-[10px] font-bold flex items-center justify-center font-mono">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Repaso Inteligente (Compact) */}
              <button
                type="button"
                onClick={() => { soundFX.playClick(); setIsRecallOpen(true); }}
                className={`chicle-btn px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                  dueRecallCount > 0
                    ? 'bg-amber-500/20 border-amber-400/70 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)] optic-active-card'
                    : 'bg-[#040814]/80 border-white/10 text-slate-300 hover:text-white hover:border-white/20'
                }`}
                title="Repaso Inteligente"
              >
                <Brain className={`w-3.5 h-3.5 ${dueRecallCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
                <span>Repaso</span>
                {dueRecallCount > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black font-mono">
                    {dueRecallCount}
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400/80 font-mono hidden sm:inline">al día</span>
                )}
              </button>

              {/* Exportar Reporte (Compact) */}
              <button
                type="button"
                onClick={() => { soundFX.playClick(); setIsReportOpen(true); }}
                className="chicle-btn px-2.5 py-1.5 rounded-xl bg-[#040814]/80 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                title="Exportar reporte"
              >
                <FileDown className="w-3.5 h-3.5 aura-text-primary" />
                <span className="hidden sm:inline">Exportar</span>
              </button>
            </div>
          </div>

          {/* Collapsible Clean Filter Drawer (Only visible when toggled or active) */}
          {(showFilters || activeFiltersCount > 0) && (
            <div className="pt-2 border-t border-white/[0.08] space-y-2 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Date Range Chips */}
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-[10px] font-mono uppercase text-slate-400 mr-1">Rango:</span>
                  {(['7', '14', '30', 'all'] as const).map((range) => {
                    const isActive = dateRange === range;
                    const label = range === 'all' ? 'Todo' : `${range}d`;
                    return (
                      <button
                        key={range}
                        type="button"
                        onClick={() => { soundFX.playClick(); setDateRange(range); }}
                        className={`chicle-btn px-2 py-0.5 rounded-lg text-[11px] font-mono font-medium border transition cursor-pointer ${
                          isActive
                            ? 'aura-bg-soft aura-border-primary aura-text-primary optic-active-card font-bold'
                            : 'bg-[#040814]/60 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Toggle: Solo con notas */}
                <button
                  type="button"
                  onClick={() => { soundFX.playClick(); setOnlyWithNotes(!onlyWithNotes); }}
                  className={`chicle-btn px-2 py-0.5 rounded-lg text-[11px] font-mono border flex items-center gap-1 cursor-pointer transition ${
                    onlyWithNotes
                      ? 'aura-bg-soft aura-border-primary aura-text-primary font-bold'
                      : 'bg-[#040814]/60 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>Solo con notas</span>
                </button>

                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setSelectedCategory('all');
                      setDateRange('7');
                      setOnlyWithNotes(true);
                      setSearchQuery('');
                    }}
                    className="text-[10px] font-mono text-amber-400 hover:text-amber-200 underline cursor-pointer ml-auto"
                  >
                    Restablecer
                  </button>
                )}
              </div>

              {/* Category Chips: Sleek horizontal scroll strip instead of a wall of 11 buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <button
                  type="button"
                  onClick={() => { soundFX.playClick(); setSelectedCategory('all'); }}
                  className={`chicle-btn px-2.5 py-1 rounded-lg text-[11px] border whitespace-nowrap cursor-pointer transition flex items-center gap-1 shrink-0 ${
                    selectedCategory === 'all'
                      ? 'aura-bg-soft aura-border-primary aura-text-primary font-bold optic-active-card'
                      : 'bg-[#040814]/60 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Todas</span>
                </button>
                {Object.entries(CATEGORY_LABELS).map(([cat, { label }]) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => { soundFX.playClick(); setSelectedCategory(cat); }}
                      className={`chicle-btn px-2.5 py-1 rounded-lg text-[11px] border whitespace-nowrap cursor-pointer transition flex items-center gap-1 shrink-0 ${
                        isActive
                          ? 'aura-bg-soft aura-border-primary aura-text-primary font-bold optic-active-card'
                          : 'bg-[#040814]/60 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Tag className="w-2.5 h-2.5 shrink-0 opacity-60" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </TabHeader>

      {/* Main Feed: Grouped by Date */}
      {processedDays.length === 0 ? (
        <div className="relative isolate p-6 sm:p-10 text-center rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden space-y-3">
          <span className="vi-grano opacity-5" aria-hidden="true" />
          <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />
          <div className="relative z-10 space-y-2.5 max-w-sm mx-auto">
            <div className="w-10 h-10 rounded-2xl bg-[#040814]/80 border aura-border-subtle flex items-center justify-center aura-text-primary mx-auto aura-glow-subtle">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-white font-anton uppercase tracking-wide">
              {searchQuery ? 'Sin resultados' : 'Bitácora Despejada'}
            </h3>
            <p className="text-xs text-slate-400">
              {searchQuery 
                ? `No hay notas que coincidan con "${searchQuery}".` 
                : 'Tus reflexiones diarias y apuntes de misiones se recopilarán aquí.'}
            </p>
            <button
              type="button"
              onClick={onBackToMissions}
              className="chicle-btn aura-btn-gradient optic-active-card px-4 py-2 rounded-xl font-anton uppercase tracking-wider text-xs cursor-pointer inline-flex items-center gap-1.5 transition mt-1"
            >
              <span>Ver Tareas del Día</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {processedDays.map(({ date, tasks, notesCount }) => {
            const isToday = date === todayStr;
            const reflection = reflections[date];

            return (
              <ScrollReveal key={date}>
                <div 
                  className="relative isolate rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] border border-white/10 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.45)] transition-all text-left"
                >
                  <span className="vi-grano opacity-5" aria-hidden="true" />
                  <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

                  {/* Day Header Banner */}
                  <div className="relative z-10 px-4 sm:px-5 py-3.5 bg-[#040814]/80 border-b border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white/[0.04] border aura-border-subtle flex items-center justify-center aura-text-primary font-bold">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-black text-white font-anton uppercase tracking-wide">
                            {formatDateTitle(date)}
                          </h3>
                          {isToday && (
                            <span className="px-2 py-0.5 rounded-full aura-bg-soft aura-border-primary aura-text-primary optic-active-card border text-[9px] font-black uppercase tracking-wide">
                              Hoy
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium font-mono tabular-nums">
                          {notesCount} {notesCount === 1 ? 'nota' : 'notas'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingReflectionDate(date);
                          setReflectionText(reflection || '');
                        }}
                        className="chicle-btn px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-amber-500/15 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Escribir o editar nota general del día"
                      >
                        <MessageSquarePlus className="w-3.5 h-3.5 text-amber-400" />
                        <span className="hidden sm:inline">{reflection ? 'Editar Reflexión' : 'Reflexión del Día'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigateToDay(date)}
                        className="chicle-btn px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] aura-text-soft hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Ver misiones en la línea de tiempo de este día"
                      >
                        <span>Ver Día</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Day Reflection if present */}
                  {(reflection || editingReflectionDate === date) && (
                    <div className="relative z-10 px-4 sm:px-5 py-3 bg-[#040814]/80 border-b border-amber-500/25">
                      {editingReflectionDate === date ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-amber-300 flex items-center gap-1.5 font-anton uppercase tracking-wide">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              Reflexión del Día:
                            </span>
                            {isSpeechRecognitionSupported() && (
                              <button
                                type="button"
                                onClick={() => toggleJournalDictation('reflection')}
                                className={`chicle-btn px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold border flex items-center gap-1 cursor-pointer transition-all ${
                                  dictatingTarget === 'reflection'
                                    ? 'bg-rose-500/25 border-rose-400 text-rose-200 animate-pulse optic-active-card'
                                    : 'aura-bg-soft border aura-border-subtle hover:brightness-110'
                                }`}
                                title="Dictar reflexión por voz"
                              >
                                {dictatingTarget === 'reflection' ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                                <span>{dictatingTarget === 'reflection' ? 'Detener' : 'Dictar'}</span>
                              </button>
                            )}
                          </div>
                          <textarea
                            rows={3}
                            maxLength={5000}
                            value={reflectionText}
                            onChange={(e) => setReflectionText(e.target.value)}
                            placeholder="¿Qué aprendiste hoy? ¿Qué salió excelente y qué mejorarás mañana? (También puedes dictar con voz)"
                            className="w-full p-2.5 rounded-xl bg-black/40 border border-amber-500/40 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                          />
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleRequestKaiAdvice(date)}
                              disabled={isGeneratingKaiAdvice === date}
                              className="chicle-btn px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                              title={`Pedir a ${kaiName} una reflexión personalizada basada en tus hábitos y tareas`}
                            >
                              <Brain className={`w-3.5 h-3.5 text-cyan-300 ${isGeneratingKaiAdvice === date ? 'animate-spin' : ''}`} />
                              <span>{isGeneratingKaiAdvice === date ? `${kaiName} pensando...` : `Consejo de ${kaiName}`}</span>
                            </button>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  stopJournalDictation();
                                  setEditingReflectionDate(null);
                                }}
                                className="chicle-btn px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white rounded-xl text-xs font-bold cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  stopJournalDictation();
                                  handleSaveReflection(date);
                                }}
                                className="chicle-btn aura-btn-gradient optic-active-card px-3.5 py-1.5 text-xs font-anton uppercase tracking-wider rounded-xl cursor-pointer"
                              >
                                Guardar Reflexión
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[11px] uppercase font-anton tracking-wider text-amber-400 block">
                                Reflexión del Día
                              </span>
                              <p className="text-xs text-amber-100/90 font-medium italic mt-0.5 font-sans">
                                "{reflection}"
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                soundFX.playClick();
                                setSpeakingDate(date);
                                speakKaiDialogue(reflection, activeStats?.kaiCustomForm?.mood || 'zen', () => setSpeakingDate(null));
                              }}
                              className="chicle-btn aura-text-primary hover:text-white p-1.5 rounded-lg hover:bg-white/[0.08] cursor-pointer"
                              title="Escuchar reflexión con voz de KAI"
                            >
                              <Volume2 className={`w-3.5 h-3.5 ${speakingDate === date ? 'animate-bounce text-white' : ''}`} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingReflectionDate(date);
                                setReflectionText(reflection);
                              }}
                              className="chicle-btn text-amber-400 hover:text-white p-1.5 rounded-lg hover:bg-amber-500/15 cursor-pointer"
                              title="Editar reflexión"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tasks List */}
                  <div className="relative z-10 p-3 sm:p-4 space-y-2.5">
                    {tasks.length === 0 ? (
                      <div className="text-xs text-slate-500 italic py-2 text-center font-mono">
                        No hay misiones específicas con notas en esta fecha.
                      </div>
                    ) : (
                      tasks.map((task, idx) => {
                        const catInfo = CATEGORY_LABELS[task.category] || { label: task.category, textClass: 'text-slate-300' };

                        return (
                          <div
                            key={task.id ? `journal-task-${task.id}-${idx}` : `journal-task-${idx}`}
                            className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-colors flex flex-col gap-2 relative group"
                          >
                            {/* Task Top Row */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  task.completed 
                                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' 
                                    : 'border-white/20 text-transparent'
                                }`}>
                                  <CheckCircle2 className="w-3 h-3" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className={`text-sm font-semibold truncate leading-snug ${
                                    task.completed ? 'line-through text-slate-500' : 'text-slate-100'
                                  }`}>
                                    {task.title}
                                  </h4>
                                  <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-400 mt-1">
                                    <span className={`font-medium ${catInfo.textClass}`}>
                                      {catInfo.label}
                                    </span>
                                    {task.timeBlock && (
                                      <>
                                        <span className="text-slate-600">·</span>
                                        <span className="tabular-nums font-mono aura-text-soft">
                                          {task.timeBlock}
                                        </span>
                                      </>
                                    )}
                                    <span className="text-slate-600">·</span>
                                    <span className="tabular-nums font-mono font-medium text-amber-400">
                                      +{task.xpReward} XP
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Action: Edit note */}
                              <button
                                type="button"
                                onClick={() => handleStartEdit(date, task)}
                                className="chicle-btn min-w-[36px] min-h-[36px] p-2 rounded-lg bg-white/[0.03] hover:bg-amber-500/10 text-slate-400 hover:text-amber-300 border border-white/10 hover:border-amber-400/40 transition-colors shrink-0 cursor-pointer flex items-center justify-center"
                                title={task.notes ? 'Editar nota' : 'Agregar nota'}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Task Note Box */}
                            {task.notes ? (
                              <div 
                                onClick={() => handleStartEdit(date, task)}
                                className="p-3 rounded-lg bg-amber-500/[0.04] border border-amber-500/20 hover:border-amber-500/40 transition-colors cursor-pointer group/note"
                              >
                                <div className="flex items-start gap-2.5">
                                  <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 block mb-1">
                                      Qué se trabajó:
                                    </span>
                                    <p className="text-xs text-amber-100/90 font-sans leading-relaxed whitespace-pre-wrap">
                                      {task.notes}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStartEdit(date, task)}
                                className="min-h-[36px] py-2 px-3 rounded-lg border border-dashed border-white/[0.12] hover:border-amber-400/50 text-slate-400 hover:text-amber-300 text-left text-xs font-sans flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span>+ Anotar apunte de esta misión</span>
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      )}

      {/* Inline Modal for Quick Note Edit with Portalled Rendering */}
      {editingTask && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[170] portal-modal-root bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 font-sans"
          onClick={() => setEditingTask(null)}
        >
          <div 
            role="dialog"
            aria-modal="true"
            className="relative isolate w-full max-w-md max-h-[88dvh] sm:max-h-[84vh] flex flex-col overflow-hidden bg-[#030712]/[0.98] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_24px_64px_rgba(0,0,0,0.75)] text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Micrograno táctil Moxen Vidrio */}
            <span className="vi-grano opacity-5" aria-hidden="true" />

            {/* Filamento especular superior */}
            <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 shrink-0 relative z-10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-amber-300 uppercase tracking-wide font-anton">
                    Bitácora de Repaso
                  </h3>
                  <p className="text-xs text-white font-bold truncate max-w-[260px]">
                    {editingTask.task?.title || 'Bitácora'}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingTask(null)}
                className="chicle-btn w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer shrink-0"
                aria-label="Cerrar ventana"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
              <p className="text-xs text-slate-300 font-medium">
                Escribe o dicta en qué trabajaste o puntos clave de repaso:
              </p>
              {isSpeechRecognitionSupported() && (
                <button
                  type="button"
                  onClick={() => toggleJournalDictation('note')}
                  className={`chicle-btn px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold border flex items-center gap-1 cursor-pointer shrink-0 transition-all ${
                    dictatingTarget === 'note'
                      ? 'bg-rose-500/25 border-rose-400 text-rose-200 animate-pulse optic-active-card'
                      : 'aura-bg-soft border aura-border-subtle hover:brightness-110'
                  }`}
                >
                  {dictatingTarget === 'note' ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                  <span>{dictatingTarget === 'note' ? 'Detener' : 'Dictar'}</span>
                </button>
              )}
            </div>

            <textarea
              autoFocus
              rows={4}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="Ej. Revisión de vocabulario, 3 series de sentadillas, entrega de mockup al cliente..."
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[var(--aura-color-1,#00f0ff)] resize-none mb-4 relative z-10 transition-colors"
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  handleSaveEdit();
                }
              }}
            />

            <div className="flex items-center justify-between gap-2 relative z-10">
              {editText ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditText('');
                    onUpdateTaskNote(editingTask.date, editingTask.task.id, undefined);
                    soundFX.playClick();
                    setEditingTask(null);
                  }}
                  className="chicle-btn px-3 py-1.5 rounded-xl bg-rose-950/40 text-rose-400 hover:text-rose-200 text-xs font-bold border border-rose-500/40 cursor-pointer transition-all"
                >
                  Borrar Nota
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="chicle-btn px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white text-xs font-bold cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="chicle-btn aura-btn-gradient optic-active-card px-4 py-1.5 rounded-xl text-xs font-anton uppercase tracking-wider cursor-pointer transition-all"
                >
                  Guardar Nota
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Smart Recall Spaced Repetition Modal */}
      <SmartRecallModal
        isOpen={isRecallOpen}
        onClose={() => setIsRecallOpen(false)}
        recallItems={recallItems}
        currentDate={activeDate}
        onUpdateRecallItems={setRecallItems}
        onAddRecallAsTask={onAddRecallAsTask}
        onRewardEarned={(xp, coins, text) => {
          if (onRewardEarned) {
            onRewardEarned(xp, coins, text);
          }
        }}
      />

      {/* Weekly Report & Export Modal */}
      <WeeklyReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        tasksByDate={tasksByDate}
        stats={activeStats}
        currentDate={activeDate}
      />
    </div>
  );
};
