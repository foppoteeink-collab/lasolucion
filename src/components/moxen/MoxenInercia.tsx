import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  const rodilloTensRef = useRef<HTMLDivElement>(null);
  const rodilloUnitsRef = useRef<HTMLDivElement>(null);

  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const totalItems = children.length;

  // Referencias mutables para el ciclo físico de animación
  const physicsRef = useRef({
    x: 0,
    xAntes: 0,
    vel: 0,
    meta: 0,
    min: 0,
    paradas: [] as number[],
    anchoVentana: 0,
    agarre: null as { id: number; px: number; x0: number; movido: boolean } | null,
    muestras: [] as { t: number; x: number }[],
    previo: 0,
    raf: 0,
    quieto: true,
    inclina: 0,
    activeIdx: initialIndex,
  });

  // Medir los topes y paradas de cada tarjeta
  const mide = useCallback(() => {
    const ventana = ventanaRef.current;
    const pista = pistaRef.current;
    if (!ventana || !pista) return;

    const items = Array.from(pista.children) as HTMLElement[];
    if (items.length === 0) return;

    const min = Math.min(0, ventana.clientWidth - pista.scrollWidth);
    const margen = items[0] ? items[0].offsetLeft : 0;
    const paradas = items.map((it) => Math.max(min, Math.min(0, margen - it.offsetLeft)));

    physicsRef.current.min = min;
    physicsRef.current.paradas = paradas;
    physicsRef.current.anchoVentana = ventana.clientWidth;
  }, []);

  const limita = (n: number) => Math.max(physicsRef.current.min, Math.min(0, n));
  const cercana = (n: number) => {
    const { paradas } = physicsRef.current;
    if (paradas.length === 0) return 0;
    return paradas.reduce((a, p, i) => (Math.abs(p - n) < Math.abs(paradas[a] - n) ? i : a), 0);
  };
  const estira = (n: number) => {
    const { min } = physicsRef.current;
    return n > 0 ? n * goma : n < min ? min + (n - min) * goma : n;
  };

  const pinta = useCallback(
    (dt: number) => {
      const pista = pistaRef.current;
      const ventana = ventanaRef.current;
      if (!pista || !ventana) return;

      const pState = physicsRef.current;
      const vel = dt ? (pState.x - pState.xAntes) / dt : 0;
      pState.xAntes = pState.x;

      pState.inclina +=
        (Math.max(-5, Math.min(5, -vel / 420)) - pState.inclina) * (1 - Math.exp(-dt * 10));

      pista.style.transform = `translate3d(${pState.x.toFixed(2)}px, 0, 0) skewX(${pState.inclina.toFixed(2)}deg)`;

      // Paralaje dentro de cada tarjeta
      const items = Array.from(pista.children) as HTMLElement[];
      const wVentana = pState.anchoVentana || ventana.clientWidth;

      items.forEach((it) => {
        const c = it.offsetLeft + it.offsetWidth / 2;
        const d = (c + pState.x - wVentana / 2) / wVentana;
        if (Math.abs(d) <= 1) {
          const forma = it.querySelector('.in-forma') as HTMLElement | null;
          const fondo = it.querySelector('.in-fondo-num') as HTMLElement | null;
          if (forma) forma.style.transform = `translate3d(${(-d * 42).toFixed(1)}px, 0, 0)`;
          if (fondo) fondo.style.transform = `translate3d(${(d * 55).toFixed(1)}px, 0, 0)`;
        }
      });

      // Cálculo de avance normalizado [0, 1]
      const avance = Math.max(0, Math.min(1, pState.min ? pState.x / pState.min : 0));
      if (barraFillRef.current) {
        barraFillRef.current.style.transform = `scaleX(${Math.max(0.08, avance)})`;
      }

      // Índice más cercano
      const nuevoIdx = Math.round(avance * (totalItems - 1));
      if (nuevoIdx !== pState.activeIdx && nuevoIdx >= 0 && nuevoIdx < totalItems) {
        pState.activeIdx = nuevoIdx;
        setCurrentIndex(nuevoIdx);
        onIndexChange?.(nuevoIdx);
      }
    },
    [totalItems, onIndexChange]
  );

  const paso = useCallback(
    (t: number) => {
      const pState = physicsRef.current;
      const dt = pState.previo ? Math.min(0.05, (t - pState.previo) / 1000) : 0;
      pState.previo = t;

      if (!pState.agarre && dt) {
        // Resorte con amortiguación crítica
        const w = friccion;
        for (let h = dt, s; h > 0; h -= s) {
          s = Math.min(h, 1 / 240);
          pState.vel += (-w * w * (pState.x - pState.meta) - 2 * w * pState.vel) * s;
          pState.x += pState.vel * s;
        }
      }

      pinta(dt);

      pState.quieto =
        !pState.agarre &&
        Math.abs(pState.x - pState.meta) < 0.3 &&
        Math.abs(pState.vel) < 2 &&
        Math.abs(pState.inclina) < 0.01;

      if (pState.quieto) {
        pState.x = pState.meta;
        pState.vel = 0;
        pinta(0);
        pState.raf = 0;
        pState.previo = 0;
        return;
      }

      pState.raf = requestAnimationFrame(paso);
    },
    [friccion, pinta]
  );

  const despierta = useCallback(() => {
    if (!physicsRef.current.raf) {
      physicsRef.current.raf = requestAnimationFrame(paso);
    }
  }, [paso]);

  const irA = useCallback(
    (index: number) => {
      mide();
      const pState = physicsRef.current;
      const safeIndex = Math.max(0, Math.min(totalItems - 1, index));
      pState.meta = pState.paradas[safeIndex] ?? 0;
      despierta();
    },
    [mide, totalItems, despierta]
  );

  // Inicialización y eventos de redimensión
  useEffect(() => {
    mide();
    if (initialIndex > 0) {
      irA(initialIndex);
    }

    const handleResize = () => {
      mide();
      irA(physicsRef.current.activeIdx);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (physicsRef.current.raf) {
        cancelAnimationFrame(physicsRef.current.raf);
      }
    };
  }, [mide, initialIndex, irA]);

  // Manejadores de arrastre con Pointer Events
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    mide();
    const pState = physicsRef.current;
    pState.agarre = { id: e.pointerId, px: e.clientX, x0: pState.x, movido: false };
    pState.muestras = [{ t: performance.now(), x: e.clientX }];
    pState.vel = 0;

    const el = ventanaRef.current;
    if (el) {
      el.setPointerCapture(e.pointerId);
      el.setAttribute('data-arrastrando', '');
    }
    despierta();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const pState = physicsRef.current;
    if (!pState.agarre || e.pointerId !== pState.agarre.id) return;

    const d = e.clientX - pState.agarre.px;
    if (Math.abs(d) > 4) pState.agarre.movido = true;
    pState.x = estira(pState.agarre.x0 + d);
    pState.muestras.push({ t: performance.now(), x: e.clientX });

    while (
      pState.muestras.length > 2 &&
      pState.muestras[pState.muestras.length - 1].t - pState.muestras[0].t > 100
    ) {
      pState.muestras.shift();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const pState = physicsRef.current;
    if (!pState.agarre || e.pointerId !== pState.agarre.id) return;

    const m = pState.muestras;
    const a = m[0];
    const b = m[m.length - 1];
    const dt = b && a ? (b.t - a.t) / 1000 : 0;
    pState.vel = dt > 0.005 && b && a ? (b.x - a.x) / dt : 0;

    if (pState.x > 0 || pState.x < pState.min) {
      pState.vel *= goma;
    }

    const libre = pState.x + pState.vel / friccion;
    pState.meta = iman ? pState.paradas[cercana(limita(libre))] : limita(libre);

    pState.agarre = null;
    const el = ventanaRef.current;
    if (el) el.removeAttribute('data-arrastrando');
    despierta();
  };

  // Odómetro visual: dígitos de decenas y unidades
  const displayNum = currentIndex + 1;
  const tens = Math.floor(displayNum / 10);
  const units = displayNum % 10;
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  useEffect(() => {
    if (rodilloTensRef.current) {
      rodilloTensRef.current.style.transform = `translateY(-${tens * 1.25}em)`;
    }
    if (rodilloUnitsRef.current) {
      rodilloUnitsRef.current.style.transform = `translateY(-${units * 1.25}em)`;
    }
  }, [tens, units]);

  return (
    <div className={`moxen-inercia-wrapper w-full space-y-3 ${className}`}>
      {/* Barra superior de telemetría y controles */}
      {showNavigationControls && (
        <div className="flex items-center justify-between px-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest font-bold">
              Arquetipo
            </span>
            <div className="flex items-center text-sm font-mono font-black text-cyan-300 bg-black/60 px-2 py-0.5 rounded-lg border border-cyan-500/30">
              <div className="in-rodillo-box">
                <div ref={rodilloTensRef} className="in-rodillo-strip">
                  {digits.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
              </div>
              <div className="in-rodillo-box">
                <div ref={rodilloUnitsRef} className="in-rodillo-strip">
                  {digits.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
              </div>
              <span className="text-slate-500 mx-1">/</span>
              <span className="text-slate-400">
                {totalItems < 10 ? `0${totalItems}` : totalItems}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Barra de avance */}
            <div className="hidden sm:block w-32 in-pista-barra">
              <span
                ref={barraFillRef}
                className="in-pista-barra-fill bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.8)]"
                style={{ transform: `scaleX(${Math.max(0.08, (currentIndex + 1) / totalItems)})` }}
              />
            </div>

            {/* Flechas tácticas paso a paso */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  irA(currentIndex - 1);
                }}
                disabled={currentIndex === 0}
                className="p-1.5 rounded-lg bg-black/60 border border-white/10 hover:border-cyan-400/60 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Arquetipo anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  irA(currentIndex + 1);
                }}
                disabled={currentIndex >= totalItems - 1}
                className="p-1.5 rounded-lg bg-black/60 border border-white/10 hover:border-cyan-400/60 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Siguiente arquetipo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ventana de visualización con arrastre inercial */}
      <div
        ref={ventanaRef}
        className="in-ventana"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div ref={pistaRef} className="in-pista">
          {React.Children.map(children, (child, idx) => {
            const isActive = idx === currentIndex;
            return (
              <div
                key={idx}
                onClick={() => {
                  if (!physicsRef.current.agarre?.movido && idx !== currentIndex) {
                    irA(idx);
                  }
                }}
                className={`in-tarjeta cursor-pointer transition-all ${
                  isActive
                    ? 'ring-2 ring-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.35)] scale-[1.02]'
                    : 'opacity-70 hover:opacity-90 scale-95'
                }`}
              >
                {child}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MoxenInercia;
