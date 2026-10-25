import React from 'react';
import { KaiShapeKey, KaiCustomForm } from '../types';

interface KaiVectorGraphicsProps {
  shapeId: KaiShapeKey;
  activeColor: string;
  secondaryColor: string;
  glowFilterId: string;
  isHovered?: boolean;
  justClicked?: boolean;
  eyeOffset?: { x: number; y: number };
  isTrackingMouse?: boolean;
  isFocusTrance?: boolean;
  has21Days?: boolean;
  has66Days?: boolean;
  ascensionCrystalsCount?: number;
  customForm?: KaiCustomForm | null;
}

export const KaiVectorGraphics: React.FC<KaiVectorGraphicsProps> = ({
  shapeId,
  activeColor,
  secondaryColor,
  glowFilterId,
  isHovered = false,
  justClicked = false,
  eyeOffset = { x: 0, y: 0 },
  isTrackingMouse = false,
  isFocusTrance = false,
  has21Days = false,
  has66Days = false,
  ascensionCrystalsCount = 0,
  customForm,
}) => {
  // If 66 days reached, lines shimmer in golden/platinum sovereign master glory
  const lineColor = has66Days ? '#fbbf24' : activeColor;
  const secondaryStroke = has66Days ? '#f59e0b' : secondaryColor;

  return (
    <svg
      viewBox="0 0 120 120"
      width="100%"
      height="100%"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="overflow-visible select-none pointer-events-none"
    >
      <defs>
        {/* Filtro Bloom Neón */}
        <filter id={glowFilterId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={has66Days ? 3.0 : 2.0} result="blur1" />
          <feMerge>
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Gradiente Radial para núcleos */}
        <radialGradient id={`coreGrad-${glowFilterId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="50%" stopColor={lineColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor="#000714" stopOpacity="0.95" />
        </radialGradient>
      </defs>

      {/* ─── 0. SUELO CUÁNTICO & SOMBRA DE LEVITACIÓN ─── */}
      <g opacity={0.85}>
        <line x1="34" y1="112" x2="86" y2="112" stroke={lineColor} strokeWidth="0.8" opacity="0.3" />
        <ellipse
          cx="60"
          cy="110"
          rx="32"
          ry="4.5"
          fill={lineColor}
          opacity={has66Days ? 0.65 : 0.45}
          filter={`url(#${glowFilterId})`}
        />
        <ellipse cx="60" cy="110" rx="16" ry="2.2" fill="#ffffff" opacity="0.8" />
      </g>

      {/* ─── 0.1 ANILLO ORBITAL DE NEUROPLASTICIDAD (21 DÍAS) ─── */}
      {has21Days && (
        <g opacity="0.85">
          <ellipse
            cx="60"
            cy="60"
            rx="52"
            ry="24"
            fill="none"
            stroke={lineColor}
            strokeWidth="1.2"
            strokeDasharray="4 6"
            className="animate-spin"
            style={{ animationDuration: '14s', transformOrigin: '60px 60px' }}
            filter={`url(#${glowFilterId})`}
          />
          {/* Micro-partícula rotatoria en el anillo */}
          <circle
            cx="112"
            cy="60"
            r="2.5"
            fill="#ffffff"
            filter={`url(#${glowFilterId})`}
            className="animate-spin"
            style={{ animationDuration: '14s', transformOrigin: '60px 60px' }}
          />
        </g>
      )}

      {/* ─── 0.2 CORONA HOLOGRÁFICA DE MAESTRÍA (66 DÍAS) ─── */}
      {has66Days && (
        <g filter={`url(#${glowFilterId})`}>
          {/* Aureola / Corona en la cúspide */}
          <polygon
            points="60,4 66,12 74,8 70,16 60,14 50,16 46,8 54,12"
            fill="rgba(251, 191, 36, 0.4)"
            stroke="#fbbf24"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <circle cx="60" cy="4" r="2" fill="#ffffff" />
          <circle cx="46" cy="8" r="1.5" fill="#ffffff" />
          <circle cx="74" cy="8" r="1.5" fill="#ffffff" />
        </g>
      )}

      {/* ─── 0.3 CRISTALES DE ASCENSIÓN FLOTANTES (2do, 3er, 4to... Hábito 66d) ─── */}
      {ascensionCrystalsCount > 0 && (
        <g>
          {Array.from({ length: Math.min(8, ascensionCrystalsCount) }).map((_, idx) => {
            const angle = (idx * 2 * Math.PI) / Math.min(8, ascensionCrystalsCount);
            const radius = 54;
            const cx = 60 + radius * Math.cos(angle);
            const cy = 60 + radius * Math.sin(angle) * 0.75;
            return (
              <g key={`crystal-${idx}`} filter={`url(#${glowFilterId})`}>
                <polygon
                  points={`${cx},${cy - 5} ${cx + 3.5},${cy} ${cx},${cy + 5} ${cx - 3.5},${cy}`}
                  fill="#fbbf24"
                  stroke="#ffffff"
                  strokeWidth="0.8"
                  opacity="0.9"
                />
              </g>
            );
          })}
        </g>
      )}

      {/* ─── 1. RENDERIZADO DE LA FORMA BASE SELECCIONADA ─── */}
      {shapeId === 'prism' && (
        <g>
          {/* Capa neón exterior */}
          <g filter={`url(#${glowFilterId})`}>
            <polygon
              points="60,20 102,98 18,98"
              stroke={lineColor}
              strokeWidth="3.4"
              strokeLinejoin="round"
              fill="rgba(0, 14, 24, 0.45)"
            />
            <line x1="60" y1="20" x2="60" y2="52" stroke={lineColor} strokeWidth="2.8" strokeLinecap="round" />
            <line x1="60" y1="74" x2="60" y2="98" stroke={lineColor} strokeWidth="2.8" strokeLinecap="round" />
            <line x1="18" y1="98" x2="60" y2="74" stroke={lineColor} strokeWidth="2.8" strokeLinecap="round" />
            <line x1="102" y1="98" x2="60" y2="74" stroke={lineColor} strokeWidth="2.8" strokeLinecap="round" />
            <line x1="36" y1="63" x2="42" y2="63" stroke={lineColor} strokeWidth="2.8" />
            <line x1="78" y1="63" x2="84" y2="63" stroke={lineColor} strokeWidth="2.8" />
          </g>
          {/* Núcleo blanco fino */}
          <polygon points="60,20 102,98 18,98" stroke="#ffffff" strokeWidth="1" strokeLinejoin="round" fill="none" opacity="0.9" />
          <line x1="60" y1="20" x2="60" y2="52" stroke="#ffffff" strokeWidth="0.8" opacity="0.9" />
          <line x1="60" y1="74" x2="60" y2="98" stroke="#ffffff" strokeWidth="0.8" opacity="0.9" />
          <line x1="18" y1="98" x2="60" y2="74" stroke="#ffffff" strokeWidth="0.8" opacity="0.9" />
          <line x1="102" y1="98" x2="60" y2="74" stroke="#ffffff" strokeWidth="0.8" opacity="0.9" />

          {/* Ojo Central que todo lo ve */}
          <g>
            <path
              d="M 42 63 C 50 49, 70 49, 78 63 C 70 77, 50 77, 42 63 Z"
              fill="#000c17"
              stroke={lineColor}
              strokeWidth="2.8"
              filter={`url(#${glowFilterId})`}
            />
            <path d="M 42 63 C 50 49, 70 49, 78 63 C 70 77, 50 77, 42 63 Z" stroke="#ffffff" strokeWidth="0.8" fill="none" />
            {/* Iris & Pupila con mouse tracking */}
            <g style={{ transform: isTrackingMouse ? `translate(${eyeOffset.x * 0.7}px, ${eyeOffset.y * 0.7}px)` : undefined, transition: 'transform 0.08s ease-out' }}>
              <circle cx="60" cy="63" r="8" fill="none" stroke={lineColor} strokeWidth="2" filter={`url(#${glowFilterId})`} />
              <circle cx="60" cy="63" r="4.2" fill={lineColor} />
              <circle cx="60" cy="63" r="2.2" fill="#ffffff" />
            </g>
          </g>
        </g>
      )}

      {shapeId === 'octahedron' && (
        <g>
          <g filter={`url(#${glowFilterId})`}>
            {/* Rombo exterior 8 caras */}
            <polygon
              points="60,18 98,60 60,102 22,60"
              stroke={lineColor}
              strokeWidth="3.4"
              strokeLinejoin="round"
              fill="rgba(2, 16, 28, 0.45)"
            />
            {/* Aristas 3D internas */}
            <line x1="60" y1="18" x2="60" y2="50" stroke={lineColor} strokeWidth="2.6" />
            <line x1="60" y1="74" x2="60" y2="102" stroke={lineColor} strokeWidth="2.6" />
            <line x1="22" y1="60" x2="48" y2="62" stroke={lineColor} strokeWidth="2.6" />
            <line x1="72" y1="62" x2="98" y2="60" stroke={lineColor} strokeWidth="2.6" />
            <line x1="22" y1="60" x2="60" y2="62" stroke={lineColor} strokeWidth="2.2" strokeDasharray="3 3" />
            <line x1="98" y1="60" x2="60" y2="62" stroke={lineColor} strokeWidth="2.2" strokeDasharray="3 3" />
            <line x1="60" y1="18" x2="22" y2="60" stroke={lineColor} strokeWidth="2.4" />
            <line x1="60" y1="18" x2="98" y2="60" stroke={lineColor} strokeWidth="2.4" />
            <line x1="60" y1="102" x2="22" y2="60" stroke={lineColor} strokeWidth="2.4" />
            <line x1="60" y1="102" x2="98" y2="60" stroke={lineColor} strokeWidth="2.4" />
          </g>
          <polygon points="60,18 98,60 60,102 22,60" stroke="#ffffff" strokeWidth="1" strokeLinejoin="round" fill="none" opacity="0.9" />

          {/* Núcleo de Singularidad de 8 caras */}
          <g style={{ transform: isTrackingMouse ? `translate(${eyeOffset.x * 0.6}px, ${eyeOffset.y * 0.6}px)` : undefined, transition: 'transform 0.08s ease-out' }}>
            <polygon
              points="60,52 70,62 60,72 50,62"
              fill={`url(#coreGrad-${glowFilterId})`}
              stroke={lineColor}
              strokeWidth="2.2"
              filter={`url(#${glowFilterId})`}
            />
            <circle cx="60" cy="62" r="3.2" fill="#ffffff" />
          </g>
        </g>
      )}

      {shapeId === 'wolf' && (
        <g>
          <g filter={`url(#${glowFilterId})`}>
            {/* Orejas poligonales altas */}
            <polygon points="40,36 28,16 50,26" stroke={lineColor} strokeWidth="3" fill="rgba(2, 16, 28, 0.5)" />
            <polygon points="80,36 92,16 70,26" stroke={lineColor} strokeWidth="3" fill="rgba(2, 16, 28, 0.5)" />
            {/* Cráneo y pómulos triangulares */}
            <polygon
              points="50,26 60,30 70,26 80,44 96,58 78,76 60,98 42,76 24,58 40,44"
              stroke={lineColor}
              strokeWidth="3.2"
              strokeLinejoin="round"
              fill="rgba(0, 12, 22, 0.45)"
            />
            {/* Aristas del hocico */}
            <line x1="60" y1="30" x2="60" y2="82" stroke={lineColor} strokeWidth="2.2" />
            <line x1="42" y1="76" x2="60" y2="82" stroke={lineColor} strokeWidth="2.2" />
            <line x1="78" y1="76" x2="60" y2="82" stroke={lineColor} strokeWidth="2.2" />
            <line x1="40" y1="44" x2="60" y2="52" stroke={lineColor} strokeWidth="2.2" />
            <line x1="80" y1="44" x2="60" y2="52" stroke={lineColor} strokeWidth="2.2" />
            {/* Trufa / Nariz en V */}
            <polygon points="56,86 64,86 60,92" fill={lineColor} />
          </g>
          {/* Delineado blanco fino */}
          <polygon points="50,26 60,30 70,26 80,44 96,58 78,76 60,98 42,76 24,58 40,44" stroke="#ffffff" strokeWidth="0.8" fill="none" opacity="0.8" />

          {/* Ojos Láser Gemelos Angulares */}
          <g style={{ transform: isTrackingMouse ? `translate(${eyeOffset.x * 0.7}px, ${eyeOffset.y * 0.7}px)` : undefined, transition: 'transform 0.08s ease-out' }}>
            <polygon points="38,50 50,55 40,58" fill={lineColor} stroke="#ffffff" strokeWidth="1" filter={`url(#${glowFilterId})`} />
            <polygon points="82,50 70,55 80,58" fill={lineColor} stroke="#ffffff" strokeWidth="1" filter={`url(#${glowFilterId})`} />
            <circle cx="44" cy="54" r="1.8" fill="#ffffff" />
            <circle cx="76" cy="54" r="1.8" fill="#ffffff" />
          </g>
        </g>
      )}

      {shapeId === 'hound' && (
        <g>
          <g filter={`url(#${glowFilterId})`}>
            {/* Cráneo noble y orejas semicaídas tácticas */}
            <polygon points="42,26 22,38 28,70 38,62" stroke={lineColor} strokeWidth="3" strokeLinejoin="round" fill="rgba(2, 16, 28, 0.5)" />
            <polygon points="78,26 98,38 92,70 82,62" stroke={lineColor} strokeWidth="3" strokeLinejoin="round" fill="rgba(2, 16, 28, 0.5)" />
            <polygon
              points="42,26 60,20 78,26 78,54 68,76 60,98 52,76 42,54"
              stroke={lineColor}
              strokeWidth="3.2"
              strokeLinejoin="round"
              fill="rgba(0, 14, 26, 0.45)"
            />
            {/* Facetas del puente nasal */}
            <line x1="60" y1="20" x2="60" y2="86" stroke={lineColor} strokeWidth="2.2" />
            <line x1="42" y1="54" x2="60" y2="60" stroke={lineColor} strokeWidth="2.2" />
            <line x1="78" y1="54" x2="60" y2="60" stroke={lineColor} strokeWidth="2.2" />
            <line x1="52" y1="76" x2="60" y2="86" stroke={lineColor} strokeWidth="2.2" />
            <line x1="68" y1="76" x2="60" y2="86" stroke={lineColor} strokeWidth="2.2" />
            {/* Sensor frontal / nariz */}
            <polygon points="54,92 66,92 60,98" fill={lineColor} />
          </g>
          <polygon points="42,26 60,20 78,26 78,54 68,76 60,98 52,76 42,54" stroke="#ffffff" strokeWidth="0.8" fill="none" opacity="0.8" />

          {/* Ojos Tácticos de Sabueso */}
          <g style={{ transform: isTrackingMouse ? `translate(${eyeOffset.x * 0.7}px, ${eyeOffset.y * 0.7}px)` : undefined, transition: 'transform 0.08s ease-out' }}>
            <rect x="42" y="46" width="10" height="6" rx="2" fill={lineColor} stroke="#ffffff" strokeWidth="1" filter={`url(#${glowFilterId})`} />
            <rect x="68" y="46" width="10" height="6" rx="2" fill={lineColor} stroke="#ffffff" strokeWidth="1" filter={`url(#${glowFilterId})`} />
            <circle cx="47" cy="49" r="1.8" fill="#ffffff" />
            <circle cx="73" cy="49" r="1.8" fill="#ffffff" />
          </g>
        </g>
      )}

      {shapeId === 'panther' && (
        <g>
          <g filter={`url(#${glowFilterId})`}>
            {/* Orejas felinas estilizadas */}
            <polygon points="44,32 30,18 48,22" stroke={lineColor} strokeWidth="3" fill="rgba(2, 16, 28, 0.5)" />
            <polygon points="76,32 90,18 72,22" stroke={lineColor} strokeWidth="3" fill="rgba(2, 16, 28, 0.5)" />
            {/* Pómulos anchos en rombo y barbilla compacta */}
            <polygon
              points="48,22 60,26 72,22 84,40 102,56 78,76 60,96 42,76 18,56 36,40"
              stroke={lineColor}
              strokeWidth="3.2"
              strokeLinejoin="round"
              fill="rgba(0, 10, 20, 0.45)"
            />
            {/* Aristas simétricas de la mandíbula */}
            <line x1="60" y1="26" x2="60" y2="80" stroke={lineColor} strokeWidth="2.2" />
            <line x1="36" y1="40" x2="60" y2="48" stroke={lineColor} strokeWidth="2.2" />
            <line x1="84" y1="40" x2="60" y2="48" stroke={lineColor} strokeWidth="2.2" />
            <line x1="18" y1="56" x2="42" y2="64" stroke={lineColor} strokeWidth="2.2" />
            <line x1="102" y1="56" x2="78" y2="64" stroke={lineColor} strokeWidth="2.2" />
            <polygon points="56,84 64,84 60,90" fill={lineColor} />
          </g>
          <polygon points="48,22 60,26 72,22 84,40 102,56 78,76 60,96 42,76 18,56 36,40" stroke="#ffffff" strokeWidth="0.8" fill="none" opacity="0.8" />

          {/* Ojos Felinos Rasgados con Pupila Láser Vertical */}
          <g style={{ transform: isTrackingMouse ? `translate(${eyeOffset.x * 0.7}px, ${eyeOffset.y * 0.7}px)` : undefined, transition: 'transform 0.08s ease-out' }}>
            <polygon points="34,50 50,48 44,56" fill="rgba(0, 12, 22, 0.9)" stroke={lineColor} strokeWidth="2" filter={`url(#${glowFilterId})`} />
            <polygon points="86,50 70,48 76,56" fill="rgba(0, 12, 22, 0.9)" stroke={lineColor} strokeWidth="2" filter={`url(#${glowFilterId})`} />
            {/* Pupila hendida */}
            <line x1="43" y1="49" x2="43" y2="55" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="77" y1="49" x2="77" y2="55" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
          </g>
        </g>
      )}

      {shapeId === 'elephant' && (
        <g>
          <g filter={`url(#${glowFilterId})`}>
            {/* Orejas como Escudos Hexagonales */}
            <polygon points="44,24 16,30 10,56 22,76 38,68" stroke={lineColor} strokeWidth="3" strokeLinejoin="round" fill="rgba(2, 16, 28, 0.5)" />
            <polygon points="76,24 104,30 110,56 98,76 82,68" stroke={lineColor} strokeWidth="3" strokeLinejoin="round" fill="rgba(2, 16, 28, 0.5)" />
            {/* Cráneo en cúpula */}
            <polygon points="44,24 60,16 76,24 78,54 60,66 42,54" stroke={lineColor} strokeWidth="3.2" strokeLinejoin="round" fill="rgba(0, 14, 26, 0.45)" />
            {/* Colmillos de Luz en V */}
            <polyline points="38,68 44,88 50,78" stroke="#ffffff" strokeWidth="2.6" strokeLinejoin="round" fill="none" />
            <polyline points="82,68 76,88 70,78" stroke="#ffffff" strokeWidth="2.6" strokeLinejoin="round" fill="none" />
            {/* Trompa Facetada */}
            <polygon points="52,66 68,66 64,84 56,84" stroke={lineColor} strokeWidth="2.4" fill="rgba(0, 10, 20, 0.6)" />
            <polygon points="56,84 64,84 62,102 58,102" stroke={lineColor} strokeWidth="2.4" fill="rgba(0, 10, 20, 0.6)" />
            <line x1="60" y1="16" x2="60" y2="66" stroke={lineColor} strokeWidth="2.2" />
          </g>
          <polygon points="44,24 60,16 76,24 78,54 60,66 42,54" stroke="#ffffff" strokeWidth="0.8" fill="none" opacity="0.8" />

          {/* Faro Holográfico del Tercer Ojo en la Frente */}
          <g style={{ transform: isTrackingMouse ? `translate(${eyeOffset.x * 0.7}px, ${eyeOffset.y * 0.7}px)` : undefined, transition: 'transform 0.08s ease-out' }}>
            <circle cx="60" cy="36" r="6" fill={`url(#coreGrad-${glowFilterId})`} stroke={lineColor} strokeWidth="2" filter={`url(#${glowFilterId})`} />
            <circle cx="60" cy="36" r="2.5" fill="#ffffff" />
          </g>
        </g>
      )}

      {/* ─── 2. RENDERIZADO DE KAI PERSONALIZADO (FORJA NEURAL IA) ─── */}
      {shapeId === 'custom' && customForm && (
        <g>
          <g filter={`url(#${glowFilterId})`}>
            {/* Polígonos de relleno de la IA */}
            {customForm.polygons?.map((poly, idx) => (
              <polygon
                key={`custom-poly-${idx}`}
                points={poly.points}
                stroke={lineColor}
                strokeWidth="2.8"
                strokeLinejoin="round"
                fill="rgba(0, 14, 24, 0.45)"
              />
            ))}
            {/* Trazos de alambre (Wireframe) */}
            {customForm.lines?.map((line, idx) => (
              <line
                key={`custom-line-${idx}`}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={lineColor}
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            ))}
          </g>
          {/* Refuerzo en blanco fino */}
          {customForm.lines?.map((line, idx) => (
            <line
              key={`custom-line-hi-${idx}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#ffffff"
              strokeWidth="0.8"
              opacity="0.85"
            />
          ))}

          {/* Núcleo de luz central de la IA */}
          {customForm.coreEye ? (
            <g style={{ transform: isTrackingMouse ? `translate(${eyeOffset.x * 0.7}px, ${eyeOffset.y * 0.7}px)` : undefined, transition: 'transform 0.08s ease-out' }}>
              <circle
                cx={customForm.coreEye.cx}
                cy={customForm.coreEye.cy}
                r={customForm.coreEye.r || 6}
                fill={`url(#coreGrad-${glowFilterId})`}
                stroke={lineColor}
                strokeWidth="2"
                filter={`url(#${glowFilterId})`}
              />
              <circle cx={customForm.coreEye.cx} cy={customForm.coreEye.cy} r={(customForm.coreEye.r || 6) * 0.4} fill="#ffffff" />
            </g>
          ) : (
            <g style={{ transform: isTrackingMouse ? `translate(${eyeOffset.x * 0.7}px, ${eyeOffset.y * 0.7}px)` : undefined, transition: 'transform 0.08s ease-out' }}>
              <circle cx="60" cy="60" r="6" fill={`url(#coreGrad-${glowFilterId})`} stroke={lineColor} strokeWidth="2" filter={`url(#${glowFilterId})`} />
              <circle cx="60" cy="60" r="2.5" fill="#ffffff" />
            </g>
          )}
        </g>
      )}
    </svg>
  );
};
export default KaiVectorGraphics;
