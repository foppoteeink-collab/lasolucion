import React from 'react';
import { motion } from 'motion/react';
import { QuantumNoiseCanvas } from './QuantumNoiseCanvas';
import { useUIStore } from '../store/useUIStore';

export const SciFiGridBackground: React.FC = () => {
  const systemAura = useUIStore(s => s.systemAura);
  const zenMode = useUIStore(s => s.zenMode);

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none scifi-grid-bg-root"
      style={{
        background: systemAura?.backgroundColor 
          ? `radial-gradient(ellipse 130% 90% at 50% -10%, ${systemAura.backgroundColor} 0%, #050b1a 60%, #02040a 100%)`
          : 'radial-gradient(ellipse 130% 90% at 50% -10%, #0c1633 0%, #050b1a 45%, #02040a 100%)'
      }}
      aria-hidden="true"
    >
      {/* CAPA MOXEN MALLA: ATMÓSFERA PERSONALIZADA ACTIVA */}
      {systemAura?.backgroundImage && (
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-1000 z-[1] mix-blend-screen opacity-70"
          style={{
            backgroundImage: systemAura.backgroundImage,
          }}
        />
      )}

      {/* Si el Modo Zen está activo, mantenemos un fondo oscuro puro ultra-limpio sin animaciones */}
      {!zenMode && (
        <>
          {/* AMBIENTE ATMOSFÉRICO DE AURORA (Optimizado para 0% lag térmico en GPU) */}
          <div className={`absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-1000 ${
            systemAura ? 'opacity-35' : 'opacity-75'
          }`}>
            <div 
              className="absolute -top-[8%] left-1/2 -translate-x-1/2 w-full max-w-7xl h-[480px] pointer-events-none"
              style={{
                background: systemAura?.colors && systemAura.colors.length >= 2
                  ? 'radial-gradient(ellipse 75% 55% at 50% 20%, color-mix(in srgb, var(--aura-color-1) 20%, transparent) 0%, color-mix(in srgb, var(--aura-color-2) 14%, transparent) 45%, transparent 90%)'
                  : 'radial-gradient(ellipse 75% 55% at 50% 20%, rgba(0, 240, 255, 0.18) 0%, rgba(168, 85, 247, 0.14) 45%, rgba(0, 255, 135, 0.08) 70%, transparent 90%)',
              }}
            />
          </div>

          {/* CAPA 2: CAMPO DE FLUJO PERLIN / SIMPLEX ULTRA-LIVIANO */}
          <QuantumNoiseCanvas />
        </>
      )}
    </div>
  );
};
