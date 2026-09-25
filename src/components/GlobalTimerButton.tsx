import { useUIStore } from '../store/useUIStore';
import React from 'react';
import { Timer } from 'lucide-react';
import { useTimer } from '../context/TimerContext';
import * as gameEngine from '../engine/gameEngine';
import { soundFX } from '../utils/audio';

export const GlobalTimerButton: React.FC = () => {
  const { isRunning, formattedTime } = useTimer();
  const isPomodoroOpen = useUIStore(s => s.isPomodoroOpen);

  const handleClick = () => {
    soundFX.playClick();
    const store = useUIStore.getState();
    if (store.activeTab !== 'dashboard') {
      store.setActiveTab('dashboard');
    }
    const nextState = !isPomodoroOpen;
    store.setModalState('isPomodoroOpen', nextState);

    if (nextState) {
      setTimeout(() => {
        const el = document.getElementById('pomodoro-timer-container');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-black transition-all cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.15)] shrink-0 active:scale-95 ${
        isPomodoroOpen
          ? 'bg-blue-900/60 text-white border-blue-400'
          : isRunning
          ? 'bg-[#002b12] text-[#39ff14] border-[#39ff14] shadow-[0_0_15px_rgba(57,255,20,0.3)] animate-pulse'
          : 'bg-[#001A33] text-cyan-300 border-cyan-400 hover:bg-[#002b5e] hover:text-white'
      }`}
    >
      <Timer className={`w-4 h-4 ${isRunning ? 'text-[#39ff14] animate-spin-slow' : 'text-cyan-400'}`} />
      <span>
        {isPomodoroOpen ? 'Ocultar Foco' : isRunning ? `Modo Foco (${formattedTime})` : 'Modo Foco'}
      </span>
    </button>
  );
};
