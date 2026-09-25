import { HabitEnergyType, TaskCategory } from '../types';

export interface HabitEnergyDetail {
  type: HabitEnergyType;
  label: string;
  icon: string;
  badgeColor: string;
  auraName21: string;
  auraDesc21: string;
  masterForm66: string;
  masterDesc66: string;
  particleColor: string;
  glowClass: string;
}

export const HABIT_ENERGY_DETAILS: Record<HabitEnergyType, HabitEnergyDetail> = {
  purification: {
    type: 'purification',
    label: 'Purificación & Desintoxicación',
    icon: '💧',
    badgeColor: 'bg-cyan-950/80 border-cyan-400/80 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)]',
    auraName21: 'Aura de Luz Cristalina',
    auraDesc21: 'Marea de partículas celestes de agua viva que purifican el sistema.',
    masterForm66: 'Guardián Purificado Supremo',
    masterDesc66: 'Sello de desintoxicación total +10% recuperación de vitalidad.',
    particleColor: '#06b6d4',
    glowClass: 'shadow-[0_0_25px_rgba(6,182,212,0.6)]'
  },
  strength: {
    type: 'strength',
    label: 'Fuerza & Potencia Física',
    icon: '⚡',
    badgeColor: 'bg-orange-950/80 border-orange-400/80 text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.4)]',
    auraName21: 'Ignición Eléctrica',
    auraDesc21: 'Rayos neón cían y destellos de poder físico en torno al cuerpo.',
    masterForm66: 'Titán Guardián de Ignición',
    masterDesc66: 'Presencia de combate titánica +10% XP pasivo en misiones de esfuerzo.',
    particleColor: '#f97316',
    glowClass: 'shadow-[0_0_25px_rgba(249,115,22,0.6)]'
  },
  mind: {
    type: 'mind',
    label: 'Maestría Mental & Foco',
    icon: '🧠',
    badgeColor: 'bg-purple-950/80 border-purple-400/80 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.4)]',
    auraName21: 'Anillos Arcanos Flotantes',
    auraDesc21: 'Glifos holográficos de sabiduría girando sobre el núcleo.',
    masterForm66: 'Mente Maestra Arcana',
    masterDesc66: 'Orbe superior de conocimiento cognitivo +10% XP a todas las directivas.',
    particleColor: '#a855f7',
    glowClass: 'shadow-[0_0_25px_rgba(168,85,247,0.6)]'
  },
  discipline: {
    type: 'discipline',
    label: 'Autocontrol & Disciplina',
    icon: '🛡️',
    badgeColor: 'bg-amber-950/80 border-amber-400/80 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.4)]',
    auraName21: 'Escudo Dorado de Voluntad',
    auraDesc21: 'Coraza protectora dorada de innegociable coherencia operativa.',
    masterForm66: 'Guardián Inquebrantable',
    masterDesc66: 'Protección de racha automática ante fluctuaciones biológicas.',
    particleColor: '#f59e0b',
    glowClass: 'shadow-[0_0_25px_rgba(245,158,11,0.6)]'
  },
  creativity: {
    type: 'creativity',
    label: 'Creatividad & Flujo',
    icon: '🎨',
    badgeColor: 'bg-fuchsia-950/80 border-fuchsia-400/80 text-fuchsia-300 shadow-[0_0_10px_rgba(217,70,239,0.4)]',
    auraName21: 'Polvo Estelar Fucsia',
    auraDesc21: 'Estela brillante de constelaciones creativas y estado de flujo.',
    masterForm66: 'Creador Cósmico Supremo',
    masterDesc66: 'Resplandor holográfico multidimensional y foco sin fricción.',
    particleColor: '#d946ef',
    glowClass: 'shadow-[0_0_25px_rgba(217,70,239,0.6)]'
  }
};

/**
 * Detects habit energy type automatically based on keywords in habit title/category
 */
export function detectHabitEnergy(title: string, category?: TaskCategory): HabitEnergyType {
  const t = (title || '').toLowerCase();
  const c = (category || '').toLowerCase();

  // Purification / Detox
  if (
    t.includes('fumar') || t.includes('masturb') || t.includes('porno') || 
    t.includes('agua') || t.includes('vaso') || t.includes('chatarra') || 
    t.includes('alcohol') || t.includes('vape') || t.includes('azúcar') || 
    t.includes('desintox') || t.includes('limpia') || c.includes('comida')
  ) {
    return 'purification';
  }

  // Strength / Fitness
  if (
    t.includes('gym') || t.includes('gimnasio') || t.includes('ejercicio') || 
    t.includes('correr') || t.includes('flexion') || t.includes('pasos') || 
    t.includes('deporte') || t.includes('pesas') || t.includes('caminar') || 
    c.includes('entrenamiento')
  ) {
    return 'strength';
  }

  // Mind / Focus / Learning
  if (
    t.includes('estudiar') || t.includes('código') || t.includes('leer') || 
    t.includes('lectura') || t.includes('alemán') || t.includes('inglés') || 
    t.includes('libro') || t.includes('aprender') || t.includes('programar') || 
    c.includes('estudio') || c.includes('mente')
  ) {
    return 'mind';
  }

  // Creativity / Art / Content
  if (
    t.includes('escribir') || t.includes('pintar') || t.includes('música') || 
    t.includes('guitarra') || t.includes('dibujar') || t.includes('diseñar') || 
    c.includes('creativo')
  ) {
    return 'creativity';
  }

  // Discipline / Control / General Habits
  return 'discipline';
}
