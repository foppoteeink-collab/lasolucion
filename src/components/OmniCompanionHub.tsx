import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Calendar,
  Timer,
  BookOpen,
  ShoppingBag,
  BarChart3,
  Zap,
  Sparkles,
  BrainCircuit,
  Settings
} from 'lucide-react';
import { HoloCompanion, CompanionAuraState } from './HoloCompanion';
import { SatelliteKaiHub, SatelliteHubItem } from './SatelliteKaiHub';
import { useUIStore } from '../store/useUIStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTaskStore } from '../store/useTaskStore';
import { useTimer } from '../context/TimerContext';
import { soundFX } from '../utils/audio';
import { getTodayDateString } from '../utils/date';

interface OmniCompanionHubProps {
  onOpenOracleWithPrompt?: (promptText?: string) => void;
  onOpenNeuralAnalysis?: () => void;
  archetype?: string;
}

export const OmniCompanionHub: React.FC<OmniCompanionHubProps> = ({
  onOpenOracleWithPrompt,
  onOpenNeuralAnalysis,
  archetype = 'sabio',
}) => {
  const { setActiveTab, setModalState, isPomodoroOpen, navigationMode, openTaskForm } = useUIStore();
  const { stats } = usePlayerStore();
  const { tasksByDate } = useTaskStore();
  const { isRunning: isTimerRunning, formattedTime } = useTimer();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasRecentVictory, setHasRecentVictory] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isDraggingRef = useRef(false);

  // Detección de tareas del día
  const todayStr = getTodayDateString();
  const todayTasks = tasksByDate[todayStr] || [];
  const completedTodayTasks = todayTasks.filter((t) => t.completed).length;
  const pendingTodayTasks = todayTasks.filter((t) => !t.completed).length;

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

  // 9 Secciones con exactamente 1 o 2 palabras y el diseño oficial de La Solución RPG
  const wheelItems: SatelliteHubItem[] = useMemo(
    () => [
      {
        id: 'missions',
        label: 'Misiones',
        categoryBadge: 'MISIONES',
        icon: <CheckCircle2 className="w-5 h-5" />,
        accentColor: '#00f0ff',
        glowColor: 'rgba(0, 240, 255, 0.45)',
        liveStat: pendingTodayTasks > 0 ? `${pendingTodayTasks} pendientes` : 'Completas',
        action: () => setActiveTab('dashboard'),
      },
      {
        id: 'calendar',
        label: 'Calendario',
        categoryBadge: 'AGENDA',
        icon: <Calendar className="w-5 h-5" />,
        accentColor: '#38bdf8',
        glowColor: 'rgba(56, 189, 248, 0.45)',
        liveStat: 'Vista mensual',
        action: () => setActiveTab('planner'),
      },
      {
        id: 'pomodoro',
        label: 'Hiperenfoque',
        categoryBadge: 'POMODORO',
        icon: <Timer className="w-5 h-5" />,
        accentColor: '#f43f5e',
        glowColor: 'rgba(244, 63, 94, 0.45)',
        liveStat: isTimerRunning ? `${formattedTime}` : '25:00 min',
        action: () => setModalState('isPomodoroOpen', true),
      },
      {
        id: 'journal',
        label: 'Diario',
        categoryBadge: 'BITÁCORA',
        icon: <BookOpen className="w-5 h-5" />,
        accentColor: '#38bdf8',
        glowColor: 'rgba(56, 189, 248, 0.45)',
        liveStat: 'Reflexión diaria',
        action: () => setActiveTab('journal'),
      },
      {
        id: 'shop',
        label: 'Tienda',
        categoryBadge: 'ARSENAL',
        icon: <ShoppingBag className="w-5 h-5" />,
        accentColor: '#10b981',
        glowColor: 'rgba(16, 185, 129, 0.45)',
        liveStat: `${stats.coins || 0} Monedas`,
        action: () => setActiveTab('shop'),
      },
      {
        id: 'stats',
        label: 'Perfil',
        categoryBadge: 'RANGO',
        icon: <BarChart3 className="w-5 h-5" />,
        accentColor: '#06b6d4',
        glowColor: 'rgba(6, 182, 212, 0.45)',
        liveStat: `Nivel ${stats.level || 1} • Cazador`,
        action: () => setActiveTab('stats'),
      },
      {
        id: 'procrastination',
        label: 'Desbloqueo',
        categoryBadge: 'BOOST',
        icon: <Zap className="w-5 h-5 animate-pulse" />,
        accentColor: '#f97316',
        glowColor: 'rgba(249, 115, 22, 0.5)',
        liveStat: 'Micro-impulso 2 min',
        action: () => {
          if (onOpenOracleWithPrompt) {
            onOpenOracleWithPrompt(
              'KAI, estoy procrastinando y me cuesta arrancar. Dame una micro-estrategia de 2 minutos para desbloquearme ahora mismo.'
            );
          }
        },
      },
      {
        id: 'oracle',
        label: 'Oráculo IA',
        categoryBadge: 'SYNAPSE',
        icon: <Sparkles className="w-5 h-5 animate-pulse" />,
        accentColor: '#eab308',
        glowColor: 'rgba(234, 179, 8, 0.5)',
        liveStat: 'Guía & Tríada',
        action: () => {
          setActiveTab('dashboard');
          openTaskForm('oracle');
        },
      },
      {
        id: 'neural',
        label: 'Diagnóstico',
        categoryBadge: 'NEURAL',
        icon: <BrainCircuit className="w-5 h-5" />,
        accentColor: '#a855f7',
        glowColor: 'rgba(168, 85, 247, 0.45)',
        liveStat: 'Claridad mental',
        action: () => {
          if (onOpenNeuralAnalysis) onOpenNeuralAnalysis();
        },
      },
      {
        id: 'settings',
        label: 'Ajustes',
        categoryBadge: 'SISTEMA',
        icon: <Settings className="w-5 h-5" />,
        accentColor: '#ec4899',
        glowColor: 'rgba(236, 72, 153, 0.45)',
        liveStat: 'Configuración',
        action: () => setActiveTab('settings'),
      },
    ],
    [
      pendingTodayTasks,
      isTimerRunning,
      formattedTime,
      stats.coins,
      stats.level,
      setActiveTab,
      setModalState,
      onOpenOracleWithPrompt,
      onOpenNeuralAnalysis,
    ]
  );

  const lastToggleTimeRef = useRef(0);
  const handleCompanionClick = useCallback((e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    if (isDraggingRef.current) return;
    const now = Date.now();
    if (now - lastToggleTimeRef.current < 280) return;
    lastToggleTimeRef.current = now;
    soundFX.playClick();
    setIsMenuOpen((prev) => !prev);
  }, []);

  const handleSelectItem = (item: SatelliteHubItem) => {
    soundFX.playClick();
    setIsMenuOpen(false);
    item.action();
  };

  const openOffset = useMemo(() => {
    // Detectamos posición base de KAI en reposo
    const isDesktop = viewportDims.width >= 640;
    const currentRight = isDesktop ? 20 : 10;
    const currentBottom = isDesktop ? 24 : (navigationMode === 'classic' ? 80 : 16);

    // Centro exacto absoluto de la pantalla tanto en móvil como en computadora
    const targetX = -(viewportDims.width / 2 - (currentRight + 24));
    const targetY = -(viewportDims.height / 2 - (currentBottom + 24));

    return {
      x: Math.round(targetX),
      y: Math.round(targetY),
    };
  }, [viewportDims.width, viewportDims.height, navigationMode]);

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

      {/* DRON HOLOGRÁFICO FLOTANTE KAI */}
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
            ? 'bottom-20 sm:bottom-6 right-2.5 sm:right-5'
            : 'bottom-4 sm:bottom-6 right-2.5 sm:right-5'
        }`}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
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
          {/* Badge de pomodoro si está corriendo */}
          {(isPomodoroOpen || isTimerRunning) && !isMenuOpen && (
            <motion.button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                soundFX.playClick();
                setModalState('isPomodoroOpen', !isPomodoroOpen);
              }}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mb-1 px-2.5 py-1 rounded-full bg-cyan-950/95 border border-cyan-400 text-[9px] font-mono font-bold text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.4)] hover:bg-cyan-900/90 hover:border-cyan-300 hover:text-white flex items-center gap-1.5 shrink-0 cursor-pointer transition"
              title={isPomodoroOpen ? 'Minimizar temporizador' : 'Abrir temporizador de foco'}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <span>FOCO: {formattedTime}</span>
            </motion.button>
          )}

          {/* KAI CON ANILLO ORBITAL 360° */}
          <div
            className="group relative cursor-pointer touch-none flex items-center justify-center z-[70]"
            onClick={handleCompanionClick}
            title="Toca a KAI para abrir el menú táctico"
          >
            {/* ÓRBITA PLANETARIA 360° */}
            <AnimatePresence>
              {isMenuOpen && (
                <SatelliteKaiHub
                  items={wheelItems}
                  onClose={() => setIsMenuOpen(false)}
                  onSelect={handleSelectItem}
                />
              )}
            </AnimatePresence>

            {/* KAI SE HACE UN POCO MÁS GRANDE CUANDO SE ACTIVA */}
            <motion.div
              animate={{
                scale: isMenuOpen ? 1.15 : 1,
              }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="relative flex items-center justify-center"
            >
              <HoloCompanion
                archetype={archetype}
                size={isMenuOpen ? 54 : 48}
                interactive={true}
                onClick={handleCompanionClick}
                auraState={auraState}
                triggerVictoryWave={hasRecentVictory}
                isProjecting={isMenuOpen}
                className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] pointer-events-auto cursor-pointer"
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default OmniCompanionHub;
