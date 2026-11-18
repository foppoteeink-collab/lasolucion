import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Brain, 
  Sparkles, 
  CheckCircle2, 
  RotateCcw, 
  Calendar, 
  ArrowRight, 
  Award, 
  BookOpen, 
  X,
  Flame,
  PlusCircle,
  HelpCircle,
  Eye,
  ChevronRight
} from 'lucide-react';
import { RecallItem, TaskItem } from '../types';
import { 
  RECALL_INTERVALS_DAYS, 
  RECALL_LEVEL_LABELS, 
  processRecallReview, 
  RecallRating,
  addDaysToDateString,
  saveRecallItems
} from '../utils/recall';
import { soundFX } from '../utils/audio';
import { triggerShockwave } from '../utils/celebration';
import { triggerHaptic } from '../utils/haptics';

interface SmartRecallModalProps {
  isOpen: boolean;
  onClose: () => void;
  recallItems: RecallItem[];
  currentDate: string;
  onUpdateRecallItems: (items: RecallItem[]) => void;
  onAddRecallAsTask?: (recallItem: RecallItem) => void;
  onRewardEarned: (xp: number, coins: number, text?: string) => void;
}

export const SmartRecallModal: React.FC<SmartRecallModalProps> = ({
  isOpen,
  onClose,
  recallItems,
  currentDate,
  onUpdateRecallItems,
  onAddRecallAsTask,
  onRewardEarned,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionCompletedCount, setSessionCompletedCount] = useState(0);
  const [sessionXpEarned, setSessionXpEarned] = useState(0);
  const [sessionCoinsEarned, setSessionCoinsEarned] = useState(0);
  const [addedAsTaskIds, setAddedAsTaskIds] = useState<Set<string>>(new Set());

  // Filter items due for review (nextReviewDate <= currentDate)
  const dueItems = React.useMemo(() => {
    return recallItems.filter(
      (item) => item.nextReviewDate <= currentDate
    );
  }, [recallItems, currentDate]);

  // Reset indices when modal opens and hide floating UI
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open-hide-floating');
      setCurrentIndex(0);
      setIsFlipped(false);
      setSessionCompletedCount(0);
      setSessionXpEarned(0);
      setSessionCoinsEarned(0);
    }
    return () => {
      document.body.classList.remove('modal-open-hide-floating');
    };
  }, [isOpen]);

  const currentItem = dueItems[currentIndex];
  const isFinished = !currentItem || currentIndex >= dueItems.length;

  const handleRate = (rating: RecallRating) => {
    if (!currentItem) return;

    soundFX.playClick();
    if (rating === 'again') {
      triggerHaptic([40, 60]);
    } else if (rating === 'good') {
      triggerHaptic([30, 45]);
    } else if (rating === 'easy') {
      triggerHaptic([30, 45, 60]);
    }

    const result = processRecallReview(currentItem, rating, currentDate);

    // Update state & persistence
    const updatedList = recallItems.map((item) =>
      item.id === currentItem.id ? result.updatedItem : item
    );
    onUpdateRecallItems(updatedList);
    saveRecallItems(updatedList);

    // Rewards
    onRewardEarned(result.xpEarned, result.coinsEarned, `Repaso: +${result.xpEarned} XP`);
    setSessionXpEarned((prev) => prev + result.xpEarned);
    setSessionCoinsEarned((prev) => prev + result.coinsEarned);
    setSessionCompletedCount((prev) => prev + 1);

    if (rating === 'easy' || rating === 'good') {
      soundFX.playSuccess();
    }

    // Move to next card
    setIsFlipped(false);
    if (currentIndex + 1 >= dueItems.length) {
      soundFX.playLevelUp();
      triggerShockwave({ color: 'cyan', intensity: 'medium' });
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleAddAsTodayTask = () => {
    if (!currentItem || !onAddRecallAsTask) return;
    soundFX.playSuccess();
    triggerHaptic([25, 40]);
    onAddRecallAsTask(currentItem);
    setAddedAsTaskIds((prev) => new Set(prev).add(currentItem.id));
  };

  // Global keyboard shortcuts for review ergonomics
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (isFinished || !currentItem) return;

      if (!isFlipped) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          soundFX.playClick();
          triggerHaptic(20);
          setIsFlipped(true);
        }
      } else {
        if (e.key === '1') {
          e.preventDefault();
          handleRate('again');
        } else if (e.key === '2') {
          e.preventDefault();
          handleRate('good');
        } else if (e.key === '3') {
          e.preventDefault();
          handleRate('easy');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFinished, currentItem, isFlipped, handleRate, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[170] portal-modal-root bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="smart-recall-modal-title"
        className="relative isolate w-full max-w-xl bg-[#030712]/[0.98] border border-white/10 rounded-2xl sm:rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col max-h-[88dvh] sm:max-h-[84vh] text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-[#040814]/[0.96] shrink-0 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl aura-bg-soft border aura-border-subtle flex items-center justify-center aura-text-primary aura-glow-subtle shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="smart-recall-modal-title" className="text-base sm:text-lg font-anton text-white tracking-wider uppercase">
                  Repaso Inteligente
                </h2>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full aura-bg-soft aura-text-soft border aura-border-subtle">
                  MEMORIA ACTIVA
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Repaso espaciado activo para consolidar notas clave.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de repaso inteligente"
            className="chicle-btn w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer shrink-0"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col justify-center relative z-10">
          {dueItems.length === 0 ? (
            /* No cards due today */
            <div className="py-10 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-[#040814]/80 border aura-border-subtle flex items-center justify-center aura-text-primary mb-4 aura-glow-subtle">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-anton text-white uppercase tracking-wider mb-2">¡Todo al día!</h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto mb-6">
                No hay notas pendientes de repaso para hoy (<span className="font-mono tabular-nums">{currentDate}</span>).
              </p>
              <div className="bg-[#040814]/80 border border-white/10 rounded-xl p-4 text-xs text-slate-300 max-w-sm w-full mb-6 text-left">
                <p className="font-anton uppercase tracking-wider text-white mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  ¿Cómo programar notas?
                </p>
                <p className="text-slate-400 font-sans">
                  Escribe una nota en cualquier tarea y se programará a 1, 3, 7, 14 y 30 días.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="chicle-btn aura-btn-gradient optic-active-card px-6 py-2.5 rounded-xl font-anton uppercase tracking-wider text-sm cursor-pointer"
              >
                Entendido
              </button>
            </div>
          ) : isFinished ? (
            /* Completed Session Screen */
            <div className="py-8 text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-[0_0_24px_rgba(245,158,11,0.35)] mb-4">
                <div className="w-full h-full bg-[#030712] rounded-full flex items-center justify-center text-amber-300">
                  <Award className="w-10 h-10 animate-bounce" />
                </div>
              </div>
              <h3 className="text-xl font-anton text-white mb-1 uppercase tracking-wider">
                ¡Sesión de Repaso Completada!
              </h3>
              <p className="text-xs text-slate-400 mb-6 font-sans">
                Has reforzado tu sinapsis heroica y consolidado el aprendizaje.
              </p>

              <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-6">
                <div className="bg-[#040814]/80 border border-amber-500/40 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Repasadas</span>
                  <span className="text-lg font-black text-amber-300 font-mono tabular-nums">{sessionCompletedCount}</span>
                </div>
                <div className="bg-[#040814]/80 border aura-border-subtle rounded-xl p-3 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">XP Ganada</span>
                  <span className="text-lg font-black aura-text-primary font-mono tabular-nums">+{sessionXpEarned}</span>
                </div>
                <div className="bg-[#040814]/80 border border-amber-500/40 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Monedas</span>
                  <span className="text-lg font-black text-amber-400 font-mono tabular-nums">+{sessionCoinsEarned}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="chicle-btn aura-btn-gradient optic-active-card px-8 py-3 rounded-xl font-anton uppercase tracking-wider text-sm cursor-pointer"
              >
                Volver a la Aventura
              </button>
            </div>
          ) : (
            /* Active Card Flashcard */
            <div className="flex flex-col gap-4">
              {/* Progress counter */}
              <div className="flex items-center justify-between text-xs" role="status" aria-live="polite">
                <span className="text-slate-400 font-mono tabular-nums font-semibold">
                  Memoria {currentIndex + 1} de {dueItems.length}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1 bg-[#040814]/80 px-2 py-0.5 rounded-full border border-amber-500/40 font-mono tabular-nums">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    Racha {currentItem.streak}
                  </span>
                  <span className="text-[11px] font-bold text-slate-300 bg-[#040814]/80 px-2 py-0.5 rounded-full border border-white/10">
                    {RECALL_LEVEL_LABELS[currentItem.level] || 'Aprendiz'}
                  </span>
                </div>
              </div>

              {/* Card Container */}
              <div className="relative bg-[#040814]/80 border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col min-h-[260px] justify-between">
                <div>
                  {/* Category & Date */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] uppercase font-anton tracking-wider px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {currentItem.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono tabular-nums flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      Registrado: {currentItem.createdAt}
                    </span>
                  </div>

                  {/* Question / Mission Title */}
                  <div className="mb-4">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1 font-mono">
                      Misión / Concepto Clave
                    </span>
                    <h3 className="text-base sm:text-xl font-black text-white leading-snug">
                      {currentItem.title}
                    </h3>
                  </div>

                  {/* Hidden vs Revealed Note Content */}
                  {!isFlipped ? (
                    <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-white/15 rounded-xl bg-black/40 my-2">
                      <HelpCircle className="w-8 h-8 aura-text-primary mb-2 animate-bounce" />
                      <p className="text-xs text-slate-300 font-medium mb-1 text-center font-sans">
                        ¿Recuerdas los puntos clave o notas de esta misión?
                      </p>
                      <p className="text-[11px] text-slate-500 text-center font-sans">
                        Intenta recordarlo mentalmente antes de ver la nota
                      </p>
                    </div>
                  ) : (
                    <div className="bg-black/50 border border-amber-500/40 rounded-xl p-4 my-2 text-sm text-amber-100 whitespace-pre-wrap leading-relaxed shadow-inner animate-in fade-in duration-200">
                      <div className="flex items-center gap-1.5 text-[11px] uppercase font-anton tracking-wider text-amber-400 mb-2">
                        <BookOpen className="w-3.5 h-3.5" />
                        Notas de Repaso Registradas:
                      </div>
                      {currentItem.notes}
                    </div>
                  )}
                </div>

                {/* Flip / Reveal Button */}
                {!isFlipped ? (
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      triggerHaptic(20);
                      setIsFlipped(true);
                    }}
                    className="chicle-btn aura-btn-gradient optic-active-card w-full py-3 rounded-xl font-anton uppercase tracking-wider text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Mostrar Notas de Repaso</span>
                    <kbd className="hidden sm:inline-block text-[10px] bg-black/25 px-1.5 py-0.5 rounded border border-black/20 font-mono font-bold ml-1">
                      Espacio
                    </kbd>
                  </button>
                ) : (
                  <div className="space-y-3 pt-2">
                    {/* Add as today's task action */}
                    {onAddRecallAsTask && (
                      <button
                        type="button"
                        onClick={handleAddAsTodayTask}
                        disabled={addedAsTaskIds.has(currentItem.id)}
                        className={`chicle-btn w-full py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          addedAsTaskIds.has(currentItem.id)
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                            : 'aura-bg-soft aura-border-subtle aura-text-soft'
                        }`}
                      >
                        {addedAsTaskIds.has(currentItem.id) ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ¡Misión agregada para hoy!
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-3.5 h-3.5 aura-text-primary" />
                            Convertir en Misión práctica de hoy
                          </>
                        )}
                      </button>
                    )}

                    {/* Feedback Rating Options */}
                    <div>
                      <span className="text-[11px] uppercase font-anton tracking-wider text-slate-400 text-center block mb-2">
                        ¿Cómo fue tu retención?
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleRate('again')}
                          className="chicle-btn !flex-col py-2.5 px-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/50 text-rose-300 text-xs font-bold gap-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Difícil</span>
                            <kbd className="hidden sm:inline-block text-[9px] bg-black/40 px-1 py-0.5 rounded border border-rose-500/30 text-rose-300 font-mono">1</kbd>
                          </div>
                          <span className="text-[10px] text-rose-400/80 font-mono tabular-nums">Mañana (1d)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRate('good')}
                          className="chicle-btn !flex-col py-2.5 px-2 rounded-xl aura-bg-soft border aura-border-subtle aura-text-soft text-xs font-bold gap-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 text-xs font-bold aura-text-soft">
                            <CheckCircle2 className="w-3.5 h-3.5 aura-text-primary" />
                            <span>Bien</span>
                            <kbd className="hidden sm:inline-block text-[9px] bg-black/40 px-1 py-0.5 rounded border aura-border-subtle aura-text-soft font-mono">2</kbd>
                          </div>
                          <span className="text-[10px] aura-text-primary font-mono tabular-nums">
                            +{RECALL_INTERVALS_DAYS[Math.min(currentItem.level + 1, RECALL_INTERVALS_DAYS.length - 1)]}d
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRate('easy')}
                          className="chicle-btn !flex-col py-2.5 px-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/50 text-amber-300 text-xs font-bold gap-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Fácil</span>
                            <kbd className="hidden sm:inline-block text-[9px] bg-black/40 px-1 py-0.5 rounded border border-amber-500/30 text-amber-300 font-mono">3</kbd>
                          </div>
                          <span className="text-[10px] text-amber-400/80 font-mono tabular-nums">
                            +{RECALL_INTERVALS_DAYS[Math.min(currentItem.level + 2, RECALL_INTERVALS_DAYS.length - 1)]}d
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-[#040814]/[0.96] flex items-center justify-between gap-2 text-xs text-slate-400 relative z-10">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Repasar cada día afianza el hábito y el conocimiento</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de repaso inteligente"
            className="chicle-btn px-3.5 py-1.5 bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white rounded-xl font-anton uppercase tracking-wider text-xs cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
