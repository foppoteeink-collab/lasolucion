import React from 'react';
import { motion } from 'motion/react';

export interface MainLogoProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'massive';
  className?: string;
  forceColor?: string;
}

export const MainLogo: React.FC<MainLogoProps> = ({
  text = 'LA SOLUCIÓN',
  size = 'massive',
  className = '',
  forceColor,
}) => {
  const characters = Array.from(text);
  const elementsCount = characters.length;
  const delayBetweenLetters = 0.35; // Transición más lenta
  const totalDelayTime = elementsCount * delayBetweenLetters;

  // Ciclo Neón Holográfico (Dominancia Cyan) o Color Forzado
  const colors = forceColor ? [forceColor, '#ffffff', forceColor] : [
    '#ffffff', // Blanco base
    '#00f0ff', // Cyan Neón
    '#00f0ff', // Cyan Neón (más presencia)
    '#3b82f6', // Azul Energía
    '#10b981', // Verde
    '#f59e0b', // Naranja
    '#00f0ff', // Cyan Neón
    '#ffffff', // Blanco base
  ];

  const textShadows = forceColor ? [
    `0 0 12px ${forceColor}95, 0 0 24px ${forceColor}60`,
    `0 0 8px rgba(255,255,255,0.8), 0 0 16px rgba(255,255,255,0.4)`,
    `0 0 12px ${forceColor}95, 0 0 24px ${forceColor}60`,
  ] : [
    '0 0 8px rgba(255,255,255,0.8), 0 0 16px rgba(255,255,255,0.4)',
    '0 0 12px rgba(0,240,255,0.95), 0 0 24px rgba(0,240,255,0.6)',
    '0 0 12px rgba(0,240,255,0.95), 0 0 24px rgba(0,240,255,0.6)',
    '0 0 14px rgba(59,130,246,0.95), 0 0 28px rgba(59,130,246,0.6)',
    '0 0 12px rgba(16,185,129,0.95), 0 0 24px rgba(16,185,129,0.6)',
    '0 0 12px rgba(245,158,11,0.95), 0 0 24px rgba(245,158,11,0.6)',
    '0 0 12px rgba(0,240,255,0.95), 0 0 24px rgba(0,240,255,0.6)',
    '0 0 8px rgba(255,255,255,0.8), 0 0 16px rgba(255,255,255,0.4)',
  ];

  const sizeClasses = {
    sm: 'text-lg tracking-[0.3em]',
    md: 'text-2xl tracking-[0.3em]',
    lg: 'text-4xl tracking-[0.25em]',
    xl: 'text-5xl sm:text-6xl tracking-[0.2em]',
    massive: 'text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-[0.2em]',
  };

  return (
    <h1
      id="main-logo-text-flow"
      className={`font-['Anton'] uppercase select-none flex flex-wrap justify-center items-center font-black leading-tight focus-in-contract ${sizeClasses[size]} ${className}`}
      style={{ fontFamily: "'Anton', sans-serif" }}
    >
      {characters.map((char, index) => {
        if (char === ' ') {
          return (
            <span key={`space-${index}`} className="inline-block w-[0.3em]">
              &nbsp;
            </span>
          );
        }

        const animDelay = index * delayBetweenLetters - totalDelayTime;

        return (
          <motion.span
            key={`char-${index}`}
            className="inline-block relative transition-transform hover:scale-110 duration-150"
            animate={{
              color: colors,
              textShadow: textShadows,
            }}
            transition={{
              duration: 10,
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
    </h1>
  );
};

export default MainLogo;
