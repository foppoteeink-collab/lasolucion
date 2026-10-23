
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
const MonthlyCalendar = lazy(() => import('./MonthlyCalendar').then(m => ({ default: m.MonthlyCalendar })));
const JournalView = lazy(() => import('./JournalView').then(m => ({ default: m.JournalView })));
const RewardShop = lazy(() => import('./RewardShop').then(m => ({ default: m.RewardShop })));
const SkillTreeAndSettings = lazy(() => import('./SkillTreeAndSettings').then(m => ({ default: m.SkillTreeAndSettings })));
const SettingsView = lazy(() => import('./SettingsView').then(m => ({ default: m.SettingsView })));
const DayTemplatesModal = lazy(() => import('./DayTemplatesModal').then(m => ({ default: m.DayTemplatesModal })));
const OracleModal = lazy(() => import('./OracleModal').then(m => ({ default: m.OracleModal })));
const NeuralAnalysisModal = lazy(() => import('./NeuralAnalysisModal').then(m => ({ default: m.NeuralAnalysisModal })));
const HunterAwakeningModal = lazy(() => import('./HunterAwakeningModal').then(m => ({ default: m.HunterAwakeningModal })));
const DailyRewardsModal = lazy(() => import('./DailyRewardsModal').then(m => ({ default: m.DailyRewardsModal })));
const LevelUpModal = lazy(() => import('./LevelUpModal').then(m => ({ default: m.LevelUpModal })));
const NightlyReflectionModal = lazy(() => import('./NightlyReflectionModal').then(m => ({ default: m.NightlyReflectionModal })));
const NightlyTunnel = lazy(() => import('./NightlyTunnel').then(m => ({ default: m.NightlyTunnel })));
const SurpriseBossModal = lazy(() => import('./SurpriseBossModal').then(m => ({ default: m.SurpriseBossModal })));
const HunterCollapseModal = lazy(() => import('./HunterCollapseModal').then(m => ({ default: m.HunterCollapseModal })));

import { DailyBossWidget } from './DailyBossWidget';
import { DailyScheduleStrip } from './DailyScheduleStrip';
import { SciFiGridBackground } from './SciFiGridBackground';
import { TransitionOverlay } from './TransitionOverlay';
import { DamageOverlay } from './DamageOverlay';
import { ShockwaveOverlay } from './ShockwaveOverlay';
import { DailyProgressWidget } from './DailyProgressWidget';
import { DailyFinanceWidget } from './DailyFinanceWidget';
import { ScrollReveal } from './common/ScrollReveal';
import { OfflineIndicator } from './OfflineIndicator';
import { NotificationToastOverlay } from './NotificationToastOverlay';
import { PWAInstallBanner } from './PWAInstallBanner';
import { OmniCompanionHub } from './OmniCompanionHub';
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
    toggleSound
  } = useUIStore();

  const { stats, setStats } = usePlayerStore();
  const { tasksByDate, setTasksByDate, customHabits, setCustomHabits, currentViewDate, setCurrentViewDate } = useTaskStore();
  const tasks = tasksByDate[currentViewDate] || [];
  const [isOracleOpen, setIsOracleOpen] = React.useState(false);
  const [oracleInitialPrompt, setOracleInitialPrompt] = React.useState<string | undefined>(undefined);
  const [isNeuralAnalysisOpen, setIsNeuralAnalysisOpen] = React.useState(false);

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

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkDateChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkDateChange);
    };
  }, []);
  return (
    <>
      <TransitionOverlay isVisible={isTransitioning} />
      {/* Clean UI: Overlays disabled to prevent screen clutter */}
      <div id="main-layout-wrapper" className="relative min-h-screen bg-[#000000] overflow-hidden text-white font-sans selection:bg-[#d6f421] selection:text-black">
        
        {/* CAPA 1: ORBES DE ENERGÍA (DESACTIVADA EN MODO ZEN PARA ULTRA-ENFOQUE Y RENDIMIENTO) */}
        {!zenMode && (
          <div className="absolute inset-0 pointer-events-none z-0">
            <motion.div 
              animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/40 rounded-full blur-[140px]"
            />
            <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-[#9600ff]/50 rounded-full blur-[120px]" />
            <div className="absolute -bottom-32 -left-32 w-[300px] h-[300px] bg-[#d6f421]/30 rounded-full blur-[100px]" />
          </div>
        )}

        {/* CAPA 2: PARTICULAS PARALLAX (DESACTIVADA EN MODO ZEN) */}
        {!zenMode && (
          <div className="absolute inset-0 pointer-events-none z-0 opacity-40">
            <motion.div 
              animate={{ y: ["-100%", "0%"] }}
              transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-full h-[200%] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')] opacity-50"
            />
            <motion.div 
              animate={{ y: ["-100%", "0%"] }}
              transition={{ duration: 22.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-full h-[200%] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCI+PGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iMiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')] opacity-80"
            />
          </div>
        )}

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
        <SciFiGridBackground />
        <FloatingGainEffect rewards={floatingRewards} />
        <NotificationToastOverlay />

        {/* CAPA 3: CONTENIDO DE LA APP (GLASSMORPHISM) */}
        <main className={`relative z-10 min-h-screen flex flex-col p-3 sm:p-6 pt-safe pointer-events-auto ${
          navigationMode === 'classic' ? 'pb-24 sm:pb-6' : 'pb-safe sm:pb-6'
        }`}>
          


          {/* Top Main Navigation Header */}
          <div className="mb-6">
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
            />
          </div>

          <div className="w-full max-w-6xl mx-auto flex-1 bg-[#030712]/95 border border-white/10 rounded-3xl shadow-2xl p-4 sm:p-8">
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

        {/* Navigation Tabs (Desktop / Tablet pills) */}
        <div className="hidden sm:flex items-center justify-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-2xl bg-[#030712]/95 border border-cyan-500/40 shadow-[0_0_25px_rgba(0,240,255,0.15)]">
            <button
              onClick={() => { soundFX.playClick(); setActiveTab('stats'); }}
              className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2 rounded-xl transition-all font-anton text-sm sm:text-base whitespace-nowrap cursor-pointer tracking-wider ${
                activeTab === 'stats'
                  ? 'bg-cyan-400 text-black shadow-[0_0_16px_rgba(0,240,255,0.7)]'
                  : 'text-slate-300 hover:text-white hover:bg-cyan-950/40'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Perfil</span>
            </button>
            <button
              onClick={() => { soundFX.playClick(); setActiveTab('dashboard'); }}
              className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2 rounded-xl transition-all font-anton text-sm sm:text-base whitespace-nowrap cursor-pointer tracking-wider ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-400 text-black shadow-[0_0_16px_rgba(0,240,255,0.7)]'
                  : 'text-slate-300 hover:text-white hover:bg-cyan-950/40'
              }`}
            >
              <Swords className="w-4 h-4" />
              <span>Misiones</span>
            </button>
            <button
              onClick={() => { soundFX.playClick(); setActiveTab('journal'); }}
              className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2 rounded-xl transition-all font-anton text-sm sm:text-base whitespace-nowrap cursor-pointer tracking-wider ${
                activeTab === 'journal'
                  ? 'bg-cyan-400 text-black shadow-[0_0_16px_rgba(0,240,255,0.7)]'
                  : 'text-slate-300 hover:text-white hover:bg-cyan-950/40'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Bitácora</span>
            </button>
            <button
              onClick={() => { soundFX.playClick(); setActiveTab('planner'); }}
              className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2 rounded-xl transition-all font-anton text-sm sm:text-base whitespace-nowrap cursor-pointer tracking-wider ${
                activeTab === 'planner'
                  ? 'bg-cyan-400 text-black shadow-[0_0_16px_rgba(0,240,255,0.7)]'
                  : 'text-slate-300 hover:text-white hover:bg-cyan-950/40'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Planificador</span>
            </button>
            <button
              onClick={() => { soundFX.playClick(); setActiveTab('shop'); }}
              className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2 rounded-xl transition-all font-anton text-sm sm:text-base whitespace-nowrap cursor-pointer tracking-wider ${
                activeTab === 'shop'
                  ? 'bg-purple-600 text-white shadow-[0_0_16px_rgba(168,85,247,0.7)]'
                  : 'text-slate-300 hover:text-white hover:bg-purple-950/40'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Tienda</span>
            </button>
            <button
              onClick={() => { soundFX.playClick(); setActiveTab('skills'); }}
              className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2 rounded-xl transition-all font-anton text-sm sm:text-base whitespace-nowrap cursor-pointer tracking-wider ${
                activeTab === 'skills'
                  ? 'bg-purple-600 text-white shadow-[0_0_16px_rgba(168,85,247,0.7)]'
                  : 'text-slate-300 hover:text-white hover:bg-purple-950/40'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>Lab</span>
            </button>
            <button
              onClick={() => { soundFX.playClick(); setActiveTab('settings'); }}
              className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2 rounded-xl transition-all font-anton text-sm sm:text-base whitespace-nowrap cursor-pointer tracking-wider ${
                activeTab === 'settings'
                  ? 'bg-slate-800 text-cyan-300 border border-cyan-500/60 shadow-[0_0_16px_rgba(0,240,255,0.3)]'
                  : 'text-slate-300 hover:text-white hover:bg-cyan-950/40'
              }`}
            >
              <span>Ajustes</span>
            </button>
          </div>
        </div>

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
          {activeTab === 'planner' && (
            <motion.div variants={itemVariant} className="w-full">
              <Suspense fallback={<TabLoadingSkeleton />}>
                <MonthlyCalendar 
                  currentDate={currentViewDate}
                  tasksByDate={tasksByDate}
                  onChangeDate={handleSetCurrentViewDate}
                  onNavigateToDay={(date) => {
                     handleSetCurrentViewDate(date);
                     setActiveTab('dashboard');
                  }}
                />
              </Suspense>
            </motion.div>
          )}

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
                />
              </motion.div>

              {/* DAILY FINANCE WIDGET: CONTROL DE INGRESOS Y GASTOS DE LA JORNADA */}
              <ScrollReveal>
                <DailyFinanceWidget 
                  currentDate={currentViewDate}
                  tasks={tasks}
                  onOpenStats={() => setActiveTab('stats')}
                />
              </ScrollReveal>

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
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#030712]/95 backdrop-blur-xl border-t border-cyan-500/40 shadow-[0px_-4px_25px_rgba(0,240,255,0.2)] px-3 pt-2 pb-safe font-sans tracking-wide">
          <div className="flex items-center justify-between">
            <button
              onClick={() => { soundFX.playClick(); setActiveTab('stats'); }}
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all ${
                activeTab === 'stats'
                  ? 'text-cyan-300 font-black bg-cyan-500/20 border border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              <Shield className={`w-5 h-5 mb-1 ${activeTab === 'stats' ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]' : ''}`} />
              <span className="text-[9px] font-bold tracking-wider">Héroe</span>
            </button>
            
            <button
              onClick={() => { soundFX.playClick(); setActiveTab('planner'); }}
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all ${
                activeTab === 'planner'
                  ? 'text-cyan-300 font-black bg-cyan-500/20 border border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              <Calendar className={`w-5 h-5 mb-1 ${activeTab === 'planner' ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]' : ''}`} />
              <span className="text-[9px] font-bold tracking-wider">Cal</span>
            </button>
            
            <button
              onClick={() => { soundFX.playClick(); setActiveTab('dashboard'); }}
              className={`flex flex-col items-center justify-center w-16 h-14 -mt-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(0,0,0,0.9)] ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-400 text-black font-anton font-bold border-2 border-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.8)] transform -translate-y-1'
                  : 'bg-[#011420] text-slate-300 border border-cyan-500/40 hover:bg-cyan-950/40'
              }`}
            >
              <Swords className={`w-6 h-6 mb-0.5 ${activeTab === 'dashboard' ? 'text-black drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]' : 'text-cyan-300'}`} />
              <span className="text-[9px] font-bold tracking-wider">Misiones</span>
            </button>
            
            <button
              onClick={() => { soundFX.playClick(); setActiveTab('journal'); }}
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all ${
                activeTab === 'journal'
                  ? 'text-cyan-300 font-black bg-cyan-500/20 border border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              <BookOpen className={`w-5 h-5 mb-1 ${activeTab === 'journal' ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]' : ''}`} />
              <span className="text-[9px] font-bold tracking-wider">Bitácora</span>
            </button>
            
            <button
              onClick={() => { soundFX.playClick(); setActiveTab('shop'); }}
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all ${
                activeTab === 'shop'
                  ? 'text-purple-300 font-black bg-purple-500/20 border border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                  : 'text-slate-400 hover:text-purple-300'
              }`}
            >
              <ShoppingBag className={`w-5 h-5 mb-1 ${activeTab === 'shop' ? 'text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : ''}`} />
              <span className="text-[9px] font-bold tracking-wider">Tienda</span>
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
          archetypeName={surpriseBossData?.archetypeName || 'Jefe Sorpresa'}
          buffName={surpriseBossData?.buffName || 'Recompensa del Jefe'}
          buffDescription={surpriseBossData?.buffDescription || 'Reclama tu poder.'}
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

      {/* Hunter Awakening Ceremony Onboarding Modal */}
      <Suspense fallback={null}>
        <HunterAwakeningModal
          isOpen={isAwakeningOpen}
          onClose={() => setIsAwakeningOpen(false)}
          stats={stats}
          onCompleteAwakening={(data) => {
            setIsAwakeningOpen(false);
            usePlayerStore.getState().completeAwakening(data);
            if (cloudSync?.forceSyncNow) {
              cloudSync.forceSyncNow();
            }
          }}
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

      {/* OMNIPRESENT COMPANION & HOLOGRAPHIC COMMAND HUB (VISIBLE ON ALL SCREENS) */}
      <OmniCompanionHub
        onOpenOracleWithPrompt={handleOpenOracleWithPrompt}
        onOpenNeuralAnalysis={() => setIsNeuralAnalysisOpen(true)}
        archetype={stats?.characterClass || currentArchetype.name}
      />

      {/* Offline Status Badge & PWA Install Banner */}
      <PWAInstallBanner />
      <OfflineIndicator />
    </div>
    </>
  );
}

function TabLoadingSkeleton() {
  return (
    <div className="w-full min-h-[300px] flex flex-col items-center justify-center p-8 space-y-4 animate-pulse">
      <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.2)]">
        <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
      <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
        Cargando Módulo...
      </span>
    </div>
  );
}

function WeeklyStatsSkeleton() {
  return (
    <div className="w-full space-y-5 animate-pulse pb-10">
      {/* Sub-tab pills skeleton */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-black/60 border border-cyan-500/30">
        <div className="h-10 flex-1 bg-cyan-950/40 rounded-xl border border-cyan-500/20" />
        <div className="h-10 flex-1 bg-cyan-950/20 rounded-xl" />
        <div className="h-10 flex-1 bg-cyan-950/20 rounded-xl" />
        <div className="h-10 flex-1 bg-cyan-950/20 rounded-xl" />
      </div>

      {/* Hero card skeleton */}
      <div className="h-64 rounded-[24px] bg-gradient-to-b from-[#0a0f25] to-[#030612] border-2 border-cyan-500/30 p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 bg-cyan-500/20 rounded-lg" />
          <div className="h-5 w-16 bg-cyan-400/30 rounded-lg" />
        </div>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-cyan-950/60 border border-cyan-500/40" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-32 bg-cyan-500/30 rounded" />
            <div className="h-6 w-48 bg-white/20 rounded" />
            <div className="h-3 w-28 bg-amber-400/30 rounded" />
          </div>
        </div>
        <div className="h-3 w-full bg-cyan-950/60 rounded-full border border-cyan-500/30" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-72 rounded-3xl bg-[#0a0f25]/80 border border-cyan-900/40" />
        <div className="h-72 rounded-3xl bg-[#0a0f25]/80 border border-cyan-900/40" />
      </div>
    </div>
  );
}
