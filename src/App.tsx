
import React, { useEffect, useRef } from 'react';
import { AppLayout } from './components/AppLayout';
import { TimerProvider } from './context/TimerContext';
import { useTaskStore } from './store/useTaskStore';
import { usePlayerStore } from './store/usePlayerStore';
import { useAppStore } from './store/useAppStore';
import { notificationService } from './utils/notifications';
import { scheduleAll } from './utils/notificationScheduler';
import { getTodayDateString } from './utils/date';
import { requestPersistentStorage } from './utils/level3Systems';

const EMPTY_TASKS: any[] = [];

export default function App() {
  const ensureTodayTasks = useTaskStore(s => s.ensureTodayTasks);
  const todayStr = getTodayDateString();
  const todayTasks = useTaskStore(s => s.tasksByDate[todayStr] ?? EMPTY_TASKS);
  const streakDays = usePlayerStore(s => s.stats.streakDays);
  const isDayStarted = useTaskStore(s => Boolean(s.startedDays?.[todayStr]));
  const isDayFinished = usePlayerStore(s => Boolean(s.stats.finalizedDays?.[todayStr]));
  const reflections = useAppStore(s => s.reflections);
  const sleepLogs = usePlayerStore(s => s.stats.sleepLogs);
  const hasJournalEntry = Boolean(reflections?.[todayStr] || sleepLogs?.[todayStr]);
  const userName = usePlayerStore(s => s.stats.username || s.stats.fullName || '');
  const kaiName = usePlayerStore(s => s.stats.kaiName || s.stats.kaiCustomForm?.name || 'KAI');
  const dayStartHour = usePlayerStore(s => s.stats.dayStartHour ?? 8);
  const scheduledRef = useRef(false);

  useEffect(() => {
    ensureTodayTasks();

    // P0: Request persistent storage to protect against Safari WebKit 7-day eviction
    void requestPersistentStorage().then((persisted) => {
      if (persisted) {
        console.log('[Storage] WebKit/Blink Persistent Storage granted.');
      }
    }).catch(() => {});

    // Iniciar scheduler de notificaciones en tiempo real
    notificationService.startNotificationScheduler(() => {
      const today = getTodayDateString();
      const taskState = useTaskStore.getState();
      const appState = useAppStore.getState();
      const tasksToday = taskState.tasksByDate[today] || [];
      return {
        tasksToday,
        settings: appState.notificationSettings,
        addNotification: (n) => {
          appState.setNotifications(prev => [n, ...prev]);
        }
      };
    });

    // Scheduler de fallback (hourly interval)
    notificationService.startLocalPushScheduler(() => {
      const state = useTaskStore.getState();
      const today = getTodayDateString();
      const tasksToday = state.tasksByDate[today] || [];
      return tasksToday
        .filter(t => (t.isHabit || t.isQuickHabit) && !t.completed)
        .map(t => t.title);
    });
  }, [ensureTodayTasks]);

  // Re-programar notificaciones cuando cambian las tareas del día, jornada o racha
  useEffect(() => {
    scheduleAll({ 
      tasks: todayTasks, 
      streakDays,
      isDayStarted,
      isDayFinished,
      hasJournalEntry,
      dayStartHour,
      userName,
      kaiName
    });
  }, [todayTasks, streakDays, isDayStarted, isDayFinished, hasJournalEntry, dayStartHour, userName, kaiName]);

  return (
    <TimerProvider>
      <AppLayout />
    </TimerProvider>
  );
}
