/**
 * notificationScheduler.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Scheduler inteligente de notificaciones push para La Solución PWA.
 *
 * Funciona programando setTimeout precisos basados en el estado actual del día:
 *  • Recordatorios de hábitos/tareas según su timeBlock
 *  • Briefing matutino basado en la primera tarea del día
 *  • Reflexión nocturna
 *  • Alerta de boss expirando
 *  • Alerta de racha en peligro
 *
 * Se llama al iniciar la app y cada vez que las tareas del día cambian.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { TaskItem } from '../types';
import { notificationService } from './notifications';
import { safeGetItem, safeSetItem } from './storage';

// ─── Claves de configuración en localStorage ─────────────────────────────────
const NOTIF_SETTINGS_KEY = 'lasolucion_notif_settings';

export interface NotificationSettings {
  habitReminders: boolean;     // Recordatorios de tareas por timeBlock
  morningBriefing: boolean;    // Resumen matutino (basado en primera tarea del día)
  nightlyReflection: boolean;  // Recordatorio de reflexión nocturna
  bossAlert: boolean;          // Alerta cuando el boss expira hoy a las 20:00
  streakAlert: boolean;        // Alerta si racha en peligro (4h sin completar tareas)
  pomodoroComplete: boolean;   // Notificación al completar un pomodoro
  nightlyHour: number;         // Hora para reflexión nocturna (default: 21)
  startDayReminder?: boolean;  // Recordatorio para iniciar jornada laboral
  dayStartHour?: number;       // Hora habitual de inicio (default: 8)
  closeDayReminder?: boolean;  // Recordatorio para cerrar jornada y llenar bitácora
  dayCloseHour?: number;       // Hora habitual de cierre (default: 18)
}

const DEFAULT_SETTINGS: NotificationSettings = {
  habitReminders: true,
  morningBriefing: true,
  nightlyReflection: true,
  bossAlert: true,
  streakAlert: true,
  pomodoroComplete: true,
  nightlyHour: 21,
  startDayReminder: true,
  dayStartHour: 8,
  closeDayReminder: true,
  dayCloseHour: 18,
};

export function getNotificationSettings(): NotificationSettings {
  try {
    const raw = safeGetItem(NOTIF_SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  safeSetItem(NOTIF_SETTINGS_KEY, JSON.stringify(settings));
}

// ─── Registro de timeouts activos ────────────────────────────────────────────
const activeTimeouts: ReturnType<typeof setTimeout>[] = [];

function registerTimeout(id: ReturnType<typeof setTimeout>) {
  activeTimeouts.push(id);
}

/** Cancela todos los setTimeout programados previamente */
export function cancelAllScheduled(): void {
  while (activeTimeouts.length > 0) {
    const id = activeTimeouts.pop();
    if (id !== undefined) clearTimeout(id);
  }
}

// ─── Utilidades de tiempo ─────────────────────────────────────────────────────

/**
 * Parsea "HH:MM" o "HH:MM - HH:MM" y retorna milisegundos hasta ese momento HOY.
 * Retorna null si ya pasó o no es válido.
 */
function msUntilTimeBlock(timeBlock: string): number | null {
  if (!timeBlock) return null;

  // Tomar solo la primera parte si tiene rango: "07:00 - 08:00" → "07:00"
  const raw = timeBlock.split('-')[0].trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);

  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);

  // Dar un margen de -2 minutos para tareas que ya casi empiezan
  const ms = target.getTime() - now.getTime() - 2 * 60 * 1000;
  return ms > 0 ? ms : null;
}

/** Retorna milisegundos hasta HH:00 de hoy (o null si ya pasó) */
function msUntilHour(hour: number, minuteOffset = 0): number | null {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minuteOffset, 0, 0);
  const ms = target.getTime() - now.getTime();
  return ms > 5000 ? ms : null; // al menos 5 segundos en el futuro
}

// ─── Programadores individuales ───────────────────────────────────────────────

/** Programa recordatorios de tareas con timeBlock */
function scheduleHabitReminders(tasks: TaskItem[]): void {
  const tasksWithTime = tasks.filter(
    t => !t.completed && t.timeBlock && t.timeBlock.trim().length > 0
  );

  // Agrupar tareas por timeBlock para evitar spam
  const byTime: Record<string, TaskItem[]> = {};
  for (const task of tasksWithTime) {
    const key = task.timeBlock!.split('-')[0].trim();
    if (!byTime[key]) byTime[key] = [];
    byTime[key].push(task);
  }

  for (const [timeStr, group] of Object.entries(byTime)) {
    const ms = msUntilTimeBlock(timeStr);
    if (ms === null) continue;

    const id = setTimeout(async () => {
      const stillPending = group.filter(t => !t.completed);
      if (stillPending.length === 0) return;

      const categoryEmojis: Record<string, string> = {
        entrenamiento: '💪', clientes: '🤝', limpieza: '🧹',
        comida: '🍽️', creativo: '🎨', habito: '⚡', estudio: '📚',
        pomodoro: '🍅', trabajo: '💼', rutina: '🔄',
      };

      if (stillPending.length === 1) {
        const t = stillPending[0];
        const emoji = categoryEmojis[t.category] || '⏰';
        await notificationService.pushToOS(
          `${emoji} ${timeStr} — ${t.title}`,
          t.description ? t.description.slice(0, 80) : 'Es hora de esta misión. ¡Vamos!',
          { tag: `habit-${t.id}`, renotify: true }
        );
      } else {
        const names = stillPending.slice(0, 3).map(t => t.title).join(', ');
        await notificationService.pushToOS(
          `⏰ ${timeStr} — ${stillPending.length} misiones`,
          names,
          { tag: `habits-${timeStr}`, renotify: true }
        );
      }
    }, ms);

    registerTimeout(id);
  }
}

/** Programa briefing matutino basado en la primera tarea del día */
function scheduleMorningBriefing(tasks: TaskItem[]): void {
  // Encontrar la tarea más temprana con timeBlock
  const sorted = tasks
    .filter(t => t.timeBlock && t.timeBlock.trim().length > 0)
    .sort((a, b) => {
      const toMin = (tb: string) => {
        const raw = tb.split('-')[0].trim();
        const [h, m] = raw.split(':').map(Number);
        return h * 60 + (m || 0);
      };
      return toMin(a.timeBlock!) - toMin(b.timeBlock!);
    });

  if (sorted.length === 0) return;

  const firstTask = sorted[0];
  const timeStr = firstTask.timeBlock!.split('-')[0].trim();
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return;

  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);

  // Calcular ms hasta 15 minutos ANTES de la primera tarea
  const now = new Date();
  const target = new Date();
  target.setHours(hour, Math.max(0, minute - 15), 0, 0);

  const ms = target.getTime() - now.getTime();
  if (ms <= 5000) return; // Ya pasó o muy pronto

  const totalTasks = tasks.filter(t => !t.completed).length;

  const id = setTimeout(async () => {
    await notificationService.pushToOS(
      `🌅 ¡Buenos días! Tu jornada comienza`,
      `Tienes ${totalTasks} misión${totalTasks !== 1 ? 'es' : ''} hoy. La primera empieza a las ${timeStr}: ${firstTask.title}`,
      { tag: 'morning-briefing', renotify: false }
    );
  }, ms);

  registerTimeout(id);
}

/** Programa recordatorio de reflexión nocturna */
function scheduleNightlyReflection(nightlyHour: number): void {
  const ms = msUntilHour(nightlyHour, 0);
  if (ms === null) return;

  const id = setTimeout(async () => {
    await notificationService.pushToOS(
      '🌙 ¿Cómo fue tu día, Héroe?',
      'Es hora de tu reflexión nocturna. Cierra el día y mantén tu racha activa.',
      { tag: 'nightly-reflection', renotify: false }
    );
  }, ms);

  registerTimeout(id);
}

/** Programa alerta de boss expirando (20:00 si hay boss sin derrotar) */
function scheduleBossAlert(tasks: TaskItem[]): void {
  const bossTask = tasks.find(
    t => (t.isLegendaryBounty || t.category === 'habito') && !t.completed
  );
  if (!bossTask) return;

  const ms = msUntilHour(20, 0);
  if (ms === null) return;

  const id = setTimeout(async () => {
    // Verificar que el boss sigue sin derrotar al momento de la notificación
    await notificationService.pushToOS(
      '🎯 Recordatorio de Objetivo Prioritario',
      `"${bossTask.title}" sigue pendiente. Aún tienes tiempo para cerrar el día con éxito.`,
      { tag: 'boss-alert', renotify: true }
    );
  }, ms);

  registerTimeout(id);
}

/** Programa alerta de racha en peligro (4h sin completar tareas) */
function scheduleStreakAlert(streakDays: number, tasks: TaskItem[]): void {
  if (streakDays < 1) return; // Solo si tiene racha que perder

  const now = new Date();

  // Verificar cada 4 horas durante el día activo (9am - 22pm)
  const checkHours = [13, 17, 20, 22];

  for (const hour of checkHours) {
    const ms = msUntilHour(hour, 0);
    if (ms === null) continue;

    const id = setTimeout(async () => {
      // Verificar si hay tareas completadas en el día
      const completedToday = tasks.filter(t => t.completed).length;
      const totalToday = tasks.length;

      if (completedToday === 0 && totalToday > 0) {
        await notificationService.pushToOS(
          `🔥 Racha de ${streakDays} días en peligro`,
          `No has completado ninguna misión hoy. ¡Completa al menos 1 para proteger tu racha!`,
          { tag: 'streak-alert', renotify: true }
        );
      } else if (completedToday < Math.ceil(totalToday * 0.25) && hour >= 20) {
        // A las 8pm con menos del 25% completado
        await notificationService.pushToOS(
          `⚠️ Día casi terminado — ${completedToday}/${totalToday} misiones`,
          `Tu racha de ${streakDays} días podría estar en riesgo. ¡Apúrate!`,
          { tag: 'streak-alert-late', renotify: true }
        );
      }
    }, ms);

    registerTimeout(id);
  }
}

/** Programa alerta para iniciar la jornada laboral si aún no se ha iniciado */
function scheduleStartDayReminder(dayStartHour: number, isDayStarted: boolean): void {
  if (isDayStarted) return;

  const ms = msUntilHour(dayStartHour, 0);
  if (ms !== null) {
    const id = setTimeout(async () => {
      await notificationService.pushToOS(
        '🌅 ¡Tu jornada laboral comienza!',
        'No olvides iniciar tu turno en La Solución para activar tus tareas y objetivos del día.',
        { tag: 'start-day-reminder', renotify: true }
      );
    }, ms);
    registerTimeout(id);
  } else {
    // Si la hora ya pasó hoy y son antes de las 15:00
    const nowHour = new Date().getHours();
    if (nowHour >= dayStartHour && nowHour < 15) {
      const id = setTimeout(async () => {
        await notificationService.pushToOS(
          '⏰ Recordatorio de Jornada',
          'Aún no has iniciado tu jornada de hoy. Toca para abrir tu turno y registrar tu progreso.',
          { tag: 'start-day-reminder-missed', renotify: true }
        );
      }, 25000);
      registerTimeout(id);
    }
  }
}

/** Programa alerta para cerrar la jornada y llenar la bitácora */
function scheduleCloseDayAndJournalReminder(
  dayCloseHour: number,
  nightlyHour: number,
  isDayFinished: boolean,
  hasJournalEntry: boolean
): void {
  if (isDayFinished && hasJournalEntry) return;

  // Alerta de fin de turno habitual
  const msClose = msUntilHour(dayCloseHour, 0);
  if (msClose !== null) {
    const id = setTimeout(async () => {
      await notificationService.pushToOS(
        '🏁 Cierre de Jornada Laboral',
        'Tu turno ha terminado. Tómate 1 minuto para dar check a tus tareas y llenar tu bitácora.',
        { tag: 'close-day-reminder', renotify: true }
      );
    }, msClose);
    registerTimeout(id);
  }

  // Alerta nocturna para llenar bitácora
  const msNight = msUntilHour(nightlyHour, 0);
  if (msNight !== null) {
    const id = setTimeout(async () => {
      await notificationService.pushToOS(
        '📓 Bitácora y Cierre Diario',
        '¡No dejes tu día sin registrar! Llena tu reflexión diaria, reclama tus recompensas y protege tu racha.',
        { tag: 'nightly-journal-reminder', renotify: true }
      );
    }, msNight);
    registerTimeout(id);
  }
}

/** Recordatorios periódicos para tareas pendientes (incluso sin timeBlock asignado) */
function scheduleGeneralPendingTaskCheckins(tasks: TaskItem[]): void {
  const pendingTasks = tasks.filter((t) => !t.completed);
  if (pendingTasks.length === 0) return;

  const checkHours = [12, 16];
  for (const hour of checkHours) {
    const ms = msUntilHour(hour, 30);
    if (ms === null) continue;

    const id = setTimeout(async () => {
      const stillPending = tasks.filter((t) => !t.completed);
      if (stillPending.length === 0) return;

      await notificationService.pushToOS(
        `⚡ Tienes ${stillPending.length} misiones pendientes`,
        `Ej: "${stillPending[0].title}". Toca para darles check o avanzar en tu jornada.`,
        { tag: `pending-checkin-${hour}`, renotify: false }
      );
    }, ms);
    registerTimeout(id);
  }
}

// ─── Función principal: programar todo ───────────────────────────────────────

export interface SchedulerState {
  tasks: TaskItem[];
  streakDays: number;
  isDayStarted?: boolean;
  isDayFinished?: boolean;
  hasJournalEntry?: boolean;
  dayStartHour?: number;
  dayCloseHour?: number;
}

/**
 * Cancela todos los timeouts previos y reprograma todos los recordatorios del día.
 * Llamar al iniciar la app y cuando las tareas cambian.
 */
export async function scheduleAll(state: SchedulerState): Promise<void> {
  // Solo funciona si los permisos están otorgados
  const permission = await notificationService.syncPermissionAsync();
  if (permission !== 'granted') return;

  // Cancelar programación anterior
  cancelAllScheduled();

  const settings = getNotificationSettings();
  const { 
    tasks, 
    streakDays, 
    isDayStarted = false, 
    isDayFinished = false, 
    hasJournalEntry = false,
    dayStartHour = settings.dayStartHour ?? 8,
    dayCloseHour = settings.dayCloseHour ?? 18
  } = state;

  if (settings.startDayReminder ?? true) {
    scheduleStartDayReminder(dayStartHour, isDayStarted);
  }

  if (settings.closeDayReminder ?? true) {
    scheduleCloseDayAndJournalReminder(dayCloseHour, settings.nightlyHour, isDayFinished, hasJournalEntry);
  }

  if (settings.habitReminders) {
    scheduleHabitReminders(tasks);
    scheduleGeneralPendingTaskCheckins(tasks);
  }

  if (settings.morningBriefing) {
    scheduleMorningBriefing(tasks);
  }

  if (settings.nightlyReflection) {
    scheduleNightlyReflection(settings.nightlyHour);
  }

  if (settings.bossAlert) {
    scheduleBossAlert(tasks);
  }

  if (settings.streakAlert) {
    scheduleStreakAlert(streakDays, tasks);
  }
}
