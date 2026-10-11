import React, { useMemo } from 'react';
import { X, ShieldAlert, Skull, Trophy, Zap, Flame, Award, Swords } from 'lucide-react';
import { DAILY_BOSSES, WEEKLY_RAID_BOSS, BossInfo } from './DailyBossWidget';
import { OrbitCardStack, OrbitStackItem } from './ui/orbit-card-stack';
import { soundFX } from '../utils/audio';
import { triggerShockwave } from '../utils/celebration';

interface DungeonGatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBoss?: (boss: BossInfo) => void;
}

interface DungeonGate {
  id: string;
  rank: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  name: string;
  gateTitle: string;
  boss: BossInfo;
  accent: string;
  isToday: boolean;
  isWeeklyRaid: boolean;
}

export const DungeonGatesModal: React.FC<DungeonGatesModalProps> = ({
  isOpen,
  onClose,
  onSelectBoss,
}) => {
  const todayDayIndex = new Date().getDay();

  const gates: DungeonGate[] = useMemo(() => {
    const list: DungeonGate[] = [
      {
        id: 'gate-e',
        rank: 'E',
        name: DAILY_BOSSES[0].name,
        gateTitle: 'Puerta Rango E: ' + DAILY_BOSSES[0].title,
        boss: DAILY_BOSSES[0],
        accent: '#38bdf8',
        isToday: todayDayIndex === 0,
        isWeeklyRaid: false,
      },
      {
        id: 'gate-d',
        rank: 'D',
        name: DAILY_BOSSES[1].name,
        gateTitle: 'Puerta Rango D: ' + DAILY_BOSSES[1].title,
        boss: DAILY_BOSSES[1],
        accent: '#34d399',
        isToday: todayDayIndex === 1,
        isWeeklyRaid: false,
      },
      {
        id: 'gate-c',
        rank: 'C',
        name: DAILY_BOSSES[2].name,
        gateTitle: 'Puerta Rango C: ' + DAILY_BOSSES[2].title,
        boss: DAILY_BOSSES[2],
        accent: '#facc15',
        isToday: todayDayIndex === 2,
        isWeeklyRaid: false,
      },
      {
        id: 'gate-b',
        rank: 'B',
        name: DAILY_BOSSES[3].name,
        gateTitle: 'Puerta Rango B: ' + DAILY_BOSSES[3].title,
        boss: DAILY_BOSSES[3],
        accent: '#fb923c',
        isToday: todayDayIndex === 3,
        isWeeklyRaid: false,
      },
      {
        id: 'gate-a',
        rank: 'A',
        name: DAILY_BOSSES[4].name,
        gateTitle: 'Puerta Rango A: ' + DAILY_BOSSES[4].title,
        boss: DAILY_BOSSES[4],
        accent: '#a855f7',
        isToday: todayDayIndex === 4,
        isWeeklyRaid: false,
      },
      {
        id: 'gate-s',
        rank: 'S',
        name: WEEKLY_RAID_BOSS.name,
        gateTitle: 'Puerta Rango S (Raid): ' + WEEKLY_RAID_BOSS.title,
        boss: WEEKLY_RAID_BOSS,
        accent: '#ef4444',
        isToday: true,
        isWeeklyRaid: true,
      },
    ];
    return list;
  }, [todayDayIndex]);

  const defaultIndex = useMemo(() => {
    const todayGateIndex = gates.findIndex((g) => g.isToday && !g.isWeeklyRaid);
    return todayGateIndex >= 0 ? todayGateIndex : gates.length - 1;
  }, [gates]);

  const orbitItems: OrbitStackItem[] = useMemo(() => {
    return gates.map((gate) => ({
      id: gate.id,
      name: `${gate.boss.avatar} ${gate.name}`,
      role: gate.gateTitle,
      description: `${gate.boss.quote}\n\n🛡️ Debilidad: ${gate.boss.weaknessLabel} (Categoría: ${gate.boss.weaknessCategory}).`,
      avatarIcon: gate.boss.avatar,
      accent: gate.accent,
      badge: `RANGO ${gate.rank}`,
      stat: `+${gate.boss.bonusRewardXp} XP • +${gate.boss.bonusRewardCoins} 🪙`,
      desire: `HP: ${gate.boss.maxHp} Puntos de Daño Requeridos`,
      fear: gate.isToday ? '¡PORTAL ACTIVO HOY!' : 'Portal en Resonancia',
      actionLabel: 'Desafiar Jefe de Mazmorra',
      onAction: () => {
        soundFX.playAttack();
        triggerShockwave({ color: 'cyan', intensity: 'heavy' });
        if (onSelectBoss) onSelectBoss(gate.boss);
        onClose();
      },
    }));
  }, [gates, onSelectBoss, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="scifi-glass-panel border-2 border-red-500/80 rounded-2xl w-full max-w-3xl shadow-[0_0_40px_rgba(239,68,68,0.35)] flex flex-col max-h-[94dvh] sm:max-h-[90vh] overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-red-500/40 flex items-center justify-between bg-[#08020a] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-950/80 border border-red-500 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.5)] shrink-0">
              <Skull className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            </div>
            <div>
              <h3 className="font-anton text-red-400 uppercase tracking-wide text-xs sm:text-base flex items-center gap-1.5">
                <span>Portales de Mazmorra & Jefes del Sistema</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                  SOLO LEVELING
                </span>
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-300 font-mono mt-0.5">
                Gira el mazo 3D para inspeccionar las Puertas de Rango E a S y sus recompensas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3D Orbit Deck Stage */}
        <div className="p-2 sm:p-5 flex-1 overflow-y-auto flex flex-col items-center justify-center">
          <div className="w-full">
            <OrbitCardStack
              items={orbitItems}
              defaultActiveIndex={defaultIndex}
              spread={140}
              lift={36}
              showControls={true}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-red-500/40 bg-[#08020a] flex items-center justify-between shrink-0">
          <p className="text-[10px] sm:text-xs text-slate-400 font-mono">
            Inflije daño completando tareas diarias asociadas a la debilidad de cada jefe.
          </p>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-slate-800 hover:bg-slate-700 text-white font-anton uppercase text-xs rounded-xl cursor-pointer transition-all border border-slate-600 active:scale-95"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
