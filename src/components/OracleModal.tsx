import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from './common/Icon';
import { CustomHabit, TaskItem, TaskCategory } from '../types';
import * as gameEngine from '../engine/gameEngine';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTaskStore } from '../store/useTaskStore';
import { useAppStore } from '../store/useAppStore';
import { parseDays } from '../data/defaults';
import { getTodayDateString, addDaysToDateString, parseLocalDate } from '../utils/date';
import { soundFX } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { 
  normalizeTimeBlock, sortByChronologicalTime, detectTimeOverlap, 
  synthesizeHabitBlocks, diagnoseSchedule, resolveConflictQuickFix, 
  nudgeTimeBlock, ScheduleConflict, ScheduleGap, isQuickMicroHabit,
  autoArrangeSchedule, cleanScheduleTitle
} from '../utils/timeUtils';
const TacticalDiagnosticPanel = lazy(() => import('./TacticalDiagnosticPanel').then(m => ({ default: m.TacticalDiagnosticPanel })));
import { OracleGuidedWizard } from './oracle/OracleGuidedWizard';
import { OracleTemplates } from './oracle/OracleTemplates';
import { OracleTheatricalLoader } from './oracle/OracleTheatricalLoader';
import { renderHabitIcon } from './task-list/QuickHabitsWidget';

import { isDuplicateActivity, deduplicateHabits, deduplicateTasksForDay, sanitizeTasksByDate } from '../utils/taskDeduplication';
import { generateProceduralSchedule, organizeExistingDayTasks } from '../utils/proceduralHeuristics';
import { 
  generateScheduleFrontend, 
  hasActiveGeminiKey, 
  getEffectiveGeminiApiKey, 
  getCustomUserApiKey,
  saveGeminiApiKey, 
  removeGeminiApiKey 
} from '../services/aiService';
import { useUIStore } from '../store/useUIStore';
import { safeLogEvent } from '../firebase';

interface OracleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

export const OracleModal: React.FC<OracleModalProps> = ({ isOpen, onClose, initialPrompt }) => {
  const [activeTab, setActiveTab] = useState<'wizard' | 'prompt' | 'templates'>('wizard');
  const [prompt, setPrompt] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'master_blocks' | 'detailed'>('master_blocks');
  const [injectMode, setInjectMode] = useState<'replace_pending' | 'merge'>('replace_pending');
  const [enginePreference, setEnginePreference] = useState<'ai' | 'local'>(() => {
    // Leer preferencia guardada del usuario
    try {
      const saved = localStorage.getItem('kai_oracle_engine_preference');
      if (saved === 'ai' || saved === 'local') return saved;
    } catch {}
    return hasActiveGeminiKey() ? 'ai' : 'local';
  });
  const [showPromptHelp, setShowPromptHelp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [suggestedHabits, setSuggestedHabits] = useState<CustomHabit[] | null>(null);
  const [previewDay, setPreviewDay] = useState<number | 'all'>('all');
  
  // Inline editing state for individual suggested habits
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTimeBlock, setEditTimeBlock] = useState('');
  const [editStartTime, setEditStartTime] = useState('08:00');
  const [editEndTime, setEditEndTime] = useState('09:00');
  const [editCategory, setEditCategory] = useState<TaskCategory>('rutina');
  const [editIcon, setEditIcon] = useState<string>('⚡');
  const [editFreq, setEditFreq] = useState<'daily' | 'specific_days'>('daily');
  const [editDays, setEditDays] = useState<number[]>([1, 2, 3, 4, 5]);

  // Gemini API Key state inside Oracle
  const [isKeyConfigured, setIsKeyConfigured] = useState(() => hasActiveGeminiKey());
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [inputKey, setInputKey] = useState(() => getCustomUserApiKey() || '');
  const [keySavedToast, setKeySavedToast] = useState<string | null>(null);
  const [showKeyText, setShowKeyText] = useState(false);

  // ORA-01 & ORA-04: Snapshot rollback and transparent tactical generation source
  const [hasUndoSnapshot, setHasUndoSnapshot] = useState(false);
  const [generationSource, setGenerationSource] = useState<'ai' | 'local'>('ai');

  const stats = usePlayerStore(state => state.stats);
  const currentViewDate = useTaskStore(state => state.currentViewDate);
  const tasksByDate = useTaskStore(state => state.tasksByDate);

  const currentDayAgendaTasks = useMemo(() => {
    const list = tasksByDate[currentViewDate || getTodayDateString()] || [];
    return list.filter(t => t && t.title && !t.isQuickHabit && !t.isTracked2166 && t.category !== 'habito' && !String(t.id || '').includes('habit-'));
  }, [tasksByDate, currentViewDate]);

  useEffect(() => {
    if (isOpen) {
      soundFX.playOracleAtmosphere();
      const active = hasActiveGeminiKey();
      setIsKeyConfigured(active);
      setInputKey(getCustomUserApiKey() || '');
      // Solo forzar 'local' si no hay clave Gemini Y no hay preferencia guardada
      if (!active && !localStorage.getItem('kai_oracle_engine_preference')) {
        setEnginePreference('local');
      }

      // ORA-01: Verificar si existe un respaldo previo para rollback
      try {
        const snapRaw = localStorage.getItem('taskquest_oracle_last_snapshot');
        if (snapRaw) {
          const parsed = JSON.parse(snapRaw);
          if (parsed && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            setHasUndoSnapshot(true);
          } else {
            localStorage.removeItem('taskquest_oracle_last_snapshot');
            setHasUndoSnapshot(false);
          }
        } else {
          setHasUndoSnapshot(false);
        }
      } catch {
        setHasUndoSnapshot(false);
      }

      if (initialPrompt) {
        setPrompt(initialPrompt.slice(0, 10000));
        setActiveTab('prompt');
      }
    }
  }, [isOpen, initialPrompt]);

  const handleUndoInjection = () => {
    soundFX.playClick();
    try {
      const snapRaw = localStorage.getItem('taskquest_oracle_last_snapshot');
      if (!snapRaw) return;
      const parsed = JSON.parse(snapRaw);
      if (parsed.tasksByDate && parsed.customHabits) {
        const taskStore = useTaskStore.getState();
        taskStore.setTasksByDate(parsed.tasksByDate);
        taskStore.setCustomHabits(parsed.customHabits);
        localStorage.removeItem('taskquest_oracle_last_snapshot');
        setHasUndoSnapshot(false);
        soundFX.playSubBassConfirm();
        triggerHaptic([30, 50]);
        setNotice("↺ Horario anterior restaurado con éxito desde el respaldo de seguridad.");
      }
    } catch (err) {
      console.error("Error al restaurar snapshot del oráculo:", err);
      setError("No se pudo restaurar el horario previo.");
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('modal-open-hide-floating');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('modal-open-hide-floating');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleAutoOrganizeCurrentDay = async () => {
    soundFX.playClick();
    soundFX.playGlitch();
    triggerHaptic([30, 40, 20]);
    setIsLoading(true);
    setError(null);
    setNotice(null);

    try {
      const taskStore = useTaskStore.getState();
      const dateStr = taskStore.currentViewDate || getTodayDateString();
      const dayTasks = (taskStore.tasksByDate[dateStr] || []).filter(
        t => t && t.title && !t.isQuickHabit && !t.isTracked2166 && t.category !== 'habito' && !String(t.id || '').includes('habit-')
      );

      if (dayTasks.length > 0) {
        const organized = organizeExistingDayTasks(dayTasks, scheduleMode);
        // Send the already-cleaned & consolidated list to Gemini for intelligent scheduling
        const tasksPrompt = organized
          .map(t => `${cleanScheduleTitle(t.title)} [categoría: ${t.category || 'rutina'}]`)
          .join('\n');
        const userContextObj = {
          profession: stats?.profession,
          mantra: stats?.mantra,
          bio: stats?.bio,
          age: stats?.age,
          mainGoal: stats?.mainGoal,
          class: stats?.characterClass,
          rank: stats?.rankTitle,
          name: stats?.fullName
        };
        const dispatchOpts = {
          forceRemoteAi: enginePreference === 'ai',
          forceLocalOnly: enginePreference === 'local',
        };
        try {
          const aiData = await generateScheduleFrontend(
            `Reorganiza y acomoda de forma óptima y sin choques de horario mis siguientes misiones del día en entre 5 y ${scheduleMode === 'master_blocks' ? 7 : 9} bloques:\n${tasksPrompt}`,
            userContextObj,
            [],
            scheduleMode,
            dispatchOpts
          );
          if (Array.isArray(aiData?.habits) && aiData.habits.length > 0) {
            const arranged = autoArrangeSchedule(aiData.habits, scheduleMode, scheduleMode === 'master_blocks' ? 7 : 10);
            setSuggestedHabits(sortByChronologicalTime(arranged) as CustomHabit[]);
            setNotice(aiData.notice || null);
            setGenerationSource(aiData?.source === 'heuristic_engine' ? 'local' : 'ai');
            soundFX.playSubBassConfirm();
            return;
          }
        } catch {
          // Use local organized result
        }

        setSuggestedHabits(sortByChronologicalTime(organized));
        setNotice(null);
        setGenerationSource('local');
        soundFX.playSubBassConfirm();
      } else {
        // No tasks yet: design a balanced day using selected engine
        const userContextObj = {
          profession: stats?.profession,
          mantra: stats?.mantra,
          bio: stats?.bio,
          age: stats?.age,
          mainGoal: stats?.mainGoal,
          class: stats?.characterClass,
          rank: stats?.rankTitle,
          name: stats?.fullName
        };
        const dispatchOpts = {
          forceRemoteAi: enginePreference === 'ai',
          forceLocalOnly: enginePreference === 'local',
        };
        try {
          const aiData = await generateScheduleFrontend(
            'Diseña una agenda diaria equilibrada de alto rendimiento con 6 bloques horarios claros (mañana, mediodía, tarde y noche) sin choques para hoy.',
            userContextObj,
            [],
            scheduleMode,
            dispatchOpts
          );
          if (Array.isArray(aiData?.habits) && aiData.habits.length > 0) {
            const arranged = autoArrangeSchedule(aiData.habits, scheduleMode, scheduleMode === 'master_blocks' ? 7 : 10);
            setSuggestedHabits(sortByChronologicalTime(arranged) as CustomHabit[]);
            setNotice(aiData.notice || null);
            setGenerationSource(aiData?.source === 'heuristic_engine' ? 'local' : 'ai');
            soundFX.playSubBassConfirm();
            return;
          }
        } catch {
          // Fallback below
        }
        const fallback = generateProceduralSchedule('', { profession: stats?.profession }, scheduleMode);
        setSuggestedHabits(sortByChronologicalTime(fallback));
        setNotice(null);
        setGenerationSource('local');
        soundFX.playSubBassConfirm();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (overridePrompt?: unknown) => {
    const rawPrompt = typeof overridePrompt === 'string' ? overridePrompt : prompt;
    const textToUse = String(rawPrompt || '').trim().slice(0, 10000);
    if (!textToUse) {
      soundFX.playClick();
      setError('Escribe o pega tus actividades en el cuadro de texto (o toca "Cargar ejemplo").');
      return;
    }
    if (typeof overridePrompt === 'string' && overridePrompt.trim()) {
      setPrompt(overridePrompt.slice(0, 10000));
    }

    try {
      setIsLoading(true);
      setError(null);
      setNotice(null);
      soundFX.playClick();
      soundFX.playGlitch();
      triggerHaptic([30, 40, 20]);

      const userContextObj = { 
        profession: stats?.profession, 
        mantra: stats?.mantra, 
        bio: stats?.bio, 
        age: stats?.age, 
        mainGoal: stats?.mainGoal, 
        class: stats?.characterClass, 
        rank: stats?.rankTitle, 
        name: stats?.fullName 
      };

      const data = await generateScheduleFrontend(textToUse, userContextObj, [], scheduleMode, {
        forceRemoteAi: enginePreference === 'ai',
        forceLocalOnly: enginePreference === 'local',
      });

      const isLocal = data?.source === 'heuristic_engine';
      setGenerationSource(isLocal ? 'local' : 'ai');
      setNotice(data.notice || null);

      const rawHabits: CustomHabit[] = data.habits || [];
      const arranged = autoArrangeSchedule(rawHabits, scheduleMode, 25);
      const sorted = sortByChronologicalTime(arranged);
      setSuggestedHabits(sorted);
      safeLogEvent('oracle_generation_completed', {
        schedule_mode: scheduleMode,
        engine_preference: enginePreference,
        block_count: sorted.length,
        has_ai_notice: Boolean(data.notice)
      });
      const hasMultiDayVariations = sorted.some(h => h.specificDays && h.specificDays.length > 0 && h.specificDays.length < 5);
      if (hasMultiDayVariations) {
        const activeDayOrder = [1, 2, 3, 4, 5, 6, 0];
        const firstActiveDay = activeDayOrder.find(d =>
          sorted.some(h => {
            const days = h.specificDays ? parseDays(h.specificDays) : [];
            return days.length === 0 || days.length >= 7 || days.includes(d);
          })
        );
        setPreviewDay(firstActiveDay !== undefined ? firstActiveDay : 1);
      } else {
        setPreviewDay('all');
      }
      soundFX.playSubBassConfirm();
    } catch (err: any) {
      console.warn("API request failed, falling back to local procedural heuristics:", err);
      try {
        const fallbackHabits = generateProceduralSchedule(
          textToUse, 
          {
            profession: stats?.profession, 
            mantra: stats?.mantra, 
            bio: stats?.bio, 
            age: stats?.age, 
            mainGoal: stats?.mainGoal, 
            class: stats?.characterClass, 
            rank: stats?.rankTitle, 
            name: stats?.fullName 
          }, 
          scheduleMode
        );
        setNotice("⚠️ No se pudo conectar con Gemini IA; estructuramos tu agenda con el Motor Local.");
        setGenerationSource('local');
        const arranged = autoArrangeSchedule(fallbackHabits, scheduleMode, 25);
        const sorted = sortByChronologicalTime(arranged);
        setSuggestedHabits(sorted);
        const hasMultiDayVariations = sorted.some(h => h.specificDays && h.specificDays.length > 0 && h.specificDays.length < 5);
        setPreviewDay(hasMultiDayVariations ? 1 : 'all');
        soundFX.playSubBassConfirm();
        setError(null);
      } catch (fallbackErr) {
        const errMsg = err.message || 'No se pudo procesar la agenda. Intenta de nuevo.';
        setError(errMsg);
        soundFX.playGlitch();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSynthesizeExisting = () => {
    if (!suggestedHabits || suggestedHabits.length === 0) return;
    soundFX.playClick();
    const synthesized = synthesizeHabitBlocks(suggestedHabits);
    const seenSynthesizedIds = new Set<string>();
    const uniqueSynthesized = synthesized.map((h, idx) => {
      let uniqueId = h.id;
      if (!uniqueId || seenSynthesizedIds.has(uniqueId)) {
        uniqueId = `hab-synth-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`;
      }
      seenSynthesizedIds.add(uniqueId);
      return { ...h, id: uniqueId };
    });
    setSuggestedHabits(sortByChronologicalTime(uniqueSynthesized));
  };

  const handleAddNewManualBlock = () => {
    soundFX.playClick();
    const newId = `manual-block-${Date.now()}`;
    const newBlock: CustomHabit = {
      id: newId,
      title: 'Nueva Tarea / Bloque',
      category: 'rutina',
      timeBlock: '09:00 - 10:00',
      frequencyType: 'daily',
      quickIcon: '⚡',
      xpReward: 25,
      coinReward: 10,
      isTracked2166: false,
      isQuickHabit: false
    };
    const current = suggestedHabits || [];
    const updated = sortByChronologicalTime([...current, newBlock]);
    setSuggestedHabits(updated);
    startEditingHabit(newBlock);
  };

  const startEditingHabit = (habit: CustomHabit) => {
    setEditingId(habit.id);
    setEditTitle(habit.title);
    setEditTimeBlock(habit.timeBlock || '');
    
    // Parse start and end for time inputs
    const parts = (habit.timeBlock || '').split(/[-–—]/).map(s => s.trim());
    if (parts.length >= 2 && parts[0] && parts[1]) {
      setEditStartTime(parts[0]);
      setEditEndTime(parts[1]);
    } else {
      setEditStartTime('09:00');
      setEditEndTime('10:00');
    }

    setEditCategory(habit.category || 'rutina');
    setEditIcon(habit.quickIcon || '⚡');
    const isDaily = habit.frequencyType === 'daily' || !habit.specificDays || habit.specificDays.length === 7;
    setEditFreq(isDaily ? 'daily' : 'specific_days');
    setEditDays(habit.specificDays && habit.specificDays.length > 0 ? habit.specificDays : [1, 2, 3, 4, 5]);
  };

  const saveEditingHabit = () => {
    if (!editingId || !suggestedHabits) return;
    soundFX.playClick();

    let finalBlock = editTimeBlock.trim();
    if (editStartTime && editEndTime) {
      finalBlock = `${editStartTime} - ${editEndTime}`;
    }
    const normalizedTime = normalizeTimeBlock(finalBlock) || finalBlock;

    const updated = suggestedHabits.map(h => {
      if (h.id !== editingId) return h;
      return {
        ...h,
        title: editTitle.trim() || h.title,
        category: editCategory || h.category,
        quickIcon: editIcon || h.quickIcon,
        timeBlock: normalizedTime || undefined,
        frequencyType: editFreq,
        specificDays: editFreq === 'specific_days' ? editDays : undefined
      };
    });
    setSuggestedHabits(sortByChronologicalTime(updated));
    setEditingId(null);
  };

  const toggleEditDay = (day: number) => {
    if (editDays.includes(day)) {
      const next = editDays.filter(d => d !== day);
      if (next.length === 0) {
        setEditFreq('daily');
        setEditDays([0, 1, 2, 3, 4, 5, 6]);
      } else {
        setEditDays(next);
      }
    } else {
      setEditDays([...editDays, day].sort((a, b) => a - b));
    }
  };

  const mapDayToString = (day: number) => {
    return ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][day];
  };

  const handleAcceptSchedule = async () => {
    if (!suggestedHabits || suggestedHabits.length === 0) return;
    
    soundFX.playClick();
    
    const taskStore = useTaskStore.getState();
    const currentDateStr = taskStore.currentViewDate || getTodayDateString();

    // ORA-01: Guardar snapshot de seguridad antes de modificar la agenda para permitir rollback
    try {
      const snapshot = {
        timestamp: Date.now(),
        dateStr: currentDateStr,
        tasksByDate: taskStore.tasksByDate,
        customHabits: taskStore.customHabits
      };
      localStorage.setItem('taskquest_oracle_last_snapshot', JSON.stringify(snapshot));
      setHasUndoSnapshot(true);
    } catch (e) {
      console.warn("No se pudo guardar el snapshot del oráculo:", e);
    }

    // 1. Persist AI-generated routines into customHabits so generateDailyTasks will create them infinitely for all future dates
    const existingCustomHabits = taskStore.customHabits || [];
    const newCustomHabits: CustomHabit[] = suggestedHabits.map((h, idx) => ({
      id: h.id || `hab-ai-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      title: h.title,
      category: h.category === 'habito' ? 'rutina' : h.category,
      description: h.description || '',
      xpReward: h.xpReward || 20,
      coinReward: h.coinReward || 10,
      frequencyType: (h.specificDays && h.specificDays.length > 0 && h.specificDays.length < 7) ? 'specific_days' : 'daily',
      specificDays: h.specificDays,
      timeBlock: normalizeTimeBlock(h.timeBlock) || h.timeBlock,
      isQuickHabit: false,
      isTracked2166: false,
      quickIcon: h.quickIcon
    }));

    const habitMap = new Map<string, CustomHabit>();
    existingCustomHabits.forEach(h => {
      // If replacing pending routines, keep 21/66d quick habits and replace old routine blocks
      if (injectMode === 'merge' || h.isQuickHabit || h.isTracked2166) {
        const daysKey = Array.isArray(h.specificDays) ? h.specificDays.slice().sort().join(',') : 'daily';
        habitMap.set(`${(h.title || '').toLowerCase().trim()}__${h.timeBlock || ''}__${daysKey}`, h);
      }
    });
    newCustomHabits.forEach(h => {
      const daysKey = Array.isArray(h.specificDays) ? h.specificDays.slice().sort().join(',') : 'daily';
      habitMap.set(`${(h.title || '').toLowerCase().trim()}__${h.timeBlock || ''}__${daysKey}`, h);
    });
    const mergedHabits = Array.from(habitMap.values());
    taskStore.setCustomHabits(mergedHabits);

    // Helper to check if a task is a protected 21/66d quick habit
    const quickHabitTitles = new Set(
      existingCustomHabits
        .filter(h => h.isQuickHabit || h.isTracked2166)
        .map(h => (h.title || '').toLowerCase().trim())
    );
    const isProtectedQuickHabit = (t: TaskItem): boolean => {
      if (t.isHabit) return true;
      const norm = (t.title || '').toLowerCase().trim();
      if (quickHabitTitles.has(norm)) return true;
      if (!t.timeBlock && (norm.includes('agua') || norm.includes('hidrat') || norm.includes('vitamina'))) return true;
      return false;
    };

    // 2. Inject into current view date and matching specific days of the active week (-7 to +14 days) for instant UI updates
    const updatedTasksByDate = { ...taskStore.tasksByDate };

    if (injectMode === 'replace_pending') {
      // Cleanly remove uncompleted non-habit tasks in the active window so old Day-1 or unorganized tasks don't clutter the new schedule
      for (let i = -7; i <= 14; i++) {
        const dStr = addDaysToDateString(currentDateStr, i);
        const existingList = updatedTasksByDate[dStr] || [];
        updatedTasksByDate[dStr] = existingList.filter(t => t.completed || isProtectedQuickHabit(t));
      }
    }

    let currentDayInsertedCount = 0;

    suggestedHabits.forEach((h, index) => {
      const parsedDays = h.specificDays !== undefined && h.specificDays !== null ? parseDays(h.specificDays) : [];

      const createDateTask = (dStr: string): TaskItem => ({
        id: `oracle-task-${dStr}-${index}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: h.title,
        category: h.category === 'habito' ? 'rutina' : h.category,
        description: h.description || '',
        xpReward: h.xpReward || 20,
        coinReward: h.coinReward || 10,
        completed: false,
        completedAt: undefined,
        timeBlock: normalizeTimeBlock(h.timeBlock) || h.timeBlock,
        isHabit: false,
        quickIcon: h.quickIcon
      });

      if (parsedDays.length > 0 && parsedDays.length < 7) {
        // Hydrate matching days in full -7..+14 day window
        for (let i = -7; i <= 14; i++) {
          const dStr = addDaysToDateString(currentDateStr, i);
          const dObj = parseLocalDate(dStr);
          if (parsedDays.includes(dObj.getDay())) {
            if (dStr === currentDateStr) currentDayInsertedCount++;
            const dayExisting = (updatedTasksByDate[dStr] || []).filter(
              t => !isDuplicateActivity(t, { title: h.title, timeBlock: h.timeBlock })
            );
            const freshTask = createDateTask(dStr);
            updatedTasksByDate[dStr] = gameEngine.sortTasksChronologically(
              deduplicateTasksForDay([...dayExisting, freshTask])
            );
          }
        }
      } else {
        // Hydrate all days in full -7..+14 day window with date-isolated pending tasks
        for (let i = -7; i <= 14; i++) {
          const dStr = addDaysToDateString(currentDateStr, i);
          if (dStr === currentDateStr) currentDayInsertedCount++;
          const dayExisting = (updatedTasksByDate[dStr] || []).filter(
            t => !isDuplicateActivity(t, { title: h.title, timeBlock: h.timeBlock })
          );
          const freshTask = createDateTask(dStr);
          updatedTasksByDate[dStr] = gameEngine.sortTasksChronologically(
            deduplicateTasksForDay([...dayExisting, freshTask])
          );
        }
      }
    });

    // If all habits were for specific days that don't include currentDateStr (e.g. Mon-Fri schedule created on Sunday),
    // navigate to the first active day in the window so the user sees their organized schedule immediately without polluting their day off!
    if (currentDayInsertedCount === 0 && suggestedHabits.length > 0) {
      for (let i = 1; i <= 7; i++) {
        const candidateDateStr = addDaysToDateString(currentDateStr, i);
        if (updatedTasksByDate[candidateDateStr] && updatedTasksByDate[candidateDateStr].length > 0) {
          taskStore.setCurrentViewDate(candidateDateStr);
          break;
        }
      }
    }

    taskStore.setTasksByDate(sanitizeTasksByDate(updatedTasksByDate));

    setSuggestedHabits(null);
    setPrompt('');
    onClose();
  };

  const handleRemoveHabit = (habitId: string) => {
    if (!suggestedHabits) return;
    setSuggestedHabits(suggestedHabits.filter(h => h.id !== habitId));
  };

  // Check if a habit has time overlaps with any other habit in suggestedHabits
  const hasConflict = (habit: CustomHabit): boolean => {
    if (!suggestedHabits || !habit.timeBlock) return false;
    return suggestedHabits.some(other => other.id !== habit.id && detectTimeOverlap(habit, other));
  };

  const diagnostic = useMemo(() => {
    if (!suggestedHabits || suggestedHabits.length === 0) return null;
    return diagnoseSchedule(suggestedHabits);
  }, [suggestedHabits]);

  const handleQuickFixConflict = (conflict: ScheduleConflict) => {
    if (!suggestedHabits) return;
    soundFX.playClick();
    const updated = resolveConflictQuickFix(suggestedHabits, conflict);
    setSuggestedHabits(sortByChronologicalTime(updated));
  };

  const handleFillGap = (gap: ScheduleGap, title: string, category: TaskCategory, icon: string) => {
    if (!suggestedHabits) return;
    soundFX.playClick();
    const newHabit: CustomHabit = {
      id: `routine-gap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      category: category || 'rutina',
      frequencyType: 'daily',
      timeBlock: `${gap.startTime} - ${gap.endTime}`,
      quickIcon: icon,
      xpReward: 35,
      coinReward: 15,
      isTracked2166: false,
      isQuickHabit: false
    };
    setSuggestedHabits(sortByChronologicalTime([...suggestedHabits, newHabit]));
  };

  const handleNudgeHabit = (habitId: string, shiftMinutes: number, durationMinutes: number = 0) => {
    if (!suggestedHabits) return;
    soundFX.playClick();
    const updated = suggestedHabits.map(h => {
      if (h.id !== habitId) return h;
      const newBlock = nudgeTimeBlock(h.timeBlock, shiftMinutes, durationMinutes);
      return {
        ...h,
        timeBlock: newBlock
      };
    });
    setSuggestedHabits(sortByChronologicalTime(updated));
  };

  const getConflictForHabit = (habitId: string): ScheduleConflict | undefined => {
    if (!diagnostic) return undefined;
    return diagnostic.conflicts.find(c => c.idA === habitId || c.idB === habitId);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
      <motion.div 
        className="fixed inset-0 z-[170] portal-modal-root bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="oracle-modal-title"
          className="relative isolate bg-[#030712]/[0.98] border border-white/10 w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[88vh] text-left"
          initial={{ scale: 0.95, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Micrograno táctil Moxen Vidrio */}
          <span className="vi-grano opacity-5" aria-hidden="true" />

          {/* Filamento especular superior */}
          <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

          {/* Header limpio y directo */}
          <div className="bg-[#040814]/[0.96] p-4 sm:p-5 border-b border-white/10 flex justify-between items-center gap-3 relative z-10">
            <div className="flex items-center gap-3 flex-wrap min-w-0">
              <div className="p-2 rounded-xl aura-bg-soft border aura-border-subtle aura-text-primary aura-glow-subtle shrink-0">
                <Icon name="brain" className="w-5 h-5 aura-text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 id="oracle-modal-title" className="text-base sm:text-lg font-anton uppercase tracking-wider text-white">
                    Asistente IA de Planificación KAI
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setShowKeyInput(!showKeyInput);
                    }}
                    className={`chicle-btn inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold cursor-pointer transition-all ${
                      isKeyConfigured
                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                        : 'bg-white/[0.04] border-white/15 text-slate-300 hover:aura-border-subtle hover:text-white'
                    }`}
                    title={isKeyConfigured ? 'Cambiar o quitar tu clave de Gemini' : 'Conecta tu clave gratuita de Gemini para usar IA'}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isKeyConfigured ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                    <span>{isKeyConfigured ? 'Gemini Conectado' : 'Conectar Gemini (Opcional)'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Arma tu horario semanal o acomoda tus tareas de hoy sin choques.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                triggerHaptic(15);
                onClose();
              }}
              aria-label="Cerrar Asistente IA de Planificación KAI"
              className="chicle-btn w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer shrink-0"
              title="Cerrar (Esc)"
            >
              <Icon name="x" className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar relative z-10 flex-1 space-y-4">
            {/* Panel desplegable de Clave Gemini (solo visible si el usuario lo abre) */}
            {showKeyInput && (
              <div className="bg-[#040814]/80 border aura-border-subtle rounded-2xl p-4 aura-glow-subtle relative">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg aura-bg-soft aura-text-primary border aura-border-subtle">
                      <Icon name="sparkles" className="w-4 h-4 aura-text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        Conectar IA Gemini (Opcional)
                      </h4>
                      <p className="text-[11px] text-slate-400 font-sans">
                        Útil para textos largos o escritos en lenguaje natural. Sin clave, el Motor Local sigue funcionando gratis.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Cerrar panel de clave Gemini"
                    onClick={() => setShowKeyInput(false)}
                    className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <div className="relative flex-1">
                    <input
                      type={showKeyText ? 'text' : 'password'}
                      value={inputKey}
                      onChange={(e) => setInputKey(e.target.value)}
                      placeholder={hasActiveGeminiKey() ? "✓ Clave del sistema activa (o pega tu clave personalizada)" : "AIzaSy... (Pega tu clave de Google Gemini aquí)"}
                      className="w-full bg-black/60 border border-white/15 focus:aura-border-primary rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 outline-none pr-14"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeyText(!showKeyText)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] aura-text-primary font-mono hover:underline cursor-pointer"
                    >
                      {showKeyText ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      if (inputKey.trim()) {
                        saveGeminiApiKey(inputKey.trim());
                        setIsKeyConfigured(true);
                        setEnginePreference('ai');
                        setKeySavedToast('✓ Clave guardada. Modo IA Gemini activado.');
                        setTimeout(() => {
                          setKeySavedToast(null);
                          setShowKeyInput(false);
                        }, 2000);
                      } else {
                        removeGeminiApiKey();
                        setIsKeyConfigured(false);
                        setEnginePreference('local');
                        setKeySavedToast('Clave eliminada. Cambiado a Motor Local.');
                        setTimeout(() => setKeySavedToast(null), 2000);
                      }
                    }}
                    className="chicle-btn aura-btn-gradient optic-active-card px-4 py-2 font-anton text-xs uppercase tracking-wider rounded-xl cursor-pointer shrink-0"
                  >
                    Guardar
                  </button>
                </div>

                {keySavedToast && (
                  <div className="mt-2.5 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
                    <Icon name="check" className="w-3.5 h-3.5" />
                    <span>{keySavedToast}</span>
                  </div>
                )}

                <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-sans">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aura-text-primary hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    ↗ Consigue una clave gratuita en Google AI Studio
                  </a>
                  <span className="text-slate-500">Se guarda solo en tu dispositivo</span>
                </div>
              </div>
            )}

            {!suggestedHabits ? (
              <div className="space-y-3.5">
                {/* Banner para restaurar agenda anterior si existe respaldo */}
                {hasUndoSnapshot && (
                  <div className="bg-amber-950/35 border border-amber-500/40 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon name="rotateCcw" className="w-4 h-4 text-amber-400 shrink-0" />
                      <p className="text-xs text-amber-200 font-sans">
                        <strong>¿Prefieres la agenda anterior?</strong> Puedes restaurar las tareas que tenías antes.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleUndoInjection}
                      className="chicle-btn optic-active-card w-full sm:w-auto shrink-0 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Icon name="rotateCcw" className="w-3.5 h-3.5" />
                      <span>Restaurar anterior</span>
                    </button>
                  </div>
                )}

                {/* Acción rápida en 1 línea + Switch visible IA Gemini / Motor Local */}
                <div className="bg-[#040814]/80 border border-white/10 rounded-2xl p-3 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-white/10">
                    <div className="text-xs text-slate-300 font-sans">
                      {currentDayAgendaTasks.length > 0 ? (
                        <span>Tienes <strong className="aura-text-soft font-mono tabular-nums">{currentDayAgendaTasks.length} tareas hoy</strong>: acomódalas sin cruces en 1 clic.</span>
                      ) : (
                        <span>¿Sin ganas de escribir? Genera un día equilibrado al instante.</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoOrganizeCurrentDay}
                      className="chicle-btn aura-btn-gradient optic-active-card shrink-0 px-3.5 py-2 rounded-xl font-anton text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Icon name="sparkles" className="w-3.5 h-3.5" />
                      <span>Acomodar tareas de hoy</span>
                    </button>
                  </div>

                  {/* Switch visible IA Gemini / Motor Local */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs text-slate-400 font-sans">
                      Motor para crear la agenda:
                    </span>
                    <div
                      role="group"
                      aria-label="Elegir motor de inteligencia para crear la agenda"
                      className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10"
                    >
                      <button
                        type="button"
                        aria-pressed={enginePreference === 'ai'}
                        onClick={() => {
                          soundFX.playClick();
                          triggerHaptic(15);
                          setEnginePreference('ai');
                          try { localStorage.setItem('kai_oracle_engine_preference', 'ai'); } catch {}
                          if (!isKeyConfigured) {
                            setShowKeyInput(true);
                          }
                        }}
                        className={`chicle-btn flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          enginePreference === 'ai'
                            ? 'aura-bg-primary optic-active-card'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon name="brain" className="w-3.5 h-3.5" />
                        <span>IA Gemini</span>
                        {!isKeyConfigured && (
                          <span className="text-[9px] px-1 rounded bg-amber-500/25 text-amber-200 border border-amber-400/40">
                            Clave
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        aria-pressed={enginePreference === 'local'}
                        onClick={() => {
                          soundFX.playClick();
                          triggerHaptic(15);
                          setEnginePreference('local');
                          try { localStorage.setItem('kai_oracle_engine_preference', 'local'); } catch {}
                        }}
                        className={`chicle-btn flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          enginePreference === 'local'
                            ? 'bg-emerald-500 text-slate-950 optic-active-card shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon name="zap" className="w-3.5 h-3.5" />
                        <span>Motor Local</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pestañas simples */}
                <div 
                  role="tablist" 
                  aria-label="Formas de crear tu agenda" 
                  className="flex flex-wrap bg-black/40 border border-white/10 p-1 rounded-2xl gap-1"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'wizard'}
                    aria-controls="panel-wizard"
                    onClick={() => {
                      soundFX.playClick();
                      setError(null);
                      setActiveTab('wizard');
                    }}
                    className={`chicle-btn flex-1 min-w-[100px] py-2 px-3 rounded-xl text-xs font-anton uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'wizard'
                        ? 'aura-btn-gradient optic-active-card'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <Icon name="sparkles" className="w-3.5 h-3.5" />
                    <span>Paso a paso</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'prompt'}
                    aria-controls="panel-prompt"
                    onClick={() => {
                      soundFX.playClick();
                      setError(null);
                      setActiveTab('prompt');
                    }}
                    className={`chicle-btn flex-1 min-w-[100px] py-2 px-3 rounded-xl text-xs font-anton uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'prompt'
                        ? 'aura-btn-gradient optic-active-card'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <Icon name="edit" className="w-3.5 h-3.5" />
                    <span>Modo Libre</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'templates'}
                    aria-controls="panel-templates"
                    onClick={() => {
                      soundFX.playClick();
                      setError(null);
                      setActiveTab('templates');
                    }}
                    className={`chicle-btn flex-1 min-w-[100px] py-2 px-3 rounded-xl text-xs font-anton uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'templates'
                        ? 'aura-btn-gradient optic-active-card'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <Icon name="zap" className="w-3.5 h-3.5" />
                    <span>Plantillas</span>
                  </button>
                </div>

                {/* Carga o Contenido de la Pestaña */}
                {isLoading ? (
                  <OracleTheatricalLoader 
                    engineMode={enginePreference}
                    userContext={{
                      class: stats?.characterClass,
                      rank: stats?.rankTitle,
                      name: stats?.fullName
                    }}
                  />
                ) : (
                  <>
                    {/* PESTAÑA 1: PASO A PASO */}
                    {activeTab === 'wizard' && (
                      <div id="panel-wizard" role="tabpanel">
                        <OracleGuidedWizard 
                          onComplete={(wizardPrompt) => {
                            setPrompt(wizardPrompt.slice(0, 10000));
                            handleGenerate(wizardPrompt);
                          }}
                          onCancel={() => onClose()}
                        />
                      </div>
                    )}

                    {/* PESTAÑA 3: PLANTILLAS */}
                    {activeTab === 'templates' && (
                      <div id="panel-templates" role="tabpanel">
                        <OracleTemplates 
                          onSelectTemplate={(tplPrompt) => {
                            setPrompt(tplPrompt.slice(0, 10000));
                            handleGenerate(tplPrompt);
                          }}
                        />
                      </div>
                    )}

                    {/* PESTAÑA 2: MODO LIBRE (10,000 CARACTERES) */}
                    {activeTab === 'prompt' && (
                      <div id="panel-prompt" role="tabpanel" className="space-y-3">
                        {/* Encabezado directo del cuadro de texto + acciones + contador */}
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 pl-0.5">
                            <label htmlFor="oracle-free-prompt" className="text-xs font-sans font-bold text-slate-200">
                              Escribe o pega cómo es tu semana o día
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  soundFX.playClick();
                                  setShowPromptHelp(!showPromptHelp);
                                }}
                                aria-expanded={showPromptHelp}
                                className="chicle-btn px-2 py-0.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 text-[11px] font-sans transition-colors cursor-pointer"
                              >
                                {showPromptHelp ? 'Ocultar ayuda' : '? Cómo escribirlo'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  soundFX.playClick();
                                  setError(null);
                                  setPrompt(
                                    `LUNES A VIERNES:\n07:00 a 08:00: Desayuno y preparación\n08:30 a 13:00: Trabajo principal\n13:00 a 14:00: Almuerzo y descanso\n14:00 a 17:30: Proyectos y pendientes\n18:30 a 19:30: Entrenamiento\n20:30 a 22:00: Lectura y tiempo libre\n\nSÁBADOS:\n09:30 a 11:30: Deporte al aire libre\n12:00 a 14:00: Limpieza y compras`
                                  );
                                }}
                                className="chicle-btn px-2.5 py-0.5 rounded-lg aura-bg-soft border aura-border-subtle aura-text-soft text-[11px] font-mono font-bold transition-all cursor-pointer"
                              >
                                Cargar ejemplo
                              </button>
                              <span
                                className={`text-[11px] font-mono tabular-nums ${
                                  prompt.length >= 10000
                                    ? 'text-rose-400 font-bold'
                                    : prompt.length >= 8500
                                    ? 'text-amber-400 font-bold'
                                    : 'text-slate-400'
                                }`}
                              >
                                {prompt.length.toLocaleString()} / 10,000
                              </span>
                            </div>
                          </div>

                          {/* Ayuda breve colapsable (cerrada por defecto para no saturar) */}
                          {showPromptHelp && (
                            <div className="bg-[#040814]/80 border aura-border-subtle rounded-xl p-3 text-xs text-slate-300 space-y-1.5 font-sans leading-relaxed">
                              <p>
                                • <strong className="aura-text-soft">Con horas:</strong> escribe por ejemplo <code className="aura-text-soft">Lunes a viernes 09:00 a 17:00 trabajo</code>.
                              </p>
                              <p>
                                • <strong className="aura-text-soft">Si cambias de días:</strong> separa por títulos como <code className="aura-text-soft">LUNES</code>, <code className="aura-text-soft">SÁBADOS</code> o <code className="aura-text-soft">DOMINGOS</code>.
                              </p>
                              <p>
                                • <strong className="text-purple-300">IA Gemini vs Local:</strong> usa <strong>IA Gemini</strong> si pegas notas largas o párrafos en texto corrido; usa <strong>Motor Local</strong> si ya está en lista por hora y lo quieres al instante.
                              </p>
                            </div>
                          )}

                          <textarea
                            id="oracle-free-prompt"
                            value={prompt}
                            onChange={(e) => {
                              if (error) setError(null);
                              setPrompt(e.target.value.slice(0, 10000));
                            }}
                            maxLength={10000}
                            placeholder="Ejemplo: De lunes a viernes me levanto a las 07:00, trabajo de 09:00 a 17:00 con almuerzo a la 13:00. Entreno de 18:30 a 19:30. Los sábados limpio de 10:00 a 12:00 y descanso en la tarde..."
                            className="w-full h-48 min-h-[11rem] max-h-[24rem] bg-black/50 border border-white/15 focus:aura-border-primary rounded-xl p-3.5 text-sm text-white placeholder-slate-500 resize-y outline-none transition-colors font-sans leading-relaxed"
                          />
                        </div>

                        {/* Nivel de detalle en 1 línea compacta */}
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#040814]/80 border border-white/10 rounded-xl px-3 py-2">
                          <span className="text-xs text-slate-400 font-sans">
                            ¿Cómo prefieres organizarlo?
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              aria-pressed={scheduleMode === 'master_blocks'}
                              onClick={() => {
                                soundFX.playClick();
                                setScheduleMode('master_blocks');
                              }}
                              className={`chicle-btn px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                                scheduleMode === 'master_blocks'
                                  ? 'aura-bg-primary optic-active-card'
                                  : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/10'
                              }`}
                            >
                              Resumido (4–6 bloques)
                            </button>
                            <button
                              type="button"
                              aria-pressed={scheduleMode === 'detailed'}
                              onClick={() => {
                                soundFX.playClick();
                                setScheduleMode('detailed');
                              }}
                              className={`chicle-btn px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                                scheduleMode === 'detailed'
                                  ? 'aura-bg-primary optic-active-card'
                                  : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/10'
                              }`}
                            >
                              Detallado (cada tarea)
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleGenerate()}
                          disabled={isLoading}
                          className="chicle-btn aura-btn-gradient optic-active-card w-full py-3.5 font-anton uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                        >
                          <Icon name={enginePreference === 'ai' ? 'brain' : 'zap'} className="w-5 h-5" />
                          <span>
                            {enginePreference === 'ai'
                              ? 'Crear agenda con IA Gemini'
                              : 'Crear agenda con Motor Local'}
                          </span>
                        </button>
                      </div>
                    )}
                  </>
                )}

                {error && (
                  <div className="bg-rose-950/50 border border-rose-500/50 rounded-xl p-3 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <Icon name="alertTriangle" className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-rose-200 font-sans leading-relaxed">{error}</p>
                    </div>
                    {prompt.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleGenerate()}
                        className="chicle-btn w-full py-2 bg-rose-900/60 hover:bg-rose-800/80 border border-rose-500/40 text-rose-200 text-xs font-mono font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Icon name="rotateCcw" className="w-3.5 h-3.5" />
                        <span>Reintentar ahora</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* Aviso solo cuando hay fallback o advertencia */}
                {notice && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs font-sans text-amber-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon name="alertTriangle" className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{notice}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleGenerate()}
                      disabled={isLoading}
                      className="text-amber-300 hover:text-amber-100 font-bold underline shrink-0 cursor-pointer"
                    >
                      Reintentar
                    </button>
                  </div>
                )}

                {/* Cabecera de vista previa clara */}
                <div className="flex items-start justify-between py-1 border-b border-white/10 flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-white font-anton text-sm uppercase tracking-wider flex items-center gap-1.5">
                        <Icon name="checkCircle" className="w-4 h-4 text-emerald-400" />
                        Tu borrador de agenda
                      </h4>
                      <span className="px-2 py-0.5 rounded-full aura-bg-soft border aura-border-subtle aura-text-soft text-[11px] font-mono tabular-nums font-bold">
                        {suggestedHabits.length} bloques
                      </span>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold flex items-center gap-1 ${
                        generationSource === 'local' 
                          ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' 
                          : 'bg-purple-950/80 border-purple-500/40 text-purple-300'
                      }`}>
                        {generationSource === 'local' ? (
                          <>
                            <Icon name="zap" className="w-3 h-3 text-emerald-400" />
                            <span>Motor Local</span>
                          </>
                        ) : (
                          <>
                            <Icon name="brain" className="w-3 h-3 text-purple-400" />
                            <span>IA Gemini</span>
                          </>
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">
                      Toca cualquier actividad si quieres cambiarle la hora, el nombre o los días.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddNewManualBlock}
                      aria-label="Añadir un bloque de horario manualmente"
                      className="chicle-btn aura-bg-primary optic-active-card px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                      title="Añadir una tarea manual"
                    >
                      <Icon name="plus" className="w-3.5 h-3.5" />
                      <span>Añadir</span>
                    </button>
                    {suggestedHabits.length > 5 && (
                      <button
                        type="button"
                        onClick={handleSynthesizeExisting}
                        aria-label="Agrupar tareas repetidas o cortas en menos bloques"
                        className="chicle-btn px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer"
                        title="Agrupar tareas en menos bloques"
                      >
                        <Icon name="layers" className="w-3.5 h-3.5 aura-text-primary" />
                        <span>Agrupar bloques</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Tactical Diagnostic Panel: Solo si hay choques reales */}
                {diagnostic && diagnostic.conflicts.length > 0 && (
                  <Suspense fallback={null}>
                    <TacticalDiagnosticPanel
                      diagnostic={diagnostic}
                      onQuickFixConflict={handleQuickFixConflict}
                      onFillGap={handleFillGap}
                    />
                  </Suspense>
                )}

                <div className="space-y-3">
                  {/* Selector de días con contador de bloques por día */}
                  <div className="flex bg-[#040814]/80 border border-white/10 rounded-xl p-1 overflow-x-auto no-scrollbar gap-1">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((label, idx) => {
                      const dayNum = idx === 6 ? 0 : idx + 1;
                      const dayCount = suggestedHabits.filter(habit => {
                        const numericDays = (habit.specificDays !== undefined && habit.specificDays !== null)
                          ? parseDays(habit.specificDays)
                          : [];
                        if (numericDays.length > 0 && numericDays.length < 7) {
                          return numericDays.includes(dayNum);
                        }
                        return true;
                      }).length;

                      return (
                        <button
                          key={dayNum}
                          type="button"
                          onClick={() => setPreviewDay(dayNum)}
                          className={`chicle-btn flex-1 min-w-[46px] px-2 py-1.5 rounded-lg text-[11px] font-mono tabular-nums font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            previewDay === dayNum
                              ? 'aura-bg-primary optic-active-card'
                              : dayCount > 0
                              ? 'text-slate-200 hover:text-white bg-white/[0.04]'
                              : 'text-slate-600 hover:text-slate-400'
                          }`}
                        >
                          <span>{label}</span>
                          {dayCount > 0 && (
                            <span className={`text-[9px] px-1 rounded tabular-nums ${previewDay === dayNum ? 'bg-black/25 text-current' : 'aura-bg-soft aura-text-soft'}`}>
                              {dayCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setPreviewDay('all')}
                      className={`chicle-btn flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-mono tabular-nums font-bold uppercase tracking-wider transition-all cursor-pointer ${previewDay === 'all' ? 'aura-bg-primary optic-active-card' : 'text-slate-400 hover:text-white'}`}
                    >
                      Todos ({suggestedHabits.length})
                    </button>
                  </div>

                  {/* Lista de bloques limpia y minimalista */}
                  <div className="space-y-2">
                    {suggestedHabits
                      .filter(habit => {
                        if (previewDay === 'all') return true;
                        
                        const numericDays = (habit.specificDays !== undefined && habit.specificDays !== null)
                          ? parseDays(habit.specificDays)
                          : [];

                        if (numericDays.length > 0 && numericDays.length < 7) {
                          return numericDays.includes(previewDay);
                        }

                        const type = String(habit.frequencyType || 'daily').toLowerCase().trim();
                        if (type === 'daily' || type === 'todos los dias' || type === 'everyday' || type === 'diario' || type === 'toda la semana') return true;
                        
                        return true;
                      })
                      .map((habit, idx) => {
                        const isEditing = editingId === habit.id;
                        const conflict = hasConflict(habit);
                        const relatedConflict = getConflictForHabit(habit.id);

                        if (isEditing) {
                          return (
                            <div key={habit.id ? `${habit.id}-${idx}` : `sugg-edit-${idx}`} className="bg-[#040814]/90 border-2 aura-border-primary p-3.5 rounded-2xl space-y-3 aura-glow-subtle">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono font-bold aura-text-soft uppercase tracking-wider flex items-center gap-1.5">
                                  <Icon name="edit" className="w-3.5 h-3.5 aura-text-primary" />
                                  Editar Bloque
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveHabit(habit.id)}
                                    className="text-rose-400 hover:text-rose-300 text-xs font-mono flex items-center gap-1 cursor-pointer hover:bg-rose-950/40 px-2 py-1 rounded-lg"
                                    title="Eliminar este bloque"
                                  >
                                    <Icon name="trash" className="w-3 h-3" />
                                    <span>Eliminar</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingId(null)}
                                    className="text-slate-400 hover:text-white text-xs font-mono cursor-pointer px-2 py-1"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] font-mono text-slate-400 block mb-1">Título de la Actividad / Tarea:</label>
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="w-full bg-black/60 border border-white/15 focus:aura-border-primary rounded-lg px-3 py-1.5 text-sm text-white outline-none font-sans"
                                />
                              </div>

                              {/* Category & Icon Picker */}
                              <div>
                                <label className="text-[10px] font-mono text-slate-400 block mb-1">Categoría & Icono:</label>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                                  {([
                                    { id: 'rutina' as TaskCategory, label: 'Rutina', icon: '⚡' },
                                    { id: 'entrenamiento' as TaskCategory, label: 'Entreno', icon: '🏋️' },
                                    { id: 'limpieza' as TaskCategory, label: 'Limpieza', icon: '🧹' },
                                    { id: 'comida' as TaskCategory, label: 'Comida', icon: '🍲' },
                                    { id: 'creativo' as TaskCategory, label: 'Creativo', icon: '🎨' },
                                    { id: 'estudio' as TaskCategory, label: 'Estudio', icon: '💻' }
                                  ] as const).map(cat => (
                                    <button
                                      key={cat.id}
                                      type="button"
                                      onClick={() => {
                                        setEditCategory(cat.id);
                                        setEditIcon(cat.icon);
                                      }}
                                      className={`chicle-btn !flex-col py-1.5 px-1 rounded-lg text-[10px] font-mono font-bold gap-0.5 cursor-pointer transition-all ${
                                        editCategory === cat.id
                                          ? 'aura-bg-primary optic-active-card'
                                          : 'bg-black/50 text-slate-400 border border-white/10 hover:text-white'
                                      }`}
                                    >
                                      <span className="text-sm">{cat.icon}</span>
                                      <span className="truncate">{cat.label}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Time Selection */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/40 border border-white/10 p-2.5 rounded-xl">
                                <div>
                                  <label className="text-[10px] font-mono aura-text-soft block mb-1">Franja Horaria:</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="time"
                                      value={editStartTime}
                                      onChange={(e) => {
                                        setEditStartTime(e.target.value);
                                        setEditTimeBlock(`${e.target.value} - ${editEndTime}`);
                                      }}
                                      className="bg-black/60 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white font-mono tabular-nums outline-none flex-1"
                                    />
                                    <span className="text-slate-500 text-xs font-mono">a</span>
                                    <input
                                      type="time"
                                      value={editEndTime}
                                      onChange={(e) => {
                                        setEditEndTime(e.target.value);
                                        setEditTimeBlock(`${editStartTime} - ${e.target.value}`);
                                      }}
                                      className="bg-black/60 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white font-mono tabular-nums outline-none flex-1"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Frecuencia:</label>
                                  <div className="flex gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditFreq('specific_days');
                                        setEditDays([1, 2, 3, 4, 5]);
                                      }}
                                      className={`chicle-btn flex-1 py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                                        editFreq === 'specific_days' && editDays.length === 5 && !editDays.includes(0) && !editDays.includes(6)
                                          ? 'aura-bg-primary optic-active-card'
                                          : 'bg-black/50 border border-white/10 text-slate-300'
                                      }`}
                                    >
                                      L-V
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditFreq('daily');
                                        setEditDays([0, 1, 2, 3, 4, 5, 6]);
                                      }}
                                      className={`chicle-btn flex-1 py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                                        editFreq === 'daily'
                                          ? 'aura-bg-primary optic-active-card'
                                          : 'bg-black/50 border border-white/10 text-slate-300'
                                      }`}
                                    >
                                      Diario
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Days Toggles */}
                              <div>
                                <label className="text-[10px] font-mono text-slate-400 block mb-1">Días Asignados:</label>
                                <div className="flex gap-1">
                                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dName, dIdx) => {
                                    const dNum = dIdx === 6 ? 0 : dIdx + 1;
                                    const isSel = editFreq === 'daily' || editDays.includes(dNum);
                                    return (
                                      <button
                                        key={dNum}
                                        type="button"
                                        onClick={() => {
                                          setEditFreq('specific_days');
                                          toggleEditDay(dNum);
                                        }}
                                        className={`chicle-btn flex-1 py-1 rounded-lg text-[11px] font-mono font-bold cursor-pointer transition-colors ${
                                          isSel
                                            ? 'aura-bg-primary optic-active-card'
                                            : 'bg-black/50 text-slate-400 border border-white/10'
                                        }`}
                                      >
                                        {dName}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={saveEditingHabit}
                                  className="chicle-btn aura-btn-gradient optic-active-card px-4 py-2 font-anton uppercase tracking-wider text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                                >
                                  <Icon name="check" className="w-3.5 h-3.5" />
                                  <span>Guardar Cambios</span>
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div 
                            key={habit.id ? `${habit.id}-${idx}` : `sugg-${idx}`} 
                            className={`bg-[#040814]/80 border p-2.5 sm:p-3 rounded-2xl flex items-center justify-between gap-3 group transition-all hover:aura-border-subtle hover:bg-white/[0.04] ${
                              conflict ? 'border-amber-500/60 bg-amber-950/20' : 'border-white/10'
                            }`}
                          >
                            <div 
                              onClick={() => startEditingHabit(habit)}
                              className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                              title="Toca para editar horario o nombre"
                            >
                              {/* Franja horaria limpia */}
                              <div className="shrink-0 px-2.5 py-1 rounded-xl aura-bg-soft border aura-border-subtle aura-text-soft font-mono tabular-nums text-xs font-bold flex items-center gap-1.5">
                                <Icon name="timer" className="w-3 h-3 aura-text-primary" />
                                <span>{habit.timeBlock || 'Sin hora'}</span>
                              </div>

                              {/* Icono de la tarea */}
                              <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
                                {renderHabitIcon(habit.quickIcon, habit.title, 'w-4 h-4')}
                              </div>

                              {/* Título y frecuencia */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs sm:text-sm font-bold text-slate-100 truncate group-hover:text-white transition-colors">
                                    {habit.title}
                                  </p>
                                  {conflict && (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-950/90 border border-amber-500/60 text-amber-300 text-[10px] font-mono font-bold shrink-0 animate-pulse">
                                      ⚠️ Choque
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                                  {habit.frequencyType === 'daily'
                                    ? 'Todos los días'
                                    : habit.specificDays?.map(mapDayToString).join(', ') || 'Días específicos'}
                                </p>
                              </div>
                            </div>
                            
                            {/* Acciones Rápidas */}
                            <div className="flex items-center gap-1 shrink-0">
                              {relatedConflict && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickFixConflict(relatedConflict)}
                                  aria-label="Resolver choque de horario automáticamente"
                                  className="chicle-btn px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-mono text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                  title="Resolver choque automáticamente"
                                >
                                  <Icon name="zap" className="w-3 h-3 text-amber-400" />
                                  <span className="hidden sm:inline">Resolver</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => startEditingHabit(habit)}
                                aria-label={`Editar bloque ${habit.title}`}
                                className="p-1.5 text-slate-400 hover:aura-text-primary hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                title="Editar bloque"
                              >
                                <Icon name="edit" className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveHabit(habit.id)}
                                aria-label={`Descartar ${habit.title} de la lista`}
                                className="text-slate-500 hover:text-rose-400 p-1.5 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                                title="Descartar de la lista"
                              >
                                <Icon name="trash" className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    
                    {suggestedHabits.length === 0 && (
                      <p className="text-center text-slate-500 py-8 text-sm font-mono">Cola vacía. Todas las directivas fueron descartadas.</p>
                    )}
                  </div>
                </div>

                {/* Pie de Guardado */}
                <div className="pt-3 border-t border-white/10 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-sans text-slate-300">
                    <span>Al guardar en tu calendario:</span>
                    <div className="flex items-center gap-1 bg-black/50 p-0.5 rounded-lg border border-white/10 font-mono">
                      <button
                        type="button"
                        onClick={() => {
                          soundFX.playClick();
                          setInjectMode('replace_pending');
                        }}
                        className={`chicle-btn px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                          injectMode === 'replace_pending'
                            ? 'aura-bg-primary optic-active-card'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Reemplazar pendientes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          soundFX.playClick();
                          setInjectMode('merge');
                        }}
                        className={`chicle-btn px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                          injectMode === 'merge'
                            ? 'aura-bg-primary optic-active-card'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Sumar a lo actual
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        setSuggestedHabits(null);
                        setEditingId(null);
                      }}
                      className="chicle-btn px-4 py-3 bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white font-anton uppercase tracking-wider text-xs rounded-xl cursor-pointer"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      onClick={handleAcceptSchedule}
                      disabled={suggestedHabits.length === 0}
                      className="chicle-btn aura-btn-gradient optic-active-card flex-1 py-3 disabled:opacity-40 font-anton uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Guardar agenda en mi calendario ({suggestedHabits.length})</span>
                      <Icon name="chevronRight" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

