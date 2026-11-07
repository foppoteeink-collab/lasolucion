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
import { getTodayDateString } from '../utils/date';
import { useDayCycle } from '../hooks/useDayCycle';
import { getKaiPhrase } from '../data/kaiVoiceMatrix';

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
      onClick={(e) => {
        e.stopPropagation();
        soundFX.playClick();
        onToggle();
      }}
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

  // Atomic selectors for PlayerStore
  const coins = usePlayerStore((s) => s.stats.coins || 0);
  const level = usePlayerStore((s) => s.stats.level || 1);
  const rankTitle = usePlayerStore((s) => s.stats.rankTitle || 'Chispazo de Voluntad');
  const kaiShape = usePlayerStore((s) => s.stats.kaiShape || 'prism');
  const kaiVoiceTone = usePlayerStore((s) => s.stats.kaiVoiceTone || 'coach');
  const [kaiSpeech, setKaiSpeech] = useState<string | null>(null);

  // Atomic selectors for TaskStore: counts only
  const todayStr = getTodayDateString();
  const completedTodayTasks = useTaskStore((s) => (s.tasksByDate[todayStr] || []).filter(t => t.completed).length);
  const pendingTodayTasks = useTaskStore((s) => (s.tasksByDate[todayStr] || []).filter(t => !t.completed).length);

  // Only timer isRunning needed here; formattedTime is isolated in OmniPomodoroBadge
  const { isRunning: isTimerRunning } = useTimer();
  const { dayStatus, startDay, finishDay } = useDayCycle();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasRecentVictory, setHasRecentVictory] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isDraggingRef = useRef(false);

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

  // Escuchar victorias para destello cuántico
  const prevCompletedRef = useRef(completedTodayTasks);
  useEffect(() => {
    if (completedTodayTasks > prevCompletedRef.current) {
      setHasRecentVictory(true);
      soundFX.playLevelUp();
      const timer = setTimeout(() => setHasRecentVictory(false), 3000);
      return () => clearTimeout(timer);
    }
    prevCompletedRef.current = completedTodayTasks;
  }, [completedTodayTasks]);

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
          } else {
            openTaskForm('oracle');
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
    soundFX.playClick();
    setIsMenuOpen((prev) => !prev);
  }, []);

  const handleSelectItem = useCallback((item: SatelliteHubItem) => {
    soundFX.playClick();
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[55] bg-black/65 backdrop-blur-[2px] pointer-events-auto cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* DRON HOLOGRÁFICO FLOTANTE KAI (Adaptativo para diestros y zurdos) */}
      <motion.div
        drag={!isMenuOpen}
        dragMomentum={false}
        dragConstraints={dragConstraints}
        dragElastic={0.04}
        whileDrag={{ scale: 1.08 }}
        onDragStart={() => { isDraggingRef.current = true; }}
        onDragEnd={() => { setTimeout(() => { isDraggingRef.current = false; }, 120); }}
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
          scale: 1,
          opacity: isMenuOpen || isHovered ? 1 : 0.9,
          // Al abrir, KAI se desplaza hacia el centro exacto de la pantalla
          x: isMenuOpen ? openOffset.x : 0,
          y: isMenuOpen ? openOffset.y : 0,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.7 }}
      >
        <div className="relative flex flex-col items-center touch-none">
          {/* Micro-Transmisión de KAI (8-12 palabras contextuales) */}
          <AnimatePresence>
            {kaiSpeech && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.94 }}
                transition={{ duration: 0.2 }}
                className="absolute -top-12 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 max-w-[260px] px-3 py-1.5 rounded-xl bg-[#040d1a]/95 border border-cyan-400/50 shadow-tactical-glow text-white text-[11px] font-medium leading-tight text-center z-50 pointer-events-none"
              >
                <span className="text-cyan-300 font-bold mr-1">KAI:</span>
                <span>"{kaiSpeech}"</span>
              </motion.div>
            )}
          </AnimatePresence>

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
              animate={{
                scale: isMenuOpen ? 1.15 : 1,
              }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="relative flex items-center justify-center cursor-pointer"
              onClick={handleCompanionClick}
              title={isMenuOpen ? 'Cerrar menú' : 'Toca a KAI para abrir el menú táctico'}
            >
              <HoloCompanion
                archetype={archetype}
                size={isMenuOpen ? 80 : 58}
                interactive={true}
                onClick={handleCompanionClick}
                auraState={auraState}
                triggerVictoryWave={hasRecentVictory}
                isProjecting={isMenuOpen}
                className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] pointer-events-auto cursor-pointer"
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
                  startDay();
                  const phrase = getKaiPhrase('DAY_START', kaiVoiceTone);
                  setKaiSpeech(phrase);
                  setTimeout(() => setKaiSpeech(null), 3600);
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
                title="Activar jornada oficial e iniciar el día"
                className="btn-neon-hunter mt-3.5 px-3.5 py-1.5 text-xs font-black tracking-wider uppercase flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 via-[#d6f421] to-cyan-300 text-[#020617] border-2 border-cyan-100 ring-2 ring-cyan-400/70 shadow-[0_0_12px_rgba(0,240,255,0.35)] shrink-0 cursor-pointer whitespace-nowrap active:scale-95 transition-all"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-950" />
                </span>
                <Icon name="sun" className="w-3.5 h-3.5 text-[#020617] shrink-0" />
                <span>DESPLEGAR</span>
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
                  finishDay();
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
                title="Consolidar jornada y registrar inicio de descanso"
                className="btn-neon-hunter mt-3.5 px-3.5 py-1.5 text-xs font-black tracking-wider uppercase flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-300 text-[#020617] border-2 border-amber-100 ring-2 ring-amber-400/70 shadow-[0_0_12px_rgba(245,158,11,0.35)] shrink-0 cursor-pointer whitespace-nowrap active:scale-95 transition-all"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-950" />
                </span>
                <Icon name="moon" className="w-3.5 h-3.5 text-[#020617] shrink-0" />
                <span>CONSOLIDAR</span>
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
