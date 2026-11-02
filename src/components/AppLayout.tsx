
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFX } from '../utils/audio';
import * as gameEngine from '../engine/gameEngine';
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../store/useAppStore';
import { useUIStore, syncRootTheme } from '../store/useUIStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTaskStore } from '../store/useTaskStore';
import { User, FileText, Timer as TimerIcon, Store, Image as ImageIcon , AlertTriangle, XCircle, Timer, Compass, CheckSquare, BarChart3, ShoppingBag, BookOpen, Sparkles, Flame, ChevronRight, ChevronLeft, HardDrive, Swords, Calendar, Shield, FlaskConical, ChevronDown, ChevronUp, X, Cpu, RotateCw, MessageSquare } from 'lucide-react';
import { useCloudSync } from '../hooks/useCloudSync';
import { getArchetypeByName } from '../data/archetypes';
import { Header } from './Header';
import { FloatingGainEffect } from './FloatingGainEffect';
import { FloatingEffectsOverlay } from './FloatingEffectsOverlay';
import { FloatingJuiceOverlay } from './FloatingJuiceOverlay';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { TaskListView } from './TaskListView';
import { PomodoroTimer } from './PomodoroTimer';

// Lazy Loaded Secondary Tabs & Modals (Code-Splitting for Instant PWA Launch)
const WeeklyStats = lazy(() => import('./WeeklyStats').then(m => ({ default: m.WeeklyStats })));
const JournalView = lazy(() => import('./JournalView').then(m => ({ default: m.JournalView })));
const RewardShop = lazy(() => import('./RewardShop').then(m => ({ default: m.RewardShop })));
const SkillTreeAndSettings = lazy(() => import('./SkillTreeAndSettings').then(m => ({ default: m.SkillTreeAndSettings })));
const SettingsView = lazy(() => import('./SettingsView').then(m => ({ default: m.SettingsView })));
const DayTemplatesModal = lazy(() => import('./DayTemplatesModal').then(m => ({ default: m.DayTemplatesModal })));
const OracleModal = lazy(() => import('./OracleModal').then(m => ({ default: m.OracleModal })));
const NeuralAnalysisModal = lazy(() => import('./NeuralAnalysisModal').then(m => ({ default: m.NeuralAnalysisModal })));
const HunterAwakeningModal = lazy(() => import('./HunterAwakeningModal').then(m => ({ default: m.HunterAwakeningModal })));
const KaiWelcomeOnboarding = lazy(() => import('./common/KaiWelcomeOnboarding').then(m => ({ default: m.KaiWelcomeOnboarding })));
const DailyRewardsModal = lazy(() => import('./DailyRewardsModal').then(m => ({ default: m.DailyRewardsModal })));
const LevelUpModal = lazy(() => import('./LevelUpModal').then(m => ({ default: m.LevelUpModal })));
const NightlyTunnel = lazy(() => import('./NightlyTunnel').then(m => ({ default: m.NightlyTunnel })));
const SurpriseBossModal = lazy(() => import('./SurpriseBossModal').then(m => ({ default: m.SurpriseBossModal })));
const HunterCollapseModal = lazy(() => import('./HunterCollapseModal').then(m => ({ default: m.HunterCollapseModal })));
const KaiInteractiveSpotlightTour = lazy(() => import('./common/KaiInteractiveSpotlightTour').then(m => ({ default: m.KaiInteractiveSpotlightTour })));

import { DailyBossWidget } from './DailyBossWidget';
import { DailyScheduleStrip } from './DailyScheduleStrip';
import { SciFiGridBackground } from './SciFiGridBackground';
import { TransitionOverlay } from './TransitionOverlay';
import { QuantumCubeLoader } from './QuantumCubeLoader';
import { DamageOverlay } from './DamageOverlay';
import { ShockwaveOverlay } from './ShockwaveOverlay';
import { DailyProgressWidget } from './DailyProgressWidget';
import { DailyFinanceWidget } from './DailyFinanceWidget';
import { DailyFinanceModal } from './DailyFinanceModal';
import { calculateDayFinanceTotals } from '../utils/finance';
import { ScrollReveal } from './common/ScrollReveal';
import { OfflineIndicator } from './OfflineIndicator';
import { NotificationToastOverlay } from './NotificationToastOverlay';
import { PWAInstallBanner } from './PWAInstallBanner';
import { OmniCompanionHub } from './OmniCompanionHub';
import { KaiWorkshopModal } from './KaiWorkshopModal';
import { SimulationBanner } from './SimulationBanner';
import { getTodayDateString } from '../utils/date';

export function AppLayout() {
          const {
    activeTab,
    isTransitioning,
    themeMode,
    navigationMode,
    soundEnabled,
    isDailyRewardsOpen,
    isLevelUpOpen,
    isFinishDayOpen,
    isDayTemplatesOpen,
    isPomodoroOpen,
    isNightlyReflectionOpen,
    isSurpriseBossOpen,
    surpriseBossData,
    deleteConfirmTask,
    floatingEffects,
    floatingRewards,
    zenMode,
    setActiveTab,
    setModalState,
    setDeleteConfirmTask,
    toggleTheme,
    toggleSound,
    isTacticalGuideOpen,
    tacticalGuideInitialStep,
    closeTacticalGuide
  } = useUIStore();

  const { stats, setStats } = usePlayerStore();
  const { tasksByDate, setTasksByDate, customHabits, setCustomHabits, currentViewDate, setCurrentViewDate } = useTaskStore();
  const tasks = tasksByDate[currentViewDate] || [];
  const [isOracleOpen, setIsOracleOpen] = React.useState(false);
  const [oracleInitialPrompt, setOracleInitialPrompt] = React.useState<string | undefined>(undefined);
  const [isNeuralAnalysisOpen, setIsNeuralAnalysisOpen] = React.useState(false);
  const [isKaiWorkshopOpen, setIsKaiWorkshopOpen] = React.useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = React.useState(false);

  const handleOpenOracleWithPrompt = (promptText?: string) => {
    setOracleInitialPrompt(promptText);
    setIsOracleOpen(true);
  };

  const currentArchetype = getArchetypeByName(stats?.characterClass);

  
  const { user, authError, clearAuthError, signOut } = useAuth() as any;
  const {
    habitMastery, setHabitMastery, gameSettings, setGameSettings,
    skillTree, setSkillTree, companion, setCompanion, expenses, setExpenses,
    shopRewards, setShopRewards, pomodoroSessions, setPomodoroSessions,
    notifications, setNotifications, comboCount, setComboCount,
    levelUpData, setLevelUpData, pomodoroPreFill, setPomodoroPreFill, reflections, setReflections
  } = useAppStore();

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
  } = gameEngine as any;

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
                             (Boolean(stats?.username) && stats.username !== 'CazadorDelSistema');
    
    if (stats?.hasCompletedAwakening === false && !hasPriorProgress) {
      setIsAwakeningOpen(true);
    }
  }, [stats?.hasCompletedAwakening, stats?.level, stats?.totalXpEarned, stats?.username]);

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

    const itemVariant: any = {
      hidden: { opacity: 0, y: 35, scale: 0.95 },
      show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] } }
    };
  React.useEffect(() => {
    syncRootTheme(themeMode);
  }, [themeMode]);

  React.useEffect(() => {
    if (floatingRewards.length > 0) {
      setIsGlowing(true);
      const t = setTimeout(() => setIsGlowing(false), 800);
      return () => clearTimeout(t);
    }
  }, [floatingRewards]);

  // Midnight / 3AM Date Sync Listener (Stale Date Fix)
  React.useEffect(() => {
    let lastKnownDate = getTodayDateString();

    const checkDateChange = () => {
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

    const handleNotificationClick = () => {
      setActiveTab('dashboard');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkDateChange);
    window.addEventListener('lasolucion:notification-click', handleNotificationClick);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkDateChange);
      window.removeEventListener('lasolucion:notification-click', handleNotificationClick);
    };
  }, []);
  return (
    <>
      <TransitionOverlay isVisible={isTransitioning} />
      {/* Clean UI: Overlays disabled to prevent screen clutter */}
      <div id="main-layout-wrapper" className="relative min-h-screen bg-[#000000] overflow-hidden text-white font-sans selection:bg-[#d6f421] selection:text-black">
        
        {/* LIENZO ÓPTICO: Recibe los filtros visuales (Aurora, Noir Oscuro, Noir Claro, Cobalto) */}
        <div id="app-optical-canvas" className="relative min-h-screen flex flex-col w-full transition-[filter] duration-300">
          {/* ATMÓSFERA CÓSMICA / AURORA BOREAL & GRID */}
          <SciFiGridBackground />

        {/* GLOBAL LEVEL UP / REWARD GLOW */}
        <div 
          className={`pointer-events-none fixed inset-0 z-40 transition-all duration-700 ${
            isGlowing ? 'bg-[#9600ff]/20 opacity-100' : 'bg-transparent opacity-0'
          }`}
          style={{
            boxShadow: isGlowing ? 'inset 0 0 150px rgba(150,0,255,0.5)' : 'none',
            backdropFilter: isGlowing ? 'brightness(1.1) saturate(1.2)' : 'none'
          }}
        />

        <FloatingGainEffect rewards={floatingRewards} />
        <NotificationToastOverlay />

        {/* CAPA 3: CONTENIDO DE LA APP (GLASSMORPHISM) */}
        <main className={`relative z-10 min-h-screen flex flex-col p-3 sm:p-6 pt-safe pointer-events-auto ${
          navigationMode === 'classic' ? 'pb-24 sm:pb-6' : 'pb-safe sm:pb-6'
        }`}>
          


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

          <div className="w-full max-w-6xl mx-auto flex-1 bg-[#030712]/40 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl px-2.5 py-3.5 sm:p-6">
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
        <SimulationBanner />

        {/* Dynamic Tab Views */}
        <motion.div
          key={activeTab}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.28,
                delayChildren: 0.15
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
              <motion.div variants={itemVariant}>
                <DailyProgressWidget 
                  tasks={tasks}
                  currentDate={currentViewDate}
                  onOpenTemplates={() => setIsDayTemplatesOpen(true)}
                  onOpenJournal={() => setActiveTab('journal')}
                  onOpenFinishDay={() => setIsFinishDayOpen(true)}
                  onOpenPomodoroForTask={handleOpenPomodoroForTask}
                  hasClaimedToday={hasClaimedBossToday}
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
                  hasClaimedToday={hasClaimedBossToday}
                />
              </motion.div>
            </>
          )}

          {activeTab === 'journal' && (
            <motion.div variants={itemVariant} className="w-full">
              <Suspense fallback={<TabLoadingSkeleton />}>
                <JournalView 
                  tasksByDate={tasksByDate}
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
                  tasksByDate={tasksByDate} 
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
                />
              </Suspense>
            </motion.div>
          )}
        </motion.div>
          </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Optimized for Phones - Only visible in Classic Mode) */}
      {/* MAIN NAVIGATION BAR (Keep backdrop blur here for spatial depth) */}
      {navigationMode === 'classic' && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#030712]/90 backdrop-blur-2xl border-t border-white/10 shadow-[0px_-6px_30px_rgba(0,0,0,0.7)] px-2 pt-2 pb-safe font-sans tracking-wide">
          {/* Filamento especular superior */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/35 to-transparent pointer-events-none" />

          <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
            <button
              onClick={() => { soundFX.playClick(); setActiveTab('stats'); }}
              className={`flex flex-col items-center justify-center flex-1 h-12 rounded-xl transition-all active:scale-95 cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-cyan-400 text-black font-anton font-bold shadow-[0_0_14px_rgba(0,240,255,0.6)]'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-white/5'
              }`}
            >
              <Shield className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] font-anton uppercase tracking-wider">Héroe</span>
            </button>
            
            <button
              onClick={() => { soundFX.playClick(); setActiveTab('dashboard'); }}
              className={`flex flex-col items-center justify-center flex-1 h-12 rounded-xl transition-all active:scale-95 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-400 text-black font-anton font-bold shadow-[0_0_14px_rgba(0,240,255,0.6)]'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-white/5'
              }`}
            >
              <Swords className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] font-anton uppercase tracking-wider">Tareas</span>
            </button>
            
            <button
              onClick={() => { soundFX.playClick(); setActiveTab('journal'); }}
              className={`flex flex-col items-center justify-center flex-1 h-12 rounded-xl transition-all active:scale-95 cursor-pointer ${
                activeTab === 'journal'
                  ? 'bg-cyan-400 text-black font-anton font-bold shadow-[0_0_14px_rgba(0,240,255,0.6)]'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] font-anton uppercase tracking-wider">Bitácora</span>
            </button>
            
            <button
              onClick={() => { soundFX.playClick(); setActiveTab('shop'); }}
              className={`flex flex-col items-center justify-center flex-1 h-12 rounded-xl transition-all active:scale-95 cursor-pointer ${
                activeTab === 'shop'
                  ? 'bg-cyan-400 text-black font-anton font-bold shadow-[0_0_14px_rgba(0,240,255,0.6)]'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-white/5'
              }`}
            >
              <ShoppingBag className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] font-anton uppercase tracking-wider">Tienda</span>
            </button>

            <button
              onClick={() => { soundFX.playClick(); setActiveTab('skills'); }}
              className={`flex flex-col items-center justify-center flex-1 h-12 rounded-xl transition-all active:scale-95 cursor-pointer ${
                activeTab === 'skills'
                  ? 'bg-cyan-400 text-black font-anton font-bold shadow-[0_0_14px_rgba(0,240,255,0.6)]'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-white/5'
              }`}
            >
              <FlaskConical className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] font-anton uppercase tracking-wider">Lab</span>
            </button>
          </div>
        </nav>
      )}

      {/* Day Routine Templates Modal */}
      <Suspense fallback={null}>
        <DayTemplatesModal 
          isOpen={isDayTemplatesOpen}
          onClose={() => setIsDayTemplatesOpen(false)}
          currentDate={currentViewDate}
          currentTasks={tasks}
          onApplyTemplate={handleApplyTemplate}
        />
      </Suspense>

      {/* Daily Rewards Modal */}
      <Suspense fallback={null}>
        <DailyRewardsModal
          isOpen={isDailyRewardsOpen}
          onClose={() => setIsDailyRewardsOpen(false)}
          stats={stats}
          onClaimReward={handleClaimDailyReward}
        />
      </Suspense>

      {/* Level Up Celebration Modal */}
      <Suspense fallback={null}>
        <LevelUpModal
          isOpen={isLevelUpOpen}
          onClose={() => setIsLevelUpOpen(false)}
          newLevel={levelUpData?.level || 1}
          newRankTitle={levelUpData?.rank || 'Aventurero'}
          stats={stats}
        />
      </Suspense>

      <Suspense fallback={null}>
        <SurpriseBossModal
          isOpen={isSurpriseBossOpen}
          onClose={() => setModalState('isSurpriseBossOpen', false)}
          archetypeName={surpriseBossData?.archetypeName || 'Ruptura de Inercia'}
          buffName={surpriseBossData?.buffName || 'Inercia Superada'}
          buffDescription={surpriseBossData?.buffDescription || '¡Conquistaste 3 misiones o hábitos prioritarios hoy! Tu vitalidad (+50 HP) y recursos se restauran al máximo.'}
        />
      </Suspense>

      {deleteConfirmTask && (
        <DeleteConfirmModal
          task={deleteConfirmTask}
          onClose={() => setDeleteConfirmTask(null)}
          onConfirm={executeDeleteTask}
        />
      )}

      {/* Hunter Collapse / Revival Modal */}
      <Suspense fallback={null}>
        <HunterCollapseModal />
      </Suspense>

      {/* Oracle AI Wizard Modal */}
      <Suspense fallback={null}>
        <OracleModal 
          isOpen={isOracleOpen}
          initialPrompt={oracleInitialPrompt}
          onClose={() => {
            setIsOracleOpen(false);
            setOracleInitialPrompt(undefined);
          }}
        />
      </Suspense>

      {/* Neural Analysis Modal (Separate Diagnostic Module) */}
      <Suspense fallback={null}>
        <NeuralAnalysisModal
          isOpen={isNeuralAnalysisOpen}
          onClose={() => setIsNeuralAnalysisOpen(false)}
        />
      </Suspense>

      {/* Daily Finance Express Modal */}
      <DailyFinanceModal
        isOpen={isFinanceModalOpen}
        onClose={() => setIsFinanceModalOpen(false)}
        currentDate={currentViewDate}
        tasks={tasks}
        onOpenStats={() => {
          setIsFinanceModalOpen(false);
          setActiveTab('stats');
        }}
      />

      {/* Nightly Tunnel — Sequential End-of-Day Flow (Evaluation + Reward + Seal) */}
      <Suspense fallback={null}>
        <NightlyTunnel
          isOpen={isNightlyReflectionOpen || isFinishDayOpen}
          onClose={() => {
            setIsNightlyReflectionOpen(false);
            setIsFinishDayOpen(false);
          }}
          stats={stats}
          allTasks={tasks}
          pomodoroSessions={pomodoroSessions}
          onConfirmFinishDay={handleConfirmFinishDayLocal}
          onClaimDailyReward={handleClaimDailyReward}
          onAddJournalEntry={(note) => {
            const today = getTodayDateString();
            const taskList = tasksByDate[today] || [];
            if (taskList.length > 0) {
              handleUpdateTaskNote(today, taskList[0].id, note);
            }
            handleSaveReflection(today, note);
          }}
        />
      </Suspense>

      {/* Onboarding y Guía de Bienvenida Cálida de KAI */}
      <Suspense fallback={null}>
        <KaiWelcomeOnboarding
          isOpen={isAwakeningOpen || isTacticalGuideOpen}
          initialStep={isTacticalGuideOpen ? (tacticalGuideInitialStep || 1) : 1}
          onClose={() => {
            setIsAwakeningOpen(false);
            closeTacticalGuide();
          }}
          stats={stats}
          cloudSync={cloudSync}
        />
      </Suspense>

      {/* Cyberpunk Floating Pomodoro Pop-up Modal */}
      <AnimatePresence>
        {isPomodoroOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                soundFX.playClick();
                setModalState('isPomodoroOpen', false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-lg my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <PomodoroTimer 
                onSessionComplete={handlePomodoroComplete} 
                initialTaskTitle={pomodoroPreFill.title}
                initialCategory={pomodoroPreFill.category}
                onClose={() => setModalState('isPomodoroOpen', false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

          {/* TALLER CUÁNTICO DE KAI (Adaptable a Modos Ópticos Noir, Cobalto y Aurora) */}
          <KaiWorkshopModal
            isOpen={isKaiWorkshopOpen}
            onClose={() => setIsKaiWorkshopOpen(false)}
            onOpenShop={() => setActiveTab('shop')}
          />

          {/* Offline Status Badge & PWA Install Banner */}
          <PWAInstallBanner />
          <OfflineIndicator />

        </div>
        {/* FIN #app-optical-canvas */}

        {/* SOBERANÍA VISUAL DE KAI: Aislado del lienzo de filtros ópticos para preservar 100% sus colores, ropa y auras neón del avatar */}
        <div id="kai-sovereign-portal" className="relative z-[90]">
          {/* OMNIPRESENT COMPANION & HOLOGRAPHIC COMMAND HUB (VISIBLE ON ALL SCREENS) */}
          <OmniCompanionHub
            onOpenOracleWithPrompt={handleOpenOracleWithPrompt}
            onOpenNeuralAnalysis={() => setIsNeuralAnalysisOpen(true)}
            onOpenKaiWorkshop={() => setIsKaiWorkshopOpen(true)}
            archetype={stats?.characterClass || currentArchetype.name}
          />
        </div>
      </div>
    </>
  );
}

function TabLoadingSkeleton() {
  return (
    <div className="w-full min-h-[320px] flex flex-col items-center justify-center p-8 space-y-4">
      <QuantumCubeLoader size="md" speed="slow" showLabel={true} label="CANALIZANDO MÓDULO DEL SISTEMA..." />
    </div>
  );
}

function WeeklyStatsSkeleton() {
  return (
    <div className="w-full min-h-[350px] flex flex-col items-center justify-center p-8 space-y-4">
      <QuantumCubeLoader size="md" speed="slow" showLabel={true} label="SINCRONIZANDO ESTADÍSTICAS DEL SISTEMA..." />
    </div>
  );
}
