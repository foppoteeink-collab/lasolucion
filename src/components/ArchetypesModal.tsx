import React, { useState, useMemo, useEffect } from 'react';
import { X, Sparkles, Zap, Check, Target, AlertTriangle, LayoutGrid, SlidersHorizontal } from 'lucide-react';
import { JUNG_ARCHETYPES, JungArchetype, getArchetypeByName } from '../data/archetypes';
import { soundFX } from '../utils/audio';
import { triggerShockwave } from '../utils/celebration';
import { MoxenInercia } from './moxen/MoxenInercia';

// Definición cromática de alta fidelidad estética para cada uno de los 12 arquetipos
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
    glow: 'rgba(245, 158, 11, 0.35)',
    border: 'border-amber-500/50',
    bgGradient: 'from-amber-500/20 via-yellow-500/5 to-transparent',
    statPill: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  },
  huerfano: {
    accent: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.35)',
    border: 'border-blue-500/50',
    bgGradient: 'from-blue-500/20 via-indigo-500/5 to-transparent',
    statPill: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
  },
  heroe: {
    accent: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.40)',
    border: 'border-red-500/50',
    bgGradient: 'from-red-500/20 via-rose-500/5 to-transparent',
    statPill: 'bg-red-500/15 text-red-300 border-red-500/40',
  },
  cuidador: {
    accent: '#10b981',
    glow: 'rgba(16, 185, 129, 0.35)',
    border: 'border-emerald-500/50',
    bgGradient: 'from-emerald-500/20 via-teal-500/5 to-transparent',
    statPill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  },
  explorador: {
    accent: '#f97316',
    glow: 'rgba(249, 115, 22, 0.35)',
    border: 'border-orange-500/50',
    bgGradient: 'from-orange-500/20 via-amber-500/5 to-transparent',
    statPill: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
  },
  rebelde: {
    accent: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.40)',
    border: 'border-purple-500/50',
    bgGradient: 'from-purple-500/20 via-indigo-500/5 to-transparent',
    statPill: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
  },
  amante: {
    accent: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.35)',
    border: 'border-rose-500/50',
    bgGradient: 'from-rose-500/20 via-pink-500/5 to-transparent',
    statPill: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
  },
  creador: {
    accent: '#d946ef',
    glow: 'rgba(217, 70, 239, 0.40)',
    border: 'border-fuchsia-500/50',
    bgGradient: 'from-fuchsia-500/20 via-purple-500/5 to-transparent',
    statPill: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40',
  },
  bufon: {
    accent: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.35)',
    border: 'border-cyan-500/50',
    bgGradient: 'from-cyan-500/20 via-teal-500/5 to-transparent',
    statPill: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
  },
  sabio: {
    accent: '#6366f1',
    glow: 'rgba(99, 102, 241, 0.35)',
    border: 'border-indigo-500/50',
    bgGradient: 'from-indigo-500/20 via-violet-500/5 to-transparent',
    statPill: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40',
  },
  mago: {
    accent: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.40)',
    border: 'border-violet-500/50',
    bgGradient: 'from-violet-500/20 via-purple-500/5 to-transparent',
    statPill: 'bg-violet-500/15 text-violet-300 border-violet-500/40',
  },
  gobernante: {
    accent: '#eab308',
    glow: 'rgba(234, 179, 8, 0.35)',
    border: 'border-yellow-500/50',
    bgGradient: 'from-yellow-500/20 via-amber-500/5 to-transparent',
    statPill: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40',
  },
};

interface ArchetypesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentArchetype: string;
  onSelectArchetype: (archetype: JungArchetype) => void;
}

export const ArchetypesModal: React.FC<ArchetypesModalProps> = ({
  isOpen,
  onClose,
  currentArchetype,
  onSelectArchetype,
}) => {
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
  const activeArch = useMemo(() => getArchetypeByName(currentArchetype), [currentArchetype]);

  const initialIndex = useMemo(() => {
    const idx = JUNG_ARCHETYPES.findIndex((a) => a.id === activeArch.id);
    return idx >= 0 ? idx : 0;
  }, [activeArch.id]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[94dvh] sm:max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl bg-[#030712]/95 border border-cyan-500/35 shadow-[0_0_50px_rgba(0,240,255,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] relative overflow-hidden backdrop-blur-2xl text-white text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Micrograno táctil Moxen Vidrio */}
        <span className="vi-grano opacity-5" aria-hidden="true" />

        {/* Luces de ambiente cyberpunk */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

        {/* Header con título y switch de vista */}
        <div className="p-3.5 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#010810]/80 shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)]">
              <Sparkles className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h3 className="font-anton text-cyan-300 uppercase tracking-wide text-sm sm:text-base">
                Los 12 Arquetipos Jungianos & Compañeros KAI
              </h3>
              <p className="text-[11px] text-slate-300 font-mono mt-0.5 hidden sm:block">
                Desliza con inercia para calibrar tu resonancia psicológica en el Sistema
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Carrusel / Rejilla */}
            <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setViewMode('carousel');
                }}
                className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] font-mono font-bold ${
                  viewMode === 'carousel'
                    ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Modo Carrusel Cinético (Moxen Inercia)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Cinético</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setViewMode('grid');
                }}
                className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] font-mono font-bold ${
                  viewMode === 'grid'
                    ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Modo Rejilla Completa"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Rejilla</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido: Carrusel Cinético (Moxen Inercia) o Rejilla Clásica */}
        {viewMode === 'carousel' ? (
          <div className="flex-1 overflow-hidden flex flex-col justify-center py-2 sm:py-4">
            <MoxenInercia
              initialIndex={initialIndex}
              friccion={4}
              goma={0.3}
              iman={true}
              accentColor="#00f0ff"
            >
              {JUNG_ARCHETYPES.map((arch, index) => {
                const isSelected = activeArch.id === arch.id;
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
                    {/* Bisel superior */}
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                    {/* Cabecera de la Tarjeta */}
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

                    {/* Avatar Central con paralaje (.in-forma) */}
                    <div className="relative z-10 flex flex-col items-center justify-center my-auto py-1 text-center">
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

                      <h4 className="font-anton text-base sm:text-lg uppercase tracking-wider text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                        {arch.name}
                      </h4>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300/80 mt-0.5 font-medium flex items-center gap-1">
                        <span>{arch.companion?.icon}</span>
                        <span>{arch.companion?.title}</span>
                      </span>
                    </div>

                    {/* Descripción: 1 frase limpia y humana */}
                    <div className="relative z-10 my-1 px-1">
                      <p className="text-[11px] sm:text-xs text-slate-300/95 leading-relaxed font-sans text-center line-clamp-2 italic">
                        "{arch.description}"
                      </p>
                    </div>

                    {/* Botón de Sintonización */}
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
                          onClick={() => {
                            soundFX.playItemEquip();
                            triggerShockwave({ color: 'violet', intensity: 'medium' });
                            onSelectArchetype(arch);
                            onClose();
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
        ) : (
          /* Modo Rejilla Clásica */
          <div className="p-3 sm:p-5 space-y-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500 scrollbar-track-transparent">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {JUNG_ARCHETYPES.map((arch) => {
                const isSelected = activeArch.id === arch.id;

                return (
                  <div
                    key={arch.id}
                    className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#06182c] to-[#042838] border-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.35)] ring-1 ring-cyan-400'
                        : 'bg-[#030d17]/80 border-cyan-500/30 hover:border-cyan-400 hover:bg-[#041525]'
                    }`}
                  >
                    <div>
                      {/* Top Row: Avatar, Name & Bonus Badge */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-3xl p-1.5 bg-black/50 rounded-xl border border-cyan-500/30 shrink-0">
                            {arch.avatar}
                          </span>
                          <div>
                            <h4 className="font-anton text-sm sm:text-base uppercase tracking-wider text-white">
                              {arch.name}
                            </h4>
                            <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider font-semibold">
                              KAI: {arch.companion?.title} {arch.companion?.icon}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/40 px-2 py-0.5 rounded-lg font-bold shrink-0">
                          {arch.statBonus}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-200 leading-relaxed font-sans bg-black/40 p-2.5 rounded-xl border border-cyan-500/20 mb-3">
                        {arch.description}
                      </p>

                      {/* Desire & Fear */}
                      <div className="space-y-1.5 text-[11px] font-mono mb-3">
                        <div className="flex items-start gap-1.5 text-cyan-300 bg-[#020b14]/60 p-2 rounded-lg border border-cyan-500/20">
                          <Target className="w-3.5 h-3.5 shrink-0 mt-0.5 text-cyan-400" />
                          <span>
                            <strong className="text-white">Deseo: </strong>
                            {arch.desire}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5 text-rose-300 bg-[#020b14]/60 p-2 rounded-lg border border-rose-500/20">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                          <span>
                            <strong className="text-white">Sombra / Miedo: </strong>
                            {arch.fear}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2 border-t border-cyan-500/20 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        Atributo:{' '}
                        <strong className="text-cyan-300 capitalize">{arch.primaryStat}</strong>
                      </span>

                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[11px] font-mono font-black text-cyan-300 bg-cyan-900/60 border border-cyan-400 px-3 py-1 rounded-xl shadow-[0_0_10px_rgba(0,240,255,0.4)]">
                          <Check className="w-3.5 h-3.5 text-cyan-300" />
                          Sintonía Activa
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            soundFX.playItemEquip();
                            triggerShockwave({ color: 'violet', intensity: 'medium' });
                            onSelectArchetype(arch);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-anton uppercase text-[11px] rounded-xl cursor-pointer transition-all shadow-[0_0_10px_rgba(0,240,255,0.3)] active:scale-95 flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3 fill-black" />
                          Activar Arquetipo
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pinned Footer (Ergonomía del Pulgar) */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-[#010810]/90 flex items-center justify-between shrink-0 relative z-10">
          <p className="text-[10px] sm:text-xs text-slate-400 font-mono hidden sm:block">
            Arrastra con impulso táctil o usa las flechas para explorar los 12 arquetipos.
          </p>
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-white/[0.05] hover:bg-white/10 text-slate-300 hover:text-white font-anton uppercase text-xs rounded-xl cursor-pointer transition-all border border-white/15 active:scale-95 ml-auto"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
};
