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
      soundFX.playDamageSound();
      triggerHaptic([50, 60, 40]);
      setEntropyWarning('⚠️ SOBRECARGA CRÍTICA POR ENTROPÍA (100%): Debes despejar la inercia (completar al menos 1 misión o vencer al Némesis) antes de iniciar el estado de flujo.');
      setTimeout(() => setEntropyWarning(null), 6000);
      return;
    }
    setEntropyWarning(null);
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

  // Audio Fusion Presets Handler (Combines Nature Ambient & WebAudio Quantum Frequencies)
  const applyAudioFusionPreset = (presetKey: string) => {
    soundFX.playClick();
    switch (presetKey) {
      case 'rain_brown':
        handleAmbientChange('rain');
        quantumSoundscape.applyFormula('void_mask');
        break;
      case 'fire_alpha':
        handleAmbientChange('fire');
        quantumSoundscape.applyFormula('calm_study');
        break;
      case 'forest_432':
        handleAmbientChange('forest');
        quantumSoundscape.applyFormula('calm_study');
        quantumSoundscape.playQuantumChime();
        break;
      case 'hyper_beta':
        handleAmbientChange('off');
        quantumSoundscape.applyFormula('hyperfocus');
        break;
      case 'study_alpha':
        handleAmbientChange('off');
        quantumSoundscape.applyFormula('calm_study');
        break;
      case 'scifi_drone':
        handleAmbientChange('off');
        quantumSoundscape.applyFormula('fusion_core');
        break;
      case 'brown_void':
        handleAmbientChange('off');
        quantumSoundscape.applyFormula('void_mask');
        break;
      case 'mute_all':
      default:
        handleAmbientChange('off');
        quantumSoundscape.stop(0.5);
        break;
    }
  };

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

  return (
    <div 
      id="pomodoro-timer-container" 
      className="w-full max-w-4xl mx-auto rounded-2xl bg-[#011420]/95 border border-cyan-500/40 p-4 sm:p-5 shadow-[0_0_30px_rgba(0,240,255,0.18)] backdrop-blur-md text-white my-2 relative"
    >
      {/* Top Header Bar: Mode Selectors, Editable Objective & Close Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cyan-500/30">
        <div className="inline-flex gap-1 p-1 rounded-xl bg-[#000a14] border border-cyan-500/40 text-xs">
          <button
            type="button"
            onClick={() => switchMode('work')}
            className={`px-3 py-1.5 rounded-lg text-xs font-anton tracking-wide transition cursor-pointer flex items-center gap-1.5 uppercase ${
              mode === 'work' ? 'bg-cyan-400 text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>25m Foco</span>
          </button>
          <button
            type="button"
            onClick={() => switchMode('short_break')}
            className={`px-3 py-1.5 rounded-lg text-xs font-anton tracking-wide transition cursor-pointer flex items-center gap-1.5 uppercase ${
              mode === 'short_break' ? 'bg-emerald-400 text-black shadow-[0_0_10px_rgba(52,211,153,0.4)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>5m Relax</span>
          </button>
          <button
            type="button"
            onClick={() => switchMode('long_break')}
            className={`px-3 py-1.5 rounded-lg text-xs font-anton tracking-wide transition cursor-pointer flex items-center gap-1.5 uppercase ${
              mode === 'long_break' ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>15m Pausa</span>
          </button>
        </div>

        {/* Task Title Editable Field */}
        <div className="flex-1 max-w-xs sm:max-w-md min-w-[180px]">
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5 bg-[#000a14] px-2 py-1 rounded-xl border border-cyan-400">
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                className="w-full px-2 py-0.5 bg-transparent text-xs font-medium text-white focus:outline-none placeholder-slate-500"
                placeholder="Escribe el objetivo..."
              />
              <button
                type="button"
                onClick={() => setIsEditingTitle(false)}
                className="p-1 rounded-lg bg-cyan-400 text-black font-bold hover:bg-cyan-300 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingTitle(true)}
              className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-[#000a14] border border-cyan-500/40 hover:border-cyan-400 text-slate-300 hover:text-white transition cursor-pointer text-xs font-medium group"
              title="Haz clic para editar el objetivo actual"
            >
              <div className="flex items-center gap-2 truncate">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate font-medium">{taskTitle || 'Establecer objetivo de foco...'}</span>
              </div>
              <Pencil className="w-3 h-3 text-slate-500 group-hover:text-slate-300 shrink-0" />
            </button>
          )}
        </div>

        {/* Explicit Close / Minimize Button */}
        <button
          type="button"
          onClick={handleClosePomodoro}
          className="p-1.5 rounded-xl bg-[#000a14] text-slate-400 hover:text-white hover:bg-cyan-950/60 border border-cyan-500/40 hover:border-cyan-400 transition cursor-pointer shrink-0"
          title="Ocultar / Minimizar Reloj de Foco"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Timer Display & Primary Actions */}
      <div className="py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Clock Display & Companion Aura */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center">
            <HoloCompanion
              archetype={stats?.characterClass || 'sabio'}
              size={54}
              auraState="focus_trance"
              interactive={true}
            />
          </div>
          <div className="text-5xl sm:text-6xl font-anton tracking-wider text-white tabular-nums drop-shadow-[0_0_12px_rgba(0,240,255,0.35)]">
            {formattedTime}
          </div>
          <div className="flex flex-col gap-1">
            <span className={`text-[10px] font-anton uppercase tracking-wider px-2.5 py-0.5 rounded-full border self-start ${theme.badgeClass}`}>
              {theme.badgeText}
            </span>
            <span className="text-xs font-mono text-slate-300">
              {progressPercent}% completado • {completedPomodorosToday} hoy
            </span>
            <span className="text-[10px] font-mono text-cyan-400">
              Metrónomo de respiración activo
            </span>
          </div>
        </div>

        {/* Entropy Warning Banner if 100% */}
        {entropyWarning && (
          <div className="w-full bg-rose-950/90 border border-rose-500/80 rounded-xl p-3 text-xs text-rose-200 font-sans shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-bounce mb-3">
            {entropyWarning}
          </div>
        )}

        {/* Timer Control Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${theme.buttonGradient}`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>Iniciar Foco</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={resetTimer}
            className="p-2.5 rounded-xl bg-[#000a14] text-slate-400 hover:text-white border border-cyan-500/40 hover:border-cyan-400 transition cursor-pointer active:scale-90"
            title="Reiniciar temporizador"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-black rounded-full overflow-hidden mb-4 border border-cyan-500/30">
        <div
          className={`h-full ${theme.progressColor} transition-all duration-500`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* ========================================================================= */}
      {/* UNIFIED AUDIO FUSION HUB (Combines Nature Ambient & WebAudio Quantum Frequencies) */}
      {/* ========================================================================= */}
      <div id="pomodoro-audio-hub" className="pt-3 border-t border-cyan-500/30 space-y-3">
        {/* Audio Hub Title & Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-cyan-950/80 border border-cyan-400/50 text-cyan-300">
              <Waves className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-anton tracking-wide text-white uppercase flex items-center gap-1.5">
                <span>🔊 Fusión de Audio & Paisajes Sonoros</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/40 text-cyan-300 font-mono font-bold">
                  Ambiental + Cuántico
                </span>
              </h4>
              <p className="text-[10px] text-slate-400 font-mono">
                Combina sonidos naturales con frecuencias binaurales de hiperenfoque.
              </p>
            </div>
          </div>

          {/* Quick Sub-Tab Switcher */}
          <div className="flex items-center gap-1 bg-[#000a14] p-1 rounded-xl border border-cyan-500/40 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setActiveAudioTab('presets');
              }}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                activeAudioTab === 'presets'
                  ? 'bg-cyan-400 text-black font-bold shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Presintonías</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setActiveAudioTab('nature');
              }}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                activeAudioTab === 'nature'
                  ? 'bg-emerald-400 text-black font-bold shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CloudRain className="w-3 h-3" />
              <span>Naturaleza</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setActiveAudioTab('quantum');
              }}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                activeAudioTab === 'quantum'
                  ? 'bg-gradient-to-r from-purple-500 to-cyan-400 text-black font-bold shadow-[0_0_8px_rgba(150,0,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Headphones className="w-3 h-3" />
              <span>Cuántica (3CH)</span>
            </button>
          </div>
        </div>

        {/* CONTENT FOR TAB 1: PRESETS */}
        {activeAudioTab === 'presets' && (
          <div className="p-3 rounded-xl bg-[#000a14] border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" /> Mezclas Fusión Instantáneas de 1-Clic:
              </span>
              {(ambientType !== 'off' || isSoundscapePlaying) && (
                <span className="text-cyan-300 font-bold animate-pulse">● Audio Reproduciéndose</span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => applyAudioFusionPreset('rain_brown')}
                className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  ambientType === 'rain' && isSoundscapePlaying
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                    : 'bg-[#001222] border-cyan-500/30 text-slate-300 hover:border-cyan-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                  <CloudRain className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Lluvia + Ruido</span>
                </div>
                <span className="text-[9px] text-slate-400 mt-1">Lluvia suave + Aislamiento Marrón</span>
              </button>

              <button
                type="button"
                onClick={() => applyAudioFusionPreset('fire_alpha')}
                className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  ambientType === 'fire'
                    ? 'bg-amber-950 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                    : 'bg-[#001222] border-amber-500/30 text-slate-300 hover:border-amber-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                  <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Fogata + Alfa</span>
                </div>
                <span className="text-[9px] text-slate-400 mt-1">Fuego de leña + Ondas Alpha 10Hz</span>
              </button>

              <button
                type="button"
                onClick={() => applyAudioFusionPreset('forest_432')}
                className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  ambientType === 'forest'
                    ? 'bg-emerald-950 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                    : 'bg-[#001222] border-emerald-500/30 text-slate-300 hover:border-emerald-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                  <Trees className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Bosque + 432Hz</span>
                </div>
                <span className="text-[9px] text-slate-400 mt-1">Naturaleza zen + Resonancia armónica</span>
              </button>

              <button
                type="button"
                onClick={() => applyAudioFusionPreset('hyper_beta')}
                className="p-2 rounded-xl bg-[#001222] border border-[#d6f421]/40 hover:border-[#d6f421] text-slate-300 hover:text-white text-left transition cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                  <Zap className="w-3.5 h-3.5 text-[#d6f421] shrink-0" />
                  <span>Hiperenfoque 15Hz</span>
                </div>
                <span className="text-[9px] text-slate-400 mt-1">Pulsos Beta binaurales (Auriculares)</span>
              </button>

              <button
                type="button"
                onClick={() => applyAudioFusionPreset('study_alpha')}
                className="p-2 rounded-xl bg-[#001222] border border-cyan-500/30 hover:border-cyan-400 text-slate-300 hover:text-white text-left transition cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                  <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Estudio Alpha</span>
                </div>
                <span className="text-[9px] text-slate-400 mt-1">Ondas de aprendizaje continuo 10Hz</span>
              </button>

              <button
                type="button"
                onClick={() => applyAudioFusionPreset('scifi_drone')}
                className="p-2 rounded-xl bg-[#001222] border border-purple-500/40 hover:border-purple-400 text-slate-300 hover:text-white text-left transition cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                  <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Cabina Sci-Fi</span>
                </div>
                <span className="text-[9px] text-slate-400 mt-1">Drone espacial reactor + Gamma 40Hz</span>
              </button>

              <button
                type="button"
                onClick={() => applyAudioFusionPreset('brown_void')}
                className="p-2 rounded-xl bg-[#001222] border border-amber-500/30 hover:border-amber-400 text-slate-300 hover:text-white text-left transition cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                  <Waves className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Vacío Marrón</span>
                </div>
                <span className="text-[9px] text-slate-400 mt-1">Bloqueo acústico de ruidos externos</span>
              </button>

              <button
                type="button"
                onClick={() => applyAudioFusionPreset('mute_all')}
                className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white text-left transition cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                  <VolumeX className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Silenciar Todo</span>
                </div>
                <span className="text-[9px] text-slate-500 mt-1">Apagar todo el audio de fondo</span>
              </button>
            </div>
          </div>
        )}

        {/* CONTENT FOR TAB 2: NATURE AMBIENT */}
        {activeAudioTab === 'nature' && (
          <div className="p-3 rounded-xl bg-[#000a14] border border-emerald-500/30 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5 font-mono">
                <CloudRain className="w-4 h-4 text-emerald-400" />
                <span>Audio Ambiental de la Naturaleza (Procedural):</span>
              </span>

              {ambientType !== 'off' && (
                <div className="flex items-center gap-1.5 bg-[#001424] px-2.5 py-1 rounded-xl border border-emerald-500/40">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={ambientVolume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-24 accent-emerald-400 cursor-pointer"
                    title="Ajustar volumen del audio ambiental"
                  />
                  <span className="text-[10px] font-mono text-emerald-300 w-7">
                    {Math.round(ambientVolume * 100)}%
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 font-mono">
              <button
                type="button"
                onClick={() => handleAmbientChange('off')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  ambientType === 'off'
                    ? 'bg-slate-800 text-slate-200 border border-slate-600'
                    : 'bg-[#001222] text-slate-500 hover:text-slate-300 border border-slate-800'
                }`}
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>Silencio</span>
              </button>

              <button
                type="button"
                onClick={() => handleAmbientChange('rain')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  ambientType === 'rain'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                    : 'bg-[#001222] text-slate-400 hover:text-cyan-300 border border-cyan-500/30'
                }`}
              >
                <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                <span>Lluvia Suave</span>
              </button>

              <button
                type="button"
                onClick={() => handleAmbientChange('fire')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  ambientType === 'fire'
                    ? 'bg-amber-950 text-amber-300 border border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                    : 'bg-[#001222] text-slate-400 hover:text-amber-300 border border-amber-500/30'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Fogata Acogedora</span>
              </button>

              <button
                type="button"
                onClick={() => handleAmbientChange('forest')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  ambientType === 'forest'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                    : 'bg-[#001222] text-slate-400 hover:text-emerald-300 border border-emerald-500/30'
                }`}
              >
                <Trees className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bosque Zen</span>
              </button>
            </div>
          </div>
        )}

        {/* CONTENT FOR TAB 3: QUANTUM CONSOLE */}
        {activeAudioTab === 'quantum' && (
          <div className="space-y-2">
            <QuantumSoundscapeConsole compact={true} />
          </div>
        )}

        {/* Master Toolbar & Alarm Testing */}
        <div className="pt-2 border-t border-cyan-500/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-cyan-400 font-bold">
              <Zap className="w-3.5 h-3.5" /> +25 XP / pomo
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <Coins className="w-3.5 h-3.5" /> +8 Monedas
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <span className="text-slate-500 text-[10px] hidden lg:inline">Alarmas de Prueba:</span>
            <button
              type="button"
              onClick={handleTestWorkAlarm}
              className="px-2.5 py-1 rounded-lg bg-[#000a14] hover:bg-cyan-950/60 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 active:scale-95"
              title="Probar sonido de alarma de 25m foco"
            >
              <Bell className="w-3 h-3 text-cyan-400" />
              <span>Alarma 25m</span>
            </button>
            <button
              type="button"
              onClick={handleTestBreakAlarm}
              className="px-2.5 py-1 rounded-lg bg-[#000a14] hover:bg-emerald-950/60 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 active:scale-95"
              title="Probar sonido de alarma de 5m relax"
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>Alarma 5m</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inspirational Quote Footer Banner */}
      <div className="mt-3 pt-2 border-t border-cyan-500/20 text-center">
        <p className="text-[11px] text-slate-400 italic">
          {FOCUS_QUOTES[quoteIndex]}
        </p>
      </div>
    </div>
  );
});
