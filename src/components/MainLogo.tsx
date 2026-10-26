import React from 'react';
import { motion } from 'motion/react';

export interface MainLogoProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'massive';
  className?: string;
  forceColor?: string;
  speed?: 'normal' | 'fast';
}

export const MainLogo: React.FC<MainLogoProps> = ({
  size = 'md',
  className = '',
  forceColor,
  speed = 'normal',
}) => {
  // Letras de "LA" (rotadas verticalmente a la izquierda) y "SOLUCIÓN" (horizontal)
  const prefixChars = ['L', 'A'];
  const mainChars = ['S', 'O', 'L', 'U', 'C', 'I', 'Ó', 'N'];
  const totalCount = prefixChars.length + mainChars.length; // 10 caracteres

  const delayBetweenLetters = speed === 'fast' ? 0.22 : 0.38;
  const totalDelayTime = totalCount * delayBetweenLetters;
  const cycleDuration = speed === 'fast' ? 5 : 8;

  // Paleta Cian ⇄ Verde atenuada: elegante, legible y suave a la vista (sin brillo excesivo)
  const colors = forceColor
    ? [forceColor, '#e2e8f0', forceColor]
    : [
        '#22d3ee', // Cian equilibrado (Tailwind Cyan 400)
        '#06b6d4', // Cian medio (Tailwind Cyan 500)
        '#2dd4bf', // Turquesa menta (Tailwind Teal 400)
        '#34d399', // Verde Esmeralda suave (Tailwind Emerald 400)
        '#10b981', // Verde Esmeralda medio (Tailwind Emerald 500)
        '#2dd4bf', // Turquesa menta
        '#22d3ee', // Cian equilibrado
      ];

  // Resplandor suave y controlado: resalta la silueta sin encandilar ni sobreexponer
  const textShadows = forceColor
    ? [
        `0 0 6px ${forceColor}60, 0 0 12px ${forceColor}30`,
        `0 0 4px rgba(255,255,255,0.6)`,
        `0 0 6px ${forceColor}60, 0 0 12px ${forceColor}30`,
      ]
    : [
        '0 0 6px rgba(34,211,238,0.45), 0 0 12px rgba(34,211,238,0.2)',
        '0 0 5px rgba(6,182,212,0.4), 0 0 10px rgba(6,182,212,0.18)',
        '0 0 6px rgba(45,212,191,0.4), 0 0 12px rgba(45,212,191,0.2)',
        '0 0 6px rgba(52,211,153,0.45), 0 0 12px rgba(52,211,153,0.2)',
        '0 0 6px rgba(16,185,129,0.45), 0 0 12px rgba(16,185,129,0.2)',
        '0 0 6px rgba(45,212,191,0.4), 0 0 12px rgba(45,212,191,0.2)',
        '0 0 6px rgba(34,211,238,0.45), 0 0 12px rgba(34,211,238,0.2)',
      ];

  // Tamaños proporcionales sin recuadro negro
  const sizeClasses = {
    sm: 'text-lg sm:text-xl',
    md: 'text-2xl sm:text-[28px] lg:text-[30px]',
    lg: 'text-3xl sm:text-4xl lg:text-5xl',
    xl: 'text-4xl sm:text-5xl lg:text-6xl',
    massive: 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl',
  };

  return (
    <h1
      id="main-logo-text-flow"
      className={`font-['Russo_One'] font-russo uppercase select-none inline-flex items-center font-black leading-none ${sizeClasses[size]} ${className}`}
      style={{ fontFamily: "'Russo One', sans-serif" }}
      aria-label="La Solución"
    >
      {/* Bloque "LA" Rotado Verticalmente (-90°) a la izquierda */}
      <span
        className="relative inline-flex items-center justify-center -rotate-90 select-none shrink-0"
        style={{
          width: '0.62em',
          height: '1em',
          fontSize: '0.62em',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          marginRight: '0.04em',
        }}
      >
        {prefixChars.map((char, index) => {
          const animDelay = index * delayBetweenLetters - totalDelayTime;
          return (
            <motion.span
              key={`prefix-${index}`}
              className="inline-block relative transition-transform hover:scale-105 duration-150"
              animate={{
                color: colors,
                textShadow: textShadows,
              }}
              transition={{
                duration: cycleDuration,
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'linear',
                delay: animDelay,
              }}
            >
              {char}
            </motion.span>
          );
        })}
      </span>

      {/* Bloque "SOLUCIÓN" Horizontal */}
      <span className="inline-flex items-center tracking-[0.05em] leading-none">
        {mainChars.map((char, index) => {
          const charIndex = prefixChars.length + index;
          const animDelay = charIndex * delayBetweenLetters - totalDelayTime;
          return (
            <motion.span
              key={`main-${index}`}
              className="inline-block relative transition-transform hover:scale-105 duration-150"
              animate={{
                color: colors,
                textShadow: textShadows,
              }}
              transition={{
                duration: cycleDuration,
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'linear',
                delay: animDelay,
              }}
            >
              {char}
            </motion.span>
          );
        })}
      </span>
    </h1>
  );
};

export default MainLogo;
