import React from 'react';
import { KaiShapeKey, KaiMultiverseStyle } from '../types';

export interface KaiShapeDefinition {
  id: KaiShapeKey;
  name: string;
  codename: string;
  icon: string;
  tagline: string;
  description: string;
  themeTrait: string;
  archetypeMatch: string;
}

export const KAI_OFFICIAL_SHAPES: KaiShapeDefinition[] = [
  {
    id: 'prism',
    name: 'El Prisma',
    codename: 'ORÁCULO // PRIMA',
    icon: '🔺',
    tagline: 'Geometría sagrada, visión y foco mental absoluto.',
    description: 'La pirámide cuántica original con el ojo que todo lo ve. Ideal para operadores estratégicos, deep work y disciplina inquebrantable.',
    themeTrait: 'Visión & Foco',
    archetypeMatch: 'El Héroe / El Sabio',
  },
  {
    id: 'octahedron',
    name: 'El Núcleo Octaedro',
    codename: 'SYNAPSE // CRISTAL',
    icon: '💠',
    tagline: 'Rombo tridimensional de 8 caras con pulso energético.',
    description: 'Estructura cristalina multifacetada que balancea todos los aspectos de tu vida. Canaliza energía mental constante sin fluctuaciones.',
    themeTrait: 'Armonía & Equilibrio',
    archetypeMatch: 'El Creador / El Mago',
  },
  {
    id: 'wolf',
    name: 'El Lobo Cyber-Alfa',
    codename: 'VORTEX // ALFA',
    icon: '🐺',
    tagline: 'Instinto implacable, agresividad controlada y determinación.',
    description: 'Cabeza poligonal frontal con orejas triangulares afiladas y mirada láser. Diseñado para cazadores de metas que no negocian con la pereza.',
    themeTrait: 'Instinto & Ataque',
    archetypeMatch: 'El Guerrero / El Rebelde',
  },
  {
    id: 'hound',
    name: 'El Sabueso Táctico',
    codename: 'SENTINEL // FIDELIS',
    icon: '🐕',
    tagline: 'Lealtad a tus promesas, constancia noble y alerta.',
    description: 'Silueta canina geométrica inspirada en los guardianes de frontera. Mantiene el rastro de tus hábitos diarios y nunca abandona la guardia.',
    themeTrait: 'Lealtad & Hábitos',
    archetypeMatch: 'El Hombre Corriente / El Inocente',
  },
  {
    id: 'panther',
    name: 'Felino Sombra',
    codename: 'SHADOW // STEALTH',
    icon: '🐈⬛',
    tagline: 'Velocidad silenciosa, elegancia táctica y ejecución limpia.',
    description: 'Geometría felina minimalista de líneas afiladas y pómulos en rombo. Se desliza por tu jornada completando misiones con sigilo y precisión.',
    themeTrait: 'Sigilo & Precisión',
    archetypeMatch: 'El Explorador / El Amante',
  },
  {
    id: 'elephant',
    name: 'El Titán de Memoria',
    codename: 'AETHER // TITAN',
    icon: '🐘',
    tagline: 'Memoria ancestral, fuerza inamovible y sabiduría longeva.',
    description: 'Cabeza poligonal imponente con orejas como escudos, colmillos de energía en V y trompa facetada. Construye hábitos para toda la vida.',
    themeTrait: 'Resiliencia & Memoria',
    archetypeMatch: 'El Cuidador / El Gobernante',
  },
];

export interface KaiAuraDefinition {
  id: string;
  name: string;
  category: string;
  color: string;
  secondaryColor: string;
  glow: string;
  requiredStreak: number;
}

export const KAI_AURAS_REGISTRY: KaiAuraDefinition[] = [
  {
    id: 'quantum',
    name: 'Cian Cuántico',
    category: 'trabajo',
    color: '#00f0ff',
    secondaryColor: '#0284c7',
    glow: 'rgba(0, 240, 255, 0.65)',
    requiredStreak: 0,
  },
  {
    id: 'fury',
    name: 'Furia Solar',
    category: 'entrenamiento',
    color: '#fb5607',
    secondaryColor: '#ea580c',
    glow: 'rgba(251, 86, 7, 0.7)',
    requiredStreak: 21,
  },
  {
    id: 'magic',
    name: 'Magia Sináptica',
    category: 'estudio',
    color: '#9600ff',
    secondaryColor: '#c084fc',
    glow: 'rgba(150, 0, 255, 0.7)',
    requiredStreak: 21,
  },
  {
    id: 'energy',
    name: 'Lima Energía',
    category: 'rutina',
    color: '#d6f421',
    secondaryColor: '#a3e635',
    glow: 'rgba(214, 244, 33, 0.7)',
    requiredStreak: 21,
  },
  {
    id: 'health',
    name: 'Esmeralda Zen',
    category: 'salud',
    color: '#10b981',
    secondaryColor: '#059669',
    glow: 'rgba(16, 185, 129, 0.7)',
    requiredStreak: 21,
  },
  {
    id: 'sovereign',
    name: 'Oro de Maestría',
    category: 'maestria',
    color: '#fbbf24',
    secondaryColor: '#f59e0b',
    glow: 'rgba(251, 191, 36, 0.85)',
    requiredStreak: 66,
  },
];

export interface MultiverseStyleDefinition {
  id: KaiMultiverseStyle;
  name: string;
  badge: string;
  icon: string;
  tagline: string;
  description: string;
  palette: { primary: string; secondary: string; accent: string };
  sampleEmoji: string;
}

export const KAI_MULTIVERSE_STYLES: MultiverseStyleDefinition[] = [
  {
    id: 'toon',
    name: 'Caricatura Toon',
    badge: 'MÁXIMA EXPRESIÓN',
    icon: '🧸',
    tagline: 'Ojos gigantes, sonrisa viviente y carisma estilo dibujo animado.',
    description: 'Transforma cualquier objeto en una mascota amigable con grandes ojos expresivos, boca simpática y contornos entintados vivos.',
    palette: { primary: '#f59e0b', secondary: '#ef4444', accent: '#3b82f6' },
    sampleEmoji: '👀✨',
  },
  {
    id: 'clay3d',
    name: 'Arte 3D / Vinil',
    badge: 'PIXAR / CLAY',
    icon: '🔮',
    tagline: 'Volumen suave 3D, iluminación táctil y acabado coleccionable.',
    description: 'Convierte el objeto en un tierno juguete 3D de vinilo o plastilina modelada, con luces redondeadas y sombras suaves.',
    palette: { primary: '#8b5cf6', secondary: '#ec4899', accent: '#06b6d4' },
    sampleEmoji: '🧸💫',
  },
  {
    id: 'chrome',
    name: 'Cromo & Mercurio',
    badge: 'FUTURISTA Y2K',
    icon: '⚡',
    tagline: 'Metal líquido pulido, reflejos de titanio y destellos puros.',
    description: 'Estiliza el objeto en una escultura de cromo líquido futurista, con reflejos de mercurio y destellos especulares brillantes.',
    palette: { primary: '#00f0ff', secondary: '#38bdf8', accent: '#ffffff' },
    sampleEmoji: '🪞⚡',
  },
  {
    id: 'papercraft',
    name: 'Recortes / Papel',
    badge: 'ARTESANAL 3D',
    icon: '📄',
    tagline: 'Capas de papel cortado a mano con relieve y sombras en profundidad.',
    description: 'Diseño multicapa artesanal con sombras proyectadas realistas, texturas de cartulina y origami tridimensional cálido.',
    palette: { primary: '#f97316', secondary: '#d97706', accent: '#fef3c7' },
    sampleEmoji: '✂️🎨',
  },
  {
    id: 'pixel',
    name: 'Pixel Art 16-bit',
    badge: 'RETRO GAMER',
    icon: '👾',
    tagline: 'Estética arcade nostálgica de Super Nintendo con ojos en bloque.',
    description: 'Reinterpreta el objeto como un personaje de videojuego clásico retro, con cuadrícula de píxeles nítidos y animación arcade.',
    palette: { primary: '#10b981', secondary: '#059669', accent: '#6ee7b7' },
    sampleEmoji: '🕹️👾',
  },
];

