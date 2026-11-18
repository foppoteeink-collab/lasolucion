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

  // Calibración de tamaños: Proporción 4.95:1 (594x120)
  // Calibrado ergonómicamente para mobile: acompaña la escala de los controles del HUD (h-8 = 32px) con presencia nítida
  const sizeClasses = {
    sm: 'h-[20px] sm:h-[24px]',
    md: 'h-[28px] xs:h-[30px] sm:h-[34px] lg:h-[38px]',
    lg: 'h-[36px] xs:h-[40px] sm:h-[46px] lg:h-[50px]',
    xl: 'h-[46px] sm:h-[56px]',
    massive: 'h-[56px] sm:h-[70px]',
  };

  const textSizeClasses = {
    sm: 'text-base sm:text-lg tracking-wider',
    md: 'text-2xl sm:text-3xl lg:text-4xl tracking-wider',
    lg: 'text-3xl sm:text-4xl tracking-widest',
    xl: 'text-4xl sm:text-5xl tracking-widest',
    massive: 'text-4xl sm:text-5xl md:text-6xl tracking-widest',
  };

  const animDuration = speed === 'fast' ? '5s' : '6s';

  return (
    <div
      onClick={onClick}
      aria-label="La Solución"
      className={`relative inline-flex items-center justify-center select-none shrink-0 group transition-all duration-200 hover:scale-[1.03] ${
        onClick ? 'cursor-pointer' : ''
      } ${sizeClasses[size]} ${className}`}
      style={{ aspectRatio: '594 / 120' }}
    >
      {/* Resplandor ambiental de plasma orgánico sincronizado con la paleta de Ajustes (Malla Aurora) */}
      <motion.div
        data-ambient-glow="true"
        className="absolute -inset-x-1 -inset-y-1 -z-10 rounded-full pointer-events-none"
        animate={{
          opacity: [0.32, 0.58, 0.32],
          scale: [0.96, 1.05, 0.96],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: forceColor
            ? `radial-gradient(ellipse at center, ${forceColor}55 0%, transparent 70%)`
            : `radial-gradient(ellipse at center, ${palette.glow} 0%, ${palette.glowSecondary} 45%, transparent 75%)`,
        }}
      />

      {/* Tipografía oficial pura de La Solución bañada en el flujo cromático dinámico */}
      {!imageError ? (
        <div className="relative w-full h-full flex items-center justify-center" data-preserve-optic="true">
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
