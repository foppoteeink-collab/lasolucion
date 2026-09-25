import React from 'react';
import { motion } from 'motion/react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  margin?: string;
  once?: boolean;
  scale?: boolean;
  duration?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  margin = '0px',
  once = true,
  scale = true,
  duration = 0.85,
}) => {
  const getInitialOffsets = () => {
    switch (direction) {
      case 'up':
        return { y: 45, x: 0 };
      case 'down':
        return { y: -45, x: 0 };
      case 'left':
        return { x: 45, y: 0 };
      case 'right':
        return { x: -45, y: 0 };
      case 'none':
      default:
        return { x: 0, y: 0 };
    }
  };

  const initialOffsets = getInitialOffsets();

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...initialOffsets,
        scale: scale ? 0.95 : 1,
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
      }}
      viewport={{
        once,
        margin: margin as any,
        amount: 0.1,
      }}
      transition={{
        duration,
        ease: [0.16, 1, 0.3, 1], // Smooth cubic-bezier easeOut
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
