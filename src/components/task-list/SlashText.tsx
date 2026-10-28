import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';

interface SlashTextProps {
  text: string;
  isCompleted: boolean;
  className?: string;
  slashColor?: string;
}

// Generador de números pseudo-aleatorios con semilla (de trazo.js)
function azar(s: number) {
  let seed = s;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

const mezcla = (a: number, b: number, t: number) => a + (b - a) * t;
const sujeta = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const suave = (a: number, b: number, x: number) => {
  const t = sujeta((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/**
 * Genera el contorno cerrado de la tachadura orgánica basado en el algoritmo
 * de pluma a mano alzada de Moxen Trazo (curva sinuosa, presión variable y gancho final).
 */
function generaTrazoTachadura(ancho: number, alto: number, seed: number) {
  const r = azar(seed);
  const e = Math.min(1.2, Math.max(0.75, alto / 20));
  const x0 = -3 * e;
  const x1 = ancho + 5 * e;
  const sube = (2.2 + r() * 2.6) * e; // Sube levemente hacia la derecha, como la mano humana
  const fase = r() * 6.28;
  const base = (2.6 + r() * 0.7) * e; // Grosor base del trazo de energía

  const n = Math.max(26, Math.min(60, Math.floor(ancho / 5)));
  const x = new Float32Array(n + 1);
  const y = new Float32Array(n + 1);
  const w = new Float32Array(n + 1);

  const cy = alto / 2;

  for (let i = 0; i <= n; i++) {
    const u = i / n;
    x[i] = mezcla(x0, x1, u);
    // Coordenada Y con oscilación natural + leve inclinación + gancho final
    y[i] = cy + (1.2 - u * sube) + 1.1 * e * Math.sin(u * 5.5 + fase) + 3.0 * e * suave(0.92, 1, u);
    // Presión y grosor variable: fino al apoyar, engorda en el centro, adelgaza al final
    w[i] = base * (0.45 + 0.55 * suave(0, 0.08, u)) * (0.92 + 0.1 * Math.sin(u * 9 + fase)) * (1 - 0.58 * suave(0.8, 1, u));
  }

  // Generar contorno vectorial con normales perpendiculares
  const topPoints: [number, number][] = [];
  const botPoints: [number, number][] = [];

  for (let i = 0; i <= n; i++) {
    const a = Math.max(0, i - 1);
    const b = Math.min(n, i + 1);
    const dx = x[b] - x[a];
    const dy = y[b] - y[a];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const h = w[i] / 2;

    topPoints.push([x[i] + nx * h, y[i] + ny * h]);
    botPoints.push([x[i] - nx * h, y[i] - ny * h]);
  }

  // Armar el path SVG con puntas semicirculares
  let d = `M ${topPoints[0][0].toFixed(2)} ${topPoints[0][1].toFixed(2)}`;
  for (let i = 1; i <= n; i++) {
    d += ` L ${topPoints[i][0].toFixed(2)} ${topPoints[i][1].toFixed(2)}`;
  }

  const lastBot = botPoints[n];
  const rEnd = (w[n] / 2).toFixed(2);
  d += ` A ${rEnd} ${rEnd} 0 0 1 ${lastBot[0].toFixed(2)} ${lastBot[1].toFixed(2)}`;

  for (let i = n - 1; i >= 0; i--) {
    d += ` L ${botPoints[i][0].toFixed(2)} ${botPoints[i][1].toFixed(2)}`;
  }

  const firstTop = topPoints[0];
  const rStart = (w[0] / 2).toFixed(2);
  d += ` A ${rStart} ${rStart} 0 0 1 ${firstTop[0].toFixed(2)} ${firstTop[1].toFixed(2)}`;
  d += ' Z';

  return { d, totalWidth: x1 - x0 };
}

export const SlashText: React.FC<SlashTextProps> = ({
  text,
  isCompleted,
  className = '',
  slashColor = '#00f0ff',
}) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 20 });

  // Semilla determinista única por cada título para que cada tarea tenga su propio trazo personal
  const seed = useMemo(() => {
    let s = 19;
    for (let i = 0; i < text.length; i++) {
      s = (s * 31 + text.charCodeAt(i)) % 2147483647;
    }
    return Math.max(1, s);
  }, [text]);

  // Medir ancho real del texto renderizado
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        setDimensions({
          width: Math.ceil(rect.width),
          height: Math.max(18, Math.ceil(rect.height)),
        });
      }
    };

    updateSize();

    // ResizeObserver para cambios dinámicos de tipografía o viewport
    const observer = new ResizeObserver(() => updateSize());
    observer.observe(el);

    return () => observer.disconnect();
  }, [text]);

  // Ancho efectivo (usar estimación mientras mide para evitar saltos)
  const effectiveWidth = dimensions.width || Math.max(40, text.length * 8.5);
  const effectiveHeight = dimensions.height;

  // Cálculo del contorno orgánico Moxen Trazo
  const strokeData = useMemo(() => {
    return generaTrazoTachadura(effectiveWidth, effectiveHeight, seed);
  }, [effectiveWidth, effectiveHeight, seed]);

  const activeColor = slashColor || '#00f0ff';

  return (
    <span ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Texto de la tarea: se atenúa suavemente tras el paso de la pluma/láser */}
      <span
        className="inline-block transition-all duration-300"
        style={{
          opacity: isCompleted ? 0.45 : 1,
          transitionDelay: isCompleted ? '100ms' : '0ms',
        }}
      >
        {text}
      </span>

      {/* Trazo vectorial orgánico Moxen Trazo con estética Cyberpunk Neón */}
      <svg
        className="absolute inset-0 pointer-events-none overflow-visible"
        width={effectiveWidth}
        height={effectiveHeight}
        aria-hidden="true"
      >
        <motion.path
          d={strokeData.d}
          fill={activeColor}
          initial={false}
          animate={
            isCompleted
              ? {
                  clipPath: 'inset(0% 0% 0% 0%)',
                  opacity: 0.95,
                }
              : {
                  clipPath: 'inset(0% 100% 0% 0%)',
                  opacity: 0,
                }
          }
          transition={{
            duration: isCompleted ? 0.32 : 0.18,
            ease: isCompleted ? [0.42, 0, 0.3, 1] : 'easeIn',
          }}
          style={{
            filter: isCompleted
              ? `drop-shadow(0 0 3px ${activeColor}) drop-shadow(0 0 6px ${activeColor})`
              : 'none',
          }}
        />
      </svg>
    </span>
  );
};

export default SlashText;
