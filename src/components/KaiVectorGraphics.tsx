import React, { useId } from 'react';
import { KaiShapeKey, KaiCustomForm } from '../types';
import { injectAuraColorIntoSvg } from './KAICompanion';

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

        {/* ─── MULTIVERSE STYLE SHADERS & FILTERS ─── */}
        <filter id={`${gradientId}-toon-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.65" />
        </filter>

        <filter id={`${gradientId}-paper-relief`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="2" dy="3" stdDeviation="2.5" floodColor="#020813" floodOpacity="0.8" />
        </filter>

        <radialGradient id={`${gradientId}-clay-grad`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
          <stop offset="35%" stopColor={lineColor} stopOpacity="0.55" />
          <stop offset="85%" stopColor="#0a192f" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#020813" stopOpacity="0.98" />
        </radialGradient>

        <linearGradient id={`${gradientId}-chrome-metal`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.95" />
          <stop offset="25%" stopColor="#94a3b8" stopOpacity="0.65" />
          <stop offset="48%" stopColor="#38bdf8" stopOpacity="0.9" />
          <stop offset="52%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="75%" stopColor="#0284c7" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
        </linearGradient>

        <pattern id={`${gradientId}-pixel-grid`} width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="rgba(5, 12, 18, 0.55)" />
          <rect width="5" height="5" fill="rgba(16, 185, 129, 0.12)" />
        </pattern>
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

          /* 2. KAI MULTIVERSE: MASCOTA VIVA CON OJOS EXPRESIVOS Y BLINK NATURAL */
          @keyframes kai-mascot-blink {
            0%, 88% { transform: scaleY(1); }
            90% { transform: scaleY(0.08); }
            92% { transform: scaleY(1); }
            95% { transform: scaleY(0.2); }
            97% { transform: scaleY(1); }
            100% { transform: scaleY(1); }
          }
          @keyframes kai-mascot-gaze {
            0%, 25% { transform: translate(0px, 0px); }
            30%, 55% { transform: translate(2px, -1.2px); }
            60%, 85% { transform: translate(-2px, 0.8px); }
            90%, 100% { transform: translate(0px, 0px); }
          }
          @keyframes kai-mascot-wiggle {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-1deg); }
            75% { transform: rotate(1deg); }
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

      {/* ──────────────── 2. CUSTOM / FORJA NEURAL IA (📸 MULTIVERSE) ──────────────── */}
      {shapeId === 'custom' && customForm && (() => {
        // Si el resultado de la forja incluye código SVG puro (arquitectura 100% SVG)
        if (customForm.svgContent) {
          const artStyle = customForm.artStyle || 'neon-geometry';
          const processed = injectAuraColorIntoSvg(customForm.svgContent, artStyle, lineColor, {
            eyeOffset,
            isTracking: isTrackingMouse,
            isSpeaking: justClicked,
          });
          const innerMatch = processed.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
          const innerContent = innerMatch ? innerMatch[1] : processed;
          return (
            <g
              id={`${gradientId}-custom-svg-body`}
              style={{ '--color-aura-activa': lineColor } as React.CSSProperties}
              filter={`url(#${filterId})`}
              dangerouslySetInnerHTML={{ __html: innerContent }}
            />
          );
        }

        const artStyle = customForm.artStyle || 'toon';
        const customLineColor = customForm.primaryColor || lineColor;
        const customSecColor = customForm.secondaryColor || secondaryStroke;

        const getPolyFill = () => {
          if (artStyle === 'clay3d') return `url(#${gradientId}-clay-grad)`;
          if (artStyle === 'chrome') return `url(#${gradientId}-chrome-metal)`;
          if (artStyle === 'papercraft') return 'rgba(245, 158, 11, 0.22)';
          if (artStyle === 'pixel') return `url(#${gradientId}-pixel-grid)`;
          return 'rgba(15, 23, 42, 0.65)';
        };

        const getPolyFilter = () => {
          if (artStyle === 'papercraft') return `url(#${gradientId}-paper-relief)`;
          if (artStyle === 'toon') return `url(#${gradientId}-toon-shadow)`;
          return undefined;
        };

        const isPixel = artStyle === 'pixel';

        return (
          <g id={`${gradientId}-custom-multiverse-body`}>
            {/* Capa Base con Bloom Neón / Sombra de Estilo */}
            <g filter={`url(#${filterId})`}>
              {customForm.polygons?.map((p, idx) => (
                <polygon
                  key={`poly-${idx}`}
                  points={p.points}
                  stroke={customLineColor}
                  strokeWidth={isPixel ? '3' : '2.8'}
                  strokeLinejoin={isPixel ? 'miter' : 'round'}
                  strokeLinecap={isPixel ? 'square' : 'round'}
                  fill={getPolyFill()}
                  filter={getPolyFilter()}
                  shapeRendering={isPixel ? 'crispEdges' : 'auto'}
                />
              ))}
              {customForm.lines?.map((l, idx) => (
                <line
                  key={`line-${idx}`}
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  stroke={idx % 2 === 0 ? customLineColor : customSecColor}
                  strokeWidth={isPixel ? '2.8' : '2.2'}
                  strokeLinecap={isPixel ? 'square' : 'round'}
                  shapeRendering={isPixel ? 'crispEdges' : 'auto'}
                />
              ))}
            </g>

            {/* Capa Núcleo Brillante */}
            <g opacity={0.92}>
              {customForm.polygons?.map((p, idx) => (
                <polygon
                  key={`core-poly-${idx}`}
                  points={p.points}
                  stroke={coreStroke}
                  strokeWidth="1"
                  strokeLinejoin={isPixel ? 'miter' : 'round'}
                  fill="none"
                  shapeRendering={isPixel ? 'crispEdges' : 'auto'}
                />
              ))}
              {customForm.lines?.map((l, idx) => (
                <line
                  key={`core-line-${idx}`}
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  stroke={coreStroke}
                  strokeWidth="0.8"
                  strokeLinecap={isPixel ? 'square' : 'round'}
                  shapeRendering={isPixel ? 'crispEdges' : 'auto'}
                />
              ))}
            </g>

            {/* ── SISTEMA DE OJOS VIVOS EXPRESIVOS DEL PERSONAJE ── */}
            {customForm.dualEyes && (
              <g id={`${gradientId}-custom-dual-living-eyes`}>
                {[
                  { key: 'left', eye: customForm.dualEyes.left },
                  { key: 'right', eye: customForm.dualEyes.right },
                ].map(({ key, eye }) => {
                  if (!eye) return null;
                  return (
                    <g key={key} id={`${gradientId}-custom-eye-${key}`}>
                      {/* Fondo Esclerótica Blanco */}
                      {isPixel ? (
                        <rect
                          x={eye.cx - eye.rx}
                          y={eye.cy - eye.ry}
                          width={eye.rx * 2}
                          height={eye.ry * 2}
                          fill="#ffffff"
                          shapeRendering="crispEdges"
                        />
                      ) : (
                        <>
                          <ellipse
                            cx={eye.cx}
                            cy={eye.cy}
                            rx={eye.rx}
                            ry={eye.ry}
                            fill="#ffffff"
                            filter={`url(#${filterId})`}
                          />
                          <ellipse
                            cx={eye.cx}
                            cy={eye.cy}
                            rx={eye.rx}
                            ry={eye.ry}
                            fill="#ffffff"
                          />
                        </>
                      )}

                      {/* Parpadeo Orgánico del Ojo */}
                      <g
                        style={{
                          transformOrigin: `${eye.cx}px ${eye.cy}px`,
                          animation: isFocusTrance ? undefined : 'kai-mascot-blink 4.8s infinite ease-in-out',
                        }}
                      >
                        {/* Iris de Color */}
                        {isPixel ? (
                          <rect
                            x={eye.cx - eye.rx * 0.75}
                            y={eye.cy - eye.ry * 0.75}
                            width={eye.rx * 1.5}
                            height={eye.ry * 1.5}
                            fill={customSecColor || customLineColor}
                            shapeRendering="crispEdges"
                          />
                        ) : (
                          <ellipse
                            cx={eye.cx}
                            cy={eye.cy}
                            rx={eye.rx * 0.72}
                            ry={eye.ry * 0.75}
                            fill={customSecColor || customLineColor}
                          />
                        )}

                        {/* Pupila con Seguimiento de Mirada */}
                        <g
                          style={
                            isTrackingMouse
                              ? {
                                  transform: `translate(${eyeOffset.x * 0.4}px, ${eyeOffset.y * 0.4}px)`,
                                  transition: 'transform 0.12s ease-out',
                                }
                              : { animation: 'kai-mascot-gaze 5s infinite ease-in-out' }
                          }
                        >
                          {isPixel ? (
                            <rect
                              x={eye.cx - eye.rx * 0.4}
                              y={eye.cy - eye.ry * 0.4}
                              width={eye.rx * 0.8}
                              height={eye.ry * 0.8}
                              fill="#020813"
                              shapeRendering="crispEdges"
                            />
                          ) : (
                            <ellipse
                              cx={eye.cx}
                              cy={eye.cy}
                              rx={eye.rx * 0.45}
                              ry={eye.ry * 0.48}
                              fill="#020813"
                            />
                          )}

                          {/* Destello Especular */}
                          {isPixel ? (
                            <rect
                              x={eye.cx + eye.rx * 0.1}
                              y={eye.cy - eye.ry * 0.5}
                              width={eye.rx * 0.35}
                              height={eye.ry * 0.35}
                              fill="#ffffff"
                              shapeRendering="crispEdges"
                            />
                          ) : (
                            <>
                              <circle
                                cx={eye.cx + eye.rx * 0.22}
                                cy={eye.cy - eye.ry * 0.25}
                                r={Math.max(1.4, eye.rx * 0.24)}
                                fill="#ffffff"
                              />
                              <circle
                                cx={eye.cx - eye.rx * 0.2}
                                cy={eye.cy + eye.ry * 0.22}
                                r={Math.max(0.8, eye.rx * 0.14)}
                                fill="#ffffff"
                                opacity="0.95"
                              />
                            </>
                          )}
                        </g>
                      </g>

                      {/* Contorno Delineado del Ojo */}
                      {isPixel ? (
                        <rect
                          x={eye.cx - eye.rx}
                          y={eye.cy - eye.ry}
                          width={eye.rx * 2}
                          height={eye.ry * 2}
                          stroke={customLineColor}
                          strokeWidth="2.4"
                          fill="none"
                          shapeRendering="crispEdges"
                        />
                      ) : (
                        <>
                          <ellipse
                            cx={eye.cx}
                            cy={eye.cy}
                            rx={eye.rx}
                            ry={eye.ry}
                            stroke={customLineColor}
                            strokeWidth="2.4"
                            fill="none"
                            filter={`url(#${filterId})`}
                          />
                          <ellipse
                            cx={eye.cx}
                            cy={eye.cy}
                            rx={eye.rx}
                            ry={eye.ry}
                            stroke="#020813"
                            strokeWidth="1.2"
                            fill="none"
                          />
                        </>
                      )}
                    </g>
                  );
                })}
              </g>
            )}

            {/* Ojo Central Mascota (si no tiene ojos duales) */}
            {!customForm.dualEyes && customForm.coreEye && (
              <g id={`${gradientId}-custom-mascot-core-eye`}>
                <circle
                  cx={customForm.coreEye.cx}
                  cy={customForm.coreEye.cy}
                  r={customForm.coreEye.r}
                  fill="#ffffff"
                  filter={`url(#${filterId})`}
                />
                <circle
                  cx={customForm.coreEye.cx}
                  cy={customForm.coreEye.cy}
                  r={customForm.coreEye.r}
                  fill="#ffffff"
                />
                <g
                  style={{
                    transformOrigin: `${customForm.coreEye.cx}px ${customForm.coreEye.cy}px`,
                    animation: isFocusTrance ? undefined : 'kai-mascot-blink 4.6s infinite ease-in-out',
                  }}
                >
                  <circle
                    cx={customForm.coreEye.cx}
                    cy={customForm.coreEye.cy}
                    r={customForm.coreEye.r * 0.72}
                    fill={customSecColor || customLineColor}
                  />
                  <g
                    style={
                      isTrackingMouse
                        ? {
                            transform: `translate(${eyeOffset.x * 0.4}px, ${eyeOffset.y * 0.4}px)`,
                            transition: 'transform 0.12s ease-out',
                          }
                        : { animation: 'kai-mascot-gaze 5s infinite ease-in-out' }
                    }
                  >
                    <circle
                      cx={customForm.coreEye.cx}
                      cy={customForm.coreEye.cy}
                      r={customForm.coreEye.r * 0.44}
                      fill="#020813"
                    />
                    <circle
                      cx={customForm.coreEye.cx + customForm.coreEye.r * 0.24}
                      cy={customForm.coreEye.cy - customForm.coreEye.r * 0.24}
                      r={customForm.coreEye.r * 0.24}
                      fill="#ffffff"
                    />
                  </g>
                </g>
                <circle
                  cx={customForm.coreEye.cx}
                  cy={customForm.coreEye.cy}
                  r={customForm.coreEye.r}
                  stroke={customLineColor}
                  strokeWidth="2.4"
                  fill="none"
                />
              </g>
            )}

            {/* Boca / Sonrisa Expresiva del Personaje */}
            {customForm.mouth?.d && (
              <g id={`${gradientId}-custom-mouth`}>
                <path
                  d={customForm.mouth.d}
                  stroke={customLineColor}
                  strokeWidth={isPixel ? '3.6' : '3.2'}
                  strokeLinecap={isPixel ? 'square' : 'round'}
                  strokeLinejoin={isPixel ? 'miter' : 'round'}
                  shapeRendering={isPixel ? 'crispEdges' : 'auto'}
                  fill="none"
                  filter={`url(#${filterId})`}
                />
                <path
                  d={customForm.mouth.d}
                  stroke="#ffffff"
                  strokeWidth={isPixel ? '1.6' : '1.3'}
                  strokeLinecap={isPixel ? 'square' : 'round'}
                  strokeLinejoin={isPixel ? 'miter' : 'round'}
                  shapeRendering={isPixel ? 'crispEdges' : 'auto'}
                  fill="none"
                  opacity="0.95"
                />
              </g>
            )}
          </g>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 2. SISTEMA DE OJOS VIVOS: FIEL AL ARTE & CON ANIMACIÓN ORGÁNICA NATURAL */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* ── CASO 1: PRISMA (OJO SAGRADO CLÁSICO) ── */}
      {shapeId === 'prism' && (
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

      </svg>
  );
};
