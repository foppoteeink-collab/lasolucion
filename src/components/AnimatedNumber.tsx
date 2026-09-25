import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

interface AnimatedNumberProps {
  value: number;
  className?: string;
  duration?: number;
}

export function AnimatedNumber({ value, className = '', duration = 1000 }: AnimatedNumberProps) {
  const motionValue = useMotionValue(value);
  
  const springValue = useSpring(motionValue, {
    damping: 15,
    stiffness: 100,
    mass: 0.8
  });

  // Keep a local state to trigger React renders for standard DOM if needed, 
  // but framer-motion's motion.span can handle it directly via useTransform.
  const display = useTransform(springValue, (current) => Math.round(current).toLocaleString());

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return <motion.span className={className}>{display}</motion.span>;
}
