import React, { useState } from 'react';
import { motion } from 'motion/react';
import logoImg from '../assets/logo-letters-only.png';

export interface MainLogoProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'massive';
  className?: string;
  forceColor?: string;
  speed?: 'normal' | 'fast';
  onClick?: () => void;
}

export const MainLogo: React.FC<MainLogoProps> = ({
  text = 'LA SOLUCIÓN',
  size = 'md',
  className = '',
  forceColor,
  onClick,
}) => {
  const [imageError, setImageError] = useState(false);

  // Calibración de altura proporcional para mantener la proporción exacta 864x129 (letras puras sin caja)
  const sizeClasses = {
    sm: 'h-[20px] sm:h-[24px]',
    md: 'h-[22px] sm:h-[32px] lg:h-[38px]',
    lg: 'h-[36px] sm:h-[46px]',
    xl: 'h-[50px] sm:h-[60px]',
    massive: 'h-[64px] sm:h-[80px]',
  };

  const textSizeClasses = {
    sm: 'text-base sm:text-lg tracking-wider',
    md: 'text-xl sm:text-2xl lg:text-[26px] tracking-wider',
    lg: 'text-2xl sm:text-3xl tracking-widest',
    xl: 'text-3xl sm:text-4xl tracking-widest',
    massive: 'text-4xl sm:text-5xl md:text-6xl tracking-widest',
  };

  return (
    <div
      onClick={onClick}
      role="banner"
      aria-label="La Solución"
      className={`relative inline-flex items-center justify-center select-none shrink-0 group transition-all duration-200 hover:scale-[1.03] ${
        onClick ? 'cursor-pointer' : ''
      } ${sizeClasses[size]} ${className}`}
      style={{ aspectRatio: '864 / 129' }}
    >
      {/* Resplandor ambiental de plasma orgánico (Cian y Esmeralda sin cajas ni límites rígidos) */}
      <motion.div
        className="absolute inset-x-2 inset-y-1 -z-10 rounded-full pointer-events-none"
        animate={{
          opacity: [0.35, 0.6, 0.35],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{
          duration: 3.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: forceColor
            ? forceColor
            : 'radial-gradient(ellipse at center, rgba(0, 240, 255, 0.45) 0%, rgba(16, 226, 157, 0.35) 60%, transparent 85%)',
          filter: 'blur(12px)',
        }}
      />

      {/* Tipografía oficial pura de La Solución (letras flotantes sin caja circundante) */}
      {!imageError ? (
        <img
          src={logoImg}
          alt="La Solución"
          onError={() => setImageError(true)}
          className="w-full h-full object-contain pointer-events-none drop-shadow-[0_2px_12px_rgba(0,240,255,0.45)] group-hover:drop-shadow-[0_4px_22px_rgba(16,226,157,0.7)] group-hover:brightness-105 transition-all duration-300"
          style={forceColor ? { filter: `drop-shadow(0 0 10px ${forceColor})` } : undefined}
        />
      ) : (
        <h1
          className={`font-['Russo_One'] font-russo uppercase select-none font-black leading-none inline-flex items-center text-cyan-400 ${textSizeClasses[size]}`}
          style={{
            fontFamily: "'Russo One', sans-serif",
            color: forceColor || undefined,
            textShadow: forceColor
              ? `0 0 10px ${forceColor}60`
              : '0 0 12px rgba(0, 240, 255, 0.55)',
          }}
        >
          {text}
        </h1>
      )}
    </div>
  );
};

export default MainLogo;
