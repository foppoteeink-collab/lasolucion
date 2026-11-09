import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
import { useNarrativeCopy } from '../hooks/useNarrativeCopy';

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
  const [reflectionText, setReflectionText] = useState('');
  const [isConsolidating, setIsConsolidating] = useState(false);
  const copy = useNarrativeCopy();

  const now = new Date();
  const currentLocalTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const [customBedtime, setCustomBedtime] = useState(currentLocalTime);

  // Reset state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setReflectionText('');
      setIsConsolidating(false);
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

  // ── STATS & COMPUTED VALUES ────────────────────────────────
  const todayStr = getTodayDateString();
  const formattedFullDate = formatDateFullSpanish(todayStr);
  const archetype = getArchetypeByName(stats.characterClass);
  const evolution = getCompanionEvolution(archetype, stats.level, stats.streakDays);

  const completedToday = allTasks.filter(t => t.completed);
  const totalTasks = allTasks.length;
  const completionRate = totalTasks > 0
    ? Math.round((completedToday.length / totalTasks) * 100)
    : (completedToday.length > 0 ? 100 : 0);

  const xpEarnedToday = completedToday.reduce((a, t) => a + (t.xpReward || 0), 0);
  const coinsEarnedToday = completedToday.reduce((a, t) => a + (t.coinReward || 0), 0);

  const todayFocusMinutes = pomodoroSessions
    .filter(s => s.date === todayStr)
    .reduce((a, s) => a + s.durationMinutes, 0);

  // Grade classification
  let grade = 'C';
  let gradeBadgeColor = 'bg-slate-700/50 text-slate-300 border-slate-600';
  let gradeTitle = '¡Cada paso cuenta!';
  let bonusXp = 5;
  let bonusCoins = 2;

  if (completionRate >= 95) {
    grade = 'S+';
    bonusXp = 30;
    bonusCoins = 15;
    gradeBadgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.4)]';
    gradeTitle = '¡Perfección Absoluta!';
  } else if (completionRate >= 80) {
    grade = 'A';
    bonusXp = 20;
    bonusCoins = 10;
    gradeBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-400';
    gradeTitle = '¡Gran Disciplina y Rendimiento!';
  } else if (completionRate >= 50) {
    grade = 'B';
    bonusXp = 12;
    bonusCoins = 6;
    gradeBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-400';
    gradeTitle = '¡Buen Avance Diario!';
  }

  const hasValidReflection = reflectionText.trim().length >= 15;
  const contractEval = evaluateOverchargeContract(stats.activeOverchargeContract, todayStr, completionRate, totalTasks);
  const totalBonusXp = bonusXp + (hasValidReflection ? 15 : 0) + contractEval.xpBonus;
  const totalBonusCoins = bonusCoins + (hasValidReflection ? 5 : 0) + contractEval.refundedCoins;

  // Daily Streak & Rewards
  const isAlreadyClaimedToday = stats.lastDailyRewardClaimedDate === todayStr;
  const currentStreakDay = ((stats.streakDays - (isAlreadyClaimedToday ? 1 : 0)) % 7) + 1;
  const todayReward = DAILY_REWARDS.find(r => r.day === currentStreakDay);

  // ── 1-TAP UNIFIED CONSOLIDATION ────────────────────────────
  const handleConsolidateAndSealAll = () => {
    if (isConsolidating) return;
    setIsConsolidating(true);

    const playerStore = usePlayerStore.getState();
    const isRestDay = Boolean(stats.restDays?.[todayStr]);

    // Contract settlement
    if (contractEval.hasActiveContract) {
      playerStore.setStats((prev) => ({
        ...prev,
        activeOverchargeContract: prev.activeOverchargeContract
          ? { ...prev.activeOverchargeContract, settled: true }
          : null,
      }));
    }

    // Health mechanics
    if (isRestDay) {
      soundFX.playHeal();
    } else if (completionRate >= 80) {
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

    // Journal Entry
    if (reflectionText.trim() && onAddJournalEntry) {
      onAddJournalEntry(`🌙 Cierre de Jornada (${archetype.name}): ${reflectionText.trim()}`);
    }

    // Auto-claim daily reward if not already claimed today
    if (!isAlreadyClaimedToday && todayReward) {
      onClaimDailyReward(todayReward.day, todayReward.xp, todayReward.coins, todayReward.bonusItem);
    }

    // Finish Day Confirmation
    onConfirmFinishDay(totalBonusXp, totalBonusCoins, customBedtime);

    // Audio & Haptics
    soundFX.playLevelUp();
    soundFX.playPneumaticSeal();
    triggerShockwave({ color: 'cyan', intensity: 'epic' });

    // Smooth modal dismissal (500ms)
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="nightly-tunnel-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
    >
      <div className="relative w-full max-w-xl flex flex-col bg-[#030712]/95 border border-cyan-500/35 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(0,240,255,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] text-white overflow-hidden max-h-[92dvh] backdrop-blur-2xl text-left">

        {/* Micrograno táctil */}
        <span className="vi-grano opacity-5" aria-hidden="true" />

        {/* Filamento especular superior */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

        {/* Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* ── HEADER ────────────────────────────────────────── */}
        <div className="shrink-0 px-4 sm:px-6 pt-4 pb-3.5 border-b border-white/10 bg-[#040814]/90 relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.8)] animate-pulse" />
            <span id="nightly-tunnel-title" className="text-[11px] font-anton uppercase tracking-widest text-cyan-300">
              {copy.nightlyHeaderBadge} · {formattedFullDate}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className={`px-2.5 py-0.5 rounded-lg border text-xs font-anton font-black ${gradeBadgeColor}`}>
              {copy.nightlyRankLabel} {grade}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isConsolidating}
              aria-label="Cerrar túnel nocturno"
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Cerrar modal"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── BODY (Single-View Scrollable Dashboard) ──────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-cyan-600 p-4 sm:p-5 space-y-3.5">
          {/* Grade Title Banner */}
          <div className="text-center bg-cyan-950/40 border border-cyan-800/40 py-2 px-3 rounded-xl flex items-center justify-center gap-2">
            <Icon name="star" className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">{gradeTitle}</span>
          </div>

          {/* KAI Companion Transmission Card */}
          <div className="bg-[#000a14]/90 border border-cyan-500/30 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3">
            <div className="shrink-0">
              <HoloCompanion archetype={stats.characterClass} size="sm" showHUD={false} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-white truncate">{evolution.title}</span>
                <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full font-bold">
                  {evolution.stageLabel}
                </span>
              </div>
              <p className="text-xs italic text-slate-300 leading-snug font-sans">
                "{getKaiPhrase(
                  completionRate >= 80 ? 'NIGHTLY_CLOSE_SUCCESS' : 'NIGHTLY_CLOSE_HARD',
                  stats.kaiVoiceTone || 'coach'
                )}"
              </p>
            </div>
          </div>

          {/* 4-KPI Tactical Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Cumplimiento', value: `${completionRate}%`, sub: `${completedToday.length}/${totalTasks} tareas`, icon: 'checkCircle2', color: 'text-cyan-400' },
              { label: 'Total XP', value: `+${xpEarnedToday + totalBonusXp}`, sub: `+${totalBonusXp} Bonus`, icon: 'zap', color: 'text-amber-400' },
              { label: 'Monedas', value: `+${coinsEarnedToday + totalBonusCoins}`, sub: `+${totalBonusCoins} Bonus`, icon: 'coins', color: 'text-yellow-400' },
              { label: 'Foco Total', value: `${todayFocusMinutes}m`, sub: 'Concentración', icon: 'clock', color: 'text-indigo-400' },
            ].map(({ label, value, sub, icon, color }) => (
              <div key={label} className="bg-[#000a14]/70 border border-cyan-900/40 rounded-xl p-2.5 text-center">
                <div className={`flex items-center justify-center gap-1 ${color} text-[10.5px] font-bold mb-0.5`}>
                  <Icon name={icon} className="w-3.5 h-3.5" /> {label}
                </div>
                <div className="text-base font-black text-white">{value}</div>
                <div className="text-[9.5px] text-slate-400 font-mono">{sub}</div>
              </div>
            ))}
          </div>

          {/* Daily Streak & Reward Strip */}
          <div className="bg-[#000a14]/90 border border-amber-500/30 rounded-2xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Icon name="gift" className="w-4 h-4 text-amber-400" />
                Racha: {stats.streakDays} días
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {isAlreadyClaimedToday ? '✓ Recompensa de hoy reclamada' : '🎁 Auto-recompensa al consolidar'}
              </span>
            </div>

            {/* 7-Day Mini Dots Strip */}
            <div className="grid grid-cols-7 gap-1.5 pt-1">
              {DAILY_REWARDS.map(reward => {
                const isClaimed = reward.day < currentStreakDay || (reward.day === currentStreakDay && isAlreadyClaimedToday);
                const isToday = reward.day === currentStreakDay && !isAlreadyClaimedToday;
                return (
                  <div
                    key={reward.day}
                    className={`py-1.5 px-1 rounded-lg border text-center transition-all ${
                      isToday
                        ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.3)] ring-1 ring-amber-400'
                        : isClaimed
                        ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300'
                        : 'bg-white/[0.02] border-white/10 text-slate-500'
                    }`}
                  >
                    <div className="text-[8.5px] font-mono font-bold uppercase">D{reward.day}</div>
                    <div className="text-xs my-0.5">{reward.day === 7 ? '👑' : isClaimed ? '✓' : '🪙'}</div>
                    <div className="text-[8px] font-mono font-bold text-amber-300">+{reward.coins}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rest Day / Recovery Mode Toggle & Bedtime Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Rest Day Toggle */}
            <div className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
              Boolean(stats.restDays?.[todayStr])
                ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'bg-[#000a14]/90 border-cyan-500/30'
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0">{Boolean(stats.restDays?.[todayStr]) ? '🌿' : '🛡️'}</span>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">
                    {Boolean(stats.restDays?.[todayStr]) ? 'Día de Descanso' : 'Modo Descanso'}
                  </span>
                  <span className="text-[9.5px] text-slate-400 font-mono block truncate">
                    {Boolean(stats.restDays?.[todayStr]) ? 'Sin pérdida de HP' : 'Descanso deliberado'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => usePlayerStore.getState().toggleRestDay(todayStr)}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold font-mono transition-all cursor-pointer shrink-0 ${
                  Boolean(stats.restDays?.[todayStr])
                    ? 'bg-emerald-400 text-black shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                    : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800 hover:border-cyan-500'
                }`}
              >
                {Boolean(stats.restDays?.[todayStr]) ? 'Activo ✓' : 'Activar'}
              </button>
            </div>

            {/* Bedtime Override */}
            <div className="bg-[#000a14]/90 border border-cyan-500/30 rounded-xl p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-cyan-200">
                <Icon name="moon" className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold">Hora de dormir:</span>
              </div>
              <input
                type="time"
                value={customBedtime}
                aria-label="Hora de dormir"
                onChange={e => setCustomBedtime(e.target.value)}
                className="bg-black/50 border border-cyan-800 rounded-lg px-2.5 py-1 text-white font-mono text-xs outline-none focus:border-cyan-400 transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* Overcharge Contract Banner (if active) */}
          {contractEval.hasActiveContract && (
            <div className={`rounded-xl p-2.5 text-center border text-xs font-mono font-bold ${
              contractEval.succeeded
                ? 'bg-amber-950/50 border-amber-400/70 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                : contractEval.contractCancelledReason === 'INSUFFICIENT_TASKS'
                  ? 'bg-cyan-950/60 border-cyan-400/70 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'bg-rose-950/50 border-rose-500/60 text-rose-300'
            }`}>
              {contractEval.succeeded
                ? '🔥 ¡Protocolo Superado (≥85%)! +250 XP y +100🪙 liberadas'
                : contractEval.contractCancelledReason === 'INSUFFICIENT_TASKS'
                  ? `🛡️ Protocolo Anulado: Menos de 3 tareas registradas (${totalTasks}/3). Tus ${contractEval.refundedCoins}🪙 han sido reembolsadas sin penalización.`
                  : `⚠️ Protocolo (${completionRate}% / 85%): Eficiencia insuficiente. Fondos (${contractEval.burnedCoins}🪙) no liberados.`}
            </div>
          )}

          {/* Journal / Reflection Note */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <label className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="bookOpen" className="w-3 h-3 text-indigo-400" /> Nota de Bitácora Nocturna (Opcional)
              </label>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-mono ${
                  hasValidReflection ? 'text-emerald-400 font-bold' : 'text-slate-400'
                }`}>
                  {reflectionText.trim().length} / 15
                </span>
                <span className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full border transition-all ${
                  hasValidReflection
                    ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                    : 'bg-cyan-950/50 border-cyan-800/60 text-cyan-300/80'
                }`}>
                  {hasValidReflection ? '✨ +15 XP / +5🪙' : '+15 XP / +5🪙'}
                </span>
              </div>
            </div>
            <textarea
              value={reflectionText}
              onChange={e => setReflectionText(e.target.value)}
              aria-label="Reflexión de la jornada diaria"
              placeholder="¿Qué victoria o aprendizaje consolidó tu foco hoy?..."
              className="w-full bg-[#000a14] border border-cyan-900/70 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none h-14"
            />
          </div>
        </div>

        {/* ── FOOTER: 1-Tap Consolidated Action Bar ─────────── */}
        <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-3.5 border-t border-cyan-900/50 bg-[#000e1c] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Share Card Button */}
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
            className="py-2.5 px-3.5 rounded-xl font-bold uppercase tracking-wider text-[11px] flex items-center justify-center gap-1.5 bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-500/40 transition-all cursor-pointer active:scale-[0.98]"
          >
            <Icon name="sparkles" className="w-3.5 h-3.5 text-cyan-400" />
            <span>Compartir</span>
          </button>

          {/* Unified 1-Tap Consolidation Button */}
          <button
            type="button"
            onClick={handleConsolidateAndSealAll}
            disabled={isConsolidating}
            className={`flex-1 py-3 px-4 rounded-xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isConsolidating
                ? 'bg-emerald-600 text-white shadow-[0_0_25px_rgba(16,185,129,0.6)]'
                : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-[0_0_25px_rgba(0,240,255,0.35)] active:scale-[0.98]'
            }`}
          >
            {isConsolidating ? (
              <>
                <Icon name="check" className="w-4 h-4 animate-bounce" />
                <span>¡Jornada Consolidada y Sellada!</span>
              </>
            ) : (
              <>
                <Icon name="moon" className="w-4 h-4 text-cyan-200" />
                <span>{copy.nightlyConsolidatePrefix} (+{totalBonusXp} XP / +{totalBonusCoins}🪙)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
