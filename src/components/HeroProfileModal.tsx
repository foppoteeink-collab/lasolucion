import React, { useState, useEffect } from 'react';
import { X, User } from 'lucide-react';
import { PlayerStats } from '../types';
import { getArchetypeByName, JUNG_ARCHETYPES } from '../data/archetypes';
import { getRankForLevel } from '../data/defaults';
import { HoloCompanion } from './HoloCompanion';
import { ArchetypesModal } from './ArchetypesModal';

interface HeroProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  onUpdateStats?: (updater: PlayerStats | ((prev: PlayerStats) => PlayerStats)) => void;
}

export const HeroProfileModal: React.FC<HeroProfileModalProps> = ({ isOpen, onClose, stats, onUpdateStats }) => {
  const [showArchetypesGuide, setShowArchetypesGuide] = useState(false);
  const [editForm, setEditForm] = useState({
    avatarIcon: "",
    characterClass: "",
    rankTitle: "",
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
        avatarIcon: stats.avatarIcon || "",
        characterClass: stats.characterClass || "",
        rankTitle: stats.rankTitle || "",
        username: stats.username || "",
        fullName: stats.fullName || "",
        bio: stats.bio || "",
        age: stats.age || "",
        mainGoal: stats.mainGoal || "",
        profession: stats.profession || "",
        mantra: stats.mantra || ""
      });
    }
  }, [isOpen, stats]);

  if (!isOpen) return null;

  return (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
          onClick={onClose}
        >
          <div 
            className="scifi-glass-panel border-2 border-cyan-400 rounded-2xl w-full max-w-md shadow-[0_0_40px_rgba(0,240,255,0.3)] flex flex-col max-h-[88dvh] sm:max-h-[84vh] overflow-hidden text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header pinned */}
            <div className="p-4 border-b border-cyan-500/40 flex items-center justify-between bg-[#04020e] shrink-0">
              <div>
                <h3 className="font-anton text-cyan-300 uppercase tracking-wide text-sm">Editar Perfil del Héroe</h3>
                <p className="text-[11px] text-cyan-300/80 font-mono mt-0.5">
                  Nv. {stats.level} • <span className="text-white font-semibold">{getRankForLevel(stats.level).title}</span>
                </p>
              </div>
              <button 
                onClick={onClose} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Scrollable Form Body */}
            <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500 scrollbar-track-transparent">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-anton text-cyan-300 uppercase tracking-wider mb-2">Nombre de Usuario</label>
                  <input 
                    type="text" 
                    value={editForm.username} 
                    onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                    className="w-full bg-[#04020e] border border-cyan-500/50 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-300 transition-colors"
                    placeholder="Ej: Hunter_Jin"
                  />
                </div>
                <div>
                  <label className="block text-xs font-anton text-cyan-300 uppercase tracking-wider mb-2">Nombre Completo</label>
                  <input 
                    type="text" 
                    value={editForm.fullName} 
                    onChange={(e) => setEditForm({...editForm, fullName: e.target.value})}
                    className="w-full bg-[#04020e] border border-cyan-500/50 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-300 transition-colors"
                    placeholder="Ej: Sung Jin-Woo"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-anton text-cyan-300 uppercase tracking-wider mb-2">Profesión / Clase</label>
                  <input 
                    type="text" 
                    value={editForm.profession} 
                    onChange={(e) => setEditForm({...editForm, profession: e.target.value})}
                    className="w-full bg-[#04020e] border border-cyan-500/50 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-300 transition-colors"
                    placeholder="Ej: Desarrollador, Arquitecto"
                  />
                </div>
                <div>
                  <label className="block text-xs font-anton text-cyan-300 uppercase tracking-wider mb-2">Mantra / Lema</label>
                  <input 
                    type="text" 
                    value={editForm.mantra} 
                    onChange={(e) => setEditForm({...editForm, mantra: e.target.value})}
                    className="w-full bg-[#04020e] border border-cyan-500/50 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-300 transition-colors"
                    placeholder="Ej: Levántate y vence"
                  />
                </div>
                <div>
                  <label className="block text-xs font-anton text-cyan-300 uppercase tracking-wider mb-2">Edad</label>
                  <input 
                    type="number" 
                    value={editForm.age} 
                    onChange={(e) => setEditForm({...editForm, age: e.target.value})}
                    className="w-full bg-[#04020e] border border-cyan-500/50 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-300 transition-colors"
                    placeholder="Ej: 24"
                  />
                </div>
                <div>
                  <label className="block text-xs font-anton text-cyan-300 uppercase tracking-wider mb-2">Objetivo Principal</label>
                  <input 
                    type="text" 
                    value={editForm.mainGoal} 
                    onChange={(e) => setEditForm({...editForm, mainGoal: e.target.value})}
                    className="w-full bg-[#04020e] border border-cyan-500/50 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-300 transition-colors"
                    placeholder="Ej: Alcanzar Rango S"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-anton text-cyan-300 uppercase tracking-wider mb-2">Breve Biografía</label>
                <textarea 
                  value={editForm.bio} 
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  className="w-full bg-[#04020e] border border-cyan-500/50 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-300 h-24 resize-none transition-colors"
                  placeholder="El jugador que avanza cada día a través del sistema..."
                />
              </div>

              {/* Class & Archetype Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-anton text-cyan-300 uppercase tracking-wider">Holograma & Arquetipo Base</label>
                  <button
                    type="button"
                    onClick={() => setShowArchetypesGuide(true)}
                    className="text-[10px] font-mono text-cyan-300 hover:text-white px-2.5 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 hover:border-cyan-300 cursor-pointer transition-all shadow-xs flex items-center gap-1 active:scale-95"
                  >
                    <span>Ver Fichas Detalladas</span>
                  </button>
                </div>

                {/* Holographic Preview & Full Archetype Explanation */}
                {(() => {
                  const selectedArch = getArchetypeByName(editForm.characterClass || 'El Héroe');
                  return (
                    <div className="mb-3 p-3.5 rounded-2xl bg-[#04020e] border border-cyan-500/50 shadow-[0_0_20px_rgba(0,240,255,0.18)]">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0">
                          <HoloCompanion archetype={selectedArch.name} size="sm" showHUD={false} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="text-[10px] font-mono text-cyan-300 uppercase font-bold tracking-wider">
                              Compañero: {selectedArch.companion?.title || 'KAI'} {selectedArch.companion?.icon}
                            </span>
                            <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold shrink-0">
                              {selectedArch.statBonus}
                            </span>
                          </div>
                          <div className="text-sm font-anton text-white truncate mt-1 flex items-center gap-1.5">
                            <span className="text-base">{selectedArch.avatar}</span>
                            <span>{selectedArch.name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Archetype Deep Explanation */}
                      <div className="mt-3 pt-2.5 border-t border-cyan-500/30 space-y-2">
                        <p className="text-xs text-slate-200 leading-relaxed bg-[#020b14]/80 p-2.5 rounded-xl border border-cyan-500/20 font-sans">
                          {selectedArch.description}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-mono">
                          <div className="bg-[#020b14]/60 p-2 rounded-lg border border-cyan-500/20 text-cyan-300">
                            <span className="font-bold text-white">🎯 Deseo: </span>
                            <span>{selectedArch.desire}</span>
                          </div>
                          <div className="bg-[#020b14]/60 p-2 rounded-lg border border-rose-500/20 text-rose-300">
                            <span className="font-bold text-white">⚠️ Miedo: </span>
                            <span>{selectedArch.fear}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 12 Archetypes Grid */}
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-cyan-500">
                  {JUNG_ARCHETYPES.map(arch => (
                    <div 
                      key={arch.id}
                      onClick={() => setEditForm({ ...editForm, characterClass: arch.name, avatarIcon: arch.avatar })}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                        editForm.characterClass === arch.name 
                          ? 'bg-cyan-950/90 border-cyan-300 text-white shadow-[0_0_15px_rgba(0,240,255,0.5)] ring-1 ring-cyan-400' 
                          : 'bg-[#04020e] border-cyan-500/30 text-slate-300 hover:bg-cyan-950/40 hover:border-cyan-400'
                      }`}
                    >
                      <span className="text-2xl mb-1">{arch.avatar}</span>
                      <span className="text-[11px] font-anton text-white tracking-wide">{arch.name}</span>
                      <span className="text-[9px] font-mono text-cyan-300/80 mt-0.5">{arch.statBonus}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avatar Emoji Select */}
              <div>
                <label className="block text-xs font-anton text-cyan-300 uppercase tracking-wider mb-2">Avatar Personalizado (Emoji)</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#04020e] flex items-center justify-center text-2xl border border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                    {editForm.avatarIcon || <User className="text-slate-500" />}
                  </div>
                  <input 
                    type="text" 
                    value={editForm.avatarIcon} 
                    onChange={(e) => setEditForm({...editForm, avatarIcon: e.target.value})}
                    className="flex-1 bg-[#04020e] border border-cyan-500/50 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-300 text-center text-xl transition-colors font-mono"
                    placeholder="Escribe un Emoji (ej: ⚔️)"
                    maxLength={2}
                  />
                </div>
                <p className="text-[10px] text-cyan-300/70 mt-2 font-mono">Personaliza tu avatar con cualquier icono o emoji de cazador.</p>
              </div>

            </div>

            {/* Footer pinned */}
            <div className="p-4 border-t border-cyan-500/40 bg-[#04020e] shrink-0">
              <button 
                onClick={() => {
                  if (onUpdateStats) {
                    onUpdateStats(prev => ({
                      ...prev,
                      avatarIcon: editForm.avatarIcon,
                      username: editForm.username,
                      fullName: editForm.fullName,
                      age: editForm.age === "" ? undefined : Number(editForm.age),
                      mainGoal: editForm.mainGoal,
                      bio: editForm.bio,
                      characterClass: editForm.characterClass,
                      profession: editForm.profession,
                      mantra: editForm.mantra
                    }));
                  }
                  onClose();
                }}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl font-anton uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all cursor-pointer active:scale-95 text-xs sm:text-sm"
              >
                Guardar Cambios
              </button>
            </div>
          </div>

          <ArchetypesModal
            isOpen={showArchetypesGuide}
            onClose={() => setShowArchetypesGuide(false)}
            currentArchetype={editForm.characterClass || 'El Héroe'}
            onSelectArchetype={(arch) => {
              setEditForm(prev => ({
                ...prev,
                characterClass: arch.name,
                avatarIcon: arch.avatar
              }));
            }}
          />
        </div>
  );
};
