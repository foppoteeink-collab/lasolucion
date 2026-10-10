
import React from 'react';
import { motion } from 'motion/react';
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
import { DailyRewardsModal } from './DailyRewardsModal';
import { LevelUpModal } from './LevelUpModal';
import { NightlyReflectionModal } from './NightlyReflectionModal';
import { NightlyTunnel } from './NightlyTunnel';
import { SurpriseBossModal } from './SurpriseBossModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { TaskListView } from './TaskListView';
import { PomodoroTimer } from './PomodoroTimer';
import { WeeklyStats } from './WeeklyStats';
import { SkillTreeAndSettings } from './SkillTreeAndSettings';
import { SettingsView } from './SettingsView';
import { RewardShop } from './RewardShop';
import { DailyBossWidget } from './DailyBossWidget';
import { DailyScheduleStrip } from './DailyScheduleStrip';
import { CalendarView } from './CalendarView';
import { MonthlyCalendar } from './MonthlyCalendar';
import { SciFiGridBackground } from './SciFiGridBackground';
import { TransitionOverlay } from './TransitionOverlay';
import { DamageOverlay } from './DamageOverlay';
import { ShockwaveOverlay } from './ShockwaveOverlay';
import { JournalView } from './JournalView';
import { DayTemplatesModal } from './DayTemplatesModal';
import { DailyProgressWidget } from './DailyProgressWidget';
import { DailyFinanceWidget } from './DailyFinanceWidget';
import { ScrollReveal } from './common/ScrollReveal';
import { OracleModal } from './OracleModal';
import { NeuralAnalysisModal } from './NeuralAnalysisModal';
import { OfflineIndicator } from './OfflineIndicator';
import { NotificationToastOverlay } from './NotificationToastOverlay';
import { PWAInstallBanner } from './PWAInstallBanner';
import { OmniCompanionHub } from './OmniCompanionHub';
import { SimulationBanner } from './SimulationBanner';
import { getTodayDateString } from '../utils/date';

import { GlobalTimerButton } from './GlobalTimerButton';
import { GlobalSoundscapeButton } from './GlobalSoundscapeButton';

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
          stateUI.addFloatingEffect({ x: window.innerWidth / 2, y: window.innerHeight / 2 - 40, text: `+${bonusCoins} Oro`, type: 'coins' });
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
        
        {/* CAPA 1: ORBES DE ENERGÍA */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <motion.div 
            animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/40 rounded-full blur-[140px]"
          />
          <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-[#9600ff]/50 rounded-full blur-[120px]" />
          <div className="absolute -bottom-32 -left-32 w-[300px] h-[300px] bg-[#d6f421]/30 rounded-full blur-[100px]" />
        </div>

        {/* CAPA 2: PARTICULAS PARALLAX */}
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
        <main className={`relative z-10 min-h-screen flex flex-col p-3 sm:p-6 pointer-events-auto ${
          navigationMode === 'classic' ? 'pb-20 sm:pb-6' : 'pb-6'
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
          className="w-full space-y-4 sm:space-y-6"
        >
          {activeTab === 'planner' && (
            <motion.div variants={itemVariant} className="w-full">
                  <MonthlyCalendar 
                    currentDate={currentViewDate}
                    tasksByDate={tasksByDate}
                    onChangeDate={handleSetCurrentViewDate}
                    onNavigateToDay={(date) => {
                       setActiveTab('dashboard');
                    }}
                  />
                </motion.div>
              )}

              {activeTab === 'dashboard' && (
                <>
                  {/* FOCUS & PROGRESSIVE DISCLOSURE CONTROL BAR */}
                  <motion.div 
                    variants={itemVariant}
                    className="flex items-center justify-between gap-2 p-2 sm:p-2.5 rounded-2xl bg-[#030712]/95 border border-[#9600ff]/50 shadow-[0_4px_25px_rgba(0,0,0,0.8)]"
                  >
                {/* Left: Pomodoro Focus Toggle & Quantum Soundscape Launcher */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <GlobalTimerButton />
                  <GlobalSoundscapeButton />
                </div>

                {/* Right: Live Schedule Timeline Trigger */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setShowBossSchedule(!showBossSchedule);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer border ${
                      showBossSchedule
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                        : 'bg-[#03000a] text-slate-300 border-[#9600ff]/40 hover:text-white hover:border-cyan-400'
                    }`}
                    title="Ver línea de tiempo de horarios del día"
                  >
                    <Timer className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Horarios</span>
                    {showBossSchedule ? <ChevronUp className="w-3.5 h-3.5 ml-0.5 text-cyan-300" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-slate-400" />}
                  </button>
                </div>
              </motion.div>

              {/* COLLAPSIBLE POMODORO TIMER */}
              {isPomodoroOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full"
                >
                  <PomodoroTimer 
                    onSessionComplete={handlePomodoroComplete} 
                    initialTaskTitle={pomodoroPreFill.title}
                    initialCategory={pomodoroPreFill.category}
                  />
                </motion.div>
              )}

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
            </motion.div>
          )}

          {activeTab === 'shop' && (
            <motion.div variants={itemVariant} className="w-full">
              <RewardShop />
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div variants={itemVariant} className="w-full">
              <WeeklyStats stats={stats} onUpdateStats={setStats} tasksByDate={tasksByDate} pomodoroSessions={pomodoroSessions} habitMastery={habitMastery} expenses={expenses} setExpenses={setExpenses} />
            </motion.div>
          )}
          
          {activeTab === 'skills' && (
            <motion.div variants={itemVariant} className="w-full">
              <SkillTreeAndSettings 
                skillTree={skillTree}
                onUpdateSkillTree={setSkillTree}
                stats={stats}
                onUpdateStats={setStats}
              />
            </motion.div>
          )}
          
          {activeTab === 'settings' && (
            <motion.div variants={itemVariant} className="w-full">
              <SettingsView
                settings={gameSettings}
                onUpdateSettings={setGameSettings}
                onResetAccount={handleResetAccount}
                cloudSync={cloudSync}
              />
            </motion.div>
          )}
        </motion.div>
          </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Optimized for Phones - Only visible in Classic Mode) */}
      {/* MAIN NAVIGATION BAR (Keep backdrop blur here for spatial depth) */}
      {navigationMode === 'classic' && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#030712]/90 backdrop-blur-xl border-t border-cyan-500/40 shadow-[0px_-4px_25px_rgba(0,240,255,0.2)] px-3 py-2 font-sans tracking-wide">
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
      <DayTemplatesModal 
        isOpen={isDayTemplatesOpen}
        onClose={() => setIsDayTemplatesOpen(false)}
        currentDate={currentViewDate}
        currentTasks={tasks}
        onApplyTemplate={handleApplyTemplate}
      />

      {/* Daily Rewards Modal */}
      <DailyRewardsModal
        isOpen={isDailyRewardsOpen}
        onClose={() => setIsDailyRewardsOpen(false)}
        stats={stats}
        onClaimReward={handleClaimDailyReward}
      />

      {/* Level Up Celebration Modal */}
      <LevelUpModal
        isOpen={isLevelUpOpen}
        onClose={() => setIsLevelUpOpen(false)}
        newLevel={levelUpData?.level || 1}
        newRankTitle={levelUpData?.rank || 'Aventurero'}
        stats={stats}
      />

            <SurpriseBossModal
        isOpen={isSurpriseBossOpen}
        onClose={() => setModalState('isSurpriseBossOpen', false)}
        archetypeName={surpriseBossData?.archetypeName || 'Jefe Sorpresa'}
        buffName={surpriseBossData?.buffName || 'Recompensa del Jefe'}
        buffDescription={surpriseBossData?.buffDescription || 'Reclama tu poder.'}
      />

      {deleteConfirmTask && (
        <DeleteConfirmModal
          task={deleteConfirmTask}
          onClose={() => setDeleteConfirmTask(null)}
          onConfirm={executeDeleteTask}
        />
      )}

      {/* Oracle AI Wizard Modal */}
      <OracleModal 
        isOpen={isOracleOpen}
        initialPrompt={oracleInitialPrompt}
        onClose={() => {
          setIsOracleOpen(false);
          setOracleInitialPrompt(undefined);
        }}
      />

      {/* Neural Analysis Modal (Separate Diagnostic Module) */}
      <NeuralAnalysisModal
        isOpen={isNeuralAnalysisOpen}
        onClose={() => setIsNeuralAnalysisOpen(false)}
      />

      {/* Nightly Tunnel — Sequential End-of-Day Flow (Evaluation + Reward + Seal) */}
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

