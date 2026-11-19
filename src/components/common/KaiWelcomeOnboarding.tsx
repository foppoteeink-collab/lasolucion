import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  User,
  Clock,
  Plus,
  Minus,
  Bell,
  Shield,
  ShieldCheck,
  Mail,
  Lock,
  LogIn,
  KeyRound,
  AlertCircle,
  Eye,
  EyeOff,
  HelpCircle
} from 'lucide-react';
import { safeLogEvent } from '../../firebase';
import { KAICompanion } from '../KAICompanion';
import { soundFX } from '../../utils/audio';
import { triggerShockwave } from '../../utils/celebration';
import { triggerHaptic } from '../../utils/haptics';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useAuth } from '../../context/AuthContext';
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
  const { user, signInWithGoogle, signUpWithEmail, signInWithEmail, sendPasswordReset, error: authError, clearError: clearAuthError } = useAuth();

  const [step, setStep] = useState<number>(initialStep);

  // Estados de personalización
  const [username, setUsername] = useState(
    stats.username && stats.username !== 'CazadorDelSistema' && stats.username !== 'UsuarioDelSistema' && stats.username.toLowerCase() !== 'cazador' ? stats.username : ''
  );
  const [selectedArchId, setSelectedArchId] = useState<string>(() => {
    const currentClass = stats.characterClass?.toLowerCase() || '';
    const match = WELCOME_ARCHETYPES.find(a => currentClass.includes(a.id) || a.name.toLowerCase() === currentClass);
    return match ? match.id : 'sabio';
  });
  const [dayStartHour, setDayStartHour] = useState<number>(() => {
    return stats.dayStartHour !== undefined ? stats.dayStartHour : getGlobalDayStartHour();
  });

  // Estados para autenticación opcional en Paso 1
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authLocalMessage, setAuthLocalMessage] = useState<string | null>(null);

  // Estado para la micro-misión interactiva (Paso 4)
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  const [customTaskTitle, setCustomTaskTitle] = useState('');
  const [isTaskCompletedInModal, setIsTaskCompletedInModal] = useState(false);

  // Estado y solicitud de Notificaciones (Paso 3)
  const [notifsStatus, setNotifsStatus] = useState<NotificationPermission>(() => {
    return notificationService.getPermission();
  });

  const handleEnableNotifs = async () => {
    soundFX.playClick();
    triggerHaptic(20);
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
  const circadian = getCircadianPhase(dayStartHour);

  // Manejo de cambio de hora (estado local ligero: no satura AppLayout ni los schedulers hasta confirmar)
  const handleHourChange = (newHour: number) => {
    const normalized = ((newHour % 24) + 24) % 24;
    try {
      soundFX.playClick();
      triggerHaptic(15);
    } catch (_) {}
    setDayStartHour(normalized);
  };

  // Manejo de autenticación con Google
  const handleGoogleAuth = async () => {
    try {
      soundFX.playClick();
      triggerHaptic(20);
    } catch (_) {}
    setAuthLocalMessage(null);
    clearAuthError();
    const res = await signInWithGoogle();
    if (res?.user) {
      try {
        soundFX.playLevelUp();
      } catch (_) {}
      setAuthLocalMessage('¡Cuenta vinculada con éxito con Google!');
      if (!username && res.user.displayName) {
        setUsername(res.user.displayName.split(' ')[0]);
      }
    }
  };

  // Manejo de restablecimiento de contraseña
  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setAuthLocalMessage('Por favor escribe tu correo para enviarte el enlace de restablecimiento.');
      return;
    }

    try {
      soundFX.playClick();
      triggerHaptic(15);
    } catch (_) {}
    setAuthSubmitting(true);
    setAuthLocalMessage(null);
    clearAuthError();

    try {
      const res = await sendPasswordReset(emailInput.trim());
      if (res.success) {
        setAuthLocalMessage('¡Enlace de recuperación enviado! Revisa tu correo o carpeta de spam.');
        setShowResetForm(false);
      } else if (res.error) {
        setAuthLocalMessage(res.error);
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Manejo de autenticación con Correo/Contraseña
  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) {
      setAuthLocalMessage('Por favor ingresa un correo y contraseña.');
      return;
    }
    if (passwordInput.length < 6) {
      setAuthLocalMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      soundFX.playClick();
      triggerHaptic(20);
    } catch (_) {}
    setAuthSubmitting(true);
    setAuthLocalMessage(null);
    clearAuthError();

    try {
      if (isRegisterMode) {
        const res = await signUpWithEmail(emailInput, passwordInput, username.trim() || undefined);
        if (res.user) {
          try {
            soundFX.playLevelUp();
          } catch (_) {}
          setAuthLocalMessage('¡Cuenta creada y protegida con éxito!');
          setShowEmailForm(false);
        } else if (res.error) {
          setAuthLocalMessage(res.error);
        }
      } else {
        const res = await signInWithEmail(emailInput, passwordInput);
        if (res.user) {
          try {
            soundFX.playLevelUp();
          } catch (_) {}
          setAuthLocalMessage('¡Sesión iniciada con éxito!');
          setShowEmailForm(false);
          if (res.user.displayName && !username) {
            setUsername(res.user.displayName.split(' ')[0]);
          }
        } else if (res.error) {
          setAuthLocalMessage(res.error);
        }
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Crear una micro-misión en el store (Paso 4)
  const handleCreateSampleTask = (taskConfig: { title: string; category: TaskCategory; xpReward: number; coinReward: number }) => {
    soundFX.playClick();
    triggerHaptic(15);
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
    triggerHaptic([30, 40, 20]);
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
    triggerHaptic([40, 50, 40]);

    try {
      triggerShockwave({ color: 'violet', intensity: 'epic' });
    } catch (_) {}

    const chosenName = username.trim() || (user?.displayName ? user.displayName.split(' ')[0] : 'Compañero');

    // 1. Guardar despertar y hora de inicio de jornada
    setGlobalDayStartHour(dayStartHour);
    completeAwakening({
      username: chosenName,
      fullName: stats.fullName || chosenName,
      characterClass: currentArchetype.name,
      mantra: currentArchetype.mantra,
      kaiShape: 'prism'
    });

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('la_solucion_beta_consent_v1', 'true');
        window.localStorage.setItem('la_solucion_ai_consent_v1', 'true');
      } catch (_) {}
    }

    usePlayerStore.getState().setStats((prev) => ({
      ...prev,
      dayStartHour,
      kaiAuraColor: currentArchetype.accent,
      betaConsentAccepted: true,
      betaConsentDate: new Date().toISOString(),
    }));

    // 2. Recompensar
    claimTutorialReward();
    markTutorialGuideSeen('introWalkthrough');
    markTutorialGuideSeen('welcomeOnboarding');
    safeLogEvent('onboarding_completed', {
      archetype: currentArchetype.id,
      dayStartHour,
      hasAuth: Boolean(user)
    });

    // 3. Sincronizar nube si disponible
    if (cloudSync?.forceSyncNow) {
      cloudSync.forceSyncNow();
    }

    setActiveTab('dashboard');
    onClose();
  };

  const handleNextStep = () => {
    try {
      soundFX.playClick();
      triggerHaptic(15);
    } catch (_) {}
    React.startTransition(() => {
      setStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
    });
  };

  const handlePrevStep = () => {
    try {
      soundFX.playClick();
      triggerHaptic(15);
    } catch (_) {}
    React.startTransition(() => {
      setStep((prev) => Math.max(1, prev - 1));
    });
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

        {/* Filamento especular superior con color dinámico del arquetipo */}
        <div
          className="absolute top-0 inset-x-0 h-[2px] pointer-events-none transition-colors duration-500"
          style={{
            background: `linear-gradient(90deg, transparent, ${currentArchetype.accent}, transparent)`
          }}
          aria-hidden="true"
        />

        {/* ── CABECERA CON INDICADOR DE PASOS ── */}
        <div className="p-3.5 sm:p-4 border-b border-white/10 bg-[#040814]/[0.96] shrink-0 relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-colors duration-300"
              style={{
                backgroundColor: `${currentArchetype.accent}15`,
                borderColor: `${currentArchetype.accent}40`,
                boxShadow: `0 0 12px ${currentArchetype.accent}25`
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: currentArchetype.accent }} />
            </div>
            <div className="min-w-0">
              <div
                className="text-[10px] font-mono tabular-nums font-bold tracking-wider uppercase truncate"
                style={{ color: currentArchetype.accent }}
              >
                Paso {step} de {TOTAL_STEPS}
              </div>
              <h2 id="kai-welcome-title" className="text-xs sm:text-sm font-anton uppercase tracking-wider text-white truncate">
                {step === 1 && '1. Identidad y Acceso a tu Cuenta'}
                {step === 2 && '2. Elige tu Arquetipo Interior'}
                {step === 3 && '3. Tu Ritmo de Vida y Avisos'}
                {step === 4 && '4. Tu Primera Victoria en Vivo'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleFinishOnboarding}
              className="chicle-btn flex items-center gap-1 px-2.5 py-1.5 aura-bg-soft hover:text-white border aura-border-subtle rounded-xl text-[11px] font-bold cursor-pointer"
              title="Saltar configuración e ir directo a tus tareas"
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
            className="h-full transition-all duration-300"
            style={{
              width: `${(step / TOTAL_STEPS) * 100}%`,
              backgroundColor: currentArchetype.accent,
              boxShadow: `0 0 10px ${currentArchetype.accent}`
            }}
          />
        </div>

        {/* ── CONTENIDO: 1 FASE CLARA POR PANTALLA ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar relative z-10 flex flex-col justify-start">
          <AnimatePresence mode="sync" initial={false}>

            {/* ============================================================== */}
            {/* PASO 1: IDENTIDAD, ESTILO NARRATIVO & ACCESO / SEGURIDAD        */}
            {/* ============================================================== */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="space-y-4"
              >
                {/* Propuesta Única de Valor (UVP) explícita */}
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

                {/* 1. Nombre de usuario */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 aura-text-primary" />
                    <span>¿Cómo te gustaría que te llame KAI?</span>
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

                {/* 2. Selector rápido de Densidad Narrativa */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    Estilo de lenguaje de la plataforma:
                  </label>
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
                            triggerHaptic(15);
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
                            {modeKey === 'minimal' ? 'Claro y directo, sin jerga' : 'Misiones, rangos y rol'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Selección de Acceso y Seguridad de tu Cuenta */}
                <div className="p-3.5 rounded-2xl bg-[#040814]/80 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span>Seguridad y respaldo de tu cuenta</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Opcional
                    </span>
                  </div>

                  {user ? (
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[10px] text-emerald-300/80 font-mono uppercase block">Cuenta Protegida</span>
                          <p className="text-white font-medium truncate text-xs">{user.email || user.displayName || 'Sesión Iniciada'}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold shrink-0">
                        Activa
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Elige cómo prefieres entrar. Puedes sincronizar en la nube o probar en modo local sin registro:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Botón 1: Google 1-Tap */}
                        <button
                          type="button"
                          onClick={handleGoogleAuth}
                          className="chicle-btn flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 hover:border-white/30 text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                          <span>Acceder con Google</span>
                        </button>

                        {/* Botón 2: Correo y Contraseña */}
                        <button
                          type="button"
                          onClick={() => {
                            soundFX.playClick();
                            setShowEmailForm(!showEmailForm);
                          }}
                          className={`chicle-btn flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            showEmailForm
                              ? 'aura-bg-soft aura-border-primary text-white'
                              : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/15 text-white'
                          }`}
                        >
                          <Mail className="w-4 h-4 text-amber-300 shrink-0" />
                          <span>{showEmailForm ? 'Cerrar formulario' : 'Correo y Contraseña'}</span>
                        </button>
                      </div>

                      {/* Formulario desplegable para Correo y Contraseña */}
                      {showEmailForm && (
                        <motion.form
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          onSubmit={handleEmailAuthSubmit}
                          className="pt-2 space-y-2"
                        >
                          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 text-[11px]">
                            <button
                              type="button"
                              onClick={() => { soundFX.playClick(); setIsRegisterMode(true); }}
                              className={`flex-1 py-1 px-2 rounded-lg font-bold transition-all ${
                                isRegisterMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Crear Cuenta
                            </button>
                            <button
                              type="button"
                              onClick={() => { soundFX.playClick(); setIsRegisterMode(false); }}
                              className={`flex-1 py-1 px-2 rounded-lg font-bold transition-all ${
                                !isRegisterMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Ya tengo cuenta
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            <div className="relative">
                              <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                              <input
                                type="email"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                placeholder="tu@correo.com"
                                autoComplete="email"
                                className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:aura-border-primary"
                              />
                            </div>
                            <div className="relative">
                              <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                placeholder="Contraseña (mínimo 6 caracteres)"
                                autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                                className="w-full pl-9 pr-10 py-2 rounded-xl bg-black/60 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:aura-border-primary"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                className="absolute right-2.5 top-2.5 p-0.5 rounded text-slate-400 hover:text-white cursor-pointer"
                              >
                                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {!isRegisterMode && (
                            <div className="flex items-center justify-between text-[11px] px-1">
                              <button
                                type="button"
                                onClick={() => setShowResetForm(!showResetForm)}
                                className="text-amber-300 hover:text-amber-200 underline cursor-pointer"
                              >
                                ¿Olvidaste tu contraseña?
                              </button>
                            </div>
                          )}

                          {showResetForm && !isRegisterMode && (
                            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-400/30 space-y-1.5 text-xs animate-fade-in">
                              <p className="text-[11px] text-amber-200 leading-snug">
                                Escribe tu correo arriba y pulsa aquí para recibir un enlace seguro de restablecimiento:
                              </p>
                              <button
                                type="button"
                                onClick={handlePasswordResetSubmit}
                                disabled={authSubmitting || !emailInput.trim()}
                                className="chicle-btn w-full py-1.5 px-3 rounded-lg bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400/50 text-amber-200 text-[11px] font-bold disabled:opacity-50 cursor-pointer"
                              >
                                {authSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
                              </button>
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={authSubmitting}
                            className="chicle-btn optic-active-card w-full py-2 px-3 rounded-xl aura-btn-gradient text-xs font-anton uppercase tracking-wider text-white flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>{authSubmitting ? 'Procesando...' : (isRegisterMode ? 'Crear y Proteger Cuenta' : 'Iniciar Sesión')}</span>
                          </button>

                          <p className="text-[10px] text-slate-400 text-center leading-tight pt-0.5">
                            Al continuar, aceptas las{' '}
                            <button
                              type="button"
                              onClick={() => useUIStore.getState().openPrivacyPolicy()}
                              className="text-amber-300 hover:text-amber-200 underline font-medium"
                            >
                              Condiciones y Privacidad
                            </button>{' '}
                            de La Solución.
                          </p>
                        </motion.form>
                      )}

                      {/* Notificación / Mensajes de autenticación */}
                      {(authLocalMessage || authError) && (
                        <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-[11px] flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                          <span>{authLocalMessage || authError}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* PASO 2: EL RITUAL DEL ARQUETIPO INTERIOR (EL ANCLA PSICOLÓGICA) */}
            {/* ============================================================== */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="space-y-3.5"
              >
                {/* Diálogo reactivo con KAI que cambia de color según el arquetipo */}
                <div
                  className="flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300"
                  style={{
                    backgroundColor: `${currentArchetype.accent}0D`,
                    borderColor: `${currentArchetype.accent}33`,
                    boxShadow: `0 0 16px ${currentArchetype.accent}15`
                  }}
                >
                  <div className="shrink-0 w-11 h-11 flex items-center justify-center" data-preserve-optic="true">
                    <KAICompanion
                      shapeId="prism"
                      size={44}
                      interactive={false}
                      auraColor={currentArchetype.accent}
                      auraState="normal"
                    />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <span
                      className="text-[10px] font-mono font-bold uppercase tracking-wider block"
                      style={{ color: currentArchetype.accent }}
                    >
                      KAI · Energía {currentArchetype.name}
                    </span>
                    <p className="text-[11.5px] text-slate-200 leading-snug">
                      Elige el arquetipo que mejor resuene con tu identidad actual para sintonizar tu enfoque.
                    </p>
                  </div>
                </div>

                {/* Cuadrícula interactiva de los 12 Arquetipos Jungianos */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[38dvh] overflow-y-auto custom-scrollbar pr-0.5">
                  {WELCOME_ARCHETYPES.map((arch) => {
                    const isSelected = selectedArchId === arch.id;
                    return (
                      <button
                        key={arch.id}
                        type="button"
                        onClick={() => {
                          soundFX.playClick();
                          triggerHaptic(20);
                          setSelectedArchId(arch.id);
                        }}
                        className={`chicle-btn !flex-col !items-start p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer relative ${
                          isSelected
                            ? 'optic-active-card scale-[1.01]'
                            : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                        }`}
                        style={{
                          borderColor: isSelected ? arch.accent : undefined,
                          backgroundColor: isSelected ? `${arch.accent}18` : undefined,
                          boxShadow: isSelected ? `0 0 16px ${arch.accent}35` : undefined
                        }}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-lg">{arch.icon}</span>
                          {isSelected && (
                            <span
                              className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-black"
                              style={{ backgroundColor: arch.accent }}
                            >
                              ✓
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-white block leading-tight truncate w-full">
                          {arch.name}
                        </span>
                        <span className="text-[9.5px] text-slate-300 block mt-0.5 leading-snug line-clamp-2">
                          {arch.description}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Caja iluminada con el Mantra del Arquetipo Activo */}
                <div
                  className="p-3 rounded-2xl border transition-all duration-300"
                  style={{
                    backgroundColor: `${currentArchetype.accent}12`,
                    borderColor: `${currentArchetype.accent}40`,
                    boxShadow: `0 0 12px ${currentArchetype.accent}20`
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-3.5 h-3.5" style={{ color: currentArchetype.accent }} />
                    <span
                      className="text-[10px] font-mono font-bold uppercase tracking-wider"
                      style={{ color: currentArchetype.accent }}
                    >
                      Mantra Personal del {currentArchetype.name}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white italic leading-snug">
                    "{currentArchetype.mantra}"
                  </p>
                </div>
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* PASO 3: RITMO CIRCADIANO (HORA DE TRABAJO) Y NOTIFICACIONES     */}
            {/* ============================================================== */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="space-y-3.5"
              >
                {/* 1. Selector de hora de inicio de jornada habitual */}
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
                    Tus misiones y ciclo de turno se sincronizarán a esta hora para adaptarse a tu ritmo real de trabajo o estudio.
                  </p>

                  {/* Presets rápidos */}
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

                  {/* Ajustador fino + y - */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/10">
                    <span className="text-[10.5px] text-slate-400">
                      Fase: <strong className="text-white">{circadian.icon} {circadian.label}</strong>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleHourChange(dayStartHour - 1)}
                        className="chicle-btn px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-xs font-mono text-slate-300"
                        title="Restar 1 hora"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleHourChange(dayStartHour + 1)}
                        className="chicle-btn px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-xs font-mono text-slate-300"
                        title="Sumar 1 hora"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Recordatorios inteligentes */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Bell className="w-3.5 h-3.5 text-amber-400" />
                    <span>Avisos Clave: Los 3 momentos diarios de KAI</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-left">
                    <div className="p-2.5 rounded-xl bg-[#040814]/80 border border-white/10 space-y-1">
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-1">
                        <span>🌅</span>
                        <span>1. Inicio</span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-snug">
                        A las <span className="font-mono">{formatHourToHuman(dayStartHour)}</span> para abrir tus metas.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#040814]/80 border border-white/10 space-y-1">
                      <div className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                        <span>⚡</span>
                        <span>2. Avances</span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-snug">
                        Avisos si tienes tareas pendientes durante el día.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#040814]/80 border border-white/10 space-y-1">
                      <div className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                        <span>📓</span>
                        <span>3. Cierre</span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-snug">
                        Al terminar tu turno para reflexionar y blindar tu racha.
                      </p>
                    </div>
                  </div>

                  {/* Botón de solicitud de permisos con estado visual */}
                  <div className="p-3 rounded-2xl bg-[#040814]/80 border aura-border-subtle text-center space-y-2">
                    {notifsStatus === 'granted' ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-300 text-xs font-bold py-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>¡Recordatorios activados en este dispositivo!</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-[11px] text-slate-200">
                          Pulsa para autorizar los avisos en tu navegador:
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
                </div>
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* PASO 4: PRIMERA VICTORIA EN VIVO Y DESPEGUE                     */}
            {/* ============================================================== */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="space-y-3.5 text-center"
              >
                <div className="w-14 h-14 mx-auto flex items-center justify-center" data-preserve-optic="true">
                  <KAICompanion
                    shapeId="prism"
                    size={56}
                    interactive={false}
                    auraColor={currentArchetype.accent}
                    auraState={isTaskCompletedInModal ? 'victory' : 'normal'}
                  />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-anton uppercase tracking-wider text-white">
                    ¡Todo listo para arrancar, {username.trim() || 'Compañero'}!
                  </h3>
                  <p className="text-xs text-slate-300 leading-snug max-w-sm mx-auto">
                    Prueba dar tu primer check en vivo para experimentar cómo se siente completar una meta en La Solución:
                  </p>
                </div>

                {/* Micro-misión interactiva */}
                {!createdTaskId ? (
                  <div className="space-y-2 text-left">
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

                    <div className="flex items-center gap-2 pt-0.5">
                      <input
                        type="text"
                        value={customTaskTitle}
                        onChange={(e) => setCustomTaskTitle(e.target.value)}
                        placeholder="O escribe algo propio..."
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
                  <div className="space-y-2.5 text-left">
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
                            {isTaskCompletedInModal ? '✅ ¡Completada con éxito!' : '👆 Toca aquí para marcar la casilla'}
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
                  </div>
                )}

                {/* Escudo de Racha de Bienvenida (Psicología Conductual) */}
                <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-400/30 flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-lg shrink-0">
                    🛡️
                  </div>
                  <div>
                    <strong className="text-amber-200 text-xs block">1 Escudo de Racha Gratis incluido</strong>
                    <p className="text-[10.5px] text-slate-300 leading-tight mt-0.5">
                      Si algún día no puedes completar tus tareas, este escudo protegerá tu racha automáticamente.
                    </p>
                  </div>
                </div>
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
                  onClick={handlePrevStep}
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
                  className="chicle-btn optic-active-card px-5 py-2 rounded-xl font-anton text-xs uppercase tracking-wider cursor-pointer flex items-center gap-1.5 text-white"
                  style={{
                    backgroundColor: currentArchetype.accent,
                    boxShadow: `0 0 16px ${currentArchetype.accent}40`,
                    color: currentArchetype.id === 'bufon' || currentArchetype.id === 'gobernante' ? '#000000' : '#ffffff'
                  }}
                >
                  <span>Siguiente</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishOnboarding}
                  className="chicle-btn optic-active-card px-5 py-2.5 rounded-xl font-anton text-xs uppercase tracking-wider cursor-pointer flex items-center gap-2"
                  style={{
                    backgroundColor: currentArchetype.accent,
                    boxShadow: `0 0 20px ${currentArchetype.accent}50`,
                    color: currentArchetype.id === 'bufon' || currentArchetype.id === 'gobernante' ? '#000000' : '#ffffff'
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>¡Comenzar mi Primera Semana!</span>
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
