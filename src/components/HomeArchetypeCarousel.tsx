import React, { useState, useMemo } from 'react';
import { Zap, Check, ChevronDown, ChevronUp, Compass } from 'lucide-react';
import { JUNG_ARCHETYPES, JungArchetype, getArchetypeByName } from '../data/archetypes';
import { soundFX } from '../utils/audio';
import { triggerShockwave } from '../utils/celebration';
import { MoxenInercia } from './moxen/MoxenInercia';

// Definición cromática de alta fidelidad estética (Sin filtros pesados para 120 FPS limpios)
const ARCHETYPE_THEMES: Record<
  string,
  {
    accent: string;
    glow: string;
    border: string;
    bgGradient: string;
    statPill: string;
  }
> = {
  inocente: {
    accent: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.25)',
    border: 'border-amber-500/50',
    bgGradient: 'from-[#1c1404] via-[#0d0a02] to-[#040301]',
    statPill: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  },
  huerfano: {
    accent: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.25)',
    border: 'border-blue-500/50',
    bgGradient: 'from-[#06142c] via-[#030a17] to-[#01040a]',
    statPill: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
  },
  heroe: {
    accent: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.25)',
    border: 'border-red-500/50',
    bgGradient: 'from-[#220707] via-[#120303] to-[#060101]',
    statPill: 'bg-red-500/15 text-red-300 border-red-500/40',
  },
  cuidador: {
    accent: '#10b981',
    glow: 'rgba(16, 185, 129, 0.25)',
    border: 'border-emerald-500/50',
    bgGradient: 'from-[#041d14] via-[#020e0a] to-[#010503]',
    statPill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  },
  explorador: {
    accent: '#f97316',
    glow: 'rgba(249, 115, 22, 0.25)',
    border: 'border-orange-500/50',
    bgGradient: 'from-[#200f04] via-[#110802] to-[#050201]',
    statPill: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
  },
  rebelde: {
    accent: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.25)',
    border: 'border-purple-500/50',
    bgGradient: 'from-[#190628] via-[#0d0315] to-[#040107]',
    statPill: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
  },
  amante: {
    accent: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.25)',
    border: 'border-rose-500/50',
    bgGradient: 'from-[#22060f] via-[#120308] to-[#050103]',
    statPill: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
  },
  creador: {
    accent: '#d946ef',
    glow: 'rgba(217, 70, 239, 0.25)',
    border: 'border-fuchsia-500/50',
    bgGradient: 'from-[#210626] via-[#110314] to-[#050106]',
    statPill: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40',
  },
  bufon: {
    accent: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.25)',
    border: 'border-cyan-500/50',
    bgGradient: 'from-[#041a22] via-[#020e12] to-[#010406]',
    statPill: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
  },
  sabio: {
    accent: '#6366f1',
    glow: 'rgba(99, 102, 241, 0.25)',
    border: 'border-indigo-500/50',
    bgGradient: 'from-[#0b0e27] via-[#050715] to-[#010207]',
    statPill: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40',
  },
  mago: {
    accent: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.25)',
    border: 'border-violet-500/50',
    bgGradient: 'from-[#140828] via-[#0a0415] to-[#030107]',
    statPill: 'bg-violet-500/15 text-violet-300 border-violet-500/40',
  },
  gobernante: {
    accent: '#eab308',
    glow: 'rgba(234, 179, 8, 0.25)',
    border: 'border-yellow-500/50',
    bgGradient: 'from-[#1c1704] via-[#0e0b02] to-[#040301]',
    statPill: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40',
  },
};

interface HomeArchetypeCarouselProps {
  currentArchetype: string;
  onSelectArchetype: (archetype: JungArchetype) => void;
}

export const HomeArchetypeCarousel: React.FC<HomeArchetypeCarouselProps> = ({
  currentArchetype,
  onSelectArchetype,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const activeArchObj = useMemo(() => {
    return getArchetypeByName(currentArchetype);
  }, [currentArchetype]);

  const initialIndex = useMemo(() => {
    const idx = JUNG_ARCHETYPES.findIndex((a) => a.id === activeArchObj.id);
    return idx >= 0 ? idx : 0;
  }, [activeArchObj.id]);

  const activeTheme = ARCHETYPE_THEMES[activeArchObj.id] || ARCHETYPE_THEMES.heroe;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-cyan-500/25 bg-[#030712] p-3 sm:p-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
      {/* Cabecera táctica limpia */}
      <div className="relative z-10 flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.2)] shrink-0">
            <Compass className="w-4 h-4 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-anton text-xs sm:text-sm uppercase tracking-wider text-white">
                Resonancia Arquetípica
              </h3>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-400 font-sans tracking-wide">
              12 Esencias Jungianas · Desliza para explorar y sincronizar tu mente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Chip del arquetipo activo en el sistema */}
          <div
            className="flex items-center gap-1.5 bg-black/80 px-2.5 py-1 rounded-xl border shadow-[0_0_12px_rgba(0,0,0,0.5)]"
            style={{ borderColor: activeTheme.accent }}
          >
            <span className="text-sm select-none">{activeArchObj.avatar}</span>
            <span className="text-[11px] font-anton uppercase text-white tracking-wide">
              {activeArchObj.name}
            </span>
          </div>

          {/* Toggle Plegar / Expandir */}
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setIsExpanded((prev) => !prev);
            }}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-mono"
            title={isExpanded ? 'Plegar carrusel' : 'Expandir carrusel'}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Plegar</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Explorar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Contenido: Carrusel Moxen Inercia con Estética de Coleccionable RPG (120 FPS sin parpadeo) */}
      {isExpanded && (
        <div className="relative z-10 pt-2.5">
          <MoxenInercia
            initialIndex={initialIndex}
            friccion={4}
            goma={0.3}
            iman={true}
            accentColor={activeTheme.accent}
          >
            {JUNG_ARCHETYPES.map((arch, index) => {
              const isSelected = activeArchObj.id === arch.id;
              const cardNum = index + 1 < 10 ? `0${index + 1}` : `${index + 1}`;
              const theme = ARCHETYPE_THEMES[arch.id] || ARCHETYPE_THEMES.heroe;

              return (
                <div
                  key={arch.id}
                  className={`relative w-full h-full p-4 sm:p-5 flex flex-col justify-between overflow-hidden rounded-[24px] border select-none bg-gradient-to-b ${theme.bgGradient} ${
                    isSelected
                      ? 'border-2 shadow-[0_0_25px_rgba(0,240,255,0.2)]'
                      : 'border-white/10'
                  }`}
                  style={{
                    borderColor: isSelected ? theme.accent : undefined,
                  }}
                >
                  {/* Bisel de luz superior limpio */}
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                  {/* ── 1. CABECERA DE LA TARJETA ── */}
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono tracking-widest font-black uppercase text-slate-300 bg-black/70 px-2.5 py-0.5 rounded-lg border border-white/10">
                      #{cardNum}
                    </span>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${theme.statPill}`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: theme.accent }}
                      />
                      {arch.statBonus}
                    </span>
                  </div>

                  {/* ── 2. TALISMÁN CENTRAL CON PARALAJE (.in-forma) ── */}
                  <div className="relative z-10 flex flex-col items-center justify-center my-auto py-1 text-center">
                    {/* Contenedor del Talismán con brillo nítido (sin filtros blur pesados) */}
                    <div
                      className="in-forma relative w-20 h-20 rounded-2xl bg-black/80 border flex items-center justify-center text-4xl mb-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
                      style={{
                        borderColor: `${theme.accent}66`,
                        boxShadow: `0 0 20px ${theme.glow}, inset 0 1px 1px rgba(255,255,255,0.25)`,
                      }}
                    >
                      <span className="relative z-10 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                        {arch.avatar}
                      </span>
                    </div>

                    {/* Nombre del Arquetipo */}
                    <h4 className="font-anton text-base sm:text-lg uppercase tracking-wider text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                      {arch.name}
                    </h4>

                    {/* Compañero KAI */}
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300/80 mt-0.5 font-medium flex items-center gap-1">
                      <span>{arch.companion?.icon}</span>
                      <span>{arch.companion?.title}</span>
                    </span>
                  </div>

                  {/* ── 3. ESENCIA HUMANA (1 SOLA FRASE PUNCHY) ── */}
                  <div className="relative z-10 my-1 px-1">
                    <p className="text-[11px] sm:text-xs text-slate-300/95 leading-relaxed font-sans text-center line-clamp-2 italic">
                      "{arch.description}"
                    </p>
                  </div>

                  {/* ── 4. BOTÓN DE ACCIÓN / SINTONIZACIÓN ── */}
                  <div className="relative z-10 pt-2 border-t border-white/10">
                    {isSelected ? (
                      <div
                        className="w-full py-2 flex items-center justify-center gap-1.5 text-xs font-mono font-bold uppercase rounded-xl border shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                        style={{
                          backgroundColor: `${theme.accent}22`,
                          borderColor: theme.accent,
                          color: theme.accent,
                        }}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Resonancia Activa</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundFX.playItemEquip();
                          triggerShockwave({ color: 'violet', intensity: 'medium' });
                          onSelectArchetype(arch);
                        }}
                        className="w-full py-2 bg-white/10 hover:bg-white/15 active:scale-95 text-white font-anton uppercase text-xs rounded-xl cursor-pointer border border-white/15 hover:border-white/30 flex items-center justify-center gap-1.5 font-bold shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
                        style={{
                          borderColor: `${theme.accent}44`,
                        }}
                      >
                        <Zap className="w-3.5 h-3.5 text-cyan-300" />
                        <span>Sintonizar Arquetipo</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </MoxenInercia>
        </div>
      )}
    </section>
  );
};
