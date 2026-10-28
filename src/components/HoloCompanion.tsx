import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFX } from '../utils/audio';
import { KaiVectorGraphics } from './KaiVectorGraphics';
import { KaiCosmeticEffects } from './KaiCosmeticEffects';
import { KaiShapeKey, KaiCustomForm } from '../types';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAppStore } from '../store/useAppStore';

export type ArchetypeKey =
  | 'heroe'
  | 'sabio'
  | 'guerrero'
  | 'rebelde'
  | 'forajido'
  | 'creador'
  | 'explorador'
  | 'cuidador'
  | 'amante'
  | 'bufon'
  | 'arlequin'
  | 'gobernante'
  | 'mago'
  | 'huerfano'
  | 'hombre_corriente'
  | 'inocente'
  | string;

export type CompanionAuraState = 'normal' | 'focus_trance' | 'victory' | 'warning_amber';

export interface CompanionConfig {
  id: string;
  name: string;
  codename: string;
  symbolicAvatar: string;
  primaryGlow: string;       // Color neón principal (cyan eléctrico como la imagen)
  secondaryGlow: string;     // Color profundo del prisma
  innerLight: string;        // Luz blanca/cyan intensa
  highlightColor: string;    // Destellos
  statusQuote: string;
}

/**
 * REGISTRO DEL ORÁCULO PIRAMIDAL // EL OJO QUE TODO LO VE
 */
export const COMPANION_REGISTRY: Record<string, CompanionConfig> = {
  heroe: {
    id: 'heroe',
    name: 'El Sabio Guardián',
    codename: 'ORÁCULO // KAI',
    symbolicAvatar: '👁️',
    primaryGlow: '#00f0ff',     // Cyan eléctrico exacto de la referencia
    secondaryGlow: '#0284c7',
    innerLight: '#e0faff',
    highlightColor: '#ffffff',
    statusQuote: 'Todo está conectado. Cada tarea de hoy forja la realidad de mañana.',
  },
  sabio: {
    id: 'sabio',
    name: 'El Oráculo Omnisciente',
    codename: 'SYNAPSE // CUÁNTICO',
    symbolicAvatar: '👁️',
    primaryGlow: '#00f0ff',
    secondaryGlow: '#0369a1',
    innerLight: '#e0faff',
    highlightColor: '#ffffff',
    statusQuote: 'La visión clara disipa toda duda. Enfoca tu mente en lo esencial.',
  },
  guerrero: {
    id: 'guerrero',
    name: 'El Observador Marcial',
    codename: 'ORÁCULO // ÉGIDA',
    symbolicAvatar: '🔺',
    primaryGlow: '#38bdf8',
    secondaryGlow: '#0369a1',
    innerLight: '#f0f9ff',
    highlightColor: '#ffffff',
    statusQuote: 'La disciplina diaria es el puente inquebrantable hacia tus metas.',
  },
  explorador: {
    id: 'explorador',
    name: 'La Brújula Astral',
    codename: 'ORÁCULO // HORIZONTE',
    symbolicAvatar: '🧭',
    primaryGlow: '#22d3ee',
    secondaryGlow: '#0891b2',
    innerLight: '#ecfeff',
    highlightColor: '#ffffff',
    statusQuote: 'Observo caminos donde otros ven límites. Avanza con serenidad.',
  },
  creador: {
    id: 'creador',
    name: 'El Geómetra Sagrado',
    codename: 'ORÁCULO // GÉNESIS',
    symbolicAvatar: '✨',
    primaryGlow: '#00f0ff',
    secondaryGlow: '#0284c7',
    innerLight: '#e0faff',
    highlightColor: '#ffffff',
    statusQuote: 'El orden geométrico de tus hábitos construye tu mejor versión.',
  },
  mago: {
    id: 'mago',
    name: 'El Ojo Cósmico',
    codename: 'ORÁCULO // ASTRAL',
    symbolicAvatar: '🔮',
    primaryGlow: '#00f0ff',
    secondaryGlow: '#0369a1',
    innerLight: '#e0faff',
    highlightColor: '#ffffff',
    statusQuote: 'La constancia diaria parece magia, pero es el poder de tu voluntad.',
  },
};

export function resolveArchetypeConfig(archetypeProp?: string): CompanionConfig {
  if (!archetypeProp) return COMPANION_REGISTRY.heroe;

  const clean = archetypeProp
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (COMPANION_REGISTRY[clean]) return COMPANION_REGISTRY[clean];

  if (clean.includes('sabi') || clean.includes('ojo') || clean.includes('orac')) return COMPANION_REGISTRY.sabio;
  if (clean.includes('guerr') || clean.includes('rebel')) return COMPANION_REGISTRY.guerrero;
  if (clean.includes('cread')) return COMPANION_REGISTRY.creador;
  if (clean.includes('mag')) return COMPANION_REGISTRY.mago;
  if (clean.includes('explor')) return COMPANION_REGISTRY.explorador;

  return COMPANION_REGISTRY.heroe;
}

export interface HoloCompanionProps {
  archetype?: ArchetypeKey;
  shapeId?: KaiShapeKey;
  customForm?: KaiCustomForm | null;
  auraColor?: string;
  particleEffect?: string;
  size?: 'nano' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  showHUD?: boolean;
  showQuote?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  auraState?: CompanionAuraState;
  triggerVictoryWave?: boolean;
  isProjecting?: boolean;
}

/**
 * COMPAÑERO HOLOGRÁFICO CUÁNTICO // KAI
 * Soporta las 6 Formas Oficiales (Día 0), Forja Neural por Foto (IA),
 * Evolución de 21d (Maltz) / 66d (Lally) y Ascensión Infinita con Cristales.
 */
export const HoloCompanion: React.FC<HoloCompanionProps> = ({
  archetype = 'heroe',
  shapeId,
  customForm,
  auraColor,
  particleEffect,
  size = 'md',
  className = '',
  showHUD = false,
  interactive = true,
  onClick,
  auraState = 'normal',
  triggerVictoryWave = false,
  isProjecting = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [justClicked, setJustClicked] = useState(false);
  const [internalVictoryCount, setInternalVictoryCount] = useState(0);

  // Estados globales de KAI & Telemetría
  const stats = usePlayerStore((state) => state.stats);
  const habitMastery = useAppStore((state) => state.habitMastery);

  const effectiveShape: KaiShapeKey = shapeId || stats?.kaiShape || 'prism';
  const effectiveCustomForm = customForm !== undefined ? customForm : stats?.kaiCustomForm;
  const effectiveParticle = particleEffect || stats?.kaiParticleEffect || 'none';

  // Detección de progresión 21d (Maltz) y 66d (Lally / Maestría)
  const habits21Count = useMemo(() => {
    const list = Object.values(habitMastery || {});
    const count = list.filter((h) => h.isMaltzReached || (h.currentStreak || 0) >= 21).length;
    return count > 0 ? count : ((stats?.streakDays || 0) >= 21 ? 1 : 0);
  }, [habitMastery, stats?.streakDays]);

  const habits66Count = useMemo(() => {
    const list = Object.values(habitMastery || {});
    const count = list.filter((h) => h.isMastered || (h.currentStreak || 0) >= 66).length;
    return count > 0 ? count : ((stats?.streakDays || 0) >= 66 ? 1 : 0);
  }, [habitMastery, stats?.streakDays]);

  const has21Days = habits21Count >= 1;
  const has66Days = habits66Count >= 1;
  const ascensionCrystalsCount = Math.max(0, habits66Count - 1);

  // Estados para el seguimiento del cursor
  const [eyeOffset, setEyeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isTrackingMouse, setIsTrackingMouse] = useState(false);
  const mouseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const baseConfig = useMemo(() => resolveArchetypeConfig(archetype), [archetype]);

  // Modulación cromática y lumínica según el estado
  const activeColor = useMemo(() => {
    if (auraState === 'warning_amber') return '#f59e0b'; // Ámbar dorado sagrado
    if (has66Days) return '#fbbf24'; // Oro de Maestría Lally
    if (auraColor) return auraColor;
    if (stats?.kaiAuraColor) return stats.kaiAuraColor;
    if (auraState === 'victory' || auraState === 'focus_trance') return '#00f0ff';
    return baseConfig.primaryGlow || '#00f0ff';
  }, [auraState, has66Days, auraColor, stats?.kaiAuraColor, baseConfig.primaryGlow]);

  const activeSecondaryColor = useMemo(() => {
    if (auraState === 'warning_amber') return '#b45309';
    if (has66Days) return '#d97706';
    return baseConfig.secondaryGlow || '#0284c7';
  }, [auraState, has66Days, baseConfig.secondaryGlow]);

  // Activación de onda de victoria cuando triggerVictoryWave cambia a true
  useEffect(() => {
    if (triggerVictoryWave) {
      setInternalVictoryCount((c) => c + 1);
      const timer = setTimeout(() => {
        setInternalVictoryCount(0);
      }, 950);
      return () => clearTimeout(timer);
    }
  }, [triggerVictoryWave]);

  const scaleMultiplier = useMemo(() => {
    if (typeof size === 'number') return size / 100;
    switch (size) {
      case 'nano':
        return 0.32;
      case 'xs':
        return 0.65;
      case 'sm':
        return 0.88;
      case 'lg':
        return 1.45;
      case 'xl':
        return 1.80;
      case 'md':
      default:
        return 1.18;
    }
  }, [size]);

  const svgWidth = Math.round(160 * scaleMultiplier);
  const svgHeight = Math.round(170 * scaleMultiplier);

  // Detector del cursor y toques de dedos (teléfonos y escritorio) para el seguimiento del ojo
  useEffect(() => {
    if (!interactive || typeof window === 'undefined') return;

    const updatePointerPosition = (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const eyeCenterX = rect.left + rect.width / 2;
      const eyeCenterY = rect.top + rect.height * 0.52;

      const deltaX = clientX - eyeCenterX;
      const deltaY = clientY - eyeCenterY;
      const distance = Math.hypot(deltaX, deltaY);

      if (distance < 1200) {
        setIsTrackingMouse(true);
        const maxRadiusX = 8.5;
        const maxRadiusY = 5.0;

        const angle = Math.atan2(deltaY, deltaX);
        const intensity = Math.min(Math.max(distance / 200, 0.35), 1);

        setEyeOffset({
          x: Math.cos(angle) * maxRadiusX * intensity,
          y: Math.sin(angle) * maxRadiusY * intensity,
        });

        if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current);
        mouseTimeoutRef.current = setTimeout(() => {
          setIsTrackingMouse(false);
          setEyeOffset({ x: 0, y: 0 });
        }, 2600);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      updatePointerPosition(e.clientX, e.clientY);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        updatePointerPosition(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        updatePointerPosition(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      updatePointerPosition(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current);
    };
  }, [interactive]);

  const handleClick = () => {
    soundFX.playClick();
    setJustClicked(true);
    setTimeout(() => setJustClicked(false), 950);
    if (onClick) onClick();
  };

  const gradientId = useMemo(() => `pyramid-${baseConfig.id}-${auraState}`, [baseConfig.id, auraState]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex flex-col items-center select-none touch-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={interactive ? handleClick : undefined}
      style={{
        cursor: interactive ? 'pointer' : 'default',
        width: `${svgWidth}px`,
        height: `${svgHeight}px`,
      }}
    >
      {/* CONTENEDOR FLOTANTE CON LEVITACIÓN CUÁNTICA */}
      <motion.div
        className="relative flex flex-col items-center justify-center will-change-transform"
        style={{
          transformOrigin: '50% 50%',
        }}
        animate={
          justClicked || internalVictoryCount > 0
            ? {
                y: [0, -12, 3, -5, 0],
                scale: [1, 1.12, 0.98, 1],
              }
            : isProjecting
            ? {
                y: 0,
                rotateZ: 0,
                scale: 1,
              }
            : auraState === 'focus_trance'
            ? {
                y: [0, -3, 0],
                rotateZ: [-0.3, 0.3, -0.3],
              }
            : {
                y: [0, -5, 0],
                rotateZ: [-0.5, 0.5, -0.5],
              }
        }
        transition={
          justClicked || internalVictoryCount > 0
            ? { duration: 0.85, ease: 'easeOut' }
            : isProjecting
            ? { duration: 0.2, ease: 'easeOut' }
            : auraState === 'focus_trance'
            ? { duration: 4.0, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 4.2, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        {/* RESPLANDOR DIFUSO AMBIENTAL DEL PRISMA */}
        <div
          className="absolute rounded-full pointer-events-none -z-10"
          style={{
            width: `${Math.round(80 * scaleMultiplier)}px`,
            height: `${Math.round(80 * scaleMultiplier)}px`,
            filter: `blur(${Math.max(4, Math.round(14 * scaleMultiplier))}px)`,
            backgroundColor: `${activeColor}30`,
            opacity: isHovered || isProjecting ? 0.8 : 0.45,
          }}
        />

        {/* ONDA EXPANSIVA CUÁNTICA AL VENCER */}
        <AnimatePresence>
          {internalVictoryCount > 0 && (
            <>
              <motion.div
                key={`wave-1-${internalVictoryCount}`}
                initial={{ scale: 0.6, opacity: 0.95 }}
                animate={{ scale: 2.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute w-24 h-24 rounded-full border-2 pointer-events-none"
                style={{
                  borderColor: activeColor,
                  boxShadow: `0 0 25px ${activeColor}, inset 0 0 15px ${activeColor}`,
                }}
              />
              <motion.div
                key={`wave-2-${internalVictoryCount}`}
                initial={{ scale: 0.4, opacity: 0.8 }}
                animate={{ scale: 2.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1, delay: 0.15, ease: 'easeOut' }}
                className="absolute w-20 h-20 rounded-full border pointer-events-none"
                style={{
                  borderColor: activeColor,
                  boxShadow: `0 0 20px ${activeColor}`,
                }}
              />
            </>
          )}
        </AnimatePresence>

        {/* CAPA DE PARTÍCULAS Y RELIQUIAS DE ARMERÍA DE ALTO IMPACTO */}
        <KaiCosmeticEffects
          effectId={effectiveParticle}
          activeColor={activeColor}
          scale={scaleMultiplier}
        />

        {/* RENDERIZADO VECTORIAL MULTI-FORMA: 6 FORMAS BASE + FORJA NEURAL IA */}
        <div
          style={{
            width: `${svgWidth}px`,
            height: `${svgHeight}px`,
            '--color-aura-activa': activeColor,
          } as React.CSSProperties}
          className="relative z-10 flex items-center justify-center"
        >
          {effectiveShape === 'custom' && effectiveCustomForm?.svgContent ? (
            <div
              className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:overflow-visible select-none pointer-events-none"
              style={{
                filter: `drop-shadow(0 0 12px ${activeColor}70)`,
              }}
              dangerouslySetInnerHTML={{ __html: effectiveCustomForm.svgContent }}
            />
          ) : effectiveShape === 'custom' && effectiveCustomForm?.imageUrl ? (
            <img
              src={effectiveCustomForm.imageUrl}
              alt={effectiveCustomForm.name || 'KAI'}
              className="w-full h-full object-contain pointer-events-none select-none"
              style={{
                filter: `drop-shadow(0 0 12px ${activeColor}80)`,
              }}
            />
          ) : (
            <KaiVectorGraphics
              shapeId={effectiveShape}
              activeColor={activeColor}
              secondaryColor={activeSecondaryColor}
              glowFilterId={`${gradientId}-neon-glow`}
              isHovered={isHovered}
              justClicked={justClicked}
              eyeOffset={eyeOffset}
              isTrackingMouse={isTrackingMouse}
              isFocusTrance={auraState === 'focus_trance'}
              has21Days={has21Days}
              has66Days={has66Days}
              ascensionCrystalsCount={ascensionCrystalsCount}
              customForm={effectiveCustomForm}
            />
          )}
        </div>
      </motion.div>

      {/* HUD SCI-FI INFERIOR CON EL ARQUETIPO (OPCIONAL) */}
      {showHUD && (
        <div className="mt-2.5 flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md">
            <span className="text-xs">{baseConfig.symbolicAvatar}</span>
            <span
              className="text-[10px] font-mono font-bold tracking-wider uppercase"
              style={{ color: activeColor }}
            >
              {baseConfig.name}
            </span>
          </div>
          <span className="text-[8px] font-mono text-zinc-400 tracking-tighter uppercase mt-0.5">
            {baseConfig.codename}
          </span>
        </div>
      )}
    </div>
  );
};

export default HoloCompanion;
