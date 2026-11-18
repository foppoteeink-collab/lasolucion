import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Zap,
  Target,
  PlusCircle,
  CheckCircle2,
  Heart,
  FileText,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { soundFX } from '../../utils/audio';
import { triggerShockwave } from '../../utils/celebration';
import { notificationService } from '../../utils/notifications';
import { useUIStore } from '../../store/useUIStore';
import { usePlayerStore } from '../../store/usePlayerStore';

interface TourStep {
  id: string;
  targetSelector: string;
  badge: string;
  title: string;
  instruction: string;
  fallbackIcon: React.ReactNode;
  interactiveAction?: {
    label: string;
    onClick: () => void;
  };
}

export const KaiInteractiveSpotlightTour: React.FC = () => {
  const { isTacticalGuideOpen, tacticalGuideInitialStep, closeTacticalGuide, openTaskForm } = useUIStore();
  const { markTutorialGuideSeen, claimTutorialReward } = usePlayerStore();

  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const steps: TourStep[] = [
    {
      id: 'habit-orb',
      targetSelector: '[data-tour="habit-orb"]',
      badge: 'PASO 1 DE 5 // LEY 21/66',
      title: 'ORBES DE HÁBITOS',
      instruction:
        'Toca este orbe diario (+1). Mantén tu racha: 21 días para asimilar el hábito y 66 días para maestría permanente.',
      fallbackIcon: <Target className="w-5 h-5 text-cyan-400" />
    },
    {
      id: 'add-task-btn',
      targetSelector: '[data-tour="add-task-btn"]',
      badge: 'PASO 2 DE 5 // CREACIÓN',
      title: 'FORJAR NUEVA MISIÓN',
      instruction:
        'Pulsa este botón "+" para crear tareas o hábitos con categoría y bloques horarios ordenados.',
      fallbackIcon: <PlusCircle className="w-5 h-5 text-amber-400" />,
      interactiveAction: {
        label: '✨ Abrir forjador de tareas',
        onClick: () => {
          closeTacticalGuide();
          openTaskForm('task');
        }
      }
    },
    {
      id: 'task-checkbox',
      targetSelector: '[data-tour="task-checkbox"]',
      badge: 'PASO 3 DE 5 // COMPLETADO',
      title: 'MARCAR TAREAS',
      instruction:
        'Marca este recuadro al terminar tu tarea para cobrar Monedas y XP al instante.',
      fallbackIcon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
    },
    {
      id: 'task-note-btn',
      targetSelector: '[data-tour="task-note-btn"]',
      badge: 'PASO 4 DE 5 // BITÁCORA',
      title: 'NOTAS PRIVADAS',
      instruction:
        'Toca el chip "Nota" para desplegar la bitácora de la tarea con ideas o enlaces de trabajo.',
      fallbackIcon: <FileText className="w-5 h-5 text-purple-400" />
    },
    {
      id: 'hp-bar',
      targetSelector: '[data-tour="hp-bar"]',
      badge: 'PASO 5 DE 5 // SALUD & HP',
      title: 'ENERGÍA VITAL (HP)',
      instruction:
        'Esta barra es tu salud. Si necesitas descansar, activa "Modo Descanso" en el calendario para protegerla.',
      fallbackIcon: <Heart className="w-5 h-5 text-rose-400" />
    }
  ];

  // Initialize step from store
  useEffect(() => {
    if (isTacticalGuideOpen) {
      const initialIdx = Math.max(0, Math.min((tacticalGuideInitialStep || 1) - 1, steps.length - 1));
      setStepIndex(initialIdx);
    }
  }, [isTacticalGuideOpen, tacticalGuideInitialStep]);

  // Update target element rect
  const updateTargetRect = useCallback(() => {
    if (!isTacticalGuideOpen) return;
    const currentStep = steps[stepIndex];
    if (!currentStep) return;

    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [isTacticalGuideOpen, stepIndex]);

  // When step changes, smooth scroll into view and recalculate
  useEffect(() => {
    if (!isTacticalGuideOpen) return;
    const currentStep = steps[stepIndex];
    if (!currentStep) return;

    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }

    updateTargetRect();
    const t1 = setTimeout(updateTargetRect, 80);
    const t2 = setTimeout(updateTargetRect, 220);
    const t3 = setTimeout(updateTargetRect, 450);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isTacticalGuideOpen, stepIndex, updateTargetRect]);

  const handleSkip = useCallback(() => {
    soundFX.playClick();
    markTutorialGuideSeen('introWalkthrough');
    closeTacticalGuide();
  }, [markTutorialGuideSeen, closeTacticalGuide]);

  // Global window listeners for resize, scroll, Escape & floating UI suppression
  useEffect(() => {
    if (!isTacticalGuideOpen) return;
    document.body.classList.add('modal-open-hide-floating');
    const handleRecalc = () => updateTargetRect();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('resize', handleRecalc);
    window.addEventListener('scroll', handleRecalc, true);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('modal-open-hide-floating');
      window.removeEventListener('resize', handleRecalc);
      window.removeEventListener('scroll', handleRecalc, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTacticalGuideOpen, updateTargetRect, handleSkip]);

  if (!isTacticalGuideOpen || typeof document === 'undefined') return null;

  const currentStep = steps[stepIndex];
  const padding = 8;
  const hasTarget = Boolean(targetRect && targetRect.width > 0 && targetRect.height > 0);

  const handleNext = () => {
    soundFX.playClick();
    if (stepIndex < steps.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    soundFX.playClick();
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    try {
      soundFX.playFanfare();
    } catch (_) {}

    try {
      triggerShockwave({ color: 'violet', intensity: 'epic' });
    } catch (_) {}

    const wasClaimed = claimTutorialReward();
    markTutorialGuideSeen('introWalkthrough');

    if (wasClaimed) {
      notificationService.triggerNotification(
        '¡Calibración Completada! 🎖️',
        'Has sincronizado los controles principales de KAI. Recompensa: +50 XP y +25 Monedas.',
        '🎖️'
      );
    }

    closeTacticalGuide();
  };

  // Determine if the target is in the upper half of screen
  const isTargetInTopHalf = hasTarget && targetRect
    ? (targetRect.top + targetRect.height / 2) < (typeof window !== 'undefined' ? window.innerHeight / 2 : 400)
    : true;

  // Safe Responsive Placement:
  // If target is in top half (habit orbs, hp bar), place card at BOTTOM.
  // If target is in bottom half (task cards, notes), place card at TOP.
  // Left and right are clamped between 12px with max-width 400px so it NEVER overflows.
  const getTooltipStyle = (): React.CSSProperties => {
    if (isTargetInTopHalf) {
      return {
        position: 'fixed',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
        left: '12px',
        right: '12px',
        margin: '0 auto',
        maxWidth: '400px',
        zIndex: 182
      };
    } else {
      return {
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 20px)',
        left: '12px',
        right: '12px',
        margin: '0 auto',
        maxWidth: '400px',
        zIndex: 182
      };
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[180] portal-modal-root overflow-hidden pointer-events-auto">
      {/* ── 1. SPOTLIGHT HOLE CUTOUT (Foco de Luz con Halo de Aura, protegido en optic-eink) ── */}
      {hasTarget && targetRect && (
        <motion.div
          data-preserve-optic="true"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{
            opacity: 1,
            scale: 1,
            top: targetRect.top - padding,
            left: targetRect.left - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2
          }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          style={{
            position: 'fixed',
            boxShadow: '0 0 0 9999px rgba(3, 7, 18, 0.78)',
            pointerEvents: 'none',
            zIndex: 181
          }}
          className="rounded-2xl border-2 aura-border-primary aura-glow"
        />
      )}

      {/* Fallback backdrop when target is not yet located on DOM */}
      {!hasTarget && (
        <div
          data-preserve-optic="true"
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[181] pointer-events-auto"
          onClick={handleSkip}
        />
      )}

      {/* ── 2. TACTICAL TOOLTIP SPEECH BUBBLE (Obsidian Glass + Aura) ── */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kai-tour-title"
        key={currentStep.id}
        initial={{ opacity: 0, y: isTargetInTopHalf ? 15 : -15, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={getTooltipStyle()}
        className="relative isolate bg-[#030712]/[0.98] rounded-2xl p-3.5 sm:p-4 border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.75)] overflow-hidden text-white space-y-2.5 pointer-events-auto text-left"
      >
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

        {/* Directional Beacon Pointer */}
        {hasTarget && (
          <div className="flex items-center justify-center -mt-1 aura-text-primary relative z-10">
            {isTargetInTopHalf ? (
              <div className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider aura-text-soft">
                <ArrowUp className="w-3.5 h-3.5 animate-bounce aura-text-primary" />
                <span>Elemento resaltado arriba</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider aura-text-soft">
                <ArrowDown className="w-3.5 h-3.5 animate-bounce aura-text-primary" />
                <span>Elemento resaltado abajo</span>
              </div>
            )}
          </div>
        )}

        {/* Header: KAI Badge + Step Counter + Close */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 relative z-10">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full aura-bg-primary aura-glow-subtle animate-pulse shrink-0" />
            <span className="text-[10px] font-mono font-black aura-text-soft uppercase tracking-widest truncate">
              {currentStep.badge}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="chicle-btn flex items-center gap-1 aura-text-soft hover:text-white text-[11px] font-mono uppercase px-2 py-0.5 rounded-lg aura-bg-soft border aura-border-subtle cursor-pointer shrink-0"
            title="Saltar tour e ir directo a mis tareas (Esc)"
          >
            <Zap className="w-3 h-3 aura-text-primary" />
            <span className="hidden sm:inline">Saltar / Ir directo</span>
            <span className="sm:hidden">Saltar</span>
          </button>
        </div>

        {/* Title & Concise Instruction */}
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#040814]/80 border border-white/10 shrink-0">
              {currentStep.fallbackIcon}
            </span>
            <h4 id="kai-tour-title" className="text-xs sm:text-sm font-anton uppercase tracking-wider text-white leading-tight">
              {currentStep.title}
            </h4>
          </div>
          <p className="text-xs text-slate-200 font-sans leading-relaxed pt-0.5">
            «{currentStep.instruction}»
          </p>
        </div>

        {/* Interactive Action Button (Step 2: Forjador de tareas) */}
        {currentStep.interactiveAction && (
          <button
            type="button"
            onClick={currentStep.interactiveAction.onClick}
            className="chicle-btn w-full py-2 px-3 rounded-xl aura-bg-soft border aura-border-subtle aura-text-soft hover:text-white text-xs font-anton tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer relative z-10"
          >
            <Zap className="w-3.5 h-3.5 aura-text-primary" />
            <span>{currentStep.interactiveAction.label}</span>
          </button>
        )}

        {/* Stepper Dots & Navigation Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 relative z-10">
          <div className="flex items-center gap-1">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIndex
                    ? 'w-4 aura-bg-primary optic-active-card'
                    : i < stepIndex
                    ? 'w-1.5 bg-emerald-400'
                    : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSkip}
              className="px-2 py-1.5 rounded-lg text-slate-400 hover:text-white text-[11px] font-mono transition-colors cursor-pointer"
            >
              Saltar
            </button>
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="chicle-btn px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white text-xs font-mono font-bold cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span className="hidden sm:inline">Atrás</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="chicle-btn aura-btn-gradient optic-active-card px-3.5 py-1.5 rounded-xl font-anton text-xs uppercase tracking-wider cursor-pointer flex items-center gap-1"
            >
              <span>{stepIndex === steps.length - 1 ? '¡Finalizar!' : 'Siguiente'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
