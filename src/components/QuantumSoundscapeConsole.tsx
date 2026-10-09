import React, { useState, useEffect } from 'react';
import {
  quantumSoundscape,
  SoundscapeState,
  BINAURAL_CONFIGS,
  NOISE_CONFIGS,
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
  Radio,
  Zap,
  Sparkles,
  Waves,
  Sliders,
  Bell,
  Cpu,
  RefreshCw,
  Info,
} from 'lucide-react';
import { soundFX } from '../utils/audio';

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
    if (!state.isPlaying) {
      onActivateQuantum?.();
    }
    quantumSoundscape.togglePlay();
  };

  const handleChime = () => {
    quantumSoundscape.playQuantumChime();
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
      desc: 'Soporte acústico continuo y suave.',
    },
    pulsing: {
      name: 'Pulso Rítmico',
      desc: 'Oscilación periódica para ritmo constante.',
    },
  };
  const activeDrone = droneDescriptions[state.dronePreset];

  const currentGuide = focusedInfo || {
    title: `${activeBinaural.name} + Ruido ${state.noiseType === 'brown' ? 'Marrón' : state.noiseType === 'pink' ? 'Rosa' : 'Blanco'}`,
    desc: activeBinaural.desc,
  };

  return (
    <div className="w-full space-y-2 text-white font-sans">
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
                  quantumSoundscape.toggleChannel1Mute();
                }}
                className={`p-1 rounded-md transition cursor-pointer ${
                  state.channel1Muted ? 'bg-rose-950/80 text-rose-400' : 'bg-white/5 text-cyan-300 hover:text-white'
                }`}
                title="Silenciar / Activar Canal 1"
              >
                {state.channel1Muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
            {(['brown', 'pink', 'white'] as NoiseType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onActivateQuantum?.();
                  quantumSoundscape.setNoiseType(t);
                  setFocusedInfo({ title: `Canal 1 • ${NOISE_CONFIGS[t].name}`, desc: NOISE_CONFIGS[t].desc });
                }}
                className={`py-1 rounded-lg font-bold uppercase transition cursor-pointer text-center ${
                  state.noiseType === t
                    ? 'bg-cyan-400 text-black'
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
            className="w-full accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-lg block"
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
            <div className="flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-[#d6f421]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">2. Binaural L/R</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-400">
                {state.channel2Muted ? 'OFF' : `${Math.round(state.channel2Volume * 100)}%`}
              </span>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  quantumSoundscape.toggleChannel2Mute();
                }}
                className={`p-1 rounded-md transition cursor-pointer ${
                  state.channel2Muted ? 'bg-rose-950/80 text-rose-400' : 'bg-white/5 text-purple-300 hover:text-white'
                }`}
                title="Silenciar / Activar Canal 2"
              >
                {state.channel2Muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
            {(['gamma', 'beta', 'alpha', 'theta'] as BinauralMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onActivateQuantum?.();
                  quantumSoundscape.setBinauralMode(m);
                  setFocusedInfo({ title: `Canal 2 • Ondas ${BINAURAL_CONFIGS[m].name}`, desc: BINAURAL_CONFIGS[m].desc });
                }}
                className={`py-1 rounded-lg font-bold uppercase transition cursor-pointer text-center ${
                  state.binauralMode === m
                    ? 'bg-[#d6f421] text-black'
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
            className="w-full accent-[#d6f421] cursor-pointer h-1 bg-white/10 rounded-lg block"
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
                  quantumSoundscape.toggleChannel3Mute();
                }}
                className={`p-1 rounded-md transition cursor-pointer ${
                  state.channel3Muted ? 'bg-rose-950/80 text-rose-400' : 'bg-white/5 text-amber-300 hover:text-white'
                }`}
                title="Silenciar / Activar Canal 3"
              >
                {state.channel3Muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
            {(['deep', 'subtle', 'pulsing'] as DronePreset[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onActivateQuantum?.();
                  quantumSoundscape.setDronePreset(p);
                  setFocusedInfo({ title: `Canal 3 • ${droneDescriptions[p].name}`, desc: droneDescriptions[p].desc });
                }}
                className={`py-1 rounded-lg font-bold uppercase transition cursor-pointer text-center ${
                  state.dronePreset === p
                    ? 'bg-amber-400 text-black'
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
            className="w-full accent-amber-400 cursor-pointer h-1 bg-white/10 rounded-lg block"
          />
        </div>
      </div>

      {!compact && (
        <>
          <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-2 text-[11px] font-mono">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <p className="text-slate-300 truncate">
              <strong className="text-cyan-300">{currentGuide.title}:</strong>{' '}
              <span className="text-slate-400">{currentGuide.desc}</span>
            </p>
          </div>

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
                className="w-24 accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-lg"
              />
              <span className="text-cyan-300 font-bold w-8">{Math.round(state.masterVolume * 100)}%</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleChime}
                className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-cyan-950/60 border border-white/10 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-300 text-[10px] transition cursor-pointer flex items-center gap-1"
              >
                <Bell className="w-3 h-3 text-cyan-400" />
                <span>432Hz</span>
              </button>

              <button
                type="button"
                onClick={handleTogglePlay}
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
        </>
      )}
    </div>
  );
};
