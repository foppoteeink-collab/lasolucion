import React, { useState, useMemo } from 'react';
import { Zap, Check, ChevronDown, ChevronUp, Compass, Sparkles } from 'lucide-react';
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
    <section className="relative overflow-hidden rounded-3xl border border-cyan-500/25 bg-gradient-to-b from-[#09041a]/95 via-[#040814]/95 to-[#02050c] p-3 sm:p-4 shadow-[0_4px_30px_rgba(0,240,255,0.1)]">
      {/* Glow ambiental sutil */}
      <div className="absolute top-0 right-1/4 w-72 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-72 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cabecera limpia y compacta */}
      <div className="relative z-10 flex items-center justify-between gap-2 pb-2 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.3)] shrink-0">
            <Compass className="w-4 h-4 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-anton text-xs sm:text-sm uppercase tracking-wider text-cyan-300">
                Tu Arquetipo de Personalidad
              </h3>
            </div>
            <p className="text-[10px] text-slate-400 font-sans">
              Desliza las tarjetas para explorar o elegir tu resonancia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge del arquetipo activo actual */}
          <div className="flex items-center gap-1.5 bg-black/60 border border-cyan-500/40 px-2.5 py-1 rounded-xl shadow-[0_0_10px_rgba(0,240,255,0.2)]">
            <span className="text-sm">{activeArchObj.avatar}</span>
            <span className="text-[11px] font-anton uppercase text-cyan-300 tracking-wide">
              {activeArchObj.name}
            </span>
          </div>

          {/* Toggle Plegar / Explorar */}
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
                <span className="hidden sm:inline">Ver Arquetipos</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Contenido: Carrusel Moxen Inercia con tarjetas limpias y legibles */}
      {isExpanded && (
        <div className="relative z-10 pt-2">
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
              const cardNum = index + 1 < 10 ? `0${index + 1}` : `${index + 1}`;

              return (
                <div
                  key={arch.id}
                  className={`w-full h-full p-4 flex flex-col justify-between relative overflow-hidden rounded-2xl border transition-colors ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#0d2238] via-[#061424] to-[#020a14] border-cyan-300 shadow-[0_0_25px_rgba(0,240,255,0.25)]'
                      : 'bg-gradient-to-b from-[#0a121e] to-[#03070d] border-cyan-500/20 hover:border-cyan-500/40'
                  }`}
                >
                  {/* Número de fondo para paralaje interna (.in-num crea .in-fondo-num automáticamente) */}
                  <span className="in-num font-mono text-[11px] text-cyan-400/80 font-bold">
                    {cardNum}
                  </span>

                  {/* Cabecera de la tarjeta: Número y Bonus */}
                  <div className="flex items-center justify-between gap-2 z-10">
                    <span className="text-[10px] font-mono text-cyan-300/90 font-bold uppercase tracking-wider bg-cyan-950/70 px-2 py-0.5 rounded-md border border-cyan-500/30">
                      Nº {cardNum}
                    </span>
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                      {arch.statBonus}
                    </span>
                  </div>

                  {/* Centro: Figura con paralaje (.in-forma) y Título */}
                  <div className="flex flex-col items-center justify-center my-auto py-2 z-10 text-center">
                    <div className="in-forma w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-black/60 border border-cyan-400/40 flex items-center justify-center text-3xl sm:text-4xl shadow-[0_0_20px_rgba(0,240,255,0.2)] mb-2 select-none">
                      {arch.avatar}
                    </div>

                    <h4 className="font-anton text-base sm:text-lg uppercase tracking-wider text-white">
                      {arch.name}
                    </h4>

                    <span className="text-[10px] font-mono text-cyan-300/80 uppercase tracking-wide mt-0.5 font-medium">
                      {arch.companion?.title} {arch.companion?.icon}
                    </span>
                  </div>

                  {/* Descripción: 1 sola frase clara, humana y espaciosa */}
                  <div className="z-10 mb-2">
                    <p className="text-[11px] sm:text-xs text-slate-300 leading-snug font-sans text-center line-clamp-2 px-1">
                      {arch.description}
                    </p>
                  </div>

                  {/* Botón de acción directo y limpio */}
                  <div className="z-10 pt-1">
                    {isSelected ? (
                      <div className="w-full py-1.5 flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-cyan-300 bg-cyan-950/90 border border-cyan-400 rounded-xl shadow-[0_0_12px_rgba(0,240,255,0.3)]">
                        <Check className="w-3.5 h-3.5 text-cyan-300" />
                        <span>Arquetipo Activo</span>
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
                        className="w-full py-1.5 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-black font-anton uppercase text-xs rounded-xl cursor-pointer transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] active:scale-95 flex items-center justify-center gap-1.5 font-bold"
                      >
                        <Zap className="w-3.5 h-3.5 fill-black" />
                        <span>Elegir Arquetipo</span>
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
