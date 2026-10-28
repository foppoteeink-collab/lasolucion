import React, { useState } from 'react';
import { motion } from 'motion/react';
import logoImg from '../assets/logo-solucion.png';

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

  // Calibración de altura proporcional para mantener la proporción exacta 954x164
  const sizeClasses = {
    sm: 'h-[24px] sm:h-[28px]',
    md: 'h-[32px] sm:h-[38px] lg:h-[42px]',
    lg: 'h-[44px] sm:h-[50px]',
    xl: 'h-[58px] sm:h-[66px]',
    massive: 'h-[76px] sm:h-[90px]',
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
      className={`relative inline-flex items-center justify-center select-none shrink-0 group transition-transform duration-200 hover:scale-[1.03] ${
        onClick ? 'cursor-pointer' : ''
      } ${sizeClasses[size]} ${className}`}
      style={{ aspectRatio: '954 / 164' }}
    >
      {/* Resplandor ambiental de plasma de fondo (Cian y Verde Neón) */}
      <motion.div
        className="absolute inset-0 -z-10 rounded-2xl pointer-events-none"
        animate={{
          opacity: [0.35, 0.65, 0.35],
          scale: [0.96, 1.04, 0.96],
        }}
        transition={{
          duration: 3.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: forceColor
            ? forceColor
            : 'linear-gradient(90deg, rgba(0, 240, 255, 0.45) 0%, rgba(16, 226, 157, 0.45) 100%)',
          filter: 'blur(10px)',
        }}
      />

      {/* Imagen oficial del logo */}
      {!imageError ? (
        <img
          src={logoImg}
          alt="La Solución"
          onError={() => setImageError(true)}
          className="w-full h-full object-contain pointer-events-none drop-shadow-[0_2px_12px_rgba(0,240,255,0.4)] group-hover:drop-shadow-[0_4px_18px_rgba(16,226,157,0.55)] transition-all duration-300"
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

      {/* Reflejo brillante de luz interactivo al hacer hover */}
      <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      </div>
    </div>
  );
};

export default MainLogo;
