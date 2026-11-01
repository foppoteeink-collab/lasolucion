import React, { useMemo, useEffect } from 'react';
import { X, Sparkles, Zap, Check, Target, AlertTriangle } from 'lucide-react';
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
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido: Carrusel Cinético (Moxen Inercia) con Ficha Holográfica de Élite */}
        <div className="flex-1 overflow-hidden flex flex-col justify-center py-2 sm:py-3 min-h-0">
          <MoxenInercia
            initialIndex={initialIndex}
            friccion={4}
            goma={0.3}
            iman={true}
            loop={true}
            accentColor="#00f0ff"
          >
            {JUNG_ARCHETYPES.map((arch, index) => {
              const isSelected = activeArch.id === arch.id;
              const cardNum = index + 1 < 10 ? `0${index + 1}` : `${index + 1}`;
              const theme = ARCHETYPE_THEMES[arch.id] || ARCHETYPE_THEMES.heroe;

              return (
                <div
                  key={arch.id}
                  className={`relative w-full h-full p-4 sm:p-5 flex flex-col justify-between overflow-hidden rounded-[26px] border select-none transition-all duration-300 ${
                    isSelected
                      ? 'border-2 shadow-[0_0_35px_rgba(0,0,0,0.8)]'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  style={{
                    borderColor: isSelected ? theme.accent : undefined,
                    background: `linear-gradient(180deg, rgba(3,7,18,0.92) 0%, rgba(10,15,29,0.95) 100%), ${theme.bgGradient}`,
                    boxShadow: isSelected
                      ? `0 0 30px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.2)`
                      : 'inset 0 1px 0 rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Aura lumínica adaptativa de fondo según el color del arquetipo */}
                  <div
                    className="absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-25"
                    style={{ backgroundColor: theme.accent }}
                  />
                  <div
                    className="absolute -bottom-16 -left-16 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-20"
                    style={{ backgroundColor: theme.accent }}
                  />

                  {/* Bisel superior especular */}
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

                  {/* 1. Header de Telemetría: Número de Arquetipo + Chip de Bonificación */}
                  <div className="relative z-10 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-lg border border-white/10">
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ backgroundColor: theme.accent }}
                      />
                      <span className="text-[10px] font-mono tracking-widest font-black uppercase text-slate-300">
                        #{cardNum}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold border flex items-center gap-1.5 backdrop-blur-md ${theme.statPill}`}
                    >
                      <Sparkles className="w-3 h-3" style={{ color: theme.accent }} />
                      {arch.statBonus}
                    </span>
                  </div>

                  {/* 2. Hero de Identidad: Avatar Resonante + Nombre + Sinergia KAI */}
                  <div className="relative z-10 flex items-center gap-3.5 my-1.5 p-3 rounded-2xl bg-black/35 border border-white/10 backdrop-blur-md shrink-0">
                    <div
                      className="in-forma w-14 h-14 rounded-2xl bg-gradient-to-b from-black/90 to-slate-950 border flex items-center justify-center text-3xl shrink-0 transition-transform"
                      style={{
                        borderColor: `${theme.accent}88`,
                        boxShadow: `0 0 20px ${theme.glow}, inset 0 1px 2px rgba(255,255,255,0.35)`,
                      }}
                    >
                      <span className="relative z-10 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                        {arch.avatar}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-anton text-base sm:text-lg uppercase tracking-wider text-white truncate drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                        {arch.name}
                      </h4>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span
                          className="text-[9.5px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md font-semibold border flex items-center gap-1"
                          style={{
                            backgroundColor: `${theme.accent}15`,
                            borderColor: `${theme.accent}40`,
                            color: theme.accent,
                          }}
                        >
                          <span>KAI: {arch.companion?.title}</span>
                          <span>{arch.companion?.icon}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Manifiesto / Descripción Psicológica (Glassmorphism Continuo) */}
                  <div className="relative z-10 p-3 rounded-xl bg-black/30 border border-white/5 my-1 backdrop-blur-sm">
                    <p className="text-[11px] sm:text-[11.5px] text-slate-200/90 leading-relaxed font-sans italic">
                      &ldquo;{arch.description}&rdquo;
                    </p>
                  </div>

                  {/* 4. Vectores Tácticos de Resonancia (Deseo & Sombra sin cajas toscas) */}
                  <div className="relative z-10 space-y-1.5 my-1 text-[10px] sm:text-[11px] font-mono">
                    {/* Impulso Primario (Deseo) */}
                    <div
                      className="p-2 rounded-xl border flex items-start gap-2 backdrop-blur-sm"
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.35)',
                        borderColor: `${theme.accent}33`,
                      }}
                    >
                      <Target
                        className="w-3.5 h-3.5 shrink-0 mt-0.5"
                        style={{ color: theme.accent }}
                      />
                      <div className="leading-tight">
                        <span
                          className="font-black text-[9px] uppercase tracking-wider block mb-0.5"
                          style={{ color: theme.accent }}
                        >
                          Impulso Primario · Deseo
                        </span>
                        <span className="text-slate-200 font-medium">{arch.desire}</span>
                      </div>
                    </div>

                    {/* Punto Ciego (Sombra / Miedo) */}
                    <div className="p-2 rounded-xl bg-black/35 border border-rose-500/20 flex items-start gap-2 backdrop-blur-sm">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                      <div className="leading-tight">
                        <span className="font-black text-[9px] uppercase tracking-wider text-rose-400 block mb-0.5">
                          Punto Ciego · Sombra / Miedo
                        </span>
                        <span className="text-slate-300 font-medium">{arch.fear}</span>
                      </div>
                    </div>
                  </div>

                  {/* 5. Footer: Atributo + Botón de Activación Holográfico */}
                  <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase">
                      <span>Atributo:</span>
                      <strong
                        className="font-bold px-2 py-0.5 rounded-md border text-[10px] capitalize"
                        style={{
                          backgroundColor: `${theme.accent}15`,
                          borderColor: `${theme.accent}30`,
                          color: theme.accent,
                        }}
                      >
                        {arch.primaryStat}
                      </strong>
                    </div>

                    {isSelected ? (
                      <span
                        className="py-2 px-3.5 flex items-center justify-center gap-1.5 text-[11px] font-mono font-bold uppercase rounded-xl border shadow-[0_0_15px_rgba(0,0,0,0.6)]"
                        style={{
                          backgroundColor: `${theme.accent}20`,
                          borderColor: theme.accent,
                          color: theme.accent,
                          boxShadow: `0 0 16px ${theme.glow}`,
                        }}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Resonancia Activa</span>
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
                        className="py-2 px-4 font-anton uppercase text-[11.5px] rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 font-bold tracking-wide"
                        style={{
                          background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}cc)`,
                          color: '#030712',
                          boxShadow: `0 0 18px ${theme.glow}`,
                          border: `1px solid ${theme.accent}`,
                        }}
                      >
                        <Zap className="w-3.5 h-3.5 fill-black stroke-black" />
                        <span>Sincronizar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </MoxenInercia>
        </div>

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
