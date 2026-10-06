import { AppNotification } from '../types';
import { soundFX } from './audio';

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

  private constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.isPushSupported = true;
      this.permission = Notification.permission;

      // Escuchar mensajes del Service Worker para notificaciones programadas
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'NOTIFICATION_CLICK') {
            // El SW nos informa que el usuario tapó una notificación
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
   * Envía una notificación nativa al OS via Service Worker.
   * Retorna true si se envió correctamente.
   * No reproduce sonido in-app (uso exclusivo del scheduler).
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
   * Dispara una notificación inmediata con sonido in-app.
   * Retorna un registro interno para el historial de notificaciones.
   */
  public triggerNotification(title: string, body: string, icon = '⚔️'): AppNotification {
    // 1. Reproducir sonido in-app
    soundFX.playTaskComplete();

    // 2. Push al OS (sin bloquear — fire and forget)
    this.pushToOS(`${icon} ${title}`, body).catch(() => {});

    // 3. Retornar registro interno para el historial de la UI
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: `${icon} ${title}`,
      message: body,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: title.toLowerCase().includes('nivel')
        ? 'level_up'
        : title.toLowerCase().includes('recompensa')
        ? 'daily_reward'
        : title.toLowerCase().includes('pomodoro') || title.toLowerCase().includes('foco')
        ? 'pomodoro'
        : 'info',
      read: false,
    };

    return newNotif;
  }

  /**
   * Scheduler de fallback (1h interval) — solo actúa si el scheduler
   * principal no pudo programar nada (e.g. permisos tardíos).
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
    }, 3600000); // 1 hora
  }
}

export const notificationService = NotificationService.getInstance();

