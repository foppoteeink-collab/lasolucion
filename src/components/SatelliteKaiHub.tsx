import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFX } from '../utils/audio';

export interface SatelliteHubItem {
  id: string;
  label: string;
  categoryBadge: string;
  icon: React.ReactNode;
  accentColor: string;
  glowColor: string;
  liveStat: string;
  action: () => void;
}

interface SatelliteKaiHubProps {
  items: SatelliteHubItem[];
  initialIndex?: number;
  onClose: () => void;
  onSelect: (item: SatelliteHubItem) => void;
}

function wrapIndex(idx: number, len: number) {
  if (len <= 0) return 0;
  return ((idx % len) + len) % len;
}

// El ícono activo siempre se ancla aquí (9 en punto = izquierda pura)
const ANCHOR_ANGLE = Math.PI; // 180°

// Radio del anillo orbital (más amplio para mayor espacio y presencia)
const ORBIT_RADIUS = 84;

export const SatelliteKaiHub: React.FC<SatelliteKaiHubProps> = ({
  items,
  initialIndex = 0,
  onClose,
  onSelect,
}) => {
  const n = items.length;

  // rotRef almacena la posición de la rueda en "pasos" (fraccionales)
  // rotRef.current = 0  → item[0] en el ancla (izquierda)
  const rotRef = useRef<number>(wrapIndex(initialIndex, n));
  const [rotState, setRotState] = useState<number>(wrapIndex(initialIndex, n));
  const velRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; rot: number } | null>(null);
  const prevDragRotRef = useRef(0);
  const lastWheelTime = useRef(0);
  const isTapRef = useRef(true);

  const activeIdx = wrapIndex(Math.round(rotRef.current), n);
  const activeItem = items[activeIdx];

  // ─── Motor de inercia y snap magnético ───────────────────────────────────
  const lastClickIdxRef = useRef(activeIdx);
  const lastMoveRef = useRef<{ y: number; time: number }>({ y: 0, time: 0 });
  const recentSpeedRef = useRef(0);

  const commit = useCallback((r: number) => {
    rotRef.current = r;
    setRotState(r);
    const currentRounded = wrapIndex(Math.round(r), n);
    if (currentRounded !== lastClickIdxRef.current) {
      soundFX.playClick();
      lastClickIdxRef.current = currentRounded;
    }
  }, [n]);

  const startEngine = useCallback(() => {
    if (frameRef.current !== null) return;

    const tick = () => {
      const SNAP_TARGET = Math.round(rotRef.current);
      const delta = SNAP_TARGET - rotRef.current;

      if (!draggingRef.current) {
        if (Math.abs(velRef.current) > 0.0015) {
          commit(rotRef.current + velRef.current);
          velRef.current *= 0.86;
          frameRef.current = requestAnimationFrame(tick);
          return;
        }
        if (Math.abs(delta) > 0.002) {
          commit(rotRef.current + delta * 0.28);
          frameRef.current = requestAnimationFrame(tick);
          return;
        }
        commit(SNAP_TARGET);
        velRef.current = 0;
      }
      frameRef.current = null;
    };

    frameRef.current = requestAnimationFrame(tick);
  }, [commit]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  // ─── Teclado ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault(); velRef.current = 0; commit(rotRef.current + 1); startEngine();
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault(); velRef.current = 0; commit(rotRef.current - 1); startEngine();
      }
      if (e.key === 'Enter') { e.preventDefault(); onSelect(activeItem); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeItem, commit, onClose, onSelect, startEngine]);

  // ─── Rueda de ratón con acumulación y amortiguación táctica ───────────────
  const wheelAccRef = useRef(0);
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    const now = Date.now();
    wheelAccRef.current += e.deltaY;

    // Control de tiempo para no disparar en ráfaga (mínimo 160ms entre pasos)
    if (now - lastWheelTime.current < 160) return;

    // Requiere un giro deliberado de la rueda (umbral de 35px)
    if (Math.abs(wheelAccRef.current) < 35) return;

    const dir = wheelAccRef.current > 0 ? 1 : -1;
    wheelAccRef.current = 0;
    lastWheelTime.current = now;

    soundFX.playClick();
    velRef.current = 0;
    commit(rotRef.current + dir);
    startEngine();
  }, [commit, startEngine]);

  // ─── Gestos táctiles ultra-fluidos (Arrastre orbital directo + Tap) ────────
  const onPointerDown = useCallback((e: React.PointerEvent, itemIndex?: number) => {
    e.stopPropagation();
    draggingRef.current = true;
    isTapRef.current = true;
    const now = Date.now();
    dragStartRef.current = { x: e.clientX, y: e.clientY, rot: rotRef.current };
    lastMoveRef.current = { y: e.clientY, time: now };
    recentSpeedRef.current = 0;
    velRef.current = 0;
    if (frameRef.current !== null) { cancelAnimationFrame(frameRef.current); frameRef.current = null; }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current || !dragStartRef.current) return;
    e.stopPropagation();
    const dy = e.clientY - dragStartRef.current.y;
    const dx = e.clientX - dragStartRef.current.x;

    // Si se desplazó más de 6px deja de ser un tap y se convierte en arrastre fluido
    if (Math.abs(dy) > 6 || Math.abs(dx) > 6) {
      isTapRef.current = false;
    }

    const now = Date.now();
    const dt = now - lastMoveRef.current.time;
    if (dt > 8) {
      const stepDy = e.clientY - lastMoveRef.current.y;
      recentSpeedRef.current = (stepDy * 0.024) / dt;
      lastMoveRef.current = { y: e.clientY, time: now };
    }

    // Sensibilidad duplicada y ergonómica (~40px de recorrido por ícono en pantalla)
    const dragSensitivity = 0.024;
    const newRot = dragStartRef.current.rot + dy * dragSensitivity;
    commit(newRot);
  }, [commit]);

  const onPointerUp = useCallback((e: React.PointerEvent, itemIndex?: number) => {
    e.stopPropagation();
    const wasDragging = draggingRef.current;
    const wasTap = isTapRef.current;

    draggingRef.current = false;
    dragStartRef.current = null;

    if (e.currentTarget && (e.currentTarget as HTMLElement).hasPointerCapture?.(e.pointerId)) {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }

    // Si fue un toque rápido sobre un ítem específico
    if (wasTap && itemIndex !== undefined) {
      const currentActive = wrapIndex(Math.round(rotRef.current), n);
      if (itemIndex === currentActive) {
        onSelect(items[itemIndex]);
      } else {
        soundFX.playClick();
        velRef.current = 0;
        const currentRound = Math.round(rotRef.current);
        let diff = itemIndex - currentRound;
        if (diff > n / 2) diff -= n;
        if (diff < -n / 2) diff += n;
        commit(rotRef.current + diff);
        startEngine();
      }
      return;
    }

    // Si fue un arrastre, aplicar inercia (flick) y snap magnético
    if (wasDragging) {
      if (Math.abs(recentSpeedRef.current) > 0.003) {
        velRef.current = Math.max(-0.25, Math.min(0.25, recentSpeedRef.current * 16));
      }
      startEngine();
    }
  }, [commit, items, n, onSelect, startEngine]);

  // ─── Geometría orbital ────────────────────────────────────────────────────
  // Para el item i, su ángulo en el anillo respecto al ancla es:
  //   θ = ANCHOR_ANGLE + (i - rot) * (2π/n)
  // En perspectiva 3D inclinada: el eje X se escala con cos(θ) y el Y con sin(θ)
  // pero el anillo se ve "de frente" inclinado ~30° (perspectiva isométrica)
  const getItemGeometry = useCallback((i: number, rot: number) => {
    const angle = ANCHOR_ANGLE + (i - rot) * ((2 * Math.PI) / n);
    // Perspectiva: aplastamos Y para simular inclinación (~cos(30°)=0.87)
    const x = ORBIT_RADIUS * Math.cos(angle);
    const y = ORBIT_RADIUS * Math.sin(angle) * 0.82;

    // depth: 1 cuando está en el punto de ancla (izquierda), 0 cuando está detrás a la derecha
    const rawDepth = Math.cos(angle - ANCHOR_ANGLE); // 1 en ancla, -1 en opuesto
    const depth = (rawDepth + 1) / 2; // normalizado 0..1

    const scale = 0.52 + 0.58 * Math.pow(depth, 1.4);
    const opacity = 0.28 + 0.72 * Math.pow(depth, 1.2);
    const zIndex = Math.round(50 + 20 * depth);
    const isActive = i === wrapIndex(Math.round(rot), n);

    return { x, y, scale, opacity, zIndex, isActive, angle, depth };
  }, [n]);

  const activeItemDisplay = items[wrapIndex(Math.round(rotState), n)] || items[0];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.25, rotate: -20 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.25, rotate: -20 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280, mass: 0.6 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 pointer-events-none z-[58]"
        onWheel={onWheel}
      >
        {/* ── 1. ANILLO ORBITAL SVG (PERSPECTIVA 3D INCLINADA) ───────────── */}
        <svg
          className="absolute overflow-visible pointer-events-none"
          style={{ width: 0, height: 0, left: 0, top: 0 }}
        >
          <defs>
            <radialGradient id="orbitRingGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={activeItemDisplay.accentColor} stopOpacity="0" />
              <stop offset="100%" stopColor={activeItemDisplay.accentColor} stopOpacity="0.55" />
            </radialGradient>
            <filter id="orbitGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Elipse perspectiva */}
          <ellipse
            cx={0} cy={0}
            rx={ORBIT_RADIUS}
            ry={ORBIT_RADIUS * 0.82}
            fill="none"
            stroke={activeItemDisplay.accentColor}
            strokeWidth="1.2"
            strokeDasharray="5 6"
            opacity="0.38"
            filter="url(#orbitGlow)"
          />
          {/* Rayo láser al ítem activo */}
          <line
            x1={0} y1={0}
            x2={ORBIT_RADIUS * Math.cos(ANCHOR_ANGLE) * 0.7}
            y2={ORBIT_RADIUS * Math.sin(ANCHOR_ANGLE) * 0.82 * 0.7}
            stroke={activeItemDisplay.accentColor}
            strokeWidth="1"
            opacity="0.6"
            filter="url(#orbitGlow)"
          />
        </svg>

        {/* ── 2. ZONA DE CAPTURA TÁCTIL ORBITAL (excluyendo centro de KAI) ── */}
        <div
          onPointerDown={(e) => onPointerDown(e)}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => onPointerUp(e)}
          onPointerCancel={(e) => onPointerUp(e)}
          className="absolute pointer-events-auto touch-none cursor-grab active:cursor-grabbing"
          style={{
            left: -(ORBIT_RADIUS + 34),
            top: -(ORBIT_RADIUS * 0.82 + 34),
            width: (ORBIT_RADIUS + 34) * 2,
            height: (ORBIT_RADIUS * 0.82 + 34) * 2,
            borderRadius: '50%',
            WebkitMaskImage: 'radial-gradient(circle 26px at center, transparent 26px, black 28px)',
            maskImage: 'radial-gradient(circle 26px at center, transparent 26px, black 28px)',
            zIndex: 40,
          }}
        />

        {/* ── 3. LOS 9 SATÉLITES EN ÓRBITA ────────────────────────────────── */}
        {items.map((item, i) => {
          const { x, y, scale, opacity, zIndex, isActive, depth } = getItemGeometry(i, rotState);
          // Ícono activo más grande (52px), inactivos entre 32px y 42px
          const iconSizePx = isActive ? 52 : Math.round(32 + 10 * depth);

          return (
            <motion.div
              key={item.id}
              animate={{ x, y, scale, opacity }}
              transition={{ type: 'spring', stiffness: 320, damping: 26, mass: 0.8 }}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                translateX: '-50%',
                translateY: '-50%',
                zIndex,
                width: iconSizePx,
                height: iconSizePx,
              }}
              className="pointer-events-auto select-none touch-none"
            >
              <div
                onPointerDown={(e) => onPointerDown(e, i)}
                onPointerMove={onPointerMove}
                onPointerUp={(e) => onPointerUp(e, i)}
                onPointerCancel={(e) => onPointerUp(e, i)}
                className="w-full h-full rounded-full flex items-center justify-center cursor-pointer relative active:scale-90 transition-all duration-200"
                style={{
                  background: isActive
                    ? `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.2) 0%, rgba(2,16,30,0.98) 100%)`
                    : `rgba(6, 14, 24, ${0.75 + 0.2 * depth})`,
                  border: isActive
                    ? `2.5px solid ${item.accentColor}`
                    : `1.5px solid rgba(148, 163, 184, ${0.15 + 0.3 * depth})`,
                  boxShadow: isActive
                    ? `0 0 25px ${item.glowColor}, 0 0 10px ${item.accentColor}, inset 0 0 12px ${item.accentColor}30`
                    : 'none',
                }}
                title={item.label}
              >
                {/* Aura pulsante del activo */}
                {isActive && (
                  <>
                    <div
                      className="absolute inset-0 rounded-full animate-pulse pointer-events-none"
                      style={{
                        background: `radial-gradient(circle, ${item.accentColor}35 0%, transparent 70%)`,
                      }}
                    />
                    {/* Anillo de selección exterior giratorio */}
                    <div
                      className="absolute -inset-2 rounded-full pointer-events-none animate-spin"
                      style={{
                        border: `1.5px dashed ${item.accentColor}60`,
                        animationDuration: '8s',
                      }}
                    />
                  </>
                )}

                <div
                  className="relative z-10 transition-all duration-200"
                  style={{
                    color: isActive ? item.accentColor : `rgba(148, 163, 184, ${0.45 + 0.45 * depth})`,
                    filter: isActive ? `drop-shadow(0 0 8px ${item.accentColor})` : 'grayscale(100%)',
                    transform: isActive ? 'scale(1.2)' : `scale(${0.75 + 0.25 * depth})`,
                  }}
                >
                  {item.icon}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* ── 4. SUBTÍTULO HOLOGRÁFICO PURO: FLOTANTE SIN CAJA (0% INVASIVO) ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`holo-label-${activeItemDisplay.id}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: `${Math.round(ORBIT_RADIUS * 0.82 + 24)}px`,
              left: '0px',
              transform: 'translate(-50%, 0)',
              zIndex: 70,
            }}
            className="pointer-events-auto select-none"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                onSelect(activeItemDisplay);
              }}
              className="group flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
            >
              {/* Texto flotante con espaciado amplio táctico */}
              <div className="flex items-center gap-1.5 px-2 py-0.5">
                <span
                  className="font-mono tracking-[0.28em] text-[11px] font-bold uppercase text-white/95 group-hover:text-white transition-colors"
                  style={{
                    textShadow: `0 0 10px ${activeItemDisplay.accentColor}80, 0 0 20px ${activeItemDisplay.glowColor}`,
                  }}
                >
                  {activeItemDisplay.label}
                </span>
                <span
                  className="text-[9px] font-mono font-bold group-hover:translate-x-1 transition-transform"
                  style={{ color: activeItemDisplay.accentColor }}
                >
                  ➔
                </span>
              </div>

              {/* Micro-filamento láser sutil debajo del texto */}
              <div
                className="h-[1px] rounded-full transition-all duration-300"
                style={{
                  width: '60%',
                  background: `linear-gradient(to right, transparent, ${activeItemDisplay.accentColor}90, transparent)`,
                  boxShadow: `0 0 6px ${activeItemDisplay.accentColor}`,
                }}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
  );
};

export default SatelliteKaiHub;
