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
import { safeLogEvent } from '../../firebase';
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
    stats.username && stats.username !== 'CazadorDelSistema' && stats.username !== 'UsuarioDelSistema' && stats.username.toLowerCase() !== 'cazador' ? stats.username : ''
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

    safeLogEvent('task_completed_first');
    
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
    safeLogEvent('onboarding_completed');

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
                Guía de Bienvenida // Paso {step} de 3
              </div>
              <h2 className="text-sm sm:text-base font-anton tracking-wide text-white flex items-center gap-2">
                {step === 1 && 'Conoce a KAI, tu Compañero'}
                {step === 2 && 'Tu Primera Victoria en Vivo'}
                {step === 3 && '¡Todo Listo para Empezar!'}
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
                <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/25 to-indigo-950/40 border border-cyan-400/40 space-y-2.5 text-left">
                  <h3 className="text-sm font-bold text-cyan-300">¡Ya estás listo para empezar!</h3>
                  <p className="text-xs text-slate-200">
                    KAI es tu centro de mando. Toca el orbe de KAI en la esquina inferior derecha ↘️ para navegar por Tareas, Bitácora, Tienda y Laboratorio. Además, KAI te ayudará con su Inteligencia IA: Oráculo para planificar, Desbloqueo rápido y Modo Foco Pomodoro.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center text-xs text-slate-400">
                  <p>¡Todo listo para transformar tu día! Al comenzar, tendrás tus primeros recursos para arrancar con fuerza.</p>
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

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setStep((prev) => Math.min(3, prev + 1));
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
