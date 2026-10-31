import React, { useState } from 'react';
import { 
  Sparkles, 
  Shield, 
  Swords, 
  User, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Zap, 
  Target, 
  AlertTriangle, 
  LogIn, 
  CheckCircle2, 
  Award,
  Crown,
  X,
  Bot,
  Layers,
  LayoutGrid
} from 'lucide-react';
import { PlayerStats, KaiShapeKey, GenderPreference } from '../types';
import { JUNG_ARCHETYPES, JungArchetype, getArchetypeByName, getArchetypeTitle } from '../data/archetypes';
import { KAI_OFFICIAL_SHAPES, KaiShapeDefinition } from '../data/kaiShapes';
import { KaiVectorGraphics } from './KaiVectorGraphics';
import { soundFX } from '../utils/audio';
import { triggerShockwave } from '../utils/celebration';
import { useAuth } from '../context/AuthContext';
import { CloudSyncResult } from '../hooks/useCloudSync';
import { MoxenInercia } from './moxen/MoxenInercia';

// Definición cromática de alta fidelidad estética para cada uno de los 12 arquetipos
const ARCHETYPE_THEMES: Record<
  string,
  {
    accent: string;
    glow: string;
    border: string;
    bgGradient: string;
    roman: string;
    statPill: string;
  }
> = {
  inocente: {
    accent: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.35)',
    border: 'border-amber-500/50',
    bgGradient: 'from-amber-500/20 via-yellow-500/5 to-transparent',
    roman: 'I',
    statPill: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  },
  huerfano: {
    accent: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.35)',
    border: 'border-blue-500/50',
    bgGradient: 'from-blue-500/20 via-indigo-500/5 to-transparent',
    roman: 'II',
    statPill: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
  },
  heroe: {
    accent: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.40)',
    border: 'border-red-500/50',
    bgGradient: 'from-red-500/20 via-rose-500/5 to-transparent',
    roman: 'III',
    statPill: 'bg-red-500/15 text-red-300 border-red-500/40',
  },
  cuidador: {
    accent: '#10b981',
    glow: 'rgba(168, 85, 247, 0.35)',
    border: 'border-emerald-500/50',
    bgGradient: 'from-emerald-500/20 via-teal-500/5 to-transparent',
    roman: 'IV',
    statPill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  },
  explorador: {
    accent: '#f97316',
    glow: 'rgba(249, 115, 22, 0.35)',
    border: 'border-orange-500/50',
    bgGradient: 'from-orange-500/20 via-amber-500/5 to-transparent',
    roman: 'V',
    statPill: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
  },
  rebelde: {
    accent: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.40)',
    border: 'border-purple-500/50',
    bgGradient: 'from-purple-500/20 via-indigo-500/5 to-transparent',
    roman: 'VI',
    statPill: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
  },
  amante: {
    accent: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.35)',
    border: 'border-rose-500/50',
    bgGradient: 'from-rose-500/20 via-pink-500/5 to-transparent',
    roman: 'VII',
    statPill: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
  },
  creador: {
    accent: '#d946ef',
    glow: 'rgba(217, 70, 239, 0.40)',
    border: 'border-fuchsia-500/50',
    bgGradient: 'from-fuchsia-500/20 via-purple-500/5 to-transparent',
    roman: 'VIII',
    statPill: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40',
  },
  bufon: {
    accent: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.35)',
    border: 'border-cyan-500/50',
    bgGradient: 'from-cyan-500/20 via-teal-500/5 to-transparent',
    roman: 'IX',
    statPill: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
  },
  sabio: {
    accent: '#6366f1',
    glow: 'rgba(99, 102, 241, 0.35)',
    border: 'border-indigo-500/50',
    bgGradient: 'from-indigo-500/20 via-violet-500/5 to-transparent',
    roman: 'X',
    statPill: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40',
  },
  mago: {
    accent: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.40)',
    border: 'border-violet-500/50',
    bgGradient: 'from-violet-500/20 via-purple-500/5 to-transparent',
    roman: 'XI',
    statPill: 'bg-violet-500/15 text-violet-300 border-violet-500/40',
  },
  gobernante: {
    accent: '#eab308',
    glow: 'rgba(234, 179, 8, 0.35)',
    border: 'border-yellow-500/50',
    bgGradient: 'from-yellow-500/20 via-amber-500/5 to-transparent',
    roman: 'XII',
    statPill: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40',
  },
};

interface HunterAwakeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  onCompleteAwakening: (data: {
    username: string;
    fullName?: string;
    characterClass: string;
    mantra?: string;
    kaiShape?: KaiShapeKey;
    genderPreference?: GenderPreference;
  }) => void;
  cloudSync?: CloudSyncResult;
}

export const HunterAwakeningModal: React.FC<HunterAwakeningModalProps> = ({
  isOpen,
  onClose,
  stats,
  onCompleteAwakening,
  cloudSync
}) => {
  const { user, signInWithGoogle } = useAuth();
  
  // Step 1: KAI (Elegido primero) -> Step 2: Arquetipo -> Step 3: Identidad -> Step 4: Despertar
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // KAI companion selection
  const [selectedKaiShape, setSelectedKaiShape] = useState<KaiShapeKey>(stats.kaiShape || 'prism');

  // Archetype & Identity states
  const [selectedArchName, setSelectedArchName] = useState(stats.characterClass || 'El Héroe');
  const [genderPreference, setGenderPreference] = useState<GenderPreference>(stats.genderPreference || 'universal');
  const [username, setUsername] = useState(
    stats.username && stats.username !== 'CazadorDelSistema' ? stats.username : ''
  );
  const [fullName, setFullName] = useState(stats.fullName || '');
  const [mantra, setMantra] = useState(stats.mantra || 'Levántate y vence');
  const [archetypeViewMode, setArchetypeViewMode] = useState<'carousel' | 'grid'>('carousel');

  const normalize = (str: string) =>
    str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const currentNorm = normalize(selectedArchName || 'El Héroe');

  const initialIndex = React.useMemo(() => {
    const idx = JUNG_ARCHETYPES.findIndex(
      (a) => normalize(a.name) === currentNorm || normalize(a.id) === currentNorm
    );
    return idx >= 0 ? idx : 0;
  }, [currentNorm]);

  if (!isOpen) return null;

  const currentArchetype = getArchetypeByName(selectedArchName);
  const currentKaiShapeDef = KAI_OFFICIAL_SHAPES.find(s => s.id === selectedKaiShape) || KAI_OFFICIAL_SHAPES[0];

  const handleSelectKaiShape = (shape: KaiShapeDefinition) => {
    soundFX.playItemEquip();
    setSelectedKaiShape(shape.id);
  };

  const handleSelectArch = (arch: JungArchetype) => {
    soundFX.playItemEquip();
    setSelectedArchName(arch.name);
  };

  const handleNextStepFromIdentity = () => {
    soundFX.playClick();
    if (!username.trim()) {
      setUsername('Operador_' + Math.floor(100 + Math.random() * 900));
    }
    setStep(4);
  };

  const handleFinalAwakening = () => {
    try {
      soundFX.playFanfare();
    } catch (e) {
      console.warn('Audio fanfare error', e);
    }

    try {
      triggerShockwave({ color: 'violet', intensity: 'epic' });
    } catch (e) {
      console.warn('Shockwave error', e);
    }

    try {
      onCompleteAwakening({
        username: username.trim() || 'Operador',
        fullName: fullName.trim(),
        characterClass: selectedArchName,
        mantra: mantra.trim(),
        kaiShape: selectedKaiShape,
        genderPreference
      });
    } catch (e) {
      console.error('onCompleteAwakening error', e);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-lg animate-in fade-in duration-300">
      <div 
        className="scifi-glass-panel border-2 border-cyan-400 rounded-3xl w-full max-w-4xl shadow-[0_0_60px_rgba(0,240,255,0.4)] flex flex-col max-h-[94dvh] sm:max-h-[90vh] overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Step Progress and Close Button */}
        <div className="p-4 sm:p-5 border-b border-cyan-500/40 bg-[#04020e] shrink-0">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(0,240,255,0.4)]">
                <Sparkles className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-cyan-300 tracking-widest block">
                  Protocolo del Sistema
                </span>
                <h2 className="font-anton text-sm sm:text-lg uppercase text-white tracking-wider">
                  Ceremonia del Despertar Inicial
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Step Badges (Desktop) */}
              <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px]">
                <span className={`px-2 py-0.5 rounded-lg border font-bold transition-all ${
                  step === 1 ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.5)]' : 'bg-black/60 text-slate-400 border-white/10'
                }`}>
                  1. Elegir KAI
                </span>
                <span className={`px-2 py-0.5 rounded-lg border font-bold transition-all ${
                  step === 2 ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.5)]' : 'bg-black/60 text-slate-400 border-white/10'
                }`}>
                  2. Arquetipo
                </span>
                <span className={`px-2 py-0.5 rounded-lg border font-bold transition-all ${
                  step === 3 ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.5)]' : 'bg-black/60 text-slate-400 border-white/10'
                }`}>
                  3. Identidad
                </span>
                <span className={`px-2 py-0.5 rounded-lg border font-bold transition-all ${
                  step === 4 ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.5)]' : 'bg-black/60 text-slate-400 border-white/10'
                }`}>
                  4. Despertar
                </span>
              </div>

              {/* Explicit Close Button */}
              <button 
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                title="Cerrar ventana de despertar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Step Badges */}
          <div className="flex sm:hidden items-center justify-center gap-1 font-mono text-[10px] pt-1">
            <span className={`px-1.5 py-0.5 rounded-md border font-bold ${
              step === 1 ? 'bg-cyan-500 text-black border-cyan-300' : 'bg-black/60 text-slate-400 border-white/10'
            }`}>
              1. KAI
            </span>
            <span className={`px-1.5 py-0.5 rounded-md border font-bold ${
              step === 2 ? 'bg-cyan-500 text-black border-cyan-300' : 'bg-black/60 text-slate-400 border-white/10'
            }`}>
              2. Arquetipo
            </span>
            <span className={`px-1.5 py-0.5 rounded-md border font-bold ${
              step === 3 ? 'bg-cyan-500 text-black border-cyan-300' : 'bg-black/60 text-slate-400 border-white/10'
            }`}>
              3. Identidad
            </span>
            <span className={`px-1.5 py-0.5 rounded-md border font-bold ${
              step === 4 ? 'bg-cyan-500 text-black border-cyan-300' : 'bg-black/60 text-slate-400 border-white/10'
            }`}>
              4. Despertar
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-5 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500 scrollbar-track-transparent">

          {/* ════════════════════════════ PASO 1: ELEGIR A KAI (DÍA 0) ════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-200">
              <div className="bg-[#030d1a]/80 p-3.5 sm:p-4 rounded-2xl border border-cyan-500/30 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-400 flex items-center justify-center text-xl shrink-0 shadow-[0_0_12px_rgba(0,240,255,0.35)]">
                  💠
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-anton uppercase text-cyan-300 tracking-wider">
                    Sintonización de tu Compañero Cuántico KAI
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-300 font-sans leading-relaxed mt-0.5">
                    Conoce a <strong>KAI: tu compañero táctico</strong> para optimizar enfoque, hábitos y energía diaria:
                  </p>
                </div>
              </div>

              {/* Forma Génesis Oficial: El Prisma */}
              <div className="max-w-md mx-auto w-full">
                {KAI_OFFICIAL_SHAPES.map((shape) => {
                  const isSelected = selectedKaiShape === shape.id;
                  return (
                    <div
                      key={shape.id}
                      onClick={() => handleSelectKaiShape(shape)}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 group relative overflow-hidden ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#06182c] to-[#042838] border-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.35)] ring-1 ring-cyan-400'
                          : 'bg-[#030d17]/80 border-cyan-500/25 hover:border-cyan-400/60 hover:bg-[#041525]'
                      }`}
                    >
                      {/* Live SVG Vector Graphic Preview: Escala Original Compacta (48px - 54px) */}
                      <div className="w-13 h-14 shrink-0 flex items-center justify-center rounded-xl bg-black/40 border border-white/5 p-1">
                        <KaiVectorGraphics 
                          shapeId={shape.id} 
                          activeColor={isSelected ? '#00f0ff' : '#67e8f9'}
                          secondaryColor="#0284c7"
                          glowFilterId={`awakening-shape-${shape.id}`}
                        />
                      </div>

                      {/* Info & Metadata */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="font-anton text-xs uppercase tracking-wide text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5 truncate">
                            <span>{shape.icon}</span>
                            <span className="truncate">{shape.name}</span>
                          </h4>
                          <span className="text-[9px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 rounded shrink-0">
                            {shape.themeTrait}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-300 leading-snug font-sans line-clamp-1">
                          {shape.tagline}
                        </p>

                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[9px] font-mono text-cyan-400/80">
                            {shape.codename}
                          </span>
                          {isSelected ? (
                            <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-cyan-300 bg-cyan-900/60 border border-cyan-400 px-1.5 py-0.2 rounded shadow-[0_0_6px_rgba(0,240,255,0.4)]">
                              <Check className="w-2.5 h-2.5 text-cyan-300" />
                              Sintonizado
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono text-slate-400 group-hover:text-cyan-300">
                              Seleccionar
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live Preview Banner */}
              <div className="p-3 rounded-2xl bg-[#020b14]/80 border border-cyan-500/30 flex items-center justify-between gap-3 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{currentKaiShapeDef.icon}</span>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Compañero Seleccionado:</span>
                    <strong className="text-cyan-300 uppercase">{currentKaiShapeDef.name}</strong>
                  </div>
                </div>
                <div className="text-[11px] text-slate-300 hidden sm:block text-right">
                  <span className="text-emerald-400 font-bold block">✓ 100% Desbloqueado</span>
                  <span className="text-[10px] text-slate-400">Podrás cambiar de figura cuando quieras en el Taller de KAI</span>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════ PASO 2: ARQUETIPOS JUNGIANOS ════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
              <div className="bg-[#030d1a]/80 p-3.5 sm:p-4 rounded-2xl border border-cyan-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-400 flex items-center justify-center text-xl shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.35)]">
                    🛡️
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-anton uppercase text-cyan-300 tracking-wider">
                      Canalización del Arquetipo Psicológico
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-200 leading-relaxed font-sans mt-0.5">
                      Desliza con inercia para elegir tu <strong className="text-cyan-300">Arquetipo</strong> y activar tu bonificación táctica:
                    </p>
                  </div>
                </div>

                {/* Switcher Carrusel / Rejilla */}
                <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setArchetypeViewMode('carousel');
                    }}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] font-mono font-bold ${
                      archetypeViewMode === 'carousel'
                        ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Modo Carrusel Cinético (Moxen Inercia)"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Deslizar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setArchetypeViewMode('grid');
                    }}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] font-mono font-bold ${
                      archetypeViewMode === 'grid'
                        ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Modo Rejilla Completa"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Rejilla</span>
                  </button>
                </div>
              </div>

              {archetypeViewMode === 'carousel' ? (
                <div className="py-2">
                  <MoxenInercia
                    initialIndex={initialIndex}
                    friccion={4}
                    goma={0.3}
                    iman={true}
                    accentColor="#00f0ff"
                  >
                    {JUNG_ARCHETYPES.map((arch, index) => {
                      const isSelected = selectedArchName === arch.name;
                      const cardNum = index + 1 < 10 ? `0${index + 1}` : `${index + 1}`;
                      const theme = ARCHETYPE_THEMES[arch.id] || ARCHETYPE_THEMES.heroe;

                      return (
                        <div
                          key={arch.id}
                          className={`relative w-full h-full p-4 sm:p-5 flex flex-col justify-between overflow-hidden rounded-[24px] border transition-all duration-300 select-none ${
                            isSelected
                              ? 'border-2 shadow-[0_0_35px_rgba(0,240,255,0.25)]'
                              : 'border-white/10 hover:border-white/25 hover:shadow-[0_8px_25px_rgba(0,0,0,0.5)]'
                          }`}
                          style={{
                            backgroundColor: '#050912',
                            borderColor: isSelected ? theme.accent : undefined,
                          }}
                        >
                          {/* Luz ambiental radial superior */}
                          <div
                            className={`absolute inset-0 bg-gradient-to-b ${theme.bgGradient} pointer-events-none opacity-80`}
                          />

                          {/* Bisel superior */}
                          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                          {/* Número Romano Gigante con Paralaje 3D nativa */}
                          <span
                            className="in-fondo-num select-none pointer-events-none transition-transform"
                            style={{ color: theme.accent }}
                          >
                            {theme.roman}
                          </span>

                          <span className="in-num hidden">{theme.roman}</span>

                          {/* Cabecera de la Tarjeta */}
                          <div className="relative z-10 flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono tracking-widest font-black uppercase text-slate-300 bg-black/60 px-2 py-0.5 rounded-lg border border-white/10 backdrop-blur-md">
                              {cardNum} · {theme.roman}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border backdrop-blur-md flex items-center gap-1 ${theme.statPill}`}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: theme.accent }}
                              />
                              {arch.statBonus}
                            </span>
                          </div>

                          {/* Avatar Central con paralaje (.in-forma) */}
                          <div className="relative z-10 flex flex-col items-center justify-center my-auto py-2 text-center">
                            <div
                              className="in-forma relative w-20 h-20 rounded-2xl bg-gradient-to-br from-black/80 via-[#0a0f1d]/90 to-black/80 border flex items-center justify-center text-4xl shadow-[0_0_25px_rgba(0,0,0,0.8)] backdrop-blur-xl mb-2.5 transition-transform"
                              style={{
                                borderColor: `${theme.accent}66`,
                                boxShadow: `0 0 25px ${theme.glow}, inset 0 1px 1px rgba(255,255,255,0.35)`,
                              }}
                            >
                              <div
                                className="absolute inset-2 rounded-xl opacity-20 pointer-events-none"
                                style={{ backgroundColor: theme.accent }}
                              />
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

                          {/* Descripción y Misión */}
                          <div className="relative z-10 space-y-2 mb-3">
                            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed text-center font-sans">
                              {arch.description}
                            </p>
                            <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-cyan-300 bg-cyan-950/40 p-1.5 rounded-lg border border-cyan-800/40">
                              <Target className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span className="truncate">{arch.desire}</span>
                            </div>
                          </div>

                          {/* Botón de Acción */}
                          <div className="relative z-10 pt-1">
                            {isSelected ? (
                              <div
                                className="w-full py-2 rounded-xl font-anton uppercase text-xs flex items-center justify-center gap-1.5 border font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                                style={{
                                  backgroundColor: `${theme.accent}22`,
                                  borderColor: theme.accent,
                                  color: theme.accent,
                                  boxShadow: `0 0 16px ${theme.glow}`,
                                }}
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Arquetipo Sintonizado</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  soundFX.playItemEquip();
                                  triggerShockwave({ color: 'violet', intensity: 'medium' });
                                  setSelectedArchName(arch.name);
                                }}
                                className="w-full py-2 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 text-white font-anton uppercase text-xs rounded-xl cursor-pointer transition-all border border-white/15 hover:border-white/30 active:scale-95 flex items-center justify-center gap-1.5 font-bold shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
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
                /* Rejilla Alternativa */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {JUNG_ARCHETYPES.map((arch) => {
                    const isSelected = selectedArchName === arch.name;
                    return (
                      <div
                        key={arch.id}
                        onClick={() => handleSelectArch(arch)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-gradient-to-br from-[#06182c] to-[#042838] border-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.4)] ring-1 ring-cyan-400'
                            : 'bg-[#030d17]/80 border-cyan-500/30 hover:border-cyan-400 hover:bg-[#041525]'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2.5">
                              <span className="text-3xl p-1.5 bg-black/60 rounded-xl border border-cyan-500/30 shrink-0">
                                {arch.avatar}
                              </span>
                              <div>
                                <h4 className="font-anton text-sm sm:text-base uppercase tracking-wider text-white">
                                  {arch.name}
                                </h4>
                                <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider font-semibold">
                                  Sintonía: {arch.companion?.title} {arch.companion?.icon}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/40 px-2 py-0.5 rounded-lg font-bold shrink-0">
                              {arch.statBonus}
                            </span>
                          </div>

                          <p className="text-xs text-slate-200 leading-relaxed bg-black/40 p-2.5 rounded-xl border border-cyan-500/20 mb-2.5 font-sans">
                            {arch.description}
                          </p>

                          <div className="space-y-1 text-[11px] font-mono">
                            <div className="flex items-start gap-1 text-cyan-300 bg-[#020b14]/60 p-1.5 rounded-lg border border-cyan-500/20">
                              <Target className="w-3.5 h-3.5 shrink-0 mt-0.5 text-cyan-400" />
                              <span><strong className="text-white">Deseo: </strong>{arch.desire}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-cyan-500/20 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            Atributo: <strong className="text-cyan-300 capitalize">{arch.primaryStat}</strong>
                          </span>
                          {isSelected ? (
                            <span className="flex items-center gap-1 text-[11px] font-mono font-black text-cyan-300 bg-cyan-900/60 border border-cyan-400 px-3 py-1 rounded-xl shadow-[0_0_10px_rgba(0,240,255,0.4)]">
                              <Check className="w-3.5 h-3.5 text-cyan-300" />
                              Seleccionado
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-cyan-400/70 hover:text-cyan-300">
                              Toca para seleccionar
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Banner de Resonancia Activa Seleccionada */}
              <div className="p-3 rounded-2xl bg-[#020b14]/80 border border-cyan-500/30 flex items-center justify-between gap-3 font-mono text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl p-1 bg-black/60 rounded-xl border border-cyan-500/30">
                    {currentArchetype?.avatar || '🛡️'}
                  </span>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Arquetipo Seleccionado:</span>
                    <strong className="text-cyan-300 uppercase">{selectedArchName}</strong>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-amber-300 font-bold block">{currentArchetype?.statBonus}</span>
                  <span className="text-[10px] text-slate-400">Atributo Potenciado: {currentArchetype?.primaryStat}</span>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════ PASO 3: IDENTIDAD & CUENTA ════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="bg-[#030d1a]/80 p-3.5 rounded-2xl border border-cyan-500/30">
                <p className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed">
                  Ingresa tu nombre para activar tu terminal táctico y blindar tu progreso:
                </p>
              </div>

              {/* User Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-anton text-cyan-300 uppercase tracking-wider mb-1.5">
                    1. Nombre de Usuario (@usuario) *
                  </label>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#04020e] border border-cyan-500/50 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-300 text-xs font-mono"
                    placeholder="Ej: Fénix_Prime"
                  />
                </div>
                <div>
                  <label className="block text-xs font-anton text-cyan-300 uppercase tracking-wider mb-1.5">
                    Nombre Real (Opcional)
                  </label>
                  <input 
                    type="text" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#04020e] border border-cyan-500/50 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-300 text-xs"
                    placeholder="Ej: Alex Jin"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-anton text-cyan-300 uppercase tracking-wider mb-1.5">
                  Lema Inicial / Mantra
                </label>
                <input 
                  type="text" 
                  value={mantra} 
                  onChange={(e) => setMantra(e.target.value)}
                  className="w-full bg-[#04020e] border border-cyan-500/50 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-300 text-xs"
                  placeholder="Ej: Solo yo puedo cambiar mi destino"
                />
              </div>

              {/* Tratamiento e Identidad de Género */}
              <div>
                <label className="block text-xs font-anton text-cyan-300 uppercase tracking-wider mb-1.5">
                  Tratamiento y Estilo en el Sistema
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setGenderPreference('universal');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-mono transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                      genderPreference === 'universal'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.25)] font-bold'
                        : 'bg-[#020710] border-slate-700/60 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-sm">✨</span>
                    <span>Universal</span>
                    <span className="text-[9px] text-slate-400 font-sans">Neutral / Esencia</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setGenderPreference('feminine');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-mono transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                      genderPreference === 'feminine'
                        ? 'bg-pink-500/20 border-pink-400 text-pink-300 shadow-[0_0_12px_rgba(244,63,94,0.25)] font-bold'
                        : 'bg-[#020710] border-slate-700/60 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-sm">🏹</span>
                    <span>Femenino</span>
                    <span className="text-[9px] text-slate-400 font-sans">Títulos femeninos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setGenderPreference('masculine');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-mono transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                      genderPreference === 'masculine'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-bold'
                        : 'bg-[#020710] border-slate-700/60 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-sm">🗡️</span>
                    <span>Masculino</span>
                    <span className="text-[9px] text-slate-400 font-sans">Títulos masculinos</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-mono mt-1.5">
                  Arquetipo en tu perfil: <span className="text-cyan-300 font-semibold">{getArchetypeTitle(currentArchetype, genderPreference)}</span>
                </p>
              </div>

              {/* Cloud Account Linking */}
              <div className="p-3.5 rounded-2xl bg-[#040e1b] border border-cyan-500/40">
                <span className="text-[11px] font-anton text-cyan-300 uppercase tracking-wider block mb-2">
                  2. Vinculación de Cuenta de Google (Recomendado)
                </span>
                {user ? (
                  <div className="flex items-center gap-2.5 bg-[#020710] p-2.5 rounded-xl border border-emerald-500/40 text-emerald-300 text-xs font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">Conectado a Google: <strong>{user.email}</strong></span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#020710] p-3 rounded-xl border border-cyan-500/20">
                    <p className="text-[11px] text-slate-300 font-mono">
                      Vincula tu cuenta de Google ahora para sincronizar en tiempo real y no perder datos.
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        soundFX.playClick();
                        if (signInWithGoogle) await signInWithGoogle();
                      }}
                      className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-anton uppercase text-[11px] rounded-xl transition-all shadow-[0_0_12px_rgba(0,240,255,0.3)] shrink-0 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <LogIn className="w-3.5 h-3.5 fill-black" />
                      <span>Conectar Google</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-[#020b14]/70 p-3 rounded-xl border border-cyan-500/20 text-[11px] font-mono text-slate-400">
                💡 <span className="text-cyan-300">Nota:</span> Tu avatar personalizado, foto de perfil y biografía se pueden modificar exclusivamente en <strong>"Editar Perfil"</strong> en cualquier momento.
              </div>
            </div>
          )}

          {/* ════════════════════════════ PASO 4: CEREMONIA FINAL DE DESPERTAR ════════════════════════════ */}
          {step === 4 && (
            <div className="space-y-5 text-center py-2 animate-in fade-in zoom-in-95 duration-300">
              {/* KAI Centerpiece Showcase */}
              <div className="inline-block p-4 sm:p-6 rounded-3xl bg-cyan-950/60 border-2 border-cyan-400 shadow-[0_0_50px_rgba(0,240,255,0.55)]">
                <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mx-auto">
                  <KaiVectorGraphics 
                    shapeId={selectedKaiShape} 
                    activeColor="#00f0ff"
                    secondaryColor="#0284c7"
                    glowFilterId="awakening-kai-final"
                  />
                </div>
              </div>

              <div>
                <span className="text-xs font-mono uppercase text-cyan-400 tracking-widest font-bold block mb-1">
                  [SISTEMA DE CALIBRACIÓN: 100% SINCRONIZADO]
                </span>
                <h3 className="text-xl sm:text-2xl font-anton uppercase text-white tracking-wide">
                  ¡DESPERTAR CONFIRMADO!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 font-mono mt-1">
                  Te damos la bienvenida al Sistema, <strong className="text-cyan-300">@{username || 'Operador'}</strong>
                </p>
              </div>

              {/* Dossier Summary */}
              <div className="max-w-md mx-auto p-4 rounded-2xl bg-[#040e1b] border border-cyan-500/50 shadow-[0_0_20px_rgba(0,240,255,0.2)] text-left space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-cyan-500/30">
                  <span className="text-slate-400">Compañero KAI:</span>
                  <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                    <span>{currentKaiShapeDef.icon}</span>
                    <span>{currentKaiShapeDef.name}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-cyan-500/30">
                  <span className="text-slate-400">Arquetipo Activo:</span>
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <span>{currentArchetype.avatar}</span>
                    <span>{getArchetypeTitle(currentArchetype, genderPreference)}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-cyan-500/30">
                  <span className="text-slate-400">Bono Pasivo:</span>
                  <span className="text-amber-300 font-bold">
                    {currentArchetype.statBonus}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-cyan-500/30">
                  <span className="text-slate-400">Rango Inicial:</span>
                  <span className="text-cyan-400 font-bold flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    Fase 1: Chispazo de Voluntad (Nv. 1)
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 text-emerald-300 font-bold">
                  <span>Recompensa Inicial del Sistema:</span>
                  <span className="flex items-center gap-1">
                    <span>+50 XP</span>
                    <span>•</span>
                    <span>+25 🪙</span>
                  </span>
                </div>
              </div>

              <div className="bg-[#020b14]/70 p-3 rounded-xl border border-cyan-500/20 max-w-md mx-auto text-[11px] font-mono text-slate-400">
                ✨ Tu KAI evolucionará desbloqueando Auras a los 21 días y Chasis Supremo a los 66 días.
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-4 border-t border-cyan-500/40 bg-[#04020e] flex items-center justify-between gap-3 shrink-0">
          {step === 1 && (
            <>
              <div className="text-[11px] font-mono text-slate-400">
                Paso 1 de 4: Elegir KAI
              </div>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setStep(2);
                }}
                className="py-3 px-6 bg-cyan-500 hover:bg-cyan-400 text-black font-anton uppercase text-xs sm:text-sm rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Siguiente: Elegir Arquetipo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setStep(1);
                }}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a KAI</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setStep(3);
                }}
                className="py-3 px-6 bg-cyan-500 hover:bg-cyan-400 text-black font-anton uppercase text-xs sm:text-sm rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Siguiente: Identidad</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setStep(2);
                }}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a Arquetipo</span>
              </button>

              <button
                type="button"
                onClick={handleNextStepFromIdentity}
                className="py-3 px-6 bg-cyan-500 hover:bg-cyan-400 text-black font-anton uppercase text-xs sm:text-sm rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Confirmar y Calibrar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 4 && (
            <div className="w-full flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setStep(3);
                }}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Modificar</span>
              </button>

              <button
                type="button"
                onClick={handleFinalAwakening}
                className="flex-1 py-3.5 bg-gradient-to-r from-cyan-400 via-cyan-500 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-anton uppercase text-sm sm:text-base tracking-wider rounded-xl shadow-[0_0_30px_rgba(0,240,255,0.6)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Zap className="w-5 h-5 fill-black" />
                <span>INGRESAR AL SISTEMA</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
