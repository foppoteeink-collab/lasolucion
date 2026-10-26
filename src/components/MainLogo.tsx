import React from 'react';
import { motion } from 'motion/react';
import logoImg from '../assets/logo-solucion.png';

export interface MainLogoProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'massive';
  className?: string;
  forceColor?: string;
  speed?: 'normal' | 'fast';
  showParticles?: boolean;
  showGlow?: boolean;
}

// Partículas brillantes que replican las lucesitas neón del diseño oficial
// Estrictamente utilizando los dos colores del logo:
// 1. Cian Neón (#00f0ff) en el sector izquierdo
// 2. Verde Esmeralda Neón (#10e29d) en el sector derecho
const PARTICLES = [
  // Sector Cian (LA - SOLU)
  { id: 1, x: 12.5, y: 22, size: 3.5, color: '#00f0ff', delay: 0.1, duration: 2.6 },
  { id: 2, x: 17.0, y: 76, size: 2.5, color: '#00f0ff', delay: 0.9, duration: 3.1 },
  { id: 3, x: 26.5, y: 19, size: 3.0, color: '#00f0ff', delay: 1.4, duration: 2.8 },
  { id: 4, x: 42.0, y: 21, size: 3.2, color: '#00f0ff', delay: 0.4, duration: 2.9 },
  { id: 5, x: 50.5, y: 80, size: 2.8, color: '#00f0ff', delay: 1.7, duration: 3.3 },

  // Sector Verde Esmeralda (CIÓN)
  { id: 6, x: 58.5, y: 23, size: 3.0, color: '#10e29d', delay: 0.6, duration: 2.7 },
  { id: 7, x: 74.0, y: 81, size: 2.5, color: '#10e29d', delay: 1.2, duration: 3.2 },
  { id: 8, x: 82.5, y: 21, size: 3.2, color: '#10e29d', delay: 1.9, duration: 2.5 },
  { id: 9, x: 94.0, y: 28, size: 2.4, color: '#10e29d', delay: 0.3, duration: 3.0 },
  { id: 10, x: 96.0, y: 73, size: 3.6, color: '#10e29d', delay: 1.5, duration: 2.9 },
];

export const MainLogo: React.FC<MainLogoProps> = ({
  size = 'md',
  className = '',
  forceColor,
  speed = 'normal',
  showParticles = true,
  showGlow = true,
}) => {
  const sizeClasses = {
    sm: 'h-[24px] sm:h-[28px]',
    md: 'h-[32px] sm:h-[38px]',
    lg: 'h-[44px] sm:h-[50px]',
    xl: 'h-[58px] sm:h-[68px]',
    massive: 'h-[76px] sm:h-[92px]',
  };

  return (
    <div
      id="main-logo-container"
      className={`relative inline-flex items-center justify-center select-none shrink-0 group transition-transform duration-200 hover:scale-[1.02] ${sizeClasses[size]} ${className}`}
      style={{ aspectRatio: '954 / 164', height: undefined }}
      role="img"
      aria-label="La Solución"
    >
      {/* Resplandor ambiental de fondo (Sólo Cian y Verde Neón) */}
      {showGlow && (
        <div
          className="absolute inset-0 -z-10 rounded-2xl opacity-40 blur-md pointer-events-none transition-opacity duration-300 group-hover:opacity-75"
          style={{
            background: forceColor
              ? forceColor
              : 'linear-gradient(90deg, rgba(0, 240, 255, 0.45) 0%, rgba(16, 226, 157, 0.45) 100%)',
            filter: 'blur(10px)',
          }}
        />
      )}

      {/* Imagen oficial del logo (transparente, con tilde verde y sin fondo exterior) */}
      <img
        src={logoImg}
        alt="La Solución"
        className="w-full h-full object-contain pointer-events-none drop-shadow-[0_2px_12px_rgba(0,240,255,0.25)] group-hover:drop-shadow-[0_4px_16px_rgba(16,226,157,0.35)] transition-all duration-300"
        style={forceColor ? { filter: `drop-shadow(0 0 8px ${forceColor}80)` } : undefined}
      />

      {/* Partículas y Lucesitas Neón Animadas Flotantes */}
      {showParticles &&
        PARTICLES.map((p) => {
          const particleColor = forceColor || p.color;
          return (
            <motion.span
              key={p.id}
              className="absolute rounded-full pointer-events-none z-10"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: particleColor,
                boxShadow: `0 0 6px ${particleColor}, 0 0 10px ${particleColor}90`,
              }}
              animate={{
                opacity: [0.25, 1, 0.35, 0.95, 0.25],
                scale: [0.75, 1.35, 0.85, 1.25, 0.75],
                y: [-1.5, 1.5, -0.5, 1, -1.5],
              }}
              transition={{
                duration: speed === 'fast' ? p.duration * 0.55 : p.duration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: p.delay,
              }}
            />
          );
        })}

      {/* Brillo dinámico sutil al hacer hover */}
      <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out" />
      </div>
    </div>
  );
};

export default MainLogo;
