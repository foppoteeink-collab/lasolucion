import { PlayerStats, TaskItem, CustomHabit, PomodoroSession, FinancialTransaction, HabitMasteryRecord, TaskCategory, PriorityLevel } from '../types';
import { getTodayDateString, addDaysToDateString } from './date';
import { getRankForLevel, getRequiredXpForLevel } from '../data/defaults';
import { safeSetItem } from './storage';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTaskStore } from '../store/useTaskStore';
import { useAppStore } from '../store/useAppStore';

const BACKUP_STORAGE_KEY = 'taskquest_real_user_backup';
const SIMULATION_ACTIVE_KEY = 'taskquest_simulation_active';
const SIMULATION_NAME_KEY = 'taskquest_simulation_name';
const SIMULATION_DAYS_KEY = 'taskquest_simulation_days';

export interface SimulatedScenarioConfig {
  id: string;
  name: string;
  avatar: string;
  archetype: string;
  characterClass: string;
  days: number;
  consistencyRate: number; // 0.0 to 1.0 (e.g. 1.0 = 100%, 0.7 = 70%)
  sleepPattern: 'early' | 'night_owl' | 'mixed';
  description: string;
  tagline: string;
  highlights: string[];
}

export interface UserBackupSnapshot {
  stats: PlayerStats;
  tasksByDate: Record<string, TaskItem[]>;
  customHabits: CustomHabit[];
  habitMastery: Record<string, HabitMasteryRecord>;
  pomodoroSessions: PomodoroSession[];
  expenses: FinancialTransaction[];
  reflections?: Record<string, string>;
  savedAt: string;
}

/**
 * Check if the application is currently running a simulated scenario
 */
export const isSimulationActive = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SIMULATION_ACTIVE_KEY) === 'true';
};

export const getSimulationDetails = () => {
  if (typeof window === 'undefined') return null;
  if (!isSimulationActive()) return null;
  return {
    name: localStorage.getItem(SIMULATION_NAME_KEY) || 'Operador Simulado',
    days: parseInt(localStorage.getItem(SIMULATION_DAYS_KEY) || '14', 10),
  };
};

/**
 * Creates a safe snapshot of the real user data before applying any simulation
 */
export const backupRealUserData = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Do not overwrite an existing real backup if already in simulation mode
  if (isSimulationActive() && localStorage.getItem(BACKUP_STORAGE_KEY)) {
    return true;
  }

  try {
    const playerStats = usePlayerStore.getState().stats;
    const taskState = useTaskStore.getState();
    const appState = useAppStore.getState();

    const snapshot: UserBackupSnapshot = {
      stats: playerStats,
      tasksByDate: taskState.tasksByDate,
      customHabits: taskState.customHabits,
      habitMastery: appState.habitMastery,
      pomodoroSessions: appState.pomodoroSessions,
      expenses: appState.expenses,
      reflections: appState.reflections,
      savedAt: new Date().toISOString()
    };

    safeSetItem(BACKUP_STORAGE_KEY, JSON.stringify(snapshot));
    return true;
  } catch (err) {
    console.error('Error creating real user backup:', err);
    return false;
  }
};

/**
 * Restores the user's authentic personal profile and resumes cloud sync
 */
export const restoreRealUserData = (): boolean => {
  if (typeof window === 'undefined') return false;

  const rawBackup = localStorage.getItem(BACKUP_STORAGE_KEY);
  if (!rawBackup) {
    // If no backup exists, just deactivate simulation flags
    localStorage.removeItem(SIMULATION_ACTIVE_KEY);
    localStorage.removeItem(SIMULATION_NAME_KEY);
    localStorage.removeItem(SIMULATION_DAYS_KEY);
    (window as any).__isSimulationActive = false;
    window.dispatchEvent(new CustomEvent('taskquest:simulation-changed'));
    return false;
  }

  try {
    const snapshot: UserBackupSnapshot = JSON.parse(rawBackup);

    // 1. Deactivate simulation flags
    localStorage.removeItem(SIMULATION_ACTIVE_KEY);
    localStorage.removeItem(SIMULATION_NAME_KEY);
    localStorage.removeItem(SIMULATION_DAYS_KEY);
    localStorage.removeItem(BACKUP_STORAGE_KEY);
    (window as any).__isSimulationActive = false;

    // 2. Hydrate authentic stores
    if (snapshot.stats) usePlayerStore.getState().setStats(snapshot.stats);
    if (snapshot.tasksByDate) useTaskStore.getState().setTasksByDate(snapshot.tasksByDate);
    if (snapshot.customHabits) useTaskStore.getState().setCustomHabits(snapshot.customHabits);
    if (snapshot.habitMastery) useAppStore.getState().setHabitMastery(snapshot.habitMastery);
    if (snapshot.pomodoroSessions) useAppStore.getState().setPomodoroSessions(snapshot.pomodoroSessions);
    if (snapshot.expenses) useAppStore.getState().setExpenses(snapshot.expenses);
    if (snapshot.reflections) useAppStore.getState().setReflections(snapshot.reflections);

    window.dispatchEvent(new CustomEvent('taskquest:simulation-changed'));
    return true;
  } catch (err) {
    console.error('Error restoring real user data:', err);
    return false;
  }
};

/**
 * Procedural Real Tasks Library
 */
interface RealTaskTemplate {
  title: string;
  category: TaskCategory;
  priority: PriorityLevel;
  timeBlock: string;
  xpReward: number;
  coinReward: number;
  incomeAmount?: number;
  description: string;
  isHabit?: boolean;
  targetCount?: number;
  unit?: string;
  quickIcon?: string;
}

const DAILY_HABIT_TEMPLATES: CustomHabit[] = [
  {
    id: 'sim_habit_workout',
    title: 'Entrenamiento & Acondicionamiento Físico',
    category: 'entrenamiento',
    frequencyType: 'daily',
    xpReward: 35,
    coinReward: 20,
    timeBlock: '07:00 - 08:15',
    targetCount: 1,
    isQuickHabit: true,
    quickIcon: 'Dumbbell',
    unit: 'sesión'
  },
  {
    id: 'sim_habit_deepwork',
    title: 'Bloque de Foco Profundo (Sin distracciones)',
    category: 'pomodoro',
    frequencyType: 'daily',
    xpReward: 40,
    coinReward: 25,
    timeBlock: '09:30 - 11:30',
    targetCount: 2,
    isQuickHabit: true,
    quickIcon: 'Timer',
    unit: 'bloques'
  },
  {
    id: 'sim_habit_reading',
    title: 'Lectura Técnica & Expansión Cognitiva',
    category: 'estudio',
    frequencyType: 'daily',
    xpReward: 25,
    coinReward: 15,
    timeBlock: '20:30 - 21:15',
    targetCount: 20,
    isQuickHabit: true,
    quickIcon: 'BookOpen',
    unit: 'páginas'
  },
  {
    id: 'sim_habit_hydration',
    title: 'Protocolo de Hidratación Celular (3L)',
    category: 'habito',
    frequencyType: 'daily',
    xpReward: 20,
    coinReward: 10,
    timeBlock: '08:00 - 20:00',
    targetCount: 6,
    isQuickHabit: true,
    quickIcon: 'Droplets',
    unit: 'vasos'
  },
  {
    id: 'sim_habit_review',
    title: 'Cierre y Auditoría Operativa Diaria',
    category: 'rutina',
    frequencyType: 'daily',
    xpReward: 20,
    coinReward: 10,
    timeBlock: '22:00 - 22:30',
    targetCount: 1,
    isQuickHabit: true,
    quickIcon: 'CheckSquare',
    unit: 'revisión'
  }
];

const WEEKDAY_REAL_TASKS_POOL: RealTaskTemplate[] = [
  {
    title: 'Entrega de Sprint y Revisión de Arquitectura con Cliente',
    category: 'clientes',
    priority: 'epica',
    timeBlock: '10:00 - 12:00',
    xpReward: 60,
    coinReward: 40,
    incomeAmount: 320,
    description: 'Demostración de entregables del hito 2, validación de endpoints y recepción de visto bueno de pago.'
  },
  {
    title: 'Auditoría Técnica y Corrección de Bugs Críticos',
    category: 'trabajo',
    priority: 'alta',
    timeBlock: '14:00 - 16:00',
    xpReward: 45,
    coinReward: 25,
    description: 'Revisión exhaustiva de logs del servidor, refactorización de consultas y pruebas de estrés.'
  },
  {
    title: 'Análisis Financiero Semanal y Conciliación de Cuentas',
    category: 'trabajo',
    priority: 'media',
    timeBlock: '16:30 - 17:30',
    xpReward: 30,
    coinReward: 20,
    incomeAmount: 150,
    description: 'Actualización de balances en tesorería, emisión de facturas y asignación a fondo de ahorro.'
  },
  {
    title: 'Despeje y Mantenimiento Ergonómico del Espacio de Trabajo',
    category: 'limpieza',
    priority: 'baja',
    timeBlock: '18:00 - 18:30',
    xpReward: 20,
    coinReward: 10,
    description: 'Organización física del escritorio, ventilación y purificación del entorno de alto rendimiento.'
  },
  {
    title: 'Estudio de Patrones de Diseño de Sistemas Distribuidos',
    category: 'estudio',
    priority: 'alta',
    timeBlock: '19:00 - 20:15',
    xpReward: 35,
    coinReward: 20,
    description: 'Lectura crítica de capítulos 4 y 5, toma de notas de arquitectura y diagramado conceptual.'
  },
  {
    title: 'Reunión de Sincronización Estratégica con Socio / Mentor',
    category: 'clientes',
    priority: 'media',
    timeBlock: '12:15 - 13:00',
    xpReward: 30,
    coinReward: 15,
    description: 'Revisión de objetivos mensuales, eliminación de cuellos de botella y priorización de misiones.'
  },
  {
    title: 'Diseño de Prototipo Creativo para Lanzamiento de Producto',
    category: 'creativo',
    priority: 'alta',
    timeBlock: '15:30 - 17:00',
    xpReward: 40,
    coinReward: 25,
    description: 'Modelado en baja fidelidad, definición de paleta tipográfica y flujo de usuario principal.'
  }
];

const WEEKEND_REAL_TASKS_POOL: RealTaskTemplate[] = [
  {
    title: 'Caminata de Recuperación Activa al Aire Libre (60 min)',
    category: 'entrenamiento',
    priority: 'media',
    timeBlock: '09:00 - 10:15',
    xpReward: 30,
    coinReward: 15,
    description: 'Exposición a luz solar matutina, desconexión de pantallas y oxigenación biológica.'
  },
  {
    title: 'Planificación Estratégica y Bloques de la Próxima Semana',
    category: 'rutina',
    priority: 'alta',
    timeBlock: '11:00 - 12:30',
    xpReward: 45,
    coinReward: 30,
    description: 'Auditoría de compromisos en calendario, estimación de presupuestos y metas de tesorería.'
  },
  {
    title: 'Preparación de Comidas Nutritivas para la Semana (Batch Cooking)',
    category: 'comida',
    priority: 'media',
    timeBlock: '16:00 - 18:00',
    xpReward: 35,
    coinReward: 20,
    description: 'Cocción de fuentes limpias de proteína, vegetales al vapor y porcionado para días laborales.'
  },
  {
    title: 'Limpieza Profunda y Purificación del Hogar',
    category: 'limpieza',
    priority: 'media',
    timeBlock: '14:00 - 15:30',
    xpReward: 35,
    coinReward: 20,
    description: 'Orden integral del entorno para iniciar la semana con mente despejada y sin fricción.'
  }
];

function rollDeterministic(a: number, b: number) {
  const seed = Math.sin(a * 17.1 + b * 23.4) * 10000;
  return seed - Math.floor(seed);
}

/**
 * Core Procedural Generator for Comprehensive Scenarios
 */
export const generateScenarioData = (config: SimulatedScenarioConfig) => {
  const todayStr = getTodayDateString();
  const tasksByDate: Record<string, TaskItem[]> = {};
  const pomodoroSessions: PomodoroSession[] = [];
  const finalizedDays: Record<string, any> = {};
  const sleepLogs: Record<string, any> = {};
  const expenses: FinancialTransaction[] = [];
  const reflections: Record<string, string> = {};
  const habitMastery: Record<string, HabitMasteryRecord> = {};

  let totalXpAccumulated = 0;
  let totalCoinsAccumulated = 200;
  let runningStreak = 0;
  let currentStreak = 0;
  const attributeGains = { disciplina: 0, fuerza: 0, mente: 0, energia: 0, estudio: 0 };

  // Generate each day backwards from config.days - 1 to 0 (today)
  for (let i = config.days - 1; i >= 0; i--) {
    const dateStr = addDaysToDateString(todayStr, -i);
    const dayOfWeek = (new Date(dateStr + 'T12:00:00').getDay() + 6) % 7; // 0 = Mon, 6 = Sun
    const isWeekend = dayOfWeek >= 5;

    // Determine performance for this specific day
    let daySuccessThreshold = config.consistencyRate;
    if (isWeekend && config.consistencyRate < 0.95) {
      // Real life weekend drop for realistic scenarios
      daySuccessThreshold = Math.max(0.35, config.consistencyRate - 0.28);
    }

    const dayTasks: TaskItem[] = [];
    let dayTotalCompleted = 0;

    // 1. Generate Core Daily Habits
    DAILY_HABIT_TEMPLATES.forEach((h, hIdx) => {
      const seed = Math.sin(i * 11 + hIdx * 7) * 10000;
      const roll = seed - Math.floor(seed);
      const isCompleted = roll <= daySuccessThreshold;

      let currentCount = 0;
      if (isCompleted) {
        currentCount = h.targetCount || 1;
        dayTotalCompleted++;
      } else if (h.targetCount && h.targetCount > 1 && roll <= daySuccessThreshold + 0.25) {
        currentCount = Math.floor((h.targetCount || 1) * 0.5);
      }

      const awardedXp = isCompleted ? h.xpReward : (currentCount > 0 ? Math.floor(h.xpReward * 0.4) : 0);
      const awardedCoins = isCompleted ? h.coinReward : 0;

      totalXpAccumulated += awardedXp;
      totalCoinsAccumulated += awardedCoins;

      if (h.category === 'entrenamiento') attributeGains.fuerza += isCompleted ? 2 : 1;
      if (h.category === 'pomodoro' || h.category === 'rutina') attributeGains.disciplina += isCompleted ? 2 : 1;
      if (h.category === 'estudio') attributeGains.estudio += isCompleted ? 2 : 1;
      if (h.category === 'habito') attributeGains.energia += isCompleted ? 2 : 1;
      attributeGains.mente += isCompleted ? 1 : 0;

      dayTasks.push({
        id: `sim_task_${dateStr}_${h.id}`,
        title: h.title,
        category: h.category,
        xpReward: h.xpReward,
        coinReward: h.coinReward,
        timeBlock: h.timeBlock,
        completed: isCompleted,
        completedAt: isCompleted ? `${dateStr}T18:30:00` : undefined,
        awardedXp,
        awardedCoins,
        isHabit: true,
        targetCount: h.targetCount || 1,
        currentCount,
        isQuickHabit: true,
        unit: h.unit,
        quickIcon: h.quickIcon
      });
    });

    // 2. Generate Real Concrete Tasks (Work, Clients, Projects, Cleaning, etc.)
    const tasksPool = isWeekend ? WEEKEND_REAL_TASKS_POOL : WEEKDAY_REAL_TASKS_POOL;
    const tasksCountToday = isWeekend ? 2 : 3;

    for (let t = 0; t < tasksCountToday; t++) {
      const templateIdx = Math.abs(Math.floor(Math.sin(i * 13 + t * 5) * tasksPool.length)) % tasksPool.length;
      const tpl = tasksPool[templateIdx];

      const seed = Math.sin(i * 19 + t * 3) * 10000;
      const roll = seed - Math.floor(seed);
      const isCompleted = roll <= daySuccessThreshold;

      if (isCompleted) {
        dayTotalCompleted++;
        totalXpAccumulated += tpl.xpReward;
        totalCoinsAccumulated += tpl.coinReward;
      }

      dayTasks.push({
        id: `sim_real_${dateStr}_${t}`,
        title: tpl.title,
        category: tpl.category,
        priority: tpl.priority,
        timeBlock: tpl.timeBlock,
        xpReward: tpl.xpReward,
        coinReward: tpl.coinReward,
        incomeAmount: tpl.incomeAmount,
        description: tpl.description,
        completed: isCompleted,
        completedAt: isCompleted ? `${dateStr}T${tpl.timeBlock.split(' - ')[1] || '17:00'}:00` : undefined,
        awardedXp: isCompleted ? tpl.xpReward : 0,
        awardedCoins: isCompleted ? tpl.coinReward : 0,
      });
    }

    tasksByDate[dateStr] = dayTasks;

    // Streak logic
    const dayMetGoal = dayTotalCompleted >= Math.ceil(dayTasks.length * 0.6);
    if (dayMetGoal) {
      runningStreak++;
      currentStreak = runningStreak;
    } else {
      if (config.consistencyRate >= 0.9) {
        runningStreak++;
        currentStreak = runningStreak;
      } else {
        runningStreak = 0;
      }
    }

    // 3. Pomodoro Focus Sessions
    if (daySuccessThreshold > 0.4) {
      const pomosToday = dayMetGoal ? 2 : (rollDeterministic(i, 3) > 0.5 ? 1 : 0);
      for (let p = 0; p < pomosToday; p++) {
        pomodoroSessions.push({
          id: `sim_pomo_${dateStr}_${p}`,
          date: dateStr,
          durationMinutes: 25,
          completedAt: new Date(`${dateStr}T11:${p === 0 ? '00' : '45'}:00`).toISOString(),
          category: 'pomodoro',
          xpEarned: 25,
          coinsEarned: 15,
          taskTitle: p === 0 ? 'Bloque A - Trabajo Crítico' : 'Bloque B - Arquitectura & Revisión'
        });
      }
    }

    // 4. Sleep logging
    let bedtime = '22:30';
    let wakeTime = '06:30';
    let duration = 8.0;

    if (config.sleepPattern === 'night_owl') {
      bedtime = isWeekend ? '02:15' : '00:45';
      wakeTime = isWeekend ? '09:45' : '07:30';
      duration = isWeekend ? 7.5 : 6.75;
    } else if (config.sleepPattern === 'mixed') {
      if (isWeekend) {
        bedtime = '01:30';
        wakeTime = '09:00';
        duration = 7.5;
      } else {
        bedtime = '23:15';
        wakeTime = '06:45';
        duration = 7.5;
      }
    }

    sleepLogs[dateStr] = {
      bedtime,
      wakeTime,
      sleepDurationHours: duration,
      completedAt: `${dateStr}T${wakeTime}:00`,
      quality: duration >= 7.5 ? 'Excelente' : 'Aceptable'
    };

    // 5. Finalized Day and Nightly Reflections
    if (dayMetGoal) {
      finalizedDays[dateStr] = {
        finalizedAt: `${dateStr}T22:45:00`,
        bonusXp: 50,
        bonusCoins: 30,
        sleepStartTime: bedtime,
        wakeTimeTarget: wakeTime,
        actualWakeTime: wakeTime
      };
      totalXpAccumulated += 50;
      totalCoinsAccumulated += 30;

      // Realistic thoughtful reflections based on the operator's persona
      if (config.consistencyRate >= 0.9) {
        reflections[dateStr] = `Día de foco impecable. Se cumplieron todos los bloques de foco y el entrenamiento matutino. Mantener esta inercia sin negociar con el cansancio.`;
      } else if (isWeekend) {
        reflections[dateStr] = `Fin de semana de recarga. Bajó un poco el ritmo en hábitos secundarios pero se mantuvo la lectura y la planificación de la próxima semana.`;
      } else {
        reflections[dateStr] = `Jornada productiva con entregas de trabajo completadas. Hubo cierta dispersión en la tarde pero se cerró el día con balance positivo.`;
      }
    }

    // 6. Comprehensive Financial Transactions (Distributed throughout the timeline)
    // Daily coffee / meal expense
    if (i % 3 === 0) {
      expenses.push({
        id: `sim_tx_food_${dateStr}`,
        description: 'Nutrición Limpia & Café de Especialidad',
        amount: isWeekend ? 32 : 18,
        type: 'expense',
        category: 'Comida',
        date: dateStr,
        createdAt: `${dateStr}T13:30:00.000Z`
      });
    }

    // Weekly supermarket grocery run
    if (i % 7 === 2) {
      expenses.push({
        id: `sim_tx_groceries_${dateStr}`,
        description: 'Compra Semanal Supermercado Bio (Alimentos y Suplementos)',
        amount: 85,
        type: 'expense',
        category: 'Salud',
        date: dateStr,
        createdAt: `${dateStr}T18:00:00.000Z`
      });
    }

    // Bi-weekly income / Freelance client invoices
    if (i % 14 === 3) {
      expenses.push({
        id: `sim_tx_client_income_${dateStr}`,
        description: `Cobro Factura Hito Proyecto con Cliente Corporativo`,
        amount: config.consistencyRate >= 0.85 ? 950 : 550,
        type: 'income',
        category: 'Clientes',
        date: dateStr,
        createdAt: `${dateStr}T10:00:00.000Z`
      });

      // Corresponding disciplined savings allocation
      expenses.push({
        id: `sim_tx_savings_${dateStr}`,
        description: 'Aporte Programado a Fondo de Inversión y Ahorro',
        amount: config.consistencyRate >= 0.85 ? 350 : 150,
        type: 'expense',
        category: 'Ahorro',
        date: dateStr,
        createdAt: `${dateStr}T10:30:00.000Z`
      });
    }

    // Monthly recurring expenses (Gym, Internet, Software tools)
    if (i % 30 === 1) {
      expenses.push({
        id: `sim_tx_gym_${dateStr}`,
        description: 'Membresía Centro de Entrenamiento y Acondicionamiento',
        amount: 60,
        type: 'expense',
        category: 'Salud',
        date: dateStr,
        createdAt: `${dateStr}T09:00:00.000Z`
      });
      expenses.push({
        id: `sim_tx_cloud_${dateStr}`,
        description: 'Servicios Cloud, Servidores & Software Profesional',
        amount: 45,
        type: 'expense',
        category: 'Trabajo',
        date: dateStr,
        createdAt: `${dateStr}T09:15:00.000Z`
      });
    }
  }

  // Calculate Level and Rank from total XP
  let calculatedLevel = 1;
  let remainingXp = totalXpAccumulated;
  let req = getRequiredXpForLevel(1);

  while (remainingXp >= req && calculatedLevel < 100) {
    remainingXp -= req;
    calculatedLevel++;
    req = getRequiredXpForLevel(calculatedLevel);
  }

  const rankInfo = getRankForLevel(calculatedLevel);

  // Build Habit Mastery records
  DAILY_HABIT_TEMPLATES.forEach(h => {
    const successDays = Math.round(config.days * config.consistencyRate);
    const streak = Math.min(successDays, currentStreak);
    habitMastery[h.id] = {
      taskId: h.id,
      currentStreak: streak,
      highestStreak: Math.max(successDays, currentStreak),
      isMaltzReached: successDays >= 21,
      isMastered: successDays >= 66,
      shieldActive: config.consistencyRate >= 0.9,
      multiplier: config.consistencyRate >= 0.9 ? 1.5 : 1.0,
      lastCompletedDate: todayStr
    };
  });

  const finalStats: PlayerStats = {
    level: calculatedLevel,
    currentXp: remainingXp,
    requiredXp: req,
    totalXpEarned: totalXpAccumulated,
    coins: totalCoinsAccumulated,
    hp: config.consistencyRate >= 0.85 ? 100 : 85,
    maxHp: 100,
    streakDays: currentStreak,
    streakShields: config.consistencyRate >= 0.9 ? 3 : (config.consistencyRate >= 0.7 ? 1 : 0),
    lastActiveDate: todayStr,
    lastDailyRewardClaimedDate: todayStr,
    rankTitle: rankInfo.title,
    avatarIcon: config.avatar,
    characterClass: config.characterClass,
    username: config.name.toLowerCase().replace(/\s+/g, '_'),
    fullName: config.name,
    profession: config.tagline,
    mainGoal: `Consolidar el protocolo ${config.archetype} a través de disciplina implacable, solidez financiera y consistencia sostenida.`,
    attributes: {
      disciplina: Math.max(12, Math.round(attributeGains.disciplina * 0.45)),
      fuerza: Math.max(10, Math.round(attributeGains.fuerza * 0.45)),
      mente: Math.max(12, Math.round(attributeGains.mente * 0.45)),
      energia: Math.max(10, Math.round(attributeGains.energia * 0.45)),
      estudio: Math.max(10, Math.round(attributeGains.estudio * 0.45)),
    },
    sleepLogs,
    finalizedDays
  };

  return {
    stats: finalStats,
    tasksByDate,
    customHabits: DAILY_HABIT_TEMPLATES,
    habitMastery,
    pomodoroSessions,
    expenses,
    reflections
  };
};

/**
 * PREDEFINED ARCHETYPAL SCENARIOS
 */
export const SCENARIO_PRESETS: SimulatedScenarioConfig[] = [
  {
    id: 'valeria_perfect_2w',
    name: 'Valeria Ruiz',
    avatar: '🛡️',
    archetype: 'El Héroe',
    characterClass: 'El Héroe',
    days: 14,
    consistencyRate: 1.0,
    sleepPattern: 'early',
    tagline: 'Atleta de Alto Rendimiento & Freelancer de Élite',
    description: '14 días de cumplimiento absoluto al 100%. Racha perfecta de 2 semanas, misiones remuneradas con clientes entregadas, finanzas con $950 USD de ingresos y ahorro disciplinado.',
    highlights: [
      'Racha ininterrumpida de 14 días (Fuego Máximo)',
      'Tareas completas: entregas a clientes, diseño y entrenamiento',
      'Finanzas activas: cobros de clientes ($950), ahorro ($350) y gastos saludables',
      'Descanso perfecto (22:30 a 06:30, 8h) y reflexiones diarias en el diario'
    ]
  },
  {
    id: 'mateo_resilience_1m',
    name: 'Mateo Morales',
    avatar: '🤝',
    archetype: 'El Hombre Corriente',
    characterClass: 'El Hombre Corriente',
    days: 30,
    consistencyRate: 0.72,
    sleepPattern: 'mixed',
    tagline: 'Estudiante, Creador & Resiliencia Operativa',
    description: '30 días de uso real: semanas laborales sólidas, fines de semana con bajadas realistas de rendimiento, tareas académicas y finanzas con ingresos freelance y gastos mensuales.',
    highlights: [
      '30 días de historial continuo (72% consistencia global)',
      'Tareas variadas: proyectos creativos, estudio universitario y mantenimiento',
      'Finanzas reales: ingresos de beca/freelance ($550) y gastos cotidianos',
      'El Oráculo detecta cuellos de botella reales en fines de semana'
    ]
  },
  {
    id: 'adrian_veteran_3m',
    name: 'Dr. Adrián Silva',
    avatar: '🦉',
    archetype: 'El Sabio',
    characterClass: 'El Sabio',
    days: 90,
    consistencyRate: 0.88,
    sleepPattern: 'early',
    tagline: 'Consultor Senior & Arquitecto de Hábitos',
    description: '90 días completos (un trimestre). Nivel 28+, maestría de hábitos en rango Legendario, más de 30 transacciones financieras registradas con alto superávit y 160 sesiones Pomodoro.',
    highlights: [
      '90 días de historial completo (Trimestre de Telemetría)',
      'Nivel 28+ con rango Soberano del Hábito',
      'Tesorería robusta: múltiples cobros de consultoría, inversiones mensuales y balance positivo',
      'Matriz densa de 3 meses de productividad y diario reflexivo poblado'
    ]
  }
];

/**
 * Injects a scenario into the application state safely
 */
export const applyScenario = (config: SimulatedScenarioConfig): boolean => {
  if (typeof window === 'undefined') return false;

  // 1. Back up authentic user data first
  backupRealUserData();

  try {
    // 2. Generate procedural dataset
    const scenarioData = generateScenarioData(config);

    // 3. Mark simulation active
    localStorage.setItem(SIMULATION_ACTIVE_KEY, 'true');
    localStorage.setItem(SIMULATION_NAME_KEY, config.name);
    localStorage.setItem(SIMULATION_DAYS_KEY, String(config.days));
    (window as any).__isSimulationActive = true;

    // 4. Update all stores
    usePlayerStore.getState().setStats(scenarioData.stats);
    useTaskStore.getState().setTasksByDate(scenarioData.tasksByDate);
    useTaskStore.getState().setCustomHabits(scenarioData.customHabits);
    useAppStore.getState().setHabitMastery(scenarioData.habitMastery);
    useAppStore.getState().setPomodoroSessions(scenarioData.pomodoroSessions);
    useAppStore.getState().setExpenses(scenarioData.expenses);
    if (scenarioData.reflections) {
      useAppStore.getState().setReflections(scenarioData.reflections);
    }

    // 5. Notify the rest of the application
    window.dispatchEvent(new CustomEvent('taskquest:simulation-changed', { detail: config }));
    return true;
  } catch (err) {
    console.error('Error applying simulated scenario:', err);
    return false;
  }
};
