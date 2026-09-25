import React from 'react';
import { 
  Shield, 
  Compass, 
  Sparkles, 
  Heart, 
  Zap, 
  Flame, 
  Crown, 
  BookOpen, 
  Wand2, 
  Laugh, 
  Users, 
  Feather,
  Eye,
  LucideIcon
} from 'lucide-react';

interface ArchetypeGlyphProps {
  archetypeNameOrId?: string;
  className?: string;
  size?: number;
  glow?: boolean;
}

// Mapeo exhaustivo de arquetipos y clases a glifos vectoriales sagrados/neón
const ARCHETYPE_ICONS: Record<string, { icon: LucideIcon; color: string; bg: string; stroke: string }> = {
  // El Inocente
  inocente: { icon: Feather, color: '#facc15', bg: 'rgba(250, 204, 21, 0.15)', stroke: '#facc15' },
  'el inocente': { icon: Feather, color: '#facc15', bg: 'rgba(250, 204, 21, 0.15)', stroke: '#facc15' },

  // El Huérfano / Corriente
  huerfano: { icon: Users, color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)', stroke: '#60a5fa' },
  'el hombre corriente': { icon: Users, color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)', stroke: '#60a5fa' },
  'el huérfano': { icon: Users, color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)', stroke: '#60a5fa' },

  // El Héroe
  heroe: { icon: Shield, color: '#00f0ff', bg: 'rgba(0, 240, 255, 0.15)', stroke: '#00f0ff' },
  'el héroe': { icon: Shield, color: '#00f0ff', bg: 'rgba(0, 240, 255, 0.15)', stroke: '#00f0ff' },

  // El Cuidador
  cuidador: { icon: Heart, color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', stroke: '#34d399' },
  'el cuidador': { icon: Heart, color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', stroke: '#34d399' },

  // El Explorador
  explorador: { icon: Compass, color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)', stroke: '#fb923c' },
  'el explorador': { icon: Compass, color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)', stroke: '#fb923c' },

  // El Rebelde / Forajido
  rebelde: { icon: Zap, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', stroke: '#ef4444' },
  'el rebelde': { icon: Zap, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', stroke: '#ef4444' },

  // El Amante
  amante: { icon: Flame, color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', stroke: '#f43f5e' },
  'el amante': { icon: Flame, color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', stroke: '#f43f5e' },

  // El Creador
  creador: { icon: Sparkles, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', stroke: '#a855f7' },
  'el creador': { icon: Sparkles, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', stroke: '#a855f7' },

  // El Bufón
  bufon: { icon: Laugh, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', stroke: '#fbbf24' },
  'el bufón': { icon: Laugh, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', stroke: '#fbbf24' },

  // El Sabio
  sabio: { icon: BookOpen, color: '#00f0ff', bg: 'rgba(0, 240, 255, 0.15)', stroke: '#00f0ff' },
  'el sabio': { icon: BookOpen, color: '#00f0ff', bg: 'rgba(0, 240, 255, 0.15)', stroke: '#00f0ff' },

  // El Mago
  mago: { icon: Wand2, color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', stroke: '#c084fc' },
  'el mago': { icon: Wand2, color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', stroke: '#c084fc' },

  // El Gobernante
  gobernante: { icon: Crown, color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', stroke: '#eab308' },
  'el gobernante': { icon: Crown, color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', stroke: '#eab308' },
};

export const ArchetypeGlyph: React.FC<ArchetypeGlyphProps> = ({
  archetypeNameOrId = 'heroe',
  className = '',
  size = 20,
  glow = true,
}) => {
  const key = archetypeNameOrId.toLowerCase().trim();
  const config = ARCHETYPE_ICONS[key] || {
    icon: Eye,
    color: '#00f0ff',
    bg: 'rgba(0, 240, 255, 0.15)',
    stroke: '#00f0ff',
  };

  const IconComponent = config.icon;

  return (
    <div 
      className={`relative inline-flex items-center justify-center rounded-lg p-1.5 transition-all ${className}`}
      style={{
        background: config.bg,
        border: `1px solid ${config.color}50`,
        boxShadow: glow ? `0 0 12px ${config.color}40, inset 0 0 6px ${config.color}20` : 'none',
      }}
    >
      {/* Vértice cuántico estilo KAI */}
      <div 
        className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full opacity-90"
        style={{ backgroundColor: config.color }}
      />
      <IconComponent 
        size={size} 
        style={{ color: config.color }} 
        className="shrink-0"
      />
    </div>
  );
};

export default ArchetypeGlyph;
