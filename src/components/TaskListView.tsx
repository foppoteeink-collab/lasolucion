import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Moon, Sparkles, ArrowRight } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { TaskItem, TaskCategory, HabitMasteryRecord, PlayerStats, CustomHabit, HabitEnergyType } from '../types';
import { soundFX } from '../utils/audio';
import { getTodayDateString, getYesterdayDateString } from '../utils/date';
import { parseTimeToMinutes, parseEndTimeToMinutes } from '../utils/timeUtils';
import { deduplicateTasksForDay } from '../utils/taskDeduplication';
import { getHabitBaseId } from '../intelligence/masteryEngine';

// Subcomponents
import { DailyBossWidget } from './DailyBossWidget';
import { CalendarView } from './CalendarView';
import { ClearDayConfirmModal } from './ClearDayConfirmModal';
import { TaskFilters } from './task-list/TaskFilters';
import { QuickHabitsWidget } from './task-list/QuickHabitsWidget';
import { LegendaryBountyCard } from './task-list/LegendaryBountyCard';
import { TaskCard } from './task-list/TaskCard';
import { TaskNoteModal } from './task-list/TaskNoteModal';
import { SciFiEmptyState } from './task-list/SciFiEmptyState';
import { SleepScheduleModal } from './task-list/SleepScheduleModal';
import { TaskFormModal } from './task-list/TaskFormModal';
import { HabitManagerModal } from './task-list/HabitManagerModal';
import { TaskHeaderHUD } from './task-list/TaskHeaderHUD';

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
  onOpenFinishDay,
  onOpenTemplates,
  onOpenOracle,
  onOpenJournal,
  onClearDay,
  onResetDay,
  streakCount = 1,
  habitMastery = {},
  stats,
  onUpdateStats,
  onReopenDay,
  onRegisterWakeUp,
  onClaimBossBounty,
  hasClaimedToday,
}) => {
  const { stats: { activeDailyBuff } } = usePlayerStore();
  const uncheckAllTasksForDate = useTaskStore((state) => state.uncheckAllTasksForDate);
  const startedDays = useTaskStore((state) => state.startedDays);
  const startDay = useTaskStore((state) => state.startDay);

  const isDayStarted = startedDays?.[currentDate] === true;

  const now = new Date();
  const currentLocalTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const [customWakeTime, setCustomWakeTime] = useState(currentLocalTime);

  const todayDateStr = getTodayDateString();
  const isPastDay = Boolean(currentDate && currentDate < todayDateStr);
  const isDayFinalized = Boolean(stats?.finalizedDays?.[currentDate]);
  const isDayEnded = isDayFinalized || isPastDay;
  const finalizedInfo = stats?.finalizedDays?.[currentDate];

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  // Quick Note Modal State
  const [noteTargetTask, setNoteTargetTask] = useState<TaskItem | null>(null);
  const [taskNoteText, setTaskNoteText] = useState('');

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
    setIsHabitType(shouldBeHabit || is2166);
    setHabitTarget(task.targetCount || (shouldBeHabit ? 1 : 5));
    setHabitUnit(task.unit || 'veces');
    setIsLegendary(task.isLegendaryBounty || false);
    setIsTracked2166(is2166);
    setIsQuickHabit(task.isQuickHabit || (customHabit && customHabit.isQuickHabit) || is2166);
    setQuickIcon(task.quickIcon || (customHabit && customHabit.quickIcon) || (is2166 ? '⚡' : ''));
    setNewIncomeAmount(task.incomeAmount || 0);
    setNewNotes(task.notes || '');

    if (customHabit) {
      setFormFrequency((customHabit.frequencyType as any) === 'weekly' ? 'specific_days' : (customHabit.frequencyType as any) || 'daily');
      setFormSpecificDays(customHabit.specificDays || []);
    } else if (is2166) {
      setFormFrequency('daily');
      setFormSpecificDays([]);
    } else {
      setFormFrequency('once');
      setFormSpecificDays([]);
    }

    setIsAddModalOpen(true);
  };

  const closeAndResetModal = () => {
    setIsAddModalOpen(false);
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
    setFormFrequency('once');
    setFormSpecificDays([]);
    setNewIncomeAmount(0);
    setNewNotes('');
  };

  const openAddModal = (isQuick = false) => {
    setEditingTaskId(null);
    setNewTitle('');
    setNewCategory(isQuick ? 'habito' : 'rutina');
    setNewStartTime('');
    setNewEndTime('');
    setNewXp(isQuick ? 5 : 10);
    setNewCoins(isQuick ? 2 : 4);
    setIsHabitType(isQuick ? true : false);
    setHabitTarget(isQuick ? 1 : 5);
    setHabitUnit('veces');
    setIsLegendary(false);
    setIsTracked2166(isQuick);
    setIsQuickHabit(isQuick);
    setQuickIcon(isQuick ? '⚡' : '');
    setFormFrequency(isQuick ? 'daily' : 'once');
    setFormSpecificDays([]);
    setNewNotes('');
    setIsAddModalOpen(true);
  };

  const handleEditHabit = (habit: CustomHabit) => {
    setEditingTaskId(habit.id);
    setNewTitle(habit.title);
    setNewCategory(habit.category);
    setNewStartTime('');
    setNewEndTime('');
    setNewXp(habit.xpReward || 15);
    setNewCoins(habit.coinReward || 5);
    setIsHabitType(true);
    setHabitTarget(habit.targetCount || 1);
    setHabitUnit(habit.unit || 'veces');
    setIsLegendary(habit.isLegendaryBounty || false);
    setIsTracked2166(habit.isTracked2166 ?? true);
    setIsQuickHabit(habit.isQuickHabit ?? true);
    setQuickIcon(habit.quickIcon || '⚡');
    setFormFrequency((habit.frequencyType as any) === 'specific_days' ? 'specific_days' : (habit.frequencyType as any) === 'once' ? 'once' : 'daily');
    setFormSpecificDays(habit.specificDays || []);
    setIsAddModalOpen(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    soundFX.playClick();
    const finalIsTracked2166 = Boolean(isTracked2166 || isQuickHabit);
    const finalIsQuickHabit = Boolean(isQuickHabit || isTracked2166);
    const finalIcon = quickIcon.trim() || (finalIsTracked2166 || finalIsQuickHabit ? '⚡' : '');
    const isHabitMode = Boolean(isHabitType || finalIsTracked2166);

    if (editingTaskId && onEditTask) {
      onEditTask(editingTaskId, {
        title: newTitle.trim(),
        category: newCategory,
        xpReward: (Number(newXp) || 10) * (isLegendary ? 2 : 1),
        coinReward: (Number(newCoins) || 4) * (isLegendary ? 2 : 1),
        timeBlock: newStartTime ? (newEndTime ? `${newStartTime} - ${newEndTime}` : newStartTime) : undefined,
        reminderTime: newStartTime ? newStartTime.trim() : undefined,
        isHabit: isHabitMode,
        targetCount: isHabitType ? Number(habitTarget) || 1 : finalIsTracked2166 ? 1 : undefined,
        unit: isHabitType ? habitUnit.trim() : finalIsTracked2166 ? 'vez' : undefined,
        isLegendaryBounty: isLegendary,
        isQuickHabit: finalIsQuickHabit,
        quickIcon: finalIcon,
        isTracked2166: finalIsTracked2166,
        incomeAmount: newCategory === 'trabajo' ? Number(newIncomeAmount) || 0 : undefined,
        notes: newNotes.trim() || undefined,
      });
      closeAndResetModal();
      return;
    }

    onAddTask({
      title: newTitle.trim(),
      category: newCategory,
      xpReward: (Number(newXp) || 10) * (isLegendary ? 2 : 1),
      coinReward: (Number(newCoins) || 4) * (isLegendary ? 2 : 1),
      timeBlock: newStartTime ? (newEndTime ? `${newStartTime} - ${newEndTime}` : newStartTime) : undefined,
      reminderTime: newStartTime ? newStartTime.trim() : undefined,
      isHabit: isHabitMode,
      targetCount: isHabitType ? Number(habitTarget) || 1 : finalIsTracked2166 ? 1 : undefined,
      currentCount: isHabitMode ? 0 : undefined,
      unit: isHabitType ? habitUnit : finalIsTracked2166 ? 'vez' : undefined,
      isCustom: true,
      isLegendaryBounty: isLegendary,
      isQuickHabit: finalIsQuickHabit,
      quickIcon: finalIcon,
      isTracked2166: finalIsTracked2166,
      incomeAmount: newCategory === 'trabajo' ? Number(newIncomeAmount) || 0 : undefined,
      notes: newNotes.trim() || undefined,
    });

    closeAndResetModal();
  };

  const safeRawTasks = (tasks || []).filter((t): t is TaskItem => Boolean(t && typeof t === 'object' && t.title));

  const isQuickHabitTask = (t: TaskItem) => {
    if (!t || !t.title) return false;
    if (t.isQuickHabit || t.isTracked2166 || t.category === 'habito' || (typeof t.id === 'string' && t.id.includes('habit-'))) {
      return true;
    }
    // If it has a scheduled timeBlock (and is not marked as a quick/2166 habit), it belongs in the Agenda Timeline!
    if (t.timeBlock) return false;
    const lower = t.title.toLowerCase();
    return (
      lower.includes('agua') ||
      lower.includes('dientes')
    );
  };

  const cleanTasks = deduplicateTasksForDay(safeRawTasks);
  const timelineTasks = cleanTasks.filter((t) => t && t.title && !isQuickHabitTask(t));
  const completedTimelineCount = timelineTasks.filter((t) => t.completed).length;
  const pendingTimelineCount = timelineTasks.filter((t) => !t.completed).length;
  const routineTimelineCount = timelineTasks.filter((t) => t.timeBlock && parseTimeToMinutes(t.timeBlock) < 9999).length;

  const filteredTasks = timelineTasks
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

  const legendaryTask = tasks.find((t) => t.isLegendaryBounty);

  return (
    <div className="space-y-4 font-sans tracking-wide pb-12">
      {/* Calendar Bar */}
      <CalendarView currentDate={currentDate} onChangeDate={onChangeDate} />

      {/* Main Control Header & HUD */}
      <TaskHeaderHUD
        currentDate={currentDate}
        onChangeDate={onChangeDate}
        todayDateStr={todayDateStr}
        isPastDay={isPastDay}
        isDayFinalized={isDayFinalized}
        isDayEnded={isDayEnded}
        finalizedInfo={finalizedInfo}
        streakCount={streakCount}
        onOpenFinishDay={onOpenFinishDay}
        onOpenTemplates={onOpenTemplates}
        onOpenOracle={onOpenOracle}
        onOpenJournal={onOpenJournal}
        onClearDay={onClearDay}
        onResetDay={onResetDay}
        onReopenDay={onReopenDay}
        onOpenAddModal={openAddModal}
        onOpenHabitManager={() => setIsHabitManagerOpen(true)}
        activeBuff={activeDailyBuff}
      />

      {/* Quick Habits Strip */}
      <div className="mb-4">
        <QuickHabitsWidget
          tasks={tasks}
          onIncrementHabit={onIncrementHabit}
          onOpenAddModal={openAddModal}
          onOpenEditModal={openEditModal}
          onOpenHabitManager={() => setIsHabitManagerOpen(true)}
          onDeleteTask={onDeleteTask}
          currentDate={currentDate}
          isDayFinalized={isDayFinalized}
        />
      </div>

      {/* Daily Boss & Legendary Bounty Drawer */}
      {legendaryTask && (
        <div className="mb-4">
          <LegendaryBountyCard
            task={legendaryTask}
            onToggle={onToggleTask}
            onOpenEditModal={openEditModal}
            onOpenNoteModal={openNoteModal}
            onDeleteTask={onDeleteTask}
            isDayEnded={isDayEnded}
          />
        </div>
      )}

      {/* Search & Category Filter Controls */}
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
          habits: tasks.filter(isQuickHabitTask).length,
          pending: pendingTimelineCount,
          completed: completedTimelineCount,
        }}
      />



      {/* Task List Timeline */}
      <div className="space-y-3">
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
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
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

        {/* 🌙 / ☀️ Dynamic End of Day / Start of Day Card (Bottom of Timeline) */}
        {(() => {
          // Logic: check if there's a pending wake time for currentDate, today, or yesterday
          const yesterdayStr = getYesterdayDateString();
          const sleepLogs = stats?.sleepLogs || {};
          const pendingDate =
            (sleepLogs[currentDate]?.bedtime && !sleepLogs[currentDate]?.wakeTime) ? currentDate
            : (sleepLogs[todayDateStr]?.bedtime && !sleepLogs[todayDateStr]?.wakeTime) ? todayDateStr
            : (sleepLogs[yesterdayStr]?.bedtime && !sleepLogs[yesterdayStr]?.wakeTime) ? yesterdayStr
            : null;

          // 1) PENDING WAKE-UP STATE
          if (pendingDate) {
            const pendingSleep = sleepLogs[pendingDate];
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-2xl border border-amber-500/50 bg-[#140a00]/95 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Registrar Despertar</span>
                      <span className="text-[11px] text-amber-400 font-mono">
                        (Dormiste {pendingSleep.bedtime})
                      </span>
                    </div>
                  </div>
                  <input
                    type="time"
                    value={customWakeTime}
                    onChange={(e) => setCustomWakeTime(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-black/60 border border-amber-700/60 rounded-lg px-2 py-1 text-white font-mono text-xs outline-none focus:border-amber-400 cursor-pointer"
                  />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFX.playClick();
                    onRegisterWakeUp?.(pendingDate, customWakeTime);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-anton text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Confirmar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          }

          // 2) START DAY STATE
          if (!isDayStarted && !isDayEnded) {
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  soundFX.playClick();
                  startDay(currentDate);
                }}
                className="mt-4 rounded-2xl border border-emerald-500/40 bg-[#02140e]/95 px-4 py-3 flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-400 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Iniciar Jornada
                  </span>
                </div>
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-anton text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Activar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          }

          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                soundFX.playClick();
                onOpenFinishDay();
              }}
              className="mt-4 rounded-2xl border border-indigo-500/40 bg-[#040818]/95 px-4 py-3 flex items-center justify-between gap-3 cursor-pointer hover:border-cyan-400/60 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {isDayFinalized ? 'Jornada Consolidada' : 'Cerrar Día & Registrar Sueño'}
                </span>
              </div>

              <button
                type="button"
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-anton text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <span>{isDayFinalized ? 'Revisar' : 'Cerrar Día'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })()}
      </div>

      {/* Modals */}
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

      <TaskFormModal
        isOpen={isAddModalOpen}
        onClose={closeAndResetModal}
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
        setHabitUnit={setHabitUnit}
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
        onSubmit={handleCreateTask}
      />


      <HabitManagerModal
        isOpen={isHabitManagerOpen}
        onClose={() => setIsHabitManagerOpen(false)}
        customHabits={customHabits}
        onSaveHabits={onSaveHabits}
        onOpenAddModal={openAddModal}
        onEditHabit={handleEditHabit}
      />

      {noteTargetTask && (
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
      )}

      {onClearDay && (
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
      )}
    </div>
  );
};

export const TaskListView = React.memo(TaskListViewComponent);
