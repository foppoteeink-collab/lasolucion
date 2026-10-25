import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  FileText
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
  positionPreference?: 'top' | 'bottom';
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
        'Toca este orbe para registrar tu hábito diario (+1). Mantén tu racha: 21 días para asimilar el hábito y 66 días para maestría permanente.',
      fallbackIcon: <Target className="w-5 h-5 text-cyan-400" />,
      positionPreference: 'bottom'
    },
    {
      id: 'add-task-btn',
      targetSelector: '[data-tour="add-task-btn"]',
      badge: 'PASO 2 DE 5 // CREACIÓN',
      title: 'FORJAR NUEVA MISIÓN',
      instruction:
        'Pulsa este botón "+" para crear tareas o hábitos. Asígnales categoría, dificultad y un bloque horario para ordenar tu día.',
      fallbackIcon: <PlusCircle className="w-5 h-5 text-amber-400" />,
      positionPreference: 'bottom',
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
        'Marca este recuadro para completar tu misión. Al tacharla cobrarás Monedas de Oro y XP al instante para subir de rango.',
      fallbackIcon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      positionPreference: 'bottom'
    },
    {
      id: 'task-note-btn',
      targetSelector: '[data-tour="task-note-btn"]',
      badge: 'PASO 4 DE 5 // BITÁCORA',
      title: 'NOTAS PRIVADAS',
      instruction:
        'Toca el chip "Nota" para desplegar la bitácora interna de la tarea y registrar ideas, enlaces o reflexiones de trabajo.',
      fallbackIcon: <FileText className="w-5 h-5 text-purple-400" />,
      positionPreference: 'top'
    },
    {
      id: 'hp-bar',
      targetSelector: '[data-tour="hp-bar"]',
      badge: 'PASO 5 DE 5 // TELEMETRÍA',
      title: 'ENERGÍA VITAL (HP)',
      instruction:
        'Esta barra refleja tu salud. Si necesitas recargar, activa "Modo Descanso" en el calendario para protegerla sin ninguna penalización.',
      fallbackIcon: <Heart className="w-5 h-5 text-rose-400" />,
      positionPreference: 'bottom'
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
      // Smooth scroll if element is far off view
      const isInView =
        rect.top >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
      if (!isInView) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setTargetRect(null);
    }
  }, [isTacticalGuideOpen, stepIndex]);

  useEffect(() => {
    updateTargetRect();
    const handleRecalc = () => updateTargetRect();
    window.addEventListener('resize', handleRecalc);
    window.addEventListener('scroll', handleRecalc, true);

    // Timeout to allow dynamic DOM rendering
    const timer = setTimeout(updateTargetRect, 100);

    return () => {
      window.removeEventListener('resize', handleRecalc);
      window.removeEventListener('scroll', handleRecalc, true);
      clearTimeout(timer);
    };
  }, [updateTargetRect, stepIndex]);

  if (!isTacticalGuideOpen) return null;

  const currentStep = steps[stepIndex];

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

  const handleSkip = () => {
    soundFX.playClick();
    markTutorialGuideSeen('introWalkthrough');
    closeTacticalGuide();
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

  // Compute spotlight cutout style
  const padding = 8;
  const hasTarget = Boolean(targetRect && targetRect.width > 0 && targetRect.height > 0);

  // Position tooltip relative to target rect
  const getTooltipStyle = (): React.CSSProperties => {
    if (!hasTarget || !targetRect) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '420px',
        zIndex: 60
      };
    }

    const spaceBelow = window.innerHeight - targetRect.bottom;
    const isPreferTop = currentStep.positionPreference === 'top' || spaceBelow < 220;

    const top = isPreferTop
      ? Math.max(16, targetRect.top - 200)
      : Math.min(window.innerHeight - 230, targetRect.bottom + 16);

    const left = Math.max(
      16,
      Math.min(window.innerWidth - 380, targetRect.left + targetRect.width / 2 - 180)
    );

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: 'calc(100% - 32px)',
      maxWidth: '380px',
      zIndex: 60
    };
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-auto">
      {/* ── 1. SPOTLIGHT HOLE CUTOUT ── */}
      {hasTarget && targetRect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{
            opacity: 1,
            scale: 1,
            top: targetRect.top - padding,
            left: targetRect.left - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'fixed',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.85)',
            pointerEvents: 'none',
            zIndex: 51
          }}
          className="rounded-2xl border-2 border-cyan-400 ring-4 ring-cyan-500/40 shadow-[0_0_25px_rgba(0,240,255,0.8)]"
        >
          {/* Animated pulsing neon halo */}
          <span className="absolute -inset-1 rounded-2xl bg-cyan-400/20 animate-ping pointer-events-none" />
        </motion.div>
      )}

      {/* Fallback backdrop when target is not yet found on DOM */}
      {!hasTarget && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 pointer-events-auto"
          onClick={handleSkip}
        />
      )}

      {/* ── 2. TACTICAL TOOLTIP SPEECH BUBBLE ── */}
      <motion.div
        key={currentStep.id}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        style={getTooltipStyle()}
        className="scifi-glass-modal rounded-2xl p-4 border border-cyan-500/60 shadow-[0_0_35px_rgba(0,240,255,0.3)] text-white space-y-3 pointer-events-auto"
      >
        {/* Header: KAI Badge + Step Counter + Close */}
        <div className="flex items-center justify-between gap-2 border-b border-cyan-500/30 pb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,1)] animate-pulse shrink-0" />
            <span className="text-[10px] font-mono font-black text-cyan-300 uppercase tracking-widest truncate">
              {currentStep.badge}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="text-slate-400 hover:text-white text-[11px] font-mono uppercase px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Omitir tour"
          >
            ✕ Omitir
          </button>
        </div>

        {/* Title & Micro-Instruction */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-cyan-950/80 border border-cyan-400/50 shrink-0">
              {currentStep.fallbackIcon}
            </span>
            <h4 className="text-sm font-anton uppercase tracking-wide text-white">
              {currentStep.title}
            </h4>
          </div>
          <p className="text-xs text-slate-200 font-sans leading-relaxed pt-0.5">
            «{currentStep.instruction}»
          </p>
        </div>

        {/* Interactive Action Button (e.g., Open Task Form on Step 2) */}
        {currentStep.interactiveAction && (
          <button
            type="button"
            onClick={currentStep.interactiveAction.onClick}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-amber-500/20 border border-cyan-400 text-cyan-200 hover:text-white text-xs font-anton tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.2)] active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
            <span>{currentStep.interactiveAction.label}</span>
          </button>
        )}

        {/* Stepper Dots & Navigation Buttons */}
        <div className="flex items-center justify-between pt-1 border-t border-cyan-500/20">
          <div className="flex items-center gap-1">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIndex
                    ? 'w-4 bg-cyan-400 shadow-[0_0_6px_rgba(0,240,255,0.8)]'
                    : i < stepIndex
                    ? 'w-1.5 bg-emerald-400'
                    : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-2.5 py-1.5 rounded-lg bg-surface-card border border-white/10 text-slate-300 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span className="hidden sm:inline">Atrás</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-anton text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.4)] active:scale-95 flex items-center gap-1 font-bold"
            >
              <span>{stepIndex === steps.length - 1 ? '¡Finalizar!' : 'Siguiente'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
