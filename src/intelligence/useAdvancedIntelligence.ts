import { useMemo } from 'react';
import { PlayerStats, TaskItem, PomodoroSession } from '../types';
import { getTodayDateString, addDaysToDateString } from '../utils/date';

export interface HeatmapNode {
    date: string;
    totalXp: number;
    focusMinutes: number;
    intensity: 0 | 1 | 2 | 3 | 4;
    dominantAttribute: string;
    label?: string;
    completedCount?: number;
    activeTasks?: TaskItem[];
}

export interface BehavioralInsight {
    id: string;
    type: 'warning' | 'synergy' | 'bottleneck' | 'momentum';
    title: string;
    description: string;
    confidenceScore: number;
    relatedAttributes: string[];
}

export interface PredictiveAlert {
    id: string;
    triggerDate: string;
    riskLevel: 'crítico' | 'moderado' | 'bajo';
    patternDetected: string;
    missionProposal: {
        title: string;
        condition: string;
        bonusMultiplier: number;
    };
}

export interface EvolvedRank {
    baseRank: string;
    modifier: string;
    fullTitle: string;
    dominantStat: string;
    winRate: number;
}

const getAttributeForCategory = (cat: string) => {
    switch (cat) {
      case 'entrenamiento': return 'Fuerza';
      case 'estudio':
      case 'creativo':
      case 'pomodoro': return 'Mente';
      case 'clientes':
      case 'trabajo': return 'Mente';
      case 'comida':
      case 'descanso': return 'Energía';
      default: return 'Disciplina';
    }
};

const getAreaForCategory = (cat: string) => {
  const c = (cat || '').toLowerCase().trim();
  if (['entrenamiento', 'comida', 'ejercicio', 'salud', 'nutricion', 'fuerza', 'deporte', 'cuerpo'].includes(c)) return 'cuerpo';
  if (['estudio', 'trabajo', 'creativo', 'pomodoro', 'clientes', 'mente', 'lectura', 'foco'].includes(c)) return 'mente';
  if (['limpieza', 'rutina', 'habito', 'orden', 'vida', 'hogar', 'finanzas', 'organizacion'].includes(c)) return 'vida';
  if (['sueño', 'descanso', 'desconexion', 'meditacion', 'recuperacion'].includes(c)) return 'sueño';
  return 'todas';
};

export const useAdvancedIntelligence = (stats: PlayerStats, tasksByDate: Record<string, TaskItem[]>, pomodoroSessions: PomodoroSession[], heatmapArea: string = 'todas') => {
  return useMemo(() => {
    const todayStr = getTodayDateString();
    
    // 1. CALCULATE HEATMAP (Last 365 days)
    const heatmap: HeatmapNode[] = [];
    const dateArray = Array.from({ length: 365 }).map((_, i) => {
        return addDaysToDateString(todayStr, -(364 - i));
    });

    let maxXp = 1;
    
    const dailyData = dateArray.map(dateStr => {
      const dayTasks = tasksByDate[dateStr] || [];
      const dayPomodoros = pomodoroSessions.filter(p => p.date === dateStr);
      const finalized = stats.finalizedDays?.[dateStr];
      
      let filteredTasks = dayTasks.filter(t => t.completed || (t.isHabit && (t.currentCount || 0) > 0));
      let filteredPomos = dayPomodoros;
      
      if (heatmapArea !== 'todas' && heatmapArea !== 'sueño') {
         filteredTasks = filteredTasks.filter(t => getAreaForCategory(t.category) === heatmapArea);
         if (heatmapArea !== 'mente') filteredPomos = [];
      }

      const xpFromTasks = filteredTasks.reduce((sum, t) => sum + (t.awardedXp || t.xpReward || 0), 0);
      const xpFromPomodoros = filteredPomos.reduce((sum, p) => sum + (p.xpEarned || 0), 0);
      const xpFromFinalized = finalized?.bonusXp || 0;
      const totalXp = xpFromTasks + xpFromPomodoros + xpFromFinalized;
      const focusMinutes = filteredPomos.reduce((sum, p) => sum + (p.durationMinutes || 0), 0);
      
      if (heatmapArea !== 'sueño' && totalXp > maxXp) {
        maxXp = totalXp;
      }
      
      const attrCounts: Record<string, number> = { Fuerza: 0, Mente: 0, Energía: 0, Disciplina: 0, Estudio: 0 };
      filteredTasks.forEach(t => {
          const attr = getAttributeForCategory(t.category);
          attrCounts[attr] = (attrCounts[attr] || 0) + 1;
      });
      let dominant: any = null;
      let maxCount = 0;
      Object.entries(attrCounts).forEach(([attr, count]) => {
          if (count > maxCount) { maxCount = count; dominant = attr; }
      });
      return {
        dateStr,
        totalXp,
        focusMinutes,
        dominant,
        completedCount: filteredTasks.length,
        activeTasks: filteredTasks
      };
    });

    // Calculate intensity 0-4
    heatmap.push(...dailyData.map(d => {
        let intensity: 0|1|2|3|4 = 0;
        let label = `${d.dateStr} - ${d.totalXp} XP (${d.completedCount} actividades)`;
        
        if (heatmapArea === 'sueño') {
           const sleep = stats.sleepLogs?.[d.dateStr];
           if (sleep) {
              const hour = parseInt(sleep.bedtime.split(':')[0], 10);
              const duration = sleep.sleepDurationHours ?? 6;
              // Intensity 4 for >=7h or early bedtime (<=22), 3 for >=6h or 23h, 2 for >=5h, 1 for <5h
              if (duration >= 7 || (hour >= 19 && hour <= 22)) intensity = 4;
              else if (duration >= 6 || hour === 23) intensity = 3;
              else if (duration >= 5 || hour === 0) intensity = 2;
              else intensity = 1;
              const wakeStr = sleep.wakeTime ? ` → ${sleep.wakeTime}` : '';
              label = `${d.dateStr} - Dormir: ${sleep.bedtime}${wakeStr} (${duration}h descanso)`;
           } else {
              label = `${d.dateStr} - Sin registro de descanso`;
           }
        } else {
           if (d.totalXp > 0 || d.completedCount > 0) {
               const ratio = maxXp > 0 ? d.totalXp / maxXp : 0;
               if (ratio >= 0.75) intensity = 4;
               else if (ratio >= 0.5) intensity = 3;
               else if (ratio >= 0.25) intensity = 2;
               else intensity = 1;
           }
        }
        
        return {
            date: d.dateStr,
            totalXp: d.totalXp,
            focusMinutes: d.focusMinutes,
            intensity,
            dominantAttribute: d.dominant,
            label,
            completedCount: d.completedCount,
            activeTasks: d.activeTasks
        };
    }));

    // 2. CORRELATION ENGINE (Insights)
    const insights: BehavioralInsight[] = [];
    
    // Pattern 1: Sinergia Entrenamiento-Foco
    let daysTrained = 0;
    let focusOnTrainedDays = 0;
    let focusOnNonTrainedDays = 0;
    let daysNotTrained = 0;
    
    dailyData.forEach(d => {
       const dayTasks = tasksByDate[d.dateStr] || [];
       const trained = dayTasks.some(t => t.category === 'entrenamiento' && t.completed);
       if (trained) { daysTrained++; focusOnTrainedDays += d.focusMinutes; }
       else { daysNotTrained++; focusOnNonTrainedDays += d.focusMinutes; }
    });
    
    const avgFocusTrained = daysTrained > 0 ? focusOnTrainedDays / daysTrained : 0;
    const avgFocusNotTrained = daysNotTrained > 0 ? focusOnNonTrainedDays / daysNotTrained : 0;
    
    if (avgFocusTrained > avgFocusNotTrained * 1.2 && daysTrained >= 3) {
        insights.push({
            id: 'syn-entrenamiento-foco',
            type: 'synergy',
            title: 'Sinergia de Hierro',
            description: `Los días que entrenas, tu tiempo de foco aumenta un ${Math.round(((avgFocusTrained / avgFocusNotTrained) - 1) * 100)}%. Tu cuerpo potencia tu mente.`,
            confidenceScore: 0.85,
            relatedAttributes: ['Fuerza', 'Mente']
        });
    }

    // Pattern 2: Riesgo de Burnout
    const recentDays = dailyData.slice(-7); 
    let continuousMind = 0;
    let hasEnergyRecovery = false;
    
    recentDays.forEach(d => {
        const dayTasks = tasksByDate[d.dateStr] || [];
        const completed = dayTasks.filter(t => t.completed);
        const hasMind = completed.some(t => ['creativo', 'estudio', 'pomodoro'].includes(t.category));
        const hasRest = completed.some(t => ['comida', 'limpieza'].includes(t.category)); 
        if (hasMind) continuousMind++;
        if (hasRest) hasEnergyRecovery = true;
    });

    if (continuousMind >= 4 && !hasEnergyRecovery) {
        insights.push({
            id: 'warn-burnout',
            type: 'warning',
            title: 'Sobrecarga Cognitiva',
            description: 'Llevas 4 días o más drenando Mente/Estudio sin completar hábitos de Energía. Recupera antes de quemarte.',
            confidenceScore: 0.9,
            relatedAttributes: ['Mente', 'Energía']
        });
    }
    
    // Pattern 3: Efecto de Planificación (Parálisis)
    let overloadedDays = 0;
    let overloadedCompletion = 0;
    let normalDays = 0;
    let normalCompletion = 0;
    
    dailyData.forEach(d => {
       const dayTasks = tasksByDate[d.dateStr] || [];
       if (dayTasks.length === 0) return;
       const completed = dayTasks.filter(t => t.completed).length;
       const rate = completed / dayTasks.length;
       
       if (dayTasks.length >= 8) {
           overloadedDays++; overloadedCompletion += rate;
       } else {
           normalDays++; normalCompletion += rate;
       }
    });
    
    const avgOverload = overloadedDays > 0 ? overloadedCompletion / overloadedDays : 0;
    const avgNormal = normalDays > 0 ? normalCompletion / normalDays : 0;
    
    if (avgOverload < avgNormal * 0.8 && overloadedDays >= 3) {
        insights.push({
            id: 'warn-planning',
            type: 'bottleneck',
            title: 'Parálisis por Planificación',
            description: `Cuando programas 8 o más tareas, tu completitud cae un ${Math.round((1 - (avgOverload / avgNormal)) * 100)}%. Simplifica tus días.`,
            confidenceScore: 0.88,
            relatedAttributes: ['Disciplina']
        });
    }

    if (insights.length === 0) {
        insights.push({
            id: 'momentum-base',
            type: 'momentum',
            title: 'Estabilidad Analizada',
            description: 'Mantén el flujo actual de tareas. Aún recopilando datos suficientes para generar sinergias profundas.',
            confidenceScore: 1.0,
            relatedAttributes: ['Disciplina']
        });
    }

    // 3. PREDICTIVE ALERTS (Weekend Drop)
    const alerts: PredictiveAlert[] = [];
    let weekendXp = 0; let weekendCount = 0;
    let weekdayXp = 0; let weekdayCount = 0;
    dailyData.forEach(d => {
        const dateObj = new Date(d.dateStr);
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            weekendXp += d.totalXp; weekendCount++;
        } else {
            weekdayXp += d.totalXp; weekdayCount++;
        }
    });
    const avgWeekend = weekendCount > 0 ? weekendXp / weekendCount : 0;
    const avgWeekday = weekdayCount > 0 ? weekdayXp / weekdayCount : 0;

    if (avgWeekend < avgWeekday * 0.5 && weekdayCount > 10) {
        alerts.push({
            id: 'alert-weekend',
            triggerDate: todayStr,
            riskLevel: 'crítico',
            patternDetected: 'Caída drástica de XP durante el Fin de Semana.',
            missionProposal: {
                title: 'Misión Crítica: Muralla del Domingo',
                condition: 'Completa 3 tareas de Disciplina este fin de semana.',
                bonusMultiplier: 1.5
            }
        });
    }

    // 4. EVOLVED RANK
    const last30 = dailyData.slice(-30);
    const attrSums: Record<string, number> = { Fuerza: 0, Mente: 0, Energía: 0, Disciplina: 0, Estudio: 0 };
    let total30Tasks = 0;
    last30.forEach(d => {
        const dayTasks = tasksByDate[d.dateStr] || [];
        dayTasks.filter(t => t.completed).forEach(t => {
            attrSums[getAttributeForCategory(t.category)]++;
            total30Tasks++;
        });
    });
    let dominantAttr = 'Disciplina';
    let maxAttrCount = attrSums['Disciplina'] || 0;
    Object.entries(attrSums).forEach(([attr, count]) => {
        if (count > maxAttrCount) { maxAttrCount = count; dominantAttr = attr; }
    });
    const winRate = total30Tasks > 0 ? (maxAttrCount / total30Tasks) * 100 : 0;
    
    let modifier = '';
    if (winRate >= 35) {
        switch(dominantAttr) {
            case 'Fuerza': modifier = 'Berserker'; break;
            case 'Estudio': modifier = 'Erudito'; break;
            case 'Mente': modifier = 'Estratega'; break;
            case 'Energía': modifier = 'Inagotable'; break;
            case 'Disciplina': modifier = 'Paladín'; break;
        }
    } else {
        modifier = 'Equilibrado';
    }
    const evolvedRank: EvolvedRank = {
        baseRank: stats.rankTitle,
        modifier,
        fullTitle: modifier ? `${stats.rankTitle} - ${modifier}` : stats.rankTitle,
        dominantStat: dominantAttr,
        winRate: Math.round(winRate)
    };

    return { heatmap, insights, alerts, evolvedRank };
  }, [stats, tasksByDate, pomodoroSessions, heatmapArea]);
};
