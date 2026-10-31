import React, { useEffect, useRef } from 'react';
import './moxenEclipse.css';
import { soundFX } from '../../utils/audio';

interface MoxenEclipseToggleProps {
  isNight?: boolean;
  onToggle?: (isNight: boolean) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const HZ = 240;
const PASO = 1 / HZ;
const acota = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const suave = (t: number) => t * t * (3 - 2 * t);

export const MoxenEclipseToggle: React.FC<MoxenEclipseToggleProps> = ({
  isNight = true,
  onToggle,
  className = '',
  size = 'md',
}) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const stateRef = useRef({
    esNoche: isNight,
    p: isNight ? 1 : 0,
    vp: 0,
    q: isNight ? 1 : 0,
    vq: 0,
    raf: 0,
    previo: null as number | null,
    resto: 0,
    qAntes: isNight ? 1 : 0,
  });

  const sizeStyles = {
    sm: { '--ec-tam': '14px' } as React.CSSProperties,
    md: { '--ec-tam': '18px' } as React.CSSProperties,
    lg: { '--ec-tam': '26px' } as React.CSSProperties,
  };

  useEffect(() => {
    const boton = buttonRef.current;
    if (!boton) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const astro = boton.querySelector('.ec-astro') as HTMLElement;
    const forma = boton.querySelector('.ec-forma') as HTMLElement;
    const luna = boton.querySelector('.ec-luna') as HTMLElement;
    const corona = boton.querySelector('.ec-corona') as HTMLElement;
    const diamante = boton.querySelector('.ec-diamante') as HTMLElement;
    const noche = boton.querySelector('.ec-cielo-noche') as HTMLElement;
    const halos = boton.querySelector('.ec-halos') as HTMLElement;

    const s = stateRef.current;

    function pinta() {
      if (!astro || !forma || !luna || !corona || !noche || !halos) return;
      const recorrido = 2.6; // em que cruza el astro
      const x = acota(s.p, 0, 1);
      const golpe = s.p > 1 ? s.p - 1 : s.p < 0 ? -s.p : 0;
      const estira = Math.min(0.07, Math.abs(s.vp) * 0.014);
      const sx = (1 + estira) * (1 - 1.5 * golpe);
      const sy = (1 - estira * 0.6) * (1 + 0.9 * golpe);

      astro.style.transform = halos.style.transform = `translateX(${(x * recorrido).toFixed(4)}em)`;
      forma.style.transformOrigin = s.p > 0.5 ? '100% 50%' : '0 50%';
      forma.style.transform = `scale(${sx.toFixed(4)},${sy.toFixed(4)})`;

      const l = acota(s.q, 0, 1);
      luna.style.transform = `translateX(${((1 - l) * 110).toFixed(2)}%)`;
      noche.style.opacity = suave(x).toFixed(3);
      corona.style.opacity = suave(acota((l - 0.82) / 0.18, 0, 1)).toFixed(3);
    }

    function destello() {
      if (reduce || !diamante || !diamante.animate) return;
      soundFX.playClick();
      diamante.animate(
        [
          { opacity: 0, transform: 'scale(.3) rotate(-20deg)' },
          { opacity: 1, transform: 'scale(1.25) rotate(0deg)', offset: 0.3 },
          { opacity: 0, transform: 'scale(.7) rotate(15deg)' },
        ],
        { duration: 750, easing: 'cubic-bezier(.22, 1, .36, 1)' }
      );
    }

    function paso() {
      const meta = s.esNoche ? 1 : 0;
      s.vp += (220 * (meta - s.p) - 19 * s.vp) * PASO;
      s.p += s.vp * PASO;
      s.vq += (130 * (meta - s.q) - 19 * s.vq) * PASO;
      s.q += s.vq * PASO;

      if ((s.qAntes - 0.93) * (s.q - 0.93) < 0) {
        destello();
      }
      s.qAntes = s.q;
    }

    function cuadro(t: number) {
      if (s.previo !== null) s.resto += Math.min(100, t - s.previo);
      s.previo = t;
      const n = Math.floor(s.resto / (1000 / HZ));
      for (let k = 0; k < n; k++) paso();
      s.resto -= n * (1000 / HZ);
      pinta();

      const meta = s.esNoche ? 1 : 0;
      if (Math.abs(s.p - meta) + Math.abs(s.vp) + Math.abs(s.q - meta) + Math.abs(s.vq) < 1e-4) {
        s.p = s.q = meta;
        s.vp = s.vq = 0;
        pinta();
        s.raf = 0;
        s.previo = null;
        return;
      }
      s.raf = requestAnimationFrame(cuadro);
    }

    // Efecto de onda lumínica que tiñe la pantalla al alternar
    function lanzaOnda(nocheActiva: boolean) {
      if (reduce) return;
      const rect = boton.getBoundingClientRect();
      const u = rect.height / 2;
      const cx = rect.left + u + (nocheActiva ? rect.width - 2 * u : 0);
      const cy = rect.top + u;
      const R = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy)) + 8;

      const onda = document.createElement('div');
      onda.className = 'ec-onda';
      const colorOnda = nocheActiva
        ? 'radial-gradient(circle, #02040a 0%, #030712 100%)'
        : 'radial-gradient(circle, #0284c7 0%, #0369a1 40%, #0c1633 100%)';

      Object.assign(onda.style, {
        left: `${cx - R}px`,
        top: `${cy - R}px`,
        width: `${2 * R}px`,
        height: `${2 * R}px`,
        background: colorOnda,
        zIndex: '30',
        opacity: '0.45',
        pointerEvents: 'none',
      });

      document.body.appendChild(onda);
      const anim = onda.animate(
        [{ transform: 'scale(0)', opacity: 0.7 }, { transform: 'scale(1)', opacity: 0 }],
        { duration: 900, easing: 'cubic-bezier(.45, 0, .2, 1)', fill: 'forwards' }
      );
      anim.onfinish = () => onda.remove();
    }

    function marca() {
      boton.classList.toggle('is-noche', s.esNoche);
      boton.setAttribute('aria-checked', s.esNoche ? 'true' : 'false');
    }

    function handleClick() {
      s.esNoche = !s.esNoche;
      marca();
      soundFX.playClick();
      lanzaOnda(s.esNoche);
      onToggle?.(s.esNoche);

      if (reduce) {
        s.p = s.q = s.esNoche ? 1 : 0;
        pinta();
        return;
      }
      if (!s.raf) s.raf = requestAnimationFrame(cuadro);
    }

    boton.addEventListener('click', handleClick);

    // Estado inicial estático
    boton.classList.add('ec-quieto');
    marca();
    pinta();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => boton.classList.remove('ec-quieto'));
    });

    return () => {
      boton.removeEventListener('click', handleClick);
      if (s.raf) cancelAnimationFrame(s.raf);
    };
  }, [onToggle]);

  return (
    <button
      ref={buttonRef}
      type="button"
      role="switch"
      aria-checked={isNight}
      aria-label="Alternar Visión Solar o Eclipse Boreal"
      className={`ec-interruptor select-none outline-none focus:outline-none ${className}`}
      style={sizeStyles[size]}
      title={isNight ? 'Modo Eclipse Boreal Activo (Toca para Sol Diurno)' : 'Modo Solar Diurno Activo (Toca para Eclipse)'}
    >
      <span className="ec-cielo" aria-hidden="true">
        <span className="ec-cielo-noche" />
        <span className="ec-halos">
          <i />
          <i />
          <i />
        </span>
        <span className="ec-estrellas">
          <i style={{ '--x': 0.42, '--y': 0.42, '--t': 0.05, '--d': '0.30s' } as React.CSSProperties} />
          <i style={{ '--x': 0.86, '--y': 1.22, '--t': 0.035, '--d': '0.38s' } as React.CSSProperties} />
          <i className="ec-destello" style={{ '--x': 1.12, '--y': 0.5, '--t': 0.17, '--d': '0.34s' } as React.CSSProperties} />
          <i style={{ '--x': 0.6, '--y': 1.58, '--t': 0.03, '--d': '0.46s' } as React.CSSProperties} />
          <i style={{ '--x': 1.5, '--y': 1.02, '--t': 0.045, '--d': '0.42s' } as React.CSSProperties} />
          <i style={{ '--x': 1.86, '--y': 0.34, '--t': 0.03, '--d': '0.5s' } as React.CSSProperties} />
          <i className="ec-destello" style={{ '--x': 2.06, '--y': 1.5, '--t': 0.13, '--d': '0.48s' } as React.CSSProperties} />
          <i style={{ '--x': 1.32, '--y': 1.66, '--t': 0.028, '--d': '0.54s' } as React.CSSProperties} />
          <i style={{ '--x': 2.32, '--y': 0.82, '--t': 0.04, '--d': '0.56s' } as React.CSSProperties} />
          <i style={{ '--x': 0.3, '--y': 0.98, '--t': 0.028, '--d': '0.36s' } as React.CSSProperties} />
          <i style={{ '--x': 1.7, '--y': 0.68, '--t': 0.025, '--d': '0.6s' } as React.CSSProperties} />
          <i style={{ '--x': 2.5, '--y': 1.24, '--t': 0.026, '--d': '0.62s' } as React.CSSProperties} />
        </span>
        <span className="ec-astro">
          <span className="ec-forma">
            <span className="ec-corona" />
            <span className="ec-sol">
              <span className="ec-luna">
                <i />
                <i />
                <i />
              </span>
            </span>
            <span className="ec-diamante" />
          </span>
        </span>
        <span className="ec-nubes ec-nubes-atras">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="ec-nubes ec-nubes-delante">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
      </span>
      <span className="ec-canto" aria-hidden="true" />
    </button>
  );
};
