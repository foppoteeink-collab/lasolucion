import React, { useState, useEffect, useRef } from 'react';
import './moxen.css';
import { Play, Pause, RotateCcw, Trophy, Flame, Plus } from 'lucide-react';
import { soundFX } from '../../utils/audio';
import { useUIStore } from '../../store/useUIStore';
import { useSystemPalette } from '../../utils/systemPalette';

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
  const palette = useSystemPalette();
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

  // MOX-01: Pausar automáticamente si la pestaña se oculta para ahorrar ciclos de CPU y batería
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && isPlaying) {
        setIsPlaying(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isPlaying]);

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
    <div className="moxen-carrera-root relative isolate p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden">
      <span className="vi-grano opacity-5" aria-hidden="true" />
      <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 aura-text-primary text-xs font-mono font-bold uppercase tracking-widest">
            <Trophy className="w-4 h-4 text-amber-400" />
            Competición de Consistencia
          </div>
          <h3 className="text-base sm:text-lg font-anton uppercase tracking-wider text-white mt-0.5">
            {title}
          </h3>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePlay}
            disabled={habits.length === 0}
            aria-label={isPlaying ? 'Pausar carrera cuántica' : 'Iniciar carrera cuántica'}
            className="chicle-btn aura-btn-gradient optic-active-card flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed font-anton uppercase tracking-wider text-xs transition-all cursor-pointer active:scale-95"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Pausa' : 'Iniciar Carrera'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={habits.length === 0}
            aria-label="Reiniciar carrera al primer periodo"
            className="chicle-btn p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 disabled:opacity-40 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Reiniciar carrera"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Guide explanation box */}
      <div className="p-2 sm:p-2.5 rounded-xl bg-[#040814]/80 border aura-border-subtle text-[10px] sm:text-[11px] text-slate-300 font-mono mb-3 flex items-start gap-2 relative z-10">
        <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <span className="leading-tight">
          <strong className="text-white">¿Cómo interpretarlo?</strong> Observa la evolución de tus rachas en cada periodo. Pulsa <strong className="aura-text-soft">Iniciar Carrera</strong> para ver la animación temporal hasta la consolidación neuroplástica.
        </span>
      </div>

      {/* MOX-02: Empty State o Pista Activa */}
      {habits.length === 0 ? (
        <div className="py-8 px-4 rounded-2xl bg-[#040814]/80 border border-white/10 text-center space-y-3 relative z-10">
          <div className="w-12 h-12 rounded-2xl aura-bg-soft border aura-border-subtle aura-glow-subtle flex items-center justify-center mx-auto">
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h4 className="text-white font-anton text-sm uppercase tracking-wider">
              Sin Hábitos en la Pista Cuántica
            </h4>
            <p className="text-slate-400 text-xs font-mono max-w-sm mx-auto mt-1">
              Crea hábitos diarios para verlos competir y evolucionar con sus rachas temporales semana a semana.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              useUIStore.getState().openTaskForm('habit');
            }}
            className="chicle-btn aura-btn-gradient optic-active-card inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-anton text-xs uppercase tracking-wider cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Forjar Primer Hábito</span>
          </button>
        </div>
      ) : (
        <>
          {/* Race Stage Area */}
          <div className="cr-escena relative z-10">
            {/* Giant period label in the background */}
            <div className="cr-fondo-cifra">
              {periods[currentStep]}
            </div>

            {/* Habit Bars (Mobile-first responsive rows) */}
            <div className="space-y-2.5 relative z-10">
              {sortedHabits.map((habit, rankIdx) => {
                const isFirst = rankIdx === 0 && habit.currentValue > 0;
                const pct = Math.min(100, Math.round((habit.currentValue / maxValue) * 100));
                const barColor = habit.color || (isFirst ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : `linear-gradient(90deg, ${palette.c1}, ${palette.c2})`);
                const medal = rankIdx === 0 ? '🥇' : rankIdx === 1 ? '🥈' : rankIdx === 2 ? '🥉' : `#${rankIdx + 1}`;

                return (
                  <div
                    key={habit.id}
                    className="p-2 sm:p-2.5 rounded-xl bg-[#040814]/80 border border-white/10 transition-all hover:border-white/20"
                  >
                    {/* Header line for each habit */}
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0 pr-2">
                        <span className="font-mono tabular-nums text-xs font-black text-amber-400 shrink-0">
                          {medal}
                        </span>
                        <span className="truncate text-white font-bold" title={habit.name}>
                          {habit.name}
                        </span>
                      </div>

                      <div className="shrink-0 font-mono tabular-nums text-xs font-black aura-text-soft">
                        {habit.currentValue} <span className="text-[10px] text-slate-400 font-sans font-normal">días</span>
                      </div>
                    </div>

                    {/* Full-width responsive track */}
                    <div className="w-full h-3 rounded-full bg-black/60 overflow-hidden border border-white/10 relative">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isFirst ? 'shadow-[0_0_12px_rgba(245,158,11,0.5)]' : ''}`}
                        style={{
                          width: `${pct}%`,
                          background: barColor
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Scrubber */}
          <div className="mt-3.5 pt-2.5 border-t border-white/10 relative z-10 flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-400">
            <span className="truncate">{periods[0]}</span>
            <div className="flex items-center gap-0.5 sm:gap-1" role="group" aria-label="Línea de tiempo de la carrera">
              {periods.map((p, idx) => {
                const isActiveStep = currentStep === idx;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setCurrentStep(idx);
                    }}
                    aria-label={`Saltar al periodo ${p}`}
                    aria-pressed={isActiveStep}
                    className={`min-w-[28px] min-h-[28px] flex items-center justify-center rounded-full transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aura-color-1,#00f0ff)] ${
                      isActiveStep ? 'optic-active-card' : ''
                    }`}
                    title={p}
                  >
                    <span
                      className={`block rounded-full transition-all ${
                        isActiveStep
                          ? 'w-3 h-3 scale-125'
                          : 'w-2.5 h-2.5 bg-white/20 group-hover:bg-white/45'
                      }`}
                      style={
                        isActiveStep
                          ? {
                              backgroundColor: palette.c1,
                              boxShadow: `0 0 10px ${palette.c1}`
                            }
                          : undefined
                      }
                    />
                  </button>
                );
              })}
            </div>
            <span className="truncate">{periods[periods.length - 1]}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default MoxenCarrera;
