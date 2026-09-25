import React, { useState, useMemo } from 'react';
import { BrainCircuit, AlertTriangle, Crosshair, Sparkles, Activity, ShieldAlert, Award, CalendarDays, Moon, ExternalLink } from 'lucide-react';
import { useAdvancedIntelligence, HeatmapNode } from './useAdvancedIntelligence';
import { PlayerStats, TaskItem, PomodoroSession } from '../types';
import { getTodayDateString, formatDateFullSpanish } from '../utils/date';
import { useTaskStore } from '../store/useTaskStore';
import { useUIStore } from '../store/useUIStore';

interface IntelligenceOverlayProps {
  onUpdateStats?: (stats: PlayerStats) => void;
  stats: PlayerStats;
  tasksByDate: Record<string, TaskItem[]>;
  pomodoroSessions: PomodoroSession[];
}

export const IntelligenceOverlay: React.FC<IntelligenceOverlayProps> = ({ stats, tasksByDate, pomodoroSessions, onUpdateStats }) => {
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
    <div className="mt-8 space-y-6">
      {/* Title */}
      <div className="flex items-center gap-3 border-b border-fuchsia-900/40 pb-4">
        <BrainCircuit className="w-6 h-6 text-fuchsia-400" />
        <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 to-purple-400 tracking-widest uppercase">
          Oráculo Conductual
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Alerts & Evolved Rank */}
        <div className="space-y-6 lg:col-span-1">
          {/* Evolved Rank */}
          <div className="bg-gradient-to-br from-[#0a0f25] to-[#050a18] p-5 rounded-2xl border border-cyan-900/50 shadow-[0_4px_20px_rgba(0,240,255,0.05)] relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center gap-2 mb-3 text-cyan-400">
              <Award className="w-4 h-4" />
              <h3 className="text-[10px] font-black uppercase tracking-widest">Clase Evolutiva</h3>
            </div>
            <p className="text-sm font-semibold text-white mb-1">Título Base: <span className="text-white">{evolvedRank.baseRank}</span></p>
            <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">
              {evolvedRank.fullTitle}
            </p>
            <p className="text-[10px] font-bold text-white mt-2 bg-cyan-500/10 px-2 py-1 rounded-md inline-block">
              {evolvedRank.winRate}% {evolvedRank.dominantStat} en 30 Días
            </p>
          </div>

          {/* Predictive Alerts */}
          {alerts.map(alert => (
            <div key={alert.id} className="bg-[#1f0909] p-5 rounded-2xl border border-red-900/60 shadow-[0_4px_20px_rgba(239,68,68,0.1)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-red-500/20 transition-all"></div>
              <div className="flex items-center gap-2 mb-3 text-red-400">
                <ShieldAlert className="w-4 h-4" />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Alerta Predictiva</h3>
              </div>
              <p className="text-red-300 text-sm font-semibold mb-3">{alert.patternDetected}</p>
              
              <div className="bg-black/40 border border-red-500/30 rounded-xl p-3">
                <p className="text-white text-xs font-black uppercase tracking-wide mb-1 flex items-center gap-1.5">
                  <Crosshair className="w-3 h-3 text-red-500" /> {alert.missionProposal.title}
                </p>
                <p className="text-red-200/70 text-[10px]">{alert.missionProposal.condition}</p>
                <div className="mt-2 text-right">
                   <span className="text-[10px] font-black text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full border border-orange-400/20">
                     Bonus {alert.missionProposal.bonusMultiplier}x XP
                   </span>
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
              <div key={insight.id} className="bg-gradient-to-br from-[#0a0f25] to-[#050a18] p-5 rounded-2xl border border-purple-900/40 shadow-[0_4px_15px_rgba(168,85,247,0.05)]">
                 <div className="flex items-center gap-2 mb-2 text-white">
                  {insight.type === 'synergy' ? <Sparkles className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <h3 className="text-[10px] font-black uppercase tracking-widest">
                    {insight.type === 'synergy' ? 'Sinergia Detectada' : insight.type === 'warning' ? 'Advertencia' : insight.type === 'bottleneck' ? 'Cuello de Botella' : 'Momentum'}
                  </h3>
                 </div>
                 <p className="text-sm font-black text-white mb-2">{insight.title}</p>
                 <p className="text-xs text-white leading-relaxed mb-3">{insight.description}</p>
                 <div className="flex gap-2">
                   {insight.relatedAttributes.map(attr => (
                     <span key={attr} className="text-[9px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-500/30">
                       {attr}
                     </span>
                   ))}
                 </div>
              </div>
            ))}
          </div>

          {/* Consistency Heatmap */}
          <div className="bg-[#001830] p-5 rounded-2xl border border-blue-900/30 shadow-[0_4px_20px_rgba(59,130,246,0.05)] overflow-hidden flex flex-col">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2 text-blue-400">
                  <Activity className="w-4 h-4" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest">Flujo de Consistencia</h3>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-blue-900/30">
                    {['todas', 'cuerpo', 'mente', 'sueño', 'vida'].map((area) => (
                      <button
                        key={area}
                        onClick={() => setHeatmapArea(area)}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          heatmapArea === area
                            ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.4)]'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-blue-900/30">
                  {[30, 90, 180, 365].map((range) => (
                    <button
                      key={range}
                      onClick={() => setHeatmapRange(range as any)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        heatmapRange === range 
                          ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]'
                          : 'text-white hover:text-white'
                      }`}
                    >
                      {range === 30 ? '30D' : range === 90 ? 'Trimestre' : range === 180 ? 'Semestre' : 'Año'}
                    </button>
                  ))}
                </div>
                </div>
             </div>
             
              {heatmapArea === 'sueño' && (
                <div className="mb-4 bg-[#090d26] border border-indigo-500/40 rounded-2xl p-4 shadow-[0_4px_25px_rgba(99,102,241,0.2)]">
                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-indigo-900/40">
                      <div>
                         <div className="flex items-center gap-2">
                            <Moon className="w-5 h-5 text-indigo-400" />
                            <h4 className="text-sm font-black text-indigo-200 uppercase tracking-wider">
                               Análisis de Sueño y Recuperación
                            </h4>
                         </div>
                         <p className="text-[11px] text-slate-300 mt-0.5">
                            Se calcula y sincroniza automáticamente al marcar <strong className="text-cyan-300">Desconexión Total</strong> a las 23:00.
                         </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                         Sincronización Automática Activa
                      </span>
                   </div>

                   {/* Stats Grid */}
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3.5">
                      <div className="bg-black/50 border border-indigo-900/50 rounded-xl p-2.5">
                         <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">Promedio de Descanso</p>
                         <p className="text-lg font-black text-white mt-0.5">
                            {sleepStats.avgHours.toFixed(1)} <span className="text-xs text-indigo-300 font-semibold">hrs / noche</span>
                         </p>
                         <p className="text-[10px] text-slate-400 mt-0.5">
                            {sleepStats.avgHours >= 7 ? '✨ Óptimo (100% Energía)' : sleepStats.avgHours >= 6 ? '⚡ Normal (90% Energía)' : '⚠️ Ajustado (75% Energía)'}
                         </p>
                      </div>

                      <div className="bg-black/50 border border-indigo-900/50 rounded-xl p-2.5">
                         <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">Último Registro</p>
                         <p className="text-sm font-black text-white mt-0.5 truncate">
                            {sleepStats.lastLog ? (
                               <>
                                  {sleepStats.lastLog.bedtime} → {sleepStats.lastLog.wakeTime || '07:00'}{' '}
                                  <span className="text-indigo-300 font-bold">({sleepStats.lastLog.sleepDurationHours ?? 8}h)</span>
                               </>
                            ) : (
                               <span className="text-slate-400 text-xs">23:00 → 07:00 (8.0h)</span>
                            )}
                         </p>
                         <p className="text-[10px] text-slate-400 mt-0.5">
                            {sleepStats.lastLog ? `Día: ${sleepStats.lastLog.date}` : 'Horario programado'}
                         </p>
                      </div>

                      <div className="bg-black/50 border border-indigo-900/50 rounded-xl p-2.5">
                         <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">Hora de Levantarse</p>
                         <p className="text-sm font-black text-cyan-300 mt-0.5">
                            {sleepStats.lastLog?.wakeTime ? `${sleepStats.lastLog.wakeTime} Objetivo` : 'Según tu Agenda'}
                         </p>
                         <p className="text-[10px] text-slate-400 mt-0.5">
                            Adaptable a tu rutina diaria
                         </p>
                      </div>
                   </div>

                   {/* Custom Night Manual Logger */}
                   <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-2.5 flex flex-col md:flex-row items-center justify-between gap-2.5">
                      <div className="text-left w-full md:w-auto">
                         <p className="text-xs font-bold text-indigo-200">Ajustar noche específica:</p>
                         <p className="text-[10px] text-slate-400">Modifica o añade registros para actualizar el mapa de calor de descanso.</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                         <input 
                            type="date" 
                            value={manualSleepDate} 
                            onChange={(e) => setManualSleepDate(e.target.value)} 
                            className="bg-black border border-indigo-500/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-400" 
                         />
                         <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">Dormir:</span>
                            <input 
                               type="time" 
                               value={sleepTime} 
                               onChange={(e) => setSleepTime(e.target.value)} 
                               className="bg-black border border-indigo-500/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-400" 
                            />
                         </div>
                         <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">Levantar:</span>
                            <input 
                               type="time" 
                               value={manualWakeTime} 
                               onChange={(e) => setManualWakeTime(e.target.value)} 
                               className="bg-black border border-indigo-500/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-400" 
                            />
                         </div>
                         <button
                            onClick={() => {
                               if (onUpdateStats) {
                                  const dur = calculateSleepDuration(sleepTime, manualWakeTime);
                                  onUpdateStats({
                                     ...stats,
                                     sleepLogs: {
                                        ...(stats.sleepLogs || {}),
                                        [manualSleepDate]: {
                                           bedtime: sleepTime,
                                           wakeTime: manualWakeTime,
                                           sleepDurationHours: dur,
                                           quality: dur >= 7 ? 'Excelente' : dur >= 6 ? 'Buena' : 'Corta',
                                           completedAt: new Date().toISOString()
                                        }
                                     }
                                  });
                               }
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm"
                         >
                            Guardar y Calcular
                         </button>
                      </div>
                   </div>
                </div>
              )}
              
              {/* Inspector Card on Selection */}
              {selectedNode && (
                <div className="mb-3 p-3.5 rounded-xl bg-[#001f3d] border border-cyan-500/50 text-cyan-200 animate-fade-in shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <CalendarDays className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">
                            {formatDateFullSpanish(selectedNode.date)}
                          </span>
                          {selectedNode.date === getTodayDateString() && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                              Hoy
                            </span>
                          )}
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${selectedNode.totalXp > 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-slate-800 text-slate-400'}`}>
                            {selectedNode.totalXp > 0 ? 'Con Registro' : 'Sin Registro'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-300 font-mono mt-1">
                          <span className="text-cyan-300 font-bold">⚡ {selectedNode.totalXp} XP</span>
                          {selectedNode.focusMinutes > 0 && <span>⏱️ {selectedNode.focusMinutes}m Foco</span>}
                          {selectedNode.dominantAttribute && <span>💎 {selectedNode.dominantAttribute}</span>}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="px-2.5 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-[10px] text-cyan-300 font-bold cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>

                  {/* Tasks / Habits breakdown for selected day */}
                  {selectedNode.activeTasks && selectedNode.activeTasks.length > 0 ? (
                    <div className="mt-3 pt-2.5 border-t border-cyan-900/60 space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      <p className="text-[10px] uppercase font-bold text-cyan-400/90 tracking-wider">
                        Actividades registradas ({selectedNode.activeTasks.length}):
                      </p>
                      {selectedNode.activeTasks.map((t: TaskItem, tIdx: number) => (
                        <div key={t.id ? `intel-task-${t.id}-${tIdx}` : `intel-task-${tIdx}`} className="flex items-center justify-between gap-2 text-xs bg-black/40 px-2.5 py-1.5 rounded-lg border border-cyan-900/40">
                          <span className="truncate text-slate-200">
                            {t.completed ? '✓ ' : '⚡ '}
                            {t.title}
                            {t.isHabit && t.currentCount !== undefined && (
                              <span className="text-cyan-400 font-mono ml-1">
                                ({t.currentCount}/{t.targetCount || 1})
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] font-bold text-yellow-400 shrink-0 font-mono">
                            +{t.awardedXp || t.xpReward || 0} XP
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2.5 pt-2 border-t border-cyan-900/60 flex items-center justify-between text-xs text-slate-400">
                      <span>Sin actividades registradas para esta fecha.</span>
                      <button
                        onClick={() => {
                          useTaskStore.getState().setCurrentViewDate(selectedNode.date);
                          useUIStore.getState().setActiveTab('dashboard');
                        }}
                        className="text-cyan-400 hover:text-cyan-300 text-[11px] font-bold underline cursor-pointer flex items-center gap-1"
                      >
                        Abrir en Agenda <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Heatmap Grid (Github Style Matrix aligned Monday-Sunday) */}
              <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-blue-900/50 scrollbar-track-transparent">
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

                  <div className="flex gap-1.5">
                    {/* Columns of 7 days strictly aligned */}
                    {calendarWeeks.map((week, weekIdx) => (
                      <div key={weekIdx} className="flex flex-col gap-1.5">
                        {Array.from({ length: 7 }).map((_, dayIdx) => {
                           const dayData = week[dayIdx];
                           if (!dayData) return <div key={dayIdx} className="w-3.5 h-3.5 rounded-sm bg-transparent" />;
                           
                           const getIntensityColor = (level: number) => {
                              if (heatmapArea === 'cuerpo') {
                                 switch(level) {
                                   case 4: return 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)] border border-orange-300';
                                   case 3: return 'bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.6)] border border-orange-400/80';
                                   case 2: return 'bg-red-600 border border-red-500/60';
                                   case 1: return 'bg-red-900/80 border border-red-700/60';
                                   default: return 'bg-[#1a0808] border border-red-950/80 hover:border-red-700';
                                 }
                              } else if (heatmapArea === 'mente') {
                                 switch(level) {
                                   case 4: return 'bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.8)] border border-fuchsia-300';
                                   case 3: return 'bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.6)] border border-purple-400/80';
                                   case 2: return 'bg-purple-700 border border-purple-600/60';
                                   case 1: return 'bg-purple-900/80 border border-purple-800/60';
                                   default: return 'bg-[#120024] border border-purple-950/80 hover:border-purple-700';
                                 }
                              } else if (heatmapArea === 'vida') {
                                 switch(level) {
                                   case 4: return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] border border-emerald-300';
                                   case 3: return 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.6)] border border-emerald-400/80';
                                   case 2: return 'bg-emerald-700 border border-emerald-600/60';
                                   case 1: return 'bg-emerald-900/80 border border-emerald-800/60';
                                   default: return 'bg-[#001c10] border border-emerald-950/80 hover:border-emerald-700';
                                 }
                              } else if (heatmapArea === 'sueño') {
                                 switch(level) {
                                   case 4: return 'bg-indigo-300 shadow-[0_0_8px_rgba(165,180,252,0.8)] border border-indigo-200';
                                   case 3: return 'bg-indigo-400 shadow-[0_0_5px_rgba(129,140,248,0.6)] border border-indigo-300/80';
                                   case 2: return 'bg-indigo-600 border border-indigo-500/60';
                                   case 1: return 'bg-indigo-900/80 border border-indigo-800/60';
                                   default: return 'bg-[#06001e] border border-indigo-950/80 hover:border-indigo-700';
                                 }
                              }
                              switch(level) {
                                 case 4: return 'bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.8)] border border-cyan-300';
                                 case 3: return 'bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.6)] border border-cyan-400/80';
                                 case 2: return 'bg-blue-600 border border-blue-500/60';
                                 case 1: return 'bg-blue-900/80 border border-blue-800/60';
                                 default: return 'bg-[#001c38] border border-blue-900/80 hover:border-cyan-500';
                              }
                           };

                           const isSelected = selectedNode?.date === dayData.date;

                           return (
                             <button 
                               key={dayIdx} 
                               onClick={() => setSelectedNode(dayData)}
                               className={`w-3.5 h-3.5 rounded-sm ${getIntensityColor(dayData.intensity)} ${isSelected ? 'ring-2 ring-white scale-125 z-10' : ''} transition-all hover:scale-125 cursor-pointer`}
                               title={dayData.label || `${dayData.date} - ${dayData.totalXp} XP`}
                             />
                           );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-auto pt-2 border-t border-blue-900/30 text-[10px] text-slate-300 font-bold uppercase">
                <span className="text-slate-400 font-mono text-[9px]">Toca cualquier celda para inspeccionar día</span>
                <div className="flex items-center gap-1.5">
                  <span>Inactivo</span>
                  <div className={`w-3 h-3 rounded-sm border ${heatmapArea === 'cuerpo' ? 'bg-[#1a0808] border-red-950' : heatmapArea === 'mente' ? 'bg-[#120024] border-purple-950' : heatmapArea === 'vida' ? 'bg-[#001c10] border-emerald-950' : heatmapArea === 'sueño' ? 'bg-[#06001e] border-indigo-950' : 'bg-[#001c38] border-blue-900'}`}></div>
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
  );
};
