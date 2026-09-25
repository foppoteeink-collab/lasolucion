import { DailyRewardItem, PlayerStats, ShopReward, TaskItem, CustomHabit, TaskCategory } from '../types';
import { JUNG_ARCHETYPES, getArchetypeByName } from './archetypes';
import { getTodayDateString, parseLocalDate } from '../utils/date';

/**
 * Hardcore RPG Level Curve:
 * Scaling XP requirement with quadratic & exponential growth,
 * making each higher level significantly harder to obtain through real daily discipline.
 */
export const getRequiredXpForLevel = (level: number): number => {
  return Math.round(120 + 35 * level + 25 * Math.pow(level, 1.55));
};

export const INITIAL_PLAYER_STATS: PlayerStats = {
  level: 1,
  currentXp: 0,
  requiredXp: getRequiredXpForLevel(1), // 180 XP
  totalXpEarned: 0,
  coins: 0,
  hp: 100,
  maxHp: 100,
  streakDays: 0,
  streakShields: 0,
  lastActiveDate: getTodayDateString(),
  lastDailyRewardClaimedDate: '',
  rankTitle: 'Chispazo de Voluntad',
  avatarIcon: '🛡️',
  characterClass: 'El Héroe',
  attributes: {
    disciplina: 0,
    fuerza: 0,
    mente: 0,
    energia: 0,
    estudio: 0,
  },
};

export interface CharacterClassOption {
  id: string;
  name: string;
  avatar: string;
  tagline: string;
  description: string;
  primaryStat: 'fuerza' | 'disciplina' | 'mente' | 'energia' | 'estudio';
  statBonus: string;
  color: string;
  badgeBg: string;
  desire?: string;
  fear?: string;
}

export const CHARACTER_CLASSES: CharacterClassOption[] = JUNG_ARCHETYPES.map((arch) => ({
  id: arch.id,
  name: arch.name,
  avatar: arch.avatar,
  tagline: arch.desire,
  description: arch.description,
  primaryStat: arch.primaryStat,
  statBonus: arch.statBonus,
  color: arch.color,
  badgeBg: arch.badgeBg,
  desire: arch.desire,
  fear: arch.fear,
}));

export interface RankInfo {
  level: number;
  title: string;
  phase: number;
  phaseName: string;
}

export const RANKS: RankInfo[] = [
  // Fase 1: Saliendo del Letargo
  { level: 1, title: 'Chispazo de Voluntad', phase: 1, phaseName: 'Saliendo del Letargo' },
  { level: 2, title: 'Despertar de la Intención', phase: 1, phaseName: 'Saliendo del Letargo' },
  { level: 3, title: 'Rompe-Inercias', phase: 1, phaseName: 'Saliendo del Letargo' },
  { level: 4, title: 'Vencedor del Bostezo', phase: 1, phaseName: 'Saliendo del Letargo' },
  { level: 5, title: 'Escudo contra la Pereza', phase: 1, phaseName: 'Saliendo del Letargo' },
  { level: 6, title: 'Primer Paso Firme', phase: 1, phaseName: 'Saliendo del Letargo' },
  { level: 7, title: 'Caminante del Alba', phase: 1, phaseName: 'Saliendo del Letargo' },
  { level: 8, title: 'Buscador de Propósito', phase: 1, phaseName: 'Saliendo del Letargo' },
  { level: 9, title: 'Rebelde del Sofá', phase: 1, phaseName: 'Saliendo del Letargo' },
  { level: 10, title: 'Despertador de Hábitos', phase: 1, phaseName: 'Saliendo del Letargo' },
  
  // Fase 2: La Batalla del Foco
  { level: 11, title: 'Cazador de Minutos', phase: 2, phaseName: 'La Batalla del Foco' },
  { level: 12, title: 'Silenciador de Notificaciones', phase: 2, phaseName: 'La Batalla del Foco' },
  { level: 13, title: 'Centinela de la Atención', phase: 2, phaseName: 'La Batalla del Foco' },
  { level: 14, title: 'Jinete del Tiempo', phase: 2, phaseName: 'La Batalla del Foco' },
  { level: 15, title: 'Defensor de la Agenda', phase: 2, phaseName: 'La Batalla del Foco' },
  { level: 16, title: 'Enemigo de la Distracción', phase: 2, phaseName: 'La Batalla del Foco' },
  { level: 17, title: 'Foco de Hierro', phase: 2, phaseName: 'La Batalla del Foco' },
  { level: 18, title: 'Creador de Espacios', phase: 2, phaseName: 'La Batalla del Foco' },
  { level: 19, title: 'Protector del Presente', phase: 2, phaseName: 'La Batalla del Foco' },
  { level: 20, title: 'Vencedor del Caos', phase: 2, phaseName: 'La Batalla del Foco' },
  
  // Fase 3: Construyendo el Impulso
  { level: 21, title: 'Chispa Constante', phase: 3, phaseName: 'Construyendo el Impulso' },
  { level: 22, title: 'Motor de Arranque', phase: 3, phaseName: 'Construyendo el Impulso' },
  { level: 23, title: 'Forjador de Rutinas', phase: 3, phaseName: 'Construyendo el Impulso' },
  { level: 24, title: 'Arquitecto de Mañanas', phase: 3, phaseName: 'Construyendo el Impulso' },
  { level: 25, title: 'Impulso Creciente', phase: 3, phaseName: 'Construyendo el Impulso' },
  { level: 26, title: 'Fuerza en Movimiento', phase: 3, phaseName: 'Construyendo el Impulso' },
  { level: 27, title: 'Rompedor de Excusas', phase: 3, phaseName: 'Construyendo el Impulso' },
  { level: 28, title: 'Tejedor de Hábitos', phase: 3, phaseName: 'Construyendo el Impulso' },
  { level: 29, title: 'Creador de Inercia', phase: 3, phaseName: 'Construyendo el Impulso' },
  { level: 30, title: 'Rueda Imparable', phase: 3, phaseName: 'Construyendo el Impulso' },
  
  // Fase 4: La Prueba de la Constancia
  { level: 31, title: 'Héroe del Día a Día', phase: 4, phaseName: 'La Prueba de la Constancia' },
  { level: 32, title: 'Soldado de la Repetición', phase: 4, phaseName: 'La Prueba de la Constancia' },
  { level: 33, title: 'Guardián de la Racha', phase: 4, phaseName: 'La Prueba de la Constancia' },
  { level: 34, title: 'Esclavo de Ninguno', phase: 4, phaseName: 'La Prueba de la Constancia' },
  { level: 35, title: 'Vencedor de la Duda', phase: 4, phaseName: 'La Prueba de la Constancia' },
  { level: 36, title: 'Fuego que no se Apaga', phase: 4, phaseName: 'La Prueba de la Constancia' },
  { level: 37, title: 'Pilar de la Constancia', phase: 4, phaseName: 'La Prueba de la Constancia' },
  { level: 38, title: 'Caminante Incansable', phase: 4, phaseName: 'La Prueba de la Constancia' },
  { level: 39, title: 'Motor de la Disciplina', phase: 4, phaseName: 'La Prueba de la Constancia' },
  { level: 40, title: 'Muralla de Voluntad', phase: 4, phaseName: 'La Prueba de la Constancia' },
  
  // Fase 5: Resistencia y Fortaleza
  { level: 41, title: 'Guerrero del Esfuerzo', phase: 5, phaseName: 'Resistencia y Fortaleza' },
  { level: 42, title: 'Domador de la Frustración', phase: 5, phaseName: 'Resistencia y Fortaleza' },
  { level: 43, title: 'Resistencia Pura', phase: 5, phaseName: 'Resistencia y Fortaleza' },
  { level: 44, title: 'Titán del Compromiso', phase: 5, phaseName: 'Resistencia y Fortaleza' },
  { level: 45, title: 'Escudo de Acero', phase: 5, phaseName: 'Resistencia y Fortaleza' },
  { level: 46, title: 'Rompe-Límites', phase: 5, phaseName: 'Resistencia y Fortaleza' },
  { level: 47, title: 'Fortaleza Mental', phase: 5, phaseName: 'Resistencia y Fortaleza' },
  { level: 48, title: 'Vencedor del Cansancio', phase: 5, phaseName: 'Resistencia y Fortaleza' },
  { level: 49, title: 'Alma Inquebrantable', phase: 5, phaseName: 'Resistencia y Fortaleza' },
  { level: 50, title: 'Corazón de Hierro', phase: 5, phaseName: 'Resistencia y Fortaleza' },
  
  // Fase 6: Maestría del Hábito
  { level: 51, title: 'Dueño de sus Pasos', phase: 6, phaseName: 'Maestría del Hábito' },
  { level: 52, title: 'Mecanismo Perfecto', phase: 6, phaseName: 'Maestría del Hábito' },
  { level: 53, title: 'Relojero del Destino', phase: 6, phaseName: 'Maestría del Hábito' },
  { level: 54, title: 'Maestro de la Rutina', phase: 6, phaseName: 'Maestría del Hábito' },
  { level: 55, title: 'Flujo Constante', phase: 6, phaseName: 'Maestría del Hábito' },
  { level: 56, title: 'Piloto del Presente', phase: 6, phaseName: 'Maestría del Hábito' },
  { level: 57, title: 'Navegante de Metas', phase: 6, phaseName: 'Maestría del Hábito' },
  { level: 58, title: 'Ejecutor Preciso', phase: 6, phaseName: 'Maestría del Hábito' },
  { level: 59, title: 'Alquimista del Tiempo', phase: 6, phaseName: 'Maestría del Hábito' },
  { level: 60, title: 'Avatar del Hábito', phase: 6, phaseName: 'Maestría del Hábito' },
  
  // Fase 7: La Mente Indomable
  { level: 61, title: 'Mente de Diamante', phase: 7, phaseName: 'La Mente Indomable' },
  { level: 62, title: 'Conquistador de Miedos', phase: 7, phaseName: 'La Mente Indomable' },
  { level: 63, title: 'Rey del Autocontrol', phase: 7, phaseName: 'La Mente Indomable' },
  { level: 64, title: 'Sabio de la Paciencia', phase: 7, phaseName: 'La Mente Indomable' },
  { level: 65, title: 'Estratega de Vida', phase: 7, phaseName: 'La Mente Indomable' },
  { level: 66, title: 'Espíritu Indomable', phase: 7, phaseName: 'La Mente Indomable' },
  { level: 67, title: 'Visión de Águila', phase: 7, phaseName: 'La Mente Indomable' },
  { level: 68, title: 'Soberano de la Voluntad', phase: 7, phaseName: 'La Mente Indomable' },
  { level: 69, title: 'Fuego Disciplinado', phase: 7, phaseName: 'La Mente Indomable' },
  { level: 70, title: 'Fuerza Silenciosa', phase: 7, phaseName: 'La Mente Indomable' },
  
  // Fase 8: Rendimiento de Élite
  { level: 71, title: 'Cazador de Excelencia', phase: 8, phaseName: 'Rendimiento de Élite' },
  { level: 72, title: 'Forjador de Legados', phase: 8, phaseName: 'Rendimiento de Élite' },
  { level: 73, title: 'Titán de la Productividad', phase: 8, phaseName: 'Rendimiento de Élite' },
  { level: 74, title: 'Maestro del Alto Rendimiento', phase: 8, phaseName: 'Rendimiento de Élite' },
  { level: 75, title: 'Oráculo de la Eficiencia', phase: 8, phaseName: 'Rendimiento de Élite' },
  { level: 76, title: 'Creador de Impacto', phase: 8, phaseName: 'Rendimiento de Élite' },
  { level: 77, title: 'Leyenda en Construcción', phase: 8, phaseName: 'Rendimiento de Élite' },
  { level: 78, title: 'Vencedor de lo Imposible', phase: 8, phaseName: 'Rendimiento de Élite' },
  { level: 79, title: 'Ídolo de la Ejecución', phase: 8, phaseName: 'Rendimiento de Élite' },
  { level: 80, title: 'Élite de la Acción', phase: 8, phaseName: 'Rendimiento de Élite' },
  
  // Fase 9: Autodominio Absoluto
  { level: 81, title: 'Dueño del Reloj', phase: 9, phaseName: 'Autodominio Absoluto' },
  { level: 82, title: 'Monarca de las Decisiones', phase: 9, phaseName: 'Autodominio Absoluto' },
  { level: 83, title: 'Guardián del Destino', phase: 9, phaseName: 'Autodominio Absoluto' },
  { level: 84, title: 'Creador de Realidades', phase: 9, phaseName: 'Autodominio Absoluto' },
  { level: 85, title: 'Fuerza Trascendental', phase: 9, phaseName: 'Autodominio Absoluto' },
  { level: 86, title: 'Arquitecto de Vida', phase: 9, phaseName: 'Autodominio Absoluto' },
  { level: 87, title: 'Maestro de Sí Mismo', phase: 9, phaseName: 'Autodominio Absoluto' },
  { level: 88, title: 'Soberano del Tiempo', phase: 9, phaseName: 'Autodominio Absoluto' },
  { level: 89, title: 'Sabio de la Ejecución', phase: 9, phaseName: 'Autodominio Absoluto' },
  { level: 90, title: 'Iluminado del Enfoque', phase: 9, phaseName: 'Autodominio Absoluto' },
  
  // Fase 10: La Solución
  { level: 91, title: 'Leyenda de la Voluntad', phase: 10, phaseName: 'La Solución' },
  { level: 92, title: 'Mito de la Disciplina', phase: 10, phaseName: 'La Solución' },
  { level: 93, title: 'Titán del Autodominio', phase: 10, phaseName: 'La Solución' },
  { level: 94, title: 'Héroe del Tiempo', phase: 10, phaseName: 'La Solución' },
  { level: 95, title: 'Fuerza Creadora', phase: 10, phaseName: 'La Solución' },
  { level: 96, title: 'Avatar del Éxito', phase: 10, phaseName: 'La Solución' },
  { level: 97, title: 'Soberano Absoluto', phase: 10, phaseName: 'La Solución' },
  { level: 98, title: 'Maestro de la Trascendencia', phase: 10, phaseName: 'La Solución' },
  { level: 99, title: 'El Inquebrantable', phase: 10, phaseName: 'La Solución' },
  { level: 100, title: 'La Solución Encarnada', phase: 10, phaseName: 'La Solución' },
];

export const getRankForLevel = (level: number): RankInfo => {
  const safeLvl = Math.max(1, typeof level === 'number' && !isNaN(level) ? level : 1);
  const matched = [...RANKS].reverse().find((r) => safeLvl >= r.level);
  return matched || RANKS[0];
};

export const DAILY_REWARDS: DailyRewardItem[] = [
  { day: 1, coins: 3, xp: 5 },
  { day: 2, coins: 4, xp: 6 },
  { day: 3, coins: 5, xp: 8, bonusItem: 'Poción de Energía ⚡ (+5 Enfoque)' },
  { day: 4, coins: 6, xp: 10 },
  { day: 5, coins: 8, xp: 12, bonusItem: 'Amuleto de Racha 🔥' },
  { day: 6, coins: 10, xp: 15 },
  { day: 7, coins: 15, xp: 25, bonusItem: 'Cofre Legendario Mítico 👑 (+25 XP bonus)' },
];

export const DEFAULT_TASKS: TaskItem[] = [];

export const INITIAL_SHOP_REWARDS: ShopReward[] = [
  {
    id: 'perk-healing-potion',
    title: 'Poción de Curación Mayor 💖',
    description: 'Restaura inmediatamente 30 puntos de HP (Vitalidad). Ideal para recuperarte tras fallar misiones o pomodoros.',
    cost: 35,
    icon: '💖',
    category: 'perk',
    unlockedCount: 0,
  },
  {
    id: 'perk-streak-shield',
    title: 'Escudo de Racha 🛡️',
    description: 'Protege tu racha acumulada si un día no puedes completar tareas.',
    cost: 100,
    icon: '🛡️',
    category: 'perk',
    unlockedCount: 0,
  },
  {
    id: 'perk-focus-potion',
    title: 'Poción de Enfoque (+50% XP/Monedas) 🧪',
    description: 'Bebida alquímica que potencia un 50% las ganancias de XP y oro durante tus próximas misiones.',
    cost: 75,
    icon: '🧪',
    category: 'perk',
    unlockedCount: 0,
  },
  {
    id: 'perk-resurrection-potion',
    title: 'Poción de Resurrección 💖',
    description: 'Comodín supremo para reanimar una racha caída y proteger tus días de mayor esfuerzo (+2 Escudos).',
    cost: 150,
    icon: '💖',
    category: 'perk',
    unlockedCount: 0,
  },
  {
    id: 'perk-epic-title',
    title: 'Título Épico / Monarca 👑',
    description: 'Desbloquea el prestigioso título de "Monarca de las Sombras" y +10 en todos tus atributos.',
    cost: 200,
    icon: '👑',
    category: 'perk',
    unlockedCount: 0,
  },
  {
    id: 'shop-1',
    title: 'Capítulo de Serie / Anime 🍿',
    description: '45 minutos de relajación sin culpa tras completar tus bloques.',
    cost: 25,
    icon: '🎬',
    category: 'ocio',
    unlockedCount: 0,
  },
  {
    id: 'shop-2',
    title: 'Snack / Café Especial ☕',
    description: 'Tu café favorito o un postre fit bien merecido.',
    cost: 35,
    icon: '☕',
    category: 'comida',
    unlockedCount: 0,
  },
  {
    id: 'shop-3',
    title: 'Sesión de Videojuegos (1 Hora) 🎮',
    description: 'Juega a tu juego favorito con la mente despejada.',
    cost: 50,
    icon: '🎮',
    category: 'ocio',
    unlockedCount: 0,
  },
  {
    id: 'shop-4',
    title: 'Día de Descanso / Cheat Meal 🍕',
    description: 'Una comida libre total o tarde libre de domingo.',
    cost: 120,
    icon: '🍕',
    category: 'comida',
    unlockedCount: 0,
  },
  {
    id: 'shop-5',
    title: 'Comprar Accesorio o Ropa Gym 👟',
    description: 'Premio tangible: ahorra monedas para renovar tu equipamiento.',
    cost: 300,
    icon: '👕',
    category: 'perk',
    unlockedCount: 0,
  },
];


export const INITIAL_CUSTOM_HABITS: CustomHabit[] = [
  {
    id: 'habit-water',
    title: 'Tomar 8 Vasos de Agua 💧',
    category: 'habito',
    description: 'Hidratación óptima (2 Litros diarios)',
    xpReward: 8,
    coinReward: 3,
    frequencyType: 'daily',
    targetCount: 8,
    unit: 'vasos',
    isQuickHabit: true,
    isTracked2166: true,
    quickIcon: '💧'
  },
  {
    id: 'habit-teeth',
    title: 'Cepillado de Dientes 🪥',
    category: 'habito',
    description: 'Higiene bucal tras cada comida principal (3 veces al día)',
    xpReward: 5,
    coinReward: 2,
    frequencyType: 'daily',
    targetCount: 3,
    unit: 'veces',
    isQuickHabit: true,
    isTracked2166: true,
    quickIcon: '🪥'
  },
  {
    id: 'habit-workout',
    title: 'Ejercicio / Actividad Física 🏋️',
    category: 'entrenamiento',
    description: '45 minutos de entrenamiento o movimiento físico',
    xpReward: 20,
    coinReward: 8,
    frequencyType: 'daily',
    targetCount: 1,
    unit: 'sesión',
    isQuickHabit: true,
    isTracked2166: true,
    quickIcon: '🏋️'
  },
  {
    id: 'habit-reading',
    title: 'Lectura Diaria (10 Páginas) 📚',
    category: 'estudio',
    description: 'Lectura activa de libros de crecimiento o estudio',
    xpReward: 15,
    coinReward: 5,
    frequencyType: 'daily',
    targetCount: 1,
    unit: 'sesión',
    isQuickHabit: true,
    isTracked2166: true,
    quickIcon: '📚'
  },
  {
    id: 'habit-meditation',
    title: 'Meditación & Respiración 🧘',
    category: 'habito',
    description: '10 minutos de respiración y mindfulness',
    xpReward: 15,
    coinReward: 5,
    frequencyType: 'daily',
    targetCount: 1,
    unit: 'sesión',
    isQuickHabit: true,
    isTracked2166: true,
    quickIcon: '🧘'
  },
  {
    id: 'habit-mindset',
    title: 'Autocontrol & Enfoque 🧠',
    category: 'habito',
    description: 'Dominio de impulsos y mente limpia sin distracciones',
    xpReward: 25,
    coinReward: 10,
    frequencyType: 'daily',
    targetCount: 1,
    unit: 'día',
    isQuickHabit: true,
    isTracked2166: true,
    quickIcon: '🧠'
  },
  {
    id: 'habit-nosmoke',
    title: 'Sin Fumar / Vida Sana 🚭',
    category: 'habito',
    description: 'Día limpio sin consumo de tabaco o vapeo',
    xpReward: 25,
    coinReward: 10,
    frequencyType: 'daily',
    targetCount: 1,
    unit: 'día',
    isQuickHabit: true,
    isTracked2166: true,
    quickIcon: '🚭'
  },
  {
    id: 'habit-noalcohol',
    title: 'Sin Licor / Mente Clara 🍺',
    category: 'habito',
    description: 'Día libre de alcohol para máxima claridad y recuperación',
    xpReward: 25,
    coinReward: 10,
    frequencyType: 'daily',
    targetCount: 1,
    unit: 'día',
    isQuickHabit: true,
    isTracked2166: true,
    quickIcon: '🍺'
  }
];

export const MIGRATION_HABITS: CustomHabit[] = [];
export const parseDays = (days: any): number[] => {
  if (days === undefined || days === null) return [];
  if (typeof days === 'number') return [days];
  if (Array.isArray(days)) {
    return days.map(d => {
       if (typeof d === 'number') return d;
       if (typeof d === 'string') {
          const s = d.toLowerCase().trim();
          if (s.includes('dom') || s.includes('sun')) return 0;
          if (s.includes('lun') || s.includes('mon')) return 1;
          if (s.includes('mar') || s.includes('tue')) return 2;
          if (s.includes('mie') || s.includes('mié') || s.includes('wed')) return 3;
          if (s.includes('jue') || s.includes('thu')) return 4;
          if (s.includes('vie') || s.includes('fri')) return 5;
          if (s.includes('sab') || s.includes('sáb') || s.includes('sat')) return 6;
          const n = parseInt(d, 10);
          return isNaN(n) ? NaN : n;
       }
       return NaN;
    }).filter(n => !isNaN(n));
  }
  if (typeof days === 'string') {
    const s = days.toLowerCase().trim();
    if (s.includes('lunes a viernes') || s.includes('l-v') || s.includes('laborables') || s.includes('semana')) {
      return [1, 2, 3, 4, 5];
    }
    if (s.includes('fin de semana') || s.includes('fines de semana') || s.includes('weekend')) {
      return [0, 6];
    }
    if (s.includes('todos') || s.includes('diario') || s.includes('toda la semana') || s.includes('everyday')) {
      return [0, 1, 2, 3, 4, 5, 6];
    }
    return s.split(/[,;\s]+/).map(part => {
      const p = part.trim();
      if (!p) return NaN;
      if (p.includes('dom') || p.includes('sun')) return 0;
      if (p.includes('lun') || p.includes('mon')) return 1;
      if (p.includes('mar') || p.includes('tue')) return 2;
      if (p.includes('mie') || p.includes('mié') || p.includes('wed')) return 3;
      if (p.includes('jue') || p.includes('thu')) return 4;
      if (p.includes('vie') || p.includes('fri')) return 5;
      if (p.includes('sab') || p.includes('sáb') || p.includes('sat')) return 6;
      const num = parseInt(p, 10);
      return isNaN(num) ? NaN : num;
    }).filter(n => !isNaN(n));
  }
  return [];
};

import { deduplicateTasksForDay, deduplicateHabits } from '../utils/taskDeduplication';

export const generateDailyTasks = (
  dateString: string,
  customHabits: CustomHabit[] = [],
  characterClass?: string
): TaskItem[] => {
  const d = parseLocalDate(dateString);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday...
  let tasks: TaskItem[] = [];
  const add = (id: string, title: string, category: any, description: string, xpReward: number, coinReward: number, timeBlock: string | undefined, extra: any = {}) => {
    tasks.push({
      id: `task-${id}-${dateString}`,
      title,
      category,
      description,
      xpReward,
      coinReward,
      completed: false,
      timeBlock,
      ...extra
    });
  };

  // Ensure customHabits array is clean of internal duplicates before generating
  const cleanHabits = deduplicateHabits(customHabits);

  cleanHabits.forEach(habit => {
    let isActive = false;
    const numericDays = (habit.specificDays !== undefined && habit.specificDays !== null)
      ? parseDays(habit.specificDays)
      : [];

    if (numericDays.length > 0 && numericDays.length < 7) {
      isActive = numericDays.includes(day);
    } else {
      const type = String(habit.frequencyType || 'daily').toLowerCase().trim();
      if (type === 'daily' || type === 'todos los dias' || type === 'everyday' || type === 'diario' || type === 'diaria' || type === 'toda la semana') {
        isActive = true;
      } else {
        isActive = true;
      }
    }

    if (isActive) {
      // Only designated quick/discipline habits are treated as 21/66 day habits
      const isHabit2166 = Boolean(
        habit.isTracked2166 ||
        habit.isQuickHabit ||
        habit.id.includes('habit-water') ||
        habit.id.includes('habit-teeth')
      );

      add(
        habit.id, 
        habit.title, 
        habit.category, 
        habit.description || '', 
        habit.xpReward, 
        habit.coinReward, 
        habit.timeBlock, 
        {
          isHabit: isHabit2166,
          isTracked2166: isHabit2166,
          targetCount: isHabit2166 ? habit.targetCount : undefined,
          currentCount: isHabit2166 ? 0 : undefined,
          unit: isHabit2166 ? habit.unit : undefined,
          isQuickHabit: Boolean(habit.isQuickHabit),
          quickIcon: habit.quickIcon,
          isLegendaryBounty: habit.isLegendaryBounty
        }
      );
    }
  });

  return deduplicateTasksForDay(tasks);
};
