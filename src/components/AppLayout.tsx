
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { soundFX } from '../utils/audio';
import * as gameEngine from '../engine/gameEngine';
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../store/useAppStore';
import { useUIStore, syncRootTheme } from '../store/useUIStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTaskStore } from '../store/useTaskStore';
import { useShallow } from 'zustand/react/shallow';
import { User, FileText, Timer as TimerIcon, Store, Image as ImageIcon , AlertTriangle, XCircle, Timer, Compass, CheckSquare, BarChart3, ShoppingBag, BookOpen, Sparkles, Flame, ChevronRight, ChevronLeft, HardDrive, Swords, Calendar, Shield, FlaskConical, ChevronDown, ChevronUp, X, Cpu, RotateCw, MessageSquare } from 'lucide-react';
import { useCloudSync } from '../hooks/useCloudSync';
import { getArchetypeByName } from '../data/archetypes';
import { Header } from './Header';
import { FloatingGainEffect } from './FloatingGainEffect';
import { FloatingJuiceOverlay } from './FloatingJuiceOverlay';
import { TaskListView } from './TaskListView';

// Lazy Loaded Secondary Tabs & Modals (Code-Splitting for Instant PWA Launch)
const WeeklyStats = lazy(() => import('./WeeklyStats').then(m => ({ default: m.WeeklyStats })));
const JournalView = lazy(() => import('./JournalView').then(m => ({ default: m.JournalView })));
const RewardShop = lazy(() => import('./RewardShop').then(m => ({ default: m.RewardShop })));
const SkillTreeAndSettings = lazy(() => import('./SkillTreeAndSettings').then(m => ({ default: m.SkillTreeAndSettings })));
const SettingsView = lazy(() => import('./SettingsView').then(m => ({ default: m.SettingsView })));
import { ModalPortalHost } from './modals/ModalPortalHost';

import { DailyScheduleStrip } from './DailyScheduleStrip';
import { SciFiGridBackground } from './SciFiGridBackground';
import { TransitionOverlay } from './TransitionOverlay';
import { QuantumCubeLoader } from './QuantumCubeLoader';
import { ShockwaveOverlay } from './ShockwaveOverlay';
import { DailyProgressWidget } from './DailyProgressWidget';
import { calculateDayFinanceTotals } from '../utils/finance';
import { useNarrativeCopy } from '../hooks/useNarrativeCopy';
import { ScrollReveal } from './common/ScrollReveal';
import { OfflineIndicator } from './OfflineIndicator';
import { NotificationToastOverlay } from './NotificationToastOverlay';
import { PWAInstallBanner } from './PWAInstallBanner';
import { OmniCompanionHub } from './OmniCompanionHub';
import { SidebarHUD } from './SidebarHUD';
const SimulationBanner = lazy(() => import('./SimulationBanner').then(m => ({ default: m.SimulationBanner })));
import { getTodayDateString } from '../utils/date';

const EMPTY_TASKS_ARRAY: any[] = [];

export function AppLayout() {
  // Atomic selectors for UIStore: Only subscribe to relevant UI state
  const activeTab = useUIStore((s) => s.activeTab);
  const isTransitioning = useUIStore((s) => s.isTransitioning);
  const themeMode = useUIStore((s) => s.themeMode);
  const soundEnabled = useUIStore((s) => s.soundEnabled);
  const navigationMode = useUIStore((s) => s.navigationMode);
  const handDominance = useUIStore((s) => s.handDominance);
  const isDailyRewardsOpen = useUIStore((s) => s.isDailyRewardsOpen);
  const isLevelUpOpen = useUIStore((s) => s.isLevelUpOpen);
  const isFinishDayOpen = useUIStore((s) => s.isFinishDayOpen);
  const isDayTemplatesOpen = useUIStore((s) => s.isDayTemplatesOpen);
  const isPomodoroOpen = useUIStore((s) => s.isPomodoroOpen);
  const isNightlyReflectionOpen = useUIStore((s) => s.isNightlyReflectionOpen);
  const deleteConfirmTask = useUIStore((s) => s.deleteConfirmTask);
  const floatingRewards = useUIStore((s) => s.floatingRewards);
  const zenMode = useUIStore((s) => s.zenMode);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const setModalState = useUIStore((s) => s.setModalState);
  const setDeleteConfirmTask = useUIStore((s) => s.setDeleteConfirmTask);
  const isTacticalGuideOpen = useUIStore((s) => s.isTacticalGuideOpen);
  const tacticalGuideInitialStep = useUIStore((s) => s.tacticalGuideInitialStep);
  const closeTacticalGuide = useUIStore((s) => s.closeTacticalGuide);
  const isVoiceDictationOpen = useUIStore((s) => s.isVoiceDictationOpen);
  const closeVoiceDictation = useUIStore((s) => s.closeVoiceDictation);

  // PlayerStore state and mutator
  const stats = usePlayerStore((s) => s.stats);
  const setStats = usePlayerStore((s) => s.setStats);
  const lastDailyRewardClaimedDate = stats.lastDailyRewardClaimedDate;

  // Atomic selectors for TaskStore: Select current date tasks only, NOT the entire dictionary!
  const currentViewDate = useTaskStore((s) => s.currentViewDate);
  const setCurrentViewDate = useTaskStore((s) => s.setCurrentViewDate);
  const customHabits = useTaskStore((s) => s.customHabits);
  const setCustomHabits = useTaskStore((s) => s.setCustomHabits);
  const setTasksByDate = useTaskStore((s) => s.setTasksByDate);
  const tasks = useTaskStore((s) => s.tasksByDate[s.currentViewDate] || EMPTY_TASKS_ARRAY);

  const [isOracleOpen, setIsOracleOpen] = React.useState(false);
  const [oracleInitialPrompt, setOracleInitialPrompt] = React.useState<string | undefined>(undefined);
  const [isNeuralAnalysisOpen, setIsNeuralAnalysisOpen] = React.useState(false);
  const [isKaiWorkshopOpen, setIsKaiWorkshopOpen] = React.useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = React.useState(false);
  const [isSidebarDesktopExpanded, setIsSidebarDesktopExpanded] = React.useState(false);

  const handleOpenOracleWithPrompt = (promptText?: string) => {
    setOracleInitialPrompt(promptText);
    setIsOracleOpen(true);
  };

  const currentArchetype = getArchetypeByName(stats?.characterClass);

  
  const { user, error: authError, clearError: clearAuthError, signOut } = useAuth();
  const {
    habitMastery, setHabitMastery, gameSettings, setGameSettings,
    skillTree, setSkillTree, companion, setCompanion, expenses, setExpenses,
    shopRewards, setShopRewards, pomodoroSessions, setPomodoroSessions,
    notifications, setNotifications, comboCount, setComboCount,
    levelUpData, setLevelUpData, pomodoroPreFill, setPomodoroPreFill, reflections, setReflections
  } = useAppStore(
    useShallow((s) => ({
      habitMastery: s.habitMastery,
      setHabitMastery: s.setHabitMastery,
      gameSettings: s.gameSettings,
      setGameSettings: s.setGameSettings,
      skillTree: s.skillTree,
      setSkillTree: s.setSkillTree,
      companion: s.companion,
      setCompanion: s.setCompanion,
      expenses: s.expenses,
      setExpenses: s.setExpenses,
      shopRewards: s.shopRewards,
      setShopRewards: s.setShopRewards,
      pomodoroSessions: s.pomodoroSessions,
      setPomodoroSessions: s.setPomodoroSessions,
      notifications: s.notifications,
      setNotifications: s.setNotifications,
      comboCount: s.comboCount,
      setComboCount: s.setComboCount,
      levelUpData: s.levelUpData,
      setLevelUpData: s.setLevelUpData,
      pomodoroPreFill: s.pomodoroPreFill,
      setPomodoroPreFill: s.setPomodoroPreFill,
      reflections: s.reflections,
      setReflections: s.setReflections,
    }))
  );

  const cloudSync = useCloudSync(
    shopRewards, setShopRewards,
    pomodoroSessions, setPomodoroSessions,
    notifications, setNotifications,
    habitMastery, setHabitMastery,
    reflections, setReflections,
    gameSettings, setGameSettings,
    skillTree, setSkillTree,
    companion, setCompanion,
    expenses, setExpenses
  );
  const {
    handleResetAccount, handleSetCurrentViewDate, updateCurrentTasks,
    triggerFloatingHit, triggerRewardPopup, checkLevelUp, handleSelectClass,
    handleClaimBossBounty, hasClaimedBossToday, handleToggleTask,
    handleIncrementHabit,  handleEditTask, handleClearDay,
    handleResetDay, handleApplyTemplate, handleUpdateTaskNote, handleAddTask,
    handleDeleteTask, handleAddRecallAsTask, executeDeleteTask, handleOpenPomodoroForTask,
    handlePomodoroComplete, handleClaimDailyReward, handleRedeemReward, handleAddCustomReward,
    handleRestoreBackup,  handleReopenDay, handleRegisterWakeUp,
    handleSaveReflection, handleSaveHabits
  } = gameEngine;

  const todayStr = getTodayDateString();
  const hasUnclaimedDailyReward = stats.lastDailyRewardClaimedDate !== todayStr;

  const todayFinanceTotals = React.useMemo(() => {
    return calculateDayFinanceTotals(currentViewDate, expenses, tasks);
  }, [currentViewDate, expenses, tasks]);



  const setIsDailyRewardsOpen = (v: boolean) => setModalState('isDailyRewardsOpen', v);
  const setIsLevelUpOpen = (v: boolean) => setModalState('isLevelUpOpen', v);
  const setIsFinishDayOpen = (v: boolean) => setModalState('isFinishDayOpen', v);
  const setIsDayTemplatesOpen = (v: boolean) => setModalState('isDayTemplatesOpen', v);
  const setIsNightlyReflectionOpen = (v: boolean) => setModalState('isNightlyReflectionOpen', v);

  const [isAwakeningOpen, setIsAwakeningOpen] = useState(false);

  useEffect(() => {
    // Check if user has already completed awakening or has established historical progress
    const hasPriorProgress = (stats?.level && stats.level > 1) || 
                             ((stats?.totalXpEarned || 0) > 0) || 
                             (Boolean(stats?.username) && stats.username !== 'CazadorDelSistema' && stats.username !== 'UsuarioDelSistema' && stats.username.toLowerCase() !== 'cazador');
    
    if (stats?.hasCompletedAwakening === false && !hasPriorProgress) {
      setIsAwakeningOpen(true);
    }
  }, [stats?.hasCompletedAwakening, stats?.level, stats?.totalXpEarned, stats?.username]);

  // Listener para abrir la inducción y bienvenida de KAI a petición del usuario
  useEffect(() => {
    const handleOpenOnboarding = () => setIsAwakeningOpen(true);
    window.addEventListener('lasolucion:open-onboarding', handleOpenOnboarding);
    return () => window.removeEventListener('lasolucion:open-onboarding', handleOpenOnboarding);
  }, []);

  const handleConfirmFinishDayLocal = (bonusXp: number, bonusCoins: number, manualBedtime?: string) => {
    const targetDate = useTaskStore.getState().currentViewDate || getTodayDateString();
    const now = new Date();
    // Auto-capture exact device time as bedtime unless overridden
    const bedtime = manualBedtime || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    usePlayerStore.getState().finalizeDay(targetDate, bonusXp, bonusCoins, bedtime);
    useTaskStore.getState().lockTasksForDate(targetDate);
    
    const tasksForDay = useTaskStore.getState().tasksByDate[targetDate] || [];
    const totalTasks = tasksForDay.length;
    const completedTasks = tasksForDay.filter(t => t.completed).length;
    const isPerfectDay = totalTasks > 0 && completedTasks === totalTasks;

    if (isPerfectDay && Math.random() < 0.5) {
      usePlayerStore.getState().addLootBoxes(1);
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          useUIStore.getState().addFloatingEffect({ x: window.innerWidth / 2, y: window.innerHeight / 2 - 60, text: '🎁 ¡Caja de Botín por Día Perfecto!', type: 'critical' });
        }, 300);
      }
    }

    if (bonusXp > 0 || bonusCoins > 0) {
      if (typeof window !== 'undefined') {
        const stateUI = useUIStore.getState();
        stateUI.addFloatingEffect({ x: window.innerWidth / 2, y: window.innerHeight / 2 - 20, text: `+${bonusXp} XP`, type: 'xp' });
        setTimeout(() => {
          stateUI.addFloatingEffect({ x: window.innerWidth / 2, y: window.innerHeight / 2 - 40, text: `+${bonusCoins} Monedas`, type: 'coins' });
        }, 150);
      }
    }
  };
    const [isGlowing, setIsGlowing] = React.useState(false);
    const [showBossSchedule, setShowBossSchedule] = React.useState(false);

    const itemVariant = {
      hidden: { opacity: 0, y: 6 },
      show: { opacity: 1, y: 0, transition: { duration: 0.14, ease: [0.22, 1, 0.36, 1] as const } }
    };
  React.useEffect(() => {
    syncRootTheme(themeMode);
  }, [themeMode]);

  // Synchronize store sound settings with Audio engine
  React.useEffect(() => {
    soundFX.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Prefetch lazy secondary tab chunks sequentially during idle time without choking initial paint or dev transform queue
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const navConn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
    if (navConn?.saveData) return;

    let cancelled = false;
    const stepTimers = new Set<ReturnType<typeof setTimeout>>();

    const waitMs = (ms: number) =>
      new Promise<void>((resolve) => {
        const id = setTimeout(() => {
          stepTimers.delete(id);
          resolve();
        }, ms);
        stepTimers.add(id);
      });

    const prefetchSequentially = async () => {
      const tabImporters = [
        () => import('./WeeklyStats'),
        () => import('./JournalView'),
        () => import('./RewardShop'),
        () => import('./SkillTreeAndSettings'),
        () => import('./SettingsView'),
      ];

      for (const loadChunk of tabImporters) {
        if (cancelled) return;
        try {
          await loadChunk();
        } catch {}
        if (cancelled) return;
        await waitMs(150);
      }

      if (cancelled) return;

      await waitMs(1200);
      const devFastModals = [
        () => import('./task-list/TaskFormModal'),
        () => import('./PomodoroTimer'),
      ];
      for (const loadModal of devFastModals) {
        if (cancelled) return;
        try {
          await loadModal();
        } catch {}
        if (cancelled) return;
        await waitMs(350);
      }

      if (import.meta.env.DEV || cancelled) return;

      const modalImporters = [
        () => import('./OracleModal'),
        () => import('./NeuralAnalysisModal'),
        () => import('./DailyFinanceModal'),
        () => import('./KaiWorkshopModal'),
        () => import('./ScenarioSimulatorPanel'),
      ];

      for (const loadModal of modalImporters) {
        if (cancelled) return;
        try {
          await loadModal();
        } catch {}
        if (cancelled) return;
        await waitMs(200);
      }
    };

    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    let idleId: number | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    if (typeof w.requestIdleCallback === 'function') {
      idleId = w.requestIdleCallback(() => {
        if (!cancelled) {
          void prefetchSequentially();
        }
      }, { timeout: 2200 });
    } else {
      fallbackTimer = setTimeout(() => {
        if (!cancelled) {
          void prefetchSequentially();
        }
      }, 1400);
    }

    return () => {
      cancelled = true;
      if (idleId !== null && typeof w.cancelIdleCallback === 'function') {
        w.cancelIdleCallback(idleId);
      }
      if (fallbackTimer !== null) clearTimeout(fallbackTimer);
      stepTimers.forEach((id) => clearTimeout(id));
      stepTimers.clear();
    };
  }, []);

  React.useEffect(() => {
    if (floatingRewards.length > 0) {
      setIsGlowing(true);
      const t = setTimeout(() => setIsGlowing(false), 800);
      return () => clearTimeout(t);
    }
  }, [floatingRewards]);

  // Cerrar Pomodoro con Escape y ocultar flotantes mientras está abierto
  React.useEffect(() => {
    if (!isPomodoroOpen) return;
    document.body.classList.add('modal-open-hide-floating');
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        soundFX.playClick();
        setModalState('isPomodoroOpen', false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove('modal-open-hide-floating');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isPomodoroOpen, setModalState]);

  // Midnight / 3AM Date Sync Listener (Stale Date Fix)
  React.useEffect(() => {
    let lastKnownDate = getTodayDateString();
    let lastCheckAt = 0;

    const checkDateChange = () => {
      const now = Date.now();
      if (now - lastCheckAt < 1000) return;
      lastCheckAt = now;
      const currentDate = getTodayDateString();
      if (currentDate !== lastKnownDate) {
        lastKnownDate = currentDate;
        const taskStore = useTaskStore.getState();
        taskStore.ensureTodayTasks();
        if (taskStore.currentViewDate !== currentDate) {
          taskStore.setCurrentViewDate(currentDate);
        }
      }
    };

    const intervalId = setInterval(checkDateChange, 15000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkDateChange();
      }
    };
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        checkDateChange();
      }
    };

    const handleNotificationClick = () => {
      setActiveTab('dashboard');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('lasolucion:notification-click', handleNotificationClick);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('lasolucion:notification-click', handleNotificationClick);
    };
  }, []);
  return (
    <>
      <TransitionOverlay isVisible={isTransitioning} />
      {/* Clean UI: Overlays disabled to prevent screen clutter */}
      <div id="main-layout-wrapper" className="relative min-h-screen bg-[#000000] overflow-hidden text-white font-sans selection:bg-[#d6f421] selection:text-black">
        
        {/* LIENZO ÓPTICO: Recibe los filtros visuales (Aurora, Noir Oscuro, Noir Claro, Cobalto) */}
        <div id="app-optical-canvas" className="relative min-h-screen flex flex-col w-full transition-[filter,background-color,color] duration-700 ease-in-out">
          {/* ATMÓSFERA CÓSMICA / AURORA BOREAL & GRID */}
          <SciFiGridBackground />

        {/* GLOBAL LEVEL UP / REWARD GLOW */}
        <div 
          className={`pointer-events-none fixed inset-0 z-40 transition-all duration-700 ${
            isGlowing ? 'bg-[#9600ff]/20 opacity-100' : 'bg-transparent opacity-0'
          }`}
          style={{
            boxShadow: isGlowing ? 'inset 0 0 150px rgba(150,0,255,0.5)' : 'none',
          }}
        />

        <FloatingGainEffect rewards={floatingRewards} />
        <FloatingJuiceOverlay />
        {!zenMode && <ShockwaveOverlay />}
        <NotificationToastOverlay />

        {/* CAPA 3: CONTENIDO DE LA APP (GLASSMORPHISM) */}
        <main
          className={`relative z-10 min-h-screen flex flex-col p-3 sm:p-6 pt-safe pb-safe sm:pb-6 pointer-events-auto transition-[padding] duration-300 ease-out ${
            navigationMode === 'classic'
              ? handDominance === 'right'
                ? isSidebarDesktopExpanded
                  ? 'lg:pr-[284px] lg:pl-0'
                  : 'lg:pr-[94px] lg:pl-0'
                : isSidebarDesktopExpanded
                  ? 'lg:pl-[284px] lg:pr-0'
                  : 'lg:pl-[94px] lg:pr-0'
              : ''
          }`}
        >
          



          {/* Top Main Navigation Header (Unified Floating Cockpit) */}
          <div className="mb-3 sm:mb-5">
            <Header
                notifications={notifications}
                onOpenDailyRewards={() => setIsDailyRewardsOpen(true)}
                onClearNotifications={() => setNotifications([])}
                hasUnclaimedDailyReward={hasUnclaimedDailyReward}
                signOut={signOut}
                onGoToCover={() => setActiveTab('stats')}
                onGoToSettings={() => setActiveTab('settings')}
                onOpenNightlyReflection={() => setIsNightlyReflectionOpen(true)}
                onRegisterWakeUp={(dateStr, customWakeTime) => handleRegisterWakeUp(dateStr, customWakeTime)}
                cloudSync={cloudSync}
                onOpenKaiWorkshop={() => setIsKaiWorkshopOpen(true)}
                onOpenProfile={() => setActiveTab('stats')}
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab)}
              />
            </div>

          <div className="w-full max-w-6xl mx-auto flex-1 bg-[#030712]/[0.84] border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl px-2.5 py-3.5 sm:p-6">
            {/* [Existing content omitted for brevity, but kept in place] */}
            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-[#1a0500] border border-[#fb5607]/60 text-[#fb5607] text-xs flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(251,86,7,0.3)]">
                <span>{authError}</span>
                <button
                  onClick={clearAuthError}
                  className="text-white font-bold text-xs px-2.5 py-1 bg-[#fb5607] hover:bg-[#e04d06] rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Cerrar
                </button>
              </div>
            )}
            
            {/* Safe Sandbox Active Simulation Banner */}
            <Suspense fallback={null}>
              <SimulationBanner />
            </Suspense>

            {/* Dynamic Tab Views */}
            <motion.div
              key={activeTab}
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.02,
                    delayChildren: 0
                  }
                }
              }}
              initial="hidden"
              animate="show"
              className="w-full space-y-2.5 sm:space-y-4"
            >
              {activeTab === 'dashboard' && (
                <>
                  {/* COLLAPSIBLE LIVE SCHEDULE TIMELINE */}
                  {showBossSchedule && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <DailyScheduleStrip 
                        tasks={tasks} 
                        onOpenPomodoroForTask={handleOpenPomodoroForTask} 
                        onOpenFinishDay={() => setIsFinishDayOpen(true)}
                        onClose={() => setShowBossSchedule(false)}
                      />
                    </motion.div>
                  )}

                  {/* MAIN FOCUSED VIEW: DAILY PROGRESS & LIVE ACTIVE MISSION */}
                    <>
                      <motion.div variants={itemVariant}>
                        <DailyProgressWidget
                          tasks={tasks}
                          currentDate={currentViewDate}
                          onOpenTemplates={() => setIsDayTemplatesOpen(true)}
                          onOpenJournal={() => setActiveTab('journal')}
                          onOpenFinishDay={() => setIsFinishDayOpen(true)}
                          onOpenPomodoroForTask={handleOpenPomodoroForTask}
                          hasClaimedToday={hasClaimedBossToday()}
                          onClaimDailyBonus={handleClaimBossBounty}
                          showSchedule={showBossSchedule}
                          onToggleSchedule={() => setShowBossSchedule(prev => !prev)}
                          enableFinance={gameSettings?.enableFinanceModule ?? true}
                          onOpenFinance={() => setIsFinanceModalOpen(true)}
                          todayFinanceBalance={todayFinanceTotals.balance}
                        />
                      </motion.div>

                      <motion.div variants={itemVariant}>
                        <TaskListView
                          currentDate={currentViewDate}
                          onChangeDate={handleSetCurrentViewDate}
                          tasks={tasks}
                          customHabits={customHabits}
                          onSaveHabits={handleSaveHabits}
                          onAddTask={handleAddTask}
                          onToggleTask={handleToggleTask}
                          onIncrementHabit={handleIncrementHabit}
                          onDeleteTask={handleDeleteTask}
                          onEditTask={handleEditTask}
                          onOpenPomodoroForTask={handleOpenPomodoroForTask}
                          onOpenFinishDay={() => setIsFinishDayOpen(true)}
                          onOpenTemplates={() => setIsDayTemplatesOpen(true)}
                          onOpenOracle={() => handleOpenOracleWithPrompt()}
                          onOpenJournal={() => setActiveTab('journal')}
                          habitMastery={habitMastery}
                          onClearDay={handleClearDay}
                          onResetDay={handleResetDay}
                          stats={stats}
                          onUpdateStats={setStats}
                          onReopenDay={handleReopenDay}
                          onRegisterWakeUp={handleRegisterWakeUp}
                          onClaimBossBounty={handleClaimBossBounty}
                          hasClaimedToday={hasClaimedBossToday()}
                        />
                      </motion.div>
                    </>
                </>
              )}

              {activeTab === 'journal' && (
                <motion.div variants={itemVariant} className="w-full">
                  <Suspense fallback={<TabLoadingSkeleton />}>
                    <JournalView 
                      stats={stats}
                      currentDate={currentViewDate}
                      reflections={reflections}
                      onSaveReflection={handleSaveReflection}
                      onUpdateTaskNote={handleUpdateTaskNote}
                      onNavigateToDay={(date) => {
                        handleSetCurrentViewDate(date);
                        setActiveTab('dashboard');
                      }}
                      onBackToMissions={() => setActiveTab('dashboard')}
                      onAddRecallAsTask={handleAddRecallAsTask}
                      onRewardEarned={(xp, coins, text) => {
                        triggerRewardPopup(xp, coins, text);
                        setStats((prev) => checkLevelUp(prev, xp, coins));
                      }}
                    />
                  </Suspense>
                </motion.div>
              )}

              {activeTab === 'shop' && (
                <motion.div variants={itemVariant} className="w-full">
                  <Suspense fallback={<TabLoadingSkeleton />}>
                    <RewardShop />
                  </Suspense>
                </motion.div>
              )}

              {activeTab === 'stats' && (
                <motion.div variants={itemVariant} className="w-full">
                  <Suspense fallback={<WeeklyStatsSkeleton />}>
                    <WeeklyStats 
                      stats={stats} 
                      onUpdateStats={setStats} 
                      pomodoroSessions={pomodoroSessions} 
                      habitMastery={habitMastery} 
                      expenses={expenses} 
                      setExpenses={setExpenses} 
                      cloudSync={cloudSync}
                      onOpenAwakening={() => setIsAwakeningOpen(true)}
                      onOpenKaiWorkshop={() => setIsKaiWorkshopOpen(true)}
                      onOpenSkills={() => setActiveTab('skills')}
                    />
                  </Suspense>
                </motion.div>
              )}
              
              {activeTab === 'skills' && (
                <motion.div variants={itemVariant} className="w-full">
                  <Suspense fallback={<TabLoadingSkeleton />}>
                    <SkillTreeAndSettings 
                      skillTree={skillTree}
                      onUpdateSkillTree={setSkillTree}
                      stats={stats}
                      onUpdateStats={setStats}
                    />
                  </Suspense>
                </motion.div>
              )}
              
              {activeTab === 'settings' && (
                <motion.div variants={itemVariant} className="w-full">
                  <Suspense fallback={<TabLoadingSkeleton />}>
                    <SettingsView
                      settings={gameSettings}
                      onUpdateSettings={setGameSettings}
                      onResetAccount={handleResetAccount}
                      cloudSync={cloudSync}
                      onOpenKaiWorkshop={() => setIsKaiWorkshopOpen(true)}
                      onOpenOnboarding={() => setIsAwakeningOpen(true)}
                    />
                  </Suspense>
                </motion.div>
              )}
            </motion.div>
          </div>
        </main>

{/* Footer removed */}


      {/* Navegación en Modo Barra delegada íntegramente a SidebarHUD */}

      {/* Orquestador de Modales y Portales Secundarios Desacoplado */}
      <ModalPortalHost
        stats={stats}
        currentViewDate={currentViewDate}
        tasks={tasks}
        pomodoroSessions={pomodoroSessions}
        cloudSync={cloudSync}
        isOracleOpen={isOracleOpen}
        oracleInitialPrompt={oracleInitialPrompt}
        onCloseOracle={() => {
          setIsOracleOpen(false);
          setOracleInitialPrompt(undefined);
        }}
        isNeuralAnalysisOpen={isNeuralAnalysisOpen}
        onCloseNeuralAnalysis={() => setIsNeuralAnalysisOpen(false)}
        isFinanceModalOpen={isFinanceModalOpen}
        onCloseFinanceModal={() => setIsFinanceModalOpen(false)}
        isKaiWorkshopOpen={isKaiWorkshopOpen}
        onCloseKaiWorkshop={() => setIsKaiWorkshopOpen(false)}
        isAwakeningOpen={isAwakeningOpen}
        onCloseAwakening={() => setIsAwakeningOpen(false)}
        handleConfirmFinishDayLocal={handleConfirmFinishDayLocal}
        handleClaimDailyReward={handleClaimDailyReward}
        handleSaveReflection={handleSaveReflection}
        handlePomodoroComplete={handlePomodoroComplete}
        handleApplyTemplate={handleApplyTemplate}
        executeDeleteTask={executeDeleteTask}
        handleOpenOracleWithPrompt={handleOpenOracleWithPrompt}
        setActiveTab={setActiveTab}
      />

          {/* Offline Status Badge & PWA Install Banner */}
          <PWAInstallBanner />
          <OfflineIndicator cloudSync={cloudSync} />

        </div>
        {/* FIN #app-optical-canvas */}

        {/* SOBERANÍA VISUAL DE KAI: En Modo Nexus flota en el tablero; en Modo Barra vive en la cima de SidebarHUD */}
        <div id="kai-sovereign-portal" className="relative z-[90]">
          {navigationMode === 'classic' ? (
            <SidebarHUD
              onOpenOracleWithPrompt={handleOpenOracleWithPrompt}
              onOpenKaiWorkshop={() => setIsKaiWorkshopOpen(true)}
              onOpenFinance={() => setIsFinanceModalOpen(true)}
              archetype={stats?.characterClass || currentArchetype.name}
              onDesktopExpandChange={setIsSidebarDesktopExpanded}
            />
          ) : (
            <OmniCompanionHub
              onOpenOracleWithPrompt={handleOpenOracleWithPrompt}
              onOpenNeuralAnalysis={() => setIsNeuralAnalysisOpen(true)}
              onOpenKaiWorkshop={() => setIsKaiWorkshopOpen(true)}
              onOpenFinance={() => setIsFinanceModalOpen(true)}
              archetype={stats?.characterClass || currentArchetype.name}
            />
          )}
        </div>
      </div>
    </>
  );
}

function TabLoadingSkeleton() {
  const copy = useNarrativeCopy();
  return (
    <div className="w-full min-h-[320px] flex flex-col items-center justify-center p-8 space-y-4">
      <QuantumCubeLoader size="md" speed="slow" showLabel={true} label={copy.loadingModuleText} />
    </div>
  );
}

function WeeklyStatsSkeleton() {
  const copy = useNarrativeCopy();
  return (
    <div className="w-full min-h-[350px] flex flex-col items-center justify-center p-8 space-y-4">
      <QuantumCubeLoader size="md" speed="slow" showLabel={true} label={copy.loadingModuleText} />
    </div>
  );
}
