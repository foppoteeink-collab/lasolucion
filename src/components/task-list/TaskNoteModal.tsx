import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FileText, X, Mic, MicOff, Sparkles, Brain } from 'lucide-react';
import { TaskItem } from '../../types';
import { soundFX } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';
import { createVoiceRecognizer, isSpeechRecognitionSupported, VoiceRecognizerController } from '../../utils/speechRecognition';
import { generateTaskNoteSuggestion } from '../../services/aiService';
import { usePlayerStore } from '../../store/usePlayerStore';

interface TaskNoteModalProps {
  task: TaskItem;
  noteText: string;
  onNoteChange: (text: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export const TaskNoteModal: React.FC<TaskNoteModalProps> = ({
  task,
  noteText,
  onNoteChange,
  onSave,
  onDelete,
  onClose,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const voiceRecRef = useRef<VoiceRecognizerController | null>(null);
  const stats = usePlayerStore((s) => s.stats);
  const kaiName = stats?.kaiName || stats?.kaiCustomForm?.name || 'KAI';
  const userName = stats?.username || stats?.fullName || '';

  const stopDictation = useCallback(() => {
    if (voiceRecRef.current) {
      voiceRecRef.current.stop();
      voiceRecRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleDictation = useCallback(() => {
    soundFX.playClick();
    if (isListening) {
      stopDictation();
      return;
    }
    stopDictation();

    const basePrefix = noteText.trim();
    const rec = createVoiceRecognizer({
      onInterim: (live) => {
        const combined = basePrefix ? `${basePrefix} ${live}` : live;
        onNoteChange(combined);
      },
      onFinal: (fin) => {
        const combined = basePrefix ? `${basePrefix} ${fin}` : fin;
        onNoteChange(combined);
        triggerHaptic(12);
      },
      onError: () => {
        setIsListening(false);
        voiceRecRef.current = null;
      },
      onEnd: () => {
        setIsListening(false);
        voiceRecRef.current = null;
      },
    });

    if (rec) {
      voiceRecRef.current = rec;
      setIsListening(true);
      rec.start();
    }
  }, [isListening, noteText, onNoteChange, stopDictation]);

  const handleSuggestNote = async () => {
    if (!task) return;
    soundFX.playClick();
    setIsGeneratingSuggestion(true);
    try {
      const res = await generateTaskNoteSuggestion({
        taskTitle: task.title,
        category: task.category,
        isCompleted: task.completed,
        kaiName,
        userName,
      });
      if (res.suggestion) {
        const next = noteText.trim() ? `${noteText.trim()} — ${res.suggestion}` : res.suggestion;
        onNoteChange(next);
        soundFX.playLevelUp();
        triggerHaptic(20);
      }
    } catch (err) {
      console.warn('[TaskNoteModal] Error al generar sugerencia:', err);
    } finally {
      setIsGeneratingSuggestion(false);
    }
  };

  useEffect(() => {
    return () => {
      voiceRecRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!task) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        soundFX.playClick();
        stopDictation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [task, onClose, stopDictation]);

  if (!task) return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Nota de Repaso y Bitácora"
      className="fixed inset-0 z-[180] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm portal-modal-root animate-fadeIn"
      onClick={() => {
        stopDictation();
        onClose();
      }}
    >
      <div
        className="w-full max-w-md max-h-[88dvh] sm:max-h-[84vh] flex flex-col relative isolate bg-[#030712]/[0.98] border border-white/10 rounded-2xl sm:rounded-3xl shadow-[0_20px_55px_rgba(0,0,0,0.85),0_0_32px_rgba(var(--aura-glow-rgb,0,240,255),0.15)] text-left overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px aura-top-filament pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-white/10 bg-[#040814]/[0.96] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl aura-bg-soft border flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-anton tracking-wide text-white uppercase truncate">
                Nota de Repaso & Bitácora
              </h3>
              <p className="text-[11px] aura-text-soft font-mono truncate max-w-[220px] sm:max-w-xs">
                {task.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopDictation();
              onClose();
            }}
            aria-label="Cerrar nota"
            className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer shrink-0 transition-colors active:scale-95"
            title="Cerrar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-300 leading-relaxed">
              Anota qué trabajaste o detalles clave para recordar:
            </p>
            {isSpeechRecognitionSupported() && (
              <button
                type="button"
                onClick={toggleDictation}
                className={`chicle-btn px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                  isListening
                    ? 'bg-rose-500/25 border-rose-400 text-rose-200 animate-pulse optic-active-card'
                    : 'bg-white/[0.04] hover:bg-white/[0.1] text-cyan-300 border-cyan-400/30'
                }`}
                title="Dictar nota por voz"
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isListening ? 'Detener voz' : 'Dictar'}</span>
              </button>
            )}
          </div>

          <textarea
            autoFocus
            value={noteText}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Ej. Repasé 15 verbos irregulares; avancé diseño de vista de misiones; 4 series pesadas en press militar..."
            rows={4}
            maxLength={5000}
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-[#040a1a]/90 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none leading-relaxed"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                stopDictation();
                onSave();
              }
            }}
          />

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleSuggestNote}
              disabled={isGeneratingSuggestion}
              className="chicle-btn px-2.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/35 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
              title={`Pedir a ${kaiName} que sugiera un apunte de progreso`}
            >
              <Brain className={`w-3.5 h-3.5 text-cyan-300 ${isGeneratingSuggestion ? 'animate-spin' : ''}`} />
              <span>{isGeneratingSuggestion ? `${kaiName} pensando...` : `Sugerencia de ${kaiName}`}</span>
            </button>
            <span className="text-[10px] text-slate-500 font-mono">
              Ctrl+Enter para guardar
            </span>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-2 p-3.5 sm:p-4 border-t border-white/10 bg-[#040814]/[0.96] shrink-0">
          {noteText ? (
            <button
              type="button"
              onClick={() => {
                stopDictation();
                onDelete();
              }}
              className="chicle-btn px-3.5 py-2 rounded-xl bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 text-xs font-bold border border-rose-500/40 cursor-pointer transition-colors min-h-[40px]"
            >
              Borrar Nota
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                stopDictation();
                onClose();
              }}
              className="px-3.5 py-2 rounded-xl bg-white/[0.05] text-slate-300 hover:text-white hover:bg-white/[0.12] text-xs font-bold border border-white/15 cursor-pointer min-h-[40px] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                stopDictation();
                onSave();
              }}
              className="chicle-btn px-4 py-2 rounded-xl aura-btn-gradient optic-active-card text-xs font-anton tracking-wider uppercase cursor-pointer transition-colors min-h-[40px]"
            >
              Guardar Nota
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};

