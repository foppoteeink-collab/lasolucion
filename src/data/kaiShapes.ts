import React from 'react';
import { KaiShapeKey } from '../types';

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
    name: 'La Pantera Neón',
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
