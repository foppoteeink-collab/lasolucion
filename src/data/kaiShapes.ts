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
    id: 'pixar',
    name: 'Animación Pixar 3D',
    badge: 'PELÍCULA ANIMADA',
    icon: '🎬',
    branch: 'illustration',
    tagline: 'Oclusión ambiental, ojos expresivos con catchlights y calidez cinematográfica.',
    description: 'El objeto cobra vida como personaje de película de animación de alto presupuesto (Pixar / DreamWorks), con iluminación 3D suave, ojos grandes expresivos llenos de emoción y volumen de estudio.',
    palette: { primary: '#f97316', secondary: '#fbbf24', accent: '#3b82f6' },
    sampleEmoji: '🎬✨',
  },
  {
    id: 'cartoon',
    name: 'Cartoon Network Clásico',
    badge: 'AÑOS 90 / 2000',
    icon: '📺',
    branch: 'illustration',
    tagline: 'Líneas negras gruesas, formas geométricas exageradas y colores planos saturados.',
    description: 'Diseño de caricatura clásico estilo Cartoon Network (Dexter, Samurai Jack, Hora de Aventura): contornos muy marcados, expresiones exageradas y sombras de corte limpio sin degradados.',
    palette: { primary: '#ef4444', secondary: '#facc15', accent: '#22c55e' },
    sampleEmoji: '📺💥',
  },
  {
    id: 'anime',
    name: 'Anime Shonen Japonés',
    badge: 'CRIATURA COMPAÑERA',
    icon: '⚔️',
    branch: 'illustration',
    tagline: 'Cel-shading japonés, ojos de anime detallados con iris y destellos de reflejos.',
    description: 'El objeto se transforma en una criatura compañera de anime japonés (estilo Pokémon, Digimon, Dragon Ball), con ojos de anime auténticos, mechones afilados y sombreado cel-shading de dos tonos.',
    palette: { primary: '#6366f1', secondary: '#3b82f6', accent: '#a855f7' },
    sampleEmoji: '⚔️🔥',
  },
  {
    id: 'pop',
    name: 'Pop Art / Vinyl Toy',
    badge: 'EDICIÓN LIMITADA',
    icon: '🎨',
    branch: 'illustration',
    tagline: 'Silueta de coleccionable de vinilo, colores primarios saturados y acabado brillante.',
    description: 'Estilo juguete de vinilo coleccionable Pop Art (Funko Pop, Superplastic, Andy Warhol). Cabeza característica, ojos icónicos de botón brillante y paleta de colores vivos de edición limitada.',
    palette: { primary: '#ec4899', secondary: '#f97316', accent: '#06b6d4' },
    sampleEmoji: '🎨⚡',
  },
  {
    id: 'doodle',
    name: 'Doodle Art a Mano',
    badge: 'BOCETO POSCA',
    icon: '✏️',
    branch: 'illustration',
    tagline: 'Trazo de pluma negra orgánica, cross-hatching y color selectivo de marcador.',
    description: 'El objeto se convierte en un boceto dibujado a mano con pluma o marcador (estilo Mr. Doodle, Keith Haring). Líneas espontáneas, tramado de sombras artesanal y toques de color de marcador Posca.',
    palette: { primary: '#0f172a', secondary: '#f59e0b', accent: '#10b981' },
    sampleEmoji: '✏️🖊️',
  },
  {
    id: 'clay3d',
    name: 'Claymation 3D',
    badge: 'PLASTILINA ARTESANAL',
    icon: '🏺',
    branch: 'illustration',
    tagline: 'Textura de plastilina modelada a mano, bordes suaves y brillo satinado mate.',
    description: 'Inspirado en Wallace & Gromit / Aardman Studios. El objeto adquiere la textura táctil de arcilla modelada a mano, con bordes orgánicos redondeados, sombras suaves de modelado y ojos tipo bolita de masa.',
    palette: { primary: '#f97316', secondary: '#84cc16', accent: '#a78bfa' },
    sampleEmoji: '🏺🎭',
  },
];


