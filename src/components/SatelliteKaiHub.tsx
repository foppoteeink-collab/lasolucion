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

// Lienzo centrado al 50%/50% exacto del contenedor de KAI
const STAGE_SIZE = 380;
const HALF_STAGE = STAGE_SIZE / 2;
const ORBIT_RADIUS = 122;
const NODE_SIZE = 46;

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
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Navegación accesible por teclado según W3C ARIA APG Menu Pattern (Flechas, Inicio, Fin, Escape, Enter, Espacio)
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
      aria-label="Menú Táctico KAI"
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
      {/* 1. ANILLO ORBITAL HOLOGRÁFICO LIGERO (Sin filtros Gaussianos por software) */}
      <svg
        viewBox={`0 0 ${STAGE_SIZE} ${STAGE_SIZE}`}
        className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-200 ease-out"
        style={{
          opacity: expanded ? 1 : 0,
          transform: `scale(${expanded ? 1 : 0.72})`,
        }}
      >
        <circle
          cx={HALF_STAGE}
          cy={HALF_STAGE}
          r={ORBIT_RADIUS}
          fill="none"
          stroke={activeItem?.accentColor || '#00f0ff'}
          strokeWidth="1.2"
          strokeDasharray="4 6"
          opacity="0.34"
        />
      </svg>

      {/* Halo radial ligero del núcleo sin blur SVG */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-200"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.2) 0%, rgba(0, 240, 255, 0.05) 35%, transparent 62%)',
          opacity: expanded ? 0.85 : 0,
        }}
      />

      {/* 2. SATÉLITES EN ÓRBITA (Hitboxes fijas de 46x46 sin reflows, escala por GPU) */}
      <div className="absolute inset-0 pointer-events-none">
        {items.map((item, i) => {
          const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
          const targetX = Math.round(Math.cos(angle) * ORBIT_RADIUS);
          const targetY = Math.round(Math.sin(angle) * ORBIT_RADIUS);
          const delayMs = isOpen ? Math.min(i * 5, 25) : 0;

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
                  : 'translate(0px, 0px) scale(0.65)',
                opacity: expanded ? 1 : 0,
                transition: `transform 0.18s cubic-bezier(0.22, 1, 0.36, 1) ${delayMs}ms, opacity 0.14s ease ${delayMs}ms`,
              }}
              className={isOpen ? 'pointer-events-auto' : 'pointer-events-none'}
            >
              <div
                role="menuitem"
                tabIndex={isOpen ? (isActive ? 0 : -1) : -1}
                aria-label={`${item.label} (${item.categoryBadge}) - ${item.liveStat || 'Seleccionar'}`}
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
                className={`w-full h-full flex items-center justify-center cursor-pointer relative active:scale-90 transition-transform duration-150 ${
                  isGadget ? '' : 'rounded-full'
                }`}
                style={
                  isGadget
                    ? {
                        background: 'transparent',
                        border: 'none',
                        boxShadow: 'none',
                        transform: isActive ? 'scale(1.12)' : 'scale(1)',
                      }
                    : {
                        transform: isActive ? 'scale(1.12)' : 'scale(1)',
                        background: isActive
                          ? 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.2) 0%, rgba(2,16,30,0.98) 100%)'
                          : 'rgba(6, 14, 24, 0.88)',
                        border: isActive
                          ? `2px solid ${item.accentColor}`
                          : '1.5px solid rgba(148, 163, 184, 0.35)',
                        boxShadow: isActive
                          ? `0 0 22px ${item.glowColor}, 0 0 8px ${item.accentColor}, inset 0 0 10px ${item.accentColor}30`
                          : '0 4px 12px rgba(0, 0, 0, 0.5)',
                      }
                }
                title={item.label}
              >
                {/* Geometría Hexagonal Sutil para los Gadgets de KAI */}
                {isGadget && (
                  <svg
                    viewBox="0 0 100 100"
                    className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                  >
                    <defs>
                      <radialGradient id={`hex-grad-${item.id}`} cx="35%" cy="35%" r="70%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
                        <stop offset="100%" stopColor="rgba(15,7,28,0.98)" />
                      </radialGradient>
                    </defs>
                    <polygon
                      points="50,4 92,26 92,74 50,96 8,74 8,26"
                      fill={isActive ? `url(#hex-grad-${item.id})` : 'rgba(10, 8, 20, 0.90)'}
                      stroke={isActive ? item.accentColor : 'rgba(192, 132, 252, 0.45)'}
                      strokeWidth={isActive ? '3.5' : '2'}
                      strokeLinejoin="round"
                      style={{
                        filter: isActive ? `drop-shadow(0 0 12px ${item.glowColor})` : 'none',
                      }}
                    />
                  </svg>
                )}

                {/* Anillo exterior giratorio y aura pulsante en el nodo activo */}
                {isActive && (
                  <>
                    <div
                      className={`absolute inset-0 pointer-events-none animate-pulse ${
                        isGadget ? '' : 'rounded-full'
                      }`}
                      style={{
                        background: `radial-gradient(circle, ${item.accentColor}35 0%, transparent 70%)`,
                      }}
                    />
                    {isGadget ? (
                      <svg
                        viewBox="0 0 120 120"
                        className="absolute -inset-2.5 w-[calc(100%+20px)] h-[calc(100%+20px)] pointer-events-none animate-spin"
                        style={{ animationDuration: '9s' }}
                      >
                        <polygon
                          points="60,4 110,30 110,90 60,116 10,90 10,30"
                          fill="none"
                          stroke={item.accentColor}
                          strokeWidth="1.6"
                          strokeDasharray="4 6"
                          opacity="0.8"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <div
                        className="absolute -inset-2 rounded-full pointer-events-none animate-spin"
                        style={{
                          border: `1.5px dashed ${item.accentColor}80`,
                          animationDuration: '8s',
                        }}
                      />
                    )}
                  </>
                )}

                {/* Ícono interno */}
                <div
                  className="relative z-10 transition-all duration-200"
                  style={{
                    color: isActive ? item.accentColor : 'rgba(203, 213, 225, 0.88)',
                    filter: isActive ? `drop-shadow(0 0 8px ${item.accentColor})` : 'none',
                    transform: isActive ? 'scale(1.12)' : 'scale(0.92)',
                  }}
                >
                  {item.icon}
                </div>

                {item.hasBadge && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-purple-400 ring-2 ring-black shadow-[0_0_8px_rgba(192,132,252,0.9)] z-20" />
                )}

                {/* Etiqueta sutil justo debajo de cada icono para identificarlo al instante */}
                <span
                  className="absolute left-1/2 -translate-x-1/2 pointer-events-none font-mono font-bold uppercase whitespace-nowrap transition-all duration-200"
                  style={{
                    top: isActive ? 'calc(100% + 7px)' : 'calc(100% + 4px)',
                    fontSize: isActive ? '9px' : '8px',
                    letterSpacing: '0.13em',
                    color: isActive ? '#ffffff' : 'rgba(226, 232, 240, 0.85)',
                    textShadow: isActive
                      ? `0 1px 4px rgba(0,0,0,0.98), 0 0 8px ${item.accentColor}`
                      : '0 1px 4px rgba(0,0,0,0.95), 0 0 6px rgba(0,0,0,0.9)',
                  }}
                >
                  {item.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. SUBTÍTULO HOLOGRÁFICO PURO AL PIE (Con espacio limpio debajo de la etiqueta inferior) */}
      {activeItem && (
        <div
          style={{
            position: 'absolute',
            left: HALF_STAGE,
            top: HALF_STAGE + ORBIT_RADIUS + 46,
            transform: 'translate(-50%, 0)',
            opacity: expanded ? 1 : 0,
            transition: 'opacity 0.15s ease 0.04s',
            zIndex: 70,
          }}
          className={`${isOpen ? 'pointer-events-auto' : 'pointer-events-none'} select-none`}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect(activeItem);
            }}
            className="group flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-1.5 px-2 py-0.5">
              <motion.span
                key={activeItem.id}
                initial={{ opacity: 0.5, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.08, ease: 'easeOut' }}
                className="font-mono tracking-[0.24em] text-[10.5px] font-bold uppercase text-white/95 group-hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
                style={{
                  textShadow: `0 0 10px ${activeItem.accentColor}80, 0 0 20px ${activeItem.glowColor}`,
                }}
              >
                {activeItem.type === 'gadget' && (
                  <span className="text-[10px] font-mono" style={{ color: activeItem.accentColor }}>
                    ⚡
                  </span>
                )}
                <span>{activeItem.label}</span>
                {activeItem.liveStat && (
                  <span
                    className="text-[9.5px] font-normal tracking-wider opacity-90"
                    style={{ color: activeItem.accentColor }}
                  >
                    • {activeItem.liveStat}
                  </span>
                )}
              </motion.span>
              <span
                className="text-[9px] font-mono font-bold group-hover:translate-x-1 transition-transform"
                style={{ color: activeItem.accentColor }}
              >
                ➔
              </span>
            </div>

            {/* Micro-filamento láser sutil debajo del texto */}
            <div
              className="h-[1px] rounded-full transition-all duration-300"
              style={{
                width: '60%',
                background: `linear-gradient(to right, transparent, ${activeItem.accentColor}90, transparent)`,
                boxShadow: `0 0 6px ${activeItem.accentColor}`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SatelliteKaiHub;
