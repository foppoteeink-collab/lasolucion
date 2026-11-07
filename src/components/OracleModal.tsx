import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from './common/Icon';
import { CustomHabit, TaskItem } from '../types';
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
import { TacticalDiagnosticPanel } from './TacticalDiagnosticPanel';
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
  saveGeminiApiKey, 
  removeGeminiApiKey 
} from '../services/aiService';
import { useUIStore } from '../store/useUIStore';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [suggestedHabits, setSuggestedHabits] = useState<CustomHabit[] | null>(null);
  const [addedHabitIds, setAddedHabitIds] = useState<Set<string>>(new Set());
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
  const [inputKey, setInputKey] = useState(() => getEffectiveGeminiApiKey() || '');
  const [keySavedToast, setKeySavedToast] = useState<string | null>(null);
  const [showKeyText, setShowKeyText] = useState(false);

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
      setInputKey(getEffectiveGeminiApiKey() || '');
      // Si no tiene clave, abrir automáticamente el panel para guiarlo a conectarla
      if (!active) {
        setShowKeyInput(true);
      }
      if (initialPrompt) {
        setPrompt(initialPrompt);
        setActiveTab('prompt');
      }
    }
  }, [isOpen, initialPrompt]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
        try {
          const aiData = await generateScheduleFrontend(
            `Reorganiza y acomoda de forma óptima y sin choques de horario mis siguientes misiones del día en entre 5 y ${scheduleMode === 'master_blocks' ? 7 : 9} bloques:\n${tasksPrompt}`,
            userContextObj,
            [],
            scheduleMode
          );
          if (aiData?.source === 'ai' && Array.isArray(aiData.habits) && aiData.habits.length > 0) {
            const arranged = autoArrangeSchedule(aiData.habits, scheduleMode, scheduleMode === 'master_blocks' ? 7 : 10);
            setSuggestedHabits(sortByChronologicalTime(arranged) as CustomHabit[]);
            setNotice(null);
            setAddedHabitIds(new Set());
            soundFX.playSubBassConfirm();
            return;
          }
        } catch {
          // Use local organized result
        }

        setSuggestedHabits(sortByChronologicalTime(organized));
        setNotice(null);
        setAddedHabitIds(new Set());
        soundFX.playSubBassConfirm();
      } else {
        // No tasks yet: ask Gemini 3.8 Flash for a complete balanced day, with heuristic fallback
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
        try {
          const aiData = await generateScheduleFrontend(
            'Diseña una agenda diaria equilibrada de alto rendimiento con 6 bloques horarios claros (mañana, mediodía, tarde y noche) sin choques para hoy.',
            userContextObj,
            [],
            scheduleMode
          );
          if (Array.isArray(aiData?.habits) && aiData.habits.length > 0) {
            const arranged = autoArrangeSchedule(aiData.habits, scheduleMode, scheduleMode === 'master_blocks' ? 7 : 10);
            setSuggestedHabits(sortByChronologicalTime(arranged) as CustomHabit[]);
            setNotice(aiData.notice || null);
            setAddedHabitIds(new Set());
            soundFX.playSubBassConfirm();
            return;
          }
        } catch {
          // Fallback below
        }
        const fallback = generateProceduralSchedule('', { profession: stats?.profession }, scheduleMode);
        setSuggestedHabits(sortByChronologicalTime(fallback));
        setNotice(null);
        setAddedHabitIds(new Set());
        soundFX.playSubBassConfirm();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (overridePrompt?: unknown) => {
    const rawPrompt = typeof overridePrompt === 'string' ? overridePrompt : prompt;
    const textToUse = String(rawPrompt || '').trim();
    if (!textToUse) {
      await handleAutoOrganizeCurrentDay();
      return;
    }
    if (typeof overridePrompt === 'string' && overridePrompt.trim()) {
      setPrompt(overridePrompt);
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

      const data = await generateScheduleFrontend(textToUse, userContextObj, [], scheduleMode);

      if (data.notice) {
        setNotice(data.notice);
      } else {
        setNotice("✨ Agenda estratégica generada con éxito por KAI IA (Gemini).");
      }

      const rawHabits: CustomHabit[] = data.habits || [];
      const arranged = autoArrangeSchedule(rawHabits, scheduleMode, 25);
      const sorted = sortByChronologicalTime(arranged);
      setSuggestedHabits(sorted);
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
      setAddedHabitIds(new Set());
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
        setNotice("⚠️ Modo sin conexión: Agenda estructurada por el Motor Local.");
        const arranged = autoArrangeSchedule(fallbackHabits, scheduleMode, 25);
        const sorted = sortByChronologicalTime(arranged);
        setSuggestedHabits(sorted);
        const hasMultiDayVariations = sorted.some(h => h.specificDays && h.specificDays.length > 0 && h.specificDays.length < 5);
        setPreviewDay(hasMultiDayVariations ? 1 : 'all');
        setAddedHabitIds(new Set());
        soundFX.playSubBassConfirm();
        setError(null);
      } catch (fallbackErr) {
        let errMsg = err.message || 'Error de sincronización con tu compañero KAI.';
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
        category: (editCategory as any) || h.category,
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

  const handleAddSingleRoutine = (habit: CustomHabit) => {
    soundFX.playClick();
    const taskStore = useTaskStore.getState();
    const currentDateStr = taskStore.currentViewDate || getTodayDateString();

    const oracleTask: TaskItem = {
      id: `oracle-task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: habit.title,
      category: (habit.category === 'habito' ? 'rutina' : habit.category) as any,
      description: habit.description || `Misión táctica del Oráculo para ${habit.timeBlock || 'el día'}`,
      xpReward: habit.xpReward || 20,
      coinReward: habit.coinReward || 10,
      completed: false,
      timeBlock: normalizeTimeBlock(habit.timeBlock) || habit.timeBlock,
      isHabit: false,
      quickIcon: habit.quickIcon
    };

    const currentTasksForDay = (taskStore.tasksByDate[currentDateStr] || []).filter(
      t => !isDuplicateActivity(t, { title: habit.title, timeBlock: habit.timeBlock })
    );
    const updatedList = gameEngine.sortTasksChronologically(
      deduplicateTasksForDay([...currentTasksForDay, oracleTask])
    );

    taskStore.setTasksByDate({
      ...taskStore.tasksByDate,
      [currentDateStr]: updatedList
    });

    setAddedHabitIds(prev => new Set([...prev, habit.id]));
  };

  const handleAcceptSchedule = async () => {
    if (!suggestedHabits || suggestedHabits.length === 0) return;
    
    soundFX.playClick();
    
    const taskStore = useTaskStore.getState();
    const currentDateStr = taskStore.currentViewDate || getTodayDateString();

    // 1. Persist AI-generated routines into customHabits so generateDailyTasks will create them infinitely for all future dates
    const existingCustomHabits = taskStore.customHabits || [];
    const newCustomHabits: CustomHabit[] = suggestedHabits.map((h, idx) => ({
      id: h.id || `hab-ai-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      title: h.title,
      category: (h.category === 'habito' ? 'rutina' : h.category) as any,
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
        category: (h.category === 'habito' ? 'rutina' : h.category) as any,
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
    setAddedHabitIds(new Set());
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

  const handleFillGap = (gap: ScheduleGap, title: string, category: string, icon: string) => {
    if (!suggestedHabits) return;
    soundFX.playClick();
    const newHabit: CustomHabit = {
      id: `routine-gap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      category: (category as any) || 'rutina',
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="bg-[#030712]/95 border border-cyan-500/35 w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(0,240,255,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[88vh] backdrop-blur-2xl relative text-left"
          initial={{ scale: 0.95, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 15 }}
        >
          {/* Micrograno táctil Moxen Vidrio */}
          <span className="vi-grano opacity-5" aria-hidden="true" />

          {/* Filamento especular superior */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="bg-[#040814]/90 p-4 sm:p-5 border-b border-white/10 flex justify-between items-center gap-3 relative z-10">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 shadow-[0_0_14px_rgba(0,240,255,0.3)]">
                <Icon name="brain" className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-anton uppercase tracking-wider text-white flex items-center gap-2">
                  Oráculo Neural KAI
                </h3>
                {isKeyConfigured ? (
                  <button
                    type="button"
                    onClick={() => setShowKeyInput(!showKeyInput)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-mono font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)] mt-0.5 cursor-pointer hover:bg-emerald-900/60 transition-all active:scale-95"
                    title="KAI IA conectada con Gemini en vivo. Toca para cambiar la clave"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>KAI IA Conectada (Gemini)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowKeyInput(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/60 text-amber-300 text-[10px] font-mono font-bold shadow-[0_0_8px_rgba(245,158,11,0.25)] mt-0.5 cursor-pointer hover:bg-amber-900/60 transition-all active:scale-95"
                    title="Toca para ingresar tu clave gratuita de Gemini"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>KAI IA: Requiere Clave [Conectar]</span>
                  </button>
                )}
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all cursor-pointer active:scale-95"
              title="Cerrar (Esc)"
            >
              <Icon name="x" className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar relative z-10 flex-1">
            {/* Banner de Conexión de Clave Gemini */}
            {(!isKeyConfigured || showKeyInput) && (
              <div className="bg-[#030e1d] border border-cyan-500/50 rounded-2xl p-4 mb-4 shadow-[0_0_25px_rgba(0,240,255,0.2)] relative">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                      <Icon name="sparkles" className="w-4 h-4 text-cyan-300" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-anton tracking-wider uppercase text-white">
                        Conectar KAI IA con Google Gemini
                      </h4>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                        Para analizar y generar agendas con inteligencia artificial en tiempo real.
                      </p>
                    </div>
                  </div>
                  {isKeyConfigured && (
                    <button
                      type="button"
                      onClick={() => setShowKeyInput(false)}
                      className="text-slate-400 hover:text-white text-xs p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <div className="relative flex-1">
                    <input
                      type={showKeyText ? 'text' : 'password'}
                      value={inputKey}
                      onChange={(e) => setInputKey(e.target.value)}
                      placeholder="AIzaSy... (Pega tu API Key de Gemini aquí)"
                      className="w-full bg-black/80 border border-white/20 focus:border-cyan-400 rounded-xl px-3 py-2.5 text-xs text-white font-mono placeholder:text-slate-500 outline-none pr-14"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeyText(!showKeyText)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-cyan-400 font-mono hover:text-cyan-300"
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
                        setKeySavedToast('✓ ¡Clave guardada! KAI IA ahora está conectada en tiempo real.');
                        setTimeout(() => {
                          setKeySavedToast(null);
                          setShowKeyInput(false);
                        }, 2500);
                      } else {
                        removeGeminiApiKey();
                        setIsKeyConfigured(false);
                        setKeySavedToast('Clave eliminada. Modo offline.');
                        setTimeout(() => setKeySavedToast(null), 2500);
                      }
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-anton text-xs uppercase tracking-wider rounded-xl hover:opacity-95 cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.4)] active:scale-95 shrink-0"
                  >
                    Guardar y Activar
                  </button>
                </div>

                {keySavedToast && (
                  <div className="mt-2.5 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5 animate-fade-in">
                    <Icon name="check" className="w-3.5 h-3.5" />
                    <span>{keySavedToast}</span>
                  </div>
                )}

                <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 hover:underline inline-flex items-center gap-1 font-bold"
                  >
                    ↗ Obtén tu clave 100% gratuita en Google AI Studio (30 segundos)
                  </a>
                  <span className="text-slate-500">Se guarda exclusivamente en tu navegador</span>
                </div>
              </div>
            )}

            {!suggestedHabits ? (
              <div className="space-y-4">
                <div className="bg-[#020712]/90 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                  <div className="flex gap-3.5 items-start">
                    <div className="w-10 h-10 rounded-xl bg-black/70 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(0,240,255,0.25)]">
                      <Icon name="terminal" className="w-5 h-5 text-cyan-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-anton uppercase tracking-wider text-cyan-300 bg-cyan-950/70 px-2.5 py-0.5 rounded-lg border border-cyan-500/40">
                          Protocolo de Agenda
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">
                          ● KAI IA Online (Gemini)
                        </span>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed font-sans">
                        Organiza tus misiones de hoy con horarios inteligentes sin choques, o diseña tu semana completa paso a paso.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoOrganizeCurrentDay}
                    className="chicle-btn w-full sm:w-auto shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:opacity-95 text-slate-950 font-anton text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.35)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <Icon name="sparkles" className="w-4 h-4 text-slate-950" />
                    <span>Auto-Acomodar Hoy</span>
                  </button>
                </div>

                {/* Mode Tabs: Guided Assistant vs Free Prompt vs Presets vs Neural Analysis */}
                <div className="flex flex-wrap bg-black/40 border border-white/10 p-1.5 rounded-2xl gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setActiveTab('wizard');
                    }}
                    className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl text-xs font-anton uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                      activeTab === 'wizard'
                        ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon name="sparkles" className="w-3.5 h-3.5" />
                    <span>Asistente Guiado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setActiveTab('prompt');
                    }}
                    className={`flex-1 min-w-[80px] py-2 px-3 rounded-xl text-xs font-anton uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                      activeTab === 'prompt'
                        ? 'bg-cyan-400 text-slate-950 font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon name="edit" className="w-3.5 h-3.5" />
                    <span>Modo Libre</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setActiveTab('templates');
                    }}
                    className={`flex-1 min-w-[80px] py-2 px-3 rounded-xl text-xs font-anton uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                      activeTab === 'templates'
                        ? 'bg-cyan-400 text-slate-950 font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon name="zap" className="w-3.5 h-3.5" />
                    <span>Plantillas</span>
                  </button>
                </div>

                {/* Loading State Overlay if synthesizing from any tab */}
                {isLoading ? (
                  <OracleTheatricalLoader 
                    userContext={{
                      class: stats?.characterClass,
                      rank: stats?.rankTitle,
                      name: stats?.fullName
                    }}
                  />
                ) : (
                  <>
                    {/* TAB 1: GUIDED ASSISTANT */}
                    {activeTab === 'wizard' && (
                      <OracleGuidedWizard 
                        onComplete={(wizardPrompt) => {
                          setPrompt(wizardPrompt);
                          handleGenerate(wizardPrompt);
                        }}
                        onCancel={() => onClose()}
                      />
                    )}

                    {/* TAB 2: TEMPLATES ARCHETYPES */}
                    {activeTab === 'templates' && (
                      <OracleTemplates 
                        onSelectTemplate={(tplPrompt) => {
                          setPrompt(tplPrompt);
                          handleGenerate(tplPrompt);
                        }}
                      />
                    )}

                    {/* TAB 3: FREE PROMPT */}
                    {activeTab === 'prompt' && (
                      <div className="space-y-4">
                        {/* Mode Selector */}
                        <div className="bg-[#03070d] border border-cyan-900/50 rounded-xl p-3">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-2">
                            Distribución del Día:
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                soundFX.playClick();
                                setScheduleMode('master_blocks');
                              }}
                              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                                scheduleMode === 'master_blocks'
                                  ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                                  : 'bg-black/40 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 font-bold font-sans text-xs text-cyan-300">
                                <Icon name="layers" className="w-4 h-4" />
                                <span>Bloques Maestros (Recomendado)</span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                                Agrupa el día en 4 a 6 bloques para evitar sobrecarga.
                              </p>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                soundFX.playClick();
                                setScheduleMode('detailed');
                              }}
                              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                                scheduleMode === 'detailed'
                                  ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                                  : 'bg-black/40 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 font-bold font-sans text-xs text-slate-200">
                                <Icon name="checkSquare" className="w-4 h-4" />
                                <span>Modo Detallado</span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                                Registra cada actividad individualmente paso a paso.
                              </p>
                            </button>
                          </div>
                        </div>

                        {/* Guía Táctica KAI (Tutorial Interactivo) */}
                        <div className="bg-[#040c1a] border border-cyan-500/30 rounded-xl p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Icon name="sparkles" className="w-4 h-4 text-cyan-400" />
                              <span className="text-xs font-anton uppercase tracking-wider text-cyan-300">
                                💡 Guía de Sintonización KAI (Cómo pedir tu agenda)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                soundFX.playClick();
                                setPrompt(
                                  `LUNES A VIERNES:\n06:00 a 07:00: Preparación y rutina matutina.\n07:00 a 13:00: Bloque principal de trabajo y atención.\n13:00 a 14:00: Almuerzo y recarga.\n14:00 a 18:00: Segundo bloque de trabajo / proyectos.\n18:30 a 19:30: Entrenamiento físico y estiramiento.\n20:00 a 21:00: Cena y lavo platos.\n21:00 a 23:00: Bloque creativo / desarrollo personal.\n\nSÁBADOS:\n09:00 a 11:00: Entrenamiento especial o actividad exterior.\n11:00 a 14:00: Limpieza y mantenimiento del hogar.`
                                );
                              }}
                              className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[11px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                            >
                              <Icon name="plus" className="w-3 h-3" />
                              <span>Cargar Ejemplo</span>
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                            Escribe tus actividades con tus horas reales. KAI respetará exactamente tus bloques sin imponer pausas forzadas ni cambiar tus rutinas:
                          </p>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
                            <li className="bg-black/50 border border-white/5 rounded-lg p-2 flex items-start gap-1.5">
                              <span className="text-cyan-400 font-bold">•</span>
                              <span><strong>Horarios Exactos:</strong> Indica las horas de inicio y fin (ej. <code className="text-cyan-300">06:00 a 12:00: Trabajo</code>).</span>
                            </li>
                            <li className="bg-black/50 border border-white/5 rounded-lg p-2 flex items-start gap-1.5">
                              <span className="text-cyan-400 font-bold">•</span>
                              <span><strong>Días Específicos:</strong> Varía por días (ej. <code className="text-cyan-300">Lunes a Viernes...</code> o <code className="text-cyan-300">Sábado...</code>).</span>
                            </li>
                            <li className="bg-black/50 border border-white/5 rounded-lg p-2 flex items-start gap-1.5">
                              <span className="text-cyan-400 font-bold">•</span>
                              <span><strong>Sin Límite de Bloques:</strong> Pasa desde 4 bloques clave hasta tu día completo detallado.</span>
                            </li>
                            <li className="bg-black/50 border border-white/5 rounded-lg p-2 flex items-start gap-1.5">
                              <span className="text-cyan-400 font-bold">•</span>
                              <span><strong>Cero Solapamientos:</strong> KAI ajusta si 2 tareas coinciden a la misma hora.</span>
                            </li>
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                            <Icon name="zap" className="w-3.5 h-3.5 text-cyan-400" />
                            Instrucciones de tu Rutina / Horarios
                          </label>
                          <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ejemplo: De lunes a viernes trabajo de 06:00 a 12:00. Almuerzo de 12:45 a 13:30. Entrenamiento de 13:30 a 14:30. Trabajo de 15:00 a 19:30. Cena a las 19:30 y bloque creativo de 20:30 a 23:00..."
                            className="w-full h-36 bg-[#03070d] border border-cyan-950 focus:border-cyan-400 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-600 resize-none outline-none transition-colors font-mono"
                          />
                        </div>

                        <button
                          onClick={() => handleGenerate()}
                          disabled={isLoading}
                          className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_25px_rgba(6,182,212,0.35)] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Icon name="brain" className="w-5 h-5" />
                          <span>Organizar Agenda y Rutina Diaria</span>
                        </button>
                      </div>
                    )}
                  </>
                )}

                {error && (
                  <div className="bg-red-950/50 border border-red-500/50 rounded-xl p-3 space-y-2">
                    <div className="flex items-start gap-3">
                      <Icon name="alertTriangle" className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-200 font-mono leading-relaxed">{error}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleGenerate()}
                      className="w-full py-2 bg-red-900/60 hover:bg-red-800/80 border border-red-500/40 text-red-200 text-xs font-mono font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Icon name="rotateCcw" className="w-3.5 h-3.5" />
                      <span>Reintentar Ahora</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* Notice solo si es una advertencia real */}
                {notice && !notice.includes('optimizada y libre de choques') && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs font-mono text-amber-200">
                    <div className="flex items-center gap-2 truncate">
                      <Icon name="alertTriangle" className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{notice}</span>
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

                {/* Cabecera Limpia: Sin disclaimers ni párrafos explicativos */}
                <div className="flex items-center justify-between py-1 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <h4 className="text-white font-anton text-sm uppercase tracking-wider flex items-center gap-2">
                      <Icon name="checkCircle" className="w-4 h-4 text-emerald-400" />
                      Agenda Propuesta
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[11px] font-mono font-bold">
                      {suggestedHabits.length} bloques
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddNewManualBlock}
                      className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                      title="Añadir un bloque de horario manualmente"
                    >
                      <Icon name="plus" className="w-3.5 h-3.5" />
                      <span>Añadir</span>
                    </button>
                    {suggestedHabits.length > 5 && (
                      <button
                        type="button"
                        onClick={handleSynthesizeExisting}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        title="Consolidar tareas fragmentadas"
                      >
                        <Icon name="layers" className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Sintetizar</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Tactical Diagnostic Panel: Solo si hay choques reales */}
                {diagnostic && diagnostic.conflicts.length > 0 && (
                  <TacticalDiagnosticPanel
                    diagnostic={diagnostic}
                    onQuickFixConflict={handleQuickFixConflict}
                    onFillGap={handleFillGap}
                  />
                )}

                <div className="space-y-3">
                  {/* Selector de días con contador de bloques por día */}
                  <div className="flex bg-[#03070d] border border-white/10 rounded-xl p-1 overflow-x-auto custom-scrollbar gap-1">
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
                          onClick={() => setPreviewDay(dayNum)}
                          className={`flex-1 min-w-[46px] px-2 py-1.5 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            previewDay === dayNum
                              ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                              : dayCount > 0
                              ? 'text-slate-200 hover:text-white bg-white/5'
                              : 'text-slate-600 hover:text-slate-400'
                          }`}
                        >
                          <span>{label}</span>
                          {dayCount > 0 && (
                            <span className={`text-[9px] px-1 rounded ${previewDay === dayNum ? 'bg-slate-950/25 text-slate-950' : 'bg-cyan-500/20 text-cyan-300'}`}>
                              {dayCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPreviewDay('all')}
                      className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${previewDay === 'all' ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'text-slate-400 hover:text-white'}`}
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
                            <div key={habit.id ? `${habit.id}-${idx}` : `sugg-edit-${idx}`} className="bg-[#0b1625] border-2 border-cyan-400 p-3.5 rounded-2xl space-y-3 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                                  <Icon name="edit" className="w-3.5 h-3.5 text-cyan-400" />
                                  Editar Bloque
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveHabit(habit.id)}
                                    className="text-red-400 hover:text-red-300 text-xs font-mono flex items-center gap-1 cursor-pointer hover:bg-red-950/40 px-2 py-1 rounded"
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
                                  className="w-full bg-[#03070d] border border-cyan-800 focus:border-cyan-400 rounded-lg px-3 py-1.5 text-sm text-slate-100 outline-none font-sans"
                                />
                              </div>

                              {/* Category & Icon Picker */}
                              <div>
                                <label className="text-[10px] font-mono text-slate-400 block mb-1">Categoría & Icono:</label>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                                  {[
                                    { id: 'rutina', label: 'Rutina', icon: '⚡' },
                                    { id: 'entrenamiento', label: 'Entreno', icon: '🏋️' },
                                    { id: 'limpieza', label: 'Limpieza', icon: '🧹' },
                                    { id: 'comida', label: 'Comida', icon: '🍲' },
                                    { id: 'creativo', label: 'Creativo', icon: '🎨' },
                                    { id: 'intelecto', label: 'Estudio', icon: '💻' }
                                  ].map(cat => (
                                    <button
                                      key={cat.id}
                                      type="button"
                                      onClick={() => {
                                        setEditCategory(cat.id);
                                        setEditIcon(cat.icon);
                                      }}
                                      className={`py-1.5 px-1 rounded-lg text-[10px] font-mono font-bold flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
                                        editCategory === cat.id
                                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                                          : 'bg-black/50 text-slate-400 border border-slate-800 hover:text-white'
                                      }`}
                                    >
                                      <span className="text-sm">{cat.icon}</span>
                                      <span className="truncate">{cat.label}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Time Selection */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/40 border border-slate-800/80 p-2.5 rounded-xl">
                                <div>
                                  <label className="text-[10px] font-mono text-cyan-300 block mb-1">Franja Horaria:</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="time"
                                      value={editStartTime}
                                      onChange={(e) => {
                                        setEditStartTime(e.target.value);
                                        setEditTimeBlock(`${e.target.value} - ${editEndTime}`);
                                      }}
                                      className="bg-[#03070d] border border-cyan-800 rounded-lg px-2.5 py-1 text-xs text-cyan-200 font-mono outline-none flex-1"
                                    />
                                    <span className="text-slate-500 text-xs font-mono">a</span>
                                    <input
                                      type="time"
                                      value={editEndTime}
                                      onChange={(e) => {
                                        setEditEndTime(e.target.value);
                                        setEditTimeBlock(`${editStartTime} - ${e.target.value}`);
                                      }}
                                      className="bg-[#03070d] border border-cyan-800 rounded-lg px-2.5 py-1 text-xs text-cyan-200 font-mono outline-none flex-1"
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
                                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                                        editFreq === 'specific_days' && editDays.length === 5 && !editDays.includes(0) && !editDays.includes(6)
                                          ? 'bg-cyan-500 text-slate-950 font-bold'
                                          : 'bg-black/50 border border-slate-800 text-slate-300'
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
                                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                                        editFreq === 'daily'
                                          ? 'bg-cyan-500 text-slate-950 font-bold'
                                          : 'bg-black/50 border border-slate-800 text-slate-300'
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
                                        className={`flex-1 py-1 rounded text-[11px] font-mono font-bold cursor-pointer transition-colors ${
                                          isSel
                                            ? 'bg-cyan-600 text-slate-950'
                                            : 'bg-black/60 text-slate-500 border border-slate-800'
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
                                  className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-bold text-xs rounded-lg font-mono cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
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
                            className={`bg-[#060b14]/90 border p-2.5 sm:p-3 rounded-2xl flex items-center justify-between gap-3 group transition-all hover:border-cyan-500/40 hover:bg-[#081220] ${
                              conflict ? 'border-amber-500/60 bg-amber-950/20' : 'border-white/10'
                            }`}
                          >
                            <div 
                              onClick={() => startEditingHabit(habit)}
                              className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                              title="Toca para editar horario o nombre"
                            >
                              {/* Franja horaria limpia */}
                              <div className="shrink-0 px-2.5 py-1 rounded-xl bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold shadow-[0_0_8px_rgba(0,240,255,0.15)] flex items-center gap-1.5">
                                <Icon name="timer" className="w-3 h-3 text-cyan-400" />
                                <span>{habit.timeBlock || 'Sin hora'}</span>
                              </div>

                              {/* Icono de la tarea */}
                              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                {renderHabitIcon(habit.quickIcon, habit.title, 'w-4 h-4')}
                              </div>

                              {/* Título y frecuencia */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs sm:text-sm font-bold text-slate-100 truncate group-hover:text-cyan-200 transition-colors">
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
                                  className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-mono text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                                  title="Resolver choque automáticamente"
                                >
                                  <Icon name="zap" className="w-3 h-3 text-amber-400" />
                                  <span className="hidden sm:inline">Resolver</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => startEditingHabit(habit)}
                                className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                title="Editar bloque"
                              >
                                <Icon name="edit" className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleRemoveHabit(habit.id)}
                                className="text-slate-500 hover:text-red-400 p-1.5 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
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

                {/* Pie de Acción Minimalista */}
                <div className="pt-3 border-t border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 px-1 text-[11px] font-mono text-slate-400">
                    <span>Modo de inyección:</span>
                    <div className="flex items-center gap-1 bg-black/50 p-0.5 rounded-lg border border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          soundFX.playClick();
                          setInjectMode('replace_pending');
                        }}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                          injectMode === 'replace_pending'
                            ? 'bg-cyan-500 text-slate-950 shadow-sm'
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
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                          injectMode === 'merge'
                            ? 'bg-cyan-500 text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Combinar
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        setSuggestedHabits(null);
                        setAddedHabitIds(new Set());
                        setEditingId(null);
                      }}
                      className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-anton uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer active:scale-95"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      onClick={handleAcceptSchedule}
                      disabled={suggestedHabits.length === 0}
                      className="flex-1 py-3 bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:opacity-95 disabled:opacity-40 text-slate-950 font-anton uppercase tracking-wider text-xs rounded-xl transition-all shadow-[0_0_25px_rgba(0,240,255,0.35)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <span>Aplicar Agenda a mi Día ({suggestedHabits.length} misiones)</span>
                      <Icon name="chevronRight" className="w-4 h-4 text-slate-950" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

