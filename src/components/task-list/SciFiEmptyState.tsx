import React from 'react';
import { Plus, ShieldCheck, FilterX, RefreshCw, Radar } from 'lucide-react';
import { soundFX } from '../../utils/audio';

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

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#001428]/90 border border-blue-500/40 p-6 sm:p-10 text-center shadow-[0_0_30px_rgba(0,140,255,0.15)] backdrop-blur-md transition-all my-4">
      {/* Sci-Fi Decorative Corner Accents */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400/80 rounded-tl-sm pointer-events-none" />
      <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400/80 rounded-tr-sm pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400/80 rounded-bl-sm pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400/80 rounded-br-sm pointer-events-none" />

      {/* Hologram Radial Background Effect */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

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

        {/* Sci-Fi Headline */}
        <h3 className="text-base sm:text-xl font-black text-white uppercase tracking-wider mb-1.5 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
          {searchTerm
            ? 'Sin Señal en Radar'
            : selectedCategory !== 'todos'
            ? `Sector Despejado: ${selectedCategory.toUpperCase()}`
            : activeFilter !== 'todos'
            ? `Filtro Vacío: ${activeFilter.toUpperCase()}`
            : 'Sector Despejado — Sin Misiones Activas'}
        </h3>

        {/* Descriptive Body Copy */}
        <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed mb-6">
          {searchTerm ? (
            <>No se encontraron misiones registradas que coincidan con la búsqueda <span className="text-cyan-300 font-bold">"{searchTerm}"</span>.</>
          ) : isFiltered ? (
            'No hay misiones asignadas dentro del filtro o categoría seleccionada. Puedes ajustar los filtros o desplegar una nueva misión.'
          ) : (
            'Excelente trabajo, Operador. Todas las amenazas de esta jornada han sido neutralizadas o aún no has desplegado tu rutina para hoy.'
          )}
        </p>

        {/* Sci-Fi Interactive Buttons (Strict min-h-[44px] min-w-[44px] touch targets) */}
        <div className="flex items-center justify-center gap-3 flex-wrap w-full">
          {/* Primary Create Task Button */}
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onAddTask();
            }}
            className="min-h-[44px] px-5 py-2.5 rounded-xl sm:rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_15px_rgba(0,240,255,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-cyan-200"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Desplegar Nueva Misión</span>
          </button>

          {/* Reset Routine Button */}
          {totalTasksInDay === 0 && onResetDay && (
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onResetDay();
              }}
              className="min-h-[44px] px-5 py-2.5 rounded-xl sm:rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 hover:border-amber-400 font-black text-xs sm:text-sm shadow-[0_0_12px_rgba(245,158,11,0.25)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <span>Restablecer Rutina del Día</span>
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
              className="min-h-[44px] px-5 py-2.5 rounded-xl sm:rounded-2xl bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 border border-blue-500/50 font-bold text-xs sm:text-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FilterX className="w-4 h-4 text-cyan-400" />
              <span>Ver Todas las Misiones</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
