import React from 'react';

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
  const sizeClasses = {
    sm: 'text-lg sm:text-xl tracking-wider',
    md: 'text-xl sm:text-2xl lg:text-[26px] tracking-wider',
    lg: 'text-2xl sm:text-3xl tracking-widest',
    xl: 'text-3xl sm:text-4xl tracking-widest',
    massive: 'text-4xl sm:text-5xl md:text-6xl tracking-widest',
  };

  return (
    <h1
      onClick={onClick}
      className={`font-['Russo_One'] font-russo uppercase select-none font-black leading-none inline-flex items-center text-cyan-400 ${
        onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
      } ${sizeClasses[size]} ${className}`}
      style={{
        fontFamily: "'Russo One', sans-serif",
        color: forceColor || undefined,
        textShadow: forceColor
          ? `0 0 10px ${forceColor}60`
          : '0 0 12px rgba(0, 240, 255, 0.45)',
      }}
    >
      {text}
    </h1>
  );
};

export default MainLogo;
