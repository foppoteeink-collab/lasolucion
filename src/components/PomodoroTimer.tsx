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
  CloudRain,
  Trees,
  Radio,
  Zap,
  Sparkles,
  Pencil,
  Check,
  Waves,
  Sliders,
  X,
  Cpu,
  Heart,
  Shield,
  Headphones,
  ChevronDown,
  ListTodo,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { soundFX } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { HoloCompanion } from './HoloCompanion';
import { usePlayerStore } from '../store/usePlayerStore';
import { useUIStore } from '../store/useUIStore';
import { useTaskStore } from '../store/useTaskStore';
import { getTodayDateString } from '../utils/date';
import { QuantumSoundscapeConsole } from './QuantumSoundscapeConsole';
import { quantumSoundscape, SoundscapeState } from '../utils/quantumSoundscape';
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
    activeAmbientLayers,
    ambientVolume,
    handleAmbientChange,
    toggleAmbientLayer,
    handleVolumeChange,
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
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [graceNotice, setGraceNotice] = useState<string | null>(null);
  const [scState, setScState] = useState<SoundscapeState>(quantumSoundscape.getState());
  const [showAdvancedEq, setShowAdvancedEq] = useState(false);
  const [showSoundscape, setShowSoundscape] = useState(false);
  const [entropyWarning, setEntropyWarning] = useState<string | null>(null);
  const [lastToggledInfo, setLastToggledInfo] = useState<string | null>(null);
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
    const elapsed = initialTimeLeft - timeLeft;
    const GRACE_PERIOD = 90;

    if (mode === 'work' && isRunning) {
      if (elapsed <= GRACE_PERIOD) {
        resetTimer(true);
        setGraceNotice('🛡️ Período de gracia: sesión reiniciada sin penalización de HP.');
        setTimeout(() => setGraceNotice(null), 4000);
      } else {
        setShowResetConfirm(true);
      }
    } else {
      resetTimer(true);
    }
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
    return quantumSoundscape.subscribe((s) => setScState(s));
  }, []);

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

  // Quantum Layer Helpers (Allow mixing individual Quantum channels alongside Nature layers)
  const isAlphaActive = scState.isPlaying && !scState.channel2Muted && scState.binauralMode === 'alpha';
  const isBetaActive = scState.isPlaying && !scState.channel2Muted && scState.binauralMode === 'beta';
  const isDroneActive = scState.isPlaying && !scState.channel3Muted;
  const isBrownActive = scState.isPlaying && !scState.channel1Muted;

  const ensureQuantumPlayingOrStop = (nextCh1Muted: boolean, nextCh2Muted: boolean, nextCh3Muted: boolean) => {
    if (nextCh1Muted && nextCh2Muted && nextCh3Muted) {
      quantumSoundscape.stop(0.2);
    } else if (!scState.isPlaying) {
      quantumSoundscape.start(0.3);
    }
  };

  const handleToggleNature = (layer: 'rain' | 'fire' | 'forest' | 'heartbeat', hint: string) => {
    soundFX.playClick();
    const willBeOn = !activeAmbientLayers.includes(layer);
    toggleAmbientLayer(layer);
    if (willBeOn) {
      setLastToggledInfo(hint);
    }
  };

  const handleToggleBinaural = (targetMode: 'alpha' | 'beta', hint: string) => {
    soundFX.playClick();
    const currentlyActive = scState.isPlaying && !scState.channel2Muted && scState.binauralMode === targetMode;

    if (!scState.isPlaying) {
      // Mute other quantum channels initially so user only turns on the requested layer
      if (!scState.channel1Muted) quantumSoundscape.toggleChannel1Mute();
      if (!scState.channel3Muted) quantumSoundscape.toggleChannel3Mute();
      quantumSoundscape.setBinauralMode(targetMode);
      setLastToggledInfo(hint);
      return;
    }

    if (currentlyActive) {
      quantumSoundscape.toggleChannel2Mute();
      ensureQuantumPlayingOrStop(scState.channel1Muted, true, scState.channel3Muted);
    } else {
      quantumSoundscape.setBinauralMode(targetMode);
      setLastToggledInfo(hint);
    }
  };

  const handleToggleDrone = (hint: string) => {
    soundFX.playClick();
    if (!scState.isPlaying) {
      if (!scState.channel1Muted) quantumSoundscape.toggleChannel1Mute();
      if (!scState.channel2Muted) quantumSoundscape.toggleChannel2Mute();
      quantumSoundscape.setDronePreset('subtle');
      quantumSoundscape.playQuantumChime();
      setLastToggledInfo(hint);
      return;
    }

    if (!scState.channel3Muted) {
      quantumSoundscape.toggleChannel3Mute();
      ensureQuantumPlayingOrStop(scState.channel1Muted, scState.channel2Muted, true);
    } else {
      quantumSoundscape.toggleChannel3Mute();
      quantumSoundscape.playQuantumChime();
      setLastToggledInfo(hint);
    }
  };

  const handleToggleBrownNoise = (hint: string) => {
    soundFX.playClick();
    if (!scState.isPlaying) {
      if (!scState.channel2Muted) quantumSoundscape.toggleChannel2Mute();
      if (!scState.channel3Muted) quantumSoundscape.toggleChannel3Mute();
      quantumSoundscape.setNoiseType('brown');
      setLastToggledInfo(hint);
      return;
    }

    if (!scState.channel1Muted) {
      quantumSoundscape.toggleChannel1Mute();
      ensureQuantumPlayingOrStop(true, scState.channel2Muted, scState.channel3Muted);
    } else {
      quantumSoundscape.setNoiseType('brown');
      setLastToggledInfo(hint);
    }
  };

  const handleMuteAll = () => {
    soundFX.playClick();
    handleAmbientChange('off');
    quantumSoundscape.stop(0.25);
    setLastToggledInfo(null);
  };

  const handleUnifiedVolume = (val: number) => {
    handleVolumeChange(val);
    quantumSoundscape.setMasterVolume(val);
  };

  const isAnyAudioPlaying = activeAmbientLayers.length > 0 || scState.isPlaying;

  // Build concise active mix label
  const activeMixNames = useMemo(() => {
    const names: string[] = [];
    if (activeAmbientLayers.includes('rain')) names.push('Lluvia');
    if (activeAmbientLayers.includes('fire')) names.push('Olas');
    if (activeAmbientLayers.includes('forest')) names.push('Bosque');
    if (activeAmbientLayers.includes('heartbeat')) names.push('Latido');
    if (isAlphaActive) names.push('Alpha 10Hz');
    if (isBetaActive) names.push('Beta 15Hz');
    if (isDroneActive) names.push('432Hz');
    if (isBrownActive) names.push('Marrón');
    return names;
  }, [activeAmbientLayers, isAlphaActive, isBetaActive, isDroneActive, isBrownActive]);

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

        {showResetConfirm && (
          <div className="w-full bg-rose-950/80 border border-rose-500/60 rounded-xl p-3 text-xs text-rose-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span><strong>¿Abandonar foco?</strong> Has superado el período de gracia de 90s y perderás <strong>15 HP</strong>.</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/15 text-slate-200 hover:text-white transition cursor-pointer text-xs"
              >
                Continuar Foco
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  resetTimer(false);
                }}
                className="chicle-btn px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition cursor-pointer text-xs"
              >
                Confirmar (-15 HP)
              </button>
            </div>
          </div>
        )}

        {graceNotice && (
          <div className="w-full aura-bg-soft border rounded-xl p-2 text-xs flex items-center gap-1.5 animate-fadeIn">
            <span>{graceNotice}</span>
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
      <div className="relative z-10 w-full mb-3">
        <MoxenRayas
          progress={progressPercent}
          variant="slim"
          theme={theme.rayasTheme}
          mode={isRunning ? 'active' : 'reactive'}
        />
      </div>

      {/* ROW 3: SUBTLE AUDIO TOOL TRIGGER (COLLAPSIBLE BY DEFAULT) */}
      <div id="pomodoro-audio-hub" className="relative z-10 pt-2.5 border-t border-white/10">
        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            setShowSoundscape(!showSoundscape);
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#040a1a]/90 border border-white/10 hover:border-white/25 text-xs transition cursor-pointer group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Headphones className={`w-3.5 h-3.5 shrink-0 ${isAnyAudioPlaying ? 'aura-text-primary animate-pulse' : 'text-slate-400 group-hover:text-white'}`} />
            <span className="font-anton uppercase tracking-wider text-slate-300 group-hover:text-white transition">
              Paisaje Sonoro & Frecuencias
            </span>
            {isAnyAudioPlaying ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full aura-bg-soft border flex items-center gap-1 truncate max-w-[140px] sm:max-w-xs">
                <span className="w-1.5 h-1.5 rounded-full aura-bg-primary animate-ping shrink-0" />
                <span className="truncate">{activeMixNames.join(' + ')}</span>
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                • Opcional
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-slate-400 group-hover:text-white transition">
            <span className="text-[10px] font-mono">{showSoundscape ? 'Ocultar' : (isAnyAudioPlaying ? 'Ajustar' : 'Elegir')}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showSoundscape ? 'rotate-180 aura-text-primary' : ''}`} />
          </div>
        </button>

        {/* EXPANDABLE SOUND CONSOLE */}
        {showSoundscape && (
          <div className="mt-2.5 p-3 rounded-2xl bg-[#040a1a]/90 border border-white/10 space-y-2.5 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/[0.07]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Waves className={`w-3 h-3 ${isAnyAudioPlaying ? 'aura-text-primary' : 'text-slate-500'}`} />
                Mezclador Acústico
              </span>

              <div className="flex items-center gap-1.5 ml-auto">
                {isAnyAudioPlaying && (
                  <>
                    <div className="flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded-xl border border-white/10">
                      <Volume2 className="w-3 h-3 aura-text-primary" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={ambientVolume}
                        onChange={(e) => handleUnifiedVolume(parseFloat(e.target.value))}
                        className="w-16 cursor-pointer"
                        style={{ accentColor: 'var(--aura-color-1, #00f0ff)' }}
                        title="Volumen general de la mezcla"
                        aria-label="Volumen general del paisaje sonoro"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleMuteAll}
                      className="p-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-500/40 transition cursor-pointer"
                      title="Silenciar todo"
                      aria-label="Silenciar todo el paisaje sonoro"
                    >
                      <VolumeX className="w-3 h-3" />
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setShowAdvancedEq(!showAdvancedEq);
                  }}
                  aria-pressed={showAdvancedEq}
                  aria-label="Ecualizador avanzado de 3 canales"
                  className={`px-2.5 py-1 rounded-xl border transition cursor-pointer flex items-center gap-1 text-[10px] font-mono ${
                    showAdvancedEq
                      ? 'aura-bg-soft optic-active-card'
                      : 'bg-black/40 border-white/10 text-slate-300 hover:text-white'
                  }`}
                  title="Ecualizador avanzado de 3 canales"
                >
                  <Sliders className="w-3 h-3" />
                  <span>EQ</span>
                </button>
              </div>
            </div>

            {/* 8 Sound Layer Chips (4x2 limpio y legible sin truncamientos, unificado a Aura Obsidian) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono text-[11px]">
              {/* 1. Lluvia */}
              <button
                type="button"
                onClick={() => handleToggleNature('rain', '🌧️ Lluvia: Aísla ruidos externos y relaja la corteza auditiva')}
                title="Lluvia Suave"
                aria-pressed={activeAmbientLayers.includes('rain')}
                aria-label="Capa de sonido: Lluvia suave"
                className={`px-2.5 py-2 rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeAmbientLayers.includes('rain')
                    ? 'aura-bg-soft font-bold optic-active-card'
                    : 'bg-black/40 border-white/10 text-slate-300 hover:text-white hover:border-white/25'
                }`}
              >
                <CloudRain className="w-3.5 h-3.5 aura-text-primary shrink-0" />
                <span className="truncate">Lluvia</span>
              </button>

              {/* 2. Olas */}
              <button
                type="button"
                onClick={() => handleToggleNature('fire', '🌊 Olas del Mar: Ritmo cadencioso anti-estrés')}
                title="Olas del Mar"
                aria-pressed={activeAmbientLayers.includes('fire')}
                aria-label="Capa de sonido: Olas del mar"
                className={`px-2.5 py-2 rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeAmbientLayers.includes('fire')
                    ? 'aura-bg-soft font-bold optic-active-card'
                    : 'bg-black/40 border-white/10 text-slate-300 hover:text-white hover:border-white/25'
                }`}
              >
                <Waves className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">Olas</span>
              </button>

              {/* 3. Bosque */}
              <button
                type="button"
                onClick={() => handleToggleNature('forest', '🌲 Bosque: Brisa y aves naturales')}
                title="Bosque Zen"
                aria-pressed={activeAmbientLayers.includes('forest')}
                aria-label="Capa de sonido: Bosque zen"
                className={`px-2.5 py-2 rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeAmbientLayers.includes('forest')
                    ? 'aura-bg-soft font-bold optic-active-card'
                    : 'bg-black/40 border-white/10 text-slate-300 hover:text-white hover:border-white/25'
                }`}
              >
                <Trees className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Bosque</span>
              </button>

              {/* 4. Latido */}
              <button
                type="button"
                onClick={() => handleToggleNature('heartbeat', '💓 Latido 60 BPM: Coherencia cardíaca')}
                title="Latido del Corazón"
                aria-pressed={activeAmbientLayers.includes('heartbeat')}
                aria-label="Capa de sonido: Latido 60 BPM"
                className={`px-2.5 py-2 rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeAmbientLayers.includes('heartbeat')
                    ? 'aura-bg-soft font-bold optic-active-card'
                    : 'bg-black/40 border-white/10 text-slate-300 hover:text-white hover:border-white/25'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 text-rose-400 shrink-0 ${activeAmbientLayers.includes('heartbeat') ? 'animate-pulse' : ''}`} />
                <span className="truncate">Latido</span>
              </button>

              {/* 5. Alpha */}
              <button
                type="button"
                onClick={() => handleToggleBinaural('alpha', '🧘 Alpha 10Hz: Estudio y calma')}
                title="Ondas Alpha (10Hz)"
                aria-pressed={isAlphaActive}
                aria-label="Frecuencia binaural: Ondas Alpha 10Hz"
                className={`px-2.5 py-2 rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  isAlphaActive
                    ? 'aura-bg-soft font-bold optic-active-card'
                    : 'bg-black/40 border-white/10 text-slate-300 hover:text-white hover:border-white/25'
                }`}
              >
                <Radio className="w-3.5 h-3.5 aura-text-primary shrink-0" />
                <span className="truncate">Alpha</span>
              </button>

              {/* 6. Beta */}
              <button
                type="button"
                onClick={() => handleToggleBinaural('beta', '⚡ Beta 15Hz: Hiperenfoque activo')}
                title="Ondas Beta (15Hz)"
                aria-pressed={isBetaActive}
                aria-label="Frecuencia binaural: Ondas Beta 15Hz"
                className={`px-2.5 py-2 rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  isBetaActive
                    ? 'aura-bg-soft font-bold optic-active-card'
                    : 'bg-black/40 border-white/10 text-slate-300 hover:text-white hover:border-white/25'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Beta</span>
              </button>

              {/* 7. Drone 432Hz */}
              <button
                type="button"
                onClick={() => handleToggleDrone('✨ Drone 432Hz: Inmersión armónica')}
                title="Drone 432Hz"
                aria-pressed={isDroneActive}
                aria-label="Frecuencia armónica: Drone 432Hz"
                className={`px-2.5 py-2 rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  isDroneActive
                    ? 'aura-bg-soft font-bold optic-active-card'
                    : 'bg-black/40 border-white/10 text-slate-300 hover:text-white hover:border-white/25'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">432Hz</span>
              </button>

              {/* 8. Marrón */}
              <button
                type="button"
                onClick={() => handleToggleBrownNoise('🛡️ Ruido Marrón: Bloqueo acústico')}
                title="Ruido Marrón"
                aria-pressed={isBrownActive}
                aria-label="Bloqueador acústico: Ruido Marrón"
                className={`px-2.5 py-2 rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  isBrownActive
                    ? 'aura-bg-soft font-bold optic-active-card'
                    : 'bg-black/40 border-white/10 text-slate-300 hover:text-white hover:border-white/25'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Marrón</span>
              </button>
            </div>

            {/* Sound info hint */}
            {isAnyAudioPlaying && lastToggledInfo && (
              <div className="text-[10px] font-mono text-slate-300 flex items-center justify-between px-1">
                <span className="truncate">{lastToggledInfo}</span>
              </div>
            )}

            {/* Optional 3-Channel Equalizer */}
            {showAdvancedEq && (
              <div className="pt-2 border-t border-white/10">
                <QuantumSoundscapeConsole compact={true} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
