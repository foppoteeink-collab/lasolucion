import React, { useState, useEffect, useMemo } from 'react';
import { PomodoroSession, TaskCategory } from '../types';
import { useTimer } from '../context/TimerContext';
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
  const todayTasks = useTaskStore(state => state.tasksByDate[getTodayDateString()] || []);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [scState, setScState] = useState<SoundscapeState>(quantumSoundscape.getState());
  const [showAdvancedEq, setShowAdvancedEq] = useState(false);
  const [entropyWarning, setEntropyWarning] = useState<string | null>(null);
  const [lastToggledInfo, setLastToggledInfo] = useState<string | null>(null);

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
      setEntropyWarning('⚡ MODO RESCATE: Ciclo iniciado para romper la inercia.');
      setTimeout(() => setEntropyWarning(null), 6000);
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
    useUIStore.getState().setModalState('isPomodoroOpen', false);
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
          badgeClass: 'border-emerald-400/60 text-emerald-300 bg-[#000a14]',
          badgeText: 'Relax',
          buttonGradient: 'bg-emerald-400 hover:bg-emerald-300 text-black font-anton tracking-wide shadow-[0_0_15px_rgba(52,211,153,0.4)]',
          progressColor: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]',
        };
      case 'long_break':
        return {
          badgeClass: 'border-indigo-400/60 text-indigo-300 bg-[#000a14]',
          badgeText: 'Pausa',
          buttonGradient: 'bg-indigo-500 hover:bg-indigo-400 text-white font-anton tracking-wide shadow-[0_0_15px_rgba(99,102,241,0.4)]',
          progressColor: 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]',
        };
      case 'work':
      default:
        return {
          badgeClass: 'border-cyan-400/60 text-cyan-300 bg-[#000a14]',
          badgeText: 'Foco',
          buttonGradient: 'bg-cyan-400 hover:bg-cyan-300 text-black font-anton tracking-wide shadow-[0_0_15px_rgba(0,240,255,0.4)]',
          progressColor: 'bg-gradient-to-r from-blue-600 via-cyan-400 to-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.6)]',
        };
    }
  }, [mode]);

  return (
    <div
      id="pomodoro-timer-container"
      className="w-full max-w-4xl mx-auto rounded-2xl bg-[#01101a]/95 border border-cyan-500/30 p-3 sm:p-4 shadow-[0_0_25px_rgba(0,240,255,0.12)] backdrop-blur-md text-white my-1.5 relative"
    >
      {/* ROW 1: Mode Switcher + Editable Objective + Close */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/10">
        <div className="inline-flex gap-1 p-0.5 rounded-xl bg-black/50 border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => switchMode('work')}
            className={`px-2.5 py-1 rounded-lg text-xs font-anton tracking-wide transition cursor-pointer flex items-center gap-1 uppercase ${
              mode === 'work' ? 'bg-cyan-400 text-black shadow-[0_0_10px_rgba(0,240,255,0.3)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>25m</span>
          </button>
          <button
            type="button"
            onClick={() => switchMode('short_break')}
            className={`px-2.5 py-1 rounded-lg text-xs font-anton tracking-wide transition cursor-pointer flex items-center gap-1 uppercase ${
              mode === 'short_break' ? 'bg-emerald-400 text-black shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>5m</span>
          </button>
          <button
            type="button"
            onClick={() => switchMode('long_break')}
            className={`px-2.5 py-1 rounded-lg text-xs font-anton tracking-wide transition cursor-pointer flex items-center gap-1 uppercase ${
              mode === 'long_break' ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>15m</span>
          </button>
        </div>

        <div className="flex-1 max-w-xs sm:max-w-sm min-w-[140px]">
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-xl border border-cyan-400">
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                className="w-full bg-transparent text-xs font-medium text-white focus:outline-none placeholder-slate-500"
                placeholder="Objetivo..."
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
              className="w-full flex items-center justify-between gap-2 px-2.5 py-1 rounded-xl bg-black/40 border border-white/10 hover:border-cyan-400/50 text-slate-300 hover:text-white transition cursor-pointer text-xs group"
              title="Editar objetivo de foco"
            >
              <span className="truncate">{taskTitle || 'Objetivo de foco...'}</span>
              <Pencil className="w-3 h-3 text-slate-500 group-hover:text-slate-300 shrink-0" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleClosePomodoro}
          className="p-1.5 rounded-xl bg-black/40 text-slate-400 hover:text-white border border-white/10 hover:border-cyan-400/50 transition cursor-pointer shrink-0"
          title="Minimizar panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ROW 2: Clock + Primary Controls */}
      <div className="py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 flex items-center justify-center">
            <HoloCompanion
              archetype={stats?.characterClass || 'sabio'}
              size={40}
              auraState="focus_trance"
              interactive={true}
            />
          </div>
          <div className="text-4xl sm:text-5xl font-anton tracking-wider text-white tabular-nums drop-shadow-[0_0_10px_rgba(0,240,255,0.25)]">
            {formattedTime}
          </div>
          <div className="flex flex-col gap-0.5 text-[10px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className={`font-anton uppercase tracking-wider px-2 py-0.2 rounded-full border ${theme.badgeClass}`}>
                {theme.badgeText}
              </span>
              <span className="text-slate-400">• {completedPomodorosToday} hoy</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-cyan-400 font-bold">+25 XP</span>
              <span>•</span>
              <span className="text-amber-400 font-bold">+8 🪙</span>
            </div>
          </div>
        </div>

        {entropyWarning && (
          <div className="w-full bg-rose-950/90 border border-rose-500/80 rounded-xl p-2 text-xs text-rose-200">
            {entropyWarning}
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${theme.buttonGradient}`}
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
            onClick={resetTimer}
            className="p-2 rounded-xl bg-black/40 text-slate-400 hover:text-white border border-white/10 hover:border-cyan-400/50 transition cursor-pointer active:scale-90"
            title="Reiniciar reloj"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full h-1 bg-black/80 rounded-full overflow-hidden mb-2.5">
        <div
          className={`h-full ${theme.progressColor} transition-all duration-500`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* ROW 3: MULTI-LAYER AUDIO MIXER (Combine any sounds freely with zero clutter) */}
      <div id="pomodoro-audio-hub" className="pt-2 border-t border-white/10 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Waves className={`w-3.5 h-3.5 shrink-0 ${isAnyAudioPlaying ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Mezclador
            </span>
            {activeMixNames.length > 0 ? (
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded-full truncate max-w-[220px] sm:max-w-xs">
                {activeMixNames.join(' + ')}
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                Toca varios para combinarlos
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {isAnyAudioPlaying && (
              <>
                <div className="flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded-lg border border-white/10">
                  <Volume2 className="w-3 h-3 text-cyan-400" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={ambientVolume}
                    onChange={(e) => handleUnifiedVolume(parseFloat(e.target.value))}
                    className="w-16 sm:w-20 accent-cyan-400 cursor-pointer"
                    title="Volumen general de la mezcla"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleMuteAll}
                  className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-500/40 transition cursor-pointer"
                  title="Silenciar todo"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setShowAdvancedEq(!showAdvancedEq);
              }}
              className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 text-[10px] font-mono ${
                showAdvancedEq
                  ? 'bg-purple-950/80 border-purple-400 text-purple-200'
                  : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
              }`}
              title="Ecualizador avanzado de 3 canales"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">3CH</span>
            </button>
          </div>
        </div>

        {/* 8 COMBINABLE SOUND LAYER CHIPS */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 font-mono text-[11px]">
          {/* 1. Lluvia */}
          <button
            type="button"
            onClick={() => handleToggleNature('rain', '🌧️ Lluvia: Aísla ruidos externos y relaja la corteza auditiva')}
            title="Lluvia Suave — Aísla ruidos del entorno"
            className={`px-2 py-1.5 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeAmbientLayers.includes('rain')
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,240,255,0.25)] font-bold'
                : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:border-cyan-500/40'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">Lluvia</span>
          </button>

          {/* 2. Olas del Mar */}
          <button
            type="button"
            onClick={() => handleToggleNature('fire', '🌊 Olas del Mar: Ritmo oceánico cadencioso que reduce la fatiga')}
            title="Olas del Mar — Ritmo marino anti-estrés"
            className={`px-2 py-1.5 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeAmbientLayers.includes('fire')
                ? 'bg-sky-950/90 border-sky-400 text-sky-200 shadow-[0_0_10px_rgba(56,189,248,0.25)] font-bold'
                : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:border-sky-500/40'
            }`}
          >
            <Waves className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate">Olas</span>
          </button>

          {/* 3. Bosque */}
          <button
            type="button"
            onClick={() => handleToggleNature('forest', '🌲 Bosque: Brisa natural y aves para fluidez creativa')}
            title="Bosque Zen — Brisa y aves naturales"
            className={`px-2 py-1.5 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeAmbientLayers.includes('forest')
                ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 shadow-[0_0_10px_rgba(52,211,153,0.25)] font-bold'
                : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:border-emerald-500/40'
            }`}
          >
            <Trees className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Bosque</span>
          </button>

          {/* 4. Latido Natural */}
          <button
            type="button"
            onClick={() => handleToggleNature('heartbeat', '💓 Latido 60 BPM: Pulso orgánico para coherencia cardíaca y calma')}
            title="Latido del Corazón (60 BPM) — Coherencia cardíaca"
            className={`px-2 py-1.5 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeAmbientLayers.includes('heartbeat')
                ? 'bg-rose-950/90 border-rose-400 text-rose-200 shadow-[0_0_10px_rgba(251,113,133,0.25)] font-bold'
                : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:border-rose-500/40'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 text-rose-400 shrink-0 ${activeAmbientLayers.includes('heartbeat') ? 'animate-pulse' : ''}`} />
            <span className="truncate">Latido</span>
          </button>

          {/* 5. Ondas Alpha (10Hz) */}
          <button
            type="button"
            onClick={() => handleToggleBinaural('alpha', '🧘 Alpha 10Hz: Sincronización cerebral para lectura y estudio sereno')}
            title="Ondas Alpha (10Hz) — Estudio y calma mental"
            className={`px-2 py-1.5 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
              isAlphaActive
                ? 'bg-teal-950/90 border-teal-400 text-teal-200 shadow-[0_0_10px_rgba(45,212,191,0.25)] font-bold'
                : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:border-teal-500/40'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="truncate">Alpha</span>
          </button>

          {/* 6. Ondas Beta (15Hz) */}
          <button
            type="button"
            onClick={() => handleToggleBinaural('beta', '⚡ Beta 15Hz: Hiperenfoque activo y ejecución rápida')}
            title="Ondas Beta (15Hz) — Hiperenfoque y ejecución"
            className={`px-2 py-1.5 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
              isBetaActive
                ? 'bg-[#1f2600]/90 border-[#d6f421] text-[#d6f421] shadow-[0_0_10px_rgba(214,244,33,0.25)] font-bold'
                : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:border-[#d6f421]/40'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#d6f421] shrink-0" />
            <span className="truncate">Beta</span>
          </button>

          {/* 7. Drone 432Hz */}
          <button
            type="button"
            onClick={() => handleToggleDrone('✨ Drone 432Hz: Atmósfera armónica espacial para inmersión profunda')}
            title="Drone 432Hz — Inmersión armónica"
            className={`px-2 py-1.5 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
              isDroneActive
                ? 'bg-purple-950/90 border-purple-400 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.25)] font-bold'
                : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:border-purple-500/40'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="truncate">432Hz</span>
          </button>

          {/* 8. Ruido Marrón */}
          <button
            type="button"
            onClick={() => handleToggleBrownNoise('🛡️ Ruido Marrón: Bloqueo acústico profundo contra distracciones')}
            title="Ruido Marrón — Bloqueo acústico de baja frecuencia"
            className={`px-2 py-1.5 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
              isBrownActive
                ? 'bg-amber-950/90 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.25)] font-bold'
                : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:border-amber-500/40'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Marrón</span>
          </button>
        </div>

        {/* Single-line subtle hint ONLY when a sound is active */}
        {isAnyAudioPlaying && lastToggledInfo && (
          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between px-1">
            <span className="truncate">{lastToggledInfo}</span>
          </div>
        )}

        {/* Optional Collapsible 3-Channel Fine Equalizer */}
        {showAdvancedEq && (
          <div className="pt-1">
            <QuantumSoundscapeConsole compact={true} />
          </div>
        )}
      </div>
    </div>
  );
});
