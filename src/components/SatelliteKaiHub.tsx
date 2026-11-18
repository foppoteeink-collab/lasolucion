import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { soundFX } from '../utils/audio';

export interface SatelliteHubItem {
  id: string;
  label: string;
  categoryBadge: string;
  icon: React.ReactNode;
  accentColor: string;
  glowColor: string;
  liveStat: string;
  hasBadge?: boolean;
  type?: 'page' | 'gadget';
  action: () => void;
}

interface SatelliteKaiHubProps {
  items: SatelliteHubItem[];
  isOpen?: boolean;
  initialIndex?: number;
  onClose: () => void;
  onSelect: (item: SatelliteHubItem) => void;
  minOpacity?: number;
}

// Geometría orbital estilizada, simétrica (como un reloj limpio) y nada invasiva
const STAGE_SIZE = 340;
const HALF_STAGE = STAGE_SIZE / 2;
const ORBIT_RADIUS = 116;
const NODE_SIZE = 42;

export const SatelliteKaiHub: React.FC<SatelliteKaiHubProps> = ({
  items,
  isOpen = true,
  initialIndex = 0,
  onClose,
  onSelect,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(isOpen);
  const [activeIndex, setActiveIndex] = useState<number>(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      const raf = requestAnimationFrame(() => {
        setExpanded(true);
      });
      return () => {
        cancelAnimationFrame(raf);
      };
    } else {
      setExpanded(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Navegación accesible por teclado según W3C ARIA APG Menu Pattern
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Home') {
        e.preventDefault();
        soundFX.playClick();
        setActiveIndex(0);
        return;
      }
      if (e.key === 'End') {
        e.preventDefault();
        soundFX.playClick();
        setActiveIndex(items.length - 1);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        soundFX.playClick();
        setActiveIndex((prev) => (prev + 1) % items.length);
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        soundFX.playClick();
        setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
      }
      if ((e.key === 'Enter' || e.key === ' ') && items[activeIndex]) {
        e.preventDefault();
        onSelect(items[activeIndex]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, items, activeIndex, onClose, onSelect]);

  const n = items.length;
  const activeItem = items[activeIndex] || items[0];

  return (
    <div
      role="menu"
      aria-label="Menú Orbital KAI"
      aria-hidden={!isOpen}
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: STAGE_SIZE,
        height: STAGE_SIZE,
        marginLeft: -HALF_STAGE,
        marginTop: -HALF_STAGE,
        visibility: isVisible ? 'visible' : 'hidden',
      }}
      className="menu-bubble-expand z-[58] select-none pointer-events-none"
    >
      {/* 1. ANILLO ORBITAL ULTRA-FINO (1px cristalino, sin ruido neón) */}
      <svg
        viewBox={`0 0 ${STAGE_SIZE} ${STAGE_SIZE}`}
        className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-200 ease-out"
        style={{
          opacity: expanded ? 1 : 0,
          transform: `scale(${expanded ? 1 : 0.82})`,
        }}
      >
        <circle
          cx={HALF_STAGE}
          cy={HALF_STAGE}
          r={ORBIT_RADIUS}
          fill="none"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1"
        />
        <circle
          cx={HALF_STAGE}
          cy={HALF_STAGE}
          r={ORBIT_RADIUS - 34}
          fill="none"
          stroke="rgba(255, 255, 255, 0.04)"
          strokeWidth="1"
        />
      </svg>

      {/* Halo radial sutil centrado en KAI */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-200"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${activeItem?.accentColor || '#00f0ff'}18 0%, transparent 52%)`,
          opacity: expanded ? 0.8 : 0,
        }}
      />

      {/* 2. SATÉLITES DE CRISTAL OSCURO EN ÓRBITA */}
      <div className="absolute inset-0 pointer-events-none">
        {items.map((item, i) => {
          const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
          const targetX = Math.round(Math.cos(angle) * ORBIT_RADIUS);
          const targetY = Math.round(Math.sin(angle) * ORBIT_RADIUS);
          const delayMs = isOpen ? Math.min(i * 10, 80) : 0;

          const isActive = i === activeIndex;
          const isGadget = item.type === 'gadget';

          return (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                left: HALF_STAGE - NODE_SIZE / 2,
                top: HALF_STAGE - NODE_SIZE / 2,
                width: NODE_SIZE,
                height: NODE_SIZE,
                zIndex: isActive ? 65 : 55,
                transform: expanded
                  ? `translate(${targetX}px, ${targetY}px) scale(1)`
                  : 'translate(0px, 0px) scale(0.55)',
                opacity: expanded ? 1 : 0,
                transition: `transform 0.22s cubic-bezier(0.22, 1, 0.36, 1) ${delayMs}ms, opacity 0.16s ease ${delayMs}ms`,
              }}
              className={isOpen ? 'pointer-events-auto' : 'pointer-events-none'}
            >
              <div
                role="menuitem"
                tabIndex={isOpen ? (isActive ? 0 : -1) : -1}
                aria-label={`${item.label} - ${item.liveStat || 'Seleccionar'}`}
                aria-current={isActive ? 'true' : undefined}
                onMouseEnter={() => {
                  if (activeIndex !== i) {
                    setActiveIndex(i);
                  }
                }}
                onFocus={() => setActiveIndex(i)}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex(i);
                  onSelect(item);
                }}
                className="w-full h-full rounded-full flex items-center justify-center cursor-pointer relative active:scale-90 transition-all duration-150 backdrop-blur-xl"
                style={{
                  transform: isActive ? 'scale(1.12)' : 'scale(1)',
                  background: isActive
                    ? `linear-gradient(145deg, rgba(255,255,255,0.14), rgba(8,14,26,0.92))`
                    : isGadget
                      ? 'rgba(12, 16, 30, 0.84)'
                      : 'rgba(7, 12, 22, 0.82)',
                  border: isActive
                    ? `1.5px solid ${item.accentColor}`
                    : isGadget
                      ? `1px solid ${item.accentColor}40`
                      : '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: isActive
                    ? `0 6px 20px rgba(0, 0, 0, 0.55), 0 0 14px ${item.accentColor}45`
                    : '0 6px 18px rgba(0, 0, 0, 0.4)',
                }}
                title={item.label}
              >
                {/* Ícono interno */}
                <div
                  className="relative z-10 transition-all duration-150 flex items-center justify-center"
                  style={{
                    color: isActive ? '#ffffff' : isGadget ? item.accentColor : 'rgba(226, 232, 240, 0.85)',
                    transform: isActive ? 'scale(1.06)' : 'scale(0.92)',
                  }}
                >
                  {item.icon}
                </div>

                {item.hasBadge && (
                  <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-[#070c16] z-20" />
                )}

                {/* Etiqueta limpia y legible debajo del satélite */}
                <span
                  className="absolute left-1/2 -translate-x-1/2 pointer-events-none font-sans whitespace-nowrap transition-all duration-150"
                  style={{
                    top: isActive ? 'calc(100% + 5px)' : 'calc(100% + 4px)',
                    fontSize: '9.5px',
                    fontWeight: isActive ? 600 : 500,
                    letterSpacing: '0.02em',
                    color: isActive ? '#ffffff' : 'rgba(226, 232, 240, 0.78)',
                    textShadow: '0 1px 6px rgba(0,0,0,0.9)',
                  }}
                >
                  {item.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. CÁPSULA INFERIOR MINIMALISTA DE CONTEXTO */}
      {activeItem && (
        <div
          style={{
            position: 'absolute',
            left: HALF_STAGE,
            top: HALF_STAGE + ORBIT_RADIUS + 46,
            transform: 'translate(-50%, 0)',
            opacity: expanded ? 1 : 0,
            transition: 'opacity 0.16s ease 0.05s',
            zIndex: 70,
          }}
          className={`${isOpen ? 'pointer-events-auto' : 'pointer-events-none'} select-none`}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <motion.button
            key={activeItem.id}
            type="button"
            initial={{ opacity: 0.6, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(activeItem);
            }}
            className="px-3.5 py-1.5 rounded-full bg-[#060c18]/85 backdrop-blur-2xl border border-white/12 hover:border-white/25 shadow-[0_8px_24px_rgba(0,0,0,0.45)] flex items-center gap-2 cursor-pointer active:scale-95 transition-all whitespace-nowrap"
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: activeItem.accentColor }}
            />
            <span className="text-[11px] font-semibold text-white">
              {activeItem.label}
            </span>
            {activeItem.liveStat && (
              <span className="text-[10.5px] text-slate-400 font-normal">
                · {activeItem.liveStat}
              </span>
            )}
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default SatelliteKaiHub;
