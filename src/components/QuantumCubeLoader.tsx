import React, { useMemo } from 'react';
import { useUIStore } from '../store/useUIStore';
import './quantumCubeLoader.css';

export interface QuantumCubeLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  speed?: 'normal' | 'slow' | 'superslow';
  label?: string;
  sublabel?: string;
  showLabel?: boolean;
  className?: string;
}

export const QuantumCubeLoader: React.FC<QuantumCubeLoaderProps> = ({
  size = 'md',
  speed = 'slow',
  label = 'SINCRONIZANDO CON EL SISTEMA...',
  sublabel,
  showLabel = false,
  className = '',
}) => {
  const systemAura = useUIStore((s) => s.systemAura);
  const opticMode = useUIStore((s) => s.opticMode);

  // Derivación dinámica de colores sincronizada con «Apariencia & Visión» de Ajustes
  const palette = useMemo(() => {
    // 1. Modo Noir Oscuro (Manga B&W Monocromático)
    if (opticMode === 'noir') {
      return {
        c1: '#ffffff', c2: '#cbd5e1', c3: '#94a3b8', c4: '#64748b',
        glow: 'rgba(255, 255, 255, 0.4)',
        glowSecondary: 'rgba(148, 163, 184, 0.25)',
        textColor: 'text-slate-200',
      };
    }

    // 2. Modo Cobalto Azul (Enfoque & Determinación)
    if (opticMode === 'cobalt') {
      return {
        c1: '#60a5fa', c2: '#38bdf8', c3: '#1d4ed8', c4: '#0284c7',
        glow: 'rgba(96, 165, 250, 0.45)',
        glowSecondary: 'rgba(29, 78, 216, 0.35)',
        textColor: 'text-blue-300',
      };
    }

    // 3. Modo Noir Claro (Tinta E-Ink)
    if (opticMode === 'eink') {
      return {
        c1: '#f8fafc', c2: '#e2e8f0', c3: '#94a3b8', c4: '#475569',
        glow: 'rgba(200, 200, 200, 0.25)',
        glowSecondary: 'rgba(100, 116, 139, 0.2)',
        textColor: 'text-slate-300',
      };
    }

    // 4. Paleta personalizada de Atmósfera / Moxen Malla guardada en Ajustes
    if (systemAura?.colors && systemAura.colors.length >= 2) {
      const colors = systemAura.colors;
      const count = colors.length;
      const c1 = colors[0];
      const c2 = colors[1 % count];
      const c3 = colors[2 % count];
      const c4 = colors[3 % count];

      return {
        c1, c2, c3, c4,
        glow: `color-mix(in srgb, ${c1} 60%, transparent)`,
        glowSecondary: `color-mix(in srgb, ${c3} 50%, transparent)`,
        textColor: 'text-cyan-300',
      };
    }

    // 5. Paleta Oficial de Malla Aurora Boreal (Verde Ártico, Cian Neón, Púrpura Monarca y Plasma Magenta)
    return {
      c1: '#00ffaa', // Verde Ártico
      c2: '#00d0ff', // Cian Neón
      c3: '#7000ff', // Púrpura Monarca
      c4: '#ff00aa', // Plasma Magenta
      glow: 'rgba(0, 240, 255, 0.45)', // Resplandor Cian Neón
      glowSecondary: 'rgba(112, 0, 255, 0.35)', // Resplandor Púrpura
      textColor: 'text-cyan-300',
    };
  }, [opticMode, systemAura]);

  // Dimensiones configurables
  const sizeStyles = useMemo(() => {
    switch (size) {
      case 'sm':
        return {
          '--qcl-size': '26px',
          '--qcl-gap': '12px',
          '--qcl-height': '75px',
          '--qcl-jump': '-24px',
        } as React.CSSProperties;
      case 'lg':
        return {
          '--qcl-size': '42px',
          '--qcl-gap': '22px',
          '--qcl-height': '125px',
          '--qcl-jump': '-40px',
        } as React.CSSProperties;
      case 'md':
      default:
        return {
          '--qcl-size': '34px',
          '--qcl-gap': '18px',
          '--qcl-height': '100px',
          '--qcl-jump': '-32px',
        } as React.CSSProperties;
    }
  }, [size]);

  // Velocidad de física solicitada por el usuario (más lenta y majestuosa)
  const durationStr = useMemo(() => {
    switch (speed) {
      case 'normal':
        return '1.5s';
      case 'superslow':
        return '2.6s';
      case 'slow':
      default:
        return '2.1s';
    }
  }, [speed]);

  const cssVariables = {
    ...sizeStyles,
    '--qcl-duration': durationStr,
    '--qcl-color-duration': '7s',
    '--qcl-c1': palette.c1,
    '--qcl-c2': palette.c2,
    '--qcl-c3': palette.c3,
    '--qcl-c4': palette.c4,
    '--qcl-glow': palette.glow,
    '--qcl-glow-secondary': palette.glowSecondary,
  } as React.CSSProperties;

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`} style={cssVariables}>
      {/* 5 Cristales de Maná Cuántico con Física 120 FPS */}
      <div className="qcl-stage" aria-label="Canalizando Sistema">
        <span className="qcl-cube qcl-cube-1" />
        <span className="qcl-cube qcl-cube-2" />
        <span className="qcl-cube qcl-cube-3" />
        <span className="qcl-cube qcl-cube-4" />
        <span className="qcl-cube qcl-cube-5" />
      </div>

      {/* Rótulo opcional de estado táctico */}
      {showLabel && (
        <div className="mt-3 text-center">
          <p className={`text-xs font-mono tracking-widest font-black uppercase animate-pulse flex items-center justify-center gap-2 ${palette.textColor}`}>
            <span>{label}</span>
          </p>
          {sublabel && (
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              {sublabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default QuantumCubeLoader;
