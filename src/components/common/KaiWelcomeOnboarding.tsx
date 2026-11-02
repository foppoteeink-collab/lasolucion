import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Swords,
  BookOpen,
  ShoppingBag,
  FlaskConical,
  Zap,
  CheckCircle2,
  Target,
  ArrowRight,
  ArrowLeft,
  X,
  Smartphone,
  Laptop,
  Coins,
  Star,
  Check,
  User,
  HelpCircle,
  SlidersHorizontal,
  Eye,
  Layout,
  Radio,
  Clock,
  BrainCircuit,
  Shield,
  Lightbulb
} from 'lucide-react';
import { KAICompanion } from '../KAICompanion';
import { soundFX } from '../../utils/audio';
import { triggerShockwave } from '../../utils/celebration';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
import { useTaskStore } from '../../store/useTaskStore';
import { getTodayDateString } from '../../utils/date';
import { PlayerStats, TaskItem, TaskCategory } from '../../types';
import { getArchetypeDisplayName } from '../../data/archetypes';

interface KaiWelcomeOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  initialStep?: number;
  cloudSync?: {
    forceSyncNow?: () => Promise<boolean>;
  };
}

// Perfiles arquetípicos cálidos y directos
const WELCOME_ARCHETYPES = [
  {
    id: 'sabio',
    name: 'Mente Sabia',
    icon: '🦉',
    accent: '#6366f1',
    description: 'Claridad mental, aprendizaje continuo y enfoque profundo.',
    mantra: 'Paso a paso, con claridad y serenidad.'
  },
  {
    id: 'heroe',
    name: 'Espíritu Heroico',
    icon: '⚔️',
    accent: '#ef4444',
    description: 'Superación diaria, disciplina firme y energía para vencer retos.',
    mantra: 'Levántate, enfócate y vence.'
  },
  {
    id: 'creador',
    name: 'Mente Creadora',
    icon: '🎨',
    accent: '#d946ef',
    description: 'Transformar ideas en realidad, creatividad e inspiración.',
    mantra: 'Creando valor en cada acción de mi día.'
  },
  {
    id: 'inocente',
    name: 'Espíritu Puro',
    icon: '🕊️',
    accent: '#f59e0b',
    description: 'Vivir en paz, sencillez, balance y dormir con la mente tranquila.',
    mantra: 'Haciendo las cosas bien, en paz y sin agobios.'
  },
  {
    id: 'explorador',
    name: 'Alma Exploradora',
    icon: '🧭',
    accent: '#f97316',
    description: 'Nuevas metas, curiosidad activa y salir de la zona de confort.',
    mantra: 'Cada día es una nueva oportunidad para explorar.'
  },
  {
    id: 'cuidador',
    name: 'Corazón Cuidador',
    icon: '🌿',
    accent: '#10b981',
    description: 'Bienestar, salud, cuidar de uno mismo y de los que amas.',
    mantra: 'Cuidar de mi energía para dar lo mejor de mí.'
  }
];

// Opciones de propósito inicial
const CORE_DESIRES = [
  {
    id: 'procrastination',
    icon: '🚀',
    title: 'Vencer la procrastinación',
    subtitle: 'Me cuesta arrancar y necesito romper la inercia sin estrés.'
  },
  {
    id: 'order',
    icon: '🎯',
    title: 'Orden y claridad mental',
    subtitle: 'Tengo muchas cosas pendientes y quiero tener el control del día.'
  },
  {
    id: 'habits',
    icon: '🌱',
    title: 'Construir hábitos duraderos',
    subtitle: 'Quiero constancia real para ejercitarme, leer o estudiar.'
  },
  {
    id: 'peace',
    icon: '🕊️',
    title: 'Paz mental y balance',
    subtitle: 'Quiero avanzar en mis metas sin sentir culpa ni agotarme.'
  }
];

// Opciones de micro-tareas de prueba para el paso de "Aprender haciendo"
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

export const KaiWelcomeOnboarding: React.FC<KaiWelcomeOnboardingProps> = ({
  isOpen,
  onClose,
  stats,
  initialStep = 1,
  cloudSync
}) => {
  const { setActiveTab, navigationMode, setNavigationMode } = useUIStore();
  const { completeAwakening, claimTutorialReward, markTutorialGuideSeen } = usePlayerStore();
  const { addTask, tasksByDate } = useTaskStore();

  const [step, setStep] = useState<number>(initialStep);

  // Estados de personalización
  const [username, setUsername] = useState(
    stats.username && stats.username !== 'CazadorDelSistema' ? stats.username : ''
  );
  const [selectedDesire, setSelectedDesire] = useState<string>('procrastination');
  const [selectedArchId, setSelectedArchId] = useState<string>(() => {
    const currentClass = stats.characterClass?.toLowerCase() || '';
    const match = WELCOME_ARCHETYPES.find(a => currentClass.includes(a.id) || a.name.toLowerCase() === currentClass);
    return match ? match.id : 'sabio';
  });

  // Estado para la micro-misión interactiva (Paso 2)
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  const [customTaskTitle, setCustomTaskTitle] = useState('');
  const [isTaskCompletedInModal, setIsTaskCompletedInModal] = useState(false);
  const [activeTabDemo, setActiveTabDemo] = useState<'tareas' | 'bitacora' | 'tienda' | 'lab'>('tareas');

  const todayStr = useMemo(() => getTodayDateString(), []);

  // Reiniciar paso al abrir
  useEffect(() => {
    if (isOpen) {
      setStep(initialStep || 1);
    }
  }, [isOpen, initialStep]);

  if (!isOpen) return null;

  const currentArchetype = WELCOME_ARCHETYPES.find(a => a.id === selectedArchId) || WELCOME_ARCHETYPES[0];

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

    // Actualizar tarea en el store si existe
    if (createdTaskId) {
      useTaskStore.getState().updateTask(todayStr, createdTaskId, {
        completed: true,
        completedAt: new Date().toISOString()
      });
    }

    // Efecto flotante
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

    // 1. Guardar awakening
    completeAwakening({
      username: chosenName,
      fullName: stats.fullName || chosenName,
      characterClass: currentArchetype.name,
      mantra: currentArchetype.mantra,
      kaiShape: 'prism'
    });

    // 2. Recompensar
    claimTutorialReward();
    markTutorialGuideSeen('introWalkthrough');
    markTutorialGuideSeen('welcomeOnboarding');

    // 3. Forzar sync si existe
    if (cloudSync?.forceSyncNow) {
      cloudSync.forceSyncNow();
    }

    // 4. Ir a la pestaña de Tareas por defecto
    setActiveTab('dashboard');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div
        className="w-full max-w-2xl max-h-[92dvh] flex flex-col rounded-3xl bg-[#030712]/95 border border-cyan-500/35 shadow-[0_0_60px_rgba(0,240,255,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] relative overflow-hidden backdrop-blur-2xl text-white text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Luz de ambiente suave */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

        {/* ── CABECERA CON INDICADOR DE PASOS ── */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#010810]/80 shrink-0 relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(0,240,255,0.4)]">
              <Sparkles className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-cyan-400">
                Guía de Bienvenida // Paso {step} de 5
              </div>
              <h2 className="text-sm sm:text-base font-anton tracking-wide text-white flex items-center gap-2">
                {step === 1 && 'Conoce a KAI, tu Compañero'}
                {step === 2 && 'Tu Primera Victoria en Vivo'}
                {step === 3 && 'KAI: Tu Centro de Mando & Pestañas'}
                {step === 4 && 'Cómo Usar la Inteligencia IA de KAI'}
                {step === 5 && '¡Todo Listo para Empezar!'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar o saltar por ahora"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── BARRA DE PROGRESO SUAVE ── */}
        <div className="w-full bg-white/5 h-1 relative overflow-hidden shrink-0">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 shadow-[0_0_10px_rgba(0,240,255,0.8)]"
            initial={false}
            animate={{ width: `${(step / 5) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* ── CUERPO CON SCROLL ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar relative z-10">
          <AnimatePresence mode="wait">

            {/* ============================================================== */}
            {/* PASO 1: SALUDO CÁLIDO & PERSONALIZACIÓN                         */}
            {/* ============================================================== */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* Diálogo con KAI */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/25 backdrop-blur-sm">
                  <div className="shrink-0 w-16 h-16 flex items-center justify-center">
                    <KAICompanion
                      shapeId="prism"
                      size={64}
                      interactive={false}
                      auraState="normal"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                      KAI dice:
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      ¡Hola! Soy <strong>KAI</strong>, tu compañero de vida y enfoque. No soy un jefe ni una app que te juzgará por tener días difíciles. Estoy aquí para acompañarte paso a paso, vencer la procrastinación y cuidar tu energía.
                    </p>
                  </div>
                </div>

                {/* Pregunta: Nombre */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>¿Cómo te gustaría que te llame?</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ej. Alex, Sofía, Campeón..."
                    maxLength={24}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  />
                </div>

                {/* Pregunta: Propósito principal */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    <span>¿Qué es lo que más necesitas en este momento?</span>
                  </label>
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
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                            isSelected
                              ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                              : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                          }`}
                        >
                          <span className="text-xl shrink-0">{desire.icon}</span>
                          <div className="min-w-0">
                            <div className={`text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                              {desire.title}
                            </div>
                            <div className="text-[11px] text-slate-400 leading-snug mt-0.5">
                              {desire.subtitle}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pregunta: Estilo de Energía */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>¿Qué tipo de energía resuena más contigo?</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                            isSelected
                              ? 'bg-white/10 border-white/40 shadow-[0_0_12px_rgba(255,255,255,0.2)]'
                              : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                          }`}
                          style={{
                            borderColor: isSelected ? arch.accent : undefined
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-lg">{arch.icon}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                          </div>
                          <span className="text-xs font-bold text-white leading-tight">
                            {arch.name}
                          </span>
                          <span className="text-[10px] text-slate-400 leading-tight line-clamp-2">
                            {arch.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* PASO 2: TU PRIMERA VICTORIA EN VIVO (APRENDER HACIENDO)          */}
            {/* ============================================================== */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* Diálogo KAI */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-950/20 border border-amber-500/25 backdrop-blur-sm">
                  <div className="shrink-0 w-14 h-14 flex items-center justify-center">
                    <KAICompanion
                      shapeId="prism"
                      size={56}
                      interactive={false}
                      auraState={isTaskCompletedInModal ? 'victory' : 'normal'}
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300">
                      Aprende haciendo con KAI:
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      Las grandes metas se construyen con pequeñas acciones sencillas. <strong>Elige o escribe tu primera tarea de prueba</strong> para ver qué pasa cuando la completas.
                    </p>
                  </div>
                </div>

                {/* Si aún no ha creado una tarea */}
                {!createdTaskId ? (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-300">
                      Toca una micro-misión recomendada para arrancar:
                    </label>
                    <div className="space-y-2">
                      {QUICK_SAMPLE_TASKS.map((sample, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleCreateSampleTask(sample)}
                          className="w-full p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-400/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                        >
                          <span className="text-xs sm:text-sm text-slate-200 group-hover:text-cyan-300 font-medium">
                            {sample.title}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 shrink-0 ml-2">
                            +{sample.coinReward} 🪙
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* O escribir personalizada */}
                    <div className="pt-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customTaskTitle}
                          onChange={(e) => setCustomTaskTitle(e.target.value)}
                          placeholder="O escribe lo que quieras hacer hoy..."
                          className="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
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
                          className="px-3.5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-black font-anton text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0"
                        >
                          Crear
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Tarea creada: simulación interactiva */
                  <div className="space-y-4">
                    <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-emerald-400" />
                      <span>¡Aquí está tu primera misión! Tócala para marcarla:</span>
                    </div>

                    <div
                      onClick={handleCompleteSampleTask}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isTaskCompletedInModal
                          ? 'bg-emerald-950/30 border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                          : 'bg-white/[0.05] border-cyan-400/60 hover:border-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.2)] animate-pulse'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            isTaskCompletedInModal
                              ? 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_10px_rgba(16,185,129,0.8)]'
                              : 'border-cyan-400 hover:border-cyan-300 bg-cyan-950/40'
                          }`}
                        >
                          {isTaskCompletedInModal && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                        <div>
                          <p className={`text-xs sm:text-sm font-semibold ${isTaskCompletedInModal ? 'line-through text-slate-400' : 'text-white'}`}>
                            {customTaskTitle.trim() || 'Tomar 1 vaso de agua y respirar profundo 💧'}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {isTaskCompletedInModal ? '✅ ¡Completada con éxito!' : '👆 Toca aquí para completar'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-full">
                          +15 🪙
                        </span>
                        <span className="text-[11px] font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                          +25 XP
                        </span>
                      </div>
                    </div>

                    {isTaskCompletedInModal && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-300 text-xs"
                      >
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                        <div>
                          <strong className="block text-emerald-200">¡Eso es todo! Así de fácil funciona.</strong>
                          Cada vez que terminas algo en tu día, ganas experiencia (XP) para subir de nivel y monedas para darte premios reales en la Tienda.
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* PASO 3: LAS PESTAÑAS (KAI ES TU CENTRO DE MANDO)                */}
            {/* ============================================================== */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* KAI: Centro de navegación principal */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/25 to-indigo-950/40 border border-cyan-400/40 space-y-2.5 text-left">
                  <div className="flex items-center gap-2 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>¡KAI es tu Centro de Mando Principal!</span>
                  </div>
                  
                  <div className="flex items-start gap-3.5">
                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-cyan-950/60 border border-cyan-400/60 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.35)]">
                      <KAICompanion
                        shapeId="prism"
                        size={50}
                        interactive={false}
                        auraState="normal"
                      />
                    </div>
                    <div className="text-xs sm:text-sm text-slate-200 leading-relaxed space-y-1">
                      <p>
                        Para pasar de pestañas, <strong>lo más importante y rápido es tocar a KAI</strong> en la esquina inferior derecha ↘️.
                      </p>
                      <p className="text-xs text-slate-300">
                        Al tocar el orbe de KAI se despliegan sus satélites flotantes y viajas al instante a <strong>Tareas, Bitácora, Tienda o Laboratorio</strong> con un solo toque, dejando tu pantalla limpia y sin estorbos.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Simulador de mundos */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Toca cada mundo al que KAI te lleva para ver qué hay en él:
                  </label>

                  {/* Barra satélite de demostración */}
                  <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-black/60 border border-white/10 shadow-inner">
                    <button
                      type="button"
                      onClick={() => { soundFX.playClick(); setActiveTabDemo('tareas'); }}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer ${
                        activeTabDemo === 'tareas'
                          ? 'bg-cyan-400 text-black font-anton font-bold shadow-[0_0_12px_rgba(0,240,255,0.6)]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Swords className="w-4 h-4 mb-0.5" />
                      <span className="text-[10px] uppercase font-anton tracking-wider">Tareas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { soundFX.playClick(); setActiveTabDemo('bitacora'); }}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer ${
                        activeTabDemo === 'bitacora'
                          ? 'bg-cyan-400 text-black font-anton font-bold shadow-[0_0_12px_rgba(0,240,255,0.6)]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 mb-0.5" />
                      <span className="text-[10px] uppercase font-anton tracking-wider">Bitácora</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { soundFX.playClick(); setActiveTabDemo('tienda'); }}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer ${
                        activeTabDemo === 'tienda'
                          ? 'bg-cyan-400 text-black font-anton font-bold shadow-[0_0_12px_rgba(0,240,255,0.6)]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4 mb-0.5" />
                      <span className="text-[10px] uppercase font-anton tracking-wider">Tienda</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { soundFX.playClick(); setActiveTabDemo('lab'); }}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer ${
                        activeTabDemo === 'lab'
                          ? 'bg-cyan-400 text-black font-anton font-bold shadow-[0_0_12px_rgba(0,240,255,0.6)]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <FlaskConical className="w-4 h-4 mb-0.5" />
                      <span className="text-[10px] uppercase font-anton tracking-wider">Lab</span>
                    </button>
                  </div>

                  {/* Explicación del mundo activo */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 min-h-[85px] flex items-center">
                    {activeTabDemo === 'tareas' && (
                      <div className="space-y-1 text-left text-xs">
                        <strong className="text-cyan-300 flex items-center gap-1.5">
                          <Swords className="w-4 h-4" />
                          <span>Pestaña TAREAS (Tu Centro del Día)</span>
                        </strong>
                        <p className="text-slate-300 leading-relaxed">
                          Aquí vives tu jornada: agregas nuevas misiones con el botón <strong>"+"</strong>, marcas lo que vas logrando y pulsas los orbes de hábitos diarios (+1) para cuidar tu racha de constancia.
                        </p>
                      </div>
                    )}

                    {activeTabDemo === 'bitacora' && (
                      <div className="space-y-1 text-left text-xs">
                        <strong className="text-cyan-300 flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4" />
                          <span>Pestaña BITÁCORA (Tu Refugio Nocturno)</span>
                        </strong>
                        <p className="text-slate-300 leading-relaxed">
                          Un espacio cálido y sin juicios para vaciar la mente antes de dormir. Escribe cómo te sentiste, suelta pendientes para mañana y despeja tu cabeza para descansar en paz.
                        </p>
                      </div>
                    )}

                    {activeTabDemo === 'tienda' && (
                      <div className="space-y-1 text-left text-xs">
                        <strong className="text-cyan-300 flex items-center gap-1.5">
                          <ShoppingBag className="w-4 h-4" />
                          <span>Pestaña TIENDA (Recompensas Reales)</span>
                        </strong>
                        <p className="text-slate-300 leading-relaxed">
                          ¡Tu esfuerzo tiene premio! Canjea las monedas que ganas completando tareas por premios que tú mismo elijas: un café especial, 30 minutos de serie, un paseo o descansos.
                        </p>
                      </div>
                    )}

                    {activeTabDemo === 'lab' && (
                      <div className="space-y-1 text-left text-xs">
                        <strong className="text-cyan-300 flex items-center gap-1.5">
                          <FlaskConical className="w-4 h-4" />
                          <span>Pestaña LABORATORIO & PROGRESO</span>
                        </strong>
                        <p className="text-slate-300 leading-relaxed">
                          Mira tu evolución con números claros: tu nivel de jugador, tus rachas de días seguidos, tus atributos (mente, disciplina, energía) y la calibración visual de KAI.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Personalización en Ajustes: Barra fija vs KAI Nexus */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                      <span>¿Prefieres barra fija tradicional? Tú decides en Ajustes:</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (Modificable en cualquier momento)
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Si te gusta más tener una barra fija visible abajo (en celular) o arriba (en computadora), puedes activarla ahora mismo o cambiarla cuando quieras desde <strong>Ajustes &gt; 'Modo de Navegación'</strong>:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        setNavigationMode('nexus');
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                        navigationMode === 'nexus'
                          ? 'bg-cyan-950/50 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                          : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold">KAI Nexus (Recomendado)</div>
                        <div className="text-[10px] text-slate-400">Pantalla limpia, navegas tocando a KAI</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        setNavigationMode('classic');
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                        navigationMode === 'classic'
                          ? 'bg-cyan-950/50 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                          : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Layout className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold">Modo Clásico</div>
                        <div className="text-[10px] text-slate-400">Con barra de navegación fija siempre visible</div>
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* PASO 4: CÓMO SE USA LA INTELIGENCIA ARTIFICIAL KAI             */}
            {/* ============================================================== */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Dónde está KAI */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-purple-950/40 border border-cyan-500/30 flex items-center gap-4">
                  <div className="shrink-0 w-16 h-16 flex items-center justify-center bg-black/40 rounded-2xl border border-cyan-400/50 shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                    <KAICompanion
                      shapeId="prism"
                      size={54}
                      interactive={false}
                      auraState="focus_trance"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                      Tu Copiloto IA Permanente:
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      Mira la esquina <strong>inferior derecha de tu pantalla ↘️</strong>. Siempre verás mi orbe flotante acompañándote. Al tocarlo, se abre mi menú de Inteligencia Artificial.
                    </p>
                  </div>
                </div>

                {/* Los 3 Superpoderes */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Los 3 superpoderes con los que KAI te ayuda:
                  </label>

                  {/* 1. Oráculo IA */}
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-amber-500/25 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-300 mt-0.5">
                      <BrainCircuit className="w-4 h-4" />
                    </div>
                    <div className="text-xs text-left">
                      <strong className="text-amber-300 block font-semibold">
                        1. Oráculo IA (Planificador inteligente en 2 segundos)
                      </strong>
                      <p className="text-slate-300 mt-0.5 leading-relaxed">
                        ¿Tienes la cabeza llena de cosas? Solo dile: <em>"KAI, tengo que estudiar para un examen, ir al banco y lavar ropa"</em>. KAI armará tu horario y tareas ordenadas al instante.
                      </p>
                    </div>
                  </div>

                  {/* 2. Desbloqueo Anti-procrastinación */}
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-orange-500/25 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0 text-orange-300 mt-0.5">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="text-xs text-left">
                      <strong className="text-orange-300 block font-semibold">
                        2. Desbloqueo de 2 minutos (Anti-procrastinación)
                      </strong>
                      <p className="text-slate-300 mt-0.5 leading-relaxed">
                        ¿Sientes pereza o bloqueo para empezar? Toca a KAI y pide el Desbloqueo. Te dará una micro-acción ridículamente fácil de 2 minutos para arrancar sin resistencia mental.
                      </p>
                    </div>
                  </div>

                  {/* 3. Foco Pomodoro */}
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-cyan-500/25 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-300 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="text-xs text-left">
                      <strong className="text-cyan-300 block font-semibold">
                        3. Modo Foco Pomodoro con Sonidos Relajantes
                      </strong>
                      <p className="text-slate-300 mt-0.5 leading-relaxed">
                        Trabaja en bloques de 25 minutos con temporizador y frecuencias cuánticas que te protegen de distracciones y redes sociales.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* PASO 5: RESUMEN FINAL & REGALO DE BIENVENIDA                     */}
            {/* ============================================================== */}
            {step === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-5 text-center"
              >
                {/* Celebración de KAI */}
                <div className="py-2 flex flex-col items-center justify-center space-y-2">
                  <div className="w-20 h-20 flex items-center justify-center">
                    <KAICompanion
                      shapeId="prism"
                      size={76}
                      interactive={false}
                      auraState="victory"
                    />
                  </div>
                  <h3 className="text-lg sm:text-xl font-anton tracking-wide text-white">
                    ¡Calibración Completa, {username.trim() || 'Compañero'}!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                    Ya conoces cómo funciona todo. Tu camino hacia días más ligeros, enfocados y con propósito empieza hoy.
                  </p>
                </div>

                {/* Paquete de bienvenida acreditado */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-yellow-950/20 to-amber-950/30 border border-amber-500/40 space-y-2.5 max-w-md mx-auto">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300">
                    🎁 Tu Paquete de Bienvenida:
                  </span>
                  <div className="flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-anton text-amber-300">+25 Monedas</div>
                        <div className="text-[10px] text-slate-400">Para tu Tienda</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
                        <Star className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-anton text-cyan-300">+50 XP</div>
                        <div className="text-[10px] text-slate-400">Experiencia</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tip para volver a ver el tutorial */}
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 max-w-md mx-auto flex items-center gap-2.5 text-left text-xs text-slate-400">
                  <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    Si alguna vez quieres repasar este tutorial, lo encontrarás siempre en la pestaña <strong>Ajustes &gt; 'Manual de KAI'</strong>.
                  </span>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── BOTONES DE NAVEGACIÓN INFERIORES ── */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#010810]/90 shrink-0 relative z-10 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setStep((prev) => Math.max(1, prev - 1));
              }}
              className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white font-anton text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onClose();
              }}
              className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
            >
              Explorar por mi cuenta
            </button>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setStep((prev) => Math.min(5, prev + 1));
              }}
              className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-anton text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center gap-1.5 active:scale-95 font-bold"
            >
              <span>Siguiente</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishOnboarding}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-black font-anton text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.5)] flex items-center gap-2 active:scale-95 font-bold"
            >
              <Sparkles className="w-4 h-4" />
              <span>¡Comenzar mi día con KAI!</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
