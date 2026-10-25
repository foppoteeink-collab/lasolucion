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

        {/* ─── CLIPS PARA OJOS ─── */}
        {/* Clip del Ojo Central (Prisma, Octaedro, Neural IA) centrado en (80, 85) */}
        <clipPath id={`${gradientId}-eye-clip-center`}>
          <path d="M 50 85 C 60 67, 100 67, 110 85 C 100 103, 60 103, 50 85 Z" />
        </clipPath>

        {/* Clip Ojo Izquierdo para animales (Lobo, Sabueso, Pantera, Elefante) */}
        <clipPath id={`${gradientId}-eye-clip-left`}>
          <path d="M 51 77 C 55 69, 71 69, 75 77 C 71 85, 55 85, 51 77 Z" />
        </clipPath>

        {/* Clip Ojo Derecho para animales */}
        <clipPath id={`${gradientId}-eye-clip-right`}>
          <path d="M 85 77 C 89 69, 105 69, 109 77 C 105 85, 89 85, 85 77 Z" />
        </clipPath>
      </defs>

      {/* ─── ANIMACIONES CSS DEL OJO: PÁRPADOS QUE PARPADEAN Y PUPILA QUE MIRA ─── */}
      <style>
        {`
          @keyframes kai-look-around {
            0% { transform: translate(0px, 0px); }
            5% { transform: translate(3.8px, -1.8px); }
            10% { transform: translate(3.8px, -1.8px); }
            15% { transform: translate(-4.2px, -1.6px); }
            20% { transform: translate(-4.2px, -1.6px); }
            25% { transform: translate(0px, 0px); }
            100% { transform: translate(0px, 0px); }
          }

          @keyframes kai-eyelid-upper {
            0% { transform: translateY(-19px); }
            90% { transform: translateY(-19px); }
            92.5% { transform: translateY(0px); }
            95% { transform: translateY(-19px); }
            97.5% { transform: translateY(0px); }
            100% { transform: translateY(-19px); }
          }

          @keyframes kai-eyelid-lower {
            0% { transform: translateY(19px); }
            90% { transform: translateY(19px); }
            92.5% { transform: translateY(0px); }
            95% { transform: translateY(19px); }
            97.5% { transform: translateY(0px); }
            100% { transform: translateY(19px); }
          }

          @keyframes kai-eyelid-dual-upper {
            0% { transform: translateY(-12px); }
            90% { transform: translateY(-12px); }
            92.5% { transform: translateY(0px); }
            95% { transform: translateY(-12px); }
            97.5% { transform: translateY(0px); }
            100% { transform: translateY(-12px); }
          }

          @keyframes kai-eyelid-dual-lower {
            0% { transform: translateY(12px); }
            90% { transform: translateY(12px); }
            92.5% { transform: translateY(0px); }
            95% { transform: translateY(12px); }
            97.5% { transform: translateY(0px); }
            100% { transform: translateY(12px); }
          }

          .kai-pupil-idle {
            animation: kai-look-around 4.2s infinite ease-in-out;
          }

          .kai-upper-lid {
            animation: kai-eyelid-upper 4.2s infinite ease-in;
          }

          .kai-lower-lid {
            animation: kai-eyelid-lower 4.2s infinite ease-in;
          }

          .kai-dual-upper-lid {
            animation: kai-eyelid-dual-upper 4.2s infinite ease-in;
          }

          .kai-dual-lower-lid {
            animation: kai-eyelid-dual-lower 4.2s infinite ease-in;
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

      {/* ─── 1. RENDERIZADO DEL CUERPO SEGÚN LA FORMA SELECCIONADA ─── */}

      {/* ──────────────── FORMA 1: EL PRISMA ORIGINAL (🔺) ──────────────── */}
      {shapeId === 'prism' && (
        <g filter={`url(#${filterId})`}>
          {/* Pirámide Principal con Relleno de Cristal Profundo */}
          <polygon
            points="80,22 138,128 22,128"
            stroke={lineColor}
            strokeWidth="4"
            strokeLinejoin="round"
            fill="rgba(0, 14, 24, 0.45)"
          />

          {/* Línea Central Superior e Inferior */}
          <line x1="80" y1="22" x2="80" y2="70" stroke={lineColor} strokeWidth="3.2" strokeLinecap="round" />
          <line x1="80" y1="99" x2="80" y2="128" stroke={lineColor} strokeWidth="3.2" strokeLinecap="round" />

          {/* Facetas de Cristal Interiores */}
          <line x1="80" y1="22" x2="50" y2="85" stroke={secondaryStroke} strokeWidth="1.6" opacity="0.75" />
          <line x1="80" y1="22" x2="110" y2="85" stroke={secondaryStroke} strokeWidth="1.6" opacity="0.75" />
          <line x1="50" y1="85" x2="22" y2="128" stroke={secondaryStroke} strokeWidth="1.6" opacity="0.75" />
          <line x1="110" y1="85" x2="138" y2="128" stroke={secondaryStroke} strokeWidth="1.6" opacity="0.75" />
          <line x1="50" y1="85" x2="80" y2="128" stroke={secondaryStroke} strokeWidth="1.8" opacity="0.8" />
          <line x1="110" y1="85" x2="80" y2="128" stroke={secondaryStroke} strokeWidth="1.8" opacity="0.8" />

          {/* Nodo Cuántico Superior */}
          <circle cx="80" cy="22" r="3.5" fill="#ffffff" />
        </g>
      )}

      {/* ──────────────── FORMA 2: EL NÚCLEO OCTAEDRO (💠) ──────────────── */}
      {shapeId === 'octahedron' && (
        <g filter={`url(#${filterId})`}>
          {/* Rombo Exterior 3D */}
          <polygon
            points="80,24 132,85 80,146 28,85"
            stroke={lineColor}
            strokeWidth="3.8"
            strokeLinejoin="round"
            fill="rgba(0, 14, 24, 0.45)"
          />

          {/* Facetas Tridimensionales de Octaedro */}
          <polygon points="80,24 132,85 80,85" stroke={secondaryStroke} strokeWidth="1.8" fill="rgba(0, 240, 255, 0.05)" />
          <polygon points="80,24 28,85 80,85" stroke={secondaryStroke} strokeWidth="1.8" fill="rgba(0, 240, 255, 0.08)" />
          <polygon points="80,146 132,85 80,85" stroke={secondaryStroke} strokeWidth="1.8" fill="rgba(0, 240, 255, 0.08)" />
          <polygon points="80,146 28,85 80,85" stroke={secondaryStroke} strokeWidth="1.8" fill="rgba(0, 240, 255, 0.05)" />

          {/* Vértices de energía */}
          <circle cx="80" cy="24" r="3" fill="#ffffff" />
          <circle cx="80" cy="146" r="3" fill="#ffffff" />
          <circle cx="28" cy="85" r="3" fill="#ffffff" />
          <circle cx="132" cy="85" r="3" fill="#ffffff" />
        </g>
      )}

      {/* ──────────────── FORMA 3: EL LOBO CYBER-ALFA (🐺) ──────────────── */}
      {shapeId === 'wolf' && (
        <g filter={`url(#${filterId})`}>
          {/* Orejas Puntiagudas Altas */}
          <polygon points="80,48 54,16 38,54" stroke={lineColor} strokeWidth="3" strokeLinejoin="round" fill="rgba(0, 14, 24, 0.4)" />
          <polygon points="80,48 106,16 122,54" stroke={lineColor} strokeWidth="3" strokeLinejoin="round" fill="rgba(0, 14, 24, 0.4)" />
          <line x1="54" y1="16" x2="48" y2="52" stroke={secondaryStroke} strokeWidth="1.5" />
          <line x1="106" y1="16" x2="112" y2="52" stroke={secondaryStroke} strokeWidth="1.5" />

          {/* Frente y Cresta */}
          <polygon points="54,50 80,42 106,50 80,62" stroke={lineColor} strokeWidth="2.5" fill="rgba(0, 14, 24, 0.5)" />

          {/* Pómulos Agresivos y Mandíbula */}
          <polygon points="38,54 26,82 48,110 74,128 80,134 86,128 112,110 134,82 122,54 106,50 80,62 54,50" stroke={lineColor} strokeWidth="3.2" strokeLinejoin="round" fill="rgba(0, 14, 24, 0.4)" />

          {/* Hocico y Nariz Táctica */}
          <polygon points="80,62 70,100 80,116 90,100" stroke={lineColor} strokeWidth="2.2" fill="rgba(0, 240, 255, 0.08)" />
          <line x1="74" y1="128" x2="80" y2="116" stroke={secondaryStroke} strokeWidth="2" />
          <line x1="86" y1="128" x2="80" y2="116" stroke={secondaryStroke} strokeWidth="2" />

          {/* Puntas de Luz en Orejas */}
          <circle cx="54" cy="16" r="2.5" fill="#ffffff" />
          <circle cx="106" cy="16" r="2.5" fill="#ffffff" />
        </g>
      )}

      {/* ──────────────── FORMA 4: EL SABUESO TÁCTICO (🐕) ──────────────── */}
      {shapeId === 'hound' && (
        <g filter={`url(#${filterId})`}>
          {/* Orejas Plegadas Tácticas */}
          <polygon points="62,38 32,42 26,88 48,80" stroke={lineColor} strokeWidth="3" strokeLinejoin="round" fill="rgba(0, 14, 24, 0.4)" />
          <polygon points="98,38 128,42 134,88 112,80" stroke={lineColor} strokeWidth="3" strokeLinejoin="round" fill="rgba(0, 14, 24, 0.4)" />

          {/* Corona de la Cabeza */}
          <polygon points="62,38 80,32 98,38 80,52" stroke={lineColor} strokeWidth="2.8" fill="rgba(0, 14, 24, 0.5)" />

          {/* Mejillas y Mandíbula Noble */}
          <polygon points="48,80 58,110 74,126 80,132 86,126 102,110 112,80 98,38 62,38" stroke={lineColor} strokeWidth="3" strokeLinejoin="round" fill="rgba(0, 14, 24, 0.4)" />

          {/* Puente del Hocico Recto */}
          <polygon points="80,52 68,94 80,118 92,94" stroke={lineColor} strokeWidth="2.2" fill="rgba(0, 240, 255, 0.08)" />
          <polygon points="74,112 80,120 86,112" stroke={secondaryStroke} strokeWidth="1.8" fill="#ffffff" />
        </g>
      )}

      {/* ──────────────── FORMA 5: LA PANTERA NEÓN (🐈‍⬛) ──────────────── */}
      {shapeId === 'panther' && (
        <g filter={`url(#${filterId})`}>
          {/* Orejas Afiladas de Felino */}
          <polygon points="72,42 46,18 38,50" stroke={lineColor} strokeWidth="2.8" strokeLinejoin="round" fill="rgba(0, 14, 24, 0.4)" />
          <polygon points="88,42 114,18 122,50" stroke={lineColor} strokeWidth="2.8" strokeLinejoin="round" fill="rgba(0, 14, 24, 0.4)" />

          {/* Frente y Contorno Facial Delgado */}
          <polygon points="46,50 80,44 114,50 80,60" stroke={lineColor} strokeWidth="2.4" fill="rgba(0, 14, 24, 0.5)" />
          <polygon points="38,50 24,78 48,106 74,124 80,130 86,124 112,106 136,78 122,50 114,50 80,60 46,50" stroke={lineColor} strokeWidth="3.2" strokeLinejoin="round" fill="rgba(0, 14, 24, 0.4)" />

          {/* Hocico Felino Minimalista */}
          <polygon points="80,60 72,92 80,108 88,92" stroke={lineColor} strokeWidth="2" fill="rgba(0, 240, 255, 0.06)" />
          
          {/* Bigotes / Tomas de Energía Laterales */}
          <line x1="38" y1="94" x2="16" y2="92" stroke={secondaryStroke} strokeWidth="1.2" opacity="0.6" />
          <line x1="42" y1="102" x2="20" y2="104" stroke={secondaryStroke} strokeWidth="1.2" opacity="0.6" />
          <line x1="122" y1="94" x2="144" y2="92" stroke={secondaryStroke} strokeWidth="1.2" opacity="0.6" />
          <line x1="118" y1="102" x2="140" y2="104" stroke={secondaryStroke} strokeWidth="1.2" opacity="0.6" />
        </g>
      )}

      {/* ──────────────── FORMA 6: EL TITÁN DE MEMORIA (🐘) ──────────────── */}
      {shapeId === 'elephant' && (
        <g filter={`url(#${filterId})`}>
          {/* Orejas Escudo Imponentes */}
          <polygon points="66,36 22,42 14,92 46,110" stroke={lineColor} strokeWidth="3" strokeLinejoin="round" fill="rgba(0, 14, 24, 0.4)" />
          <polygon points="94,36 138,42 146,92 114,110" stroke={lineColor} strokeWidth="3" strokeLinejoin="round" fill="rgba(0, 14, 24, 0.4)" />
          <line x1="22" y1="42" x2="42" y2="90" stroke={secondaryStroke} strokeWidth="1.5" opacity="0.7" />
          <line x1="138" y1="42" x2="118" y2="90" stroke={secondaryStroke} strokeWidth="1.5" opacity="0.7" />

          {/* Corona y Frente del Titán */}
          <polygon points="66,36 80,24 94,36 80,56" stroke={lineColor} strokeWidth="3" fill="rgba(0, 14, 24, 0.5)" />

          {/* Colmillos de Luz */}
          <polygon points="52,106 38,128 58,118" stroke={lineColor} strokeWidth="2.2" fill="rgba(255, 255, 255, 0.25)" />
          <polygon points="108,106 122,128 102,118" stroke={lineColor} strokeWidth="2.2" fill="rgba(255, 255, 255, 0.25)" />

          {/* Trompa Facetada */}
          <polygon points="72,78 88,78 84,110 76,110" stroke={lineColor} strokeWidth="2.2" fill="rgba(0, 14, 24, 0.5)" />
          <polygon points="76,110 84,110 82,132 78,132" stroke={lineColor} strokeWidth="2.2" fill="rgba(0, 14, 24, 0.5)" />
          <circle cx="80" cy="132" r="3" fill={lineColor} />
        </g>
      )}

      {/* ──────────────── FORMA CUSTOM: FORJA NEURAL IA (📸) ──────────────── */}
      {shapeId === 'custom' && customForm && (
        <g filter={`url(#${filterId})`}>
          {/* Polígonos de silueta procesados por IA */}
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

          {/* Líneas geométricas de la IA */}
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

      {/* ─── 2. EL OJO SAGRADO DE KAI (SISTEMA DE MIRADA Y PÁRPADOS QUE PARPADEAN) ─── */}

      {/* ──────── CASO A: OJO CENTRAL (PRISMA, OCTAEDRO O FORJA NEURAL IA) ──────── */}
      {(shapeId === 'prism' || shapeId === 'octahedron' || shapeId === 'custom') && (
        <g id={`${gradientId}-central-living-eye`}>
          {/* Fondo del Ojo Almendrado */}
          <path
            d="M 50 85 C 60 67, 100 67, 110 85 C 100 103, 60 103, 50 85 Z"
            fill={`url(#${gradientId}-eye-void)`}
          />

          {/* Contenido enmascarado: Pupila, Iris y Párpados que parpadean */}
          <g clipPath={`url(#${gradientId}-eye-clip-center)`}>
            {/* GRUPO DE PUPILA E IRIS (MIRA ALREDEDOR Y SIGUE AL MOUSE) */}
            <g
              className={!isTrackingMouse ? 'kai-pupil-idle' : ''}
              style={
                isTrackingMouse
                  ? {
                      transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
                      transition: 'transform 0.12s ease-out',
                    }
                  : undefined
              }
            >
              {/* Aro de Iris Neón */}
              <circle
                cx="80"
                cy="85"
                r={justClicked ? 14.5 : 13}
                stroke={lineColor}
                strokeWidth="3.2"
                fill="none"
                filter={`url(#${filterId})`}
              />
              <circle cx="80" cy="85" r={justClicked ? 14.5 : 13} stroke="#ffffff" strokeWidth="1.2" fill="none" />

              {/* Pupila Central Brillante */}
              <circle cx="80" cy="85" r={justClicked ? 7.5 : 6} fill={lineColor} filter={`url(#${filterId})`} />
              <circle cx="80" cy="85" r={justClicked ? 4.2 : 3} fill="#ffffff" />

              {/* Destello de Luz Sagrado */}
              <circle cx="82.4" cy="82.6" r="1.5" fill="#ffffff" opacity="0.9" />
            </g>

            {/* PÁRPADO SUPERIOR ANIMADO (SE CIERRA CADA 4 SEGUNDOS) */}
            <path
              d="M 46 66 H 114 V 85 C 104 85, 56 85, 46 85 Z"
              fill="#000f1a"
              stroke={lineColor}
              strokeWidth="1.6"
              className={!isFocusTrance ? 'kai-upper-lid' : ''}
              style={isFocusTrance ? { transform: 'translateY(-19px)' } : undefined}
            />

            {/* PÁRPADO INFERIOR ANIMADO (SE CIERRA AL CENTRO CON EL SUPERIOR) */}
            <path
              d="M 46 104 H 114 V 85 C 104 85, 56 85, 46 85 Z"
              fill="#000f1a"
              stroke={lineColor}
              strokeWidth="1.6"
              className={!isFocusTrance ? 'kai-lower-lid' : ''}
              style={isFocusTrance ? { transform: 'translateY(19px)' } : undefined}
            />
          </g>

          {/* Contorno Exterior del Ojo en Neón Radiante */}
          <path
            d="M 50 85 C 60 67, 100 67, 110 85 C 100 103, 60 103, 50 85 Z"
            stroke={lineColor}
            strokeWidth="3.6"
            fill="none"
            filter={`url(#${filterId})`}
          />
          <path
            d="M 50 85 C 60 67, 100 67, 110 85 C 100 103, 60 103, 50 85 Z"
            stroke="#ffffff"
            strokeWidth="1.1"
            fill="none"
            opacity="0.9"
          />
        </g>
      )}

      {/* ──────── CASO B: DOS OJOS VIVOS (LOBO, SABUESO, PANTERA, ELEFANTE) ──────── */}
      {(shapeId === 'wolf' || shapeId === 'hound' || shapeId === 'panther' || shapeId === 'elephant') && (
        <g id={`${gradientId}-dual-living-eyes`}>
          {/* ── OJO IZQUIERDO ── */}
          <path d="M 51 77 C 55 69, 71 69, 75 77 C 71 85, 55 85, 51 77 Z" fill={`url(#${gradientId}-eye-void)`} />
          <g clipPath={`url(#${gradientId}-eye-clip-left)`}>
            {/* Pupila Izquierda que mira alrededor */}
            <g
              className={!isTrackingMouse ? 'kai-pupil-idle' : ''}
              style={
                isTrackingMouse
                  ? {
                      transform: `translate(${eyeOffset.x * 0.75}px, ${eyeOffset.y * 0.75}px)`,
                      transition: 'transform 0.12s ease-out',
                    }
                  : undefined
              }
            >
              <circle cx="63" cy="77" r="7" stroke={lineColor} strokeWidth="2" fill="none" filter={`url(#${filterId})`} />
              <circle cx="63" cy="77" r="3.5" fill={lineColor} filter={`url(#${filterId})`} />
              <circle cx="63" cy="77" r="1.8" fill="#ffffff" />
              <circle cx="64.2" cy="75.8" r="0.8" fill="#ffffff" />
            </g>

            {/* Párpados que parpadean Ojo Izquierdo */}
            <path
              d="M 48 65 H 78 V 77 C 72 77, 56 77, 48 77 Z"
              fill="#000f1a"
              stroke={lineColor}
              strokeWidth="1.4"
              className={!isFocusTrance ? 'kai-dual-upper-lid' : ''}
              style={isFocusTrance ? { transform: 'translateY(-12px)' } : undefined}
            />
            <path
              d="M 48 89 H 78 V 77 C 72 77, 56 77, 48 77 Z"
              fill="#000f1a"
              stroke={lineColor}
              strokeWidth="1.4"
              className={!isFocusTrance ? 'kai-dual-lower-lid' : ''}
              style={isFocusTrance ? { transform: 'translateY(12px)' } : undefined}
            />
          </g>
          {/* Contorno Neón Ojo Izquierdo */}
          <path
            d="M 51 77 C 55 69, 71 69, 75 77 C 71 85, 55 85, 51 77 Z"
            stroke={lineColor}
            strokeWidth="2.4"
            fill="none"
            filter={`url(#${filterId})`}
          />
          <path d="M 51 77 C 55 69, 71 69, 75 77 C 71 85, 55 85, 51 77 Z" stroke="#ffffff" strokeWidth="0.8" fill="none" opacity="0.9" />

          {/* ── OJO DERECHO ── */}
          <path d="M 85 77 C 89 69, 105 69, 109 77 C 105 85, 89 85, 85 77 Z" fill={`url(#${gradientId}-eye-void)`} />
          <g clipPath={`url(#${gradientId}-eye-clip-right)`}>
            {/* Pupila Derecha que mira alrededor */}
            <g
              className={!isTrackingMouse ? 'kai-pupil-idle' : ''}
              style={
                isTrackingMouse
                  ? {
                      transform: `translate(${eyeOffset.x * 0.75}px, ${eyeOffset.y * 0.75}px)`,
                      transition: 'transform 0.12s ease-out',
                    }
                  : undefined
              }
            >
              <circle cx="97" cy="77" r="7" stroke={lineColor} strokeWidth="2" fill="none" filter={`url(#${filterId})`} />
              <circle cx="97" cy="77" r="3.5" fill={lineColor} filter={`url(#${filterId})`} />
              <circle cx="97" cy="77" r="1.8" fill="#ffffff" />
              <circle cx="98.2" cy="75.8" r="0.8" fill="#ffffff" />
            </g>

            {/* Párpados que parpadean Ojo Derecho */}
            <path
              d="M 82 65 H 112 V 77 C 106 77, 90 77, 82 77 Z"
              fill="#000f1a"
              stroke={lineColor}
              strokeWidth="1.4"
              className={!isFocusTrance ? 'kai-dual-upper-lid' : ''}
              style={isFocusTrance ? { transform: 'translateY(-12px)' } : undefined}
            />
            <path
              d="M 82 89 H 112 V 77 C 106 77, 90 77, 82 77 Z"
              fill="#000f1a"
              stroke={lineColor}
              strokeWidth="1.4"
              className={!isFocusTrance ? 'kai-dual-lower-lid' : ''}
              style={isFocusTrance ? { transform: 'translateY(12px)' } : undefined}
            />
          </g>
          {/* Contorno Neón Ojo Derecho */}
          <path
            d="M 85 77 C 89 69, 105 69, 109 77 C 105 85, 89 85, 85 77 Z"
            stroke={lineColor}
            strokeWidth="2.4"
            fill="none"
            filter={`url(#${filterId})`}
          />
          <path d="M 85 77 C 89 69, 105 69, 109 77 C 105 85, 89 85, 85 77 Z" stroke="#ffffff" strokeWidth="0.8" fill="none" opacity="0.9" />
        </g>
      )}
    </svg>
  );
};
