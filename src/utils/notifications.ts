import { AppNotification } from '../types';
import { soundFX } from './audio';

export class NotificationService {
  private static instance: NotificationService;
  private isPushSupported: boolean = false;
  private permission: NotificationPermission = 'default';

  private constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.isPushSupported = true;
      this.permission = Notification.permission;
    }
  }

  public startLocalPushScheduler(getPendingHabits: () => string[]) {
    if (typeof window === 'undefined') return;
    
    // Check every hour (3600000 ms) in the background if app is kept alive
    setInterval(() => {
      if (this.permission !== 'granted') return;
      
      const hour = new Date().getHours();
      // Only remind during daytime (9 AM to 9 PM)
      if (hour < 9 || hour > 21) return;

      const pending = getPendingHabits();
      if (pending.length > 0) {
        this.triggerNotification(
          'KAI: Hábitos Pendientes 💧', 
          `Tienes ${pending.length} hábitos rápidos sin completar hoy. ¡Tómate 1 minuto y hazlo!`, 
          '💧'
        );
      }
    }, 3600000); // 1 hour
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

  public triggerNotification(title: string, body: string, icon = '⚔️'): AppNotification {
    // 1. Play sound
    soundFX.playTaskComplete();

    // 2. Trigger native OS Push notification if granted
    if (this.isPushSupported && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, {
              body,
              icon: '/icon.png',
              badge: '/icon.png',
              vibrate: [200, 100, 200]
            } as any);
          }).catch(err => {
             new Notification(title, { body, icon: '/icon.png' });
          });
        } else {
          new Notification(title, { body, icon: '/icon.png' });
        }
      } catch (err) {
        console.warn('Native notification failed, falling back to in-app toast', err);
      }
    }

    // 3. Return internal notification record for UI storage
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: `${icon} ${title}`,
      message: body,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: title.toLowerCase().includes('nivel') ? 'level_up' : title.toLowerCase().includes('recompensa') ? 'daily_reward' : 'info',
      read: false,
    };

    return newNotif;
  }
}

export const notificationService = NotificationService.getInstance();
