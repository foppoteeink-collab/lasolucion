import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Moon, Sparkles, CheckCircle2, Coins, Zap, BookOpen,
  Clock, Flame, Star, Check, Gift, Lock, ChevronRight,
  Sun, ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundFX } from '../utils/audio';
import { getTodayDateString, formatDateFullSpanish } from '../utils/date';
import { DAILY_REWARDS } from '../data/defaults';
import { PlayerStats, TaskItem, PomodoroSession } from '../types';
import { getArchetypeByName, getCompanionEvolution } from '../data/archetypes';
import { HoloCompanion } from './HoloCompanion';
import { usePlayerStore } from '../store/usePlayerStore';

interface NightlyTunnelProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  allTasks: TaskItem[];
  pomodoroSessions?: PomodoroSession[];
  onConfirmFinishDay: (bonusXp: number, bonusCoins: number, customBedtime?: string) => void;
  onClaimDailyReward: (day: number, xp: number, coins: number, bonusItem?: string) => void;
  onAddJournalEntry?: (note: string) => void;
}

type TunnelStep = 'evaluation' | 'reward' | 'seal';

const stepConfig = [
  { id: 'evaluation', label: 'Evaluación', icon: Moon, color: 'cyan' },
  { id: 'reward',     label: 'Recompensa', icon: Gift, color: 'amber' },
  { id: 'seal',       label: 'Sellar',     icon: Star, color: 'indigo' },
] as const;

export const NightlyTunnel: React.FC<NightlyTunnelProps> = ({
  isOpen,
  onClose,
  stats,
  allTasks,
  pomodoroSessions = [],
  onConfirmFinishDay,
  onClaimDailyReward,
  onAddJournalEntry,
}) => {
  const [step, setStep] = useState<TunnelStep>('evaluation');
  const [reflectionText, setReflectionText] = useState('');
  const [dayConsolidated, setDayConsolidated] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [sealed, setSealed] = useState(false);

  const now = new Date();
  const currentLocalTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const [customBedtime, setCustomBedtime] = useState(currentLocalTime);

  // Reset state whenever tunnel opens
  useEffect(() => {
    if (isOpen) {
      setStep('evaluation');
      setReflectionText('');
      setDayConsolidated(false);
      setRewardClaimed(false);
      setSealed(false);
      setCustomBedtime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ── STATS ──────────────────────────────────────────────────
  const todayStr = getTodayDateString();
  const formattedFullDate = formatDateFullSpanish(todayStr);
  const archetype = getArchetypeByName(stats.characterClass);
  const evolution = getCompanionEvolution(archetype, stats.level, stats.streakDays);

  const completedToday = allTasks.filter(t => t.completed);
  const totalTasks = allTasks.length;
  const completionRate = totalTasks > 0
    ? Math.round((completedToday.length / totalTasks) * 100)
    : (completedToday.length > 0 ? 100 : 0);

  const xpEarnedToday  = completedToday.reduce((a, t) => a + (t.xpReward   || 0), 0);
  const coinsEarnedToday = completedToday.reduce((a, t) => a + (t.coinReward || 0), 0);

  const todayFocusMinutes = pomodoroSessions
    .filter(s => s.date === todayStr)
    .reduce((a, s) => a + s.durationMinutes, 0);

  // Grade
  let grade = 'C', gradeBadgeColor = 'bg-slate-700/50 text-slate-300 border-slate-600';
  let gradeTitle = '¡Cada paso cuenta!';
  let bonusXp = 5, bonusCoins = 2;

  if (completionRate >= 95) {
    grade = 'S+'; bonusXp = 30; bonusCoins = 15;
    gradeBadgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.4)]';
    gradeTitle = '¡PERFECCIÓN ABSOLUTA LEGENDARIA!';
  } else if (completionRate >= 80) {
    grade = 'A'; bonusXp = 20; bonusCoins = 10;
    gradeBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-400';
    gradeTitle = '¡Gran Disciplina y Rendimiento!';
  } else if (completionRate >= 50) {
    grade = 'B'; bonusXp = 12; bonusCoins = 6;
    gradeBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-400';
    gradeTitle = '¡Buen Avance Diario!';
  }

  // Daily Reward
  const isAlreadyClaimedToday = stats.lastDailyRewardClaimedDate === todayStr;
  const currentStreakDay = ((stats.streakDays - (isAlreadyClaimedToday ? 1 : 0)) % 7) + 1;

  // ── HANDLERS ───────────────────────────────────────────────
  const handleConsolidate = () => {
    if (dayConsolidated) return;

    const playerStore = usePlayerStore.getState();
    const incompleteImportant = allTasks.filter(t =>
      !t.completed && (t.priority === 'alta' || t.priority === 'epica' || t.isHabit || t.category === 'habito')
    );
    let totalDamage = 0;
    incompleteImportant.forEach(t => {
      if (t.priority === 'epica') totalDamage += 8;
      else if (t.priority === 'alta') totalDamage += 4;
      else totalDamage += 2;
    });
    if (totalDamage > 0) {
      const dmg = playerStore.takeDamage(totalDamage);
      window.dispatchEvent(new CustomEvent('player-damage', { detail: { amount: totalDamage, ...dmg } }));
    }

    soundFX.playLevelUp();
    try {
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 }, colors: ['#00f0ff', '#d946ef', '#39ff14', '#facc15'] });
    } catch {}

    if (reflectionText.trim() && onAddJournalEntry) {
      onAddJournalEntry(`🌙 Cierre de Jornada (${archetype.name}): ${reflectionText.trim()}`);
    }

    onConfirmFinishDay(bonusXp, bonusCoins, customBedtime);
    setDayConsolidated(true);

    // Auto advance to reward step
    setTimeout(() => setStep('reward'), 1200);
  };

  const handleClaimReward = (reward: typeof DAILY_REWARDS[number]) => {
    if (rewardClaimed || isAlreadyClaimedToday) return;
    soundFX.playLevelUp();
    try {
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.5 }, colors: ['#f59e0b', '#6366f1', '#10b981', '#ec4899'] });
    } catch {}
    onClaimDailyReward(reward.day, reward.xp, reward.coins, reward.bonusItem);
    setRewardClaimed(true);
    setTimeout(() => setStep('seal'), 1000);
  };

  const handleSkipReward = () => setStep('seal');

  const handleSeal = () => {
    setSealed(true);
    soundFX.playClick();
    setTimeout(() => {
      onClose();
    }, 900);
  };

  // ── STEP INDEX ────────────────────────────────────────────
  const currentStepIdx = stepConfig.findIndex(s => s.id === step);

  // ── VARIANTS ──────────────────────────────────────────────
  const slideVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-xl flex flex-col bg-[#001224] border-2 border-cyan-500/50 rounded-2xl sm:rounded-3xl shadow-[0_0_60px_rgba(0,240,255,0.25)] text-white overflow-hidden max-h-[92dvh]">

        {/* Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* ── HEADER: Progress Steps ────────────────────────── */}
        <div className="shrink-0 px-5 pt-5 pb-3 border-b border-cyan-900/50 bg-[#000e1c]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
              Ritual Nocturno · {formattedFullDate}
            </span>
            <div className={`px-2.5 py-1 rounded-xl border text-sm font-black ${gradeBadgeColor}`}>
              {grade}
            </div>
          </div>

          {/* Step Pills */}
          <div className="flex items-center gap-1">
            {stepConfig.map((s, i) => {
              const Icon = s.icon;
              const isActive = s.id === step;
              const isDone = i < currentStepIdx;
              return (
                <React.Fragment key={s.id}>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all duration-300 text-[11px] font-black uppercase tracking-wide ${
                    isDone
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                      : isActive
                      ? 'bg-cyan-950/60 border-cyan-400/60 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                      : 'bg-slate-900/40 border-slate-700/30 text-slate-500'
                  }`}>
                    {isDone ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < stepConfig.length - 1 && (
                    <ChevronRight className={`w-3 h-3 shrink-0 ${isDone ? 'text-emerald-500' : 'text-slate-600'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── BODY: Animated Steps ─────────────────────────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-cyan-600">
          <AnimatePresence mode="wait">
            {/* ═══════════════════════════════════════════════
                STEP 1: EVALUACIÓN
            ═══════════════════════════════════════════════ */}
            {step === 'evaluation' && (
              <motion.div
                key="evaluation"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: 'easeInOut' }}
                className="px-4 py-4 sm:px-6 sm:py-5 space-y-4"
              >
                {/* Grade Banner */}
                <div className="text-center bg-cyan-950/40 border border-cyan-800/40 py-2.5 px-3 rounded-xl">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center justify-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400" /> {gradeTitle}
                  </span>
                </div>

                {/* Companion */}
                <div className="bg-[#000a14]/90 border border-cyan-500/30 rounded-2xl p-4 flex items-start gap-3.5">
                  <div className="shrink-0">
                    <HoloCompanion archetype={stats.characterClass} size="sm" showHUD={false} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-white">{evolution.title}</span>
                      <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full font-bold">
                        {evolution.stageLabel}
                      </span>
                    </div>
                    <p className="text-xs italic text-slate-300 leading-relaxed">
                      {completedToday.length > 0
                        ? `"¡Gran trabajo hoy! Completaste el ${completionRate}% de tus misiones."`
                        : '"Hoy fue un día de descanso. Mañana renacerá tu energía."'}
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Cumplimiento', value: `${completionRate}%`, sub: `${completedToday.length}/${totalTasks}`, icon: CheckCircle2, color: 'text-cyan-400' },
                    { label: 'Total XP', value: `+${xpEarnedToday + bonusXp}`, sub: `+${bonusXp} Bonus`, icon: Zap, color: 'text-amber-400' },
                    { label: 'Monedas', value: `+${coinsEarnedToday + bonusCoins}`, sub: `+${bonusCoins} Bonus`, icon: Coins, color: 'text-yellow-400' },
                    { label: 'Foco', value: `${todayFocusMinutes}m`, sub: 'Pomodoro', icon: Clock, color: 'text-indigo-400' },
                  ].map(({ label, value, sub, icon: Icon, color }) => (
                    <div key={label} className="bg-[#000a14]/70 border border-cyan-900/40 rounded-xl p-3 text-center">
                      <div className={`flex items-center justify-center gap-1 ${color} text-[11px] font-bold mb-1`}>
                        <Icon className="w-3.5 h-3.5" /> {label}
                      </div>
                      <div className="text-base font-black text-white">{value}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{sub}</div>
                    </div>
                  ))}
                </div>

                {/* Bedtime Override */}
                <div className="bg-[#000a14]/90 border border-cyan-500/30 rounded-2xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-cyan-200">
                    <Moon className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-xs">Hora de dormir:</span>
                  </div>
                  <input
                    type="time"
                    value={customBedtime}
                    onChange={e => setCustomBedtime(e.target.value)}
                    className="bg-black/50 border border-cyan-800 rounded-xl px-3 py-1.5 text-white font-mono text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all cursor-pointer"
                  />
                </div>

                {/* Journal */}
                <div>
                  <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Bitácora del Día
                  </label>
                  <textarea
                    value={reflectionText}
                    onChange={e => setReflectionText(e.target.value)}
                    placeholder="¿Qué aprendiste hoy? ¿Qué mejorarás mañana?"
                    className="w-full bg-[#000a14] border border-cyan-900/70 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none h-16"
                  />
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════
                STEP 2: RECOMPENSA DIARIA
            ═══════════════════════════════════════════════ */}
            {step === 'reward' && (
              <motion.div
                key="reward"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: 'easeInOut' }}
                className="px-4 py-5 sm:px-6 space-y-4"
              >
                <div className="text-center">
                  <div className="text-3xl mb-1">🎁</div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wide">Recompensa del Día {currentStreakDay}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center justify-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-400" /> Racha: {stats.streakDays} días
                  </p>
                </div>

                {/* 7-Day Grid */}
                <div className="grid grid-cols-4 gap-2">
                  {DAILY_REWARDS.map(reward => {
                    const isClaimed = reward.day < currentStreakDay || (reward.day === currentStreakDay && isAlreadyClaimedToday);
                    const isToday = reward.day === currentStreakDay && !isAlreadyClaimedToday;
                    const isLocked = reward.day > currentStreakDay;

                    return (
                      <div
                        key={reward.day}
                        onClick={() => isToday && handleClaimReward(reward)}
                        className={`relative p-2.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                          reward.day === 7 ? 'col-span-2' : ''
                        } ${
                          isToday
                            ? 'bg-amber-500/20 border-amber-400/60 shadow-[0_0_15px_rgba(251,191,36,0.25)] cursor-pointer hover:scale-105 active:scale-95'
                            : isClaimed
                            ? 'bg-emerald-950/30 border-emerald-800/40 opacity-60'
                            : isLocked
                            ? 'bg-slate-900/40 border-slate-700/30 opacity-40'
                            : 'bg-[#000a14] border-cyan-900/40'
                        }`}
                      >
                        <span className="text-[9px] font-black uppercase text-slate-400 mb-1">Día {reward.day}</span>
                        <div className="text-xl my-0.5">
                          {reward.day === 7 ? '👑' : reward.day === 5 ? '🔮' : reward.day === 3 ? '⚡' : '🎁'}
                        </div>
                        <div className="text-[11px] font-black text-yellow-300">+{reward.coins}🪙</div>
                        <div className="text-[10px] font-bold text-amber-300">+{reward.xp} XP</div>

                        {/* State overlay icon */}
                        {isClaimed && (
                          <div className="absolute top-1 right-1 bg-emerald-500 rounded-full p-0.5">
                            <Check className="w-2 h-2 text-white stroke-[3]" />
                          </div>
                        )}
                        {isLocked && <Lock className="absolute top-1 right-1 w-2.5 h-2.5 text-slate-500" />}
                        {isToday && !rewardClaimed && (
                          <div className="mt-1.5 w-full text-[9px] font-black text-amber-900 bg-amber-400 rounded-lg py-1 tracking-wider">
                            ¡TAP!
                          </div>
                        )}
                        {isToday && rewardClaimed && (
                          <div className="mt-1.5 w-full text-[9px] font-black text-emerald-300 bg-emerald-900/50 border border-emerald-500/40 rounded-lg py-1">
                            ✓ Reclamado
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {isAlreadyClaimedToday && !rewardClaimed && (
                  <div className="text-center py-2 px-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                    <p className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4 stroke-[3]" /> Ya reclamaste tu recompensa de hoy
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════
                STEP 3: JORNADA SELLADA
            ═══════════════════════════════════════════════ */}
            {step === 'seal' && (
              <motion.div
                key="seal"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: 'easeInOut' }}
                className="px-4 py-8 sm:px-6 flex flex-col items-center justify-center text-center gap-5 min-h-[300px]"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                  className="text-7xl"
                >
                  🌙
                </motion.div>

                <div>
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-black text-white uppercase tracking-wide mb-2"
                  >
                    Jornada Sellada
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="text-sm text-slate-400 leading-relaxed max-w-sm"
                  >
                    Tu progreso ha sido guardado. Descansa, operador.<br />
                    <span className="text-cyan-400 font-bold">Mañana comienza tu próxima misión.</span>
                  </motion.p>
                </div>

                {/* Summary Chips */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="flex items-center gap-2 flex-wrap justify-center"
                >
                  <span className="bg-cyan-950/60 border border-cyan-500/30 rounded-full px-3 py-1 text-xs font-bold text-cyan-300">
                    <Zap className="w-3 h-3 inline mr-1" />+{xpEarnedToday + bonusXp} XP Total
                  </span>
                  <span className="bg-yellow-950/60 border border-yellow-500/30 rounded-full px-3 py-1 text-xs font-bold text-yellow-300">
                    <Coins className="w-3 h-3 inline mr-1" />+{coinsEarnedToday + bonusCoins} Monedas
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold border ${gradeBadgeColor}`}>
                    Rango: {grade}
                  </span>
                </motion.div>

                {sealed && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 text-sm text-emerald-400 font-bold"
                  >
                    <Check className="w-5 h-5" /> Cerrando...
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── FOOTER: Pinned Action Button ──────────────────── */}
        <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-4 border-t border-cyan-900/50 bg-[#000e1c]">
          {step === 'evaluation' && (
            <button
              onClick={handleConsolidate}
              disabled={dayConsolidated}
              className={`w-full py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                dayConsolidated
                  ? 'bg-emerald-600 text-white shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                  : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-[0_0_25px_rgba(0,240,255,0.35)] active:scale-[0.98]'
              }`}
            >
              {dayConsolidated ? (
                <><Check className="w-5 h-5 animate-bounce" /> ¡Jornada Consolidada! → Cargando recompensa...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Consolidar Jornada (+{bonusXp} XP / +{bonusCoins} Monedas)</>
              )}
            </button>
          )}

          {step === 'reward' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSkipReward}
                className="px-4 py-3 rounded-2xl text-xs font-bold text-slate-400 border border-slate-700/50 hover:border-slate-500 transition-all cursor-pointer"
              >
                Omitir
              </button>
              <button
                onClick={() => {
                  const reward = DAILY_REWARDS.find(r => r.day === currentStreakDay);
                  if (reward && !isAlreadyClaimedToday) {
                    handleClaimReward(reward);
                  } else {
                    handleSkipReward();
                  }
                }}
                disabled={isAlreadyClaimedToday || rewardClaimed}
                className={`flex-1 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isAlreadyClaimedToday || rewardClaimed
                    ? 'bg-slate-700/50 text-slate-400 border border-slate-600'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400 shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-[0.98]'
                }`}
              >
                {isAlreadyClaimedToday
                  ? <><ArrowRight className="w-4 h-4" /> Continuar</>
                  : rewardClaimed
                  ? <><Check className="w-4 h-4" /> ¡Reclamado! Continuando...</>
                  : <><Gift className="w-4 h-4" /> ¡Reclamar Recompensa del Día {currentStreakDay}!</>
                }
              </button>
            </div>
          )}

          {step === 'seal' && (
            <button
              onClick={handleSeal}
              disabled={sealed}
              className="w-full py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white shadow-[0_0_25px_rgba(99,102,241,0.4)] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Moon className="w-4 h-4" /> Sellar Jornada y Descansar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
