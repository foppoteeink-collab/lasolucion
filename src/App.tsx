
import React, { useEffect, useRef } from 'react';
import { AppLayout } from './components/AppLayout';
import { TimerProvider } from './context/TimerContext';
import { useTaskStore } from './store/useTaskStore';
import { usePlayerStore } from './store/usePlayerStore';
import { useAppStore } from './store/useAppStore';
import { notificationService } from './utils/notifications';
import { scheduleAll } from './utils/notificationScheduler';
import { getTodayDateString } from './utils/date';

export default function App() {
  const ensureTodayTasks = useTaskStore(s => s.ensureTodayTasks);
  const todayTasks = useTaskStore(s => s.tasksByDate[getTodayDateString()] || []);
  const streakDays = usePlayerStore(s => s.stats.streakDays);
  const scheduledRef = useRef(false);

  useEffect(() => {
    ensureTodayTasks();

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

  // Re-programar notificaciones cuando cambian las tareas del día o la racha
  useEffect(() => {
    if (todayTasks.length === 0 && !scheduledRef.current) return;
    scheduledRef.current = true;

    scheduleAll({ tasks: todayTasks, streakDays });
  }, [todayTasks, streakDays]);

  return (
    <TimerProvider>
      <AppLayout />
    </TimerProvider>
  );
}
