import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useSystemPalette } from '../utils/systemPalette';
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
  speed = 'normal',
  onClick,
}) => {
  const [imageError, setImageError] = useState(false);
  const palette = useSystemPalette();

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

  const animDuration = speed === 'fast' ? '4.5s' : '7s';

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
      {/* Resplandor ambiental de plasma orgánico sincronizado con la paleta de Ajustes (Malla Aurora) */}
      <motion.div
        className="absolute inset-x-2 inset-y-1 -z-10 rounded-full pointer-events-none"
        animate={{
          opacity: [0.35, 0.65, 0.35],
          scale: [0.95, 1.08, 0.95],
        }}
        transition={{
          duration: 3.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: forceColor
            ? forceColor
            : `radial-gradient(ellipse at center, ${palette.glow} 0%, ${palette.glowSecondary} 60%, transparent 85%)`,
          filter: 'blur(14px)',
        }}
      />

      {/* Tipografía oficial pura de La Solución bañada en el flujo cromático dinámico */}
      {!imageError ? (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Capa 1: Flujo cromático dinámico enmascarado exactamente con las letras */}
          <div
            className="w-full h-full main-logo-aurora-fill pointer-events-none"
            style={{
              WebkitMaskImage: `url(${logoImg})`,
              maskImage: `url(${logoImg})`,
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
              backgroundImage: forceColor ? undefined : palette.gradient,
              backgroundColor: forceColor || undefined,
              animationDuration: animDuration,
              filter: forceColor
                ? `drop-shadow(0 0 10px ${forceColor})`
                : `drop-shadow(0 2px 10px ${palette.glow}) drop-shadow(0 0 18px ${palette.glowSecondary})`,
            }}
          />

          {/* Capa 2: Relieve y bisel cromático original (preserva definición 3D cristalina) */}
          <img
            src={logoImg}
            alt="La Solución"
            onError={() => setImageError(true)}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-25 mix-blend-luminosity group-hover:opacity-40 transition-opacity duration-300"
          />
        </div>
      ) : (
        <h1
          className={`font-['Russo_One'] font-russo uppercase select-none font-black leading-none inline-flex items-center main-logo-aurora-text ${textSizeClasses[size]}`}
          style={{
            fontFamily: "'Russo One', sans-serif",
            backgroundImage: forceColor ? undefined : palette.gradient,
            color: forceColor ? forceColor : 'transparent',
            WebkitBackgroundClip: forceColor ? undefined : 'text',
            backgroundClip: forceColor ? undefined : 'text',
            animationDuration: animDuration,
            textShadow: forceColor
              ? `0 0 10px ${forceColor}60`
              : `0 0 16px ${palette.glow}`,
          }}
        >
          {text}
        </h1>
      )}
    </div>
  );
};

export default MainLogo;
