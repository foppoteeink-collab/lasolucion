import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, X, CheckCircle2, ChevronRight, AlertTriangle, Loader2, 
  Terminal, Zap, Plus, Check, ShieldCheck, Sparkles, Layers, 
  Edit3, Clock, Calendar, CheckSquare, RefreshCw, FastForward, Rewind, Trash2
} from 'lucide-react';
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
import { generateScheduleFrontend } from '../services/aiService';
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
  const [editCategory, setEditCategory] = useState<string>('rutina');
  const [editIcon, setEditIcon] = useState<string>('⚡');
  const [editFreq, setEditFreq] = useState<'daily' | 'specific_days'>('daily');
  const [editDays, setEditDays] = useState<number[]>([1, 2, 3, 4, 5]);

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
      if (initialPrompt) {
        setPrompt(initialPrompt);
        setActiveTab('prompt');
      }
    }
  }, [isOpen, initialPrompt]);

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
            setSuggestedHabits(sortByChronologicalTime(arranged));
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
            setSuggestedHabits(sortByChronologicalTime(arranged));
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
      }

      const rawHabits: CustomHabit[] = data.habits || [];
      const arranged = autoArrangeSchedule(rawHabits, scheduleMode, scheduleMode === 'master_blocks' ? 7 : 10);
      setSuggestedHabits(sortByChronologicalTime(arranged));
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
        setNotice("Agenda optimizada y libre de choques generada por el Motor Neural KAI.");
        const arranged = autoArrangeSchedule(fallbackHabits, scheduleMode, scheduleMode === 'master_blocks' ? 7 : 10);
        setSuggestedHabits(sortByChronologicalTime(arranged));
        setAddedHabitIds(new Set());
        soundFX.playSubBassConfirm();
        setError(null);
      } catch (fallbackErr) {
        let errMsg = err.message || 'Error de compilación en el Núcleo Central.';
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
        habitMap.set((h.title || '').toLowerCase().trim(), h);
      }
    });
    newCustomHabits.forEach(h => habitMap.set((h.title || '').toLowerCase().trim(), h));
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

    // 2. Inject into current view date and matching specific days of the active week for instant UI updates
    const updatedTasksByDate = { ...taskStore.tasksByDate };

    if (injectMode === 'replace_pending') {
      // Cleanly remove uncompleted non-habit tasks in the active window so old Day-1 or unorganized tasks don't clutter the new schedule
      for (let i = -2; i <= 7; i++) {
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
        // Hydrate matching days in current 7-day window
        for (let i = -2; i <= 7; i++) {
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
        // Hydrate all days in current 7-day window with date-isolated pending tasks
        for (let i = -2; i <= 7; i++) {
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

    // Fallback: if all habits were for specific days that don't include currentDateStr (e.g. Mon-Fri schedule created on Sunday),
    // still inject them into currentDateStr so the user sees their organized schedule immediately on the active screen!
    if (currentDayInsertedCount === 0 && suggestedHabits.length > 0) {
      suggestedHabits.forEach((h, index) => {
        const dayExisting = (updatedTasksByDate[currentDateStr] || []).filter(
          t => !isDuplicateActivity(t, { title: h.title, timeBlock: h.timeBlock })
        );
        const freshTask: TaskItem = {
          id: `oracle-task-${currentDateStr}-${index}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
        };
        updatedTasksByDate[currentDateStr] = gameEngine.sortTasksChronologically(
          deduplicateTasksForDay([...dayExisting, freshTask])
        );
      });
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
          className="bg-[#03000a] border-2 border-[#9600ff]/60 w-full max-w-2xl rounded-2xl shadow-[0_0_50px_rgba(150,0,255,0.35)] overflow-hidden flex flex-col max-h-[90vh]"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          {/* Header */}
          <div className="bg-[#000000] p-4 border-b border-[#9600ff]/50 flex justify-between items-center gap-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2 uppercase tracking-widest font-mono">
                <Cpu className="w-5 h-5 text-[#d6f421] animate-pulse" />
                Núcleo Central // Oráculo Neural
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-[10px] font-mono font-bold shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Gemini 3.8 AI Conectado</span>
              </span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 overflow-y-auto custom-scrollbar">
            {!suggestedHabits ? (
              <div className="space-y-4">
                <div className="bg-[#09001a] border border-[#9600ff]/40 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-[0_0_15px_rgba(150,0,255,0.15)]">
                  <div className="flex gap-3.5 items-start">
                    <div className="w-10 h-10 rounded-lg bg-[#000000] border border-[#9600ff] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(150,0,255,0.3)]">
                      <Terminal className="w-5 h-5 text-[#d6f421]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[11px] font-mono uppercase tracking-widest text-[#d6f421] font-bold bg-[#9600ff]/30 px-2 py-0.5 rounded border border-[#9600ff]/50">
                          Protocolo de Agenda v5.0
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">
                          Firebase AI Logic Activo
                        </span>
                      </div>
                      <p className="text-slate-200 text-xs leading-relaxed font-sans">
                        Organiza tus misiones de hoy con horarios inteligentes sin choques, o diseña tu semana completa paso a paso.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoOrganizeCurrentDay}
                    className="w-full sm:w-auto shrink-0 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#d6f421] to-emerald-400 hover:from-[#e2ff44] hover:to-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wider font-mono shadow-[0_0_20px_rgba(214,244,33,0.35)] flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Auto-Acomodar Hoy</span>
                  </button>
                </div>

                {/* Mode Tabs: Guided Assistant vs Free Prompt vs Presets vs Neural Analysis */}
                <div className="flex flex-wrap bg-[#03070d] border border-cyan-900/50 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setActiveTab('wizard');
                    }}
                    className={`flex-1 min-w-[100px] py-2 px-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'wizard'
                        ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                        : 'text-slate-400 hover:text-cyan-300 hover:bg-white/5'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Asistente Guiado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setActiveTab('prompt');
                    }}
                    className={`flex-1 min-w-[80px] py-2 px-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'prompt'
                        ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                        : 'text-slate-400 hover:text-cyan-300 hover:bg-white/5'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Modo Libre</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setActiveTab('templates');
                    }}
                    className={`flex-1 min-w-[80px] py-2 px-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'templates'
                        ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                        : 'text-slate-400 hover:text-cyan-300 hover:bg-white/5'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
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
                            Estrategia de Compilación:
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
                              <div className="flex items-center gap-1.5 font-bold font-mono text-xs text-cyan-300">
                                <Layers className="w-4 h-4" />
                                <span>Bloques Maestros (Recomendado)</span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                                Sintetiza el día en 4 a 6 bloques funcionales amplios. Evita la sobrecarga de 15 micro-tareas.
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
                              <div className="flex items-center gap-1.5 font-bold font-mono text-xs text-slate-200">
                                <CheckSquare className="w-4 h-4" />
                                <span>Modo Detallado</span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                                Extrae cada micro-actividad por separado para máxima granularidad paso a paso.
                              </p>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-cyan-400" />
                            Parámetros Personalizados (Opcional)
                          </label>
                          <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ejemplo: De lunes a viernes trabajo de 09:00 a 17:00 con almuerzo a las 13:00. Gimnasio de 18:00 a 19:30. Cena a las 20:30 y desconexión a las 23:00..."
                            className="w-full h-32 bg-[#03070d] border border-cyan-950 focus:border-cyan-400 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-600 resize-none outline-none transition-colors font-mono"
                          />
                        </div>

                        <button
                          onClick={() => handleGenerate()}
                          disabled={isLoading}
                          className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_25px_rgba(6,182,212,0.35)] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Cpu className="w-5 h-5" />
                          <span>Compilar Agenda y Rutina Diaria</span>
                        </button>
                      </div>
                    )}
                  </>
                )}

                {error && (
                  <div className="bg-red-950/50 border border-red-500/50 rounded-xl p-3 space-y-2">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-200 font-mono leading-relaxed">{error}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleGenerate()}
                      className="w-full py-2 bg-red-900/60 hover:bg-red-800/80 border border-red-500/40 text-red-200 text-xs font-mono font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reintentar Compilación Ahora</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {notice ? (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">Aviso de Telemetría</p>
                        <p className="text-xs text-amber-200/90 font-mono mt-0.5">{notice}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleGenerate()}
                      disabled={isLoading}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-[11px] font-mono font-bold rounded-lg shrink-0 flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Intentar conectar nuevamente con los modelos de IA"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>Reintentar con IA</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
                      <p className="text-xs font-mono font-bold text-emerald-300">
                        Agenda sintetizada en directo por Gemini 3.8 Flash (Firebase AI Logic)
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400/80 uppercase tracking-wider shrink-0 hidden sm:inline">
                      Conexión Activa
                    </span>
                  </div>
                )}

                <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <h4 className="text-cyan-300 font-bold flex items-center gap-2 font-mono text-sm uppercase tracking-wider">
                      <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                      Editor Visual de Bloques ({suggestedHabits.length})
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddNewManualBlock}
                        className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-mono font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                        title="Añadir un bloque de horario manualmente"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Añadir Bloque</span>
                      </button>
                      {suggestedHabits.length > 4 && (
                        <button
                          type="button"
                          onClick={handleSynthesizeExisting}
                          className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                          title="Consolidar tareas fragmentadas en bloques maestros"
                        >
                          <Layers className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Sintetizar</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-300">
                    Ajusta los bloques visualmente: puedes <strong className="text-cyan-300">cambiar horas, categorías, días o sumar bloques manuales</strong> antes de inyectar a tu agenda.
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-cyan-800/40 flex items-center gap-2 text-[11px] text-cyan-300/80 font-mono">
                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Desligado de Hábitos 21/66 Días: Estas tareas son directivas de agenda y no modifican tu progreso de Maltz ni maestría de hábitos.</span>
                  </div>
                </div>

                {/* Tactical Diagnostic Panel (Heuristic AI / Mathematical Engine) */}
                {diagnostic && (
                  <TacticalDiagnosticPanel
                    diagnostic={diagnostic}
                    onQuickFixConflict={handleQuickFixConflict}
                    onFillGap={handleFillGap}
                  />
                )}

                <div className="space-y-4">
                  {/* Day filter selector */}
                  <div className="flex bg-[#03070d] border border-cyan-950 rounded-xl p-1 overflow-x-auto custom-scrollbar">
                    <button
                      onClick={() => setPreviewDay('all')}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${previewDay === 'all' ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'text-slate-400 hover:text-cyan-300 hover:bg-white/5'}`}
                    >
                      Todos
                    </button>
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((label, idx) => {
                      const dayNum = idx === 6 ? 0 : idx + 1;
                      return (
                        <button
                          key={dayNum}
                          onClick={() => setPreviewDay(dayNum)}
                          className={`flex-1 min-w-[38px] px-2 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${previewDay === dayNum ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'text-slate-400 hover:text-cyan-300 hover:bg-white/5'}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-2.5">
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
                        const isAdded = addedHabitIds.has(habit.id);
                        const isEditing = editingId === habit.id;
                        const conflict = hasConflict(habit);
                        const relatedConflict = getConflictForHabit(habit.id);

                        if (isEditing) {
                          return (
                            <div key={habit.id ? `${habit.id}-${idx}` : `sugg-edit-${idx}`} className="bg-[#0b1625] border-2 border-cyan-400 p-4 rounded-xl space-y-3.5 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                                  <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                                  Editando Bloque de Agenda
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveHabit(habit.id)}
                                    className="text-red-400 hover:text-red-300 text-xs font-mono flex items-center gap-1 cursor-pointer hover:bg-red-950/40 px-2 py-1 rounded"
                                    title="Eliminar este bloque"
                                  >
                                    <Trash2 className="w-3 h-3" />
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
                                <label className="text-[11px] font-mono text-slate-400 block mb-1">Título de la Actividad / Tarea:</label>
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="w-full bg-[#03070d] border border-cyan-800 focus:border-cyan-400 rounded-lg px-3 py-1.5 text-sm text-slate-100 outline-none font-sans"
                                />
                              </div>

                              {/* Category & Icon Picker */}
                              <div>
                                <label className="text-[11px] font-mono text-slate-400 block mb-1">Categoría & Icono:</label>
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

                              {/* Time Selection: Dual Inputs + Quick nudges */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/40 border border-slate-800/80 p-3 rounded-xl">
                                <div>
                                  <label className="text-[11px] font-mono text-cyan-300 block mb-1">Franja Horaria:</label>
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
                                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Frecuencia:</label>
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
                                <label className="text-[11px] font-mono text-slate-400 block mb-1">Días Asignados:</label>
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
                                  className="px-5 py-2 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-xs rounded-lg font-mono cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Guardar Ajustes del Bloque</span>
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div 
                            key={habit.id ? `${habit.id}-${idx}` : `sugg-${idx}`} 
                            className={`bg-[#07111c] border p-3 rounded-xl flex flex-col gap-2 group transition-colors ${
                              conflict ? 'border-amber-500/60 hover:border-amber-400 bg-amber-950/10' : 'border-cyan-900/40 hover:border-cyan-500/40'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-500/20 flex items-center justify-center shrink-0">
                                  {renderHabitIcon(habit.quickIcon, habit.title, 'w-6 h-6')}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-slate-100 truncate">{habit.title}</p>
                                    {conflict && (
                                      <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[10px] font-mono font-semibold shrink-0" title="Existe otro bloque asignado a las mismas horas">
                                        ⚠️ Choque
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
                                    {habit.timeBlock ? (
                                      <span className="text-cyan-400 font-semibold flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {habit.timeBlock}
                                      </span>
                                    ) : (
                                      <span className="text-slate-500">Sin hora fijada</span>
                                    )}
                                    <span>•</span>
                                    <span className="text-slate-300">
                                      {habit.frequencyType === 'daily' ? 'Ciclo Diario' : 
                                       habit.specificDays?.map(mapDayToString).join(', ')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => startEditingHabit(habit)}
                                  className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                                  title="Editar título, horario o días"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleAddSingleRoutine(habit)}
                                  disabled={isAdded}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                    isAdded 
                                      ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' 
                                      : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 active:scale-95'
                                  }`}
                                  title={isAdded ? 'Añadida a la agenda' : 'Agregar individualmente a la agenda'}
                                >
                                  {isAdded ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Agregada</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Agregar</span>
                                    </>
                                  )}
                                </button>
                                
                                <button
                                  onClick={() => handleRemoveHabit(habit.id)}
                                  className="text-slate-500 hover:text-red-400 p-1.5 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg hover:bg-white/5"
                                  title="Descartar de la lista"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Quick Nudge / Tactical Shift Bar */}
                            {habit.timeBlock && (
                              <div className="pt-2 border-t border-cyan-950/60 flex flex-wrap items-center justify-between gap-1.5 text-[11px] font-mono">
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-500 text-[10px] uppercase font-bold mr-0.5">Ajuste:</span>
                                  <button
                                    type="button"
                                    onClick={() => handleNudgeHabit(habit.id, -15)}
                                    className="px-1.5 py-0.5 rounded bg-black/50 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 cursor-pointer transition-colors"
                                    title="Adelantar 15 min"
                                  >
                                    -15m
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleNudgeHabit(habit.id, 15)}
                                    className="px-1.5 py-0.5 rounded bg-black/50 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 cursor-pointer transition-colors"
                                    title="Postergar 15 min"
                                  >
                                    +15m
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleNudgeHabit(habit.id, 30)}
                                    className="px-1.5 py-0.5 rounded bg-black/50 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 cursor-pointer transition-colors"
                                    title="Postergar 30 min"
                                  >
                                    +30m
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleNudgeHabit(habit.id, 0, 15)}
                                    className="px-1.5 py-0.5 rounded bg-black/50 hover:bg-cyan-950/80 border border-slate-800 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-300 cursor-pointer transition-colors"
                                    title="Alargar duración +15m"
                                  >
                                    +15m dur
                                  </button>
                                </div>

                                {relatedConflict && (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickFixConflict(relatedConflict)}
                                    className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 text-[11px]"
                                    title="Resolver choque automáticamente en 1 clic"
                                  >
                                    <Zap className="w-3 h-3 text-amber-400" />
                                    <span>Auto-resolver Choque</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    
                    {suggestedHabits.length === 0 && (
                      <p className="text-center text-slate-500 py-8 text-sm font-mono">Cola vacía. Todas las directivas fueron descartadas.</p>
                    )}
                    {suggestedHabits.length > 0 && suggestedHabits.filter(habit => {
                        if (previewDay === 'all') return true;
                        if (habit.frequencyType === 'daily') return true;
                        return habit.specificDays?.includes(previewDay);
                      }).length === 0 && (
                      <p className="text-center text-slate-500 py-8 text-sm font-mono">No hay directivas asignadas a este ciclo.</p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-cyan-950/60 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#03070d] border border-cyan-900/40 rounded-xl p-2.5">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                      Modo de Inyección:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          soundFX.playClick();
                          setInjectMode('replace_pending');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                          injectMode === 'replace_pending'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                            : 'text-slate-400 hover:text-slate-200 bg-black/40 border border-slate-800'
                        }`}
                      >
                        Reemplazar Pendientes (Limpio)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          soundFX.playClick();
                          setInjectMode('merge');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                          injectMode === 'merge'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                            : 'text-slate-400 hover:text-slate-200 bg-black/40 border border-slate-800'
                        }`}
                      >
                        Combinar con Actuales
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSuggestedHabits(null);
                        setAddedHabitIds(new Set());
                        setEditingId(null);
                      }}
                      className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold uppercase tracking-wider text-xs rounded-xl transition-colors font-mono cursor-pointer"
                    >
                      Reconfigurar
                    </button>
                    <button
                      onClick={handleAcceptSchedule}
                      disabled={suggestedHabits.length === 0}
                      className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black uppercase tracking-wider text-xs rounded-xl transition-colors shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Aplicar a mi Agenda <ChevronRight className="w-4 h-4" />
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

