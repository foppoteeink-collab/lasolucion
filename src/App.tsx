
import React, { useEffect } from 'react';
import { AppLayout } from './components/AppLayout';
import { TimerProvider } from './context/TimerContext';
import { useTaskStore } from './store/useTaskStore';

export default function App() {
  const ensureTodayTasks = useTaskStore(s => s.ensureTodayTasks);

  useEffect(() => {
    ensureTodayTasks();
  }, [ensureTodayTasks]);

  return (
    <TimerProvider>
      <AppLayout />
    </TimerProvider>
  );
}
