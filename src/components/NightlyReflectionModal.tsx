import { usePlayerStore } from '../store/usePlayerStore';
import React, { useState } from 'react';
import { PlayerStats, TaskItem, PomodoroSession } from '../types';
import { getArchetypeByName, getCompanionEvolution } from '../data/archetypes';
import { HoloCompanion } from './HoloCompanion';
import {
  Moon,
  Sparkles,
  Trophy,
  CheckCircle2,
  Coins,
  Zap,
  BookOpen,
  X,
  Award,
  Clock,
  Flame,
  Star,
  Check
} from 'lucide-react';
import { triggerShockwave } from '../utils/celebration';
import { soundFX } from '../utils/audio';
import { getTodayDateString, formatDateFullSpanish } from '../utils/date';

interface NightlyReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  allTasks: TaskItem[];
  pomodoroSessions?: PomodoroSession[];
  onConfirmFinishDay: (bonusXp: number, bonusCoins: number, customBedtime?: string) => void;
  onAddJournalEntry?: (note: string) => void;
}

export const NightlyReflectionModal: React.FC<NightlyReflectionModalProps> = ({
  isOpen,
  onClose,
  stats,
  allTasks,
  pomodoroSessions = [],
  onConfirmFinishDay,
  onAddJournalEntry,
}) => {
  const [reflectionText, setReflectionText] = useState('');
  const [isConsolidated, setIsConsolidated] = useState(false);

  // Live clock preview — allows user to manually override it for testing
  const now = new Date();
  const currentLocalTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const [customBedtime, setCustomBedtime] = useState(currentLocalTime);

  const todayStr = getTodayDateString();
  const existingSleep = stats?.sleepLogs?.[todayStr];
  const previewBedtime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  if (!isOpen) return null;

  const archetype = getArchetypeByName(stats.characterClass);
  const evolution = getCompanionEvolution(archetype, stats.level, stats.streakDays);

  const formattedFullDate = formatDateFullSpanish(todayStr);

  const todayTasks = allTasks;
  const completedToday = allTasks.filter((t) => t.completed);

  const totalTasks = todayTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedToday.length / totalTasks) * 100) : (completedToday.length > 0 ? 100 : 0);

  const xpEarnedToday = completedToday.reduce((acc, t) => acc + (t.xpReward || 0), 0);
  const coinsEarnedToday = completedToday.reduce((acc, t) => acc + (t.coinReward || (t as any).coinsReward || 0), 0);

  // Today's focus minutes
  const todayFocusMinutes = pomodoroSessions
    .filter((s) => s.date === todayStr)
    .reduce((acc, s) => acc + s.durationMinutes, 0);

  // Grade & Bonus calculation
  let grade = 'B';
  let gradeBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/50';
  let gradeTitle = '¡Buen Esfuerzo de Héroe!';
  let bonusXp = 10;
  let bonusCoins = 5;

  if (completionRate >= 95) {
    grade = 'S+';
    gradeBadgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.4)]';
    gradeTitle = '¡PERFECCIÓN ABSOLUTA LEGENDARIA!';
    bonusXp = 30;
    bonusCoins = 15;
  } else if (completionRate >= 80) {
    grade = 'A';
    gradeBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.3)]';
    gradeTitle = '¡Gran Disciplina y Rendimiento!';
    bonusXp = 20;
    bonusCoins = 10;
  } else if (completionRate >= 50) {
    grade = 'B';
    gradeBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-400';
    gradeTitle = '¡Buen Avance Diario!';
    bonusXp = 12;
    bonusCoins = 6;
  } else {
    grade = 'C';
    gradeBadgeColor = 'bg-slate-700/50 text-slate-300 border-slate-600';
    gradeTitle = '¡Cada paso cuenta, mañana con todo!';
    bonusXp = 5;
    bonusCoins = 2;
  }

  const handleConsolidate = () => {

    const playerStore = usePlayerStore.getState();
    const incompleteImportant = allTasks.filter(t => 
      !t.completed && (t.priority === 'alta' || t.priority === 'epica' || t.isHabit || t.category === 'habito')
    );
    
    let totalDamage = 0;
    incompleteImportant.forEach(t => {
      if (t.priority === 'epica') totalDamage += 8;
      else if (t.priority === 'alta') totalDamage += 4;
      else totalDamage += 2; // Habits
    });

    if (totalDamage > 0) {
      const damageResult = playerStore.takeDamage(totalDamage);
      window.dispatchEvent(new CustomEvent('player-damage', { 
        detail: { 
          amount: totalDamage, 
          died: damageResult.died, 
          xpLost: damageResult.xpLost, 
          coinsLost: damageResult.coinsLost 
        } 
      }));
    }

    soundFX.playLevelUp();
    triggerShockwave({ color: 'cyan', intensity: 'epic' });

    if (reflectionText.trim() && onAddJournalEntry) {
      onAddJournalEntry(`🌙 Cierre de Jornada (${archetype.name}): ${reflectionText.trim()}`);
    }

    setIsConsolidated(true);
    // Bedtime auto-captured or overridden
    onConfirmFinishDay(bonusXp, bonusCoins, customBedtime);

    setTimeout(() => {
      setIsConsolidated(false);
      setReflectionText('');
      onClose();
    }, 1500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl max-h-[88dvh] sm:max-h-[84vh] flex flex-col bg-[#001224] border-2 border-cyan-500/50 rounded-2xl sm:rounded-3xl shadow-[0_0_60px_rgba(0,240,255,0.25)] text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Pinned Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 border-b border-cyan-900/50 bg-[#000e1c] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-950/80 border border-indigo-500/40 rounded-2xl shadow-inner text-amber-300">
              <Moon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                Ritual Nocturno & Cierre
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                Evaluación de la Jornada
              </h2>
              <p className="text-[11px] text-slate-400">{formattedFullDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Grade Badge */}
            <div className={`flex flex-col items-center justify-center px-2.5 py-1 rounded-xl border ${gradeBadgeColor}`}>
              <span className="text-[8px] font-black uppercase tracking-wider">Rango</span>
              <span className="text-lg font-black tracking-tight">{grade}</span>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3.5 sm:px-6 sm:py-4 space-y-4 overscroll-contain scrollbar-thin scrollbar-thumb-cyan-600">
          {/* Grade Title */}
          <div className="text-center bg-cyan-950/40 border border-cyan-800/40 py-2 px-3 rounded-xl">
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" /> {gradeTitle}
            </span>
          </div>

        {/* Manual Bedtime Override (Testing / Edge Cases) */}
        <div className="bg-[#000a14]/90 border border-cyan-500/30 rounded-2xl p-4 mb-5 relative shadow-[0_0_20px_rgba(0,240,255,0.12)] flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-cyan-200">
               <Clock className="w-5 h-5 text-cyan-400" />
               <span className="font-bold">Hora de dormir (Registrada):</span>
            </div>
            <input 
               type="time" 
               value={customBedtime}
               onChange={(e) => setCustomBedtime(e.target.value)}
               className="bg-black/50 border border-cyan-800 rounded-xl px-3 py-1.5 text-white font-mono text-sm sm:text-base outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all cursor-pointer"
               title="Editar hora si te olvidaste de presionar el botón anoche"
            />
        </div>

        {/* Companion Words Card */}
        <div className="bg-[#000a14]/90 border border-cyan-500/30 rounded-2xl p-4 mb-5 relative shadow-[0_0_20px_rgba(0,240,255,0.12)] flex items-start gap-3.5">
          <div className="shrink-0 flex items-center justify-center">
            <HoloCompanion archetype={stats.characterClass} size="sm" showHUD={false} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-bold text-white">
                {evolution.title}
              </span>
              <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full font-bold">
                {evolution.stageLabel}
              </span>
            </div>
            <p className="text-xs italic text-slate-300 leading-relaxed">
              {completedToday.length > 0
                ? `"¡Gran trabajo hoy, ${stats.characterClass}! Completaste el ${completionRate}% de tus misiones. Tu voluntad fortalece la senda de ${archetype.desire.toLowerCase()}."`
                : `"Hoy fue un día de descanso o reflexión. Mañana renacerá tu energía para dominar tus objetivos."`}
            </p>
          </div>
        </div>

        {/* Today's Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          <div className="bg-[#000a14]/70 border border-cyan-900/40 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-cyan-400 text-[11px] font-bold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Cumplimiento
            </div>
            <div className="text-lg font-black text-white">
              {completionRate}%
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {completedToday.length} / {totalTasks}
            </div>
          </div>

          <div className="bg-[#000a14]/70 border border-cyan-900/40 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-400 text-[11px] font-bold mb-1">
              <Zap className="w-3.5 h-3.5" /> Total XP
            </div>
            <div className="text-lg font-black text-amber-300">
              +{xpEarnedToday + bonusXp}
            </div>
            <div className="text-[10px] text-amber-400/80 font-mono">
              (+{bonusXp} Bonus)
            </div>
          </div>

          <div className="bg-[#000a14]/70 border border-cyan-900/40 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-yellow-400 text-[11px] font-bold mb-1">
              <Coins className="w-3.5 h-3.5" /> Monedas
            </div>
            <div className="text-lg font-black text-yellow-300">
              +{coinsEarnedToday + bonusCoins}
            </div>
            <div className="text-[10px] text-yellow-400/80 font-mono">
              (+{bonusCoins} Bonus)
            </div>
          </div>

          <div className="bg-[#000a14]/70 border border-cyan-900/40 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-indigo-400 text-[11px] font-bold mb-1">
              <Clock className="w-3.5 h-3.5" /> Foco Pomodoro
            </div>
            <div className="text-lg font-black text-indigo-300">
              {todayFocusMinutes} min
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Sesiones de foco
            </div>
          </div>
        </div>

        {/* Auto-capture Sleep Info — Read-only display, no inputs */}
        <div className="bg-[#000a14]/90 border border-indigo-500/30 rounded-2xl p-3.5 sm:p-4 mb-4 shadow-[0_0_20px_rgba(99,102,241,0.12)]">
          <div className="flex items-center gap-2 mb-3">
            <Moon className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 font-mono">
              Sueño & Ciclo Circadiano
            </span>
            <span className="ml-auto text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-950/80 text-cyan-400 border border-cyan-800 uppercase tracking-wider">
              Auto-Sync
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Bedtime — auto-captured on consolidate */}
            <div className="bg-[#001224] p-3 rounded-xl border border-indigo-900/50 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                <Moon className="w-3 h-3 text-indigo-400" /> Hora de Dormir
              </div>
              <div className="text-xl font-black text-white font-mono">
                {existingSleep?.bedtime || previewBedtime}
              </div>
              <div className="text-[9px] text-indigo-400 mt-0.5">
                {existingSleep?.bedtime ? '✓ Registrada' : '📍 Se registra al consolidar'}
              </div>
            </div>
            {/* WakeTime — auto-captured on Iniciar Jornada */}
            <div className="bg-[#001224] p-3 rounded-xl border border-cyan-900/50 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" /> Hora de Despertar
              </div>
              <div className={`text-xl font-black font-mono ${existingSleep?.wakeTime ? 'text-white' : 'text-slate-600'}`}>
                {existingSleep?.wakeTime || '--:--'}
              </div>
              <div className="text-[9px] text-cyan-400 mt-0.5">
                {existingSleep?.wakeTime
                  ? `✓ ${existingSleep.sleepDurationHours}h • ${existingSleep.quality}`
                  : '☀️ Se registra al Iniciar Jornada'}
              </div>
            </div>
          </div>
        </div>

        {/* Reflection & Journal Note Input */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Bitácora: Aprendizaje o Reflexión del Día
          </label>
          <textarea
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            placeholder="¿Qué aprendiste hoy? ¿Qué mantendrás o mejorarás mañana?"
            className="w-full bg-[#000a14] border border-cyan-900/70 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none h-20 shadow-inner"
          />
        </div>

        </div>

        {/* Pinned Action Footer */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-cyan-900/50 bg-[#000e1c] shrink-0">
          <button
            onClick={handleConsolidate}
            disabled={isConsolidated}
            className={`w-full py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              isConsolidated
                ? 'bg-emerald-600 text-white shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-[0_0_25px_rgba(0,240,255,0.35)] active:scale-[0.98]'
            }`}
          >
            {isConsolidated ? (
              <>
                <Check className="w-5 h-5 animate-bounce" /> ¡Jornada Consolidada con Éxito!
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Consolidar Jornada (+{bonusXp} XP / +{bonusCoins} Monedas)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
