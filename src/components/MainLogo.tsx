import React, { useEffect, useRef } from 'react';
import { mountTiposElement } from '../utils/tiposEngine';

export interface MainLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'massive';
  className?: string;
  forceColor?: string;
  speed?: 'normal' | 'fast';
  as?: 'h1' | 'div' | 'span';
}

export const MainLogo: React.FC<MainLogoProps> = ({
  size = 'md',
  className = '',
  forceColor,
  as = 'h1',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Calibración tipográfica responsiva para mobile, tablet y desktop
  const sizeClasses = {
    sm: 'text-base sm:text-lg tracking-wider',
    md: 'text-[19px] sm:text-2xl lg:text-[26px] tracking-wider',
    lg: 'text-2xl sm:text-3xl tracking-widest',
    xl: 'text-3xl sm:text-4xl tracking-widest',
    massive: 'text-4xl sm:text-5xl tracking-widest',
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const instance = mountTiposElement(containerRef.current);

    return () => {
      instance.destroy();
    };
  }, []);

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none group cursor-pointer focus-in-contract ${className}`}
      role="banner"
      aria-label="La Solución"
    >
      {/* Halo de plasma reactivo de fondo */}
      <div 
        className="absolute -inset-x-3 -inset-y-1.5 pointer-events-none -z-10 rounded-full opacity-30 blur-lg transition-opacity duration-300 group-hover:opacity-75"
        style={{
          background: forceColor
            ? `radial-gradient(circle, ${forceColor}40 0%, transparent 70%)`
            : 'radial-gradient(circle, rgba(0,240,255,0.35) 0%, rgba(16,226,157,0.15) 50%, transparent 80%)'
        }}
      />

      {/* Titular Tipográfico Kinético Moxen con atributo data-tipos */}
      <h1
        ref={containerRef as any}
        data-tipos
        data-tipos-text="LA SOLUCIÓN"
        className={`font-black uppercase leading-none text-cyan-300 ${sizeClasses[size]}`}
      >
        LA SOLUCIÓN
      </h1>
    </div>
  );
};

export default MainLogo;
