import { useEffect, useRef } from 'react';

/**
 * Hook de rebote elástico e inercia táctil basado en el motor Moxen Chicle.
 * Detecta dinámicamente el puntero (ratón o táctil) sobre cualquier elemento
 * con la clase .chicle-btn dentro del contenedor y aplica deformación proporcional (skew / scale / translate).
 */
export function useMoxenChicle<T extends HTMLElement = HTMLDivElement>() {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let activeEl: HTMLElement | null = null;

    const resetEl = (el: HTMLElement) => {
      el.style.transform = 'translate(0px, 0px) scale(1) skewX(0deg)';
      el.style.transition = 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.4)';
    };

    const handlePointerMove = (e: PointerEvent) => {
      const target = (e.target as HTMLElement)?.closest('.chicle-btn') as HTMLElement | null;
      if (!target || target.hasAttribute('disabled')) {
        if (activeEl) {
          resetEl(activeEl);
          activeEl = null;
        }
        return;
      }

      if (activeEl && activeEl !== target) {
        resetEl(activeEl);
      }
      activeEl = target;

      const rect = target.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const skewX = Math.max(-6, Math.min(6, -(dx / rect.width) * 8));

      target.style.transition = 'transform 0.08s ease-out';
      target.style.transform = `translate(${dx * 0.15}px, ${dy * 0.15}px) scale(1.04) skewX(${skewX.toFixed(1)}deg)`;
    };

    const handlePointerOut = (e: PointerEvent) => {
      const related = (e.relatedTarget as HTMLElement)?.closest('.chicle-btn');
      if (!related && activeEl) {
        resetEl(activeEl);
        activeEl = null;
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = (e.target as HTMLElement)?.closest('.chicle-btn') as HTMLElement | null;
      if (target && !target.hasAttribute('disabled')) {
        activeEl = target;
        target.style.transition = 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        target.style.transform = 'scale(0.92) skewX(4deg)';
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const target = (e.target as HTMLElement)?.closest('.chicle-btn') as HTMLElement | null;
      if (target && !target.hasAttribute('disabled')) {
        target.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.4)';
        target.style.transform = 'translate(0px, 0px) scale(1.02)';
      }
    };

    container.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('pointerout', handlePointerOut, { passive: true });
    container.addEventListener('pointerdown', handlePointerDown, { passive: true });
    container.addEventListener('pointerup', handlePointerUp, { passive: true });

    return () => {
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerout', handlePointerOut);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointerup', handlePointerUp);
      if (activeEl) resetEl(activeEl);
    };
  }, []);

  return containerRef;
}

export default useMoxenChicle;
