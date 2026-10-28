import { useEffect, useRef } from 'react';

/**
 * Motor de física de rebote e inercia elástica extraído de Moxen Chicle.
 * Detecta dinámicamente cada botón o control interactivo con la clase .chicle-btn
 * dentro del panel de Ajustes y vincula los eventos directos de pointermove, pointerdown,
 * pointerup y pointerleave para simular la deformación fluida de goma / chicle.
 */
export function useMoxenChicle<T extends HTMLElement = HTMLDivElement>() {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cleanupFns = new Map<HTMLElement, () => void>();

    const attachToButton = (el: HTMLElement) => {
      if (cleanupFns.has(el)) return;
      let isPressed = false;
      let resetTimer: ReturnType<typeof setTimeout> | null = null;

      const onPointerMove = (e: PointerEvent) => {
        if (el.hasAttribute('disabled')) return;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        const skewX = Math.max(-8, Math.min(8, -(dx / rect.width) * 16));
        const scaleX = isPressed ? 0.91 : 1.07;
        const scaleY = isPressed ? 1.14 : 0.96;
        const transX = (dx * 0.22).toFixed(1);
        const transY = (dy * 0.22).toFixed(1);

        el.style.transition = 'transform 0.08s ease-out';
        el.style.transform = `translate3d(${transX}px, ${transY}px, 0px) scale(${scaleX}, ${scaleY}) skewX(${skewX.toFixed(1)}deg)`;
      };

      const onPointerDown = () => {
        if (el.hasAttribute('disabled')) return;
        isPressed = true;
        if (resetTimer) clearTimeout(resetTimer);
        el.style.transition = 'transform 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        el.style.transform = 'scale(0.90, 1.15) skewX(6deg) translateY(2px)';
      };

      const onPointerUp = () => {
        isPressed = false;
        el.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.45)';
        el.style.transform = 'translate3d(0px, 0px, 0px) scale(1.05, 0.97) skewX(-3deg)';
      };

      const onPointerLeave = () => {
        isPressed = false;
        el.style.transition = 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.45)';
        el.style.transform = 'translate3d(0px, 0px, 0px) scale(1, 1) skewX(0deg)';
        if (resetTimer) clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          el.style.removeProperty('transform');
          el.style.removeProperty('transition');
        }, 550);
      };

      el.addEventListener('pointermove', onPointerMove, { passive: true });
      el.addEventListener('pointerdown', onPointerDown, { passive: true });
      el.addEventListener('pointerup', onPointerUp, { passive: true });
      el.addEventListener('pointerleave', onPointerLeave, { passive: true });

      cleanupFns.set(el, () => {
        el.removeEventListener('pointermove', onPointerMove);
        el.removeEventListener('pointerdown', onPointerDown);
        el.removeEventListener('pointerup', onPointerUp);
        el.removeEventListener('pointerleave', onPointerLeave);
        if (resetTimer) clearTimeout(resetTimer);
        el.style.removeProperty('transform');
        el.style.removeProperty('transition');
      });
    };

    // Vincular todos los botones con .chicle-btn presentes en el montaje
    const buttons = container.querySelectorAll<HTMLElement>('.chicle-btn');
    buttons.forEach(attachToButton);

    // Observar inserciones dinámicas de DOM (cambio de sub-pestañas, modales, etc.)
    const observer = new MutationObserver(() => {
      const currentButtons = container.querySelectorAll<HTMLElement>('.chicle-btn');
      currentButtons.forEach(attachToButton);
    });

    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cleanupFns.forEach((cleanup) => cleanup());
      cleanupFns.clear();
    };
  }, []);

  return containerRef;
}

export default useMoxenChicle;
