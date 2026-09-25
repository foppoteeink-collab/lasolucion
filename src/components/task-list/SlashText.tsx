import React from 'react';
import { motion } from 'motion/react';

interface SlashTextProps {
  text: string;
  isCompleted: boolean;
  className?: string;
  slashColor?: '#d6f421' | '#9600ff' | string;
}

export const SlashText: React.FC<SlashTextProps> = ({
  text,
  isCompleted,
  className = '',
  slashColor = '#d6f421',
}) => {
  const isPurple = slashColor === '#9600ff';
  
  // Custom cubic-bezier transition requested for laser slice physics
  const sliceTransition = {
    type: 'spring',
    stiffness: 380,
    damping: 18,
    bounce: 0.38,
  } as const;

  const laserTransition = {
    duration: 0.36,
    ease: [0.16, 1.08, 0.38, 0.98] as const,
  };

  const glowShadow = isPurple
    ? '0 0 12px #9600ff, 0 0 24px rgba(150, 0, 255, 0.7)'
    : '0 0 12px #d6f421, 0 0 24px rgba(214, 244, 33, 0.7)';

  return (
    <span className={`relative inline-block select-none ${className}`}>
      {/* Base Invisible Spacer to maintain exact typographic flow and dimensions */}
      <span className="invisible select-none pointer-events-none block aria-hidden" aria-hidden="true">
        {text}
      </span>

      {/* Top Half Slice (0% to 50% height) */}
      <motion.span
        initial={false}
        animate={
          isCompleted
            ? {
                x: 5,
                y: -2,
                skewX: 12,
                opacity: 0.65,
                filter: 'grayscale(60%)',
              }
            : {
                x: 0,
                y: 0,
                skewX: 0,
                opacity: 1,
                filter: 'grayscale(0%)',
              }
        }
        transition={sliceTransition}
        style={{
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 50%, 0% 50%)',
          WebkitClipPath: 'polygon(0% 0%, 100% 0%, 100% 50%, 0% 50%)',
        }}
        className="absolute inset-0 block select-none pointer-events-none"
      >
        {text}
      </motion.span>

      {/* Bottom Half Slice (50% to 100% height) */}
      <motion.span
        initial={false}
        animate={
          isCompleted
            ? {
                x: -5,
                y: 2,
                skewX: 12,
                opacity: 0.65,
                filter: 'grayscale(60%)',
              }
            : {
                x: 0,
                y: 0,
                skewX: 0,
                opacity: 1,
                filter: 'grayscale(0%)',
              }
        }
        transition={sliceTransition}
        style={{
          clipPath: 'polygon(0% 50%, 100% 50%, 100% 100%, 0% 100%)',
          WebkitClipPath: 'polygon(0% 50%, 100% 50%, 100% 100%, 0% 100%)',
        }}
        className="absolute inset-0 block select-none pointer-events-none"
      >
        {text}
      </motion.span>

      {/* Laser Slash Beam Line (4px thickness with neon aura glow) */}
      <motion.span
        initial={false}
        animate={
          isCompleted
            ? {
                scaleX: 1,
                opacity: 1,
                skewX: 12,
              }
            : {
                scaleX: 0,
                opacity: 0,
                skewX: 0,
              }
        }
        transition={laserTransition}
        style={{
          originX: 0,
          backgroundColor: slashColor,
          boxShadow: glowShadow,
        }}
        className="absolute top-1/2 left-0 right-0 h-[4px] -translate-y-1/2 z-10 pointer-events-none rounded-full"
      />
    </span>
  );
};

export default SlashText;
