

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

/**
 * Contexto unificado de stores para el motor de juego.
 * Extrae y centraliza las referencias de los 4 stores globales (Player, Task, App, UI)
 * erradicando la duplicación de código en cada función exportada.
 */
export const getEngineContext = () => {
  const player = usePlayerStore.getState();
  const task = useTaskStore.getState();
  const app = useAppStore.getState();
  const ui = useUIStore.getState();

  return {
    player,
    task,
    app,
    ui,
    // Atajos de conveniencia
    stats: player.stats,
    setStats: player.setStats,
    tasksByDate: task.tasksByDate,
    setTasksByDate: task.setTasksByDate,
    customHabits: task.customHabits,
    setCustomHabits: task.setCustomHabits,
    currentViewDate: task.currentViewDate,
    setCurrentViewDate: task.setCurrentViewDate,
    habitMastery: app.habitMastery,
    setHabitMastery: app.setHabitMastery,
    gameSettings: app.gameSettings,
    setGameSettings: app.setGameSettings,
    skillTree: app.skillTree,
    setSkillTree: app.setSkillTree,
    companion: app.companion,
    setCompanion: app.setCompanion,
    expenses: app.expenses,
    setExpenses: app.setExpenses,
    shopRewards: app.shopRewards,
    setShopRewards: app.setShopRewards,
    pomodoroSessions: app.pomodoroSessions,
    setPomodoroSessions: app.setPomodoroSessions,
    notifications: app.notifications,
    setNotifications: app.setNotifications,
    comboCount: app.comboCount,
    setComboCount: app.setComboCount,
    reflections: app.reflections,
    setReflections: app.setReflections,
    levelUpData: app.levelUpData,
    setLevelUpData: app.setLevelUpData,
    pomodoroPreFill: app.pomodoroPreFill,
    setPomodoroPreFill: app.setPomodoroPreFill,
    activeTab: ui.activeTab,
    setActiveTab: ui.setActiveTab,
    isTransitioning: ui.isTransitioning,
    themeMode: ui.themeMode,
    setThemeMode: ui.setThemeMode,
    soundEnabled: ui.soundEnabled,
    isPomodoroOpen: ui.isPomodoroOpen,
    isDailyRewardsOpen: ui.isDailyRewardsOpen,
    isLevelUpOpen: ui.isLevelUpOpen,
    isFinishDayOpen: ui.isFinishDayOpen,
    isNightlyReflectionOpen: ui.isNightlyReflectionOpen,
    isDayTemplatesOpen: ui.isDayTemplatesOpen,
    isSurpriseBossOpen: ui.isSurpriseBossOpen,
    deleteConfirmTask: ui.deleteConfirmTask,
    setDeleteConfirmTask: ui.setDeleteConfirmTask,
    floatingEffects: ui.floatingEffects,
    addFloatingEffect: ui.addFloatingEffect,
    removeFloatingEffect: ui.removeFloatingEffect,
    floatingRewards: ui.floatingRewards,
    addFloatingReward: ui.addFloatingReward,
    removeFloatingReward: ui.removeFloatingReward,
    setModalState: ui.setModalState,
  };
};

export const handleResetAccount = async () => {
  // @ts-ignore
  const user = auth?.currentUser;
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
  const { setCurrentViewDate, setTasksByDate, customHabits } = getEngineContext();
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
    const { setTasksByDate, currentViewDate } = getEngineContext();
    setTasksByDate((prev) => {
      const current = prev[currentViewDate] || [];
      return { ...prev, [currentViewDate]: updater(current) };
    });
  };

  export const handleSaveReflection = (date: string, text: string) => {
    const { setReflections } = getEngineContext();
    const sanitized = (text || '').slice(0, 5000);
    setReflections((prev) => {
      const next = { ...prev };
      if (sanitized.trim()) {
        next[date] = sanitized.trim();
      } else {
        delete next[date];
      }
      saveDailyReflections(next);
      return next;
    });
  };

  



export const triggerFloatingHit = (x: number, y: number, text: string, type: 'xp' | 'coins' | 'critical' | 'streak' | 'combo') => {
  const stateUI = useUIStore.getState();
  stateUI.addFloatingEffect({ x, y, text, type });
};

export const triggerRewardPopup = (xp: number, coins: number, text?: string) => {
  const stateUI = useUIStore.getState();
  stateUI.addFloatingReward({
    xp,
    coins,
    text
  });
};
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
    
    // Descongestión modal: Solo activar modal a pantalla completa en niveles de hito (Nivel 2 y múltiplos de 5)
    const isMilestoneLevel = nextLevel === 2 || nextLevel % 5 === 0;
    if (isMilestoneLevel) {
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
export const handleSelectClass = (charClass: CharacterClassOption) => {
  if (!charClass) return;
  const statePlayer = usePlayerStore.getState();
  statePlayer.setStats(prev => ({
    ...prev,
    characterClass: charClass.name
  }));
  soundFX.playClick();
};
export const handleToggleTask = (taskId: string, e?: any) => {
  const stateTask = useTaskStore.getState();
  const date = stateTask.currentViewDate;
  const task = (stateTask.tasksByDate[date] || []).find(t => t.id === taskId);
  
  if (!task) return;

  const statePlayer = usePlayerStore.getState();
  const today = getTodayDateString();
  const reconciliationLimit = addDaysToDateString(today, -2);
  const isFinalized = Boolean(statePlayer.stats?.finalizedDays?.[date]);
  const isStrictlyLocked = isFinalized && date < reconciliationLimit;

  if (isStrictlyLocked) {
    soundFX.playClick();
    if (!task.completed) {
      if (typeof window !== 'undefined') {
        spawnJuiceParticle({
            x: e?.clientX || window.innerWidth / 2,
            y: (e?.clientY || window.innerHeight / 2) - 20,
            text: '🔒 Bloqueado: Más de 48h transcurridas',
            type: 'custom',
            colorClass: 'text-rose-400 bg-rose-950/95 border-rose-500'
        });
      }
      useUIStore.getState().addFloatingEffect({
        x: e?.clientX || (typeof window !== 'undefined' ? window.innerWidth / 2 : 200),
        y: (e?.clientY || 200) - 20,
        text: '🔒 Tarea en día archivado (+48h)',
        type: 'streak'
      });
      return;
    } else {
      if (typeof window !== 'undefined') {
        spawnJuiceParticle({
            x: e?.clientX || window.innerWidth / 2,
            y: (e?.clientY || window.innerHeight / 2) - 20,
            text: '🔒 Jornada archivada (+48h): sin cambios',
            type: 'custom',
            colorClass: 'text-rose-400 bg-rose-950/95 border-rose-500'
        });
      }
      useUIStore.getState().addFloatingEffect({
        x: e?.clientX || (typeof window !== 'undefined' ? window.innerWidth / 2 : 200),
        y: (e?.clientY || 200) - 20,
        text: '🔒 Jornada archivada (+48h): sin cambios',
        type: 'streak'
      });
      return;
    }
  }

  // Guard de Días Futuros: solo modo planificación (no se permite marcar completado)
  if (date > today) {
    soundFX.playClick();
    const x = e?.clientX || (typeof window !== 'undefined' ? window.innerWidth / 2 : 200);
    const y = (e?.clientY || 200) - 20;
    triggerFloatingHit(x, y, '⏳ Día futuro: modo planificación', 'coins');
    return;
  }

  const wasCompleted = task.completed;
  stateTask.toggleTaskCompletion(date, taskId);
  
  // Conciliación Retrospectiva Honesta (Multiplicador de 0.8x si la fecha es anterior a hoy)
  const isRetroactive = date < today;
  const taxMultiplier = isRetroactive ? 0.8 : 1.0;
  
  const rawXp = task.xpReward || 0;
  const rawCoin = task.coinReward || 0;

  let xpRewardToAdd = Math.floor(rawXp * taxMultiplier);
  let coinRewardToAdd = Math.floor(rawCoin * taxMultiplier);
  
  // Hito Determinista: Cofre de Maestría cada 5 tareas completadas en el día
  let wasChestFound = false;
  const currentDayTasks = stateTask.tasksByDate[date] || [];
  const completedTodayCount = currentDayTasks.filter(t => t.id === taskId ? !wasCompleted : t.completed).length;
  const isChestMilestone = !wasCompleted && completedTodayCount > 0 && completedTodayCount % 5 === 0;

  if (rawCoin > 0 && !task.chestAwarded && isChestMilestone) {
    coinRewardToAdd += 15; // Bonificación determinista de 15 monedas
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

    // Mensaje empático y no punitivo para registro retrospectivo
    if (isRetroactive) {
      if (typeof window !== 'undefined') {
        spawnJuiceParticle({
          x: e?.clientX || window.innerWidth / 2,
          y: (e?.clientY || window.innerHeight / 2) - 30,
          text: '⏳ Registro retrospectivo aplicado (80% XP)',
          type: 'custom',
          colorClass: 'text-amber-300 bg-amber-950/90 border-amber-500'
        });
      }
      stateUI.addFloatingEffect({
        x: e?.clientX || (typeof window !== 'undefined' ? window.innerWidth / 2 : 200),
        y: (e?.clientY || 200) - 30,
        text: '⏳ Registro retrospectivo aplicado (80% XP)',
        type: 'xp'
      });
    }
    
    // Encuentro Determinista con Jefe Diario (Umbral: 3 hábitos o tareas de alta prioridad completadas hoy)
    const todayStr = getTodayDateString();
    let triggeredBoss = false;
    const isBossEligible = !hasClaimedBossToday() && statePlayer.stats.lastEncounterDate !== todayStr;
    if (isBossEligible) {
      const allDayTasks = stateTask.tasksByDate[date] || [];
      const completedHabitsOrPriority = allDayTasks.filter(t => {
        const isHabitOrPriority = t.isHabit || t.priority === 'alta' || t.category === 'habito' || t.isQuickHabit || Boolean(t.id && t.id.includes('habit-'));
        const isDone = (t.id === taskId) ? true : (t.completed || (t.currentCount || 0) >= (t.targetCount || 1));
        return isHabitOrPriority && isDone;
      }).length;

      if (completedHabitsOrPriority >= 3) {
        triggeredBoss = true;
        stateUI.openSurpriseBoss({
          archetypeName: 'Comandante de la Procrastinación',
          buffName: 'Desafío Diario Superado',
          buffDescription: '¡Alcanzaste 3 hábitos o tareas clave hoy! Reclama 50 XP y 20 Monedas.'
        });
      }
    }

    if (xpReward > 0 || coinReward > 0) {
      statePlayer.setStats((prev) => {
        const base = triggeredBoss ? { ...prev, lastEncounterDate: todayStr } : prev;
        return checkLevelUp(base, xpReward, coinReward);
      });
      
      // Crisp, tactile feedback on task complete without screen pollution
      try {
        hapticPresets.click();
      } catch {}

      if (wasChestFound) {
        soundFX.playLevelUp(); // Extra sound for chest
        stateUI.addFloatingEffect({
          x: e?.clientX || (typeof window !== 'undefined' ? window.innerWidth / 2 : 200),
          y: (e?.clientY || 200) - 45,
          text: '🎁 ¡Cofre de Hito (5 tareas)! +15 Monedas',
          type: 'critical'
        });
      }
    } else if (triggeredBoss) {
      statePlayer.setStats((prev) => ({ ...prev, lastEncounterDate: todayStr }));
    }
  } else {
    // Task was uncompleted, subtract points atomically
    soundFX.playClick();
    stateTask.updateTask(date, taskId, { awardedXp: 0, awardedCoins: 0 });
    if (xpReward > 0 || coinReward > 0) {
      statePlayer.setStats((prev) => ({
        ...prev,
        currentXp: Math.max(0, prev.currentXp - xpReward),
        totalXpEarned: Math.max(0, prev.totalXpEarned - xpReward),
        coins: Math.max(0, prev.coins - coinReward)
      }));
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
      statePlayer.setStats((prev) => checkLevelUp(prev, bonusXp, 0));
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
  const { player: statePlayer, task: stateTask, ui: stateUI, app: stateApp } = getEngineContext();
  const date = stateTask.currentViewDate;
  const tasks = stateTask.tasksByDate[date] || [];
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) return;
  const isHabitLike = task.isHabit || task.isQuickHabit || task.category === 'habito' || task.isTracked2166 || Boolean(task.id && task.id.includes('habit-')) || task.targetCount !== undefined;
  if (!isHabitLike) return;

  const today = getTodayDateString();
  const reconciliationLimit = addDaysToDateString(today, -2);
  const isDayEnded = Boolean(statePlayer.stats?.finalizedDays?.[date]);
  const isStrictlyLocked = isDayEnded && date < reconciliationLimit;

  if (isStrictlyLocked && !task.completed) {
    soundFX.playClick();
    return;
  }

  // Guard de Días Futuros: solo modo planificación (no se permite incrementar hábitos)
  if (date > today) {
    soundFX.playClick();
    const x = e?.clientX || (typeof window !== 'undefined' ? window.innerWidth / 2 : 200);
    const y = (e?.clientY || 200) - 20;
    triggerFloatingHit(x, y, '⏳ Día futuro: modo planificación', 'coins');
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
  
  // Conciliación Retrospectiva Honesta (0.8x si la fecha es anterior a hoy)
  const isRetroactive = date < today;
  const taxMultiplier = isRetroactive ? 0.8 : 1.0;
  const xpReward = Math.floor((task.xpReward || 0) * taxMultiplier);
  const coinReward = Math.floor((task.coinReward || 0) * taxMultiplier);

  if (xpReward > 0 || coinReward > 0) {
    statePlayer.setStats((prev) => checkLevelUp(prev, xpReward, coinReward));
  }

  if (isRetroactive && !isNowCompleted) {
    stateUI.addFloatingEffect({
      x: e?.clientX || (typeof window !== 'undefined' ? window.innerWidth / 2 : 200),
      y: (e?.clientY || 200) - 25,
      text: '⏳ Registro retrospectivo (80% XP)',
      type: 'xp'
    });
  }

  if (isNowCompleted) {
    soundFX.playLevelUp(); // Extra sound for finishing habit

    if (isRetroactive) {
      stateUI.addFloatingEffect({
        x: e?.clientX || (typeof window !== 'undefined' ? window.innerWidth / 2 : 200),
        y: (e?.clientY || 200) - 35,
        text: '⏳ Registro retrospectivo completado (80% XP)',
        type: 'xp'
      });
    }

    // Encuentro Determinista con Jefe Diario (Umbral: 3 hábitos o tareas de alta prioridad completadas hoy)
    const isBossEligible = !hasClaimedBossToday() && statePlayer.stats.lastEncounterDate !== today;
    if (isBossEligible) {
      const allDayTasks = stateTask.tasksByDate[date] || [];
      const completedHabitsOrPriority = allDayTasks.filter(t => {
        const isHabitOrPriority = t.isHabit || t.priority === 'alta' || t.category === 'habito' || t.isQuickHabit || Boolean(t.id && t.id.includes('habit-'));
        const isDone = (t.id === taskId) ? true : (t.completed || (t.currentCount || 0) >= (t.targetCount || 1));
        return isHabitOrPriority && isDone;
      }).length;

      if (completedHabitsOrPriority >= 3) {
        statePlayer.setStats((prev) => ({ ...prev, lastEncounterDate: today }));
        stateUI.openSurpriseBoss({
          archetypeName: 'Comandante de la Procrastinación',
          buffName: 'Desafío Diario Superado',
          buffDescription: '¡Alcanzaste 3 hábitos o tareas clave hoy! Reclama 50 XP y 20 Monedas.'
        });
      }
    }
  }

  // Evaluate habit mastery tracking
  const updatedTask = (stateTask.tasksByDate[date] || []).find(t => t.id === taskId) || task;
  const { newMastery, bonusXp, notifications, boxesEarned } = evaluateMasteryChange(
    updatedTask,
    stateTask.tasksByDate,
    stateApp.habitMastery,
    date
  );
  stateApp.setHabitMastery(newMastery);
  if (bonusXp > 0) {
    statePlayer.setStats((prev) => checkLevelUp(prev, bonusXp, 0));
  }
  if (notifications.length > 0) {
    const currentNotifs = stateApp.notifications || [];
    stateApp.setNotifications([...notifications, ...currentNotifs]);
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
  const { player: statePlayer, task: stateTask } = getEngineContext();
  const date = stateTask.currentViewDate;
  const tasks = stateTask.tasksByDate[date] || [];
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const today = getTodayDateString();
  const reconciliationLimit = addDaysToDateString(today, -2);
  const isFinalized = Boolean(statePlayer.stats?.finalizedDays?.[date]);
  const isStrictlyLocked = (isFinalized || date < today) && date < reconciliationLimit;
  if (isStrictlyLocked) {
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
  const sanitized = (notes || '').slice(0, 5000);
  const store = useTaskStore.getState();
  store.updateTask(store.currentViewDate, taskId, { notes: sanitized });
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
  const { player: statePlayer, ui: stateUI } = getEngineContext();
  
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
  const { player: statePlayer, task: stateTask, ui: stateUI } = getEngineContext();
  
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

  // Conciliación Retrospectiva Honesta: Marcar tareas incompletas como bloqueadas en la fecha finalizada SOLO si está fuera del rango de 48h
  const reconciliationLimit = addDaysToDateString(getTodayDateString(), -2);
  if (currentDate < reconciliationLimit) {
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
  }

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
  const { player: statePlayer, task: stateTask } = getEngineContext();
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
  
  const { player: statePlayer, ui: stateUI } = getEngineContext();
  
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
export const hasClaimedBossToday = (): boolean => {
  const { stats } = getEngineContext();
  const today = getTodayDateString();
  return stats?.lastBossDefeatedDate === today;
};
export const handleApplyTemplate = (template: any, mode: 'replace' | 'merge') => {
  const { task: store } = getEngineContext();
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

export const handleAddRecallAsTask = (recallItem?: RecallItem) => {
  if (!recallItem || !recallItem.title) return;
  const { task: taskStore } = getEngineContext();
  const date = taskStore.currentViewDate || getTodayDateString();
  const newTask: TaskItem = {
    id: `task-recall-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: `Repaso: ${recallItem.title}`,
    category: recallItem.category || 'estudio',
    xpReward: 15,
    coinReward: 5,
    completed: false,
    description: recallItem.notes || 'Sesión de repaso activo'
  };
  taskStore.addTask(date, newTask);
  soundFX.playClick();
};
export const handleOpenPomodoroForTask = (task: any) => {
  const { app: store, ui: uiStore } = getEngineContext();
  store.setPomodoroPreFill({ title: task.title, category: task.category });
  uiStore.setModalState('isPomodoroOpen', true);
};

export const handlePomodoroComplete = (session: any) => {
  const { app: stateApp, player: statePlayer, ui: stateUI } = getEngineContext();
  stateApp.setPomodoroSessions([...stateApp.pomodoroSessions, session]);
  
  const xpReward = session.xpEarned || 0;
  const coinReward = session.coinsEarned || 0;
  
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

export const handleRedeemReward = (reward?: ShopReward) => {
  if (!reward) return;
  const { player: statePlayer, app: stateApp } = getEngineContext();
  const success = statePlayer.purchaseItem(reward.cost);
  if (success) {
    stateApp.setShopRewards(prev =>
      prev.map(r => (r.id === reward.id ? { ...r, unlockedCount: (r.unlockedCount || 0) + 1 } : r))
    );
    soundFX.playCoin();
  }
};

export const handleAddCustomReward = (newReward?: ShopReward) => {
  if (!newReward) return;
  const { app } = getEngineContext();
  app.setShopRewards(prev => [...prev, newReward]);
  soundFX.playClick();
};

export const handleRestoreBackup = (backupData?: any) => {
  if (!backupData) return;
  const { player, task } = getEngineContext();
  if (backupData.stats) player.setStats(backupData.stats);
  if (backupData.tasksByDate) task.setTasksByDate(backupData.tasksByDate);
};
export const handleRegisterWakeUp = (dateStr?: string, customWakeTime?: string) => {
  const { player: statePlayer, task: stateTask, ui: stateUI } = getEngineContext();
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
    const updatedStats = statePlayer.stats;
    const log = updatedStats.sleepLogs?.[pendingDate];
    const duration = log?.sleepDurationHours || 0;
    const hours = duration ? `${duration}h` : '';
    
    stateUI.addFloatingEffect({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2 - 20,
      text: `☀️ ¡Jornada Iniciada! ${hours ? `(${hours} de Sueño)` : ''}`,
      type: 'xp'
    });

    if (duration >= 7) {
      statePlayer.heal(20);
      setTimeout(() => {
        stateUI.addFloatingEffect({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2 - 45,
          text: '💖 Sueño Reparador (+20 HP)',
          type: 'heal'
        });
      }, 350);
    }
  }
};
