import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShockwaveColor, ShockwaveIntensity } from '../utils/celebration';

interface ActiveShockwave {
  id: string;
  color: ShockwaveColor;
  intensity: ShockwaveIntensity;
}

const COLOR_MAP: Record<ShockwaveColor, {
  glowBorder: string;
  ringBorder: string;
  ringGlow: string;
  ambientTint: string;
}> = {
  emerald: {
    glowBorder: 'rgba(16, 185, 129, 0.45)',
    ringBorder: '#10b981',
    ringGlow: '0 0 35px rgba(16, 185, 129, 0.75)',
    ambientTint: 'rgba(16, 185, 129, 0.08)',
  },
  gold: {
    glowBorder: 'rgba(245, 158, 11, 0.55)',
    ringBorder: '#fbbf24',
    ringGlow: '0 0 40px rgba(245, 158, 11, 0.85)',
    ambientTint: 'rgba(245, 158, 11, 0.10)',
  },
  cyan: {
    glowBorder: 'rgba(6, 182, 212, 0.5)',
    ringBorder: '#22d3ee',
    ringGlow: '0 0 35px rgba(6, 182, 212, 0.8)',
    ambientTint: 'rgba(6, 182, 212, 0.08)',
  },
  violet: {
    glowBorder: 'rgba(168, 85, 247, 0.5)',
    ringBorder: '#c084fc',
    ringGlow: '0 0 35px rgba(168, 85, 247, 0.8)',
    ambientTint: 'rgba(168, 85, 247, 0.08)',
  },
};

export const ShockwaveOverlay: React.FC = () => {
  const [shockwaves, setShockwaves] = useState<ActiveShockwave[]>([]);

  useEffect(() => {
    const handleTrigger = (e: any) => {
      const { color = 'emerald', intensity = 'medium' } = e.detail || {};
      const newWave: ActiveShockwave = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        color,
        intensity,
      };

      setShockwaves((prev) => [...prev.slice(-2), newWave]);

      // Remove after animation finishes
      const duration = intensity === 'epic' ? 950 : 700;
      setTimeout(() => {
        setShockwaves((prev) => prev.filter((w) => w.id !== newWave.id));
      }, duration);
    };

    window.addEventListener('celebration-shockwave', handleTrigger);
    return () => {
      window.removeEventListener('celebration-shockwave', handleTrigger);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[120] overflow-hidden">
      <AnimatePresence>
        {shockwaves.map((wave) => {
          const cfg = COLOR_MAP[wave.color] || COLOR_MAP.emerald;
          const isEpic = wave.intensity === 'epic';

          return (
            <React.Fragment key={wave.id}>
              {/* 1. Viñeta luminiscente perimetral (Resplandor en los 4 bordes de la pantalla) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1, 0.8, 0],
                  transition: {
                    duration: isEpic ? 0.9 : 0.65,
                    times: [0, 0.15, 0.45, 1],
                    ease: [0.16, 1, 0.3, 1],
                  },
                }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow: `inset 0 0 ${isEpic ? '120px 35px' : '75px 20px'} ${cfg.glowBorder}`,
                  backgroundColor: cfg.ambientTint,
                }}
              />

              {/* 2. Anillo de Energía expansivo (Energy Ring Shockwave) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  initial={{
                    scale: 0.25,
                    opacity: 0.95,
                    borderWidth: '2px',
                  }}
                  animate={{
                    scale: [0.25, isEpic ? 2.4 : 1.7],
                    opacity: [0.95, 0.65, 0],
                    borderWidth: ['2.5px', '1px', '0.5px'],
                  }}
                  transition={{
                    duration: isEpic ? 0.85 : 0.65,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="rounded-full pointer-events-none"
                  style={{
                    width: '320px',
                    height: '320px',
                    borderColor: cfg.ringBorder,
                    boxShadow: cfg.ringGlow,
                  }}
                />

                {/* Doble anillo secundario sutil para logros épicos (Subir de nivel / Terminar jornada) */}
                {isEpic && (
                  <motion.div
                    initial={{ scale: 0.15, opacity: 0.85 }}
                    animate={{
                      scale: [0.15, 2.0],
                      opacity: [0.85, 0.4, 0],
                    }}
                    transition={{
                      duration: 0.95,
                      delay: 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="rounded-full pointer-events-none border border-white/60 absolute"
                    style={{
                      width: '260px',
                      height: '260px',
                      boxShadow: '0 0 25px rgba(255, 255, 255, 0.6)',
                    }}
                  />
                )}
              </div>
            </React.Fragment>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ShockwaveOverlay;
