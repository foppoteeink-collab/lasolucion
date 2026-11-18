import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Check, Zap } from 'lucide-react';
import { JUNG_ARCHETYPES, JungArchetype, getArchetypeByName } from '../data/archetypes';
import { soundFX } from '../utils/audio';
import { triggerShockwave } from '../utils/celebration';
import { triggerHaptic } from '../utils/haptics';
import { usePlayerStore } from '../store/usePlayerStore';
import { spawnJuiceParticle } from './FloatingJuiceOverlay';
import { MoxenInercia } from './moxen/MoxenInercia';

// Definición cromática de alta fidelidad estética para cada uno de los 12 arquetipos
const ARCHETYPE_THEMES: Record<
  string,
  {
    accent: string;
    glow: string;
    statPill: string;
    bgGradient: string;
  }
> = {
  inocente: {
    accent: '#facc15', // Ámbar dorado celestial
    glow: 'rgba(250, 204, 21, 0.35)',
    statPill: 'bg-amber-950/70 border-amber-400/60 text-amber-300',
    bgGradient: 'radial-gradient(ellipse at 50% -20%, rgba(250,204,21,0.22) 0%, transparent 70%)',
  },
  huerfano: {
    accent: '#38bdf8', // Celeste cian gélido
    glow: 'rgba(56, 189, 248, 0.35)',
    statPill: 'bg-sky-950/70 border-sky-400/60 text-sky-300',
    bgGradient: 'radial-gradient(ellipse at 50% -20%, rgba(56,189,248,0.22) 0%, transparent 70%)',
  },
  heroe: {
    accent: '#f43f5e', // Carmesí / Rubí de Furia
    glow: 'rgba(244, 63, 94, 0.4)',
    statPill: 'bg-rose-950/70 border-rose-500/60 text-rose-300',
    bgGradient: 'radial-gradient(ellipse at 50% -20%, rgba(244,63,94,0.25) 0%, transparent 70%)',
  },
  cuidador: {
    accent: '#34d399', // Esmeralda bio-médico
    glow: 'rgba(52, 211, 153, 0.35)',
    statPill: 'bg-emerald-950/70 border-emerald-400/60 text-emerald-300',
    bgGradient: 'radial-gradient(ellipse at 50% -20%, rgba(52,211,153,0.22) 0%, transparent 70%)',
  },
  explorador: {
    accent: '#22d3ee', // Cian topacio cuántico
    glow: 'rgba(34, 211, 238, 0.35)',
    statPill: 'bg-cyan-950/70 border-cyan-400/60 text-cyan-300',
    bgGradient: 'radial-gradient(ellipse at 50% -20%, rgba(34,211,238,0.22) 0%, transparent 70%)',
  },
  rebelde: {
    accent: '#fb923c', // Naranja magma volcánico
    glow: 'rgba(251, 146, 60, 0.4)',
    statPill: 'bg-orange-950/70 border-orange-400/60 text-orange-300',
    bgGradient: 'radial-gradient(ellipse at 50% -20%, rgba(251,146,60,0.25) 0%, transparent 70%)',
  },
  amante: {
    accent: '#ec4899', // Rosa neón pasión
    glow: 'rgba(236, 72, 153, 0.35)',
    statPill: 'bg-pink-950/70 border-pink-400/60 text-pink-300',
    bgGradient: 'radial-gradient(ellipse at 50% -20%, rgba(236,72,153,0.22) 0%, transparent 70%)',
  },
  creador: {
    accent: '#a855f7', // Amatista alquimia
    glow: 'rgba(168, 85, 247, 0.38)',
    statPill: 'bg-purple-950/70 border-purple-400/60 text-purple-300',
    bgGradient: 'radial-gradient(ellipse at 50% -20%, rgba(168,85,247,0.25) 0%, transparent 70%)',
  },
  bufon: {
    accent: '#facc15', // Lima / Sol chispeante
    glow: 'rgba(250, 204, 21, 0.35)',
    statPill: 'bg-yellow-950/70 border-yellow-400/60 text-yellow-300',
    bgGradient: 'radial-gradient(ellipse at 50% -20%, rgba(250,204,21,0.22) 0%, transparent 70%)',
  },
  sabio: {
    accent: '#818cf8', // Índigo etéreo arcano
    glow: 'rgba(129, 140, 248, 0.35)',
    statPill: 'bg-indigo-950/70 border-indigo-400/60 text-indigo-300',
    bgGradient: 'radial-gradient(ellipse at 50% -20%, rgba(129,140,248,0.22) 0%, transparent 70%)',
  },
  mago: {
    accent: '#c084fc', // Violeta cuántico trascendente
    glow: 'rgba(192, 132, 252, 0.4)',
    statPill: 'bg-purple-950/70 border-purple-400/60 text-purple-300',
    bgGradient: 'radial-gradient(ellipse at 50% -20%, rgba(192,132,252,0.25) 0%, transparent 70%)',
  },
  gobernante: {
    accent: '#fbbf24', // Oro imperial soberano
    glow: 'rgba(251, 191, 36, 0.45)',
    statPill: 'bg-amber-950/70 border-amber-400/60 text-amber-300',
    bgGradient: 'radial-gradient(ellipse at 50% -20%, rgba(251,191,36,0.28) 0%, transparent 70%)',
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

  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(initialIndex);

  useEffect(() => {
    setCurrentSlideIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open-hide-floating');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.classList.remove('modal-open-hide-floating');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleActivate = (arch: JungArchetype) => {
    soundFX.playItemEquip();
    triggerHaptic([40, 60, 80]);
    triggerShockwave({ color: 'violet', intensity: 'medium' });
    try {
      usePlayerStore.getState().setStats((prev) => ({
        ...prev,
        characterClass: arch.name,
      }));
    } catch (err) {
      console.error('Error actualizando stats de arquetipo:', err);
    }
    try {
      spawnJuiceParticle({
        x: typeof window !== 'undefined' ? window.innerWidth / 2 : 200,
        y: typeof window !== 'undefined' ? window.innerHeight / 2 : 200,
        text: `⚡ ARQUETIPO SINTONIZADO: ${arch.name.toUpperCase()}`,
        type: 'custom',
        isCrit: true,
        colorClass: 'aura-text-soft bg-[#040a1a]/95 aura-border-primary aura-glow',
      });
    } catch (_) {}
    onSelectArchetype(arch);
    onClose();
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const currentSlideArch = JUNG_ARCHETYPES[currentSlideIndex] || activeArch;
  const isCurrentSlideActive = currentSlideArch.id === activeArch.id;
  const currentSlideTheme = ARCHETYPE_THEMES[currentSlideArch.id] || ARCHETYPE_THEMES.heroe;

  return createPortal(
    <div
      className="fixed inset-0 z-[170] portal-modal-root bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in font-sans select-none pointer-events-auto"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="archetypes-modal-title"
        className="relative isolate w-full max-w-xl md:max-w-2xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col rounded-2xl sm:rounded-3xl bg-[#030712]/[0.98] border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.75)] overflow-hidden text-white text-left m-auto shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Micrograno táctil Moxen Vidrio + Filamento superior Aura */}
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

        {/* Header compacto con título y botón de cierre */}
        <div className="px-3.5 py-2.5 sm:px-5 sm:py-3 border-b border-white/10 flex items-center justify-between bg-[#040814]/[0.96] shrink-0 relative z-10">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl aura-bg-soft border aura-border-subtle flex items-center justify-center aura-glow-subtle shrink-0">
              <Sparkles className="w-4 h-4 aura-text-primary" />
            </div>
            <div className="min-w-0">
              <h3 id="archetypes-modal-title" className="font-anton aura-text-soft uppercase tracking-wider text-xs sm:text-sm truncate">
                Los 12 Arquetipos Jungianos & KAI
              </h3>
              <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                Navegación cíclica continua · Calibra tu resonancia psíquica
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar modal de arquetipos"
              className="chicle-btn w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              title="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenido: Carrusel Cinético (Moxen Inercia) con Ficha Holográfica de Élite */}
        <div className="flex-1 overflow-hidden flex flex-col justify-center py-1 min-h-0 relative z-10">
          <MoxenInercia
            initialIndex={initialIndex}
            friccion={4}
            goma={0.3}
            iman={true}
            loop={true}
            accentColor={currentSlideTheme.accent}
            onIndexChange={(idx) => {
              if (idx !== currentSlideIndex) {
                triggerHaptic(15);
                setCurrentSlideIndex(idx);
              }
            }}
          >
            {JUNG_ARCHETYPES.map((arch, index) => {
              const isSelected = activeArch.id === arch.id;
              const cardNum = index + 1 < 10 ? `0${index + 1}` : `${index + 1}`;
              const theme = ARCHETYPE_THEMES[arch.id] || ARCHETYPE_THEMES.heroe;

              return (
                <div
                  key={arch.id}
                  className={`relative w-full h-full p-2.5 sm:p-3.5 flex flex-col justify-between overflow-hidden rounded-[16px] sm:rounded-[18px] border select-none transition-all duration-300 ${
                    isSelected
                      ? 'border-2 optic-active-card'
                      : 'border-white/15'
                  }`}
                  style={{
                    borderColor: theme.accent,
                    background: `linear-gradient(180deg, rgba(3,7,18,0.95) 0%, rgba(10,15,29,0.98) 100%), ${theme.bgGradient}`,
                    boxShadow: `0 0 24px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.18)`,
                  }}
                >
                  {/* Aura lumínica adaptativa de fondo según el color del arquetipo */}
                  <div
                    data-ambient-glow="true"
                    className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-25"
                    style={{ backgroundColor: theme.accent }}
                  />
                  <div
                    data-ambient-glow="true"
                    className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-20"
                    style={{ backgroundColor: theme.accent }}
                  />

                  {/* Bisel superior especular */}
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

                  {/* 1. Header de Telemetría: Número de Arquetipo + Chip de Bonificación */}
                  <div className="relative z-10 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 font-mono tabular-nums text-[9.5px] sm:text-[10px] font-bold tracking-widest text-slate-300">
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse shadow-sm"
                        style={{
                          backgroundColor: theme.accent,
                          boxShadow: `0 0 8px ${theme.accent}`,
                        }}
                      />
                      <span>ARQUETIPO #{cardNum}</span>
                    </div>

                    <span
                      className={`text-[9px] sm:text-[9.5px] font-mono tabular-nums px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${theme.statPill}`}
                    >
                      <Sparkles className="w-2.5 h-2.5" style={{ color: theme.accent }} />
                      {arch.statBonus}
                    </span>
                  </div>

                  {/* 2. Hero de Identidad */}
                  <div className="relative z-10 flex items-center gap-2.5 my-1 shrink-0">
                    {/* Medallón Elemental Flotante */}
                    <div
                      data-preserve-optic="true"
                      className="in-forma w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-xl sm:text-2xl shrink-0 transition-transform"
                      style={{
                        background: `radial-gradient(circle, ${theme.accent}33 0%, rgba(3,7,18,0.85) 80%)`,
                        border: `1.5px solid ${theme.accent}aa`,
                        boxShadow: `0 0 16px ${theme.glow}, inset 0 1px 2px rgba(255,255,255,0.3)`,
                      }}
                    >
                      <span className="relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                        {arch.avatar}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-anton text-sm sm:text-base uppercase tracking-wider text-white truncate drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                        {arch.name}
                      </h4>
                      <p
                        className="text-[9.5px] sm:text-[10px] font-mono font-medium flex items-center gap-1 mt-0.5 truncate"
                        style={{ color: theme.accent }}
                      >
                        <span className="opacity-75 text-slate-400">KAI:</span>
                        <span className="font-bold">{arch.companion?.title}</span>
                        <span>{arch.companion?.icon}</span>
                      </p>
                    </div>
                  </div>

                  {/* 3. Manifiesto Psicológico (Estilo códice abierto con barra lateral) */}
                  <div
                    className="relative z-10 my-0.5 pl-2.5 border-l-2 py-0.5 shrink-0"
                    style={{ borderColor: `${theme.accent}aa` }}
                  >
                    <p className="text-[10px] sm:text-[10.5px] text-slate-200/90 leading-tight font-sans italic line-clamp-2">
                      &ldquo;{arch.description}&rdquo;
                    </p>
                  </div>

                  {/* 4. Vectores Tácticos (Deseo & Sombra compactos) */}
                  <div className="relative z-10 space-y-1 my-0.5 py-1 border-t border-b border-white/10 text-[9.5px] sm:text-[10px] font-mono">
                    {/* Impulso Primario (Deseo) */}
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="font-black text-[8px] sm:text-[8.5px] uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                        style={{
                          backgroundColor: `${theme.accent}25`,
                          color: theme.accent,
                        }}
                      >
                        DESEO
                      </span>
                      <span className="text-slate-200 truncate">{arch.desire}</span>
                    </div>

                    {/* Punto Ciego (Sombra / Miedo) */}
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-black text-[8px] sm:text-[8.5px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 shrink-0">
                        SOMBRA
                      </span>
                      <span className="text-slate-300 truncate">{arch.fear}</span>
                    </div>
                  </div>

                  {/* 5. Footer de la tarjeta: Atributo + Botón de Activación Holográfico */}
                  <div className="relative z-10 pt-1 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-1 text-[9.5px] font-mono text-slate-400 uppercase tracking-wide">
                      <span>Atributo:</span>
                      <span
                        className="font-bold capitalize"
                        style={{ color: theme.accent }}
                      >
                        {arch.primaryStat}
                      </span>
                    </div>

                    {isSelected ? (
                      <span
                        className="py-1 px-2.5 flex items-center justify-center gap-1 text-[9.5px] font-mono font-bold uppercase rounded-lg border optic-active-card"
                        style={{
                          backgroundColor: `${theme.accent}20`,
                          borderColor: theme.accent,
                          color: theme.accent,
                          boxShadow: `0 0 12px ${theme.glow}`,
                        }}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Resonancia Activa</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        data-interactive="true"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActivate(arch);
                        }}
                        className="chicle-btn optic-active-card py-1 px-3 font-anton uppercase text-[10px] sm:text-[10.5px] rounded-lg cursor-pointer flex items-center gap-1 tracking-wider"
                        style={{
                          background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}cc)`,
                          color: '#030712',
                          boxShadow: `0 0 16px ${theme.glow}`,
                          border: `1px solid ${theme.accent}`,
                        }}
                      >
                        <Zap className="w-3 h-3 fill-black stroke-black" />
                        <span>Activar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </MoxenInercia>
        </div>

        {/* Pinned Footer Ergonómico (Doble acción: Activar arquetipo centrado + Volver) */}
        <div className="py-2.5 px-3 sm:px-4 border-t border-white/10 bg-[#040814]/[0.96] flex items-center justify-between gap-2 shrink-0 relative z-10">
          {/* Botón de activación directa del arquetipo que está a la vista */}
          {isCurrentSlideActive ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl aura-bg-soft border aura-border-subtle optic-active-card font-mono text-xs font-bold">
              <Check className="w-3.5 h-3.5 aura-text-primary stroke-[3]" />
              <span>Arquetipo Activo: <strong className="text-white font-anton uppercase tracking-wider">{currentSlideArch.name}</strong></span>
            </div>
          ) : (
            <button
              type="button"
              data-interactive="true"
              onClick={() => handleActivate(currentSlideArch)}
              aria-label={`Activar arquetipo ${currentSlideArch.name}`}
              className="chicle-btn optic-active-card px-3.5 py-1.5 rounded-xl font-anton uppercase tracking-wider text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              style={{
                background: `linear-gradient(135deg, ${currentSlideTheme.accent}, ${currentSlideTheme.accent}cc)`,
                color: '#030712',
                boxShadow: `0 0 16px ${currentSlideTheme.glow}`,
                border: `1px solid ${currentSlideTheme.accent}`,
              }}
            >
              <Zap className="w-3.5 h-3.5 fill-black stroke-black" />
              <span>Activar {currentSlideArch.name}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            aria-label="Volver y cerrar modal de arquetipos"
            className="chicle-btn px-3.5 py-1.5 bg-white/[0.05] hover:bg-white/[0.12] text-slate-200 hover:text-white font-anton uppercase tracking-wider text-xs rounded-xl cursor-pointer border border-white/15"
          >
            Volver
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
