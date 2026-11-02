import React, { useState, useEffect } from 'react';
import { Cpu, RefreshCw, Loader2, X, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTaskStore } from '../store/useTaskStore';
import { useAppStore } from '../store/useAppStore';
import { soundFX } from '../utils/audio';
import { generateProceduralAnalysis } from '../utils/proceduralHeuristics';
import { generateNeuralAnalysisAI } from '../services/aiService';
import { QuantumCubeLoader } from './QuantumCubeLoader';

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
      const tasksByDate = useTaskStore.getState().tasksByDate || {};
      const currentTasks = tasksByDate[useTaskStore.getState().currentViewDate] || [];

      const res = await generateNeuralAnalysisAI(
        stats,
        stats?.characterClass || 'Espíritu Heroico',
        habitMastery,
        currentTasks,
        reflections,
        tasksByDate
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#030712]/95 border border-cyan-500/35 rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[90dvh] sm:max-h-[88vh] flex flex-col shadow-[0_0_50px_rgba(0,240,255,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] overflow-hidden backdrop-blur-2xl relative text-left">
        
        {/* Micrograno táctil Moxen Vidrio */}
        <span className="vi-grano opacity-5" aria-hidden="true" />

        {/* Filamento especular superior */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#040814]/90 border-b border-white/10 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 shadow-[0_0_14px_rgba(0,240,255,0.3)]">
              <Cpu className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-anton uppercase tracking-wider text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded-lg border border-cyan-500/40">
                  Diagnóstico Holístico
                </span>
                {analysisSource === 'ai' && (
                  <span className="text-[10px] font-mono font-bold bg-emerald-950/90 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span>Inteligencia KAI Activa</span>
                  </span>
                )}
                {analysisSource === 'heuristics' && (
                  <span className="text-[10px] font-mono font-bold bg-amber-950/90 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/50 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    <span>Modo Autónomo Local</span>
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-anton tracking-wider text-white uppercase mt-0.5">
                Diagnóstico Neural Integral
              </h3>
            </div>
          </div>
          <button 
            onClick={() => { soundFX.playClick(); onClose(); }} 
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all cursor-pointer active:scale-95"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar space-y-4 flex-1 relative z-10">
          <div className="p-4 rounded-2xl bg-[#020712]/90 border border-white/10 flex gap-3.5 items-start shadow-inner">
            <div className="w-8 h-8 rounded-xl bg-black/60 border border-cyan-500/40 flex items-center justify-center shrink-0 text-cyan-300">
              <Sparkles className="w-4 h-4 text-cyan-300" />
            </div>
            <div className="text-xs text-slate-300 font-sans leading-relaxed">
              Diagnóstico integral de tus metas, hábitos y reflexiones, calibrado por tu compañero KAI para optimizar tu rendimiento.
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <h4 className="text-xs font-anton font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Informe de Rendimiento</span>
            </h4>
            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="chicle-btn px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-400 hover:text-black border border-cyan-400/40 text-cyan-200 disabled:opacity-50 text-xs font-anton uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analizando...' : 'Actualizar'}</span>
            </button>
          </div>

          {isAnalyzing ? (
            <div className="p-10 bg-[#020712]/80 border border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 shadow-inner">
              <QuantumCubeLoader size="md" speed="slow" showLabel={false} />
              <p className="text-xs font-mono text-cyan-300 max-w-sm">
                KAI está analizando tus metas, hábitos y reflexiones para calibrar tu rendimiento...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/30 border border-rose-500/40 rounded-2xl text-xs font-mono text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          ) : analysisResult ? (
            <div className="space-y-2">
              {analysisSource === 'ai' && (
                <div className="text-[11px] font-mono text-emerald-400/90 flex items-center gap-1 px-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Sintetizado con IA:</span>
                </div>
              )}
              <div className="p-4 rounded-2xl bg-[#020712]/90 border border-white/10 text-xs text-slate-200 font-sans leading-relaxed shadow-inner max-h-[400px] overflow-y-auto space-y-1">
                {renderMarkdown(analysisResult)}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs font-mono border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
              Presiona "Actualizar" para generar tu evaluación de rendimiento.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#030712]/95 border-t border-white/10 flex justify-end relative z-10">
          <button
            type="button"
            onClick={() => { soundFX.playClick(); onClose(); }}
            className="chicle-btn px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-anton uppercase tracking-wider cursor-pointer transition-all active:scale-95"
          >
            Volver al Cockpit
          </button>
        </div>

      </div>
    </div>
  );
};
