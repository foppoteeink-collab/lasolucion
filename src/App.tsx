
import React, { useEffect } from 'react';
import { AppLayout } from './components/AppLayout';
import { TimerProvider } from './context/TimerContext';
import { useTaskStore } from './store/useTaskStore';
import { notificationService } from './utils/notifications';
import { getTodayDateString } from './utils/date';

export default function App() {
  const ensureTodayTasks = useTaskStore(s => s.ensureTodayTasks);

  useEffect(() => {
    ensureTodayTasks();

    // Iniciar el programador de notificaciones locales (PWA Push fallback)
    notificationService.startLocalPushScheduler(() => {
      const state = useTaskStore.getState();
      const today = getTodayDateString();
      const tasksToday = state.tasksByDate[today] || [];
      return tasksToday
        .filter(t => (t.isHabit || t.isQuickHabit) && !t.completed)
        .map(t => t.title);
    });
  }, [ensureTodayTasks]);

  return (
    <TimerProvider>
      <AppLayout />
    </TimerProvider>
  );
}
