import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Zap } from 'lucide-react';
import { MoxenRayas } from '../moxen/MoxenRayas';
import { QuantumCubeLoader } from '../QuantumCubeLoader';

interface OracleTheatricalLoaderProps {
  userContext?: {
    class?: string;
    rank?: string;
    name?: string;
  };
  engineMode?: 'ai' | 'local';
}

const SIMPLE_STAGES = [
  {
    title: 'Leyendo tus horarios y actividades...',
    desc: 'Identificando cada tarea, día de la semana y franja horaria.'
  },
  {
    title: 'Ordenando tu día sin choques...',
    desc: 'Acomodando cada bloque para que ninguna actividad se traslape.'
  },
  {
    title: 'Preparando tu vista previa...',
    desc: 'En un segundo podrás revisar y editar cualquier bloque antes de guardar.'
  }
];

export const OracleTheatricalLoader: React.FC<OracleTheatricalLoaderProps> = ({
  engineMode = 'ai'
}) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const cap = currentStageIndex === 0 ? 45 : currentStageIndex === 1 ? 82 : 96;
        return prev < cap ? prev + 1 : prev;
      });
    }, 60);

    const stageTimeout = setTimeout(() => {
      if (currentStageIndex < SIMPLE_STAGES.length - 1) {
        setCurrentStageIndex(prev => prev + 1);
      }
    }, 2400);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stageTimeout);
    };
  }, [currentStageIndex]);

  const activeStage = SIMPLE_STAGES[currentStageIndex];

  return (
    <div
      role="status"
      aria-live="polite"
      className="p-5 sm:p-7 bg-[#040814]/90 border border-white/10 aura-glow-subtle rounded-2xl flex flex-col space-y-5 relative isolate overflow-hidden"
    >
      <span className="vi-grano opacity-5" aria-hidden="true" />
      <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 relative z-10">
        <div className="flex items-center gap-2">
          {engineMode === 'ai' ? (
            <Brain className="w-4 h-4 aura-text-primary" />
          ) : (
            <Zap className="w-4 h-4 text-emerald-400" />
          )}
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
            {engineMode === 'ai' ? 'Organizando con IA Gemini' : 'Organizando con Motor Local'}
          </span>
        </div>
        <span className="text-[11px] font-mono tabular-nums text-slate-400">
          Paso {currentStageIndex + 1} de {SIMPLE_STAGES.length}
        </span>
      </div>

      <div className="py-3 flex flex-col items-center text-center space-y-3 relative z-10" data-preserve-optic="true">
        <QuantumCubeLoader size="sm" speed="slow" showLabel={false} />
        <div className="space-y-1 max-w-md">
          <h4 className="text-sm sm:text-base font-anton uppercase tracking-wider text-white">
            {activeStage.title}
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            {activeStage.desc}
          </p>
        </div>
      </div>

      <div className="relative z-10">
        <MoxenRayas
          progress={progress}
          variant="compact"
          theme={engineMode === 'ai' ? 'purple' : 'cyan'}
          mode="active"
          title="Preparando tu borrador"
          subtitle={engineMode === 'ai' ? 'Consultando a Gemini IA...' : 'Procesando localmente en segundos'}
        />
      </div>

      <div className="flex items-center gap-2 p-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-slate-300 relative z-10">
        <Sparkles className="w-4 h-4 aura-text-primary shrink-0" />
        <span>No te preocupes: nada se guardará en tu calendario hasta que tú lo confirmes.</span>
      </div>
    </div>
  );
};
