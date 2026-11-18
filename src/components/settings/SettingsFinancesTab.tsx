import React from 'react';
import { Coins, Wallet, CheckCircle2, Target, ArrowUpRight } from 'lucide-react';
import { GameSettings } from '../../types';
import { SUPPORTED_CURRENCIES } from '../../utils/finance';
import { ChicleToggle } from '../ChicleToggle';
import { soundFX } from '../../utils/audio';

interface SettingsFinancesTabProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  currentCurrency: string;
  onSelectCurrency: (symbol: string, name: string) => void;
  savingsTarget: number;
  onSelectSavingsTarget: (rate: number) => void;
}

export const SettingsFinancesTab: React.FC<SettingsFinancesTabProps> = ({
  settings,
  onUpdateSettings,
  currentCurrency,
  onSelectCurrency,
  savingsTarget,
  onSelectSavingsTarget,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="w-full relative isolate rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] p-5 sm:p-6 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden space-y-6">
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

        {/* HEADER DE TESORERÍA */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
          <div>
            <h3 className="text-sm font-anton uppercase tracking-wider text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" /> Finanzas & Tesorería
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configura la divisa base para registros diarios, balances y análisis temporal.
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-400/50 text-emerald-300 font-mono font-black text-xs">
            {currentCurrency} Activo
          </span>
        </div>

        {/* TOGGLE MODULAR: TESORERÍA EN MISIONES */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#040814]/80 border border-white/10 relative z-10">
          <div className="space-y-0.5 pr-4">
            <div className="text-xs font-anton tracking-wider text-white uppercase flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              Módulo de Tesorería en Misiones
            </div>
            <p className="text-xs text-slate-400">
              Muestra el balance rápido en Misiones. Desactívalo para una vista 100% enfocada solo en tareas.
            </p>
          </div>
          <ChicleToggle
            checked={settings.enableFinanceModule ?? true}
            onChange={(val) => {
              soundFX.playClick();
              onUpdateSettings({ ...settings, enableFinanceModule: val });
            }}
            color="emerald"
            size="md"
            ariaLabel="Alternar Módulo de Tesorería en Misiones"
          />
        </div>

        {/* SELECTOR COMPACTO DE MONEDA */}
        <div className="relative z-10">
          <label className="block text-xs font-anton text-slate-300 uppercase tracking-wider mb-2">
            Divisa Principal del Sistema
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SUPPORTED_CURRENCIES.map((c) => {
              const isSelected = currentCurrency === c.symbol;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => onSelectCurrency(c.symbol, c.name)}
                  className={`chicle-btn p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-[0_0_12px_rgba(52,211,153,0.28)] ring-1 ring-emerald-400 optic-active-card'
                      : 'bg-white/[0.04] border-white/10 text-slate-300 hover:border-white/20 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-mono font-black text-amber-300">{c.symbol}</span>
                      <span className="text-xs font-anton tracking-wider uppercase aura-text-soft">{c.code}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[120px]">{c.name}</div>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* META DE AHORRO */}
        <div className="pt-4 border-t border-white/10 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h4 className="text-xs font-anton text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 aura-text-primary" /> Objetivo Sugerido de Tasa de Ahorro
              </h4>
              <p className="text-xs text-slate-400">
                Porcentaje de referencia sobre tus ingresos para medir tu superávit en Estadísticas.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums font-black text-emerald-400 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/40 self-start sm:self-auto">
              {savingsTarget}% sugerido
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {[10, 15, 20, 30, 40, 50].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => onSelectSavingsTarget(rate)}
                className={`chicle-btn px-3.5 py-1.5 rounded-xl text-xs font-mono tabular-nums font-bold tracking-wider transition-all cursor-pointer ${
                  savingsTarget === rate
                    ? 'aura-btn-gradient optic-active-card'
                    : 'bg-white/[0.04] border border-white/15 text-slate-300 hover:text-white hover:border-white/30'
                }`}
              >
                {rate}%
              </button>
            ))}
          </div>
        </div>

        {/* INTEGRACIÓN MISIONES */}
        <div className="p-3.5 rounded-2xl bg-[#040814]/80 border border-white/10 flex items-start gap-3 relative z-10">
          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 shrink-0 mt-0.5">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-1">
            <div className="font-anton tracking-wider uppercase text-white">Acreditación Automática desde Tareas</div>
            <p className="text-slate-400 leading-relaxed">
              Las recompensas de tareas completadas se suman automáticamente al balance de tesorería.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
