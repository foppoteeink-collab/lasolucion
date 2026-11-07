import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

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
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
    } catch (e) {
      console.warn('Cache clear failed:', e);
    }
    window.location.href = window.location.pathname + '?clear=' + Date.now();
  };

  render() {
    if (this.state.hasError) {
      const isUpdate =
        this.state.error?.message?.includes('dynamically imported module') ||
        this.state.error?.message?.includes('Failed to fetch');

      return (
        <div className="min-h-screen bg-[#070417] flex items-center justify-center p-4 text-white font-sans">
          <div className="max-w-md w-full bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-xl text-center flex flex-col items-center gap-4">
            <div className={`p-3 rounded-full ${isUpdate ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'} animate-pulse`}>
              {isUpdate ? <RefreshCw className="w-10 h-10 animate-spin" /> : <AlertTriangle className="w-10 h-10" />}
            </div>

            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-400 bg-clip-text text-transparent">
                {isUpdate ? '¡Nueva versión disponible!' : 'La Solución se ha detenido'}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {isUpdate
                  ? 'Se publicó una actualización de la aplicación. Pulsa el botón para cargarla.'
                  : 'Se detectó una interrupción inesperada al cargar la aplicación.'}
              </p>
            </div>

            {this.state.error && !isUpdate && (
              <div className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-left font-mono text-[11px] text-red-300 overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                {isUpdate ? 'Actualizar ahora' : 'Reintentar'}
              </button>

              <button
                onClick={this.handleResetLocalData}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-slate-700 active:scale-95"
              >
                <Trash2 className="w-4 h-4 text-cyan-400" />
                Limpiar Caché
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
