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
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#001428]/90 border border-blue-500/40 p-6 sm:p-10 text-center shadow-[0_0_30px_rgba(0,140,255,0.15)] backdrop-blur-md transition-all my-4">
      {/* Sci-Fi Decorative Corner Accents */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400/80 rounded-tl-sm pointer-events-none" />
      <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400/80 rounded-tr-sm pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400/80 rounded-bl-sm pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400/80 rounded-br-sm pointer-events-none" />

      {/* Subtle Neutral Radial Background Effect (oculto en Noir Claro para papel 100% puro) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(148,163,184,0.08)_0%,transparent_70%)] pointer-events-none scifi-empty-radial" />

      <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto">
        {/* Hologram Badge Icon */}
        <div className="relative mb-4 flex items-center justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-[#002244] border border-cyan-400/60 shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center justify-center text-cyan-300">
            {isFiltered ? (
              <FilterX className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400 animate-pulse drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
            ) : totalTasksInDay === 0 ? (
              <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            ) : (
              <Radar className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400 animate-pulse" />
            )}
          </div>
          {/* Glowing pulse ring */}
          <span className="absolute -inset-1.5 rounded-3xl border border-cyan-400/30 animate-ping pointer-events-none" />
        </div>

        {/* Headline */}
        <h3 className="text-base sm:text-lg font-bold text-white tracking-wide mb-1.5 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
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
            <>Sin coincidencias para <span className="text-cyan-300 font-bold">"{searchTerm}"</span>.</>
          ) : isFiltered ? (
            copy.emptyFilterDescription
          ) : (
            copy.emptyClearDescription
          )}
        </p>

        {/* Interactive Buttons */}
        <div className="flex items-center justify-center gap-3 flex-wrap w-full">
          {/* Primary Create Task Button con Neón Cinético Dinámico */}
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onAddTask();
            }}
            className="btn-neon-hunter min-h-[44px] px-5 py-2 rounded-xl text-xs sm:text-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg uppercase font-black tracking-wider"
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
              className="min-h-[42px] px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 hover:border-amber-400 font-bold text-xs sm:text-sm shadow-[0_0_12px_rgba(245,158,11,0.25)] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
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
              className="min-h-[42px] px-4 py-2 rounded-xl bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 border border-blue-500/50 font-bold text-xs sm:text-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
            >
              <FilterX className="w-4 h-4 text-cyan-400" />
              <span>VER TODAS</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
