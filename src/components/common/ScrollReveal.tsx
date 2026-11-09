import React, { useEffect, useRef, useState } from 'react';

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
  duration = 0.22,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === 'undefined') return true;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    return Boolean(reduced || !('IntersectionObserver' in window));
  });

  useEffect(() => {
    if (isVisible && once) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { rootMargin: margin, threshold: 0.05 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible, once, margin]);

  const hiddenTransform = (() => {
    const scaleStr = scale ? ' scale(0.98)' : '';
    switch (direction) {
      case 'up':
        return `translate3d(0, 16px, 0)${scaleStr}`;
      case 'down':
        return `translate3d(0, -16px, 0)${scaleStr}`;
      case 'left':
        return `translate3d(16px, 0, 0)${scaleStr}`;
      case 'right':
        return `translate3d(-16px, 0, 0)${scaleStr}`;
      case 'none':
      default:
        return `translate3d(0, 0, 0)${scaleStr}`;
    }
  })();

  const effectiveDuration = Math.min(Math.max(duration, 0.12), 0.25);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate3d(0, 0, 0) scale(1)' : hiddenTransform,
        transitionProperty: 'opacity, transform',
        transitionDuration: `${effectiveDuration}s`,
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        transitionDelay: delay > 0 ? `${Math.min(delay, 0.15)}s` : '0s',
      }}
    >
      {children}
    </div>
  );
};
