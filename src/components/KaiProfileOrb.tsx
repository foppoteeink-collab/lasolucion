import React, { useMemo, useId } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { HoloCompanion } from './HoloCompanion';
import { KaiShapeKey } from '../types';

interface KaiProfileOrbProps {
  size?: number; // base size in px (defaults to 42)
  className?: string;
  showXpRing?: boolean;
}

export const KaiProfileOrb: React.FC<KaiProfileOrbProps> = ({
  size = 42,
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
  const characterClass = stats.characterClass || 'heroe';
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

  // Color de la baliza cuántica (oro para racha destacada, cian para modo activo)
  const beaconColor = streakDays >= 7 ? '#fbbf24' : '#00f0ff';

  return (
    <div
      className={`relative rounded-xl sm:rounded-2xl bg-[#030712] flex items-center justify-center select-none group-hover:scale-105 transition-transform duration-300 ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        boxShadow: '0 0 16px rgba(0, 240, 255, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
      }}
      title={`KAI • Nivel ${level} (${Math.round(xpPercent)}% hacia Nivel ${level + 1}) - Toca para abrir tu Perfil`}
    >
      {/* ─── 1. Resplandor Ambiental Aurora Dinámico (Sincronizado con el Logo) ─── */}
      <div
        className="absolute -inset-1 rounded-2xl kai-orb-aurora-glow opacity-35 blur-md pointer-events-none group-hover:opacity-60 transition-opacity duration-300"
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

      {/* ─── 3. Micro-KAI Vivo Forjado en el Centro (Opción 1) ─── */}
      <div className="relative z-10 flex items-center justify-center w-full h-full p-1.5 overflow-hidden">
        {effectiveImageUrl ? (
          /* Forja personalizada con retrato/imagen (ej. Fuzz Kitty o imagen forjada) */
          <div className="w-full h-full flex items-center justify-center animate-kai-micro-float">
            <img
              src={effectiveImageUrl}
              alt={customForm?.name || 'KAI'}
              className="w-6 h-6 sm:w-7 sm:h-7 object-contain drop-shadow-[0_2px_8px_rgba(0,240,255,0.65)] pointer-events-none"
            />
          </div>
        ) : (
          /* Forja procedural, SVG o forma oficial (HoloCompanion optimizado a micro-escala) */
          <div className="w-full h-full flex items-center justify-center animate-kai-micro-float" data-preserve-optic="true">
            <HoloCompanion
              archetype={characterClass}
              shapeKey={kaiShape}
              customForm={customForm}
              size={20}
              interactive={false}
              showHUD={false}
            />
          </div>
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
