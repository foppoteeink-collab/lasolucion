import React from 'react';
import { Network, ShieldAlert, BrainCircuit, Activity, Lock, Unlock, Zap, Gem } from 'lucide-react';
import { SkillNode, PlayerStats } from '../types';

interface SkillTreeAndSettingsProps {
  skillTree: SkillNode[];
  onUpdateSkillTree: (newTree: SkillNode[]) => void;
  stats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
}

export const SkillTreeAndSettings: React.FC<SkillTreeAndSettingsProps> = ({
  skillTree,
  onUpdateSkillTree,
  stats,
  onUpdateStats,
}) => {

  const handlePurchaseSkill = (skill: SkillNode) => {
    if (skill.isUnlocked || stats.coins < skill.costCoins) return;

    // Deduct coins
    onUpdateStats({
      ...stats,
      coins: stats.coins - skill.costCoins,
    });

    // Unlock skill
    const newTree = skillTree.map(s => s.id === skill.id ? { ...s, isUnlocked: true } : s);
    onUpdateSkillTree(newTree);
  };

  return (
    <div className="space-y-6 pb-20 text-white">
      <div className="flex items-center justify-between scifi-glass-panel p-4 rounded-2xl">
        <h2 className="text-white font-anton text-lg sm:text-xl px-1 flex items-center gap-2 uppercase tracking-wide">
          <BrainCircuit className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.7)]" /> Laboratorio de Maestría & Habilidades
        </h2>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between scifi-glass-panel p-4.5 rounded-2xl gap-4">
           <div className="text-center sm:text-left">
             <p className="text-cyan-300 font-anton text-base tracking-wide uppercase">Puntos de Investigación Disponibles</p>
             <p className="text-[11px] text-cyan-300/80 font-medium">Usa tus monedas de oro para desbloquear talentos y mejoras pasivas de cazador.</p>
           </div>
           <div className="flex items-center gap-2 bg-[#04020e] px-4 py-2 rounded-xl border border-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
             <Gem className="w-5 h-5 text-amber-400" />
             <span className="text-2xl font-anton text-amber-300 font-mono">{stats.coins}</span>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {skillTree.map(skill => (
            <div 
              key={skill.id} 
              className={`relative p-5 rounded-2xl border transition-all overflow-hidden group ${
                skill.isUnlocked 
                  ? 'scifi-glass-panel border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.25)]' 
                  : 'bg-[#04020e]/90 border-cyan-500/30 hover:border-cyan-400/60 hover:shadow-[0_0_15px_rgba(0,240,255,0.15)]'
              }`}
            >
              {skill.isUnlocked && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none"></div>
              )}
              
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className={`p-3 rounded-2xl ${skill.isUnlocked ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-400/60' : 'bg-[#04020e] text-slate-400 border border-cyan-500/30'}`}>
                  {skill.effectType === 'streak_shield' ? <ShieldAlert className="w-6 h-6 text-amber-400" /> : 
                   skill.effectType === 'xp_multiplier' ? <Zap className="w-6 h-6 text-cyan-300" /> : 
                   <Activity className="w-6 h-6 text-cyan-400" />}
                </div>
                <div className="text-right">
                  {skill.isUnlocked ? (
                     <span className="inline-flex items-center gap-1 text-[10px] font-anton text-cyan-300 uppercase tracking-wider bg-cyan-950/80 px-2.5 py-1 rounded-md border border-cyan-400/60">
                       <Unlock className="w-3 h-3" /> Desbloqueado
                     </span>
                  ) : (
                     <span className="inline-flex items-center gap-1 text-[10px] font-anton text-slate-400 uppercase tracking-wider bg-[#04020e] px-2.5 py-1 rounded-md border border-cyan-500/30">
                       <Lock className="w-3 h-3" /> Bloqueado
                     </span>
                  )}
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="text-base font-anton uppercase tracking-wide mb-1 text-white">{skill.title}</h3>
                <p className="text-xs text-cyan-300/80 leading-relaxed mb-4 min-h-[40px]">{skill.description}</p>
              </div>

              {!skill.isUnlocked && (
                <button 
                  onClick={() => handlePurchaseSkill(skill)}
                  disabled={stats.coins < skill.costCoins}
                  className={`w-full py-2.5 rounded-xl text-xs font-anton flex items-center justify-center gap-2 uppercase tracking-wider transition-all cursor-pointer ${
                    stats.coins >= skill.costCoins
                      ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)] active:scale-95'
                      : 'bg-[#04020e] text-slate-500 border border-cyan-500/20 cursor-not-allowed'
                  }`}
                >
                  Investigar <Gem className="w-3.5 h-3.5" /> {skill.costCoins}
                </button>
              )}

              {skill.isUnlocked && (
                <div className="w-full py-2.5 rounded-xl text-xs font-anton text-center text-cyan-300 bg-cyan-950/80 border border-cyan-400/60 uppercase tracking-wider">
                  Activo Permanentemente
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
