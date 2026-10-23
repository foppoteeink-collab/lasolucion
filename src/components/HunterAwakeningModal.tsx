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
  X
} from 'lucide-react';
import { PlayerStats } from '../types';
import { JUNG_ARCHETYPES, JungArchetype, getArchetypeByName } from '../data/archetypes';
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
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states (Avatar is strictly excluded here; it belongs exclusively to Profile Edit)
  const [username, setUsername] = useState(
    stats.username && stats.username !== 'CazadorDelSistema' ? stats.username : ''
  );
  const [fullName, setFullName] = useState(stats.fullName || '');
  const [mantra, setMantra] = useState(stats.mantra || 'Levántate y vence');
  const [selectedArchName, setSelectedArchName] = useState(stats.characterClass || 'El Héroe');

  if (!isOpen) return null;

  const currentArchetype = getArchetypeByName(selectedArchName);

  const handleNextStep1 = () => {
    soundFX.playClick();
    if (!username.trim()) {
      setUsername('Operador_' + Math.floor(100 + Math.random() * 900));
    }
    setStep(2);
  };

  const handleSelectArch = (arch: JungArchetype) => {
    soundFX.playItemEquip();
    setSelectedArchName(arch.name);
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
        mantra: mantra.trim()
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
                <span className={`px-2.5 py-0.5 rounded-lg border font-bold transition-all ${
                  step === 1 ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.5)]' : 'bg-black/60 text-slate-400 border-white/10'
                }`}>
                  1. Identidad
                </span>
                <span className={`px-2.5 py-0.5 rounded-lg border font-bold transition-all ${
                  step === 2 ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.5)]' : 'bg-black/60 text-slate-400 border-white/10'
                }`}>
                  2. Arquetipo
                </span>
                <span className={`px-2.5 py-0.5 rounded-lg border font-bold transition-all ${
                  step === 3 ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.5)]' : 'bg-black/60 text-slate-400 border-white/10'
                }`}>
                  3. Despertar
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
          <div className="flex sm:hidden items-center justify-center gap-1.5 font-mono text-[10px] pt-1">
            <span className={`px-2 py-0.5 rounded-lg border font-bold ${
              step === 1 ? 'bg-cyan-500 text-black border-cyan-300' : 'bg-black/60 text-slate-400 border-white/10'
            }`}>
              1. Identidad
            </span>
            <span className={`px-2 py-0.5 rounded-lg border font-bold ${
              step === 2 ? 'bg-cyan-500 text-black border-cyan-300' : 'bg-black/60 text-slate-400 border-white/10'
            }`}>
              2. Arquetipo
            </span>
            <span className={`px-2 py-0.5 rounded-lg border font-bold ${
              step === 3 ? 'bg-cyan-500 text-black border-cyan-300' : 'bg-black/60 text-slate-400 border-white/10'
            }`}>
              3. Despertar
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-5 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500 scrollbar-track-transparent">

          {/* ════════════════════════════ STEP 1: IDENTIDAD & CUENTA ════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="bg-[#030d1a]/80 p-4 rounded-2xl border border-cyan-500/30">
                <p className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed">
                  Has sido elegido por el Sistema para romper la inercia diaria y construir hábitos de alto rendimiento. Ingresa tu nombre de usuario y vincula tu cuenta para que tu progreso quede blindado en la nube.
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
                  2. Vinculación de Cuenta (Recomendado)
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
                💡 <span className="text-cyan-300">Nota:</span> Tu avatar personalizado, foto de perfil y biografía se configuran exclusivamente en la sección <strong>"Editar Perfil"</strong> en cualquier momento.
              </div>
            </div>
          )}

          {/* ════════════════════════════ STEP 2: ARQUETIPOS JUNGIANOS ════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
              <div className="bg-[#030d1a]/80 p-3.5 rounded-2xl border border-cyan-500/30">
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                  El Sistema canaliza tu energía a través de un <strong className="text-cyan-300">Arquetipo Jungiano</strong>. Elige con cuál resuenas hoy para sintonizar a tu compañero holográfico KAI y activar tu bonificación pasiva:
                </p>
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
                                KAI: {arch.companion?.title} {arch.companion?.icon}
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

          {/* ════════════════════════════ STEP 3: CEREMONIA FINAL DE DESPERTAR ════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-6 text-center py-2 animate-in fade-in zoom-in-95 duration-300">
              <div className="inline-block p-4 sm:p-5 rounded-3xl bg-cyan-950/60 border-2 border-cyan-400 shadow-[0_0_40px_rgba(0,240,255,0.5)]">
                <Sparkles className="w-12 h-12 text-cyan-300 animate-pulse" />
              </div>

              <div>
                <span className="text-xs font-mono uppercase text-cyan-400 tracking-widest font-bold block mb-1">
                  [SISTEMA DE CALIBRACIÓN: SINCRONIZADO]
                </span>
                <h3 className="text-xl sm:text-2xl font-anton uppercase text-white tracking-wide">
                  ¡DESPERTAR CONFIRMADO!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 font-mono mt-1">
                  Bienvenido al Sistema, <strong className="text-cyan-300">@{username || 'Operador'}</strong>
                </p>
              </div>

              {/* Dossier */}
              <div className="max-w-md mx-auto p-4 rounded-2xl bg-[#040e1b] border border-cyan-500/50 shadow-[0_0_20px_rgba(0,240,255,0.2)] text-left space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-cyan-500/30">
                  <span className="text-slate-400">Arquetipo Activo:</span>
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <span>{currentArchetype.avatar}</span>
                    <span>{currentArchetype.name}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-cyan-500/30">
                  <span className="text-slate-400">Compañero Holográfico:</span>
                  <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                    <span>{currentArchetype.companion.icon}</span>
                    <span>{currentArchetype.companion.title}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-cyan-500/30">
                  <span className="text-slate-400">Bono Pasivo:</span>
                  <span className="text-amber-300 font-bold">
                    {currentArchetype.statBonus}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-cyan-500/30">
                  <span className="text-slate-400">Rango Asignado:</span>
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
                ✨ Podrás personalizar tu avatar con cualquier icono o emoji exclusivamente desde <strong className="text-cyan-300">"Editar Perfil"</strong>.
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-4 border-t border-cyan-500/40 bg-[#04020e] flex items-center justify-between gap-3 shrink-0">
          {step === 1 && (
            <>
              <div className="text-[11px] font-mono text-slate-400">
                Paso 1 de 3
              </div>
              <button
                type="button"
                onClick={handleNextStep1}
                className="py-3 px-6 bg-cyan-500 hover:bg-cyan-400 text-black font-anton uppercase text-xs sm:text-sm rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Siguiente: Sintonizar Arquetipo</span>
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
                <span>Volver</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setStep(3);
                }}
                className="py-3 px-6 bg-cyan-500 hover:bg-cyan-400 text-black font-anton uppercase text-xs sm:text-sm rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Confirmar Resonancia</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={handleFinalAwakening}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-400 via-cyan-500 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-anton uppercase text-sm sm:text-base tracking-wider rounded-xl shadow-[0_0_30px_rgba(0,240,255,0.6)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Zap className="w-5 h-5 fill-black" />
              <span>INGRESAR AL SISTEMA</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
