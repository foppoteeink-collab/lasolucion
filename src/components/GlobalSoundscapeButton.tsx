import React, { useState, useEffect } from 'react';
import { Waves, VolumeX, Play } from 'lucide-react';
import { quantumSoundscape, SoundscapeState, BINAURAL_CONFIGS } from '../utils/quantumSoundscape';
import { useUIStore } from '../store/useUIStore';
import { soundFX } from '../utils/audio';

export const GlobalSoundscapeButton: React.FC = () => {
  const [state, setState] = useState<SoundscapeState>(quantumSoundscape.getState());
  const isPomodoroOpen = useUIStore((s) => s.isPomodoroOpen);
  const setIsPomodoroOpen = (v: boolean) => useUIStore.getState().setModalState('isPomodoroOpen', v);

  useEffect(() => {
    return quantumSoundscape.subscribe((s) => setState(s));
  }, []);

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFX.playClick();
    if (state.isPlaying) {
      soundFX.stopAmbientSound();
    }
    quantumSoundscape.togglePlay();
  };

  const handleOpenConsole = () => {
    soundFX.playClick();
    const store = useUIStore.getState();
    if (store.activeTab !== 'dashboard') {
      store.setActiveTab('dashboard');
    }
    store.setModalState('isPomodoroOpen', true);
    setTimeout(() => {
      const el = document.getElementById('pomodoro-audio-hub') || document.getElementById('pomodoro-timer-container');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  const activeMode = BINAURAL_CONFIGS[state.binauralMode];

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleOpenConsole}
        title="Abrir Consola Acústica Cuántica"
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-black transition-all cursor-pointer shrink-0 active:scale-95 ${
          state.isPlaying
            ? 'bg-[#001c2e] text-[#00f0ff] border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
            : 'bg-[#000d1a] text-slate-400 border-cyan-500/30 hover:border-cyan-400 hover:text-cyan-300'
        }`}
      >
        <Waves className={`w-3.5 h-3.5 ${state.isPlaying ? 'text-[#d6f421] animate-spin-slow' : 'text-cyan-400'}`} />
        <span className="hidden md:inline">
          {state.isPlaying ? `Acústica (${activeMode.name.split(' ')[0]})` : 'Acústica Cuántica'}
        </span>
        <span className="md:hidden">
          {state.isPlaying ? activeMode.name.split(' ')[0] : 'Audio'}
        </span>

        {state.isPlaying && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#d6f421] animate-pulse ml-0.5" />
        )}
      </button>

      {/* Quick Play/Pause Shortcut */}
      <button
        type="button"
        onClick={handleToggleSound}
        title={state.isPlaying ? 'Silenciar paisaje acústico' : 'Reproducir paisaje acústico'}
        className={`p-1.5 rounded-xl border transition-all cursor-pointer shrink-0 active:scale-95 ${
          state.isPlaying
            ? 'bg-cyan-950/80 text-cyan-300 border-cyan-400/60 hover:bg-red-950/80 hover:text-red-300 hover:border-red-400'
            : 'bg-[#000d1a] text-slate-500 border-cyan-500/30 hover:text-cyan-300 hover:border-cyan-400'
        }`}
      >
        {state.isPlaying ? (
          <VolumeX className="w-3.5 h-3.5" />
        ) : (
          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
        )}
      </button>
    </div>
  );
};
