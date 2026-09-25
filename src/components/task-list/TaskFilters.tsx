import React from 'react';
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
  { id: 'entrenamiento', label: 'Gym & Fuerza', icon: Dumbbell, color: '#38bdf8' },
  { id: 'estudio', label: 'Estudio', icon: BookOpen, color: '#facc15' },
  { id: 'trabajo', label: 'Trabajo', icon: Briefcase, color: '#fb923c' },
  { id: 'limpieza', label: 'Limpieza & Orden', icon: Sparkles, color: '#34d399' },
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
  return (
    <div className="space-y-3">
      {/* Search Input Bar */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar misiones..."
          className="w-full bg-[#011420]/80 border border-cyan-500/30 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-cyan-400/50 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,240,255,0.25)] min-h-[44px] transition-all"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-white p-1 min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer transition-colors"
            title="Limpiar búsqueda"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-bold">
        <span className="text-cyan-400/80 flex items-center gap-1 mr-1 shrink-0 font-mono">
          <Filter className="w-3.5 h-3.5 text-cyan-400" /> CATEGORÍA:
        </span>
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
              className={`px-3 py-2 rounded-xl whitespace-nowrap border transition-all cursor-pointer min-h-[38px] flex items-center gap-1.5 active:scale-95 text-xs font-semibold ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                  : 'bg-[#011420]/60 border-cyan-500/20 text-slate-400 hover:text-white hover:bg-cyan-950/30 hover:border-cyan-500/40'
              }`}
            >
              {IconComp && (
                <IconComp 
                  className="w-3.5 h-3.5 shrink-0" 
                  style={{ color: isSelected ? '#00f0ff' : cat.color || 'currentColor' }} 
                />
              )}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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
              className={`px-3.5 py-2 rounded-xl text-xs font-anton tracking-wider whitespace-nowrap border transition-all cursor-pointer min-h-[40px] flex items-center gap-1.5 active:scale-95 uppercase ${
                isActive
                  ? 'bg-cyan-400 text-black border-cyan-300 shadow-[0_0_14px_rgba(0,240,255,0.5)]'
                  : 'bg-[#011420]/80 border-cyan-500/30 text-slate-300 hover:text-white hover:bg-cyan-950/40 hover:border-cyan-400'
              }`}
            >
              <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-cyan-400'}`} />
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded-md ${
                isActive ? 'bg-black/20 text-black' : 'bg-black/60 text-cyan-300 border border-cyan-500/40'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TaskFilters;
