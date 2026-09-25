import { create } from 'zustand';
import { 
  AppNotification, PomodoroSession, ShopReward, TaskCategory, TaskItem, CustomHabit, HabitMasteryRecord, FinancialTransaction 
} from '../types';
import { 
  loadHabitMastery, saveHabitMastery, loadGameSettings, saveGameSettings, loadSkillTree, saveSkillTree, loadCompanion, saveCompanion, 
  loadSavedShopRewards, saveShopRewards, loadPomodoroHistory, savePomodoroHistory, loadNotifications, saveNotifications, loadDailyReflections, saveDailyReflections, safeSetItem 
} from '../utils/storage';

interface AppState {
  habitMastery: Record<string, HabitMasteryRecord>;
  setHabitMastery: (val: Record<string, HabitMasteryRecord> | ((prev: Record<string, HabitMasteryRecord>) => Record<string, HabitMasteryRecord>)) => void;

  gameSettings: any;
  setGameSettings: (val: any) => void;

  skillTree: any;
  setSkillTree: (val: any) => void;

  companion: any;
  setCompanion: (val: any) => void;

  expenses: FinancialTransaction[];
  setExpenses: (val: FinancialTransaction[] | ((prev: FinancialTransaction[]) => FinancialTransaction[])) => void;

  shopRewards: ShopReward[];
  setShopRewards: (val: any) => void;

  pomodoroSessions: PomodoroSession[];
  setPomodoroSessions: (val: any) => void;

  notifications: AppNotification[];
  setNotifications: (val: any) => void;

  comboCount: number;
  setComboCount: (val: number | ((prev: number) => number)) => void;

  reflections: Record<string, string>;
  setReflections: (val: any) => void;

  levelUpData: { level: number; rank: string };
  setLevelUpData: (val: { level: number; rank: string }) => void;

  pomodoroPreFill: { title: string; category: TaskCategory };
  setPomodoroPreFill: (val: { title: string; category: TaskCategory }) => void;
}

export const useAppStore = create<AppState>((set) => ({
  habitMastery: loadHabitMastery(),
  setHabitMastery: (val) => set((state) => { const n = typeof val === 'function' ? val(state.habitMastery) : val; saveHabitMastery(n); return { habitMastery: n }; }),

  gameSettings: loadGameSettings(),
  setGameSettings: (val) => set((state) => { const n = typeof val === 'function' ? val(state.gameSettings) : val; saveGameSettings(n); return { gameSettings: n }; }),

  skillTree: loadSkillTree(),
  setSkillTree: (val) => set((state) => { const n = typeof val === 'function' ? val(state.skillTree) : val; saveSkillTree(n); return { skillTree: n }; }),

  companion: loadCompanion(),
  setCompanion: (val) => set((state) => { const n = typeof val === 'function' ? val(state.companion) : val; saveCompanion(n); return { companion: n }; }),

  expenses: (() => {
    try {
      const saved = localStorage.getItem('taskquest_expenses');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  })(),
  setExpenses: (val) => set((state) => { const n = typeof val === 'function' ? val(state.expenses) : val; safeSetItem('taskquest_expenses', JSON.stringify(n)); return { expenses: n }; }),

  shopRewards: loadSavedShopRewards(),
  setShopRewards: (val) => set((state) => { const n = typeof val === 'function' ? val(state.shopRewards) : val; saveShopRewards(n); return { shopRewards: n }; }),

  pomodoroSessions: loadPomodoroHistory(),
  setPomodoroSessions: (val) => set((state) => { const n = typeof val === 'function' ? val(state.pomodoroSessions) : val; savePomodoroHistory(n); return { pomodoroSessions: n }; }),

  notifications: loadNotifications(),
  setNotifications: (val) => set((state) => { const n = typeof val === 'function' ? val(state.notifications) : val; saveNotifications(n); return { notifications: n }; }),

  comboCount: 0,
  setComboCount: (val) => set((state) => ({ comboCount: typeof val === 'function' ? val(state.comboCount) : val })),

  reflections: loadDailyReflections(),
  setReflections: (val) => set((state) => { const n = typeof val === 'function' ? val(state.reflections) : val; saveDailyReflections(n); return { reflections: n }; }),

  levelUpData: { level: 1, rank: 'Aventurero' },
  setLevelUpData: (val) => set({ levelUpData: val }),

  pomodoroPreFill: { title: '', category: 'trabajo' as TaskCategory },
  setPomodoroPreFill: (val) => set({ pomodoroPreFill: val }),
}));
