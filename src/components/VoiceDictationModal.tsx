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
  Wallet,
  Play,
  Keyboard,
  Send,
  Copy,
  Activity,
} from 'lucide-react';
import { HoloCompanion } from './HoloCompanion';
import { useUIStore } from '../store/useUIStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTaskStore } from '../store/useTaskStore';
import { useAppStore } from '../store/useAppStore';
import { useTimer } from '../context/TimerContext';
import { CustomHabit, FinancialTransaction, TaskItem } from '../types';
import {
  classifyVoiceIntent,
  createVoiceRecognizer,
  detectVoiceFocusIntent,
  detectVoiceDirectAction,
  isSpeechRecognitionSupported,
  ParsedVoiceDirectAction,
  ParsedVoiceFinanceEntry,
  ParsedVoiceFocusIntent,
  ParsedVoiceItem,
  splitMixedVoiceDictation,
  VoiceRecognizerController,
} from '../utils/speechRecognition';
import {
  askKaiConversationAI,
  generateNeuralAnalysisAI,
  parseVoiceFinanceWithAI,
  parseVoiceTranscriptToItems,
} from '../services/aiService';
import { speakKaiDialogue, stopKaiDialogue } from '../utils/voice';
import { soundFX } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { addDaysToDateString, formatDateForDisplay, parseLocalDate } from '../utils/date';
import { detectHabitEnergy, HABIT_ENERGY_DETAILS } from '../utils/habitEnergyDetector';
import { formatMoney, getSavedCurrencySymbol } from '../utils/finance';

interface VoiceDictationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOracleWithPrompt?: (promptText?: string) => void;
  onOpenTemplates?: () => void;
}

const QUICK_SUGGESTIONS = [
  'Hazme un diagnóstico de cómo voy',
  '¿Por qué tarea empiezo hoy?',
  'Gasté 150 en comida y a las 7 entrenar',
  'Pon un foco de 25 minutos para avanzar',
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

function renderDiagnosticMarkdown(text: string): React.ReactNode[] {
  return text.split('\n').map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={idx} className="h-1.5" />;
    if (/^#{1,3}\s+/.test(trimmed)) {
      return (
        <p key={idx} className="text-[11px] font-semibold uppercase tracking-wider aura-text-primary mt-2.5 mb-1">
          {trimmed.replace(/^#{1,3}\s+/, '').replace(/\*\*/g, '')}
        </p>
      );
    }
    if (/^[-*•]\s+/.test(trimmed)) {
      return (
        <div key={idx} className="flex items-start gap-2 text-xs text-slate-200/95 leading-relaxed">
          <span className="aura-text-primary mt-0.5">·</span>
          <span>{trimmed.replace(/^[-*•]\s+/, '').replace(/\*\*/g, '')}</span>
        </div>
      );
    }
    return (
      <p key={idx} className="text-xs text-slate-200/95 leading-relaxed">
        {trimmed.replace(/\*\*/g, '')}
      </p>
    );
  });
}

function summarizeDiagnosticForVoice(analysis: string, stats: any, todayTasks: TaskItem[]): string {
  const completed = todayTasks.filter((t) => t.completed).length;
  const total = todayTasks.length;
  const streak = stats?.streakDays || 0;
  const firstPlainLine = analysis
    .split('\n')
    .map((l) => l.replace(/[#*_`>-]/g, '').trim())
    .find((l) => l.length > 28 && l.length < 180);

  if (firstPlainLine) {
    return firstPlainLine;
  }
  return `Listo tu diagnóstico. Llevas racha de ${streak} días y hoy completaste ${completed} de ${total} misiones. Aquí abajo tienes tu análisis completo.`;
}

export const VoiceDictationModal: React.FC<VoiceDictationModalProps> = ({
  isOpen,
  onClose,
  onOpenOracleWithPrompt,
  onOpenTemplates,
}) => {
  const soundEnabled = useUIStore((s) => s.soundEnabled);
  const addFloatingEffect = useUIStore((s) => s.addFloatingEffect);

  const stats = usePlayerStore((s) => s.stats);
  const currentViewDate = useTaskStore((s) => s.currentViewDate);
  const tasksByDate = useTaskStore((s) => s.tasksByDate);
  const customHabits = useTaskStore((s) => s.customHabits);
  const setCustomHabits = useTaskStore((s) => s.setCustomHabits);
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const toggleTaskCompletion = useTaskStore((s) => s.toggleTaskCompletion);
  const ensureTasksForDate = useTaskStore((s) => s.ensureTasksForDate);

  const setExpenses = useAppStore((s) => s.setExpenses);
  const expenses = useAppStore((s) => s.expenses || []);
  const habitMastery = useAppStore((s) => s.habitMastery);
  const reflections = useAppStore((s) => s.reflections);
  const { handleOpenPomodoroForTask } = useTimer();

  const todayTasks = tasksByDate[currentViewDate] || [];
  const kaiName = stats?.kaiName || stats?.kaiCustomForm?.name || 'KAI';
  const kaiMood = stats?.kaiCustomForm?.mood || 'stoic';
  const archetype = stats?.characterClass || 'sabio';

  const speechSupported = isSpeechRecognitionSupported();
  const [isListening, setIsListening] = useState(false);
  const [showKeyboardInput, setShowKeyboardInput] = useState(!speechSupported);
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Resultados unificados
  const [parsedItems, setParsedItems] = useState<ParsedVoiceItem[]>([]);
  const [detectedFocus, setDetectedFocus] = useState<ParsedVoiceFocusIntent | null>(null);
  const [detectedDirectAction, setDetectedDirectAction] = useState<ParsedVoiceDirectAction | null>(null);
  const [detectedFinance, setDetectedFinance] = useState<ParsedVoiceFinanceEntry[]>([]);
  const [diagnosticReport, setDiagnosticReport] = useState<{ text: string; source: 'ai' | 'heuristics' } | null>(null);
  const [showPlannerActions, setShowPlannerActions] = useState(false);
  const [copiedDiagnostic, setCopiedDiagnostic] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'kai'; text: string }>>([]);

  const [kaiReply, setKaiReply] = useState<string | null>(null);
  const [isSpeakingReply, setIsSpeakingReply] = useState(false);
  const [injectedSuccess, setInjectedSuccess] = useState<string | null>(null);

  const currencySymbol = getSavedCurrencySymbol();
  const recognizerRef = useRef<VoiceRecognizerController | null>(null);
  const transcriptRef = useRef('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const stopListening = useCallback(() => {
    if (recognizerRef.current) {
      recognizerRef.current.stop();
      recognizerRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!speechSupported) {
      setShowKeyboardInput(true);
      setTimeout(() => inputRef.current?.focus(), 60);
      return;
    }

    stopKaiDialogue();
    setErrorMsg(null);
    setInjectedSuccess(null);

    if (recognizerRef.current) {
      recognizerRef.current.abort();
      recognizerRef.current = null;
    }

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
        setShowKeyboardInput(true);
      },
      onEnd: () => {
        setIsListening(false);
        recognizerRef.current = null;
      },
    });

    if (!recognizer) {
      setShowKeyboardInput(true);
      return;
    }

    recognizerRef.current = recognizer;
    setIsListening(true);
    recognizer.start();
  }, [speechSupported]);

  const handleClose = useCallback(() => {
    stopListening();
    stopKaiDialogue();
    soundFX.playClick();
    onClose();
  }, [onClose, stopListening]);

  // Al abrir: resetear estado, ocultar botones flotantes y arrancar escucha automática
  useEffect(() => {
    if (!isOpen) return;

    setTranscript('');
    transcriptRef.current = '';
    setParsedItems([]);
    setDetectedFocus(null);
    setDetectedFinance([]);
    setDiagnosticReport(null);
    setShowPlannerActions(false);
    setKaiReply(null);
    setErrorMsg(null);
    setInjectedSuccess(null);
    setIsAnalyzing(false);
    setShowKeyboardInput(!speechSupported);
    setConversationHistory([]);

    document.body.classList.add('modal-open-hide-floating');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Auto-escucha natural apenas aparece KAI
    let autoStartTimer: number | undefined;
    if (speechSupported) {
      autoStartTimer = window.setTimeout(() => {
        startListening();
      }, 180);
    }

    return () => {
      if (autoStartTimer) clearTimeout(autoStartTimer);
      document.body.classList.remove('modal-open-hide-floating');
      window.removeEventListener('keydown', handleKeyDown);
      if (recognizerRef.current) {
        recognizerRef.current.abort();
        recognizerRef.current = null;
      }
      stopKaiDialogue();
    };
  }, [isOpen, speechSupported, handleClose, startListening]);

  const speakResponse = useCallback(
    (text: string) => {
      if (!soundEnabled || !text) return;
      setIsSpeakingReply(true);
      speakKaiDialogue(text, kaiMood, () => setIsSpeakingReply(false));
    },
    [soundEnabled, kaiMood]
  );

  const runAnalysis = useCallback(
    async (textToAnalyze?: string) => {
      const text = (textToAnalyze ?? transcriptRef.current).trim();
      if (!text) return;

      setErrorMsg(null);
      setDetectedFocus(null);
      setDetectedFinance([]);
      setParsedItems([]);
      setDiagnosticReport(null);
      setShowPlannerActions(false);
      setInjectedSuccess(null);
      setIsAnalyzing(true);
      soundFX.playClick();

      const intent = classifyVoiceIntent(text);

      try {
        // 1. Foco / Pomodoro
        if (intent === 'focus') {
          const focusIntent = detectVoiceFocusIntent(text);
          if (focusIntent) {
            setDetectedFocus(focusIntent);
            const reply = `Listo para enfocar ${focusIntent.durationMinutes} minutos en "${focusIntent.title}".`;
            setKaiReply(reply);
            triggerHaptic(20);
            speakResponse(reply);
            return;
          }
        }

        // 2. Diagnóstico completo integrado en Háblame
        if (intent === 'diagnostic') {
          const diag = await generateNeuralAnalysisAI(
            stats,
            archetype,
            habitMastery,
            todayTasks,
            reflections,
            tasksByDate
          );
          setDiagnosticReport({ text: diag.analysis, source: diag.source });
          const voiceSummary = summarizeDiagnosticForVoice(diag.analysis, stats, todayTasks);
          setKaiReply(voiceSummary);
          triggerHaptic(20);
          speakResponse(voiceSummary);
          return;
        }

        // 3. Planificador masivo / Plantillas de rutina
        if (intent === 'planner') {
          setShowPlannerActions(true);
          const reply = 'Puedo abrir tu planificador visual con tu petición lista o mostrarte tus plantillas de rutina.';
          setKaiReply(reply);
          triggerHaptic(20);
          speakResponse(reply);
          return;
        }

        // 3.5. Acción directa sobre tarea existente (completar, borrar, mover) con CONFIRMACIÓN OBLIGATORIA
        if (intent === 'direct_action') {
          const directAction = detectVoiceDirectAction(text, todayTasks);
          if (directAction && directAction.matchedTaskId) {
            setDetectedDirectAction(directAction);
            let actionQuestion = '';
            if (directAction.type === 'complete_task') {
              actionQuestion = `¿Confirmas marcar como completada "${directAction.matchedTaskTitle}"?`;
            } else if (directAction.type === 'delete_task') {
              actionQuestion = `¿Confirmas eliminar la tarea "${directAction.matchedTaskTitle}"?`;
            } else {
              actionQuestion = `¿Confirmas mover "${directAction.matchedTaskTitle}" a ${directAction.newTimeBlock}?`;
            }
            setKaiReply(actionQuestion);
            triggerHaptic(25);
            speakResponse(actionQuestion);
            return;
          }
        }

        // 4. Conversación natural / Coach / "¿Por qué tarea empiezo?"
        if (intent === 'conversation') {
          // Extraer contexto enriquecido para KAI: notas de tareas, memorias, finanzas y reflexiones
          const recentTaskNotes = todayTasks
            .filter((t) => t?.notes && t.notes.trim())
            .map((t) => `[${t.title}]: ${t.notes!.trim()}`);
          const recentMemories = Array.isArray(stats?.kaiMemoryLog)
            ? stats.kaiMemoryLog.slice(0, 5).map((m: any) => m.content)
            : [];
          const recentFinanceTotal = expenses.slice(-5).reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
          const financeSummary = expenses.length > 0 ? `Últimos gastos suman aprox ${formatMoney(recentFinanceTotal, currencySymbol)}` : undefined;
          const reflectionToday = reflections[currentViewDate];

          const convo = await askKaiConversationAI({
            message: text,
            kaiName,
            stats,
            todayTasks,
            history: conversationHistory,
            recentNotes: recentTaskNotes,
            recentMemories,
            financialSummary: financeSummary,
            reflectionContext: reflectionToday,
          });
          setKaiReply(convo.reply);
          setConversationHistory((prev) => [
            ...prev.slice(-6),
            { role: 'user', text },
            { role: 'kai', text: convo.reply },
          ]);
          triggerHaptic(18);
          speakResponse(convo.reply);
          return;
        }

        // 5. Acciones mixtas: Finanzas + Tareas y Hábitos 21/66 en la misma frase
        const { financeText, taskText } = splitMixedVoiceDictation(text);

        const [finRes, taskRes] = await Promise.all([
          financeText ? parseVoiceFinanceWithAI({ transcript: financeText, kaiName }) : Promise.resolve(null),
          taskText
            ? parseVoiceTranscriptToItems({
                transcript: taskText,
                currentDateLabel: formatDateForDisplay(currentViewDate),
                kaiName,
              })
            : Promise.resolve(null),
        ]);

        const foundFinance = finRes?.entries || [];
        const foundTasks = taskRes?.items || [];

        setDetectedFinance(foundFinance);
        setParsedItems(foundTasks);

        if (foundFinance.length === 0 && foundTasks.length === 0) {
          // Si no detectó acciones estructuradas, responder conversacionalmente con contexto
          const recentTaskNotes = todayTasks
            .filter((t) => t?.notes && t.notes.trim())
            .map((t) => `[${t.title}]: ${t.notes!.trim()}`);
          const recentMemories = Array.isArray(stats?.kaiMemoryLog)
            ? stats.kaiMemoryLog.slice(0, 5).map((m: any) => m.content)
            : [];
          const recentFinanceTotal = expenses.slice(-5).reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
          const financeSummary = expenses.length > 0 ? `Últimos gastos suman aprox ${formatMoney(recentFinanceTotal, currencySymbol)}` : undefined;

          const convo = await askKaiConversationAI({
            message: text,
            kaiName,
            stats,
            todayTasks,
            history: conversationHistory,
            recentNotes: recentTaskNotes,
            recentMemories,
            financialSummary: financeSummary,
            reflectionContext: reflections[currentViewDate],
          });
          setKaiReply(convo.reply);
          speakResponse(convo.reply);
        } else {
          const combinedReply =
            foundFinance.length > 0 && foundTasks.length > 0
              ? `Listo. Separé ${foundFinance.length} ${foundFinance.length === 1 ? 'movimiento' : 'movimientos'} y ${foundTasks.length} ${foundTasks.length === 1 ? 'objetivo' : 'objetivos'} para confirmar.`
              : (finRes?.kaiReply || taskRes?.kaiReply || 'Listo, todo preparado para confirmar.');

          setKaiReply(combinedReply);
          triggerHaptic(20);
          speakResponse(combinedReply);
        }
      } catch (err) {
        console.error('[Hablame] Error procesando:', err);
        setErrorMsg('No pude procesar eso ahora mismo. Intenta hablar o escribir de nuevo.');
      } finally {
        setIsAnalyzing(false);
      }
    },
    [
      stats,
      archetype,
      habitMastery,
      todayTasks,
      reflections,
      tasksByDate,
      kaiName,
      conversationHistory,
      currentViewDate,
      speakResponse,
    ]
  );

  // Tocar a KAI (o el botón central): si está escuchando, detiene y procesa; si no, vuelve a escuchar
  const handleTapKai = () => {
    if (isAnalyzing) return;
    soundFX.playClick();
    triggerHaptic(18);

    if (isListening) {
      stopListening();
      setTimeout(() => {
        if (transcriptRef.current.trim().length >= 2) {
          void runAnalysis(transcriptRef.current);
        }
      }, 260);
      return;
    }

    // Nuevo turno de voz
    setTranscript('');
    transcriptRef.current = '';
    startListening();
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

  const handleConfirmDirectAction = () => {
    if (!detectedDirectAction || !detectedDirectAction.matchedTaskId) return;
    const { type, matchedTaskId, matchedTaskTitle, newTimeBlock } = detectedDirectAction;
    soundFX.playClick();
    triggerHaptic([25, 40]);

    if (type === 'complete_task') {
      toggleTaskCompletion(currentViewDate, matchedTaskId);
      soundFX.playTaskComplete();
      const msg = `¡Listo! Marqué como completada "${matchedTaskTitle}".`;
      setInjectedSuccess(msg);
      speakResponse(msg);
    } else if (type === 'delete_task') {
      deleteTask(currentViewDate, matchedTaskId);
      const msg = `Eliminé la tarea "${matchedTaskTitle}".`;
      setInjectedSuccess(msg);
      speakResponse(msg);
    } else if (type === 'reschedule_task') {
      updateTask(currentViewDate, matchedTaskId, { timeBlock: newTimeBlock });
      soundFX.playLevelUp();
      const msg = `Reprogramé "${matchedTaskTitle}" para las ${newTimeBlock}.`;
      setInjectedSuccess(msg);
      speakResponse(msg);
    }

    setDetectedDirectAction(null);
    setTimeout(() => onClose(), 1200);
  };

  const handleCancelDirectAction = () => {
    soundFX.playClick();
    setDetectedDirectAction(null);
    setKaiReply('Acción cancelada. Seguimos enfocados.');
  };

  const handleUpdateTitle = (id: string, title: string) => {
    setParsedItems((prev) => prev.map((it) => (it.id === id ? { ...it, title } : it)));
  };

  const handleRemoveItem = (id: string) => {
    soundFX.playClick();
    setParsedItems((prev) => prev.filter((it) => it.id !== id));
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
    const summaryText = `Listo, agregué ${summaryParts.join(' y ')} a tu agenda.`;

    addFloatingEffect({
      x: typeof window !== 'undefined' ? window.innerWidth / 2 : 200,
      y: typeof window !== 'undefined' ? window.innerHeight * 0.25 : 140,
      text: `+${validItems.length} en tu agenda`,
      type: 'custom',
      colorClass: 'text-cyan-300',
    });

    setParsedItems([]);
    setInjectedSuccess(summaryText);
    speakResponse(summaryText);

    if (detectedFinance.length === 0) {
      setTimeout(() => onClose(), 950);
    }
  };

  const hasAnyOutput =
    Boolean(kaiReply) ||
    parsedItems.length > 0 ||
    detectedFinance.length > 0 ||
    Boolean(detectedFocus) ||
    Boolean(diagnosticReport) ||
    showPlannerActions;

  if (typeof document === 'undefined') return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Háblame con ${kaiName}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[175] flex flex-col items-center justify-between p-4 sm:p-6 bg-[#030712]/84 backdrop-blur-xl overflow-hidden font-sans portal-modal-root text-white"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        {/* Resplandor ambiental ultra sutil */}
        <div
          data-ambient-glow="true"
          className="pointer-events-none fixed inset-0 opacity-35"
          style={{
            background:
              'radial-gradient(circle at 50% 34%, rgba(var(--aura-glow-rgb, 0, 240, 255), 0.22) 0%, transparent 55%)',
          }}
        />

        {/* Barra superior mínima: nombre + cierre discreto */}
        <div className="w-full max-w-xl flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-300/80">
            <span
              className={`w-2 h-2 rounded-full transition-colors ${
                isListening
                  ? 'bg-fuchsia-400 animate-pulse'
                  : isAnalyzing
                    ? 'aura-bg-primary animate-ping'
                    : 'bg-white/30'
              }`}
            />
            <span className="font-medium tracking-wide">{kaiName}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 text-[11px]">
              {isListening ? 'Escuchando' : isAnalyzing ? 'Pensando...' : isSpeakingReply ? 'Hablando' : 'En espera'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
            aria-label="Cerrar Háblame"
            title="Cerrar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ESCENARIO CENTRAL: KAI VIVO + SUBTÍTULO + RESPUESTAS DE CRISTAL */}
        <div
          className="flex-1 w-full max-w-xl flex flex-col items-center justify-center gap-5 overflow-y-auto py-4 px-1 custom-scrollbar relative z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* KAI Protagonista con Ondas Orgánicas */}
          <div className="relative flex flex-col items-center justify-center shrink-0 mt-2">
            <div className="relative flex items-center justify-center">
              {isListening && (
                <>
                  <motion.span
                    animate={{ scale: [1, 1.55, 1], opacity: [0.35, 0, 0.35] }}
                    transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute w-32 h-32 rounded-full pointer-events-none"
                    style={{
                      border: '1.5px solid var(--aura-color-1, #00f0ff)',
                    }}
                  />
                  <motion.span
                    animate={{ scale: [1, 1.9, 1], opacity: [0.22, 0, 0.22] }}
                    transition={{ duration: 2.1, repeat: Infinity, delay: 0.65, ease: 'easeInOut' }}
                    className="absolute w-32 h-32 rounded-full pointer-events-none"
                    style={{
                      border: '1px solid var(--aura-color-1, #00f0ff)',
                    }}
                  />
                </>
              )}

              {isSpeakingReply && !isListening && (
                <motion.span
                  data-ambient-glow="true"
                  animate={{ scale: [1, 1.25, 1], opacity: [0.28, 0.08, 0.28] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute w-32 h-32 rounded-full blur-xl pointer-events-none"
                  style={{ backgroundColor: 'rgba(var(--aura-glow-rgb, 0, 240, 255), 0.22)' }}
                />
              )}

              <motion.button
                type="button"
                onClick={handleTapKai}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                animate={{
                  scale: isListening ? [1, 1.05, 1] : isAnalyzing ? 0.98 : 1,
                }}
                transition={
                  isListening
                    ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 0.2 }
                }
                className="relative z-10 p-3 rounded-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                aria-label={isListening ? 'Tocar a KAI para enviar lo que dijiste' : 'Tocar a KAI para hablar'}
                title={isListening ? 'Toca a KAI al terminar de hablar' : 'Toca a KAI para volver a hablar'}
              >
                <div data-preserve-optic="true">
                  <HoloCompanion
                    archetype={archetype}
                    size={hasAnyOutput ? 86 : 114}
                    interactive={false}
                    isProjecting={true}
                    isSpeaking={isSpeakingReply}
                    auraState={
                      injectedSuccess
                        ? 'victory'
                        : isListening || isAnalyzing
                          ? 'focus_trance'
                          : 'normal'
                    }
                  />
                </div>
              </motion.button>
            </div>

            {/* Indicador visual suave debajo de KAI */}
            <div className="mt-2 min-h-[24px] flex items-center justify-center">
              {isListening ? (
                <div className="flex items-center gap-2 text-xs text-slate-300/90">
                  <span className="inline-flex items-end gap-[3px] h-3">
                    {[0, 1, 2, 3].map((bar) => (
                      <motion.span
                        key={bar}
                        animate={{ height: ['25%', '100%', '35%'] }}
                        transition={{ duration: 0.55, repeat: Infinity, delay: bar * 0.1 }}
                        className="w-[2.5px] rounded-full"
                        style={{ backgroundColor: 'var(--aura-color-1, #00f0ff)' }}
                      />
                    ))}
                  </span>
                  <span>
                    {transcript.trim()
                      ? 'Toca a KAI cuando termines'
                      : 'Te escucho...'}
                  </span>
                </div>
              ) : isAnalyzing ? (
                <div className="flex items-center gap-1.5 text-xs aura-text-primary">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>{kaiName} está pensando...</span>
                </div>
              ) : (
                <span className="text-[11.5px] text-slate-400">
                  Toca a {kaiName} para hablarle
                </span>
              )}
            </div>
          </div>

          {/* Subtítulo flotante con lo que vas diciendo */}
          {transcript && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm sm:text-base font-normal text-white/90 max-w-md leading-relaxed px-3"
            >
              “{transcript}”
            </motion.p>
          )}

          {/* Sugerencias discretas solo cuando no hay texto ni resultado aún */}
          {!transcript && !hasAnyOutput && !isAnalyzing && (
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-md pt-1">
              {QUICK_SUGGESTIONS.map((sample, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    stopListening();
                    setTranscript(sample);
                    transcriptRef.current = sample;
                    void runAnalysis(sample);
                  }}
                  className="px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-[11.5px] text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
                >
                  {sample}
                </button>
              ))}
            </div>
          )}

          {/* Error discreto */}
          {errorMsg && (
            <div className="w-full max-w-md px-3.5 py-2.5 rounded-2xl bg-rose-950/50 border border-rose-500/35 text-rose-200 text-xs text-center">
              {errorMsg}
            </div>
          )}

          {/* Confirmación de éxito */}
          {injectedSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md px-4 py-2.5 rounded-2xl bg-emerald-950/60 border border-emerald-400/45 text-emerald-200 flex items-center justify-center gap-2 text-xs font-medium"
            >
              <Check className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{injectedSuccess}</span>
            </motion.div>
          )}

          {/* CÁPSULA DE RESPUESTA DE KAI */}
          {kaiReply && !injectedSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md px-4 py-3 rounded-2xl bg-[#040a1a]/[0.94] border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.45)] flex items-start gap-3"
            >
              <span
                className="w-[2px] self-stretch rounded-full shrink-0"
                style={{ backgroundColor: 'var(--aura-color-1, #00f0ff)' }}
              />
              <p className="text-[13px] text-slate-100 leading-relaxed flex-1">
                {kaiReply}
              </p>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  speakResponse(kaiReply);
                }}
                className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.14] aura-text-primary flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                title="Volver a escuchar"
                aria-label="Volver a escuchar a KAI"
              >
                <Volume2 className={`w-3.5 h-3.5 ${isSpeakingReply ? 'animate-bounce text-white' : ''}`} />
              </button>
            </motion.div>
          )}

          {/* DIAGNÓSTICO COMPLETO INTEGRADO (sin abrir modal duplicado) */}
          {diagnosticReport && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md p-4 rounded-2xl bg-[#040a1a]/[0.94] border border-white/10 space-y-2.5 max-h-[34vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
                <div className="flex items-center gap-1.5 text-xs font-semibold aura-text-primary">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Diagnóstico de tu progreso</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    navigator.clipboard?.writeText(diagnosticReport.text).catch(() => {});
                    setCopiedDiagnostic(true);
                    setTimeout(() => setCopiedDiagnostic(false), 2000);
                  }}
                  className="px-2 py-1 rounded-lg bg-white/[0.05] hover:bg-white/10 text-[10.5px] text-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedDiagnostic ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedDiagnostic ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
              <div className="space-y-1">{renderDiagnosticMarkdown(diagnosticReport.text)}</div>
            </motion.div>
          )}

          {/* ACCESOS CONTEXTUALES A PLANIFICADOR / PLANTILLAS (solo si lo pediste) */}
          {showPlannerActions && (
            <div className="w-full max-w-md flex flex-wrap items-center justify-center gap-2">
              {onOpenOracleWithPrompt && (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    const p = transcriptRef.current.trim();
                    onClose();
                    onOpenOracleWithPrompt(p || undefined);
                  }}
                  className="chicle-btn px-4 py-2 rounded-xl aura-bg-soft border text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Abrir Planificador Visual</span>
                </button>
              )}
              {onOpenTemplates && (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    onClose();
                    onOpenTemplates();
                  }}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 text-slate-200 text-xs font-medium cursor-pointer transition-all"
                >
                  Ver Plantillas de Rutina
                </button>
              )}
            </div>
          )}

          {/* ACCIÓN DIRECTA SOBRE TAREA CON CONFIRMACIÓN */}
          {detectedDirectAction && detectedDirectAction.matchedTaskId && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md p-4 rounded-2xl bg-[#040a1a]/[0.96] border border-cyan-400/40 shadow-[0_12px_36px_rgba(0,0,0,0.55),0_0_24px_rgba(0,240,255,0.15)] space-y-3"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 font-bold">
                  Confirmación requerida por {kaiName}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Acción:</span>
                  <span className="font-anton uppercase tracking-wider text-white">
                    {detectedDirectAction.type === 'complete_task'
                      ? '✓ Completar Tarea'
                      : detectedDirectAction.type === 'delete_task'
                      ? '🗑️ Eliminar Tarea'
                      : '⏰ Reprogramar Hora'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Objetivo:</span>
                  <span className="font-semibold text-cyan-200 truncate max-w-[220px]">
                    {detectedDirectAction.matchedTaskTitle}
                  </span>
                </div>
                {detectedDirectAction.newTimeBlock && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Nueva Hora:</span>
                    <span className="font-mono text-amber-300 font-bold">
                      {detectedDirectAction.newTimeBlock}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancelDirectAction}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-slate-300 hover:text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDirectAction}
                  className="chicle-btn px-4 py-2 rounded-xl aura-btn-gradient optic-active-card text-xs font-anton tracking-wider uppercase cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirmar Acción</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* COMANDO DE FOCO / POMODORO */}
          {detectedFocus && (
            <div className="w-full max-w-md p-3.5 rounded-2xl bg-[#040a1a]/[0.94] border aura-border-subtle flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10.5px] aura-text-primary font-medium block font-mono tabular-nums">
                  Bloque de foco · {detectedFocus.durationMinutes} min
                </span>
                <p className="text-sm font-semibold text-white truncate">{detectedFocus.title}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  triggerHaptic([20, 30]);
                  handleOpenPomodoroForTask(
                    detectedFocus.title,
                    detectedFocus.category,
                    detectedFocus.durationMinutes
                  );
                  onClose();
                }}
                className="chicle-btn px-3.5 py-2 rounded-xl aura-btn-gradient optic-active-card text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Iniciar</span>
              </button>
            </div>
          )}

          {/* MOVIMIENTOS FINANCIEROS DETECTADOS */}
          {detectedFinance.length > 0 && (
            <div className="w-full max-w-md p-3.5 rounded-2xl bg-[#040a1a]/[0.94] border border-emerald-400/35 space-y-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-300">
                <Wallet className="w-3.5 h-3.5" />
                <span>Tesorería ({detectedFinance.length})</span>
              </div>
              <div className="space-y-1.5">
                {detectedFinance.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-white truncate block">{entry.description}</span>
                      <span className="text-[10px] text-slate-400">{entry.category}</span>
                    </div>
                    <span className={`font-semibold text-xs shrink-0 ${entry.type === 'income' ? 'text-emerald-300' : 'text-orange-300'}`}>
                      {entry.type === 'income' ? '+' : '-'}{formatMoney(entry.amount, currencySymbol)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDetectedFinance((prev) => prev.filter((x) => x.id !== entry.id))}
                      className="text-slate-400 hover:text-rose-300 p-0.5 cursor-pointer"
                      aria-label="Quitar movimiento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  soundFX.playCoin();
                  triggerHaptic([20, 35]);
                  const nowIso = new Date().toISOString();
                  const nowTs = Date.now();
                  const txs: FinancialTransaction[] = detectedFinance.map((entry, idx) => ({
                    id: `tx-voice-hub-${nowTs}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
                    date: currentViewDate,
                    type: entry.type,
                    description: entry.description,
                    amount: entry.amount,
                    category: entry.category,
                    createdAt: nowIso,
                  }));
                  setExpenses((prev) => [...txs, ...prev]);
                  const msg = `Listo, registré ${txs.length} ${txs.length === 1 ? 'movimiento' : 'movimientos'} en tus finanzas.`;
                  setDetectedFinance([]);
                  if (parsedItems.length === 0) {
                    setInjectedSuccess(msg);
                    speakResponse(msg);
                    setTimeout(() => onClose(), 900);
                  } else {
                    addFloatingEffect({
                      x: typeof window !== 'undefined' ? window.innerWidth / 2 : 200,
                      y: typeof window !== 'undefined' ? window.innerHeight * 0.25 : 140,
                      text: `+${txs.length} en Finanzas`,
                      type: 'coins',
                    });
                    speakResponse(msg);
                  }
                }}
                className="w-full py-2 rounded-full bg-emerald-400 hover:bg-emerald-300 text-[#020612] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Guardar en Finanzas</span>
              </button>
            </div>
          )}

          {/* TAREAS Y HÁBITOS DETECTADOS */}
          {parsedItems.length > 0 && (
            <div className="w-full max-w-md space-y-2">
              {parsedItems.map((item) => {
                const isHabit = item.kind === 'habit';
                const targetDateStr = item.targetDateOffset > 0
                  ? addDaysToDateString(currentViewDate, item.targetDateOffset)
                  : currentViewDate;
                const dateLabel =
                  item.targetDateOffset === 0
                    ? 'Hoy'
                    : item.targetDateOffset === 1
                      ? 'Mañana'
                      : formatDateForDisplay(targetDateStr);

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-[#040a1a]/[0.94] border border-white/10 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm leading-none shrink-0" aria-hidden="true">
                        {item.quickIcon}
                      </span>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleUpdateTitle(item.id, e.target.value)}
                        className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm font-medium text-white border-b border-transparent focus:border-white/40 outline-none py-0.5"
                        aria-label="Título de la misión"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 rounded-full text-slate-400 hover:text-rose-300 hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                        aria-label="Descartar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleToggleItemKind(item.id)}
                        className={`px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 cursor-pointer transition-all ${
                          isHabit
                            ? 'bg-purple-500/20 border-purple-400/45 text-purple-200'
                            : 'aura-bg-soft'
                        }`}
                        title="Toca para alternar entre Tarea y Hábito 21/66"
                      >
                        {isHabit ? <Flame className="w-2.5 h-2.5" /> : <Zap className="w-2.5 h-2.5" />}
                        <span>{isHabit ? 'Hábito 21/66' : 'Tarea'}</span>
                      </button>

                      <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300">
                        {CATEGORY_LABELS[item.category] || item.category}
                      </span>

                      {item.timeBlock && (
                        <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-sky-200 flex items-center gap-1 font-mono tabular-nums">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{item.timeBlock}</span>
                        </span>
                      )}

                      {!isHabit && (
                        <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-amber-200 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{dateLabel}</span>
                        </span>
                      )}

                      {isHabit && item.targetCount && item.targetCount > 1 && (
                        <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-emerald-200 font-mono tabular-nums">
                          {item.targetCount} {item.unit || 'veces'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleInjectToAgenda}
                className="chicle-btn w-full py-2.5 rounded-xl aura-btn-gradient optic-active-card text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>
                  Añadir {parsedItems.length} {parsedItems.length === 1 ? 'a mi agenda' : 'elementos a mi agenda'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* BARRA INFERIOR MINIMALISTA: Micrófono + Espacio para escribir */}
        <div
          className="w-full max-w-md flex flex-col items-center gap-2.5 relative z-10 shrink-0 pb-1"
          onClick={(e) => e.stopPropagation()}
        >
          {showKeyboardInput && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                stopListening();
                if (transcript.trim()) {
                  void runAnalysis(transcript);
                }
              }}
              className="w-full flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#040a1a]/[0.95] border border-white/15 focus-within:border-white/35 shadow-[0_8px_28px_rgba(0,0,0,0.45)]"
            >
              <input
                ref={inputRef}
                type="text"
                value={transcript}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  transcriptRef.current = e.target.value;
                }}
                placeholder={`Escríbele a ${kaiName}...`}
                className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 outline-none"
              />
              <button
                type="submit"
                disabled={isAnalyzing || !transcript.trim()}
                className="w-8 h-8 rounded-full aura-bg-primary disabled:bg-white/10 disabled:text-slate-500 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
                aria-label="Enviar a KAI"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          <div className="flex items-center gap-2.5">
            {speechSupported && (
              <button
                type="button"
                onClick={handleTapKai}
                disabled={isAnalyzing}
                className={`h-11 px-5 rounded-full border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                  isListening
                    ? 'bg-rose-500/20 border-rose-400/60 text-rose-200 optic-active-card'
                    : 'bg-[#040a1a]/90 hover:bg-white/[0.12] border-white/15 text-white'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 aura-text-primary" />}
                <span>{isListening ? 'Listo, responder' : 'Hablar'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                if (isListening) stopListening();
                setShowKeyboardInput((prev) => {
                  const next = !prev;
                  if (next) setTimeout(() => inputRef.current?.focus(), 60);
                  return next;
                });
              }}
              className={`h-11 px-4 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                showKeyboardInput
                  ? 'aura-bg-soft optic-active-card'
                  : 'bg-[#040a1a]/90 hover:bg-white/[0.12] border-white/10 text-slate-300 hover:text-white'
              }`}
              aria-label="Escribir en lugar de hablar"
            >
              <Keyboard className="w-4 h-4" />
              <span>Escribir</span>
            </button>
          </div>
        </div>
      </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default VoiceDictationModal;
