import React from 'react';
import { Plus, ShieldCheck, FilterX, RefreshCw, Radar } from 'lucide-react';
import { soundFX } from '../../utils/audio';
import { useNarrativeCopy } from '../../hooks/useNarrativeCopy';

interface SciFiEmptyStateProps {
  totalTasksInDay: number;
  selectedCategory: string;
  activeFilter: string;
  searchTerm: string;
  onAddTask: () => void;
  onResetDay?: () => void;
  onClearFilters?: () => void;
}

export const SciFiEmptyState: React.FC<SciFiEmptyStateProps> = ({
  totalTasksInDay,
  selectedCategory,
  activeFilter,
  searchTerm,
  onAddTask,
  onResetDay,
  onClearFilters,
}) => {
  const isFiltered = selectedCategory !== 'todos' || activeFilter !== 'todos' || Boolean(searchTerm);
  const copy = useNarrativeCopy();

  return (
    <div className="relative isolate overflow-hidden rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] border border-white/10 p-6 sm:p-10 text-center shadow-[0_12px_36px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all my-4">
      <span className="vi-grano opacity-5" aria-hidden="true" />
      <div className="absolute top-0 inset-x-0 h-px aura-top-filament pointer-events-none" aria-hidden="true" />

      {/* Subtle Neutral Radial Background Effect (oculto en Noir Claro para papel 100% puro) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(var(--aura-glow-rgb,0,240,255),0.08)_0%,transparent_70%)] pointer-events-none scifi-empty-radial" />

      <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto">
        {/* Hologram Badge Icon */}
        <div className="relative mb-4 flex items-center justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl aura-bg-soft border flex items-center justify-center aura-glow-subtle">
            {isFiltered ? (
              <FilterX className="w-8 h-8 sm:w-10 sm:h-10 aura-text-primary animate-pulse" />
            ) : totalTasksInDay === 0 ? (
              <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
            ) : (
              <Radar className="w-8 h-8 sm:w-10 sm:h-10 aura-text-primary animate-pulse" />
            )}
          </div>
        </div>

        {/* Headline */}
        <h3 className="text-base sm:text-lg font-anton uppercase tracking-wider text-white mb-1.5">
          {searchTerm
            ? 'Sin resultados'
            : selectedCategory !== 'todos'
            ? `Categoría vacía: ${selectedCategory}`
            : activeFilter !== 'todos'
            ? `Sin registros en este filtro`
            : copy.emptyClearHeadline}
        </h3>

        {/* Descriptive Body Copy */}
        <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed mb-6">
          {searchTerm ? (
            <>Sin coincidencias para <span className="aura-text-primary font-bold">"{searchTerm}"</span>.</>
          ) : isFiltered ? (
            copy.emptyFilterDescription
          ) : (
            copy.emptyClearDescription
          )}
        </p>

        {/* Interactive Buttons */}
        <div className="flex items-center justify-center gap-3 flex-wrap w-full">
          {/* Primary Create Task Button con Aura Dinámica */}
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onAddTask();
            }}
            className="btn-neon-hunter chicle-btn aura-btn-gradient optic-active-card min-h-[44px] px-5 py-2 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer uppercase font-anton tracking-wider"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{copy.emptyPrimaryCta}</span>
          </button>

          {/* Reset Routine Button */}
          {totalTasksInDay === 0 && onResetDay && (
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onResetDay();
              }}
              className="chicle-btn min-h-[44px] px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-anton text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
            >
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <span>{copy.emptyResetDayCta}</span>
            </button>
          )}

          {/* Clear Filters Button */}
          {isFiltered && onClearFilters && (
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onClearFilters();
              }}
              className="chicle-btn min-h-[44px] px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/15 font-anton text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
            >
              <FilterX className="w-4 h-4 aura-text-primary" />
              <span>VER TODAS</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
