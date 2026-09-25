import React, { useState, useEffect } from 'react';
import { Cpu, RefreshCw, Loader2, X, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTaskStore } from '../store/useTaskStore';
import { useAppStore } from '../store/useAppStore';
import { soundFX } from '../utils/audio';
import { generateProceduralAnalysis } from '../utils/proceduralHeuristics';

interface NeuralAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NeuralAnalysisModal: React.FC<NeuralAnalysisModalProps> = ({ isOpen, onClose }) => {
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stats = usePlayerStore(state => state.stats);

  const handleRunAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);
      soundFX.playClick();
      const habitMastery = useAppStore.getState().habitMastery || {};
      const reflections = useAppStore.getState().reflections || {};
      const currentTasks = useTaskStore.getState().tasksByDate[useTaskStore.getState().currentViewDate] || [];

      const res = await fetch('/api/analyze-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stats,
          archetype: stats?.characterClass,
          habitMastery,
          currentTasks,
          reflections
        })
      });
      const data = await res.json();
      if (data.analysis) {
        setAnalysisResult(data.analysis);
      } else {
        setAnalysisResult("No se pudo compilar el diagnóstico neural.");
      }
    } catch (err: any) {
      console.warn("Neural analysis API call failed, falling back to procedural analysis:", err);
      const habitMastery = useAppStore.getState().habitMastery || {};
      const currentTasks = useTaskStore.getState().tasksByDate[useTaskStore.getState().currentViewDate] || [];
      const fallbackAnalysis = generateProceduralAnalysis(stats, stats?.characterClass, habitMastery, currentTasks);
      setAnalysisResult(fallbackAnalysis);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (isOpen && !analysisResult && !isAnalyzing) {
      handleRunAnalysis();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#03000a] border border-purple-500/50 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(150,0,255,0.3)] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-950/60 via-[#050014] to-purple-950/60 border-b border-purple-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(150,0,255,0.4)]">
              <Cpu className="w-5 h-5 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-purple-300 font-bold bg-purple-900/40 px-2 py-0.5 rounded border border-purple-700/50">
                  Módulo de Telemetría Biológica
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-anton tracking-wide text-white uppercase mt-0.5">
                Diagnóstico Neural Integral
              </h3>
            </div>
          </div>
          <button 
            onClick={() => { soundFX.playClick(); onClose(); }} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto custom-scrollbar space-y-4 flex-1">
          <div className="p-4 rounded-xl bg-[#070214] border border-purple-500/30 flex gap-3 items-start">
            <div className="w-8 h-8 rounded-lg bg-black border border-purple-500/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xs text-slate-300 font-mono leading-relaxed">
              "Análisis integral independiente de tu matriz arquetípica, metas, tareas en curso, dominio de hábitos y bitácora de reflexiones. Gobernado por el Núcleo Central para calibrar tu rendimiento sin interferir con la síntesis de agenda del Oráculo."
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <h4 className="text-xs font-mono font-bold text-purple-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Informe de Telemetría Operativa</span>
            </h4>
            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analizando...' : 'Re-escanear Telemetría'}</span>
            </button>
          </div>

          {isAnalyzing ? (
            <div className="p-12 bg-[#040914] border border-purple-900/40 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              <p className="text-xs font-mono text-purple-300">
                El Núcleo Central está escrutando tus metas, tareas activas, racha de hábitos y notas de bitácora...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/30 border border-rose-500/40 rounded-xl text-xs font-mono text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          ) : analysisResult ? (
            <div className="p-4 rounded-xl bg-[#040914] border border-purple-950/80 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed shadow-inner max-h-[400px] overflow-y-auto">
              {analysisResult}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs font-mono border border-dashed border-purple-900/50 rounded-xl">
              Presiona "Re-escanear Telemetría" para generar tu diagnóstico holístico de rendimiento.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#050014] border-t border-purple-900/40 flex justify-end">
          <button
            type="button"
            onClick={() => { soundFX.playClick(); onClose(); }}
            className="px-4 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-200 text-xs font-mono font-bold border border-purple-700/50 cursor-pointer transition-colors"
          >
            Cerrar Módulo
          </button>
        </div>

      </div>
    </div>
  );
};
