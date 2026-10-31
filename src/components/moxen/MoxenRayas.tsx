import React, { useEffect, useRef, useState } from 'react';
import './moxenRayas.css';
import { Check } from 'lucide-react';

export type MoxenRayasVariant = 'hero' | 'compact' | 'slim';
export type MoxenRayasTheme = 'cyan' | 'purple' | 'amber' | 'emerald' | 'rose';
export type MoxenRayasMode = 'active' | 'reactive';

export interface MoxenRayasProps {
  /** Valor de progreso: entre 0 y 1 (o entre 0 y 100) */
  progress: number;
  /** Variante visual de tamaño */
  variant?: MoxenRayasVariant;
  /** Paleta de color integrada con la app */
  theme?: MoxenRayasTheme;
  /** 'active' para procesos continuos; 'reactive' para barras de estado que solo despiertan al cambiar */
  mode?: MoxenRayasMode;
  /** Título principal opcional (solo en hero o compact con labels) */
  title?: string;
  /** Subtítulo o detalle de telemetría */
  subtitle?: string;
  /** Cantidad total para cálculo de unidades (ej. 2.4 para MB o 10 para tareas) */
  totalUnits?: number;
  /** Etiqueta de unidad (ej. "MB", "KB", "misiones") */
  unitLabel?: string;
  /** Muestra u oculta el odómetro numérico mecánico */
  showOdometer?: boolean;
  /** Muestra cálculo de tiempo restante estimado */
  showTimeRemaining?: boolean;
  /** Callback al alcanzar el 100% de la barra */
  onComplete?: () => void;
  className?: string;
}

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

// Función de muesca mecánica: detiene momentáneamente los números en enteros
const muesca = (v: number) => {
  const u = v - 0.35;
  const f = u - Math.floor(u);
  const s = clamp(f / 0.3, 0, 1);
  return Math.floor(u) + s * s * (3 - 2 * s);
};

export const MoxenRayas: React.FC<MoxenRayasProps> = ({
  progress,
  variant = 'compact',
  theme = 'cyan',
  mode = 'active',
  title,
  subtitle,
  totalUnits,
  unitLabel,
  showOdometer = true,
  showTimeRemaining = true,
  onComplete,
  className = '',
}) => {
  // Normalizar meta a [0, 1]
  const target = clamp(progress > 1 ? progress / 100 : progress, 0, 1);

  const containerRef = useRef<HTMLDivElement>(null);
  const rellenoRef = useRef<HTMLDivElement>(null);
  const contraRef = useRef<HTMLDivElement>(null);

  // Columnas del odómetro
  const colHundredsRef = useRef<HTMLDivElement>(null);
  const colTensRef = useRef<HTMLDivElement>(null);
  const colUnitsRef = useRef<HTMLDivElement>(null);

  // Estados de telemetría visible
  const [percentDisplay, setPercentDisplay] = useState<number>(0);
  const [timeRemainingText, setTimeRemainingText] = useState<string>('Calculando…');
  const [unitsText, setUnitsText] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isQuiet, setIsQuiet] = useState<boolean>(false);

  // Referencias para la física del resorte continuo
  const stateRef = useRef({
    target: target,
    current: 0,
    velocity: 0,
    rate: 0,
    prevTime: null as number | null,
    rafId: 0,
    hasCompletedFired: false,
    activeUntilTime: Date.now() + 2500,
  });

  // Actualizar meta cuando cambie la prop
  useEffect(() => {
    stateRef.current.target = target;
    if (mode === 'reactive') {
      // Despertar animación de rayas por al menos 1.6s
      stateRef.current.activeUntilTime = Date.now() + 1600;
      setIsQuiet(false);
    }
    if (target < 1) {
      stateRef.current.hasCompletedFired = false;
      setIsCompleted(false);
    }
  }, [target, mode]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const updatePhysics = (timestamp: number) => {
      const state = stateRef.current;
      const dt = state.prevTime === null ? 1 / 60 : Math.min(0.032, (timestamp - state.prevTime) / 1000);
      state.prevTime = timestamp;

      if (prefersReducedMotion) {
        state.current = state.target;
        state.velocity = 0;
      } else {
        // Resorte crítico amortiguado (k = 34, c = 2*sqrt(34))
        const k = 34;
        const c = 2 * Math.sqrt(k);
        for (let i = 0; i < 4; i++) {
          const h = dt / 4;
          state.velocity += (-k * (state.current - state.target) - c * state.velocity) * h;
          state.current = clamp(state.current + state.velocity * h, 0, 1);
        }
      }

      state.rate += (Math.max(0, state.velocity) - state.rate) * Math.min(1, dt * 1.5);

      // ── Render de posición física en DOM ──
      const cur = state.current;
      if (rellenoRef.current) {
        rellenoRef.current.style.transform = `translateX(${((cur - 1) * 100).toFixed(3)}%)`;
      }
      if (contraRef.current) {
        contraRef.current.style.transform = `translateX(${((1 - cur) * 100).toFixed(3)}%)`;
      }

      // ── Odómetro mecánico ──
      const v = muesca(cur * 100);
      const u = v % 10;
      const pos = [
        Math.floor(v / 100) + Math.max(0, (v % 100) - 99),
        (Math.floor(v / 10) % 10) + Math.max(0, u - 9),
        u,
      ];
      const opacity = [clamp(v - 99, 0, 1), clamp(v - 9, 0, 1), 1];

      if (colHundredsRef.current) {
        colHundredsRef.current.style.transform = `translateY(-${pos[0] * 1.15}em)`;
        colHundredsRef.current.style.opacity = `${opacity[0]}`;
      }
      if (colTensRef.current) {
        colTensRef.current.style.transform = `translateY(-${pos[1] * 1.15}em)`;
        colTensRef.current.style.opacity = `${opacity[1]}`;
      }
      if (colUnitsRef.current) {
        colUnitsRef.current.style.transform = `translateY(-${pos[2] * 1.15}em)`;
      }

      const pRounded = Math.round(cur * 100);
      setPercentDisplay(pRounded);

      if (totalUnits) {
        const currentUnitsVal = (cur * totalUnits).toLocaleString('es-CR', { maximumFractionDigits: 1 });
        const totalUnitsVal = totalUnits.toLocaleString('es-CR', { maximumFractionDigits: 1 });
        setUnitsText(`${currentUnitsVal} de ${totalUnitsVal} ${unitLabel || ''}`);
      }

      if (pRounded === 100) {
        setTimeRemainingText('Completado');
      } else if (state.rate > 0.01) {
        const secondsLeft = Math.max(1, Math.ceil((1 - cur) / state.rate));
        setTimeRemainingText(`Quedan ${secondsLeft} s`);
      } else {
        setTimeRemainingText('Calculando…');
      }

      // Comprobar estado de quietud reactivo
      if (mode === 'reactive') {
        const isStillGracePeriod = Date.now() < state.activeUntilTime;
        const isMoving = Math.abs(state.velocity) > 0.003;
        setIsQuiet(!isStillGracePeriod && !isMoving);
      } else {
        setIsQuiet(false);
      }

      // Comprobar si llegó a la meta final
      const isSettled = Math.abs(cur - state.target) < 0.001 && Math.abs(state.velocity) < 0.002;
      if (isSettled && state.target >= 1) {
        setIsCompleted(true);
        if (!state.hasCompletedFired) {
          state.hasCompletedFired = true;
          onComplete?.();
        }
      }

      state.rafId = requestAnimationFrame(updatePhysics);
    };

    stateRef.current.rafId = requestAnimationFrame(updatePhysics);

    return () => {
      cancelAnimationFrame(stateRef.current.rafId);
    };
  }, [totalUnits, unitLabel, onComplete, mode]);

  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

  return (
    <div
      ref={containerRef}
      className={`ry-barra-wrapper space-y-1.5 ${isCompleted ? 'is-lista' : ''} ${isQuiet ? 'is-quieto' : ''} ${className}`}
    >
      {/* Encabezado para variantes hero y compact con title */}
      {(title || (variant === 'hero' && showOdometer)) && (
        <div className="flex items-center justify-between text-xs tracking-wider">
          <div className="flex flex-col">
            {title && <span className="font-bold text-white font-anton uppercase tracking-wide">{title}</span>}
            {subtitle && <span className="text-[11px] text-slate-400 font-mono">{subtitle}</span>}
          </div>

          {variant === 'hero' && showOdometer && (
            <div className="flex items-baseline gap-0.5 font-mono font-black text-white text-base">
              <div className="ry-odometro-container">
                <div ref={colHundredsRef} className="ry-odometro-columna">
                  {digits.map((d, i) => (
                    <span key={i}>{d}</span>
                  ))}
                </div>
                <div ref={colTensRef} className="ry-odometro-columna">
                  {digits.map((d, i) => (
                    <span key={i}>{d}</span>
                  ))}
                </div>
                <div ref={colUnitsRef} className="ry-odometro-columna">
                  {digits.map((d, i) => (
                    <span key={i}>{d}</span>
                  ))}
                </div>
              </div>
              <span className="text-xs text-slate-400 font-bold">%</span>
            </div>
          )}
        </div>
      )}

      {/* Contenedor Físico de la Barra */}
      <div
        role="progressbar"
        aria-valuenow={percentDisplay}
        aria-valuemin={0}
        aria-valuemax={100}
        className={`ry-barra-container ry-theme-${theme} ry-size-${variant}`}
      >
        <div ref={rellenoRef} className="ry-relleno-layer">
          <div ref={contraRef} className="ry-contra-layer">
            <div className="ry-rayas-pattern" />
          </div>
        </div>

        {/* Checkmark animado al completar */}
        {variant !== 'slim' && (
          <div className="ry-check-icon">
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-lg">
              <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
            </div>
          </div>
        )}
      </div>

      {/* Pie de Telemetría para Variante Hero */}
      {variant === 'hero' && (totalUnits || showTimeRemaining) && (
        <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 pt-0.5">
          <span>{unitsText}</span>
          {showTimeRemaining && (
            <span className={isCompleted ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
              {timeRemainingText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default MoxenRayas;
