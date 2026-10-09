import React, { useState } from 'react';
import { 
  Search, 
  X, 
  Filter, 
  Dumbbell, 
  BookOpen, 
  Briefcase, 
  Sparkles, 
  Apple, 
  Palette, 
  Users, 
  Clock, 
  Hourglass, 
  CheckCircle2, 
  Layers,
  LucideIcon 
} from 'lucide-react';
import { soundFX } from '../../utils/audio';

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
  icon?: LucideIcon;
  color?: string;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'todos', label: 'Todas', icon: Layers },
  { id: 'entrenamiento', label: 'Gym', icon: Dumbbell, color: '#38bdf8' },
  { id: 'estudio', label: 'Estudio', icon: BookOpen, color: '#facc15' },
  { id: 'trabajo', label: 'Trabajo', icon: Briefcase, color: '#fb923c' },
  { id: 'limpieza', label: 'Orden', icon: Sparkles, color: '#34d399' },
  { id: 'comida', label: 'Nutrición', icon: Apple, color: '#4ade80' },
  { id: 'creativo', label: 'Creativo', icon: Palette, color: '#c084fc' },
  { id: 'clientes', label: 'Clientes', icon: Users, color: '#60a5fa' },
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

  return (
    <div className="space-y-2">
      {/* Unified Single-Row Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: 'todos', label: 'Todas', count: counts.total, icon: Layers },
            { id: 'rutina', label: 'Horarios', count: counts.routine, icon: Clock },
            { id: 'pendientes', label: 'Pendientes', count: counts.pending, icon: Hourglass },
            { id: 'completados', label: 'Hechas', count: counts.completed, icon: CheckCircle2 },
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onFilterChange(tab.id as TaskFilterType);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-anton tracking-wide whitespace-nowrap border transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 uppercase ${
                  isActive
                    ? 'bg-cyan-400 text-black border-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                    : 'bg-[#011420]/80 border-cyan-500/25 text-slate-300 hover:text-white hover:border-cyan-400/60'
                }`}
              >
                <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-cyan-400'}`} />
                <span>{tab.label}</span>
                <span className={`text-[10px] font-mono font-bold px-1.5 rounded ${
                  isActive ? 'bg-black/20 text-black' : 'bg-black/60 text-cyan-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Compact Search + Category Drawer Toggle */}
        <div className="flex items-center gap-1.5 flex-1 sm:flex-initial justify-end min-w-[180px]">
          <div className="relative flex-1 sm:w-44">
            <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-[#011420]/80 border border-cyan-500/25 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                title="Limpiar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setShowCategories(!showCategories);
            }}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1 cursor-pointer transition-all shrink-0 ${
              showCategories || selectedCategory !== 'todos'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                : 'bg-[#011420]/80 text-slate-400 border-cyan-500/25 hover:text-white'
            }`}
            title="Filtrar por categoría"
          >
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            {selectedCategory !== 'todos' && (
              <span className="text-[10px] font-bold uppercase">{selectedCategory}</span>
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Category Pills */}
      {(showCategories || selectedCategory !== 'todos') && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const IconComp = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onSelectCategory(cat.id);
                }}
                className={`px-2.5 py-1 rounded-lg whitespace-nowrap border transition-all cursor-pointer flex items-center gap-1 active:scale-95 text-xs font-medium ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                    : 'bg-[#011420]/60 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {IconComp && (
                  <IconComp 
                    className="w-3 h-3 shrink-0" 
                    style={{ color: isSelected ? '#00f0ff' : cat.color || 'currentColor' }} 
                  />
                )}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
