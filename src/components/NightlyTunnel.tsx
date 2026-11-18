import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Mic, MicOff, Volume2, Sparkles, Plus, Check } from 'lucide-react';
import { Icon } from './common/Icon';
import { ChicleToggle } from './ChicleToggle';
import { triggerShockwave } from '../utils/celebration';
import { soundFX } from '../utils/audio';
import { getTodayDateString, formatDateFullSpanish, addDaysToDateString } from '../utils/date';
import { DAILY_REWARDS } from '../data/defaults';
import { PlayerStats, TaskItem, PomodoroSession } from '../types';
import { getArchetypeByName, getCompanionEvolution } from '../data/archetypes';
import { HoloCompanion } from './HoloCompanion';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTaskStore } from '../store/useTaskStore';
import { useUIStore } from '../store/useUIStore';
import { evaluateOverchargeContract } from '../utils/level3Systems';
import { generateAndShareLegacyCard } from '../utils/shareCardGenerator';
import { getKaiPhrase } from '../data/kaiVoiceMatrix';
import { useNarrativeCopy } from '../hooks/useNarrativeCopy';
import {
  createVoiceRecognizer,
  isSpeechRecognitionSupported,
  NightlyReflectionAnalysis,
  ParsedVoiceItem,
  VoiceRecognizerController,
} from '../utils/speechRecognition';
import { analyzeNightlyReflectionWithAI } from '../services/aiService';
import { speakKaiDialogue, stopKaiDialogue } from '../utils/voice';

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
  const [isDictating, setIsDictating] = useState(false);
  const [isAnalyzingReflection, setIsAnalyzingReflection] = useState(false);
  const [nightlyAnalysis, setNightlyAnalysis] = useState<NightlyReflectionAnalysis | null>(null);
  const [scheduledTomorrowIds, setScheduledTomorrowIds] = useState<Record<string, boolean>>({});
  const [dictationError, setDictationError] = useState<string | null>(null);
  const [isSpeakingFeedback, setIsSpeakingFeedback] = useState(false);

  const recognizerRef = useRef<VoiceRecognizerController | null>(null);
  const reflectionRef = useRef('');
  const soundEnabled = useUIStore((s) => s.soundEnabled);
  const copy = useNarrativeCopy();

  const now = new Date();
  const currentLocalTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const [customBedtime, setCustomBedtime] = useState(currentLocalTime);

  useEffect(() => {
    reflectionRef.current = reflectionText;
  }, [reflectionText]);

  // Reset state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setReflectionText('');
      reflectionRef.current = '';
      setIsConsolidating(false);
      setIsDictating(false);
      setIsAnalyzingReflection(false);
      setNightlyAnalysis(null);
      setScheduledTomorrowIds({});
      setDictationError(null);
      setCustomBedtime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    } else {
      if (recognizerRef.current) {
        recognizerRef.current.abort();
        recognizerRef.current = null;
      }
      stopKaiDialogue();
    }
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.abort();
        recognizerRef.current = null;
      }
      stopKaiDialogue();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('modal-open-hide-floating');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('modal-open-hide-floating');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

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

    // Health & Rest
    if (isRestDay || completionRate >= 80) {
      playerStore.heal(40);
      soundFX.playHeal();
    } else {
      playerStore.heal(20);
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

  return createPortal(
    <div 
      className="fixed inset-0 z-[170] portal-modal-root bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onClick={() => { if (!isConsolidating) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nightly-tunnel-title"
        className="relative isolate w-full max-w-xl flex flex-col bg-[#030712]/[0.98] border border-white/10 rounded-2xl sm:rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.75)] text-white overflow-hidden max-h-[92dvh] text-left"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Micrograno táctil */}
        <span className="vi-grano opacity-5" aria-hidden="true" />

        {/* Filamento especular superior */}
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

        {/* ── HEADER ────────────────────────────────────────── */}
        <div className="shrink-0 px-4 sm:px-6 pt-4 pb-3.5 border-b border-white/10 bg-[#040814]/[0.96] relative z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full aura-bg-primary aura-glow-subtle animate-pulse shrink-0" />
            <span id="nightly-tunnel-title" className="text-[11px] font-anton uppercase tracking-widest aura-text-soft truncate">
              {copy.nightlyHeaderBadge} · {formattedFullDate}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className={`px-2.5 py-0.5 rounded-lg border text-xs font-anton font-black ${gradeBadgeColor}`}>
              {copy.nightlyRankLabel} {grade}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isConsolidating}
              aria-label="Cerrar túnel nocturno"
              className="chicle-btn w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              title="Cerrar modal (Esc)"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── BODY (Single-View Scrollable Dashboard) ──────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar p-4 sm:p-5 space-y-3.5 relative z-10">
          {/* Grade Title Banner */}
          <div className="text-center aura-bg-soft border aura-border-subtle py-2 px-3 rounded-xl flex items-center justify-center gap-2">
            <Icon name="star" className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-anton uppercase tracking-wider aura-text-soft">{gradeTitle}</span>
          </div>

          {/* KAI Companion Transmission Card */}
          <div className="bg-[#040814]/80 border border-white/10 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3">
            <div className="shrink-0" data-preserve-optic="true">
              <HoloCompanion archetype={stats.characterClass} size="sm" showHUD={false} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-white truncate">{evolution.title}</span>
                <span className="text-[9px] aura-bg-soft aura-text-soft border aura-border-subtle px-2 py-0.5 rounded-full font-bold shrink-0">
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
              { label: 'Cumplimiento', value: `${completionRate}%`, sub: `${completedToday.length}/${totalTasks} tareas`, icon: 'checkCircle', color: 'aura-text-primary' },
              { label: 'Total XP', value: `+${xpEarnedToday + totalBonusXp}`, sub: `+${totalBonusXp} Bonus`, icon: 'zap', color: 'text-amber-400' },
              { label: 'Monedas', value: `+${coinsEarnedToday + totalBonusCoins}`, sub: `+${totalBonusCoins} Bonus`, icon: 'coins', color: 'text-amber-300' },
              { label: 'Foco Total', value: `${todayFocusMinutes}m`, sub: 'Concentración', icon: 'clock', color: 'text-indigo-400' },
            ].map(({ label, value, sub, icon, color }) => (
              <div key={label} className="bg-[#040814]/80 border border-white/10 rounded-xl p-2.5 text-center">
                <div className={`flex items-center justify-center gap-1 ${color} text-[10.5px] font-bold mb-0.5`}>
                  <Icon name={icon} className="w-3.5 h-3.5" /> {label}
                </div>
                <div className="text-base font-mono tabular-nums font-black text-white">{value}</div>
                <div className="text-[9.5px] text-slate-400 font-mono tabular-nums">{sub}</div>
              </div>
            ))}
          </div>

          {/* Daily Streak & Reward Strip */}
          <div className="bg-[#040814]/80 border border-amber-500/30 rounded-2xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 font-mono tabular-nums">
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
                        ? 'bg-amber-500/25 border-amber-400 text-amber-200 ring-1 ring-amber-400 optic-active-card'
                        : isClaimed
                        ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300'
                        : 'bg-white/[0.02] border-white/10 text-slate-500'
                    }`}
                  >
                    <div className="text-[8.5px] font-mono tabular-nums font-bold uppercase">D{reward.day}</div>
                    <div className="text-xs my-0.5">{reward.day === 7 ? '👑' : isClaimed ? '✓' : '🪙'}</div>
                    <div className="text-[8px] font-mono tabular-nums font-bold text-amber-300">+{reward.coins}</div>
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
                ? 'bg-emerald-950/40 border-emerald-500/60'
                : 'bg-[#040814]/80 border-white/10'
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
              <ChicleToggle
                checked={Boolean(stats.restDays?.[todayStr])}
                onChange={() => {
                  soundFX.playClick();
                  usePlayerStore.getState().toggleRestDay(todayStr);
                }}
                color="emerald"
                size="sm"
                ariaLabel="Activar o desactivar Modo Descanso para hoy"
                title="Proteger HP en día de descanso"
              />
            </div>

            {/* Bedtime Override */}
            <div className="bg-[#040814]/80 border border-white/10 rounded-xl p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs aura-text-soft">
                <Icon name="moon" className="w-3.5 h-3.5 aura-text-primary" />
                <span className="font-bold">Hora de dormir:</span>
              </div>
              <input
                type="time"
                value={customBedtime}
                aria-label="Hora de dormir"
                onChange={e => setCustomBedtime(e.target.value)}
                className="bg-black/50 border border-white/15 rounded-lg px-2.5 py-1 text-white font-mono tabular-nums text-xs outline-none focus:aura-border-primary transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* Overcharge Contract Banner (if active) */}
          {contractEval.hasActiveContract && (
            <div className={`rounded-xl p-2.5 text-center border text-xs font-mono font-bold ${
              contractEval.succeeded
                ? 'bg-amber-950/50 border-amber-400/70 text-amber-300'
                : contractEval.contractCancelledReason === 'INSUFFICIENT_TASKS'
                  ? 'aura-bg-soft border aura-border-subtle aura-text-soft'
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
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-[11px] font-anton uppercase tracking-wider aura-text-primary flex items-center gap-1.5">
                <Icon name="bookOpen" className="w-3 h-3 text-indigo-400" /> Mi Bitácora del Día (Reflexión)
              </label>
              <div className="flex items-center gap-1.5">
                {isSpeechRecognitionSupported() && (
                  <button
                    type="button"
                    onClick={() => {
                      setDictationError(null);
                      if (isDictating) {
                        soundFX.playClick();
                        recognizerRef.current?.stop();
                        recognizerRef.current = null;
                        setIsDictating(false);
                        setTimeout(async () => {
                          const txt = reflectionRef.current.trim();
                          if (txt.length >= 10) {
                            setIsAnalyzingReflection(true);
                            try {
                              const res = await analyzeNightlyReflectionWithAI({
                                reflection: txt,
                                completionRate,
                                completedCount: completedToday.length,
                                totalCount: totalTasks,
                                kaiName: stats.kaiCustomForm?.name || 'KAI',
                              });
                              setNightlyAnalysis(res);
                              if (soundEnabled && res.kaiFeedback) {
                                setIsSpeakingFeedback(true);
                                speakKaiDialogue(res.kaiFeedback, stats.kaiCustomForm?.mood || 'zen', () => setIsSpeakingFeedback(false));
                              }
                            } finally {
                              setIsAnalyzingReflection(false);
                            }
                          }
                        }, 300);
                        return;
                      }
                      soundFX.playClick();
                      stopKaiDialogue();
                      const basePrefix = reflectionRef.current.trim();
                      const rec = createVoiceRecognizer({
                        onInterim: (live) => {
                          const next = basePrefix ? `${basePrefix} ${live}` : live;
                          setReflectionText(next);
                          reflectionRef.current = next;
                        },
                        onFinal: (fin) => {
                          const next = basePrefix ? `${basePrefix} ${fin}` : fin;
                          setReflectionText(next);
                          reflectionRef.current = next;
                        },
                        onError: (msg) => {
                          setDictationError(msg);
                          setIsDictating(false);
                          recognizerRef.current = null;
                        },
                        onEnd: () => {
                          setIsDictating(false);
                          recognizerRef.current = null;
                        },
                      });
                      if (rec) {
                        recognizerRef.current = rec;
                        setIsDictating(true);
                        rec.start();
                      }
                    }}
                    className={`chicle-btn px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                      isDictating
                        ? 'bg-rose-500/25 border-rose-400 text-rose-200 animate-pulse optic-active-card'
                        : 'bg-white/[0.04] hover:bg-white/[0.1] border-white/15 text-slate-200'
                    }`}
                    title={isDictating ? 'Detener dictado y analizar con KAI' : 'Dictar tu reflexión nocturna por voz'}
                  >
                    {isDictating ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                    <span>{isDictating ? 'Detener' : 'Dictar'}</span>
                  </button>
                )}

                {!isDictating && reflectionText.trim().length >= 12 && (
                  <button
                    type="button"
                    disabled={isAnalyzingReflection}
                    onClick={async () => {
                      soundFX.playClick();
                      setIsAnalyzingReflection(true);
                      try {
                        const res = await analyzeNightlyReflectionWithAI({
                          reflection: reflectionText.trim(),
                          completionRate,
                          completedCount: completedToday.length,
                          totalCount: totalTasks,
                          kaiName: stats.kaiCustomForm?.name || 'KAI',
                        });
                        setNightlyAnalysis(res);
                        if (soundEnabled && res.kaiFeedback) {
                          setIsSpeakingFeedback(true);
                          speakKaiDialogue(res.kaiFeedback, stats.kaiCustomForm?.mood || 'zen', () => setIsSpeakingFeedback(false));
                        }
                      } finally {
                        setIsAnalyzingReflection(false);
                      }
                    }}
                    className="chicle-btn px-2 py-0.5 rounded-full text-[10px] font-mono font-bold aura-bg-soft border aura-border-subtle aura-text-soft flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    title="Pedir a KAI un resumen y extraer pendientes para mañana"
                  >
                    <Sparkles className={`w-3 h-3 ${isAnalyzingReflection ? 'animate-spin' : ''}`} />
                    <span>{isAnalyzingReflection ? 'Analizando...' : 'Analizar'}</span>
                  </button>
                )}

                <span className={`text-[10px] font-mono tabular-nums ${
                  hasValidReflection ? 'text-emerald-400 font-bold' : 'text-slate-400'
                }`}>
                  {reflectionText.trim().length} / 15
                </span>
                <span className={`text-[9.5px] font-mono tabular-nums font-bold px-2 py-0.5 rounded-full border transition-all ${
                  hasValidReflection
                    ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                    : 'bg-white/[0.03] border-white/10 text-slate-300'
                }`}>
                  {hasValidReflection ? '✨ +15 XP / +5🪙' : '+15 XP / +5🪙'}
                </span>
              </div>
            </div>
            <textarea
              value={reflectionText}
              onChange={e => setReflectionText(e.target.value)}
              aria-label="Reflexión de la jornada diaria"
              placeholder='¿Qué lograste hoy o qué quieres dejar listo para mañana? (También puedes pulsar "Dictar")...'
              className="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:aura-border-primary resize-none h-16"
            />
            {dictationError && (
              <p className="text-[11px] text-rose-300 font-mono">{dictationError}</p>
            )}

            {/* Devolución de KAI + Pendientes detectados para mañana */}
            {nightlyAnalysis && (
              <div className="p-2.5 rounded-xl bg-[#040814]/80 border aura-border-subtle space-y-2">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 aura-text-primary shrink-0 mt-0.5" />
                  <p className="text-[11.5px] text-slate-100 flex-1 leading-snug">
                    “{nightlyAnalysis.kaiFeedback}”
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setIsSpeakingFeedback(true);
                      speakKaiDialogue(nightlyAnalysis.kaiFeedback, stats.kaiCustomForm?.mood || 'zen', () => setIsSpeakingFeedback(false));
                    }}
                    className="chicle-btn p-1 rounded-lg aura-bg-soft aura-text-primary cursor-pointer shrink-0"
                    title="Escuchar a KAI"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isSpeakingFeedback ? 'animate-bounce text-white' : ''}`} />
                  </button>
                </div>

                {nightlyAnalysis.tomorrowTasks.length > 0 && (
                  <div className="pt-1.5 border-t border-white/10 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 block">
                      🌅 Pendientes detectados para mañana:
                    </span>
                    <div className="space-y-1">
                      {nightlyAnalysis.tomorrowTasks.map((t: ParsedVoiceItem) => {
                        const isScheduled = Boolean(scheduledTomorrowIds[t.id]);
                        return (
                          <div
                            key={t.id}
                            className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-black/45 border border-white/10"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-xs text-white font-medium truncate block">
                                {t.title}
                              </span>
                              {t.timeBlock && (
                                <span className="text-[10px] font-mono tabular-nums aura-text-soft">{t.timeBlock}</span>
                              )}
                            </div>
                            <button
                              type="button"
                              disabled={isScheduled}
                              onClick={() => {
                                soundFX.playClick();
                                const tomorrowDate = addDaysToDateString(todayStr, 1);
                                const taskStore = useTaskStore.getState();
                                taskStore.ensureTasksForDate(tomorrowDate);
                                taskStore.addTask(tomorrowDate, {
                                  id: `nightly-plan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                                  title: t.title,
                                  category: t.category,
                                  priority: t.priority,
                                  xpReward: t.xpReward,
                                  coinReward: t.coinReward,
                                  completed: false,
                                  timeBlock: t.timeBlock,
                                  reminderTime: t.timeBlock ? t.timeBlock.split('-')[0].trim() : undefined,
                                  isCustom: true,
                                  quickIcon: '🌅',
                                });
                                setScheduledTomorrowIds((prev) => ({ ...prev, [t.id]: true }));
                              }}
                              className={`chicle-btn px-2 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                                isScheduled
                                  ? 'bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 cursor-default'
                                  : 'bg-amber-400/20 hover:bg-amber-400/35 border border-amber-400/50 text-amber-200'
                              }`}
                            >
                              {isScheduled ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                              <span>{isScheduled ? 'Agendada' : 'Agendar mañana'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── FOOTER: 1-Tap Consolidated Action Bar ─────────── */}
        <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-3.5 border-t border-white/10 bg-[#040814]/[0.96] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 relative z-10">
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
            className="chicle-btn py-2.5 px-3.5 rounded-xl font-anton uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 bg-white/[0.05] hover:bg-white/[0.12] text-slate-200 hover:text-white border border-white/15 cursor-pointer"
          >
            <Icon name="sparkles" className="w-3.5 h-3.5 aura-text-primary" />
            <span>Compartir</span>
          </button>

          {/* Unified 1-Tap Consolidation Button */}
          <button
            type="button"
            onClick={handleConsolidateAndSealAll}
            disabled={isConsolidating}
            className={`chicle-btn optic-active-card flex-1 py-3 px-4 rounded-xl font-anton uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer ${
              isConsolidating
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_24px_rgba(16,185,129,0.5)]'
                : 'aura-btn-gradient'
            }`}
          >
            {isConsolidating ? (
              <>
                <Icon name="check" className="w-4 h-4 animate-bounce" />
                <span>¡Jornada Consolidada y Sellada!</span>
              </>
            ) : (
              <>
                <Icon name="moon" className="w-4 h-4" />
                <span>{copy.nightlyConsolidatePrefix} (+{totalBonusXp} XP / +{totalBonusCoins}🪙)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
