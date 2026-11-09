import React, { useState, useMemo, useCallback } from 'react';
import { useUIStore } from '../store/useUIStore';
import { TaskItem, TaskCategory, HabitMasteryRecord, PlayerStats, CustomHabit, HabitEnergyType } from '../types';
import { soundFX } from '../utils/audio';
import { getTodayDateString, addDaysToDateString, parseLocalDate } from '../utils/date';
import { parseTimeToMinutes } from '../utils/timeUtils';
import { deduplicateTasksForDay } from '../utils/taskDeduplication';
import { getHabitBaseId } from '../intelligence/masteryEngine';
import { detectHabitEnergy } from '../utils/habitEnergyDetector';

// Subcomponents
import { CalendarView } from './CalendarView';
import { TaskFilters } from './task-list/TaskFilters';
import { QuickHabitsWidget } from './task-list/QuickHabitsWidget';
import { LegendaryBountyCard } from './task-list/LegendaryBountyCard';
import { TaskCard } from './task-list/TaskCard';
import { SciFiEmptyState } from './task-list/SciFiEmptyState';

// Lazy Loaded Modals for Zero First-Paint Overhead
const ClearDayConfirmModal = React.lazy(() => import('./ClearDayConfirmModal').then(m => ({ default: m.ClearDayConfirmModal })));
const TaskNoteModal = React.lazy(() => import('./task-list/TaskNoteModal').then(m => ({ default: m.TaskNoteModal })));
const SleepScheduleModal = React.lazy(() => import('./task-list/SleepScheduleModal').then(m => ({ default: m.SleepScheduleModal })));
const TaskFormModal = React.lazy(() => import('./task-list/TaskFormModal').then(m => ({ default: m.TaskFormModal })));
const HabitManagerModal = React.lazy(() => import('./task-list/HabitManagerModal').then(m => ({ default: m.HabitManagerModal })));

interface TaskListViewProps {
  currentDate: string;
  onChangeDate: (date: string) => void;
  tasks: TaskItem[];
  customHabits: CustomHabit[];
  onSaveHabits: (habits: CustomHabit[]) => void;
  onToggleTask: (taskId: string, e?: React.MouseEvent) => void;
  onIncrementHabit: (taskId: string, e?: React.MouseEvent) => void;
  onAddTask: (newTask: Omit<TaskItem, 'id' | 'completed'>) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask?: (taskId: string, updatedTask: Partial<TaskItem>) => void;
  onOpenPomodoroForTask: (taskTitle: string, category: TaskCategory) => void;
  onOpenFinishDay: () => void;
  onOpenTemplates?: () => void;
  onOpenOracle?: () => void;
  onOpenJournal?: () => void;
  onClearDay?: () => void;
  onResetDay?: () => void;
  streakCount?: number;
  habitMastery?: Record<string, HabitMasteryRecord>;
  stats?: PlayerStats;
  onUpdateStats?: React.Dispatch<React.SetStateAction<PlayerStats>>;
  onReopenDay?: (dateStr?: string) => void;
  onRegisterWakeUp?: (dateStr: string, customWakeTime?: string) => void;
  onClaimBossBounty?: (xp: number, coins: number) => void;
  hasClaimedToday?: boolean;
}

export const TaskListViewComponent: React.FC<TaskListViewProps> = ({
  currentDate,
  onChangeDate,
  tasks,
  customHabits,
  onSaveHabits,
  onToggleTask,
  onIncrementHabit,
  onAddTask,
  onDeleteTask,
  onEditTask,
  onOpenPomodoroForTask,
  onOpenTemplates,
  onOpenOracle,
  onClearDay,
  onResetDay,
  habitMastery = {},
  stats,
  onUpdateStats,
}) => {
  const todayDateStr = getTodayDateString();
  const reconciliationLimit = addDaysToDateString(todayDateStr, -2);
  const isPastDay = Boolean(currentDate && currentDate < todayDateStr);
  const isDayFinalized = Boolean(stats?.finalizedDays?.[currentDate]);
  // Conciliación Retrospectiva Honesta: el bloqueo estricto sólo aplica a días anteriores a 48h
  const isStrictlyLockedPast = Boolean(currentDate && currentDate < reconciliationLimit);
  const isDayEnded = (isDayFinalized || isPastDay) && isStrictlyLockedPast;

  // Sleep Modal State
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [sleepBedtime, setSleepBedtime] = useState('23:00');
  const [sleepWakeTime, setSleepWakeTime] = useState('07:00');
  const [sleepTargetTask, setSleepTargetTask] = useState<TaskItem | null>(null);

  // HUD & Modals State
  const [isHudExpanded, setIsHudExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'todos' | 'rutina' | 'habitos' | 'pendientes' | 'completados'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('todos');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const isTaskFormOpen = useUIStore((state) => state.isTaskFormOpen);
  const taskFormInitialTab = useUIStore((state) => state.taskFormInitialTab);
  const openTaskFormStore = useUIStore((state) => state.openTaskForm);
  const closeTaskFormStore = useUIStore((state) => state.closeTaskForm);

  const [isLocalAddModalOpen, setIsLocalAddModalOpen] = useState(false);
  const [initialModalTab, setInitialModalTab] = useState<'task' | 'habit' | 'oracle'>('task');
  const isModalOpen = isLocalAddModalOpen || isTaskFormOpen;
  const currentInitialTab = isLocalAddModalOpen ? initialModalTab : taskFormInitialTab;
  const [isHabitManagerOpen, setIsHabitManagerOpen] = useState(false);

  // Task Form State
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'baja' | 'media' | 'alta' | 'epica'>('media');
  const [newCategory, setNewCategory] = useState<TaskCategory>('entrenamiento');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newXp, setNewXp] = useState(10);
  const [newCoins, setNewCoins] = useState(4);
  const [newIncomeAmount, setNewIncomeAmount] = useState(0);
  const [isHabitType, setIsHabitType] = useState(false);
  const [habitTarget, setHabitTarget] = useState(5);
  const [habitUnit, setHabitUnit] = useState('veces');
  const [isLegendary, setIsLegendary] = useState(false);
  const [isTracked2166, setIsTracked2166] = useState(false);
  const [isQuickHabit, setIsQuickHabit] = useState(false);
  const [quickIcon, setQuickIcon] = useState('');
  const [formFrequency, setFormFrequency] = useState<'once' | 'daily' | 'specific_days'>('once');
  const [formSpecificDays, setFormSpecificDays] = useState<number[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newNotes, setNewNotes] = useState('');
  const [habitEnergyType, setHabitEnergyType] = useState<HabitEnergyType>('purification');
  const [targetStreak, setTargetStreak] = useState<21 | 66>(21);

  // Quick Note Modal State
  const [noteTargetTask, setNoteTargetTask] = useState<TaskItem | null>(null);
  const [taskNoteText, setTaskNoteText] = useState('');
  const [openActionMenuTaskId, setOpenActionMenuTaskId] = useState<string | null>(null);

  const toggleSpecificDay = (dayIndex: number) => {
    if (formSpecificDays.includes(dayIndex)) {
      setFormSpecificDays(formSpecificDays.filter((d) => d !== dayIndex));
    } else {
      setFormSpecificDays([...formSpecificDays, dayIndex].sort());
    }
  };

  const calculateSleepHours = (bedtime: string, wakeTime: string) => {
    const [bH, bM] = bedtime.split(':').map(Number);
    const [wH, wM] = wakeTime.split(':').map(Number);
    let diff = wH * 60 + (wM || 0) - (bH * 60 + (bM || 0));
    if (diff <= 0) diff += 24 * 60;
    return Math.round((diff / 60) * 10) / 10;
  };

  const handleOpenSleepModal = (task: TaskItem) => {
    setSleepTargetTask(task);
    const currentSaved = stats?.sleepLogs?.[currentDate];
    setSleepBedtime(currentSaved?.bedtime || '23:00');
    setSleepWakeTime(currentSaved?.wakeTime || '07:00');
    setIsSleepModalOpen(true);
  };

  const handleSaveSleep = () => {
    const duration = calculateSleepHours(sleepBedtime, sleepWakeTime);
    const quality = duration >= 7 ? 'Excelente' : duration >= 6 ? 'Buena' : 'Corta';
    if (onUpdateStats && stats) {
      onUpdateStats({
        ...stats,
        sleepLogs: {
          ...(stats.sleepLogs || {}),
          [currentDate]: {
            bedtime: sleepBedtime,
            wakeTime: sleepWakeTime,
            sleepDurationHours: duration,
            quality,
            completedAt: new Date().toISOString(),
          },
        },
      });
    }
    if (sleepTargetTask && !sleepTargetTask.completed) {
      onToggleTask(sleepTargetTask.id);
    }
    soundFX.playTaskComplete();
    setIsSleepModalOpen(false);
  };

  const openNoteModal = (task: TaskItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNoteTargetTask(task);
    setTaskNoteText(task.notes || '');
  };

  const handleSaveTaskNote = () => {
    if (!noteTargetTask) return;
    if (onEditTask) {
      onEditTask(noteTargetTask.id, { notes: taskNoteText.trim() });
    }
    soundFX.playClick();
    setNoteTargetTask(null);
  };

  const openEditModal = (task: TaskItem) => {
    const shouldBeHabit = task.isHabit || false;
    const customHabit = customHabits
      ? customHabits.find(
          (h) =>
            h.id === task.id ||
            h.id === getHabitBaseId(task) ||
            (task.title && (h.title || '').toLowerCase().trim() === task.title.toLowerCase().trim())
        )
      : undefined;
    const is2166 = Boolean(task.isTracked2166 || task.isQuickHabit || (customHabit && (customHabit.isTracked2166 || customHabit.isQuickHabit)));

    setEditingTaskId(task.id);
    setNewTitle(task.title);
    setNewCategory(task.category);
    if (task.timeBlock) {
      const parts = task.timeBlock.split('-');
      setNewStartTime(parts[0]?.trim() || '');
      setNewEndTime(parts[1]?.trim() || '');
    } else {
      setNewStartTime('');
      setNewEndTime('');
    }
    setNewXp(task.xpReward);
    setNewCoins(task.coinReward);
    const effectiveTargetCount =
      (task.targetCount && task.targetCount > 1)
        ? task.targetCount
        : (customHabit?.targetCount && customHabit.targetCount > 1)
          ? customHabit.targetCount
          : (task.targetCount ?? customHabit?.targetCount ?? 1);
    const effectiveUnit =
      (task.unit && task.unit.trim()) ||
      (customHabit?.unit && customHabit.unit.trim()) ||
      'veces';
    const hasNumericCounter = effectiveTargetCount > 1;
    setIsHabitType(hasNumericCounter);
    setHabitTarget(effectiveTargetCount);
    setHabitUnit(effectiveUnit);
    setIsLegendary(task.isLegendaryBounty || false);
    setIsTracked2166(is2166);
    setIsQuickHabit(task.isQuickHabit || (customHabit && customHabit.isQuickHabit) || is2166);
    setQuickIcon(task.quickIcon || (customHabit && customHabit.quickIcon) || (is2166 ? '⚡' : ''));
    setHabitEnergyType(task.habitEnergyType || customHabit?.habitEnergyType || detectHabitEnergy(task.title, task.category));
    setTargetStreak(task.targetStreak || customHabit?.targetStreak || 21);
    setNewIncomeAmount(task.incomeAmount || 0);
    setNewNotes(task.notes || '');

    if (customHabit) {
      setFormFrequency(customHabit.frequencyType === 'specific_days' || customHabit.frequencyType === 'weekly' ? 'specific_days' : 'daily');
      setFormSpecificDays(customHabit.specificDays || []);
    } else if (is2166) {
      setFormFrequency('daily');
      setFormSpecificDays([]);
    } else {
      setFormFrequency('once');
      setFormSpecificDays([]);
    }

    setInitialModalTab(is2166 ? 'habit' : 'task');
    setIsLocalAddModalOpen(true);
    openTaskFormStore(is2166 ? 'habit' : 'task');
  };

  const closeAndResetModal = () => {
    setIsLocalAddModalOpen(false);
    closeTaskFormStore();
    setEditingTaskId(null);
    setNewTitle('');
    setNewCategory('rutina');
    setNewStartTime('');
    setNewEndTime('');
    setNewXp(10);
    setNewCoins(4);
    setIsHabitType(false);
    setHabitTarget(5);
    setHabitUnit('veces');
    setIsLegendary(false);
    setIsTracked2166(false);
    setIsQuickHabit(false);
    setQuickIcon('');
    setHabitEnergyType('strength');
    setTargetStreak(21);
    setFormFrequency('once');
    setFormSpecificDays([]);
    setNewIncomeAmount(0);
    setNewNotes('');
  };

  const openAddModal = (mode: 'task' | 'habit' | 'weekly_reminder' | 'oracle' | boolean = 'task') => {
    const isWeekly = mode === 'weekly_reminder';
    const targetTab: 'task' | 'habit' | 'oracle' = 
      mode === true || mode === 'habit' || isWeekly ? 'habit' : mode === 'oracle' ? 'oracle' : 'task';
    const isHabit = targetTab === 'habit';
    setInitialModalTab(targetTab);
    setEditingTaskId(null);
    setNewTitle('');
    setNewCategory(isWeekly ? 'rutina' : isHabit ? 'entrenamiento' : 'rutina');
    setNewStartTime('');
    setNewEndTime('');
    setNewXp(isHabit ? 10 : 10);
    setNewCoins(isHabit ? 4 : 4);
    setIsHabitType(false); // Contador numérico colapsado por defecto
    setHabitTarget(1);
    setHabitUnit('veces');
    setIsLegendary(false);
    setIsTracked2166(!isWeekly && isHabit);
    setIsQuickHabit(!isWeekly && isHabit);
    setQuickIcon(!isWeekly && isHabit ? '⚡' : '📅');
    setHabitEnergyType('strength');
    setTargetStreak(21);
    setFormFrequency(isWeekly ? 'specific_days' : isHabit ? 'daily' : 'once');
    setFormSpecificDays(isWeekly ? [new Date().getDay()] : []);
    setNewNotes('');
    setIsLocalAddModalOpen(true);
    openTaskFormStore(targetTab);
  };

  const handleEditHabit = (habit: CustomHabit) => {
    setEditingTaskId(habit.id);
    setNewTitle(habit.title);
    setNewCategory(habit.category);
    setNewStartTime('');
    setNewEndTime('');
    setNewXp(habit.xpReward || 15);
    setNewCoins(habit.coinReward || 5);
    const hasNumericCounter = Boolean(habit.targetCount && habit.targetCount > 1);
    setIsHabitType(hasNumericCounter);
    setHabitTarget(habit.targetCount || 1);
    setHabitUnit(habit.unit || 'veces');
    setIsLegendary(habit.isLegendaryBounty || false);
    const is2166 = habit.isTracked2166 ?? (habit.isQuickHabit ?? true);
    setIsTracked2166(Boolean(is2166));
    setIsQuickHabit(Boolean(is2166));
    setQuickIcon(habit.quickIcon || (is2166 ? '⚡' : '📅'));
    setHabitEnergyType(habit.habitEnergyType || detectHabitEnergy(habit.title, habit.category));
    setTargetStreak(habit.targetStreak || 21);
    setFormFrequency(habit.frequencyType === 'specific_days' || habit.frequencyType === 'weekly' ? 'specific_days' : 'daily');
    setFormSpecificDays(habit.specificDays || []);
    setInitialModalTab('habit');
    setIsLocalAddModalOpen(true);
    openTaskFormStore('habit');
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    soundFX.playClick();
    const finalIsTracked2166 = Boolean(isTracked2166);
    const finalIsQuickHabit = Boolean(isQuickHabit);
    const finalIcon = quickIcon.trim() || (finalIsTracked2166 ? '⚡' : '📅');
    const isHabitMode = Boolean(isHabitType || finalIsTracked2166 || finalIsQuickHabit);
    const isRecurring = Boolean(isHabitMode || formFrequency === 'daily' || formFrequency === 'specific_days');

    // 1. Si es un hábito recurrente o recordatorio semanal, persistir en customHabits
    if (isRecurring && onSaveHabits) {
      const normTitle = newTitle.trim().toLowerCase();
      const existingIndex = (customHabits || []).findIndex(
        (h) =>
          (editingTaskId && (h.id === editingTaskId || h.id === getHabitBaseId({ id: editingTaskId, title: newTitle.trim() }))) ||
          (h.title && h.title.toLowerCase().trim() === normTitle)
      );

      const habitId = existingIndex >= 0
        ? customHabits[existingIndex].id
        : (editingTaskId ? editingTaskId : `custom-habit-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`);

      const updatedCustomHabit: CustomHabit = {
        id: habitId,
        title: newTitle.trim(),
        category: newCategory,
        xpReward: (Number(newXp) || 10) * (isLegendary ? 2 : 1),
        coinReward: (Number(newCoins) || 4) * (isLegendary ? 2 : 1),
        frequencyType: formFrequency === 'specific_days' ? 'specific_days' : 'daily',
        specificDays: formFrequency === 'specific_days' ? formSpecificDays : undefined,
        targetCount: isHabitType ? (Number(habitTarget) || 1) : 1,
        unit: isHabitType ? (habitUnit.trim() || 'veces') : 'vez',
        isQuickHabit: finalIsQuickHabit,
        isTracked2166: finalIsTracked2166,
        quickIcon: finalIcon,
        habitEnergyType: finalIsTracked2166 ? habitEnergyType : undefined,
        targetStreak: finalIsTracked2166 ? targetStreak : undefined,
        isLegendaryBounty: isLegendary,
        timeBlock: newStartTime ? (newEndTime ? `${newStartTime} - ${newEndTime}` : newStartTime) : undefined,
        reminderTime: newStartTime ? newStartTime.trim() : undefined,
      };

      let nextCustomHabits = [...(customHabits || [])];
      if (existingIndex >= 0) {
        nextCustomHabits[existingIndex] = { ...nextCustomHabits[existingIndex], ...updatedCustomHabit };
      } else {
        nextCustomHabits.push(updatedCustomHabit);
      }

      onSaveHabits(nextCustomHabits);

      // Si aplica al día actual que el usuario está visualizando, inyectarlo inmediatamente para que se vea reflejado
      const currentDayOfWeek = parseLocalDate(currentDate).getDay();
      const appliesToCurrentDate = 
        formFrequency === 'daily' || 
        (formFrequency === 'specific_days' && formSpecificDays.includes(currentDayOfWeek));

      if (appliesToCurrentDate && onAddTask) {
        onAddTask({
          title: newTitle.trim(),
          category: newCategory,
          xpReward: (Number(newXp) || 10) * (isLegendary ? 2 : 1),
          coinReward: (Number(newCoins) || 4) * (isLegendary ? 2 : 1),
          timeBlock: newStartTime ? (newEndTime ? `${newStartTime} - ${newEndTime}` : newStartTime) : undefined,
          reminderTime: newStartTime ? newStartTime.trim() : undefined,
          isHabit: Boolean(isHabitType || finalIsTracked2166),
          targetCount: isHabitType ? (Number(habitTarget) || 1) : finalIsTracked2166 ? 1 : undefined,
          currentCount: (isHabitType || finalIsTracked2166) ? 0 : undefined,
          unit: isHabitType ? (habitUnit.trim() || 'veces') : finalIsTracked2166 ? 'vez' : undefined,
          isCustom: true,
          isLegendaryBounty: isLegendary,
          isQuickHabit: finalIsQuickHabit,
          quickIcon: finalIcon,
          isTracked2166: finalIsTracked2166,
          habitEnergyType: finalIsTracked2166 ? habitEnergyType : undefined,
          targetStreak: finalIsTracked2166 ? targetStreak : undefined,
          incomeAmount: newCategory === 'trabajo' ? Number(newIncomeAmount) || 0 : undefined,
          notes: newNotes.trim() || undefined,
        });
      }
    }

    if (editingTaskId && onEditTask) {
      onEditTask(editingTaskId, {
        title: newTitle.trim(),
        category: newCategory,
        xpReward: (Number(newXp) || 10) * (isLegendary ? 2 : 1),
        coinReward: (Number(newCoins) || 4) * (isLegendary ? 2 : 1),
        timeBlock: newStartTime ? (newEndTime ? `${newStartTime} - ${newEndTime}` : newStartTime) : undefined,
        reminderTime: newStartTime ? newStartTime.trim() : undefined,
        isHabit: isHabitMode,
        targetCount: isHabitType ? (Number(habitTarget) || 1) : finalIsTracked2166 ? 1 : undefined,
        unit: isHabitType ? (habitUnit.trim() || 'veces') : finalIsTracked2166 ? 'vez' : undefined,
        isLegendaryBounty: isLegendary,
        isQuickHabit: finalIsQuickHabit,
        quickIcon: finalIcon,
        isTracked2166: finalIsTracked2166,
        habitEnergyType: finalIsTracked2166 ? habitEnergyType : undefined,
        incomeAmount: newCategory === 'trabajo' ? Number(newIncomeAmount) || 0 : undefined,
        notes: newNotes.trim() || undefined,
        targetStreak: finalIsTracked2166 ? targetStreak : undefined,
      });
      closeAndResetModal();
      return;
    }

    // Si es una tarea aislada de una sola vez, agregarla normalmente a la fecha actual
    if (!isRecurring) {
      onAddTask({
        title: newTitle.trim(),
        category: newCategory,
        xpReward: (Number(newXp) || 10) * (isLegendary ? 2 : 1),
        coinReward: (Number(newCoins) || 4) * (isLegendary ? 2 : 1),
        timeBlock: newStartTime ? (newEndTime ? `${newStartTime} - ${newEndTime}` : newStartTime) : undefined,
        reminderTime: newStartTime ? newStartTime.trim() : undefined,
        isHabit: isHabitMode,
        targetCount: isHabitType ? (Number(habitTarget) || 1) : finalIsTracked2166 ? 1 : undefined,
        currentCount: isHabitMode ? 0 : undefined,
        unit: isHabitType ? (habitUnit.trim() || 'veces') : finalIsTracked2166 ? 'vez' : undefined,
        isCustom: true,
        isLegendaryBounty: isLegendary,
        isQuickHabit: finalIsQuickHabit,
        quickIcon: finalIcon,
        isTracked2166: finalIsTracked2166,
        habitEnergyType: finalIsTracked2166 ? habitEnergyType : undefined,
        incomeAmount: newCategory === 'trabajo' ? Number(newIncomeAmount) || 0 : undefined,
        notes: newNotes.trim() || undefined,
        targetStreak: finalIsTracked2166 ? targetStreak : undefined,
      });
    }

    closeAndResetModal();
  };

  const safeRawTasks = useMemo(() => {
    return (tasks || []).filter((t): t is TaskItem => Boolean(t && typeof t === 'object' && t.title));
  }, [tasks]);

  const isQuickHabitTask = useCallback((t: TaskItem) => {
    if (!t || !t.title) return false;
    // Recordatorios semanales sin seguimiento 21/66 van directamente al timeline de la agenda
    if (t.isTracked2166 === false && t.isQuickHabit === false) {
      return false;
    }
    if (t.isQuickHabit || t.isTracked2166) {
      return true;
    }
    // Si tiene timeBlock y no está explícitamente marcado como hábito 21/66, pertenece a la agenda
    if (t.timeBlock) return false;
    const lower = t.title.toLowerCase();
    return (
      lower.includes('agua') ||
      lower.includes('dientes')
    );
  }, []);

  const cleanTasks = useMemo(() => deduplicateTasksForDay(safeRawTasks), [safeRawTasks]);

  const timelineTasks = useMemo(() => {
    return cleanTasks.filter((t) => t && t.title && !isQuickHabitTask(t));
  }, [cleanTasks, isQuickHabitTask]);

  const completedTimelineCount = useMemo(() => timelineTasks.filter((t) => t.completed).length, [timelineTasks]);
  const pendingTimelineCount = useMemo(() => timelineTasks.filter((t) => !t.completed).length, [timelineTasks]);
  const routineTimelineCount = useMemo(() => timelineTasks.filter((t) => t.timeBlock && parseTimeToMinutes(t.timeBlock) < 9999).length, [timelineTasks]);
  const habitsCount = useMemo(() => cleanTasks.filter(isQuickHabitTask).length, [cleanTasks, isQuickHabitTask]);

  const filteredTasks = useMemo(() => {
    return timelineTasks
      .filter((t) => {
        if (!t || !t.title) return false;
        if (activeFilter === 'rutina' && (!t.timeBlock || parseTimeToMinutes(t.timeBlock) === 9999)) return false;
        if (activeFilter === 'pendientes' && t.completed) return false;
        if (activeFilter === 'completados' && !t.completed) return false;
        if (selectedCategoryFilter !== 'todos' && t.category !== selectedCategoryFilter) return false;

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchesTitle = t.title.toLowerCase().includes(q);
          const matchesCategory = (t.category || '').toLowerCase().includes(q);
          const matchesNotes = t.notes?.toLowerCase().includes(q) || false;
          if (!matchesTitle && !matchesCategory && !matchesNotes) return false;
        }
        return true;
      })
      .sort((a, b) => parseTimeToMinutes(a.timeBlock) - parseTimeToMinutes(b.timeBlock));
  }, [timelineTasks, activeFilter, selectedCategoryFilter, searchTerm]);

  const legendaryTask = useMemo(() => (tasks || []).find((t) => t.isLegendaryBounty), [tasks]);

  return (
    <div className="flex flex-col gap-2 font-sans tracking-wide pb-32 sm:pb-36">
      {/* Unified Dashboard Header Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
        <div className="lg:col-span-4">
          <CalendarView currentDate={currentDate} onChangeDate={onChangeDate} onOpenAddModal={() => openAddModal('task')} />
        </div>
        <div className="lg:col-span-8">
          <QuickHabitsWidget
            tasks={tasks}
            onIncrementHabit={onIncrementHabit}
            onOpenAddModal={() => openAddModal('habit')}
            onOpenEditModal={openEditModal}
            onOpenHabitManager={() => setIsHabitManagerOpen(true)}
            onDeleteTask={onDeleteTask}
            currentDate={currentDate}
            isDayFinalized={isDayFinalized}
          />
        </div>
      </div>
      
      <TaskFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategoryFilter}
        onSelectCategory={setSelectedCategoryFilter}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={{
          total: timelineTasks.length,
          routine: routineTimelineCount,
          habits: habitsCount,
          pending: pendingTimelineCount,
          completed: completedTimelineCount,
        }}
      />

      {/* Daily Boss & Legendary Bounty Drawer */}
      {legendaryTask && (
        <LegendaryBountyCard
          task={legendaryTask}
          onToggle={onToggleTask}
          onOpenEditModal={openEditModal}
          onOpenNoteModal={openNoteModal}
          onDeleteTask={onDeleteTask}
          isDayEnded={isDayEnded}
        />
      )}

      {/* Task List Timeline */}
      <div className="space-y-0.5 pt-0.5">
        {filteredTasks.length === 0 ? (
          <SciFiEmptyState
            totalTasksInDay={tasks.length}
            selectedCategory={selectedCategoryFilter}
            activeFilter={activeFilter}
            searchTerm={searchTerm}
            onAddTask={() => openAddModal(false)}
            onResetDay={onResetDay}
            onClearFilters={() => {
              setSelectedCategoryFilter('todos');
              setActiveFilter('todos');
              setSearchTerm('');
            }}
          />
        ) : (
          <div className="space-y-0.5">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                currentDate={currentDate}
                isMenuOpen={openActionMenuTaskId === task.id}
                onToggleMenu={(id) => setOpenActionMenuTaskId(id)}
                onToggle={onToggleTask}
                onIncrementHabit={onIncrementHabit}
                onOpenEditModal={openEditModal}
                onOpenNoteModal={openNoteModal}
                onDeleteTask={onDeleteTask}
                onOpenPomodoro={onOpenPomodoroForTask}
                onOpenSleepModal={handleOpenSleepModal}
                isDayEnded={isDayEnded}
                habitMastery={habitMastery}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals rendered on-demand with Zero First-Paint Overhead */}
      {isSleepModalOpen && (
        <React.Suspense fallback={null}>
          <SleepScheduleModal
            isOpen={isSleepModalOpen}
            onClose={() => setIsSleepModalOpen(false)}
            onSave={handleSaveSleep}
            sleepBedtime={sleepBedtime}
            setSleepBedtime={setSleepBedtime}
            sleepWakeTime={sleepWakeTime}
            setSleepWakeTime={setSleepWakeTime}
            sleepTargetTask={sleepTargetTask}
            calculateSleepHours={calculateSleepHours}
          />
        </React.Suspense>
      )}

      {isModalOpen && (
        <React.Suspense fallback={null}>
          <TaskFormModal
            isOpen={isModalOpen}
            onClose={closeAndResetModal}
            initialTab={currentInitialTab}
            onOpenOracle={onOpenOracle}
            onOpenTemplates={onOpenTemplates}
            editingTaskId={editingTaskId}
            newTitle={newTitle}
            setNewTitle={setNewTitle}
            newCategory={newCategory}
            setNewCategory={setNewCategory}
            newStartTime={newStartTime}
            setNewStartTime={setNewStartTime}
            newEndTime={newEndTime}
            setNewEndTime={setNewEndTime}
            newXp={newXp}
            setNewXp={setNewXp}
            newCoins={newCoins}
            setNewCoins={setNewCoins}
            isHabitType={isHabitType}
            setIsHabitType={setIsHabitType}
            habitTarget={habitTarget}
            setHabitTarget={setHabitTarget}
            habitUnit={habitUnit}
            setNewHabitUnit={setHabitUnit}
            isLegendary={isLegendary}
            setIsLegendary={setIsLegendary}
            isTracked2166={isTracked2166}
            setIsTracked2166={setIsTracked2166}
            isQuickHabit={isQuickHabit}
            setIsQuickHabit={setIsQuickHabit}
            quickIcon={quickIcon}
            setQuickIcon={setQuickIcon}
            formFrequency={formFrequency}
            setFormFrequency={setFormFrequency}
            formSpecificDays={formSpecificDays}
            toggleSpecificDay={toggleSpecificDay}
            newIncomeAmount={newIncomeAmount}
            setNewIncomeAmount={setNewIncomeAmount}
            newNotes={newNotes}
            setNewNotes={setNewNotes}
            habitEnergyType={habitEnergyType}
            setHabitEnergyType={setHabitEnergyType}
            targetStreak={targetStreak}
            setTargetStreak={setTargetStreak}
            onSubmit={handleCreateTask}
          />
        </React.Suspense>
      )}

      {isHabitManagerOpen && (
        <React.Suspense fallback={null}>
          <HabitManagerModal
            isOpen={isHabitManagerOpen}
            onClose={() => setIsHabitManagerOpen(false)}
            customHabits={customHabits}
            onSaveHabits={onSaveHabits}
            onOpenAddModal={openAddModal}
            onEditHabit={handleEditHabit}
          />
        </React.Suspense>
      )}

      {noteTargetTask && (
        <React.Suspense fallback={null}>
          <TaskNoteModal
            task={noteTargetTask}
            noteText={taskNoteText}
            onNoteChange={setTaskNoteText}
            onClose={() => setNoteTargetTask(null)}
            onSave={handleSaveTaskNote}
            onDelete={() => {
              if (noteTargetTask && onEditTask) {
                onEditTask(noteTargetTask.id, { notes: undefined });
              }
              setNoteTargetTask(null);
            }}
          />
        </React.Suspense>
      )}

      {isClearModalOpen && onClearDay && (
        <React.Suspense fallback={null}>
          <ClearDayConfirmModal
            isOpen={isClearModalOpen}
            onClose={() => setIsClearModalOpen(false)}
            onConfirm={() => {
              onClearDay();
              setIsClearModalOpen(false);
            }}
            currentDate={currentDate}
            tasks={tasks}
            habitMastery={habitMastery}
          />
        </React.Suspense>
      )}
    </div>
  );
};

export const TaskListView = React.memo(TaskListViewComponent);
