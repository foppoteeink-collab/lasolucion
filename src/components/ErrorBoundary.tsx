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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // console.error('La Solución Uncaught Error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetLocalData = () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage?.clear();
        window.sessionStorage?.clear();
      }
    } catch (e) {
      console.warn('localStorage clear failed:', e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070417] flex items-center justify-center p-4 text-white font-sans">
          <div className="max-w-md w-full bg-slate-900/90 border border-fuchsia-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-xl text-center flex flex-col items-center gap-4">
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 animate-pulse">
              <AlertTriangle className="w-10 h-10" />
            </div>

            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-400 bg-clip-text text-transparent">
                La Solución se ha detenido
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Se detectó un error inesperado al renderizar la aplicación.
              </p>
            </div>

            {this.state.error && (
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
                Reintentar
              </button>

              <button
                onClick={this.handleResetLocalData}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-slate-700 active:scale-95"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
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
