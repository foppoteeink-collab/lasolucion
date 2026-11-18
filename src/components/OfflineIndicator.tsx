import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { CloudSyncResult } from '../hooks/useCloudSync';
import { subscribeToOutboxCount } from '../services/offlineOutboxService';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export interface OfflineIndicatorProps {
  cloudSync?: CloudSyncResult;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ cloudSync }) => {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState<number>(cloudSync?.pendingOutboxCount || 0);

  useEffect(() => {
    return subscribeToOutboxCount(setPendingCount);
  }, []);

  const syncStatus = cloudSync?.syncStatus || (isOnline ? 'synced' : 'offline');

  // Solo renderiza la píldora flotante si el usuario está offline o sin conexión.
  // El guardado en la nube (Firestore) se ejecuta en segundo plano de manera silenciosa
  // para no interrumpir ni obstruir la vista de tareas en dispositivos móviles.
  if (!isOnline || syncStatus === 'offline') {
    return (
      <div
        className="fixed bottom-16 sm:bottom-4 left-4 z-50 isolate overflow-hidden flex items-center gap-3 rounded-2xl bg-[#040a1a]/[0.96] px-3.5 py-2.5 text-xs text-slate-100 border border-amber-500/50 shadow-[0_12px_32px_rgba(0,0,0,0.65),0_0_18px_rgba(245,158,11,0.18)] animate-in slide-in-from-bottom-2"
        role="status"
        aria-live="polite"
      >
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div
          className="absolute top-0 inset-x-0 h-px pointer-events-none bg-gradient-to-r from-transparent via-amber-400/55 to-transparent"
          aria-hidden="true"
        />

        <div className="relative z-10 w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center shrink-0">
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
        </div>

        <div className="relative z-10 flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-anton uppercase tracking-wider text-xs text-amber-300">
              Modo Offline
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/35 font-mono tabular-nums text-[9.5px] font-bold text-amber-200 uppercase">
              {pendingCount > 0 ? `${pendingCount} en cola` : 'Local'}
            </span>
          </div>
          <span className="text-[10.5px] text-slate-300 font-normal leading-snug">
            {pendingCount > 0
              ? `${pendingCount} cambio${pendingCount > 1 ? 's' : ''} en IndexedDB • Se sincronizarán al reconectar`
              : 'Tus rachas y datos están resguardados localmente'}
          </span>
        </div>
      </div>
    );
  }

  return null;
};
