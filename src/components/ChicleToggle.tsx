import React, { useEffect, useRef, useMemo } from 'react';

export type ChicleColor = 'cyan' | 'purple' | 'emerald' | 'amber' | 'indigo' | 'red';
export type ChicleSize = 'sm' | 'md' | 'lg';

export interface ChicleToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: ChicleColor;
  size?: ChicleSize;
  disabled?: boolean;
  className?: string;
  title?: string;
  ariaLabel?: string;
}

interface ChicleTheme {
  trackOff: string;
  borderOff: string;
  knobOff: [number, number, number];
  knobOffShade: [number, number, number];
  shineOff: number;

  trackOn: string;
  borderOn: string;
  glowOn: string;
  knobOn: [number, number, number];
  knobOnShade: [number, number, number];
  shineOn: number;
}

const THEMES: Record<ChicleColor, ChicleTheme> = {
  cyan: {
    trackOff: '#0a1018',
    borderOff: 'rgba(0, 240, 255, 0.25)',
    knobOff: [190, 205, 220],
    knobOffShade: [95, 115, 135],
    shineOff: 0.85,

    trackOn: '#002844',
    borderOn: 'rgba(0, 240, 255, 0.7)',
    glowOn: '0 0 12px rgba(0, 240, 255, 0.4)',
    knobOn: [0, 240, 255],
    knobOnShade: [0, 130, 200],
    shineOn: 0.95,
  },
  emerald: {
    trackOff: '#0a1018',
    borderOff: 'rgba(16, 185, 129, 0.25)',
    knobOff: [190, 205, 220],
    knobOffShade: [95, 115, 135],
    shineOff: 0.85,

    trackOn: '#023322',
    borderOn: 'rgba(52, 211, 153, 0.7)',
    glowOn: '0 0 12px rgba(52, 211, 153, 0.4)',
    knobOn: [52, 211, 153],
    knobOnShade: [5, 150, 105],
    shineOn: 0.95,
  },
  purple: {
    trackOff: '#0a1018',
    borderOff: 'rgba(168, 85, 247, 0.25)',
    knobOff: [190, 205, 220],
    knobOffShade: [95, 115, 135],
    shineOff: 0.85,

    trackOn: '#2d094d',
    borderOn: 'rgba(192, 132, 252, 0.7)',
    glowOn: '0 0 12px rgba(192, 132, 252, 0.4)',
    knobOn: [192, 132, 252],
    knobOnShade: [126, 34, 206],
    shineOn: 0.95,
  },
  amber: {
    trackOff: '#0a1018',
    borderOff: 'rgba(245, 158, 11, 0.25)',
    knobOff: [190, 205, 220],
    knobOffShade: [95, 115, 135],
    shineOff: 0.85,

    trackOn: '#3e1a02',
    borderOn: 'rgba(251, 191, 36, 0.7)',
    glowOn: '0 0 12px rgba(251, 191, 36, 0.4)',
    knobOn: [251, 191, 36],
    knobOnShade: [180, 83, 9],
    shineOn: 0.95,
  },
  indigo: {
    trackOff: '#0a1018',
    borderOff: 'rgba(99, 102, 241, 0.25)',
    knobOff: [190, 205, 220],
    knobOffShade: [95, 115, 135],
    shineOff: 0.85,

    trackOn: '#1e1b4b',
    borderOn: 'rgba(129, 140, 248, 0.7)',
    glowOn: '0 0 12px rgba(129, 140, 248, 0.4)',
    knobOn: [129, 140, 248],
    knobOnShade: [67, 56, 202],
    shineOn: 0.95,
  },
  red: {
    trackOff: '#0a1018',
    borderOff: 'rgba(239, 68, 68, 0.25)',
    knobOff: [190, 205, 220],
    knobOffShade: [95, 115, 135],
    shineOff: 0.85,

    trackOn: '#450a0a',
    borderOn: 'rgba(248, 113, 113, 0.7)',
    glowOn: '0 0 12px rgba(248, 113, 113, 0.4)',
    knobOn: [248, 113, 113],
    knobOnShade: [185, 28, 28],
    shineOn: 0.95,
  },
};

const SIZES: Record<ChicleSize, { w: number; h: number }> = {
  sm: { w: 42, h: 22 },
  md: { w: 50, h: 26 },
  lg: { w: 58, h: 30 },
};

// Parámetros de física de Moxen Chicle
const PUNTA = { k: 720, c: 40 };
const COLA = { k: 170, c: 13 };
const HZ = 240;

const acota = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const mezcla = (a: number, b: number, t: number) => a + (b - a) * t;

export const ChicleToggle: React.FC<ChicleToggleProps> = ({
  checked,
  onChange,
  color = 'cyan',
  size = 'md',
  disabled = false,
  className = '',
  title,
  ariaLabel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rellenoRef = useRef<HTMLSpanElement>(null);
  const theme = useMemo(() => THEMES[color] || THEMES.cyan, [color]);
  const dimensions = useMemo(() => SIZES[size] || SIZES.md, [size]);

  const { w: W, h: H } = dimensions;
  const M = H * 0.09;
  const D = H - 2 * M;
  const E = H * 0.22;

  // Refs para mantener estado físico de animación entre frames sin re-renderizar
  const checkedRef = useRef(checked);
  checkedRef.current = checked;

  const izqRef = useRef({ x: 0, v: 0, meta: 0, par: COLA });
  const derRef = useRef({ x: 0, v: 0, meta: 0, par: COLA });
  const haciaDerRef = useRef(!checked);
  const rafRef = useRef<number>(0);
  const previoRef = useRef<number | null>(null);
  const restoRef = useRef<number>(0);
  const agarreRef = useRef<{ x0: number; mueve: boolean; pointerId: number } | null>(null);
  const ignoraClickRef = useRef<boolean>(false);

  // Calcula posiciones de reposo
  const reposo = () => {
    return checkedRef.current ? [W - M - D, W - M] : [M, M + D];
  };

  // Asignar rol punta vs cola según dirección
  const apunta = (aDer: boolean) => {
    haciaDerRef.current = aDer;
    derRef.current.par = aDer ? PUNTA : COLA;
    izqRef.current.par = aDer ? COLA : PUNTA;
  };

  // Cálculo del contorno de gota y conservación de volumen de goma
  const perfil = () => {
    const izq = izqRef.current;
    const der = derRef.current;
    const haciaDer = haciaDerRef.current;
    const w = der.x - izq.x;
    const r = D / 2;

    if (w <= D) {
      const rx = Math.max(w, D * 0.7) / 2;
      const ry = Math.min(r * 1.2, r * Math.sqrt(D / Math.max(1, w)));
      const c = (izq.x + der.x) / 2;
      return {
        a: c - rx,
        b: c + rx,
        h: (x: number) => ry * Math.sqrt(Math.max(0, 1 - Math.pow((x - c) / rx, 2))),
      };
    }

    const s = acota((w - D) / (W - 2 * M - D), 0, 1.3);
    const rp = r * (1 - 0.1 * s);
    const rc = r * (1 - 0.32 * s);
    const [r1, r2] = haciaDer ? [rc, rp] : [rp, rc];
    const c1 = izq.x + r1;
    const c2 = der.x - r2;
    const L = c2 - c1;
    const circ = (x: number, c: number, rr: number) => Math.sqrt(Math.max(0, rr * rr - (x - c) * (x - c)));

    if (L <= Math.abs(r1 - r2) + 0.01) {
      return {
        a: izq.x,
        b: der.x,
        h: (x: number) => Math.max(circ(x, c1, r1), circ(x, c2, r2)),
      };
    }

    const sf = (r1 - r2) / L;
    const cf = Math.sqrt(Math.max(0, 1 - sf * sf));
    const t1 = c1 + r1 * sf;
    const t2 = c2 + r2 * sf;
    const y1 = r1 * cf;
    const y2 = r2 * cf;
    const aprieta = 0.42 * Math.pow(Math.min(1, s), 1.2);

    return {
      a: izq.x,
      b: der.x,
      h: (x: number) => {
        if (x <= t1) return circ(x, c1, r1);
        if (x >= t2) return circ(x, c2, r2);
        const u = (x - t1) / (t2 - t1);
        return (y1 + (y2 - y1) * u) * (1 - aprieta * Math.pow(Math.sin(Math.PI * u), 2));
      },
    };
  };

  // Renderizado completo en lienzo Canvas 2D
  const dibuja = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = canvas.getContext('2d');
    if (!g) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const izq = izqRef.current;
    const der = derRef.current;
    const haciaDer = haciaDerRef.current;

    const cola = haciaDer ? izq.x - M : der.x - M - D;
    const travel = Math.max(1, W - 2 * M - D);
    const f = acota(cola / travel, 0, 1);

    if (rellenoRef.current) {
      rellenoRef.current.style.opacity = (f * f * (3 - 2 * f)).toFixed(3);
    }

    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W + 2 * E, H + 2 * E);
    g.translate(E, E + H / 2);

    const p = perfil();
    const N = 48;
    const xs: number[] = [];
    for (let i = 0; i <= N; i++) {
      xs.push(p.a + ((p.b - p.a) * (1 - Math.cos((Math.PI * i) / N))) / 2);
    }

    g.beginPath();
    xs.forEach((x, i) => {
      if (i === 0) g.moveTo(x, -p.h(x));
      else g.lineTo(x, -p.h(x));
    });
    for (let i = N; i >= 0; i--) {
      g.lineTo(xs[i], p.h(xs[i]));
    }
    g.closePath();

    // Degradado del cuerpo de goma
    const colA = [
      Math.round(mezcla(theme.knobOff[0], theme.knobOn[0], f)),
      Math.round(mezcla(theme.knobOff[1], theme.knobOn[1], f)),
      Math.round(mezcla(theme.knobOff[2], theme.knobOn[2], f)),
    ];
    const colB = [
      Math.round(mezcla(theme.knobOffShade[0], theme.knobOnShade[0], f)),
      Math.round(mezcla(theme.knobOffShade[1], theme.knobOnShade[1], f)),
      Math.round(mezcla(theme.knobOffShade[2], theme.knobOnShade[2], f)),
    ];

    const grad = g.createLinearGradient(0, -D / 2, 0, D / 2);
    grad.addColorStop(0, `rgb(${colA.join(',')})`);
    grad.addColorStop(1, `rgb(${colB.join(',')})`);

    g.save();
    g.shadowColor = 'rgba(0, 0, 0, 0.45)';
    g.shadowBlur = H * 0.12 * dpr;
    g.shadowOffsetY = H * 0.04 * dpr;
    g.fillStyle = grad;
    g.fill();
    g.restore();

    // Reflejo especular superior
    g.save();
    g.clip();
    const brillo = mezcla(theme.shineOff, theme.shineOn, f);
    const xr = haciaDer ? p.b - D * 0.5 : p.a + D * 0.5;
    const rr = g.createRadialGradient(xr - D * 0.12, -D * 0.26, 0, xr - D * 0.12, -D * 0.26, D * 0.44);
    rr.addColorStop(0, `rgba(255, 255, 255, ${brillo})`);
    rr.addColorStop(1, 'rgba(255, 255, 255, 0)');
    g.fillStyle = rr;
    g.fillRect(p.a - D, -D, p.b - p.a + 2 * D, 2 * D);

    // Luz de rebote inferior volumétrica
    const rb = g.createLinearGradient(0, D * 0.2, 0, D * 0.55);
    rb.addColorStop(0, 'rgba(255, 255, 255, 0)');
    rb.addColorStop(1, `rgba(255, 255, 255, ${(brillo * 0.25).toFixed(3)})`);
    g.fillStyle = rb;
    g.fillRect(p.a - D, 0, p.b - p.a + 2 * D, D);
    g.restore();

    g.lineWidth = 1;
    g.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    g.stroke();
  };

  const paso = () => {
    const h = 1 / HZ;
    const izq = izqRef.current;
    const der = derRef.current;
    [izq, der].forEach((b) => {
      b.v += (b.par.k * (b.meta - b.x) - b.par.c * b.v) * h;
      b.x += b.v * h;
    });
    if (der.x - izq.x < D * 0.7) {
      const c = (der.x + izq.x) / 2;
      izq.x = c - D * 0.35;
      der.x = c + D * 0.35;
    }
  };

  const cuadro = (t: number) => {
    if (previoRef.current !== null) {
      restoRef.current += Math.min(100, t - previoRef.current);
    }
    previoRef.current = t;
    const n = Math.floor(restoRef.current / (1000 / HZ));
    for (let k = 0; k < n; k++) paso();
    restoRef.current -= n * (1000 / HZ);
    dibuja();

    const izq = izqRef.current;
    const der = derRef.current;
    const quieto =
      Math.abs(izq.meta - izq.x) < 0.05 &&
      Math.abs(der.meta - der.x) < 0.05 &&
      Math.abs(izq.v) < 0.5 &&
      Math.abs(der.v) < 0.5;

    if (quieto && !agarreRef.current) {
      izq.x = izq.meta;
      der.x = der.meta;
      izq.v = der.v = 0;
      dibuja();
      rafRef.current = 0;
      previoRef.current = null;
      return;
    }
    rafRef.current = requestAnimationFrame(cuadro);
  };

  const anima = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      izqRef.current.x = izqRef.current.meta;
      derRef.current.x = derRef.current.meta;
      dibuja();
      return;
    }
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(cuadro);
    }
  };

  // Inicialización y re-escalado de canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round((W + 2 * E) * dpr);
    canvas.height = Math.round((H + 2 * E) * dpr);

    apunta(checkedRef.current);
    const [a, b] = reposo();
    izqRef.current.meta = a;
    derRef.current.meta = b;
    izqRef.current.x = a;
    derRef.current.x = b;
    izqRef.current.v = 0;
    derRef.current.v = 0;
    dibuja();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [W, H, D, M, E]);

  // Actualización cuando cambia el prop `checked` externamente
  useEffect(() => {
    apunta(checked);
    const [a, b] = reposo();
    izqRef.current.meta = a;
    derRef.current.meta = b;
    anima();
  }, [checked]);

  // Controladores de puntero para arrastre elástico
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    agarreRef.current = { x0: e.clientX, mueve: false, pointerId: e.pointerId };
    apunta(!checkedRef.current);
    const [a, b] = reposo();
    const tira = H * 0.14;
    if (checkedRef.current) {
      izqRef.current.meta = a - tira;
    } else {
      derRef.current.meta = b + tira;
    }
    anima();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!agarreRef.current) return;
    const dx = e.clientX - agarreRef.current.x0;
    if (!agarreRef.current.mueve && Math.abs(dx) < 3) return;
    agarreRef.current.mueve = true;
    const [a, b] = reposo();
    if (checkedRef.current) {
      izqRef.current.meta = acota(a + dx, M, a);
    } else {
      derRef.current.meta = acota(b + dx, b, W - M);
    }
    anima();
  };

  const suelta = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!agarreRef.current) return;
    const mueve = agarreRef.current.mueve;
    try {
      e.currentTarget.releasePointerCapture(agarreRef.current.pointerId);
    } catch {}
    agarreRef.current = null;

    if (mueve) {
      ignoraClickRef.current = true;
      const [a, b] = reposo();
      const viaje = W - 2 * M - D;
      const avance = checkedRef.current ? a - izqRef.current.meta : derRef.current.meta - b;
      const shouldToggle = avance > viaje * 0.38;
      const nextVal = shouldToggle ? !checkedRef.current : checkedRef.current;
      if (nextVal !== checkedRef.current) {
        onChange(nextVal);
      } else {
        apunta(checkedRef.current);
        const [ra, rb] = reposo();
        izqRef.current.meta = ra;
        derRef.current.meta = rb;
        anima();
      }
    } else {
      apunta(checkedRef.current);
      const [ra, rb] = reposo();
      izqRef.current.meta = ra;
      derRef.current.meta = rb;
      anima();
    }
  };

  const handleClick = () => {
    if (disabled) return;
    if (ignoraClickRef.current) {
      ignoraClickRef.current = false;
      return;
    }
    onChange(!checkedRef.current);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checkedRef.current);
    } else if (e.key === 'ArrowRight' && !checkedRef.current) {
      e.preventDefault();
      onChange(true);
    } else if (e.key === 'ArrowLeft' && checkedRef.current) {
      e.preventDefault();
      onChange(false);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={suelta}
      onPointerCancel={suelta}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`relative inline-block flex-shrink-0 rounded-full transition-shadow duration-300 select-none ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
      } ${className}`}
      style={{
        width: `${W}px`,
        height: `${H}px`,
        background: theme.trackOff,
        boxShadow: `inset 0 2px 4px rgba(0, 0, 0, 0.75), inset 0 -1px 1px rgba(255, 255, 255, 0.08), 0 0 0 1px ${
          checked ? theme.borderOn : theme.borderOff
        }${checked && theme.glowOn ? `, ${theme.glowOn}` : ''}`,
        touchAction: 'none',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Relleno con opacidad dinámica según avance de la goma */}
      <span
        ref={rellenoRef}
        className="absolute inset-0 rounded-full pointer-events-none transition-colors duration-200"
        style={{
          background: theme.trackOn,
          opacity: checked ? 1 : 0,
          boxShadow: 'inset 0 2px 5px rgba(0, 0, 0, 0.6), inset 0 -1px 1px rgba(255, 255, 255, 0.1)',
        }}
      />

      {/* Lienzo donde se simula y dibuja la goma estirándose en gota */}
      <canvas
        ref={canvasRef}
        className="absolute pointer-events-none"
        style={{
          width: `${W + 2 * E}px`,
          height: `${H + 2 * E}px`,
          left: `${-E}px`,
          top: `${-E}px`,
        }}
        aria-hidden="true"
      />
    </button>
  );
};

export default ChicleToggle;
