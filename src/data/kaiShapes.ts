import React from 'react';
import { KaiShapeKey, KaiMultiverseStyle, KaiAuraIntensity } from '../types';

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
    description: 'La forma cuántica original con el ojo que todo lo ve. La esencia de tu compañero KAI con la que inicias tu camino.',
    themeTrait: 'Visión & Foco',
    archetypeMatch: 'Espíritu Heroico / Mente Sabia',
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
    name: 'Foppotee Ink Doodle',
    badge: 'GÉNESIS DE LA SOLUCIÓN',
    icon: '🌀',
    branch: 'illustration',
    tagline: 'Tinta psicodélica viva, tótems cósmicos, tramas ópticas y reactores de prisma.',
    description: 'El estilo original del que nació La Solución (Foppotee Ink): el objeto cobra vida con contornos de tinta pura, ojos hipnóticos, cuellos de acordeón, patrones ópticos de ajedrez y un ecosistema de micro-doodles orbitantes.',
    palette: { primary: '#06b6d4', secondary: '#ec4899', accent: '#facc15' },
    sampleEmoji: '🌀✒️',
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

export interface KaiAuraIntensityOption {
  id: KaiAuraIntensity;
  label: string;
  tagline: string;
}

export const KAI_AURA_INTENSITY_OPTIONS: KaiAuraIntensityOption[] = [
  {
    id: 'subtle',
    label: 'Sutil',
    tagline: 'Contraluz discreto y borde fino',
  },
  {
    id: 'normal',
    label: 'Media',
    tagline: 'Balance ideal para toda la app',
  },
  {
    id: 'radiant',
    label: 'Radiante',
    tagline: 'Máximo contraste en figuras oscuras',
  },
];

function hexToRgbTriplet(color: string): string {
  if (!color || typeof color !== 'string') return '0, 240, 255';
  const trimmed = color.trim();
  const shortMatch = trimmed.match(/^#([a-f\d])([a-f\d])([a-f\d])$/i);
  if (shortMatch) {
    const r = parseInt(shortMatch[1] + shortMatch[1], 16);
    const g = parseInt(shortMatch[2] + shortMatch[2], 16);
    const b = parseInt(shortMatch[3] + shortMatch[3], 16);
    return `${r}, ${g}, ${b}`;
  }
  const fullMatch = trimmed.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (fullMatch) {
    const r = parseInt(fullMatch[1], 16);
    const g = parseInt(fullMatch[2], 16);
    const b = parseInt(fullMatch[3], 16);
    return `${r}, ${g}, ${b}`;
  }
  return '0, 240, 255';
}

export interface KaiAuraVisuals {
  backlightSizeRatio: number;
  backlightGradient: string;
  backlightOpacity: number;
  backlightHoverOpacity: number;
  customFilter: string;
  prismFilter: string;
}

/**
 * Calcula los parámetros visuales del sistema combinado (Contraluz radial + Rim Light pegado a la silueta)
 * para garantizar que KAI sea siempre visible sobre fondos oscuros incluso en figuras con tonos negros.
 */
export function getKaiAuraVisuals(
  intensity: KaiAuraIntensity = 'normal',
  activeColor: string = '#00f0ff'
): KaiAuraVisuals {
  const rgb = hexToRgbTriplet(activeColor);

  switch (intensity) {
    case 'subtle':
      return {
        backlightSizeRatio: 1.08,
        backlightGradient: `radial-gradient(circle, rgba(255, 255, 255, 0.14) 0%, rgba(${rgb}, 0.36) 28%, rgba(${rgb}, 0.14) 54%, transparent 74%)`,
        backlightOpacity: 0.65,
        backlightHoverOpacity: 0.88,
        customFilter: `drop-shadow(0 0 1.2px rgba(255, 255, 255, 0.45)) drop-shadow(0 0 4px rgba(${rgb}, 0.55)) drop-shadow(0 0 12px rgba(${rgb}, 0.34))`,
        prismFilter: 'none',
      };

    case 'radiant':
      return {
        backlightSizeRatio: 1.48,
        backlightGradient: `radial-gradient(circle, rgba(255, 255, 255, 0.34) 0%, rgba(${rgb}, 0.68) 26%, rgba(${rgb}, 0.3) 54%, transparent 76%)`,
        backlightOpacity: 0.94,
        backlightHoverOpacity: 1,
        customFilter: `drop-shadow(0 0 2.2px rgba(255, 255, 255, 0.92)) drop-shadow(0 0 7px rgba(${rgb}, 0.95)) drop-shadow(0 0 22px rgba(${rgb}, 0.68))`,
        prismFilter: `drop-shadow(0 0 10px rgba(${rgb}, 0.55))`,
      };

    case 'normal':
    default:
      return {
        backlightSizeRatio: 1.28,
        backlightGradient: `radial-gradient(circle, rgba(255, 255, 255, 0.24) 0%, rgba(${rgb}, 0.52) 26%, rgba(${rgb}, 0.22) 54%, transparent 75%)`,
        backlightOpacity: 0.84,
        backlightHoverOpacity: 0.98,
        customFilter: `drop-shadow(0 0 1.6px rgba(255, 255, 255, 0.72)) drop-shadow(0 0 5px rgba(${rgb}, 0.82)) drop-shadow(0 0 16px rgba(${rgb}, 0.5))`,
        prismFilter: `drop-shadow(0 0 6px rgba(${rgb}, 0.32))`,
      };
  }
}



