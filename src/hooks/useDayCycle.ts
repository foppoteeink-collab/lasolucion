import { useEffect, useMemo, useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTaskStore } from '../store/useTaskStore';
import { useUIStore } from '../store/useUIStore';
import { useAppStore } from '../store/useAppStore';
import { getTodayDateString } from '../utils/date';
import { parseTimeToMinutes, parseEndTimeToMinutes, isQuickMicroHabit } from '../utils/timeUtils';
import * as gameEngine from '../engine/gameEngine';

export type DayCycleStatus = 'idle' | 'active_hidden' | 'ready_to_close' | 'finished';

export const useDayCycle = () => {
  const stats = usePlayerStore((s) => s.stats);
  const tasksByDate = useTaskStore((s) => s.tasksByDate);
  const startedDays = useTaskStore((s) => s.startedDays);
  const notificationSettings = useAppStore((s) => s.notificationSettings);
  const setModalState = useUIStore((s) => s.setModalState);
  const today = getTodayDateString();

  // Optimistic flag so clicking 'Iniciar Jornada' hides the button in 0ms
  const [justStartedDate, setJustStartedDate] = useState<string | null>(null);

  const [nowMinutes, setNowMinutes] = useState<number>(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  useEffect(() => {
    const updateClock = () => {
      const d = new Date();
      setNowMinutes(d.getHours() * 60 + d.getMinutes());
    };
    const interval = setInterval(updateClock, 15000);
    window.addEventListener('focus', updateClock);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', updateClock);
    };
  }, []);

  const dayStatus: DayCycleStatus = useMemo(() => {
    const isFinished = Boolean(stats.finalizedDays?.[today]);
    if (isFinished) return 'finished';

    const todaySleep = stats.sleepLogs?.[today];
    const isStarted = Boolean(
      justStartedDate === today ||
      startedDays?.[today] ||
      todaySleep?.wakeTime ||
      todaySleep?.completedAt
    );

    const todayTasks = tasksByDate[today] || [];
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

      if (nowMinutes >= startThresholdMin) {
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

    if (nowMinutes >= closeThresholdMin) {
      return 'ready_to_close';
    }

    return 'active_hidden';
  }, [stats.sleepLogs, stats.finalizedDays, startedDays, tasksByDate, notificationSettings, today, nowMinutes, justStartedDate]);

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
