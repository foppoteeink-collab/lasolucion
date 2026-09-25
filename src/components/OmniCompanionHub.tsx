import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Timer, 
  Sparkles, 
  BarChart3, 
  ShoppingBag, 
  BookOpen, 
  Zap, 
  BrainCircuit,
  MessageSquareQuote,
  Settings,
  X
} from 'lucide-react';
import { HoloCompanion, CompanionAuraState } from './HoloCompanion';
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

interface OrbitalAction {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
  glowColor: string;
  action: () => void;
  badge?: string;
  isSpecial?: boolean;
}

export const OmniCompanionHub: React.FC<OmniCompanionHubProps> = ({
  onOpenOracleWithPrompt,
  onOpenNeuralAnalysis,
  archetype = 'sabio',
}) => {
  const { activeTab, setActiveTab, setModalState, isPomodoroOpen, navigationMode } = useUIStore();
  const { stats } = usePlayerStore();
  const { tasksByDate } = useTaskStore();
  const { isRunning: isTimerRunning, formattedTime } = useTimer();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredActionId, setHoveredActionId] = useState<string | null>(null);
  const [hasRecentVictory, setHasRecentVictory] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Detección de tareas de la fecha actual
  const todayStr = getTodayDateString();
  const todayTasks = tasksByDate[todayStr] || [];
  const completedTodayTasks = todayTasks.filter((t) => t.completed).length;
  const pendingTodayTasks = todayTasks.filter((t) => !t.completed).length;

  // Evaluar si hay riesgo de racha o tareas atrasadas
  const isStreakAtRisk = useMemo(() => {
    const currentHour = new Date().getHours();
    return currentHour >= 18 && completedTodayTasks === 0 && pendingTodayTasks > 0;
  }, [completedTodayTasks, pendingTodayTasks]);

  // Estado del aura reactiva según pantalla y contexto
  const auraState: CompanionAuraState = useMemo(() => {
    if (hasRecentVictory) return 'victory';
    if (isPomodoroOpen || isTimerRunning) return 'focus_trance';
    if (isStreakAtRisk) return 'warning_amber';
    return 'normal';
  }, [hasRecentVictory, isPomodoroOpen, isTimerRunning, isStreakAtRisk]);

  // Escuchar cuando se completan tareas o se logran victorias (aura reactiva y sonido, sin invadir la pantalla con texto)
  const prevCompletedRef = useRef(completedTodayTasks);
  useEffect(() => {
    if (completedTodayTasks > prevCompletedRef.current) {
      setHasRecentVictory(true);
      soundFX.playLevelUp();
      const timer = setTimeout(() => setHasRecentVictory(false), 3500);
      return () => clearTimeout(timer);
    }
    prevCompletedRef.current = completedTodayTasks;
  }, [completedTodayTasks]);

  // Dimensiones seguras de viewport para límites de arrastre reactivos
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

  const handleCompanionClick = () => {
    if (isDragging) return;
    soundFX.playClick();
    setIsMenuOpen((prev) => !prev);
  };

  const handleExecuteAction = (action: () => void) => {
    soundFX.playClick();
    setIsMenuOpen(false);
    setHoveredActionId(null);
    action();
  };

  // Configuración geométrica de las dos órbitas superiores concéntricas y perfectamente simétricas
  const INNER_RADIUS = 92;
  const OUTER_RADIUS = 152;
  const INNER_ANGLES = [135, 105, 75, 45]; // 4 glifos del aro interno: paso regular de 30°, simétricos respecto a 90°
  const OUTER_ANGLES = [150, 120, 90, 60, 30]; // 5 glifos del aro externo: paso regular de 30°, coronando en 90° en el cenit

  // Lista de Acciones Holográficas organizada simétricamente: 4 interiores + 5 exteriores (CADA UNO CON SU COLOR NEÓN ÚNICO)
  const actions: OrbitalAction[] = useMemo(() => [
    // --- ARO INTERNO (4 glifos primarios: 135°, 105°, 75°, 45°) ---
    {
      id: 'missions',
      title: 'Misiones & Tareas',
      subtitle: 'Tus hábitos, metas y objetivos del día',
      icon: <CheckCircle2 className="w-4 h-4 text-cyan-300" />,
      accentColor: '#00f0ff',
      glowColor: 'rgba(0, 240, 255, 0.55)',
      badge: `${pendingTodayTasks} pendientes`,
      action: () => setActiveTab('dashboard'),
    },
    {
      id: 'pomodoro',
      title: 'Hiperenfoque',
      subtitle: 'Temporizador Pomodoro con pulso místico',
      icon: <Timer className="w-4 h-4 text-rose-300" />,
      accentColor: '#f43f5e',
      glowColor: 'rgba(244, 63, 94, 0.55)',
      badge: isTimerRunning ? formattedTime : '25 MIN',
      action: () => setModalState('isPomodoroOpen', true),
    },
    {
      id: 'journal',
      title: 'Diario de Reflexión',
      subtitle: 'Notas diarias, sabiduría y evolución',
      icon: <BookOpen className="w-4 h-4 text-sky-300" />,
      accentColor: '#38bdf8',
      glowColor: 'rgba(56, 189, 248, 0.55)',
      action: () => setActiveTab('journal'),
    },
    {
      id: 'shop',
      title: (stats.level || 1) < 5 ? 'Tienda (Bloqueada)' : 'Tienda de Recompensas',
      subtitle: (stats.level || 1) < 5 ? 'Se desbloquea al Nivel 5' : `${stats.coins || 0} monedas de oro acumuladas`,
      icon: (stats.level || 1) < 5 ? <AlertTriangle className="w-4 h-4 text-gray-500" /> : <ShoppingBag className="w-4 h-4 text-emerald-300" />,
      accentColor: (stats.level || 1) < 5 ? '#6b7280' : '#10b981',
      glowColor: (stats.level || 1) < 5 ? 'rgba(107, 114, 128, 0.3)' : 'rgba(16, 185, 129, 0.55)',
      action: () => {
        if ((stats.level || 1) >= 5) {
          setActiveTab('shop');
        }
      },
    },

    // --- ARO EXTERNO (5 glifos secundarios y místicos: 150°, 120°, 90°, 60°, 30°) ---
    {
      id: 'stats',
      title: (stats.level || 1) < 5 ? 'Estadísticas (Bloqueado)' : 'Estadísticas & XP',
      subtitle: (stats.level || 1) < 5 ? 'Se desbloquea al Nivel 5' : `Nivel ${stats.level || 1} • Racha de ${stats.streakDays || 1} días`,
      icon: (stats.level || 1) < 5 ? <AlertTriangle className="w-4.5 h-4.5 text-gray-500" /> : <BarChart3 className="w-4.5 h-4.5 text-teal-300" />,
      accentColor: (stats.level || 1) < 5 ? '#6b7280' : '#06b6d4',
      glowColor: (stats.level || 1) < 5 ? 'rgba(107, 114, 128, 0.3)' : 'rgba(6, 182, 212, 0.55)',
      action: () => {
        if ((stats.level || 1) >= 5) {
          setActiveTab('stats');
        }
      },
    },
    {
      id: 'procrastination',
      title: 'Estoy procrastinando',
      subtitle: 'Micro-estrategia de desbloqueo en 2 min',
      icon: <Zap className="w-4.5 h-4.5 text-orange-300" />,
      accentColor: '#f97316',
      glowColor: 'rgba(249, 115, 22, 0.6)',
      badge: '2 MIN BOOST',
      isSpecial: true,
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
      title: 'Oráculo IA',
      subtitle: 'Consultar sabiduría y planes con KAI',
      icon: <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />,
      accentColor: '#eab308',
      glowColor: 'rgba(234, 179, 8, 0.65)',
      action: () => {
        if (onOpenOracleWithPrompt) onOpenOracleWithPrompt();
      },
    },
    {
      id: 'neural',
      title: 'Diagnóstico Neural',
      subtitle: 'Análisis de tu carga cognitiva y energía',
      icon: <BrainCircuit className="w-4.5 h-4.5 text-purple-300" />,
      accentColor: '#a855f7',
      glowColor: 'rgba(168, 85, 247, 0.6)',
      action: () => {
        if (onOpenNeuralAnalysis) onOpenNeuralAnalysis();
      },
    },
    {
      id: 'settings',
      title: 'Ajustes',
      subtitle: 'Configuración general, audio y sistema',
      icon: <Settings className="w-4.5 h-4.5 text-pink-300" />,
      accentColor: '#ec4899',
      glowColor: 'rgba(236, 72, 153, 0.55)',
      action: () => setActiveTab('settings'),
    },
  ], [
    pendingTodayTasks,
    isTimerRunning,
    formattedTime,
    stats.level,
    stats.streakDays,
    stats.coins,
    onOpenOracleWithPrompt,
    onOpenNeuralAnalysis,
    setActiveTab,
    setModalState,
  ]);

  // Acción activa seleccionada por cursor o dedo
  const activeHoveredAction = useMemo(
    () => actions.find((item) => item.id === hoveredActionId),
    [actions, hoveredActionId]
  );

  return (
    <>
      {/* WIDGET FLOTANTE OMNIPRESENTE (EN TODAS LAS PANTALLAS) */}
      <motion.div
        drag
        dragMomentum={false}
        dragConstraints={{ 
          left: -Math.max(0, viewportDims.width - 100), 
          right: 0, 
          top: -Math.max(0, viewportDims.height - 120), 
          bottom: 0 
        }}
        dragElastic={0.08}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setTimeout(() => setIsDragging(false), 150)}
        className={`fixed z-[60] flex flex-col items-end pointer-events-auto select-none transition-all duration-300 ${
          navigationMode === 'classic'
            ? 'bottom-20 sm:bottom-6 right-3 sm:right-6'
            : 'bottom-4 sm:bottom-6 right-3 sm:right-6'
        }`}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 260 }}
      >
        {/* EL ORÁCULO FLOTANTE KAI (DISPARADOR DEL MENÚ) */}
        <div className="relative flex flex-col items-center">
          {/* Insignia de estado rápido en Pomodoro */}
          {(isPomodoroOpen || isTimerRunning) && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-1 px-2.5 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-400 text-[10px] font-mono font-bold text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.3)] flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>FOCO: {formattedTime}</span>
            </motion.div>
          )}

          {/* Botón base del personaje flotante */}
          <div 
            className="group relative cursor-pointer active:scale-95 transition-transform"
            title="Toca a KAI para abrir sus glifos de navegación"
          >
            {/* CONTENEDOR DE ÍCONOS HOLOGRÁFICOS DESPLEGADOS EN ÓRBITA MULTICAPA ANCLADOS EXACTAMENTE AL CENTRO DE KAI */}
            <AnimatePresence>
              {isMenuOpen && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 z-50 pointer-events-none">
                  {/* SVG ÓRBITAS CONCÉNTRICAS Y FILAMENTOS LÁSER DE ENERGÍA */}
                  <motion.svg 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] h-[440px] pointer-events-none overflow-visible -z-10"
                    viewBox="-220 -220 440 440"
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.28, ease: [0.32, 0, 0.67, 0] } }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <defs>
                      <filter id="hologramGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>

                      <linearGradient id="innerRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.25" />
                        <stop offset="30%" stopColor="#00f0ff" stopOpacity="0.85" />
                        <stop offset="70%" stopColor="#00f0ff" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.25" />
                      </linearGradient>

                      <linearGradient id="outerRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.3" />
                        <stop offset="35%" stopColor="#f59e0b" stopOpacity="0.8" />
                        <stop offset="50%" stopColor="#facc15" stopOpacity="1" />
                        <stop offset="65%" stopColor="#c084fc" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.3" />
                      </linearGradient>
                    </defs>

                    {/* ARO INTERNO (R = 92px) - TRAZADO CINEMÁTICO SUAVE */}
                    <motion.path
                      d={`M ${INNER_RADIUS * Math.cos((145 * Math.PI) / 180)} ${-INNER_RADIUS * Math.sin((145 * Math.PI) / 180)} A ${INNER_RADIUS} ${INNER_RADIUS} 0 0 1 ${INNER_RADIUS * Math.cos((35 * Math.PI) / 180)} ${-INNER_RADIUS * Math.sin((35 * Math.PI) / 180)}`}
                      fill="none"
                      stroke="#00f0ff"
                      strokeWidth="5"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.28 }}
                      exit={{ pathLength: 0, opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      filter="url(#hologramGlow)"
                    />
                    <motion.path
                      d={`M ${INNER_RADIUS * Math.cos((145 * Math.PI) / 180)} ${-INNER_RADIUS * Math.sin((145 * Math.PI) / 180)} A ${INNER_RADIUS} ${INNER_RADIUS} 0 0 1 ${INNER_RADIUS * Math.cos((35 * Math.PI) / 180)} ${-INNER_RADIUS * Math.sin((35 * Math.PI) / 180)}`}
                      fill="none"
                      stroke="url(#innerRingGrad)"
                      strokeWidth="2"
                      strokeDasharray="6 3"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.95 }}
                      exit={{ pathLength: 0, opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    />

                    {/* Nodos de anclaje de los 4 glifos del aro interno */}
                    {INNER_ANGLES.map((ang, idx) => {
                      const rad = (ang * Math.PI) / 180;
                      const nodeColor = actions[idx]?.accentColor || '#00f0ff';
                      return (
                        <motion.circle
                          key={`inner-node-${ang}`}
                          cx={INNER_RADIUS * Math.cos(rad)}
                          cy={-INNER_RADIUS * Math.sin(rad)}
                          r="3"
                          fill={nodeColor}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 0.95 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.35, delay: 0.05 + idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                        />
                      );
                    })}

                    {/* ARO EXTERNO (R = 152px) - TRAZADO CINEMÁTICO SUAVE */}
                    <motion.path
                      d={`M ${OUTER_RADIUS * Math.cos((160 * Math.PI) / 180)} ${-OUTER_RADIUS * Math.sin((160 * Math.PI) / 180)} A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 0 1 ${OUTER_RADIUS * Math.cos((20 * Math.PI) / 180)} ${-OUTER_RADIUS * Math.sin((20 * Math.PI) / 180)}`}
                      fill="none"
                      stroke="#00f0ff"
                      strokeWidth="6"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.22 }}
                      exit={{ pathLength: 0, opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } }}
                      transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                      filter="url(#hologramGlow)"
                    />
                    <motion.path
                      d={`M ${OUTER_RADIUS * Math.cos((160 * Math.PI) / 180)} ${-OUTER_RADIUS * Math.sin((160 * Math.PI) / 180)} A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 0 1 ${OUTER_RADIUS * Math.cos((20 * Math.PI) / 180)} ${-OUTER_RADIUS * Math.sin((20 * Math.PI) / 180)}`}
                      fill="none"
                      stroke="url(#outerRingGrad)"
                      strokeWidth="2.2"
                      strokeDasharray="8 4"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.95 }}
                      exit={{ pathLength: 0, opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } }}
                      transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    />

                    {/* Nodos de anclaje de los 5 glifos del aro externo */}
                    {OUTER_ANGLES.map((ang, idx) => {
                      const rad = (ang * Math.PI) / 180;
                      const nodeColor = actions[idx + 4]?.accentColor || '#00f0ff';
                      return (
                        <motion.circle
                          key={`outer-node-${ang}`}
                          cx={OUTER_RADIUS * Math.cos(rad)}
                          cy={-OUTER_RADIUS * Math.sin(rad)}
                          r="3.5"
                          fill={nodeColor}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 0.95 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.35, delay: 0.16 + idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                        />
                      );
                    })}

                    {/* Filamentos láser desde el centro de KAI (0,0) hasta cada glifo */}
                    {actions.map((item, index) => {
                      const isInner = index < 4;
                      const angleDeg = isInner ? INNER_ANGLES[index] : OUTER_ANGLES[index - 4];
                      const radius = isInner ? INNER_RADIUS : OUTER_RADIUS;
                      const angleRad = (angleDeg * Math.PI) / 180;
                      const x = radius * Math.cos(angleRad);
                      const y = -radius * Math.sin(angleRad);
                      const isHovered = hoveredActionId === item.id;
                      const lineDelay = isInner ? 0.04 + index * 0.045 : 0.2 + (index - 4) * 0.045;

                      return (
                        <motion.line
                          key={`laser-${item.id}`}
                          x1="0"
                          y1="0"
                          x2={x}
                          y2={y}
                          stroke={item.accentColor}
                          strokeOpacity={isHovered ? 0.95 : 0.35}
                          strokeWidth={isHovered ? 2 : 1.2}
                          strokeDasharray={isHovered ? 'none' : isInner ? '3 3' : '4 4'}
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          exit={{ pathLength: 0, opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } }}
                          transition={{ duration: 0.4, delay: lineDelay, ease: [0.16, 1, 0.3, 1] }}
                        />
                      );
                    })}
                  </motion.svg>

                  {/* LOS 9 GLIFOS DISTRIBUIDOS EN 2 ANILLOS CONCÉNTRICOS PERFECTAMENTE SIMÉTRICOS */}
                  {actions.map((item, index) => {
                    const isHovered = hoveredActionId === item.id;

                    const isInner = index < 4;
                    const angleDeg = isInner ? INNER_ANGLES[index] : OUTER_ANGLES[index - 4];
                    const radius = isInner ? INNER_RADIUS : OUTER_RADIUS;
                    const angleRad = (angleDeg * Math.PI) / 180;
                    const x = radius * Math.cos(angleRad);
                    const y = -radius * Math.sin(angleRad);

                    // Cascada de apertura: primero aro interno (0.05s por ítem), luego aro externo
                    const enterDelay = isInner 
                      ? 0.06 + index * 0.05 
                      : 0.26 + (index - 4) * 0.05;

                    // Cascada de salida en reversa (de afuera hacia adentro para un repliegue orgánico)
                    const exitDelay = isInner
                      ? (3 - index) * 0.02
                      : 0.08 + (8 - index) * 0.02;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.2, x: x * 0.25, y: y * 0.25 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1, 
                          x, 
                          y,
                          transition: {
                            duration: 0.55,
                            ease: [0.16, 1, 0.3, 1], // Misma curva cinemática fluida de las páginas
                            delay: enterDelay,
                          }
                        }}
                        exit={{ 
                          opacity: 0, 
                          scale: 0.3, 
                          x: x * 0.4, 
                          y: y * 0.4,
                          transition: {
                            duration: 0.28,
                            ease: [0.32, 0, 0.67, 0], // Aceleración suave hacia el repliegue interno
                            delay: exitDelay,
                          }
                        }}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                        }}
                        className="pointer-events-none"
                      >
                        {/* CONTENEDOR ANCLADO EN EL CENTRO EXACTO DEL NODO (TRANSLATE -50% -50% INMUNE A FRAMER MOTION) */}
                        <div 
                          className="relative flex items-center justify-center pointer-events-auto group cursor-pointer"
                          style={{ transform: 'translate(-50%, -50%)' }}
                          onMouseEnter={() => {
                            soundFX.playClick();
                            setHoveredActionId(item.id);
                          }}
                          onMouseLeave={() => setHoveredActionId(null)}
                          onTouchStart={() => {
                            soundFX.playClick();
                            setHoveredActionId(item.id);
                          }}
                          onPointerEnter={() => {
                            setHoveredActionId(item.id);
                          }}
                          onPointerLeave={() => {
                            setHoveredActionId(null);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExecuteAction(item.action);
                          }}
                        >
                          {/* Aura difusa ambiental detrás del glifo */}
                          <div 
                            className={`absolute rounded-full blur-md transition-opacity pointer-events-none ${
                              isInner ? 'w-10 h-10' : 'w-13 h-13'
                            } ${isHovered ? 'opacity-90 scale-125' : 'opacity-25'}`}
                            style={{ backgroundColor: item.accentColor }}
                          />

                          {/* Contenedor romboidal/hex neón estilo KAI */}
                          <div 
                            className={`relative flex items-center justify-center transition-all duration-200 group-hover:scale-120 active:scale-90 ${
                              isInner 
                                ? 'w-9 h-9 rounded-xl' 
                                : 'w-10.5 h-10.5 rounded-2xl'
                            }`}
                            style={{
                              background: isHovered 
                                ? 'rgba(0, 25, 40, 0.98)' 
                                : isInner
                                  ? 'rgba(1, 16, 26, 0.94)'
                                  : 'rgba(2, 12, 22, 0.94)',
                              border: `${isInner ? '1.5px' : '2px'} solid ${item.accentColor}`,
                              boxShadow: isHovered 
                                ? `0 0 24px ${item.accentColor}, inset 0 0 12px ${item.glowColor}`
                                : `0 0 12px ${item.glowColor}`,
                            }}
                          >
                            {/* Indicador de destello especular orbital en la esquina superior derecha */}
                            <div 
                              className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white opacity-95"
                              style={{
                                boxShadow: `0 0 6px ${item.accentColor}, 0 0 10px #ffffff`,
                              }}
                            />

                            {/* Ícono central */}
                            <div className="relative z-10 transition-transform duration-200 group-hover:scale-110">
                              {item.icon}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>

            <HoloCompanion
              archetype={archetype}
              size={68}
              interactive={true}
              onClick={handleCompanionClick}
              auraState={auraState}
              triggerVictoryWave={hasRecentVictory}
              isProjecting={isMenuOpen}
              className="drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] pointer-events-auto"
            />
          </div>

          {/* ETIQUETA HOLOGRÁFICA UNIFICADA JUSTAMENTE ABAJO DEL COMPAÑERO KAI (SOLO NOMBRE) */}
          <AnimatePresence>
            {isMenuOpen && activeHoveredAction && (
              <motion.div
                key={activeHoveredAction.id}
                initial={{ opacity: 0, y: -3, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -2, scale: 0.95 }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
                className="absolute top-full -mt-0.5 left-1/2 -translate-x-1/2 pointer-events-none z-50 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full backdrop-blur-xl border whitespace-nowrap shadow-xl text-center"
                style={{
                  background: 'rgba(1, 14, 23, 0.96)',
                  borderColor: `${activeHoveredAction.accentColor}80`,
                  boxShadow: `0 0 12px ${activeHoveredAction.glowColor}`,
                }}
              >
                <span 
                  className="px-1.5 py-0.2 rounded text-[7.5px] font-mono font-bold tracking-wider uppercase"
                  style={{
                    backgroundColor: actions.findIndex(a => a.id === activeHoveredAction.id) < 4 ? 'rgba(0, 240, 255, 0.15)' : 'rgba(250, 204, 21, 0.15)',
                    color: actions.findIndex(a => a.id === activeHoveredAction.id) < 4 ? '#00f0ff' : '#facc15',
                    border: `1px solid ${actions.findIndex(a => a.id === activeHoveredAction.id) < 4 ? 'rgba(0, 240, 255, 0.4)' : 'rgba(250, 204, 21, 0.4)'}`,
                  }}
                >
                  {actions.findIndex(a => a.id === activeHoveredAction.id) < 4 ? 'ARO I' : 'ARO II'}
                </span>
                <span className="text-[11px] font-anton tracking-wider text-white">
                  {activeHoveredAction.title}
                </span>
                {activeHoveredAction.badge && (
                  <span 
                    className="px-1.5 py-0 rounded-full text-[8px] font-mono font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${activeHoveredAction.accentColor}25`,
                      color: activeHoveredAction.accentColor,
                      border: `1px solid ${activeHoveredAction.accentColor}50`,
                    }}
                  >
                    {activeHoveredAction.badge}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* BACKDROP CON DIFUMINADO SUAVE PARA DESTACAR EL HUD Y CERRAR AL HACER CLIC FUERA */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              setIsMenuOpen(false);
              setHoveredActionId(null);
            }}
            className="fixed inset-0 z-30 bg-black/55 backdrop-blur-[3px] pointer-events-auto cursor-pointer"
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default OmniCompanionHub;
