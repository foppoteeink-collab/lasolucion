import React, { useState, useEffect } from 'react';
import { Waves, VolumeX } from 'lucide-react';
import { quantumSoundscape, SoundscapeState } from '../utils/quantumSoundscape';
import { useUIStore } from '../store/useUIStore';
import { useTimer } from '../context/TimerContext';
import { soundFX } from '../utils/audio';

export const GlobalSoundscapeButton: React.FC = () => {
  const [state, setState] = useState<SoundscapeState>(quantumSoundscape.getState());
  const isPomodoroOpen = useUIStore((s) => s.isPomodoroOpen);
  const { activeAmbientLayers, handleAmbientChange } = useTimer();

  useEffect(() => {
    return quantumSoundscape.subscribe((s) => setState(s));
  }, []);

  const isAnyPlaying = state.isPlaying || activeAmbientLayers.length > 0;

  const handleMuteAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFX.playClick();
    handleAmbientChange('off');
    quantumSoundscape.stop(0.25);
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

  // If Pomodoro panel is already open and no audio is playing, hide redundant second button
  if (isPomodoroOpen && !isAnyPlaying) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleOpenConsole}
        title="Abrir Mezclador de Audio"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95 ${
          isAnyPlaying
            ? 'bg-[#001c2e] text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
            : 'bg-[#000d1a] text-slate-400 border-cyan-500/30 hover:border-cyan-400 hover:text-cyan-300'
        }`}
      >
        <Waves className={`w-3.5 h-3.5 ${isAnyPlaying ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
        <span>{isAnyPlaying ? 'Audio Activo' : 'Audio'}</span>
      </button>

      {isAnyPlaying && (
        <button
          type="button"
          onClick={handleMuteAll}
          title="Silenciar audio"
          className="p-1.5 rounded-xl border bg-rose-950/60 text-rose-300 border-rose-500/40 hover:border-rose-400 hover:text-white transition-all cursor-pointer shrink-0 active:scale-95"
        >
          <VolumeX className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
