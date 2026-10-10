import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { PomodoroSession, TaskCategory } from '../types';
import { soundFX } from '../utils/audio';
import { quantumSoundscape } from '../utils/quantumSoundscape';
import { notificationService } from '../utils/notifications';
import { getNotificationSettings } from '../utils/notificationScheduler';
import { getTodayDateString } from '../utils/date';
import { triggerShockwave } from '../utils/celebration';
import * as gameEngine from '../engine/gameEngine';
import { useUIStore } from '../store/useUIStore';
import { useAppStore } from '../store/useAppStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { safeGetItem, safeSetItem } from '../utils/storage';

export type PomodoroMode = 'work' | 'short_break' | 'long_break';

export const FOCUS_QUOTES = [
  "«La atención focalizada es la moneda más valiosa del siglo XXI.»",
  "«Un solo objetivo a la vez. El láser perfora porque concentra toda su energía.»",
  "«El estado de flujo no se espera, se construye en los primeros 5 minutos.»",
  "«Silencia el ruido exterior; tu obra maestra exige presencia total.»",
  "«La disciplina vence al talento cuando el talento no se enfoca.»",
  "«Respira hondo, mantén la calma y ejecuta con precisión quirúrgica.»",
];

const LOCAL_STORAGE_KEY = 'pomodoro_timer_background_state_v1';

export interface TimerContextType {
  // Modal visibility
  isPomodoroOpen: boolean;
  setIsPomodoroOpen: React.Dispatch<React.SetStateAction<boolean>>;
  pomodoroPreFill: { title: string; category: TaskCategory };
  setPomodoroPreFill: React.Dispatch<React.SetStateAction<{ title: string; category: TaskCategory }>>;
  handleOpenPomodoroForTask: (taskTitle: string, category: TaskCategory) => void;
  handlePomodoroComplete: (session: PomodoroSession) => void;

  // Running Timer State & Controls
  mode: PomodoroMode;
  taskTitle: string;
  setTaskTitle: (title: string) => void;
  category: TaskCategory;
  setCategory: (cat: TaskCategory) => void;

  WORK_TIME: number;
  SHORT_BREAK: number;
  LONG_BREAK: number;

  initialTimeLeft: number;
  timeLeft: number;
  formattedTime: string;
  progressPercent: number;
  isRunning: boolean;
  targetEndTime: number | null;
  completedPomodorosToday: number;

  // Ambient Sounds (Multi-Layer Mixer)
  ambientType: 'off' | 'rain' | 'fire' | 'forest' | 'heartbeat';
  activeAmbientLayers: ('rain' | 'fire' | 'forest' | 'heartbeat')[];
  ambientVolume: number;
  handleAmbientChange: (type: 'off' | 'rain' | 'fire' | 'forest' | 'heartbeat', forceOn?: boolean) => void;
  toggleAmbientLayer: (type: 'rain' | 'fire' | 'forest' | 'heartbeat') => void;
  handleVolumeChange: (vol: number) => void;

  // Timer Actions
  togglePlay: () => void;
  resetTimer: () => void;
  switchMode: (newMode: PomodoroMode) => void;
  quoteIndex: number;

  // Views
  isCockpitOpen: boolean;
  setIsCockpitOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSubtleView: boolean;
  setIsSubtleView: React.Dispatch<React.SetStateAction<boolean>>;
}

export const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
  triggerRewardPopup, checkLevelUp
} = gameEngine as any;
const stats = usePlayerStore(s => s.stats);
const setStats = usePlayerStore(s => s.setStats);
const setPomodoroSessions = useAppStore(s => s.setPomodoroSessions);
const setFocusModeActive = useUIStore(s => s.setFocusModeActive);

  const WORK_TIME = 25 * 60;
  const SHORT_BREAK = 5 * 60;
  const LONG_BREAK = 15 * 60;

  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [pomodoroPreFill, setPomodoroPreFill] = useState<{ title: string; category: TaskCategory }>({
    title: '',
    category: 'estudio',
  });

  const [mode, setMode] = useState<PomodoroMode>('work');
  const [taskTitle, setTaskTitle] = useState('Entrenamiento & Foco Creativo');
  const [category, setCategory] = useState<TaskCategory>('entrenamiento');

  const [initialTimeLeft, setInitialTimeLeft] = useState(WORK_TIME);
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [targetEndTime, setTargetEndTime] = useState<number | null>(null);

  const [completedPomodorosToday, setCompletedPomodorosToday] = useState(0);
  const [ambientType, setAmbientType] = useState<'off' | 'rain' | 'fire' | 'forest' | 'heartbeat'>('off');
  const [activeAmbientLayers, setActiveAmbientLayers] = useState<('rain' | 'fire' | 'forest' | 'heartbeat')[]>([]);
  const [ambientVolume, setAmbientVolume] = useState(0.6);
  const [isCockpitOpen, setIsCockpitOpen] = useState(false);
  const [isSubtleView, setIsSubtleView] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const originalDocumentTitleRef = useRef<string | null>(null);

  // Load persisted state from localStorage on mount
  useEffect(() => {
    try {
      const saved = safeGetItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          if (parsed.mode) setMode(parsed.mode);
          if (parsed.taskTitle) setTaskTitle(parsed.taskTitle);
          if (parsed.category) setCategory(parsed.category);
          if (parsed.initialTimeLeft) setInitialTimeLeft(parsed.initialTimeLeft);
          if (typeof parsed.completedPomodorosToday === 'number') setCompletedPomodorosToday(parsed.completedPomodorosToday);

          if (parsed.isRunning && parsed.targetEndTime) {
            const now = Date.now();
            if (parsed.targetEndTime > now) {
              const remaining = Math.max(0, Math.ceil((parsed.targetEndTime - now) / 1000));
              setTargetEndTime(parsed.targetEndTime);
              setTimeLeft(remaining);
              setIsRunning(true);
              setFocusModeActive(true);
            } else {
              // Timer completed while away
              setTimeLeft(0);
              setIsRunning(false);
              setTargetEndTime(null);
              setFocusModeActive(false);
            }
          } else if (typeof parsed.timeLeft === 'number') {
            setTimeLeft(parsed.timeLeft);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to restore pomodoro background state', e);
    }
  }, []);

  // Save state to localStorage on changes
  useEffect(() => {
    try {
      const stateToSave = {
        mode,
        taskTitle,
        category,
        initialTimeLeft,
        timeLeft,
        isRunning,
        targetEndTime,
        completedPomodorosToday,
      };
      safeSetItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      // ignore
    }
  }, [mode, taskTitle, category, initialTimeLeft, timeLeft, isRunning, targetEndTime, completedPomodorosToday]);

  // Handle Session Completion Logic
  const handlePomodoroComplete = useCallback((session: PomodoroSession) => {
    let { xpEarned, coinsEarned } = session;
    const getBonus = (val: number) => 1 + Math.floor(val / 10) * 0.05;

    // Pomodoros scale with Disciplina attribute
    if (stats?.attributes?.disciplina) {
      xpEarned = Math.ceil(xpEarned * getBonus(stats.attributes.disciplina));
    }

    const finalSession = { ...session, xpEarned, coinsEarned };

    if (setPomodoroSessions) {
      setPomodoroSessions((prev: PomodoroSession[]) => [finalSession, ...prev]);
    }
    if (checkLevelUp && setStats) {
      setStats((prevStats) => checkLevelUp(prevStats, xpEarned, coinsEarned));
    }
    if (triggerRewardPopup) {
      triggerRewardPopup(xpEarned, coinsEarned, '¡Pomodoro completado!');
    }
  }, [setPomodoroSessions, checkLevelUp, setStats, triggerRewardPopup, stats]);

  const handleFinishTimer = useCallback(() => {
    setIsRunning(false);
    setTargetEndTime(null);
    setFocusModeActive(false);

    if (mode === 'work') {
      soundFX.playWorkSessionCompleteAlarm();
      try {
        quantumSoundscape.playQuantumChime();
        const scState = quantumSoundscape.getState();
        if (scState.autoSyncPomodoro && scState.isPlaying) {
          quantumSoundscape.stop(1.5);
        }
      } catch (e) {}
      triggerShockwave({ color: 'cyan', intensity: 'medium' });

      const completedSession: PomodoroSession = {
        id: `pomo-${Date.now()}`,
        date: getTodayDateString(),
        durationMinutes: Math.round(initialTimeLeft / 60) || 25,
        taskTitle: taskTitle || 'Bloque de Foco',
        category: category,
        completedAt: new Date().toISOString(),
        xpEarned: 25,
        coinsEarned: 8,
      };

      setCompletedPomodorosToday((prev) => prev + 1);
      handlePomodoroComplete(completedSession);
      setQuoteIndex((prev) => (prev + 1) % FOCUS_QUOTES.length);

      // Respetar el toggle de Pomodoro en la configuración de notificaciones
      if (getNotificationSettings().pomodoroComplete) {
        notificationService.triggerNotification(
          '¡Pomodoro de 25m Completado! 🏆',
          `Has ganado +25 XP y +8 Monedas por enfocarte en "${taskTitle}". ¡Tómate un merecido descanso!`,
          '⏱️'
        );
      }

      setMode('short_break');
      setInitialTimeLeft(SHORT_BREAK);
      setTimeLeft(SHORT_BREAK);
    } else {
      soundFX.playBreakCompleteAlarm();
      notificationService.triggerNotification(
        '¡Tiempo de descanso terminado! ⚡',
        'Tu energía cognitiva se ha restablecido. ¿Listo para el siguiente bloque de foco?',
        '🔔'
      );
      setMode('work');
      setInitialTimeLeft(WORK_TIME);
      setTimeLeft(WORK_TIME);
    }
  }, [mode, taskTitle, category, initialTimeLeft, SHORT_BREAK, WORK_TIME, handlePomodoroComplete]);

  // Main Background Tick Interval (500ms for high precision RTC)
  useEffect(() => {
    if (!originalDocumentTitleRef.current) {
      originalDocumentTitleRef.current = document.title;
    }

    let intervalId: number | null = null;

    if (isRunning && targetEndTime) {
      intervalId = window.setInterval(() => {
        const now = Date.now();
        const remainingMs = targetEndTime - now;
        const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

        setTimeLeft(remainingSec);

        // Update document tab title in background tab
        const mins = Math.floor(remainingSec / 60);
        const secs = remainingSec % 60;
        const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        document.title = `⏱️ ${formatted} - ${taskTitle || 'Modo Foco'}`;

        if (remainingSec <= 0) {
          if (intervalId) clearInterval(intervalId);
          handleFinishTimer();
        }
      }, 500);
    } else {
      // Restore title when paused or stopped
      if (originalDocumentTitleRef.current) {
        document.title = originalDocumentTitleRef.current;
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, targetEndTime, taskTitle, handleFinishTimer]);

  // Handle visibility change / tab focus recalibration
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (isRunning && targetEndTime) {
        const now = Date.now();
        const remainingMs = targetEndTime - now;
        const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
        setTimeLeft(remainingSec);

        if (remainingSec <= 0) {
          handleFinishTimer();
        }
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [isRunning, targetEndTime, handleFinishTimer]);

  const handleOpenPomodoroForTask = (newTitle: string, newCategory: TaskCategory) => {
    soundFX.playClick();
    setPomodoroPreFill({ title: newTitle, category: newCategory });
    setTaskTitle(newTitle);
    setCategory(newCategory);
    setIsPomodoroOpen(true);
    
  };

  const syncAmbientState = () => {
    const layers = soundFX.getActiveAmbientLayers();
    setActiveAmbientLayers(layers);
    setAmbientType(layers.length > 0 ? layers[layers.length - 1] : 'off');
  };

  const toggleAmbientLayer = (type: 'rain' | 'fire' | 'forest' | 'heartbeat') => {
    soundFX.toggleAmbientLayer(type, ambientVolume);
    syncAmbientState();
  };

  const handleAmbientChange = (type: 'off' | 'rain' | 'fire' | 'forest' | 'heartbeat', forceOn = false) => {
    if (type === 'off') {
      soundFX.stopAmbientSound();
      setActiveAmbientLayers([]);
      setAmbientType('off');
      return;
    }
    if (forceOn) {
      soundFX.startAmbientLayer(type, ambientVolume);
    } else {
      soundFX.toggleAmbientLayer(type, ambientVolume);
    }
    syncAmbientState();
  };

  const handleVolumeChange = (vol: number) => {
    setAmbientVolume(vol);
    soundFX.setAmbientVolume(vol);
  };

  const togglePlay = () => {
    soundFX.playClick();
    if (notificationService.isSupported()) {
      notificationService.requestPermission();
    }

    if (!isRunning) {
      const newTarget = Date.now() + timeLeft * 1000;
      setTargetEndTime(newTarget);
      setIsRunning(true);
      setFocusModeActive(true);

      // Auto-start Quantum Soundscape ONLY if enabled, in work mode, and NO natural sound is playing
      try {
        const scState = quantumSoundscape.getState();
        if (scState.autoSyncPomodoro && !scState.isPlaying && mode === 'work' && activeAmbientLayers.length === 0) {
          quantumSoundscape.start(1.8);
        }
      } catch (e) {}
    } else {
      setIsRunning(false);
      setTargetEndTime(null);
      setFocusModeActive(false);

      // Auto-pause Quantum Soundscape if enabled
      try {
        const scState = quantumSoundscape.getState();
        if (scState.autoSyncPomodoro && scState.isPlaying) {
          quantumSoundscape.stop(1.2);
        }
      } catch (e) {}
    }
  };

  const resetTimer = () => {
    soundFX.playClick();
    setFocusModeActive(false);
    
    // Auto-stop Quantum Soundscape if active
    try {
      const scState = quantumSoundscape.getState();
      if (scState.autoSyncPomodoro && scState.isPlaying) {
        quantumSoundscape.stop(1.0);
      }
    } catch (e) {}

    // PENALIZACIÓN EN TIEMPO REAL: Si abandona un foco activo
    if (mode === 'work' && timeLeft < initialTimeLeft) {
      const damage = 15;
      usePlayerStore.getState().takeDamage(damage);
      soundFX.playClick();
      window.dispatchEvent(new CustomEvent('player-damage', { detail: { amount: damage, reason: `Foco roto en: ${taskTitle}` } }));
      notificationService.triggerNotification(
        '¡Foco Roto! 💔',
        `Has perdido ${damage} HP por abandonar tu sesión de concentración.`,
        '🩸'
      );
    }
    
    setIsRunning(false);
    setTargetEndTime(null);
    setTimeLeft(initialTimeLeft);
  };

  const switchMode = (newMode: PomodoroMode) => {
    soundFX.playClick();
    setIsRunning(false);
    setTargetEndTime(null);
    setFocusModeActive(false);
    setMode(newMode);

    // Auto-stop soundscape if switching to break
    try {
      const scState = quantumSoundscape.getState();
      if (scState.autoSyncPomodoro && scState.isPlaying && newMode !== 'work') {
        quantumSoundscape.stop(1.0);
      }
    } catch (e) {}

    let newDuration = WORK_TIME;
    if (newMode === 'short_break') newDuration = SHORT_BREAK;
    else if (newMode === 'long_break') newDuration = LONG_BREAK;

    setInitialTimeLeft(newDuration);
    setTimeLeft(newDuration);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = Math.min(100, Math.max(0, Math.round(((initialTimeLeft - timeLeft) / initialTimeLeft) * 100)));

  return (
    <TimerContext.Provider
      value={{
        isPomodoroOpen,
        setIsPomodoroOpen,
        pomodoroPreFill,
        setPomodoroPreFill,
        handleOpenPomodoroForTask,
        handlePomodoroComplete,

        mode,
        taskTitle,
        setTaskTitle,
        category,
        setCategory,

        WORK_TIME,
        SHORT_BREAK,
        LONG_BREAK,

        initialTimeLeft,
        timeLeft,
        formattedTime,
        progressPercent,
        isRunning,
        targetEndTime,
        completedPomodorosToday,

        ambientType,
        activeAmbientLayers,
        ambientVolume,
        handleAmbientChange,
        toggleAmbientLayer,
        handleVolumeChange,

        togglePlay,
        resetTimer,
        switchMode,
        quoteIndex,

        isCockpitOpen,
        setIsCockpitOpen,
        isSubtleView,
        setIsSubtleView,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
