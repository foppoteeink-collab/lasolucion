import React from 'react';
import { motion } from 'motion/react';
import { QuantumNoiseCanvas } from './QuantumNoiseCanvas';
import { useUIStore } from '../store/useUIStore';

export const SciFiGridBackground: React.FC = () => {
  const systemAura = useUIStore(s => s.systemAura);
  const zenMode = useUIStore(s => s.zenMode);

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
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
          {/* MÓVIL: Velo CSS Ligero y Estático (0% carga de GPU/JS en teléfonos) */}
          <div className="block md:hidden absolute inset-0 pointer-events-none overflow-hidden opacity-80">
            <div 
              className="absolute -top-[10%] left-0 right-0 h-[450px] pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 80% 50% at 50% 15%, rgba(0, 240, 255, 0.22) 0%, rgba(168, 85, 247, 0.18) 45%, rgba(0, 255, 135, 0.10) 70%, transparent 95%)',
                filter: 'blur(30px)',
              }}
            />
          </div>

          {/* DESKTOP / TABLET: AURORA BOREAL FLUIDA DINÁMICA (3 vetas optimizadas) */}
          <div className={`hidden md:block absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-1000 ${
            systemAura ? 'opacity-35' : 'opacity-90'
          }`}>
            {/* Veta 1: Arco Verde Boreal & Lima Neón */}
            <motion.div 
              animate={{
                x: [-50, 60, -20, -50],
                y: [-20, 35, -10, -20],
                scale: [1, 1.12, 0.96, 1],
                opacity: [0.65, 0.85, 0.70, 0.65],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -top-[12%] left-[4%] w-[850px] lg:w-[1200px] h-[500px] lg:h-[650px] rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 65% 50% at 45% 45%, rgba(0, 255, 135, 0.60) 0%, rgba(16, 185, 129, 0.45) 30%, rgba(214, 244, 33, 0.28) 55%, transparent 90%)',
                filter: 'blur(45px)',
                willChange: 'transform',
              }}
            />

            {/* Veta 2: Velo Magia Violeta & Orquídea Eléctrica */}
            <motion.div 
              animate={{
                x: [50, -60, 20, 50],
                y: [15, -35, 25, 15],
                scale: [1.02, 0.94, 1.15, 1.02],
                opacity: [0.60, 0.85, 0.68, 0.60],
              }}
              transition={{
                duration: 14,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-[2%] -right-[6%] w-[800px] lg:w-[1100px] h-[520px] lg:h-[700px] rounded-full pointer-events-none mix-blend-screen"
              style={{
                background: 'radial-gradient(ellipse 60% 55% at 60% 45%, rgba(168, 85, 247, 0.65) 0%, rgba(150, 0, 255, 0.48) 32%, rgba(217, 70, 239, 0.32) 58%, transparent 92%)',
                filter: 'blur(45px)',
                willChange: 'transform',
              }}
            />

            {/* Veta 3: Cortina Cian Ártico & Azul Glacial */}
            <motion.div 
              animate={{
                x: [-40, 60, -15, -40],
                y: [25, -25, 20, 25],
                scale: [0.96, 1.15, 1, 0.96],
                opacity: [0.55, 0.78, 0.60, 0.55],
              }}
              transition={{
                duration: 11,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-[30%] -left-[10%] w-[750px] lg:w-[1000px] h-[480px] lg:h-[620px] rounded-full pointer-events-none mix-blend-screen"
              style={{
                background: 'radial-gradient(ellipse 70% 45% at 50% 50%, rgba(0, 240, 255, 0.55) 0%, rgba(6, 182, 212, 0.38) 32%, rgba(59, 130, 246, 0.22) 55%, transparent 80%)',
                filter: 'blur(42px)',
                willChange: 'transform',
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
