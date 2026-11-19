import React, { useState } from 'react';
import { 
  Eye, 
  Sparkles, 
  Moon, 
  Sun, 
  Target, 
  Palette, 
  Lock, 
  Compass, 
  Layout, 
  Hand, 
  ArrowLeft, 
  ArrowRight, 
  Type, 
  Shield, 
  Zap 
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { MoxenEclipseToggle } from '../moxen/MoxenEclipseToggle';
import { MoxenMalla } from '../moxen/MoxenMalla';

import { soundFX } from '../../utils/audio';
import { NARRATIVE_MODE_OPTIONS } from '../../data/narrativeCopy';

export const SettingsAtmosphereTab: React.FC = () => {
  const {
    opticMode,
    setOpticMode,
    systemAura,
    setSystemAura,
    glowIntensity,
    setGlowIntensity,
    navigationMode,
    setNavigationMode,
    handDominance,
    setHandDominance,
    narrativeMode,
    setNarrativeMode,
    zenMode,
    toggleZenMode,
    triggerTransition,
  } = useUIStore();

  const [textDensityCompact, setTextDensityCompact] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('lasolucion_text_density') === 'compact';
  });

  const handleToggleTextDensity = (val: boolean) => {
    soundFX.playClick();
    setTextDensityCompact(val);
    if (typeof window !== 'undefined') {
      if (val) {
        localStorage.setItem('lasolucion_text_density', 'compact');
        document.documentElement.classList.add('density-compact');
      } else {
        localStorage.removeItem('lasolucion_text_density');
        document.documentElement.classList.remove('density-compact');
      }
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* HERO CARD COMPACTA: SISTEMA ÓPTICO TÁCTICO & CONTROL ECLIPSE MOXEN */}
      <div className="w-full relative isolate rounded-2xl bg-[#040a1a]/[0.94] p-4 sm:p-5 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden space-y-3">
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

        {/* CABECERA INTEGRADA */}
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 aura-text-primary text-[10px] font-mono font-bold uppercase tracking-widest mb-0.5">
              <Eye className="w-3.5 h-3.5 aura-text-primary shrink-0" /> Sistema Óptico
            </div>
            <h3 className="text-sm sm:text-base font-anton uppercase tracking-wide text-white truncate">
              MODO DE VISIÓN
            </h3>
            <p className="text-[11px] text-slate-400 truncate">
              Fase activa:{' '}
              <span className="aura-text-soft font-bold uppercase">
                {opticMode === 'aurora' && '🌌 Aurora Neón'}
                {opticMode === 'noir' && '🌑 Noir Oscuro'}
                {opticMode === 'eink' && '☀️ Noir Claro'}
                {opticMode === 'cobalt' && '🎯 Cobalto Azul'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#040814]/80 p-1.5 sm:p-2 rounded-xl border border-white/10 shrink-0">
            <MoxenEclipseToggle
              opticMode={opticMode}
              onSelectMode={(mode) => setOpticMode(mode)}
              size="md"
            />
          </div>
        </div>

        {/* SELECTOR DE 4 MODOS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#040814]/80 rounded-xl border border-white/10 relative z-10">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setOpticMode('aurora');
            }}
            className={`chicle-btn h-10 px-3 rounded-lg border flex items-center justify-center gap-2 transition-all cursor-pointer ${
              opticMode === 'aurora'
                ? 'aura-bg-soft aura-border-primary text-white aura-glow-subtle ring-1 font-bold optic-active-card'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 shrink-0 ${opticMode === 'aurora' ? 'aura-text-primary' : ''}`} />
            <span className="text-xs font-anton tracking-wider uppercase">Aurora</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setOpticMode('noir');
            }}
            className={`chicle-btn h-10 px-3 rounded-lg border flex items-center justify-center gap-2 transition-all cursor-pointer ${
              opticMode === 'noir'
                ? 'bg-white/20 border-white text-white shadow-[0_0_12px_rgba(255,255,255,0.25)] ring-1 ring-white font-bold optic-active-card'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Moon className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-anton tracking-wider uppercase">Noir Oscuro</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setOpticMode('eink');
            }}
            className={`chicle-btn h-10 px-3 rounded-lg border flex items-center justify-center gap-2 transition-all cursor-pointer ${
              opticMode === 'eink'
                ? 'bg-white border-white text-black shadow-[0_0_12px_rgba(255,255,255,0.4)] ring-1 ring-white font-bold optic-active-card'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Sun className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-anton tracking-wider uppercase">Noir Claro</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setOpticMode('cobalt');
            }}
            className={`chicle-btn h-10 px-3 rounded-lg border flex items-center justify-center gap-2 transition-all cursor-pointer ${
              opticMode === 'cobalt'
                ? 'bg-blue-600/30 border-blue-400 text-blue-100 shadow-[0_0_12px_rgba(96,165,250,0.35)] ring-1 ring-blue-400 font-bold optic-active-card'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Target className="w-3.5 h-3.5 shrink-0 text-blue-400" />
            <span className="text-xs font-anton tracking-wider uppercase">Cobalto</span>
          </button>
        </div>
      </div>

      {/* PERSONALIZADOR DE FONDO & COLOR */}
      <div className="w-full relative isolate rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] p-5 sm:p-6 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden space-y-4">
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest mb-1 transition-colors aura-text-primary">
            <Palette className="w-4 h-4" /> Personalizador Visual
          </div>
          <h3 className="text-base sm:text-lg font-anton uppercase tracking-wide text-white">
            Personalizador de Fondo & Color
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Ajusta los tonos y nodos de color de tu fondo.
          </p>
        </div>

        {opticMode !== 'aurora' ? (
          <div className="relative z-10 p-4 rounded-xl bg-[#040814]/80 border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <span className="text-xs font-anton tracking-wider uppercase text-slate-300 block">
                  Fondo Bloqueado en {opticMode === 'eink' ? 'Noir Claro' : opticMode === 'noir' ? 'Noir Oscuro' : 'Cobalto'}
                </span>
                <p className="text-[11px] text-slate-400">
                  El fondo dinámico a color solo está activo en modo Aurora Neón.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setOpticMode('aurora');
              }}
              className="chicle-btn px-3 py-1.5 rounded-xl border aura-bg-soft aura-border-subtle hover:brightness-110 text-xs font-anton uppercase tracking-wider shrink-0 cursor-pointer"
            >
              Activar Aurora
            </button>
          </div>
        ) : (
          <div className="relative z-10">
            <MoxenMalla
              activeSystemAuraName={systemAura?.name}
              onApplyToSystem={(aura) => setSystemAura(aura)}
              onResetSystem={() => setSystemAura(null)}
            />
          </div>
        )}
      </div>

      {/* ILUMINACIÓN, HUD, TIPOGRAFÍA & RENDIMIENTO */}
      <div className="w-full relative isolate rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] p-5 sm:p-6 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden space-y-5">
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

        <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-10">
          <h3 className="text-xs font-anton aura-text-primary uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 aura-text-primary" /> Iluminación, HUD & Tipografía
          </h3>
          <span className="text-[10px] font-mono aura-bg-soft px-2 py-0.5 rounded-full border aura-border-subtle font-bold uppercase">
            Ajustes Visuales
          </span>
        </div>

        {/* RESPLANDOR NEÓN */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <h4 className="text-sm font-anton tracking-wider uppercase text-white flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" /> Resplandor Neón (Control de Bloom)
            </h4>
            <p className="text-xs text-slate-400">
              Regula la emisión luminosa de halos y sombras para confort visual en sesiones nocturnas.
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-[#040814]/80 p-1 rounded-2xl border border-white/10 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setGlowIntensity('off');
              }}
              className={`chicle-btn px-3 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all cursor-pointer ${
                glowIntensity === 'off'
                  ? 'bg-white text-black font-bold shadow-[0_0_10px_rgba(255,255,255,0.4)] optic-active-card'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Apagado</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setGlowIntensity('tactical');
              }}
              className={`chicle-btn px-3 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all cursor-pointer ${
                glowIntensity === 'tactical'
                  ? 'aura-btn-gradient optic-active-card font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Táctico (50%)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setGlowIntensity('neon');
              }}
              className={`chicle-btn px-3 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all cursor-pointer ${
                glowIntensity === 'neon'
                  ? 'aura-btn-gradient optic-active-card font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Neón Puro</span>
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN HUD */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <h4 className="text-sm font-anton tracking-wider uppercase text-white flex items-center gap-2 mb-1">
              <Compass className="w-4 h-4 aura-text-primary" /> Modo de Navegación HUD
            </h4>
            <p className="text-xs text-slate-400">
              Elige entre el orbe flotante de KAI con menú orbital o la Barra Lateral expandible con KAI integrado en su cabecera.
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-[#040814]/80 p-1 rounded-2xl border border-white/10 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setNavigationMode('nexus');
              }}
              className={`chicle-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all cursor-pointer ${
                navigationMode === 'nexus'
                  ? 'aura-btn-gradient optic-active-card font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>KAI Nexus (Flotante)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setNavigationMode('classic');
              }}
              className={`chicle-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all cursor-pointer ${
                navigationMode === 'classic'
                  ? 'aura-btn-gradient optic-active-card font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Barra Lateral (KAI Menú)</span>
            </button>
          </div>
        </div>

        {/* LADO DE LA BARRA (IZQUIERDA O DERECHA) */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <h4 className="text-sm font-anton tracking-wider uppercase text-white flex items-center gap-2 mb-1">
              <Hand className="w-4 h-4 aura-text-primary" /> Posición de Navegación (Izquierda / Derecha)
            </h4>
            <p className="text-xs text-slate-400">
              {navigationMode === 'classic'
                ? 'Mueve la Barra Lateral al lado izquierdo o derecho de la pantalla según tu ergonomía y preferencia.'
                : 'Posiciona el orbe flotante de KAI en el arco izquierdo o derecho según tu mano preferida.'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-[#040814]/80 p-1 rounded-2xl border border-white/10 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setHandDominance('left');
              }}
              className={`chicle-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all cursor-pointer ${
                handDominance === 'left'
                  ? 'aura-btn-gradient optic-active-card font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Izquierda (Zurda)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setHandDominance('right');
              }}
              className={`chicle-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all cursor-pointer ${
                handDominance === 'right'
                  ? 'aura-btn-gradient optic-active-card font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Derecha (Diestra)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* MODO ZEN */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4 relative z-10">
          <div>
            <h4 className="text-sm font-anton tracking-wider uppercase text-white flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-emerald-400" /> Modo Zen (Ultra Enfoque & Batería)
            </h4>
            <p className="text-xs text-slate-400">
              Desactiva orbes y partículas continuas para máxima fluidez y ahorro de batería en móvil.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              toggleZenMode();
            }}
            className={`chicle-btn px-4 py-2 rounded-xl text-xs font-anton uppercase tracking-wider transition-all border cursor-pointer ${
              zenMode
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 optic-active-card font-bold'
                : 'bg-white/[0.04] border-white/15 text-slate-400 hover:text-white'
            }`}
          >
            {zenMode ? 'Activado' : 'Desactivado'}
          </button>
        </div>
      </div>
    </div>
  );
};
