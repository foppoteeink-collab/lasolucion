import { TaskCategory } from '../types';

export interface CategoryColorDef {
  id: TaskCategory | string;
  name: string;
  color: string;            // Hex principal (auras, indicadores, gráficos)
  textColor: string;        // Hex accesible WCAG 2.1 (ratio > 4.5:1 sobre fondo oscuro)
  bgBadge: string;          // Clase Tailwind para píldora de categoría
  textIcon: string;         // Clase Tailwind para icono / texto secundario
  slashColor: string;       // Color del tachado en título
  checkboxBorder: string;   // Checkbox cuando aplique
}

/**
 * Fuente única de verdad (Single Source of Truth) para la paleta de categorías de La Solución.
 * Respeta la tríada de marca y la regla 60-30-10:
 * - Entrenamiento: Naranja Furia (#fb5607)
 * - Trabajo: Cian Cuántico (#00f0ff)
 * - Estudio: Púrpura Magia (#9600ff / #c084fc en texto WCAG)
 * - Rutina: Lima Energía (#d6f421)
 * - Limpieza: Esmeralda (#10b981)
 * - Clientes / Personal: Azul Accesible (#60a5fa)
 * - Creativo: Fucsia / Orquídea (#d946ef)
 * - Comida / Nutrición: Ámbar (#f59e0b)
 * - Hábito / Disciplina: Ámbar / Oro (#f59e0b)
 * - Pomodoro: Rosa Furia (#f43f5e)
 */
export const CATEGORY_COLORS: Record<string, CategoryColorDef> = {
  entrenamiento: {
    id: 'entrenamiento',
    name: 'Entrenamiento',
    color: '#fb5607',
    textColor: '#fb923c',
    bgBadge: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
    textIcon: 'text-orange-400',
    slashColor: '#fb5607',
    checkboxBorder: 'bg-orange-500 border-orange-400 text-black'
  },
  trabajo: {
    id: 'trabajo',
    name: 'Trabajo',
    color: '#00f0ff',
    textColor: '#00f0ff',
    bgBadge: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    textIcon: 'text-cyan-400',
    slashColor: '#00f0ff',
    checkboxBorder: 'bg-cyan-500 border-cyan-400 text-black'
  },
  estudio: {
    id: 'estudio',
    name: 'Estudio & Mente',
    color: '#9600ff',
    textColor: '#c084fc',
    bgBadge: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
    textIcon: 'text-purple-400',
    slashColor: '#c084fc',
    checkboxBorder: 'bg-purple-500 border-purple-400 text-white'
  },
  rutina: {
    id: 'rutina',
    name: 'Rutina',
    color: '#d6f421',
    textColor: '#d6f421',
    bgBadge: 'bg-lime-500/10 border-lime-500/30 text-lime-300',
    textIcon: 'text-lime-400',
    slashColor: '#d6f421',
    checkboxBorder: 'bg-lime-500 border-lime-400 text-black'
  },
  limpieza: {
    id: 'limpieza',
    name: 'Orden & Limpieza',
    color: '#10b981',
    textColor: '#34d399',
    bgBadge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    textIcon: 'text-emerald-400',
    slashColor: '#10b981',
    checkboxBorder: 'bg-emerald-500 border-emerald-400 text-black'
  },
  clientes: {
    id: 'clientes',
    name: 'Clientes & Mensajes',
    color: '#60a5fa',
    textColor: '#60a5fa',
    bgBadge: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    textIcon: 'text-blue-400',
    slashColor: '#60a5fa',
    checkboxBorder: 'bg-blue-500 border-blue-400 text-black'
  },
  creativo: {
    id: 'creativo',
    name: 'Creatividad & Flujo',
    color: '#d946ef',
    textColor: '#e879f9',
    bgBadge: 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300',
    textIcon: 'text-fuchsia-400',
    slashColor: '#d946ef',
    checkboxBorder: 'bg-fuchsia-500 border-fuchsia-400 text-black'
  },
  comida: {
    id: 'comida',
    name: 'Alimentación & Salud',
    color: '#f59e0b',
    textColor: '#fbbf24',
    bgBadge: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    textIcon: 'text-amber-400',
    slashColor: '#f59e0b',
    checkboxBorder: 'bg-amber-500 border-amber-400 text-black'
  },
  habito: {
    id: 'habito',
    name: 'Hábito / Disciplina',
    color: '#f59e0b',
    textColor: '#fbbf24',
    bgBadge: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    textIcon: 'text-amber-400',
    slashColor: '#f59e0b',
    checkboxBorder: 'bg-amber-500 border-amber-400 text-black'
  },
  pomodoro: {
    id: 'pomodoro',
    name: 'Deep Work / Pomodoro',
    color: '#f43f5e',
    textColor: '#fb7185',
    bgBadge: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
    textIcon: 'text-rose-400',
    slashColor: '#f43f5e',
    checkboxBorder: 'bg-rose-500 border-rose-400 text-white'
  }
};

const DEFAULT_CATEGORY_STYLE: CategoryColorDef = {
  id: 'general',
  name: 'General',
  color: '#00f0ff',
  textColor: '#00f0ff',
  bgBadge: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
  textIcon: 'text-cyan-400',
  slashColor: '#00f0ff',
  checkboxBorder: 'bg-cyan-500 border-cyan-400 text-black'
};

/**
 * Obtiene la definición de estilo y color para una categoría dada
 */
export function getCategoryStyle(category?: string): CategoryColorDef {
  if (!category) return DEFAULT_CATEGORY_STYLE;
  const key = category.toLowerCase().trim();
  return CATEGORY_COLORS[key] || DEFAULT_CATEGORY_STYLE;
}

/**
 * Obtiene el color hexadecimal maestro para una categoría (usado para auras, indicadores de temporizador, etc.)
 */
export function getCategoryColor(category?: string): string {
  return getCategoryStyle(category).color;
}
