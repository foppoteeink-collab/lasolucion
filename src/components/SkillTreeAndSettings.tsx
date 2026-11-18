import React, { useState, useMemo } from 'react';
import { ShieldAlert, BrainCircuit, Activity, Lock, Unlock, Zap, Coins, Layers } from 'lucide-react';
import { SkillNode, PlayerStats } from '../types';
import { soundFX } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { TabHeader } from './common/TabHeader';

interface SkillTreeAndSettingsProps {
  skillTree: SkillNode[];
  onUpdateSkillTree: (newTree: SkillNode[]) => void;
  stats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats | ((prev: PlayerStats) => PlayerStats)) => void;
}

type SkillFilter = 'todos' | 'desbloqueados' | 'pendientes';

export const SkillTreeAndSettings: React.FC<SkillTreeAndSettingsProps> = ({
  skillTree,
  onUpdateSkillTree,
  stats,
  onUpdateStats,
}) => {
  const [activeFilter, setActiveFilter] = useState<SkillFilter>('todos');

  const unlockedCount = useMemo(() => skillTree.filter((s) => s.isUnlocked).length, [skillTree]);
  const pendingCount = useMemo(() => skillTree.filter((s) => !s.isUnlocked).length, [skillTree]);

  const filteredSkills = useMemo(() => {
    if (activeFilter === 'desbloqueados') return skillTree.filter((s) => s.isUnlocked);
    if (activeFilter === 'pendientes') return skillTree.filter((s) => !s.isUnlocked);
    return skillTree;
  }, [skillTree, activeFilter]);

  const handlePurchaseSkill = (skill: SkillNode) => {
    if (skill.isUnlocked || stats.coins < skill.costCoins) return;

    if (soundFX.playSuccess) {
      soundFX.playSuccess();
    } else {
      soundFX.playClick();
    }
    triggerHaptic(50);

    // Deduct coins and apply passive skill effects immediately
    onUpdateStats((prev) => ({
      ...prev,
      coins: Math.max(0, prev.coins - skill.costCoins),
      streakShields: skill.effectType === 'streak_shield' ? (prev.streakShields || 0) + 1 : prev.streakShields,
    }));

    // Unlock skill
    const newTree = skillTree.map(s => s.id === skill.id ? { ...s, isUnlocked: true } : s);
    onUpdateSkillTree(newTree);
  };

  return (
    <div className="space-y-5 pb-20 text-white">
      <TabHeader
        title="Laboratorio de Maestría & Habilidades"
        subtitle="Usa tus Monedas para desbloquear talentos y mejoras pasivas de tu perfil táctico."
        icon={<BrainCircuit className="w-5 h-5" />}
        rightSlot={
          <div
            className="flex items-center gap-2 bg-[#040814]/80 px-3.5 py-1.5 rounded-xl border border-amber-400/50"
            title="Monedas disponibles para investigar"
          >
            <Coins className="w-4 h-4 text-amber-400 stroke-[2.5]" />
            <span className="text-base sm:text-lg font-anton text-amber-300 font-mono tabular-nums">{stats.coins}</span>
            <span className="text-[10px] font-sans font-bold text-amber-400/80 hidden sm:inline">Monedas</span>
          </div>
        }
      >
        {/* Moxen Chip Menu Group for Lab Filtering */}
        <div
          className="mf-8-menu-chip-group mf-chip-group mf-chip-group--compact"
          role="listbox"
          aria-label="Filtro de habilidades del laboratorio"
        >
          <button
            type="button"
            role="option"
            aria-selected={activeFilter === 'todos'}
            onClick={() => { soundFX.playClick(); setActiveFilter('todos'); }}
            className={`chicle-btn mf-8-menu-chip-group__chip mf-chip mf-chip--sm ${
              activeFilter === 'todos' ? 'mf-8-menu-chip-group__chip--active mf-chip--active aura-bg-soft aura-border-primary aura-text-primary optic-active-card' : ''
            }`}
          >
            <Layers className={`w-3.5 h-3.5 ${activeFilter === 'todos' ? 'aura-text-primary' : 'aura-text-soft'}`} />
            <span>Todos</span>
            <span className="mf-chip__badge font-mono tabular-nums">{skillTree.length}</span>
          </button>

          <button
            type="button"
            role="option"
            aria-selected={activeFilter === 'desbloqueados'}
            onClick={() => { soundFX.playClick(); setActiveFilter('desbloqueados'); }}
            className={`chicle-btn mf-8-menu-chip-group__chip mf-chip mf-chip--sm ${
              activeFilter === 'desbloqueados' ? 'mf-8-menu-chip-group__chip--active mf-chip--active aura-bg-soft aura-border-primary aura-text-primary optic-active-card' : ''
            }`}
          >
            <Unlock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Activos</span>
            <span className="mf-chip__badge font-mono tabular-nums">{unlockedCount}</span>
          </button>

          <button
            type="button"
            role="option"
            aria-selected={activeFilter === 'pendientes'}
            onClick={() => { soundFX.playClick(); setActiveFilter('pendientes'); }}
            className={`chicle-btn mf-8-menu-chip-group__chip mf-chip mf-chip--sm ${
              activeFilter === 'pendientes' ? 'mf-8-menu-chip-group__chip--active mf-chip--active aura-bg-soft aura-border-primary aura-text-primary optic-active-card' : ''
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Por Investigar</span>
            <span className="mf-chip__badge font-mono tabular-nums">{pendingCount}</span>
          </button>
        </div>
      </TabHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredSkills.map((skill) => {
          const canAfford = stats.coins >= skill.costCoins;
          return (
            <div 
              key={skill.id} 
              className={`relative isolate p-5 rounded-2xl bg-[#040a1a]/[0.94] border shadow-[0_8px_30px_rgba(0,0,0,0.45)] transition-all overflow-hidden group flex flex-col justify-between ${
                skill.isUnlocked 
                  ? 'aura-border-primary aura-glow-subtle' 
                  : 'border-white/10 hover:border-white/25'
              }`}
            >
              <span className="vi-grano opacity-5" aria-hidden="true" />
              <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />
              
              <div>
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className={`p-3 rounded-2xl border ${
                    skill.isUnlocked
                      ? 'aura-bg-soft aura-border-primary aura-text-primary'
                      : 'bg-[#040814]/80 text-slate-400 border-white/10'
                  }`}>
                    {skill.effectType === 'streak_shield' ? <ShieldAlert className="w-6 h-6 text-amber-400" /> : 
                     skill.effectType === 'xp_multiplier' ? <Zap className="w-6 h-6 aura-text-primary" /> : 
                     <Activity className="w-6 h-6 aura-text-primary" />}
                  </div>
                  <div className="text-right">
                    {skill.isUnlocked ? (
                       <span className="inline-flex items-center gap-1 text-[10px] font-anton text-emerald-300 uppercase tracking-wider bg-emerald-500/15 px-2.5 py-1 rounded-lg border border-emerald-400/40">
                         <Unlock className="w-3 h-3" /> Desbloqueado
                       </span>
                    ) : (
                       <span className="inline-flex items-center gap-1 text-[10px] font-anton text-slate-400 uppercase tracking-wider bg-[#040814]/80 px-2.5 py-1 rounded-lg border border-white/10">
                         <Lock className="w-3 h-3" /> Bloqueado
                       </span>
                    )}
                  </div>
                </div>

                <div className="relative z-10">
                  <h3 className="text-base font-anton uppercase tracking-wide mb-1.5 text-white">{skill.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4 min-h-[40px]">{skill.description}</p>
                </div>
              </div>

              {!skill.isUnlocked && (
                <button 
                  type="button"
                  onClick={() => handlePurchaseSkill(skill)}
                  disabled={!canAfford}
                  className={`relative z-10 chicle-btn w-full py-2.5 rounded-xl text-xs font-anton flex items-center justify-center gap-2 uppercase tracking-wider transition-all ${
                    canAfford
                      ? 'aura-btn-gradient optic-active-card cursor-pointer'
                      : 'bg-black/40 text-slate-500 border border-white/10 cursor-not-allowed'
                  }`}
                >
                  <span>Investigar</span>
                  <Coins className={`w-3.5 h-3.5 ${canAfford ? '' : 'text-amber-400/60'}`} />
                  <span className="font-mono tabular-nums">{skill.costCoins}</span>
                </button>
              )}

              {skill.isUnlocked && (
                <div className="relative z-10 w-full py-2.5 rounded-xl text-xs font-anton text-center aura-bg-soft aura-border-subtle border uppercase tracking-wider optic-active-card">
                  Activo Permanentemente
                </div>
              )}
            </div>
          );
        })}

        {filteredSkills.length === 0 && (
          <div className="relative isolate col-span-full py-12 text-center text-slate-400 border border-dashed border-white/15 rounded-2xl bg-[#040a1a]/[0.94] overflow-hidden p-6">
            <span className="vi-grano opacity-5" aria-hidden="true" />
            <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />
            <div className="relative z-10">
              <BrainCircuit className="w-10 h-10 aura-text-primary opacity-60 mx-auto mb-2" />
              <p className="text-sm font-anton uppercase tracking-wider text-white">No hay habilidades en esta categoría</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {activeFilter === 'desbloqueados'
                  ? 'Aún no has investigado ninguna habilidad. ¡Usa tus monedas acumuladas para desbloquear talentos pasivos!'
                  : '¡Has completado todas las investigaciones de esta rama!'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

