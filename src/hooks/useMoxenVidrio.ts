import { useEffect, useRef } from 'react';

export interface MoxenVidrioOptions {
  inclina?: number;   // Grados máximos de giro 3D (default: 7)
  suavidad?: number;  // Velocidad de seguimiento (default: 9)
  active?: boolean;   // Si está activo o deshabilitado
}

/**
 * Hook React que implementa la física completa de Moxen Vidrio:
 * - Inclinación 3D en perspectiva hacia el puntero
 * - Foco de luz interior dinámico que sigue al cursor
 * - Filo perimetral que se ilumina en el borde exacto
 * - Reflejo especular diagonal que cruza el vidrio al inclinarse
 * - Deformación elástica y rebote con resorte al hacer clic
 */
export function useMoxenVidrio<T extends HTMLElement = HTMLDivElement>(options: MoxenVidrioOptions = {}) {
  const elementRef = useRef<T>(null);
  const { inclina = 7, suavidad = 9, active = true } = options;

  useEffect(() => {
    const el = elementRef.current;
    if (!el || !active) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Asegurar estructura de capas de Moxen Vidrio
    let grano = el.querySelector<HTMLElement>(':scope > .vi-grano');
    let luz = el.querySelector<HTMLElement>(':scope > .vi-luz');
    let filo = el.querySelector<HTMLElement>(':scope > .vi-filo');
    let reflejo = el.querySelector<HTMLElement>(':scope > .vi-reflejo');

    if (!grano) {
      grano = document.createElement('span');
      grano.className = 'vi-grano';
      grano.setAttribute('aria-hidden', 'true');
      el.prepend(grano);
    }

    if (!luz) {
      luz = document.createElement('span');
      luz.className = 'vi-luz';
      luz.setAttribute('aria-hidden', 'true');
      const luzI = document.createElement('i');
      luz.appendChild(luzI);
      el.prepend(luz);
    }

    if (!reflejo) {
      reflejo = document.createElement('span');
      reflejo.className = 'vi-reflejo';
      reflejo.setAttribute('aria-hidden', 'true');
      const reflejoI = document.createElement('i');
      reflejo.appendChild(reflejoI);
      el.appendChild(reflejo);
    }

    if (!filo) {
      filo = document.createElement('span');
      filo.className = 'vi-filo';
      filo.setAttribute('aria-hidden', 'true');
      const filoI = document.createElement('i');
      filo.appendChild(filoI);
      el.appendChild(filo);
    }

    const luzI = luz.querySelector<HTMLElement>('i')!;
    const filoI = filo.querySelector<HTMLElement>('i')!;
    const reflejoI = reflejo.querySelector<HTMLElement>('i')!;

    let W = el.offsetWidth || 300;
    let H = el.offsetHeight || 120;

    const resizeObserver = new ResizeObserver(() => {
      W = el.offsetWidth || 300;
      H = el.offsetHeight || 120;
    });
    resizeObserver.observe(el);

    const meta = { x: 0.5, y: 0.5, luz: 0 };
    const ahora = { x: 0.5, y: 0.5, luz: 0 };
    let s = 1;
    let vs = 0;
    let raf = 0;
    let previo = 0;

    function pinta() {
      const x = ahora.x * W;
      const y = ahora.y * H;

      luzI.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      filoI.style.transform = `translate(${(x + 1).toFixed(1)}px, ${(y + 1).toFixed(1)}px)`;

      luz.style.opacity = ahora.luz.toFixed(3);
      filo.style.opacity = ahora.luz.toFixed(3);

      const k = reduce ? 0 : inclina * ahora.luz;
      const rx = (0.5 - ahora.y) * 2 * k;
      const ry = (ahora.x - 0.5) * 2 * k;

      el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${s.toFixed(4)})`;
      reflejoI.style.transform = `translateX(${(-(ahora.x - 0.5) * W * 0.7).toFixed(1)}px)`;
    }

    function paso(t: number) {
      const dt = previo ? Math.min(0.05, (t - previo) / 1000) : 0;
      previo = t;

      const k = 1 - Math.exp(-dt * suavidad);
      ahora.x += (meta.x - ahora.x) * k;
      ahora.y += (meta.y - ahora.y) * k;
      ahora.luz += (meta.luz - ahora.luz) * (1 - Math.exp(-dt * 5));

      // Resorte físico de rebote táctil
      vs += ((1 - s) * 420 - vs * 18) * dt;
      s += vs * dt;

      pinta();

      const quieto =
        Math.abs(meta.x - ahora.x) + Math.abs(meta.y - ahora.y) + Math.abs(meta.luz - ahora.luz) < 0.001 &&
        Math.abs(1 - s) < 0.0005 &&
        Math.abs(vs) < 0.01;

      if (quieto && dt) {
        raf = 0;
        previo = 0;
        return;
      }
      raf = requestAnimationFrame(paso);
    }

    const despierta = () => {
      if (!raf) raf = requestAnimationFrame(paso);
    };

    function mueve(e: PointerEvent) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      meta.x = Math.max(-0.2, Math.min(1.2, (e.clientX - r.left) / r.width));
      meta.y = Math.max(-0.2, Math.min(1.2, (e.clientY - r.top) / r.height));
      meta.luz = 1;
      despierta();
    }

    const onPointerDown = (e: PointerEvent) => {
      mueve(e);
      if (!reduce) vs -= 1.2; // Hundimiento elástico con resorte
      ahora.luz = Math.min(1.25, ahora.luz + 0.35);
    };

    const onPointerLeave = () => {
      meta.luz = 0;
      despierta();
    };

    el.addEventListener('pointerenter', mueve, { passive: true });
    el.addEventListener('pointermove', mueve, { passive: true });
    el.addEventListener('pointerdown', onPointerDown, { passive: true });
    el.addEventListener('pointerleave', onPointerLeave, { passive: true });

    pinta();

    return () => {
      el.removeEventListener('pointerenter', mueve);
      el.removeEventListener('pointermove', mueve);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointerleave', onPointerLeave);
      resizeObserver.disconnect();
      if (raf) cancelAnimationFrame(raf);
      el.style.removeProperty('transform');
    };
  }, [inclina, suavidad, active]);

  return elementRef;
}

export default useMoxenVidrio;
