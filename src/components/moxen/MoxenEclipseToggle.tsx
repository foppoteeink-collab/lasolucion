import React from 'react';
import './moxenEclipse.css';
import { soundFX } from '../../utils/audio';
import { OpticMode } from '../../store/useUIStore';

interface MoxenEclipseToggleProps {
  opticMode?: OpticMode;
  onCycle?: () => void;
  onSelectMode?: (mode: OpticMode) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const MODES_ORDER: OpticMode[] = ['aurora', 'noir', 'eink', 'cobalt'];

export const MoxenEclipseToggle: React.FC<MoxenEclipseToggleProps> = ({
  opticMode = 'aurora',
  onCycle,
  onSelectMode,
  className = '',
  size = 'md',
}) => {
  const sizeStyles = {
    sm: { '--ec-tam': '15px' } as React.CSSProperties,
    md: { '--ec-tam': '19px' } as React.CSSProperties,
    lg: { '--ec-tam': '25px' } as React.CSSProperties,
  };

  const handleToggle = () => {
    soundFX.playClick();
    if (onCycle) {
      onCycle();
    } else if (onSelectMode) {
      const currentIndex = MODES_ORDER.indexOf(opticMode);
      const nextIndex = (currentIndex + 1) % MODES_ORDER.length;
      onSelectMode(MODES_ORDER[nextIndex]);
    }
  };

  const phaseClass = `fase-${opticMode}`;
  const isNight = opticMode === 'noir' || opticMode === 'cobalt';

  return (
    <button
      type="button"
      role="switch"
      onClick={handleToggle}
      aria-label={`Modo Óptico Eclipse: ${opticMode}`}
      className={`ec-interruptor ${phaseClass} ${isNight ? 'is-noche' : ''} select-none outline-none focus:outline-none cursor-pointer transition-all active:scale-95 ${className}`}
      style={sizeStyles[size]}
      title={`Fase Eclipse activa: ${opticMode.toUpperCase()} (Toca para alternar fase)`}
    >
      <span className="ec-cielo" aria-hidden="true">
        <span className="ec-cielo-noche" />
        <span className="ec-halos">
          <i />
          <i />
          <i />
        </span>
        <span className="ec-estrellas">
          <i style={{ '--x': 0.42, '--y': 0.42, '--t': 0.05, '--d': '0.15s' } as React.CSSProperties} />
          <i style={{ '--x': 0.86, '--y': 1.22, '--t': 0.035, '--d': '0.2s' } as React.CSSProperties} />
          <i className="ec-destello" style={{ '--x': 1.12, '--y': 0.5, '--t': 0.17, '--d': '0.18s' } as React.CSSProperties} />
          <i style={{ '--x': 0.6, '--y': 1.58, '--t': 0.03, '--d': '0.25s' } as React.CSSProperties} />
          <i style={{ '--x': 1.5, '--y': 1.02, '--t': 0.045, '--d': '0.22s' } as React.CSSProperties} />
          <i style={{ '--x': 1.86, '--y': 0.34, '--t': 0.03, '--d': '0.28s' } as React.CSSProperties} />
          <i className="ec-destello" style={{ '--x': 2.06, '--y': 1.5, '--t': 0.13, '--d': '0.26s' } as React.CSSProperties} />
          <i style={{ '--x': 1.32, '--y': 1.66, '--t': 0.028, '--d': '0.3s' } as React.CSSProperties} />
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
        </span>
        <span className="ec-nubes ec-nubes-delante">
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
