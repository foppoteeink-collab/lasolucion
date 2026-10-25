import React, { useId } from 'react';
import { KaiShapeKey, KaiCustomForm } from '../types';

interface KaiVectorGraphicsProps {
  shapeId: KaiShapeKey;
  activeColor: string;
  secondaryColor?: string;
  glowFilterId?: string;
  isHovered?: boolean;
  justClicked?: boolean;
  eyeOffset?: { x: number; y: number };
  isTrackingMouse?: boolean;
  isFocusTrance?: boolean;
  has21Days?: boolean;
  has66Days?: boolean;
  ascensionCrystalsCount?: number;
  customForm?: KaiCustomForm | null;
  className?: string;
}

export const KaiVectorGraphics: React.FC<KaiVectorGraphicsProps> = ({
  shapeId,
  activeColor,
  secondaryColor,
  glowFilterId: propGlowFilterId,
  isHovered = false,
  justClicked = false,
  eyeOffset = { x: 0, y: 0 },
  isTrackingMouse = false,
  isFocusTrance = false,
  has21Days = false,
  has66Days = false,
  ascensionCrystalsCount = 0,
  customForm,
  className = '',
}) => {
  const reactId = useId().replace(/:/g, '_');
  const gradientId = propGlowFilterId ? propGlowFilterId.replace('-neon-glow', '') : `kai_${reactId}`;
  const filterId = `${gradientId}-neon-glow`;

  // Color primario del neón: dorado de ascensión si tiene 66 días, de lo contrario activeColor (naranja/ámbar por defecto en el canon)
  const lineColor = has66Days ? '#fbbf24' : activeColor;
  const secondaryStroke = has66Days ? '#f59e0b' : (secondaryColor || activeColor);
  const coreStroke = '#fff6d6'; // Núcleo blanco-dorado ultraluminoso para efecto tubo de neón real

  return (
    <svg
      viewBox="0 0 160 170"
      width="100%"
      height="100%"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`overflow-visible select-none ${className}`}
    >
      <defs>
        {/* Filtro Bloom Neón de Alta Intensidad (Doble Gaussiano) */}
        <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={has66Days ? 4.2 : 3.2} result="wideBlur" />
          <feGaussianBlur stdDeviation={has66Days ? 1.8 : 1.2} result="tightBlur" />
          <feMerge>
            <feMergeNode in="wideBlur" />
            <feMergeNode in="tightBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Gradiente Ámbar/Dorado para ojos incandescentes */}
        <radialGradient id={`${gradientId}-fire-eye`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="35%" stopColor="#ffea75" stopOpacity="1" />
          <stop offset="80%" stopColor="#ff9100" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#d95b00" stopOpacity="0.9" />
        </radialGradient>

        {/* Gradiente radial para halo de luz cósmica */}
        <radialGradient id={`${gradientId}-cosmic-halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffe58f" stopOpacity="0.75" />
          <stop offset="45%" stopColor="#ff9900" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ff6600" stopOpacity="0" />
        </radialGradient>

        {/* Gradiente radial fondo oscuro del ojo */}
        <radialGradient id={`${gradientId}-eye-void`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#081b2a" stopOpacity="0.95" />
          <stop offset="70%" stopColor="#030c14" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#01060a" stopOpacity="1" />
        </radialGradient>

        {/* ─── CLIPS PARA OJOS ORGÁNICOS ─── */}
        <clipPath id={`${gradientId}-eye-clip-prism`}>
          <path d="M 50 85 C 60 67, 100 67, 110 85 C 100 103, 60 103, 50 85 Z" />
        </clipPath>

        <clipPath id={`${gradientId}-eye-clip-octa`}>
          <path d="M 46 78 C 56 60, 104 60, 114 78 C 104 96, 56 96, 46 78 Z" />
        </clipPath>

        <clipPath id={`${gradientId}-wolf-clip-l`}>
          <polygon points="52,66 66,62 68,74 54,76" />
        </clipPath>
        <clipPath id={`${gradientId}-wolf-clip-r`}>
          <polygon points="108,66 94,62 92,74 106,76" />
        </clipPath>

        <clipPath id={`${gradientId}-hound-clip-l`}>
          <ellipse cx="64" cy="66" rx="7" ry="5.5" />
        </clipPath>
        <clipPath id={`${gradientId}-hound-clip-r`}>
          <ellipse cx="96" cy="66" rx="7" ry="5.5" />
        </clipPath>

        <clipPath id={`${gradientId}-feline-clip-l`}>
          <polygon points="42,70 66,78 62,86 44,80" />
        </clipPath>
        <clipPath id={`${gradientId}-feline-clip-r`}>
          <polygon points="118,70 94,78 98,86 116,80" />
        </clipPath>

        <clipPath id={`${gradientId}-titan-clip-l`}>
          <polygon points="62,64 70,62 72,68 64,70" />
        </clipPath>
        <clipPath id={`${gradientId}-titan-clip-r`}>
          <polygon points="98,64 90,62 88,68 96,70" />
        </clipPath>
      </defs>

      {/* ─── ANIMACIONES CSS ORGÁNICAS Y ESPECÍFICAS DE CADA ESPECIE ─── */}
      <style>
        {`
          /* 1. PRISMA: ORÁCULO CLÁSICO */
          @keyframes kai-prism-look {
            0%, 100% { transform: translate(0px, 0px); }
            5%, 10% { transform: translate(3.8px, -1.8px); }
            15%, 20% { transform: translate(-4.2px, -1.6px); }
            25%, 30% { transform: translate(0px, 0px); }
          }
          @keyframes kai-prism-eyelid-u {
            0%, 90% { transform: translateY(-19px); }
            92.5% { transform: translateY(0px); }
            95% { transform: translateY(-19px); }
            97.5% { transform: translateY(0px); }
            100% { transform: translateY(-19px); }
          }
          @keyframes kai-prism-eyelid-d {
            0%, 90% { transform: translateY(19px); }
            92.5% { transform: translateY(0px); }
            95% { transform: translateY(19px); }
            97.5% { transform: translateY(0px); }
            100% { transform: translateY(19px); }
          }

          /* 2. NÚCLEO OCTAEDRO: OJO DE LA PROVIDENCIA (RESPIRACIÓN ÓPTICA & PARPADEO SAGRADO) */
          @keyframes kai-octa-breath {
            0%, 100% { transform: scale(1); opacity: 0.95; }
            50% { transform: scale(1.08); opacity: 1; }
          }
          @keyframes kai-octa-star {
            0% { transform: rotate(0deg) scale(0.9); opacity: 0.75; }
            50% { transform: rotate(180deg) scale(1.25); opacity: 1; }
            100% { transform: rotate(360deg) scale(0.9); opacity: 0.75; }
          }
          @keyframes kai-octa-lid-u {
            0%, 92% { transform: translateY(-18px); }
            94.5% { transform: translateY(0px); }
            97% { transform: translateY(-18px); }
            100% { transform: translateY(-18px); }
          }
          @keyframes kai-octa-lid-d {
            0%, 92% { transform: translateY(18px); }
            94.5% { transform: translateY(0px); }
            97% { transform: translateY(18px); }
            100% { transform: translateY(18px); }
          }

          /* 3. LOBO CYBER-ALFA: PARPADEO DIAGONAL DE CAZADOR & MICRO-SACADAS */
          @keyframes kai-wolf-hunt-blink {
            0%, 88% { transform: scaleY(1); }
            90% { transform: scaleY(0.06); }
            92% { transform: scaleY(1); }
            94% { transform: scaleY(0.4); }
            95.5% { transform: scaleY(1); }
            100% { transform: scaleY(1); }
          }
          @keyframes kai-wolf-gaze {
            0%, 25% { transform: translate(0px, 0px); }
            28%, 55% { transform: translate(-1.6px, -0.6px); }
            58%, 68% { transform: translate(0px, 0px); }
            71%, 90% { transform: translate(1.8px, -0.4px); }
            94%, 100% { transform: translate(0px, 0px); }
          }

          /* 4. SABUESO TÁCTICO: PÁRPADO CURVO & MIRADA LEAL DESPIERTA */
          @keyframes kai-hound-blink {
            0%, 89% { transform: scaleY(1); }
            91.5% { transform: scaleY(0.06); }
            94% { transform: scaleY(1); }
            100% { transform: scaleY(1); }
          }
          @keyframes kai-hound-gaze {
            0%, 20% { transform: translate(0px, 0px); }
            24%, 48% { transform: translate(1.4px, 0.7px); }
            52%, 76% { transform: translate(-1.2px, 0.4px); }
            80%, 100% { transform: translate(0px, 0px); }
          }

          /* 5. FELINO SOMBRA: SLOW-BLINK DE CONFIANZA & PUPILA VERTICAL EN ACECHO */
          @keyframes kai-feline-slow-blink {
            0%, 42% { transform: scaleY(1); }
            45%, 52% { transform: scaleY(0.35); }
            56%, 88% { transform: scaleY(1); }
            90.5% { transform: scaleY(0.06); }
            92.5% { transform: scaleY(1); }
            100% { transform: scaleY(1); }
          }
          @keyframes kai-feline-slit {
            0%, 100% { transform: scaleX(1); }
            50% { transform: scaleX(1.35); }
            75% { transform: scaleX(0.85); }
          }

          /* 6. TITÁN DE MEMORIA: PARPADEO MAJESTUOSO MILENARIO (8.4s) */
          @keyframes kai-titan-blink {
            0%, 91% { transform: scaleY(1); }
            93.5% { transform: scaleY(0.06); }
            97% { transform: scaleY(1); }
            100% { transform: scaleY(1); }
          }
        `}
      </style>

      {/* ─── 0. BASE DE LEVITACIÓN Y REJILLA HOLOGRÁFICA (EXACTA A LA REFERENCIA) ─── */}
      <g opacity={0.88}>
        <line x1="48" y1="158" x2="112" y2="158" stroke={lineColor} strokeWidth="1" opacity="0.35" />
        <line x1="32" y1="163" x2="128" y2="163" stroke={lineColor} strokeWidth="0.8" opacity="0.2" />
        {/* Sombra de levitación en 2 capas */}
        <ellipse
          cx="80"
          cy="154"
          rx="36"
          ry="5.2"
          fill="#3b1d02"
          opacity={has66Days ? 0.75 : 0.6}
        />
        <ellipse
          cx="80"
          cy="154"
          rx="22"
          ry="3"
          fill={lineColor}
          opacity={0.7}
          filter={`url(#${filterId})`}
        />
        <ellipse cx="80" cy="154" rx="14" ry="1.8" fill="#ffffff" opacity="0.85" />
      </g>

      {/* ─── 0.1 ANILLO ORBITAL DE NEUROPLASTICIDAD (21 DÍAS) ─── */}
      {has21Days && (
        <g opacity="0.9">
          <ellipse
            cx="80"
            cy="85"
            rx="66"
            ry="28"
            fill="none"
            stroke={lineColor}
            strokeWidth="1.4"
            strokeDasharray="4 6"
            className="animate-spin"
            style={{ animationDuration: '16s', transformOrigin: '80px 85px' }}
            filter={`url(#${filterId})`}
          />
          <circle
            cx="146"
            cy="85"
            r="3"
            fill="#ffffff"
            filter={`url(#${filterId})`}
            className="animate-spin"
            style={{ animationDuration: '16s', transformOrigin: '80px 85px' }}
          />
        </g>
      )}

      {/* ─── 0.2 CORONA HOLOGRÁFICA SUPREMA (66 DÍAS) ─── */}
      {has66Days && (
        <g filter={`url(#${filterId})`}>
          <polygon
            points="80,6 72,16 76,14 80,17 84,14 88,16"
            stroke="#fbbf24"
            strokeWidth="1.8"
            fill="rgba(251, 191, 36, 0.35)"
          />
          <circle cx="80" cy="11" r="1.5" fill="#ffffff" />
        </g>
      )}

      {/* ─── 0.3 CRISTALES DE ASCENSIÓN ACUMULATIVOS ─── */}
      {ascensionCrystalsCount > 0 && (
        <g filter={`url(#${filterId})`}>
          {ascensionCrystalsCount >= 1 && (
            <polygon points="14,85 18,80 22,85 18,90" stroke={lineColor} strokeWidth="1.4" fill={`${lineColor}35`} />
          )}
          {ascensionCrystalsCount >= 2 && (
            <polygon points="146,85 142,80 138,85 142,90" stroke={lineColor} strokeWidth="1.4" fill={`${lineColor}35`} />
          )}
          {ascensionCrystalsCount >= 3 && (
            <polygon points="80,146 76,142 80,138 84,142" stroke={lineColor} strokeWidth="1.4" fill={`${lineColor}35`} />
          )}
          {ascensionCrystalsCount >= 4 && (
            <polygon points="38,40 42,36 46,40 42,44" stroke={lineColor} strokeWidth="1.4" fill={`${lineColor}35`} />
          )}
          {ascensionCrystalsCount >= 5 && (
            <polygon points="122,40 118,36 114,40 118,44" stroke={lineColor} strokeWidth="1.4" fill={`${lineColor}35`} />
          )}
        </g>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 1. CHASIS VECTORIAL: REPRODUCCIÓN ESTRICTA Y RIGUROSA DEL ARTE OFICIAL */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* ──────────────── 1. PRISMA ORIGINAL (🔺) ──────────────── */}
      {shapeId === 'prism' && (
        <g>
          {/* Capa 1: Resplandor Neón */}
          <g filter={`url(#${filterId})`}>
            <polygon
              points="80,22 138,128 22,128"
              stroke={lineColor}
              strokeWidth="3.4"
              strokeLinejoin="round"
              fill="rgba(5, 12, 18, 0.55)"
            />
            <line x1="80" y1="22" x2="80" y2="70" stroke={lineColor} strokeWidth="2.8" strokeLinecap="round" />
            <line x1="80" y1="99" x2="80" y2="128" stroke={lineColor} strokeWidth="2.8" strokeLinecap="round" />
            <line x1="80" y1="22" x2="50" y2="85" stroke={secondaryStroke} strokeWidth="1.8" opacity="0.8" />
            <line x1="80" y1="22" x2="110" y2="85" stroke={secondaryStroke} strokeWidth="1.8" opacity="0.8" />
            <line x1="50" y1="85" x2="22" y2="128" stroke={secondaryStroke} strokeWidth="1.8" opacity="0.8" />
            <line x1="110" y1="85" x2="138" y2="128" stroke={secondaryStroke} strokeWidth="1.8" opacity="0.8" />
            <line x1="50" y1="85" x2="80" y2="128" stroke={secondaryStroke} strokeWidth="2" opacity="0.85" />
            <line x1="110" y1="85" x2="80" y2="128" stroke={secondaryStroke} strokeWidth="2" opacity="0.85" />
            <circle cx="80" cy="22" r="3.5" fill="#ffffff" />
          </g>
          {/* Capa 2: Núcleo Láser Lanza-Luz */}
          <g opacity={0.92}>
            <polygon points="80,22 138,128 22,128" stroke={coreStroke} strokeWidth="1.1" strokeLinejoin="round" fill="none" />
            <line x1="80" y1="22" x2="80" y2="70" stroke={coreStroke} strokeWidth="1" strokeLinecap="round" />
            <line x1="80" y1="99" x2="80" y2="128" stroke={coreStroke} strokeWidth="1" strokeLinecap="round" />
          </g>
        </g>
      )}

      {/* ──────────────── 2. NÚCLEO OCTAEDRO (💠 - ARTE OFICIAL) ──────────────── */}
      {shapeId === 'octahedron' && (
        <g>
          {/* Halo Cósmico Detrás del Ojo de la Providencia */}
          <circle cx="80" cy="78" r="34" fill={`url(#${gradientId}-cosmic-halo)`} />

          {/* Capa 1: Neón Glowing Base */}
          <g filter={`url(#${filterId})`}>
            {/* Diamante Octaédrico Exterior */}
            <polygon
              points="80,14 146,78 80,142 14,78"
              stroke={lineColor}
              strokeWidth="3.6"
              strokeLinejoin="round"
              fill="rgba(5, 12, 18, 0.5)"
            />
            {/* Diamante Interior Biselado (Doble Línea Neón Característica) */}
            <polygon
              points="80,26 134,78 80,130 26,78"
              stroke={secondaryStroke}
              strokeWidth="2.2"
              strokeLinejoin="round"
              fill="rgba(255, 150, 0, 0.03)"
            />

            {/* Aristas Piramidales Tridimensionales */}
            {/* Desde ápice superior (80,26) */}
            <line x1="80" y1="26" x2="46" y2="78" stroke={lineColor} strokeWidth="2.4" />
            <line x1="80" y1="26" x2="114" y2="78" stroke={lineColor} strokeWidth="2.4" />
            {/* Desde ápice inferior (80,130) */}
            <line x1="80" y1="130" x2="46" y2="78" stroke={lineColor} strokeWidth="2.4" />
            <line x1="80" y1="130" x2="114" y2="78" stroke={lineColor} strokeWidth="2.4" />
            {/* Líneas de ecuador lateral */}
            <line x1="14" y1="78" x2="46" y2="78" stroke={lineColor} strokeWidth="2.4" />
            <line x1="114" y1="78" x2="146" y2="78" stroke={lineColor} strokeWidth="2.4" />

            {/* Vértices Nodales de Luz Pura */}
            <circle cx="80" cy="14" r="3.2" fill="#ffffff" />
            <circle cx="80" cy="142" r="3.2" fill="#ffffff" />
            <circle cx="14" cy="78" r="3.2" fill="#ffffff" />
            <circle cx="146" cy="78" r="3.2" fill="#ffffff" />
          </g>

          {/* Capa 2: Núcleo Brillante de Trazo */}
          <g opacity={0.92}>
            <polygon points="80,14 146,78 80,142 14,78" stroke={coreStroke} strokeWidth="1.2" strokeLinejoin="round" fill="none" />
            <polygon points="80,26 134,78 80,130 26,78" stroke={coreStroke} strokeWidth="0.8" strokeLinejoin="round" fill="none" />
            <line x1="80" y1="26" x2="46" y2="78" stroke={coreStroke} strokeWidth="0.8" />
            <line x1="80" y1="26" x2="114" y2="78" stroke={coreStroke} strokeWidth="0.8" />
            <line x1="80" y1="130" x2="46" y2="78" stroke={coreStroke} strokeWidth="0.8" />
            <line x1="80" y1="130" x2="114" y2="78" stroke={coreStroke} strokeWidth="0.8" />
            <line x1="14" y1="78" x2="46" y2="78" stroke={coreStroke} strokeWidth="0.8" />
            <line x1="114" y1="78" x2="146" y2="78" stroke={coreStroke} strokeWidth="0.8" />
          </g>
        </g>
      )}

      {/* ──────────────── 3. LOBO CYBER-ALFA (🐺 - ARTE OFICIAL) ──────────────── */}
      {shapeId === 'wolf' && (
        <g>
          {/* Capa 1: Resplandor Neón */}
          <g filter={`url(#${filterId})`}>
            {/* Orejas Puntiagudas Plegadas */}
            <polygon points="36,12 24,52 46,52" stroke={lineColor} strokeWidth="3" strokeLinejoin="round" fill="rgba(5, 12, 18, 0.45)" />
            <polygon points="36,12 46,52 62,38" stroke={lineColor} strokeWidth="3" strokeLinejoin="round" fill="rgba(5, 12, 18, 0.45)" />
            <line x1="36" y1="12" x2="46" y2="52" stroke={lineColor} strokeWidth="2.4" />

            <polygon points="124,12 136,52 114,52" stroke={lineColor} strokeWidth="3" strokeLinejoin="round" fill="rgba(5, 12, 18, 0.45)" />
            <polygon points="124,12 114,52 98,38" stroke={lineColor} strokeWidth="3" strokeLinejoin="round" fill="rgba(5, 12, 18, 0.45)" />
            <line x1="124" y1="12" x2="114" y2="52" stroke={lineColor} strokeWidth="2.4" />

            {/* Puntas de orejas luminosas */}
            <circle cx="36" cy="12" r="2.5" fill="#ffffff" />
            <circle cx="124" cy="12" r="2.5" fill="#ffffff" />

            {/* Frente Facetada en Doble Rombo */}
            <polygon points="80,22 62,38 80,52 98,38" stroke={lineColor} strokeWidth="2.8" strokeLinejoin="round" fill="rgba(5, 12, 18, 0.5)" />
            <polygon points="80,52 64,66 80,78 96,66" stroke={lineColor} strokeWidth="2.8" strokeLinejoin="round" fill="rgba(5, 12, 18, 0.5)" />
            <line x1="80" y1="22" x2="80" y2="78" stroke={secondaryStroke} strokeWidth="2" />

            {/* Pelaje de Mejillas: 3 Púas Afiladas de Depredador Táctico */}
            {/* Lado Izquierdo */}
            <polyline
              points="24,52 34,62 18,74 32,84 24,96 50,116 80,142"
              stroke={lineColor}
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
            {/* Lado Derecho */}
            <polyline
              points="136,52 126,62 142,74 128,84 136,96 110,116 80,142"
              stroke={lineColor}
              strokeWidth="3.2"
              strokeLinejoin="round"
            />

            {/* Facetas Internas de las Mejillas */}
            <line x1="62" y1="38" x2="64" y2="66" stroke={secondaryStroke} strokeWidth="2" />
            <line x1="98" y1="38" x2="96" y2="66" stroke={secondaryStroke} strokeWidth="2" />
            <line x1="64" y1="66" x2="34" y2="62" stroke={secondaryStroke} strokeWidth="1.8" />
            <line x1="96" y1="66" x2="126" y2="62" stroke={secondaryStroke} strokeWidth="1.8" />
            <line x1="64" y1="66" x2="32" y2="84" stroke={secondaryStroke} strokeWidth="1.8" />
            <line x1="96" y1="66" x2="128" y2="84" stroke={secondaryStroke} strokeWidth="1.8" />
            <line x1="32" y1="84" x2="68" y2="98" stroke={secondaryStroke} strokeWidth="1.8" />
            <line x1="128" y1="84" x2="92" y2="98" stroke={secondaryStroke} strokeWidth="1.8" />
            <line x1="24" y1="96" x2="50" y2="116" stroke={secondaryStroke} strokeWidth="1.8" />
            <line x1="136" y1="96" x2="110" y2="116" stroke={secondaryStroke} strokeWidth="1.8" />

            {/* Puente del Hocico y Morro */}
            <polygon points="80,78 68,98 80,114 92,98" stroke={lineColor} strokeWidth="2.6" strokeLinejoin="round" fill="rgba(255, 150, 0, 0.05)" />
            {/* Trufa / Nariz Triangular */}
            <polygon points="74,114 86,114 80,121" stroke={lineColor} strokeWidth="2.2" strokeLinejoin="round" fill="#ffffff" />
            {/* Costura mandibular hacia el mentón */}
            <line x1="80" y1="121" x2="80" y2="142" stroke={lineColor} strokeWidth="2.4" />
            <line x1="68" y1="98" x2="80" y2="132" stroke={secondaryStroke} strokeWidth="2" />
            <line x1="92" y1="98" x2="80" y2="132" stroke={secondaryStroke} strokeWidth="2" />
            <line x1="50" y1="116" x2="80" y2="132" stroke={secondaryStroke} strokeWidth="2" />
            <line x1="110" y1="116" x2="80" y2="132" stroke={secondaryStroke} strokeWidth="2" />
          </g>

          {/* Capa 2: Núcleo Láser Lanza-Luz */}
          <g opacity={0.92}>
            <polygon points="36,12 24,52 46,52" stroke={coreStroke} strokeWidth="1" strokeLinejoin="round" fill="none" />
            <polygon points="36,12 46,52 62,38" stroke={coreStroke} strokeWidth="1" strokeLinejoin="round" fill="none" />
            <polygon points="124,12 136,52 114,52" stroke={coreStroke} strokeWidth="1" strokeLinejoin="round" fill="none" />
            <polygon points="124,12 114,52 98,38" stroke={coreStroke} strokeWidth="1" strokeLinejoin="round" fill="none" />
            <polygon points="80,22 62,38 80,52 98,38" stroke={coreStroke} strokeWidth="1" strokeLinejoin="round" fill="none" />
            <polygon points="80,52 64,66 80,78 96,66" stroke={coreStroke} strokeWidth="1" strokeLinejoin="round" fill="none" />
            <polyline points="24,52 34,62 18,74 32,84 24,96 50,116 80,142" stroke={coreStroke} strokeWidth="1.2" strokeLinejoin="round" />
            <polyline points="136,52 126,62 142,74 128,84 136,96 110,116 80,142" stroke={coreStroke} strokeWidth="1.2" strokeLinejoin="round" />
            <polygon points="80,78 68,98 80,114 92,98" stroke={coreStroke} strokeWidth="1" strokeLinejoin="round" fill="none" />
            <line x1="80" y1="121" x2="80" y2="142" stroke={coreStroke} strokeWidth="1" />
          </g>
        </g>
      )}

      {/* ──────────────── 4. SABUESO TÁCTICO (🐕 - ARTE OFICIAL) ──────────────── */}
      {shapeId === 'hound' && (
        <g>
          {/* Capa 1: Resplandor Neón */}
          <g filter={`url(#${filterId})`}>
            {/* Cúpula Craneal */}
            <line x1="66" y1="24" x2="94" y2="24" stroke={lineColor} strokeWidth="3" strokeLinecap="round" />
            <line x1="66" y1="24" x2="48" y2="36" stroke={lineColor} strokeWidth="3" strokeLinecap="round" />
            <line x1="94" y1="24" x2="112" y2="36" stroke={lineColor} strokeWidth="3" strokeLinecap="round" />

            {/* Orejas Caídas Tácticas Plegadas */}
            {/* Oreja Izquierda */}
            <polygon
              points="48,36 24,60 20,86 30,116 44,104 52,78"
              stroke={lineColor}
              strokeWidth="3.2"
              strokeLinejoin="round"
              fill="rgba(5, 12, 18, 0.45)"
            />
            {/* Pliegues internos 3D de la oreja izquierda */}
            <line x1="48" y1="36" x2="30" y2="86" stroke={secondaryStroke} strokeWidth="2.2" />
            <line x1="30" y1="86" x2="30" y2="116" stroke={secondaryStroke} strokeWidth="2.2" />
            <line x1="24" y1="60" x2="44" y2="104" stroke={secondaryStroke} strokeWidth="1.8" />

            {/* Oreja Derecha */}
            <polygon
              points="112,36 136,60 140,86 130,116 116,104 108,78"
              stroke={lineColor}
              strokeWidth="3.2"
              strokeLinejoin="round"
              fill="rgba(5, 12, 18, 0.45)"
            />
            {/* Pliegues internos 3D de la oreja derecha */}
            <line x1="112" y1="36" x2="130" y2="86" stroke={secondaryStroke} strokeWidth="2.2" />
            <line x1="130" y1="86" x2="130" y2="116" stroke={secondaryStroke} strokeWidth="2.2" />
            <line x1="136" y1="60" x2="116" y2="104" stroke={secondaryStroke} strokeWidth="1.8" />

            {/* Frente Noble con Mancha Central (Blaze) */}
            <polygon points="80,24 72,46 80,66 88,46" stroke={lineColor} strokeWidth="2.8" strokeLinejoin="round" fill="rgba(5, 12, 18, 0.5)" />
            <line x1="80" y1="24" x2="80" y2="66" stroke={secondaryStroke} strokeWidth="2" />
            {/* Planos frontales laterales */}
            <polygon points="66,24 80,24 72,46 54,48" stroke={secondaryStroke} strokeWidth="2" fill="none" />
            <polygon points="94,24 80,24 88,46 106,48" stroke={secondaryStroke} strokeWidth="2" fill="none" />
            <line x1="54" y1="48" x2="64" y2="66" stroke={secondaryStroke} strokeWidth="1.8" />
            <line x1="106" y1="48" x2="96" y2="66" stroke={secondaryStroke} strokeWidth="1.8" />

            {/* Contorno Facial y Mandíbula */}
            <polyline
              points="52,78 60,98 68,118 74,126 86,126 92,118 100,98 108,78"
              stroke={lineColor}
              strokeWidth="3"
              strokeLinejoin="round"
            />

            {/* Hocico y Trufa Canina Prominente */}
            <polygon points="80,66 68,88 80,100 92,88" stroke={lineColor} strokeWidth="2.4" strokeLinejoin="round" fill="rgba(255, 150, 0, 0.05)" />

            {/* Trufa Canina Clásica (Nose Pad) con Dos Fosas Nasales */}
            <path
              d="M 72 96 Q 80 93 88 96 Q 90 102 86 108 Q 80 110 74 108 Q 70 102 72 96 Z"
              stroke={lineColor}
              strokeWidth="2.4"
              strokeLinejoin="round"
              fill="#ffffff"
            />
            {/* Orificios nasales característicos */}
            <ellipse cx="76.5" cy="101" rx="1.6" ry="2" fill="#01060a" />
            <ellipse cx="83.5" cy="101" rx="1.6" ry="2" fill="#01060a" />

            {/* Bendidura del Labio Superior y Belfos Caídos */}
            <line x1="80" y1="110" x2="80" y2="120" stroke={lineColor} strokeWidth="2.4" />
            <path d="M 80 120 Q 72 120 68 112" stroke={lineColor} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M 80 120 Q 88 120 92 112" stroke={lineColor} strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <polygon points="72,120 80,126 88,120" stroke={secondaryStroke} strokeWidth="1.8" fill="rgba(5, 12, 18, 0.4)" />
          </g>

          {/* Capa 2: Núcleo Láser Lanza-Luz */}
          <g opacity={0.92}>
            <line x1="66" y1="24" x2="94" y2="24" stroke={coreStroke} strokeWidth="1" strokeLinecap="round" />
            <polygon points="48,36 24,60 20,86 30,116 44,104 52,78" stroke={coreStroke} strokeWidth="1.2" strokeLinejoin="round" fill="none" />
            <polygon points="112,36 136,60 140,86 130,116 116,104 108,78" stroke={coreStroke} strokeWidth="1.2" strokeLinejoin="round" fill="none" />
            <polygon points="80,24 72,46 80,66 88,46" stroke={coreStroke} strokeWidth="1" strokeLinejoin="round" fill="none" />
            <polyline points="52,78 60,98 68,118 74,126 86,126 92,118 100,98 108,78" stroke={coreStroke} strokeWidth="1.1" strokeLinejoin="round" />
            <path d="M 72 96 Q 80 93 88 96 Q 90 102 86 108 Q 80 110 74 108 Q 70 102 72 96 Z" stroke={coreStroke} strokeWidth="0.8" fill="none" />
          </g>
        </g>
      )}

      {/* ──────────────── 5. FELINO SOMBRA (🐈‍⬛ - ARTE OFICIAL) ──────────────── */}
      {shapeId === 'panther' && (
        <g>
          {/* Capa 1: Resplandor Neón */}
          <g filter={`url(#${filterId})`}>
            {/* Orejas Felinas Afiladas de Ataque */}
            <polygon points="36,18 56,44 36,64" stroke={lineColor} strokeWidth="3" strokeLinejoin="round" fill="rgba(5, 12, 18, 0.45)" />
            <polygon points="124,18 104,44 124,64" stroke={lineColor} strokeWidth="3" strokeLinejoin="round" fill="rgba(5, 12, 18, 0.45)" />
            <line x1="36" y1="18" x2="36" y2="64" stroke={lineColor} strokeWidth="2.8" />
            <line x1="124" y1="18" x2="124" y2="64" stroke={lineColor} strokeWidth="2.8" />
            <circle cx="36" cy="18" r="2.5" fill="#ffffff" />
            <circle cx="124" cy="18" r="2.5" fill="#ffffff" />

            {/* Hendidura de Corona y Frente */}
            <polyline points="56,44 80,50 104,44" stroke={lineColor} strokeWidth="2.6" strokeLinejoin="round" />
            {/* Diamante Central de la Frente */}
            <polygon points="80,50 68,66 80,82 92,66" stroke={lineColor} strokeWidth="2.8" strokeLinejoin="round" fill="rgba(5, 12, 18, 0.5)" />
            <line x1="80" y1="50" x2="80" y2="82" stroke={secondaryStroke} strokeWidth="2" />
            <polygon points="56,44 80,50 68,66 46,58" stroke={secondaryStroke} strokeWidth="2" fill="none" />
            <polygon points="104,44 80,50 92,66 114,58" stroke={secondaryStroke} strokeWidth="2" fill="none" />

            {/* Pómulos Afilados y Mandíbula Fina */}
            <polyline
              points="36,64 28,76 48,102 68,120 80,124 92,120 112,102 132,76 124,64"
              stroke={lineColor}
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
            {/* Facetas de los Pómulos */}
            <line x1="28" y1="76" x2="54" y2="78" stroke={secondaryStroke} strokeWidth="2" />
            <line x1="54" y1="78" x2="48" y2="102" stroke={secondaryStroke} strokeWidth="2" />
            <line x1="132" y1="76" x2="106" y2="78" stroke={secondaryStroke} strokeWidth="2" />
            <line x1="106" y1="78" x2="112" y2="102" stroke={secondaryStroke} strokeWidth="2" />

            {/* Morro y Nariz Felina */}
            <polygon points="80,82 72,96 80,104 88,96" stroke={lineColor} strokeWidth="2.4" strokeLinejoin="round" fill="rgba(255, 150, 0, 0.05)" />
            {/* Nariz de Gato Invertida */}
            <polygon points="74,100 86,100 80,106" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" fill="#ffffff" />
            <line x1="80" y1="106" x2="80" y2="114" stroke={lineColor} strokeWidth="2.2" />
            <line x1="80" y1="114" x2="70" y2="118" stroke={lineColor} strokeWidth="2.2" strokeLinecap="round" />
            <line x1="80" y1="114" x2="90" y2="118" stroke={lineColor} strokeWidth="2.2" strokeLinecap="round" />
            <polygon points="68,120 80,124 92,120 80,114" stroke={secondaryStroke} strokeWidth="1.8" fill="rgba(5, 12, 18, 0.4)" />
          </g>

          {/* Capa 2: Núcleo Láser Lanza-Luz */}
          <g opacity={0.92}>
            <polygon points="36,18 56,44 36,64" stroke={coreStroke} strokeWidth="1.1" strokeLinejoin="round" fill="none" />
            <polygon points="124,18 104,44 124,64" stroke={coreStroke} strokeWidth="1.1" strokeLinejoin="round" fill="none" />
            <polyline points="56,44 80,50 104,44" stroke={coreStroke} strokeWidth="1" strokeLinejoin="round" />
            <polygon points="80,50 68,66 80,82 92,66" stroke={coreStroke} strokeWidth="1" strokeLinejoin="round" fill="none" />
            <polyline points="36,64 28,76 48,102 68,120 80,124 92,120 112,102 132,76 124,64" stroke={coreStroke} strokeWidth="1.2" strokeLinejoin="round" />
            <polygon points="80,82 72,96 80,104 88,96" stroke={coreStroke} strokeWidth="0.9" strokeLinejoin="round" fill="none" />
          </g>
        </g>
      )}

      {/* ──────────────── 6. TITÁN DE MEMORIA (🐘 - ARTE OFICIAL) ──────────────── */}
      {shapeId === 'elephant' && (
        <g>
          {/* Capa 1: Resplandor Neón */}
          <g filter={`url(#${filterId})`}>
            {/* Corona de la Cabeza */}
            <line x1="72" y1="22" x2="88" y2="22" stroke={lineColor} strokeWidth="3" strokeLinecap="round" />
            <polygon points="64,34 72,22 80,34" stroke={lineColor} strokeWidth="2.6" fill="rgba(5, 12, 18, 0.45)" />
            <polygon points="96,34 88,22 80,34" stroke={lineColor} strokeWidth="2.6" fill="rgba(5, 12, 18, 0.45)" />

            {/* Orejas Majestuosas de Elefante Africano */}
            {/* Oreja Izquierda */}
            <polygon
              points="64,34 34,28 12,46 16,92 34,112 58,102"
              stroke={lineColor}
              strokeWidth="3.2"
              strokeLinejoin="round"
              fill="rgba(5, 12, 18, 0.45)"
            />
            <line x1="34" y1="28" x2="30" y2="78" stroke={secondaryStroke} strokeWidth="2" />
            <line x1="30" y1="78" x2="34" y2="112" stroke={secondaryStroke} strokeWidth="2" />

            {/* Oreja Derecha */}
            <polygon
              points="96,34 126,28 148,46 144,92 126,112 102,102"
              stroke={lineColor}
              strokeWidth="3.2"
              strokeLinejoin="round"
              fill="rgba(5, 12, 18, 0.45)"
            />
            <line x1="126" y1="28" x2="130" y2="78" stroke={secondaryStroke} strokeWidth="2" />
            <line x1="130" y1="78" x2="126" y2="112" stroke={secondaryStroke} strokeWidth="2" />

            {/* Frente y Cuencas del Titán */}
            <polygon points="80,34 68,48 80,62 92,48" stroke={lineColor} strokeWidth="2.8" strokeLinejoin="round" fill="rgba(5, 12, 18, 0.5)" />
            <polygon points="64,34 80,34 68,48 58,58" stroke={secondaryStroke} strokeWidth="2" fill="none" />
            <polygon points="96,34 80,34 92,48 102,58" stroke={secondaryStroke} strokeWidth="2" fill="none" />

            {/* Trompa Segmentada Hacia Abajo */}
            <polygon points="72,62 88,62 86,82 74,82" stroke={lineColor} strokeWidth="2.6" fill="rgba(5, 12, 18, 0.55)" />
            <polygon points="74,82 86,82 85,102 75,102" stroke={lineColor} strokeWidth="2.6" fill="rgba(5, 12, 18, 0.55)" />
            <polygon points="75,102 85,102 84,122 76,122" stroke={lineColor} strokeWidth="2.6" fill="rgba(5, 12, 18, 0.55)" />
            <polygon points="76,122 84,122 83,142 77,142" stroke={lineColor} strokeWidth="2.6" fill="rgba(5, 12, 18, 0.55)" />
            {/* Punta de la Trompa */}
            <polygon points="77,142 83,142 82,148 78,148" stroke={lineColor} strokeWidth="2.4" fill="#ffffff" />

            {/* Colmillos de Luz en Chevron (Platino/Blanco-Oro Supremo) */}
            {/* Colmillo Izquierdo */}
            <polygon
              points="68,96 52,126 46,138 56,124 68,102"
              stroke="#fffef0"
              strokeWidth="2.8"
              strokeLinejoin="round"
              fill="rgba(255, 255, 240, 0.45)"
            />
            {/* Colmillo Derecho */}
            <polygon
              points="92,96 108,126 114,138 104,124 92,102"
              stroke="#fffef0"
              strokeWidth="2.8"
              strokeLinejoin="round"
              fill="rgba(255, 255, 240, 0.45)"
            />
          </g>

          {/* Capa 2: Núcleo Láser Lanza-Luz */}
          <g opacity={0.92}>
            <polygon points="64,34 34,28 12,46 16,92 34,112 58,102" stroke={coreStroke} strokeWidth="1.1" strokeLinejoin="round" fill="none" />
            <polygon points="96,34 126,28 148,46 144,92 126,112 102,102" stroke={coreStroke} strokeWidth="1.1" strokeLinejoin="round" fill="none" />
            <polygon points="80,34 68,48 80,62 92,48" stroke={coreStroke} strokeWidth="1" strokeLinejoin="round" fill="none" />
            <polygon points="72,62 88,62 86,82 74,82" stroke={coreStroke} strokeWidth="0.9" fill="none" />
            <polygon points="74,82 86,82 85,102 75,102" stroke={coreStroke} strokeWidth="0.9" fill="none" />
            <polygon points="75,102 85,102 84,122 76,122" stroke={coreStroke} strokeWidth="0.9" fill="none" />
            <polygon points="76,122 84,122 83,142 77,142" stroke={coreStroke} strokeWidth="0.9" fill="none" />
            <polygon points="68,96 52,126 46,138 56,124 68,102" stroke="#ffffff" strokeWidth="1.2" fill="none" />
            <polygon points="92,96 108,126 114,138 104,124 92,102" stroke="#ffffff" strokeWidth="1.2" fill="none" />
          </g>
        </g>
      )}

      {/* ──────────────── 7. CUSTOM / FORJA NEURAL IA (📸) ──────────────── */}
      {shapeId === 'custom' && customForm && (
        <g>
          <g filter={`url(#${filterId})`}>
            {customForm.polygons?.map((p, idx) => (
              <polygon
                key={`poly-${idx}`}
                points={p.points}
                stroke={lineColor}
                strokeWidth="2.8"
                strokeLinejoin="round"
                fill="rgba(5, 12, 18, 0.45)"
              />
            ))}
            {customForm.lines?.map((l, idx) => (
              <line
                key={`line-${idx}`}
                x1={l.x1}
                y1={l.y1}
                x2={l.x2}
                y2={l.y2}
                stroke={idx % 2 === 0 ? lineColor : secondaryStroke}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            ))}
          </g>
          <g opacity={0.9}>
            {customForm.polygons?.map((p, idx) => (
              <polygon key={`core-poly-${idx}`} points={p.points} stroke={coreStroke} strokeWidth="1" strokeLinejoin="round" fill="none" />
            ))}
            {customForm.lines?.map((l, idx) => (
              <line key={`core-line-${idx}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={coreStroke} strokeWidth="0.8" strokeLinecap="round" />
            ))}
          </g>
        </g>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 2. SISTEMA DE OJOS VIVOS: FIEL AL ARTE & CON ANIMACIÓN ORGÁNICA NATURAL */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* ── CASO 1: PRISMA & CUSTOM INERTE (OJO SAGRADO CLÁSICO) ── */}
      {(shapeId === 'prism' || shapeId === 'custom') && (
        <g id={`${gradientId}-central-living-eye`}>
          <path d="M 50 85 C 60 67, 100 67, 110 85 C 100 103, 60 103, 50 85 Z" fill={`url(#${gradientId}-eye-void)`} />
          <g clipPath={`url(#${gradientId}-eye-clip-prism)`}>
            <g
              style={
                isTrackingMouse
                  ? {
                      transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
                      transition: 'transform 0.12s ease-out',
                    }
                  : { animation: 'kai-prism-look 4.2s infinite ease-in-out' }
              }
            >
              <circle cx="80" cy="85" r={justClicked ? 14.5 : 13} stroke={lineColor} strokeWidth="3.2" fill="none" filter={`url(#${filterId})`} />
              <circle cx="80" cy="85" r={justClicked ? 14.5 : 13} stroke="#ffffff" strokeWidth="1.2" fill="none" />
              <circle cx="80" cy="85" r={justClicked ? 7.5 : 6} fill={lineColor} filter={`url(#${filterId})`} />
              <circle cx="80" cy="85" r={justClicked ? 4.2 : 3} fill="#ffffff" />
              <circle cx="82.4" cy="82.6" r="1.5" fill="#ffffff" opacity="0.9" />
            </g>

            <path
              d="M 46 66 H 114 V 85 C 104 85, 56 85, 46 85 Z"
              fill="#000e17"
              stroke={lineColor}
              strokeWidth="1.6"
              style={isFocusTrance ? { transform: 'translateY(-19px)' } : { animation: 'kai-prism-eyelid-u 4.2s infinite ease-in' }}
            />
            <path
              d="M 46 104 H 114 V 85 C 104 85, 56 85, 46 85 Z"
              fill="#000e17"
              stroke={lineColor}
              strokeWidth="1.6"
              style={isFocusTrance ? { transform: 'translateY(19px)' } : { animation: 'kai-prism-eyelid-d 4.2s infinite ease-in' }}
            />
          </g>
          <path d="M 50 85 C 60 67, 100 67, 110 85 C 100 103, 60 103, 50 85 Z" stroke={lineColor} strokeWidth="3.4" fill="none" filter={`url(#${filterId})`} />
          <path d="M 50 85 C 60 67, 100 67, 110 85 C 100 103, 60 103, 50 85 Z" stroke={coreStroke} strokeWidth="1.1" fill="none" opacity="0.9" />
        </g>
      )}

      {/* ── CASO 2: NÚCLEO OCTAEDRO: OJO DE LA PROVIDENCIA (FIEL A LA ILUSTRACIÓN) ── */}
      {shapeId === 'octahedron' && (
        <g id={`${gradientId}-octa-providence-eye`}>
          {/* Fondo Vacío del Ojo */}
          <path d="M 46 78 C 56 60, 104 60, 114 78 C 104 96, 56 96, 46 78 Z" fill={`url(#${gradientId}-eye-void)`} />

          <g clipPath={`url(#${gradientId}-eye-clip-octa)`}>
            {/* Globo Ocular con Respiración Óptica */}
            <g
              style={{
                transformOrigin: '80px 78px',
                animation: 'kai-octa-breath 3.8s infinite ease-in-out',
              }}
            >
              {/* Anillo de Iris Neón Dorado */}
              <circle cx="80" cy="78" r="14" stroke={lineColor} strokeWidth="2.8" fill="none" filter={`url(#${filterId})`} />
              <circle cx="80" cy="78" r="14" stroke="#ffffff" strokeWidth="0.9" fill="none" />
              <circle cx="80" cy="78" r="10" stroke="#fde047" strokeWidth="1.6" fill="none" />
              {/* Pupila Profunda */}
              <circle cx="80" cy="78" r="6" fill="#02080e" />
              <circle cx="80" cy="78" r="3.2" fill={lineColor} filter={`url(#${filterId})`} />
              <circle cx="80" cy="78" r="1.8" fill="#ffffff" />
            </g>

            {/* Destello Estelar en Rotación Continua */}
            <g style={{ transformOrigin: '80px 78px', animation: 'kai-octa-star 8s infinite linear' }}>
              <polygon points="80,68 82,75 89,78 82,81 80,88 78,81 71,78 78,75" fill="#ffffff" opacity="0.95" />
            </g>

            {/* Párpados Místicos Sagrados Curvos */}
            <path
              d="M 44 58 H 116 V 78 C 104 78, 56 78, 44 78 Z"
              fill="#01060a"
              stroke={lineColor}
              strokeWidth="1.6"
              style={isFocusTrance ? { transform: 'translateY(-20px)' } : { animation: 'kai-octa-lid-u 5.2s infinite ease-in' }}
            />
            <path
              d="M 44 98 H 116 V 78 C 104 78, 56 78, 44 78 Z"
              fill="#01060a"
              stroke={lineColor}
              strokeWidth="1.6"
              style={isFocusTrance ? { transform: 'translateY(20px)' } : { animation: 'kai-octa-lid-d 5.2s infinite ease-in' }}
            />
          </g>

          {/* Borde Neón Exterior del Ojo */}
          <path d="M 46 78 C 56 60, 104 60, 114 78 C 104 96, 56 96, 46 78 Z" stroke={lineColor} strokeWidth="3.2" fill="none" filter={`url(#${filterId})`} />
          <path d="M 46 78 C 56 60, 104 60, 114 78 C 104 96, 56 96, 46 78 Z" stroke={coreStroke} strokeWidth="1" fill="none" opacity="0.95" />
        </g>
      )}

      {/* ── CASO 3: LOBO CYBER-ALFA (OJOS RASGADOS DE FUEGO DORADO CON PARPADEO ORGÁNICO) ── */}
      {shapeId === 'wolf' && (
        <g id={`${gradientId}-wolf-living-eyes`}>
          {/* Ojo Izquierdo */}
          <g
            style={{
              transformOrigin: '59px 71px',
              animation: isFocusTrance ? undefined : 'kai-wolf-hunt-blink 5.2s infinite ease-in-out',
            }}
          >
            <polygon
              points="52,66 66,62 68,74 54,76"
              fill={`url(#${gradientId}-fire-eye)`}
              filter={`url(#${filterId})`}
            />
            {/* Núcleo blanco incandescente */}
            <polygon points="55,67 64,64 65,72 56,73" fill="#ffffff" opacity="0.9" />
            {/* Micro-sacadas de mirada de caza */}
            <g
              style={
                isTrackingMouse
                  ? { transform: `translate(${eyeOffset.x * 0.55}px, ${eyeOffset.y * 0.45}px)` }
                  : { animation: 'kai-wolf-gaze 6s infinite ease-in-out' }
              }
            >
              <circle cx="60.5" cy="69.5" r="1.6" fill="#01060a" opacity="0.8" />
              <circle cx="61.5" cy="68.5" r="0.8" fill="#ffffff" />
            </g>
          </g>
          <polygon points="52,66 66,62 68,74 54,76" stroke={lineColor} strokeWidth="2.4" strokeLinejoin="round" fill="none" filter={`url(#${filterId})`} />
          <polygon points="52,66 66,62 68,74 54,76" stroke={coreStroke} strokeWidth="0.9" strokeLinejoin="round" fill="none" />

          {/* Ojo Derecho */}
          <g
            style={{
              transformOrigin: '101px 71px',
              animation: isFocusTrance ? undefined : 'kai-wolf-hunt-blink 5.2s infinite ease-in-out',
            }}
          >
            <polygon
              points="108,66 94,62 92,74 106,76"
              fill={`url(#${gradientId}-fire-eye)`}
              filter={`url(#${filterId})`}
            />
            {/* Núcleo blanco incandescente */}
            <polygon points="105,67 96,64 95,72 104,73" fill="#ffffff" opacity="0.9" />
            {/* Micro-sacadas de caza */}
            <g
              style={
                isTrackingMouse
                  ? { transform: `translate(${eyeOffset.x * 0.55}px, ${eyeOffset.y * 0.45}px)` }
                  : { animation: 'kai-wolf-gaze 6s infinite ease-in-out' }
              }
            >
              <circle cx="99.5" cy="69.5" r="1.6" fill="#01060a" opacity="0.8" />
              <circle cx="98.5" cy="68.5" r="0.8" fill="#ffffff" />
            </g>
          </g>
          <polygon points="108,66 94,62 92,74 106,76" stroke={lineColor} strokeWidth="2.4" strokeLinejoin="round" fill="none" filter={`url(#${filterId})`} />
          <polygon points="108,66 94,62 92,74 106,76" stroke={coreStroke} strokeWidth="0.9" strokeLinejoin="round" fill="none" />
        </g>
      )}

      {/* ── CASO 4: SABUESO TÁCTICO (OJOS NOBLES REDONDOS CON BRILLO ESPECULAR REAL) ── */}
      {shapeId === 'hound' && (
        <g id={`${gradientId}-hound-living-eyes`}>
          {/* Ojo Izquierdo del Sabueso */}
          <g
            style={{
              transformOrigin: '64px 66px',
              animation: isFocusTrance ? undefined : 'kai-hound-blink 4.8s infinite ease-in-out',
            }}
          >
            <ellipse cx="64" cy="66" rx="7" ry="5.5" fill={`url(#${gradientId}-eye-void)`} />
            <g clipPath={`url(#${gradientId}-hound-clip-l)`}>
              {/* Iris Ámbar Lleno */}
              <circle cx="64" cy="66" r="5.2" fill={lineColor} filter={`url(#${filterId})`} />
              <circle cx="64" cy="66" r="3.2" fill="#01080e" />
              {/* Pupila Leal con Doble Brillo Especular (Destello de Inteligencia) */}
              <g
                style={
                  isTrackingMouse
                    ? { transform: `translate(${eyeOffset.x * 0.5}px, ${eyeOffset.y * 0.5}px)` }
                    : { animation: 'kai-hound-gaze 5.4s infinite ease-in-out' }
                }
              >
                <circle cx="65.4" cy="64.6" r="1.3" fill="#ffffff" />
                <circle cx="63.2" cy="67.4" r="0.7" fill="#ffffff" opacity="0.9" />
              </g>
            </g>
          </g>
          <ellipse cx="64" cy="66" rx="7" ry="5.5" stroke={lineColor} strokeWidth="2.4" fill="none" filter={`url(#${filterId})`} />
          <ellipse cx="64" cy="66" rx="7" ry="5.5" stroke={coreStroke} strokeWidth="0.9" fill="none" opacity="0.95" />

          {/* Ojo Derecho del Sabueso */}
          <g
            style={{
              transformOrigin: '96px 66px',
              animation: isFocusTrance ? undefined : 'kai-hound-blink 4.8s infinite ease-in-out',
            }}
          >
            <ellipse cx="96" cy="66" rx="7" ry="5.5" fill={`url(#${gradientId}-eye-void)`} />
            <g clipPath={`url(#${gradientId}-hound-clip-r)`}>
              {/* Iris Ámbar Lleno */}
              <circle cx="96" cy="66" r="5.2" fill={lineColor} filter={`url(#${filterId})`} />
              <circle cx="96" cy="66" r="3.2" fill="#01080e" />
              {/* Pupila con Doble Brillo Especular */}
              <g
                style={
                  isTrackingMouse
                    ? { transform: `translate(${eyeOffset.x * 0.5}px, ${eyeOffset.y * 0.5}px)` }
                    : { animation: 'kai-hound-gaze 5.4s infinite ease-in-out' }
                }
              >
                <circle cx="97.4" cy="64.6" r="1.3" fill="#ffffff" />
                <circle cx="95.2" cy="67.4" r="0.7" fill="#ffffff" opacity="0.9" />
              </g>
            </g>
          </g>
          <ellipse cx="96" cy="66" rx="7" ry="5.5" stroke={lineColor} strokeWidth="2.4" fill="none" filter={`url(#${filterId})`} />
          <ellipse cx="96" cy="66" rx="7" ry="5.5" stroke={coreStroke} strokeWidth="0.9" fill="none" opacity="0.95" />
        </g>
      )}

      {/* ── CASO 5: FELINO SOMBRA (CUÑAS DORADAS DE FUEGO, SLOW-BLINK & PUPILA VERTICAL) ── */}
      {shapeId === 'panther' && (
        <g id={`${gradientId}-feline-living-eyes`}>
          {/* Ojo Izquierdo del Felino: Gran Cuña de Fuego Brillante */}
          <g
            style={{
              transformOrigin: '54px 78px',
              animation: isFocusTrance ? undefined : 'kai-feline-slow-blink 6.5s infinite ease-in-out',
            }}
          >
            <polygon
              points="42,70 66,78 62,86 44,80"
              fill={`url(#${gradientId}-fire-eye)`}
              filter={`url(#${filterId})`}
            />
            {/* Núcleo de luz blanca ultra brillante */}
            <polygon points="45,72 63,78 60,84 46,79" fill="#ffffff" opacity="0.88" />
            {/* Pupila Felina en Hendidura Vertical */}
            <g
              style={{
                transformOrigin: '54px 78px',
                animation: 'kai-feline-slit 4.4s infinite ease-in-out',
              }}
            >
              <ellipse cx="54" cy="78" rx="1.2" ry="4.8" fill="#01060a" />
              <circle cx="55" cy="76.8" r="0.7" fill="#ffffff" />
            </g>
          </g>
          <polygon points="42,70 66,78 62,86 44,80" stroke={lineColor} strokeWidth="2.6" strokeLinejoin="round" fill="none" filter={`url(#${filterId})`} />
          <polygon points="42,70 66,78 62,86 44,80" stroke={coreStroke} strokeWidth="1" strokeLinejoin="round" fill="none" />

          {/* Ojo Derecho del Felino */}
          <g
            style={{
              transformOrigin: '106px 78px',
              animation: isFocusTrance ? undefined : 'kai-feline-slow-blink 6.5s infinite ease-in-out',
            }}
          >
            <polygon
              points="118,70 94,78 98,86 116,80"
              fill={`url(#${gradientId}-fire-eye)`}
              filter={`url(#${filterId})`}
            />
            {/* Núcleo blanco */}
            <polygon points="115,72 97,78 100,84 114,79" fill="#ffffff" opacity="0.88" />
            {/* Pupila en Hendidura */}
            <g
              style={{
                transformOrigin: '106px 78px',
                animation: 'kai-feline-slit 4.4s infinite ease-in-out',
              }}
            >
              <ellipse cx="106" cy="78" rx="1.2" ry="4.8" fill="#01060a" />
              <circle cx="105" cy="76.8" r="0.7" fill="#ffffff" />
            </g>
          </g>
          <polygon points="118,70 94,78 98,86 116,80" stroke={lineColor} strokeWidth="2.6" strokeLinejoin="round" fill="none" filter={`url(#${filterId})`} />
          <polygon points="118,70 94,78 98,86 116,80" stroke={coreStroke} strokeWidth="1" strokeLinejoin="round" fill="none" />
        </g>
      )}

      {/* ── CASO 6: TITÁN DE MEMORIA (OJOS PROFUNDOS BAJO EL CEÑO & PARPADEO MILENARIO) ── */}
      {shapeId === 'elephant' && (
        <g id={`${gradientId}-titan-living-eyes`}>
          {/* Ojo Izquierdo del Titán */}
          <g
            style={{
              transformOrigin: '67px 66px',
              animation: isFocusTrance ? undefined : 'kai-titan-blink 8.4s infinite ease-in-out',
            }}
          >
            <polygon
              points="62,64 70,62 72,68 64,70"
              fill={`url(#${gradientId}-fire-eye)`}
              filter={`url(#${filterId})`}
            />
            <polygon points="63.5,64.5 69,63 70.5,67 65,68.5" fill="#ffffff" opacity="0.9" />
            <circle cx="67" cy="66" r="1.2" fill="#01060a" />
            <circle cx="67.6" cy="65.4" r="0.6" fill="#ffffff" />
          </g>
          <polygon points="62,64 70,62 72,68 64,70" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" fill="none" filter={`url(#${filterId})`} />
          <polygon points="62,64 70,62 72,68 64,70" stroke={coreStroke} strokeWidth="0.8" strokeLinejoin="round" fill="none" />

          {/* Ojo Derecho del Titán */}
          <g
            style={{
              transformOrigin: '93px 66px',
              animation: isFocusTrance ? undefined : 'kai-titan-blink 8.4s infinite ease-in-out',
            }}
          >
            <polygon
              points="98,64 90,62 88,68 96,70"
              fill={`url(#${gradientId}-fire-eye)`}
              filter={`url(#${filterId})`}
            />
            <polygon points="96.5,64.5 91,63 89.5,67 95,68.5" fill="#ffffff" opacity="0.9" />
            <circle cx="93" cy="66" r="1.2" fill="#01060a" />
            <circle cx="92.4" cy="65.4" r="0.6" fill="#ffffff" />
          </g>
          <polygon points="98,64 90,62 88,68 96,70" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" fill="none" filter={`url(#${filterId})`} />
          <polygon points="98,64 90,62 88,68 96,70" stroke={coreStroke} strokeWidth="0.8" strokeLinejoin="round" fill="none" />
        </g>
      )}
    </svg>
  );
};
