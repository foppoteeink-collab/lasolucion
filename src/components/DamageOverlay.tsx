import React, { useEffect, useState } from 'react';
import { soundFX } from '../utils/audio';
import { useUIStore } from '../store/useUIStore';
import { triggerHaptic } from '../utils/haptics';

export const DamageOverlay: React.FC = () => {
  const [damageAmount, setDamageAmount] = useState<number | null>(null);
  const [showDeath, setShowDeath] = useState<{xpLost: number, coinsLost: number} | null>(null);
  const { screenFlash, triggerScreenFlash } = useUIStore();
  const lastShakeTimeRef = React.useRef<number>(0);
  const shakeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const damageTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const deathTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleDamage = (e: Event) => {
      const customEvent = e as CustomEvent<{
        amount?: number;
        died?: boolean;
        xpLost?: number;
        coinsLost?: number;
      }>;
      if (!customEvent?.detail) return;

      const { amount = 0, died = false, xpLost = 0, coinsLost = 0 } = customEvent.detail;
      setDamageAmount(amount);

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      const now = Date.now();
      // Throttle audio, haptic, and shake to avoid clipping and DOM lockups
      if (now - lastShakeTimeRef.current > 250) {
        lastShakeTimeRef.current = now;
        soundFX.playDamageSound();
        triggerHaptic([200, 100, 200]);
        triggerScreenFlash('damage');

        if (!prefersReducedMotion) {
          const wrapper = document.getElementById('main-layout-wrapper');
          if (wrapper) {
            wrapper.classList.remove('animate-shake');
            // Force layout reflow trick to restart animation cleanly if already running
            void wrapper.offsetWidth;
            wrapper.classList.add('animate-shake');
          }

          if (shakeTimerRef.current) {
            clearTimeout(shakeTimerRef.current);
          }
          shakeTimerRef.current = setTimeout(() => {
            const el = document.getElementById('main-layout-wrapper');
            if (el) el.classList.remove('animate-shake');
            shakeTimerRef.current = null;
          }, 500);
        }
      }

      if (died) {
        if (deathTimerRef.current) clearTimeout(deathTimerRef.current);
        deathTimerRef.current = setTimeout(() => {
          setShowDeath({ xpLost, coinsLost });
          deathTimerRef.current = null;
        }, 1000);
      }

      if (damageTimerRef.current) clearTimeout(damageTimerRef.current);
      damageTimerRef.current = setTimeout(() => {
        setDamageAmount(null);
        damageTimerRef.current = null;
      }, 2000);
    };

    window.addEventListener('player-damage', handleDamage);
    return () => {
      window.removeEventListener('player-damage', handleDamage);
      if (shakeTimerRef.current) {
        clearTimeout(shakeTimerRef.current);
        const el = document.getElementById('main-layout-wrapper');
        if (el) el.classList.remove('animate-shake');
      }
      if (damageTimerRef.current) clearTimeout(damageTimerRef.current);
      if (deathTimerRef.current) clearTimeout(deathTimerRef.current);
    };
  }, [triggerScreenFlash]);

  useEffect(() => {
    if (!showDeath) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        soundFX.playClick();
        triggerHaptic([30, 45]);
        setShowDeath(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDeath]);

  // Determine flash colors based on type
  if (!screenFlash && damageAmount === null && !showDeath) {
    return null;
  }

  const isDamageFlash = screenFlash === 'damage';
  const isHealFlash = screenFlash === 'heal';
  const flashOpacity = screenFlash ? 'opacity-100' : 'opacity-0';
  
  let boxShadow = 'none';
  let backgroundColor = 'transparent';
  
  if (isDamageFlash) {
    boxShadow = 'inset 0 0 100px 20px rgba(220, 38, 38, 0.6)';
    backgroundColor = 'rgba(220, 38, 38, 0.2)'; // Blood red flash
  } else if (isHealFlash) {
    boxShadow = 'inset 0 0 100px 20px rgba(45, 212, 191, 0.6)'; // Cyan/Green flash
    backgroundColor = 'rgba(45, 212, 191, 0.15)'; 
  }

  return (
    <>
      {/* Global Screen Flash */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-[100] pointer-events-none transition-all duration-300 ${flashOpacity}`}
        style={{
          boxShadow,
          backgroundColor,
        }}
      />

      {/* Damage Amount Text */}
      <div aria-hidden="true" className="fixed inset-0 z-[101] pointer-events-none">
        {damageAmount !== null && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-bounce">
            <span className="text-red-500 text-5xl md:text-7xl font-black drop-shadow-[0_0_20px_rgba(220,38,38,1)] uppercase tracking-widest">
              💔 -{damageAmount} HP
            </span>
          </div>
        )}
      </div>

      {/* Death Modal */}
      {showDeath && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="death-modal-title"
            className="bg-[#1a0505] border-2 border-red-900/50 rounded-2xl p-6 md:p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(220,38,38,0.3)] animate-in zoom-in-95 duration-500"
          >
            <h2 id="death-modal-title" className="text-3xl font-black text-red-500 uppercase tracking-widest mb-4">
              Caído en Batalla
            </h2>
            <p className="text-red-200 mb-6 text-sm md:text-base leading-relaxed">
              La procrastinación ha consumido tu vitalidad. Has sido revivido, pero a un gran costo...
            </p>
            <div className="flex justify-center gap-6 mb-8">
              <div className="text-center">
                <span className="block text-2xl font-bold text-red-400">-{showDeath.xpLost}</span>
                <span className="text-xs text-red-500/70 uppercase">XP Perdida</span>
              </div>
              <div className="text-center">
                <span className="block text-2xl font-bold text-yellow-500">-{showDeath.coinsLost}</span>
                <span className="text-xs text-yellow-600/70 uppercase">Monedas</span>
              </div>
            </div>
            <button
              type="button"
              autoFocus
              aria-label="Aceptar penalización y levantarse de nuevo"
              onClick={() => {
                soundFX.playClick();
                triggerHaptic([30, 45]);
                setShowDeath(null);
              }}
              className="w-full bg-red-900/40 hover:bg-red-800 text-white font-bold py-3 rounded-xl uppercase tracking-widest transition-colors border border-red-500/30 cursor-pointer"
            >
              Levantarse de nuevo
            </button>
          </div>
        </div>
      )}
    </>
  );
};
