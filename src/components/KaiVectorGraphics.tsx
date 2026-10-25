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

  // Colores reactivos: si tiene 66 días, el chasis adquiere el dorado/platino supremo de Lally
  const lineColor = has66Days ? '#fbbf24' : activeColor;
  const secondaryStroke = has66Days ? '#f59e0b' : (secondaryColor || activeColor);

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
        {/* Filtro Bloom Neón */}
        <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={has66Days ? 3.0 : 2.2} result="blur1" />
          <feMerge>
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Gradiente radial interno del ojo */}
        <radialGradient id={`${gradientId}-eye-void`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#011b2b" stopOpacity="0.95" />
          <stop offset="70%" stopColor="#000e17" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#00070c" stopOpacity="1" />
        </radialGradient>

        {/* ─── CLIPS PARA OJOS ORGÁNICOS POR ESPECIE ─── */}
        {/* Clip del Ojo Central (Prisma / Custom) */}
        <clipPath id={`${gradientId}-eye-clip-prism`}>
          <path d="M 50 85 C 60 67, 100 67, 110 85 C 100 103, 60 103, 50 85 Z" />
        </clipPath>

        {/* Clip del Ojo Sagrado del Octaedro */}
        <clipPath id={`${gradientId}-eye-clip-octa`}>
          <path d="M 48 80 C 58 64, 102 64, 112 80 C 102 96, 58 96, 48 80 Z" />
        </clipPath>

        {/* Clips Ojos del Lobo Cyber-Alfa (Rasgados 30°) */}
        <clipPath id={`${gradientId}-wolf-clip-l`}>
          <polygon points="50,72 60,66 68,70 64,77 52,76" />
        </clipPath>
        <clipPath id={`${gradientId}-wolf-clip-r`}>
          <polygon points="110,72 100,66 92,70 96,77 108,76" />
        </clipPath>

        {/* Clips Ojos del Sabueso Táctico (Ovares / Redondos Despiertos) */}
        <clipPath id={`${gradientId}-hound-clip-l`}>
          <ellipse cx="64" cy="70" rx="6.5" ry="5.5" />
        </clipPath>
        <clipPath id={`${gradientId}-hound-clip-r`}>
          <ellipse cx="96" cy="70" rx="6.5" ry="5.5" />
        </clipPath>

        {/* Clips Ojos de Felino Sombra (Cuña / Slit Agresivo) */}
        <clipPath id={`${gradientId}-feline-clip-l`}>
          <polygon points="44,68 66,76 60,82 46,76" />
        </clipPath>
        <clipPath id={`${gradientId}-feline-clip-r`}>
          <polygon points="116,68 94,76 100,82 114,76" />
        </clipPath>

        {/* Clips Ojos del Titán de Memoria (Rombo Horizontal Bajo Ceño) */}
        <clipPath id={`${gradientId}-titan-clip-l`}>
          <polygon points="61,74 66,71 71,74 66,77" />
        </clipPath>
        <clipPath id={`${gradientId}-titan-clip-r`}>
          <polygon points="99,74 94,71 89,74 94,77" />
        </clipPath>
      </defs>

      {/* ─── ANIMACIONES CSS ORGÁNICAS Y DIFERENCIADAS POR ANIMAL ─── */}
      <style>
        {`
          /* ──────── 1. PRISMA: ORÁCULO CLÁSICO ──────── */
          @keyframes kai-prism-look {
            0% { transform: translate(0px, 0px); }
            5% { transform: translate(3.8px, -1.8px); }
            10% { transform: translate(3.8px, -1.8px); }
            15% { transform: translate(-4.2px, -1.6px); }
            20% { transform: translate(-4.2px, -1.6px); }
            25% { transform: translate(0px, 0px); }
            100% { transform: translate(0px, 0px); }
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

          /* ──────── 2. NÚCLEO OCTAEDRO: RESPIRACIÓN CÓSMICA ──────── */
          @keyframes kai-octa-breath {
            0%, 100% { transform: scale(1); opacity: 0.95; }
            50% { transform: scale(1.08); opacity: 1; }
          }
          @keyframes kai-octa-star {
            0%, 100% { transform: rotate(0deg) scale(0.9); opacity: 0.7; }
            50% { transform: rotate(45deg) scale(1.25); opacity: 1; }
          }

          /* ──────── 3. LOBO CYBER-ALFA: PARPADEO DIAGONAL DE CAZA & MICRO-SACADAS ──────── */
          @keyframes kai-wolf-hunt-blink {
            0%, 88% { transform: scaleY(1); }
            90% { transform: scaleY(0.08); }
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

          /* ──────── 4. SABUESO TÁCTICO: PARPADEO SUAVE & MIRADA LEAL DESPIERTA ──────── */
          @keyframes kai-hound-blink {
            0%, 89% { transform: scaleY(1); }
            91.5% { transform: scaleY(0.06); }
            94% { transform: scaleY(1); }
            100% { transform: scaleY(1); }
          }
          @keyframes kai-hound-gaze {
            0%, 20% { transform: translate(0px, 0px); }
            24%, 48% { transform: translate(1.5px, 0.8px); }
            52%, 76% { transform: translate(-1.3px, 0.5px); }
            80%, 100% { transform: translate(0px, 0px); }
          }

          /* ──────── 5. FELINO SOMBRA: SLOW-BLINK FELINO & DILATACIÓN DE PUPILA ──────── */
          @keyframes kai-feline-slow-blink {
            0%, 42% { transform: scaleY(1); }
            45%, 52% { transform: scaleY(0.35); } /* Slow blink de confianza */
            56%, 88% { transform: scaleY(1); }
            90.5% { transform: scaleY(0.06); }    /* Parpadeo seco de ataque */
            92.5% { transform: scaleY(1); }
            100% { transform: scaleY(1); }
          }
          @keyframes kai-feline-slit {
            0%, 100% { transform: scaleX(1); }
            50% { transform: scaleX(1.4); }
            75% { transform: scaleX(0.85); }
          }

          /* ──────── 6. TITÁN DE MEMORIA: PARPADEO PESADO MAJESTUOSO (8.5s) ──────── */
          @keyframes kai-titan-blink {
            0%, 91% { transform: scaleY(1); }
            93.5% { transform: scaleY(0.06); }
            97% { transform: scaleY(1); }
            100% { transform: scaleY(1); }
          }
        `}
      </style>

      {/* ─── 0. BASE DE LEVITACIÓN Y REJILLA CUÁNTICA (TODAS LAS FORMAS) ─── */}
      <g opacity={0.85}>
        <line x1="45" y1="156" x2="115" y2="156" stroke={lineColor} strokeWidth="0.8" opacity="0.3" />
        <line x1="30" y1="162" x2="130" y2="162" stroke={lineColor} strokeWidth="0.8" opacity="0.2" />
        <ellipse
          cx="80"
          cy="153"
          rx="40"
          ry="5.5"
          fill={lineColor}
          opacity={has66Days ? 0.65 : 0.5}
          filter={`url(#${filterId})`}
        />
        <ellipse cx="80" cy="153" rx="24" ry="3" fill="#ffffff" opacity="0.75" />
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
            points="80,8 72,18 76,16 80,19 84,16 88,18"
            stroke="#fbbf24"
            strokeWidth="1.6"
            fill="rgba(251, 191, 36, 0.3)"
          />
          <circle cx="80" cy="13" r="1.5" fill="#ffffff" />
        </g>
      )}

      {/* ─── 0.3 CRISTALES DE ASCENSIÓN ACUMULATIVOS (HÁBITOS DE 66D ADICIONALES) ─── */}
      {ascensionCrystalsCount > 0 && (
        <g filter={`url(#${filterId})`}>
          {ascensionCrystalsCount >= 1 && (
            <polygon points="16,85 20,80 24,85 20,90" stroke={lineColor} strokeWidth="1.4" fill={`${lineColor}30`} />
          )}
          {ascensionCrystalsCount >= 2 && (
            <polygon points="144,85 140,80 136,85 140,90" stroke={lineColor} strokeWidth="1.4" fill={`${lineColor}30`} />
          )}
          {ascensionCrystalsCount >= 3 && (
            <polygon points="80,144 76,140 80,136 84,140" stroke={lineColor} strokeWidth="1.4" fill={`${lineColor}30`} />
          )}
          {ascensionCrystalsCount >= 4 && (
            <polygon points="40,42 44,38 48,42 44,46" stroke={lineColor} strokeWidth="1.4" fill={`${lineColor}30`} />
          )}
          {ascensionCrystalsCount >= 5 && (
            <polygon points="120,42 116,38 112,42 116,46" stroke={lineColor} strokeWidth="1.4" fill={`${lineColor}30`} />
          )}
        </g>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 1. CHASIS VECTORIAL EXACTO SEGÚN EL ARTE OFICIAL                       */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* ──────────────── FORMA 1: EL PRISMA ORIGINAL (🔺) ──────────────── */}
      {shapeId === 'prism' && (
        <g filter={`url(#${filterId})`}>
          <polygon
            points="80,22 138,128 22,128"
            stroke={lineColor}
            strokeWidth="3.8"
            strokeLinejoin="round"
            fill="rgba(0, 14, 24, 0.45)"
          />
          <line x1="80" y1="22" x2="80" y2="70" stroke={lineColor} strokeWidth="3" strokeLinecap="round" />
          <line x1="80" y1="99" x2="80" y2="128" stroke={lineColor} strokeWidth="3" strokeLinecap="round" />
          <line x1="80" y1="22" x2="50" y2="85" stroke={secondaryStroke} strokeWidth="1.6" opacity="0.75" />
          <line x1="80" y1="22" x2="110" y2="85" stroke={secondaryStroke} strokeWidth="1.6" opacity="0.75" />
          <line x1="50" y1="85" x2="22" y2="128" stroke={secondaryStroke} strokeWidth="1.6" opacity="0.75" />
          <line x1="110" y1="85" x2="138" y2="128" stroke={secondaryStroke} strokeWidth="1.6" opacity="0.75" />
          <line x1="50" y1="85" x2="80" y2="128" stroke={secondaryStroke} strokeWidth="1.8" opacity="0.8" />
          <line x1="110" y1="85" x2="80" y2="128" stroke={secondaryStroke} strokeWidth="1.8" opacity="0.8" />
          <circle cx="80" cy="22" r="3.5" fill="#ffffff" />
        </g>
      )}

      {/* ──────────────── FORMA 2: EL NÚCLEO OCTAEDRO (💠) ──────────────── */}
      {shapeId === 'octahedron' && (
        <g filter={`url(#${filterId})`}>
          {/* Rombo exterior 3D */}
          <polygon
            points="80,18 136,80 80,142 24,80"
            stroke={lineColor}
            strokeWidth="3.6"
            strokeLinejoin="round"
            fill="rgba(0, 14, 24, 0.45)"
          />
          {/* Facetas tridimensionales frontales y posteriores */}
          <line x1="24" y1="80" x2="136" y2="80" stroke={lineColor} strokeWidth="2.2" />
          <line x1="80" y1="18" x2="80" y2="58" stroke={lineColor} strokeWidth="2.2" />
          <line x1="80" y1="102" x2="80" y2="142" stroke={lineColor} strokeWidth="2.2" />

          {/* Aristas internas en rombo */}
          <polygon points="80,18 24,80 80,80" stroke={secondaryStroke} strokeWidth="1.8" fill="rgba(0, 240, 255, 0.06)" />
          <polygon points="80,18 136,80 80,80" stroke={secondaryStroke} strokeWidth="1.8" fill="rgba(0, 240, 255, 0.08)" />
          <polygon points="80,142 24,80 80,80" stroke={secondaryStroke} strokeWidth="1.8" fill="rgba(0, 240, 255, 0.08)" />
          <polygon points="80,142 136,80 80,80" stroke={secondaryStroke} strokeWidth="1.8" fill="rgba(0, 240, 255, 0.06)" />

          {/* Vértices nodales de luz */}
          <circle cx="80" cy="18" r="3" fill="#ffffff" />
          <circle cx="80" cy="142" r="3" fill="#ffffff" />
          <circle cx="24" cy="80" r="3" fill="#ffffff" />
          <circle cx="136" cy="80" r="3" fill="#ffffff" />
        </g>
      )}

      {/* ──────────────── FORMA 3: EL LOBO CYBER-ALFA (🐺) ──────────────── */}
      {shapeId === 'wolf' && (
        <g filter={`url(#${filterId})`}>
          {/* Orejas Puntiagudas Altas Facetadas */}
          <polygon points="80,48 44,14 26,62" stroke={lineColor} strokeWidth="3" strokeLinejoin="round" fill="rgba(0, 14, 24, 0.4)" />
          <polygon points="80,48 116,14 134,62" stroke={lineColor} strokeWidth="3" strokeLinejoin="round" fill="rgba(0, 14, 24, 0.4)" />
          <line x1="44" y1="14" x2="58" y2="48" stroke={secondaryStroke} strokeWidth="1.8" />
          <line x1="44" y1="14" x2="36" y2="54" stroke={secondaryStroke} strokeWidth="1.5" />
          <line x1="116" y1="14" x2="102" y2="48" stroke={secondaryStroke} strokeWidth="1.8" />
          <line x1="116" y1="14" x2="124" y2="54" stroke={secondaryStroke} strokeWidth="1.5" />
          <circle cx="44" cy="14" r="2.5" fill="#ffffff" />
          <circle cx="116" cy="14" r="2.5" fill="#ffffff" />

          {/* Cresta de la Frente */}
          <polygon points="80,26 62,38 80,50 98,38" stroke={lineColor} strokeWidth="2.4" fill="rgba(0, 14, 24, 0.5)" />
          <polygon points="80,50 66,62 80,72 94,62" stroke={lineColor} strokeWidth="2.4" fill="rgba(0, 14, 24, 0.5)" />

          {/* Pómulos en 3 Capas Afiladas y Mandíbula Táctica */}
          <polygon
            points="26,62 36,70 20,76 34,84 26,94 46,102 64,120 80,134 96,120 114,102 134,94 126,84 140,76 124,70 134,62 116,60 80,72 44,60"
            stroke={lineColor}
            strokeWidth="3.2"
            strokeLinejoin="round"
            fill="rgba(0, 14, 24, 0.4)"
          />

          {/* Facetas internas de mejillas */}
          <line x1="44" y1="60" x2="46" y2="102" stroke={secondaryStroke} strokeWidth="1.6" />
          <line x1="116" y1="60" x2="114" y2="102" stroke={secondaryStroke} strokeWidth="1.6" />
          <line x1="34" y1="84" x2="68" y2="94" stroke={secondaryStroke} strokeWidth="1.4" opacity="0.7" />
          <line x1="126" y1="84" x2="92" y2="94" stroke={secondaryStroke} strokeWidth="1.4" opacity="0.7" />

          {/* Puente del Hocico y Nariz */}
          <polygon points="80,72 68,94 80,106 92,94" stroke={lineColor} strokeWidth="2.2" fill="rgba(0, 240, 255, 0.08)" />
          <polygon points="74,98 80,92 86,98 80,104" stroke={lineColor} strokeWidth="2" fill="#ffffff" />
          <line x1="80" y1="104" x2="80" y2="134" stroke={lineColor} strokeWidth="2.4" />
          <line x1="64" y1="120" x2="80" y2="106" stroke={secondaryStroke} strokeWidth="1.8" />
          <line x1="96" y1="120" x2="80" y2="106" stroke={secondaryStroke} strokeWidth="1.8" />
        </g>
      )}

      {/* ──────────────── FORMA 4: EL SABUESO TÁCTICO (🐕) ──────────────── */}
      {shapeId === 'hound' && (
        <g filter={`url(#${filterId})`}>
          {/* Cúpula y Frente Noble */}
          <polygon points="68,26 80,24 92,26 80,38" stroke={lineColor} strokeWidth="2.8" strokeLinejoin="round" fill="rgba(0, 14, 24, 0.5)" />
          <polygon points="80,38 68,48 80,62 92,48" stroke={lineColor} strokeWidth="2.4" fill="rgba(0, 14, 24, 0.5)" />
          <line x1="80" y1="24" x2="80" y2="62" stroke={lineColor} strokeWidth="2.2" />

          {/* Orejas Plegadas Caídas Tácticas (Fieles a la Referencia) */}
          <polygon
            points="68,26 48,38 22,60 24,88 36,112 48,92 56,68"
            stroke={lineColor}
            strokeWidth="3.2"
            strokeLinejoin="round"
            fill="rgba(0, 14, 24, 0.45)"
          />
          <polygon
            points="92,26 112,38 138,60 136,88 124,112 112,92 104,68"
            stroke={lineColor}
            strokeWidth="3.2"
            strokeLinejoin="round"
            fill="rgba(0, 14, 24, 0.45)"
          />
          {/* Pliegues internos de las orejas de sabueso */}
          <line x1="48" y1="38" x2="34" y2="86" stroke={secondaryStroke} strokeWidth="1.8" />
          <line x1="34" y1="86" x2="36" y2="112" stroke={secondaryStroke} strokeWidth="1.8" />
          <line x1="22" y1="60" x2="48" y2="92" stroke={secondaryStroke} strokeWidth="1.4" opacity="0.7" />

          <line x1="112" y1="38" x2="126" y2="86" stroke={secondaryStroke} strokeWidth="1.8" />
          <line x1="126" y1="86" x2="124" y2="112" stroke={secondaryStroke} strokeWidth="1.8" />
          <line x1="138" y1="60" x2="112" y2="92" stroke={secondaryStroke} strokeWidth="1.4" opacity="0.7" />

          {/* Perímetro Facial y Mandíbula */}
          <polygon
            points="56,68 62,94 72,118 80,122 88,118 98,94 104,68"
            stroke={lineColor}
            strokeWidth="2.8"
            strokeLinejoin="round"
            fill="rgba(0, 14, 24, 0.4)"
          />

          {/* Hocico Ancho y Trufa Canina */}
          <polygon points="80,62 70,88 80,110 90,88" stroke={lineColor} strokeWidth="2.2" fill="rgba(0, 240, 255, 0.08)" />
          {/* Nariz característica de Pointer/Hound */}
          <polygon points="74,90 86,90 88,98 80,102 72,98" stroke={lineColor} strokeWidth="2.2" fill="#ffffff" />
          {/* Orificios nasales geométricos */}
          <circle cx="77" cy="95" r="1.2" fill="#000f1a" />
          <circle cx="83" cy="95" r="1.2" fill="#000f1a" />
          <line x1="80" y1="102" x2="80" y2="122" stroke={lineColor} strokeWidth="2" />
          <line x1="72" y1="118" x2="80" y2="110" stroke={secondaryStroke} strokeWidth="1.6" />
          <line x1="88" y1="118" x2="80" y2="110" stroke={secondaryStroke} strokeWidth="1.6" />
        </g>
      )}

      {/* ──────────────── FORMA 5: FELINO SOMBRA (🐈‍⬛) ──────────────── */}
      {shapeId === 'panther' && (
        <g filter={`url(#${filterId})`}>
          {/* Orejas Felinas Afiladas de Ataque */}
          <polygon points="64,44 42,20 28,54" stroke={lineColor} strokeWidth="3" strokeLinejoin="round" fill="rgba(0, 14, 24, 0.45)" />
          <polygon points="96,44 118,20 132,54" stroke={lineColor} strokeWidth="3" strokeLinejoin="round" fill="rgba(0, 14, 24, 0.45)" />
          <line x1="42" y1="20" x2="46" y2="50" stroke={secondaryStroke} strokeWidth="1.6" />
          <line x1="118" y1="20" x2="114" y2="50" stroke={secondaryStroke} strokeWidth="1.6" />
          <circle cx="42" cy="20" r="2.5" fill="#ffffff" />
          <circle cx="118" cy="20" r="2.5" fill="#ffffff" />

          {/* Corona y Pómulos en Rombo (Fiel al Vector) */}
          <line x1="64" y1="44" x2="96" y2="44" stroke={lineColor} strokeWidth="2.4" />
          <line x1="64" y1="44" x2="80" y2="48" stroke={secondaryStroke} strokeWidth="1.6" />
          <line x1="96" y1="44" x2="80" y2="48" stroke={secondaryStroke} strokeWidth="1.6" />

          <polygon
            points="28,54 24,76 46,98 68,114 80,120 92,114 114,98 136,76 132,54"
            stroke={lineColor}
            strokeWidth="3.2"
            strokeLinejoin="round"
            fill="rgba(0, 14, 24, 0.4)"
          />

          {/* Facetas de pómulos altos */}
          <line x1="24" y1="76" x2="48" y2="78" stroke={secondaryStroke} strokeWidth="1.8" />
          <line x1="48" y1="78" x2="46" y2="98" stroke={secondaryStroke} strokeWidth="1.8" />
          <line x1="136" y1="76" x2="112" y2="78" stroke={secondaryStroke} strokeWidth="1.8" />
          <line x1="112" y1="78" x2="114" y2="98" stroke={secondaryStroke} strokeWidth="1.8" />

          {/* Hocico Felino Afilado */}
          <polygon points="80,64 74,88 80,102 86,88" stroke={lineColor} strokeWidth="2.2" fill="rgba(0, 240, 255, 0.08)" />
          {/* Nariz de gato */}
          <polygon points="76,92 84,92 80,98" stroke={lineColor} strokeWidth="2" fill="#ffffff" />
          <line x1="76" y1="98" x2="80" y2="104" stroke={lineColor} strokeWidth="1.8" />
          <line x1="84" y1="98" x2="80" y2="104" stroke={lineColor} strokeWidth="1.8" />
          <line x1="80" y1="104" x2="80" y2="120" stroke={lineColor} strokeWidth="2.2" />
        </g>
      )}

      {/* ──────────────── FORMA 6: EL TITÁN DE MEMORIA (🐘) ──────────────── */}
      {shapeId === 'elephant' && (
        <g filter={`url(#${filterId})`}>
          {/* Corona y Frente del Titán */}
          <polygon points="62,32 80,24 98,32 80,48" stroke={lineColor} strokeWidth="2.8" strokeLinejoin="round" fill="rgba(0, 14, 24, 0.5)" />
          <polygon points="80,48 64,58 80,68 96,58" stroke={lineColor} strokeWidth="2.4" fill="rgba(0, 14, 24, 0.5)" />

          {/* Escudos de Orejas Imponentes (Fiel a la Referencia) */}
          <polygon
            points="62,32 38,36 16,48 18,84 36,104 56,100"
            stroke={lineColor}
            strokeWidth="3.2"
            strokeLinejoin="round"
            fill="rgba(0, 14, 24, 0.45)"
          />
          <polygon
            points="98,32 122,36 144,48 142,84 124,104 104,100"
            stroke={lineColor}
            strokeWidth="3.2"
            strokeLinejoin="round"
            fill="rgba(0, 14, 24, 0.45)"
          />
          {/* Facetas internas de los escudos auriculares */}
          <line x1="38" y1="36" x2="34" y2="76" stroke={secondaryStroke} strokeWidth="1.8" />
          <line x1="34" y1="76" x2="56" y2="100" stroke={secondaryStroke} strokeWidth="1.8" />
          <line x1="122" y1="36" x2="126" y2="76" stroke={secondaryStroke} strokeWidth="1.8" />
          <line x1="126" y1="76" x2="104" y2="100" stroke={secondaryStroke} strokeWidth="1.8" />

          {/* Colmillos de Luz en V (Brillo Supremo Platino/Oro) */}
          <polygon
            points="64,104 52,126 44,138 58,122 68,106"
            stroke="#fffbeb"
            strokeWidth="2.6"
            strokeLinejoin="round"
            fill="rgba(255, 255, 255, 0.4)"
            filter={`url(#${filterId})`}
          />
          <polygon
            points="96,104 108,126 116,138 102,122 92,106"
            stroke="#fffbeb"
            strokeWidth="2.6"
            strokeLinejoin="round"
            fill="rgba(255, 255, 255, 0.4)"
            filter={`url(#${filterId})`}
          />

          {/* Trompa Facetada Segmentada Hacia Abajo */}
          <polygon points="72,68 88,68 86,88 74,88" stroke={lineColor} strokeWidth="2.4" fill="rgba(0, 14, 24, 0.5)" />
          <polygon points="74,88 86,88 84,108 76,108" stroke={lineColor} strokeWidth="2.4" fill="rgba(0, 14, 24, 0.5)" />
          <polygon points="76,108 84,108 83,126 77,126" stroke={lineColor} strokeWidth="2.4" fill="rgba(0, 14, 24, 0.5)" />
          <polygon points="77,126 83,126 82,142 78,142" stroke={lineColor} strokeWidth="2.4" fill="rgba(0, 14, 24, 0.5)" />
          <circle cx="80" cy="142" r="2.5" fill="#ffffff" />
        </g>
      )}

      {/* ──────────────── FORMA 7: CUSTOM / FORJA NEURAL IA (📸) ──────────── */}
      {shapeId === 'custom' && customForm && (
        <g filter={`url(#${filterId})`}>
          {customForm.polygons?.map((p, idx) => (
            <polygon
              key={`poly-${idx}`}
              points={p.points}
              stroke={lineColor}
              strokeWidth="2.2"
              strokeLinejoin="round"
              fill="rgba(0, 14, 24, 0.45)"
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
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          ))}
        </g>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 2. SISTEMA DE OJOS VIVOS Y ANATÓMICOS (SIN COMPARTIR CÓDIGO DEL PRISMA) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* ── CASO 1: EL PRISMA ORIGINAL & CUSTOM INERTE (OJO SAGRADO CENTRAL) ── */}
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
              fill="#000f1a"
              stroke={lineColor}
              strokeWidth="1.6"
              style={isFocusTrance ? { transform: 'translateY(-19px)' } : { animation: 'kai-prism-eyelid-u 4.2s infinite ease-in' }}
            />
            <path
              d="M 46 104 H 114 V 85 C 104 85, 56 85, 46 85 Z"
              fill="#000f1a"
              stroke={lineColor}
              strokeWidth="1.6"
              style={isFocusTrance ? { transform: 'translateY(19px)' } : { animation: 'kai-prism-eyelid-d 4.2s infinite ease-in' }}
            />
          </g>
          <path d="M 50 85 C 60 67, 100 67, 110 85 C 100 103, 60 103, 50 85 Z" stroke={lineColor} strokeWidth="3.6" fill="none" filter={`url(#${filterId})`} />
          <path d="M 50 85 C 60 67, 100 67, 110 85 C 100 103, 60 103, 50 85 Z" stroke="#ffffff" strokeWidth="1.1" fill="none" opacity="0.9" />
        </g>
      )}

      {/* ── CASO 2: NÚCLEO OCTAEDRO (OJO MÍSTICO CÓSMICO CON RESPIRACIÓN CUÁNTICA) ── */}
      {shapeId === 'octahedron' && (
        <g id={`${gradientId}-octa-cosmic-eye`}>
          <path d="M 48 80 C 58 64, 102 64, 112 80 C 102 96, 58 96, 48 80 Z" fill={`url(#${gradientId}-eye-void)`} />
          <g clipPath={`url(#${gradientId}-eye-clip-octa)`}>
            {/* Anillo de Respiración Cósmica */}
            <g
              style={{
                transformOrigin: '80px 80px',
                animation: 'kai-octa-breath 3.6s infinite ease-in-out',
              }}
            >
              <circle cx="80" cy="80" r="14" stroke={lineColor} strokeWidth="2.5" fill="none" filter={`url(#${filterId})`} />
              <circle cx="80" cy="80" r="10" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
              <circle cx="80" cy="80" r="6" fill={lineColor} filter={`url(#${filterId})`} />
              <circle cx="80" cy="80" r="3.2" fill="#ffffff" />
            </g>
            {/* Destello Estelar en Rotación */}
            <g style={{ transformOrigin: '80px 80px', animation: 'kai-octa-star 5s infinite ease-in-out' }}>
              <polygon points="80,72 82,78 88,80 82,82 80,88 78,82 72,80 78,78" fill="#ffffff" opacity="0.9" />
            </g>
          </g>
          <path d="M 48 80 C 58 64, 102 64, 112 80 C 102 96, 58 96, 48 80 Z" stroke={lineColor} strokeWidth="3" fill="none" filter={`url(#${filterId})`} />
          <path d="M 48 80 C 58 64, 102 64, 112 80 C 102 96, 58 96, 48 80 Z" stroke="#ffffff" strokeWidth="1" fill="none" opacity="0.9" />
        </g>
      )}

      {/* ── CASO 3: LOBO CYBER-ALFA (OJOS RASGADOS DE DEPREDADOR CON PARPADEO DIAGONAL) ── */}
      {shapeId === 'wolf' && (
        <g id={`${gradientId}-wolf-living-eyes`}>
          {/* Ojo Izquierdo del Lobo */}
          <polygon points="50,72 60,66 68,70 64,77 52,76" fill={`url(#${gradientId}-eye-void)`} />
          <g
            style={{
              transformOrigin: '59px 71px',
              animation: isFocusTrance ? undefined : 'kai-wolf-hunt-blink 5.4s infinite ease-in-out',
            }}
          >
            <g clipPath={`url(#${gradientId}-wolf-clip-l)`}>
              <polygon points="50,72 60,66 68,70 64,77 52,76" fill={lineColor} opacity="0.25" filter={`url(#${filterId})`} />
              {/* Pupila Fiera con Micro-Sacadas */}
              <g
                style={
                  isTrackingMouse
                    ? { transform: `translate(${eyeOffset.x * 0.6}px, ${eyeOffset.y * 0.5}px)` }
                    : { animation: 'kai-wolf-gaze 6.2s infinite ease-in-out' }
                }
              >
                <circle cx="60" cy="71.5" r="3.2" fill={lineColor} filter={`url(#${filterId})`} />
                <circle cx="60" cy="71.5" r="1.6" fill="#ffffff" />
                <circle cx="61.2" cy="70.5" r="0.7" fill="#ffffff" />
              </g>
            </g>
          </g>
          {/* Contorno Neón Ojo Izquierdo */}
          <polygon points="50,72 60,66 68,70 64,77 52,76" stroke={lineColor} strokeWidth="2.2" strokeLinejoin="round" fill="none" filter={`url(#${filterId})`} />
          <polygon points="50,72 60,66 68,70 64,77 52,76" stroke="#ffffff" strokeWidth="0.8" fill="none" opacity="0.9" />

          {/* Ojo Derecho del Lobo */}
          <polygon points="110,72 100,66 92,70 96,77 108,76" fill={`url(#${gradientId}-eye-void)`} />
          <g
            style={{
              transformOrigin: '101px 71px',
              animation: isFocusTrance ? undefined : 'kai-wolf-hunt-blink 5.4s infinite ease-in-out',
            }}
          >
            <g clipPath={`url(#${gradientId}-wolf-clip-r)`}>
              <polygon points="110,72 100,66 92,70 96,77 108,76" fill={lineColor} opacity="0.25" filter={`url(#${filterId})`} />
              {/* Pupila Fiera con Micro-Sacadas */}
              <g
                style={
                  isTrackingMouse
                    ? { transform: `translate(${eyeOffset.x * 0.6}px, ${eyeOffset.y * 0.5}px)` }
                    : { animation: 'kai-wolf-gaze 6.2s infinite ease-in-out' }
                }
              >
                <circle cx="100" cy="71.5" r="3.2" fill={lineColor} filter={`url(#${filterId})`} />
                <circle cx="100" cy="71.5" r="1.6" fill="#ffffff" />
                <circle cx="98.8" cy="70.5" r="0.7" fill="#ffffff" />
              </g>
            </g>
          </g>
          {/* Contorno Neón Ojo Derecho */}
          <polygon points="110,72 100,66 92,70 96,77 108,76" stroke={lineColor} strokeWidth="2.2" strokeLinejoin="round" fill="none" filter={`url(#${filterId})`} />
          <polygon points="110,72 100,66 92,70 96,77 108,76" stroke="#ffffff" strokeWidth="0.8" fill="none" opacity="0.9" />
        </g>
      )}

      {/* ── CASO 4: SABUESO TÁCTICO (OJOS NOBLES REDONDEADOS CON DESTELLO ESPECULAR) ── */}
      {shapeId === 'hound' && (
        <g id={`${gradientId}-hound-living-eyes`}>
          {/* Ojo Izquierdo del Sabueso */}
          <ellipse cx="64" cy="70" rx="6.5" ry="5.5" fill={`url(#${gradientId}-eye-void)`} />
          <g
            style={{
              transformOrigin: '64px 70px',
              animation: isFocusTrance ? undefined : 'kai-hound-blink 4.8s infinite ease-in-out',
            }}
          >
            <g clipPath={`url(#${gradientId}-hound-clip-l)`}>
              <ellipse cx="64" cy="70" rx="6.5" ry="5.5" fill={lineColor} opacity="0.2" />
              {/* Pupila Leal con Brillo Especular */}
              <g
                style={
                  isTrackingMouse
                    ? { transform: `translate(${eyeOffset.x * 0.55}px, ${eyeOffset.y * 0.55}px)` }
                    : { animation: 'kai-hound-gaze 5.6s infinite ease-in-out' }
                }
              >
                <circle cx="64" cy="70" r="3.4" fill={lineColor} filter={`url(#${filterId})`} />
                <circle cx="64" cy="70" r="1.8" fill="#000e17" />
                {/* Destello de inteligencia noble (brillo especular blanco) */}
                <circle cx="65.4" cy="68.6" r="1.1" fill="#ffffff" />
                <circle cx="63.2" cy="71.2" r="0.6" fill="#ffffff" opacity="0.85" />
              </g>
            </g>
          </g>
          <ellipse cx="64" cy="70" rx="6.5" ry="5.5" stroke={lineColor} strokeWidth="2.2" fill="none" filter={`url(#${filterId})`} />
          <ellipse cx="64" cy="70" rx="6.5" ry="5.5" stroke="#ffffff" strokeWidth="0.8" fill="none" opacity="0.9" />

          {/* Ojo Derecho del Sabueso */}
          <ellipse cx="96" cy="70" rx="6.5" ry="5.5" fill={`url(#${gradientId}-eye-void)`} />
          <g
            style={{
              transformOrigin: '96px 70px',
              animation: isFocusTrance ? undefined : 'kai-hound-blink 4.8s infinite ease-in-out',
            }}
          >
            <g clipPath={`url(#${gradientId}-hound-clip-r)`}>
              <ellipse cx="96" cy="70" rx="6.5" ry="5.5" fill={lineColor} opacity="0.2" />
              {/* Pupila Leal con Brillo Especular */}
              <g
                style={
                  isTrackingMouse
                    ? { transform: `translate(${eyeOffset.x * 0.55}px, ${eyeOffset.y * 0.55}px)` }
                    : { animation: 'kai-hound-gaze 5.6s infinite ease-in-out' }
                }
              >
                <circle cx="96" cy="70" r="3.4" fill={lineColor} filter={`url(#${filterId})`} />
                <circle cx="96" cy="70" r="1.8" fill="#000e17" />
                {/* Destello especular */}
                <circle cx="97.4" cy="68.6" r="1.1" fill="#ffffff" />
                <circle cx="95.2" cy="71.2" r="0.6" fill="#ffffff" opacity="0.85" />
              </g>
            </g>
          </g>
          <ellipse cx="96" cy="70" rx="6.5" ry="5.5" stroke={lineColor} strokeWidth="2.2" fill="none" filter={`url(#${filterId})`} />
          <ellipse cx="96" cy="70" rx="6.5" ry="5.5" stroke="#ffffff" strokeWidth="0.8" fill="none" opacity="0.9" />
        </g>
      )}

      {/* ── CASO 5: FELINO SOMBRA (CUÑA AFILADA CON SLOW-BLINK FELINO & PUPILA VERTICAL) ── */}
      {shapeId === 'panther' && (
        <g id={`${gradientId}-feline-living-eyes`}>
          {/* Ojo Izquierdo del Felino */}
          <polygon points="44,68 66,76 60,82 46,76" fill={`url(#${gradientId}-eye-void)`} />
          <g
            style={{
              transformOrigin: '55px 75px',
              animation: isFocusTrance ? undefined : 'kai-feline-slow-blink 6.8s infinite ease-in-out',
            }}
          >
            <g clipPath={`url(#${gradientId}-feline-clip-l)`}>
              {/* Brasa de Neón Láser */}
              <polygon points="44,68 66,76 60,82 46,76" fill={lineColor} opacity="0.45" filter={`url(#${filterId})`} />
              <polygon points="44,68 66,76 60,82 46,76" fill="#ffffff" opacity="0.25" />
              {/* Pupila Vertical con Dilatación Felina */}
              <g
                style={{
                  transformOrigin: '55px 75px',
                  animation: 'kai-feline-slit 4.2s infinite ease-in-out',
                }}
              >
                <ellipse cx="55" cy="75" rx="1.3" ry="4.5" fill="#000e17" />
                <circle cx="56.2" cy="73.8" r="0.7" fill="#ffffff" />
              </g>
            </g>
          </g>
          <polygon points="44,68 66,76 60,82 46,76" stroke={lineColor} strokeWidth="2.4" strokeLinejoin="round" fill="none" filter={`url(#${filterId})`} />
          <polygon points="44,68 66,76 60,82 46,76" stroke="#ffffff" strokeWidth="0.9" fill="none" opacity="0.95" />

          {/* Ojo Derecho del Felino */}
          <polygon points="116,68 94,76 100,82 114,76" fill={`url(#${gradientId}-eye-void)`} />
          <g
            style={{
              transformOrigin: '105px 75px',
              animation: isFocusTrance ? undefined : 'kai-feline-slow-blink 6.8s infinite ease-in-out',
            }}
          >
            <g clipPath={`url(#${gradientId}-feline-clip-r)`}>
              {/* Brasa de Neón Láser */}
              <polygon points="116,68 94,76 100,82 114,76" fill={lineColor} opacity="0.45" filter={`url(#${filterId})`} />
              <polygon points="116,68 94,76 100,82 114,76" fill="#ffffff" opacity="0.25" />
              {/* Pupila Vertical con Dilatación Felina */}
              <g
                style={{
                  transformOrigin: '105px 75px',
                  animation: 'kai-feline-slit 4.2s infinite ease-in-out',
                }}
              >
                <ellipse cx="105" cy="75" rx="1.3" ry="4.5" fill="#000e17" />
                <circle cx="103.8" cy="73.8" r="0.7" fill="#ffffff" />
              </g>
            </g>
          </g>
          <polygon points="116,68 94,76 100,82 114,76" stroke={lineColor} strokeWidth="2.4" strokeLinejoin="round" fill="none" filter={`url(#${filterId})`} />
          <polygon points="116,68 94,76 100,82 114,76" stroke="#ffffff" strokeWidth="0.9" fill="none" opacity="0.95" />
        </g>
      )}

      {/* ── CASO 6: TITÁN DE MEMORIA (OJOS PROFUNDOS MILENARIOS BAJO EL CEÑO) ── */}
      {shapeId === 'elephant' && (
        <g id={`${gradientId}-titan-living-eyes`}>
          {/* Ojo Izquierdo del Titán */}
          <polygon points="61,74 66,71 71,74 66,77" fill={`url(#${gradientId}-eye-void)`} />
          <g
            style={{
              transformOrigin: '66px 74px',
              animation: isFocusTrance ? undefined : 'kai-titan-blink 8.4s infinite ease-in-out',
            }}
          >
            <g clipPath={`url(#${gradientId}-titan-clip-l)`}>
              <polygon points="61,74 66,71 71,74 66,77" fill={lineColor} opacity="0.4" filter={`url(#${filterId})`} />
              <circle cx="66" cy="74" r="2.2" fill={lineColor} />
              <circle cx="66" cy="74" r="1.1" fill="#ffffff" />
            </g>
          </g>
          <polygon points="61,74 66,71 71,74 66,77" stroke={lineColor} strokeWidth="1.8" strokeLinejoin="round" fill="none" filter={`url(#${filterId})`} />
          <polygon points="61,74 66,71 71,74 66,77" stroke="#ffffff" strokeWidth="0.7" fill="none" opacity="0.9" />

          {/* Ojo Derecho del Titán */}
          <polygon points="99,74 94,71 89,74 94,77" fill={`url(#${gradientId}-eye-void)`} />
          <g
            style={{
              transformOrigin: '94px 74px',
              animation: isFocusTrance ? undefined : 'kai-titan-blink 8.4s infinite ease-in-out',
            }}
          >
            <g clipPath={`url(#${gradientId}-titan-clip-r)`}>
              <polygon points="99,74 94,71 89,74 94,77" fill={lineColor} opacity="0.4" filter={`url(#${filterId})`} />
              <circle cx="94" cy="74" r="2.2" fill={lineColor} />
              <circle cx="94" cy="74" r="1.1" fill="#ffffff" />
            </g>
          </g>
          <polygon points="99,74 94,71 89,74 94,77" stroke={lineColor} strokeWidth="1.8" strokeLinejoin="round" fill="none" filter={`url(#${filterId})`} />
          <polygon points="99,74 94,71 89,74 94,77" stroke="#ffffff" strokeWidth="0.7" fill="none" opacity="0.9" />
        </g>
      )}
    </svg>
  );
};
