

import { 
  ThemeMode, ActiveTab, PlayerStats, CustomHabit, 
  DayTemplate, RecallItem, PomodoroSession, ShopReward 
} from '../types';
import { 
  saveDailyReflections, safeGetItem, AppBackupData 
} from '../utils/storage';
import { RANKS, getRankForLevel, CharacterClassOption } from '../data/defaults';

import { useAppStore } from '../store/useAppStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTaskStore } from '../store/useTaskStore';
import { useUIStore } from '../store/useUIStore';
import { auth, db } from '../firebase';
import { doc, deleteDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { generateDailyTasks } from '../data/defaults';
import { getArchetypeByName, getArchetypeBuff } from '../data/archetypes';
import { getHabitBaseId, evaluateMasteryChange } from '../intelligence/masteryEngine';
import { getTodayDateString, getYesterdayDateString, addDaysToDateString, parseLocalDate } from '../utils/date';
import { soundFX } from '../utils/audio';
import { notificationService } from '../utils/notifications';
import { hapticPresets } from '../utils/haptics';
import { spawnJuiceParticle, spawnBossEmojiExplosion } from '../components/FloatingJuiceOverlay';
import { getRequiredXpForLevel } from '../data/defaults';
import { triggerShockwave } from '../utils/celebration';
import { safeSetItem, safeRemoveItem } from '../utils/storage';
import { TaskItem, TaskCategory } from '../types';
import { parseTimeToMinutes } from '../utils/timeUtils';

const triggerBossEmojiConfetti = () => {
  try {
    triggerShockwave({ color: 'gold', intensity: 'epic' });
    setTimeout(() => {
      triggerShockwave({ color: 'violet', intensity: 'epic' });
    }, 300);
  } catch (err) {
    console.error('Error in triggerBossEmojiConfetti:', err);
  }
};

export const handleResetAccount = async () => {

  const statePlayer = usePlayerStore.getState();
  const stats = statePlayer.stats;
  const setStats = statePlayer.setStats;

  const stateTask = useTaskStore.getState();
  const tasksByDate = stateTask.tasksByDate;
  const setTasksByDate = stateTask.setTasksByDate;
  const customHabits = stateTask.customHabits;
  const setCustomHabits = stateTask.setCustomHabits;
  const currentViewDate = stateTask.currentViewDate;
  const setCurrentViewDate = stateTask.setCurrentViewDate;

  const stateApp = useAppStore.getState();
  const habitMastery = stateApp.habitMastery;
  const setHabitMastery = stateApp.setHabitMastery;
  const gameSettings = stateApp.gameSettings;
  const setGameSettings = stateApp.setGameSettings;
  const skillTree = stateApp.skillTree;
  const setSkillTree = stateApp.setSkillTree;
  const companion = stateApp.companion;
  const setCompanion = stateApp.setCompanion;
  const expenses = stateApp.expenses;
  const setExpenses = stateApp.setExpenses;
  const shopRewards = stateApp.shopRewards;
  const setShopRewards = stateApp.setShopRewards;
  const pomodoroSessions = stateApp.pomodoroSessions;
  const setPomodoroSessions = stateApp.setPomodoroSessions;
  const notifications = stateApp.notifications;
  const setNotifications = stateApp.setNotifications;
  const comboCount = stateApp.comboCount;
  const setComboCount = stateApp.setComboCount;
  const reflections = stateApp.reflections;
  const setReflections = stateApp.setReflections;
  const levelUpData = stateApp.levelUpData;
  const setLevelUpData = stateApp.setLevelUpData;
  const pomodoroPreFill = stateApp.pomodoroPreFill;
  const setPomodoroPreFill = stateApp.setPomodoroPreFill;

  const stateUI = useUIStore.getState();
  const activeTab = stateUI.activeTab;
  const setActiveTab = stateUI.setActiveTab;
  const isTransitioning = stateUI.isTransitioning;
  const themeMode = stateUI.themeMode;
  const setThemeMode = stateUI.setThemeMode;
  const soundEnabled = stateUI.soundEnabled;
  const isPomodoroOpen = stateUI.isPomodoroOpen;
  const isDailyRewardsOpen = stateUI.isDailyRewardsOpen;
  const isLevelUpOpen = stateUI.isLevelUpOpen;
  const isFinishDayOpen = stateUI.isFinishDayOpen;
  const isNightlyReflectionOpen = stateUI.isNightlyReflectionOpen;
  const isDayTemplatesOpen = stateUI.isDayTemplatesOpen;
  const isSurpriseBossOpen = stateUI.isSurpriseBossOpen;
  const deleteConfirmTask = stateUI.deleteConfirmTask;
  const setDeleteConfirmTask = stateUI.setDeleteConfirmTask;
  const floatingEffects = stateUI.floatingEffects;
  const addFloatingEffect = stateUI.addFloatingEffect;
  const removeFloatingEffect = stateUI.removeFloatingEffect;
  const floatingRewards = stateUI.floatingRewards;
  const addFloatingReward = stateUI.addFloatingReward;
  const removeFloatingReward = stateUI.removeFloatingReward;
  const setModalState = stateUI.setModalState;
  
  // @ts-ignore
  const user = auth?.currentUser;
  const tasks = tasksByDate[currentViewDate] || [];
        (window as any).__isResettingAccount = true;
    if (user && db) {
      try {
        await deleteDoc(doc(db, 'users', user.uid));
        const taskMonthsRef = collection(db, 'users', user.uid, 'task_months');
        const snap = await getDocs(taskMonthsRef);
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.docs.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.error("Error deleting doc and task_months:", e);
      }
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && !key.startsWith('firebase')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => safeRemoveItem(key));
      }
    } catch (e) {
      console.warn('localStorage reset failed:', e);
    }
    window.location.reload();
  };
  
    

  
  
  

  export const handleSetCurrentViewDate = (newDateStr: string) => {

  const statePlayer = usePlayerStore.getState();
  const stats = statePlayer.stats;
  const setStats = statePlayer.setStats;

  const stateTask = useTaskStore.getState();
  const tasksByDate = stateTask.tasksByDate;
  const setTasksByDate = stateTask.setTasksByDate;
  const customHabits = stateTask.customHabits;
  const setCustomHabits = stateTask.setCustomHabits;
  const currentViewDate = stateTask.currentViewDate;
  const setCurrentViewDate = stateTask.setCurrentViewDate;

  const stateApp = useAppStore.getState();
  const habitMastery = stateApp.habitMastery;
  const setHabitMastery = stateApp.setHabitMastery;
  const gameSettings = stateApp.gameSettings;
  const setGameSettings = stateApp.setGameSettings;
  const skillTree = stateApp.skillTree;
  const setSkillTree = stateApp.setSkillTree;
  const companion = stateApp.companion;
  const setCompanion = stateApp.setCompanion;
  const expenses = stateApp.expenses;
  const setExpenses = stateApp.setExpenses;
  const shopRewards = stateApp.shopRewards;
  const setShopRewards = stateApp.setShopRewards;
  const pomodoroSessions = stateApp.pomodoroSessions;
  const setPomodoroSessions = stateApp.setPomodoroSessions;
  const notifications = stateApp.notifications;
  const setNotifications = stateApp.setNotifications;
  const comboCount = stateApp.comboCount;
  const setComboCount = stateApp.setComboCount;
  const reflections = stateApp.reflections;
  const setReflections = stateApp.setReflections;
  const levelUpData = stateApp.levelUpData;
  const setLevelUpData = stateApp.setLevelUpData;
  const pomodoroPreFill = stateApp.pomodoroPreFill;
  const setPomodoroPreFill = stateApp.setPomodoroPreFill;

  const stateUI = useUIStore.getState();
  const activeTab = stateUI.activeTab;
  const setActiveTab = stateUI.setActiveTab;
  const isTransitioning = stateUI.isTransitioning;
  const themeMode = stateUI.themeMode;
  const setThemeMode = stateUI.setThemeMode;
  const soundEnabled = stateUI.soundEnabled;
  const isPomodoroOpen = stateUI.isPomodoroOpen;
  const isDailyRewardsOpen = stateUI.isDailyRewardsOpen;
  const isLevelUpOpen = stateUI.isLevelUpOpen;
  const isFinishDayOpen = stateUI.isFinishDayOpen;
  const isNightlyReflectionOpen = stateUI.isNightlyReflectionOpen;
  const isDayTemplatesOpen = stateUI.isDayTemplatesOpen;
  const isSurpriseBossOpen = stateUI.isSurpriseBossOpen;
  const deleteConfirmTask = stateUI.deleteConfirmTask;
  const setDeleteConfirmTask = stateUI.setDeleteConfirmTask;
  const floatingEffects = stateUI.floatingEffects;
  const addFloatingEffect = stateUI.addFloatingEffect;
  const removeFloatingEffect = stateUI.removeFloatingEffect;
  const floatingRewards = stateUI.floatingRewards;
  const addFloatingReward = stateUI.addFloatingReward;
  const removeFloatingReward = stateUI.removeFloatingReward;
  const setModalState = stateUI.setModalState;
  
  // @ts-ignore
  const user = auth?.currentUser;
  const tasks = tasksByDate[currentViewDate] || [];
  setCurrentViewDate(newDateStr);
  setTasksByDate((prev) => {
    const rawExisting = prev[newDateStr] || [];
    const seenExisting = new Set<string>();
    const existingDayTasks = rawExisting.filter(t => {
      const key = (t.title || '').trim().toLowerCase();
      if (!key) return true;
      if (seenExisting.has(key)) return false;
      seenExisting.add(key);
      return true;
    });

    const generatedForDay = generateDailyTasks(newDateStr, customHabits);

    if (prev[newDateStr] === undefined) {
      return { ...prev, [newDateStr]: generatedForDay };
    }

    // Sincronizamos cualquier hábito o rutina activa que falte sin duplicados
    const missingTasks = generatedForDay.filter((genT, index, self) => {
      const titleMatch = (genT.title || "").trim().toLowerCase();
      const existsInOld = existingDayTasks.some(ext => ext.id === genT.id || (ext.title || "").trim().toLowerCase() === titleMatch);
      const existsInSelfBefore = self.findIndex(s => s.id === genT.id || (s.title || "").trim().toLowerCase() === titleMatch) < index;
      return !existsInOld && !existsInSelfBefore;
    });

    return { ...prev, [newDateStr]: [...existingDayTasks, ...missingTasks] };
  });
};

  export const updateCurrentTasks = (updater: (prev: TaskItem[]) => TaskItem[]) => {

  const statePlayer = usePlayerStore.getState();
  const stats = statePlayer.stats;
  const setStats = statePlayer.setStats;

  const stateTask = useTaskStore.getState();
  const tasksByDate = stateTask.tasksByDate;
  const setTasksByDate = stateTask.setTasksByDate;
  const customHabits = stateTask.customHabits;
  const setCustomHabits = stateTask.setCustomHabits;
  const currentViewDate = stateTask.currentViewDate;
  const setCurrentViewDate = stateTask.setCurrentViewDate;

  const stateApp = useAppStore.getState();
  const habitMastery = stateApp.habitMastery;
  const setHabitMastery = stateApp.setHabitMastery;
  const gameSettings = stateApp.gameSettings;
  const setGameSettings = stateApp.setGameSettings;
  const skillTree = stateApp.skillTree;
  const setSkillTree = stateApp.setSkillTree;
  const companion = stateApp.companion;
  const setCompanion = stateApp.setCompanion;
  const expenses = stateApp.expenses;
  const setExpenses = stateApp.setExpenses;
  const shopRewards = stateApp.shopRewards;
  const setShopRewards = stateApp.setShopRewards;
  const pomodoroSessions = stateApp.pomodoroSessions;
  const setPomodoroSessions = stateApp.setPomodoroSessions;
  const notifications = stateApp.notifications;
  const setNotifications = stateApp.setNotifications;
  const comboCount = stateApp.comboCount;
  const setComboCount = stateApp.setComboCount;
  const reflections = stateApp.reflections;
  const setReflections = stateApp.setReflections;
  const levelUpData = stateApp.levelUpData;
  const setLevelUpData = stateApp.setLevelUpData;
  const pomodoroPreFill = stateApp.pomodoroPreFill;
  const setPomodoroPreFill = stateApp.setPomodoroPreFill;

  const stateUI = useUIStore.getState();
  const activeTab = stateUI.activeTab;
  const setActiveTab = stateUI.setActiveTab;
  const isTransitioning = stateUI.isTransitioning;
  const themeMode = stateUI.themeMode;
  const setThemeMode = stateUI.setThemeMode;
  const soundEnabled = stateUI.soundEnabled;
  const isPomodoroOpen = stateUI.isPomodoroOpen;
  const isDailyRewardsOpen = stateUI.isDailyRewardsOpen;
  const isLevelUpOpen = stateUI.isLevelUpOpen;
  const isFinishDayOpen = stateUI.isFinishDayOpen;
  const isNightlyReflectionOpen = stateUI.isNightlyReflectionOpen;
  const isDayTemplatesOpen = stateUI.isDayTemplatesOpen;
  const isSurpriseBossOpen = stateUI.isSurpriseBossOpen;
  const deleteConfirmTask = stateUI.deleteConfirmTask;
  const setDeleteConfirmTask = stateUI.setDeleteConfirmTask;
  const floatingEffects = stateUI.floatingEffects;
  const addFloatingEffect = stateUI.addFloatingEffect;
  const removeFloatingEffect = stateUI.removeFloatingEffect;
  const floatingRewards = stateUI.floatingRewards;
  const addFloatingReward = stateUI.addFloatingReward;
  const removeFloatingReward = stateUI.removeFloatingReward;
  const setModalState = stateUI.setModalState;
  
  // @ts-ignore
  const user = auth?.currentUser;
  const tasks = tasksByDate[currentViewDate] || [];
        setTasksByDate((prev) => {
      const current = prev[currentViewDate] || [];
      return { ...prev, [currentViewDate]: updater(current) };
    });
  };

        
  
  export const handleSaveReflection = (date: string, text: string) => {

  const statePlayer = usePlayerStore.getState();
  const stats = statePlayer.stats;
  const setStats = statePlayer.setStats;

  const stateTask = useTaskStore.getState();
  const tasksByDate = stateTask.tasksByDate;
  const setTasksByDate = stateTask.setTasksByDate;
  const customHabits = stateTask.customHabits;
  const setCustomHabits = stateTask.setCustomHabits;
  const currentViewDate = stateTask.currentViewDate;
  const setCurrentViewDate = stateTask.setCurrentViewDate;

  const stateApp = useAppStore.getState();
  const habitMastery = stateApp.habitMastery;
  const setHabitMastery = stateApp.setHabitMastery;
  const gameSettings = stateApp.gameSettings;
  const setGameSettings = stateApp.setGameSettings;
  const skillTree = stateApp.skillTree;
  const setSkillTree = stateApp.setSkillTree;
  const companion = stateApp.companion;
  const setCompanion = stateApp.setCompanion;
  const expenses = stateApp.expenses;
  const setExpenses = stateApp.setExpenses;
  const shopRewards = stateApp.shopRewards;
  const setShopRewards = stateApp.setShopRewards;
  const pomodoroSessions = stateApp.pomodoroSessions;
  const setPomodoroSessions = stateApp.setPomodoroSessions;
  const notifications = stateApp.notifications;
  const setNotifications = stateApp.setNotifications;
  const comboCount = stateApp.comboCount;
  const setComboCount = stateApp.setComboCount;
  const reflections = stateApp.reflections;
  const setReflections = stateApp.setReflections;
  const levelUpData = stateApp.levelUpData;
  const setLevelUpData = stateApp.setLevelUpData;
  const pomodoroPreFill = stateApp.pomodoroPreFill;
  const setPomodoroPreFill = stateApp.setPomodoroPreFill;

  const stateUI = useUIStore.getState();
  const activeTab = stateUI.activeTab;
  const setActiveTab = stateUI.setActiveTab;
  const isTransitioning = stateUI.isTransitioning;
  const themeMode = stateUI.themeMode;
  const setThemeMode = stateUI.setThemeMode;
  const soundEnabled = stateUI.soundEnabled;
  const isPomodoroOpen = stateUI.isPomodoroOpen;
  const isDailyRewardsOpen = stateUI.isDailyRewardsOpen;
  const isLevelUpOpen = stateUI.isLevelUpOpen;
  const isFinishDayOpen = stateUI.isFinishDayOpen;
  const isNightlyReflectionOpen = stateUI.isNightlyReflectionOpen;
  const isDayTemplatesOpen = stateUI.isDayTemplatesOpen;
  const isSurpriseBossOpen = stateUI.isSurpriseBossOpen;
  const deleteConfirmTask = stateUI.deleteConfirmTask;
  const setDeleteConfirmTask = stateUI.setDeleteConfirmTask;
  const floatingEffects = stateUI.floatingEffects;
  const addFloatingEffect = stateUI.addFloatingEffect;
  const removeFloatingEffect = stateUI.removeFloatingEffect;
  const floatingRewards = stateUI.floatingRewards;
  const addFloatingReward = stateUI.addFloatingReward;
  const removeFloatingReward = stateUI.removeFloatingReward;
  const setModalState = stateUI.setModalState;
  
  // @ts-ignore
  const user = auth?.currentUser;
  const tasks = tasksByDate[currentViewDate] || [];
        setReflections((prev) => {
      const next = { ...prev };
      if (text.trim()) {
        next[date] = text.trim();
      } else {
        delete next[date];
      }
      saveDailyReflections(next);
      return next;
    });
  };

  



export const triggerFloatingHit = (x: number, y: number, text: string, type: 'xp' | 'coins' | 'critical' | 'streak' | 'combo') => {};
export const triggerRewardPopup = (xp: number, coins: number, text?: string) => {};
export const checkLevelUp = (prevStats: any, xpAdded: number, coinsAdded: number) => {
  let nextXp = (prevStats.currentXp || 0) + xpAdded;
  let nextLevel = typeof prevStats.level === 'number' && prevStats.level > 0 ? prevStats.level : 1;
  let requiredXp = getRequiredXpForLevel(nextLevel);
  let leveledUp = false;

  while (nextXp >= requiredXp && nextLevel < 100) {
    nextXp -= requiredXp;
    nextLevel += 1;
    requiredXp = getRequiredXpForLevel(nextLevel);
    leveledUp = true;
  }

  const matchedRank = getRankForLevel(nextLevel);
  const currentRankTitle = matchedRank?.title || 'Chispazo de Voluntad';
  const currentPhase = matchedRank?.phase || 1;

  if (leveledUp) {
    const stateApp = useAppStore.getState();
    stateApp.setLevelUpData({ level: nextLevel, rank: currentRankTitle });
    const stateUI = useUIStore.getState();
    
    // Suppress invasive full-screen level up modal for levels 1-10 to maintain logging flow
    if (nextLevel > 10) {
      stateUI.setModalState('isLevelUpOpen', true);
    } else {
      stateUI.addFloatingEffect({
        x: typeof window !== 'undefined' ? window.innerWidth / 2 : 200,
        y: 120,
        text: `⚡ ¡Nivel ${nextLevel} Alcanzado!`,
        type: 'xp'
      });
      soundFX.playLevelUp();
      triggerShockwave({ color: 'gold', intensity: 'epic' });
    }

    const updatedPhaseHistory = {
      ...(prevStats.phaseHistory || {}),
      [currentPhase]: prevStats.phaseHistory?.[currentPhase] || new Date().toISOString()
    };

    return {
      ...prevStats,
      currentXp: nextXp,
      level: nextLevel,
      requiredXp: requiredXp,
      rankTitle: currentRankTitle,
      phaseHistory: updatedPhaseHistory,
      totalXpEarned: (prevStats.totalXpEarned || 0) + xpAdded,
      coins: (prevStats.coins || 0) + coinsAdded
    };
  }

  return {
    ...prevStats,
    currentXp: nextXp,
    level: nextLevel,
    requiredXp: requiredXp,
    rankTitle: currentRankTitle,
    totalXpEarned: (prevStats.totalXpEarned || 0) + xpAdded,
    coins: (prevStats.coins || 0) + coinsAdded
  };
};
export const handleSelectClass = (charClass: CharacterClassOption) => {};
export const handleToggleTask = (taskId: string, e?: any) => {
  const stateTask = useTaskStore.getState();
  const date = stateTask.currentViewDate;
  const task = (stateTask.tasksByDate[date] || []).find(t => t.id === taskId);
  
  if (!task) return;

  const statePlayer = usePlayerStore.getState();
  const today = getTodayDateString();
  const isFinalized = Boolean(statePlayer.stats?.finalizedDays?.[date]);

  if (isFinalized) {
    soundFX.playClick();
    if (!task.completed) {
      if (typeof window !== 'undefined') {
        spawnJuiceParticle({
            x: e?.clientX || window.innerWidth / 2,
            y: (e?.clientY || window.innerHeight / 2) - 20,
            text: '🔒 Bloqueado: Día concluido',
            type: 'custom',
            colorClass: 'text-rose-400 bg-rose-950/95 border-rose-500'
        });
      }
      useUIStore.getState().addFloatingEffect({
        x: e?.clientX || (typeof window !== 'undefined' ? window.innerWidth / 2 : 200),
        y: (e?.clientY || 200) - 20,
        text: '🔒 Tarea en día finalizado (Bloqueada)',
        type: 'streak'
      });
      return;
    } else {
      alert('Esta jornada ya está finalizada y asegurada 🔒. Las actividades de días cerrados no se pueden modificar.');
      return;
    }
  }

  const wasCompleted = task.completed;
  stateTask.toggleTaskCompletion(date, taskId);
  
  // Calculate Retroactive Impuesto de Memoria (Soft Tax 0.8x) if task date is before today
  const isRetroactive = date < today;
  const taxMultiplier = isRetroactive ? 0.8 : 1.0;
  
  const rawXp = task.xpReward || 0;
  const rawCoin = task.coinReward || 0;

  let xpRewardToAdd = Math.floor(rawXp * taxMultiplier);
  let coinRewardToAdd = Math.floor(rawCoin * taxMultiplier);
  
  // Phase 2: Random Chests (20% chance to convert coins into a chest between 1 and 20)
  // Only applies if the task natively had coins and hasn't awarded a chest yet to prevent infinite farming.
  let wasChestFound = false;
  if (rawCoin > 0 && !task.chestAwarded && Math.random() < 0.20) {
    coinRewardToAdd = Math.floor(Math.random() * 20) + 1; // 1 to 20 coins
    wasChestFound = true;
  }

  // Phase 2: Focus Potion Multiplier
  if (statePlayer.stats?.focusPotionExpiresAt && statePlayer.stats.focusPotionExpiresAt > Date.now()) {
    xpRewardToAdd = Math.floor(xpRewardToAdd * 1.5);
    coinRewardToAdd = Math.floor(coinRewardToAdd * 1.5);
  }
  
  const xpRewardToSubtract = task.awardedXp ?? rawXp;
  const coinRewardToSubtract = task.awardedCoins ?? rawCoin;

  const xpReward = wasCompleted ? xpRewardToSubtract : xpRewardToAdd;
  const coinReward = wasCompleted ? coinRewardToSubtract : coinRewardToAdd;
  const stateUI = useUIStore.getState();

  if (!wasCompleted) {
    soundFX.playTaskComplete();
    stateTask.updateTask(date, taskId, {
      awardedXp: xpReward,
      awardedCoins: coinReward,
      chestAwarded: wasChestFound ? true : (task.chestAwarded || false)
    });
    
    // Random Boss encounter (15% chance)
    const todayStr = getTodayDateString();
    let currentStats = statePlayer.stats;
    if (currentStats.lastEncounterDate !== todayStr && Math.random() < 0.15) {
       currentStats = { ...currentStats, lastEncounterDate: todayStr };
       stateUI.openSurpriseBoss({
          archetypeName: 'Comandante de la Procrastinación',
          buffName: 'Jefe Aleatorio Derrotado',
          buffDescription: 'Reclama 50 XP y 20 Oro extra.'
       });
    }

    if (currentStats.lastEncounterDate === todayStr && xpReward === 0 && coinReward === 0) {
       statePlayer.setStats(currentStats);
    }
    
    if (xpReward > 0 || coinReward > 0) {
      const newStats = checkLevelUp(currentStats, xpReward, coinReward);
      statePlayer.setStats(newStats);
      
      // Crisp, tactile feedback on task complete without screen pollution
      try {
        hapticPresets.click();
      } catch {}

      if (wasChestFound) {
        soundFX.playLevelUp(); // Extra sound for chest
      }
    }
  } else {
    // Task was uncompleted, subtract points
    soundFX.playClick();
    stateTask.updateTask(date, taskId, { awardedXp: 0, awardedCoins: 0 });
    if (xpReward > 0 || coinReward > 0) {
      const stats = statePlayer.stats;
      statePlayer.setStats({
         ...stats,
         currentXp: Math.max(0, stats.currentXp - xpReward),
         totalXpEarned: Math.max(0, stats.totalXpEarned - xpReward),
         coins: Math.max(0, stats.coins - coinReward)
      });
    }
  }

  // Update Habit Mastery if this is a habit
  const updatedTask = (stateTask.tasksByDate[date] || []).find(t => t.id === taskId) || task;
  if (updatedTask.isHabit || updatedTask.isQuickHabit || updatedTask.isTracked2166 || updatedTask.id.includes('habit-')) {
    const appStore = useAppStore.getState();
    const { newMastery, bonusXp, notifications, boxesEarned } = evaluateMasteryChange(
      updatedTask,
      stateTask.tasksByDate,
      appStore.habitMastery,
      date
    );
    appStore.setHabitMastery(newMastery);
    if (bonusXp > 0) {
      const stats = statePlayer.stats;
      statePlayer.setStats(checkLevelUp(stats, bonusXp, 0));
    }
    if (notifications.length > 0) {
      const currentNotifs = appStore.notifications || [];
      appStore.setNotifications([...notifications, ...currentNotifs]);
    }
    if (boxesEarned > 0) {
      statePlayer.addLootBoxes(boxesEarned);
    }
  }

  // Instantly broadcast completion state to the cloud bridge
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      (window as any).__triggerCloudSyncNow?.();
    }, 150);
  }
};

export const handleIncrementHabit = (taskId: string, e?: any) => {
  const stateTask = useTaskStore.getState();
  const date = stateTask.currentViewDate;
  const tasks = stateTask.tasksByDate[date] || [];
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) return;
  const isHabitLike = task.isHabit || task.isQuickHabit || task.category === 'habito' || task.isTracked2166 || Boolean(task.id && task.id.includes('habit-')) || task.targetCount !== undefined;
  if (!isHabitLike) return;

  const statePlayer = usePlayerStore.getState();
  const isDayEnded = Boolean(statePlayer.stats?.finalizedDays?.[date]);

  if (isDayEnded && !task.completed) {
    soundFX.playClick();
    return;
  }

  const currentCount = task.currentCount || 0;
  const targetCount = task.targetCount || 1;

  // If already reached target or marked completed, we treat a click as an UNDO (reset to 0)
  if (currentCount >= targetCount || task.completed) {
    handleResetHabit(taskId, e);
    return;
  }

  const newCount = currentCount + 1;
  const isNowCompleted = newCount >= targetCount;

  stateTask.updateTask(date, taskId, {
    currentCount: newCount,
    completed: isNowCompleted,
    completedAt: isNowCompleted ? (task.completedAt || new Date().toISOString()) : undefined
  });

  soundFX.playTaskComplete();
  try {
    hapticPresets.click();
  } catch {}
  
  // Dar recompensas por cada incremento
  const xpReward = task.xpReward || 0;
  const coinReward = task.coinReward || 0;

  if (xpReward > 0 || coinReward > 0) {
    const newStats = checkLevelUp(statePlayer.stats, xpReward, coinReward);
    statePlayer.setStats(newStats);
  }

  if (isNowCompleted) {
    soundFX.playLevelUp(); // Extra sound for finishing habit

    // Random Boss encounter (20% chance on completing a habit)
    const today = new Date().toISOString().split('T')[0];
    let currentStats = statePlayer.stats;
    if (currentStats.lastEncounterDate !== today && Math.random() < 0.20) {
       currentStats = { ...currentStats, lastEncounterDate: today };
       statePlayer.setStats(currentStats);
       useUIStore.getState().openSurpriseBoss({
          archetypeName: 'Comandante de la Procrastinación',
          buffName: 'Jefe Aleatorio Derrotado',
          buffDescription: 'Reclama 50 XP y 20 Oro extra.'
       });
    }
  }

  // Evaluate habit mastery tracking
  const updatedTask = (stateTask.tasksByDate[date] || []).find(t => t.id === taskId) || task;
  const appStore = useAppStore.getState();
  const { newMastery, bonusXp, notifications, boxesEarned } = evaluateMasteryChange(
    updatedTask,
    stateTask.tasksByDate,
    appStore.habitMastery,
    date
  );
  appStore.setHabitMastery(newMastery);
  if (bonusXp > 0) {
    const stats = statePlayer.stats;
    statePlayer.setStats(checkLevelUp(stats, bonusXp, 0));
  }
  if (notifications.length > 0) {
    const currentNotifs = appStore.notifications || [];
    appStore.setNotifications([...notifications, ...currentNotifs]);
  }
  if (boxesEarned > 0) {
    statePlayer.addLootBoxes(boxesEarned);
  }

  // Instantly broadcast habit completion / progress to cloud bridge
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      (window as any).__triggerCloudSyncNow?.();
    }, 150);
  }
};

export const handleResetHabit = (taskId: string, e?: any) => {
  const stateTask = useTaskStore.getState();
  const date = stateTask.currentViewDate;
  const tasks = stateTask.tasksByDate[date] || [];
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const statePlayer = usePlayerStore.getState();
  const today = getTodayDateString();
  const isDayEnded = Boolean(statePlayer.stats?.finalizedDays?.[date]) || date < today;
  if (isDayEnded) {
    soundFX.playClick();
    return;
  }

  soundFX.playClick();
  const xpReward = task.awardedXp || task.xpReward || 0;
  const coinReward = task.awardedCoins || task.coinReward || 0;

  stateTask.updateTask(date, taskId, {
    currentCount: 0,
    completed: false,
    completedAt: undefined,
    rewardClaimed: false
  });

  if (task.completed && (xpReward > 0 || coinReward > 0)) {
    const stats = statePlayer.stats;
    statePlayer.setStats({
      ...stats,
      currentXp: Math.max(0, stats.currentXp - xpReward),
      totalXpEarned: Math.max(0, stats.totalXpEarned - xpReward),
      coins: Math.max(0, stats.coins - coinReward)
    });
  }

  useUIStore.getState().addFloatingEffect({
    x: e?.clientX || (typeof window !== 'undefined' ? window.innerWidth / 2 : 200),
    y: (e?.clientY || 200) - 20,
    text: 'Contador reiniciado (0)',
    type: 'streak'
  });

  if (typeof window !== 'undefined') {
    setTimeout(() => {
      (window as any).__triggerCloudSyncNow?.();
    }, 150);
  }
};

export const handleAddTask = (task: any) => {
  const store = useTaskStore.getState();
  store.addTask(store.currentViewDate, task);
};
export const handleDeleteTask = (taskId: string) => {
  const store = useTaskStore.getState();
  const task = (store.tasksByDate[store.currentViewDate] || []).find(t => t.id === taskId);
  if (task) {
     useUIStore.getState().setDeleteConfirmTask(task);
  }
};
export const handleEditTask = (taskId: string, updates: any) => {
  const store = useTaskStore.getState();
  store.updateTask(store.currentViewDate, taskId, updates);
};
export const handleUpdateTaskNote = (taskId: string, notes: string) => {
  const store = useTaskStore.getState();
  store.updateTask(store.currentViewDate, taskId, { notes });
};
export const handleClearDay = () => {
  const store = useTaskStore.getState();
  store.setTasksByDate({
     ...store.tasksByDate,
     [store.currentViewDate]: []
  });
};
export const handleResetDay = () => {
  const store = useTaskStore.getState();
  const tasks = store.tasksByDate[store.currentViewDate] || [];
  store.setTasksByDate({
     ...store.tasksByDate,
     [store.currentViewDate]: tasks.map(t => ({
       ...t,
       completed: false,
       completedAt: undefined,
       rewardClaimed: false,
       currentCount: 0
     }))
  });
};
export const executeDeleteTask = (deleteEverywhere = false) => {
  const uiStore = useUIStore.getState();
  const task = uiStore.deleteConfirmTask;
  if (task) {
     const store = useTaskStore.getState();
     store.deleteTask(store.currentViewDate, task.id);
     if (deleteEverywhere) {
       const baseId = getHabitBaseId(task);
       const filtered = store.customHabits.filter(h => 
         h.id !== task.id && 
         h.id !== baseId && 
         (h.title || '').toLowerCase().trim() !== (task.title || '').toLowerCase().trim()
       );
       store.setCustomHabits(filtered);
     }
  }
  uiStore.setDeleteConfirmTask(null);
  soundFX.playClick();
};
export const handleClaimDailyReward = (day: number, xp: number, coins: number, bonusItem?: string) => {
  const statePlayer = usePlayerStore.getState();
  const stateUI = useUIStore.getState();
  
  if (xp > 0 || coins > 0) {
    const newStats = checkLevelUp(statePlayer.stats, xp, coins);
    statePlayer.setStats(newStats);
    
    if (typeof window !== 'undefined') {
       stateUI.addFloatingEffect({ x: window.innerWidth / 2, y: window.innerHeight / 2 - 20, text: `+${xp} XP`, type: 'xp' });
       setTimeout(() => {
         stateUI.addFloatingEffect({ x: window.innerWidth / 2, y: window.innerHeight / 2 - 40, text: `+${coins} Oro`, type: 'coins' });
       }, 150);
    }
  }
  
  soundFX.playTaskComplete();
};
export const handleConfirmFinishDay = (bonusXp: number, bonusCoins: number) => {
  const statePlayer = usePlayerStore.getState();
  const stateTask = useTaskStore.getState();
  const stateUI = useUIStore.getState();
  
  const currentDate = stateTask.currentViewDate;
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let nextStats = statePlayer.stats;
  if (bonusXp > 0 || bonusCoins > 0) {
    nextStats = checkLevelUp(nextStats, bonusXp, bonusCoins);
  }

  nextStats = {
    ...nextStats,
    finalizedDays: {
      ...(nextStats.finalizedDays || {}),
      [currentDate]: {
        finalizedAt: now.toISOString(),
        bonusXp,
        bonusCoins,
        sleepStartTime: timeString,
        isSleepActive: true
      }
    },
    sleepLogs: {
      ...(nextStats.sleepLogs || {}),
      [currentDate]: {
        bedtime: timeString,
        isTrackingActive: true,
        trackingStartedAt: now.toISOString()
      }
    }
  };

  statePlayer.setStats(nextStats);

  // Marcar tareas incompletas como bloqueadas en la fecha finalizada
  const currentTasks = stateTask.tasksByDate[currentDate] || [];
  const updatedTasks = currentTasks.map(t => {
    const isFinished = t.isHabit ? ((t.currentCount || 0) >= (t.targetCount || 1) || t.completed) : t.completed;
    if (!isFinished) {
      return { ...t, isLocked: true, lockedReason: 'day_finalized' };
    }
    return t;
  });
  stateTask.setTasksByDate(prev => ({
    ...prev,
    [currentDate]: updatedTasks
  }));

  if (bonusXp > 0 || bonusCoins > 0) {
    if (typeof window !== 'undefined') {
       stateUI.addFloatingEffect({ x: window.innerWidth / 2, y: window.innerHeight / 2 - 20, text: `+${bonusXp} XP`, type: 'xp' });
       setTimeout(() => {
         stateUI.addFloatingEffect({ x: window.innerWidth / 2, y: window.innerHeight / 2 - 40, text: `+${bonusCoins} Oro`, type: 'coins' });
       }, 150);
    }
  }
  
  soundFX.playTaskComplete();
};
export const handleReopenDay = (dateStr?: string) => {
  const statePlayer = usePlayerStore.getState();
  const stateTask = useTaskStore.getState();
  const targetDate = dateStr || stateTask.currentViewDate;
  
  const stats = statePlayer.stats;
  const newFinalized = { ...stats.finalizedDays };
  delete newFinalized[targetDate];
  
  const newSleep = { ...stats.sleepLogs };
  delete newSleep[targetDate];

  statePlayer.setStats({
    ...stats,
    finalizedDays: newFinalized,
    sleepLogs: newSleep
  });

  // Desbloquear tareas en la fecha reabierta
  const currentTasks = stateTask.tasksByDate[targetDate] || [];
  const restoredTasks = currentTasks.map(t => ({
    ...t,
    isLocked: false,
    lockedReason: undefined
  }));
  stateTask.setTasksByDate(prev => ({
    ...prev,
    [targetDate]: restoredTasks
  }));
  
  soundFX.playClick();
};
export const sortTasksChronologically = (tasks: TaskItem[]): TaskItem[] => {
  return [...tasks].sort((a, b) => {
    const timeA = a.timeBlock ? parseTimeToMinutes(a.timeBlock) : 9999;
    const timeB = b.timeBlock ? parseTimeToMinutes(b.timeBlock) : 9999;
    if (timeA !== timeB) {
      return timeA - timeB;
    }
    return (a.title || '').localeCompare(b.title || '');
  });
};

import { deduplicateHabits, deduplicateTasksForDay, sanitizeTasksByDate } from '../utils/taskDeduplication';

export const injectHabitsToExistingDays = (newHabits?: CustomHabit[]) => {
  const store = useTaskStore.getState();
  const tasksByDate = store.tasksByDate;
  const customHabits = store.customHabits;
  const newTasksByDate = { ...tasksByDate };

  // Clean custom habits
  const habitsToInject = deduplicateHabits(newHabits && newHabits.length > 0 ? newHabits : customHabits);

  // Hidratar todas las fechas existentes en el almacén, más una ventana amplia (-7 a +30 días)
  const datesToHydrate = new Set<string>(Object.keys(newTasksByDate));
  const baseDate = store.currentViewDate || getTodayDateString();
  for (let i = -7; i <= 30; i++) {
    datesToHydrate.add(addDaysToDateString(baseDate, i));
  }

  datesToHydrate.forEach(date => {
     const rawTasksForDay = newTasksByDate[date] || [];
     const generated = generateDailyTasks(date, habitsToInject);
     
     // Merge raw tasks and newly generated tasks, then deduplicate semantically
     const combined = [...rawTasksForDay, ...generated];
     const deduplicated = deduplicateTasksForDay(combined);

     newTasksByDate[date] = sortTasksChronologically(deduplicated);
  });
  
  store.setTasksByDate(sanitizeTasksByDate(newTasksByDate));
};

export const handleSaveHabits = (habits: CustomHabit[]) => {
  const store = useTaskStore.getState();
  const cleanHabits = deduplicateHabits(habits);
  store.setCustomHabits(cleanHabits);
  injectHabitsToExistingDays(cleanHabits);
  soundFX.playClick();
};
export const handleClaimBossBounty = () => {
  const xpReward = 50;
  const coinReward = 20;
  const hpReward = 50;
  
  const statePlayer = usePlayerStore.getState();
  const stateUI = useUIStore.getState();
  
  statePlayer.heal(hpReward);
  const newStats = checkLevelUp(statePlayer.stats, xpReward, coinReward);
  statePlayer.setStats({
    ...newStats,
    lastBossDefeatedDate: statePlayer.stats.lastBossDefeatedDate || new Date().toISOString().split('T')[0]
  });
  
  soundFX.playBossDefeated();
  
  if (typeof window !== 'undefined') {
     spawnJuiceParticle({ x: window.innerWidth / 2, y: window.innerHeight / 2, text: '💖 ¡JEFE DERROTADO & HP RESTAURADO!', type: 'boss', isCrit: true });
     stateUI.addFloatingEffect({ x: window.innerWidth / 2, y: window.innerHeight / 2 - 20, text: `+${xpReward} XP`, type: 'xp' });
     setTimeout(() => {
       stateUI.addFloatingEffect({ x: window.innerWidth / 2, y: window.innerHeight / 2 - 40, text: `+${coinReward} Oro`, type: 'coins' });
     }, 150);
     setTimeout(() => {
       stateUI.addFloatingEffect({ x: window.innerWidth / 2, y: window.innerHeight / 2 - 60, text: `+${hpReward} HP 💖`, type: 'heal' });
     }, 300);
  }
};
export const hasClaimedBossToday = () => false;
export const handleApplyTemplate = (template: any, mode: 'replace' | 'merge') => {
  const store = useTaskStore.getState();
  const currentTasks = store.tasksByDate[store.currentViewDate] || [];
  
  const newTasks = template.tasks.map((t: any) => ({
    ...t,
    id: `task-${Date.now()}-${Math.random()}`,
    completed: false
  }));

  if (mode === 'replace') {
    store.setTasksByDate({
      ...store.tasksByDate,
      [store.currentViewDate]: newTasks
    });
  } else {
    store.setTasksByDate({
      ...store.tasksByDate,
      [store.currentViewDate]: [...currentTasks, ...newTasks]
    });
  }
  soundFX.playClick();
};

export const handleAddRecallAsTask = () => {};
export const handleOpenPomodoroForTask = (task: any) => {
  const store = useAppStore.getState();
  store.setPomodoroPreFill({ title: task.title, category: task.category });
  const uiStore = useUIStore.getState();
  uiStore.setModalState('isPomodoroOpen', true);
};

export const handlePomodoroComplete = (session: any) => {
  const stateApp = useAppStore.getState();
  stateApp.setPomodoroSessions([...stateApp.pomodoroSessions, session]);
  
  const xpReward = session.xpEarned || 0;
  const coinReward = session.coinsEarned || 0;
  
  const statePlayer = usePlayerStore.getState();
  const stateUI = useUIStore.getState();
  
  if (xpReward > 0 || coinReward > 0) {
    const newStats = checkLevelUp(statePlayer.stats, xpReward, coinReward);
    statePlayer.setStats(newStats);
    
    if (typeof window !== 'undefined') {
       stateUI.addFloatingEffect({ x: window.innerWidth / 2, y: window.innerHeight / 2 - 20, text: `+${xpReward} XP`, type: 'xp' });
       setTimeout(() => {
         stateUI.addFloatingEffect({ x: window.innerWidth / 2, y: window.innerHeight / 2 - 40, text: `+${coinReward} Oro`, type: 'coins' });
       }, 150);
    }
  }
};

export const handleRedeemReward = () => {};
export const handleAddCustomReward = () => {};
export const handleRestoreBackup = () => {};
export const handleRegisterWakeUp = (dateStr?: string, customWakeTime?: string) => {
  const statePlayer = usePlayerStore.getState();
  const stateTask = useTaskStore.getState();
  const stats = statePlayer.stats;
  const sleepLogs = stats.sleepLogs || {};

  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  // 1. Identify which date is pending wake up (prioritize passed dateStr, then today, then yesterday)
  const pendingDate = (() => {
    if (dateStr && sleepLogs[dateStr]?.bedtime && !sleepLogs[dateStr]?.wakeTime) return dateStr;
    if (sleepLogs[today]?.bedtime && !sleepLogs[today]?.wakeTime) return today;
    if (sleepLogs[yesterday]?.bedtime && !sleepLogs[yesterday]?.wakeTime) return yesterday;
    return dateStr || stateTask.currentViewDate || today;
  })();

  // 2. Complete the sleep log for pendingDate
  statePlayer.registerWakeUp(pendingDate, customWakeTime);
  soundFX.playLevelUp();

  // 3. Determine next day date (advance from pendingDate to next day)
  const nextDateStr = addDaysToDateString(pendingDate, 1);

  // 4. Ensure tasks & habits are generated for nextDateStr
  stateTask.ensureTasksForDate(nextDateStr);

  // 5. Automatically switch active view date to nextDateStr ready for the new day
  stateTask.setCurrentViewDate(nextDateStr);

  // 6. Trigger floating visual notification feedback
  if (typeof window !== 'undefined') {
    const stateUI = useUIStore.getState();
    const updatedStats = usePlayerStore.getState().stats;
    const log = updatedStats.sleepLogs?.[pendingDate];
    const hours = log?.sleepDurationHours ? `${log.sleepDurationHours}h` : '';
    stateUI.addFloatingEffect({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2 - 20,
      text: `☀️ ¡Jornada Iniciada! ${hours ? `(${hours} de Sueño)` : ''}`,
      type: 'xp'
    });
  }
};
