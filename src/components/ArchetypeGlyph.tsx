import { Icon, IconName } from './common/Icon';
import { getArchetypeByName } from '../data/archetypes';

interface ArchetypeGlyphProps {
  archetypeNameOrId?: string;
  className?: string;
  size?: number;
  glow?: boolean;
  bare?: boolean;
}

// Mapeo exhaustivo de arquetipos por ID a glifos vectoriales sagrados/neón
const ARCHETYPE_ICONS: Record<string, { icon: IconName; color: string; bg: string; stroke: string }> = {
  // Espíritu Puro (Inocente)
  inocente: { icon: 'feather', color: '#facc15', bg: 'rgba(250, 204, 21, 0.15)', stroke: '#facc15' },
  // Espíritu Aliado (Huérfano)
  huerfano: { icon: 'users', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)', stroke: '#60a5fa' },
  // Espíritu Heroico (Héroe)
  heroe: { icon: 'shield', color: '#00f0ff', bg: 'rgba(0, 240, 255, 0.15)', stroke: '#00f0ff' },
  // Alma Protectora (Cuidador)
  cuidador: { icon: 'heart', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', stroke: '#34d399' },
  // Espíritu Libre (Explorador)
  explorador: { icon: 'compass', color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)', stroke: '#fb923c' },
  // Fuerza Rebelde (Rebelde)
  rebelde: { icon: 'zap', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', stroke: '#ef4444' },
  // Corazón Apasionado (Amante)
  amante: { icon: 'flame', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', stroke: '#f43f5e' },
  // Mente Creadora (Creador)
  creador: { icon: 'sparkles', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', stroke: '#a855f7' },
  // Espíritu Lúdico (Bufón)
  bufon: { icon: 'smile', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', stroke: '#fbbf24' },
  // Mente Sabia (Sabio)
  sabio: { icon: 'bookOpen', color: '#00f0ff', bg: 'rgba(0, 240, 255, 0.15)', stroke: '#00f0ff' },
  // Mente Alquimista (Mago)
  mago: { icon: 'wand', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', stroke: '#c084fc' },
  // Voz de Liderazgo (Gobernante)
  gobernante: { icon: 'crown', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', stroke: '#eab308' },
};

export const ArchetypeGlyph: React.FC<ArchetypeGlyphProps> = ({
  archetypeNameOrId = 'heroe',
  className = '',
  size = 20,
  glow = true,
  bare = false,
}) => {
  const resolvedArch = getArchetypeByName(archetypeNameOrId);
  const config = ARCHETYPE_ICONS[resolvedArch.id] || {
    icon: 'eye',
    color: '#00f0ff',
    bg: 'rgba(0, 240, 255, 0.15)',
    stroke: '#00f0ff',
  };

  if (bare) {
    return (
      <Icon
        name={config.icon}
        className={`shrink-0 transition-transform duration-300 ${className}`}
        style={{
          width: size,
          height: size,
          color: config.color,
          filter: glow ? `drop-shadow(0 0 8px ${config.color}80)` : undefined,
        }}
      />
    );
  }

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
      <Icon 
        name={config.icon}
        className="shrink-0"
        style={{ 
          width: size,
          height: size,
          color: config.color 
        }} 
      />
    </div>
  );
};

export default ArchetypeGlyph;
