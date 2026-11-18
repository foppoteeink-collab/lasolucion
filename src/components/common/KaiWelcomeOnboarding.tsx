import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  Minus,
  Bell,
  BookOpen,
  Calendar,
  ShieldCheck
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
import { useNarrativeCopy } from '../../hooks/useNarrativeCopy';
import { AUTH_SECURITY_MICROCOPY, WELCOME_UVP, NARRATIVE_MODE_OPTIONS } from '../../data/narrativeCopy';
import { notificationService } from '../../utils/notifications';

interface KaiWelcomeOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  initialStep?: number;
  cloudSync?: {
    forceSyncNow?: () => Promise<boolean>;
  };
}

const TOTAL_STEPS = 4;

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
    category: 'habito' as TaskCategory,
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
  const copy = useNarrativeCopy();

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

  // Estado para la micro-misión interactiva (Paso 3)
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  const [customTaskTitle, setCustomTaskTitle] = useState('');
  const [isTaskCompletedInModal, setIsTaskCompletedInModal] = useState(false);

  // Estado y solicitud de Notificaciones (Paso 2)
  const [notifsStatus, setNotifsStatus] = useState<NotificationPermission>(() => {
    return notificationService.getPermission();
  });

  const handleEnableNotifs = async () => {
    soundFX.playClick();
    const granted = await notificationService.requestPermission();
    setNotifsStatus(notificationService.getPermission());
    if (granted) {
      soundFX.playLevelUp();
      try {
        triggerShockwave({ color: 'cyan', intensity: 'subtle' });
      } catch (_) {}
    }
  };

  const todayStr = useMemo(() => getTodayDateString(), []);

  // Reiniciar paso al abrir, escuchar Escape y ocultar flotantes
  useEffect(() => {
    if (!isOpen) return;
    setStep(initialStep || 1);
    document.body.classList.add('modal-open-hide-floating');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        soundFX.playClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('modal-open-hide-floating');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, initialStep, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

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

  return createPortal(
    <div
      className="fixed inset-0 z-[170] portal-modal-root bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in font-sans"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kai-welcome-title"
        className="relative isolate w-full max-w-xl max-h-[92dvh] flex flex-col rounded-2xl sm:rounded-3xl bg-[#030712]/[0.98] border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.75)] overflow-hidden text-white text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Micrograno táctil */}
        <span className="vi-grano opacity-5" aria-hidden="true" />

        {/* Filamento especular superior */}
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

        {/* ── CABECERA CON INDICADOR DE PASOS (1 PREGUNTA POR VENTANA) ── */}
        <div className="p-3.5 sm:p-4 border-b border-white/10 bg-[#040814]/[0.96] shrink-0 relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl aura-bg-soft border aura-border-subtle flex items-center justify-center aura-glow-subtle shrink-0">
              <Sparkles className="w-4 h-4 aura-text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono tabular-nums font-bold tracking-wider uppercase aura-text-primary truncate">
                Paso {step} de {TOTAL_STEPS}
              </div>
              <h2 id="kai-welcome-title" className="text-xs sm:text-sm font-anton uppercase tracking-wider text-white truncate">
                {step === 1 && '¿Cómo te llamas y a qué hora arrancas?'}
                {step === 2 && 'Recordatorios y Notificaciones'}
                {step === 3 && 'Tu Primera Tarea en Vivo'}
                {step === 4 && 'Tu Rutina de la Primera Semana'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleFinishOnboarding}
              className="chicle-btn flex items-center gap-1 px-2.5 py-1.5 aura-bg-soft hover:text-white border aura-border-subtle rounded-xl text-[11px] font-bold cursor-pointer"
              title="Saltar tutorial e ir directo a tus tareas"
            >
              <Zap className="w-3 h-3 aura-text-primary animate-pulse" />
              <span>Saltar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onClose();
              }}
              aria-label="Cerrar bienvenida KAI"
              className="chicle-btn w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              title="Cerrar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── BARRA DE PROGRESO ── */}
        <div className="w-full bg-white/5 h-1 relative overflow-hidden shrink-0">
          <motion.div
            className="h-full aura-btn-gradient"
            initial={false}
            animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.25 }}
          />
        </div>

        {/* ── CONTENIDO: 1 PREGUNTA POR PANTALLA (CERO SCROLL TRAP) ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar relative z-10 flex flex-col justify-start sm:justify-center my-auto">
          <AnimatePresence mode="wait">

            {/* ============================================================== */}
            {/* PASO 1: NOMBRE / IDENTIDAD + PROPUESTA ÚNICA DE VALOR (UVP)    */}
            {/* ============================================================== */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5"
              >
                {/* Propuesta Única de Valor (UVP) explícita + Mitigación de objeciones */}
                <div className="p-3.5 rounded-2xl bg-[#040814]/80 border aura-border-subtle space-y-2">
                  <span className="text-[9.5px] font-mono font-bold uppercase tracking-widest aura-text-soft block">
                    {WELCOME_UVP.badge}
                  </span>
                  <h3 className="text-sm sm:text-base font-anton uppercase tracking-wider text-white leading-snug">
                    {WELCOME_UVP.headline}
                  </h3>
                  <p className="text-[11px] text-slate-200 leading-relaxed">
                    {WELCOME_UVP.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {WELCOME_UVP.frictionPills.map((pill) => (
                      <span
                        key={pill}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-[9.5px] font-bold"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                        <span>{pill}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Diálogo breve con KAI */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="shrink-0 w-10 h-10 flex items-center justify-center" data-preserve-optic="true">
                    <KAICompanion shapeId="prism" size={40} interactive={false} auraState="normal" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider aura-text-soft block">
                      KAI · Asistente de Enfoque
                    </span>
                    <p className="text-[11px] text-slate-200 leading-snug">
                      Configura tu ritmo en 30 segundos y elige el estilo de lenguaje que prefieras.
                    </p>
                  </div>
                </div>

                {/* Selector rápido de Densidad Narrativa desde el primer ingreso */}
                <div className="grid grid-cols-2 gap-2">
                  {(['minimal', 'tactical'] as const).map((modeKey) => {
                    const opt = NARRATIVE_MODE_OPTIONS[modeKey];
                    const active = copy.narrativeMode === modeKey;
                    return (
                      <button
                        key={modeKey}
                        type="button"
                        onClick={() => {
                          soundFX.playClick();
                          copy.setNarrativeMode(modeKey);
                        }}
                        className={`chicle-btn !flex-col !items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'aura-bg-soft aura-border-primary aura-glow-subtle optic-active-card'
                            : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/25'
                        }`}
                      >
                        <span className="text-[10.5px] font-bold block leading-tight text-white">
                          {opt.label}
                        </span>
                        <span className="text-[9.5px] text-slate-400 block mt-0.5 leading-snug">
                          {modeKey === 'minimal' ? 'Claro y directo, cero jerga' : 'Misiones, rangos y lore RPG'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 aura-text-primary" />
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
                    className="w-full px-4 py-2.5 rounded-2xl bg-black/50 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:aura-border-primary transition-all shadow-inner"
                  />
                </div>

                {/* Selector rápido de inicio de jornada habitual */}
                <div className="p-3.5 rounded-2xl bg-[#040814]/80 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 aura-text-primary" />
                      ¿A qué hora arrancas tu jornada habitualmente?
                    </span>
                    <span className="font-mono tabular-nums aura-text-soft font-bold aura-bg-soft px-2 py-0.5 rounded-lg border aura-border-subtle text-[11px] shrink-0">
                      {formatHourToHuman(dayStartHour)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Tus misiones y ciclo de turno se sincronizarán a esta hora para adaptarse a tu ritmo de trabajo o estudio.
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-0.5">
                    {QUICK_HOUR_PRESETS.map((preset) => (
                      <button
                        key={preset.hour}
                        type="button"
                        onClick={() => handleHourChange(preset.hour)}
                        className={`chicle-btn !flex-col py-2 px-1 rounded-xl border text-center transition-all cursor-pointer gap-0.5 ${
                          dayStartHour === preset.hour
                            ? 'aura-bg-primary aura-border-primary optic-active-card'
                            : 'bg-white/[0.03] border-white/10 hover:border-white/25 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs">{preset.icon}</span>
                        <span className="text-[10px] font-mono tabular-nums font-bold leading-tight truncate w-full">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* PASO 2: RECORDATORIOS Y NOTIFICACIONES INTELIGENTES             */}
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
                  <h3 className="text-sm font-anton uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-amber-400 animate-bounce" />
                    <span>Avisos Clave: Que nunca se te olvide nada</span>
                  </h3>
                  <p className="text-[11.5px] text-slate-300 leading-snug">
                    Para acompañarte durante la semana, La Solución te envía recordatorios discretos en los 3 momentos esenciales:
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-[#040814]/80 border border-white/10 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg aura-bg-soft border aura-border-subtle flex items-center justify-center shrink-0 mt-0.5 text-sm">
                      🌅
                    </div>
                    <div>
                      <strong className="text-white text-xs block">1. Inicio de Jornada</strong>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Aviso a tu hora de arranque (<span className="font-mono tabular-nums">{formatHourToHuman(dayStartHour)}</span>) para pulsar "Iniciar Jornada" y activar tus tareas del día.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#040814]/80 border border-white/10 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg aura-bg-soft border aura-border-subtle flex items-center justify-center shrink-0 mt-0.5 text-sm">
                      ⚡
                    </div>
                    <div>
                      <strong className="text-white text-xs block">2. Recordatorios de Tareas</strong>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Avisos si tienes tareas pendientes para que no se te pase darles check / X y registrar tus avances.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#040814]/80 border border-white/10 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg aura-bg-soft border aura-border-subtle flex items-center justify-center shrink-0 mt-0.5 text-sm">
                      📓
                    </div>
                    <div>
                      <strong className="text-white text-xs block">3. Cierre de Jornada y Bitácora</strong>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Al terminar tu turno, una alerta para cerrar el día, llenar tu bitácora de reflexión y proteger tu racha.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botón de solicitud de permisos con estado visual */}
                <div className="p-3.5 rounded-2xl bg-[#040814]/80 border aura-border-subtle text-center space-y-2">
                  {notifsStatus === 'granted' ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-300 text-xs font-bold py-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>¡Recordatorios activados correctamente en este equipo!</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-[11px] text-slate-200">
                        Pulsa el botón para autorizar los avisos en tu navegador:
                      </p>
                      <button
                        type="button"
                        onClick={handleEnableNotifs}
                        className="chicle-btn optic-active-card w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-anton uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.35)] cursor-pointer"
                      >
                        <Bell className="w-4 h-4 text-slate-950" />
                        <span>Activar Recordatorios en mi Dispositivo</span>
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* PASO 3: PRIMERA VICTORIA EN VIVO                               */}
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
                  <h3 className="text-sm font-anton uppercase tracking-wider text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Tu primera tarea en 1 toque</span>
                  </h3>
                  <p className="text-[11.5px] text-slate-300 leading-snug">
                    En La Solución, cada objetivo es una tarea. Al completarla, tocas el botón de la casilla para marcarla (darle check/X), ganando puntos al instante:
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
                          className="chicle-btn !justify-between w-full p-2.5 rounded-xl bg-[#040814]/80 hover:bg-white/[0.06] border border-white/10 hover:aura-border-subtle text-left cursor-pointer group"
                        >
                          <span className="text-xs text-slate-200 group-hover:text-white font-medium truncate">
                            {sample.title}
                          </span>
                          <span className="text-[10px] font-mono tabular-nums font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 shrink-0 ml-2">
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
                        className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:aura-border-primary"
                      />
                      <button
                        type="button"
                        disabled={!customTaskTitle.trim()}
                        onClick={() => {
                          if (customTaskTitle.trim()) {
                            handleCreateSampleTask({
                              title: customTaskTitle.trim(),
                              category: 'trabajo' as TaskCategory,
                              xpReward: 25,
                              coinReward: 15
                            });
                          }
                        }}
                        className="chicle-btn aura-btn-gradient optic-active-card px-3.5 py-2 rounded-xl disabled:opacity-40 font-anton text-xs uppercase tracking-wider cursor-pointer shrink-0"
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
                          ? 'bg-emerald-950/30 border-emerald-400/60'
                          : 'bg-[#040814]/80 aura-border-primary aura-glow-subtle animate-pulse'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                            isTaskCompletedInModal
                              ? 'bg-emerald-500 border-emerald-400 text-black'
                              : 'aura-border-primary aura-bg-soft'
                          }`}
                        >
                          {isTaskCompletedInModal ? <Check className="w-4 h-4 stroke-[3]" /> : <span className="aura-text-primary text-xs font-bold">✓</span>}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold truncate ${isTaskCompletedInModal ? 'line-through text-slate-400' : 'text-white'}`}>
                            {customTaskTitle.trim() || 'Tomar 1 vaso de agua y respirar profundo 💧'}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {isTaskCompletedInModal ? '✅ ¡Completada con éxito!' : '👆 Toca aquí para marcar la casilla (darle check/X)'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-mono tabular-nums font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-full">
                          +15 🪙
                        </span>
                        <span className="text-[10px] font-mono tabular-nums font-bold aura-text-soft aura-bg-soft border aura-border-subtle px-2 py-0.5 rounded-full">
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
                          <strong className="block text-emerald-200">¡Así de simple funciona!</strong>
                          Cada tarea completada te otorga XP para avanzar y monedas para tu registro de progreso.
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* PASO 4: ¡TODO LISTO PARA TU PRIMERA SEMANA!                    */}
            {/* ============================================================== */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5 text-center py-1"
              >
                <div className="w-14 h-14 mx-auto flex items-center justify-center" data-preserve-optic="true">
                  <KAICompanion shapeId="prism" size={56} interactive={false} auraState="victory" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-anton uppercase tracking-wider text-white">
                    ¡Todo listo para tu Primera Semana, {username.trim() || 'Compañero'}!
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                    Tu rutina diaria se resume en solo 3 sencillos pasos:
                  </p>
                </div>

                {/* Los 3 pasos diarios de la primera semana */}
                <div className="p-3.5 rounded-2xl bg-[#040814]/80 border border-white/10 space-y-2 text-left">
                  <div className="flex items-center gap-2.5 text-xs text-slate-200">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-bold font-mono tabular-nums text-[11px] shrink-0">1</span>
                    <span><strong>En la mañana:</strong> Toca el botón <em>"Iniciar Jornada"</em> en KAI.</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-200">
                    <span className="w-6 h-6 rounded-lg aura-bg-soft border aura-border-subtle aura-text-soft flex items-center justify-center font-bold font-mono tabular-nums text-[11px] shrink-0">2</span>
                    <span><strong>Durante el día:</strong> Revisa tus tareas y dales check al terminarlas.</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-200">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center font-bold font-mono tabular-nums text-[11px] shrink-0">3</span>
                    <span><strong>En la noche:</strong> Toca <em>"Cerrar Jornada"</em> y llena tu bitácora diaria.</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  KAI estará siempre flotando en tu pantalla como tu asistente oráculo. ¡Tócalo cuando quieras!
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── BOTONES DE NAVEGACIÓN INFERIORES ── */}
        <div className="p-3.5 sm:p-4 pb-safe border-t border-white/10 bg-[#040814]/[0.96] shrink-0 relative z-10 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setStep((prev) => Math.max(1, prev - 1));
                  }}
                  className="chicle-btn px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white font-anton text-xs uppercase tracking-wider cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishOnboarding}
                  className="chicle-btn px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white text-xs font-mono cursor-pointer flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 aura-text-primary" />
                  <span>Saltar e ir directo</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {step < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="chicle-btn aura-btn-gradient optic-active-card px-5 py-2 rounded-xl font-anton text-xs uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
                >
                  <span>Siguiente</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishOnboarding}
                  className="chicle-btn aura-btn-gradient optic-active-card px-5 py-2.5 rounded-xl font-anton text-xs uppercase tracking-wider cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{copy.onboardingWelcomeCta}</span>
                </button>
              )}
            </div>
          </div>

          <p className="text-[10px] font-mono text-emerald-300/85 text-center leading-snug">
            {AUTH_SECURITY_MICROCOPY}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};
