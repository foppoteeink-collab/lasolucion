import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Calendar, 
  FileText, 
  Edit3, 
  CheckCircle2, 
  ArrowLeft, 
  Sparkles, 
  Tag, 
  Trash2, 
  Save, 
  X,
  Clock,
  ChevronRight,
  TrendingUp,
  Bookmark,
  MessageSquarePlus,
  Brain,
  FileDown
} from 'lucide-react';
import { TaskItem, TaskCategory, PlayerStats, RecallItem } from '../types';
import { soundFX } from '../utils/audio';
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

interface JournalViewProps {
  tasksByDate: Record<string, TaskItem[]>;
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

const CATEGORY_LABELS: Record<TaskCategory, { label: string; color: string }> = {
  clientes: { label: 'Clientes', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-500/40' },
  entrenamiento: { label: 'Entreno', color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-500/40' },
  estudio: { label: 'Estudio', color: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-500/40' },
  creativo: { label: 'Creativo', color: 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-500/40' },
  trabajo: { label: 'Trabajo', color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-500/40' },
  comida: { label: 'Comida', color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-500/40' },
  limpieza: { label: 'Limpieza', color: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-500/40' },
  pomodoro: { label: 'Foco', color: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-500/40' },
  rutina: { label: 'Rutina', color: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-600/40' },
  habito: { label: 'Hábito', color: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-500/40' },
};

export const JournalView: React.FC<JournalViewProps> = ({
  tasksByDate,
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

  // Inline Note Editor State
  const [editingTask, setEditingTask] = useState<{ date: string; task: TaskItem } | null>(null);
  const [editText, setEditText] = useState('');

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
  const [editingReflectionDate, setEditingReflectionDate] = useState<string | null>(null);
  const [reflectionText, setReflectionText] = useState('');

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
    setEditingReflectionDate(null);
    soundFX.playClick();
  };

  // Process and filter dates
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const processedDays = useMemo(() => {
    const dates = Object.keys(tasksByDate).sort().reverse();

    // Determine cutoff date for range filter
    let cutoffStr = '';
    if (dateRange !== 'all') {
      const daysAgo = parseInt(dateRange, 10);
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      cutoffStr = d.toISOString().split('T')[0];
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
    onUpdateTaskNote(editingTask.date, editingTask.task.id, editText.trim() || undefined);
    soundFX.playClick();
    setEditingTask(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in zoom-in duration-200">
      
      {/* Top Banner & Navigation */}
      <div className="p-4 sm:p-6 rounded-3xl scifi-glass-panel relative overflow-hidden text-left text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Row 1: Header Title & Navigation */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { soundFX.playClick(); onBackToMissions(); }}
              className="p-2 rounded-xl bg-[#04020e] hover:bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:text-white transition-colors cursor-pointer shrink-0 shadow-[0_0_10px_rgba(0,240,255,0.15)]"
              title="Volver a Misiones"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#04020e] border border-cyan-400/80 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)] shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg md:text-xl font-black text-white tracking-wide font-anton uppercase leading-tight">
                  Bitácora del Héroe & Repaso Semanal
                </h1>
                <p className="text-xs text-cyan-300/80 mt-0.5 max-w-xl font-sans hidden sm:block">
                  Apuntes, temas cubiertos y avances específicos de tus misiones diarias.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Metrics Strip & Action Buttons */}
        <div className="mt-4 pt-3.5 border-t border-cyan-500/30 grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center justify-between gap-2.5 relative z-10">
          {/* Smart Recall Button */}
          <button
            onClick={() => { soundFX.playClick(); setIsRecallOpen(true); }}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/70 text-amber-300 text-xs font-anton tracking-wider uppercase shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all cursor-pointer min-h-[42px]"
            title="Iniciar sesión de repaso espaciado de misiones"
          >
            <Brain className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <span className="whitespace-nowrap">Smart Recall</span>
            {dueRecallCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] animate-bounce shrink-0">
                {dueRecallCount}
              </span>
            ) : (
              <span className="text-[10px] text-amber-300 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/50 shrink-0">
                Al día
              </span>
            )}
          </button>

          {/* Export Weekly Report Button */}
          <button
            onClick={() => { soundFX.playClick(); setIsReportOpen(true); }}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-2xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/50 text-cyan-300 text-xs font-bold shadow-[0_0_12px_rgba(0,240,255,0.2)] transition cursor-pointer min-h-[42px]"
            title="Generar resumen semanal para Obsidian / Notion / PDF"
          >
            <FileDown className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="whitespace-nowrap">Exportar</span>
          </button>

          <div className="px-3.5 py-1.5 rounded-2xl bg-[#04020e] border border-amber-500/40 text-center flex items-center justify-between sm:justify-center sm:flex-col gap-2 sm:gap-0">
            <span className="text-[10px] uppercase font-bold text-cyan-300/80 font-mono">Total Notas</span>
            <span className="text-sm sm:text-base font-black text-amber-400 font-mono">{totalNotesCount}</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-2xl bg-[#04020e] border border-cyan-500/40 text-center flex items-center justify-between sm:justify-center sm:flex-col gap-2 sm:gap-0">
            <span className="text-[10px] uppercase font-bold text-cyan-300/80 font-mono">Días Activos</span>
            <span className="text-sm sm:text-base font-black text-cyan-400 font-mono">{daysWithNotesCount}</span>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="mt-5 pt-4 border-t border-cyan-500/20 grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          {/* Search Bar */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-cyan-400/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar tema, palabra clave o misión repasada..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#000a14] border border-cyan-500/40 focus:border-cyan-400 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Date Range Tabs */}
          <div className="sm:col-span-6 flex items-center justify-between sm:justify-end gap-1.5 overflow-x-auto">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#000a14] border border-cyan-500/30 text-xs">
              <button
                onClick={() => { soundFX.playClick(); setDateRange('7'); }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  dateRange === '7' ? 'bg-cyan-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                7 días
              </button>
              <button
                onClick={() => { soundFX.playClick(); setDateRange('14'); }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  dateRange === '14' ? 'bg-cyan-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                14 días
              </button>
              <button
                onClick={() => { soundFX.playClick(); setDateRange('30'); }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  dateRange === '30' ? 'bg-cyan-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                30 días
              </button>
              <button
                onClick={() => { soundFX.playClick(); setDateRange('all'); }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  dateRange === 'all' ? 'bg-cyan-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todo
              </button>
            </div>

            {/* Toggle: Only with notes */}
            <button
              onClick={() => { soundFX.playClick(); setOnlyWithNotes(!onlyWithNotes); }}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                onlyWithNotes 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                  : 'bg-[#000a14] text-slate-400 border-cyan-500/30 hover:text-white'
              }`}
              title="Alternar entre ver solo misiones con notas o todas las misiones"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Solo con notas</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                : 'bg-[#000a14] text-slate-400 hover:text-white border border-cyan-500/20'
            }`}
          >
            Todas las Categorías
          </button>
          {Object.entries(CATEGORY_LABELS).map(([cat, { label }]) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-400 text-slate-950 font-black shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                  : 'bg-[#000a14] text-slate-400 hover:text-white border border-cyan-500/20'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Feed: Grouped by Date */}
      {processedDays.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-3xl bg-[#011420] border border-cyan-500/30 space-y-3 shadow-[0_0_25px_rgba(0,240,255,0.08)]">
          <div className="w-12 h-12 rounded-2xl bg-[#000a14] border border-cyan-500/40 flex items-center justify-center text-cyan-400 mx-auto shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-white font-anton uppercase tracking-wide">No se encontraron notas en este rango</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            {searchQuery 
              ? `No hay notas ni misiones que coincidan con "${searchQuery}".` 
              : 'Empieza a añadir notas de repaso en tus misiones usando el ícono de nota para revisarlas aquí en cualquier momento.'}
          </p>
          <button
            onClick={onBackToMissions}
            className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-anton uppercase tracking-wider text-xs shadow-[0_0_15px_rgba(0,240,255,0.4)] cursor-pointer inline-flex items-center gap-2 transition"
          >
            <span>Ir a Misiones del Día</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {processedDays.map(({ date, tasks, notesCount }) => {
            const isToday = date === todayStr;
            const reflection = reflections[date];

            return (
              <ScrollReveal key={date}>
                <div 
                  className="rounded-3xl bg-[#011420] border border-cyan-500/30 overflow-hidden shadow-[0_0_20px_rgba(0,240,255,0.08)] transition-all text-left"
                >
                {/* Day Header Banner */}
                <div className="px-4 sm:px-5 py-3.5 bg-[#000d1a] border-b border-cyan-500/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#001020] border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold shadow-[0_0_8px_rgba(0,240,255,0.2)]">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm sm:text-base font-black text-white font-anton uppercase tracking-wide">
                          {formatDateTitle(date)}
                        </h2>
                        {isToday && (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 text-[9px] font-black uppercase tracking-wide shadow-[0_0_8px_rgba(0,240,255,0.3)]">
                            Hoy
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {notesCount} {notesCount === 1 ? 'nota de repaso' : 'notas de repaso'} registradas
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingReflectionDate(date);
                        setReflectionText(reflection || '');
                      }}
                      className="px-2.5 py-1 rounded-xl bg-[#000a14] hover:bg-amber-950/40 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Escribir o editar nota general del día"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">{reflection ? 'Editar Reflexión' : 'Reflexión del Día'}</span>
                    </button>
                    <button
                      onClick={() => onNavigateToDay(date)}
                      className="px-2.5 py-1 rounded-xl bg-[#000a14] hover:bg-cyan-950/50 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Ver misiones en la línea de tiempo de este día"
                    >
                      <span>Ver Día</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Day Reflection if present */}
                {(reflection || editingReflectionDate === date) && (
                  <div className="px-4 sm:px-5 py-3 bg-[#000a14] border-b border-amber-500/30">
                    {editingReflectionDate === date ? (
                      <div className="space-y-2">
                        <span className="text-xs font-black text-amber-300 flex items-center gap-1.5 font-anton uppercase tracking-wide">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          Reflexión / Aprendizaje Global del Día:
                        </span>
                        <textarea
                          rows={3}
                          value={reflectionText}
                          onChange={(e) => setReflectionText(e.target.value)}
                          placeholder="¿Qué aprendiste hoy? ¿Qué salió excelente y qué mejorarás mañana?"
                          className="w-full p-2.5 rounded-xl bg-[#011420] border border-amber-500/40 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingReflectionDate(null)}
                            className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveReflection(date)}
                            className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-anton uppercase tracking-wider rounded-lg cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                          >
                            Guardar Reflexión
                          </button>
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
                        <button
                          onClick={() => {
                            setEditingReflectionDate(date);
                            setReflectionText(reflection);
                          }}
                          className="text-amber-400 hover:text-white p-1 rounded-lg hover:bg-amber-900/30 shrink-0"
                          title="Editar reflexión"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Tasks List */}
                <div className="p-3 sm:p-4 space-y-2.5">
                  {tasks.length === 0 ? (
                    <div className="text-xs text-slate-500 italic py-2 text-center font-mono">
                      No hay misiones específicas con notas en esta fecha.
                    </div>
                  ) : (
                    tasks.map((task, idx) => {
                      const catInfo = CATEGORY_LABELS[task.category] || { label: task.category, color: 'bg-[#000a14] text-slate-300 border-slate-700' };

                      return (
                        <div
                          key={task.id ? `journal-task-${task.id}-${idx}` : `journal-task-${idx}`}
                          className="p-3 sm:p-3.5 rounded-2xl bg-[#000a14] border border-cyan-500/20 hover:border-cyan-400/50 transition-all flex flex-col gap-2 relative group shadow-sm"
                        >
                          {/* Task Top Row */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0">
                              <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                task.completed 
                                  ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300' 
                                  : 'border-slate-600 text-transparent'
                              }`}>
                                <CheckCircle2 className="w-3 h-3" />
                              </div>
                              <div className="min-w-0">
                                <h3 className={`text-xs sm:text-sm font-black truncate leading-snug ${
                                  task.completed ? 'line-through text-slate-500' : 'text-white'
                                }`}>
                                  {task.title}
                                </h3>
                                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                  <span className={`px-1.5 py-0.2 rounded text-[8px] sm:text-[9px] uppercase font-bold border ${catInfo.color}`}>
                                    {catInfo.label}
                                  </span>
                                  {task.timeBlock && (
                                    <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/40">
                                      {task.timeBlock}
                                    </span>
                                  )}
                                  <span className="text-[9px] font-mono font-bold text-amber-400">
                                    +{task.xpReward} XP
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Action: Edit note */}
                            <button
                              type="button"
                              onClick={() => handleStartEdit(date, task)}
                              className="p-1.5 rounded-lg bg-[#001020] hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-cyan-500/30 hover:border-amber-400/50 transition-colors shrink-0 cursor-pointer"
                              title={task.notes ? 'Editar nota' : 'Agregar nota'}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Task Note Box */}
                          {task.notes ? (
                            <div 
                              onClick={() => handleStartEdit(date, task)}
                              className="p-2.5 rounded-xl bg-[#001428] border border-amber-500/40 hover:border-amber-400 transition-colors cursor-pointer group/note"
                            >
                              <div className="flex items-start gap-2">
                                <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <span className="text-[10px] uppercase font-anton tracking-wider text-amber-400 block mb-0.5">
                                    Qué se trabajó:
                                  </span>
                                  <p className="text-xs text-amber-100 font-sans leading-relaxed whitespace-pre-wrap">
                                    {task.notes}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(date, task)}
                              className="py-1 px-2.5 rounded-lg border border-dashed border-cyan-500/30 hover:border-amber-400/60 text-slate-400 hover:text-amber-300 text-left text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <FileText className="w-3 h-3 text-slate-500" />
                              <span>Sin notas registradas. Haz clic para anotar qué trabajaste en esta misión.</span>
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

      {/* Inline Modal for Quick Note Edit */}
      {editingTask && (
        <div 
          className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setEditingTask(null)}
        >
          <div 
            className="w-full max-w-md max-h-[88dvh] sm:max-h-[84vh] flex flex-col overflow-hidden bg-[#011420] border border-cyan-400/60 rounded-3xl p-4 sm:p-5 shadow-[0_0_35px_rgba(0,240,255,0.25)] text-left relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-cyan-500/30 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#000a14] border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.25)]">
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
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-2 font-medium">
              Escribe en qué trabajaste específicamente o puntos clave de repaso:
            </p>

            <textarea
              autoFocus
              rows={4}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="Ej. Revisión de vocabulario, 3 series de sentadillas, entrega de mockup al cliente..."
              className="w-full px-3 py-2 rounded-xl bg-[#000a14] border border-cyan-500/40 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 resize-none mb-4"
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  handleSaveEdit();
                }
              }}
            />

            <div className="flex items-center justify-between gap-2">
              {editText ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditText('');
                    onUpdateTaskNote(editingTask.date, editingTask.task.id, undefined);
                    soundFX.playClick();
                    setEditingTask(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-red-950/40 text-red-400 hover:text-red-300 text-xs font-bold border border-red-800/60 cursor-pointer"
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
                  className="px-3.5 py-1.5 rounded-xl bg-[#000a14] text-slate-300 hover:text-white text-xs font-bold border border-cyan-500/30 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-anton uppercase tracking-wider border border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.4)] cursor-pointer transition"
                >
                  Guardar Nota
                </button>
              </div>
            </div>
          </div>
        </div>
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
