import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  Target,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  User,
  Clock,
  Plus,
  Minus
} from 'lucide-react';
import { safeLogEvent } from '../../firebase';
import { KAICompanion } from '../KAICompanion';
import { soundFX } from '../../utils/audio';
import { triggerShockwave } from '../../utils/celebration';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
import { useTaskStore } from '../../store/useTaskStore';
import { getTodayDateString, getGlobalDayStartHour, setGlobalDayStartHour } from '../../utils/date';
import { formatHourToHuman } from '../../utils/timeUtils';
import { PlayerStats, TaskItem, TaskCategory } from '../../types';

interface KaiWelcomeOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  initialStep?: number;
  cloudSync?: {
    forceSyncNow?: () => Promise<boolean>;
  };
}

const TOTAL_STEPS = 6;

// Los 12 Arquetipos Jungianos oficiales del sistema
const WELCOME_ARCHETYPES = [
  {
    id: 'inocente',
    name: 'Espíritu Puro',
    icon: '🕊️',
    accent: '#f59e0b',
    description: 'Paz mental, balance y cero agobio.',
    mantra: 'Haciendo las cosas bien, en paz y sin estrés.'
  },
  {
    id: 'huerfano',
    name: 'Espíritu Aliado',
    icon: '🤝',
    accent: '#3b82f6',
    description: 'Lealtad, esfuerzo honesto y apoyo mutuo.',
    mantra: 'Juntos somos más fuertes, paso a paso.'
  },
  {
    id: 'heroe',
    name: 'Espíritu Heroico',
    icon: '🛡️',
    accent: '#ef4444',
    description: 'Superación diaria y disciplina firme.',
    mantra: 'Levántate, enfócate y vence.'
  },
  {
    id: 'cuidador',
    name: 'Alma Protectora',
    icon: '💖',
    accent: '#10b981',
    description: 'Salud, bienestar y autocuidado.',
    mantra: 'Cuidar de mi energía para dar lo mejor de mí.'
  },
  {
    id: 'explorador',
    name: 'Espíritu Libre',
    icon: '🧭',
    accent: '#f97316',
    description: 'Curiosidad activa y nuevas metas.',
    mantra: 'Cada día es una nueva oportunidad para explorar.'
  },
  {
    id: 'rebelde',
    name: 'Fuerza Rebelde',
    icon: '⚡',
    accent: '#a855f7',
    description: 'Romper moldes y forjar tu propio camino.',
    mantra: 'Rompiendo límites con propósito y autenticidad.'
  },
  {
    id: 'amante',
    name: 'Corazón Apasionado',
    icon: '🌹',
    accent: '#ec4899',
    description: 'Pasión, entusiasmo y conexión profunda.',
    mantra: 'Viviendo con intensidad y corazón en cada acción.'
  },
  {
    id: 'creador',
    name: 'Mente Creadora',
    icon: '🎨',
    accent: '#d946ef',
    description: 'Ideas en acción, innovación y arte.',
    mantra: 'Creando valor en cada acción de mi día.'
  },
  {
    id: 'bufon',
    name: 'Espíritu Lúdico',
    icon: '🃏',
    accent: '#06b6d4',
    description: 'Alegría, ligereza y humor en el presente.',
    mantra: 'Avanzando con una sonrisa y disfrutando el viaje.'
  },
  {
    id: 'sabio',
    name: 'Mente Sabia',
    icon: '🦉',
    accent: '#6366f1',
    description: 'Claridad mental y enfoque sereno.',
    mantra: 'Paso a paso, con claridad y serenidad.'
  },
  {
    id: 'mago',
    name: 'Mente Alquimista',
    icon: '🔮',
    accent: '#8b5cf6',
    description: 'Transformar retos en oportunidades reales.',
    mantra: 'Transformando mi realidad día tras día.'
  },
  {
    id: 'gobernante',
    name: 'Voz de Liderazgo',
    icon: '👑',
    accent: '#eab308',
    description: 'Orden, visión de futuro y estabilidad.',
    mantra: 'Organizando mi día con calma, rumbo y control.'
  }
];

// Opciones de propósito inicial
const CORE_DESIRES = [
  {
    id: 'procrastination',
    icon: '🚀',
    title: 'Vencer la procrastinación',
    subtitle: 'Romper la inercia y arrancar sin estrés.'
  },
  {
    id: 'order',
    icon: '🎯',
    title: 'Claridad y orden diario',
    subtitle: 'Tener el control de mis tareas sin agobio.'
  },
  {
    id: 'habits',
    icon: '🌱',
    title: 'Crear hábitos duraderos',
    subtitle: 'Constancia real en ejercicio, lectura o estudio.'
  },
  {
    id: 'peace',
    icon: '🕊️',
    title: 'Paz mental y balance',
    subtitle: 'Avanzar en mis metas con calma y satisfacción.'
  }
];

// Atajos ultracompactos de inicio de jornada
const QUICK_HOUR_PRESETS = [
  { hour: 6, label: '06:00 AM', icon: '🌅' },
  { hour: 8, label: '08:00 AM', icon: '☕' },
  { hour: 10, label: '10:00 AM', icon: '☀️' },
  { hour: 15, label: '03:00 PM', icon: '🌤️' },
  { hour: 21, label: '09:00 PM', icon: '🌙' },
  { hour: 0, label: '12:00 AM', icon: '🦉' },
];

// Opciones de micro-tareas de prueba
const QUICK_SAMPLE_TASKS = [
  {
    title: 'Tomar 1 vaso de agua y respirar profundo 💧',
    category: 'salud' as TaskCategory,
    xpReward: 20,
    coinReward: 10
  },
  {
    title: 'Definir mi prioridad número 1 del día 🎯',
    category: 'trabajo' as TaskCategory,
    xpReward: 25,
    coinReward: 15
  },
  {
    title: 'Tomar 2 minutos de respiro consciente 🧘',
    category: 'rutina' as TaskCategory,
    xpReward: 20,
    coinReward: 10
  }
];

// Helper para ritmo circadiano dinámico
const getCircadianPhase = (hour: number) => {
  if (hour >= 5 && hour < 8) return { icon: '🌅', label: 'Madrugador', tip: 'Comienzo al alba para aprovechar la mañana' };
  if (hour >= 8 && hour < 12) return { icon: '☕', label: 'Mañana habitual', tip: 'Horario estándar diurno de trabajo y estudio' };
  if (hour >= 12 && hour < 15) return { icon: '☀️', label: 'Mediodía', tip: 'Arranque a mitad del día' };
  if (hour >= 15 && hour < 19) return { icon: '🌤️', label: 'Tarde', tip: 'Turno vespertino' };
  if (hour >= 19 && hour < 23) return { icon: '🌙', label: 'Noche', tip: 'Turno nocturno o velada productiva' };
  return { icon: '🦉', label: 'Madrugada / Búho', tip: 'Turno de guardia o ritmo noctámbulo' };
};

export const KaiWelcomeOnboarding: React.FC<KaiWelcomeOnboardingProps> = ({
  isOpen,
  onClose,
  stats,
  initialStep = 1,
  cloudSync
}) => {
  const { setActiveTab } = useUIStore();
  const { completeAwakening, claimTutorialReward, markTutorialGuideSeen } = usePlayerStore();
  const { addTask } = useTaskStore();

  const [step, setStep] = useState<number>(initialStep);

  // Estados de personalización
  const [username, setUsername] = useState(
    stats.username && stats.username !== 'CazadorDelSistema' && stats.username !== 'UsuarioDelSistema' && stats.username.toLowerCase() !== 'cazador' ? stats.username : ''
  );
  const [selectedDesire, setSelectedDesire] = useState<string>('procrastination');
  const [selectedArchId, setSelectedArchId] = useState<string>(() => {
    const currentClass = stats.characterClass?.toLowerCase() || '';
    const match = WELCOME_ARCHETYPES.find(a => currentClass.includes(a.id) || a.name.toLowerCase() === currentClass);
    return match ? match.id : 'sabio';
  });
  const [dayStartHour, setDayStartHour] = useState<number>(() => {
    return stats.dayStartHour !== undefined ? stats.dayStartHour : getGlobalDayStartHour();
  });

  // Estado para la micro-misión interactiva (Paso 5)
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  const [customTaskTitle, setCustomTaskTitle] = useState('');
  const [isTaskCompletedInModal, setIsTaskCompletedInModal] = useState(false);

  const todayStr = useMemo(() => getTodayDateString(), []);

  // Reiniciar paso al abrir
  useEffect(() => {
    if (isOpen) {
      setStep(initialStep || 1);
    }
  }, [isOpen, initialStep]);

  if (!isOpen) return null;

  const currentArchetype = WELCOME_ARCHETYPES.find(a => a.id === selectedArchId) || WELCOME_ARCHETYPES[0];
  const currentDesire = CORE_DESIRES.find(d => d.id === selectedDesire) || CORE_DESIRES[0];
  const circadian = getCircadianPhase(dayStartHour);

  // Manejo de cambio de hora (sincroniza store inmediatamente)
  const handleHourChange = (newHour: number) => {
    const normalized = ((newHour % 24) + 24) % 24;
    soundFX.playClick();
    setDayStartHour(normalized);
    setGlobalDayStartHour(normalized);
    usePlayerStore.getState().setStats((prev) => ({
      ...prev,
      dayStartHour: normalized,
    }));
  };

  // Crear una micro-misión en el store
  const handleCreateSampleTask = (taskConfig: { title: string; category: TaskCategory; xpReward: number; coinReward: number }) => {
    soundFX.playClick();
    const newId = `welcome-task-${Date.now()}`;
    const newTask: TaskItem = {
      id: newId,
      title: taskConfig.title,
      category: taskConfig.category,
      xpReward: taskConfig.xpReward,
      coinReward: taskConfig.coinReward,
      completed: false,
      isCustom: true
    };

    addTask(todayStr, newTask);
    setCreatedTaskId(newId);
    setIsTaskCompletedInModal(false);
  };

  // Completar la micro-misión en vivo
  const handleCompleteSampleTask = () => {
    if (isTaskCompletedInModal) return;

    soundFX.playFanfare();
    try {
      triggerShockwave({ color: 'cyan', intensity: 'epic' });
    } catch (_) {}

    setIsTaskCompletedInModal(true);
    safeLogEvent('task_completed_first');

    if (createdTaskId) {
      useTaskStore.getState().updateTask(todayStr, createdTaskId, {
        completed: true,
        completedAt: new Date().toISOString()
      });
    }

    useUIStore.getState().addFloatingEffect({
      x: typeof window !== 'undefined' ? window.innerWidth / 2 : 200,
      y: typeof window !== 'undefined' ? window.innerHeight / 2 - 60 : 200,
      text: '+25 Monedas & +50 XP 🎖️',
      type: 'coins'
    });
  };

  // Finalizar onboarding y guardar estado
  const handleFinishOnboarding = () => {
    soundFX.playFanfare();

    try {
      triggerShockwave({ color: 'violet', intensity: 'epic' });
    } catch (_) {}

    const chosenName = username.trim() || 'Compañero';

    // 1. Guardar despertar y hora de inicio de jornada
    setGlobalDayStartHour(dayStartHour);
    completeAwakening({
      username: chosenName,
      fullName: stats.fullName || chosenName,
      characterClass: currentArchetype.name,
      mantra: currentArchetype.mantra,
      kaiShape: 'prism'
    });

    usePlayerStore.getState().setStats((prev) => ({
      ...prev,
      dayStartHour,
    }));

    // 2. Recompensar
    claimTutorialReward();
    markTutorialGuideSeen('introWalkthrough');
    markTutorialGuideSeen('welcomeOnboarding');
    safeLogEvent('onboarding_completed');

    // 3. Sincronizar nube si disponible
    if (cloudSync?.forceSyncNow) {
      cloudSync.forceSyncNow();
    }

    setActiveTab('dashboard');
    onClose();
  };

  const handleNextStep = () => {
    soundFX.playClick();
    // Guardar calibración circadiana al avanzar desde paso 2
    if (step === 2) {
      setGlobalDayStartHour(dayStartHour);
      usePlayerStore.getState().setStats((prev) => ({
        ...prev,
        dayStartHour,
      }));
    }
    setStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div
        className="w-full max-w-xl max-h-[92dvh] flex flex-col rounded-3xl bg-[#030712]/95 border border-cyan-500/35 shadow-[0_0_60px_rgba(0,240,255,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] relative overflow-hidden backdrop-blur-2xl text-white text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Luz de ambiente suave */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

        {/* ── CABECERA CON INDICADOR DE PASOS (1 PREGUNTA POR VENTANA) ── */}
        <div className="p-3.5 sm:p-4 border-b border-white/10 bg-[#010810]/80 shrink-0 relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(0,240,255,0.4)] shrink-0">
              <Sparkles className="w-4 h-4 text-cyan-300" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-cyan-400 truncate">
                Paso {step} de {TOTAL_STEPS}
              </div>
              <h2 className="text-xs sm:text-sm font-anton tracking-wide text-white truncate">
                {step === 1 && '¿Cómo te llamas?'}
                {step === 2 && 'Tu Ritmo Diario (24h)'}
                {step === 3 && 'Tu Enfoque Principal'}
                {step === 4 && 'Tu Arquetipo de Energía'}
                {step === 5 && 'Tu Primera Victoria en Vivo'}
                {step === 6 && '¡Todo Listo para Empezar!'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleFinishOnboarding}
              className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/40 hover:to-blue-500/40 text-cyan-300 hover:text-white border border-cyan-400/40 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              title="Saltar tutorial e ir directo a tus tareas"
            >
              <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>Saltar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onClose();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── BARRA DE PROGRESO ── */}
        <div className="w-full bg-white/5 h-1 relative overflow-hidden shrink-0">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 shadow-[0_0_10px_rgba(0,240,255,0.8)]"
            initial={false}
            animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.25 }}
          />
        </div>

        {/* ── CONTENIDO: 1 PREGUNTA POR PANTALLA (CERO SCROLL TRAP) ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar relative z-10 flex flex-col justify-start sm:justify-center my-auto">
          <AnimatePresence mode="wait">

            {/* ============================================================== */}
            {/* PASO 1: NOMBRE / IDENTIDAD                                     */}
            {/* ============================================================== */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Diálogo breve con KAI */}
                <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/25 backdrop-blur-sm">
                  <div className="shrink-0 w-12 h-12 flex items-center justify-center">
                    <KAICompanion shapeId="prism" size={48} interactive={false} auraState="normal" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 block">
                      KAI te da la bienvenida:
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      ¡Hola! Soy <strong>KAI</strong>, tu compañero de enfoque. Estoy aquí para acompañarte paso a paso, vencer la inercia y celebrar cada victoria.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>¿Cómo te gustaría que te llame?</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleNextStep();
                      }
                    }}
                    placeholder="Ej. Alex, Sofía, Campeón..."
                    maxLength={24}
                    autoFocus
                    enterKeyHint="next"
                    autoComplete="nickname"
                    className="w-full px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all shadow-inner"
                  />
                  <p className="text-[10px] text-slate-400">
                    Puedes cambiar tu nombre en cualquier momento desde Ajustes.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* PASO 2: RITMO CIRCADIANO (EL USUARIO DECIDE PRIMERO)           */}
            {/* ============================================================== */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>¿A qué hora inicia tu jornada diaria?</span>
                  </h3>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Tus hábitos y tareas se reiniciarán a esta hora para adaptarse a tu ritmo biológico y no cortarse a medianoche.
                  </p>
                </div>

                {/* 1. EL USUARIO DECIDE PRIMERO: Control interactivo principal */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-cyan-950/40 via-slate-900/50 to-black/60 border border-cyan-500/35 shadow-[0_0_20px_rgba(0,240,255,0.12)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-semibold">
                      Tu hora de inicio
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono font-bold flex items-center gap-1">
                      <span>{circadian.icon}</span>
                      <span>{circadian.label}</span>
                    </span>
                  </div>

                  {/* Visualizador de hora con botones - / + */}
                  <div className="flex items-center justify-center gap-4 py-0.5">
                    <button
                      type="button"
                      onClick={() => handleHourChange(dayStartHour - 1)}
                      className="w-10 h-10 rounded-xl bg-white/[0.06] hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/50 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
                      title="Restar 1 hora"
                    >
                      <Minus className="w-4 h-4 text-cyan-300" />
                    </button>

                    <div className="text-center min-w-[130px]">
                      <div className="text-3xl sm:text-4xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-sky-300 tracking-tight drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                        {formatHourToHuman(dayStartHour)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {circadian.tip}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleHourChange(dayStartHour + 1)}
                      className="w-10 h-10 rounded-xl bg-white/[0.06] hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/50 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
                      title="Sumar 1 hora"
                    >
                      <Plus className="w-4 h-4 text-cyan-300" />
                    </button>
                  </div>

                  {/* Slider continuo 0..23 */}
                  <div className="space-y-1 px-1">
                    <input
                      type="range"
                      min="0"
                      max="23"
                      step="1"
                      value={dayStartHour}
                      onChange={(e) => handleHourChange(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                      title="Desliza para elegir tu hora exacta"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-slate-500">
                      <span>00:00</span>
                      <span>06:00</span>
                      <span>12:00</span>
                      <span>18:00</span>
                      <span>23:00</span>
                    </div>
                  </div>
                </div>

                {/* 2. ATAJOS RÁPIDOS EN UN CUADRITO PEQUEÑO ABAJO */}
                <div className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>O toca un atajo rápido:</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {QUICK_HOUR_PRESETS.map((preset) => {
                      const isSelected = dayStartHour === preset.hour;
                      return (
                        <button
                          key={preset.hour}
                          type="button"
                          onClick={() => handleHourChange(preset.hour)}
                          className={`py-1.5 px-1.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                            isSelected
                              ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                              : 'bg-white/[0.03] border-white/10 hover:border-white/25 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className="text-xs">{preset.icon}</span>
                          <span className="text-[10px] font-mono font-bold leading-tight truncate w-full">{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* PASO 3: PROPÓSITO PRINCIPAL                                    */}
            {/* ============================================================== */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-amber-400" />
                    <span>¿Qué es lo más importante para ti hoy?</span>
                  </h3>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    KAI adaptará sus consejos y recordatorios según tu objetivo principal.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CORE_DESIRES.map((desire) => {
                    const isSelected = selectedDesire === desire.id;
                    return (
                      <button
                        key={desire.id}
                        type="button"
                        onClick={() => {
                          soundFX.playClick();
                          setSelectedDesire(desire.id);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)] ring-1 ring-cyan-400'
                            : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <span className="text-2xl shrink-0">{desire.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className={`text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                            {desire.title}
                          </div>
                          <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                            {desire.subtitle}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* PASO 4: ARQUETIPO DE ENERGÍA                                   */}
            {/* ============================================================== */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>¿Qué energía resuena más contigo?</span>
                  </h3>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Elige el estilo que guiará tu personaje y tu mantra diario:
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {WELCOME_ARCHETYPES.map((arch) => {
                    const isSelected = selectedArchId === arch.id;
                    return (
                      <button
                        key={arch.id}
                        type="button"
                        onClick={() => {
                          soundFX.playItemEquip();
                          setSelectedArchId(arch.id);
                        }}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                          isSelected
                            ? 'bg-white/10 shadow-[0_0_12px_rgba(255,255,255,0.2)] ring-1 ring-white/50'
                            : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                        }`}
                        style={{
                          borderColor: isSelected ? arch.accent : undefined
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base">{arch.icon}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                        </div>
                        <span className="text-xs font-bold text-white leading-tight truncate">
                          {arch.name}
                        </span>
                        <span className="text-[10px] text-slate-400 leading-tight line-clamp-1">
                          {arch.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* PASO 5: PRIMERA VICTORIA EN VIVO                               */}
            {/* ============================================================== */}
            {step === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Tu primera victoria en 1 toque</span>
                  </h3>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Toca una acción para experimentar cómo ganas XP y monedas al instante:
                  </p>
                </div>

                {!createdTaskId ? (
                  <div className="space-y-2.5">
                    <div className="space-y-1.5">
                      {QUICK_SAMPLE_TASKS.map((sample, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleCreateSampleTask(sample)}
                          className="w-full p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-400/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                        >
                          <span className="text-xs text-slate-200 group-hover:text-cyan-300 font-medium truncate">
                            {sample.title}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 shrink-0 ml-2">
                            +{sample.coinReward} 🪙
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Crear personalizada */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={customTaskTitle}
                        onChange={(e) => setCustomTaskTitle(e.target.value)}
                        placeholder="O escribe algo que quieras hacer hoy..."
                        className="flex-1 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                      <button
                        type="button"
                        disabled={!customTaskTitle.trim()}
                        onClick={() => {
                          if (customTaskTitle.trim()) {
                            handleCreateSampleTask({
                              title: customTaskTitle.trim(),
                              category: 'general' as TaskCategory,
                              xpReward: 25,
                              coinReward: 15
                            });
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-black font-anton text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 font-bold"
                      >
                        Crear
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div
                      onClick={handleCompleteSampleTask}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isTaskCompletedInModal
                          ? 'bg-emerald-950/30 border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                          : 'bg-white/[0.05] border-cyan-400/60 hover:border-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.2)] animate-pulse'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                            isTaskCompletedInModal
                              ? 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_10px_rgba(16,185,129,0.8)]'
                              : 'border-cyan-400 hover:border-cyan-300 bg-cyan-950/40'
                          }`}
                        >
                          {isTaskCompletedInModal && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold truncate ${isTaskCompletedInModal ? 'line-through text-slate-400' : 'text-white'}`}>
                            {customTaskTitle.trim() || 'Tomar 1 vaso de agua y respirar profundo 💧'}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {isTaskCompletedInModal ? '✅ ¡Completada con éxito!' : '👆 Toca aquí para completar'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-full">
                          +15 🪙
                        </span>
                        <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                          +25 XP
                        </span>
                      </div>
                    </div>

                    {isTaskCompletedInModal && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-300 text-xs"
                      >
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                        <div>
                          <strong className="block text-emerald-200">¡Así de fácil funciona!</strong>
                          Cada tarea completada te otorga XP para subir de nivel y monedas para darte recompensas en la Tienda.
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* PASO 6: ¡TODO LISTO PARA ARRANCAR!                              */}
            {/* ============================================================== */}
            {step === 6 && (
              <motion.div
                key="step-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 text-center py-1"
              >
                <div className="w-16 h-16 mx-auto flex items-center justify-center">
                  <KAICompanion shapeId="prism" size={64} interactive={false} auraState="victory" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-anton tracking-wide text-white">
                    ¡Todo listo para empezar, {username.trim() || 'Compañero'}!
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                    Tu sistema está calibrado según tu propio ritmo. KAI estará siempre disponible en el orbe flotante en la esquina inferior ↘️.
                  </p>
                </div>

                {/* Resumen compacto de configuración */}
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 grid grid-cols-3 gap-2 text-left">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono uppercase text-slate-400 block">Jornada 24h</span>
                    <span className="text-xs font-mono font-bold text-cyan-300 truncate block">
                      {formatHourToHuman(dayStartHour)}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono uppercase text-slate-400 block">Arquetipo</span>
                    <span className="text-xs font-bold text-white truncate block">
                      {currentArchetype.icon} {currentArchetype.name}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono uppercase text-slate-400 block">Enfoque</span>
                    <span className="text-xs font-bold text-amber-300 truncate block">
                      {currentDesire.icon} {currentDesire.title}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── BOTONES DE NAVEGACIÓN INFERIORES ── */}
        <div className="p-3.5 sm:p-4 pb-safe border-t border-white/10 bg-[#010810]/90 shrink-0 relative z-10 flex items-center justify-between gap-2">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setStep((prev) => Math.max(1, prev - 1));
                }}
                className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white font-anton text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-cyan-300 text-xs font-mono transition-colors cursor-pointer flex items-center gap-1"
              >
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>Saltar todo</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-anton text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center gap-1.5 active:scale-95 font-bold"
              >
                <span>Siguiente</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-black font-anton text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.5)] flex items-center gap-2 active:scale-95 font-bold"
              >
                <Sparkles className="w-4 h-4" />
                <span>¡Comenzar mi día con KAI!</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
