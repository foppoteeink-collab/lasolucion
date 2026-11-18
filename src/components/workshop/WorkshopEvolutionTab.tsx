import React from 'react';
import { Crown, Sparkles, Palette } from 'lucide-react';
import { KAICompanion } from '../KAICompanion';
import { WorkshopAuraIntensityPanel } from './WorkshopAuraIntensityPanel';
import { KAI_AURAS_REGISTRY } from '../../data/kaiShapes';
import { KaiAuraIntensity } from '../../types';

interface WorkshopEvolutionTabProps {
  habits21Count: number;
  habits66Count: number;
  has21Days: boolean;
  has66Days: boolean;
  ascensionGrade: number;
  ascensionCrystals: number;
  topHabit: { id: string; title: string; streak: number } | null;
  topStreak: number;
  progress21: number;
  progress66: number;
  currentAuraIntensity: KaiAuraIntensity;
  currentAuraColor: string | undefined;
  onSelectAuraIntensity: (intensity: KaiAuraIntensity) => void;
  onSelectAura: (color: string) => void;
}

export const WorkshopEvolutionTab: React.FC<WorkshopEvolutionTabProps> = ({
  habits21Count,
  habits66Count,
  has21Days,
  has66Days,
  ascensionGrade,
  ascensionCrystals,
  topHabit,
  topStreak,
  progress21,
  progress66,
  currentAuraIntensity,
  currentAuraColor,
  onSelectAuraIntensity,
  onSelectAura,
}) => {
  return (
    <div className="space-y-6">
      {/* Resumen de Ascensión */}
      <div className="p-5 rounded-3xl bg-[#040a1a]/[0.94] border border-amber-500/40 shadow-[0_8px_28px_rgba(245,158,11,0.12)] flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 shrink-0 relative flex items-center justify-center bg-[#030712] rounded-2xl border border-amber-500/40 p-1 overflow-hidden"
            data-preserve-optic="true"
          >
            <KAICompanion
              size={60}
              interactive={false}
              auraColor={has66Days ? '#fbbf24' : undefined}
              auraIntensity={currentAuraIntensity}
            />
          </div>

          <div>
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
              Ascensión Cuántica
            </span>
            <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              <span>
                KAI{' '}
                {has66Days
                  ? `Grado ${ascensionGrade}`
                  : has21Days
                  ? 'Guardián 21d'
                  : 'Forma Inicial'}
              </span>
              {has66Days && <Crown className="w-4 h-4 text-amber-400" />}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 max-w-md">
              {has66Days
                ? `${habits66Count} hábitos dominados a 66 días. Cristales orbitales activos.`
                : has21Days
                ? 'Inercia de 21 días superada. Auras desbloqueadas.'
                : 'Alcanza 21 días de racha en un hábito para despertar auras.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-center p-3 rounded-2xl bg-black/50 border border-white/10 min-w-[90px]">
            <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
              21 Días
            </span>
            <span className="text-xl font-black text-purple-300 font-mono">
              {habits21Count}
            </span>
            <span className="text-[9px] text-slate-400 block">Hábitos</span>
          </div>

          <div className="text-center p-3 rounded-2xl bg-black/50 border border-amber-500/40 min-w-[90px]">
            <span className="text-[10px] font-mono text-amber-400 uppercase block font-bold">
              66 Días
            </span>
            <span className="text-xl font-black text-amber-300 font-mono">
              {habits66Count}
            </span>
            <span className="text-[9px] text-amber-400/80 block">Maestrías</span>
          </div>
        </div>
      </div>

      {/* Radar Kaizen de Neuroplasticidad & Automatismo */}
      <div className="p-4 rounded-2xl bg-[#040916] border border-cyan-500/30 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5 font-anton">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Radar de Inercia Kaizen{' '}
            {topHabit ? `(Hábito Líder: ${topHabit.title})` : ''}
          </span>
          <span className="text-[10px] font-mono text-slate-300">
            Racha activa:{' '}
            <strong className="text-amber-300">{topStreak} días</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
          {/* Umbral 21d */}
          <div className="p-3 rounded-xl bg-black/60 border border-purple-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-purple-300 font-bold">
                1. Adaptación (Maltz 21d)
              </span>
              <span className="text-slate-300">
                {Math.min(21, topStreak)}/21d ({progress21}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                style={{ width: `${progress21}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-400 block">
              {topStreak >= 21
                ? '✅ Circuito neuronal establecido. Auras desbloqueadas.'
                : `Faltan ${Math.max(0, 21 - topStreak)} días para consolidar la neuroplasticidad.`}
            </span>
          </div>

          {/* Umbral 66d */}
          <div className="p-3 rounded-xl bg-black/60 border border-amber-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-amber-300 font-bold">
                2. Automatismo (Lally 66d)
              </span>
              <span className="text-slate-300">
                {Math.min(66, topStreak)}/66d ({progress66}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                style={{ width: `${progress66}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-400 block">
              {topStreak >= 66
                ? '👑 Hábito maestro en piloto automático. Ascensión completa.'
                : `Faltan ${Math.max(0, 66 - topStreak)} días para automatismo permanente.`}
            </span>
          </div>
        </div>
      </div>

      {/* Selector de Intensidad del Aura (Contraluz + Rim Light) */}
      <WorkshopAuraIntensityPanel
        currentAuraIntensity={currentAuraIntensity}
        onSelectAuraIntensity={onSelectAuraIntensity}
      />

      {/* Selector de Auras Elementales Desbloqueadas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2">
            <Palette className="w-4 h-4 text-cyan-400" />
            <span>Auras Elementales Desbloqueadas por Hábitos</span>
          </h4>
          <span className="text-[10px] font-mono text-slate-400">
            {
              KAI_AURAS_REGISTRY.filter(
                (a) =>
                  a.requiredStreak === 0 ||
                  (a.requiredStreak === 21 && has21Days) ||
                  (a.requiredStreak === 66 && has66Days)
              ).length
            }{' '}
            de {KAI_AURAS_REGISTRY.length} Desbloqueadas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {KAI_AURAS_REGISTRY.map((aura) => {
            const isUnlocked =
              aura.requiredStreak === 0 ||
              (aura.requiredStreak === 21 && has21Days) ||
              (aura.requiredStreak === 66 && has66Days);
            const isEquipped = currentAuraColor === aura.color;

            return (
              <div
                key={aura.id}
                onClick={() => {
                  if (isUnlocked) onSelectAura(aura.color);
                }}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isUnlocked
                    ? 'bg-[#040814] border-white/10 hover:border-white/30 cursor-pointer'
                    : 'bg-black/30 border-white/5 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full shrink-0 shadow-md border flex items-center justify-center"
                    style={{
                      backgroundColor: `${aura.color}25`,
                      borderColor: aura.color,
                      boxShadow: `0 0 10px ${aura.glow}`,
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: aura.color }}
                    />
                  </div>

                  <div>
                    <span className="text-xs font-bold text-white block">
                      {aura.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {aura.requiredStreak === 0
                        ? 'Disponible Día 0'
                        : aura.requiredStreak === 21
                        ? 'Requiere Hábito 21d'
                        : 'Requiere Hábito 66d'}
                    </span>
                  </div>
                </div>

                {isUnlocked ? (
                  isEquipped ? (
                    <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">
                      Activa
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAura(aura.color);
                      }}
                      className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-mono font-bold text-slate-200"
                    >
                      Aplicar
                    </button>
                  )
                ) : (
                  <span className="text-[10px] font-mono text-slate-500">
                    🔒 Bloqueada
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
