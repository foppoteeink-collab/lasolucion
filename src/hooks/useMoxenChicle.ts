import { useEffect, useRef } from 'react';

/**
 * Directiva táctil de alta fidelidad Moxen Vidrio Obsidian.
 * Garantiza micro-compresión limpia (scale 0.96) sin deformaciones,
 * distorsiones de sesgo (skew) ni oscilaciones de goma.
 */
export function useMoxenChicle<T extends HTMLElement = HTMLDivElement>() {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Limpiar cualquier propiedad de deformación o skew heredada en los botones
    const sanitizeButtons = () => {
      const buttons = container.querySelectorAll<HTMLElement>('.chicle-btn');
      buttons.forEach((el) => {
        el.style.removeProperty('transform');
        el.style.removeProperty('transition');
      });
    };

    sanitizeButtons();

    const observer = new MutationObserver(sanitizeButtons);
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  return containerRef;
}

export default useMoxenChicle;
