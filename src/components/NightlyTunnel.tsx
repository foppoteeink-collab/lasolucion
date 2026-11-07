import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from './common/Icon';
import { triggerShockwave } from '../utils/celebration';
import { soundFX } from '../utils/audio';
import { getTodayDateString, formatDateFullSpanish } from '../utils/date';
import { DAILY_REWARDS } from '../data/defaults';
import { PlayerStats, TaskItem, PomodoroSession } from '../types';
import { getArchetypeByName, getCompanionEvolution } from '../data/archetypes';
import { HoloCompanion } from './HoloCompanion';
import { usePlayerStore } from '../store/usePlayerStore';
import { evaluateOverchargeContract } from '../utils/level3Systems';
import { generateAndShareLegacyCard } from '../utils/shareCardGenerator';
import { getKaiPhrase } from '../data/kaiVoiceMatrix';

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
  { id: 'evaluation', label: 'Evaluación', icon: 'moon' as const, color: 'cyan' },
  { id: 'reward',     label: 'Recompensa', icon: 'gift' as const, color: 'amber' },
  { id: 'seal',       label: 'Consolidar', icon: 'star' as const, color: 'indigo' },
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  const hasValidReflection = reflectionText.trim().length >= 15;
  const contractEval = evaluateOverchargeContract(stats.activeOverchargeContract, todayStr, completionRate);
  const totalBonusXp = bonusXp + (hasValidReflection ? 15 : 0) + contractEval.xpBonus;
  const totalBonusCoins = bonusCoins + (hasValidReflection ? 5 : 0) + contractEval.refundedCoins;

  // Daily Reward
  const isAlreadyClaimedToday = stats.lastDailyRewardClaimedDate === todayStr;
  const currentStreakDay = ((stats.streakDays - (isAlreadyClaimedToday ? 1 : 0)) % 7) + 1;

  // ── HANDLERS ───────────────────────────────────────────────
  const handleConsolidate = () => {
    if (dayConsolidated) return;

    const playerStore = usePlayerStore.getState();
    const isRestDay = Boolean(stats.restDays?.[todayStr]);

    if (contractEval.hasActiveContract) {
      playerStore.setStats((prev) => ({
        ...prev,
        activeOverchargeContract: prev.activeOverchargeContract
          ? { ...prev.activeOverchargeContract, settled: true }
          : null,
      }));
    }

    if (isRestDay) {
      // Día de descanso planificado: sin penalización ni daño de HP
      soundFX.playHeal();
    } else if (completionRate >= 80) {
      // Disciplina destacada (>=80% completado): Regeneración Celular (+40 HP)
      playerStore.heal(40);
      soundFX.playHeal();
    } else {
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
    }

    soundFX.playLevelUp();
    triggerShockwave({ color: 'cyan', intensity: 'epic' });

    if (reflectionText.trim() && onAddJournalEntry) {
      onAddJournalEntry(`🌙 Cierre de Jornada (${archetype.name}): ${reflectionText.trim()}`);
    }

    onConfirmFinishDay(totalBonusXp, totalBonusCoins, customBedtime);
    setDayConsolidated(true);

    // Auto advance to reward step (calibrado a 450ms)
    setTimeout(() => setStep('reward'), 450);
  };

  const handleClaimReward = (reward: typeof DAILY_REWARDS[number]) => {
    if (rewardClaimed || isAlreadyClaimedToday) return;
    soundFX.playLevelUp();
    triggerShockwave({ color: 'gold', intensity: 'epic' });
    onClaimDailyReward(reward.day, reward.xp, reward.coins, reward.bonusItem);
    setRewardClaimed(true);
    setTimeout(() => setStep('seal'), 400);
  };

  const handleSkipReward = () => setStep('seal');

  const handleSeal = () => {
    setSealed(true);
    soundFX.playPneumaticSeal();
    setTimeout(() => {
      onClose();
    }, 550);
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl flex flex-col bg-[#030712]/95 border border-cyan-500/35 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(0,240,255,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] text-white overflow-hidden max-h-[92dvh] backdrop-blur-2xl text-left">

        {/* Micrograno táctil Moxen Vidrio */}
        <span className="vi-grano opacity-5" aria-hidden="true" />

        {/* Filamento especular superior */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

        {/* Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* ── HEADER: Progress Steps ────────────────────────── */}
        <div className="shrink-0 px-4 sm:px-6 pt-5 pb-3.5 border-b border-white/10 bg-[#040814]/90 relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-anton uppercase tracking-widest text-cyan-300">
              Ritual Nocturno · {formattedFullDate}
            </span>
            <div className={`px-2.5 py-1 rounded-xl border text-sm font-anton font-black ${gradeBadgeColor}`}>
              {grade}
            </div>
          </div>

          {/* Step Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {stepConfig.map((s, i) => {
              const isActive = s.id === step;
              const isDone = i < currentStepIdx;
              return (
                <React.Fragment key={s.id}>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all duration-300 text-[11px] font-anton uppercase tracking-wider ${
                    isDone
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                      : isActive
                      ? 'bg-cyan-950/60 border-cyan-400/70 text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                      : 'bg-white/[0.03] border-white/10 text-slate-400'
                  }`}>
                    {isDone ? <Icon name="check" className="w-3 h-3 text-emerald-400" /> : <Icon name={s.icon} className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < stepConfig.length - 1 && (
                    <Icon name="chevronRight" className={`w-3 h-3 shrink-0 ${isDone ? 'text-emerald-500' : 'text-slate-600'}`} />
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
                    <Icon name="star" className="w-4 h-4 text-amber-400" /> {gradeTitle}
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
                    <p className="text-xs italic text-slate-300 leading-relaxed font-sans">
                      "{getKaiPhrase(
                        completionRate >= 80 ? 'NIGHTLY_CLOSE_SUCCESS' : 'NIGHTLY_CLOSE_HARD',
                        stats.kaiVoiceTone || 'coach'
                      )}"
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Cumplimiento', value: `${completionRate}%`, sub: `${completedToday.length}/${totalTasks}`, icon: 'checkCircle2', color: 'text-cyan-400' },
                    { label: 'Total XP', value: `+${xpEarnedToday + totalBonusXp}`, sub: `+${totalBonusXp} Bonus`, icon: 'zap', color: 'text-amber-400' },
                    { label: 'Monedas', value: `+${coinsEarnedToday + totalBonusCoins}`, sub: `+${totalBonusCoins} Bonus`, icon: 'coins', color: 'text-yellow-400' },
                    { label: 'Foco', value: `${todayFocusMinutes}m`, sub: 'Modo Foco', icon: 'clock', color: 'text-indigo-400' },
                  ].map(({ label, value, sub, icon, color }) => (
                    <div key={label} className="bg-[#000a14]/70 border border-cyan-900/40 rounded-xl p-3 text-center">
                      <div className={`flex items-center justify-center gap-1 ${color} text-[11px] font-bold mb-1`}>
                        <Icon name={icon} className="w-3.5 h-3.5" /> {label}
                      </div>
                      <div className="text-base font-black text-white">{value}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{sub}</div>
                    </div>
                  ))}
                </div>

                {/* Rest Day / Recovery Mode Toggle */}
                <div className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                  Boolean(stats.restDays?.[todayStr])
                    ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                    : 'bg-[#000a14]/90 border-cyan-500/30'
                }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg shrink-0">{Boolean(stats.restDays?.[todayStr]) ? '🌿' : '🛡️'}</span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block truncate">
                        {Boolean(stats.restDays?.[todayStr]) ? 'Día de Descanso (Activo)' : 'Modo Descanso'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block truncate">
                        {Boolean(stats.restDays?.[todayStr]) ? 'Protegido: sin pérdida de Energía Vital hoy.' : 'Activa para descanso deliberado.'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => usePlayerStore.getState().toggleRestDay(todayStr)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold font-mono transition-all cursor-pointer shrink-0 ${
                      Boolean(stats.restDays?.[todayStr])
                        ? 'bg-emerald-400 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                        : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800 hover:border-cyan-500'
                    }`}
                  >
                    {Boolean(stats.restDays?.[todayStr]) ? 'Activo ✓' : 'Activar'}
                  </button>
                </div>

                {/* Cellular Regeneration Badge if Grade A or S+ and not in Rest Day */}
                {completionRate >= 80 && !stats.restDays?.[todayStr] && (
                  <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-2.5 text-center flex items-center justify-center gap-2 text-emerald-300 text-xs font-mono font-bold shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                    <Icon name="heart" className="w-4 h-4" />
                    <span className="truncate">¡Gran Disciplina! (+40 HP)</span>
                  </div>
                )}

                {/* Bedtime Override */}
                <div className="bg-[#000a14]/90 border border-cyan-500/30 rounded-2xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-cyan-200">
                    <Icon name="moon" className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-xs">Hora de dormir:</span>
                  </div>
                  <input
                    type="time"
                    value={customBedtime}
                    onChange={e => setCustomBedtime(e.target.value)}
                    className="bg-black/50 border border-cyan-800 rounded-xl px-3 py-1.5 text-white font-mono text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all cursor-pointer"
                  />
                </div>

                {/* Overcharge Contract Settlement Banner */}
                {contractEval.hasActiveContract && (
                  <div className={`rounded-xl p-2.5 text-center border text-xs font-mono font-bold ${
                    contractEval.succeeded
                      ? 'bg-amber-950/50 border-amber-400/70 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                      : 'bg-rose-950/50 border-rose-500/60 text-rose-300'
                  }`}>
                    {contractEval.succeeded
                      ? '🔥 ¡Protocolo de Rendimiento Superado (≥85%)! +250 XP y +100🪙 liberadas'
                      : `⚠️ Protocolo de Rendimiento (${completionRate}% / 85%): Eficiencia insuficiente. Fondos de garantía (${contractEval.burnedCoins}🪙) no liberados.`}
                  </div>
                )}

                {/* Journal (KAI Tactical Debriefing Prompt) */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Icon name="bookOpen" className="w-3.5 h-3.5 text-indigo-400" /> KAI // Debriefing de Estabilidad Operativa
                    </label>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border transition-all ${
                      hasValidReflection
                        ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                        : 'bg-cyan-950/50 border-cyan-800/60 text-cyan-300/80'
                    }`}>
                      {hasValidReflection ? '✨ ¡Registro Válido! (+15 XP / +5🪙)' : 'Registra un reporte (+15 XP / +5🪙)'}
                    </span>
                  </div>
                  <textarea
                    value={reflectionText}
                    onChange={e => setReflectionText(e.target.value)}
                    placeholder="KAI // Identifica la operación ejecutada hoy que consolidó mayor estabilidad mental y dominio de foco (mín. 15 caracteres):"
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
                    <Icon name="flame" className="w-3.5 h-3.5 text-orange-400" /> Racha: {stats.streakDays} días
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
                            <Icon name="check" className="w-2 h-2 text-white" />
                          </div>
                        )}
                        {isLocked && <Icon name="lock" className="absolute top-1 right-1 w-2.5 h-2.5 text-slate-500" />}
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
                      <Icon name="check" className="w-4 h-4" /> Ya reclamaste tu recompensa de hoy
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
                    Ciclo Operativo Consolidado
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="text-sm text-slate-400 leading-relaxed max-w-sm"
                  >
                    Tu rendimiento ha sido asegurado en el núcleo de datos. Descansa y regenera tu energía.<br />
                    <span className="text-cyan-400 font-bold">Mañana inicia tu siguiente ciclo operativo.</span>
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
                    <Icon name="zap" className="w-3 h-3 inline mr-1" />+{xpEarnedToday + totalBonusXp} XP Total
                  </span>
                  <span className="bg-yellow-950/60 border border-yellow-500/30 rounded-full px-3 py-1 text-xs font-bold text-yellow-300">
                    <Icon name="coins" className="w-3 h-3 inline mr-1" />+{coinsEarnedToday + totalBonusCoins} Monedas
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
                    <Icon name="check" className="w-5 h-5" /> Cerrando...
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
                <><Icon name="check" className="w-5 h-5 animate-bounce" /> ¡Ciclo Consolidado! → Cargando recompensa...</>
              ) : (
                <><Icon name="sparkles" className="w-4 h-4" /> Consolidar Ciclo (+{totalBonusXp} XP / +{totalBonusCoins} Monedas)</>
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
                  ? <><Icon name="arrowRight" className="w-4 h-4" /> Continuar</>
                  : rewardClaimed
                  ? <><Icon name="check" className="w-4 h-4" /> ¡Reclamado! Continuando...</>
                  : <><Icon name="gift" className="w-4 h-4" /> ¡Reclamar Recompensa del Día {currentStreakDay}!</>
                }
              </button>
            </div>
          )}

          {step === 'seal' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  void generateAndShareLegacyCard({
                    stats,
                    archetypeName: archetype.name,
                    completionRate,
                    xpEarnedToday: xpEarnedToday + totalBonusXp,
                    grade,
                  });
                }}
                className="py-3 px-4 rounded-2xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-500/40 transition-all cursor-pointer active:scale-[0.98]"
              >
                <Icon name="sparkles" className="w-4 h-4 text-cyan-400" /> Compartir Legado Táctico
              </button>
              <button
                onClick={handleSeal}
                disabled={sealed}
                className="flex-1 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white shadow-[0_0_25px_rgba(99,102,241,0.4)] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Icon name="moon" className="w-4 h-4" /> Consolidar Ciclo y Entrar en Reposo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
