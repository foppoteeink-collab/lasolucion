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
    name: '3D Vinyl / Pixar',
    badge: 'ILUSTRACIÓN 3D',
    icon: '🧸',
    branch: 'illustration',
    tagline: 'Figura coleccionable 3D con volumen suave, luces de estudio y acabado vinilo.',
    description: 'Genera una ilustración 3D hipercarismática del objeto con iluminación suave, expresión viva y fondo transparente.',
    palette: { primary: '#ec4899', secondary: '#8b5cf6', accent: '#f43f5e' },
    sampleEmoji: '🧸✨',
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
    id: 'mecha-chibi',
    name: 'Mecha Chibi / Bot',
    badge: 'CYBER TÁCTICO',
    icon: '🤖',
    branch: 'illustration',
    tagline: 'Armadura robótica compacta, visor cibernético brillante y paneles mecha.',
    description: 'Convierte el objeto en un robot compañero de combate táctico, con visores HUD, placas protectoras y propulsores de plasma.',
    palette: { primary: '#00f0ff', secondary: '#0284c7', accent: '#38bdf8' },
    sampleEmoji: '🤖⚡',
  },
  {
    id: 'mystic-relic',
    name: 'Reliquia Mística',
    badge: 'RUNAS OSCURAS',
    icon: '🔮',
    branch: 'illustration',
    tagline: 'Cuerpo de obsidiana y piedra arcana con grietas luminosas y runas mágicas.',
    description: 'Transforma el objeto en un artefacto mágico ancestral con símbolos rúnicos brillantes, ojo etéreo y aura sobrenatural.',
    palette: { primary: '#a855f7', secondary: '#7e22ce', accent: '#c084fc' },
    sampleEmoji: '🔮🧿',
  },
  {
    id: 'sticker-pop',
    name: 'Sticker Pop Vinilo',
    badge: 'CALCOMANÍA URBANA',
    icon: '🏷️',
    branch: 'illustration',
    tagline: 'Contorno blanco troquelado grueso, colores ultra saturados y brillo vinílico.',
    description: 'Estilo pegatina urbana coleccionable con borde blanco die-cut, sombreado plano de alto contraste y brillos de alta gama.',
    palette: { primary: '#10b981', secondary: '#059669', accent: '#f59e0b' },
    sampleEmoji: '🏷️⭐',
  },
  {
    id: 'cyber-pixel',
    name: 'Pixel Art 16-Bit',
    badge: 'ARCADE RETRO',
    icon: '👾',
    branch: 'vector',
    tagline: 'Sprites de píxeles nítidos con ojos brillantes estilo RPG clásico de 16 bits.',
    description: 'Genera bloques y cuadrícula de píxeles nítidos simulando un sprite de videojuego RPG retro de Super Nintendo.',
    palette: { primary: '#10b981', secondary: '#059669', accent: '#6ee7b7' },
    sampleEmoji: '🕹️👾',
  },
  {
    id: 'low-poly',
    name: 'Low Poly 3D',
    badge: 'FACETADO CRISTAL',
    icon: '💎',
    branch: 'vector',
    tagline: 'Polígonos facetados con sombras angulares simulando cristal 3D.',
    description: 'Polígonos cerrados facetados con sombras de volumen tridimensional estilo escultura poligonal.',
    palette: { primary: '#f59e0b', secondary: '#d97706', accent: '#fbbf24' },
    sampleEmoji: '💎🔮',
  },
];

