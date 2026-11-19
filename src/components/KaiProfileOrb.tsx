import React, { useMemo, useId } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { buildSvgFromCustomForm } from './KAICompanion';
import { KaiShapeKey } from '../types';

interface KaiProfileOrbProps {
  size?: number; // Tamaño base en px (por defecto 40-42)
  className?: string;
  showXpRing?: boolean;
}

/**
 * Convierte cualquier SVG complejo de una forja en una silueta vectorial pura,
 * eliminando rellenos de colores dispares y bañando todas las líneas y formas
 * en el gradiente de neón aurora.
 */
function convertSvgToSilhouette(rawSvg: string, gradientId: string): string {
  if (!rawSvg || typeof rawSvg !== 'string') return '';
  let cleaned = rawSvg.trim();

  // Limpiar fences markdown
  cleaned = cleaned.replace(/^```(?:svg|xml|html)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Extraer bloque svg
  const openIdx = cleaned.indexOf('<svg');
  const closeIdx = cleaned.lastIndexOf('</svg>');
  if (openIdx !== -1 && closeIdx !== -1 && closeIdx > openIdx) {
    cleaned = cleaned.substring(openIdx, closeIdx + 6);
  } else if (!cleaned.startsWith('<svg')) {
    cleaned = `<svg viewBox="0 0 160 170" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">${cleaned}</svg>`;
  }

  // Eliminar rectángulos de fondo opacos que tapen el avatar
  cleaned = cleaned.replace(/<rect[^>]*(?:width=["'](?:100%|300|160|200)["'])[^>]*\/>/gi, '');
  cleaned = cleaned.replace(/<rect[^>]*(?:fill=["']#(?:000|000000|040a1a|030712|050b1a|fff|ffffff)["']|fill=["'](?:black|white)["'])[^>]*\/>/gi, '');

  // Transformar todas las formas del avatar en trazos de silueta neón
  const tagRegex = /<(path|polygon|polyline|circle|ellipse|line|rect)\b([^>]*?)(\/?)>/gi;
  cleaned = cleaned.replace(tagRegex, (_match, tag, attrs, slash) => {
    let mod = attrs
      .replace(/\bstroke=["'][^"']*["']/gi, '')
      .replace(/\bfill=["'][^"']*["']/gi, '')
      .replace(/\bstroke-width=["'][^"']*["']/gi, '')
      .replace(/\bfill-opacity=["'][^"']*["']/gi, '')
      .replace(/\bstyle=["'][^"']*["']/gi, '');
    const closeStr = slash ? ' />' : '>';
    return `<${tag} ${mod.trim()} stroke="url(#${gradientId})" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="url(#${gradientId})" fill-opacity="0.14"${closeStr}`;
  });

  // Inyectar defs del gradiente aurora de alta fidelidad
  const gradDefs = `<defs><linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00f0ff"/><stop offset="35%" stop-color="#a855f7"/><stop offset="70%" stop-color="#ec4899"/><stop offset="100%" stop-color="#f59e0b"/></linearGradient></defs>`;
  cleaned = cleaned.replace(/<svg\b([^>]*)>/i, `<svg $1 width="100%" height="100%">${gradDefs}`);

  return cleaned;
}

export const KaiProfileOrb: React.FC<KaiProfileOrbProps> = ({
  size = 40,
  className = '',
  showXpRing = true,
}) => {
  const reactId = useId().replace(/:/g, '_');
  const gradientId = `kai-orb-grad-${reactId}`;
  
  const stats = usePlayerStore((s) => s.stats);
  const level = stats.level || 1;
  const currentXp = stats.currentXp || 0;
  const requiredXp = stats.requiredXp || 100;
  const streakDays = stats.streakDays || 0;
  const kaiShape: KaiShapeKey = stats.kaiShape || 'prism';

  // Buscar forja activa con tolerancia a bóvedas o personalizaciones
  const activeCustomForm = useMemo(() => {
    if (stats?.kaiCustomForm) return stats.kaiCustomForm;
    if (Array.isArray(stats?.kaiVault) && stats.kaiVault.length > 0) {
      return stats.kaiVault[0];
    }
    return null;
  }, [stats?.kaiCustomForm, stats?.kaiVault]);

  // Porcentaje exacto de progreso hacia el siguiente nivel
  const xpPercent = Math.min(100, Math.max(0, (currentXp / Math.max(1, requiredXp)) * 100));

  // 1. Imagen rasterizada (si la forja fue generada como foto/dibujo)
  const effectiveImageUrl = useMemo(() => {
    if (!activeCustomForm) return null;
    if (activeCustomForm.imageUrl) return activeCustomForm.imageUrl;
    if (activeCustomForm.storageRef && typeof window !== 'undefined') {
      const storageKey = activeCustomForm.storageRef.replace('local:', '');
      return window.localStorage.getItem(storageKey) || null;
    }
    return null;
  }, [activeCustomForm]);

  // 2. SVG de la forja (si la forja fue generada como vector, como el personaje con cabello rizado)
  const effectiveSvg = useMemo(() => {
    if (activeCustomForm?.svgContent) return activeCustomForm.svgContent;
    if (activeCustomForm && (activeCustomForm.polygons || activeCustomForm.lines)) {
      return buildSvgFromCustomForm(activeCustomForm);
    }
    return null;
  }, [activeCustomForm]);

  // Silueta vectorial convertida a neón aurora
  const silhouetteSvgHtml = useMemo(() => {
    if (!effectiveSvg) return null;
    return convertSvgToSilhouette(effectiveSvg, gradientId);
  }, [effectiveSvg, gradientId]);

  // Baliza de prestigio (oro si racha destacada, cian activo)
  const beaconColor = streakDays >= 7 ? '#fbbf24' : '#00f0ff';

  return (
    <div
      className={`relative rounded-xl sm:rounded-2xl bg-[#040817] flex items-center justify-center select-none group-hover:scale-105 transition-transform duration-300 ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        boxShadow: '0 0 16px rgba(0, 240, 255, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.08)',
      }}
      title={`KAI • Nivel ${level} (${Math.round(xpPercent)}% hacia Nivel ${level + 1}) - Toca para abrir tu Perfil`}
    >
      {/* ─── 1. Resplandor Ambiental Aurora Dinámico (Sincronizado con el Logo) ─── */}
      <div
        className="absolute -inset-1 rounded-2xl kai-orb-aurora-glow opacity-30 blur-md pointer-events-none group-hover:opacity-55 transition-opacity duration-300"
      />

      {/* ─── 2. Anillo de Progreso de XP perimetral (Opción 2) ─── */}
      {showXpRing && (
        <svg
          viewBox="0 0 44 44"
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-20"
        >
          <defs>
            <linearGradient id={`${gradientId}-ring`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="35%" stopColor="#a855f7" />
              <stop offset="70%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>

          {/* Carril de fondo */}
          <rect
            x="2.5"
            y="2.5"
            width="39"
            height="39"
            rx="12"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="2"
          />

          {/* Trazo activo de XP que se llena de 0% a 100% */}
          <rect
            x="2.5"
            y="2.5"
            width="39"
            height="39"
            rx="12"
            fill="none"
            stroke={`url(#${gradientId}-ring)`}
            strokeWidth="2.4"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={100 - xpPercent}
            style={{
              transition: 'stroke-dashoffset 0.85s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        </svg>
      )}

      {/* ─── 3. Pura Silueta Minimalista de KAI (Tu Forja Activa en Neón Aurora) ─── */}
      <div className="relative z-10 flex items-center justify-center w-full h-full p-2 pointer-events-none">
        {effectiveImageUrl ? (
          /* Silueta de imagen forjada (Enmascarada con el flujo cromático aurora) */
          <div
            className="w-5 h-5 sm:w-6 sm:h-6 pointer-events-none transition-transform duration-300 group-hover:scale-110"
            style={{
              WebkitMaskImage: `url(${effectiveImageUrl})`,
              maskImage: `url(${effectiveImageUrl})`,
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
              backgroundImage: 'linear-gradient(135deg, #00f0ff 0%, #a855f7 35%, #ec4899 70%, #f59e0b 100%)',
              backgroundSize: '300% 300%',
              animation: 'logo-aurora-flow 7s ease-in-out infinite',
              filter: 'drop-shadow(0 0 6px rgba(0, 240, 255, 0.8))',
            }}
          />
        ) : silhouetteSvgHtml ? (
          /* Silueta Vectorial Pura de TU PERSONAJE FORJADO (Sin colores de ropa ni carne, puro neón) */
          <div
            className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center pointer-events-none transition-transform duration-300 group-hover:scale-110 [&>svg]:w-full [&>svg]:h-full [&>svg]:overflow-visible"
            style={{
              filter: 'drop-shadow(0 0 5px rgba(0, 240, 255, 0.8))',
            }}
            dangerouslySetInnerHTML={{ __html: silhouetteSvgHtml }}
          />
        ) : (
          /* Silueta canónica de KAI: Prisma Cuántico Sagrado (Sólo si no hay ninguna forja activa) */
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 sm:w-6 sm:h-6 pointer-events-none group-hover:scale-110 transition-transform duration-300"
            fill="none"
            style={{ filter: 'drop-shadow(0 0 5px rgba(0, 240, 255, 0.8))' }}
          >
            <defs>
              <linearGradient id={`${gradientId}-prism`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" />
                <stop offset="35%" stopColor="#a855f7" />
                <stop offset="70%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            <path
              d="M12 2.5L2.5 19.5h19L12 2.5z"
              stroke={`url(#${gradientId}-prism)`}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M12 2.5v17M2.5 19.5l9.5-6.5 9.5 6.5"
              stroke={`url(#${gradientId}-prism)`}
              strokeWidth="1.3"
              strokeLinejoin="round"
              opacity="0.85"
            />
            <circle
              cx="12"
              cy="13"
              r="2"
              fill={`url(#${gradientId}-prism)`}
            />
          </svg>
        )}
      </div>

      {/* ─── 4. Vértice Cuántico / Baliza de Prestigio (Esquina Superior Derecha) ─── */}
      <span
        className="absolute top-0.5 right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full z-30 pointer-events-none transition-colors duration-300"
        style={{
          backgroundColor: beaconColor,
          boxShadow: `0 0 8px ${beaconColor}, 0 0 3px #ffffff`,
        }}
      />
    </div>
  );
};

export default KaiProfileOrb;
