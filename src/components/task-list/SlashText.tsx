import React from 'react';
import { motion } from 'motion/react';

interface SlashTextProps {
  text: string;
  isCompleted: boolean;
  className?: string;
  slashColor?: string;
}

export const SlashText: React.FC<SlashTextProps> = ({
  text,
  isCompleted,
  className = '',
  slashColor = 'currentColor',
}) => {
  return (
    <span className={`relative inline-block transition-colors duration-200 ${className}`}>
      <span className={`transition-opacity duration-200 ${isCompleted ? 'opacity-50' : 'opacity-100'}`}>
        {text}
      </span>
      {/* Sleek, minimal strikethrough line */}
      <motion.span
        initial={false}
        animate={
          isCompleted
            ? { scaleX: 1, opacity: 0.65 }
            : { scaleX: 0, opacity: 0 }
        }
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        style={{
          originX: 0,
          backgroundColor: slashColor || 'currentColor',
        }}
        className="absolute top-1/2 left-0 right-0 h-[1.5px] -translate-y-1/2 pointer-events-none rounded-full"
      />
    </span>
  );
};

export default SlashText;
