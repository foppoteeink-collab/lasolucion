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
  branch: 'vector' | 'illustration';
  tagline: string;
  description: string;
  palette: { primary: string; secondary: string; accent: string };
  sampleEmoji: string;
}

export const KAI_MULTIVERSE_STYLES: MultiverseStyleDefinition[] = [
  {
    id: 'clay3d',
    name: '3D Vinyl / Pixar',
    badge: 'ILUSTRACIÓN 3D',
    icon: '🔮',
    branch: 'illustration',
    tagline: 'Figura coleccionable 3D con volumen suave, luces de estudio y acabado vinilo.',
    description: 'Genera una ilustración 3D hipercarismática del objeto con iluminación suave, expresión viva y fondo transparente.',
    palette: { primary: '#ec4899', secondary: '#8b5cf6', accent: '#f43f5e' },
    sampleEmoji: '🔮🧸',
  },
  {
    id: 'anime',
    name: 'Anime / Chibi',
    badge: 'MANGA CHIBI',
    icon: '✨',
    branch: 'illustration',
    tagline: 'Líneas limpias de anime cel-shaded con ojos grandes brillantes y expresión tierna.',
    description: 'Transforma el objeto en una mascota kawaii estilo Studio Ghibli con grandes ojos expresivos y contornos definidos.',
    palette: { primary: '#38bdf8', secondary: '#818cf8', accent: '#c084fc' },
    sampleEmoji: '✨🎌',
  },
  {
    id: 'comic',
    name: 'Cómic Moderno',
    badge: 'POP ART',
    icon: '💥',
    branch: 'illustration',
    tagline: 'Entintado negro audaz, semitonos pop art y colores dinámicos de novela gráfica.',
    description: 'Ilustración estilo cómic con tintas fuertes, energía vibrante y textura de historieta moderna.',
    palette: { primary: '#f97316', secondary: '#ef4444', accent: '#fbbf24' },
    sampleEmoji: '💥⚡',
  },
  {
    id: 'crayon',
    name: 'Crayón Infantil',
    badge: 'ARTE A MANO',
    icon: '🖍️',
    branch: 'illustration',
    tagline: 'Textura rugosa de cera de colores y trazos espontáneos de libro de cuentos.',
    description: 'Dibujo a mano alzada con textura realista de crayón, colores vivos y aura tierna.',
    palette: { primary: '#10b981', secondary: '#f59e0b', accent: '#ec4899' },
    sampleEmoji: '🖍️🎨',
  },
  {
    id: 'neon-geometry',
    name: 'Geometría Neón',
    badge: 'VECTOR // SCI-FI',
    icon: '📐',
    branch: 'vector',
    tagline: 'Líneas rectas simétricas, trazos vectoriales y estética wireframe neón.',
    description: 'Genera <polygon> y <path> con líneas rectas simétricas, stroke-width="2", fill="none" canalizando el aura activa.',
    palette: { primary: '#00f0ff', secondary: '#0284c7', accent: '#38bdf8' },
    sampleEmoji: '📐⚡',
  },
  {
    id: 'cyber-pixel',
    name: 'Cyber-Pixel',
    badge: 'VECTOR 8-BIT',
    icon: '👾',
    branch: 'vector',
    tagline: 'Cuadrícula estricta de 8x8px simulando sprites arcade de 8-bits.',
    description: 'Genera únicamente elementos <rect> alineados en una cuadrícula de 8x8px simulando pixel art retro.',
    palette: { primary: '#10b981', secondary: '#059669', accent: '#6ee7b7' },
    sampleEmoji: '🕹️👾',
  },
  {
    id: 'organic-flow',
    name: 'Flujo Orgánico',
    badge: 'VECTOR BEZIER',
    icon: '🌊',
    branch: 'vector',
    tagline: 'Exclusivamente curvas Bezier suaves (C y S) sin ángulos rectos.',
    description: 'Genera exclusivamente curvas Bezier suaves (C y S en los paths), sin ángulos rectos, fill="none".',
    palette: { primary: '#ec4899', secondary: '#a855f7', accent: '#f43f5e' },
    sampleEmoji: '🧬✨',
  },
  {
    id: 'low-poly',
    name: 'Low Poly',
    badge: 'VECTOR 3D',
    icon: '💎',
    branch: 'vector',
    tagline: 'Polígonos cerrados facetados con fill-opacity para simular volumen.',
    description: 'Genera polígonos cerrados asignando a cada uno un atributo fill-opacity entre 0.1 y 0.9 para simular volumen, sin trazos exteriores.',
    palette: { primary: '#f59e0b', secondary: '#d97706', accent: '#fbbf24' },
    sampleEmoji: '💎🔮',
  },
];

