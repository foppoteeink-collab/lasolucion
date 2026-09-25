import React, { useState } from 'react';
import { Download, Smartphone, X, Share, PlusSquare, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { soundFX } from '../utils/audio';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem('pwa_banner_dismissed') === 'true';
  });
  const [showIOSModal, setShowIOSModal] = useState(false);

  const handleDismiss = () => {
    soundFX.playClick();
    setIsDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    soundFX.playClick();
    if (isIOS) {
      setShowIOSModal(true);
    } else {
      const success = await install();
      if (success) {
        soundFX.playLevelUp();
      }
    }
  };

  if (isInstalled || isDismissed) return null;

  // Show banner if native prompt is ready OR on iOS (where prompt is manual)
  if (!isInstallable && !isIOS) return null;

  return (
    <>
      {/* Floating PWA Install Banner */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-40 bg-slate-900/95 dark:bg-[#0d1527]/95 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,240,255,0.25)] text-slate-100 animate-in fade-in slide-in-from-bottom-4 transition-all duration-300">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 shrink-0">
              <Smartphone className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-sans font-black text-sm text-cyan-400 tracking-wide">Instalar La Solución</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">PWA</span>
              </div>
              <p className="text-xs text-slate-300 dark:text-slate-400 mt-0.5 leading-snug">
                Acceso rápido desde tu pantalla de inicio con soporte offline.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title="Descartar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3.5 flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{isIOS ? 'Cómo Instalar en iOS' : 'Instalar Aplicación'}</span>
          </button>
          <button
            onClick={handleDismiss}
            className="py-2 px-3 rounded-xl border border-slate-700 hover:bg-slate-800/80 text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            Ahora no
          </button>
        </div>
      </div>

      {/* iOS Installation Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-slate-100 relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 mx-auto flex items-center justify-center mb-3">
                <Smartphone className="w-7 h-7" />
              </div>
              <h3 className="font-sans font-black text-lg text-cyan-300">Instalar en iPhone / iPad</h3>
              <p className="text-xs text-slate-400 mt-1">Sigue estos sencillos pasos desde Safari:</p>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300 mb-6">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold">1</div>
                <p className="flex-1">Toca el botón <span className="font-bold text-cyan-300">Compartir</span> <Share className="w-3.5 h-3.5 inline mx-1 text-cyan-400" /> en la barra inferior de Safari.</p>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold">2</div>
                <p className="flex-1">Desplázate hacia abajo y selecciona <span className="font-bold text-cyan-300">"Agregar a inicio"</span> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-cyan-400" />.</p>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold">3</div>
                <p className="flex-1">Presiona <span className="font-bold text-cyan-300">"Agregar"</span> en la esquina superior derecha.</p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition cursor-pointer"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
