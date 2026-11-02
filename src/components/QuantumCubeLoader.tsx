import React, { useMemo } from 'react';
import { useSystemPalette } from '../utils/systemPalette';
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
  // Derivación dinámica de colores sincronizada con «Apariencia & Visión» de Ajustes
  const palette = useSystemPalette();

  // Dimensiones configurables calibradas para máxima sutileza y elegancia sci-fi
  const sizeStyles = useMemo(() => {
    switch (size) {
      case 'sm':
        return {
          '--qcl-size': '14px',
          '--qcl-gap': '7px',
          '--qcl-height': '46px',
          '--qcl-jump': '-11px',
          '--qcl-radius': '4.5px',
          '--qcl-shadow-w': '11px',
          '--qcl-shadow-b': '-9px',
        } as React.CSSProperties;
      case 'lg':
        return {
          '--qcl-size': '26px',
          '--qcl-gap': '14px',
          '--qcl-height': '76px',
          '--qcl-jump': '-20px',
          '--qcl-radius': '7.5px',
          '--qcl-shadow-w': '18px',
          '--qcl-shadow-b': '-13px',
        } as React.CSSProperties;
      case 'md':
      default:
        return {
          '--qcl-size': '20px',
          '--qcl-gap': '10px',
          '--qcl-height': '58px',
          '--qcl-jump': '-15px',
          '--qcl-radius': '6px',
          '--qcl-shadow-w': '14px',
          '--qcl-shadow-b': '-11px',
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
