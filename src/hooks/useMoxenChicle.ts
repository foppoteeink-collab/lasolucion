import { useEffect, useRef } from 'react';

/**
 * Motor de física de rebote e inercia elástica extraído de Moxen Chicle.
 * Aplica deformación elástica direccional dinámica (translate, skewX, scale)
 * sobre cualquier botón o control interactivo con la clase .chicle-btn.
 */
export function useMoxenChicle<T extends HTMLElement = HTMLDivElement>() {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let currentBtn: HTMLElement | null = null;
    let cleanupTimer: ReturnType<typeof setTimeout> | null = null;

    const releaseButton = (btn: HTMLElement) => {
      btn.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.35)';
      btn.style.transform = 'translate3d(0px, 0px, 0px) scale(1) skewX(0deg)';

      if (cleanupTimer) clearTimeout(cleanupTimer);
      cleanupTimer = setTimeout(() => {
        // Limpiar inline style para que las reglas CSS :hover / :active retomen el control sin interferencias
        btn.style.removeProperty('transform');
        btn.style.removeProperty('transition');
      }, 520);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const btn = (e.target as HTMLElement)?.closest('.chicle-btn') as HTMLElement | null;

      if (!btn || btn.hasAttribute('disabled')) {
        if (currentBtn) {
          releaseButton(currentBtn);
          currentBtn = null;
        }
        return;
      }

      if (currentBtn && currentBtn !== btn) {
        releaseButton(currentBtn);
      }

      if (cleanupTimer) {
        clearTimeout(cleanupTimer);
        cleanupTimer = null;
      }

      currentBtn = btn;
      const rect = btn.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      // Cálculo de skew direccional proporcional al desplazamiento horizontal
      const skewX = Math.max(-6, Math.min(6, -(dx / (rect.width || 1)) * 10));

      btn.style.transition = 'transform 0.08s ease-out';
      btn.style.transform = `translate3d(${(dx * 0.16).toFixed(1)}px, ${(dy * 0.16).toFixed(1)}px, 0px) scale(1.05) skewX(${skewX.toFixed(1)}deg)`;
    };

    const handlePointerDown = (e: PointerEvent) => {
      const btn = (e.target as HTMLElement)?.closest('.chicle-btn') as HTMLElement | null;
      if (btn && !btn.hasAttribute('disabled')) {
        if (cleanupTimer) clearTimeout(cleanupTimer);
        btn.style.transition = 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        btn.style.transform = 'scale(0.91) skewX(5deg)';
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const btn = (e.target as HTMLElement)?.closest('.chicle-btn') as HTMLElement | null;
      if (btn && !btn.hasAttribute('disabled')) {
        btn.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.35)';
        btn.style.transform = 'translate3d(0px, 0px, 0px) scale(1.03) skewX(-2deg)';
      }
    };

    const handleMouseLeave = () => {
      if (currentBtn) {
        releaseButton(currentBtn);
        currentBtn = null;
      }
    };

    container.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('pointerdown', handlePointerDown, { passive: true });
    container.addEventListener('pointerup', handlePointerUp, { passive: true });
    container.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    return () => {
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (cleanupTimer) clearTimeout(cleanupTimer);
      if (currentBtn) {
        currentBtn.style.removeProperty('transform');
        currentBtn.style.removeProperty('transition');
      }
    };
  }, []);

  return containerRef;
}

export default useMoxenChicle;
