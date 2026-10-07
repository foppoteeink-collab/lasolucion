export type TaskCategory = 'clientes' | 'limpieza' | 'entrenamiento' | 'comida' | 'creativo' | 'habito' | 'estudio' | 'pomodoro' | 'trabajo' | 'rutina';



export type PriorityLevel = 'baja' | 'media' | 'alta' | 'epica';

export type HabitEnergyType = 'purification' | 'strength' | 'mind' | 'discipline' | 'creativity';

export interface CustomHabit {
  id: string;
  title: string;
  category: TaskCategory;
  description?: string;
  xpReward: number;
  coinReward: number;
  frequencyType: 'daily' | 'weekly' | 'specific_days';
  specificDays?: number[]; // 0 = Domingo, 1 = Lunes, etc.
  timeBlock?: string;
  reminderTime?: string; // e.g. "09:30"
  isQuickHabit?: boolean;
  isTracked2166?: boolean;
  quickIcon?: string;
  targetCount?: number;
  isLegendaryBounty?: boolean;
  unit?: string;
  habitEnergyType?: HabitEnergyType;
}

export interface TaskItem {
  id: string;
  title: string;
  category: TaskCategory;
  priority?: PriorityLevel;
  description?: string;
  xpReward: number;
  coinReward: number;
  completed: boolean;
  completedAt?: string;
  rewardClaimed?: boolean; // ISO date
  awardedXp?: number;
  awardedCoins?: number;
  timeBlock?: string; // e.g. "05:00 - 12:00"
  reminderTime?: string; // e.g. "09:30"
  isHabit?: boolean;
  targetCount?: number;
  currentCount?: number;
  unit?: string;
  isQuickHabit?: boolean;
  isTracked2166?: boolean;
  quickIcon?: string;
  isLegendaryBounty?: boolean;
  incomeAmount?: number;
  notes?: string;
  isCustom?: boolean;
  isLocked?: boolean;
  lockedReason?: string;
  habitEnergyType?: HabitEnergyType;
  chestAwarded?: boolean;
}

export interface PlayerStats {
  level: number;
  currentXp: number;
  requiredXp: number;
  totalXpEarned: number;
  coins: number;
  hp: number;
  maxHp: number;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  lastDailyRewardClaimedDate: string; // YYYY-MM-DD
  profession?: string;
  mantra?: string;
  lastBossDefeatedDate?: string; // YYYY-MM-DD
  streakShields?: number;
  focusPotionExpiresAt?: number; // timestamp in ms
  reRollDice?: number;
  hiddenBossTaskId?: string;
  hiddenBossDate?: string;
  hiddenBossDefeatedDate?: string;
  lastEncounterDate?: string; // To track if a random encounter happened today
  activeDailyBuff?: {
    archetypeId: string;
    archetypeName: string;
    buffName: string;
    description: string;
    xpMultiplier: number;
    coinMultiplier: number;
    activatedAtDate: string;
  };
  rankTitle: string;
  username?: string;
  fullName?: string;
  bio?: string;
  age?: number;
  mainGoal?: string;
  finalizedDays?: Record<string, {
    finalizedAt: string; // ISO date string
    bonusXp: number;
    bonusCoins: number;
    sleepStartTime: string; // e.g. "23:15"
    wakeTimeTarget?: string;
    isSleepActive?: boolean;
    actualWakeTime?: string;
  }>;
  sleepLogs?: Record<string, {
    bedtime: string;
    wakeTime?: string;
    sleepDurationHours?: number;
    quality?: string;
    completedAt?: string;
    isTrackingActive?: boolean;
    trackingStartedAt?: string;
    actualWakeTime?: string;
  }>;
  phaseHistory?: Record<number, string>; // Record phase number -> ISO date string
  avatarIcon: string;
  characterClass?: string; // e.g. "Guerrero del Gym", "Paladín de Clientes", "Mago Creativo"
  attributes: {
    disciplina: number;
    fuerza: number;
    mente: number;
    energia: number;
    estudio: number;
  };
  inventory?: InventoryItem[];
  unopenedBoxes?: number;
}

export interface FloatingReward {
  id: string;
  xp: number;
  coins: number;
  text?: string;
  x?: number;
  y?: number;
}

export interface DailyRewardItem {
  day: number;
  coins: number;
  xp: number;
  bonusItem?: string;
  isMystery?: boolean;
}

export interface ShopReward {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: string;
  category: 'descanso' | 'comida' | 'ocio' | 'perk';
  unlockedCount: number;
}

export interface PomodoroSession {
  id: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  taskTitle: string;
  category: TaskCategory;
  completedAt: string; // ISO timestamp
  xpEarned: number;
  coinsEarned: number;
}

export interface WeeklyStatsDay {
  dayName: string; // 'Lun', 'Mar', etc.
  dateString: string; // YYYY-MM-DD
  focusMinutes: number;
  tasksCompleted: number;
  xpEarned: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'level_up' | 'daily_reward' | 'pomodoro' | 'streak' | 'info' | 'reminder' | 'task_alarm' | 'streak_warning' | 'nightly';
  read: boolean;
  icon?: string;
  actionUrl?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  morningReminderEnabled: boolean;
  morningReminderTime: string; // e.g. "08:00"
  afternoonReminderEnabled: boolean;
  afternoonReminderTime: string; // e.g. "14:00"
  streakSafeguardEnabled: boolean;
  streakSafeguardTime: string; // e.g. "20:00"
  nightlyReflectionEnabled: boolean;
  nightlyReflectionTime: string; // e.g. "21:30"
  taskAlarmsEnabled: boolean;
  soundEnabled: boolean;
}

export type ThemeMode = 'auto' | 'dark' | 'light';

export type NavigationMode = 'nexus' | 'classic';

export type ActiveTab = 'cover' | 'dashboard' | 'journal' | 'pomodoro' | 'shop' | 'stats' | 'skills' | 'settings' | 'planner';

export interface DayTemplate {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  tasks: Omit<TaskItem, 'id' | 'completed' | 'completedAt' | 'currentCount'>[];
  createdAt: string;
  isCustom?: boolean;
}

export interface DailyReflection {
  date: string; // YYYY-MM-DD
  note: string;
  updatedAt: string;
}

export interface RecallItem {
  id: string;
  sourceTaskId?: string;
  sourceDate?: string;
  title: string;
  category: TaskCategory;
  notes: string;
  createdAt: string; // YYYY-MM-DD
  lastReviewedAt?: string; // YYYY-MM-DD
  nextReviewDate: string; // YYYY-MM-DD
  level: number; // 0=Nuevo(1d), 1=(3d), 2=(7d), 3=(14d), 4=(30d), 5=Dominado(60d)
  reviewsCount: number;
  streak: number;
}

export interface HabitMasteryRecord {
  taskId: string;
  currentStreak: number;
  highestStreak: number;
  isMaltzReached: boolean;
  isMastered: boolean;
  shieldActive?: boolean;
  multiplier?: number;
  lastCompletedDate?: string; // YYYY-MM-DD to track skipped days
}

export interface Companion {
  id: string;
  name: string;
  baseForm: 'Orbe' | 'Bestia' | 'Espíritu';
  elementalAffinity: 'Fuego' | 'Arcano' | 'Tierra' | 'Luz' | 'Vacío';
  level: number;
  evolutionStage: 1 | 2 | 3;
  unlockedAuras?: HabitEnergyType[];
  activeAura?: HabitEnergyType;
  unlockedMasterForms?: string[];
  passiveXpBoost?: number;
}

export interface SkillNode {
  id: string;
  title: string;
  description: string;
  costCoins: number;
  isUnlocked: boolean;
  effectType: 'streak_shield' | 'xp_multiplier' | 'rest_day_pass';
  targetCategory?: string;
}

export interface GameSettings {
  enableDynamicQuests: boolean;
  enableCompanion: boolean;
  strictMode: boolean;
}

export interface FinancialTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category?: string;
  createdAt?: string;
}

export type ItemRarity = 'comun' | 'raro' | 'epico' | 'legendario';

export interface InventoryItem {
  id: string;
  baseId: string; // e.g. 'potion_focus', 'shield_mystic'
  name: string;
  description: string;
  icon: string; // emoji or lucide icon name
  rarity: ItemRarity;
  quantity: number;
  effectType: 'xp_boost' | 'coin_boost' | 'streak_shield' | 'revive_streak' | 'reveal_secret' | 'heal_hp';
  effectValue?: number; // e.g. 2 for 2x multiplier
  durationHours?: number; // if temporary buff
}

