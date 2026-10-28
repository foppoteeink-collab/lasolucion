import React, { useState, useEffect, useRef } from 'react';
import './moxen.css';
import { Play, Pause, RotateCcw, Trophy, Flame } from 'lucide-react';
import { soundFX } from '../../utils/audio';

export interface HabitRaceItem {
  id: string;
  name: string;
  streaksByPeriod: number[]; // e.g. [3, 7, 12, 18, 21, 28, 35, 45, 66]
  color?: string;
  energyLabel?: string;
}

interface MoxenCarreraProps {
  habits: HabitRaceItem[];
  periods?: string[]; // e.g. ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8', 'Sem 9']
  title?: string;
}

export const MoxenCarrera: React.FC<MoxenCarreraProps> = ({
  habits,
  periods = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8', 'Sem 9'],
  title = 'Carrera Cuántica de Hábitos (Evolución Temporal)'
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const totalSteps = periods.length;

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 700);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, totalSteps]);

  const sortedHabits = [...habits].map((h) => {
    const val = h.streaksByPeriod[currentStep] || 0;
    return {
      ...h,
      currentValue: val
    };
  }).sort((a, b) => b.currentValue - a.currentValue);

  const maxValue = Math.max(10, ...habits.flatMap(h => h.streaksByPeriod));

  const handleTogglePlay = () => {
    soundFX.playClick();
    if (currentStep >= totalSteps - 1) {
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleReset = () => {
    soundFX.playClick();
    setIsPlaying(false);
    setCurrentStep(0);
  };

  return (
    <div className="moxen-carrera-root p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#080e1e] to-[#02050e] border border-purple-500/30 shadow-[0_10px_35px_rgba(168,85,247,0.1)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-32 bg-purple-600/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-mono font-bold uppercase tracking-widest">
            <Trophy className="w-4 h-4 text-amber-400" />
            Competición de Consistencia
          </div>
          <h3 className="text-base sm:text-lg font-anton uppercase tracking-wide text-white mt-0.5">
            {title}
          </h3>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePlay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition-all shadow-[0_0_12px_rgba(168,85,247,0.4)] cursor-pointer active:scale-95"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            <span>{isPlaying ? 'Pausa' : 'Iniciar Carrera'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Reiniciar carrera"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Race Stage Area */}
      <div className="cr-escena relative z-10">
        {/* Giant period label in the background */}
        <div className="cr-fondo-cifra">
          {periods[currentStep]}
        </div>

        {/* Habit Bars */}
        <div className="space-y-3 relative z-10">
          {sortedHabits.map((habit, rankIdx) => {
            const isFirst = rankIdx === 0 && habit.currentValue > 0;
            const pct = Math.min(100, Math.round((habit.currentValue / maxValue) * 100));
            const barColor = habit.color || (isFirst ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #a855f7, #c084fc)');

            return (
              <div key={habit.id} className="cr-fila">
                <div className="cr-etiqueta flex items-center gap-1.5">
                  <span className="font-mono text-xs font-black text-slate-400 w-4">
                    #{rankIdx + 1}
                  </span>
                  <span className="truncate text-white text-xs font-bold" title={habit.name}>
                    {habit.name}
                  </span>
                </div>

                <div className="cr-barra-track">
                  <div
                    className={`cr-barra-fill ${isFirst ? 'is-primero' : ''}`}
                    style={{
                      width: `${pct}%`,
                      background: barColor
                    }}
                  />
                </div>

                <div className="cr-valor font-mono">
                  {habit.currentValue} <span className="text-[10px] text-slate-400 font-sans">días</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline Scrubber */}
      <div className="mt-4 pt-3 border-t border-purple-500/20 relative z-10 flex items-center justify-between text-xs font-mono text-slate-400">
        <span>Inicio ({periods[0]})</span>
        <div className="flex items-center gap-1">
          {periods.map((p, idx) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                soundFX.playClick();
                setCurrentStep(idx);
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                currentStep === idx
                  ? 'bg-purple-400 shadow-[0_0_8px_#c084fc] scale-125'
                  : 'bg-slate-700 hover:bg-slate-500'
              }`}
              title={p}
            />
          ))}
        </div>
        <span>Final ({periods[periods.length - 1]})</span>
      </div>
    </div>
  );
};

export default MoxenCarrera;
