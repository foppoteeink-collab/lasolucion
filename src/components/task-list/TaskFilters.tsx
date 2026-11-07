import React, { useState } from 'react';
import { Icon, IconName } from '../common/Icon';
import { MoxenChipGroup, MoxenChipItem } from '../common/MoxenChipGroup';
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
  icon?: IconName;
  color?: string;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'todos', label: 'Todas', icon: 'layers' },
  { id: 'entrenamiento', label: 'Gym', icon: 'dumbbell', color: CATEGORY_COLORS.entrenamiento.color },
  { id: 'estudio', label: 'Estudio', icon: 'bookOpen', color: CATEGORY_COLORS.estudio.textColor },
  { id: 'trabajo', label: 'Trabajo', icon: 'briefcase', color: CATEGORY_COLORS.trabajo.color },
  { id: 'limpieza', label: 'Orden', icon: 'sparkles', color: CATEGORY_COLORS.limpieza.color },
  { id: 'comida', label: 'Nutrición', icon: 'apple', color: CATEGORY_COLORS.comida.color },
  { id: 'creativo', label: 'Creativo', icon: 'palette', color: CATEGORY_COLORS.creativo.color },
  { id: 'clientes', label: 'Clientes', icon: 'users', color: CATEGORY_COLORS.clientes.color },
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

  const statusItems: MoxenChipItem<TaskFilterType>[] = [
    { id: 'todos', label: 'Todas', badge: counts.total, icon: 'layers', iconColor: 'var(--aura-color-1, #00f0ff)' },
    { id: 'rutina', label: 'Con Hora', badge: counts.routine, icon: 'timer', iconColor: 'var(--aura-color-1, #00f0ff)' },
    { id: 'pendientes', label: 'Pendientes', badge: counts.pending, icon: 'hourglass', iconColor: 'var(--aura-color-1, #00f0ff)' },
    { id: 'completados', label: 'Hechas', badge: counts.completed, icon: 'checkCircle', iconColor: 'var(--aura-color-1, #00f0ff)' },
  ];

  const categoryItems: MoxenChipItem<string>[] = CATEGORIES.map((cat) => ({
    id: cat.id,
    label: cat.label,
    icon: cat.icon,
    iconColor: cat.color || 'var(--aura-color-1, #00f0ff)',
  }));

  return (
    <div className="scifi-glass-panel rounded-xl px-2.5 py-1.5 space-y-1 border border-cyan-500/30 shadow-[0_2px_12px_rgba(0,0,0,0.4)] relative overflow-hidden">
      {/* Grano esmerilado táctil */}
      <span className="vi-grano opacity-5" aria-hidden="true" />

      {/* Unified Filter Chip Group & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5">
        <MoxenChipGroup
          items={statusItems}
          activeId={activeFilter}
          onSelect={onFilterChange}
          ariaLabel="Filtro por estado de tarea"
          variant="compact"
          size="sm"
          className="flex-1"
        />

        {/* Compact Search + Category Drawer Toggle */}
        <div className="flex items-center gap-1.5 justify-end shrink-0">
          <div className="relative flex-1 sm:w-40">
            <Icon name="search" className="w-3 h-3 text-cyan-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar..."
              className="w-full h-7 bg-[#011420]/80 border border-cyan-500/25 rounded-full pl-7 pr-6 py-0.5 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                title="Limpiar"
              >
                <Icon name="x" className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setShowCategories(!showCategories);
            }}
            aria-selected={showCategories || selectedCategory !== 'todos'}
            className={`mf-8-menu-chip-group__chip mf-chip mf-chip--sm ${
              showCategories || selectedCategory !== 'todos'
                ? 'mf-8-menu-chip-group__chip--active mf-chip--active'
                : ''
            }`}
            title="Filtrar por categoría"
          >
            <Icon name="filter" className="w-3 h-3 text-cyan-400" />
            <span>{selectedCategory !== 'todos' ? selectedCategory.toUpperCase() : 'Área'}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Category Chips */}
      {(showCategories || selectedCategory !== 'todos') && (
        <MoxenChipGroup
          items={categoryItems}
          activeId={selectedCategory}
          onSelect={onSelectCategory}
          ariaLabel="Filtro por área o categoría"
          variant="compact"
          size="sm"
        />
      )}
    </div>
  );
};

