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

    const stripInlineOverrides = (el: HTMLElement) => {
      if (el.style.transform) el.style.removeProperty('transform');
      if (el.style.transition) el.style.removeProperty('transition');
    };

    const sanitizeRoot = (root: ParentNode) => {
      if (root instanceof HTMLElement && root.classList.contains('chicle-btn')) {
        stripInlineOverrides(root);
      }
      root.querySelectorAll<HTMLElement>('.chicle-btn').forEach(stripInlineOverrides);
    };

    sanitizeRoot(container);

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (let i = 0; i < m.addedNodes.length; i++) {
          const node = m.addedNodes[i];
          if (node.nodeType === 1) {
            sanitizeRoot(node as Element);
          }
        }
      }
    });
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  return containerRef;
}

export default useMoxenChicle;
