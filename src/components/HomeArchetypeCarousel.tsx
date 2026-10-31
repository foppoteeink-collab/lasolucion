import React, { useState, useMemo } from 'react';
import { Sparkles, Zap, Check, Target, AlertTriangle, ChevronDown, ChevronUp, Compass } from 'lucide-react';
import { JUNG_ARCHETYPES, JungArchetype } from '../data/archetypes';
import { soundFX } from '../utils/audio';
import { triggerShockwave } from '../utils/celebration';
import { MoxenInercia } from './moxen/MoxenInercia';

interface HomeArchetypeCarouselProps {
  currentArchetype: string;
  onSelectArchetype: (archetype: JungArchetype) => void;
}

export const HomeArchetypeCarousel: React.FC<HomeArchetypeCarouselProps> = ({
  currentArchetype,
  onSelectArchetype,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const normalize = (str: string) =>
    str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const currentNorm = normalize(currentArchetype || 'El Héroe');

  const initialIndex = useMemo(() => {
    const idx = JUNG_ARCHETYPES.findIndex(
      (a) => normalize(a.name) === currentNorm || normalize(a.id) === currentNorm
    );
    return idx >= 0 ? idx : 0;
  }, [currentNorm]);

  const activeArchObj = useMemo(() => {
    return (
      JUNG_ARCHETYPES.find(
        (a) => normalize(a.name) === currentNorm || normalize(a.id) === currentNorm
      ) || JUNG_ARCHETYPES[0]
    );
  }, [currentNorm]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-[#08031a]/90 via-[#050b18]/95 to-[#02050c] p-3 sm:p-5 shadow-[0_4px_30px_rgba(0,240,255,0.12)]">
      {/* Glow ambiental de fondo */}
      <div className="absolute top-0 right-1/4 w-72 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-72 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header interactivo */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-cyan-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-cyan-950/80 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.35)] shrink-0">
            <Compass className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-anton text-sm sm:text-base uppercase tracking-wider text-cyan-300">
                Arquetipos de Personalidad
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold hidden sm:inline-block">
                12 Modelos
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Tu esencia psicológica en el sistema · Desliza con inercia para explorar o cambiar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge del arquetipo actual */}
          <div className="flex items-center gap-1.5 bg-black/60 border border-cyan-500/40 px-2.5 py-1 rounded-xl shadow-[0_0_10px_rgba(0,240,255,0.2)]">
            <span className="text-sm">{activeArchObj.avatar}</span>
            <span className="text-[11px] font-anton uppercase text-cyan-300 tracking-wide">
              {activeArchObj.name}
            </span>
          </div>

          {/* Toggle Expandir / Plegar */}
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
                <ChevronUp className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Plegar</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Explorar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Contenido: Carrusel Moxen Inercia */}
      {isExpanded && (
        <div className="relative z-10 pt-3">
          <MoxenInercia
            initialIndex={initialIndex}
            friccion={4}
            goma={0.3}
            iman={true}
            accentColor="#00f0ff"
          >
            {JUNG_ARCHETYPES.map((arch, index) => {
              const isSelected =
                currentNorm === normalize(arch.name) || currentNorm === normalize(arch.id);
              const romanNumber = [
                'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
              ][index];

              return (
                <div
                  key={arch.id}
                  className={`h-[420px] sm:h-[450px] p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#092238] via-[#041525] to-[#020a12] border-cyan-300 shadow-[0_0_30px_rgba(0,240,255,0.35)]'
                      : 'bg-gradient-to-b from-[#071320] to-[#030910] border-cyan-500/30'
                  }`}
                >
                  {/* Capa de fondo con paralaje (Número Romano Gigante) */}
                  <span className="in-fondo-num text-cyan-400 select-none">
                    {romanNumber}
                  </span>

                  {/* Cabecera de la Tarjeta */}
                  <div className="relative z-10 flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-widest font-black bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-500/40">
                      Nº {index + 1 < 10 ? `0${index + 1}` : index + 1}
                    </span>
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/40 px-2 py-0.5 rounded-lg font-bold shrink-0">
                      {arch.statBonus}
                    </span>
                  </div>

                  {/* Avatar Central con paralaje */}
                  <div className="relative z-10 flex flex-col items-center justify-center my-1">
                    <div className="in-forma w-20 h-20 rounded-2xl bg-black/60 border border-cyan-400/50 flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(0,240,255,0.25)] select-none">
                      {arch.avatar}
                    </div>

                    <h4 className="font-anton text-base sm:text-lg uppercase tracking-wider text-white text-center mt-2.5">
                      {arch.name}
                    </h4>
                    <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider font-semibold">
                      Compañero: {arch.companion?.title} {arch.companion?.icon}
                    </span>
                  </div>

                  {/* Descripción y Atributos (100% lenguaje humano) */}
                  <div className="relative z-10 space-y-2">
                    <p className="text-[11px] text-slate-300 leading-snug font-sans bg-black/50 p-2.5 rounded-xl border border-cyan-500/20 line-clamp-3">
                      {arch.description}
                    </p>

                    <div className="space-y-1 text-[10px] font-mono">
                      <div className="flex items-center gap-1.5 text-cyan-300 bg-[#020b14]/70 px-2 py-1 rounded-lg border border-cyan-500/20 truncate">
                        <Target className="w-3 h-3 shrink-0 text-cyan-400" />
                        <span className="truncate">
                          <strong className="text-white">Deseo: </strong>
                          {arch.desire}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-rose-300 bg-[#020b14]/70 px-2 py-1 rounded-lg border border-rose-500/20 truncate">
                        <AlertTriangle className="w-3 h-3 shrink-0 text-rose-400" />
                        <span className="truncate">
                          <strong className="text-white">Miedo: </strong>
                          {arch.fear}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botón de Sintonización */}
                  <div className="relative z-10 pt-2 border-t border-cyan-500/20 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      Stat: <strong className="text-cyan-300 capitalize">{arch.primaryStat}</strong>
                    </span>

                    {isSelected ? (
                      <span className="flex items-center gap-1 text-[11px] font-mono font-black text-cyan-300 bg-cyan-900/80 border border-cyan-400 px-3 py-1 rounded-xl shadow-[0_0_12px_rgba(0,240,255,0.4)]">
                        <Check className="w-3.5 h-3.5 text-cyan-300" />
                        Arquetipo Activo
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          soundFX.playItemEquip();
                          triggerShockwave({ color: 'violet', intensity: 'medium' });
                          onSelectArchetype(arch);
                        }}
                        className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-anton uppercase text-[11px] rounded-xl cursor-pointer transition-all shadow-[0_0_12px_rgba(0,240,255,0.4)] active:scale-95 flex items-center gap-1 font-bold"
                      >
                        <Zap className="w-3 h-3 fill-black" />
                        Elegir Arquetipo
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
