import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles, 
  X, 
  Crown, 
  Camera, 
  Layers, 
  Shield, 
  Landmark, 
  Trash2 
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAppStore } from '../store/useAppStore';
import { useTaskStore } from '../store/useTaskStore';
import { KAI_OFFICIAL_SHAPES } from '../data/kaiShapes';
import { KaiShapeKey, KaiCustomForm, KaiTemperament, KaiAuraIntensity } from '../types';
import { soundFX } from '../utils/audio';
import { triggerShockwave } from '../utils/celebration';
import { useNarrativeCopy } from '../hooks/useNarrativeCopy';
import { speakKaiDialogue } from '../utils/voice';
import { generateAndShareKaiTradingCard } from '../utils/shareCardGenerator';
import { useSystemPalette } from '../utils/systemPalette';

import { WorkshopShapesTab } from './workshop/WorkshopShapesTab';
import { WorkshopEvolutionTab } from './workshop/WorkshopEvolutionTab';
import { WorkshopArmoryTab } from './workshop/WorkshopArmoryTab';
import { WorkshopVaultTab } from './workshop/WorkshopVaultTab';
import { WorkshopForgeTab } from './workshop/WorkshopForgeTab';
import { KAI_TEMPERAMENTS } from './workshop/workshopConstants';

export { KAI_TEMPERAMENTS };

interface KaiWorkshopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShop?: () => void;
}

type WorkshopTab = 'forge' | 'vault' | 'shapes' | 'evolution' | 'armory';

export const KaiWorkshopModal: React.FC<KaiWorkshopModalProps> = ({
  isOpen,
  onClose,
}) => {
  const copy = useNarrativeCopy();
  const { stats, setStats } = usePlayerStore();
  const habitMastery = useAppStore((state) => state.habitMastery);
  const customHabits = useTaskStore((state) => state.customHabits);

  const habitList = useMemo(() => {
    const list: { id: string; title: string; streak: number }[] = [];
    const addedIds = new Set<string>();

    (customHabits || []).forEach((h) => {
      addedIds.add(h.id);
      list.push({
        id: h.id,
        title: h.title,
        streak: habitMastery?.[h.id]?.currentStreak || 0,
      });
    });

    Object.entries(habitMastery || {}).forEach(([id, mastery]) => {
      if (!addedIds.has(id)) {
        list.push({
          id,
          title: `Hábito #${id.slice(-4)}`,
          streak: mastery?.currentStreak || 0,
        });
      }
    });

    return list;
  }, [customHabits, habitMastery]);

  const [activeTab, setActiveTab] = useState<WorkshopTab>('shapes');
  const systemPalette = useSystemPalette();

  const [relicToDelete, setRelicToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isSharingCard, setIsSharingCard] = useState<string | null>(null);
  const [speakingRelicId, setSpeakingRelicId] = useState<string | null>(null);

  // Progresión de Hábitos 21d / 66d
  const habits21Count = useMemo(() => {
    const list = Object.values(habitMastery || {});
    const count = list.filter((h) => h.isMaltzReached || (h.currentStreak || 0) >= 21).length;
    return count > 0 ? count : ((stats.streakDays || 0) >= 21 ? 1 : 0);
  }, [habitMastery, stats.streakDays]);

  const habits66Count = useMemo(() => {
    const list = Object.values(habitMastery || {});
    const count = list.filter((h) => h.isMastered || (h.currentStreak || 0) >= 66).length;
    return count > 0 ? count : ((stats.streakDays || 0) >= 66 ? 1 : 0);
  }, [habitMastery, stats.streakDays]);

  const has21Days = habits21Count >= 1;
  const has66Days = habits66Count >= 1;
  const ascensionGrade = habits66Count; // Grado I, II, III...
  const ascensionCrystals = Math.max(0, habits66Count - 1);

  // Hábito líder para radar Kaizen de inercia
  const topHabit = useMemo(() => {
    if (!habitList || habitList.length === 0) return null;
    return [...habitList].sort((a, b) => (b.streak || 0) - (a.streak || 0))[0];
  }, [habitList]);

  const topStreak = topHabit?.streak || 0;
  const progress21 = Math.min(100, Math.round((topStreak / 21) * 100));
  const progress66 = Math.min(100, Math.round((topStreak / 66) * 100));

  const currentAuraIntensity: KaiAuraIntensity = stats.kaiAuraIntensity || 'normal';

  const vaultItems = useMemo(() => {
    const items: KaiCustomForm[] = [];
    const idsSeen = new Set<string>();

    if (stats.kaiVault && stats.kaiVault.length > 0) {
      for (const item of stats.kaiVault) {
        const key = item.id || item.name;
        if (!idsSeen.has(key)) {
          idsSeen.add(key);
          items.push(item);
        }
      }
    }

    if (stats.kaiCustomForm) {
      const key = stats.kaiCustomForm.id || stats.kaiCustomForm.name;
      if (!idsSeen.has(key)) {
        idsSeen.add(key);
        items.unshift(stats.kaiCustomForm);
      }
    }

    return items;
  }, [stats.kaiVault, stats.kaiCustomForm]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('modal-open-hide-floating');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('modal-open-hide-floating');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSelectShape = (shapeId: KaiShapeKey) => {
    soundFX.playItemEquip();
    triggerShockwave({ color: 'cyan', intensity: 'subtle' });
    setStats((prev) => ({
      ...prev,
      kaiShape: shapeId,
    }));
  };

  const handleSelectAura = (color: string) => {
    soundFX.playClick();
    setStats((prev) => ({
      ...prev,
      kaiAuraColor: color,
    }));
  };

  const handleSelectAuraIntensity = (intensity: KaiAuraIntensity) => {
    soundFX.playClick();
    setStats((prev) => ({
      ...prev,
      kaiAuraIntensity: intensity,
    }));
  };

  const handleSelectParticle = (particle: string) => {
    soundFX.playItemEquip();
    setStats((prev) => ({
      ...prev,
      kaiParticleEffect: particle,
    }));
  };

  const handleSaveAllVariantsToVault = (variants: KaiCustomForm[]) => {
    setStats((prev) => {
      const currentVault = prev.kaiVault ? [...prev.kaiVault] : [];
      variants.forEach((variant, idx) => {
        const entryWithId: KaiCustomForm = {
          ...variant,
          id: variant.id || `relic_${Date.now()}_${idx}`,
          createdAt: variant.createdAt || new Date().toISOString(),
        };
        const exists = currentVault.some(
          (v) => (v.id && v.id === entryWithId.id) || (v.name === entryWithId.name && v.artStyle === entryWithId.artStyle)
        );
        if (!exists) {
          currentVault.push(entryWithId);
        }
      });
      return {
        ...prev,
        kaiVault: currentVault,
      };
    });
  };

  const handleEquipCustomForm = (targetForm: KaiCustomForm) => {
    soundFX.playFanfare();
    triggerShockwave({ color: 'gold', intensity: 'epic' });

    const entryWithId: KaiCustomForm = {
      ...targetForm,
      id: targetForm.id || `relic_${Date.now()}`,
      createdAt: targetForm.createdAt || new Date().toISOString(),
    };

    setStats((prev) => {
      const currentVault = prev.kaiVault ? [...prev.kaiVault] : [];
      if (prev.kaiCustomForm && !currentVault.some(v => v.id === prev.kaiCustomForm?.id || v.name === prev.kaiCustomForm?.name)) {
        currentVault.push(prev.kaiCustomForm);
      }
      const existingIdx = currentVault.findIndex(v => v.id === entryWithId.id || (v.name === entryWithId.name && v.detectedObject === entryWithId.detectedObject));
      if (existingIdx >= 0) {
        currentVault[existingIdx] = entryWithId;
      } else {
        currentVault.unshift(entryWithId);
      }
      return {
        ...prev,
        kaiCustomForm: entryWithId,
        kaiShape: 'custom',
        kaiVault: currentVault,
      };
    });
  };

  const handleSpeakQuote = (quote: string, mood?: KaiTemperament, id?: string) => {
    if (!quote) return;
    soundFX.playClick();
    setSpeakingRelicId(id || 'active');
    speakKaiDialogue(quote, mood || 'stoic', () => {
      setSpeakingRelicId(null);
    });
  };

  const handleShareTradingCard = async (targetKai: KaiCustomForm, id?: string) => {
    soundFX.playClick();
    setIsSharingCard(id || targetKai.id || targetKai.name);
    try {
      await generateAndShareKaiTradingCard({ kai: targetKai, stats });
    } finally {
      setIsSharingCard(null);
    }
  };

  const handleLinkHabitToRelic = (relicId: string, habitId: string, habitTitle: string) => {
    soundFX.playClick();
    setStats((prev) => {
      const updatedVault = (prev.kaiVault || []).map(r => {
        if (r.id === relicId) {
          return {
            ...r,
            habitIdLinked: habitId || undefined,
            habitTitleLinked: habitTitle || undefined,
          };
        }
        return r;
      });
      const updatedCustom = prev.kaiCustomForm?.id === relicId
        ? { ...prev.kaiCustomForm, habitIdLinked: habitId || undefined, habitTitleLinked: habitTitle || undefined }
        : prev.kaiCustomForm;
      return {
        ...prev,
        kaiVault: updatedVault,
        kaiCustomForm: updatedCustom,
      };
    });
  };

  const handleDeleteRelic = (relicId: string) => {
    soundFX.playClick();
    setStats((prev) => {
      const updatedVault = (prev.kaiVault || []).filter(r => r.id !== relicId);
      let updatedCustom = prev.kaiCustomForm;
      let updatedShape = prev.kaiShape;
      if (prev.kaiCustomForm?.id === relicId) {
        if (updatedVault.length > 0) {
          updatedCustom = updatedVault[0];
        } else {
          updatedCustom = null;
          updatedShape = 'prism';
        }
      }
      return {
        ...prev,
        kaiVault: updatedVault,
        kaiCustomForm: updatedCustom,
        kaiShape: updatedShape,
      };
    });
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Taller de KAI"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[170] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn portal-modal-root"
    >
      <div className="relative isolate w-full max-w-4xl max-h-[92dvh] sm:max-h-[88vh] bg-[#030712]/[0.98] border border-white/10 rounded-2xl sm:rounded-3xl shadow-[0_20px_55px_rgba(0,0,0,0.85),0_0_36px_rgba(var(--aura-glow-rgb,0,240,255),0.16),inset_0_1px_0_rgba(255,255,255,0.12)] flex flex-col overflow-hidden text-white">
        
        {/* Micrograno táctil Moxen Vidrio */}
        <span className="vi-grano opacity-5" aria-hidden="true" />

        {/* Filamento especular superior */}
        <div className="absolute top-0 inset-x-0 h-px aura-top-filament pointer-events-none" />

        {/* ─── ENCABEZADO MOXEN OBSIDIAN ─── */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-white/10 flex items-center justify-between bg-[#040814]/[0.96] relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl aura-bg-soft border flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <h2 className="text-base sm:text-lg font-anton tracking-wider text-white uppercase flex items-center gap-2">
                Taller de KAI
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono aura-bg-soft border font-normal w-fit">
                Activo: {stats.kaiShape === 'custom' ? (stats.kaiCustomForm?.name || 'Forja IA') : (KAI_OFFICIAL_SHAPES.find(s => s.id === stats.kaiShape)?.name || 'El Prisma')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar Taller de KAI"
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 transition-all flex items-center justify-center cursor-pointer active:scale-95"
            title="Cerrar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ─── BARRA DE PESTAÑAS UNIFICADA AURA ─── */}
        <div 
          role="tablist" 
          aria-label="Pestañas del Taller de KAI"
          className="px-4 sm:px-6 py-2.5 bg-black/40 border-b border-white/10 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar relative z-10"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'forge'}
            aria-controls="kai-tabpanel-forge"
            id="kai-tab-forge"
            onClick={() => { soundFX.playClick(); setActiveTab('forge'); }}
            className={`px-3.5 py-2 text-xs font-anton tracking-wider uppercase rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              activeTab === 'forge'
                ? 'aura-btn-gradient optic-active-card'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{copy.workshopTabForge}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'vault'}
            aria-controls="kai-tabpanel-vault"
            id="kai-tab-vault"
            onClick={() => { soundFX.playClick(); setActiveTab('vault'); }}
            className={`px-3.5 py-2 text-xs font-anton tracking-wider uppercase rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              activeTab === 'vault'
                ? 'aura-btn-gradient optic-active-card'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Bóveda / Museo</span>
            {vaultItems.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${activeTab === 'vault' ? 'bg-black/25 text-[#030712] font-bold optic-inner-badge' : 'bg-white/10 text-slate-200 border border-white/10'}`}>
                {vaultItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'shapes'}
            aria-controls="kai-tabpanel-shapes"
            id="kai-tab-shapes"
            onClick={() => { soundFX.playClick(); setActiveTab('shapes'); }}
            className={`px-3.5 py-2 text-xs font-anton tracking-wider uppercase rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              activeTab === 'shapes'
                ? 'aura-btn-gradient optic-active-card'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Forma Génesis</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'evolution'}
            aria-controls="kai-tabpanel-evolution"
            id="kai-tab-evolution"
            onClick={() => { soundFX.playClick(); setActiveTab('evolution'); }}
            className={`px-3.5 py-2 text-xs font-anton tracking-wider uppercase rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              activeTab === 'evolution'
                ? 'aura-btn-gradient optic-active-card'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Evolución</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'armory'}
            aria-controls="kai-tabpanel-armory"
            id="kai-tab-armory"
            onClick={() => { soundFX.playClick(); setActiveTab('armory'); }}
            className={`px-3.5 py-2 text-xs font-anton tracking-wider uppercase rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              activeTab === 'armory'
                ? 'aura-btn-gradient optic-active-card'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Armería</span>
          </button>
        </div>

        {/* ─── CONTENIDO DE PESTAÑAS ─── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          
          {/* TAB: FORJA NEURAL */}
          {activeTab === 'forge' && (
            <WorkshopForgeTab
              onEquipCustomForm={handleEquipCustomForm}
              onSaveAllToVault={handleSaveAllVariantsToVault}
              onShareTradingCard={handleShareTradingCard}
              onSpeakQuote={handleSpeakQuote}
              speakingRelicId={speakingRelicId}
              isSharingCard={isSharingCard}
            />
          )}

          {/* TAB: BÓVEDA / MUSEO */}
          {activeTab === 'vault' && (
            <WorkshopVaultTab
              vaultItems={vaultItems}
              currentShape={stats.kaiShape}
              customForm={stats.kaiCustomForm}
              habitList={habitList}
              speakingRelicId={speakingRelicId}
              isSharingCard={isSharingCard}
              onOpenForge={() => { soundFX.playClick(); setActiveTab('forge'); }}
              onRequestDeleteRelic={(relic) => setRelicToDelete(relic)}
              onSpeakQuote={handleSpeakQuote}
              onLinkHabitToRelic={handleLinkHabitToRelic}
              onShareTradingCard={handleShareTradingCard}
              onEquipCustomForm={handleEquipCustomForm}
              onClose={onClose}
            />
          )}

          {/* TAB: FORMA GÉNESIS */}
          {activeTab === 'shapes' && (
            <WorkshopShapesTab
              currentShape={stats.kaiShape}
              customForm={stats.kaiCustomForm}
              systemPalette={systemPalette}
              has21Days={has21Days}
              has66Days={has66Days}
              ascensionCrystals={ascensionCrystals}
              onSelectShape={handleSelectShape}
            />
          )}

          {/* TAB: EVOLUCIÓN */}
          {activeTab === 'evolution' && (
            <WorkshopEvolutionTab
              habits21Count={habits21Count}
              habits66Count={habits66Count}
              has21Days={has21Days}
              has66Days={has66Days}
              ascensionGrade={ascensionGrade}
              ascensionCrystals={ascensionCrystals}
              topHabit={topHabit}
              topStreak={topStreak}
              progress21={progress21}
              progress66={progress66}
              currentAuraIntensity={currentAuraIntensity}
              currentAuraColor={stats.kaiAuraColor}
              onSelectAuraIntensity={handleSelectAuraIntensity}
              onSelectAura={handleSelectAura}
            />
          )}

          {/* TAB: ARMERÍA */}
          {activeTab === 'armory' && (
            <WorkshopArmoryTab
              habits21Count={habits21Count}
              habits66Count={habits66Count}
              has21Days={has21Days}
              has66Days={has66Days}
              topStreak={topStreak}
              currentParticle={stats.kaiParticleEffect}
              currentAuraIntensity={currentAuraIntensity}
              onSelectParticle={handleSelectParticle}
              onSelectAuraIntensity={handleSelectAuraIntensity}
            />
          )}

        </div>

        {/* ─── PIE DEL MODAL MOXEN THUMB-ZONE ─── */}
        <div className="p-3.5 sm:p-5 border-t border-white/10 bg-[#040814]/[0.96] flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 min-w-0">
            <span className="shrink-0">KAI Activo:</span>
            <span className="px-2.5 py-1 rounded-lg aura-bg-soft border font-anton tracking-wider uppercase text-xs truncate">
              {stats.kaiShape === 'custom' ? (stats.kaiCustomForm?.name || copy.workshopCustomFallback) : (KAI_OFFICIAL_SHAPES.find(s => s.id === stats.kaiShape)?.name || 'El Prisma')}
            </span>
            {has66Days && (
              <span className="hidden sm:inline-flex items-center gap-1 text-amber-300 font-anton text-xs uppercase tracking-wider">
                <Crown className="w-3.5 h-3.5" /> Maestría Activa
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="chicle-btn px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/15 text-white font-anton text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0"
          >
            {copy.backToDashboardCta}
          </button>
        </div>

        {/* ─── MODAL DE CONFIRMACIÓN: RETIRAR RELIQUIA DE BÓVEDA ─── */}
        {relicToDelete && (
          <div className="fixed inset-0 z-[185] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-sm p-5 rounded-2xl bg-[#030712]/[0.98] border border-rose-500/50 shadow-[0_16px_44px_rgba(0,0,0,0.85)] text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-anton tracking-wide text-white uppercase">
                  ¿Retirar Reliquia?
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Estás a punto de retirar a <strong>"{relicToDelete.name}"</strong> de tu Bóveda. Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRelicToDelete(null)}
                  className="py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-slate-200 text-xs font-anton tracking-wider uppercase transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteRelic(relicToDelete.id);
                    setRelicToDelete(null);
                  }}
                  className="chicle-btn py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-anton tracking-wider uppercase font-bold transition cursor-pointer"
                >
                  Retirar KAI
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
};

export default KaiWorkshopModal;
