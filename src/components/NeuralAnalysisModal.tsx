import React, { useState, useEffect } from 'react';
import { Cpu, RefreshCw, Loader2, X, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTaskStore } from '../store/useTaskStore';
import { useAppStore } from '../store/useAppStore';
import { soundFX } from '../utils/audio';
import { generateProceduralAnalysis } from '../utils/proceduralHeuristics';
import { generateNeuralAnalysisAI } from '../services/aiService';

// Converts Gemini markdown to styled JSX elements
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const key = i;
    // H1/H2/H3 headings
    if (/^###\s+/.test(line)) {
      return <p key={key} className="text-purple-300 font-bold text-xs uppercase tracking-wider mt-3 mb-1">{renderInline(line.replace(/^###\s+/, ''))}</p>;
    }
    if (/^##\s+/.test(line)) {
      return <p key={key} className="text-cyan-300 font-bold text-sm uppercase tracking-widest mt-4 mb-1 border-b border-cyan-800/40 pb-1">{renderInline(line.replace(/^##\s+/, ''))}</p>;
    }
    if (/^#\s+/.test(line)) {
      return <p key={key} className="text-yellow-300 font-bold text-sm uppercase tracking-widest mt-4 mb-2">{renderInline(line.replace(/^#\s+/, ''))}</p>;
    }
    // Bold lines that start with **
    if (/^\*\*[^*]/.test(line) && line.endsWith('**')) {
      return <p key={key} className="text-emerald-300 font-bold text-xs mt-2">{renderInline(line)}</p>;
    }
    // Bullet points
    if (/^[-*]\s+/.test(line)) {
      return (
        <div key={key} className="flex gap-2 mt-1">
          <span className="text-purple-400 shrink-0">▸</span>
          <span>{renderInline(line.replace(/^[-*]\s+/, ''))}</span>
        </div>
      );
    }
    // Numbered list
    if (/^\d+\.\s+/.test(line)) {
      const num = line.match(/^(\d+)/)![1];
      return (
        <div key={key} className="flex gap-2 mt-1">
          <span className="text-cyan-400 font-bold shrink-0 w-4">{num}.</span>
          <span>{renderInline(line.replace(/^\d+\.\s+/, ''))}</span>
        </div>
      );
    }
    // Empty lines
    if (line.trim() === '') {
      return <div key={key} className="h-2" />;
    }
    // Normal paragraph
    return <p key={key} className="mt-1 leading-relaxed">{renderInline(line)}</p>;
  });
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Match **bold**, *italic*, and `code`
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[2]) parts.push(<strong key={match.index} className="text-white font-bold">{match[2]}</strong>);
    else if (match[3]) parts.push(<em key={match.index} className="text-purple-200 not-italic font-medium">{match[3]}</em>);
    else if (match[4]) parts.push(<code key={match.index} className="bg-purple-950/60 text-cyan-300 px-1 rounded text-[10px]">{match[4]}</code>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

interface NeuralAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NeuralAnalysisModal: React.FC<NeuralAnalysisModalProps> = ({ isOpen, onClose }) => {
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisSource, setAnalysisSource] = useState<'ai' | 'heuristics' | null>(null);
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

      const res = await generateNeuralAnalysisAI(
        stats,
        stats?.characterClass || 'El Héroe',
        habitMastery,
        currentTasks,
        reflections
      );
      setAnalysisResult(res.analysis);
      setAnalysisSource(res.source);
    } catch (err: any) {
      console.warn("Neural analysis API call failed, falling back to procedural analysis:", err);
      const habitMastery = useAppStore.getState().habitMastery || {};
      const currentTasks = useTaskStore.getState().tasksByDate[useTaskStore.getState().currentViewDate] || [];
      const fallbackAnalysis = generateProceduralAnalysis(stats, stats?.characterClass, habitMastery, currentTasks);
      setAnalysisResult(fallbackAnalysis);
      setAnalysisSource('heuristics');
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
                {analysisSource === 'ai' && (
                  <span className="text-[10px] font-mono font-bold bg-emerald-950/90 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span>Gemini AI Activo</span>
                  </span>
                )}
                {analysisSource === 'heuristics' && (
                  <span className="text-[10px] font-mono font-bold bg-amber-950/90 text-amber-300 px-2 py-0.5 rounded border border-amber-500/50 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    <span>Heurístico Local</span>
                  </span>
                )}
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
                El Núcleo Central está escrutando tus metas, tareas activas, racha de hábitos y notas de bitácora mediante IA...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/30 border border-rose-500/40 rounded-xl text-xs font-mono text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          ) : analysisResult ? (
            <div className="space-y-2">
              {analysisSource === 'ai' && (
                <div className="text-[11px] font-mono text-emerald-400/90 flex items-center gap-1 px-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Sintetizado por Gemini Neural Model en directo:</span>
                </div>
              )}
              <div className="p-4 rounded-xl bg-[#040914] border border-purple-950/80 text-xs text-slate-200 font-mono leading-relaxed shadow-inner max-h-[400px] overflow-y-auto space-y-0.5">
                {renderMarkdown(analysisResult)}
              </div>
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
