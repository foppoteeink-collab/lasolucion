import React, { useState, useEffect, useRef, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { soundFX } from '../utils/audio';

export interface WheelCarouselHubItem {
  id: string;
  label: string; // 1 o 2 palabras exactas
  categoryBadge: string;
  icon: React.ReactNode;
  accentColor: string;
  glowColor: string;
  liveStat: string;
  action: () => void;
}

interface WheelCarouselHubProps {
  items: WheelCarouselHubItem[];
  initialIndex?: number;
  onClose: () => void;
  onSelect: (item: WheelCarouselHubItem) => void;
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

export const WheelCarouselHub: React.FC<WheelCarouselHubProps> = ({
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

  // Detección responsive
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

  // Estado derivado seguro en el tope del componente (evita TDZ)
  const safeSelectedIndex = wrapIndex(selectedIndex, itemCount);
  const selectedItem = items[safeSelectedIndex] || items[0];

  const stageRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(startingIndex);
  const selectedRef = useRef(startingIndex);
  const velocityRef = useRef(0);
  const draggingRef = useRef(false);
  const dragOriginRef = useRef({ y: 0, rotation: startingIndex });
  const previousDragRotationRef = useRef(startingIndex);
  const frameRef = useRef<number | null>(null);

  // Parámetros de curvatura trigonométrica idénticos al WheelCarousel
  const radius = isMobile ? 210 : 300;
  const spacing = isMobile ? 15 : 14;
  const visibleItems = isMobile ? 5 : 7;
  const apexInset = isMobile ? 14 : 26;
  const markerGap = 16;
  const markerSize = isMobile ? 11 : 14;
  const scrollSpeed = 0.008;
  const dragSpeed = 0.02;

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
        velocityRef.current *= 0.90; // Inercia fluida
        keepAnimating = true;
      } else if (!draggingRef.current) {
        // Imantado magnético (snap) al ítem entero más próximo
        const target = Math.round(rotationRef.current);
        const delta = target - rotationRef.current;
        if (Math.abs(delta) > 0.001) {
          commitRotation(rotationRef.current + delta * 0.22);
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

  // Soporte de rueda de ratón (mouse wheel)
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      const delta = event.deltaY * scrollSpeed;
      commitRotation(rotationRef.current + delta);
      velocityRef.current = delta * 0.2;
      runAnimation();
    };

    stage.addEventListener('wheel', handleWheel, { passive: false });
    return () => stage.removeEventListener('wheel', handleWheel);
  }, [commitRotation, runAnimation, scrollSpeed]);

  // Teclado (Escape para salir, flechas para girar, Enter para entrar)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
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

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [items, onClose, onSelect, commitRotation, runAnimation]);

  // Gesto táctil continuo con inercia (pointer drag)
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    draggingRef.current = true;
    setIsDragging(true);
    velocityRef.current = 0;
    dragOriginRef.current = { y: event.clientY, rotation: rotationRef.current };
    previousDragRotationRef.current = rotationRef.current;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const distance = event.clientY - dragOriginRef.current.y;
    const nextRotation = dragOriginRef.current.rotation - distance * dragSpeed;
    velocityRef.current = nextRotation - previousDragRotationRef.current;
    previousDragRotationRef.current = nextRotation;
    commitRotation(nextRotation);
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
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

  const mask =
    'linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-md select-none touch-none overflow-hidden"
      onClick={onClose}
    >
      {/* Velo sutil de vignette cuántico */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(2,24,44,0.45)_0%,_rgba(1,6,12,0.85)_100%)] pointer-events-none" />

      {/* Botón sutil de cierre en esquina superior */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-5 right-5 sm:top-7 sm:right-7 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors z-30 cursor-pointer"
        aria-label="Cerrar proyección"
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* ESCENARIO HOLOGRÁFICO PRINCIPAL */}
      <div
        ref={stageRef}
        onClick={(e) => e.stopPropagation()}
        className={`relative flex h-full w-full max-w-[760px] max-h-[520px] items-stretch overflow-hidden px-4 sm:px-8 z-10 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        {/* COLUMNA IZQUIERDA: TARJETA HOLOGRÁFICA TÁCTICA DE KAI (DISEÑO OFICIAL LA SOLUCIÓN) */}
        <div className="flex h-full w-[42%] sm:w-[36%] md:w-[32%] shrink-0 items-center justify-center">
          <div
            className="relative w-full overflow-hidden cursor-pointer rounded-2xl sm:rounded-3xl border transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98] shadow-2xl"
            style={{
              aspectRatio: '4 / 5',
              borderColor: `${selectedItem.accentColor}55`,
              background: 'linear-gradient(165deg, rgba(3, 18, 32, 0.94) 0%, rgba(1, 8, 16, 0.98) 100%)',
              boxShadow: `0 0 30px ${selectedItem.glowColor}, inset 0 0 20px rgba(0, 240, 255, 0.05)`,
            }}
            onClick={() => onSelect(selectedItem)}
            title={`Desplegar ${selectedItem.label}`}
          >
            {/* Destello de fondo reactivo al color del módulo */}
            <div
              className="absolute -top-12 -left-12 w-32 h-32 rounded-full blur-2xl opacity-40 pointer-events-none transition-colors duration-500"
              style={{ backgroundColor: selectedItem.accentColor }}
            />

            {/* Retícula sutil táctica de esquina */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 opacity-60">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedItem.accentColor }} />
              <span className="text-[8px] font-mono font-bold tracking-widest text-slate-400">
                {selectedItem.categoryBadge}
              </span>
            </div>

            {/* Contenido holográfico central sincronizado con AnimatePresence */}
            <div className="relative h-full w-full flex flex-col justify-between p-4 sm:p-5 pt-8">
              
              {/* ÍCONO HOLOGRÁFICO CENTRAL */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`icon-${selectedItem.id}`}
                    initial={{ scale: 0.8, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="relative flex items-center justify-center"
                  >
                    {/* Aura neón palpitante detrás del glifo */}
                    <div
                      className="absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full blur-xl opacity-60 pointer-events-none"
                      style={{ backgroundColor: selectedItem.accentColor }}
                    />
                    
                    {/* Caja de cristal para el glifo */}
                    <div
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border backdrop-blur-md transition-all shadow-lg"
                      style={{
                        background: 'rgba(2, 22, 38, 0.75)',
                        borderColor: `${selectedItem.accentColor}80`,
                        boxShadow: `0 0 16px ${selectedItem.glowColor}`,
                      }}
                    >
                      <div className="scale-110 sm:scale-125" style={{ color: selectedItem.accentColor }}>
                        {selectedItem.icon}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* TÍTULO Y STAT EN VIVO */}
              <div className="flex flex-col items-center text-center mt-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`text-${selectedItem.id}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="w-full flex flex-col items-center"
                  >
                    <span
                      className="font-anton tracking-wider text-white text-sm sm:text-base uppercase"
                      style={{
                        textShadow: `0 0 10px ${selectedItem.glowColor}`,
                      }}
                    >
                      {selectedItem.label}
                    </span>

                    <span className="mt-0.5 text-[10px] sm:text-[11px] font-mono text-cyan-200/90 font-medium truncate max-w-full">
                      {selectedItem.liveStat}
                    </span>
                  </motion.div>
                </AnimatePresence>

                {/* BOTÓN MICRO CTA PARA ENTRAR */}
                <div
                  className="mt-3 w-full py-1 sm:py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 border text-[9px] sm:text-[10px] font-mono font-bold tracking-wider text-white group-hover:brightness-125 transition-all"
                  style={{
                    backgroundColor: `${selectedItem.accentColor}25`,
                    borderColor: `${selectedItem.accentColor}60`,
                  }}
                >
                  <span>ENTRAR</span>
                  <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: RUEDA CURVA ORBITAL (EL EFECTO EXACTO DE LA CAPTURA) */}
        <div
          className="relative h-full min-w-0 flex-1 overflow-hidden"
          style={{ maskImage: mask, WebkitMaskImage: mask }}
        >
          {/* Indicador neón para el ítem activo en el centro horizontal */}
          <span
            aria-hidden="true"
            className="absolute top-1/2 z-10 -translate-y-1/2 rounded-full pointer-events-none transition-all duration-200"
            style={{
              left: `calc(${apexInset}% - ${markerGap}px)`,
              width: markerSize,
              height: markerSize,
              marginLeft: -markerSize,
              backgroundColor: selectedItem.accentColor,
              boxShadow: `0 0 14px ${selectedItem.accentColor}`,
            }}
          />

          {/* Lista circular de textos en abanico tangencial */}
          {items.map((item, index) => {
            const offset = shortestOffset(index, rotation, itemCount);
            if (Math.abs(offset) > visibleItems + 1) return null;

            const angle = offset * spacing;
            const radians = (angle * Math.PI) / 180;
            const x = -radius * (1 - Math.cos(radians));
            const y = radius * Math.sin(radians);
            const distance = Math.min(Math.abs(offset) / visibleItems, 1);
            const opacity = Math.cos((distance * Math.PI) / 2);
            const scale = 1 - Math.min(Math.abs(offset) * 0.04, 0.45);
            const selected = Math.abs(offset) < 0.5;

            return (
              <div
                id={`${instanceId}-item-${index}`}
                key={`${item.label}-${index}`}
                role="option"
                aria-selected={selected}
                onClick={(e) => {
                  e.stopPropagation();
                  if (selected) {
                    onSelect(item);
                  } else {
                    rotateToIndex(index);
                  }
                }}
                className={`absolute top-1/2 origin-left whitespace-nowrap leading-none tracking-[-0.01em] transition-colors duration-150 cursor-pointer select-none ${
                  selected
                    ? 'font-bold text-white text-[clamp(1.15rem,2.8vw,1.85rem)]'
                    : 'font-medium text-slate-400/50 hover:text-cyan-200/80 text-[clamp(1.05rem,2.5vw,1.65rem)]'
                }`}
                style={{
                  left: `${apexInset}%`,
                  opacity,
                  transform: `translate(${x}px, ${y}px) translateY(-50%) rotate(${angle}deg) scale(${scale})`,
                  textShadow: selected ? `0 0 12px ${item.glowColor}` : undefined,
                }}
              >
                {item.label}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default WheelCarouselHub;
