import React, { useRef, useEffect, useState } from 'react';
import './moxenInercia.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { soundFX } from '../../utils/audio';

export interface MoxenInerciaProps {
  children: React.ReactNode[];
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  friccion?: number;
  goma?: number;
  iman?: boolean;
  className?: string;
  showNavigationControls?: boolean;
  accentColor?: string;
}

export const MoxenInercia: React.FC<MoxenInerciaProps> = ({
  children,
  initialIndex = 0,
  onIndexChange,
  friccion = 4,
  goma = 0.3,
  iman = true,
  className = '',
  showNavigationControls = true,
  accentColor = '#00f0ff',
}) => {
  const ventanaRef = useRef<HTMLDivElement>(null);
  const pistaRef = useRef<HTMLDivElement>(null);
  const barraFillRef = useRef<HTMLSpanElement>(null);
  const rodilloActualRef = useRef<HTMLDivElement>(null);
  const carruselRef = useRef<any>(null);
  const currentIndexRef = useRef<number>(initialIndex);
  const [activeDisplayIndex, setActiveDisplayIndex] = useState<number>(initialIndex);
  const totalItems = children.length;

  useEffect(() => {
    const ventana = ventanaRef.current;
    if (!ventana) return;

    const pista = pistaRef.current;
    if (!pista) return;

    const o = { friccion, goma, iman };
    const items = Array.from(pista.children) as HTMLElement[];
    if (items.length === 0) return;

    /* Capas de paralaje: la figura (.in-forma) y el número de fondo (.in-fondo-num) */
    const capas = items.map((it) => {
      const num = it.querySelector('.in-num');
      if (num && !it.querySelector('.in-fondo-num')) {
        it.insertAdjacentHTML(
          'afterbegin',
          '<span class="in-fondo-num" aria-hidden="true">' + num.textContent + '</span>'
        );
      }
      return {
        forma: it.querySelector('.in-forma') as HTMLElement | null,
        fondo: it.querySelector('.in-fondo-num') as HTMLElement | null,
        c: 0,
      };
    });

    let anchoVentana = 0;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const oyentes: ((avance: number, indice: number) => void)[] = [];

    let x = 0,
      v = 0,
      meta = 0,
      min = 0,
      paradas = [0];
    let agarre: { id: number; px: number; x0: number; movido: boolean } | null = null;
    let muestras: { t: number; x: number }[] = [];
    let previo = 0,
      raf = 0,
      quieto = true,
      inclina = 0,
      xAntes = 0;

    // Los topes y el punto de parada de cada tarjeta (su borde izquierdo)
    function mide() {
      if (!ventana || !pista) return;
      min = Math.min(0, ventana.clientWidth - pista.scrollWidth);
      const margen = items[0] ? items[0].offsetLeft : 0;
      paradas = items.map((it) => Math.max(min, Math.min(0, margen - it.offsetLeft)));
      anchoVentana = ventana.clientWidth;
      items.forEach((it, i) => {
        if (capas[i]) capas[i].c = it.offsetLeft + it.offsetWidth / 2;
      });
    }

    const limita = (n: number) => Math.max(min, Math.min(0, n));
    const cercana = (n: number) =>
      paradas.reduce((a, p, i) => (Math.abs(p - n) < Math.abs(paradas[a] - n) ? i : a), 0);

    /* Pasado el tope, la pista cede cada vez menos (goma elástica) */
    const estira = (n: number) =>
      n > 0 ? n * o.goma : n < min ? min + (n - min) * o.goma : n;

    function pinta(dt: number) {
      if (!pista) return;
      // Inclinación con la velocidad
      const vel = dt ? (x - xAntes) / dt : 0;
      xAntes = x;
      inclina +=
        (Math.max(-4, Math.min(4, -vel / 450)) - inclina) * (1 - Math.exp(-dt * 10));
      pista.style.transform =
        'translate3d(' + x.toFixed(2) + 'px, 0, 0) skewX(' + inclina.toFixed(2) + 'deg)';

      /* Paralaje interior: figura hacia el centro y número hacia fuera */
      if (!reduce) {
        capas.forEach((k) => {
          const d = (k.c + x - anchoVentana / 2) / anchoVentana;
          if (Math.abs(d) > 0.9) return;
          if (k.forma) {
            k.forma.style.translate = (-d * 46).toFixed(1) + 'px 0';
          }
          if (k.fondo) {
            k.fondo.style.translate = (d * 60).toFixed(1) + 'px 0';
          }
        });
      }

      const avance = Math.max(0, Math.min(1, min ? x / min : 0));
      const calcIndex = Math.round(avance * (items.length - 1));
      oyentes.forEach((f) => f(avance, calcIndex));
    }

    function paso(t: number) {
      const dt = previo ? Math.min(0.05, (t - previo) / 1000) : 0;
      previo = t;
      if (!agarre && dt) {
        /* Resorte con amortiguación crítica hacia la parada elegida */
        const w = o.friccion;
        for (let h = dt, s; h > 0; h -= s) {
          s = Math.min(h, 1 / 240);
          v += (-w * w * (x - meta) - 2 * w * v) * s;
          x += v * s;
        }
      }
      pinta(dt);
      quieto =
        !agarre &&
        Math.abs(x - meta) < 0.3 &&
        Math.abs(v) < 2 &&
        Math.abs(inclina) < 0.01;
      if (quieto) {
        x = meta;
        v = 0;
        pinta(0);
        raf = 0;
        previo = 0;
        return;
      }
      raf = requestAnimationFrame(paso);
    }

    const despierta = () => {
      if (!raf) raf = requestAnimationFrame(paso);
    };

    function ir(i: number) {
      meta = paradas[Math.max(0, Math.min(paradas.length - 1, i))];
      if (reduce) {
        x = meta;
        v = 0;
        pinta(0);
        return;
      }
      despierta();
    }

    // ── Arrastre con Pointer Events ──
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      mide();
      agarre = { id: e.pointerId, px: e.clientX, x0: x, movido: false };
      muestras = [{ t: performance.now(), x: e.clientX }];
      v = 0;
      try {
        ventana.setPointerCapture(e.pointerId);
      } catch (_) {}
      ventana.setAttribute('data-arrastrando', '');
      despierta();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!agarre || e.pointerId !== agarre.id) return;
      const d = e.clientX - agarre.px;
      if (Math.abs(d) > 4) agarre.movido = true;
      x = estira(agarre.x0 + d);
      muestras.push({ t: performance.now(), x: e.clientX });
      while (
        muestras.length > 2 &&
        muestras[muestras.length - 1].t - muestras[0].t > 100
      ) {
        muestras.shift();
      }
    };

    const suelta = (e: PointerEvent) => {
      if (!agarre || e.pointerId !== agarre.id) return;
      const a = muestras[0],
        b = muestras[muestras.length - 1];
      const dt = b && a ? (b.t - a.t) / 1000 : 0;
      v = dt > 0.005 && b && a ? (b.x - a.x) / dt : 0;
      if (x > 0 || x < min) v *= o.goma;

      const libre = x + v / o.friccion;
      meta = o.iman ? paradas[cercana(limita(libre))] : limita(libre);

      if (agarre.movido) {
        ventana.addEventListener(
          'click',
          (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
          },
          { capture: true, once: true }
        );
      }

      agarre = null;
      ventana.removeAttribute('data-arrastrando');
      if (reduce) {
        x = meta;
        v = 0;
        pinta(0);
      }
      despierta();
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      x = limita(x - e.deltaX);
      meta = x;
      v = 0;
      clearTimeout((ventana as any).__inercia);
      (ventana as any).__inercia = setTimeout(() => o.iman && ir(cercana(x)), 140);
      despierta();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      ir(cercana(meta) + d);
    };

    ventana.addEventListener('pointerdown', onPointerDown);
    ventana.addEventListener('pointermove', onPointerMove);
    ventana.addEventListener('pointerup', suelta);
    ventana.addEventListener('pointercancel', suelta);
    ventana.addEventListener('wheel', onWheel, { passive: false });
    ventana.addEventListener('keydown', onKeyDown);

    mide();
    const onResize = () => {
      mide();
      meta = paradas[cercana(meta)];
      x = meta;
      pinta(0);
    };
    window.addEventListener('resize', onResize);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
      mide();
      pinta(0);
    });

    const carrusel = {
      ir,
      alMover(f: (avance: number, indice: number) => void) {
        oyentes.push(f);
        pinta(0);
      },
      destruir() {
        if (raf) cancelAnimationFrame(raf);
        ventana.removeEventListener('pointerdown', onPointerDown);
        ventana.removeEventListener('pointermove', onPointerMove);
        ventana.removeEventListener('pointerup', suelta);
        ventana.removeEventListener('pointercancel', suelta);
        ventana.removeEventListener('wheel', onWheel);
        ventana.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('resize', onResize);
      },
    };

    carruselRef.current = carrusel;

    // Escuchar movimiento para telemetría GPU y contador mecánico
    carrusel.alMover((avance, indice) => {
      if (barraFillRef.current) {
        const fill = 0.08 + 0.92 * avance;
        barraFillRef.current.style.transform = `scaleX(${fill.toFixed(4)})`;
      }
      if (rodilloActualRef.current) {
        rodilloActualRef.current.style.transform = `translateY(${-indice * 1.25}em)`;
      }
      if (currentIndexRef.current !== indice) {
        currentIndexRef.current = indice;
        setActiveDisplayIndex(indice);
        onIndexChange?.(indice);
      }
    });

    if (initialIndex > 0) {
      setTimeout(() => {
        ir(initialIndex);
      }, 50);
    }

    return () => {
      carrusel.destruir();
    };
  }, [friccion, goma, iman, totalItems, initialIndex, onIndexChange]);

  const handleStep = (direction: -1 | 1) => {
    soundFX.playClick();
    const nextIdx = Math.max(0, Math.min(totalItems - 1, currentIndexRef.current + direction));
    carruselRef.current?.ir(nextIdx);
  };

  return (
    <div className={`moxen-inercia-wrapper w-full space-y-2.5 ${className}`}>
      {/* Barra superior de telemetría y controles */}
      {showNavigationControls && (
        <div className="flex items-center justify-between px-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest font-bold">
              Arquetipo
            </span>
            <div className="flex items-center text-xs font-mono font-black text-cyan-300 bg-black/60 px-2 py-0.5 rounded-lg border border-cyan-500/30">
              <span className="in-rodillo-box">
                <b ref={rodilloActualRef} className="in-rodillo-strip">
                  {Array.from({ length: totalItems }).map((_, i) => {
                    const n = i + 1;
                    return <span key={i}>{n < 10 ? `0${n}` : n}</span>;
                  })}
                </b>
              </span>
              <span className="text-slate-500 mx-1">/</span>
              <span className="text-slate-400">
                {totalItems < 10 ? `0${totalItems}` : totalItems}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Barra de progreso de la pista */}
            <div className="w-20 sm:w-28 in-pista-barra hidden sm:block">
              <span
                ref={barraFillRef}
                className="in-pista-barra-fill"
                style={{ backgroundColor: accentColor }}
              />
            </div>

            {/* Flechas tácticas paso a paso */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleStep(-1)}
                disabled={activeDisplayIndex === 0}
                className="p-1.5 rounded-lg bg-black/60 border border-white/10 hover:border-cyan-400/60 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Arquetipo anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleStep(1)}
                disabled={activeDisplayIndex >= totalItems - 1}
                className="p-1.5 rounded-lg bg-black/60 border border-white/10 hover:border-cyan-400/60 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Siguiente arquetipo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ventana de visualización con arrastre inercial nativo de Moxen */}
      <div
        ref={ventanaRef}
        className="in-ventana"
        data-inercia
        tabIndex={0}
        aria-label="Carrusel de Arquetipos con inercia"
      >
        <div ref={pistaRef} className="in-pista" data-inercia-pista>
          {React.Children.map(children, (child, idx) => (
            <article
              key={idx}
              className="in-tarjeta cursor-pointer"
              onClick={() => {
                if (idx !== currentIndexRef.current) {
                  carruselRef.current?.ir(idx);
                }
              }}
            >
              {child}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MoxenInercia;
