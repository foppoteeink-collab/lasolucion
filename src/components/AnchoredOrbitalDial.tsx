import React, { useState, useEffect, useRef, useCallback, useId } from 'react';
import { motion } from 'motion/react';
import { soundFX } from '../utils/audio';

export interface OrbitalDialItem {
  id: string;
  label: string; // 1 o 2 palabras exactas
  categoryBadge: string;
  icon: React.ReactNode;
  accentColor: string;
  glowColor: string;
  liveStat: string;
  action: () => void;
}

interface AnchoredOrbitalDialProps {
  items: OrbitalDialItem[];
  initialIndex?: number;
  onClose: () => void;
  onSelect: (item: OrbitalDialItem) => void;
}

function wrapIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

function shortestOffset(index: number, rotation: number, length: number) {
  if (length <= 0) return 0;
  let offset = index - rotation;
  while (offset > length / 2) offset -= length;
  while (offset < -length / 2) offset += length;
  return offset;
}

export const AnchoredOrbitalDial: React.FC<AnchoredOrbitalDialProps> = ({
  items,
  initialIndex = 0,
  onClose,
  onSelect,
}) => {
  const instanceId = useId();
  const itemCount = items.length;
  const startingIndex = wrapIndex(initialIndex, itemCount);

  const [rotation, setRotation] = useState(startingIndex);
  const [selectedIndex, setSelectedIndex] = useState(startingIndex);
  const [isDragging, setIsDragging] = useState(false);

  // Detección responsive para móvil vs PC
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Estado derivado seguro en el tope para evitar TDZ
  const safeSelectedIndex = wrapIndex(selectedIndex, itemCount);
  const selectedItem = items[safeSelectedIndex] || items[0];

  const touchAreaRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(startingIndex);
  const selectedRef = useRef(startingIndex);
  const velocityRef = useRef(0);
  const draggingRef = useRef(false);
  const dragOriginRef = useRef({ y: 0, rotation: startingIndex });
  const previousDragRotationRef = useRef(startingIndex);
  const frameRef = useRef<number | null>(null);

  // Parámetros de la Órbita Concéntrica alrededor de KAI:
  // En PC: radio 96px y ángulo 20° (queda idéntico a como se ve hermoso en PC).
  // En móvil: radio 78px y ángulo 24° más vertical hacia el cielo abierto para no salirse de la pantalla física.
  const orbitRadius = isMobile ? 78 : 96;
  const angularStepDeg = isMobile ? 24 : 20;
  const scrollSpeed = 0.007;
  const dragSpeed = 0.016;

  const commitRotation = useCallback(
    (nextRotation: number) => {
      rotationRef.current = nextRotation;
      setRotation(nextRotation);
      const nextIndex = wrapIndex(Math.round(nextRotation), itemCount);
      if (nextIndex !== selectedRef.current) {
        selectedRef.current = nextIndex;
        setSelectedIndex(nextIndex);
        soundFX.playClick();
      }
    },
    [itemCount]
  );

  const runAnimation = useCallback(() => {
    if (frameRef.current !== null) return;

    const tick = () => {
      let keepAnimating = false;

      if (!draggingRef.current && Math.abs(velocityRef.current) > 0.0008) {
        commitRotation(rotationRef.current + velocityRef.current);
        velocityRef.current *= 0.88; // Desaceleración inercial fluida
        keepAnimating = true;
      } else if (!draggingRef.current) {
        // Imantado magnético (snap) al elemento entero más cercano
        const target = Math.round(rotationRef.current);
        const delta = target - rotationRef.current;
        if (Math.abs(delta) > 0.001) {
          commitRotation(rotationRef.current + delta * 0.25);
          keepAnimating = true;
        } else {
          commitRotation(target);
          velocityRef.current = 0;
        }
      }

      if (keepAnimating) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
  }, [commitRotation]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  // Soporte de rueda de ratón para girar la órbita
  useEffect(() => {
    const area = touchAreaRef.current;
    if (!area) return;

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      const delta = event.deltaY * scrollSpeed;
      commitRotation(rotationRef.current + delta);
      velocityRef.current = delta * 0.2;
      runAnimation();
    };

    area.addEventListener('wheel', handleWheel, { passive: false });
    return () => area.removeEventListener('wheel', handleWheel);
  }, [commitRotation, runAnimation, scrollSpeed]);

  // Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        velocityRef.current = 0;
        commitRotation(rotationRef.current + 1);
        runAnimation();
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        velocityRef.current = 0;
        commitRotation(rotationRef.current - 1);
        runAnimation();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const active = items[selectedRef.current];
        if (active) onSelect(active);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, onClose, onSelect, commitRotation, runAnimation]);

  // Gestos táctiles de arrastre con inercia
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary || e.button !== 0) return;
    draggingRef.current = true;
    setIsDragging(true);
    velocityRef.current = 0;
    dragOriginRef.current = { y: e.clientY, rotation: rotationRef.current };
    previousDragRotationRef.current = rotationRef.current;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const distance = e.clientY - dragOriginRef.current.y;
    const nextRotation = dragOriginRef.current.rotation - distance * dragSpeed;
    velocityRef.current = nextRotation - previousDragRotationRef.current;
    previousDragRotationRef.current = nextRotation;
    commitRotation(nextRotation);
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    runAnimation();
  };

  const rotateToIndex = (targetIndex: number) => {
    const currentRotation = rotationRef.current;
    const currentNormalized = wrapIndex(Math.round(currentRotation), itemCount);
    let delta = targetIndex - currentNormalized;
    if (delta > itemCount / 2) delta -= itemCount;
    if (delta < -itemCount / 2) delta += itemCount;
    velocityRef.current = 0;
    commitRotation(currentRotation + delta);
    runAnimation();
  };

  // Coordenadas base del área táctil respecto al centro de KAI
  const touchOffsetX = isMobile ? 180 : 240;
  const touchOffsetY = isMobile ? 130 : 140;

  return (
    <>
      {/* TELÓN DE CIERRE INVISIBLE (100% TRANSPARENTE, NO TAPA LA PANTALLA) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[55] bg-transparent pointer-events-auto cursor-pointer"
        onClick={onClose}
      />

      {/* ANILLO ORBITAL CONCÉNTRICO ALREDEDOR DEL NÚCLEO DE KAI (0, 0 = CENTRO DE KAI) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.88 }}
        transition={{ type: 'spring', damping: 25, stiffness: 320 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 pointer-events-none z-[58]"
      >
        {/* Filamento láser que conecta el ojo de KAI directamente a la opción activa */}
        <div
          className="absolute right-[24px] top-1/2 -translate-y-1/2 h-[1.5px] pointer-events-none"
          style={{
            width: isMobile ? '20px' : '36px',
            background: `linear-gradient(to left, ${selectedItem.accentColor}, transparent)`,
            boxShadow: `0 0 10px ${selectedItem.accentColor}`,
          }}
        />

        {/* Zona de captura táctil transparente para deslizar el anillo con el pulgar */}
        <div
          ref={touchAreaRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          className="absolute pointer-events-auto touch-none bg-transparent"
          style={{
            top: -touchOffsetY,
            left: -touchOffsetX,
            width: isMobile ? 220 : 290,
            height: isMobile ? 210 : 240,
            touchAction: 'none',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
        >
          {/* RENDERIZADO POLAR CONCÉNTRICO DE LAS OPCIONES EN ÓRBITA ALREDEDOR DE KAI */}
          {items.map((item, index) => {
            const offset = shortestOffset(index, rotation, itemCount);
            // En móvil: 1 ítem ligeramente abajo y hasta 3 ítems hacia arriba
            if (offset > 1.2 || offset < -3.4) return null;

            // Ángulo polar phi:
            // offset = 0 => phi = 0° (Oeste, horizontal a la izquierda de KAI)
            // offset < 0 => phi > 0° (gira hacia arriba y sobre la cabeza de KAI en el cuadrante libre)
            // offset > 0 => phi < 0° (gira ligeramente hacia abajo)
            const phiDeg = -offset * angularStepDeg;
            const phiRad = (phiDeg * Math.PI) / 180;

            // Coordenadas polares con centro exacto en KAI (0, 0):
            // x = -R * cos(phi) => a la izquierda de KAI
            // y = -R * sin(phi) => negativo hacia arriba (cielo abierto)
            const posX = -orbitRadius * Math.cos(phiRad);
            const posY = -orbitRadius * Math.sin(phiRad);

            // Inclinación tangencial suave estilo arquitecto
            const tiltDeg = -offset * (isMobile ? 12 : 14);

            // Atenuación de opacidad y escala según la distancia angular:
            const dist = Math.min(Math.abs(offset) / 3.4, 1);
            const opacity = Math.cos((dist * Math.PI) / 2);
            const scale = 1 - Math.min(Math.abs(offset) * 0.04, 0.3);
            const isSelected = Math.abs(offset) < 0.5;

            // 1. OPCIÓN ACTIVA (ALINEADA AL FRENTE DE KAI A 0°, CON PUNTO NEÓN Y DATOS NÍTIDOS)
            if (isSelected) {
              return (
                <div
                  key={`${item.id}-${index}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(item);
                  }}
                  className="absolute flex items-center gap-2 px-2.5 py-1.5 cursor-pointer group z-30 whitespace-nowrap transition-transform active:scale-95 pointer-events-auto"
                  style={{
                    left: `${posX + touchOffsetX}px`,
                    top: `${posY + touchOffsetY}px`,
                    transform: `translate(-100%, -50%)`,
                    transformOrigin: 'right center',
                  }}
                  title={`Abrir ${item.label}`}
                >
                  {/* Punto neón activo brillante */}
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
                    style={{
                      backgroundColor: item.accentColor,
                      boxShadow: `0 0 10px ${item.accentColor}, 0 0 20px ${item.accentColor}`,
                    }}
                  />

                  {/* Icono del módulo */}
                  <div
                    className="w-5 h-5 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                    style={{ color: item.accentColor }}
                  >
                    {item.icon}
                  </div>

                  {/* Texto principal en blanco puro nítido, 100% transparente sin cajas */}
                  <span
                    className="font-anton tracking-wider text-white text-[15px] sm:text-[18px] uppercase group-hover:text-cyan-200 transition-colors"
                    style={{
                      textShadow: `0 0 12px ${item.glowColor}, 0 0 20px ${item.glowColor}`,
                    }}
                  >
                    {item.label}
                  </span>

                  {/* Micro stat en vivo: visible en PC para no alargar la línea en celulares */}
                  {!isMobile && (
                    <span className="text-[10px] font-mono text-cyan-300 font-semibold pl-1 opacity-90 truncate max-w-[120px]">
                      {item.liveStat}
                    </span>
                  )}

                  {/* Flechita micro de entrada */}
                  <span
                    className="text-[11px] font-mono font-bold pl-0.5 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                    style={{ color: item.accentColor }}
                  >
                    ➔
                  </span>
                </div>
              );
            }

            // 2. OPCIONES EN ÓRBITA CURVÁNDOSE ALREDEDOR DE KAI (RODEANDO SU PIRÁMIDE POR ARRIBA)
            return (
              <div
                id={`${instanceId}-item-${index}`}
                key={`${item.id}-${index}`}
                role="option"
                aria-selected={false}
                onClick={(e) => {
                  e.stopPropagation();
                  rotateToIndex(index);
                }}
                className="absolute flex items-center gap-1.5 whitespace-nowrap leading-none transition-colors duration-150 cursor-pointer select-none group pointer-events-auto"
                style={{
                  left: `${posX + touchOffsetX}px`,
                  top: `${posY + touchOffsetY}px`,
                  opacity,
                  transform: `translate(-100%, -50%) rotate(${tiltDeg}deg) scale(${scale})`,
                  transformOrigin: 'right center',
                }}
              >
                {/* Icono atenuado en órbita */}
                <div
                  className="w-4 h-4 flex items-center justify-center shrink-0 opacity-50 group-hover:opacity-90 transition-opacity"
                  style={{ color: item.accentColor }}
                >
                  <div className="scale-80">{item.icon}</div>
                </div>

                {/* Texto angular fanning out que rodea a KAI */}
                <span className="font-anton text-[12px] sm:text-[14px] uppercase tracking-wider text-slate-400/60 group-hover:text-white transition-colors">
                  {item.label}
                </span>

                {/* Punto sutil de órbita */}
                <span
                  className="w-1.5 h-1.5 rounded-full opacity-35 group-hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: item.accentColor }}
                />
              </div>
            );
          })}
        </div>
      </motion.div>
    </>
  );
};

export default AnchoredOrbitalDial;
