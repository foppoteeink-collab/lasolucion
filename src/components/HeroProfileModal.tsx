import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  User, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  LogIn, 
  LogOut, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Mail, 
  Compass,
  Award
} from 'lucide-react';
import { PlayerStats } from '../types';
import { getRankForLevel } from '../data/defaults';
import { getArchetypeDisplayName } from '../data/archetypes';
import { useAuth } from '../context/AuthContext';
import { CloudSyncResult } from '../hooks/useCloudSync';
import { soundFX } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { KaiVectorGraphics } from './KaiVectorGraphics';
import { KAI_MULTIVERSE_STYLES, KAI_OFFICIAL_SHAPES } from '../data/kaiShapes';
import { useNarrativeCopy } from '../hooks/useNarrativeCopy';
import { AUTH_SECURITY_MICROCOPY } from '../data/narrativeCopy';

interface HeroProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  onUpdateStats?: (updater: PlayerStats | ((prev: PlayerStats) => PlayerStats)) => void;
  cloudSync?: CloudSyncResult;
  onOpenAwakening?: () => void;
  onOpenArchetypes?: () => void;
  onOpenKaiWorkshop?: () => void;
}

const QUICK_AVATARS = ['⚔️', '🛡️', '⚡', '👑', '🐺', '🐲', '🦅', '🥋', '🧠', '🎯', '🚀', '💎', '🧙', '🧘', '🔥', '🌟'];

export const HeroProfileModal: React.FC<HeroProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  stats, 
  onUpdateStats,
  cloudSync,
  onOpenAwakening,
  onOpenArchetypes,
  onOpenKaiWorkshop,
}) => {
  const { user, signInWithGoogle, signOut: authSignOut } = useAuth();
  const copy = useNarrativeCopy();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    avatarIcon: "",
    username: "",
    fullName: "",
    bio: "",
    age: "" as string | number,
    mainGoal: "",
    profession: "",
    mantra: ""
  });

  useEffect(() => {
    if (isOpen) {
      setEditForm({
        avatarIcon: stats.avatarIcon || "🛡️",
        username: stats.username || "",
        fullName: stats.fullName || "",
        bio: stats.bio || "",
        age: stats.age ?? "",
        mainGoal: stats.mainGoal || "",
        profession: stats.profession || "",
        mantra: stats.mantra || ""
      });
      setSyncFeedback(null);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, stats, onClose]);

  if (!isOpen) return null;

  const currentRank = getRankForLevel(stats.level || 1);

  const handleManualSync = async () => {
    if (!cloudSync?.forceSyncNow) return;
    setIsSyncing(true);
    setSyncFeedback(null);
    soundFX.playClick();
    triggerHaptic([20, 30]);
    try {
      const ok = await cloudSync.forceSyncNow();
      if (ok) {
        setSyncFeedback('¡Sincronizado exitosamente con la nube!');
      } else {
        setSyncFeedback('Sin cambios pendientes o fuera de línea.');
      }
    } catch {
      setSyncFeedback('Error al sincronizar.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 3500);
    }
  };

  const handleSave = () => {
    soundFX.playClick();
    triggerHaptic([30, 50, 40]);
    if (onUpdateStats) {
      onUpdateStats(prev => ({
        ...prev,
        avatarIcon: editForm.avatarIcon || prev.avatarIcon || '🛡️',
        username: editForm.username.trim(),
        fullName: editForm.fullName.trim(),
        age: editForm.age === "" ? undefined : Number(editForm.age),
        mainGoal: editForm.mainGoal.trim(),
        bio: editForm.bio.trim(),
        profession: editForm.profession.trim(),
        mantra: editForm.mantra.trim()
      }));
    }
    onClose();
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[180] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans portal-modal-root select-none pointer-events-auto"
      onClick={onClose}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="hero-profile-modal-title"
        className="w-full max-w-lg max-h-[90dvh] flex flex-col bg-[#030712]/95 border border-cyan-500/35 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(0,240,255,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] relative text-left overflow-hidden backdrop-blur-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Micrograno táctil Moxen Vidrio */}
        <span className="vi-grano opacity-5" aria-hidden="true" />

        {/* Luces de ambiente cyberpunk */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

        {/* Header Fijo */}
        <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-white/10 bg-[#010810]/80 shrink-0 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-950 to-[#021824] border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.35)] shrink-0">
              <Shield className="w-5 h-5 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
            </div>
            <div className="min-w-0">
              <h3 id="hero-profile-modal-title" className="font-anton text-cyan-300 uppercase tracking-wide text-sm sm:text-base truncate flex items-center gap-2">
                <span>Ficha de Identidad & Cuenta</span>
              </h3>
              <p className="text-[11px] text-cyan-300/80 font-mono mt-0.5 truncate">
                Nv. {stats.level || 1} • <span className="text-white font-semibold">{currentRank.title}</span>
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => {
              soundFX.playClick();
              onClose();
            }} 
            className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 ml-2 active:scale-95"
            title="Cerrar modal (Esc)"
            aria-label="Cerrar ficha de identidad"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-5 space-y-5 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500 scrollbar-track-transparent">

          {/* ──────────────── SECCIÓN 1: VINCULACIÓN DE CUENTA & NUBE ──────────────── */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#040e1b] border border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-anton text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-cyan-400" />
                Respaldo en la Nube & Cuenta
              </span>
              {user ? (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Conectado
                </span>
              ) : (
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 border border-amber-500/50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Modo Local
                </span>
              )}
            </div>

            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-[#020710] p-2.5 rounded-xl border border-cyan-500/20">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || "Usuario"} 
                      className="w-10 h-10 rounded-full border border-cyan-400 shrink-0" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-cyan-900/60 border border-cyan-400 flex items-center justify-center text-cyan-200 shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{user.displayName || 'Sesión Iniciada'}</p>
                    <p className="text-[11px] text-slate-300 font-mono truncate flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-cyan-400 shrink-0" />
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="flex-1 py-2 px-3 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 hover:border-cyan-300 text-cyan-300 text-xs font-mono font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-300' : ''}`} />
                    <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar con la Nube'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (authSignOut) {
                        authSignOut();
                        soundFX.playClick();
                      }
                    }}
                    className="py-2 px-3 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                    title="Cerrar sesión de Google"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Desvincular</span>
                  </button>
                </div>

                {syncFeedback && (
                  <p className="text-[11px] font-mono text-cyan-300 text-center bg-cyan-950/40 py-1 rounded-lg border border-cyan-500/30 animate-in fade-in">
                    {syncFeedback}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xs text-slate-300 font-mono leading-relaxed">
                  Tu progreso está guardado en este dispositivo (100% gratis, sin tarjeta de crédito). Conecta tu cuenta de Google cuando quieras para respaldar en la nube:
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    soundFX.playClick();
                    if (signInWithGoogle) {
                      await signInWithGoogle();
                    }
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-anton uppercase text-xs rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <LogIn className="w-4 h-4 fill-black" />
                  <span>Vincular Cuenta de Google</span>
                </button>
                <p className="text-[10.5px] font-mono text-emerald-300/90 text-center bg-emerald-950/30 border border-emerald-500/25 rounded-lg px-2.5 py-1.5 leading-snug">
                  {AUTH_SECURITY_MICROCOPY}
                </p>
              </div>
            )}
          </div>

          {/* ──────────────── SECCIÓN: COMPAÑERO KAI VINCULADO ──────────────── */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#040e1b] border border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-anton text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Compañero KAI Vinculado
              </span>
              {stats.kaiShape === 'custom' && stats.kaiCustomForm ? (
                <span className="text-[10px] font-mono text-fuchsia-300 bg-fuchsia-950/60 border border-fuchsia-500/50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  {copy.profileAiStudioLabel}
                </span>
              ) : (
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  Forma Cuántica Oficial
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#020710] p-3.5 rounded-xl border border-cyan-500/20">
              {/* Contenedor Holográfico del KAI */}
              <div className="w-20 h-20 shrink-0 relative flex items-center justify-center bg-black/60 rounded-2xl border border-cyan-500/30 p-1 shadow-[inset_0_0_15px_rgba(0,240,255,0.15)]">
                <KaiVectorGraphics
                  shapeId={stats.kaiShape || 'prism'}
                  activeColor="var(--color-aura-activa, #00f0ff)"
                  secondaryColor="#0284c7"
                  glowFilterId="profile-kai-companion"
                  has21Days={(stats.streakDays || 0) >= 21}
                  has66Days={(stats.streakDays || 0) >= 66}
                  ascensionCrystalsCount={stats.ascensionCrystals || 0}
                  customForm={stats.kaiCustomForm}
                />
              </div>

              {/* Info del Compañero */}
              <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                  <h4 className="text-sm font-bold text-white">
                    {stats.kaiShape === 'custom' && stats.kaiCustomForm
                      ? stats.kaiCustomForm.name
                      : (KAI_OFFICIAL_SHAPES.find(s => s.id === stats.kaiShape)?.name || 'KAI El Prisma')}
                  </h4>
                  {stats.kaiShape === 'custom' && stats.kaiCustomForm?.artStyle && (
                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-md bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/40">
                      {KAI_MULTIVERSE_STYLES.find(s => s.id === stats.kaiCustomForm?.artStyle)?.icon}{' '}
                      {stats.kaiCustomForm.artStyle}
                    </span>
                  )}
                </div>

                {stats.kaiShape === 'custom' && stats.kaiCustomForm?.personalityQuote ? (
                  <div className="p-2 rounded-lg bg-fuchsia-950/30 border border-fuchsia-500/30">
                    <p className="text-[11px] text-fuchsia-200 italic">
                      "{stats.kaiCustomForm.personalityQuote}"
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-300">
                    Entidad holográfica activa guiando tu disciplina, rutinas y crecimiento cuántico.
                  </p>
                )}

                {onOpenKaiWorkshop && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        onClose();
                        onOpenKaiWorkshop();
                      }}
                      className="text-[10px] font-mono font-bold text-cyan-300 hover:text-white px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 transition-all cursor-pointer inline-flex items-center gap-1 active:scale-95"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>Abrir Taller Cuántico de KAI →</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ──────────────── SECCIÓN 2: AVATAR DEL OPERADOR ──────────────── */}
          <div>
            <label className="block text-xs font-anton text-cyan-300 uppercase tracking-wider mb-2">
              Tu Avatar (Emoji o Símbolo)
            </label>
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-14 h-14 rounded-2xl bg-[#020d18] border border-cyan-400/80 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(0,240,255,0.35)] shrink-0">
                {editForm.avatarIcon || '👤'}
              </div>
              <div className="flex-1">
                <input 
                  type="text" 
                  aria-label="Emoji o símbolo de avatar"
                  value={editForm.avatarIcon} 
                  onChange={(e) => setEditForm({...editForm, avatarIcon: e.target.value})}
                  className="w-full bg-surface-modal border border-cyan-500/50 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-300 text-center text-xl font-mono transition-colors"
                  placeholder="Emoji"
                  maxLength={4}
                />
                <p className="text-[10px] text-slate-400 font-mono mt-1">Escribe un emoji o elige uno rápido abajo.</p>
              </div>
            </div>

            {/* Quick Emoji Bar */}
            <div className="flex items-center gap-1.5 flex-wrap p-2 rounded-xl bg-[#020710] border border-cyan-500/20">
              {QUICK_AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  aria-label={`Seleccionar avatar ${emoji}`}
                  aria-pressed={editForm.avatarIcon === emoji}
                  onClick={() => {
                    soundFX.playClick();
                    triggerHaptic(15);
                    setEditForm({ ...editForm, avatarIcon: emoji });
                  }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer ${
                    editForm.avatarIcon === emoji 
                      ? 'bg-cyan-950 border border-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.4)]' 
                      : 'hover:bg-white/10'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* ──────────────── SECCIÓN 3: DATOS PERSONALES & IDENTIDAD ──────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-anton text-cyan-300 uppercase tracking-wider mb-1.5">
                Nombre de Usuario (@handle)
              </label>
              <input 
                type="text" 
                value={editForm.username} 
                onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                className="w-full bg-surface-modal border border-cyan-500/50 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-300 transition-colors text-xs font-mono"
                placeholder="Ej: alex_dev"
              />
            </div>
            <div>
              <label className="block text-xs font-anton text-cyan-300 uppercase tracking-wider mb-1.5">
                Nombre Completo / Real
              </label>
              <input 
                type="text" 
                value={editForm.fullName} 
                onChange={(e) => setEditForm({...editForm, fullName: e.target.value})}
                className="w-full bg-surface-modal border border-cyan-500/50 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-300 transition-colors text-xs"
                placeholder="Ej: Alex Gómez"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-anton text-cyan-300 uppercase tracking-wider mb-1.5">
                Profesión / Ocupación
              </label>
              <input 
                type="text" 
                value={editForm.profession} 
                onChange={(e) => setEditForm({...editForm, profession: e.target.value})}
                className="w-full bg-surface-modal border border-cyan-500/50 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-300 transition-colors text-xs"
                placeholder="Ej: Desarrollador, Diseñador, Atleta"
              />
            </div>
            <div>
              <label className="block text-xs font-anton text-cyan-300 uppercase tracking-wider mb-1.5">
                Edad
              </label>
              <input 
                type="number" 
                value={editForm.age} 
                onChange={(e) => setEditForm({...editForm, age: e.target.value})}
                className="w-full bg-surface-modal border border-cyan-500/50 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-300 transition-colors text-xs"
                placeholder="Ej: 24"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-anton text-cyan-300 uppercase tracking-wider mb-1.5">
              Lema de Vida / Mantra
            </label>
            <input 
              type="text" 
              value={editForm.mantra} 
              onChange={(e) => setEditForm({...editForm, mantra: e.target.value})}
              className="w-full bg-surface-modal border border-cyan-500/50 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-300 transition-colors text-xs"
              placeholder="Ej: Levántate y vence cada día"
            />
          </div>

          <div>
            <label className="block text-xs font-anton text-cyan-300 uppercase tracking-wider mb-1.5">
              Objetivo Principal
            </label>
            <input 
              type="text" 
              value={editForm.mainGoal} 
              onChange={(e) => setEditForm({...editForm, mainGoal: e.target.value})}
              className="w-full bg-surface-modal border border-cyan-500/50 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-300 transition-colors text-xs"
              placeholder="Ej: Alcanzar Rango S y dominar la disciplina diaria"
            />
          </div>

          <div>
            <label className="block text-xs font-anton text-cyan-300 uppercase tracking-wider mb-1.5">
              Breve Biografía
            </label>
            <textarea 
              value={editForm.bio} 
              onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
              className="w-full bg-surface-modal border border-cyan-500/50 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-300 h-20 resize-none transition-colors text-xs"
              placeholder="Escribe unas líneas sobre quién eres y qué buscas conquistar en el Sistema..."
            />
          </div>

          {/* ──────────────── SECCIÓN 4: INFORMACIÓN DEL ARQUETIPO ACTIVO ──────────────── */}
          <div className="p-3 rounded-xl bg-[#020710] border border-cyan-500/20 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                {copy.profileArchetypeSectionTitle}:
              </span>
              <p className="text-xs font-anton text-cyan-300 uppercase truncate mt-0.5">
                {getArchetypeDisplayName(stats.characterClass)}
              </p>
            </div>
            {onOpenArchetypes && (
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onClose();
                  onOpenArchetypes();
                }}
                className="px-2.5 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/50 text-[10px] font-mono text-indigo-300 hover:text-white rounded-lg transition-all shrink-0 cursor-pointer active:scale-95"
              >
                {copy.profileSwitchArchetypeBtn}
              </button>
            )}
          </div>

          {/* ──────────────── SECCIÓN 5: ACCIÓN ONBOARDING / DESPERTAR ──────────────── */}
          {onOpenAwakening && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  onClose();
                  onOpenAwakening();
                }}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-200 underline decoration-cyan-500/40 hover:decoration-cyan-300 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{copy.profileRepeatSetupCta}</span>
              </button>
            </div>
          )}

        </div>

        {/* ============================================================== */}
        {/* PINNED STICKY FOOTER (ERGONOMÍA DEL PULGAR)                    */}
        {/* ============================================================== */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-[#010810]/90 shrink-0 space-y-2 relative z-10">
          <div className="flex items-center gap-2.5">
            <button 
              type="button"
              onClick={() => {
                soundFX.playClick();
                onClose();
              }}
              aria-label="Volver y cerrar ficha de identidad"
              className="flex-1 sm:flex-none sm:px-6 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white font-anton uppercase text-xs tracking-wider transition-all cursor-pointer active:scale-95 text-center"
            >
              Volver
            </button>
            <button 
              type="button"
              onClick={handleSave}
              aria-label="Guardar cambios de la ficha de identidad"
              className="flex-[2] py-2.5 px-4 bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-anton uppercase tracking-wider text-xs sm:text-sm rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all cursor-pointer active:scale-95 text-center chicle-btn font-bold"
            >
              Guardar Cambios
            </button>
          </div>
          <p className="text-[10px] font-mono text-emerald-300/85 text-center leading-snug">
            {AUTH_SECURITY_MICROCOPY}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};
