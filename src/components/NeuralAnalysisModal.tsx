import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Cpu, RefreshCw, Loader2, X, ShieldCheck, Sparkles, AlertCircle, Copy, Check, Zap } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTaskStore } from '../store/useTaskStore';
import { useAppStore } from '../store/useAppStore';
import { soundFX } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
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
  const [copied, setCopied] = useState(false);
  const [analysisEngine, setAnalysisEngine] = useState<'auto' | 'local'>('auto');

  const stats = usePlayerStore(state => state.stats);

  const handleRunAnalysis = async (forcedEngine?: 'auto' | 'local') => {
    const engineToUse = forcedEngine || analysisEngine;
    try {
      setIsAnalyzing(true);
      setError(null);
      soundFX.playClick();
      const habitMastery = useAppStore.getState().habitMastery || {};
      const reflections = useAppStore.getState().reflections || {};
      const tasksByDate = useTaskStore.getState().tasksByDate || {};
      const currentTasks = tasksByDate[useTaskStore.getState().currentViewDate] || [];

      if (engineToUse === 'local') {
        const localAnalysis = generateProceduralAnalysis(stats, stats?.characterClass, habitMastery, currentTasks);
        setAnalysisResult(localAnalysis);
        setAnalysisSource('heuristics');
        soundFX.playSubBassConfirm?.();
        return;
      }

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
      soundFX.playSubBassConfirm?.();
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

  const handleCopyAnalysis = async () => {
    if (!analysisResult) return;
    try {
      await navigator.clipboard.writeText(analysisResult);
      soundFX.playClick();
      triggerHaptic([30, 40]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn("Error al copiar análisis neural:", err);
    }
  };

  useEffect(() => {
    if (isOpen && !analysisResult && !isAnalyzing) {
      handleRunAnalysis();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('modal-open-hide-floating');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('modal-open-hide-floating');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[170] portal-modal-root bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="neural-modal-title"
        className="relative isolate bg-[#030712]/[0.98] border border-white/10 rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[90dvh] sm:max-h-[88vh] flex flex-col shadow-[0_24px_64px_rgba(0,0,0,0.75)] overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Micrograno táctil Moxen Vidrio */}
        <span className="vi-grano opacity-5" aria-hidden="true" />

        {/* Filamento especular superior */}
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#040814]/[0.96] border-b border-white/10 flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl aura-bg-soft border aura-border-subtle aura-text-primary aura-glow-subtle shrink-0">
              <Cpu className="w-5 h-5 aura-text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-anton uppercase tracking-wider aura-text-soft aura-bg-soft px-2 py-0.5 rounded-lg border aura-border-subtle">
                  Resumen de Enfoque
                </span>
                {analysisSource === 'ai' && (
                  <span className="text-[10px] font-mono font-bold bg-emerald-950/90 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/50 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span>IA KAI Activa</span>
                  </span>
                )}
                {analysisSource === 'heuristics' && (
                  <span className="text-[10px] font-mono font-bold bg-amber-950/90 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/50 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    <span>Modo Local</span>
                  </span>
                )}
              </div>
              <h3 id="neural-modal-title" className="text-base sm:text-lg font-anton tracking-wider text-white uppercase mt-0.5 truncate">
                Diagnóstico de Hábitos y Rendimiento
              </h3>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => { soundFX.playClick(); onClose(); }} 
            aria-label="Cerrar diagnóstico neural"
            className="chicle-btn w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer shrink-0"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar space-y-4 flex-1 relative z-10">
          <div className="p-4 rounded-2xl bg-[#040814]/80 border border-white/10 flex gap-3.5 items-start shadow-inner">
            <div className="w-8 h-8 rounded-xl bg-black/50 border aura-border-subtle flex items-center justify-center shrink-0 aura-text-primary">
              <Sparkles className="w-4 h-4 aura-text-primary" />
            </div>
            <div className="text-xs text-slate-300 font-sans leading-relaxed">
              Diagnóstico integral de tus metas, hábitos y reflexiones, calibrado por tu compañero KAI para optimizar tu rendimiento.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-b border-white/10 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-anton font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Informe de Rendimiento</span>
              </h4>

              {/* NEU-04: Selector táctico de motor */}
              <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setAnalysisEngine('auto');
                    handleRunAnalysis('auto');
                  }}
                  className={`chicle-btn px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                    analysisEngine === 'auto'
                      ? 'aura-bg-primary optic-active-card'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Análisis holístico con KAI IA (Gemini)"
                >
                  Neural AI
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setAnalysisEngine('local');
                    handleRunAnalysis('local');
                  }}
                  className={`chicle-btn px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                    analysisEngine === 'local'
                      ? 'bg-emerald-500 text-slate-950 optic-active-card shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Análisis instantáneo local (Cero consumo de tokens)"
                >
                  Local (0 Tokens)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* NEU-01: Botón Copiar Informe */}
              {analysisResult && (
                <button
                  type="button"
                  onClick={handleCopyAnalysis}
                  aria-label="Copiar diagnóstico al portapapeles"
                  className="chicle-btn px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                  title="Copiar diagnóstico al portapapeles"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 aura-text-primary" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => handleRunAnalysis()}
                disabled={isAnalyzing}
                aria-label="Actualizar informe de rendimiento"
                className="chicle-btn aura-btn-gradient optic-active-card px-3.5 py-1.5 rounded-xl disabled:opacity-50 text-xs font-anton uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>{isAnalyzing ? 'Analizando...' : 'Actualizar'}</span>
              </button>
            </div>
          </div>

          {isAnalyzing ? (
            <div className="p-10 bg-[#040814]/80 border border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 shadow-inner" data-preserve-optic="true">
              <QuantumCubeLoader size="md" speed="slow" showLabel={false} />
              <p className="text-xs font-mono aura-text-soft max-w-sm">
                KAI está analizando tus metas, hábitos y reflexiones para calibrar tu rendimiento...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/30 border border-rose-500/40 rounded-2xl text-xs font-mono text-rose-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRunAnalysis()}
                className="chicle-btn px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-200 rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3 h-3 text-rose-300" />
                <span>Reintentar</span>
              </button>
            </div>
          ) : analysisResult ? (
            <div className="space-y-2">
              {analysisSource === 'ai' && (
                <div className="text-[11px] font-mono text-emerald-400/90 flex items-center gap-1 px-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Sintetizado con IA:</span>
                </div>
              )}
              <div className="p-4 rounded-2xl bg-[#040814]/80 border border-white/10 text-xs text-slate-200 font-sans leading-relaxed shadow-inner max-h-[400px] overflow-y-auto custom-scrollbar space-y-1">
                {renderMarkdown(analysisResult)}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs font-mono border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
              Presiona "Actualizar" para generar tu evaluación de rendimiento.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#040814]/[0.96] border-t border-white/10 flex justify-end relative z-10">
          <button
            type="button"
            onClick={() => { soundFX.playClick(); onClose(); }}
            className="chicle-btn px-5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white text-xs font-anton uppercase tracking-wider cursor-pointer"
          >
            Volver al Cockpit
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
