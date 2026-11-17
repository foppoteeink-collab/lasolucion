import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from './common/Icon';
import { HoloCompanion, CompanionAuraState } from './HoloCompanion';
import { SatelliteKaiHub, SatelliteHubItem } from './SatelliteKaiHub';
import { useUIStore } from '../store/useUIStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTaskStore } from '../store/useTaskStore';
import { useTimer } from '../context/TimerContext';
import { soundFX } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { getTodayDateString } from '../utils/date';
import { useDayCycle } from '../hooks/useDayCycle';
import { getKaiPhrase } from '../data/kaiVoiceMatrix';
import { useNarrativeCopy } from '../hooks/useNarrativeCopy';

interface OmniCompanionHubProps {
  onOpenOracleWithPrompt?: (promptText?: string) => void;
  onOpenNeuralAnalysis?: () => void;
  onOpenKaiWorkshop?: () => void;
  onOpenFinance?: () => void;
  archetype?: string;
}

const OmniPomodoroBadge: React.FC<{
  isOpen: boolean;
  onToggle: () => void;
}> = React.memo(({ isOpen, onToggle }) => {
  const { isRunning, formattedTime } = useTimer();
  if (!isRunning && !isOpen) return null;

  return (
    <motion.button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        soundFX.playClick();
        triggerHaptic(15);
        onToggle();
      }}
      aria-label={`Temporizador de Foco Pomodoro: ${formattedTime}. Toca para abrir o cerrar.`}
      aria-pressed={isOpen}
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="mb-1 px-2.5 py-1 rounded-full bg-cyan-950/95 border border-cyan-400 text-[9px] font-mono font-bold text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.4)] hover:bg-cyan-900/90 hover:border-cyan-300 hover:text-white flex items-center gap-1.5 shrink-0 cursor-pointer transition"
      title={isOpen ? 'Minimizar temporizador' : 'Abrir temporizador de foco'}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
      <span>FOCO: {formattedTime}</span>
    </motion.button>
  );
});
OmniPomodoroBadge.displayName = 'OmniPomodoroBadge';

export const OmniCompanionHub: React.FC<OmniCompanionHubProps> = ({
  onOpenOracleWithPrompt,
  onOpenNeuralAnalysis,
  onOpenKaiWorkshop,
  onOpenFinance,
  archetype = 'sabio',
}) => {
  // Atomic selectors for UIStore
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const setModalState = useUIStore((s) => s.setModalState);
  const isPomodoroOpen = useUIStore((s) => s.isPomodoroOpen);
  const navigationMode = useUIStore((s) => s.navigationMode);
  const handDominance = useUIStore((s) => s.handDominance);
  const openTaskForm = useUIStore((s) => s.openTaskForm);
  const openVoiceDictation = useUIStore((s) => s.openVoiceDictation);

  // Atomic selectors for PlayerStore
  const coins = usePlayerStore((s) => s.stats.coins || 0);
  const level = usePlayerStore((s) => s.stats.level || 1);
  const rankTitle = usePlayerStore((s) => s.stats.rankTitle || 'Chispazo de Voluntad');
  const kaiShape = usePlayerStore((s) => s.stats.kaiShape || 'prism');
  const kaiVoiceTone = usePlayerStore((s) => s.stats.kaiVoiceTone || 'coach');
  const [kaiSpeech, setKaiSpeech] = useState<string | null>(null);
  const speechTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSpeech = useCallback(() => {
    if (speechTimerRef.current) {
      clearTimeout(speechTimerRef.current);
      speechTimerRef.current = null;
    }
    setKaiSpeech(null);
  }, []);

  const speakKai = useCallback((phrase: string, durationMs?: number) => {
    if (speechTimerRef.current) {
      clearTimeout(speechTimerRef.current);
    }
    setKaiSpeech(phrase);
    // Tiempo de lectura dinámico y pausado: mínimo 9 segundos
    const calculatedDuration = durationMs || Math.max(9000, phrase.length * 110);
    speechTimerRef.current = setTimeout(() => {
      setKaiSpeech(null);
      speechTimerRef.current = null;
    }, calculatedDuration);
  }, []);

  // Atomic selectors for TaskStore: counts only
  const todayStr = getTodayDateString();
  const completedTodayTasks = useTaskStore((s) => (s.tasksByDate[todayStr] || []).filter(t => t.completed).length);
  const pendingTodayTasks = useTaskStore((s) => (s.tasksByDate[todayStr] || []).filter(t => !t.completed).length);

  // Only timer isRunning needed here; formattedTime is isolated in OmniPomodoroBadge
  const { isRunning: isTimerRunning } = useTimer();
  const { dayStatus, startDay, finishDay } = useDayCycle();
  const copy = useNarrativeCopy();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showQuickChat, setShowQuickChat] = useState(false);
  const [hasRecentVictory, setHasRecentVictory] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  const isStreakAtRisk = useMemo(() => {
    const currentHour = new Date().getHours();
    return currentHour >= 18 && completedTodayTasks === 0 && pendingTodayTasks > 0;
  }, [completedTodayTasks, pendingTodayTasks]);

  // Estado del aura reactiva
  const auraState: CompanionAuraState = useMemo(() => {
    if (hasRecentVictory) return 'victory';
    if (isPomodoroOpen || isTimerRunning) return 'focus_trance';
    if (isStreakAtRisk) return 'warning_amber';
    return 'normal';
  }, [hasRecentVictory, isPomodoroOpen, isTimerRunning, isStreakAtRisk]);

  // Escuchar victorias para destello cuántico y proyección vocal de KAI
  const prevCompletedRef = useRef(completedTodayTasks);
  useEffect(() => {
    if (completedTodayTasks > prevCompletedRef.current) {
      setHasRecentVictory(true);
      soundFX.playLevelUp();
      triggerHaptic([30, 40, 50]);
      const phrase = getKaiPhrase('EPIC_TASK_CLEARED', kaiVoiceTone);
      speakKai(phrase);
      const timer = setTimeout(() => setHasRecentVictory(false), 3000);
      return () => {
        clearTimeout(timer);
      };
    }
    prevCompletedRef.current = completedTodayTasks;
  }, [completedTodayTasks, kaiVoiceTone, speakKai]);

  // Alerta sensorial y vocal de racha en riesgo
  const hasAlertedStreakRef = useRef(false);
  useEffect(() => {
    if (isStreakAtRisk && !hasAlertedStreakRef.current) {
      hasAlertedStreakRef.current = true;
      triggerHaptic([35, 45]);
      const phrase = getKaiPhrase('STREAK_WARNING', kaiVoiceTone);
      speakKai(phrase);
    }
    if (!isStreakAtRisk) {
      hasAlertedStreakRef.current = false;
    }
  }, [isStreakAtRisk, kaiVoiceTone, speakKai]);

  // Dimensiones seguras de viewport
  const [viewportDims, setViewportDims] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 380,
    height: typeof window !== 'undefined' ? window.innerHeight : 600,
  }));

  useEffect(() => {
    const updateDims = () => {
      setViewportDims({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', updateDims);
    window.addEventListener('orientationchange', updateDims);
    return () => {
      window.removeEventListener('resize', updateDims);
      window.removeEventListener('orientationchange', updateDims);
    };
  }, []);

  const dragConstraints = useMemo(
    () => ({
      left: -Math.max(0, viewportDims.width - 70),
      right: 8,
      top: -Math.max(0, viewportDims.height - 90),
      bottom: 8,
    }),
    [viewportDims.width, viewportDims.height]
  );

  // Clamp drag offset when viewport shrinks or rotates
  useEffect(() => {
    setDragOffset((prev) => {
      const clampedX = Math.min(dragConstraints.right, Math.max(dragConstraints.left, prev.x));
      const clampedY = Math.min(dragConstraints.bottom, Math.max(dragConstraints.top, prev.y));
      if (clampedX === prev.x && clampedY === prev.y) return prev;
      const next = { x: clampedX, y: clampedY };
      dragOffsetRef.current = next;
      return next;
    });
  }, [dragConstraints]);

  useEffect(() => {
    return () => {
      dragCleanupRef.current?.();
      dragCleanupRef.current = null;
    };
  }, []);

  const handleHubPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isMenuOpen) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      dragCleanupRef.current?.();

      const startClientX = e.clientX;
      const startClientY = e.clientY;
      const startOffsetX = dragOffsetRef.current.x;
      const startOffsetY = dragOffsetRef.current.y;
      const pointerId = e.pointerId;
      let didMovePastThreshold = false;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== pointerId) return;
        const dx = moveEvent.clientX - startClientX;
        const dy = moveEvent.clientY - startClientY;

        if (!didMovePastThreshold) {
          if (Math.hypot(dx, dy) <= 6) return;
          didMovePastThreshold = true;
          isDraggingRef.current = true;
          setIsDragging(true);
        }

        const nextX = Math.min(dragConstraints.right, Math.max(dragConstraints.left, startOffsetX + dx));
        const nextY = Math.min(dragConstraints.bottom, Math.max(dragConstraints.top, startOffsetY + dy));
        const next = { x: nextX, y: nextY };
        dragOffsetRef.current = next;
        setDragOffset(next);
      };

      const finishPointer = (upEvent: PointerEvent) => {
        if (upEvent.pointerId !== pointerId) return;
        cleanup();
        setIsDragging(false);
        if (didMovePastThreshold) {
          setTimeout(() => {
            isDraggingRef.current = false;
          }, 120);
        } else {
          isDraggingRef.current = false;
        }
      };

      const cleanup = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', finishPointer);
        window.removeEventListener('pointercancel', finishPointer);
        if (dragCleanupRef.current === cleanup) {
          dragCleanupRef.current = null;
        }
      };

      dragCleanupRef.current = cleanup;
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', finishPointer);
      window.addEventListener('pointercancel', finishPointer);
    },
    [isMenuOpen, dragConstraints]
  );

  // Burbujas del Menú KAI con íconos SVG Clear Stamp y efecto Gooey
  const wheelItems: SatelliteHubItem[] = useMemo(
    () => [
      {
        id: 'missions',
        label: 'Tareas',
        categoryBadge: 'TAREAS',
        type: 'page',
        icon: <Icon name="checkCircle" className="w-5 h-5" />,
        accentColor: '#00f0ff',
        glowColor: 'rgba(0, 240, 255, 0.45)',
        liveStat: pendingTodayTasks > 0 ? `${pendingTodayTasks} pendientes` : 'Completas',
        action: () => setActiveTab('dashboard'),
      },
      {
        id: 'journal',
        label: 'Diario',
        categoryBadge: 'BITÁCORA',
        type: 'page',
        icon: <Icon name="bookOpen" className="w-5 h-5" />,
        accentColor: '#38bdf8',
        glowColor: 'rgba(56, 189, 248, 0.45)',
        liveStat: 'Reflexión diaria',
        action: () => setActiveTab('journal'),
      },
      {
        id: 'shop',
        label: 'Tienda',
        categoryBadge: 'ARSENAL',
        type: 'page',
        icon: <Icon name="shoppingBag" className="w-5 h-5" />,
        accentColor: '#10b981',
        glowColor: 'rgba(16, 185, 129, 0.45)',
        liveStat: `${coins} Monedas`,
        action: () => setActiveTab('shop'),
      },
      {
        id: 'skills',
        label: 'Lab',
        categoryBadge: 'MAESTRÍA',
        type: 'page',
        icon: <Icon name="flask" className="w-5 h-5" />,
        accentColor: '#8b5cf6',
        glowColor: 'rgba(139, 92, 246, 0.45)',
        liveStat: 'Árbol de talentos',
        action: () => setActiveTab('skills'),
      },
      {
        id: 'stats',
        label: 'Perfil',
        categoryBadge: 'RANGO',
        type: 'page',
        icon: <Icon name="barChart" className="w-5 h-5" />,
        accentColor: '#06b6d4',
        glowColor: 'rgba(6, 182, 212, 0.45)',
        liveStat: `Nivel ${level} • ${rankTitle}`,
        action: () => setActiveTab('stats'),
      },
      {
        id: 'settings',
        label: 'Ajustes',
        categoryBadge: 'SISTEMA',
        type: 'page',
        icon: <Icon name="settings" className="w-5 h-5" />,
        accentColor: '#ec4899',
        glowColor: 'rgba(236, 72, 153, 0.45)',
        liveStat: 'Configuración',
        action: () => setActiveTab('settings'),
      },
      {
        id: 'workshop',
        label: 'Taller KAI',
        categoryBadge: 'FORJA',
        type: 'gadget',
        icon: <Icon name="palette" className="w-5 h-5" />,
        accentColor: '#d946ef',
        glowColor: 'rgba(217, 70, 239, 0.5)',
        liveStat: '',
        action: () => {
          if (onOpenKaiWorkshop) onOpenKaiWorkshop();
        },
      },
      {
        id: 'pomodoro',
        label: 'Foco',
        categoryBadge: 'POMODORO',
        type: 'gadget',
        icon: <Icon name="timer" className="w-5 h-5" />,
        accentColor: '#f43f5e',
        glowColor: 'rgba(244, 63, 94, 0.45)',
        liveStat: isTimerRunning ? 'En curso' : '25:00 min',
        action: () => setModalState('isPomodoroOpen', true),
      },
      {
        id: 'oracle',
        label: 'Oráculo',
        categoryBadge: 'NEURAL',
        type: 'gadget',
        icon: <Icon name="sparkles" className="w-5 h-5" />,
        accentColor: '#eab308',
        glowColor: 'rgba(234, 179, 8, 0.55)',
        liveStat: 'Mente & Estrategia',
        action: () => {
          if (onOpenOracleWithPrompt) {
            onOpenOracleWithPrompt();
          }
        },
      },
      {
        id: 'finance',
        label: 'Finanzas',
        categoryBadge: 'FINANZAS',
        type: 'gadget',
        icon: <Icon name="wallet" className="w-5 h-5" />,
        accentColor: '#10b981',
        glowColor: 'rgba(16, 185, 129, 0.45)',
        liveStat: 'Ingresos/Gastos',
        action: () => {
          if (onOpenFinance) onOpenFinance();
        },
      },
      {
        id: 'neural',
        label: 'Diagnóstico',
        categoryBadge: 'NEURAL',
        type: 'gadget',
        icon: <Icon name="brain" className="w-5 h-5" />,
        accentColor: '#00f0ff',
        glowColor: 'rgba(0, 240, 255, 0.55)',
        liveStat: 'Simulador & IA',
        action: () => {
          if (onOpenNeuralAnalysis) onOpenNeuralAnalysis();
        },
      },
    ],
    [
      pendingTodayTasks,
      isTimerRunning,
      coins,
      level,
      rankTitle,
      kaiShape,
      setActiveTab,
      setModalState,
      onOpenOracleWithPrompt,
      openTaskForm,
      onOpenFinance,
      onOpenKaiWorkshop,
      onOpenNeuralAnalysis,
    ]
  );

  // Cerrar menú con tecla Escape
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  const lastToggleTimeRef = useRef(0);
  const handleCompanionClick = useCallback((e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault?.();
    }
    if (isDraggingRef.current) return;
    const now = Date.now();
    if (now < lastToggleTimeRef.current || now - lastToggleTimeRef.current < 160) return;
    lastToggleTimeRef.current = now;
    // Si el menú está cerrado, mostrar el chat rápido primero en lugar de abrir el menú radial
    if (!isMenuOpen && !showQuickChat) {
      soundFX.playClick();
      triggerHaptic(20);
      setShowQuickChat(true);
      return;
    }
    if (showQuickChat) {
      setShowQuickChat(false);
      return;
    }
    soundFX.playClick();
    triggerHaptic(20);
    setIsMenuOpen((prev) => !prev);
  }, [isMenuOpen, showQuickChat]);

  const handleSelectItem = useCallback((item: SatelliteHubItem) => {
    soundFX.playClick();
    triggerHaptic([20, 30]);
    setIsMenuOpen(false);
    // Bloqueo anti-rebote mínimo (150ms) sin introducir latencia perceptible
    lastToggleTimeRef.current = Date.now() + 150;
    try {
      item.action();
    } catch (err) {
      console.error('Error al ejecutar acción de KAI:', err);
    }
  }, []);

  const openOffset = useMemo(() => {
    // Detectamos posición base de KAI en reposo considerando mano dominante
    const isDesktop = viewportDims.width >= 640;
    const currentSide = isDesktop ? 20 : 10;
    const currentBottom = isDesktop ? 24 : (navigationMode === 'classic' ? 80 : 16);

    // KAI tiene tamaño 86 en el menú desplegado (svgWidth ~118px, svgHeight ~125px).
    // Su centro real está a la mitad exacta de su masa visual:
    const kaiHalfWidth = 59;
    const kaiHalfHeight = 63;

    // Centro exacto absoluto de la pantalla tanto en móvil como en computadora
    const targetX = handDominance === 'left'
      ? (viewportDims.width / 2 - (currentSide + kaiHalfWidth))
      : -(viewportDims.width / 2 - (currentSide + kaiHalfWidth));
    const targetY = -(viewportDims.height / 2 - (currentBottom + kaiHalfHeight));

    return {
      x: Math.round(targetX),
      y: Math.round(targetY),
    };
  }, [viewportDims.width, viewportDims.height, navigationMode, handDominance]);

  return (
    <>
      {/* TELÓN DE CIERRE GLOBAL */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="fixed inset-0 z-[55] bg-black/70 pointer-events-auto cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(false);
              setShowQuickChat(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* DRON HOLOGRÁFICO FLOTANTE KAI (Adaptativo para diestros y zurdos) */}
      <motion.div
        onPointerDown={handleHubPointerDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed z-[60] pointer-events-auto select-none touch-none will-change-transform omni-companion-hub-root ${
          navigationMode === 'classic'
            ? handDominance === 'left'
              ? 'bottom-20 sm:bottom-6 left-2.5 sm:left-5'
              : 'bottom-20 sm:bottom-6 right-2.5 sm:right-5'
            : handDominance === 'left'
              ? 'bottom-4 sm:bottom-6 left-2.5 sm:left-5'
              : 'bottom-4 sm:bottom-6 right-2.5 sm:right-5'
        }`}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingRight: handDominance === 'left' ? undefined : 'env(safe-area-inset-right, 0px)',
          paddingLeft: handDominance === 'left' ? 'env(safe-area-inset-left, 0px)' : undefined,
          touchAction: 'none',
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: isDragging ? 1.08 : 1,
          opacity: isMenuOpen || isHovered || isDragging ? 1 : 0.9,
          // Al abrir, KAI se desplaza hacia el centro exacto de la pantalla
          x: isMenuOpen ? openOffset.x : dragOffset.x,
          y: isMenuOpen ? openOffset.y : dragOffset.y,
        }}
        transition={
          isDragging
            ? { duration: 0 }
            : { type: 'spring', damping: 34, stiffness: 880, mass: 0.35 }
        }
      >
        <div className="relative flex flex-col items-center touch-none">
          {/* Micro-Transmisión e Interacción de KAI / Oráculo (Siempre al frente) */}
          <AnimatePresence>
            {kaiSpeech && (
              <motion.div
                role="dialog"
                aria-label="Mensaje del Oráculo KAI"
                initial={{ opacity: 0, y: 12, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.92 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                onMouseEnter={() => {
                  // Pausar auto-cierre mientras el usuario pasa el mouse para lectura tranquila
                  if (speechTimerRef.current) {
                    clearTimeout(speechTimerRef.current);
                    speechTimerRef.current = null;
                  }
                }}
                className="absolute bottom-full mb-3.5 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 w-[280px] sm:w-[320px] p-3 rounded-2xl bg-[#030d1d]/95 border border-cyan-400/80 shadow-[0_12px_40px_rgba(0,240,255,0.4),0_0_20px_rgba(0,240,255,0.25)] backdrop-blur-xl text-white z-[110] pointer-events-auto select-auto"
              >
                {/* Flecha indicadora apuntando a KAI */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-cyan-400/90" />

                {/* Header con título y botón de cierre X */}
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-cyan-500/25">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-[11px] font-mono tracking-wider uppercase">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>Oráculo KAI</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundFX.playClick();
                      clearSpeech();
                    }}
                    className="w-5 h-5 rounded-lg bg-white/10 hover:bg-white/25 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs font-bold active:scale-95"
                    aria-label="Cerrar mensaje"
                    title="Cerrar (X)"
                  >
                    ✕
                  </button>
                </div>

                {/* Mensaje principal legible */}
                <p className="text-[12px] sm:text-[12.5px] font-sans font-medium text-slate-100 leading-snug text-left py-0.5">
                  "{kaiSpeech}"
                </p>

                {/* Barra de interacción y respuesta */}
                <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center gap-1.5 justify-end">
                  {onOpenOracleWithPrompt && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundFX.playClick();
                        const contextPrompt = `KAI me acaba de decir: "${kaiSpeech}". ¿Qué me recomiendas hacer ahora?`;
                        clearSpeech();
                        onOpenOracleWithPrompt(contextPrompt);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/50 text-cyan-300 hover:text-cyan-100 text-[10.5px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                      title="Abrir conversación con el Oráculo"
                    >
                      <Icon name="sparkles" className="w-3 h-3 text-cyan-400" />
                      <span>Responder al Oráculo</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundFX.playClick();
                      clearSpeech();
                    }}
                    className="px-2 py-1 rounded-xl bg-white/[0.08] hover:bg-white/20 text-slate-300 hover:text-white text-[10.5px] font-mono font-medium transition-colors cursor-pointer active:scale-95"
                  >
                    Entendido
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Panel de Chat Rápido con KAI */}
          {showQuickChat && !kaiSpeech && (
            <div
              className="absolute bottom-[calc(100%+12px)] right-0 w-72 bg-[#040d1e]/95 border border-cyan-500/40 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.9),0_0_20px_rgba(0,240,255,0.15)] z-[115] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 pt-3 pb-2 border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300">¿En qué te ayudo?</span>
                <button
                  type="button"
                  onClick={() => setShowQuickChat(false)}
                  className="text-slate-500 hover:text-white text-xs cursor-pointer"
                >✕</button>
              </div>
              <div className="p-2.5 space-y-1.5">
                {[
                  { label: '🎙️ Dictar tareas o hábitos por voz', action: () => { setShowQuickChat(false); openVoiceDictation(); } },
                  { label: '⚡ Organiza mi día de hoy', action: () => { setShowQuickChat(false); if (onOpenOracleWithPrompt) onOpenOracleWithPrompt('Organiza mi día de hoy con las tareas que tengo pendientes. Dame un horario realista.'); } },
                  { label: '🎯 ¿Por qué tarea empiezo?', action: () => { setShowQuickChat(false); if (onOpenOracleWithPrompt) onOpenOracleWithPrompt('Tengo varias tareas. ¿Cuál debería hacer primero para ser más productivo hoy?'); } },
                  { label: '🧘 Dame motivación ahora', action: () => { speakKai('Cada tarea que completas es un paso hacia quien quieres ser. ¡Vamos, tú puedes!'); setShowQuickChat(false); } },
                  { label: '➕ Agrégame una tarea', action: () => { setShowQuickChat(false); openTaskForm('task'); } },
                  { label: '📋 Ver plantillas de rutina', action: () => { setShowQuickChat(false); if (onOpenOracleWithPrompt) onOpenOracleWithPrompt(''); } },
                ].map(({ label, action }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={action}
                    className="w-full text-left px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-cyan-950/60 border border-white/10 hover:border-cyan-500/40 text-sm text-slate-200 hover:text-white transition-all cursor-pointer active:scale-[0.98] flex items-center gap-2"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="px-3 pb-2.5">
                <button
                  type="button"
                  onClick={() => { setShowQuickChat(false); setIsMenuOpen(true); }}
                  className="w-full py-2 rounded-xl bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold transition-all cursor-pointer"
                >
                  Ver todas las opciones →
                </button>
              </div>
            </div>
          )}

          {/* Badge de pomodoro si está corriendo (aislado en micro-componente para 0 re-renders a 1 Hz) */}
          {!isMenuOpen && (
            <OmniPomodoroBadge
              isOpen={isPomodoroOpen}
              onToggle={() => setModalState('isPomodoroOpen', !isPomodoroOpen)}
            />
          )}

          {/* KAI CON EXPANSIÓN DE BURBUJAS GOOEY (#mbe-goo) */}
          <div className="relative touch-none flex items-center justify-center z-[70]">
            <SatelliteKaiHub
              items={wheelItems}
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              onSelect={handleSelectItem}
            />

            {/* KAI SE HACE UN POCO MÁS GRANDE CUANDO SE ACTIVA */}
            <motion.div
              role="button"
              tabIndex={0}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? 'Cerrar menú táctico KAI' : 'Abrir menú táctico KAI'}
              animate={{
                scale: isMenuOpen ? 1.15 : 1,
              }}
              transition={{ type: 'spring', damping: 24, stiffness: 480, mass: 0.45 }}
              className="relative flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:rounded-full"
              onClick={handleCompanionClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCompanionClick(e);
                }
              }}
              title={isMenuOpen ? 'Cerrar menú' : 'Toca a KAI para abrir el menú táctico'}
            >
              <HoloCompanion
                archetype={archetype}
                size={isMenuOpen ? 80 : 58}
                interactive={true}
                suppressClickSound={true}
                auraState={auraState}
                triggerVictoryWave={hasRecentVictory}
                isProjecting={isMenuOpen}
                className="pointer-events-auto cursor-pointer"
              />
            </motion.div>
          </div>

          {/* Botón Inteligente de Jornada acoplado con rendimiento táctico a 60 FPS */}
          <AnimatePresence mode="wait">
            {!isMenuOpen && dayStatus === 'idle' && (
              <motion.button
                key="nexus-start-day"
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  soundFX.playClick();
                  triggerHaptic([20, 30]);
                  startDay();
                  const phrase = getKaiPhrase('DAY_START', kaiVoiceTone);
                  speakKai(phrase);
                }}
                initial={{ opacity: 0, y: -4, scale: 0.92 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{ opacity: 0, y: -6, scale: 0.85, transition: { duration: 0.15 } }}
                transition={{
                  opacity: { duration: 0.18 },
                  scale: { duration: 0.18 },
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                aria-label={copy.startDayTooltip}
                title={copy.startDayTooltip}
                className="btn-neon-hunter mt-3.5 px-3.5 py-1.5 text-xs font-black tracking-wider uppercase flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 via-[#d6f421] to-cyan-300 text-[#020617] border-2 border-cyan-100 ring-2 ring-cyan-400/70 shadow-[0_0_12px_rgba(0,240,255,0.35)] shrink-0 cursor-pointer whitespace-nowrap active:scale-95 transition-all"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-950" />
                </span>
                <Icon name="sun" className="w-3.5 h-3.5 text-[#020617] shrink-0" />
                <span>{copy.startDayCompact}</span>
                <Icon name="arrowRight" className="w-3.5 h-3.5 text-[#020617] shrink-0" />
              </motion.button>
            )}

            {!isMenuOpen && dayStatus === 'ready_to_close' && (
              <motion.button
                key="nexus-close-day"
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  soundFX.playClick();
                  triggerHaptic([25, 40]);
                  finishDay();
                  const phrase = getKaiPhrase('NIGHTLY_CLOSE_SUCCESS', kaiVoiceTone);
                  speakKai(phrase);
                }}
                initial={{ opacity: 0, y: -4, scale: 0.92 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{ opacity: 0, y: -6, scale: 0.85, transition: { duration: 0.15 } }}
                transition={{
                  opacity: { duration: 0.18 },
                  scale: { duration: 0.18 },
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                aria-label={copy.closeDayTooltip}
                title={copy.closeDayTooltip}
                className="btn-neon-hunter mt-3.5 px-3.5 py-1.5 text-xs font-black tracking-wider uppercase flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-300 text-[#020617] border-2 border-amber-100 ring-2 ring-amber-400/70 shadow-[0_0_12px_rgba(245,158,11,0.35)] shrink-0 cursor-pointer whitespace-nowrap active:scale-95 transition-all"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-950" />
                </span>
                <Icon name="moon" className="w-3.5 h-3.5 text-[#020617] shrink-0" />
                <span>{copy.closeDayCompact}</span>
                <Icon name="arrowRight" className="w-3.5 h-3.5 text-[#020617] shrink-0" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
};

export default OmniCompanionHub;
