import { useEffect, useMemo, useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTaskStore } from '../store/useTaskStore';
import { useUIStore } from '../store/useUIStore';
import { useAppStore } from '../store/useAppStore';
import { getTodayDateString, getTrustedNow, syncNetworkTime, getGlobalDayStartHour, setGlobalDayStartHour } from '../utils/date';
import { parseTimeToMinutes, parseEndTimeToMinutes, isQuickMicroHabit } from '../utils/timeUtils';
import * as gameEngine from '../engine/gameEngine';
import { safeLogEvent } from '../firebase';

export type DayCycleStatus = 'idle' | 'active_hidden' | 'ready_to_close' | 'finished';

const EMPTY_TASKS_ARRAY: any[] = [];

/**
 * Calculates current minutes in the logical 24h+ timeline of the day.
 * Hours before the daily cutoff hour are projected (+24h) to remain attached
 * chronologically to the shift of the previous calendar day.
 */
export const getLogicalNowMinutes = (d: Date = getTrustedNow(), cutoffHour = getGlobalDayStartHour()): number => {
  const h = d.getHours();
  const m = d.getMinutes();
  return (h < cutoffHour ? h + 24 : h) * 60 + m;
};

/**
 * Calculates milliseconds remaining until the exact next cutoff hour local time boundary,
 * based on trusted network time.
 */
export const getMsUntilNextCutoff = (cutoffHour: number = getGlobalDayStartHour(), now: Date = getTrustedNow()): number => {
  const nextCutoff = new Date(now.getTime());
  if (now.getHours() >= cutoffHour) {
    nextCutoff.setDate(nextCutoff.getDate() + 1);
  }
  nextCutoff.setHours(cutoffHour, 0, 0, 0);
  return Math.max(1000, nextCutoff.getTime() - now.getTime());
};

/**
 * Backward-compatible alias for 3:00 AM cutoff tests and historical calls.
 */
export const getMsUntilNext3AM = (now: Date = getTrustedNow()): number => {
  return getMsUntilNextCutoff(3, now);
};

export const useDayCycle = () => {
  const configuredDayStartHour = usePlayerStore((s) => s.stats.dayStartHour);
  const activeCutoffHour = configuredDayStartHour !== undefined ? configuredDayStartHour : getGlobalDayStartHour();

  // Keep global date cutoff in sync with store
  useEffect(() => {
    if (configuredDayStartHour !== undefined && configuredDayStartHour !== getGlobalDayStartHour()) {
      setGlobalDayStartHour(configuredDayStartHour);
    }
  }, [configuredDayStartHour]);

  const [activeDateKey, setActiveDateKey] = useState<string>(() => getTodayDateString(undefined, activeCutoffHour));
  const today = activeDateKey;

  // Atomic selectors for PlayerStore
  const isFinished = usePlayerStore((s) => Boolean(s.stats.finalizedDays?.[today]));
  const todaySleep = usePlayerStore((s) => s.stats.sleepLogs?.[today]);

  // Atomic selectors for TaskStore
  const todayTasks = useTaskStore((s) => s.tasksByDate[today] || EMPTY_TASKS_ARRAY);
  const isStartedInStore = useTaskStore((s) => Boolean(s.startedDays?.[today]));

  // App & UI Store
  const notificationSettings = useAppStore((s) => s.notificationSettings);
  const setModalState = useUIStore((s) => s.setModalState);

  // Optimistic flag
  const [justStartedDate, setJustStartedDate] = useState<string | null>(null);

  const [logicalMinutes, setLogicalMinutes] = useState<number>(() => getLogicalNowMinutes(undefined, activeCutoffHour));

  useEffect(() => {
    let timerCutoff: ReturnType<typeof setTimeout> | null = null;

    // Sincronizar offset de hora de red inmediatamente al montar
    void syncNetworkTime().catch(() => {});

    const updateClock = () => {
      const trustedNow = getTrustedNow();
      const nextLogicalMinutes = getLogicalNowMinutes(trustedNow, activeCutoffHour);
      setLogicalMinutes((prev) => (prev === nextLogicalMinutes ? prev : nextLogicalMinutes));
      const currentToday = getTodayDateString(trustedNow, activeCutoffHour);
      setActiveDateKey((prev) => {
        if (prev !== currentToday) {
          // Exact Date Flip across the cutoff boundary!
          useTaskStore.getState().ensureTodayTasks();
          return currentToday;
        }
        return prev;
      });
    };

    const schedulePrecisionTimer = () => {
      if (timerCutoff) clearTimeout(timerCutoff);
      const msUntilCutoff = getMsUntilNextCutoff(activeCutoffHour);
      timerCutoff = setTimeout(() => {
        updateClock();
        schedulePrecisionTimer();
      }, msUntilCutoff + 50);
    };

    const interval = setInterval(updateClock, 15000);
    schedulePrecisionTimer();

    const handleFocusOrOnline = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      updateClock();
      void syncNetworkTime().then(() => updateClock());
    };

    window.addEventListener('focus', handleFocusOrOnline);
    document.addEventListener('visibilitychange', handleFocusOrOnline);
    window.addEventListener('online', handleFocusOrOnline);

    return () => {
      clearInterval(interval);
      if (timerCutoff) clearTimeout(timerCutoff);
      window.removeEventListener('focus', handleFocusOrOnline);
      document.removeEventListener('visibilitychange', handleFocusOrOnline);
      window.removeEventListener('online', handleFocusOrOnline);
    };
  }, [activeCutoffHour]);

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
      const configuredMorningMin = parseTimeToMinutes(notificationSettings?.morningReminderTime || '06:00');
      const fallbackMorningMin = configuredMorningMin !== 9999 ? configuredMorningMin : 6 * 60;
      const baseWorkStartMin = earliestStartMin < 9999
        ? Math.min(earliestStartMin, fallbackMorningMin)
        : fallbackMorningMin;
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

    const configuredNightlyMin = parseTimeToMinutes(notificationSettings?.nightlyReflectionTime || '21:00');
    const fallbackEndMin = configuredNightlyMin !== 9999 ? configuredNightlyMin : 21 * 60;
    const configuredEndMin = latestEndMin > 0 ? latestEndMin : fallbackEndMin;
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
    safeLogEvent('day_cycle_transition', { to_status: 'started', date: today });
  };

  const finishDay = () => {
    setModalState('isFinishDayOpen', true);
    safeLogEvent('day_cycle_transition', { to_status: 'finish_modal_opened', date: today });
  };

  return { dayStatus, startDay, finishDay };
};
