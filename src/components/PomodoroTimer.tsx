import React, { useState, useEffect, useMemo } from 'react';
import { PomodoroSession, TaskCategory } from '../types';
import { useTimer } from '../context/TimerContext';
import { MoxenRayas } from './moxen/MoxenRayas';
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Brain,
  Volume2,
  VolumeX,
  Sparkles,
  Pencil,
  Check,
  X,
  ListTodo,
  Flame,
} from 'lucide-react';
import { soundFX } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { HoloCompanion } from './HoloCompanion';
import { usePlayerStore } from '../store/usePlayerStore';
import { useUIStore } from '../store/useUIStore';
import { useTaskStore } from '../store/useTaskStore';
import { getTodayDateString } from '../utils/date';
import { speakKaiDialogue, stopKaiDialogue } from '../utils/voice';
import { handleToggleTask } from '../engine/gameEngine';

interface PomodoroTimerProps {
  initialTaskTitle?: string;
  initialCategory?: TaskCategory;
  onSessionComplete?: (session: PomodoroSession) => void;
  onClose?: () => void;
}

const EMPTY_TASK_LIST: any[] = [];

export const PomodoroTimer: React.FC<PomodoroTimerProps> = React.memo(({
  initialTaskTitle,
  initialCategory,
  onClose,
}) => {
  const {
    mode,
    taskTitle,
    setTaskTitle,
    category,
    setCategory,
    initialTimeLeft,
    timeLeft,
    formattedTime,
    progressPercent,
    isRunning,
    completedPomodorosToday,
    currentCycle,
    streakMultiplier,
    togglePlay,
    resetTimer,
    switchMode,
  } = useTimer();

  const stats = usePlayerStore(state => state.stats);
  const soundEnabled = useUIStore(state => state.soundEnabled);
  const todayStr = getTodayDateString();
  const todayTasks = useTaskStore(state => state.tasksByDate[todayStr] ?? EMPTY_TASK_LIST);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isTaskDropdownOpen, setIsTaskDropdownOpen] = useState(false);
  const [entropyWarning, setEntropyWarning] = useState<string | null>(null);
  const [isVoiceCoachEnabled, setIsVoiceCoachEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('lasolucion_pomodoro_voice_coach');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(false);
  const prevPomodorosRef = React.useRef(completedPomodorosToday);

  const pendingTasks = useMemo(() => todayTasks.filter((t: any) => !t.completed), [todayTasks]);

  const matchedPendingTask = useMemo(() => {
    const clean = (taskTitle || '').trim().toLowerCase();
    if (!clean) return null;
    return pendingTasks.find((t: any) => (t.title || '').trim().toLowerCase() === clean) || null;
  }, [pendingTasks, taskTitle]);

  const toggleVoiceCoach = () => {
    soundFX.playClick();
    const next = !isVoiceCoachEnabled;
    setIsVoiceCoachEnabled(next);
    try {
      localStorage.setItem('lasolucion_pomodoro_voice_coach', String(next));
    } catch {}
    if (!next) {
      stopKaiDialogue();
    } else if (soundEnabled) {
      speakKaiDialogue('Coach vocal activado. Te acompaño en tu enfoque.', stats?.kaiCustomForm?.mood || 'determined');
    }
  };

  // Detectar finalización de bloque Pomodoro para felicitar con Voz Viva y ofrecer marcar la tarea completada
  useEffect(() => {
    if (completedPomodorosToday > prevPomodorosRef.current) {
      setShowCompletionPrompt(true);
      if (isVoiceCoachEnabled && soundEnabled) {
        const cleanGoal = taskTitle?.trim() || 'tu bloque de enfoque';
        speakKaiDialogue(
          `¡Bloque completado! Gran concentración en ${cleanGoal}. Respira un momento.`,
          stats?.kaiCustomForm?.mood || 'cheerful'
        );
      }
    }
    prevPomodorosRef.current = completedPomodorosToday;
  }, [completedPomodorosToday, isVoiceCoachEnabled, soundEnabled, taskTitle, stats?.kaiCustomForm?.mood]);

  const handleSafeResetClick = () => {
    soundFX.playClick();
    resetTimer();
  };

  const systemEntropy = useMemo(() => {
    const pendingCount = todayTasks.filter(t => !t.completed).length;
    if (pendingCount === 0 || todayTasks.length === 0) return 0;
    const nowHour = new Date().getHours();
    const timeFactor = Math.min(1, nowHour / 21);
    const pendingPercentage = pendingCount / todayTasks.length;
    return Math.max(0, Math.min(100, Math.round((pendingPercentage * 60) + (timeFactor * 40))));
  }, [todayTasks]);

  const handleTogglePlay = () => {
    if (!isRunning) {
      setShowCompletionPrompt(false);
      if (mode === 'work' && systemEntropy >= 100) {
        soundFX.playClick();
        triggerHaptic([30, 40]);
        setEntropyWarning('⚡ MODO RESCATE: Ciclo iniciado para romper la inercia.');
        setTimeout(() => setEntropyWarning(null), 6000);
      } else {
        setEntropyWarning(null);
      }

      if (isVoiceCoachEnabled && soundEnabled) {
        const mood = stats?.kaiCustomForm?.mood || 'determined';
        if (mode === 'work') {
          const goal = taskTitle?.trim();
          const phrase = goal
            ? `Enfoque activado en ${goal}. Cero distracciones, vamos con todo.`
            : 'Sesión de enfoque iniciada. Un solo objetivo a la vez.';
          speakKaiDialogue(phrase, mood);
        } else {
          speakKaiDialogue('Tiempo de descanso. Suelta la pantalla, estira los hombros y respira profundo.', 'zen');
        }
      }
    } else {
      setEntropyWarning(null);
    }
    togglePlay();
  };

  useEffect(() => {
    if (initialTaskTitle && initialTaskTitle !== taskTitle && !isRunning) {
      setTaskTitle(initialTaskTitle);
    }
    if (initialCategory && initialCategory !== category && !isRunning) {
      setCategory(initialCategory as TaskCategory);
    }
  }, [initialTaskTitle, initialCategory, isRunning, setTaskTitle, setCategory, taskTitle, category]);

  const handleClosePomodoro = () => {
    soundFX.playClick();
    if (onClose) {
      onClose();
    } else {
      useUIStore.getState().setModalState('isPomodoroOpen', false);
    }
  };

  const theme = useMemo(() => {
    switch (mode) {
      case 'short_break':
        return {
          badgeClass: 'border-emerald-400/50 text-emerald-300 bg-emerald-950/40',
          badgeText: 'Relax',
          buttonGradient: 'chicle-btn bg-emerald-400 hover:bg-emerald-300 text-[#030712] font-anton tracking-wide shadow-[0_0_15px_rgba(52,211,153,0.35)] optic-active-card',
          rayasTheme: 'emerald' as const,
        };
      case 'long_break':
        return {
          badgeClass: 'border-purple-400/50 text-purple-300 bg-purple-950/40',
          badgeText: 'Pausa',
          buttonGradient: 'chicle-btn bg-purple-500 hover:bg-purple-400 text-white font-anton tracking-wide shadow-[0_0_15px_rgba(168,85,247,0.35)] optic-active-card',
          rayasTheme: 'purple' as const,
        };
      case 'work':
      default:
        return {
          badgeClass: 'aura-bg-soft',
          badgeText: 'Foco',
          buttonGradient: 'chicle-btn aura-btn-gradient font-anton tracking-wide optic-active-card',
          rayasTheme: 'aura' as const,
        };
    }
  }, [mode]);

  return (
    <div
      id="pomodoro-timer-container"
      className="w-full relative isolate rounded-2xl sm:rounded-3xl bg-[#030712]/[0.98] border border-white/10 p-3.5 sm:p-5 shadow-[0_20px_55px_rgba(0,0,0,0.85),0_0_32px_rgba(var(--aura-glow-rgb,0,240,255),0.16),inset_0_1px_0_rgba(255,255,255,0.12)] text-white overflow-hidden"
    >
      {/* Micrograno táctil Moxen Vidrio */}
      <span className="vi-grano opacity-5" aria-hidden="true" />
      {/* Filamento especular superior sincronizado con Aura */}
      <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

      {/* ROW 1: Mode Switcher + Editable Objective + Quick Task Link + Close */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/10">
        <div className="inline-flex gap-1 p-0.5 rounded-xl bg-[#040a1a]/90 border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => switchMode('work')}
            aria-pressed={mode === 'work'}
            aria-label="Modo de trabajo 25 minutos"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-anton tracking-wide transition cursor-pointer flex items-center gap-1 uppercase ${
              mode === 'work' ? 'aura-btn-gradient optic-active-card' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>25m</span>
          </button>
          <button
            type="button"
            onClick={() => switchMode('short_break')}
            aria-pressed={mode === 'short_break'}
            aria-label="Modo descanso corto 5 minutos"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-anton tracking-wide transition cursor-pointer flex items-center gap-1 uppercase ${
              mode === 'short_break' ? 'bg-emerald-400 text-[#030712] shadow-[0_0_10px_rgba(52,211,153,0.3)] optic-active-card' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>5m</span>
          </button>
          <button
            type="button"
            onClick={() => switchMode('long_break')}
            aria-pressed={mode === 'long_break'}
            aria-label="Modo descanso largo 15 minutos"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-anton tracking-wide transition cursor-pointer flex items-center gap-1 uppercase ${
              mode === 'long_break' ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)] optic-active-card' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>15m</span>
          </button>
        </div>

        <div className="flex-1 max-w-xs sm:max-w-sm min-w-[160px] flex items-center gap-1.5">
          <div className="flex-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-xl border aura-border-primary">
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                  className="w-full bg-transparent text-xs font-medium text-white focus:outline-none placeholder-slate-400"
                  placeholder="Objetivo..."
                  aria-label="Escribir objetivo de foco"
                />
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(false)}
                  className="p-1 rounded-lg aura-bg-primary font-bold cursor-pointer"
                  aria-label="Guardar objetivo"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-[#040a1a]/90 border border-white/10 hover:border-white/25 text-slate-200 hover:text-white transition cursor-pointer text-xs group"
                title="Editar objetivo de foco"
                aria-label="Editar objetivo de foco"
              >
                <span className="truncate">{taskTitle || 'Objetivo de foco...'}</span>
                <Pencil className="w-3 h-3 text-slate-400 group-hover:text-slate-200 shrink-0" />
              </button>
            )}
          </div>

          {/* Quick Task Selector Popover */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsTaskDropdownOpen(!isTaskDropdownOpen)}
              className={`p-1.5 rounded-xl border transition cursor-pointer flex items-center justify-center ${
                isTaskDropdownOpen
                  ? 'aura-bg-soft optic-active-card'
                  : 'bg-[#040a1a]/90 border-white/10 text-slate-300 hover:text-white hover:border-white/25'
              }`}
              title="Vincular a una tarea pendiente de hoy"
              aria-label="Seleccionar tarea pendiente de hoy"
              aria-expanded={isTaskDropdownOpen}
            >
              <ListTodo className="w-3.5 h-3.5 aura-text-primary" />
            </button>

            {isTaskDropdownOpen && (
              <div className="absolute top-full right-0 mt-1.5 w-64 max-h-56 overflow-y-auto custom-scrollbar bg-[#040a1a]/[0.98] border border-white/15 rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.85)] p-1.5 z-50 animate-fadeIn">
                <div className="px-2 py-1 text-[10px] font-mono aura-text-primary uppercase tracking-wider border-b border-white/10 flex items-center justify-between">
                  <span>Tareas Pendientes</span>
                  <span className="font-bold tabular-nums">({pendingTasks.length})</span>
                </div>
                {pendingTasks.length === 0 ? (
                  <div className="p-3 text-[11px] text-slate-400 text-center italic">
                    No hay tareas pendientes para hoy
                  </div>
                ) : (
                  <div className="space-y-1 mt-1">
                    {pendingTasks.map((task: any) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => {
                          soundFX.playClick();
                          setTaskTitle(task.title);
                          if (task.category) setCategory(task.category);
                          setIsTaskDropdownOpen(false);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/[0.08] text-slate-200 hover:text-white transition flex items-center justify-between gap-1.5 text-xs group cursor-pointer"
                      >
                        <span className="truncate">{task.title}</span>
                        <span className="text-[10px] font-mono aura-text-soft uppercase px-1.5 py-0.5 rounded bg-black/40 border border-white/10 shrink-0">
                          {task.category || 'general'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={toggleVoiceCoach}
            aria-pressed={isVoiceCoachEnabled}
            className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-mono font-bold flex items-center gap-1 transition cursor-pointer ${
              isVoiceCoachEnabled
                ? 'aura-bg-soft optic-active-card'
                : 'bg-[#040a1a]/90 border-white/10 text-slate-400 hover:text-white'
            }`}
            title={isVoiceCoachEnabled ? 'Coach Vocal KAI activo (toca para silenciar)' : 'Activar Coach Vocal de KAI'}
          >
            {isVoiceCoachEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Voz KAI</span>
          </button>

          <button
            type="button"
            onClick={handleClosePomodoro}
            className="w-9 h-9 rounded-xl bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.1] border border-white/10 transition flex items-center justify-center cursor-pointer shrink-0 active:scale-95"
            title="Minimizar panel (Esc)"
            aria-label="Cerrar panel de Pomodoro"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ROW 2: Clock + Primary Controls */}
      <div className="relative z-10 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 flex items-center justify-center" data-preserve-optic="true">
            <HoloCompanion
              archetype={stats?.characterClass || 'sabio'}
              size={40}
              auraState="focus_trance"
              interactive={true}
            />
          </div>
          <div
            role="timer"
            aria-live="off"
            aria-label={`Temporizador de foco, tiempo restante ${formattedTime}`}
            className="text-4xl sm:text-5xl font-anton tracking-wider text-white tabular-nums"
            style={{ textShadow: '0 0 14px rgba(var(--aura-glow-rgb, 0, 240, 255), 0.25)' }}
          >
            {formattedTime}
          </div>
          <div className="flex flex-col gap-1 text-[10px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className={`font-anton uppercase tracking-wider px-2 py-0.5 rounded-full border ${theme.badgeClass}`}>
                {theme.badgeText}
              </span>
              {/* 4-block Pomodoro cycle dots */}
              <div className="flex items-center gap-1" title={`Ciclo ${currentCycle} de 4`}>
                {[1, 2, 3, 4].map((dot) => (
                  <div
                    key={dot}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      dot <= currentCycle && isRunning && dot === currentCycle ? 'animate-pulse' : ''
                    }`}
                    style={{
                      backgroundColor:
                        dot < currentCycle
                          ? 'var(--aura-color-1, #00f0ff)'
                          : dot === currentCycle
                            ? 'rgba(var(--aura-glow-rgb, 0, 240, 255), 0.7)'
                            : 'rgba(255, 255, 255, 0.15)',
                      boxShadow: dot < currentCycle ? '0 0 6px rgba(var(--aura-glow-rgb, 0, 240, 255), 0.75)' : undefined,
                    }}
                  />
                ))}
                <span className="text-[10px] text-slate-400 tabular-nums">C{currentCycle}/4</span>
              </div>
              {streakMultiplier > 1 && (
                <span className="flex items-center gap-0.5 text-[10px] font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-1.5 py-0.5 rounded-full tabular-nums">
                  <Flame className="w-2.5 h-2.5 text-amber-400 fill-current animate-pulse" />
                  <span>x{streakMultiplier}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 tabular-nums">
              <span className="aura-text-primary font-bold">+25 XP</span>
              <span>•</span>
              <span className="text-amber-400 font-bold">+8 🪙</span>
              <span>•</span>
              <span className="text-slate-400">{completedPomodorosToday} hoy</span>
            </div>
          </div>
        </div>

        {/* Banner Post-Sesión: Marcar tarea completada al vuelo */}
        {showCompletionPrompt && matchedPendingTask && (
          <div className="w-full bg-emerald-950/50 border border-emerald-400/50 rounded-xl p-2.5 text-xs text-emerald-100 flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium truncate">
              🎯 ¿Terminaste <strong>“{matchedPendingTask.title}”</strong>?
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  triggerHaptic([20, 35]);
                  handleToggleTask(matchedPendingTask.id, e);
                  setShowCompletionPrompt(false);
                  if (isVoiceCoachEnabled && soundEnabled) {
                    speakKaiDialogue('¡Misión marcada como completada! Excelente trabajo.', stats?.kaiCustomForm?.mood || 'cheerful');
                  }
                }}
                className="chicle-btn px-2.5 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-[#030712] font-anton uppercase tracking-wider text-[11px] flex items-center gap-1 cursor-pointer optic-active-card"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Completar tarea</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCompletionPrompt(false)}
                className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 text-slate-200 text-[11px] cursor-pointer"
              >
                Aún no
              </button>
            </div>
          </div>
        )}

        {entropyWarning && (
          <div className="w-full bg-rose-950/70 border border-rose-500/60 rounded-xl p-2 text-xs text-rose-200">
            {entropyWarning}
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={isRunning ? 'Pausar temporizador de foco' : 'Iniciar temporizador de foco'}
            className={`px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${theme.buttonGradient}`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>Iniciar</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSafeResetClick}
            aria-label="Reiniciar temporizador"
            className="chicle-btn w-9 h-9 rounded-xl bg-[#040a1a]/90 text-slate-300 hover:text-white border border-white/10 hover:border-white/25 transition cursor-pointer flex items-center justify-center"
            title="Reiniciar reloj (con período de gracia seguro)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Line with Moxen Rayas (sincronizada con el color real del modo activo) */}
      <div className="relative z-10 w-full">
        <MoxenRayas
          progress={progressPercent}
          variant="slim"
          theme={theme.rayasTheme}
          mode={isRunning ? 'active' : 'reactive'}
        />
      </div>
    </div>
  );
});
