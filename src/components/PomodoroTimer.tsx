import React, { useState, useEffect, useMemo } from 'react';
import { PomodoroSession, TaskCategory } from '../types';
import { useTimer, FOCUS_QUOTES } from '../context/TimerContext';
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Brain,
  Volume2,
  VolumeX,
  CloudRain,
  Flame,
  Trees,
  Radio,
  Zap,
  Coins,
  Sparkles,
  Pencil,
  Check,
  Bell,
  Waves,
  Sliders,
  ChevronDown,
  ChevronUp,
  X,
  Headphones,
  Cpu,
  Heart,
} from 'lucide-react';
import { soundFX } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { HoloCompanion } from './HoloCompanion';
import { usePlayerStore } from '../store/usePlayerStore';
import { useUIStore } from '../store/useUIStore';
import { useTaskStore } from '../store/useTaskStore';
import { getTodayDateString } from '../utils/date';
import { QuantumSoundscapeConsole } from './QuantumSoundscapeConsole';
import { quantumSoundscape } from '../utils/quantumSoundscape';

interface PomodoroTimerProps {
  initialTaskTitle?: string;
  initialCategory?: TaskCategory;
  onSessionComplete?: (session: PomodoroSession) => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = React.memo(({
  initialTaskTitle,
  initialCategory,
}) => {
  const {
    mode,
    taskTitle,
    setTaskTitle,
    category,
    setCategory,
    formattedTime,
    progressPercent,
    isRunning,
    completedPomodorosToday,
    ambientType,
    ambientVolume,
    handleAmbientChange,
    handleVolumeChange,
    togglePlay,
    resetTimer,
    switchMode,
    quoteIndex,
  } = useTimer();

  const stats = usePlayerStore(state => state.stats);
  const todayTasks = useTaskStore(state => state.tasksByDate[getTodayDateString()] || []);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSoundscapePlaying, setIsSoundscapePlaying] = useState(quantumSoundscape.getState().isPlaying);
  const [activeAudioTab, setActiveAudioTab] = useState<'presets' | 'nature' | 'quantum'>('presets');
  const [entropyWarning, setEntropyWarning] = useState<string | null>(null);

  const systemEntropy = useMemo(() => {
    const pendingCount = todayTasks.filter(t => !t.completed).length;
    if (pendingCount === 0 || todayTasks.length === 0) return 0;
    const nowHour = new Date().getHours();
    const timeFactor = Math.min(1, nowHour / 21);
    const pendingPercentage = pendingCount / todayTasks.length;
    return Math.max(0, Math.min(100, Math.round((pendingPercentage * 60) + (timeFactor * 40))));
  }, [todayTasks]);

  const handleTogglePlay = () => {
    if (!isRunning && mode === 'work' && systemEntropy >= 100) {
      soundFX.playClick();
      triggerHaptic([30, 40]);
      setEntropyWarning('⚡ MODO RESCATE ACTIVADO: Se detectó 100% de entropía acumulada. Iniciarás un ciclo de enfoque para romper la inercia.');
      setTimeout(() => setEntropyWarning(null), 8000);
    } else {
      setEntropyWarning(null);
    }
    togglePlay();
  };

  useEffect(() => {
    return quantumSoundscape.subscribe((s) => setIsSoundscapePlaying(s.isPlaying));
  }, []);

  // Sync initial props if provided and not running
  useEffect(() => {
    if (initialTaskTitle && initialTaskTitle !== taskTitle && !isRunning) {
      setTaskTitle(initialTaskTitle);
    }
    if (initialCategory && initialCategory !== category && !isRunning) {
      setCategory(initialCategory as TaskCategory);
    }
  }, [initialTaskTitle, initialCategory, isRunning, setTaskTitle, setCategory, taskTitle, category]);

  // Preview Alarm Sounds
  const handleTestWorkAlarm = () => {
    soundFX.playWorkSessionCompleteAlarm();
  };

  const handleTestBreakAlarm = () => {
    soundFX.playBreakCompleteAlarm();
  };

  // Close / Minimize Pomodoro Timer Modal
  const handleClosePomodoro = () => {
    soundFX.playClick();
    useUIStore.getState().setModalState('isPomodoroOpen', false);
  };

  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Pure Nature Sound Handler (Strictly isolates natural sound & stops any Quantum frequencies)
  const selectPureNatureSound = (type: 'off' | 'rain' | 'fire' | 'forest' | 'heartbeat') => {
    soundFX.playClick();
    quantumSoundscape.stop(0.15);
    setActivePreset(null);
    handleAmbientChange(type);
  };

  // Audio Fusion Presets Handler (Combines Nature Ambient & WebAudio Quantum Frequencies)
  const applyAudioFusionPreset = (presetKey: string) => {
    soundFX.playClick();

    // If clicking the same active preset while audio is playing, toggle it off
    if (
      presetKey !== 'mute_all' &&
      activePreset === presetKey &&
      (ambientType !== 'off' || isSoundscapePlaying)
    ) {
      handleAmbientChange('off', true);
      quantumSoundscape.stop(0.3);
      setActivePreset(null);
      return;
    }

    switch (presetKey) {
      case 'rain_brown':
        setActivePreset('rain_brown');
        handleAmbientChange('rain', true);
        quantumSoundscape.applyFormula('void_mask');
        break;
      case 'fire_alpha':
        setActivePreset('fire_alpha');
        handleAmbientChange('fire', true);
        quantumSoundscape.applyFormula('calm_study');
        break;
      case 'forest_432':
        setActivePreset('forest_432');
        handleAmbientChange('forest', true);
        quantumSoundscape.applyFormula('calm_study');
        quantumSoundscape.playQuantumChime();
        break;
      case 'heart_alpha':
        setActivePreset('heart_alpha');
        handleAmbientChange('heartbeat', true);
        quantumSoundscape.applyFormula('calm_study');
        break;
      case 'hyper_beta':
        setActivePreset('hyper_beta');
        handleAmbientChange('off', true);
        quantumSoundscape.applyFormula('hyperfocus');
        break;
      case 'study_alpha':
        setActivePreset('study_alpha');
        handleAmbientChange('off', true);
        quantumSoundscape.applyFormula('calm_study');
        break;
      case 'scifi_drone':
        setActivePreset('scifi_drone');
        handleAmbientChange('off', true);
        quantumSoundscape.applyFormula('fusion_core');
        break;
      case 'brown_void':
        setActivePreset('brown_void');
        handleAmbientChange('off', true);
        quantumSoundscape.applyFormula('void_mask');
        break;
      case 'mute_all':
      default:
        setActivePreset(null);
        handleAmbientChange('off', true);
        quantumSoundscape.stop(0.3);
        break;
    }
  };

  const isAnyAudioPlaying = ambientType !== 'off' || isSoundscapePlaying;

  const theme = useMemo(() => {
    switch (mode) {
      case 'short_break':
        return {
          badgeClass: 'border-emerald-400/60 text-emerald-300 bg-[#000a14]',
          badgeText: 'Descanso Corto',
          buttonGradient: 'bg-emerald-400 hover:bg-emerald-300 text-black font-anton tracking-wide shadow-[0_0_15px_rgba(52,211,153,0.4)]',
          progressColor: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]',
        };
      case 'long_break':
        return {
          badgeClass: 'border-indigo-400/60 text-indigo-300 bg-[#000a14]',
          badgeText: 'Pausa Larga',
          buttonGradient: 'bg-indigo-500 hover:bg-indigo-400 text-white font-anton tracking-wide shadow-[0_0_15px_rgba(99,102,241,0.4)]',
          progressColor: 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]',
        };
      case 'work':
      default:
        return {
          badgeClass: 'border-cyan-400/60 text-cyan-300 bg-[#000a14]',
          badgeText: 'Enfoque Profundo',
          buttonGradient: 'bg-cyan-400 hover:bg-cyan-300 text-black font-anton tracking-wide shadow-[0_0_15px_rgba(0,240,255,0.4)]',
          progressColor: 'bg-gradient-to-r from-blue-600 via-cyan-400 to-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.6)]',
        };
    }
  }, [mode]);

  const [isAudioExpanded, setIsAudioExpanded] = useState(true);

  return (
    <div 
      id="pomodoro-timer-container" 
      className="w-full max-w-4xl mx-auto rounded-2xl bg-[#01101a]/95 border border-cyan-500/30 p-3.5 sm:p-4 shadow-[0_0_25px_rgba(0,240,255,0.12)] backdrop-blur-md text-white my-2 relative"
    >
      {/* Top Bar: Mode Selectors, Editable Objective & Close Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
        <div className="inline-flex gap-1 p-1 rounded-xl bg-black/50 border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => switchMode('work')}
            className={`px-2.5 py-1 rounded-lg text-xs font-anton tracking-wide transition cursor-pointer flex items-center gap-1.5 uppercase ${
              mode === 'work' ? 'bg-cyan-400 text-black shadow-[0_0_10px_rgba(0,240,255,0.3)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>25m Foco</span>
          </button>
          <button
            type="button"
            onClick={() => switchMode('short_break')}
            className={`px-2.5 py-1 rounded-lg text-xs font-anton tracking-wide transition cursor-pointer flex items-center gap-1.5 uppercase ${
              mode === 'short_break' ? 'bg-emerald-400 text-black shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>5m Relax</span>
          </button>
          <button
            type="button"
            onClick={() => switchMode('long_break')}
            className={`px-2.5 py-1 rounded-lg text-xs font-anton tracking-wide transition cursor-pointer flex items-center gap-1.5 uppercase ${
              mode === 'long_break' ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>15m Pausa</span>
          </button>
        </div>

        {/* Task Title Editable Field */}
        <div className="flex-1 max-w-xs sm:max-w-sm min-w-[160px]">
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-xl border border-cyan-400">
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                className="w-full bg-transparent text-xs font-medium text-white focus:outline-none placeholder-slate-500"
                placeholder="Objetivo de foco..."
              />
              <button
                type="button"
                onClick={() => setIsEditingTitle(false)}
                className="p-1 rounded-lg bg-cyan-400 text-black font-bold hover:bg-cyan-300 cursor-pointer"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingTitle(true)}
              className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 hover:border-cyan-400/50 text-slate-300 hover:text-white transition cursor-pointer text-xs group"
              title="Haz clic para editar el objetivo actual"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="truncate">{taskTitle || 'Establecer objetivo...'}</span>
              </div>
              <Pencil className="w-3 h-3 text-slate-500 group-hover:text-slate-300 shrink-0" />
            </button>
          )}
        </div>

        {/* Close / Minimize Button */}
        <button
          type="button"
          onClick={handleClosePomodoro}
          className="p-1.5 rounded-xl bg-black/40 text-slate-400 hover:text-white border border-white/10 hover:border-cyan-400/50 transition cursor-pointer shrink-0"
          title="Ocultar Modo Foco"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Timer Row */}
      <div className="py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 shrink-0 flex items-center justify-center">
            <HoloCompanion
              archetype={stats?.characterClass || 'sabio'}
              size={46}
              auraState="focus_trance"
              interactive={true}
            />
          </div>
          <div className="text-4xl sm:text-5xl font-anton tracking-wider text-white tabular-nums drop-shadow-[0_0_10px_rgba(0,240,255,0.25)]">
            {formattedTime}
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] font-anton uppercase tracking-wider px-2 py-0.5 rounded-full border ${theme.badgeClass}`}>
                {theme.badgeText}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                • {completedPomodorosToday} hoy
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <span className="text-cyan-400 font-bold">+25 XP</span>
              <span>•</span>
              <span className="text-amber-400 font-bold">+8 🪙</span>
              <span>•</span>
              <span>{progressPercent}%</span>
            </div>
          </div>
        </div>

        {/* Entropy Warning Banner if 100% */}
        {entropyWarning && (
          <div className="w-full bg-rose-950/90 border border-rose-500/80 rounded-xl p-2.5 text-xs text-rose-200 font-sans">
            {entropyWarning}
          </div>
        )}

        {/* Primary Timer Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${theme.buttonGradient}`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>Iniciar Foco</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={resetTimer}
            className="p-2 rounded-xl bg-black/40 text-slate-400 hover:text-white border border-white/10 hover:border-cyan-400/50 transition cursor-pointer active:scale-90"
            title="Reiniciar temporizador"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sleek Progress Bar */}
      <div className="w-full h-1 bg-black/80 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full ${theme.progressColor} transition-all duration-500`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Minimalist Audio Hub */}
      <div id="pomodoro-audio-hub" className="pt-2 border-t border-white/10 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setIsAudioExpanded(!isAudioExpanded);
            }}
            className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
            title="Mostrar u ocultar controles de audio"
          >
            <Waves className={`w-3.5 h-3.5 ${isAnyAudioPlaying ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
            <span className="uppercase tracking-wider text-[11px]">Audio & Paisajes Sonoros</span>
            {isAnyAudioPlaying && (
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-1.5 py-0.2 rounded-full">
                ● {ambientType !== 'off' && isSoundscapePlaying ? 'Mezcla Activa' : ambientType !== 'off' ? 'Solo Naturaleza' : 'Solo Cuántica'}
              </span>
            )}
            {isAudioExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {isAudioExpanded && (
            <div className="flex items-center gap-1 bg-black/50 p-0.5 rounded-lg border border-white/10 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => { soundFX.playClick(); setActiveAudioTab('presets'); }}
                className={`px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  activeAudioTab === 'presets'
                    ? 'bg-cyan-400 text-black font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Mezclas</span>
              </button>
              <button
                type="button"
                onClick={() => { soundFX.playClick(); setActiveAudioTab('nature'); }}
                className={`px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  activeAudioTab === 'nature'
                    ? 'bg-emerald-400 text-black font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CloudRain className="w-3 h-3" />
                <span>Naturaleza</span>
              </button>
              <button
                type="button"
                onClick={() => { soundFX.playClick(); setActiveAudioTab('quantum'); }}
                className={`px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  activeAudioTab === 'quantum'
                    ? 'bg-purple-500 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Headphones className="w-3 h-3" />
                <span>Cuántica (3CH)</span>
              </button>
            </div>
          )}
        </div>

        {isAudioExpanded && (
          <>
            {/* TAB 1: COMPACT PRESET PILLS */}
            {activeAudioTab === 'presets' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => applyAudioFusionPreset('rain_brown')}
                    className={`px-2.5 py-2 rounded-xl border transition cursor-pointer flex items-center gap-2 truncate ${
                      activePreset === 'rain_brown' && isAnyAudioPlaying
                        ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.25)] font-bold'
                        : 'bg-black/40 border-white/10 text-slate-300 hover:border-cyan-400/50 hover:text-white'
                    }`}
                  >
                    <CloudRain className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">Lluvia + Ruido</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyAudioFusionPreset('fire_alpha')}
                    className={`px-2.5 py-2 rounded-xl border transition cursor-pointer flex items-center gap-2 truncate ${
                      activePreset === 'fire_alpha' && isAnyAudioPlaying
                        ? 'bg-sky-950/90 border-sky-400 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.25)] font-bold'
                        : 'bg-black/40 border-white/10 text-slate-300 hover:border-sky-400/50 hover:text-white'
                    }`}
                  >
                    <Waves className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">Olas + Alfa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyAudioFusionPreset('forest_432')}
                    className={`px-2.5 py-2 rounded-xl border transition cursor-pointer flex items-center gap-2 truncate ${
                      activePreset === 'forest_432' && isAnyAudioPlaying
                        ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.25)] font-bold'
                        : 'bg-black/40 border-white/10 text-slate-300 hover:border-emerald-400/50 hover:text-white'
                    }`}
                  >
                    <Trees className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">Bosque + 432Hz</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyAudioFusionPreset('heart_alpha')}
                    className={`px-2.5 py-2 rounded-xl border transition cursor-pointer flex items-center gap-2 truncate ${
                      activePreset === 'heart_alpha' && isAnyAudioPlaying
                        ? 'bg-rose-950/90 border-rose-400 text-rose-200 shadow-[0_0_12px_rgba(251,113,133,0.25)] font-bold'
                        : 'bg-black/40 border-white/10 text-slate-300 hover:border-rose-400/50 hover:text-white'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">Latido + Alfa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyAudioFusionPreset('hyper_beta')}
                    className={`px-2.5 py-2 rounded-xl border transition cursor-pointer flex items-center gap-2 truncate ${
                      activePreset === 'hyper_beta' && isSoundscapePlaying
                        ? 'bg-[#1f2600]/90 border-[#d6f421] text-[#d6f421] shadow-[0_0_12px_rgba(214,244,33,0.25)] font-bold'
                        : 'bg-black/40 border-white/10 hover:border-[#d6f421]/60 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-[#d6f421] shrink-0" />
                    <span className="truncate">Hiperenfoque 15Hz</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyAudioFusionPreset('study_alpha')}
                    className={`px-2.5 py-2 rounded-xl border transition cursor-pointer flex items-center gap-2 truncate ${
                      activePreset === 'study_alpha' && isSoundscapePlaying
                        ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.25)] font-bold'
                        : 'bg-black/40 border-white/10 hover:border-cyan-400/50 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">Estudio Alpha</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyAudioFusionPreset('scifi_drone')}
                    className={`px-2.5 py-2 rounded-xl border transition cursor-pointer flex items-center gap-2 truncate ${
                      activePreset === 'scifi_drone' && isSoundscapePlaying
                        ? 'bg-purple-950/90 border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.25)] font-bold'
                        : 'bg-black/40 border-white/10 hover:border-purple-400/50 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="truncate">Cabina Sci-Fi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyAudioFusionPreset('brown_void')}
                    className={`px-2.5 py-2 rounded-xl border transition cursor-pointer flex items-center gap-2 truncate ${
                      activePreset === 'brown_void' && isSoundscapePlaying
                        ? 'bg-amber-950/90 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.25)] font-bold'
                        : 'bg-black/40 border-white/10 hover:border-amber-400/50 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Waves className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">Vacío Marrón</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyAudioFusionPreset('mute_all')}
                    className={`px-2.5 py-2 rounded-xl border transition cursor-pointer flex items-center gap-2 truncate col-span-2 sm:col-span-1 ${
                      !isAnyAudioPlaying
                        ? 'bg-slate-900/60 border-white/5 text-slate-500'
                        : 'bg-rose-950/40 border-rose-500/40 hover:border-rose-400 text-rose-300 hover:text-white'
                    }`}
                  >
                    <VolumeX className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">Silenciar Todo</span>
                  </button>
                </div>

                {/* Dedicated Sound Purpose Bar */}
                <div className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 flex items-center gap-2 text-[11px] font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <p className="text-slate-300 leading-snug">
                    {activePreset === 'rain_brown' && (
                      <><strong className="text-cyan-300">Lluvia + Ruido Marrón:</strong> Aísla ruidos bruscos del entorno y calma la hiperactividad mental para sesiones largas.</>
                    )}
                    {activePreset === 'fire_alpha' && (
                      <><strong className="text-sky-300">Olas del Mar + Ondas Alpha (10Hz):</strong> Ritmo marino cadencioso que reduce la ansiedad y favorece la lectura y el flujo creativo.</>
                    )}
                    {activePreset === 'forest_432' && (
                      <><strong className="text-emerald-300">Bosque + 432Hz:</strong> Brisa natural y aves con resonancia armónica para diseño, ideación y trabajo sin estrés.</>
                    )}
                    {activePreset === 'heart_alpha' && (
                      <><strong className="text-rose-300">Latido Natural (60 BPM) + Ondas Alpha:</strong> Sincroniza el pulso cardíaco en reposo con ondas de calma para eliminar la ansiedad y sostener la concentración.</>
                    )}
                    {activePreset === 'hyper_beta' && (
                      <><strong className="text-[#d6f421]">Hiperenfoque Beta (15Hz):</strong> Pulsos binaurales que estimulan la atención sostenida y ejecución rápida (ideal con audífonos).</>
                    )}
                    {activePreset === 'study_alpha' && (
                      <><strong className="text-cyan-300">Estudio Alpha (10Hz):</strong> Sincronización cerebral para absorción de información, memoria y estudio profundo.</>
                    )}
                    {activePreset === 'scifi_drone' && (
                      <><strong className="text-purple-300">Cabina Sci-Fi (Gamma 40Hz):</strong> Drone espacial + frecuencia Gamma para programación, análisis complejo y resolución de problemas.</>
                    )}
                    {activePreset === 'brown_void' && (
                      <><strong className="text-amber-300">Vacío Marrón:</strong> Bloqueo acústico profundo de baja frecuencia, ideal para silenciar conversaciones o ruidos externos.</>
                    )}
                    {!activePreset && (
                      <span className="text-slate-400">Selecciona una mezcla arriba para activar el audio y ver su función cognitiva.</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: NATURE AMBIENT (100% PURE NATURAL SOUNDS - NO QUANTUM FREQUENCIES) */}
            {activeAudioTab === 'nature' && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-black/40 border border-white/10 font-mono">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => selectPureNatureSound('off')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 ${
                        ambientType === 'off'
                          ? 'bg-slate-800 text-white border border-slate-600'
                          : 'bg-black/40 text-slate-400 hover:text-white border border-white/5'
                      }`}
                    >
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Silencio</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => selectPureNatureSound('rain')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 ${
                        ambientType === 'rain' && !isSoundscapePlaying
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-400 font-bold'
                          : 'bg-black/40 text-slate-400 hover:text-cyan-300 border border-white/5'
                      }`}
                    >
                      <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Lluvia</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => selectPureNatureSound('fire')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 ${
                        ambientType === 'fire' && !isSoundscapePlaying
                          ? 'bg-sky-950 text-sky-300 border border-sky-400 font-bold'
                          : 'bg-black/40 text-slate-400 hover:text-sky-300 border border-white/5'
                      }`}
                    >
                      <Waves className="w-3.5 h-3.5 text-sky-400" />
                      <span>Olas del Mar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => selectPureNatureSound('forest')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 ${
                        ambientType === 'forest' && !isSoundscapePlaying
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-400 font-bold'
                          : 'bg-black/40 text-slate-400 hover:text-emerald-300 border border-white/5'
                      }`}
                    >
                      <Trees className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Bosque</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => selectPureNatureSound('heartbeat')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 ${
                        ambientType === 'heartbeat' && !isSoundscapePlaying
                          ? 'bg-rose-950 text-rose-300 border border-rose-400 font-bold shadow-[0_0_10px_rgba(251,113,133,0.25)]'
                          : 'bg-black/40 text-slate-400 hover:text-rose-300 border border-white/5'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 text-rose-400 ${ambientType === 'heartbeat' ? 'animate-pulse' : ''}`} />
                      <span>Latido Natural</span>
                    </button>
                  </div>

                  {ambientType !== 'off' && (
                    <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={ambientVolume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="w-20 accent-emerald-400 cursor-pointer"
                        title="Ajustar volumen del audio ambiental"
                      />
                      <span className="text-[10px] text-emerald-300 w-7">
                        {Math.round(ambientVolume * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Nature Sound Purpose Bar */}
                <div className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 flex items-center gap-2 text-[11px] font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <p className="text-slate-300 leading-snug">
                    {ambientType === 'rain' && (
                      <><strong className="text-cyan-300">Lluvia Suave (Puro):</strong> Ruido acústico continuo que enmascara sonidos del ambiente y relaja la mente sin frecuencias cuánticas.</>
                    )}
                    {ambientType === 'fire' && (
                      <><strong className="text-sky-300">Olas del Mar (Puro):</strong> Ciclos rítmicos de oleaje (~9s) que sincronizan la respiración y reducen la fatiga mental.</>
                    )}
                    {ambientType === 'forest' && (
                      <><strong className="text-emerald-300">Bosque Zen (Puro):</strong> Brisa suave entre árboles y cantos de aves para mantener frescura y calma creativa.</>
                    )}
                    {ambientType === 'heartbeat' && (
                      <><strong className="text-rose-300">Latido del Corazón Natural (60 BPM):</strong> Pulso orgánico en reposo (&ldquo;lub-dub&rdquo;) que induce coherencia cardíaca, calma el sistema nervioso y estabiliza el foco profundo.</>
                    )}
                    {ambientType === 'off' && (
                      <span className="text-slate-400">Elige un sonido natural puro arriba (apaga automáticamente cualquier frecuencia cuántica).</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: QUANTUM CONSOLE */}
            {activeAudioTab === 'quantum' && (
              <QuantumSoundscapeConsole
                compact={true}
                onActivateQuantum={() => {
                  handleAmbientChange('off', true);
                  setActivePreset(null);
                }}
              />
            )}
          </>
        )}

        {/* Compact Footer: Quote + Test Alarms */}
        <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <p className="text-slate-500 italic truncate max-w-md">
            {FOCUS_QUOTES[quoteIndex]}
          </p>

          <div className="flex items-center gap-1.5 font-mono shrink-0 ml-auto">
            <button
              type="button"
              onClick={handleTestWorkAlarm}
              className="px-2 py-1 rounded-lg bg-black/40 hover:bg-cyan-950/60 border border-white/10 hover:border-cyan-400/50 text-slate-400 hover:text-cyan-300 text-[10px] transition cursor-pointer flex items-center gap-1"
              title="Probar sonido de alarma de 25m foco"
            >
              <Bell className="w-3 h-3 text-cyan-400" />
              <span>Alarma 25m</span>
            </button>
            <button
              type="button"
              onClick={handleTestBreakAlarm}
              className="px-2 py-1 rounded-lg bg-black/40 hover:bg-emerald-950/60 border border-white/10 hover:border-emerald-400/50 text-slate-400 hover:text-emerald-300 text-[10px] transition cursor-pointer flex items-center gap-1"
              title="Probar sonido de alarma de 5m relax"
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>Alarma 5m</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
