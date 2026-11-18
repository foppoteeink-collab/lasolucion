import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { executeEmergencyStorageRecovery } from '../utils/storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  declare props: Readonly<Props>;
  declare state: Readonly<State>;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    const isChunkMismatch =
      error?.message?.includes('dynamically imported module') ||
      error?.message?.includes('Failed to fetch dynamically imported module');

    if (isChunkMismatch) {
      const key = 'chunk_reload_attempt';
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, 'true');
        this.handleReload();
      }
    }
  }

  private handleReload = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {}
    window.location.href = window.location.pathname + '?v=' + Date.now();
  };

  private handleResetLocalData = async () => {
    try {
      await executeEmergencyStorageRecovery();
    } catch (e) {
      console.warn('[ErrorBoundary] Emergency storage recovery failed:', e);
    }
    window.location.href = window.location.pathname + '?clear=' + Date.now();
  };

  render() {
    if (this.state.hasError) {
      const isUpdate =
        this.state.error?.message?.includes('dynamically imported module') ||
        this.state.error?.message?.includes('Failed to fetch');

      return (
        <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 text-white font-sans">
          <div className="relative isolate max-w-md w-full bg-[#040a1a]/[0.96] border border-white/10 rounded-2xl sm:rounded-3xl p-6 shadow-[0_24px_64px_rgba(0,0,0,0.75)] text-center flex flex-col items-center gap-4 overflow-hidden">
            <span className="vi-grano opacity-5" aria-hidden="true" />
            <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

            <div className={`relative z-10 p-3 rounded-2xl border ${isUpdate ? 'aura-bg-soft aura-border-subtle aura-text-primary' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
              {isUpdate ? <RefreshCw className="w-10 h-10 animate-spin" /> : <AlertTriangle className="w-10 h-10" />}
            </div>

            <div className="relative z-10">
              <h2 className="text-xl font-anton uppercase tracking-wider text-white">
                {isUpdate ? '¡Nueva versión disponible!' : 'La Solución se ha detenido'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isUpdate
                  ? 'Se publicó una actualización de la aplicación. Pulsa el botón para cargarla.'
                  : 'Se detectó una interrupción inesperada al cargar la aplicación.'}
              </p>
            </div>

            {this.state.error && !isUpdate && (
              <div className="relative z-10 w-full bg-[#040814]/90 border border-white/10 rounded-xl p-3 text-left font-mono text-[11px] text-rose-300 overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full mt-2">
              <button
                onClick={this.handleReload}
                className="chicle-btn aura-btn-gradient optic-active-card flex-1 px-4 py-2.5 rounded-xl font-anton text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                {isUpdate ? 'Actualizar ahora' : 'Reintentar'}
              </button>

              <button
                onClick={this.handleResetLocalData}
                title="Crea un respaldo de seguridad, limpia el almacenamiento local y recarga limpiamente"
                className="chicle-btn px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] text-slate-200 hover:text-white font-anton text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-white/15 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 aura-text-primary" />
                Restablecer y Reparar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
