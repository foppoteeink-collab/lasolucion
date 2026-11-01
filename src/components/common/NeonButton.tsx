import React, { useState } from 'react';
import { soundFX } from '../../utils/audio';

export interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'hero' | 'compact' | 'wide';
  className?: string;
  icon?: React.ReactNode;
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  children,
  variant = 'hero',
  className = '',
  icon,
  onClick,
  disabled,
  ...props
}) => {
  const [isFlash, setIsFlash] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    soundFX.playClick();
    setIsFlash(false);
    requestAnimationFrame(() => {
      setIsFlash(true);
      setTimeout(() => setIsFlash(false), 420);
    });
    onClick?.(e);
  };

  const sizeClass =
    variant === 'compact'
      ? 'px-3.5 py-1.5 text-xs min-h-[36px]'
      : variant === 'wide'
      ? 'w-full py-3.5 px-6 text-sm min-h-[50px]'
      : 'px-5 py-2.5 text-xs sm:text-sm min-h-[44px]';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`btn-neon-hunter ${sizeClass} ${isFlash ? 'is-flash' : ''} ${
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
      } ${className}`}
      {...props}
    >
      <span className="flex items-center justify-center gap-2">
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="truncate">{children}</span>
      </span>
    </button>
  );
};

export default NeonButton;
