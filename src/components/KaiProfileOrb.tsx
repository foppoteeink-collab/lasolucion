import React, { useMemo, useId } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { KaiShapeKey } from '../types';

interface KaiProfileOrbProps {
  size?: number; // Tamaño base en px (por defecto 40-42)
  className?: string;
  showXpRing?: boolean;
}

export const KaiProfileOrb: React.FC<KaiProfileOrbProps> = ({
  size = 40,
  className = '',
  showXpRing = true,
}) => {
  const reactId = useId().replace(/:/g, '_');
  const gradientId = `kai-orb-gradient-${reactId}`;
  
  const stats = usePlayerStore((s) => s.stats);
  const level = stats.level || 1;
  const currentXp = stats.currentXp || 0;
  const requiredXp = stats.requiredXp || 100;
  const streakDays = stats.streakDays || 0;
  const kaiShape: KaiShapeKey = stats.kaiShape || 'prism';
  const customForm = stats.kaiCustomForm;

  // Porcentaje exacto de progreso hacia el siguiente nivel
  const xpPercent = Math.min(100, Math.max(0, (currentXp / Math.max(1, requiredXp)) * 100));

  // Hidratar imagen personalizada de KAI si fue forjada
  const effectiveImageUrl = useMemo(() => {
    if (kaiShape !== 'custom' || !customForm) return null;
    if (customForm.imageUrl) return customForm.imageUrl;
    if (customForm.storageRef && typeof window !== 'undefined') {
      const storageKey = customForm.storageRef.replace('local:', '');
      return window.localStorage.getItem(storageKey) || null;
    }
    return null;
  }, [kaiShape, customForm]);

  // Detector de forma felina/mascota si no tiene imagen directa
  const isCatForm = useMemo(() => {
    const name = (customForm?.name || '').toLowerCase();
    const obj = (customForm?.detectedObject || '').toLowerCase();
    const style = (customForm?.artStyle || '').toLowerCase();
    return (
      name.includes('fuzz') ||
      name.includes('gato') ||
      name.includes('cat') ||
      name.includes('kitty') ||
      obj.includes('gato') ||
      obj.includes('cat') ||
      style.includes('fuzz')
    );
  }, [customForm]);

  // Color de la baliza cuántica (oro si racha destacada, cian activo)
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
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
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
            stroke={`url(#${gradientId})`}
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

      {/* ─── 3. Pura Silueta Minimalista de KAI (Limpia, icónica y bañada en la Aurora) ─── */}
      <div className="relative z-10 flex items-center justify-center w-full h-full p-2 pointer-events-none">
        {effectiveImageUrl ? (
          /* Silueta Pura de la Forja (Enmascarada con el flujo cromático aurora) */
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
        ) : isCatForm ? (
          /* Silueta Felina / Fuzz Kitty en glifo de neón aurora */
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 sm:w-6 sm:h-6 pointer-events-none group-hover:scale-110 transition-transform duration-300"
            fill="none"
            style={{ filter: 'drop-shadow(0 0 5px rgba(0, 240, 255, 0.8))' }}
          >
            <path
              d="M4 19c0-3.5 2.5-6.5 8-6.5s8 3 8 6.5M6.5 13.5L4 6.5l5.5 3M17.5 13.5L20 6.5l-5.5 3"
              stroke={`url(#${gradientId})`}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="9" cy="14" r="1.3" fill={`url(#${gradientId})`} />
            <circle cx="15" cy="14" r="1.3" fill={`url(#${gradientId})`} />
          </svg>
        ) : (
          /* Silueta canónica de KAI: Prisma Cuántico Sagrado */
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 sm:w-6 sm:h-6 pointer-events-none group-hover:scale-110 transition-transform duration-300"
            fill="none"
            style={{ filter: 'drop-shadow(0 0 5px rgba(0, 240, 255, 0.8))' }}
          >
            {/* Silueta pura del prisma */}
            <path
              d="M12 2.5L2.5 19.5h19L12 2.5z"
              stroke={`url(#${gradientId})`}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Vértices facetados internos */}
            <path
              d="M12 2.5v17M2.5 19.5l9.5-6.5 9.5 6.5"
              stroke={`url(#${gradientId})`}
              strokeWidth="1.3"
              strokeLinejoin="round"
              opacity="0.85"
            />
            {/* Núcleo de conciencia / Ojo central */}
            <circle
              cx="12"
              cy="13"
              r="2"
              fill={`url(#${gradientId})`}
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
