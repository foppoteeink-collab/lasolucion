import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Heart,
  PlusCircle,
  CheckSquare,
  Timer,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  X,
  Shield,
  Coins,
  Brain,
  FileText,
  Flame,
  Award,
  Zap,
  Target
} from 'lucide-react';
import { soundFX } from '../../utils/audio';
import { triggerShockwave } from '../../utils/celebration';
import { notificationService } from '../../utils/notifications';
import { useUIStore } from '../../store/useUIStore';
import { usePlayerStore } from '../../store/usePlayerStore';

interface StepContent {
  step: number;
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  kaiSpeech: string;
  bulletPoints: { icon: string; text: string }[];
  actionBtn?: {
    label: string;
    onClick: () => void;
  };
}

export const KaiTacticalGuideModal: React.FC = () => {
  const { isTacticalGuideOpen, tacticalGuideInitialStep, closeTacticalGuide, openTaskForm } = useUIStore();
  const { stats, markTutorialGuideSeen, claimTutorialReward } = usePlayerStore();

  const [currentStep, setCurrentStep] = useState(tacticalGuideInitialStep || 1);

  if (!isTacticalGuideOpen) return null;

  const handleNext = () => {
    soundFX.playClick();
    if (currentStep < 6) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleCompleteTutorial();
    }
  };

  const handlePrev = () => {
    soundFX.playClick();
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    soundFX.playClick();
    markTutorialGuideSeen('introWalkthrough');
    closeTacticalGuide();
  };

  const handleCompleteTutorial = () => {
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
        '¡Calibración Neural Completada! 🎖️',
        'Has sincronizado todos los módulos de KAI. Recompensa: +50 XP y +25 Monedas de bienvenida.',
        '🎖️'
      );
    }

    closeTacticalGuide();
  };

  const stepsData: StepContent[] = [
    {
      step: 1,
      badge: 'MÓDULO 1 DE 6 // TELEMETRÍA',
      title: 'Energía Vital & Día de Descanso',
      subtitle: 'Salud, Disciplina y Protección contra Burnout',
      icon: <Heart className="w-8 h-8 text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.7)]" />,
      kaiSpeech:
        'Operador, tu barra de Energía Vital (HP) refleja tu consistencia diaria. Si concluye la jornada con tareas clave sin marcar, recibirás daño de vida al cerrar la bitácora.',
      bulletPoints: [
        {
          icon: '❤️',
          text: 'Inicias con 100/100 de HP. Completar el 80% o más de tus misiones activa Regeneración Celular (+40 HP).'
        },
        {
          icon: '🛡️',
          text: 'Modo Descanso: En la cabecera del calendario puedes activar "Modo Descanso". Protege tu salud y tus rachas sin ninguna penalización cuando necesites recargar.'
        },
        {
          icon: '⚡',
          text: 'Si tu salud llega a 0 HP, entrarás en modo Colapso, pero podrás reanimarte al instante canjeando monedas o XP.'
        }
      ]
    },
    {
      step: 2,
      badge: 'MÓDULO 2 DE 6 // LEY 21/66',
      title: 'Orbes Cuánticos de Hábitos',
      subtitle: 'Protocolo de Neuroplasticidad y Racha',
      icon: <Target className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_12px_rgba(0,240,255,0.7)]" />,
      kaiSpeech:
        'En la parte superior de tu agenda tienes los Orbes Cuánticos (Agua, Entrenamiento, Lectura...). Cada pulsación registra tu progreso diario con respuesta visual en su anillo perimetral.',
      bulletPoints: [
        {
          icon: '🔄',
          text: 'Toca el orbe para sumar +1 (en hábitos con meta numérica como 8 vasos de agua) o para marcarlo completado.'
        },
        {
          icon: '🧠',
          text: 'Barrera de Maltz (21 Días): Superar 21 días continuos asimila el hábito en tu red neural y otorga +500 XP de bonificación.'
        },
        {
          icon: '👑',
          text: 'Maestría Legendaria (66 Días): Alcanzar 66 días forja un Hábito Legendario permanente con multiplicador de +50% de XP.'
        }
      ]
    },
    {
      step: 3,
      badge: 'MÓDULO 3 DE 6 // CREACIÓN',
      title: 'Forjar una Nueva Misión o Hábito',
      subtitle: 'Cómo crear tareas y planificar bloques horarios',
      icon: <PlusCircle className="w-8 h-8 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.7)]" />,
      kaiSpeech:
        'Toca el botón "+" en la cabecera o en la barra de control para abrir el Forjador Táctico. Puedes crear desde tareas sencillas hasta hábitos de seguimiento continuo.',
      bulletPoints: [
        {
          icon: '🎯',
          text: 'Elige entre Tarea Única (misión del día) o Hábito Recurrente (se añadirá a tu barra superior de Orbes 21/66).'
        },
        {
          icon: '🏷️',
          text: 'Asigna Categoría (Entrenamiento, Estudio, Trabajo, Creativo...) para ganar puntos en tus atributos RPG.'
        },
        {
          icon: '⏱️',
          text: 'Bloques Horarios: Define hora de inicio y fin (ej. 09:00 - 10:30) para que tu agenda se ordene cronológicamente sin choques.'
        }
      ],
      actionBtn: {
        label: '✨ Abrir Forjador de Tareas Ahora',
        onClick: () => {
          closeTacticalGuide();
          openTaskForm('task');
        }
      }
    },
    {
      step: 4,
      badge: 'MÓDULO 4 DE 6 // ACCIONES',
      title: 'Marcado, Notas y Bitácora',
      subtitle: 'Cómo interactuar con cada tarjeta de misión',
      icon: <CheckSquare className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.7)]" />,
      kaiSpeech:
        'Cada tarjeta en tu agenda cuenta con controles táctiles optimizados para el uso ágil con una sola mano en tu dispositivo móvil.',
      bulletPoints: [
        {
          icon: '✅',
          text: 'Checkbox Izquierdo: Toca el recuadro para completar tu misión y cobrar Oro y XP con efectos de impacto.'
        },
        {
          icon: '📝',
          text: 'Chip de "Nota": Toca el indicador de nota para desplegar la bitácora privada de la tarea (ideas, links, reflexiones).'
        },
        {
          icon: '⚙️',
          text: 'Menú Orbital: Toca los tres puntos o el título para editar datos, ajustar horarios o eliminar misiones.'
        }
      ]
    },
    {
      step: 5,
      badge: 'MÓDULO 5 DE 6 // HIPER-FOCO',
      title: 'Modo Foco & Paisajes Sonoros',
      subtitle: 'Concentración profunda con audio generativo',
      icon: <Timer className="w-8 h-8 text-purple-400 drop-shadow-[0_0_12px_rgba(168,85,247,0.7)]" />,
      kaiSpeech:
        'El Modo Foco (Pomodoro Cuántico) te aísla de interrupciones mientras trabajas en tus proyectos más exigentes.',
      bulletPoints: [
        {
          icon: '🎧',
          text: 'Frecuencias Cuánticas: Audio sintetizado con Web Audio API que estimula el enfoque y continúa sonando con la pantalla apagada.'
        },
        {
          icon: '⚡',
          text: 'Bonus de Foco: Durante los bloques de concentración activos, ganas un +50% adicional de experiencia y monedas.'
        },
        {
          icon: '🛡️',
          text: 'Inmunizador de Flujo: Los avisos y modales emergentes quedan en cola silenciosa hasta que concluya tu bloque de foco.'
        }
      ]
    },
    {
      step: 6,
      badge: 'MÓDULO 6 DE 6 // ECOSISTEMA',
      title: 'Oráculo IA & Tienda de Recompensas',
      subtitle: 'Planificación inteligente y canje de méritos',
      icon: <Brain className="w-8 h-8 text-cyan-300 drop-shadow-[0_0_12px_rgba(0,240,255,0.7)]" />,
      kaiSpeech:
        'Tu disciplina diaria genera Monedas de Oro que puedes convertir en recompensas de la vida real o en blindaje para tus rachas.',
      bulletPoints: [
        {
          icon: '🔮',
          text: 'Oráculo KAI: Escribe lo que planeas lograr hoy y mi motor estructurará tu agenda en Bloques Maestros automáticamente.'
        },
        {
          icon: '🛍️',
          text: 'Tienda de Recompensas: Forja premios personalizados (un café, una salida, una película) y cómpralos con tu esfuerzo.'
        },
        {
          icon: '🛡️',
          text: 'Escudos Cuánticos: Adquiere hasta 3 escudos en la tienda para proteger tu racha ante viajes o días imprevistos.'
        }
      ]
    }
  ];

  const activeStepData = stepsData[currentStep - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-in fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl scifi-glass-modal rounded-3xl border border-cyan-500/50 shadow-[0_0_50px_rgba(0,240,255,0.25)] flex flex-col max-h-[90vh] overflow-hidden relative"
      >
        {/* Cabecera Táctica */}
        <div className="px-4 sm:px-6 py-4 border-b border-cyan-500/30 bg-[#020d18]/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,240,255,0.4)]">
              <Sparkles className="w-4 h-4 text-cyan-300" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-cyan-400 block truncate">
                {activeStepData.badge}
              </span>
              <h3 className="text-sm sm:text-base font-anton text-white tracking-wide truncate">
                PROTOCOLO DE INDUCCIÓN DE KAI
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Cerrar guía"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Paso Actual */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin scrollbar-thumb-cyan-800">
          {/* Tarjeta de Título e Ícono del Módulo */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-surface-card border border-cyan-500/30 shadow-inner">
            <div className="p-2.5 rounded-2xl bg-cyan-950/50 border border-cyan-500/40 shrink-0">
              {activeStepData.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-base sm:text-lg font-anton text-white tracking-wide leading-tight">
                {activeStepData.title}
              </h4>
              <p className="text-xs text-cyan-300 font-mono mt-0.5">
                {activeStepData.subtitle}
              </p>
            </div>
          </div>

          {/* Diálogo Directo de KAI */}
          <div className="p-3.5 rounded-2xl bg-[#001020]/80 border border-cyan-400/40 relative space-y-1.5 shadow-[0_0_15px_rgba(0,240,255,0.08)]">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,1)] animate-ping" />
              <span>TRANSMISIÓN DIRECTA DE KAI // COPILOTO TÁCTICO:</span>
            </div>
            <p className="text-xs sm:text-[13px] text-slate-200 leading-relaxed font-sans font-medium">
              «{activeStepData.kaiSpeech}»
            </p>
          </div>

          {/* Lista de Puntos Clave */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block px-1">
              Operaciones clave del sistema:
            </span>
            {activeStepData.bulletPoints.map((bp, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface-card/60 border border-white/5 hover:border-cyan-500/30 transition-colors"
              >
                <span className="text-base shrink-0 mt-0.5">{bp.icon}</span>
                <p className="text-xs text-slate-300 leading-relaxed flex-1">
                  {bp.text}
                </p>
              </div>
            ))}
          </div>

          {/* Botón de Acción Especial (Ej. Abrir Forjador de Tareas) */}
          {activeStepData.actionBtn && (
            <div className="pt-2">
              <button
                type="button"
                onClick={activeStepData.actionBtn.onClick}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-amber-500/20 border border-cyan-400/60 text-cyan-200 hover:text-white hover:border-cyan-300 text-xs font-anton tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.2)] active:scale-98"
              >
                <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                <span>{activeStepData.actionBtn.label}</span>
              </button>
            </div>
          )}

          {/* Recompensa de Calibración en el Paso Final */}
          {currentStep === 6 && !stats.hasClaimedTutorialReward && (
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-400/50 flex items-center gap-3">
              <Award className="w-6 h-6 text-amber-400 shrink-0" />
              <div className="text-xs text-amber-200 leading-tight">
                <strong className="text-white block font-anton uppercase">Bonificación por Calibración:</strong>
                Recibe <strong>+50 XP</strong> y <strong>+25 Monedas</strong> al completar este último paso.
              </div>
            </div>
          )}
        </div>

        {/* Footer con Stepper y Botones de Navegación */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-cyan-500/30 bg-[#020d18]/95 flex items-center justify-between gap-3">
          {/* Indicadores de Pasos (1 al 6) */}
          <div className="flex items-center gap-1.5">
            {stepsData.map((s) => (
              <button
                key={s.step}
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setCurrentStep(s.step);
                }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentStep === s.step
                    ? 'w-6 bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.8)]'
                    : currentStep > s.step
                    ? 'w-2 bg-emerald-400/70'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                title={`Ir al paso ${s.step}: ${s.title}`}
              />
            ))}
          </div>

          {/* Botones de Control */}
          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-2 rounded-xl bg-surface-card border border-white/10 hover:border-white/30 text-slate-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Anterior</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className={`px-4 py-2 rounded-xl text-xs font-anton uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 ${
                currentStep === 6
                  ? 'bg-amber-400 hover:bg-amber-300 text-black font-black shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-black font-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
              }`}
            >
              <span>{currentStep === 6 ? '¡Completar Calibración!' : 'Siguiente'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
