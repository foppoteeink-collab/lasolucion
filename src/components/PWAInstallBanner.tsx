import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, Smartphone, X, Share, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { soundFX } from '../utils/audio';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem('pwa_banner_dismissed') === 'true';
  });
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    if (!showIOSModal) return;
    document.body.classList.add('modal-open-hide-floating');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowIOSModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('modal-open-hide-floating');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showIOSModal]);

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
      <div className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-40 isolate overflow-hidden bg-[#040a1a]/[0.96] border border-white/15 rounded-2xl p-4 shadow-[0_14px_38px_rgba(0,0,0,0.65)] text-slate-100 animate-in fade-in slide-in-from-bottom-4 transition-all duration-300">
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl aura-btn-gradient optic-active-card flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-anton uppercase tracking-wider text-sm aura-text-soft">Instalar La Solución</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold aura-bg-soft border aura-border-subtle">PWA</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                Acceso rápido desde tu pantalla de inicio con soporte offline.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Descartar aviso de instalación"
            className="chicle-btn w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer shrink-0"
            title="Descartar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative z-10 mt-3.5 flex items-center gap-2">
          <button
            type="button"
            onClick={handleInstallClick}
            className="chicle-btn flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl aura-btn-gradient optic-active-card font-anton uppercase tracking-wider text-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isIOS ? 'Cómo Instalar en iOS' : 'Instalar Aplicación'}</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="chicle-btn py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-xs font-semibold text-slate-200 hover:text-white cursor-pointer"
          >
            Ahora no
          </button>
        </div>
      </div>

      {/* iOS Installation Instructions Modal (Portalized) */}
      {showIOSModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[170] portal-modal-root bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in select-none pointer-events-auto font-sans"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-ios-modal-title"
            className="relative isolate bg-[#030712]/[0.98] border border-white/10 rounded-2xl sm:rounded-3xl max-w-sm w-full p-6 shadow-[0_24px_64px_rgba(0,0,0,0.75)] overflow-hidden text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="vi-grano opacity-5" aria-hidden="true" />
            <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              aria-label="Cerrar instrucciones de instalación en iOS"
              className="chicle-btn absolute top-4 right-4 z-10 w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative z-10 text-center mb-5">
              <div className="w-14 h-14 rounded-2xl aura-bg-soft border aura-border-subtle aura-glow-subtle mx-auto flex items-center justify-center mb-3">
                <Smartphone className="w-7 h-7 aura-text-primary" />
              </div>
              <h3 id="pwa-ios-modal-title" className="font-anton uppercase tracking-wider text-lg aura-text-soft">
                Instalar en iPhone / iPad
              </h3>
              <p className="text-xs text-slate-400 mt-1">Sigue estos sencillos pasos desde Safari:</p>
            </div>

            <div className="relative z-10 space-y-3 text-xs text-slate-300 mb-6">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#040814]/80 border border-white/10">
                <div className="w-7 h-7 rounded-lg aura-bg-soft border aura-border-subtle flex items-center justify-center shrink-0 font-mono tabular-nums font-bold">1</div>
                <p className="flex-1">Toca el botón <span className="font-bold aura-text-soft">Compartir</span> <Share className="w-3.5 h-3.5 inline mx-1 aura-text-primary" /> en la barra inferior de Safari.</p>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#040814]/80 border border-white/10">
                <div className="w-7 h-7 rounded-lg aura-bg-soft border aura-border-subtle flex items-center justify-center shrink-0 font-mono tabular-nums font-bold">2</div>
                <p className="flex-1">Desplázate hacia abajo y selecciona <span className="font-bold aura-text-soft">&quot;Agregar a inicio&quot;</span> <PlusSquare className="w-3.5 h-3.5 inline mx-1 aura-text-primary" />.</p>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#040814]/80 border border-white/10">
                <div className="w-7 h-7 rounded-lg aura-bg-soft border aura-border-subtle flex items-center justify-center shrink-0 font-mono tabular-nums font-bold">3</div>
                <p className="flex-1">Presiona <span className="font-bold aura-text-soft">&quot;Agregar&quot;</span> en la esquina superior derecha.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="chicle-btn relative z-10 w-full py-2.5 rounded-xl aura-btn-gradient optic-active-card font-anton uppercase tracking-wider text-xs cursor-pointer"
            >
              ¡Entendido!
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
