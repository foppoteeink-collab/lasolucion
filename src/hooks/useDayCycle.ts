import { useEffect, useMemo, useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTaskStore } from '../store/useTaskStore';
import { useUIStore } from '../store/useUIStore';
import { useAppStore } from '../store/useAppStore';
import { getTodayDateString } from '../utils/date';
import { parseTimeToMinutes, parseEndTimeToMinutes, isQuickMicroHabit } from '../utils/timeUtils';
import * as gameEngine from '../engine/gameEngine';

export type DayCycleStatus = 'idle' | 'active_hidden' | 'ready_to_close' | 'finished';

const EMPTY_TASKS_ARRAY: any[] = [];

/**
 * Calculates current minutes in the logical 24h+ timeline of the day.
 * If the current time is between 00:00 and 02:59 AM, it is within the night-owl
 * grace period of the previous calendar day, so hours are projected as (h + 24).
 * Example: 01:30 AM -> (1 + 24) * 60 + 30 = 1530 min.
 */
export const getLogicalNowMinutes = (d: Date = new Date()): number => {
  const h = d.getHours();
  const m = d.getMinutes();
  return (h < 3 ? h + 24 : h) * 60 + m;
};

export const useDayCycle = () => {
  const today = getTodayDateString();

  // Atomic selectors for PlayerStore to prevent re-renders on XP/coins/HP changes
  const isFinished = usePlayerStore((s) => Boolean(s.stats.finalizedDays?.[today]));
  const todaySleep = usePlayerStore((s) => s.stats.sleepLogs?.[today]);

  // Atomic selectors for TaskStore
  const todayTasks = useTaskStore((s) => s.tasksByDate[today] || EMPTY_TASKS_ARRAY);
  const isStartedInStore = useTaskStore((s) => Boolean(s.startedDays?.[today]));

  // App & UI Store
  const notificationSettings = useAppStore((s) => s.notificationSettings);
  const setModalState = useUIStore((s) => s.setModalState);

  // Optimistic flag so clicking 'Iniciar Jornada' hides the button in 0ms
  const [justStartedDate, setJustStartedDate] = useState<string | null>(null);

  const [logicalMinutes, setLogicalMinutes] = useState<number>(() => getLogicalNowMinutes());

  useEffect(() => {
    const updateClock = () => {
      setLogicalMinutes(getLogicalNowMinutes());
    };
    const interval = setInterval(updateClock, 15000);
    window.addEventListener('focus', updateClock);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', updateClock);
    };
  }, []);

  const dayStatus: DayCycleStatus = useMemo(() => {
    if (isFinished) return 'finished';

    const isStarted = Boolean(
      justStartedDate === today ||
      isStartedInStore ||
      todaySleep?.wakeTime ||
      todaySleep?.completedAt
    );

    const agendaTasks = todayTasks.filter((t) => t && t.title && !isQuickMicroHabit(t));

    // Calcular hora de inicio y fin laboral según bloques horarios o configuración del usuario
    let earliestStartMin = 9999;
    let latestEndMin = -1;

    for (const task of agendaTasks) {
      if (!task.timeBlock) continue;
      const startMin = parseTimeToMinutes(task.timeBlock);
      if (startMin === 9999) continue;
      if (startMin < earliestStartMin) {
        earliestStartMin = startMin;
      }
      let endMin = parseEndTimeToMinutes(task.timeBlock);
      if (endMin === 9999 || endMin <= startMin) {
        endMin = Math.min(1439, startMin + 60);
      }
      if (endMin > latestEndMin) {
        latestEndMin = endMin;
      }
    }

    if (!isStarted) {
      // Hora de inicio configurada: primer bloque horario del día o recordatorio matutino (por defecto 06:00 AM)
      const configuredMorningMin = parseTimeToMinutes(notificationSettings?.morningReminderTime || '06:00');
      const fallbackMorningMin = configuredMorningMin !== 9999 ? configuredMorningMin : 6 * 60;
      const baseWorkStartMin = earliestStartMin < 9999
        ? Math.min(earliestStartMin, fallbackMorningMin)
        : fallbackMorningMin;
      // Aparece dinámicamente al inicio de la hora laboral (con ventana previa de 15 min)
      const startThresholdMin = Math.max(0, baseWorkStartMin - 15);

      if (logicalMinutes >= startThresholdMin) {
        return 'idle';
      }
      return 'active_hidden';
    }

    // Día ya iniciado: si completó el 100% de las misiones de la agenda de hoy, permitir cerrar jornada
    if (agendaTasks.length > 0 && agendaTasks.every((t) => t.completed)) {
      return 'ready_to_close';
    }

    // Hora de finalización configurada: fin de la última tarea programada o reflexión nocturna configurada (por defecto 21:00)
    const configuredNightlyMin = parseTimeToMinutes(notificationSettings?.nightlyReflectionTime || '21:00');
    const fallbackEndMin = configuredNightlyMin !== 9999 ? configuredNightlyMin : 21 * 60;
    const configuredEndMin = latestEndMin > 0 ? latestEndMin : fallbackEndMin;

    // Umbral: 20 minutos antes de la hora de finalización configurada (ventana de 15-20 min previos)
    const closeThresholdMin = Math.max(0, configuredEndMin - 20);

    if (logicalMinutes >= closeThresholdMin) {
      return 'ready_to_close';
    }

    return 'active_hidden';
  }, [isFinished, todaySleep, isStartedInStore, todayTasks, notificationSettings, today, logicalMinutes, justStartedDate]);

  const startDay = () => {
    setJustStartedDate(today);
    useTaskStore.getState().startDay(today);
    gameEngine.handleRegisterWakeUp(today);
  };

  const finishDay = () => {
    setModalState('isFinishDayOpen', true);
  };

  return { dayStatus, startDay, finishDay };
};
