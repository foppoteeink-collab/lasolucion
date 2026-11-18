import React, { useState, useMemo } from 'react';
import { BrainCircuit, AlertTriangle, Crosshair, Sparkles, Activity, ShieldAlert, Award, CalendarDays, Moon, ExternalLink } from 'lucide-react';
import { useAdvancedIntelligence, HeatmapNode } from './useAdvancedIntelligence';
import { PlayerStats, TaskItem, PomodoroSession } from '../types';
import { getTodayDateString, formatDateFullSpanish } from '../utils/date';
import { useTaskStore } from '../store/useTaskStore';
import { useUIStore } from '../store/useUIStore';

const HEATMAP_INTENSITY_CLASSES: Record<string, readonly [string, string, string, string, string]> = {
  cuerpo: [
    'bg-[#040814]/90 border border-rose-900/50 hover:border-rose-500/70',
    'bg-red-900/80 border border-red-700/60',
    'bg-red-600 border border-red-500/60',
    'bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.5)] border border-orange-400/80',
    'bg-orange-400 shadow-[0_0_7px_rgba(251,146,60,0.7)] border border-orange-300',
  ],
  mente: [
    'bg-[#040814]/90 border border-purple-900/50 hover:border-purple-500/70',
    'bg-purple-900/80 border border-purple-800/60',
    'bg-purple-700 border border-purple-600/60',
    'bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.5)] border border-purple-400/80',
    'bg-fuchsia-400 shadow-[0_0_7px_rgba(232,121,249,0.7)] border border-fuchsia-300',
  ],
  vida: [
    'bg-[#040814]/90 border border-emerald-900/50 hover:border-emerald-500/70',
    'bg-emerald-900/80 border border-emerald-800/60',
    'bg-emerald-700 border border-emerald-600/60',
    'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)] border border-emerald-400/80',
    'bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,0.7)] border border-emerald-300',
  ],
  'sueño': [
    'bg-[#040814]/90 border border-indigo-900/50 hover:border-indigo-500/70',
    'bg-indigo-900/80 border border-indigo-800/60',
    'bg-indigo-600 border border-indigo-500/60',
    'bg-indigo-400 shadow-[0_0_5px_rgba(129,140,248,0.5)] border border-indigo-300/80',
    'bg-indigo-300 shadow-[0_0_7px_rgba(165,180,252,0.7)] border border-indigo-200',
  ],
  todas: [
    'bg-[#040814]/90 border border-white/10 hover:border-cyan-400/70',
    'bg-blue-900/80 border border-blue-800/60',
    'bg-blue-600 border border-blue-500/60',
    'bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.5)] border border-cyan-400/80',
    'bg-cyan-400 shadow-[0_0_7px_rgba(0,240,255,0.7)] border border-cyan-300',
  ],
};

interface IntelligenceOverlayProps {
  onUpdateStats?: (updater: PlayerStats | ((prev: PlayerStats) => PlayerStats)) => void;
  stats: PlayerStats;
  tasksByDate: Record<string, TaskItem[]>;
  pomodoroSessions: PomodoroSession[];
}

export const IntelligenceOverlay: React.FC<IntelligenceOverlayProps> = React.memo(({ stats, tasksByDate, pomodoroSessions, onUpdateStats }) => {
  const [heatmapArea, setHeatmapArea] = useState<string>('todas');
  const { heatmap, insights, alerts, evolvedRank } = useAdvancedIntelligence(stats, tasksByDate, pomodoroSessions, heatmapArea);
  const [heatmapRange, setHeatmapRange] = useState<30 | 90 | 180 | 365>(90);
  const [selectedNode, setSelectedNode] = useState<HeatmapNode | null>(null);
  const [sleepTime, setSleepTime] = useState<string>('23:00');
  const [manualWakeTime, setManualWakeTime] = useState<string>('07:00');
  const [manualSleepDate, setManualSleepDate] = useState<string>(() => getTodayDateString());

  // Format calendar weeks with proper Monday-Sunday alignment
  const calendarWeeks = useMemo(() => {
    const rangeData = heatmap.slice(-heatmapRange);
    if (rangeData.length === 0) return [];

    const firstDateStr = rangeData[0].date;
    const [y, m, d] = firstDateStr.split('-').map(Number);
    // JavaScript getDay(): 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // We align rows to Monday (0) through Sunday (6)
    const firstDayOfWeek = (new Date(y, m - 1, d).getDay() + 6) % 7;

    const padded: (HeatmapNode | null)[] = Array(firstDayOfWeek).fill(null).concat(rangeData);

    const weeks: (HeatmapNode | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      weeks.push(padded.slice(i, i + 7));
    }
    return weeks;
  }, [heatmap, heatmapRange]);

  const sleepStats = useMemo(() => {
    const sleepLogs = stats.sleepLogs || {};
    const keys = Object.keys(sleepLogs);
    if (keys.length === 0) {
      return {
        count: 0,
        avgHours: 6.0,
        lastLog: null,
      };
    }
    let sumHours = 0;
    keys.forEach((k) => {
      const item = sleepLogs[k];
      sumHours += item?.sleepDurationHours ?? 6.0;
    });
    const sortedKeys = [...keys].sort((a, b) => b.localeCompare(a));
    const lastDate = sortedKeys[0];
    const lastItem = sleepLogs[lastDate];
    return {
      count: keys.length,
      avgHours: Math.round((sumHours / keys.length) * 10) / 10,
      lastLog: lastItem ? { date: lastDate, ...lastItem } : null,
    };
  }, [stats.sleepLogs]);

  const calculateSleepDuration = (b: string, w: string) => {
    const [bH, bM] = b.split(':').map(Number);
    const [wH, wM] = w.split(':').map(Number);
    let diff = (wH * 60 + (wM || 0)) - (bH * 60 + (bM || 0));
    if (diff <= 0) diff += 24 * 60;
    return Math.round((diff / 60) * 10) / 10;
  };

  return (
    <div className="mt-6 space-y-6">
      {/* Title */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-3.5">
        <div className="w-9 h-9 rounded-xl aura-bg-soft border aura-border-subtle aura-text-primary flex items-center justify-center shrink-0">
          <BrainCircuit className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-anton text-white tracking-wider uppercase">
          Oráculo Conductual
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Alerts & Evolved Rank */}
        <div className="space-y-6 lg:col-span-1">
          {/* Evolved Rank */}
          <div className="relative isolate bg-[#040a1a]/[0.94] p-5 rounded-2xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden">
            <span className="vi-grano opacity-5" aria-hidden="true" />
            <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3 aura-text-primary">
                <Award className="w-4 h-4" />
                <h3 className="text-xs font-anton uppercase tracking-wider">Clase Evolutiva</h3>
              </div>
              <p className="text-sm font-semibold text-slate-300 mb-1">
                Título Base: <span className="text-white">{evolvedRank.baseRank}</span>
              </p>
              <p className="text-xl font-anton uppercase tracking-wider aura-text-primary">
                {evolvedRank.fullTitle}
              </p>
              <p className="text-[10px] font-mono tabular-nums font-bold aura-text-soft mt-2.5 aura-bg-soft border aura-border-subtle px-2.5 py-1 rounded-lg inline-block">
                {evolvedRank.winRate}% {evolvedRank.dominantStat} en 30 Días
              </p>
            </div>
          </div>

          {/* Predictive Alerts */}
          {alerts.map(alert => (
            <div key={alert.id} className="relative isolate bg-[#040a1a]/[0.94] p-5 rounded-2xl border border-rose-500/35 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden">
              <span className="vi-grano opacity-5" aria-hidden="true" />
              <div className="absolute top-0 inset-x-0 h-px pointer-events-none bg-gradient-to-r from-transparent via-rose-500/60 to-transparent" aria-hidden="true" />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3 text-rose-400">
                  <ShieldAlert className="w-4 h-4" />
                  <h3 className="text-xs font-anton uppercase tracking-wider">Alerta Predictiva</h3>
                </div>
                <p className="text-rose-200 text-sm font-semibold mb-3">{alert.patternDetected}</p>
                
                <div className="bg-[#040814]/80 border border-rose-500/30 rounded-xl p-3">
                  <p className="text-white text-xs font-anton uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5 text-rose-400" /> {alert.missionProposal.title}
                  </p>
                  <p className="text-rose-200/80 text-[11px]">{alert.missionProposal.condition}</p>
                  <div className="mt-2 text-right">
                     <span className="text-[10px] font-mono tabular-nums font-bold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                       Bonus {alert.missionProposal.bonusMultiplier}x XP
                     </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Heatmap & Insights */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Behavioral Insights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {insights.map(insight => (
              <div key={insight.id} className="relative isolate bg-[#040a1a]/[0.94] p-5 rounded-2xl border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.45)] overflow-hidden">
                 <span className="vi-grano opacity-5" aria-hidden="true" />
                 <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

                 <div className="relative z-10">
                   <div className="flex items-center gap-2 mb-2 aura-text-soft">
                    {insight.type === 'synergy' ? <Sparkles className="w-4 h-4 aura-text-primary" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
                    <h3 className="text-[11px] font-anton uppercase tracking-wider">
                      {insight.type === 'synergy' ? 'Sinergia Detectada' : insight.type === 'warning' ? 'Advertencia' : insight.type === 'bottleneck' ? 'Cuello de Botella' : 'Momentum'}
                    </h3>
                   </div>
                   <p className="text-sm font-anton uppercase tracking-wider text-white mb-1.5">{insight.title}</p>
                   <p className="text-xs text-slate-300 leading-relaxed mb-3">{insight.description}</p>
                   <div className="flex flex-wrap gap-1.5">
                     {insight.relatedAttributes.map(attr => (
                       <span key={attr} className="text-[10px] font-mono font-bold aura-text-soft aura-bg-soft px-2 py-0.5 rounded-lg border aura-border-subtle">
                         {attr}
                       </span>
                     ))}
                   </div>
                 </div>
              </div>
            ))}
          </div>

          {/* Consistency Heatmap */}
          <div className="relative isolate bg-[#040a1a]/[0.94] p-5 rounded-2xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden flex flex-col">
             <span className="vi-grano opacity-5" aria-hidden="true" />
             <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

             <div className="relative z-10 flex flex-col flex-1">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-2 aura-text-primary">
                    <Activity className="w-4 h-4" />
                    <h3 className="text-xs font-anton uppercase tracking-wider">Flujo de Consistencia</h3>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2.5">
                    <div className="mf-chip-group flex items-center gap-1 bg-[#040814]/80 p-1 rounded-xl border border-white/10">
                      {['todas', 'cuerpo', 'mente', 'sueño', 'vida'].map((area) => (
                        <button
                          key={area}
                          type="button"
                          onClick={() => setHeatmapArea(area)}
                          className={`chicle-btn px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border transition-all cursor-pointer ${
                            heatmapArea === area
                              ? 'aura-bg-soft aura-text-primary aura-border-primary optic-active-card'
                              : 'border-transparent text-slate-400 hover:text-white'
                          }`}
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                    <div className="mf-chip-group flex items-center gap-1 bg-[#040814]/80 p-1 rounded-xl border border-white/10">
                      {[30, 90, 180, 365].map((range) => (
                        <button
                          key={range}
                          type="button"
                          onClick={() => setHeatmapRange(range as any)}
                          className={`chicle-btn px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                            heatmapRange === range 
                              ? 'aura-bg-soft aura-text-primary aura-border-primary optic-active-card'
                              : 'border-transparent text-slate-400 hover:text-white'
                          }`}
                        >
                          {range === 30 ? '30D' : range === 90 ? 'Trimestre' : range === 180 ? 'Semestre' : 'Año'}
                        </button>
                      ))}
                    </div>
                  </div>
               </div>
               
                {heatmapArea === 'sueño' && (
                  <div className="mb-4 bg-[#040814]/80 border border-indigo-500/35 rounded-2xl p-4 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-white/10">
                        <div>
                           <div className="flex items-center gap-2">
                              <Moon className="w-5 h-5 text-indigo-400" />
                              <h4 className="text-sm font-anton text-white uppercase tracking-wider">
                                 Análisis de Sueño y Recuperación
                              </h4>
                           </div>
                           <p className="text-[11px] text-slate-300 mt-0.5">
                              Se calcula y sincroniza automáticamente al marcar <strong className="aura-text-soft">Desconexión Total</strong> a las 23:00.
                           </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                           Sincronización Automática Activa
                        </span>
                     </div>

                     {/* Stats Grid */}
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3.5">
                        <div className="bg-black/40 border border-white/10 rounded-xl p-3">
                           <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">Promedio de Descanso</p>
                           <p className="text-lg font-mono tabular-nums font-black text-white mt-0.5">
                              {sleepStats.avgHours.toFixed(1)} <span className="text-xs text-indigo-300 font-sans font-semibold">hrs / noche</span>
                           </p>
                           <p className="text-[10px] text-slate-400 mt-0.5">
                              {sleepStats.avgHours >= 7 ? '✨ Óptimo (100% Energía)' : sleepStats.avgHours >= 6 ? '⚡ Normal (90% Energía)' : '⚠️ Ajustado (75% Energía)'}
                           </p>
                        </div>

                        <div className="bg-black/40 border border-white/10 rounded-xl p-3">
                           <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">Último Registro</p>
                           <p className="text-sm font-mono tabular-nums font-black text-white mt-0.5 truncate">
                              {sleepStats.lastLog ? (
                                 <>
                                    {sleepStats.lastLog.bedtime} → {sleepStats.lastLog.wakeTime || '07:00'}{' '}
                                    <span className="text-indigo-300 font-bold">({sleepStats.lastLog.sleepDurationHours ?? 8}h)</span>
                                 </>
                              ) : (
                                 <span className="text-slate-400 text-xs">23:00 → 07:00 (8.0h)</span>
                              )}
                           </p>
                           <p className="text-[10px] font-mono tabular-nums text-slate-400 mt-0.5">
                              {sleepStats.lastLog ? `Día: ${sleepStats.lastLog.date}` : 'Horario programado'}
                           </p>
                        </div>

                        <div className="bg-black/40 border border-white/10 rounded-xl p-3">
                           <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">Hora de Levantarse</p>
                           <p className="text-sm font-mono tabular-nums font-black aura-text-soft mt-0.5">
                              {sleepStats.lastLog?.wakeTime ? `${sleepStats.lastLog.wakeTime} Objetivo` : 'Según tu Agenda'}
                           </p>
                           <p className="text-[10px] text-slate-400 mt-0.5">
                              Adaptable a tu rutina diaria
                           </p>
                        </div>
                     </div>

                     {/* Custom Night Manual Logger */}
                     <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-2.5">
                        <div className="text-left w-full md:w-auto">
                           <p className="text-xs font-bold text-white">Ajustar noche específica:</p>
                           <p className="text-[10px] text-slate-400">Modifica o añade registros para actualizar el mapa de calor de descanso.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                           <input 
                              type="date" 
                              value={manualSleepDate} 
                              onChange={(e) => setManualSleepDate(e.target.value)} 
                              className="bg-[#030712]/90 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400" 
                           />
                           <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400">Dormir:</span>
                              <input 
                                 type="time" 
                                 value={sleepTime} 
                                 onChange={(e) => setSleepTime(e.target.value)} 
                                 className="bg-[#030712]/90 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400" 
                              />
                           </div>
                           <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400">Levantar:</span>
                              <input 
                                 type="time" 
                                 value={manualWakeTime} 
                                 onChange={(e) => setManualWakeTime(e.target.value)} 
                                 className="bg-[#030712]/90 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400" 
                              />
                           </div>
                           <button
                              type="button"
                              onClick={() => {
                                 if (onUpdateStats) {
                                    const dur = calculateSleepDuration(sleepTime, manualWakeTime);
                                    onUpdateStats((prev) => ({
                                       ...prev,
                                       sleepLogs: {
                                          ...(prev.sleepLogs || {}),
                                          [manualSleepDate]: {
                                             bedtime: sleepTime,
                                             wakeTime: manualWakeTime,
                                             sleepDurationHours: dur,
                                             quality: dur >= 7 ? 'Excelente' : dur >= 6 ? 'Buena' : 'Corta',
                                             completedAt: new Date().toISOString()
                                          }
                                       }
                                    }));
                                 }
                              }}
                              className="chicle-btn aura-btn-gradient optic-active-card px-3.5 py-1.5 rounded-xl text-xs font-anton uppercase tracking-wider transition-all cursor-pointer"
                           >
                              Guardar y Calcular
                           </button>
                        </div>
                     </div>
                  </div>
                )}
                
                {/* Inspector Card on Selection */}
                {selectedNode && (
                  <div className="mb-3 p-3.5 rounded-xl bg-[#040814]/85 border aura-border-subtle text-slate-200 animate-fade-in aura-glow-subtle">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <CalendarDays className="w-5 h-5 aura-text-primary shrink-0 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-anton uppercase tracking-wider text-white text-sm">
                              {formatDateFullSpanish(selectedNode.date)}
                            </span>
                            {selectedNode.date === getTodayDateString() && (
                              <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase aura-bg-soft aura-text-primary border aura-border-subtle">
                                Hoy
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${selectedNode.totalXp > 0 ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35' : 'bg-white/[0.05] text-slate-400 border border-white/10'}`}>
                              {selectedNode.totalXp > 0 ? 'Con Registro' : 'Sin Registro'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-300 font-mono tabular-nums mt-1">
                            <span className="aura-text-soft font-bold">⚡ {selectedNode.totalXp} XP</span>
                            {selectedNode.focusMinutes > 0 && <span>⏱️ {selectedNode.focusMinutes}m Foco</span>}
                            {selectedNode.dominantAttribute && <span>💎 {selectedNode.dominantAttribute}</span>}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedNode(null)}
                        className="chicle-btn px-2.5 py-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-[10px] text-slate-200 hover:text-white font-bold cursor-pointer"
                      >
                        Cerrar
                      </button>
                    </div>

                    {/* Tasks / Habits breakdown for selected day */}
                    {selectedNode.activeTasks && selectedNode.activeTasks.length > 0 ? (
                      <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        <p className="text-[10px] uppercase font-bold aura-text-soft tracking-wider">
                          Actividades registradas ({selectedNode.activeTasks.length}):
                        </p>
                        {selectedNode.activeTasks.map((t: TaskItem, tIdx: number) => (
                          <div key={t.id ? `intel-task-${t.id}-${tIdx}` : `intel-task-${tIdx}`} className="flex items-center justify-between gap-2 text-xs bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/10">
                            <span className="truncate text-slate-200">
                              {t.completed ? '✓ ' : '⚡ '}
                              {t.title}
                              {t.isHabit && t.currentCount !== undefined && (
                                <span className="aura-text-primary font-mono tabular-nums ml-1">
                                  ({t.currentCount}/{t.targetCount || 1})
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] font-bold text-amber-300 shrink-0 font-mono tabular-nums">
                              +{t.awardedXp || t.xpReward || 0} XP
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                        <span>Sin actividades registradas para esta fecha.</span>
                        <button
                          type="button"
                          onClick={() => {
                            useTaskStore.getState().setCurrentViewDate(selectedNode.date);
                            useUIStore.getState().setActiveTab('dashboard');
                          }}
                          className="aura-text-primary hover:brightness-125 text-[11px] font-bold underline cursor-pointer flex items-center gap-1"
                        >
                          Abrir en Agenda <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Heatmap Grid (Github Style Matrix aligned Monday-Sunday) */}
                <div className="overflow-x-auto pb-4 scrollbar-thin">
                  <div className="flex items-start gap-2 min-w-max pt-1">
                    {/* Day of Week Labels (L M X J V S D strictly Mon to Sun) */}
                    <div className="flex flex-col gap-1.5 text-[9px] font-mono font-bold text-slate-400 select-none pr-1 pt-0.5">
                      <span className="h-3.5 flex items-center">L</span>
                      <span className="h-3.5 flex items-center">M</span>
                      <span className="h-3.5 flex items-center">X</span>
                      <span className="h-3.5 flex items-center">J</span>
                      <span className="h-3.5 flex items-center">V</span>
                      <span className="h-3.5 flex items-center">S</span>
                      <span className="h-3.5 flex items-center">D</span>
                    </div>

                    <div className="flex gap-1.5" style={{ contain: 'layout style' }}>
                      {/* Columns of 7 days strictly aligned */}
                      {calendarWeeks.map((week, weekIdx) => {
                        const areaPalette = HEATMAP_INTENSITY_CLASSES[heatmapArea] || HEATMAP_INTENSITY_CLASSES.todas;
                        return (
                          <div key={weekIdx} className="flex flex-col gap-1.5">
                            {Array.from({ length: 7 }).map((_, dayIdx) => {
                              const dayData = week[dayIdx];
                              if (!dayData) return <div key={dayIdx} className="w-3.5 h-3.5 rounded-sm bg-transparent" />;
                              const isSelected = selectedNode?.date === dayData.date;
                              return (
                                <button
                                  key={dayIdx}
                                  type="button"
                                  onClick={() => setSelectedNode(dayData)}
                                  className={`w-3.5 h-3.5 rounded-sm ${areaPalette[dayData.intensity] || areaPalette[0]} ${isSelected ? 'ring-2 ring-white scale-125 z-10' : ''} transition-transform duration-150 hover:scale-125 cursor-pointer`}
                                  title={dayData.label || `${dayData.date} - ${dayData.totalXp} XP`}
                                />
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-auto pt-3 border-t border-white/10 text-[10px] text-slate-300 font-bold uppercase">
                  <span className="text-slate-400 font-mono text-[9px]">Toca cualquier celda para inspeccionar día</span>
                  <div className="flex items-center gap-1.5">
                    <span>Inactivo</span>
                    <div className={`w-3 h-3 rounded-sm border bg-[#040814]/90 ${heatmapArea === 'cuerpo' ? 'border-rose-900/60' : heatmapArea === 'mente' ? 'border-purple-900/60' : heatmapArea === 'vida' ? 'border-emerald-900/60' : heatmapArea === 'sueño' ? 'border-indigo-900/60' : 'border-white/15'}`}></div>
                    <div className={`w-3 h-3 rounded-sm ${heatmapArea === 'cuerpo' ? 'bg-red-900' : heatmapArea === 'mente' ? 'bg-purple-900' : heatmapArea === 'vida' ? 'bg-emerald-900' : heatmapArea === 'sueño' ? 'bg-indigo-900' : 'bg-blue-900'}`}></div>
                    <div className={`w-3 h-3 rounded-sm ${heatmapArea === 'cuerpo' ? 'bg-red-600' : heatmapArea === 'mente' ? 'bg-purple-700' : heatmapArea === 'vida' ? 'bg-emerald-700' : heatmapArea === 'sueño' ? 'bg-indigo-600' : 'bg-blue-600'}`}></div>
                    <div className={`w-3 h-3 rounded-sm ${heatmapArea === 'cuerpo' ? 'bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.6)]' : heatmapArea === 'mente' ? 'bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.6)]' : heatmapArea === 'vida' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.6)]' : heatmapArea === 'sueño' ? 'bg-indigo-400 shadow-[0_0_5px_rgba(129,140,248,0.6)]' : 'bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.6)]'}`}></div>
                    <div className={`w-3 h-3 rounded-sm ${heatmapArea === 'cuerpo' ? 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]' : heatmapArea === 'mente' ? 'bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.8)]' : heatmapArea === 'vida' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : heatmapArea === 'sueño' ? 'bg-indigo-300 shadow-[0_0_8px_rgba(165,180,252,0.8)]' : 'bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.8)]'}`}></div>
                    <span>Flujo Máximo</span>
                  </div>
                </div>
             </div>
           </div>

         </div>
       </div>
    </div>
  );
});
IntelligenceOverlay.displayName = 'IntelligenceOverlay';
