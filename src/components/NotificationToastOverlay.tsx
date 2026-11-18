import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from './common/Icon';
import { AppNotification } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface ToastSemanticStyle {
  borderClass: string;
  titleClass: string;
  iconBoxClass: string;
  glowClass: string;
  filamentClass: string;
}

const getToastSemanticStyle = (type: AppNotification['type']): ToastSemanticStyle => {
  switch (type) {
    case 'streak_warning':
      return {
        borderClass: 'border-rose-500/60 shadow-[0_14px_36px_rgba(0,0,0,0.65),0_0_22px_rgba(244,63,94,0.22)]',
        titleClass: 'text-rose-300',
        iconBoxClass: 'bg-rose-500/15 border-rose-500/35 text-rose-200',
        glowClass: 'bg-rose-500/15',
        filamentClass: 'bg-gradient-to-r from-transparent via-rose-400/60 to-transparent',
      };
    case 'level_up':
    case 'daily_reward':
    case 'streak':
      return {
        borderClass: 'border-amber-500/60 shadow-[0_14px_36px_rgba(0,0,0,0.65),0_0_22px_rgba(245,158,11,0.22)]',
        titleClass: 'text-amber-300',
        iconBoxClass: 'bg-amber-500/15 border-amber-500/35 text-amber-200',
        glowClass: 'bg-amber-500/15',
        filamentClass: 'bg-gradient-to-r from-transparent via-amber-400/60 to-transparent',
      };
    case 'pomodoro':
      return {
        borderClass: 'border-emerald-500/60 shadow-[0_14px_36px_rgba(0,0,0,0.65),0_0_22px_rgba(16,185,129,0.2)]',
        titleClass: 'text-emerald-300',
        iconBoxClass: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-200',
        glowClass: 'bg-emerald-500/15',
        filamentClass: 'bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent',
      };
    case 'nightly':
      return {
        borderClass: 'border-indigo-400/55 shadow-[0_14px_36px_rgba(0,0,0,0.65),0_0_22px_rgba(129,140,248,0.2)]',
        titleClass: 'text-indigo-300',
        iconBoxClass: 'bg-indigo-500/15 border-indigo-400/35 text-indigo-200',
        glowClass: 'bg-indigo-500/15',
        filamentClass: 'bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent',
      };
    case 'task_alarm':
    case 'reminder':
    case 'info':
    default:
      return {
        borderClass: 'aura-border-subtle aura-glow-subtle shadow-[0_14px_36px_rgba(0,0,0,0.65)]',
        titleClass: 'aura-text-soft',
        iconBoxClass: 'aura-bg-soft border aura-border-subtle',
        glowClass: 'bg-[rgba(var(--aura-glow-rgb,0,240,255),0.14)]',
        filamentClass: 'aura-top-filament',
      };
  }
};

export const NotificationToastOverlay: React.FC = () => {
  const [toasts, setToasts] = useState<AppNotification[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<AppNotification>;
      if (!customEvent.detail) return;

      const newNotif = customEvent.detail;
      setToasts(prev => [newNotif, ...prev].slice(0, 4)); // Máximo 4 toasts simultáneos

      // Pulso háptico sutil en notificaciones críticas o de combate/subida de nivel
      if (newNotif.type === 'level_up' || newNotif.type === 'streak_warning' || newNotif.type === 'task_alarm') {
        triggerHaptic([20, 30]);
      }

      // Limpiar timer previo si existía el mismo ID
      const existingTimer = timersRef.current.get(newNotif.id);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Auto-dismiss tras 6 segundos
      const timerId = setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newNotif.id));
        timersRef.current.delete(newNotif.id);
      }, 6000);
      timersRef.current.set(newNotif.id, timerId);
    };

    window.addEventListener('lasolucion:toast-notification', handleToastEvent);
    return () => {
      window.removeEventListener('lasolucion:toast-notification', handleToastEvent);
      timersRef.current.forEach((timerId) => clearTimeout(timerId));
      timersRef.current.clear();
    };
  }, []);

  const removeToast = (id: string) => {
    const timerId = timersRef.current.get(id);
    if (timerId) {
      clearTimeout(timerId);
      timersRef.current.delete(id);
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getToastIcon = (type: AppNotification['type'], defaultIcon?: string) => {
    if (defaultIcon) return defaultIcon;
    switch (type) {
      case 'level_up':
        return '⚡';
      case 'daily_reward':
        return '🎁';
      case 'streak_warning':
        return '🛡️';
      case 'nightly':
        return '🌙';
      case 'reminder':
        return '🌅';
      case 'task_alarm':
        return '⏰';
      default:
        return '🔔';
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="region"
      aria-label="Notificaciones del sistema"
      aria-live="polite"
      className="fixed top-4 right-4 z-[190] portal-modal-root flex flex-col gap-3 max-w-sm w-[calc(100vw-2rem)] pointer-events-none font-sans"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const style = getToastSemanticStyle(toast.type);
          return (
            <motion.div
              key={toast.id}
              role={toast.type === 'streak_warning' || toast.type === 'task_alarm' ? 'alert' : 'status'}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: 50 }}
              transition={{ duration: 0.25 }}
              className={`pointer-events-auto relative isolate bg-[#040a1a]/[0.96] border border-white/15 ${style.borderClass} rounded-2xl p-4 flex items-start gap-3 overflow-hidden`}
            >
              <span className="vi-grano opacity-5" aria-hidden="true" />
              <div className={`absolute top-0 inset-x-0 h-px pointer-events-none ${style.filamentClass}`} aria-hidden="true" />

              {/* Semantic Ambient Corner Glow */}
              <div
                data-ambient-glow="true"
                className={`absolute -right-8 -bottom-8 w-24 h-24 ${style.glowClass} rounded-full blur-xl pointer-events-none`}
              />

              <div className={`relative z-10 w-10 h-10 rounded-xl border ${style.iconBoxClass} flex items-center justify-center text-xl shrink-0`}>
                {getToastIcon(toast.type, toast.icon)}
              </div>

              <div className="relative z-10 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-xs font-anton uppercase tracking-wider ${style.titleClass} truncate`}>
                    {toast.title}
                  </h4>
                  <span className="text-[10px] font-mono tabular-nums text-slate-400 shrink-0">
                    {toast.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed font-medium">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label={`Cerrar notificación ${toast.title}`}
                className="chicle-btn relative z-10 w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-400 hover:text-white flex items-center justify-center shrink-0 cursor-pointer"
                title="Cerrar"
              >
                <Icon name="x" className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body
  );
};
