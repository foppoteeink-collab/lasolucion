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
    tagline: 'Geometría cuántica pura, visión y foco mental absoluto.',
    description: 'La forma cuántica original con el ojo que todo lo ve. El núcleo madre de KAI con el que inicias tu camino.',
    themeTrait: 'Visión & Foco',
    archetypeMatch: 'El Héroe / El Sabio',
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
    name: 'Cyber-Vinyl Art Toy',
    badge: 'DESIGNER TOY',
    icon: '💎',
    branch: 'illustration',
    tagline: 'Pieza de arte coleccionable urbana: acabado mate, acentos de laca y luces de neón.',
    description: 'Transforma el objeto en una figura coleccionable de diseñador de vanguardia (estilo Neo-Tokyo Art Toy), con cortes limpios, paleta refinada y presencia imponente.',
    palette: { primary: '#06b6d4', secondary: '#8b5cf6', accent: '#f43f5e' },
    sampleEmoji: '💎⚡',
  },
  {
    id: 'anime',
    name: 'Familiar de Cazador',
    badge: 'SHONEN OSCURO',
    icon: '🗡️',
    branch: 'illustration',
    tagline: 'Trazo de tinta dinámico, ojos afilados incandescentes y aura de combate imponente.',
    description: 'Despierta un espíritu familiar guerrero estilo Solo Leveling o Persona 5, con mirada afilada de energía espectral, silueta dinámica y sombreado cel-shaded dramático.',
    palette: { primary: '#6366f1', secondary: '#3b82f6', accent: '#a855f7' },
    sampleEmoji: '🗡️🔥',
  },
  {
    id: 'comic',
    name: 'Cyber-Noir Gráfico',
    badge: 'NEO-NOIR',
    icon: '💥',
    branch: 'illustration',
    tagline: 'Entintado negro pesado de alto contraste, sombras cortantes y estética cyberpunk.',
    description: 'Ilustración estilo novela gráfica madura con contrastes agresivos de tinta negra, sombras angulares y estética urbana nocturna (estilo Spider-Verse / Batman Beyond).',
    palette: { primary: '#f97316', secondary: '#ef4444', accent: '#fbbf24' },
    sampleEmoji: '💥⚡',
  },
  {
    id: 'mecha-chibi',
    name: 'Dron Táctico Spec-Ops',
    badge: 'MECHA MILITAR',
    icon: '🦾',
    branch: 'illustration',
    tagline: 'Blindaje de titanio y fibra de carbono, visor óptico panorámico y propulsores.',
    description: 'Convierte el objeto en una unidad robótica de combate de élite (estilo Armored Core / Metal Gear), con placas blindadas biseladas, visor de escáner láser y micro-turbinas.',
    palette: { primary: '#00f0ff', secondary: '#0284c7', accent: '#38bdf8' },
    sampleEmoji: '🦾⚡',
  },
  {
    id: 'mystic-relic',
    name: 'Monolito Arcano',
    badge: 'RUNAS ANCESTRALES',
    icon: '🧿',
    branch: 'illustration',
    tagline: 'Piedra de obsidiana ancestral con runas luminosas talladas y núcleo de energía etérea.',
    description: 'Transforma el objeto en un artefacto milenario de poder arcano (estilo Zonai / Elden Ring), con glifos luminiscentes tallados, cristales levitando y aura sobrenatural.',
    palette: { primary: '#a855f7', secondary: '#7e22ce', accent: '#c084fc' },
    sampleEmoji: '🧿🔮',
  },
  {
    id: 'sticker-pop',
    name: 'Streetwear Cyber-Pop',
    badge: 'HYPEBEAST TOKYO',
    icon: '⚡',
    branch: 'illustration',
    tagline: 'Líneas vectoriales de precisión, alto contraste y actitud urbana cyberpunk.',
    description: 'Estilo gráfico de vanguardia con bordes limpios, acentos de color saturados, códigos técnicos y actitud desafiante inspirada en el streetwear de Tokio.',
    palette: { primary: '#10b981', secondary: '#059669', accent: '#f59e0b' },
    sampleEmoji: '⚡🏷️',
  },
  {
    id: 'cyber-pixel',
    name: 'Neo-Arcade 16-Bit',
    badge: 'CYBER-ARCADE',
    icon: '🕹️',
    branch: 'vector',
    tagline: 'Pixel art nítido de estética oscura con contrastes eléctricos de neón.',
    description: 'Sprite retro de alta precisión para videojuegos de combate o sigilo, inspirado en clásicos modernos como Hyper Light Drifter y Dead Cells.',
    palette: { primary: '#10b981', secondary: '#059669', accent: '#6ee7b7' },
    sampleEmoji: '🕹️👾',
  },
  {
    id: 'low-poly',
    name: 'Prisma Poligonal',
    badge: 'ESCULTURA 3D',
    icon: '🔷',
    branch: 'vector',
    tagline: 'Facetas geométricas afiladas simulando cuarzo o diamante con reflejos de luz.',
    description: 'Escultura tridimensional facetada de corte matemático con refracciones de cristal cuántico, sombras angulares y volumen geométrico imponente.',
    palette: { primary: '#f59e0b', secondary: '#d97706', accent: '#fbbf24' },
    sampleEmoji: '🔷💎',
  },
];

