import React from 'react';
import { QuantumNoiseCanvas } from './QuantumNoiseCanvas';
import { useUIStore } from '../store/useUIStore';

export const SciFiGridBackground: React.FC = () => {
  const systemAura = useUIStore(s => s.systemAura);
  const zenMode = useUIStore(s => s.zenMode);

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none scifi-grid-bg-root"
      style={{
        background: !zenMode && systemAura?.backgroundColor 
          ? `radial-gradient(ellipse 130% 90% at 50% -10%, ${systemAura.backgroundColor} 0%, #040a1a 60%, #030712 100%)`
          : zenMode
            ? '#030712'
            : 'radial-gradient(ellipse 130% 90% at 50% -10%, #0c1633 0%, #040a1a 45%, #030712 100%)'
      }}
      aria-hidden="true"
    >
      {/* Si el Modo Zen está activo, mantenemos un fondo oscuro puro ultra-limpio sin animaciones */}
      {!zenMode && (
        <>
          {/* CAPA MOXEN MALLA: ATMÓSFERA PERSONALIZADA ACTIVA */}
          {systemAura?.backgroundImage && (
            <div
              data-ambient-glow="true"
              className="absolute inset-0 pointer-events-none transition-all duration-1000 z-[1] mix-blend-screen opacity-70"
              style={{
                backgroundImage: systemAura.backgroundImage,
              }}
            />
          )}

          {/* AMBIENTE ATMOSFÉRICO DE AURORA (Optimizado para 0% lag térmico en GPU) */}
          <div
            data-ambient-glow="true"
            className={`absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-1000 ${
              systemAura ? 'opacity-35' : 'opacity-75'
            }`}
          >
            <div 
              className="absolute -top-[8%] left-1/2 -translate-x-1/2 w-full max-w-7xl h-[480px] pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 75% 55% at 50% 20%, color-mix(in srgb, var(--aura-color-1, #00f0ff) 20%, transparent) 0%, color-mix(in srgb, var(--aura-color-2, #8a2be2) 14%, transparent) 45%, transparent 90%)',
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
