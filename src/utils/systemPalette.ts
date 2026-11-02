import { useMemo } from 'react';
import { useUIStore, OpticMode, SystemAuraData, deriveSystemAuraPalette } from '../store/useUIStore';

export interface SystemPalette {
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  glow: string;
  glowSecondary: string;
  textColor: string;
  gradient: string;
}

/**
 * Derivación matemática unificada de los 4 colores y resplandores del Sistema
 * Sincronizada en tiempo real con «Apariencia & Visión» de Ajustes (MoxenMalla / OpticMode / SystemAura).
 */
export function getSystemPalette(
  opticMode?: OpticMode | null,
  systemAura?: SystemAuraData | null
): SystemPalette {
  // 1. Modo Noir Oscuro (Manga B&W Monocromático)
  if (opticMode === 'noir') {
    const c1 = '#ffffff';
    const c2 = '#cbd5e1';
    const c3 = '#94a3b8';
    const c4 = '#64748b';
    return {
      c1, c2, c3, c4,
      glow: 'rgba(255, 255, 255, 0.4)',
      glowSecondary: 'rgba(148, 163, 184, 0.25)',
      textColor: 'text-slate-200',
      gradient: `linear-gradient(135deg, ${c1} 0%, ${c2} 25%, ${c3} 50%, ${c4} 75%, ${c1} 100%)`,
    };
  }

  // 2. Modo Cobalto Azul (Enfoque & Determinación)
  if (opticMode === 'cobalt') {
    const c1 = '#60a5fa';
    const c2 = '#38bdf8';
    const c3 = '#1d4ed8';
    const c4 = '#0284c7';
    return {
      c1, c2, c3, c4,
      glow: 'rgba(96, 165, 250, 0.45)',
      glowSecondary: 'rgba(29, 78, 216, 0.35)',
      textColor: 'text-blue-300',
      gradient: `linear-gradient(135deg, ${c1} 0%, ${c2} 25%, ${c3} 50%, ${c4} 75%, ${c1} 100%)`,
    };
  }

  // 3. Modo Noir Claro (Tinta E-Ink)
  if (opticMode === 'eink') {
    const c1 = '#f8fafc';
    const c2 = '#e2e8f0';
    const c3 = '#94a3b8';
    const c4 = '#475569';
    return {
      c1, c2, c3, c4,
      glow: 'rgba(200, 200, 200, 0.25)',
      glowSecondary: 'rgba(100, 116, 139, 0.2)',
      textColor: 'text-slate-300',
      gradient: `linear-gradient(135deg, ${c1} 0%, ${c2} 25%, ${c3} 50%, ${c4} 75%, ${c1} 100%)`,
    };
  }

  // 4. Paleta personalizada de Atmósfera / Moxen Malla guardada en Ajustes (2, 3 o 4 colores)
  if (systemAura?.colors && systemAura.colors.length >= 2) {
    const { c1, c2, c3, c4, uiAccent1, uiAccent2 } = deriveSystemAuraPalette(systemAura.colors);

    return {
      c1, c2, c3, c4,
      glow: `color-mix(in srgb, ${uiAccent1} 60%, transparent)`,
      glowSecondary: `color-mix(in srgb, ${uiAccent2} 50%, transparent)`,
      textColor: 'text-cyan-300',
      gradient: `linear-gradient(135deg, ${c1} 0%, ${c2} 25%, ${c3} 50%, ${c4} 75%, ${c1} 100%)`,
    };
  }

  // 5. Paleta Oficial de Malla Aurora Boreal (Verde Ártico, Cian Neón, Púrpura Monarca y Plasma Magenta)
  const c1 = '#00ffaa'; // Verde Ártico
  const c2 = '#00d0ff'; // Cian Neón
  const c3 = '#7000ff'; // Púrpura Monarca
  const c4 = '#ff00aa'; // Plasma Magenta

  return {
    c1, c2, c3, c4,
    glow: 'rgba(0, 240, 255, 0.45)', // Resplandor Cian Neón
    glowSecondary: 'rgba(112, 0, 255, 0.35)', // Resplandor Púrpura
    textColor: 'text-cyan-300',
    gradient: `linear-gradient(135deg, ${c1} 0%, ${c2} 25%, ${c3} 50%, ${c4} 75%, ${c1} 100%)`,
  };
}

/**
 * Hook reactivo para componentes que consumen la paleta activa del Sistema
 */
export function useSystemPalette(): SystemPalette {
  const opticMode = useUIStore((s) => s.opticMode);
  const systemAura = useUIStore((s) => s.systemAura);

  return useMemo(() => {
    return getSystemPalette(opticMode, systemAura);
  }, [opticMode, systemAura]);
}
