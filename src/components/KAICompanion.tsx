import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { KaiCustomForm, KaiMultiverseStyle, KaiShapeKey } from '../types';
import { KaiVectorGraphics } from './KaiVectorGraphics';
import { usePlayerStore } from '../store/usePlayerStore';

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
}

/**
 * Inyecta el color de la variable --color-aura-activa al atributo stroke o fill
 * del código SVG devuelto por la Forja Neural según el estilo seleccionado:
 *
 * 1. "Geometría Neón": stroke="var(--color-aura-activa)", stroke-width="2", fill="none"
 * 2. "Cyber-Pixel": fill="var(--color-aura-activa)", shape-rendering="crispEdges"
 * 3. "Flujo Orgánico": stroke="var(--color-aura-activa)", stroke-width="2", fill="none"
 * 4. "Low Poly": fill="var(--color-aura-activa)", stroke="none", preservando fill-opacity
 */
export function injectAuraColorIntoSvg(
  rawSvg: string,
  artStyle: KaiMultiverseStyle = 'neon-geometry',
  auraColor: string = '#00f0ff'
): string {
  if (!rawSvg || typeof rawSvg !== 'string') return '';

  let cleaned = rawSvg.trim();

  // Eliminar fences markdown si vinieron de la IA
  cleaned = cleaned.replace(/^```(?:svg|xml|html)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Extraer el elemento <svg> si está embebido en texto
  const svgMatch = cleaned.match(/<svg[\s\S]*?<\/svg>/i);
  if (svgMatch) {
    cleaned = svgMatch[0];
  } else if (!cleaned.startsWith('<svg')) {
    // Si la IA devolvió solo los elementos internos (sin la etiqueta raíz <svg>)
    cleaned = `<svg viewBox="0 0 160 170" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">${cleaned}</svg>`;
  }

  // Asegurar atributos estándar en <svg>
  cleaned = cleaned.replace(/<svg\b([^>]*)>/i, (_match, attrs) => {
    let newAttrs = attrs;
    if (!newAttrs.includes('viewBox')) newAttrs += ' viewBox="0 0 160 170"';
    if (!newAttrs.includes('xmlns')) newAttrs += ' xmlns="http://www.w3.org/2000/svg"';
    if (!newAttrs.includes('width')) newAttrs += ' width="100%"';
    if (!newAttrs.includes('height')) newAttrs += ' height="100%"';
    return `<svg ${newAttrs.trim()}>`;
  });

  const auraVarStroke = 'var(--color-aura-activa, currentColor)';
  const auraVarFill = 'var(--color-aura-activa, currentColor)';

  switch (artStyle) {
    case 'cyber-pixel':
    case 'pixel':
      // Regla Cyber-Pixel: fill="var(--color-aura-activa)", shape-rendering="crispEdges" en <rect>
      cleaned = cleaned.replace(/<rect\b([^>]*)>/gi, (_match, attrs) => {
        // Remover fills y strokes previos para aplicar el token de aura
        let mod = attrs.replace(/\bfill="[^"]*"/gi, '').replace(/\bstroke="[^"]*"/gi, '');
        if (!mod.includes('shape-rendering')) mod += ' shape-rendering="crispEdges"';
        return `<rect ${mod.trim()} fill="${auraVarFill}">`;
      });
      break;

    case 'organic-flow':
      // Regla Flujo Orgánico: exclusivamente curvas suaves, stroke-width="2", fill="none"
      cleaned = cleaned.replace(/<path\b([^>]*)>/gi, (_match, attrs) => {
        let mod = attrs
          .replace(/\bstroke="[^"]*"/gi, '')
          .replace(/\bfill="[^"]*"/gi, '')
          .replace(/\bstroke-width="[^"]*"/gi, '');
        return `<path ${mod.trim()} stroke="${auraVarStroke}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">`;
      });
      break;

    case 'low-poly':
      // Regla Low Poly: fill="var(--color-aura-activa)", stroke="none", asignando fill-opacity
      let polyIndex = 0;
      cleaned = cleaned.replace(/<polygon\b([^>]*)>/gi, (_match, attrs) => {
        let mod = attrs.replace(/\bfill="[^"]*"/gi, '').replace(/\bstroke="[^"]*"/gi, '');
        // Si no tiene fill-opacity, asignar uno pseudo-aleatorio armonizado entre 0.15 y 0.85
        if (!mod.includes('fill-opacity')) {
          const pseudoOpacity = (0.2 + ((polyIndex * 0.19) % 0.65)).toFixed(2);
          mod += ` fill-opacity="${pseudoOpacity}"`;
        }
        polyIndex++;
        return `<polygon ${mod.trim()} fill="${auraVarFill}" stroke="none">`;
      });
      break;

    case 'neon-geometry':
    default:
      // Regla Geometría Neón (Default): <polygon> y <path> simétricos, stroke-width="2", fill="none"
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
      break;
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
}) => {
  const stats = usePlayerStore((s) => s.stats);

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
        return { widthPx: 38, heightPx: 40 };
      case 'xs':
        return { widthPx: 64, heightPx: 68 };
      case 'sm':
        return { widthPx: 96, heightPx: 102 };
      case 'lg':
        return { widthPx: 180, heightPx: 191 };
      case 'xl':
        return { widthPx: 230, heightPx: 244 };
      case 'md':
      default:
        return { widthPx: 130, heightPx: 138 };
    }
  }, [size]);

  // Procesamiento SVG con inyección de --color-aura-activa
  const renderedSvgHtml = useMemo(() => {
    if (effectiveShape !== 'custom' || !effectiveCustomForm) return null;

    const baseSvg =
      effectiveCustomForm.svgContent ||
      buildSvgFromCustomForm(effectiveCustomForm);

    const artStyle = effectiveCustomForm.artStyle || 'neon-geometry';
    return injectAuraColorIntoSvg(baseSvg, artStyle, effectiveAuraColor);
  }, [effectiveShape, effectiveCustomForm, effectiveAuraColor]);

  return (
    <motion.div
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
      onClick={onClick}
      animate={{
        y: [0, -5, 0],
      }}
      transition={{
        duration: 4.8,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {/* 1. RENDERIZADO FORJA NEURAL: 100% SVG NATIVO CON AURA ACTIVA */}
      {effectiveShape === 'custom' && renderedSvgHtml ? (
        <div
          className="w-full h-full flex items-center justify-center transition-all duration-300 [&>svg]:w-full [&>svg]:h-full [&>svg]:overflow-visible"
          style={{
            filter: `drop-shadow(0 0 14px ${effectiveAuraColor}70)`,
          }}
          dangerouslySetInnerHTML={{ __html: renderedSvgHtml }}
        />
      ) : (
        /* 2. RENDERIZADO FORMAS BASE OFICIALES (PRISMA, OCTAEDRO, LOBO, ETC.) */
        <div className="w-full h-full flex items-center justify-center">
          <KaiVectorGraphics
            shapeId={effectiveShape}
            activeColor={effectiveAuraColor}
            secondaryColor={effectiveAuraColor}
            customForm={effectiveCustomForm}
            glowFilterId="kai-companion-aura-glow"
          />
        </div>
      )}
    </motion.div>
  );
};
