import { AppNotification, NotificationSettings, TaskItem } from '../types';
import { soundFX } from './audio';
import { getTodayDateString } from './date';

export interface PushOptions {
  /** Tag para agrupar/reemplazar notificaciones del mismo tipo */
  tag?: string;
  /** Si true, el OS reproduce el sonido/vibración incluso si ya existe una notif con el mismo tag */
  renotify?: boolean;
  /** Acciones disponibles en la notificación (solo en Android/Chrome) */
  actions?: Array<{ action: string; title: string }>;
}

export class NotificationService {
  private static instance: NotificationService;
  private isPushSupported: boolean = false;
  private permission: NotificationPermission = 'default';
  private schedulerIntervalId: any = null;
  private firedKeys: Set<string> = new Set();

  private constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.isPushSupported = true;
      this.permission = Notification.permission;

      // Escuchar mensajes del Service Worker para notificaciones programadas
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'NOTIFICATION_CLICK') {
            window.dispatchEvent(new CustomEvent('lasolucion:notification-click', {
              detail: event.data
            }));
          }
        });
      }
    }
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public isSupported(): boolean {
    return this.isPushSupported;
  }

  public getPermission(): NotificationPermission {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  }

  public async requestPermission(): Promise<boolean> {
    if (!this.isPushSupported) return false;
    try {
      const result = await Notification.requestPermission();
      this.permission = result;
      return result === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Envía una notificación nativa al OS via Service Worker o API directa.
   */
  public async pushToOS(title: string, body: string, options: PushOptions = {}): Promise<boolean> {
    if (!this.isPushSupported || Notification.permission !== 'granted') return false;

    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
    const iconUrl = origin ? `${origin}/pwa-192x192.png` : '/pwa-192x192.png';
    const badgeUrl = origin ? `${origin}/pwa-192x192.png` : '/pwa-192x192.png';

    const notifOptions: NotificationOptions = {
      body,
      icon: iconUrl,
      badge: badgeUrl,
      image: iconUrl,
      tag: options.tag,
      renotify: options.renotify ?? false,
      actions: options.actions as any,
      data: { url: '/', tag: options.tag },
      vibrate: [200, 100, 200],
    } as any;

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, notifOptions);
        return true;
      } else {
        new Notification(title, notifOptions);
        return true;
      }
    } catch (err) {
      console.warn('[NotificationService] pushToOS failed:', err);
      return false;
    }
  }

  /**
   * Dispara una notificación inmediata con sonido in-app y lanza evento para Toast UI.
   */
  public triggerNotification(
    title: string, 
    body: string, 
    icon = '⚔️',
    type: AppNotification['type'] = 'info',
    actionUrl?: string
  ): AppNotification {
    // 1. Reproducir sonido in-app si está disponible
    try {
      soundFX.playTaskComplete();
    } catch (e) {}

    // 2. Push al OS (sin bloquear)
    this.pushToOS(`${icon} ${title}`, body).catch(() => {});

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${icon} ${title}`,
      message: body,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type,
      read: false,
      icon,
      actionUrl
    };

    // 3. Emitir evento para Toast Flotante In-App
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lasolucion:toast-notification', {
        detail: newNotif
      }));
    }

    return newNotif;
  }

  /**
   * Envía una notificación de prueba instantánea para verificar permisos y audio.
   */
  public sendTestNotification(): AppNotification {
    return this.triggerNotification(
      'Notificaciones Operativas ⚡',
      'El canal neural de notificaciones está activo y sincronizado en tu dispositivo.',
      '🔔',
      'info'
    );
  }

  /**
   * Programador de Notificaciones Inteligente:
   * Revisa cada 20 segundos las horas configuradas y alarmas de tareas.
   */
  public startNotificationScheduler(
    getStoreData: () => {
      tasksToday: TaskItem[];
      settings: NotificationSettings;
      addNotification: (n: AppNotification) => void;
    }
  ) {
    if (typeof window === 'undefined') return;

    if (this.schedulerIntervalId) {
      clearInterval(this.schedulerIntervalId);
    }

    const checkSchedule = () => {
      const { tasksToday, settings, addNotification } = getStoreData();
      if (!settings || !settings.enabled) return;

      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;
      const todayStr = getTodayDateString();

      // 1. Recordatorio Matutino
      if (settings.morningReminderEnabled && settings.morningReminderTime === currentTime) {
        const key = `${todayStr}_morning_${currentTime}`;
        if (!this.firedKeys.has(key)) {
          this.firedKeys.add(key);
          const notif = this.triggerNotification(
            'Misiones de la Mañana 🌅',
            '¡Buenos días! Revisa tu plan diario y comienza a sumar EXP y Monedas.',
            '🌅',
            'reminder'
          );
          addNotification(notif);
        }
      }

      // 2. Recordatorio de Tarde
      if (settings.afternoonReminderEnabled && settings.afternoonReminderTime === currentTime) {
        const key = `${todayStr}_afternoon_${currentTime}`;
        if (!this.firedKeys.has(key)) {
          this.firedKeys.add(key);
          const pendingCount = tasksToday.filter(t => !t.completed).length;
          const notif = this.triggerNotification(
            'Estatus de Enfoque ☀️',
            pendingCount > 0 
              ? `Tienes ${pendingCount} tareas por completar hoy. ¡Mantén el ritmo!` 
              : '¡Increíble! Has completado todas tus tareas de hoy.',
            '☀️',
            'reminder'
          );
          addNotification(notif);
        }
      }

      // 3. Alerta de Resguardo de Racha (Streak Safeguard)
      if (settings.streakSafeguardEnabled && settings.streakSafeguardTime === currentTime) {
        const key = `${todayStr}_streak_${currentTime}`;
        if (!this.firedKeys.has(key)) {
          this.firedKeys.add(key);
          const pendingHabits = tasksToday.filter(t => (t.isHabit || t.isQuickHabit) && !t.completed);
          if (pendingHabits.length > 0) {
            const notif = this.triggerNotification(
              '¡Resguardo de Racha Activo! 🛡️',
              `Te quedan ${pendingHabits.length} hábitos pendientes. ¡Complétalos antes de dormir para proteger tu racha y HP!`,
              '🛡️',
              'streak_warning'
            );
            addNotification(notif);
          }
        }
      }

      // 4. Recordatorio de Bitácora Nocturna
      if (settings.nightlyReflectionEnabled && settings.nightlyReflectionTime === currentTime) {
        const key = `${todayStr}_nightly_${currentTime}`;
        if (!this.firedKeys.has(key)) {
          this.firedKeys.add(key);
          const notif = this.triggerNotification(
            'Bitácora Nocturna Lista 🌙',
            'Es hora de reflexionar sobre tus victorias del día y preparar el descanso.',
            '🌙',
            'nightly'
          );
          addNotification(notif);
        }
      }

      // 5. Alarmas de Tareas Específicas (reminderTime)
      if (settings.taskAlarmsEnabled && tasksToday.length > 0) {
        for (const task of tasksToday) {
          if (task.reminderTime && task.reminderTime === currentTime && !task.completed) {
            const key = `${todayStr}_task_${task.id}_${currentTime}`;
            if (!this.firedKeys.has(key)) {
              this.firedKeys.add(key);
              const notif = this.triggerNotification(
                `Recordatorio de Misión ⏰`,
                `Es hora de realizar: "${task.title}"`,
                '⏰',
                'task_alarm'
              );
              addNotification(notif);
            }
          }
        }
      }

      // Limpiar firedKeys antiguas si la lista es muy grande (> 200)
      if (this.firedKeys.size > 200) {
        this.firedKeys.clear();
      }
    };

    // Ejecutar verificación inicial inmediata y luego cada 20 segundos
    checkSchedule();
    this.schedulerIntervalId = setInterval(checkSchedule, 20000);
  }

  /**
   * Scheduler de fallback por si el scheduler principal se pausa
   */
  public startLocalPushScheduler(getPendingHabits: () => string[]) {
    if (typeof window === 'undefined') return;

    setInterval(() => {
      if (this.permission !== 'granted') return;

      const hour = new Date().getHours();
      if (hour < 9 || hour > 21) return;

      const pending = getPendingHabits();
      if (pending.length > 0) {
        this.pushToOS(
          'La Solución: Hábitos Pendientes 💧',
          `Tienes ${pending.length} hábitos rápidos sin completar hoy. ¡Tómate 1 minuto y hazlo!`,
          { tag: 'hourly-reminder', renotify: false }
        );
      }
    }, 3600000);
  }
}

export const notificationService = NotificationService.getInstance();
