import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { KaiCustomForm, KaiMultiverseStyle, KaiShapeKey } from '../types';
import { KaiVectorGraphics } from './KaiVectorGraphics';
import { KaiCosmeticEffects } from './KaiCosmeticEffects';
import { usePlayerStore } from '../store/usePlayerStore';
import { soundFX } from '../utils/audio';

export interface KAICompanionProps {
  customForm?: KaiCustomForm | null;
  shapeId?: KaiShapeKey;
  auraColor?: string;
  size?: 'nano' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
  showHUD?: boolean;
  auraState?: 'normal' | 'focus_trance' | 'victory' | 'warning_amber';
  glowFilterId?: string;
  eyeOffset?: { x: number; y: number };
  isTrackingMouse?: boolean;
  isSpeaking?: boolean;
}

/**
 * Inyecta el color de la variable --color-aura-activa al atributo stroke o fill
 * del código SVG devuelto por la Forja Neural e inserta el motor de animación orgánica
 * viva (parpadeo natural, respiración corporal squash & stretch, flotación de extremidades y seguimiento ocular).
 */
export function injectAuraColorIntoSvg(
  rawSvg: string,
  artStyle: KaiMultiverseStyle = 'neon-geometry',
  auraColor: string = '#00f0ff',
  options?: {
    eyeOffset?: { x: number; y: number };
    isTracking?: boolean;
    isSpeaking?: boolean;
  }
): string {
  if (!rawSvg || typeof rawSvg !== 'string') return '';

  let cleaned = rawSvg.trim();

  // Eliminar fences markdown si vinieron de la IA
  cleaned = cleaned.replace(/^```(?:svg|xml|html)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Extraer el elemento <svg> si está embebido en texto
  const firstOpen = cleaned.indexOf('<svg');
  const lastClose = cleaned.lastIndexOf('</svg>');
  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
    cleaned = cleaned.substring(firstOpen, lastClose + 6);
  } else {
    const svgMatch = cleaned.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgMatch) {
      cleaned = svgMatch[0];
    } else if (!cleaned.startsWith('<svg')) {
      // Si la IA devolvió solo los elementos internos (sin la etiqueta raíz <svg>)
      cleaned = `<svg viewBox="0 0 160 170" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">${cleaned}</svg>`;
    }
  }

  // Purgar de raíz cualquier delimitador residual (ej: ===END===)
  cleaned = cleaned.replace(/={2,}\s*[a-zA-Z0-9_\-]+\s*={2,}/g, '').trim();

  const eyeX = options?.eyeOffset?.x !== undefined ? options.eyeOffset.x.toFixed(2) : '0';
  const eyeY = options?.eyeOffset?.y !== undefined ? options.eyeOffset.y.toFixed(2) : '0';
  const isTracking = Boolean(options?.isTracking);
  const isSpeaking = Boolean(options?.isSpeaking);

  // Inyectar etiquetas de clases heurísticas si la IA no proporcionó los IDs semánticos
  if (!cleaned.includes('kai-eyes') && !cleaned.includes('id="kai-eyes"')) {
    cleaned = cleaned.replace(/(<(?:g|circle|ellipse)\b[^>]*?(?:id|class)=["'][^"']*(?:eye|ojo)[^"']*["'][^>]*>)/gi, (m) => {
      if (!m.includes('class=')) return m.replace(/>$/, ' class="kai-eyes">');
      return m.replace(/class=["']([^"']*)["']/i, 'class="$1 kai-eyes"');
    });
    cleaned = cleaned.replace(/(<(?:circle|ellipse)\b[^>]*?(?:id|class)=["'][^"']*(?:pupil|pupila|iris)[^"']*["'][^>]*>)/gi, (m) => {
      if (!m.includes('class=')) return m.replace(/>$/, ' class="kai-pupil">');
      return m.replace(/class=["']([^"']*)["']/i, 'class="$1 kai-pupil"');
    });
  }

  if (!cleaned.includes('kai-mouth') && !cleaned.includes('id="kai-mouth"')) {
    cleaned = cleaned.replace(/(<(?:g|path|line)\b[^>]*?(?:id|class)=["'][^"']*(?:mouth|boca|smile|sonrisa)[^"']*["'][^>]*>)/gi, (m) => {
      if (!m.includes('class=')) return m.replace(/>$/, ' class="kai-mouth">');
      return m.replace(/class=["']([^"']*)["']/i, 'class="$1 kai-mouth"');
    });
  }

  const livingStyles = `
<style>
  @keyframes kai-live-body {
    0%, 100% { transform: translateY(0px) scale(1, 1); }
    50% { transform: translateY(-3px) scale(0.985, 1.02); }
  }
  @keyframes kai-live-blink {
    0%, 82% { transform: scaleY(1); }
    84% { transform: scaleY(0.06); }
    86% { transform: scaleY(1); }
    89% { transform: scaleY(0.2); }
    91% { transform: scaleY(1); }
    100% { transform: scaleY(1); }
  }
  @keyframes kai-live-gaze {
    0%, 35% { transform: translate(0px, 0px); }
    40%, 60% { transform: translate(2.5px, -1.2px); }
    65%, 85% { transform: translate(-2.5px, 0.8px); }
    90%, 100% { transform: translate(0px, 0px); }
  }
  @keyframes kai-live-mouth-breath {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.06, 0.94); }
  }
  @keyframes kai-live-mouth-talk {
    0%, 100% { transform: scale(1); }
    20% { transform: scale(1.25, 1.45) translateY(1.5px); }
    40% { transform: scale(0.85, 0.8); }
    60% { transform: scale(1.2, 1.3) translateY(1.2px); }
    80% { transform: scale(0.95, 0.9); }
  }
  @keyframes kai-live-hand-l {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(3.5px) rotate(-4.5deg); }
  }
  @keyframes kai-live-hand-r {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(3.5px) rotate(4.5deg); }
  }

  #kai-body, .kai-body, [data-kai="body"] {
    transform-origin: 80px 145px;
    animation: kai-live-body 4.4s infinite ease-in-out;
  }
  #kai-eyes, .kai-eyes, [data-kai="eyes"] {
    transform-origin: 80px 75px;
    animation: kai-live-blink 4.6s infinite ease-in-out;
  }
  #kai-pupils, .kai-pupil, [data-kai="pupils"], [data-kai="pupil"] {
    ${isTracking
      ? `transform: translate(${eyeX}px, ${eyeY}px) !important; transition: transform 0.12s cubic-bezier(0.2, 0, 0, 1) !important;`
      : `animation: kai-live-gaze 5.2s infinite ease-in-out;`
    }
  }
  #kai-mouth, .kai-mouth, [data-kai="mouth"] {
    transform-origin: 80px 105px;
    animation: ${isSpeaking ? 'kai-live-mouth-talk 0.35s infinite ease-in-out' : 'kai-live-mouth-breath 4.2s infinite ease-in-out'};
  }
  #kai-left-hand, .kai-left-hand, [data-kai="left-hand"] {
    transform-origin: 35px 95px;
    animation: kai-live-hand-l 3.6s infinite ease-in-out;
  }
  #kai-right-hand, .kai-right-hand, [data-kai="right-hand"] {
    transform-origin: 125px 95px;
    animation: kai-live-hand-r 3.6s infinite ease-in-out -1.2s;
  }
</style>`;

  // Asegurar atributos estándar en <svg> e inyectar livingStyles
  cleaned = cleaned.replace(/<svg\b([^>]*)>/i, (_match, attrs) => {
    let newAttrs = attrs;
    if (!newAttrs.includes('viewBox')) newAttrs += ' viewBox="0 0 160 170"';
    if (!newAttrs.includes('xmlns')) newAttrs += ' xmlns="http://www.w3.org/2000/svg"';
    if (!newAttrs.includes('width')) newAttrs += ' width="100%"';
    if (!newAttrs.includes('height')) newAttrs += ' height="100%"';
    return `<svg ${newAttrs.trim()}>${livingStyles}`;
  });

  // Eliminar rectángulos de fondo opacos que cubran todo el canvas para garantizar fondo transparente
  cleaned = cleaned.replace(/<rect\b[^>]*?(?:width\s*=\s*["'](?:100%|1[56]\d(?:px)?)["'][^>]*?height\s*=\s*["'](?:100%|1[67]\d(?:px)?)["']|height\s*=\s*["'](?:100%|1[67]\d(?:px)?)["'][^>]*?width\s*=\s*["'](?:100%|1[56]\d(?:px)?)["'])[^>]*?>(?:<\/rect>)?/gi, '');
  cleaned = cleaned.replace(/<rect\b[^>]*?x\s*=\s*["']0["'][^>]*?y\s*=\s*["']0["'][^>]*?(?:width\s*=\s*["'](?:100%|1[56]\d(?:px)?)["'])[^>]*?>(?:<\/rect>)?/gi, '');

  const auraVarStroke = 'var(--color-aura-activa, currentColor)';
  const auraVarFill = 'var(--color-aura-activa, currentColor)';

  switch (artStyle) {
    case 'pixar':
    case 'cartoon':
    case 'anime':
    case 'pop':
    case 'doodle':
    case 'clay3d':
    case 'comic':
    case 'crayon':
    case 'toon':
    case 'papercraft':
    case 'chrome':
    case 'low-poly':
    case 'mystic-relic':
    case 'mecha-chibi':
    case 'sticker-pop':
      // Estilos artísticos con sus propios colores, gradientes y texturas:
      // Preservar 100% íntegros los colores originales del objeto y del arte
      return cleaned;

    case 'cyber-pixel':
    case 'pixel':
      cleaned = cleaned.replace(/<svg\b([^>]*)>/i, (_m, attrs) => {
        if (!attrs.includes('shape-rendering')) return `<svg ${attrs} shape-rendering="crispEdges">`;
        return `<svg ${attrs}>`;
      });
      return cleaned;

    case 'neon-geometry':
      // Solo para geometría neón explícita se armonizan trazos con el aura
      cleaned = cleaned.replace(/<polygon\b([^>]*)>/gi, (_match, attrs) => {
        let mod = attrs
          .replace(/\bstroke="[^"]*"/gi, '')
          .replace(/\bfill="[^"]*"/gi, '')
          .replace(/\bstroke-width="[^"]*"/gi, '');
        return `<polygon ${mod.trim()} stroke="${auraVarStroke}" stroke-width="2" fill="none" stroke-linejoin="round">`;
      });
      cleaned = cleaned.replace(/<path\b([^>]*)>/gi, (_match, attrs) => {
        let mod = attrs
          .replace(/\bstroke="[^"]*"/gi, '')
          .replace(/\bfill="[^"]*"/gi, '')
          .replace(/\bstroke-width="[^"]*"/gi, '');
        return `<path ${mod.trim()} stroke="${auraVarStroke}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">`;
      });
      cleaned = cleaned.replace(/<line\b([^>]*)>/gi, (_match, attrs) => {
        let mod = attrs
          .replace(/\bstroke="[^"]*"/gi, '')
          .replace(/\bstroke-width="[^"]*"/gi, '');
        return `<line ${mod.trim()} stroke="${auraVarStroke}" stroke-width="2" stroke-linecap="round">`;
      });
      return cleaned;

    default:
      // Si el diseño ya tiene colores propios, respetarlos siempre
      return cleaned;
  }

  return cleaned;
}

/**
 * Ensambla un SVG limpio a partir de un KaiCustomForm preexistente (fallback si no tiene svgContent)
 */
export function buildSvgFromCustomForm(customForm: KaiCustomForm): string {
  const artStyle = customForm.artStyle || 'neon-geometry';
  const polygonsSvg = (customForm.polygons || [])
    .map((p) => {
      const op = (p as any).fillOpacity ? ` fill-opacity="${(p as any).fillOpacity}"` : '';
      return `<polygon points="${p.points}"${op} />`;
    })
    .join('\n    ');

  const linesSvg = (customForm.lines || [])
    .map((l) => `<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" />`)
    .join('\n    ');

  const eyesSvg = customForm.dualEyes
    ? `
    <g class="kai-specular-eyes">
      <ellipse cx="${customForm.dualEyes.left.cx}" cy="${customForm.dualEyes.left.cy}" rx="${customForm.dualEyes.left.rx || 7}" ry="${customForm.dualEyes.left.ry || 7}" fill="#ffffff" />
      <ellipse cx="${customForm.dualEyes.right.cx}" cy="${customForm.dualEyes.right.cy}" rx="${customForm.dualEyes.right.rx || 7}" ry="${customForm.dualEyes.right.ry || 7}" fill="#ffffff" />
      <circle cx="${customForm.dualEyes.left.cx}" cy="${customForm.dualEyes.left.cy}" r="3" fill="#020813" />
      <circle cx="${customForm.dualEyes.right.cx}" cy="${customForm.dualEyes.right.cy}" r="3" fill="#020813" />
    </g>`
    : '';

  const mouthSvg = customForm.mouth?.d
    ? `<path d="${customForm.mouth.d}" />`
    : '';

  return `
<svg viewBox="0 0 160 170" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <g class="kai-multiverse-body" data-art-style="${artStyle}">
    ${polygonsSvg}
    ${linesSvg}
    ${mouthSvg}
    ${eyesSvg}
  </g>
</svg>`.trim();
}

/**
 * COMPONENTE KAICompanion
 * Arquitectura 100% SVG Multi-Estilo de la Forja Neural.
 * Inyecta dinámicamente --color-aura-activa al stroke o fill del SVG devuelto.
 */
export const KAICompanion: React.FC<KAICompanionProps> = ({
  customForm,
  shapeId,
  auraColor,
  size = 'md',
  className = '',
  interactive = true,
  onClick,
  auraState = 'normal',
  eyeOffset: propEyeOffset,
  isTrackingMouse: propIsTrackingMouse,
  isSpeaking: propIsSpeaking,
}) => {
  const stats = usePlayerStore((s) => s.stats);

  const [internalEyeOffset, setInternalEyeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [internalIsTracking, setInternalIsTracking] = useState(false);
  const [justClicked, setJustClicked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Escuchar cursor de ratón en escritorio y toques/taps de dedos en teléfonos
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

      setInternalIsTracking(true);
      const maxRadiusX = 8.5;
      const maxRadiusY = 5.0;

      const angle = Math.atan2(deltaY, deltaX);
      const intensity = Math.min(Math.max(distance / 200, 0.35), 1);

      setInternalEyeOffset({
        x: Math.cos(angle) * maxRadiusX * intensity,
        y: Math.sin(angle) * maxRadiusY * intensity,
      });

      if (pointerTimeoutRef.current) clearTimeout(pointerTimeoutRef.current);
      pointerTimeoutRef.current = setTimeout(() => {
        setInternalIsTracking(false);
        setInternalEyeOffset({ x: 0, y: 0 });
      }, 2600);
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
      if (pointerTimeoutRef.current) clearTimeout(pointerTimeoutRef.current);
    };
  }, [interactive]);

  const effectiveEyeOffset = propEyeOffset || internalEyeOffset;
  const effectiveIsTracking = propIsTrackingMouse !== undefined ? propIsTrackingMouse : internalIsTracking;
  const effectiveIsSpeaking = propIsSpeaking || justClicked;

  const handleClick = (e: React.MouseEvent) => {
    soundFX.playClick();
    setJustClicked(true);
    setTimeout(() => setJustClicked(false), 1400);
    if (onClick) onClick();
  };

  const effectiveShape: KaiShapeKey = shapeId || stats?.kaiShape || 'prism';
  const effectiveCustomForm = customForm !== undefined ? customForm : stats?.kaiCustomForm;

  // Modulación cromática del aura activa
  const effectiveAuraColor = useMemo(() => {
    if (auraState === 'warning_amber') return '#f59e0b';
    if (auraColor) return auraColor;
    if (stats?.kaiAuraColor) return stats.kaiAuraColor;
    return '#00f0ff';
  }, [auraState, auraColor, stats?.kaiAuraColor]);

  // Dimensiones según el prop size
  const { widthPx, heightPx } = useMemo(() => {
    if (typeof size === 'number') {
      return { widthPx: size, heightPx: Math.round(size * 1.06) };
    }
    switch (size) {
      case 'nano':
        return { widthPx: 46, heightPx: 49 };
      case 'xs':
        return { widthPx: 76, heightPx: 81 };
      case 'sm':
        return { widthPx: 112, heightPx: 119 };
      case 'lg':
        return { widthPx: 210, heightPx: 223 };
      case 'xl':
        return { widthPx: 265, heightPx: 281 };
      case 'md':
      default:
        return { widthPx: 152, heightPx: 161 };
    }
  }, [size]);

  // Obtener URL de imagen si es una rama de ilustración real (o hidratar de localStorage)
  const effectiveImageUrl = useMemo(() => {
    if (effectiveShape !== 'custom' || !effectiveCustomForm) return null;
    if (effectiveCustomForm.imageUrl) return effectiveCustomForm.imageUrl;
    if (effectiveCustomForm.storageRef && typeof window !== 'undefined') {
      const storageKey = effectiveCustomForm.storageRef.replace('local:', '');
      return window.localStorage.getItem(storageKey) || null;
    }
    return null;
  }, [effectiveShape, effectiveCustomForm]);

  // Procesamiento SVG con inyección de --color-aura-activa y motor de vida orgánica
  const renderedSvgHtml = useMemo(() => {
    if (effectiveShape !== 'custom' || !effectiveCustomForm || effectiveImageUrl) return null;

    const baseSvg =
      effectiveCustomForm.svgContent ||
      buildSvgFromCustomForm(effectiveCustomForm);

    const artStyle = effectiveCustomForm.artStyle || 'neon-geometry';
    return injectAuraColorIntoSvg(baseSvg, artStyle, effectiveAuraColor, {
      eyeOffset: effectiveEyeOffset,
      isTracking: effectiveIsTracking,
      isSpeaking: effectiveIsSpeaking,
    });
  }, [effectiveShape, effectiveCustomForm, effectiveImageUrl, effectiveAuraColor, effectiveEyeOffset, effectiveIsTracking, effectiveIsSpeaking]);

  return (
    <motion.div
      ref={containerRef}
      style={
        {
          '--color-aura-activa': effectiveAuraColor,
          color: effectiveAuraColor,
          width: `${widthPx}px`,
          height: `${heightPx}px`,
        } as React.CSSProperties
      }
      className={`relative select-none flex items-center justify-center ${
        interactive ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={handleClick}
      animate={{
        y: [0, -6, 0],
        scaleY: [1, 1.025, 1],
        scaleX: [1, 0.985, 1],
      }}
      transition={{
        duration: 4.4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {/* 1. RENDERIZADO FORJA NEURAL: RAMA ILUSTRACIÓN REAL (OPCIÓN A: ARTE HD + OJOS VIVOS) */}
      {effectiveShape === 'custom' && effectiveImageUrl ? (
        <motion.div
          className="w-full h-full flex items-center justify-center relative"
          animate={{
            scale: [1, 1.025, 1],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <img
            src={effectiveImageUrl}
            alt={effectiveCustomForm?.name || 'Compañero KAI'}
            className="w-full h-full object-contain pointer-events-none select-none transition-all duration-300"
            style={{
              filter: `drop-shadow(0 0 16px ${effectiveAuraColor}80) drop-shadow(0 0 28px ${effectiveAuraColor}40)`,
            }}
          />

          {/* Onda de voz al hacer clic o interactuar */}
          {effectiveIsSpeaking && (
            <svg
              viewBox="0 0 160 170"
              className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
            >
              <circle cx="80" cy="98" r="14" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.8">
                <animate attributeName="r" from="6" to="28" dur="0.55s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.9" to="0" dur="0.55s" repeatCount="indefinite" />
              </circle>
            </svg>
          )}
        </motion.div>
      ) : effectiveShape === 'custom' && renderedSvgHtml ? (
        /* 2. RENDERIZADO FORJA NEURAL: RAMA VECTORIAL VIVA */
        <div
          className="w-full h-full flex items-center justify-center transition-all duration-300 [&>svg]:w-full [&>svg]:h-full [&>svg]:overflow-visible"
          style={{
            filter: `drop-shadow(0 0 14px ${effectiveAuraColor}70)`,
          }}
          dangerouslySetInnerHTML={{ __html: renderedSvgHtml }}
        />
      ) : (
        /* 3. RENDERIZADO FORMA BASE GÉNESIS (EL PRISMA) */
        <div className="w-full h-full flex items-center justify-center">
          <KaiVectorGraphics
            shapeId={effectiveShape}
            activeColor={effectiveAuraColor}
            secondaryColor={effectiveAuraColor}
            customForm={effectiveCustomForm}
            glowFilterId="kai-companion-aura-glow"
            eyeOffset={effectiveEyeOffset}
            isTrackingMouse={effectiveIsTracking}
            justClicked={effectiveIsSpeaking}
          />
        </div>
      )}

      {/* 4. EFECTOS COSMÉTICOS Y RELIQUIAS DE ARMERÍA */}
      <KaiCosmeticEffects
        effectId={stats?.kaiParticleEffect || 'none'}
        activeColor={effectiveAuraColor}
      />
    </motion.div>
  );
};
