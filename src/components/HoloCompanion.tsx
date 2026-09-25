import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFX } from '../utils/audio';

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
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
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
 * ORÁCULO PIRAMIDAL: EL OJO QUE TODO LO VE (Referencia Exacta de la Imagen)
 * 
 * Modos de interacción:
 * 1. OPCIÓN A: Ciclo autónomo de 4s con doble parpadeo
 * 2. OPCIÓN B: Seguimiento suave de cursor / puntero
 * 3. OPCIÓN C: Oráculo reactivo a toques con ondas cuánticas
 * 4. ESTADOS REACTIVOS DINÁMICOS:
 *    - 'focus_trance': Metrónomo de respiración pausada (4s/4s) para modo Pomodoro
 *    - 'warning_amber': Luz ámbar/dorada ante hábitos atrasados o racha en peligro
 *    - 'victory': Ondas expansivas de luz cian celebrando victorias y tareas completadas
 */
export const HoloCompanion: React.FC<HoloCompanionProps> = ({
  archetype = 'heroe',
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

  // Estados para el seguimiento del cursor
  const [eyeOffset, setEyeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isTrackingMouse, setIsTrackingMouse] = useState(false);
  const mouseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const baseConfig = useMemo(() => resolveArchetypeConfig(archetype), [archetype]);

  // Modulación cromática y lumínica según el estado
  const activeColor = useMemo(() => {
    if (auraState === 'warning_amber') return '#f59e0b'; // Ámbar dorado sagrado
    if (auraState === 'victory') return '#00f0ff';
    if (auraState === 'focus_trance') return '#00f0ff';
    return baseConfig.primaryGlow || '#00f0ff';
  }, [auraState, baseConfig.primaryGlow]);

  const activeSecondaryColor = useMemo(() => {
    if (auraState === 'warning_amber') return '#b45309';
    return baseConfig.secondaryGlow || '#0284c7';
  }, [auraState, baseConfig.secondaryGlow]);

  // Activación de onda de victoria cuando triggerVictoryWave cambia a true
  useEffect(() => {
    if (triggerVictoryWave) {
      setInternalVictoryCount((c) => c + 1);
    }
  }, [triggerVictoryWave]);

  const scaleMultiplier = useMemo(() => {
    if (typeof size === 'number') return size / 100;
    switch (size) {
      case 'xs':
        return 0.55;
      case 'sm':
        return 0.75;
      case 'lg':
        return 1.25;
      case 'xl':
        return 1.55;
      case 'md':
      default:
        return 1.0;
    }
  }, [size]);

  // Detector global del cursor para el seguimiento del ojo
  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const eyeCenterX = rect.left + rect.width / 2;
      const eyeCenterY = rect.top + rect.height * 0.52;

      const deltaX = e.clientX - eyeCenterX;
      const deltaY = e.clientY - eyeCenterY;
      const distance = Math.hypot(deltaX, deltaY);

      if (distance < 900) {
        setIsTrackingMouse(true);
        const maxRadiusX = 8.5;
        const maxRadiusY = 4.2;

        const angle = Math.atan2(deltaY, deltaX);
        const intensity = Math.min(distance / 250, 1);

        setEyeOffset({
          x: Math.cos(angle) * maxRadiusX * intensity,
          y: Math.sin(angle) * maxRadiusY * intensity,
        });

        if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current);
        mouseTimeoutRef.current = setTimeout(() => {
          setIsTrackingMouse(false);
          setEyeOffset({ x: 0, y: 0 });
        }, 2200);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
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
      className={`relative inline-flex flex-col items-center select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={interactive ? handleClick : undefined}
      style={{ cursor: interactive ? 'pointer' : 'default' }}
    >
      {/* CONTENEDOR FLOTANTE CON LEVITACIÓN CUÁNTICA */}
      <motion.div
        className="relative flex flex-col items-center justify-center"
        style={{
          scale: scaleMultiplier,
          transformOrigin: '50% 50%',
        }}
        animate={
          justClicked || internalVictoryCount > 0
            ? {
                y: [0, -18, 4, -8, 0],
                rotateY: [0, -15, 15, -6, 0],
                scale: [scaleMultiplier, scaleMultiplier * 1.14, scaleMultiplier * 0.98, scaleMultiplier],
              }
            : isProjecting
            ? {
                y: 0,
                rotateZ: 0,
                scale: scaleMultiplier,
              }
            : auraState === 'focus_trance'
            ? {
                y: [0, -4, 0],
                rotateZ: [-0.3, 0.3, -0.3],
              }
            : {
                y: [0, -7, 0],
                rotateZ: [-0.6, 0.6, -0.6],
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
        <motion.div
          className="absolute w-44 h-44 rounded-full blur-2xl pointer-events-none -z-10"
          style={{
            backgroundColor: `${activeColor}35`,
          }}
          animate={{
            scale: auraState === 'focus_trance' ? [0.9, 1.25, 0.9] : [0.95, 1.2, 0.95],
            opacity: justClicked ? [0.4, 0.9, 0.4] : [0.4, 0.75, 0.4],
          }}
          transition={{
            duration: auraState === 'focus_trance' ? 4.0 : 4.0,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* ONDA EXPANSIVA CUÁNTICA AL VENCER */}
        <AnimatePresence>
          {internalVictoryCount > 0 && (
            <>
              <motion.div
                key={`wave-1-${internalVictoryCount}`}
                initial={{ scale: 0.6, opacity: 0.95 }}
                animate={{ scale: 2.4, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute w-28 h-28 rounded-full border-2 pointer-events-none"
                style={{
                  borderColor: activeColor,
                  boxShadow: `0 0 25px ${activeColor}, inset 0 0 15px ${activeColor}`,
                }}
              />
              <motion.div
                key={`wave-2-${internalVictoryCount}`}
                initial={{ scale: 0.4, opacity: 0.8 }}
                animate={{ scale: 2.8, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1, delay: 0.15, ease: 'easeOut' }}
                className="absolute w-24 h-24 rounded-full border pointer-events-none"
                style={{
                  borderColor: activeColor,
                  boxShadow: `0 0 20px ${activeColor}`,
                }}
              />
            </>
          )}
        </AnimatePresence>

        {/* ILUSTRACIÓN VECTORIAL SVG DE LA PIRÁMIDE CON EL OJO QUE TODO LO VE */}
        <svg
          width="160"
          height="170"
          viewBox="0 0 160 170"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 overflow-visible"
        >
          <defs>
            {/* Filtro Bloom / Resplandor Neón */}
            <filter id={`${gradientId}-neon-glow`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.2" result="blur1" />
              <feGaussianBlur stdDeviation="6.5" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Máscara del Ojo Almendrado para contener el Iris y la Pupila */}
            <clipPath id={`${gradientId}-eye-clip`}>
              <path
                d="M 50 85 C 60 67, 100 67, 110 85 C 100 103, 60 103, 50 85 Z"
              />
            </clipPath>

            {/* Gradiente radial interno del ojo */}
            <radialGradient id={`${gradientId}-eye-void`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#011b2b" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#000e17" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#00070c" stopOpacity="1" />
            </radialGradient>
          </defs>

          {/* Animación del parpadeo y look-around autónomo */}
          <style>
            {`
              @keyframes pyramid-look-around {
                0% { transform: translate(0px, 0px); }
                5% { transform: translate(4px, -2px); }
                10% { transform: translate(4px, -2px); }
                15% { transform: translate(-4.5px, -1.8px); }
                20% { transform: translate(-4.5px, -1.8px); }
                25% { transform: translate(0px, 0px); }
                100% { transform: translate(0px, 0px); }
              }

              @keyframes pyramid-eyelid-upper {
                0% { transform: translateY(-19px); }
                90% { transform: translateY(-19px); }
                92.5% { transform: translateY(0px); }
                95% { transform: translateY(-19px); }
                97.5% { transform: translateY(0px); }
                100% { transform: translateY(-19px); }
              }

              @keyframes pyramid-eyelid-lower {
                0% { transform: translateY(19px); }
                90% { transform: translateY(19px); }
                92.5% { transform: translateY(0px); }
                95% { transform: translateY(19px); }
                97.5% { transform: translateY(0px); }
                100% { transform: translateY(19px); }
              }

              .pyramid-pupil-idle {
                animation: pyramid-look-around 4s infinite ease-in-out;
              }

              .pyramid-upper-lid {
                animation: pyramid-eyelid-upper 4s infinite ease-in;
              }

              .pyramid-lower-lid {
                animation: pyramid-eyelid-lower 4s infinite ease-in;
              }
            `}
          </style>

          {/* 1. SUELO CUÁNTICO // SOMBRA DE LEVITACIÓN Y LÍNEAS DE REJILLA EN LA BASE */}
          <g opacity="0.85">
            <line x1="45" y1="156" x2="115" y2="156" stroke={activeColor} strokeWidth="0.8" opacity="0.3" />
            <line x1="30" y1="162" x2="130" y2="162" stroke={activeColor} strokeWidth="0.8" opacity="0.2" />
            
            <ellipse
              cx="80"
              cy="153"
              rx="40"
              ry="5.5"
              fill={activeColor}
              opacity="0.55"
              filter={`url(#${gradientId}-neon-glow)`}
            />
            <ellipse
              cx="80"
              cy="153"
              rx="24"
              ry="3"
              fill="#ffffff"
              opacity="0.75"
            />
          </g>

          {/* 2. CUERPO DE LA PIRÁMIDE: LÍNEAS NEÓN EXTERIORES E INTERIORES */}
          <g filter={`url(#${gradientId}-neon-glow)`}>
            <polygon
              points="80,22 138,128 22,128"
              stroke={activeColor}
              strokeWidth="4"
              strokeLinejoin="round"
              fill="rgba(0, 14, 24, 0.4)"
            />

            <line x1="80" y1="22" x2="80" y2="70" stroke={activeColor} strokeWidth="3.2" strokeLinecap="round" />
            <line x1="80" y1="99" x2="80" y2="128" stroke={activeColor} strokeWidth="3.2" strokeLinecap="round" />

            <line x1="22" y1="128" x2="80" y2="99" stroke={activeColor} strokeWidth="3.2" strokeLinecap="round" />
            <line x1="138" y1="128" x2="80" y2="99" stroke={activeColor} strokeWidth="3.2" strokeLinecap="round" />

            <line x1="45" y1="85" x2="50" y2="85" stroke={activeColor} strokeWidth="3.2" />
            <line x1="110" y1="85" x2="115" y2="85" stroke={activeColor} strokeWidth="3.2" />
          </g>

          {/* Núcleo blanco brillante de las líneas neón */}
          <g>
            <polygon
              points="80,22 138,128 22,128"
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeLinejoin="round"
              fill="none"
              opacity="0.9"
            />
            <line x1="80" y1="22" x2="80" y2="70" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.9" />
            <line x1="80" y1="99" x2="80" y2="128" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.9" />
            <line x1="22" y1="128" x2="80" y2="99" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.9" />
            <line x1="138" y1="128" x2="80" y2="99" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.9" />
          </g>

          {/* 3. EL OJO CENTRAL QUE TODO LO VE (INTERACTIVO) */}
          <g>
            <path
              d="M 50 85 C 60 67, 100 67, 110 85 C 100 103, 60 103, 50 85 Z"
              fill={`url(#${gradientId}-eye-void)`}
            />

            {/* CONTENIDO INTERIOR DEL OJO */}
            <g clipPath={`url(#${gradientId}-eye-clip)`}>
              {/* GRUPO DEL IRIS Y LA PUPILA (Combinación de Opción A, B y C) */}
              <g
                style={{
                  transform: isTrackingMouse
                    ? `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`
                    : undefined,
                  transition: isTrackingMouse ? 'transform 0.08s ease-out' : 'transform 0.4s ease-in-out',
                }}
                className={!isTrackingMouse && auraState !== 'focus_trance' ? 'pyramid-pupil-idle' : ''}
              >
                {/* Contenedor con animación de respiración guiada si está en 'focus_trance' */}
                <motion.g
                  animate={
                    auraState === 'focus_trance'
                      ? {
                          scale: [0.9, 1.25, 0.9],
                          opacity: [0.85, 1, 0.85],
                        }
                      : undefined
                  }
                  transition={{
                    duration: 4.0, // 4s inhalar, 4s exhalar ritmo metrónomo
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{ transformOrigin: '80px 85px' }}
                >
                  {/* Iris: Aro brillante */}
                  <circle
                    cx="80"
                    cy="85"
                    r={justClicked ? 14.5 : 13}
                    stroke={activeColor}
                    strokeWidth="3.2"
                    fill="none"
                    filter={`url(#${gradientId}-neon-glow)`}
                  />
                  <circle
                    cx="80"
                    cy="85"
                    r={justClicked ? 14.5 : 13}
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    fill="none"
                  />

                  {/* Pupila Central */}
                  <circle
                    cx="80"
                    cy="85"
                    r={justClicked ? 7.5 : 6}
                    fill={activeColor}
                    filter={`url(#${gradientId}-neon-glow)`}
                  />
                  <circle
                    cx="80"
                    cy="85"
                    r={justClicked ? 4.2 : 3}
                    fill="#ffffff"
                  />

                  {/* Destello de luz sagrado */}
                  <circle
                    cx="82.4"
                    cy="82.6"
                    r="1.5"
                    fill="#ffffff"
                    opacity="0.9"
                  />
                </motion.g>
              </g>

              {/* PÁRPADOS SINCRONIZADOS */}
              <path
                d="M 46 66 H 114 V 85 C 104 85, 56 85, 46 85 Z"
                fill="#000f1a"
                stroke={activeColor}
                strokeWidth="1.6"
                className={auraState !== 'focus_trance' ? 'pyramid-upper-lid' : ''}
                style={auraState === 'focus_trance' ? { transform: 'translateY(-19px)' } : undefined}
              />

              <path
                d="M 46 104 H 114 V 85 C 104 85, 56 85, 46 85 Z"
                fill="#000f1a"
                stroke={activeColor}
                strokeWidth="1.6"
                className={auraState !== 'focus_trance' ? 'pyramid-lower-lid' : ''}
                style={auraState === 'focus_trance' ? { transform: 'translateY(19px)' } : undefined}
              />
            </g>

            {/* Contorno exterior del ojo en neón */}
            <path
              d="M 50 85 C 60 67, 100 67, 110 85 C 100 103, 60 103, 50 85 Z"
              stroke={activeColor}
              strokeWidth="3.6"
              fill="none"
              filter={`url(#${gradientId}-neon-glow)`}
            />
            <path
              d="M 50 85 C 60 67, 100 67, 110 85 C 100 103, 60 103, 50 85 Z"
              stroke="#ffffff"
              strokeWidth="1.1"
              fill="none"
              opacity="0.9"
            />
          </g>
        </svg>
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
