import { TaskItem, PlayerStats, HabitMasteryRecord, CustomHabit, GameSettings } from '../types';
import { 
  loadSavedStats, 
  loadSavedTasks, 
  loadDailyReflections, 
  loadHabitMastery, 
  loadCustomHabits, 
  loadGameSettings,
  safeGetItem 
} from './storage';
import { getTodayDateString } from './date';

export interface ComprehensiveUserDataExport {
  app: string;
  version: string;
  exportedAt: string;
  timestamp: number;
  stats: PlayerStats;
  tasks: TaskItem[];
  reflections: Record<string, string>;
  habitMastery: Record<string, HabitMasteryRecord>;
  customHabits: CustomHabit[];
  settings: GameSettings;
  rawLocalStorage: Record<string, any>;
}

/**
 * Gathers complete user state across local storage and game context,
 * formats it into a structured JSON file, and triggers a browser download.
 */
export const exportUserData = (contextData?: {
  stats?: PlayerStats;
  tasks?: TaskItem[];
  reflections?: Record<string, string>;
  habitMastery?: Record<string, HabitMasteryRecord>;
  customHabits?: CustomHabit[];
  settings?: GameSettings;
}): ComprehensiveUserDataExport => {
  const todayStr = getTodayDateString();
  const timestamp = Date.now();

  // Load from context if provided, otherwise fallback to safe local storage
  const stats = contextData?.stats || loadSavedStats();
  const tasks = contextData?.tasks || loadSavedTasks();
  const reflections = contextData?.reflections || loadDailyReflections();
  const habitMastery = contextData?.habitMastery || loadHabitMastery();
  const customHabits = contextData?.customHabits || loadCustomHabits();
  const settings = contextData?.settings || loadGameSettings();

  // Extract raw local storage keys for full fail-safe recovery
  const rawLocalStorage: Record<string, any> = {};
  if (typeof window !== 'undefined' && window.localStorage) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('taskquest') || key.startsWith('solucion') || key.startsWith('la_solucion') || key === 'habitMastery' || key === 'gameSettings')) {
        try {
          const item = localStorage.getItem(key);
          rawLocalStorage[key] = item ? JSON.parse(item) : null;
        } catch {
          rawLocalStorage[key] = localStorage.getItem(key);
        }
      }
    }
  }

  const exportPayload: ComprehensiveUserDataExport = {
    app: 'La Solución RPG',
    version: '3.5',
    exportedAt: new Date().toISOString(),
    timestamp,
    stats,
    tasks,
    reflections,
    habitMastery,
    customHabits,
    settings,
    rawLocalStorage,
  };

  // Create JSON file blob and trigger download
  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `la_solucion_respaldo_${todayStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return exportPayload;
};

/**
 * Exports user reflections & task notes into a CSV file for Excel / Spreadsheet inspection.
 */
export const exportJournalToCSV = (
  tasks: TaskItem[], 
  reflections: Record<string, string>
): void => {
  const todayStr = getTodayDateString();
  const rows: string[][] = [
    ['Fecha', 'Tipo de Registro', 'Categoría / Título', 'Detalle / Reflexión / Notas', 'Estado']
  ];

  // Add reflections
  Object.entries(reflections).forEach(([date, reflection]) => {
    rows.push([
      date,
      'Bitácora / Reflexión Nocturna',
      'Reflexión del Día',
      `"${reflection.replace(/"/g, '""')}"`,
      'Registrado'
    ]);
  });

  // Add tasks with notes
  tasks.filter(t => t.notes || t.description).forEach(t => {
    const detailText = [t.notes, t.description].filter(Boolean).join(' | ');
    const taskDate = t.completedAt ? t.completedAt.split('T')[0] : todayStr;
    rows.push([
      taskDate,
      'Misión con Nota',
      `[${t.category.toUpperCase()}] ${t.title}`,
      `"${detailText.replace(/"/g, '""')}"`,
      t.completed ? 'Completada' : 'Pendiente'
    ]);
  });

  const csvContent = '\uFEFF' + rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `la_solucion_bitacora_${todayStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exports just the user's custom habits/schedule to a beautifully formatted JSON file.
 */
export const exportScheduleToJSON = (customHabits: CustomHabit[]): void => {
  const todayStr = getTodayDateString();
  const jsonStr = JSON.stringify(customHabits, null, 4); // 4 spaces for better readability
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `mi_horario_la_solucion_${todayStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exports just the user's custom habits/schedule to a CSV file for Excel editing.
 * Uses individual columns for days of the week for easy editing.
 */
export const exportScheduleToCSV = (customHabits: CustomHabit[]): void => {
  const todayStr = getTodayDateString();
  const rows: string[][] = [
    ['ID', 'Título', 'Categoría', 'Bloque de Horas', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo', 'XP', 'Monedas', 'Icono']
  ];

  const mapDayToString = (day: number) => {
    // 0=Dom, 1=Lun, 2=Mar, 3=Mie, 4=Jue, 5=Vie, 6=Sab
    return ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][day];
  };

  customHabits.forEach(h => {
    const isDaily = h.frequencyType === 'daily';
    const activeDays = new Set(h.specificDays || []);

    const l = isDaily || activeDays.has(1) ? 'X' : '';
    const m = isDaily || activeDays.has(2) ? 'X' : '';
    const x = isDaily || activeDays.has(3) ? 'X' : '';
    const j = isDaily || activeDays.has(4) ? 'X' : '';
    const v = isDaily || activeDays.has(5) ? 'X' : '';
    const s = isDaily || activeDays.has(6) ? 'X' : '';
    const d = isDaily || activeDays.has(0) ? 'X' : '';

    rows.push([
      h.id || '',
      `"${(h.title || '').replace(/"/g, '""')}"`,
      h.category || 'fuerza',
      `"${(h.timeBlock || '').replace(/"/g, '""')}"`,
      l, m, x, j, v, s, d,
      String(h.xpReward || 10),
      String(h.coinReward || 5),
      h.quickIcon || ''
    ]);
  });

  const csvContent = '\uFEFF' + rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `mi_horario_la_solucion_${todayStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Parses a CSV file string into a list of CustomHabits.
 */
export const parseScheduleCSV = (csvText: string): CustomHabit[] => {
  // Simple CSV parser that handles quotes
  const lines = csvText.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) throw new Error("El archivo CSV está vacío o no tiene encabezados.");

  const habits: CustomHabit[] = [];
  
  // Regex to split by comma, respecting quotes
  const parseRow = (row: string) => {
    const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
    return row.split(regex).map(val => val.replace(/^"|"$/g, '').replace(/""/g, '"'));
  };

  const headers = parseRow(lines[0]).map(h => h.trim().toLowerCase());
  
  const idIdx = headers.findIndex(h => h.includes('id'));
  const titleIdx = headers.findIndex(h => h.includes('título') || h.includes('titulo'));
  const catIdx = headers.findIndex(h => h.includes('categoría') || h.includes('categoria'));
  const timeIdx = headers.findIndex(h => h.includes('bloque'));
  
  // Find day columns
  const lunIdx = headers.findIndex(h => h.includes('lunes'));
  const marIdx = headers.findIndex(h => h.includes('martes'));
  const mieIdx = headers.findIndex(h => h.includes('miércoles') || h.includes('miercoles'));
  const jueIdx = headers.findIndex(h => h.includes('jueves'));
  const vieIdx = headers.findIndex(h => h.includes('viernes'));
  const sabIdx = headers.findIndex(h => h.includes('sábado') || h.includes('sabado'));
  const domIdx = headers.findIndex(h => h.includes('domingo'));

  const xpIdx = headers.findIndex(h => h.includes('xp'));
  const coinIdx = headers.findIndex(h => h.includes('monedas'));
  const iconIdx = headers.findIndex(h => h.includes('icono'));

  if (titleIdx === -1) throw new Error("No se encontró la columna de 'Título'.");

  for (let i = 1; i < lines.length; i++) {
    const cols = parseRow(lines[i]);
    if (cols.length < 2) continue; // Skip empty rows

    const title = cols[titleIdx]?.trim();
    if (!title) continue;

    // Check which days have an "X" (or anything non-empty that isn't '0' or 'false')
    const isActive = (idx: number) => {
      if (idx === -1) return true; // If column is missing, assume active for backward compatibility or default
      const val = (cols[idx] || '').trim().toLowerCase();
      return val !== '' && val !== '0' && val !== 'false';
    };

    const hasLun = isActive(lunIdx);
    const hasMar = isActive(marIdx);
    const hasMie = isActive(mieIdx);
    const hasJue = isActive(jueIdx);
    const hasVie = isActive(vieIdx);
    const hasSab = isActive(sabIdx);
    const hasDom = isActive(domIdx);

    const activeDaysCount = [hasLun, hasMar, hasMie, hasJue, hasVie, hasSab, hasDom].filter(Boolean).length;
    
    let frequencyType: 'daily' | 'weekly' | 'specific_days' = 'daily';
    let specificDays: number[] | undefined;

    if (activeDaysCount === 7) {
      frequencyType = 'daily';
    } else {
      frequencyType = 'specific_days';
      specificDays = [];
      if (hasDom) specificDays.push(0);
      if (hasLun) specificDays.push(1);
      if (hasMar) specificDays.push(2);
      if (hasMie) specificDays.push(3);
      if (hasJue) specificDays.push(4);
      if (hasVie) specificDays.push(5);
      if (hasSab) specificDays.push(6);
      
      // If no days selected at all, default to daily to prevent completely hidden habits, 
      // or set them to a dummy specific day. We'll default to specific day but empty, meaning it never naturally occurs unless manually triggered.
    }

    const habit: CustomHabit = {
      id: (idIdx !== -1 && cols[idIdx]?.trim()) ? cols[idIdx].trim() : `habit_${Date.now()}_${i}`,
      title: title,
      category: (catIdx !== -1 && cols[catIdx]?.trim()) ? (cols[catIdx].trim() as any) : 'fuerza',
      frequencyType,
      specificDays,
      xpReward: (xpIdx !== -1 && cols[xpIdx]?.trim()) ? parseInt(cols[xpIdx]) || 10 : 10,
      coinReward: (coinIdx !== -1 && cols[coinIdx]?.trim()) ? parseInt(cols[coinIdx]) || 5 : 5,
    };

    if (timeIdx !== -1 && cols[timeIdx]?.trim()) {
      habit.timeBlock = cols[timeIdx].trim();
    }
    
    if (iconIdx !== -1 && cols[iconIdx]?.trim()) {
      habit.isQuickHabit = true;
      habit.quickIcon = cols[iconIdx].trim();
    }

    habits.push(habit);
  }

  return habits;
};
