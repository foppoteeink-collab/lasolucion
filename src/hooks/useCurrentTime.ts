import { useState, useEffect } from 'react';

/**
 * Hook de pulso cronológico optimizado (Green IT & Battery Saver)
 * 
 * - Mantiene un reloj en tiempo real con un intervalo configurable.
 * - Pausa automáticamente las actualizaciones cuando el documento está oculto
 *   (`document.hidden`), evitando el drenaje innecesario de batería y ciclos de CPU.
 * - Al volver a enfocarse la pestaña, sincroniza inmediatamente la hora actual.
 */
export function useCurrentTime(intervalMs: number = 30000): Date {
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    let timerId: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      setCurrentTime(new Date());
    };

    const startTimer = () => {
      if (!timerId) {
        timerId = setInterval(tick, intervalMs);
      }
    };

    const stopTimer = () => {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopTimer();
      } else {
        tick(); // Actualización inmediata al volver a la vista
        startTimer();
      }
    };

    if (!document.hidden) {
      startTimer();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs]);

  return currentTime;
}
