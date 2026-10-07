import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, CheckCircle2, ShieldAlert, Moon, Sun, Clock, X, Sparkles } from 'lucide-react';
import { AppNotification } from '../types';

export const NotificationToastOverlay: React.FC = () => {
  const [toasts, setToasts] = useState<AppNotification[]>([]);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<AppNotification>;
      if (!customEvent.detail) return;

      const newNotif = customEvent.detail;
      setToasts(prev => [newNotif, ...prev].slice(0, 4)); // Máximo 4 toasts simultáneos

      // Auto-dismiss tras 6 segundos
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newNotif.id));
      }, 6000);
    };

    window.addEventListener('lasolucion:toast-notification', handleToastEvent);
    return () => {
      window.removeEventListener('lasolucion:toast-notification', handleToastEvent);
    };
  }, []);

  const removeToast = (id: string) => {
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

  const getBorderColor = (type: AppNotification['type']) => {
    switch (type) {
      case 'level_up':
        return 'border-amber-500/80 shadow-amber-500/20';
      case 'streak_warning':
        return 'border-rose-500/80 shadow-rose-500/20';
      case 'nightly':
        return 'border-indigo-500/80 shadow-indigo-500/20';
      case 'task_alarm':
        return 'border-cyan-500/80 shadow-cyan-500/20';
      default:
        return 'border-emerald-500/80 shadow-emerald-500/20';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-[calc(100vw-2rem)] pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, x: 50 }}
            transition={{ duration: 0.25 }}
            className={`pointer-events-auto bg-[#070e17]/95 backdrop-blur-md border ${getBorderColor(toast.type)} rounded-2xl p-4 shadow-2xl flex items-start gap-3 relative overflow-hidden`}
          >
            {/* Ambient Background Glow */}
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />

            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center text-xl shrink-0 shadow-inner">
              {getToastIcon(toast.type, toast.icon)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-cyan-300 truncate">
                  {toast.title}
                </h4>
                <span className="text-[10px] font-mono text-slate-500 shrink-0">
                  {toast.timestamp}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed font-medium">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
