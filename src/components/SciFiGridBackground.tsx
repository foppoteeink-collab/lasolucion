import React from 'react';
import { motion } from 'motion/react';
import { QuantumNoiseCanvas } from './QuantumNoiseCanvas';
import { useUIStore } from '../store/useUIStore';

export const SciFiGridBackground: React.FC = () => {
  const systemAura = useUIStore(s => s.systemAura);
  const c1 = systemAura?.colors?.[0] || 'rgba(0, 240, 255, 0.60)';
  const c2 = systemAura?.colors?.[1] || 'rgba(168, 85, 247, 0.70)';
  const c3 = systemAura?.colors?.[2] || 'rgba(0, 255, 135, 0.65)';

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

      {/* CAPA 1: AURORA BOREAL DINÁMICA FLUIDA (FRAMER MOTION) */}
      <div className={`absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-1000 ${
        systemAura ? 'opacity-40' : 'opacity-100'
      }`}>
        {/* Veta 1: Arco Verde Boreal & Lima Neón */}
        <motion.div 
          animate={{
            x: [-70, 80, -25, -70],
            y: [-25, 45, -15, -25],
            scale: [1, 1.18, 0.94, 1],
            rotate: [-4, 7, -3, -4],
            opacity: [0.70, 0.90, 0.75, 0.70],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-[14%] left-[2%] w-[900px] lg:w-[1300px] h-[520px] lg:h-[700px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 65% 50% at 45% 45%, rgba(0, 255, 135, 0.65) 0%, rgba(16, 185, 129, 0.50) 30%, rgba(214, 244, 33, 0.35) 55%, rgba(5, 150, 105, 0.12) 75%, transparent 90%)',
            filter: 'blur(50px)',
            willChange: 'transform',
          }}
        />

        {/* Veta 2: Velo Magia Violeta & Orquídea Eléctrica */}
        <motion.div 
          animate={{
            x: [70, -75, 25, 70],
            y: [20, -45, 30, 20],
            scale: [1.05, 0.92, 1.20, 1.05],
            rotate: [6, -8, 3, 6],
            opacity: [0.68, 0.92, 0.74, 0.68],
          }}
          transition={{
            duration: 12.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[2%] -right-[8%] w-[850px] lg:w-[1200px] h-[580px] lg:h-[750px] rounded-full pointer-events-none mix-blend-screen"
          style={{
            background: 'radial-gradient(ellipse 60% 55% at 60% 45%, rgba(168, 85, 247, 0.70) 0%, rgba(150, 0, 255, 0.55) 32%, rgba(217, 70, 239, 0.40) 58%, rgba(88, 28, 135, 0.15) 78%, transparent 92%)',
            filter: 'blur(52px)',
            willChange: 'transform',
          }}
        />

        {/* Veta 3: Cortina Cian Ártico & Azul Glacial */}
        <motion.div 
          animate={{
            x: [-60, 85, -20, -60],
            y: [35, -35, 25, 35],
            scale: [0.94, 1.22, 1.02, 0.94],
            rotate: [-6, 6, -3, -6],
            opacity: [0.60, 0.88, 0.68, 0.60],
          }}
          transition={{
            duration: 9.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[32%] -left-[12%] w-[800px] lg:w-[1100px] h-[520px] lg:h-[680px] rounded-full pointer-events-none mix-blend-screen"
          style={{
            background: 'radial-gradient(ellipse 70% 45% at 50% 50%, rgba(0, 240, 255, 0.60) 0%, rgba(6, 182, 212, 0.45) 32%, rgba(59, 130, 246, 0.30) 55%, transparent 80%)',
            filter: 'blur(48px)',
            willChange: 'transform',
          }}
        />

        {/* Veta 4: Haz de Fusión Central (Esmeralda & Magenta) */}
        <motion.div 
          animate={{
            x: [45, -55, 60, 45],
            y: [-30, 35, -15, -30],
            scale: [1, 1.18, 0.92, 1],
            opacity: [0.50, 0.80, 0.58, 0.50],
          }}
          transition={{
            duration: 8.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[18%] left-[22%] w-[700px] lg:w-[950px] h-[420px] lg:h-[580px] rounded-full pointer-events-none mix-blend-screen"
          style={{
            background: 'radial-gradient(ellipse 55% 42% at 50% 50%, rgba(52, 211, 153, 0.50) 0%, rgba(192, 132, 252, 0.40) 48%, transparent 75%)',
            filter: 'blur(50px)',
            willChange: 'transform',
          }}
        />

        {/* Veta 5: Atmósfera Inferior Mística */}
        <motion.div 
          animate={{
            x: [50, -60, 30, 50],
            y: [-20, 25, -10, -20],
            scale: [0.95, 1.15, 1, 0.95],
            opacity: [0.40, 0.65, 0.45, 0.40],
          }}
          transition={{
            duration: 11.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-[8%] right-[12%] w-[750px] lg:w-[1000px] h-[450px] lg:h-[600px] rounded-full pointer-events-none mix-blend-screen"
          style={{
            background: 'radial-gradient(ellipse 65% 45% at 50% 50%, rgba(99, 102, 241, 0.45) 0%, rgba(168, 85, 247, 0.35) 42%, rgba(6, 182, 212, 0.20) 68%, transparent 85%)',
            filter: 'blur(54px)',
            willChange: 'transform',
          }}
        />
      </div>

      {/* CAPA 2: CAMPO DE FLUJO PERLIN / SIMPLEX (PARTÍCULAS ORGÁNICAS SUTILES) */}
      <QuantumNoiseCanvas />
    </div>
  );
};
