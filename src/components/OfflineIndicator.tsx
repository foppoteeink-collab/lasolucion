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
        className="fixed bottom-16 sm:bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-2xl bg-amber-950/95 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-amber-200 border border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.35)] animate-in slide-in-from-bottom-2"
        role="status"
        aria-live="polite"
      >
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
        </span>
        <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
        <div className="flex flex-col">
          <span className="font-sans font-black tracking-wide text-amber-300">
            Modo Offline (Guardado local)
          </span>
          <span className="text-[10px] text-amber-400/90 font-normal">
            {pendingCount > 0
              ? `${pendingCount} cambio${pendingCount > 1 ? 's' : ''} en cola IndexedDB • Se sincronizarán al reconectar`
              : 'Tus rachas y datos están resguardados localmente'}
          </span>
        </div>
      </div>
    );
  }

  return null;
};
