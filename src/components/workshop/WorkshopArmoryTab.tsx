import React from 'react';
import { Shield, Lock } from 'lucide-react';
import { WorkshopAuraIntensityPanel } from './WorkshopAuraIntensityPanel';
import { soundFX } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';
import { notificationService } from '../../utils/notifications';
import { KaiAuraIntensity } from '../../types';

interface WorkshopArmoryTabProps {
  habits21Count: number;
  habits66Count: number;
  has21Days: boolean;
  has66Days: boolean;
  topStreak: number;
  currentParticle: string | undefined;
  currentAuraIntensity: KaiAuraIntensity;
  onSelectParticle: (id: string) => void;
  onSelectAuraIntensity: (intensity: KaiAuraIntensity) => void;
}

export const WorkshopArmoryTab: React.FC<WorkshopArmoryTabProps> = ({
  habits21Count,
  habits66Count,
  has21Days,
  has66Days,
  topStreak,
  currentParticle,
  currentAuraIntensity,
  onSelectParticle,
  onSelectAuraIntensity,
}) => {
  return (
    <div className="space-y-5">
      <div className="p-4 rounded-2xl bg-[#040814]/80 border aura-border-subtle flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-cyan-300" />
          <div>
            <span className="text-xs font-black uppercase text-cyan-300 block tracking-wide">
              Resplandor y Auras de KAI
            </span>
            <p className="text-[11px] text-slate-300">
              Los efectos avanzados se desbloquean con tu constancia real en hábitos (hitos de 21 y 66 días).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="text-amber-400 font-bold">{habits21Count}</span> a 21d ·{' '}
          <span className="text-amber-400 font-bold">{habits66Count}</span> a 66d
        </div>
      </div>

      {/* Selector de Intensidad del Aura (Contraluz + Rim Light) */}
      <WorkshopAuraIntensityPanel
        currentAuraIntensity={currentAuraIntensity}
        onSelectAuraIntensity={onSelectAuraIntensity}
      />

      {/* Grid de Efectos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            id: 'none',
            name: 'Presencia Pura',
            icon: '⚪',
            badge: 'CANÓNICO',
            desc: 'Silueta limpia y minimalista sin accesorios.',
            requiredStreak: 0,
          },
          {
            id: 'plasma_lightning',
            name: 'Rayos de Plasma',
            icon: '⚡',
            badge: 'ENFOQUE',
            desc: 'Arcos sutiles crepitando con energía mental.',
            requiredStreak: 0,
          },
          {
            id: 'hex_shield',
            name: 'Escudo Protector',
            icon: '🛡️',
            badge: 'DISCIPLINA',
            desc: 'Cúpula protectora con rejilla de colmena giratoria.',
            requiredStreak: 0,
          },
          {
            id: 'wings',
            name: 'Alas Vectoriales',
            icon: '🪽',
            badge: 'HÁBITO 21D',
            desc: 'Desplegadas al superar los 21 días de inercia neuronal.',
            requiredStreak: 21,
          },
          {
            id: 'hud_visor',
            name: 'Visor de Precisión',
            icon: '🎯',
            badge: 'HÁBITO 21D',
            desc: 'Retícula de concentración profunda y claridad.',
            requiredStreak: 21,
          },
          {
            id: 'matrix',
            name: 'Tormenta Digital',
            icon: '🟩',
            badge: 'HÁBITO 21D',
            desc: 'Cascadas de código fluyendo en estado de flujo puro.',
            requiredStreak: 21,
          },
          {
            id: 'solar',
            name: 'Corona & Orbes de Maestría',
            icon: '👑',
            badge: 'MAESTRÍA 66D',
            desc: 'Corona dorada conferida al consolidar un hábito en 66 días.',
            requiredStreak: 66,
          },
        ].map((item) => {
          const isUnlocked =
            item.requiredStreak === 0 ||
            (item.requiredStreak === 21 && has21Days) ||
            (item.requiredStreak === 66 && has66Days);
          const isEquipped = (currentParticle || 'none') === item.id;
          return (
            <div
              key={item.id}
              onClick={() => {
                if (!isUnlocked) {
                  soundFX.playClick();
                  triggerHaptic(20);
                  notificationService.triggerNotification(
                    '🔒 Resplandor Bloqueado',
                    `Mantén cualquier hábito por ${item.requiredStreak} días para desbloquear este resplandor de KAI. (Racha actual: ${topStreak}d)`,
                    '🛡️'
                  );
                  return;
                }
                onSelectParticle(item.id);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                !isUnlocked
                  ? 'bg-[#040814]/40 border-white/5 opacity-60 hover:opacity-80'
                  : isEquipped
                  ? 'bg-purple-950/40 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  : 'bg-[#040814] border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{item.icon}</span>
                  <span
                    className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold tracking-wider ${
                      !isUnlocked
                        ? 'text-slate-500 bg-white/5 border border-white/5'
                        : 'text-cyan-300 bg-cyan-950/70 border border-cyan-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{item.name}</span>
                  {!isUnlocked && <Lock className="w-3 h-3 text-slate-500" />}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  {item.desc}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between">
                {!isUnlocked ? (
                  <span className="text-[9px] font-mono text-slate-500">
                    {topStreak}/{item.requiredStreak}d racha
                  </span>
                ) : isEquipped ? (
                  <span className="text-[9px] font-mono text-purple-300 font-bold bg-purple-900/60 border border-purple-400/50 px-2 py-0.5 rounded">
                    Equipado
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectParticle(item.id);
                    }}
                    className="text-[9px] font-mono text-slate-300 hover:text-white px-2 py-0.5 rounded bg-white/10"
                  >
                    Equipar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
