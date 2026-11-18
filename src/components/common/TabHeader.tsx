import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { soundFX } from '../../utils/audio';

export interface TabHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  onBack?: () => void;
  backLabel?: string;
  rightSlot?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Encabezado Canónico Obsidian Glass + Aura Dinámica para todas las pestañas de La Solución.
 * Garantiza 100% uniformidad en superficie, micrograno, filamento superior, tipografía y jerarquía.
 */
export const TabHeader: React.FC<TabHeaderProps> = ({
  title,
  subtitle,
  badge,
  icon,
  onBack,
  backLabel = 'Volver',
  rightSlot,
  children,
  className = '',
}) => {
  return (
    <div
      className={`relative isolate rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden p-3.5 sm:p-5 ${className}`}
    >
      {/* Micrograno táctil Moxen Vidrio */}
      <span className="vi-grano opacity-5" aria-hidden="true" />

      {/* Filamento especular superior sincronizado con Aura */}
      <div
        className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onBack();
                }}
                aria-label={backLabel}
                title={backLabel}
                className="chicle-btn w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-200 hover:text-white flex items-center justify-center shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {icon && (
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: 'rgba(var(--aura-glow-rgb, 0, 240, 255), 0.12)',
                  borderColor: 'rgba(var(--aura-glow-rgb, 0, 240, 255), 0.35)',
                  color: 'var(--aura-color-1, #00f0ff)',
                }}
              >
                {icon}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-anton uppercase tracking-wider text-white leading-tight truncate">
                  {title}
                </h2>
                {badge}
              </div>
              {subtitle && (
                <p className="text-[11px] sm:text-xs text-slate-400 font-sans mt-0.5 leading-snug">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {rightSlot && (
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {rightSlot}
            </div>
          )}
        </div>

        {children && (
          <div className="pt-2.5 border-t border-white/[0.07]">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default TabHeader;
