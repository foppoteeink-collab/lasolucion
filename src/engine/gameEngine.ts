

import { safeLogEvent } from '../firebase';
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
import { deduplicateHabits, deduplicateTasksForDay, sanitizeTasksByDate, reconcileHabitCounterTask, resolveMatchingCustomHabit } from '../utils/taskDeduplication';
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
import {
  calculateAscensionState,
  getAscensionBonusMultiplier,
  evaluateTimezoneDrift,
  countHighPriorityCompletedToday,
  calculatePriorityMultiplier,
  calculateDailyBossImpactPoints,
  formatIdentityEchoText,
  compactHistoricalTasksByDate,
  persistColdArchiveToIndexedDB,
  revertXpAndCoins,
} from '../utils/level3Systems';
import { enqueueOutboxOperation } from '../services/offlineOutboxService';

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
  const user = auth?.currentUser;
  (window as unknown as { __isResettingAccount?: boolean }).__isResettingAccount = true;
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

    const currentUid = auth?.currentUser?.uid;
    if (currentUid) {
      enqueueOutboxOperation('JOURNAL_SAVE', { date, text: sanitized }, currentUid).catch(() => {});
    }
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
export const checkLevelUp = (prevStats: PlayerStats, xpAdded: number, coinsAdded: number): PlayerStats => {
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
    const stateUI = useUIStore.getState();
    const statePlayer = usePlayerStore.getState();
    const arch = getArchetypeByName(statePlayer.stats.characterClass);
    
    // Descongestión modal: Solo activar modal a pantalla completa en niveles de hito (Nivel 2 y múltiplos de 5)
    const isMilestoneLevel = nextLevel === 2 || nextLevel % 5 === 0;
    if (isMilestoneLevel) {
      stateUI.setModalState('isLevelUpOpen', true);
    } else {
      stateUI.addFloatingEffect({
        x: typeof window !== 'undefined' ? window.innerWidth / 2 : 200,
        y: 120,
        text: `⚡ ¡Nivel ${nextLevel} Alcanzado! (Arquetipo: ${arch.name})`,
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

export const handleAscendPlayer = () => {
  const { player: statePlayer, ui: stateUI } = getEngineContext();
  if ((statePlayer.stats.level || 1) < 50) return false;
  statePlayer.setStats((prev) => calculateAscensionState(prev));
  soundFX.playLevelUp();
  triggerShockwave({ color: 'gold', intensity: 'epic' });
  if (typeof window !== 'undefined') {
    stateUI.addFloatingEffect({
      x: window.innerWidth / 2,
      y: 120,
      text: `★ ¡ASCENSIÓN COMPLETADA! Eficiencia Permanente +5%`,
      type: 'critical',
    });
  }
  return true;
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
  
  const currentDayTasks = stateTask.tasksByDate[date] || [];
  const highPriorityClaimedToday = countHighPriorityCompletedToday(currentDayTasks, taskId);
  const { multiplier: priorityMultiplier, isCapped: isPriorityCapped } = calculatePriorityMultiplier(
    task.priority,
    highPriorityClaimedToday,
    Boolean(task.isLegendaryBounty)
  );
  const ascensionMult = getAscensionBonusMultiplier(statePlayer.stats?.ascensionTier);

  // Phase 1.5: Passive Skill Tree Multiplier (e.g. Mente Acelerada +15% XP)
  const stateApp = useAppStore.getState();
  const hasSkillXpMultiplier = !wasCompleted && (stateApp.skillTree || []).some(s => 
    s.isUnlocked && 
    s.effectType === 'xp_multiplier' && 
    (!s.targetCategory || s.targetCategory.toLowerCase() === (task.category || '').toLowerCase())
  );
  const skillMult = hasSkillXpMultiplier ? 1.15 : 1.0;

  let xpRewardToAdd = Math.floor(rawXp * taxMultiplier * priorityMultiplier * ascensionMult * skillMult);
  let coinRewardToAdd = Math.floor(rawCoin * taxMultiplier * priorityMultiplier * ascensionMult);
  
  // Hito Determinista: Cofre de Maestría cada 5 tareas completadas en el día
  let wasChestFound = false;
  const completedTodayCount = currentDayTasks.filter(t => t.id === taskId ? !wasCompleted : t.completed).length;
  const isChestMilestone = !wasCompleted && completedTodayCount > 0 && completedTodayCount % 5 === 0;

  if (rawCoin > 0 && !task.chestAwarded && isChestMilestone) {
    coinRewardToAdd += 15; // Bonificación determinista de 15 monedas
    wasChestFound = true;
  }

  // Phase 2: Focus Potion Multiplier & Tactical Energy Vials (x3 charges)
  const hasActiveVial = !wasCompleted && (statePlayer.stats?.tacticalEnergyVials || 0) > 0;
  if ((statePlayer.stats?.focusPotionExpiresAt && statePlayer.stats.focusPotionExpiresAt > Date.now()) || hasActiveVial) {
    xpRewardToAdd = Math.floor(xpRewardToAdd * 1.5);
    coinRewardToAdd = Math.floor(coinRewardToAdd * 1.5);
  }

  // Phase 3: Archetype Affinity Multiplier (1.2x base + 0.1x per Archetype Evolution Core)
  const arch = getArchetypeByName(statePlayer.stats?.characterClass);
  const isAffin = (task.category === arch.primaryStat || (arch.id === 'sabio' && task.category === 'estudio') || (arch.id === 'heroe' && task.category === 'entrenamiento'));
  const evolutionCores = statePlayer.stats?.archetypeEvolutionCores || 0;
  const affinityMultiplier = 1.2 + Math.min(evolutionCores * 0.1, 0.5);
  if (isAffin) {
    xpRewardToAdd = Math.floor(xpRewardToAdd * affinityMultiplier);
    coinRewardToAdd = Math.floor(coinRewardToAdd * affinityMultiplier);
  }
  
  const xpRewardToSubtract = task.awardedXp ?? rawXp;
  const coinRewardToSubtract = task.awardedCoins ?? rawCoin;

  const xpReward = wasCompleted ? xpRewardToSubtract : xpRewardToAdd;
  const coinReward = wasCompleted ? coinRewardToSubtract : coinRewardToAdd;
  const stateUI = useUIStore.getState();

  if (!wasCompleted) {
    soundFX.playTaskComplete();
    try {
      safeLogEvent('task_completed', {
        category: task.category,
        priority: task.priority || 'media',
        is_retroactive: isRetroactive,
        affinity_match: isAffin
      });
    } catch {}

    stateTask.updateTask(date, taskId, {
      awardedXp: xpReward,
      awardedCoins: coinReward,
      chestAwarded: wasChestFound ? true : (task.chestAwarded || false)
    });

    const hitX = e?.clientX || (typeof window !== 'undefined' ? window.innerWidth / 2 : 200);
    const hitY = e?.clientY || (typeof window !== 'undefined' ? window.innerHeight / 2 : 200);

    // Feedback visual inmediato no intrusivo con Eco de Identidad (Motivación Intrínseca)
    if (typeof window !== 'undefined' && (xpReward > 0 || coinReward > 0)) {
      spawnJuiceParticle({
        x: hitX,
        y: hitY - 15,
        text: formatIdentityEchoText(xpReward, coinReward, isAffin, Boolean(task.timeBlock), arch.name),
        type: 'xp'
      });
    }

    if (isPriorityCapped) {
      stateUI.addFloatingEffect({
        x: hitX,
        y: hitY - 72,
        text: '⚡ Límite Crítico Diario (3/3): x1.15 aplicado',
        type: 'streak'
      });
    }

    if (isAffin && xpReward > 0) {
      stateUI.addFloatingEffect({
        x: hitX,
        y: hitY - 38,
        text: `✨ Afinidad ${arch.name} (+${Math.round((affinityMultiplier - 1) * 100)}% XP)`,
        type: 'critical'
      });
    }

    if (hasSkillXpMultiplier && xpReward > 0) {
      stateUI.addFloatingEffect({
        x: hitX,
        y: hitY - 48,
        text: `🧠 Habilidad Pasiva (+15% XP)`,
        type: 'critical'
      });
    }

    if (hasActiveVial) {
      const remainingVials = Math.max(0, (statePlayer.stats?.tacticalEnergyVials || 1) - 1);
      stateUI.addFloatingEffect({
        x: hitX,
        y: hitY - 58,
        text: `🧪 Vial Táctico 1.5x (${remainingVials} restantes)`,
        type: 'combo'
      });
    }

    // Mensaje empático y no punitivo para registro retrospectivo
    if (isRetroactive) {
      if (typeof window !== 'undefined') {
        spawnJuiceParticle({
          x: hitX,
          y: hitY - 30,
          text: '⏳ Registro retrospectivo aplicado (80% XP)',
          type: 'custom',
          colorClass: 'text-amber-300 bg-amber-950/90 border-amber-500'
        });
      }
      stateUI.addFloatingEffect({
        x: hitX,
        y: hitY - 30,
        text: '⏳ Registro retrospectivo aplicado (80% XP)',
        type: 'xp'
      });
    }
    
    // Encuentro Determinista con Jefe Diario (Umbral Ponderado: >= 3.0 Puntos de Impacto)
    const todayStr = getTodayDateString();
    let triggeredBoss = false;
    const isBossEligible = !hasClaimedBossToday() && statePlayer.stats.lastEncounterDate !== todayStr;
    if (isBossEligible) {
      const allDayTasks = stateTask.tasksByDate[date] || [];
      const impactPoints = calculateDailyBossImpactPoints(allDayTasks, taskId);

      if (impactPoints >= 3.0) {
        triggeredBoss = true;
        try {
          safeLogEvent('boss_defeated', { trigger: 'weighted_impact_points', points: impactPoints });
        } catch {}
        triggerBossEmojiConfetti();
        if (typeof window !== 'undefined') {
          spawnBossEmojiExplosion(hitX, hitY);
        }
        setTimeout(() => {
          handleClaimBossBounty();
        }, 250);
      }
    }

    if (xpReward > 0 || coinReward > 0 || hasActiveVial) {
      statePlayer.setStats((prev) => {
        const nextVials = hasActiveVial ? Math.max(0, (prev.tacticalEnergyVials || 1) - 1) : prev.tacticalEnergyVials;
        const base = {
          ...prev,
          tacticalEnergyVials: nextVials,
          ...(triggeredBoss ? { lastEncounterDate: todayStr } : {})
        };
        return checkLevelUp(base, xpReward, coinReward);
      });
      
      // Crisp, tactile feedback on task complete without screen pollution
      try {
        hapticPresets.click();
      } catch {}

      if (wasChestFound) {
        soundFX.playLevelUp(); // Extra sound for chest
        try {
          safeLogEvent('milestone_chest_unlocked', { completed_today: completedTodayCount });
        } catch {}
        stateUI.addFloatingEffect({
          x: hitX,
          y: hitY - 45,
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
      statePlayer.setStats((prev) => revertXpAndCoins(prev, xpReward, coinReward));
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

  // Record atomic mutation in persistent IndexedDB Outbox
  const currentUid = auth?.currentUser?.uid;
  if (currentUid) {
    enqueueOutboxOperation(
      'TASK_TOGGLE',
      {
        taskId,
        date,
        completed: !wasCompleted,
        awardedXp: xpReward,
        awardedCoins: coinReward,
      },
      currentUid
    ).catch(() => {});
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
  const rawTask = tasks.find(t => t.id === taskId);
  
  if (!rawTask) return;
  const task = reconcileHabitCounterTask(rawTask, stateTask.customHabits || []);
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

  soundFX.playTaskComplete();
  try {
    hapticPresets.click();
    safeLogEvent('habit_incremented', {
      habit_id: task.id,
      completed: isNowCompleted
    });
  } catch {}
  
  // Conciliación Retrospectiva Honesta (0.8x si la fecha es anterior a hoy)
  const isRetroactive = date < today;
  const taxMultiplier = isRetroactive ? 0.8 : 1.0;
  const priorityMultiplier = task.priority === 'alta' ? 2.0 : task.priority === 'baja' ? 0.5 : 1.0;
  
  let xpReward = Math.floor((task.xpReward || 0) * taxMultiplier * priorityMultiplier);
  let coinReward = Math.floor((task.coinReward || 0) * taxMultiplier * priorityMultiplier);

  // Phase 2 & 3: Tactical Energy Vial & Archetype Evolution Core Multipliers
  const hasActiveVial = isNowCompleted && (statePlayer.stats?.tacticalEnergyVials || 0) > 0;
  if ((statePlayer.stats?.focusPotionExpiresAt && statePlayer.stats.focusPotionExpiresAt > Date.now()) || hasActiveVial) {
    xpReward = Math.floor(xpReward * 1.5);
    coinReward = Math.floor(coinReward * 1.5);
  }

  const arch = getArchetypeByName(statePlayer.stats?.characterClass);
  const isAffin = (task.category === arch.primaryStat || (arch.id === 'sabio' && task.category === 'estudio') || (arch.id === 'heroe' && task.category === 'entrenamiento'));
  const evolutionCores = statePlayer.stats?.archetypeEvolutionCores || 0;
  const affinityMultiplier = 1.2 + Math.min(evolutionCores * 0.1, 0.5);
  if (isAffin) {
    xpReward = Math.floor(xpReward * affinityMultiplier);
    coinReward = Math.floor(coinReward * affinityMultiplier);
  }

  const totalAwardedCoins = (task.awardedCoins || 0) + (coinReward || 0);
  const totalAwardedXp = (task.awardedXp || 0) + (xpReward || 0);

  stateTask.updateTask(date, taskId, {
    currentCount: newCount,
    completed: isNowCompleted,
    completedAt: isNowCompleted ? (task.completedAt || new Date().toISOString()) : undefined,
    awardedCoins: totalAwardedCoins,
    awardedXp: totalAwardedXp,
    ...(task.targetCount !== undefined ? { targetCount: task.targetCount } : {}),
    ...(task.unit ? { unit: task.unit } : {}),
    ...(task.isHabit !== undefined ? { isHabit: task.isHabit } : {}),
  });

  const hitX = e?.clientX || (typeof window !== 'undefined' ? window.innerWidth / 2 : 200);
  const hitY = e?.clientY || (typeof window !== 'undefined' ? window.innerHeight / 2 : 200);

  if (xpReward > 0 || coinReward > 0 || hasActiveVial) {
    statePlayer.setStats((prev) => {
      const nextVials = hasActiveVial ? Math.max(0, (prev.tacticalEnergyVials || 1) - 1) : prev.tacticalEnergyVials;
      return checkLevelUp({ ...prev, tacticalEnergyVials: nextVials }, xpReward, coinReward);
    });
    if (typeof window !== 'undefined' && (xpReward > 0 || coinReward > 0)) {
      spawnJuiceParticle({
        x: hitX,
        y: hitY - 15,
        text: `+${xpReward} XP · +${coinReward}🪙`,
        type: 'xp'
      });
    }
  }
  
  // Phase 3: Archetype Affinity Feedback
  if (isAffin && xpReward > 0) {
    stateUI.addFloatingEffect({
      x: hitX,
      y: hitY - 50,
      text: `✨ ¡Afinidad ${arch.name} (+${Math.round((affinityMultiplier - 1) * 100)}% XP)!`,
      type: 'critical'
    });
  }

  if (hasActiveVial) {
    const remainingVials = Math.max(0, (statePlayer.stats?.tacticalEnergyVials || 1) - 1);
    stateUI.addFloatingEffect({
      x: hitX,
      y: hitY - 68,
      text: `🧪 Vial Táctico 1.5x (${remainingVials} restantes)`,
      type: 'combo'
    });
  }

  if (isRetroactive && !isNowCompleted) {
    stateUI.addFloatingEffect({
      x: hitX,
      y: hitY - 25,
      text: '⏳ Registro retrospectivo (80% XP)',
      type: 'xp'
    });
  }

  if (isNowCompleted) {
    soundFX.playLevelUp(); // Extra sound for finishing habit

    if (isRetroactive) {
      stateUI.addFloatingEffect({
        x: hitX,
        y: hitY - 35,
        text: '⏳ Registro retrospectivo completado (80% XP)',
        type: 'xp'
      });
    }

    // Encuentro Determinista con Jefe Diario (Umbral Ponderado: >= 3.0 Puntos de Impacto)
    const isBossEligible = !hasClaimedBossToday() && statePlayer.stats.lastEncounterDate !== today;
    if (isBossEligible) {
      const allDayTasks = stateTask.tasksByDate[date] || [];
      const impactPoints = calculateDailyBossImpactPoints(allDayTasks, taskId);

      if (impactPoints >= 3.0) {
        statePlayer.setStats((prev) => ({ ...prev, lastEncounterDate: today }));
        try {
          safeLogEvent('boss_defeated', { trigger: 'habit_weighted_impact', points: impactPoints });
        } catch {}
        triggerBossEmojiConfetti();
        if (typeof window !== 'undefined') {
          spawnBossEmojiExplosion(hitX, hitY);
        }
        setTimeout(() => {
          handleClaimBossBounty();
        }, 250);
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

  // Record atomic mutation in persistent IndexedDB Outbox
  const currentUid = auth?.currentUser?.uid;
  if (currentUid) {
    enqueueOutboxOperation(
      'HABIT_INCREMENT',
      {
        taskId,
        date,
        currentCount: newCount,
        completed: isNowCompleted,
        awardedXp: totalAwardedXp,
        awardedCoins: totalAwardedCoins,
      },
      currentUid
    ).catch(() => {});
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
  const xpReward = task.awardedXp !== undefined ? task.awardedXp : (task.completed ? (task.xpReward || 0) : 0);
  const coinReward = task.awardedCoins !== undefined ? task.awardedCoins : (task.completed ? (task.coinReward || 0) : 0);

  stateTask.updateTask(date, taskId, {
    currentCount: 0,
    completed: false,
    completedAt: undefined,
    rewardClaimed: false,
    awardedCoins: 0,
    awardedXp: 0
  });

  if (xpReward > 0 || coinReward > 0) {
    statePlayer.setStats((prev) => ({
      ...prev,
      currentXp: Math.max(0, (prev.currentXp || 0) - xpReward),
      totalXpEarned: Math.max(0, (prev.totalXpEarned || 0) - xpReward),
      coins: Math.max(0, (prev.coins || 0) - coinReward)
    }));
  }

  useUIStore.getState().addFloatingEffect({
    x: e?.clientX || (typeof window !== 'undefined' ? window.innerWidth / 2 : 200),
    y: (e?.clientY || 200) - 20,
    text: 'Contador reiniciado (0)',
    type: 'streak'
  });

  // Record atomic mutation in persistent IndexedDB Outbox
  const currentUid = auth?.currentUser?.uid;
  if (currentUid) {
    enqueueOutboxOperation(
      'HABIT_RESET',
      {
        taskId,
        date,
      },
      currentUid
    ).catch(() => {});
  }

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
       const targetTitle = (task.title || '').toLowerCase().trim();
       const filtered = store.customHabits.filter(h => 
         h.id !== task.id && 
         h.id !== baseId && 
         (h.title || '').toLowerCase().trim() !== targetTitle
       );
       store.setCustomHabits(filtered);

       // Purge all instances of this habit across all dates in tasksByDate
       const updatedTasksByDate = { ...store.tasksByDate };
       let modified = false;
       Object.keys(updatedTasksByDate).forEach(dateKey => {
         const list = updatedTasksByDate[dateKey] || [];
         const pruned = list.filter(t => {
           const isMatch = t.id === task.id || t.id === baseId || (t.title || '').toLowerCase().trim() === targetTitle;
           if (isMatch && t.id) {
             store.recordTaskTombstone(t.id);
           }
           return !isMatch;
         });
         if (pruned.length !== list.length) {
           updatedTasksByDate[dateKey] = pruned;
           modified = true;
         }
       });
       if (modified) {
         store.setTasksByDate(updatedTasksByDate);
       }
     }
  }
  uiStore.setDeleteConfirmTask(null);
  soundFX.playClick();
};
export const handleClaimDailyReward = (day: number, xp: number, coins: number, bonusItem?: string) => {
  const { player: statePlayer, ui: stateUI } = getEngineContext();
  const todayStr = getTodayDateString();
  
  // Antifraude: Prevenir reclamos duplicados en la misma jornada
  if (statePlayer.stats?.lastDailyRewardClaimedDate === todayStr) {
    return;
  }
  
  if (xp > 0 || coins > 0) {
    statePlayer.setStats((prev) => ({
      ...checkLevelUp(prev, xp, coins),
      lastDailyRewardClaimedDate: todayStr
    }));
    
    if (typeof window !== 'undefined') {
       stateUI.addFloatingEffect({ x: window.innerWidth / 2, y: window.innerHeight / 2 - 20, text: `+${xp} XP`, type: 'xp' });
       setTimeout(() => {
         stateUI.addFloatingEffect({ x: window.innerWidth / 2, y: window.innerHeight / 2 - 40, text: `+${coins} Monedas`, type: 'coins' });
       }, 150);
    }
  } else {
    statePlayer.setStats((prev) => ({
      ...prev,
      lastDailyRewardClaimedDate: todayStr
    }));
  }
  
  soundFX.playTaskComplete();
};
export const handleConfirmFinishDay = (bonusXp: number, bonusCoins: number) => {
  const { player: statePlayer, task: stateTask, ui: stateUI } = getEngineContext();
  const currentDate = stateTask.currentViewDate;
  
  // Antifraude: Si el día ya fue finalizado, evitar duplicación de bonificaciones de cierre
  if (statePlayer.stats?.finalizedDays?.[currentDate]) {
    return;
  }

  safeLogEvent('daily_closure_executed');
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dayTasks = stateTask.tasksByDate[currentDate] || [];
  const completedCount = dayTasks.filter((t) => t.completed).length;
  const dayXpEarned = dayTasks.filter((t) => t.completed).reduce((acc, t) => acc + (t.awardedXp || t.xpReward || 0), 0) + bonusXp;

  // Compactación Hot/Cold (>14 días) para mantener complejidad O(1) y evitar límite de 1 MiB en Firestore
  const compactionResult = compactHistoricalTasksByDate(
    stateTask.tasksByDate,
    getTodayDateString(),
    statePlayer.stats.historicalArchiveSummary,
    14
  );
  if (compactionResult.prunedTasksCount > 0) {
    stateTask.setTasksByDate(compactionResult.hotTasksByDate);
    void persistColdArchiveToIndexedDB(compactionResult.coldArchivedByDate);
  }

  // Detector de Deriva de Huso Horario (Timezone Drift Shield)
  const tzEval = evaluateTimezoneDrift(
    statePlayer.stats.lastTimezoneOffset,
    now.getTimezoneOffset(),
    now.getTime()
  );

  statePlayer.setStats((prev) => {
    let nextStats = prev;
    if (bonusXp > 0 || bonusCoins > 0) {
      nextStats = checkLevelUp(nextStats, bonusXp, bonusCoins);
    }

    return {
      ...nextStats,
      lastTimezoneOffset: tzEval.nextOffset,
      timezoneShieldExpiresAt: tzEval.drifted ? tzEval.shieldExpiresAt : nextStats.timezoneShieldExpiresAt,
      historicalArchiveSummary: compactionResult.updatedSummary,
      closedDaysLog: {
        ...(nextStats.closedDaysLog || {}),
        [currentDate]: {
          timestamp: now.getTime(),
          tasksCompleted: completedCount,
          xpEarned: dayXpEarned,
        },
      },
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
  });

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
         stateUI.addFloatingEffect({ x: window.innerWidth / 2, y: window.innerHeight / 2 - 40, text: `+${bonusCoins} Monedas`, type: 'coins' });
       }, 150);
    }
  }

  // Record atomic day finalization in persistent IndexedDB Outbox
  const currentUid = auth?.currentUser?.uid;
  if (currentUid) {
    enqueueOutboxOperation(
      'DAY_FINALIZE',
      {
        date: currentDate,
        bonusXp,
        bonusCoins,
      },
      currentUid
    ).catch(() => {});
  }
  
  soundFX.playTaskComplete();
};
export const handleReopenDay = (dateStr?: string): boolean => {
  const { player: statePlayer, task: stateTask, ui: stateUI } = getEngineContext();
  const targetDate = dateStr || stateTask.currentViewDate;
  
  const finalizedRecord = statePlayer.stats.finalizedDays?.[targetDate];
  const bonusCoins = finalizedRecord?.bonusCoins || 0;
  const currentCoins = statePlayer.stats.coins || 0;

  // P0 Financial Shield & Anti-Exploit:
  // Prevent reopening if user spent the bonus coins and cannot cover the rollback.
  if (currentCoins < bonusCoins) {
    if (typeof window !== 'undefined') {
      stateUI.addFloatingEffect({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        text: `⚠️ Monedas insuficientes (${currentCoins}/${bonusCoins}🪙) para revertir la jornada`,
        type: 'custom'
      });
    }
    soundFX.playDamageSound();
    return false;
  }

  const success = statePlayer.reopenDay(targetDate);
  if (!success) {
    return false;
  }

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

  const currentUid = auth?.currentUser?.uid;
  if (currentUid) {
    enqueueOutboxOperation(
      'DAY_REOPEN',
      {
        date: targetDate,
        bonusXp: finalizedRecord?.bonusXp || 0,
        bonusCoins,
      },
      currentUid
    ).catch(() => {});
  }
  
  soundFX.playClick();
  return true;
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

export const injectHabitsToExistingDays = (
  newHabits?: CustomHabit[],
  options?: { syncExistingMeta?: boolean }
) => {
  const store = useTaskStore.getState();
  const playerStats = usePlayerStore.getState().stats;
  const tasksByDate = store.tasksByDate;
  const customHabits = store.customHabits;
  const newTasksByDate = { ...tasksByDate };

  // Clean custom habits
  const habitsToInject = deduplicateHabits(newHabits && newHabits.length > 0 ? newHabits : customHabits);

  // Hidratar todas las fechas existentes en el almacén, más una ventana amplia (-7 a +30 días)
  const datesToHydrate = new Set<string>(Object.keys(newTasksByDate));
  const baseDate = store.currentViewDate || getTodayDateString();
  const todayStr = getTodayDateString();
  for (let i = -7; i <= 30; i++) {
    datesToHydrate.add(addDaysToDateString(baseDate, i));
  }

  datesToHydrate.forEach(date => {
     let rawTasksForDay = newTasksByDate[date] || [];
     const isDayFinalized = Boolean(playerStats?.finalizedDays?.[date]);

     if (options?.syncExistingMeta && date >= todayStr && !isDayFinalized && rawTasksForDay.length > 0) {
       rawTasksForDay = rawTasksForDay.map((t) => {
         const matchedHabit = resolveMatchingCustomHabit(t, habitsToInject);
         if (!matchedHabit) return t;
         const nextTarget = matchedHabit.targetCount;
         const nextCurrent = t.currentCount || 0;
         let nextCompleted = t.completed;
         let nextCompletedAt = t.completedAt;
         if (nextTarget !== undefined && nextTarget > 1) {
           if (nextCurrent >= nextTarget) {
             nextCompleted = true;
             nextCompletedAt = t.completedAt || new Date().toISOString();
           } else if (nextCurrent > 0) {
             nextCompleted = false;
             nextCompletedAt = undefined;
           }
         }
         return {
           ...t,
           title: matchedHabit.title || t.title,
           targetCount: nextTarget,
           unit: matchedHabit.unit || t.unit,
           isHabit: Boolean(t.isHabit || matchedHabit.isQuickHabit || matchedHabit.isTracked2166 || (nextTarget && nextTarget > 1)),
           isQuickHabit: matchedHabit.isQuickHabit ?? t.isQuickHabit,
           isTracked2166: matchedHabit.isTracked2166 ?? t.isTracked2166,
           quickIcon: matchedHabit.quickIcon || t.quickIcon,
           habitEnergyType: matchedHabit.habitEnergyType || t.habitEnergyType,
           targetStreak: matchedHabit.targetStreak || t.targetStreak,
           completed: nextCompleted,
           completedAt: nextCompletedAt,
         };
       });
     }

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
  injectHabitsToExistingDays(cleanHabits, { syncExistingMeta: true });
  soundFX.playClick();
};
export const handleClaimBossBounty = () => {
  if (hasClaimedBossToday()) return;
  const xpReward = 50;
  const coinReward = 20;
  const hpReward = 50;
  
  const { player: statePlayer, ui: stateUI } = getEngineContext();
  
  statePlayer.heal(hpReward);
  const newStats = checkLevelUp(statePlayer.stats, xpReward, coinReward);
  const todayStr = getTodayDateString();
  statePlayer.setStats({
    ...newStats,
    lastBossDefeatedDate: todayStr
  });
  
  soundFX.playBossDefeated();
  
  if (typeof window !== 'undefined') {
     spawnJuiceParticle({ x: window.innerWidth / 2, y: window.innerHeight / 2, text: '💖 ¡JEFE DERROTADO & HP RESTAURADO!', type: 'boss', isCrit: true });
     stateUI.addFloatingEffect({ x: window.innerWidth / 2, y: window.innerHeight / 2 - 20, text: `+${xpReward} XP`, type: 'xp' });
     setTimeout(() => {
       stateUI.addFloatingEffect({ x: window.innerWidth / 2, y: window.innerHeight / 2 - 40, text: `+${coinReward} Monedas`, type: 'coins' });
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
         stateUI.addFloatingEffect({ x: window.innerWidth / 2, y: window.innerHeight / 2 - 40, text: `+${coinReward} Monedas`, type: 'coins' });
       }, 150);
    }
  }

  // Record atomic pomodoro completion in persistent IndexedDB Outbox
  const currentUid = auth?.currentUser?.uid;
  if (currentUid) {
    enqueueOutboxOperation(
      'POMODORO_COMPLETE',
      {
        session,
        xpEarned: xpReward,
        coinsEarned: coinReward,
      },
      currentUid
    ).catch(() => {});
  }
};

export const handleRedeemReward = (reward?: ShopReward) => {
  if (!reward) return;
  const { player: statePlayer, app: stateApp } = getEngineContext();
  const success = statePlayer.purchaseItem(reward.cost);
  if (success) {
    safeLogEvent('shop_reward_redeemed', { reward_id: reward.id, cost: reward.cost });
    safeLogEvent('economy_transaction', {
      type: 'reward_purchase',
      item_id: reward.id,
      cost: reward.cost,
      coins_after: (statePlayer.stats?.coins || 0)
    });
    stateApp.setShopRewards(prev =>
      prev.map(r => (r.id === reward.id ? { ...r, unlockedCount: (r.unlockedCount || 0) + 1 } : r))
    );
    soundFX.playCoin();

    // Record atomic reward purchase in persistent IndexedDB Outbox
    const currentUid = auth?.currentUser?.uid;
    if (currentUid) {
      enqueueOutboxOperation(
        'SHOP_REDEEM',
        {
          rewardId: reward.id,
          cost: reward.cost,
        },
        currentUid
      ).catch(() => {});
    }
  }
};

export const handleAddCustomReward = (newReward?: ShopReward) => {
  if (!newReward) return;
  const validatedReward: ShopReward = {
    ...newReward,
    cost: Math.max(1, Math.min(100000, Number(newReward.cost) || 10)),
  };
  const { app } = getEngineContext();
  app.setShopRewards(prev => [...prev, validatedReward]);
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

  // 2. Complete the sleep log for pendingDate and mark today started
  statePlayer.registerWakeUp(pendingDate, customWakeTime);
  stateTask.startDay(today);
  soundFX.playLevelUp();

  // 3. Determine active day date (if waking up from yesterday's log, advance to today; if already today, stay on today)
  const targetDayStr = pendingDate < today ? addDaysToDateString(pendingDate, 1) : today;

  // 4. Ensure tasks & habits are generated for targetDayStr
  stateTask.ensureTasksForDate(targetDayStr);

  // 5. Switch active view date to targetDayStr
  stateTask.setCurrentViewDate(targetDayStr);

  // 6. Trigger floating visual notification feedback with fresh calculated sleep hours
  if (typeof window !== 'undefined') {
    const freshStats = usePlayerStore.getState().stats;
    const log = freshStats.sleepLogs?.[pendingDate] || freshStats.sleepLogs?.[today];
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
