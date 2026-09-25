import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TaskItem, CustomHabit } from '../types';
import { loadCustomHabits } from '../utils/storage';
import { getTodayDateString } from '../utils/date';
import { sanitizeTasksByDate, deduplicateHabits, deduplicateTasksForDay } from '../utils/taskDeduplication';
import { generateDailyTasks } from '../data/defaults';
import { useUIStore } from './useUIStore';
import { usePlayerStore } from './usePlayerStore';

interface TaskState {
  tasksByDate: Record<string, TaskItem[]>;
  customHabits: CustomHabit[];
  currentViewDate: string;
  startedDays: Record<string, boolean>;
  
  setTasksByDate: (updater: Record<string, TaskItem[]> | ((prev: Record<string, TaskItem[]>) => Record<string, TaskItem[]>)) => void;
  setCustomHabits: (updater: CustomHabit[] | ((prev: CustomHabit[]) => CustomHabit[])) => void;
  setCurrentViewDate: (date: string) => void;
  ensureTodayTasks: () => void;
  ensureTasksForDate: (date: string) => void;

  addTask: (date: string, task: TaskItem) => void;
  updateTask: (date: string, taskId: string, updates: Partial<TaskItem>) => void;
  deleteTask: (date: string, taskId: string) => void;
  toggleTaskCompletion: (date: string, taskId: string) => void;
  uncheckAllTasksForDate: (date: string) => void;
  uncheckAllTasksForDate: (date: string) => void;
  lockTasksForDate: (date: string) => void;
  startDay: (date: string) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasksByDate: {},
      customHabits: deduplicateHabits(loadCustomHabits()),
      currentViewDate: getTodayDateString(),
      startedDays: {},

      ensureTodayTasks: () => {
        const state = get();
        const today = getTodayDateString();
        if (!state.tasksByDate[today] || state.tasksByDate[today].length === 0) {
          let generated = [];
          
          // Check if tasksByDate is completely empty (new user / Day 1 onboarding state)
          const isFreshUser = Object.keys(state.tasksByDate).length === 0;
          
          if (isFreshUser) {
            generated = [
              {
                id: `task-calib-os-${today}`,
                title: 'Calibrar interfaz "Quantum OS" 🌐',
                category: 'rutina' as any,
                description: 'Explora la terminal de control, el inventario holográfico y ajusta tu configuración.',
                xpReward: 30,
                coinReward: 15,
                completed: false,
                timeBlock: '08:00 - 08:30'
              },
              {
                id: `task-calib-oracle-${today}`,
                title: 'Sintonizar puente neural con el Oráculo 🧠',
                category: 'mente' as any,
                description: 'Abre el portal del Oráculo Neural, explora los asistentes y realiza tu primera consulta o calibración.',
                xpReward: 35,
                coinReward: 20,
                completed: false,
                timeBlock: '09:00 - 09:30'
              },
              {
                id: `task-calib-shield-${today}`,
                title: 'Forjar tu primer Escudo de Disciplina 🛡️',
                category: 'disciplina' as any,
                description: 'Familiarízate con la tienda del sistema, explora los "Streak Shields" y forja tu primera defensa de racha.',
                xpReward: 25,
                coinReward: 10,
                completed: false,
                timeBlock: '11:00 - 11:30'
              },
              {
                id: `task-calib-pomodoro-${today}`,
                title: 'Iniciar calibración de enfoque profundo (Pomodoro) ⚡',
                category: 'energia' as any,
                description: 'Inicia un ciclo Pomodoro de 25 minutos para calibrar tu capacidad de enfoque neuronal.',
                xpReward: 50,
                coinReward: 25,
                completed: false,
                timeBlock: '12:00 - 12:30'
              }
            ];
          } else {
            generated = generateDailyTasks(today, state.customHabits);
          }
          set({ tasksByDate: { ...state.tasksByDate, [today]: generated } });
        }
      },

      ensureTasksForDate: (date: string) => {
        const state = get();
        if (!date) return;
        if (!state.tasksByDate[date] || state.tasksByDate[date].length === 0) {
          const generated = generateDailyTasks(date, state.customHabits);
          set({ tasksByDate: { ...state.tasksByDate, [date]: generated } });
        }
      },

      setTasksByDate: (updater) => set((state) => { 
        const raw = typeof updater === 'function' ? updater(state.tasksByDate) : updater; 
        const sanitized = sanitizeTasksByDate(raw);
        return { tasksByDate: sanitized }; 
      }),
      
      setCustomHabits: (updater) => set((state) => { 
        const raw = typeof updater === 'function' ? updater(state.customHabits) : updater; 
        const sanitized = deduplicateHabits(raw);
        return { customHabits: sanitized }; 
      }),
      
      setCurrentViewDate: (date) => set({ currentViewDate: date }),

      uncheckAllTasksForDate: (date) => set((state) => {
        const list = state.tasksByDate[date] || [];
        const updated = list.map(t => ({
          ...t,
          completed: false,
          completedAt: undefined,
          rewardClaimed: false,
          currentCount: 0
        }));
        return { tasksByDate: { ...state.tasksByDate, [date]: updated } };
      }),

      lockTasksForDate: (date) => set((state) => {
        const list = state.tasksByDate[date] || [];
        const updated = list.map(t => {
          const isFinished = t.isHabit ? ((t.currentCount || 0) >= (t.targetCount || 1) || t.completed) : t.completed;
          if (!isFinished) {
            return { ...t, isLocked: true, lockedReason: 'day_finalized' };
          }
          return t;
        });
        return { tasksByDate: { ...state.tasksByDate, [date]: updated } };
      }),

      startDay: (date) => set((state) => ({
        startedDays: { ...state.startedDays, [date]: true }
      })),

      addTask: (date, task) => set((state) => { 
        const dayTasks = deduplicateTasksForDay([...(state.tasksByDate[date] || []), task]);
        return { tasksByDate: { ...state.tasksByDate, [date]: dayTasks } }; 
      }),
      
      updateTask: (date, taskId, updates) => set((state) => { 
        const updated = (state.tasksByDate[date] || []).map(t => t.id === taskId ? { ...t, ...updates } : t);
        const dayTasks = deduplicateTasksForDay(updated);
        return { tasksByDate: { ...state.tasksByDate, [date]: dayTasks } }; 
      }),
      
      deleteTask: (date, taskId) => set((state) => { 
        return { tasksByDate: { ...state.tasksByDate, [date]: (state.tasksByDate[date] || []).filter(t => t.id !== taskId) } }; 
      }),
      
      toggleTaskCompletion: (date, taskId) => set((state) => { 
        const tasks = state.tasksByDate[date] || [];
        const targetTask = tasks.find(t => t.id === taskId);
        if (!targetTask) return state;

        const playerStats = usePlayerStore.getState().stats;
        const isFinalized = Boolean(playerStats?.finalizedDays?.[date]);
        if (isFinalized && !targetTask.completed) {
          return state;
        }

        let wasCompleted = false;
        const updatedTasks = tasks.map(t => {
          if (t.id === taskId) {
            wasCompleted = !t.completed;
            return { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined };
          }
          return t;
        });

        const n = { ...state.tasksByDate, [date]: updatedTasks }; 

        if (wasCompleted) {
          const completedToday = updatedTasks.filter(t => t.completed).length;
          if (completedToday === 3) {
            const hasTriggeredBoss = typeof window !== 'undefined' && sessionStorage.getItem('bossTriggeredToday') === 'true';
            if (!hasTriggeredBoss) {
               if (typeof window !== 'undefined') sessionStorage.setItem('bossTriggeredToday', 'true');
               useUIStore.getState().setModalState('isSurpriseBossOpen', true);
            }
          }
        }

        return { tasksByDate: n }; 
      })
    }),
    {
      name: 'quantum-os-task-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state && state.tasksByDate) {
          state.tasksByDate = sanitizeTasksByDate(state.tasksByDate);
        }
      },
    }
  )
);
