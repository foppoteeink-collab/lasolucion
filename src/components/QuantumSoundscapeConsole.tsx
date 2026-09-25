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
}

export const QuantumSoundscapeConsole: React.FC<QuantumSoundscapeConsoleProps> = ({ compact = false }) => {
  const [state, setState] = useState<SoundscapeState>(quantumSoundscape.getState());
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const unsub = quantumSoundscape.subscribe((s) => setState(s));
    return () => unsub();
  }, []);

  const handleTogglePlay = () => {
    soundFX.playClick();
    quantumSoundscape.togglePlay();
  };

  const handleChime = () => {
    quantumSoundscape.playQuantumChime();
  };

  const activeBinaural = BINAURAL_CONFIGS[state.binauralMode];

  return (
    <div className="w-full rounded-2xl bg-[#000a14]/95 border border-[#00f0ff]/40 p-4 sm:p-5 shadow-[0_0_30px_rgba(0,240,255,0.12)] backdrop-blur-md text-white font-sans relative overflow-hidden">
      {/* Background Ambience Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#9600ff]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cyan-500/20 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-400/40 text-cyan-300">
            <Waves className="w-4 h-4 text-cyan-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-anton tracking-wide text-white uppercase flex items-center gap-1.5">
                <span>Consola Acústica Cuántica</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/40 text-cyan-300 font-mono font-bold tracking-normal">
                  WebAudio v2
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Mezclador multi-capa procedural: Aislamiento sensorial & Neuro-frecuencias
            </p>
          </div>
        </div>

        {/* Master Power & Status */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 rounded-xl bg-[#001424] hover:bg-cyan-950/60 border border-cyan-500/30 text-slate-400 hover:text-cyan-300 transition cursor-pointer"
            title="Información científica y de uso"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleTogglePlay}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-anton tracking-wide uppercase transition-all cursor-pointer shadow-lg active:scale-95 ${
              state.isPlaying
                ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                : 'bg-gradient-to-r from-cyan-400 to-[#00f0ff] hover:from-cyan-300 hover:to-cyan-200 text-black shadow-[0_0_18px_rgba(0,240,255,0.4)]'
            }`}
          >
            {state.isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Silenciar</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>Iniciar Paisaje</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Popover Drawer */}
      {showInfo && (
        <div className="my-3 p-3.5 rounded-xl bg-[#011424] border border-cyan-500/30 text-xs text-slate-300 space-y-2 relative z-10 font-mono">
          <div className="flex items-center justify-between text-cyan-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-cyan-400" /> Fundamentos de Aislamiento Acústico
            </span>
            <button
              type="button"
              onClick={() => setShowInfo(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-300">
            • <strong>Base de Ruido (Canal 1):</strong> Enmascara fluctuaciones auditivas ambientales (puertas, voces, ruidos de la calle).
            <br />
            • <strong>Pulsos Binaurales (Canal 2):</strong> Requiere auriculares estéreo. Al escuchar frecuencias desfasadas (ej. 200 Hz y 215 Hz), el cerebro sincroniza sus ondas en 15 Hz (Beta), induciendo concentración activa.
            <br />
            • <strong>Drone Sci-Fi (Canal 3):</strong> Aporta espacialidad y calidez analógica para evitar la fatiga acústica.
          </p>
        </div>
      )}

      {/* Presets Quick Bar */}
      <div className="py-3 flex flex-wrap items-center justify-between gap-2 relative z-10 border-b border-cyan-500/10">
        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" /> Presintonías:
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              quantumSoundscape.applyFormula('hyperfocus');
            }}
            className="px-2.5 py-1 rounded-lg bg-[#001424] hover:bg-cyan-950/80 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-[11px] font-mono transition cursor-pointer flex items-center gap-1 active:scale-95"
          >
            <Zap className="w-3 h-3 text-[#d6f421]" />
            <span>Hiperenfoque Beta</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              quantumSoundscape.applyFormula('calm_study');
            }}
            className="px-2.5 py-1 rounded-lg bg-[#001424] hover:bg-emerald-950/80 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 text-[11px] font-mono transition cursor-pointer flex items-center gap-1 active:scale-95"
          >
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>Estudio Alpha</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              quantumSoundscape.applyFormula('fusion_core');
            }}
            className="px-2.5 py-1 rounded-lg bg-[#001424] hover:bg-purple-950/80 border border-purple-500/40 hover:border-purple-400 text-purple-300 text-[11px] font-mono transition cursor-pointer flex items-center gap-1 active:scale-95"
          >
            <Cpu className="w-3 h-3 text-[#fb5607]" />
            <span>Sprint Gamma 40Hz</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              quantumSoundscape.applyFormula('void_mask');
            }}
            className="px-2.5 py-1 rounded-lg bg-[#001424] hover:bg-amber-950/80 border border-amber-500/40 hover:border-amber-400 text-amber-300 text-[11px] font-mono transition cursor-pointer flex items-center gap-1 active:scale-95"
          >
            <Waves className="w-3 h-3 text-amber-400" />
            <span>Vacío Marrón</span>
          </button>
        </div>
      </div>

      {/* 3 Channel Mixing Console */}
      <div className="py-4 grid grid-cols-1 md:grid-cols-3 gap-3.5 relative z-10">
        {/* ========================================= */}
        {/* CHANNEL 1: Noise Masking */}
        {/* ========================================= */}
        <div
          className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
            state.channel1Muted
              ? 'bg-[#000d18]/60 border-slate-800 opacity-60'
              : 'bg-[#001222]/90 border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.08)]'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-1 pb-2 border-b border-cyan-500/20">
              <div className="flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-anton tracking-wide uppercase text-white">Canal 1: Aislamiento</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  quantumSoundscape.toggleChannel1Mute();
                }}
                className={`p-1 rounded-lg transition cursor-pointer ${
                  state.channel1Muted ? 'bg-red-950 text-red-400' : 'bg-cyan-950/60 text-cyan-300 hover:text-white'
                }`}
                title="Mute Canal 1"
              >
                {state.channel1Muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Noise Type Selector */}
            <div className="mt-2.5 grid grid-cols-3 gap-1 text-[10px] font-mono">
              {(['brown', 'pink', 'white'] as NoiseType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    quantumSoundscape.setNoiseType(t);
                  }}
                  className={`py-1 rounded-lg font-bold uppercase transition cursor-pointer text-center ${
                    state.noiseType === t
                      ? 'bg-cyan-400 text-black shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                      : 'bg-[#000a14] text-slate-400 hover:text-white border border-cyan-500/20'
                  }`}
                >
                  {t === 'brown' ? 'Marrón' : t === 'pink' ? 'Rosa' : 'Blanco'}
                </button>
              ))}
            </div>

            <p className="text-[10px] text-slate-400 mt-2 font-mono line-clamp-2">
              {NOISE_CONFIGS[state.noiseType].desc}
            </p>
          </div>

          {/* Volume Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Densidad</span>
              <span>{Math.round(state.channel1Volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={state.channel1Volume}
              onChange={(e) => quantumSoundscape.setChannel1Volume(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-[#000a14] rounded-lg"
            />
          </div>
        </div>

        {/* ========================================= */}
        {/* CHANNEL 2: Binaural Brainwaves */}
        {/* ========================================= */}
        <div
          className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
            state.channel2Muted
              ? 'bg-[#000d18]/60 border-slate-800 opacity-60'
              : 'bg-[#001222]/90 border-[#9600ff]/50 shadow-[0_0_15px_rgba(150,0,255,0.1)]'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-1 pb-2 border-b border-[#9600ff]/30">
              <div className="flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5 text-[#d6f421]" />
                <span className="text-xs font-anton tracking-wide uppercase text-white">Canal 2: Binaural L/R</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  quantumSoundscape.toggleChannel2Mute();
                }}
                className={`p-1 rounded-lg transition cursor-pointer ${
                  state.channel2Muted ? 'bg-red-950 text-red-400' : 'bg-purple-950/60 text-purple-300 hover:text-white'
                }`}
                title="Mute Canal 2"
              >
                {state.channel2Muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Wave Mode Selector */}
            <div className="mt-2.5 grid grid-cols-4 gap-1 text-[10px] font-mono">
              {(['gamma', 'beta', 'alpha', 'theta'] as BinauralMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    quantumSoundscape.setBinauralMode(m);
                  }}
                  className={`py-1 rounded-lg font-bold uppercase transition cursor-pointer text-center ${
                    state.binauralMode === m
                      ? 'bg-gradient-to-r from-purple-500 to-[#d6f421] text-black shadow-[0_0_8px_rgba(214,244,33,0.4)]'
                      : 'bg-[#000a14] text-slate-400 hover:text-white border border-[#9600ff]/20'
                  }`}
                >
                  {m === 'gamma' ? '40Hz' : m === 'beta' ? '15Hz' : m === 'alpha' ? '10Hz' : '6Hz'}
                </button>
              ))}
            </div>

            <p className="text-[10px] text-slate-400 mt-2 font-mono line-clamp-2">
              <strong className="text-white">{activeBinaural.name}:</strong> {activeBinaural.desc}
            </p>
          </div>

          {/* Volume Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span>Modulación</span>
                <span className="text-[9px] text-emerald-400 font-bold">🎧 Estéreo</span>
              </span>
              <span>{Math.round(state.channel2Volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={state.channel2Volume}
              onChange={(e) => quantumSoundscape.setChannel2Volume(parseFloat(e.target.value))}
              className="w-full accent-[#d6f421] cursor-pointer h-1.5 bg-[#000a14] rounded-lg"
            />
          </div>
        </div>

        {/* ========================================= */}
        {/* CHANNEL 3: Sci-Fi Spacecraft / Quantum Reactor Drone */}
        {/* ========================================= */}
        <div
          className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
            state.channel3Muted
              ? 'bg-[#000d18]/60 border-slate-800 opacity-60'
              : 'bg-[#001222]/90 border-amber-500/40 shadow-[0_0_15px_rgba(251,86,7,0.08)]'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-1 pb-2 border-b border-amber-500/20">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-anton tracking-wide uppercase text-white">Canal 3: Drone Espacial</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  quantumSoundscape.toggleChannel3Mute();
                }}
                className={`p-1 rounded-lg transition cursor-pointer ${
                  state.channel3Muted ? 'bg-red-950 text-red-400' : 'bg-amber-950/60 text-amber-300 hover:text-white'
                }`}
                title="Mute Canal 3"
              >
                {state.channel3Muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Drone Preset Selector */}
            <div className="mt-2.5 grid grid-cols-3 gap-1 text-[10px] font-mono">
              {(['deep', 'subtle', 'pulsing'] as DronePreset[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    quantumSoundscape.setDronePreset(p);
                  }}
                  className={`py-1 rounded-lg font-bold uppercase transition cursor-pointer text-center ${
                    state.dronePreset === p
                      ? 'bg-amber-400 text-black shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                      : 'bg-[#000a14] text-slate-400 hover:text-white border border-amber-500/20'
                  }`}
                >
                  {p === 'deep' ? 'Reactor' : p === 'subtle' ? 'Cabina' : 'Pulso'}
                </button>
              ))}
            </div>

            <p className="text-[10px] text-slate-400 mt-2 font-mono line-clamp-2">
              {state.dronePreset === 'deep'
                ? 'Resonancia profunda sub-grave (55 Hz) con filtro LFO analógico.'
                : state.dronePreset === 'subtle'
                ? 'Rumor constante de soporte vital para evitar el vacío acústico estéril.'
                : 'Oscilación rítmica periódica para mantener un pulso motor activo.'}
            </p>
          </div>

          {/* Volume Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Profundidad</span>
              <span>{Math.round(state.channel3Volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={state.channel3Volume}
              onChange={(e) => quantumSoundscape.setChannel3Volume(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-[#000a14] rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Footer Controls: Master Volume, Sync & Chime */}
      <div className="pt-3 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 text-xs relative z-10 font-mono">
        {/* Master Slider */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 uppercase font-bold flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Master:
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={state.masterVolume}
            onChange={(e) => quantumSoundscape.setMasterVolume(parseFloat(e.target.value))}
            className="w-24 sm:w-32 accent-cyan-400 cursor-pointer h-1.5 bg-[#000a14] rounded-lg"
          />
          <span className="text-[11px] font-bold text-cyan-300 w-8">
            {Math.round(state.masterVolume * 100)}%
          </span>
        </div>

        {/* Auto Sync Toggle & Harmonic Chime */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={state.autoSyncPomodoro}
              onChange={(e) => {
                soundFX.playClick();
                quantumSoundscape.setAutoSyncPomodoro(e.target.checked);
              }}
              className="rounded accent-cyan-400 cursor-pointer"
            />
            <span className="text-slate-400 hover:text-cyan-300 transition">
              Auto-vincular con Pomodoro
            </span>
          </label>

          <button
            type="button"
            onClick={handleChime}
            className="px-2.5 py-1 rounded-lg bg-[#001424] hover:bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold transition cursor-pointer flex items-center gap-1 active:scale-95"
            title="Probar campana cuántica 432 Hz"
          >
            <Bell className="w-3 h-3 text-cyan-400" />
            <span>Campana 432Hz</span>
          </button>
        </div>
      </div>
    </div>
  );
};
