import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  X, 
  Filter, 
  Layers, 
  Clock, 
  Hourglass, 
  CheckCircle2, 
  Dumbbell, 
  BookOpen, 
  Briefcase, 
  Sparkles, 
  Apple, 
  Palette, 
  Users 
} from 'lucide-react';
import { soundFX } from '../../utils/audio';
import { CATEGORY_COLORS } from '../../data/categoryColors';

export type TaskFilterType = 'todos' | 'rutina' | 'habitos' | 'pendientes' | 'completados';

interface TaskFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  activeFilter: TaskFilterType;
  onFilterChange: (filter: TaskFilterType) => void;
  counts: {
    total: number;
    routine: number;
    habits: number;
    pending: number;
    completed: number;
  };
}

interface CategoryItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  color?: string;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'todos', label: 'Todas', icon: <Layers className="w-3 h-3" /> },
  { id: 'entrenamiento', label: 'Gym', icon: <Dumbbell className="w-3 h-3 text-orange-400" />, color: CATEGORY_COLORS.entrenamiento.color },
  { id: 'estudio', label: 'Estudio', icon: <BookOpen className="w-3 h-3 text-purple-400" />, color: CATEGORY_COLORS.estudio.textColor },
  { id: 'trabajo', label: 'Trabajo', icon: <Briefcase className="w-3 h-3 text-blue-400" />, color: CATEGORY_COLORS.trabajo.color },
  { id: 'limpieza', label: 'Orden', icon: <Sparkles className="w-3 h-3 text-amber-400" />, color: CATEGORY_COLORS.limpieza.color },
  { id: 'comida', label: 'Nutrición', icon: <Apple className="w-3 h-3 text-emerald-400" />, color: CATEGORY_COLORS.comida.color },
  { id: 'creativo', label: 'Creativo', icon: <Palette className="w-3 h-3 text-pink-400" />, color: CATEGORY_COLORS.creativo.color },
  { id: 'clientes', label: 'Clientes', icon: <Users className="w-3 h-3 text-indigo-400" />, color: CATEGORY_COLORS.clientes.color },
];

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  activeFilter,
  onFilterChange,
  counts,
}) => {
  const [showCategories, setShowCategories] = useState(selectedCategory !== 'todos');
  const [isSearchExpanded, setIsSearchExpanded] = useState(Boolean(searchTerm.trim()));
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  const filterTabs: { id: TaskFilterType; label: string; count: number; icon: React.ReactNode; color: string; activeStyle: string }[] = [
    { 
      id: 'todos', 
      label: 'Todas', 
      count: counts.total, 
      icon: <Layers className="w-3 h-3" />, 
      color: '#00f0ff',
      activeStyle: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/60 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
    },
    { 
      id: 'pendientes', 
      label: 'Pendientes', 
      count: counts.pending, 
      icon: <Hourglass className="w-3 h-3" />, 
      color: '#f59e0b',
      activeStyle: 'bg-amber-500/20 text-amber-200 border-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
    },
    { 
      id: 'completados', 
      label: 'Hechas', 
      count: counts.completed, 
      icon: <CheckCircle2 className="w-3 h-3" />, 
      color: '#10b981',
      activeStyle: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
    },
    { 
      id: 'rutina', 
      label: 'Horario', 
      count: counts.routine, 
      icon: <Clock className="w-3 h-3" />, 
      color: '#818cf8',
      activeStyle: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/60 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
    },
  ];

  return (
    <div className="scifi-glass-panel rounded-xl px-2 py-1.5 space-y-1.5 border border-cyan-500/25 shadow-[0_2px_15px_rgba(0,0,0,0.45)] relative overflow-hidden bg-[#020712]/90 backdrop-blur-xl">
      <span className="vi-grano opacity-5" aria-hidden="true" />

      {/* Main Single-Row Tactical HUD (Ultra-Compact) */}
      <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5">
        
        {/* Left: Micro Segmented HUD Tabs */}
        <div className="flex items-center gap-1 bg-[#010a14]/80 p-0.5 rounded-lg border border-white/10 shrink-0">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onFilterChange(tab.id);
                }}
                className={`relative h-7 px-2 sm:px-2.5 rounded-md flex items-center gap-1.5 text-xs font-mono font-bold transition-all cursor-pointer select-none active:scale-95 whitespace-nowrap shrink-0 ${
                  isActive
                    ? tab.activeStyle + ' border'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
                }`}
                title={`Filtrar por ${tab.label}`}
              >
                <span className="shrink-0 leading-none">{tab.icon}</span>
                <span className="tracking-tight">{tab.label}</span>
                <span className={`text-[10.5px] px-1 py-0.2 rounded font-mono tabular-nums leading-none ${
                  isActive
                    ? 'bg-black/40 text-white font-black'
                    : 'bg-white/5 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Expandable Micro Search & Category Filter */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {/* Expandable Search Input */}
          <AnimatePresence initial={false}>
            {isSearchExpanded ? (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 140, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="relative flex items-center"
              >
                <Search className="w-3 h-3 text-cyan-400 absolute left-2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full h-7 pl-6 pr-6 bg-[#030e1a] border border-cyan-400/50 rounded-lg text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-400/60 shadow-inner"
                />
                {searchTerm ? (
                  <button
                    type="button"
                    onClick={() => {
                      onSearchChange('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-1 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                    title="Borrar texto"
                  >
                    <X className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSearchExpanded(false)}
                    className="absolute right-1 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                    title="Cerrar búsqueda"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </motion.div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setIsSearchExpanded(true);
                }}
                className={`h-7 w-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                  searchTerm
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                    : 'bg-[#010a14]/80 border-white/10 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40'
                }`}
                title="Buscar tareas"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            )}
          </AnimatePresence>

          {/* Category Toggle Pill */}
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setShowCategories(!showCategories);
            }}
            className={`h-7 px-2 rounded-lg border flex items-center gap-1 text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 ${
              showCategories || selectedCategory !== 'todos'
                ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/60 shadow-[0_0_10px_rgba(0,240,255,0.25)]'
                : 'bg-[#010a14]/80 border-white/10 text-slate-400 hover:text-slate-200 hover:border-cyan-500/40'
            }`}
            title="Filtrar por área o categoría"
          >
            <Filter className="w-3 h-3 text-cyan-400" />
            <span className="text-[11px] uppercase tracking-wide">
              {selectedCategory !== 'todos' ? selectedCategory.slice(0, 5) : 'Área'}
            </span>
          </button>
        </div>
      </div>

      {/* Collapsible Micro Category Row */}
      <AnimatePresence>
        {(showCategories || selectedCategory !== 'todos') && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="overflow-hidden pt-1 border-t border-white/5"
          >
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 px-0.5">
              {CATEGORIES.map((cat) => {
                const isCatActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      onSelectCategory(cat.id);
                    }}
                    className={`h-6 px-2 rounded-md flex items-center gap-1 text-[10.5px] font-mono font-bold transition-all cursor-pointer shrink-0 active:scale-95 border ${
                      isCatActive
                        ? 'bg-cyan-950/90 text-cyan-200 border-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                        : 'bg-black/40 text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span className="shrink-0">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
