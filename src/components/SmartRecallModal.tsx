import React, { useState, useEffect } from 'react';
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

  // Reset indices when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsFlipped(false);
      setSessionCompletedCount(0);
      setSessionXpEarned(0);
      setSessionCoinsEarned(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentItem = dueItems[currentIndex];
  const isFinished = !currentItem || currentIndex >= dueItems.length;

  const handleRate = (rating: RecallRating) => {
    if (!currentItem) return;

    soundFX.playClick();
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
    onAddRecallAsTask(currentItem);
    setAddedAsTaskIds((prev) => new Set(prev).add(currentItem.id));
  };

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-[#011420] border border-cyan-500/40 rounded-2xl sm:rounded-3xl shadow-[0_0_40px_rgba(0,240,255,0.2)] overflow-hidden flex flex-col max-h-[88dvh] sm:max-h-[84vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-cyan-500/30 flex items-center justify-between bg-[#000a14] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#001020] border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide font-anton uppercase">
                  Smart Recall: Repaso Espaciado
                </h2>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Ebbinghaus
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Fortalece tu memoria a largo plazo repasando notas de misiones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col justify-center">
          {dueItems.length === 0 ? (
            /* No cards due today */
            <div className="py-10 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-[#000a14] border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-white font-anton uppercase mb-2">¡Todo al día!</h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto mb-6">
                No tienes notas de misiones pendientes de repaso para hoy ({currentDate}).
                Tus recuerdos están frescos y consolidados.
              </p>
              <div className="bg-[#000a14] border border-cyan-500/30 rounded-xl p-4 text-xs text-slate-300 max-w-sm w-full mb-6 text-left">
                <p className="font-bold text-white mb-1 flex items-center gap-1.5 font-anton uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  ¿Cómo agregar más memorias?
                </p>
                <p className="text-slate-400 font-sans">
                  Agrega notas o reflexiones en el botón <strong className="text-amber-300">Nota</strong> de cualquier misión. Se programarán automáticamente a los 1, 3, 7, 14 y 30 días.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-anton uppercase tracking-wider text-sm shadow-[0_0_15px_rgba(0,240,255,0.4)] transition cursor-pointer"
              >
                Entendido
              </button>
            </div>
          ) : isFinished ? (
            /* Completed Session Screen */
            <div className="py-8 text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-[0_0_30px_rgba(245,158,11,0.4)] mb-4">
                <div className="w-full h-full bg-[#001020] rounded-full flex items-center justify-center text-amber-300">
                  <Award className="w-10 h-10 animate-bounce" />
                </div>
              </div>
              <h3 className="text-xl font-black text-white mb-1 font-anton uppercase tracking-wide">
                ¡Sesión de Repaso Completada!
              </h3>
              <p className="text-xs text-slate-400 mb-6 font-sans">
                Has reforzado tu sinapsis heroica y consolidado el aprendizaje.
              </p>

              <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-6">
                <div className="bg-[#000a14] border border-amber-500/40 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Repasadas</span>
                  <span className="text-lg font-black text-amber-300 font-mono">{sessionCompletedCount}</span>
                </div>
                <div className="bg-[#000a14] border border-cyan-500/40 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">XP Ganada</span>
                  <span className="text-lg font-black text-cyan-400 font-mono">+{sessionXpEarned}</span>
                </div>
                <div className="bg-[#000a14] border border-amber-500/40 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Monedas</span>
                  <span className="text-lg font-black text-amber-400 font-mono">+{sessionCoinsEarned}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="px-8 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-anton uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(0,240,255,0.4)] transition cursor-pointer"
              >
                Volver a la Aventura
              </button>
            </div>
          ) : (
            /* Active Card Flashcard */
            <div className="flex flex-col gap-4">
              {/* Progress counter */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono font-semibold">
                  Memoria {currentIndex + 1} de {dueItems.length}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1 bg-[#000a14] px-2 py-0.5 rounded-full border border-amber-500/40 font-mono">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    Racha {currentItem.streak}
                  </span>
                  <span className="text-[11px] font-bold text-slate-300 bg-[#000a14] px-2 py-0.5 rounded-full border border-cyan-500/30">
                    {RECALL_LEVEL_LABELS[currentItem.level] || 'Aprendiz'}
                  </span>
                </div>
              </div>

              {/* Card Container */}
              <div className="relative bg-[#000a14] border border-cyan-500/40 rounded-2xl p-5 sm:p-6 shadow-[0_0_25px_rgba(0,240,255,0.1)] flex flex-col min-h-[260px] justify-between">
                <div>
                  {/* Category & Date */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] uppercase font-anton tracking-wider px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {currentItem.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
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
                    <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-cyan-500/30 rounded-xl bg-[#001020] my-2">
                      <HelpCircle className="w-8 h-8 text-cyan-400/70 mb-2 animate-bounce" />
                      <p className="text-xs text-slate-300 font-medium mb-1 text-center font-sans">
                        ¿Recuerdas los puntos clave o notas de esta misión?
                      </p>
                      <p className="text-[11px] text-slate-500 text-center font-sans">
                        Intenta recordarlo mentalmente antes de ver la nota
                      </p>
                    </div>
                  ) : (
                    <div className="bg-[#001428] border border-amber-500/40 rounded-xl p-4 my-2 text-sm text-amber-100 whitespace-pre-wrap leading-relaxed shadow-inner animate-in fade-in duration-200">
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
                    onClick={() => {
                      soundFX.playClick();
                      setIsFlipped(true);
                    }}
                    className="w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-anton uppercase tracking-wider text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.4)] transition cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    Mostrar Notas de Repaso
                  </button>
                ) : (
                  <div className="space-y-3 pt-2">
                    {/* Add as today's task action */}
                    {onAddRecallAsTask && (
                      <button
                        onClick={handleAddAsTodayTask}
                        disabled={addedAsTaskIds.has(currentItem.id)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          addedAsTaskIds.has(currentItem.id)
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                            : 'bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border-cyan-500/40'
                        }`}
                      >
                        {addedAsTaskIds.has(currentItem.id) ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ¡Misión agregada para hoy!
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
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
                          onClick={() => handleRate('again')}
                          className="py-2.5 px-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/50 text-red-300 text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 text-xs font-bold text-red-300">
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Difícil</span>
                          </div>
                          <span className="text-[10px] text-red-400/80 font-mono">Mañana (1d)</span>
                        </button>
                        <button
                          onClick={() => handleRate('good')}
                          className="py-2.5 px-2 rounded-xl bg-[#001020] hover:bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 text-xs font-bold transition flex flex-col items-center justify-center gap-1 shadow-[0_0_10px_rgba(0,240,255,0.2)] cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Bien</span>
                          </div>
                          <span className="text-[10px] text-cyan-400/80 font-mono">
                            +{RECALL_INTERVALS_DAYS[Math.min(currentItem.level + 1, RECALL_INTERVALS_DAYS.length - 1)]}d
                          </span>
                        </button>
                        <button
                          onClick={() => handleRate('easy')}
                          className="py-2.5 px-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/50 text-amber-300 text-xs font-bold transition flex flex-col items-center justify-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.25)] cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Fácil</span>
                          </div>
                          <span className="text-[10px] text-amber-400/80 font-mono">
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
        <div className="p-3 sm:p-4 border-t border-cyan-500/20 bg-[#000a14] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Repasar cada día afianza el hábito y el conocimiento</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-medium cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
