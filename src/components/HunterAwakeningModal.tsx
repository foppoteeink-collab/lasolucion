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
  Bot
} from 'lucide-react';
import { PlayerStats, KaiShapeKey } from '../types';
import { JUNG_ARCHETYPES, JungArchetype, getArchetypeByName } from '../data/archetypes';
import { KAI_OFFICIAL_SHAPES, KaiShapeDefinition } from '../data/kaiShapes';
import { KaiVectorGraphics } from './KaiVectorGraphics';
import { soundFX } from '../utils/audio';
import { triggerShockwave } from '../utils/celebration';
import { useAuth } from '../context/AuthContext';
import { CloudSyncResult } from '../hooks/useCloudSync';

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
  const [username, setUsername] = useState(
    stats.username && stats.username !== 'CazadorDelSistema' ? stats.username : ''
  );
  const [fullName, setFullName] = useState(stats.fullName || '');
  const [mantra, setMantra] = useState(stats.mantra || 'Levántate y vence');

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
        kaiShape: selectedKaiShape
      });
    } catch (e) {
      console.error('onCompleteAwakening error', e);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-lg animate-in fade-in duration-300">
      <div 
        className="scifi-glass-panel border-2 border-cyan-400 rounded-3xl w-full max-w-3xl shadow-[0_0_60px_rgba(0,240,255,0.4)] flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden text-white"
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
                    Antes de ingresar al Sistema, debes elegir la geometría base de <strong>KAI</strong>. Todas las figuras están 100% desbloqueadas desde el Día 0 y evolucionarán con tus hábitos de 21 y 66 días:
                  </p>
                </div>
              </div>

              {/* 6 Formas Oficiales Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {KAI_OFFICIAL_SHAPES.map((shape) => {
                  const isSelected = selectedKaiShape === shape.id;
                  return (
                    <div
                      key={shape.id}
                      onClick={() => handleSelectKaiShape(shape)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                        isSelected
                          ? 'bg-gradient-to-b from-[#06182c] to-[#042838] border-cyan-300 shadow-[0_0_25px_rgba(0,240,255,0.45)] ring-1 ring-cyan-400'
                          : 'bg-[#030d17]/80 border-cyan-500/25 hover:border-cyan-400 hover:bg-[#041525]'
                      }`}
                    >
                      {/* Live SVG Vector Graphic Preview */}
                      <div className="w-full flex items-center justify-center py-2 relative">
                          <KaiVectorGraphics 
                            shapeId={shape.id} 
                            activeColor={isSelected ? '#00f0ff' : '#67e8f9'}
                            secondaryColor="#0284c7"
                            glowFilterId={`awakening-shape-${shape.id}`}
                          />
                      </div>

                      {/* Info & Metadata */}
                      <div className="pt-2 border-t border-cyan-500/20">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest">
                            {shape.codename}
                          </span>
                          <span className="text-[9px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 rounded">
                            {shape.themeTrait}
                          </span>
                        </div>

                        <h4 className="font-anton text-xs sm:text-sm uppercase tracking-wide text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                          <span>{shape.icon}</span>
                          <span>{shape.name}</span>
                        </h4>

                        <p className="text-[10px] text-slate-300 leading-snug font-sans mt-1 line-clamp-2">
                          {shape.description}
                        </p>
                      </div>

                      {/* Selection Pill */}
                      <div className="mt-2.5 pt-2 border-t border-cyan-500/15 flex items-center justify-between">
                        <span className="text-[9px] font-mono text-slate-400">
                          {shape.archetypeMatch}
                        </span>
                        {isSelected ? (
                          <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-cyan-300 bg-cyan-900/60 border border-cyan-400 px-2 py-0.5 rounded-lg shadow-[0_0_8px_rgba(0,240,255,0.4)]">
                            <Check className="w-3 h-3 text-cyan-300" />
                            Sintonizado
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-cyan-400/70 group-hover:text-cyan-300">
                            Elegir
                          </span>
                        )}
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
                <div className="text-[11px] text-slate-300 italic hidden sm:block">
                  "{currentKaiShapeDef.tagline}"
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════ PASO 2: ARQUETIPOS JUNGIANOS ════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
              <div className="bg-[#030d1a]/80 p-3.5 rounded-2xl border border-cyan-500/30 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-400 flex items-center justify-center text-xl shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.35)]">
                  🛡️
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-anton uppercase text-cyan-300 tracking-wider">
                    Canalización del Arquetipo Psicológico
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-200 leading-relaxed font-sans mt-0.5">
                    Tu compañero <strong>KAI ({currentKaiShapeDef.name})</strong> canalizará tu energía diaria a través de un <strong className="text-cyan-300">Arquetipo Jungiano</strong>. Elige con cuál resuenas para activar tu bonificación pasiva:
                  </p>
                </div>
              </div>

              {/* 12 Archetypes Grid */}
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
                        {/* Top: Glyph, Name & Stat Bonus */}
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

                        {/* Description */}
                        <p className="text-xs text-slate-200 leading-relaxed bg-black/40 p-2.5 rounded-xl border border-cyan-500/20 mb-2.5 font-sans">
                          {arch.description}
                        </p>

                        {/* Desire & Fear */}
                        <div className="space-y-1 text-[11px] font-mono">
                          <div className="flex items-start gap-1 text-cyan-300 bg-[#020b14]/60 p-1.5 rounded-lg border border-cyan-500/20">
                            <Target className="w-3.5 h-3.5 shrink-0 mt-0.5 text-cyan-400" />
                            <span><strong className="text-white">Deseo: </strong>{arch.desire}</span>
                          </div>
                          <div className="flex items-start gap-1 text-rose-300 bg-[#020b14]/60 p-1.5 rounded-lg border border-rose-500/20">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                            <span><strong className="text-white">Sombra: </strong>{arch.fear}</span>
                          </div>
                        </div>
                      </div>

                      {/* Selection Status */}
                      <div className="mt-3 pt-2 border-t border-cyan-500/20 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          Stat: <strong className="text-cyan-300 capitalize">{arch.primaryStat}</strong>
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
            </div>
          )}

          {/* ════════════════════════════ PASO 3: IDENTIDAD & CUENTA ════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="bg-[#030d1a]/80 p-4 rounded-2xl border border-cyan-500/30">
                <p className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed">
                  Con tu <strong>KAI ({currentKaiShapeDef.name})</strong> y tu <strong>Arquetipo ({currentArchetype.name})</strong> configurados, registra tu identidad de Operador para blindar tu progreso en la nube:
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
                    placeholder="Ej: Operador_Prime"
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
                    placeholder="Ej: Carlos Jin"
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
                  Bienvenido al Sistema, <strong className="text-cyan-300">@{username || 'Operador'}</strong>
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
                    <span>{currentArchetype.name}</span>
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
