import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  Check,
  Trash2,
  Clock,
  Calendar,
  Flame,
  Zap,
  Volume2,
  RotateCcw,
  Wand2,
} from 'lucide-react';
import { HoloCompanion } from './HoloCompanion';
import { useUIStore } from '../store/useUIStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTaskStore } from '../store/useTaskStore';
import { CustomHabit, TaskItem } from '../types';
import {
  createVoiceRecognizer,
  isSpeechRecognitionSupported,
  ParsedVoiceItem,
  VoiceRecognizerController,
} from '../utils/speechRecognition';
import { parseVoiceTranscriptToItems } from '../services/aiService';
import { speakKaiDialogue, stopKaiDialogue } from '../utils/voice';
import { soundFX } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { addDaysToDateString, formatDateForDisplay, parseLocalDate } from '../utils/date';
import { detectHabitEnergy, HABIT_ENERGY_DETAILS } from '../utils/habitEnergyDetector';

interface VoiceDictationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EXAMPLE_PROMPTS = [
  'A las 7 entrenar pierna, a las 10 junta con el cliente y tomar 8 vasos de agua todos los días',
  'Mañana a las 9 entregar reporte urgente, a las 4 ordenar mi escritorio y leer 20 minutos diario',
  'Crear el hábito de meditar 10 minutos cada día y hoy a las 6 salir a correr',
];

const CATEGORY_LABELS: Record<string, string> = {
  clientes: 'Clientes',
  limpieza: 'Limpieza',
  entrenamiento: 'Entreno',
  comida: 'Nutrición',
  creativo: 'Creativo',
  habito: 'Hábito',
  estudio: 'Estudio',
  pomodoro: 'Foco',
  trabajo: 'Trabajo',
  rutina: 'Rutina',
};

export const VoiceDictationModal: React.FC<VoiceDictationModalProps> = ({ isOpen, onClose }) => {
  const soundEnabled = useUIStore((s) => s.soundEnabled);
  const addFloatingEffect = useUIStore((s) => s.addFloatingEffect);

  const stats = usePlayerStore((s) => s.stats);
  const currentViewDate = useTaskStore((s) => s.currentViewDate);
  const customHabits = useTaskStore((s) => s.customHabits);
  const setCustomHabits = useTaskStore((s) => s.setCustomHabits);
  const addTask = useTaskStore((s) => s.addTask);
  const ensureTasksForDate = useTaskStore((s) => s.ensureTasksForDate);

  const kaiName = stats?.kaiCustomForm?.name || 'KAI';
  const kaiMood = stats?.kaiCustomForm?.mood || 'stoic';
  const archetype = stats?.characterClass || 'sabio';

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedVoiceItem[]>([]);
  const [kaiReply, setKaiReply] = useState<string | null>(null);
  const [usedRemoteAI, setUsedRemoteAI] = useState<boolean>(false);
  const [isSpeakingReply, setIsSpeakingReply] = useState(false);
  const [injectedSuccess, setInjectedSuccess] = useState<string | null>(null);

  const speechSupported = isSpeechRecognitionSupported();
  const recognizerRef = useRef<VoiceRecognizerController | null>(null);
  const transcriptRef = useRef('');
  const autoAnalyzeOnStopRef = useRef(false);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const stopListening = useCallback((shouldAnalyze = false) => {
    autoAnalyzeOnStopRef.current = shouldAnalyze;
    if (recognizerRef.current) {
      recognizerRef.current.stop();
      recognizerRef.current = null;
    }
    setIsListening(false);
  }, []);

  const handleClose = useCallback(() => {
    stopListening(false);
    stopKaiDialogue();
    soundFX.playClick();
    onClose();
  }, [onClose, stopListening]);

  // Resetear estado al abrir y gestionar bloqueo de floating elements + Escape
  useEffect(() => {
    if (!isOpen) return;

    setTranscript('');
    transcriptRef.current = '';
    setParsedItems([]);
    setKaiReply(null);
    setErrorMsg(null);
    setInjectedSuccess(null);
    setIsAnalyzing(false);
    setIsListening(false);

    document.body.classList.add('modal-open-hide-floating');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('modal-open-hide-floating');
      window.removeEventListener('keydown', handleKeyDown);
      if (recognizerRef.current) {
        recognizerRef.current.abort();
        recognizerRef.current = null;
      }
      stopKaiDialogue();
    };
  }, [isOpen, handleClose]);

  const runAnalysis = useCallback(async (textToAnalyze?: string) => {
    const text = (textToAnalyze ?? transcriptRef.current).trim();
    if (!text) {
      setErrorMsg('Dicta o escribe al menos una tarea o hábito para que KAI lo estructure.');
      return;
    }

    setErrorMsg(null);
    setIsAnalyzing(true);
    soundFX.playClick();

    try {
      const result = await parseVoiceTranscriptToItems({
        transcript: text,
        currentDateLabel: formatDateForDisplay(currentViewDate),
        kaiName,
      });

      setParsedItems(result.items);
      setKaiReply(result.kaiReply);
      setUsedRemoteAI(result.usedRemoteAI);

      if (result.items.length === 0) {
        setErrorMsg('No pude identificar misiones claras. Intenta dictar algo como "A las 8 entrenar y tomar agua todos los días".');
      } else {
        triggerHaptic(20);
        if (soundEnabled && result.kaiReply) {
          setIsSpeakingReply(true);
          speakKaiDialogue(result.kaiReply, kaiMood, () => setIsSpeakingReply(false));
        }
      }
    } catch (err) {
      console.error('[VoiceDictation] Analysis error:', err);
      setErrorMsg('Ocurrió un error al analizar el dictado. Intenta nuevamente.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentViewDate, kaiName, kaiMood, soundEnabled]);

  const handleToggleMic = () => {
    setErrorMsg(null);
    setInjectedSuccess(null);

    if (isListening) {
      soundFX.playClick();
      triggerHaptic(15);
      stopListening(true);
      // Pequeña espera para capturar la última palabra del reconocimiento antes de analizar
      setTimeout(() => {
        if (transcriptRef.current.trim().length >= 3) {
          void runAnalysis(transcriptRef.current);
        }
      }, 280);
      return;
    }

    if (!speechSupported) {
      setErrorMsg('Tu navegador no soporta dictado de micrófono nativo. ¡Pero puedes escribir tus ideas abajo y KAI las estructurará al instante!');
      return;
    }

    stopKaiDialogue();
    soundFX.playClick();
    triggerHaptic([15, 25]);
    setParsedItems([]);
    setKaiReply(null);

    const recognizer = createVoiceRecognizer({
      onInterim: (liveText) => {
        setTranscript(liveText);
        transcriptRef.current = liveText;
      },
      onFinal: (finalText) => {
        setTranscript(finalText);
        transcriptRef.current = finalText;
      },
      onError: (friendly) => {
        setErrorMsg(friendly);
        setIsListening(false);
        recognizerRef.current = null;
      },
      onEnd: () => {
        setIsListening(false);
        recognizerRef.current = null;
        if (autoAnalyzeOnStopRef.current) {
          autoAnalyzeOnStopRef.current = false;
        }
      },
    });

    if (!recognizer) {
      setErrorMsg('No se pudo activar el micrófono. Escribe tus tareas en el recuadro inferior.');
      return;
    }

    recognizerRef.current = recognizer;
    setIsListening(true);
    recognizer.start();
  };

  const handleToggleItemKind = (id: string) => {
    soundFX.playClick();
    setParsedItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextKind: 'task' | 'habit' = item.kind === 'task' ? 'habit' : 'task';
        const nextEnergy = nextKind === 'habit' ? detectHabitEnergy(item.title, item.category) : undefined;
        return {
          ...item,
          kind: nextKind,
          frequency: nextKind === 'habit' ? 'daily' : 'once',
          targetDateOffset: nextKind === 'habit' ? 0 : item.targetDateOffset,
          targetCount: nextKind === 'habit' ? (item.targetCount || 1) : undefined,
          unit: nextKind === 'habit' ? (item.unit || 'vez') : undefined,
          habitEnergyType: nextEnergy,
          quickIcon: nextEnergy ? HABIT_ENERGY_DETAILS[nextEnergy].icon : item.quickIcon,
        };
      })
    );
  };

  const handleUpdateTitle = (id: string, title: string) => {
    setParsedItems((prev) => prev.map((it) => (it.id === id ? { ...it, title } : it)));
  };

  const handleRemoveItem = (id: string) => {
    soundFX.playClick();
    setParsedItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleSpeakReply = () => {
    if (!kaiReply) return;
    soundFX.playClick();
    setIsSpeakingReply(true);
    speakKaiDialogue(kaiReply, kaiMood, () => setIsSpeakingReply(false));
  };

  const handleInjectToAgenda = () => {
    const validItems = parsedItems.filter((it) => it.title.trim().length > 0);
    if (validItems.length === 0) return;

    const nowTs = Date.now();
    let tasksCreated = 0;
    let habitsCreated = 0;

    let nextCustomHabits = [...(customHabits || [])];
    let habitsModified = false;

    validItems.forEach((item, idx) => {
      const cleanTitle = item.title.trim();
      const targetDate = item.targetDateOffset > 0
        ? addDaysToDateString(currentViewDate, item.targetDateOffset)
        : currentViewDate;

      if (targetDate !== currentViewDate) {
        ensureTasksForDate(targetDate);
      }

      const startTime = item.timeBlock ? item.timeBlock.split('-')[0].trim() : undefined;

      if (item.kind === 'habit') {
        const normTitle = cleanTitle.toLowerCase();
        const existingIdx = nextCustomHabits.findIndex(
          (h) => h.title && h.title.toLowerCase().trim() === normTitle
        );
        const habitId = existingIdx >= 0
          ? nextCustomHabits[existingIdx].id
          : `custom-habit-${nowTs}-${idx}-${Math.random().toString(36).substring(2, 5)}`;

        const energyType = item.habitEnergyType || detectHabitEnergy(cleanTitle, item.category);
        const icon = item.quickIcon || HABIT_ENERGY_DETAILS[energyType].icon || '⚡';

        const newHabit: CustomHabit = {
          id: habitId,
          title: cleanTitle,
          category: item.category,
          xpReward: item.xpReward,
          coinReward: item.coinReward,
          frequencyType: item.frequency === 'specific_days' && item.specificDays?.length ? 'specific_days' : 'daily',
          specificDays: item.frequency === 'specific_days' ? item.specificDays : undefined,
          targetCount: item.targetCount || 1,
          unit: item.unit || 'vez',
          isQuickHabit: true,
          isTracked2166: true,
          quickIcon: icon,
          habitEnergyType: energyType,
          targetStreak: 21,
          timeBlock: item.timeBlock,
          reminderTime: startTime,
        };

        if (existingIdx >= 0) {
          nextCustomHabits[existingIdx] = { ...nextCustomHabits[existingIdx], ...newHabit };
        } else {
          nextCustomHabits.push(newHabit);
        }
        habitsModified = true;
        habitsCreated++;

        // Inyectar inmediatamente en la fecha actual vista si aplica hoy
        const viewDayOfWeek = parseLocalDate(currentViewDate).getDay();
        const appliesToday =
          newHabit.frequencyType === 'daily' ||
          (newHabit.frequencyType === 'specific_days' && (newHabit.specificDays || []).includes(viewDayOfWeek));

        if (appliesToday) {
          const habitTask: TaskItem = {
            id: `habit-${habitId}-${currentViewDate}-${nowTs}-${idx}`,
            title: cleanTitle,
            category: item.category,
            priority: item.priority,
            xpReward: item.xpReward,
            coinReward: item.coinReward,
            completed: false,
            timeBlock: item.timeBlock,
            reminderTime: startTime,
            isHabit: true,
            targetCount: item.targetCount || 1,
            currentCount: 0,
            unit: item.unit || 'vez',
            isCustom: true,
            isQuickHabit: true,
            isTracked2166: true,
            quickIcon: icon,
            habitEnergyType: energyType,
            targetStreak: 21,
            notes: item.notes,
          };
          addTask(currentViewDate, habitTask);
        }
      } else {
        const newTask: TaskItem = {
          id: `voice-task-${nowTs}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          title: cleanTitle,
          category: item.category,
          priority: item.priority,
          xpReward: item.xpReward,
          coinReward: item.coinReward,
          completed: false,
          timeBlock: item.timeBlock,
          reminderTime: startTime,
          isCustom: true,
          quickIcon: item.quickIcon,
          notes: item.notes,
        };
        addTask(targetDate, newTask);
        tasksCreated++;
      }
    });

    if (habitsModified) {
      setCustomHabits(nextCustomHabits);
    }

    soundFX.playLevelUp();
    triggerHaptic([25, 45, 30]);

    const summaryParts: string[] = [];
    if (tasksCreated > 0) summaryParts.push(`${tasksCreated} ${tasksCreated === 1 ? 'tarea' : 'tareas'}`);
    if (habitsCreated > 0) summaryParts.push(`${habitsCreated} ${habitsCreated === 1 ? 'hábito' : 'hábitos'}`);
    const summaryText = `¡Agregado! ${summaryParts.join(' y ')} en tu agenda.`;

    addFloatingEffect({
      x: typeof window !== 'undefined' ? window.innerWidth / 2 : 200,
      y: typeof window !== 'undefined' ? window.innerHeight * 0.25 : 140,
      text: `🎙️ +${validItems.length} ${validItems.length === 1 ? 'misión' : 'misiones'} por voz`,
      type: 'custom',
      colorClass: 'text-cyan-300',
    });

    setInjectedSuccess(summaryText);

    if (soundEnabled) {
      speakKaiDialogue(summaryText, kaiMood);
    }

    setTimeout(() => {
      onClose();
    }, 950);
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[175] flex items-center justify-center p-2.5 sm:p-4 bg-black/88 backdrop-blur-sm overflow-hidden font-sans portal-modal-root"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: 'spring', damping: 28, stiffness: 360 }}
          className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-[#030816]/[0.98] border border-cyan-500/40 shadow-[0_0_60px_rgba(0,240,255,0.2),0_0_40px_rgba(0,0,0,0.9)] overflow-hidden text-white"
        >
          {/* Glows ambientales */}
          <div className="absolute -top-20 -right-20 w-56 h-56 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-fuchsia-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3.5 sm:px-5 border-b border-white/10 bg-[#020612]/90 relative z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <HoloCompanion
                  archetype={archetype}
                  size={44}
                  interactive={false}
                  auraState={isListening ? 'focus_trance' : injectedSuccess ? 'victory' : 'normal'}
                />
                {isListening && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-rose-500 border-2 border-[#020612] animate-ping" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-anton uppercase tracking-wide text-white flex items-center gap-1.5 truncate">
                  <span>Dictado Neural con {kaiName}</span>
                </h3>
                <p className="text-[11px] text-cyan-300/80 font-mono truncate">
                  Habla libremente · KAI separa tus tareas, horarios y hábitos 21/66
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/15 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95"
              aria-label="Cerrar dictado por voz"
              title="Cerrar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cuerpo Scrolleable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar relative z-10">
            {/* Banner de éxito */}
            {injectedSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-400/60 text-emerald-200 flex items-center gap-2.5 shadow-[0_0_25px_rgba(16,185,129,0.3)]"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-emerald-300" />
                </div>
                <span className="text-xs sm:text-sm font-bold">{injectedSuccess}</span>
              </motion.div>
            )}

            {/* Zona Central de Micrófono + Ondas */}
            <div className="flex flex-col items-center justify-center py-2 space-y-3">
              <div className="relative flex items-center justify-center">
                {isListening && (
                  <>
                    <motion.span
                      animate={{ scale: [1, 1.55, 1], opacity: [0.45, 0, 0.45] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute w-20 h-20 rounded-full bg-rose-500/35 pointer-events-none"
                    />
                    <motion.span
                      animate={{ scale: [1, 1.9, 1], opacity: [0.25, 0, 0.25] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.35, ease: 'easeInOut' }}
                      className="absolute w-20 h-20 rounded-full bg-cyan-400/25 pointer-events-none"
                    />
                  </>
                )}

                <button
                  type="button"
                  onClick={handleToggleMic}
                  disabled={isAnalyzing}
                  className={`relative z-10 w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 border-2 ${
                    isListening
                      ? 'bg-gradient-to-br from-rose-500 to-fuchsia-600 border-rose-200 text-white shadow-[0_0_35px_rgba(244,63,94,0.7)]'
                      : 'bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 border-cyan-200/80 text-[#020617] shadow-[0_0_30px_rgba(0,240,255,0.45)] hover:shadow-[0_0_40px_rgba(0,240,255,0.65)]'
                  }`}
                  aria-label={isListening ? 'Detener dictado y analizar' : 'Iniciar dictado por voz'}
                >
                  {isListening ? (
                    <MicOff className="w-8 h-8 stroke-[2.5]" />
                  ) : (
                    <Mic className="w-8 h-8 stroke-[2.5]" />
                  )}
                </button>
              </div>

              {/* Visualizador de estado de escucha */}
              <div className="text-center space-y-1">
                {isListening ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="inline-flex items-end gap-0.5 h-3.5">
                      {[0, 1, 2, 3, 4].map((bar) => (
                        <motion.span
                          key={bar}
                          animate={{ height: ['25%', '100%', '35%'] }}
                          transition={{ duration: 0.55, repeat: Infinity, delay: bar * 0.1 }}
                          className="w-1 rounded-full bg-rose-400"
                        />
                      ))}
                    </span>
                    <span className="text-xs font-mono font-bold text-rose-300 uppercase tracking-wider">
                      Escuchando... toca de nuevo para analizar
                    </span>
                  </div>
                ) : isAnalyzing ? (
                  <div className="flex items-center justify-center gap-1.5 text-cyan-300 text-xs font-mono font-bold">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>{kaiName} está desglosando tu dictado...</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 font-medium">
                    {speechSupported
                      ? 'Pulsa el micrófono y di varias tareas o hábitos de corrido'
                      : 'Escribe tus tareas en lenguaje natural y KAI las organiza por ti'}
                  </p>
                )}
              </div>
            </div>

            {/* Cuadro de Transcripción Editable */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400">
                  Transcripción en vivo (editable)
                </label>
                {transcript && (
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setTranscript('');
                      transcriptRef.current = '';
                      setParsedItems([]);
                      setKaiReply(null);
                      setErrorMsg(null);
                    }}
                    className="text-[10.5px] font-mono text-slate-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Limpiar</span>
                  </button>
                )}
              </div>
              <textarea
                value={transcript}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  transcriptRef.current = e.target.value;
                }}
                rows={3}
                placeholder='Ej: "Mañana a las 7 entrenar pierna, a las 10 junta con el cliente y tomar 8 vasos de agua todos los días"'
                className="w-full rounded-2xl bg-black/55 border border-white/15 focus:border-cyan-400/70 focus:ring-1 focus:ring-cyan-400/50 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none resize-none transition-all"
              />

              {/* Botón manual de análisis cuando hay texto y no está grabando */}
              {!isListening && transcript.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => void runAnalysis()}
                  disabled={isAnalyzing}
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/50 text-cyan-200 font-anton uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
                >
                  <Wand2 className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>{parsedItems.length > 0 ? 'Volver a analizar con KAI' : `Analizar dictado con ${kaiName}`}</span>
                </button>
              )}
            </div>

            {/* Ejemplos rápidos (solo cuando está vacío y sin resultados) */}
            {!transcript && parsedItems.length === 0 && !isListening && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  Prueba tocando un ejemplo:
                </span>
                <div className="space-y-1.5">
                  {EXAMPLE_PROMPTS.map((sample, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        setTranscript(sample);
                        transcriptRef.current = sample;
                        void runAnalysis(sample);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-cyan-950/40 border border-white/10 hover:border-cyan-400/40 text-[11.5px] text-slate-300 hover:text-cyan-100 transition-all cursor-pointer"
                    >
                      “{sample}”
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mensajes de error */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs leading-relaxed">
                {errorMsg}
              </div>
            )}

            {/* Resultados Estructurados por KAI */}
            {parsedItems.length > 0 && (
              <div className="space-y-3 pt-1">
                {/* Respuesta de KAI con botón de Voz Viva */}
                {kaiReply && (
                  <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-400/35 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-cyan-100 leading-snug">“{kaiReply}”</p>
                      <span className="inline-block mt-1 text-[9.5px] font-mono uppercase tracking-wider text-cyan-400/75">
                        {usedRemoteAI ? '✨ Procesado con Gemini IA' : '⚡ Motor Táctico Instantáneo'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSpeakReply}
                      className="p-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 cursor-pointer shrink-0 transition-colors"
                      title="Escuchar respuesta de KAI"
                      aria-label="Escuchar respuesta de KAI"
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${isSpeakingReply ? 'animate-bounce text-white' : ''}`} />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
                    Detectado ({parsedItems.length}) · Edita o confirma
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Toca Tarea/Hábito para cambiar tipo
                  </span>
                </div>

                {/* Lista de tarjetas editables */}
                <div className="space-y-2">
                  {parsedItems.map((item) => {
                    const isHabit = item.kind === 'habit';
                    const targetDateStr = item.targetDateOffset > 0
                      ? addDaysToDateString(currentViewDate, item.targetDateOffset)
                      : currentViewDate;
                    const dateLabel =
                      item.targetDateOffset === 0
                        ? 'Hoy / Vista'
                        : item.targetDateOffset === 1
                          ? 'Mañana'
                          : formatDateForDisplay(targetDateStr);

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-2xl border transition-all space-y-2 ${
                          isHabit
                            ? 'bg-purple-950/30 border-purple-400/40'
                            : 'bg-slate-900/70 border-cyan-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base leading-none shrink-0" aria-hidden="true">
                            {item.quickIcon}
                          </span>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleUpdateTitle(item.id, e.target.value)}
                            className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm font-bold text-white border-b border-transparent focus:border-cyan-400/60 outline-none py-0.5"
                            aria-label="Título de la misión"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                            title="Descartar este elemento"
                            aria-label="Descartar este elemento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Metadata Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                          <button
                            type="button"
                            onClick={() => handleToggleItemKind(item.id)}
                            className={`px-2 py-0.5 rounded-full border font-bold uppercase flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                              isHabit
                                ? 'bg-purple-500/25 border-purple-400/60 text-purple-200 hover:bg-purple-500/35'
                                : 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 hover:bg-cyan-500/30'
                            }`}
                            title="Clic para alternar entre Tarea puntual y Hábito 21/66"
                          >
                            {isHabit ? <Flame className="w-2.5 h-2.5" /> : <Zap className="w-2.5 h-2.5" />}
                            <span>{isHabit ? 'Hábito 21/66' : 'Tarea'}</span>
                          </button>

                          <span className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-slate-300">
                            {CATEGORY_LABELS[item.category] || item.category}
                          </span>

                          {item.timeBlock && (
                            <span className="px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/40 text-sky-200 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{item.timeBlock}</span>
                            </span>
                          )}

                          {!isHabit && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/35 text-amber-200 flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              <span>{dateLabel}</span>
                            </span>
                          )}

                          {isHabit && item.targetCount && item.targetCount > 1 && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-200">
                              Meta: {item.targetCount} {item.unit || 'veces'}
                            </span>
                          )}

                          <span className="ml-auto text-slate-400">
                            +{item.xpReward} XP · +{item.coinReward} 🪙
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer de Confirmación */}
          {parsedItems.length > 0 && !injectedSuccess && (
            <div className="shrink-0 p-3.5 sm:p-4 border-t border-white/10 bg-[#020612]/95 flex items-center gap-2 relative z-10">
              <button
                type="button"
                onClick={handleClose}
                className="px-3.5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleInjectToAgenda}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-500 hover:brightness-110 text-[#020617] font-anton uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all cursor-pointer active:scale-[0.98]"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>
                  Añadir {parsedItems.length} {parsedItems.length === 1 ? 'elemento' : 'elementos'} a mi agenda
                </span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default VoiceDictationModal;
