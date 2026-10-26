import React from 'react';
import { motion } from 'motion/react';
import logoImg from '../assets/logo-letters-only.png';

export interface MainLogoProps {
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
  // Dimensiones calibradas: Ágil y proporcionado en móvil, imponente en pantallas grandes
  const sizeClasses = {
    sm: 'h-[22px] sm:h-[26px]',
    md: 'h-[26px] sm:h-[32px] lg:h-[38px]',
    lg: 'h-[40px] sm:h-[48px]',
    xl: 'h-[52px] sm:h-[64px]',
    massive: 'h-[70px] sm:h-[88px]',
  };

  return (
    <div
      id="main-logo-container"
      className={`relative inline-flex items-center justify-center select-none shrink-0 group transition-transform duration-200 hover:scale-[1.03] ${speed === 'fast' ? 'focus-in-contract-fast' : 'focus-in-contract'} ${sizeClasses[size]} ${className}`}
      style={{ aspectRatio: '864 / 129' }}
      role="img"
      aria-label="La Solución"
    >
      {/* Resplandor ambiental suave de fondo en onda fluida Cian ⇄ Esmeralda */}
      <motion.div
        className="absolute inset-0 pointer-events-none -z-10 rounded-full opacity-40 blur-md transition-opacity duration-300 group-hover:opacity-70"
        animate={{
          background: forceColor
            ? forceColor
            : [
                'linear-gradient(90deg, rgba(34,211,238,0.35) 0%, rgba(52,211,153,0.15) 100%)',
                'linear-gradient(90deg, rgba(52,211,153,0.3) 0%, rgba(34,211,238,0.3) 100%)',
                'linear-gradient(90deg, rgba(34,211,238,0.15) 0%, rgba(52,211,153,0.35) 100%)',
                'linear-gradient(90deg, rgba(34,211,238,0.35) 0%, rgba(52,211,153,0.15) 100%)',
              ],
        }}
        transition={{
          duration: speed === 'fast' ? 3.5 : 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Letras originales recortadas: 100% transparentes, sin recuadro negro, sin partículas */}
      <img
        src={logoImg}
        alt="La Solución"
        className="w-full h-full object-contain pointer-events-none filter drop-shadow-[0_2px_8px_rgba(34,211,238,0.35)] group-hover:drop-shadow-[0_4px_14px_rgba(52,211,153,0.5)] transition-all duration-300"
        style={forceColor ? { filter: `drop-shadow(0 0 10px ${forceColor}80)` } : undefined}
      />

      {/* Sutil haz de luz interactivo al pasar el cursor */}
      <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-cyan-400/15 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out" />
      </div>
    </div>
  );
};

export default MainLogo;
