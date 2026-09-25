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
        new Notification(title, {
          body,
          icon: '/icon.png',
          badge: '/icon.png',
        });
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
