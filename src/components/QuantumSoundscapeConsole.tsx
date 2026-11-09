import React, { useState, useEffect } from 'react';
import {
  quantumSoundscape,
  SoundscapeState,
  BINAURAL_CONFIGS,
  NOISE_CONFIGS,
  SOUND_FORMULAS,
  SoundFormula,
  BinauralMode,
  NoiseType,
  DronePreset,
} from '../utils/quantumSoundscape';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Headphones,
  Waves,
  Sliders,
  Bell,
  Cpu,
  Info,
  Shield,
  Zap,
  Sparkles,
  Check,
} from 'lucide-react';
import { soundFX } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface QuantumSoundscapeConsoleProps {
  compact?: boolean;
  onActivateQuantum?: () => void;
}

export const QuantumSoundscapeConsole: React.FC<QuantumSoundscapeConsoleProps> = ({
  compact = false,
  onActivateQuantum,
}) => {
  const [state, setState] = useState<SoundscapeState>(quantumSoundscape.getState());
  const [focusedInfo, setFocusedInfo] = useState<{ title: string; desc: string } | null>(null);

  useEffect(() => {
    const unsub = quantumSoundscape.subscribe((s) => setState(s));
    return () => unsub();
  }, []);

  const handleTogglePlay = () => {
    soundFX.playClick();
    triggerHaptic(25);
    if (!state.isPlaying) {
      onActivateQuantum?.();
    }
    quantumSoundscape.togglePlay();
  };

  const handleChime = () => {
    soundFX.playClick();
    triggerHaptic([30, 45]);
    quantumSoundscape.playQuantumChime();
  };

  const handleApplyFormula = (fId: SoundFormula) => {
    soundFX.playClick();
    triggerHaptic([25, 35]);
    onActivateQuantum?.();
    quantumSoundscape.applyFormula(fId);
    const formula = SOUND_FORMULAS[fId];
    setFocusedInfo({
      title: `Fórmula Psicoacústica • ${formula.name}`,
      desc: `${formula.desc} (${formula.binaural} + Ruido ${formula.noise} + Drone ${formula.drone})`,
    });
  };

  const activeBinaural = BINAURAL_CONFIGS[state.binauralMode];
  const activeNoise = NOISE_CONFIGS[state.noiseType];
  const droneDescriptions: Record<DronePreset, { name: string; desc: string }> = {
    deep: {
      name: 'Reactor Profundo (110 Hz)',
      desc: 'Resonancia armónica grave que estabiliza la atención.',
    },
    subtle: {
      name: 'Cabina Orbital',
      desc: 'Soporte acústico continuo y suave para jornadas prolongadas.',
    },
    pulsing: {
      name: 'Pulso Rítmico',
      desc: 'Oscilación periódica para mantener un ritmo ágil y constante.',
    },
  };
  const activeDrone = droneDescriptions[state.dronePreset];

  const currentGuide = focusedInfo || {
    title: state.activeFormula
      ? `Fórmula: ${SOUND_FORMULAS[state.activeFormula].name} (${SOUND_FORMULAS[state.activeFormula].subtitle})`
      : `${activeBinaural.name} + Ruido ${state.noiseType === 'brown' ? 'Marrón' : state.noiseType === 'pink' ? 'Rosa' : 'Blanco'}`,
    desc: state.activeFormula
      ? SOUND_FORMULAS[state.activeFormula].desc
      : activeBinaural.desc,
  };

  return (
    <div className="w-full space-y-2.5 text-white font-sans">
      {/* Quick Tactical Sound Formulas Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Fórmulas Psicoacústicas:</span>
          </span>
          <span className="text-[9px] font-mono text-cyan-400/80">1-Clic Instantáneo</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5" role="toolbar" aria-label="Fórmulas de Paisaje Sonoro">
          {(Object.keys(SOUND_FORMULAS) as SoundFormula[]).map((fKey) => {
            const f = SOUND_FORMULAS[fKey];
            const isSelected = state.activeFormula === fKey && state.isPlaying;
            return (
              <button
                key={fKey}
                type="button"
                onClick={() => handleApplyFormula(fKey)}
                onMouseEnter={() =>
                  setFocusedInfo({
                    title: `Fórmula • ${f.name} (${f.subtitle})`,
                    desc: `${f.desc} (${f.binaural} + ${f.noise} + ${f.drone})`,
                  })
                }
                onMouseLeave={() => setFocusedInfo(null)}
                aria-pressed={isSelected}
                aria-label={`Activar fórmula ${f.name}: ${f.subtitle}`}
                className={`px-2 py-1.5 rounded-xl border transition-all cursor-pointer text-left flex items-center justify-between gap-1.5 ${
                  isSelected
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400/50'
                    : 'bg-black/40 border-white/10 text-slate-300 hover:border-cyan-500/40 hover:bg-black/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm shrink-0 leading-none">{f.icon}</span>
                  <div className="truncate">
                    <p className="text-[11px] font-bold truncate leading-tight">{f.name}</p>
                    <p className="text-[9px] font-mono text-slate-400 truncate leading-none">{f.subtitle}</p>
                  </div>
                </div>
                {isSelected && <Check className="w-3 h-3 text-cyan-300 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 Minimalist Channel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* CHANNEL 1: Noise Masking */}
        <div
          onMouseEnter={() => setFocusedInfo({ title: `Canal 1 • ${activeNoise.name}`, desc: activeNoise.desc })}
          onMouseLeave={() => setFocusedInfo(null)}
          className={`p-2.5 rounded-xl border transition-all space-y-2 ${
            state.channel1Muted
              ? 'bg-black/30 border-white/5 opacity-55'
              : 'bg-black/50 border-cyan-500/30 hover:border-cyan-400/60'
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">1. Aislamiento</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-400">
                {state.channel1Muted ? 'OFF' : `${Math.round(state.channel1Volume * 100)}%`}
              </span>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  triggerHaptic(15);
                  quantumSoundscape.toggleChannel1Mute();
                }}
                aria-pressed={state.channel1Muted}
                aria-label={state.channel1Muted ? 'Reactivar volumen Canal 1 Aislamiento' : 'Silenciar Canal 1 Aislamiento'}
                className={`p-1 rounded-md transition cursor-pointer ${
                  state.channel1Muted ? 'bg-rose-950/80 text-rose-400' : 'bg-white/5 text-cyan-300 hover:text-white'
                }`}
                title="Silenciar / Activar Canal 1"
              >
                {state.channel1Muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 text-[10px] font-mono" role="group" aria-label="Tipos de ruido estocástico">
            {(['brown', 'pink', 'white'] as NoiseType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  triggerHaptic(15);
                  onActivateQuantum?.();
                  quantumSoundscape.setNoiseType(t);
                  setFocusedInfo({ title: `Canal 1 • ${NOISE_CONFIGS[t].name}`, desc: NOISE_CONFIGS[t].desc });
                }}
                aria-pressed={state.noiseType === t}
                aria-label={`Seleccionar Ruido ${t === 'brown' ? 'Marrón' : t === 'pink' ? 'Rosa' : 'Blanco'}`}
                className={`py-1 rounded-lg font-bold uppercase transition cursor-pointer text-center ${
                  state.noiseType === t
                    ? 'bg-cyan-400 text-black shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                    : 'bg-black/60 text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                {t === 'brown' ? 'Marrón' : t === 'pink' ? 'Rosa' : 'Blanco'}
              </button>
            ))}
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={state.channel1Volume}
            onChange={(e) => quantumSoundscape.setChannel1Volume(parseFloat(e.target.value))}
            aria-label="Volumen Canal 1: Aislamiento Acústico"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(state.channel1Volume * 100)}
            aria-valuetext={`${Math.round(state.channel1Volume * 100)}%`}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg block"
          />
        </div>

        {/* CHANNEL 2: Binaural Brainwaves */}
        <div
          onMouseEnter={() => setFocusedInfo({ title: `Canal 2 • Ondas ${activeBinaural.name}`, desc: activeBinaural.desc })}
          onMouseLeave={() => setFocusedInfo(null)}
          className={`p-2.5 rounded-xl border transition-all space-y-2 ${
            state.channel2Muted
              ? 'bg-black/30 border-white/5 opacity-55'
              : 'bg-black/50 border-purple-500/30 hover:border-purple-400/60'
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Headphones className="w-3.5 h-3.5 text-[#d6f421]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">2. Binaural</span>
              <span
                className="text-[8px] font-mono px-1 py-0.2 rounded bg-[#d6f421]/15 text-[#d6f421] border border-[#d6f421]/30 tracking-tight"
                title="Los pulsos binaurales requieren audífonos estéreo para sincronizar los hemisferios cerebrales"
              >
                Audífonos L/R
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-400">
                {state.channel2Muted ? 'OFF' : `${Math.round(state.channel2Volume * 100)}%`}
              </span>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  triggerHaptic(15);
                  quantumSoundscape.toggleChannel2Mute();
                }}
                aria-pressed={state.channel2Muted}
                aria-label={state.channel2Muted ? 'Reactivar volumen Canal 2 Binaural' : 'Silenciar Canal 2 Binaural'}
                className={`p-1 rounded-md transition cursor-pointer ${
                  state.channel2Muted ? 'bg-rose-950/80 text-rose-400' : 'bg-white/5 text-purple-300 hover:text-white'
                }`}
                title="Silenciar / Activar Canal 2"
              >
                {state.channel2Muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 text-[10px] font-mono" role="group" aria-label="Frecuencias binaurales">
            {(['gamma', 'beta', 'alpha', 'theta'] as BinauralMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  triggerHaptic(15);
                  onActivateQuantum?.();
                  quantumSoundscape.setBinauralMode(m);
                  setFocusedInfo({ title: `Canal 2 • Ondas ${BINAURAL_CONFIGS[m].name}`, desc: BINAURAL_CONFIGS[m].desc });
                }}
                aria-pressed={state.binauralMode === m}
                aria-label={`Frecuencia binaural ${BINAURAL_CONFIGS[m].name}`}
                className={`py-1 rounded-lg font-bold uppercase transition cursor-pointer text-center ${
                  state.binauralMode === m
                    ? 'bg-[#d6f421] text-black shadow-[0_0_8px_rgba(214,244,33,0.4)]'
                    : 'bg-black/60 text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                {m === 'gamma' ? '40Hz' : m === 'beta' ? '15Hz' : m === 'alpha' ? '10Hz' : '6Hz'}
              </button>
            ))}
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={state.channel2Volume}
            onChange={(e) => quantumSoundscape.setChannel2Volume(parseFloat(e.target.value))}
            aria-label="Volumen Canal 2: Ondas Binaurales L/R"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(state.channel2Volume * 100)}
            aria-valuetext={`${Math.round(state.channel2Volume * 100)}%`}
            className="w-full accent-[#d6f421] cursor-pointer h-1.5 bg-white/10 rounded-lg block"
          />
        </div>

        {/* CHANNEL 3: Sci-Fi Spacecraft Drone */}
        <div
          onMouseEnter={() => setFocusedInfo({ title: `Canal 3 • ${activeDrone.name}`, desc: activeDrone.desc })}
          onMouseLeave={() => setFocusedInfo(null)}
          className={`p-2.5 rounded-xl border transition-all space-y-2 ${
            state.channel3Muted
              ? 'bg-black/30 border-white/5 opacity-55'
              : 'bg-black/50 border-amber-500/30 hover:border-amber-400/60'
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">3. Drone Espacial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-400">
                {state.channel3Muted ? 'OFF' : `${Math.round(state.channel3Volume * 100)}%`}
              </span>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  triggerHaptic(15);
                  quantumSoundscape.toggleChannel3Mute();
                }}
                aria-pressed={state.channel3Muted}
                aria-label={state.channel3Muted ? 'Reactivar volumen Canal 3 Drone' : 'Silenciar Canal 3 Drone'}
                className={`p-1 rounded-md transition cursor-pointer ${
                  state.channel3Muted ? 'bg-rose-950/80 text-rose-400' : 'bg-white/5 text-amber-300 hover:text-white'
                }`}
                title="Silenciar / Activar Canal 3"
              >
                {state.channel3Muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 text-[10px] font-mono" role="group" aria-label="Presets de Drone Armónico">
            {(['deep', 'subtle', 'pulsing'] as DronePreset[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  triggerHaptic(15);
                  onActivateQuantum?.();
                  quantumSoundscape.setDronePreset(p);
                  setFocusedInfo({ title: `Canal 3 • ${droneDescriptions[p].name}`, desc: droneDescriptions[p].desc });
                }}
                aria-pressed={state.dronePreset === p}
                aria-label={`Preset de Drone ${droneDescriptions[p].name}`}
                className={`py-1 rounded-lg font-bold uppercase transition cursor-pointer text-center ${
                  state.dronePreset === p
                    ? 'bg-amber-400 text-black shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                    : 'bg-black/60 text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                {p === 'deep' ? 'Reactor' : p === 'subtle' ? 'Cabina' : 'Pulso'}
              </button>
            ))}
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={state.channel3Volume}
            onChange={(e) => quantumSoundscape.setChannel3Volume(parseFloat(e.target.value))}
            aria-label="Volumen Canal 3: Drone Espacial"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(state.channel3Volume * 100)}
            aria-valuetext={`${Math.round(state.channel3Volume * 100)}%`}
            className="w-full accent-amber-400 cursor-pointer h-1.5 bg-white/10 rounded-lg block"
          />
        </div>
      </div>

      {/* Guide Info Banner */}
      <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-2 text-[11px] font-mono" role="status">
        <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <p className="text-slate-300 truncate">
          <strong className="text-cyan-300">{currentGuide.title}:</strong>{' '}
          <span className="text-slate-400">{currentGuide.desc}</span>
        </p>
      </div>

      {/* Footer Controls: Master Volume, 432Hz Chime, Auto-sync & Master Play/Pause */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400 uppercase">Master:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={state.masterVolume}
            onChange={(e) => quantumSoundscape.setMasterVolume(parseFloat(e.target.value))}
            aria-label="Volumen Master de Paisaje Sonoro"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(state.masterVolume * 100)}
            aria-valuetext={`${Math.round(state.masterVolume * 100)}%`}
            className="w-24 accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg"
          />
          <span className="text-cyan-300 font-bold w-8">{Math.round(state.masterVolume * 100)}%</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Auto-Sync with Pomodoro Toggle */}
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              triggerHaptic(15);
              quantumSoundscape.setAutoSyncPomodoro(!state.autoSyncPomodoro);
            }}
            aria-pressed={state.autoSyncPomodoro}
            aria-label="Sincronización automática de audio con Pomodoro"
            title="Activa o silencia el paisaje sonoro automáticamente al arrancar o pausar el Pomodoro"
            className={`px-2 py-1 rounded-lg text-[10px] font-mono border transition flex items-center gap-1 cursor-pointer ${
              state.autoSyncPomodoro
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Auto-Pomodoro: {state.autoSyncPomodoro ? 'ON' : 'OFF'}</span>
          </button>

          {/* Tibetan Singing Bowl Chime */}
          <button
            type="button"
            onClick={handleChime}
            aria-label="Tocar campana armónica cuántica 432Hz"
            className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-cyan-950/60 border border-white/10 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-300 text-[10px] transition cursor-pointer flex items-center gap-1"
          >
            <Bell className="w-3 h-3 text-cyan-400" />
            <span>432Hz</span>
          </button>

          {/* Master Play / Pause */}
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-pressed={state.isPlaying}
            aria-label={state.isPlaying ? 'Silenciar paisaje sonoro' : 'Activar paisaje sonoro'}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer flex items-center gap-1 ${
              state.isPlaying
                ? 'bg-rose-500/20 border border-rose-500/60 text-rose-300 hover:bg-rose-500/30'
                : 'bg-cyan-400 text-black hover:bg-cyan-300'
            }`}
          >
            {state.isPlaying ? (
              <>
                <Pause className="w-3 h-3 fill-current" />
                <span>Silenciar</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Activar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
