import React, { useState, useEffect, lazy, Suspense } from 'react';
import { 
  Settings, 
  Sparkles, 
  Database, 
  Coins, 
  Volume2, 
  Palette, 
  ChevronLeft, 
  CheckCheck 
} from 'lucide-react';
import { GameSettings } from '../types';
import { soundFX } from '../utils/audio';
import { CloudSyncResult } from '../hooks/useCloudSync';
import { useMoxenChicle } from '../hooks/useMoxenChicle';
import { useNarrativeCopy } from '../hooks/useNarrativeCopy';
import { TabHeader } from './common/TabHeader';
import { 
  getSavedCurrencySymbol, 
  setSavedCurrencySymbol, 
  getSavedSavingsTarget, 
  setSavedSavingsTarget 
} from '../utils/finance';

import { SettingsPreferencesTab } from './settings/SettingsPreferencesTab';
import { SettingsAtmosphereTab } from './settings/SettingsAtmosphereTab';
import { SettingsGameplayTab } from './settings/SettingsGameplayTab';
import { SettingsFinancesTab } from './settings/SettingsFinancesTab';
import { SettingsDataTab } from './settings/SettingsDataTab';
import { SettingsSimulatorTab } from './settings/SettingsSimulatorTab';

const OracleModal = lazy(() => import('./OracleModal').then((m) => ({ default: m.OracleModal })));

export interface SettingsViewProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onResetAccount?: () => void;
  cloudSync?: CloudSyncResult;
  onOpenKaiWorkshop?: () => void;
  onOpenOnboarding?: () => void;
}

export type SettingsSubTab = 'preferences' | 'atmosphere' | 'gameplay' | 'finances' | 'data' | 'simulator';

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetAccount,
  cloudSync,
  onOpenKaiWorkshop,
  onOpenOnboarding,
}) => {
  const chicleContainerRef = useMoxenChicle<HTMLDivElement>();
  const copy = useNarrativeCopy();

  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('preferences');
  const [currentCurrency, setCurrentCurrency] = useState<string>(getSavedCurrencySymbol);
  const [savingsTarget, setSavingsTarget] = useState<number>(getSavedSavingsTarget);
  const [currencyChangedToast, setCurrencyChangedToast] = useState<string | null>(null);
  const [isOracleOpen, setIsOracleOpen] = useState(false);

  const [pwaBuildInfo, setPwaBuildInfo] = useState<{
    localRev: string;
    serverRev: string | null;
    checking: boolean;
  }>(() => ({
    localRev: (typeof window !== 'undefined' && (window as any).__APP_BUILD_REV__) || localStorage.getItem('app_build_rev') || 'rev-local',
    serverRev: null,
    checking: true,
  }));

  useEffect(() => {
    let mounted = true;
    const verifyBuildRev = async () => {
      try {
        const res = await fetch('/api/build-rev?_cb=' + Date.now(), {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json') && mounted) {
          const data = await res.json();
          setPwaBuildInfo((prev) => ({
            ...prev,
            serverRev: data?.rev || prev.localRev,
            checking: false,
          }));
          return;
        }
      } catch {}
      if (mounted) {
        setPwaBuildInfo((prev) => ({ ...prev, checking: false }));
      }
    };
    verifyBuildRev();
    return () => {
      mounted = false;
    };
  }, []);

  // Escuchar evento para abrir pestaña de simulador
  useEffect(() => {
    const handleOpenSim = () => setActiveSubTab('simulator');
    window.addEventListener('taskquest:open-simulator-tab', handleOpenSim);
    return () => window.removeEventListener('taskquest:open-simulator-tab', handleOpenSim);
  }, []);

  // Sincronizar estado cuando la moneda cambie en otro lugar
  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail) setCurrentCurrency(e.detail);
    };
    window.addEventListener('taskquest:currency-change', handler);
    return () => window.removeEventListener('taskquest:currency-change', handler);
  }, []);

  const handleSelectCurrency = (sym: string, name: string) => {
    soundFX.playClick();
    setCurrentCurrency(sym);
    setSavedCurrencySymbol(sym);
    setCurrencyChangedToast(`Divisa global configurada en ${sym} (${name})`);
    setTimeout(() => setCurrencyChangedToast(null), 3500);
  };

  const handleSelectSavingsTarget = (target: number) => {
    soundFX.playClick();
    setSavingsTarget(target);
    setSavedSavingsTarget(target);
  };

  const tabsConfig = [
    { id: 'preferences' as SettingsSubTab, label: 'Sistema & Audio', icon: Volume2, color: 'aura-text-primary' },
    { id: 'atmosphere' as SettingsSubTab, label: 'Apariencia & Visión', icon: Palette, color: 'aura-text-primary' },
    { id: 'gameplay' as SettingsSubTab, label: copy.settingsTabGameplay, icon: Sparkles, color: 'text-purple-400' },
    { id: 'finances' as SettingsSubTab, label: copy.settingsTabFinances, icon: Coins, color: 'text-amber-400' },
    { id: 'data' as SettingsSubTab, label: 'Nube & Datos', icon: Database, color: 'text-emerald-400' }
  ];

  return (
    <div ref={chicleContainerRef} className="space-y-6 pb-36 sm:pb-32">
      {/* HEADER & SUB-TABS NAVIGATION (CANONICAL TABHEADER) */}
      <TabHeader
        title={copy.settingsHeaderTitle}
        icon={<Settings className="w-5 h-5" />}
        rightSlot={
          activeSubTab === 'simulator' ? (
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setActiveSubTab('gameplay');
              }}
              className="chicle-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase aura-bg-soft border aura-border-subtle hover:brightness-110 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Volver a Configuración</span>
            </button>
          ) : undefined
        }
      >
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full custom-scrollbar">
          {tabsConfig.map((t) => {
            const Icon = t.icon;
            const isSelected = activeSubTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setActiveSubTab(t.id);
                }}
                className={`chicle-btn px-4 py-2 rounded-xl text-xs font-anton tracking-wider uppercase transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'aura-btn-gradient optic-active-card font-bold'
                    : 'bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : t.color}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </TabHeader>

      {/* NOTIFICACIÓN REACTIVA GLOBAL */}
      {currencyChangedToast && (
        <div className="max-w-3xl mx-auto bg-emerald-950/90 border border-emerald-400 p-3.5 rounded-2xl flex items-center justify-between shadow-[0_0_20px_rgba(52,211,153,0.3)] animate-fade-in text-white text-xs">
          <div className="flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{currencyChangedToast}</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-300">REACTIVO GLOBAL</span>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL POR SUB-PESTAÑA DESACOPLADA */}
      <div className="max-w-3xl mx-auto">
        {activeSubTab === 'preferences' && <SettingsPreferencesTab />}

        {activeSubTab === 'atmosphere' && <SettingsAtmosphereTab />}

        {activeSubTab === 'gameplay' && (
          <SettingsGameplayTab
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            onOpenKaiWorkshop={onOpenKaiWorkshop}
            onOpenOnboarding={onOpenOnboarding}
            onOpenOracle={() => setIsOracleOpen(true)}
            onOpenSimulator={() => setActiveSubTab('simulator')}
          />
        )}

        {activeSubTab === 'finances' && (
          <SettingsFinancesTab
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            currentCurrency={currentCurrency}
            onSelectCurrency={handleSelectCurrency}
            savingsTarget={savingsTarget}
            onSelectSavingsTarget={handleSelectSavingsTarget}
          />
        )}

        {activeSubTab === 'data' && (
          <SettingsDataTab
            settings={settings}
            cloudSync={cloudSync}
            onResetAccount={onResetAccount}
            pwaBuildInfo={pwaBuildInfo}
          />
        )}

        {activeSubTab === 'simulator' && <SettingsSimulatorTab />}
      </div>

      {isOracleOpen && (
        <Suspense fallback={null}>
          <OracleModal 
            isOpen={isOracleOpen}
            onClose={() => setIsOracleOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
};
