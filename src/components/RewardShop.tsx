import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShopReward, SkillNode } from '../types';
import { 
  Coins, 
  Plus, 
  X, 
  Trash2, 
  Shield, 
  Flame, 
  Sparkles, 
  Heart, 
  Lock,
  Unlock,
  Coffee,
  Package,
  Bot,
  ShoppingBag,
  BrainCircuit,
  ShieldAlert,
  Zap,
  Activity
} from 'lucide-react';
import { TabHeader } from './common/TabHeader';
import { soundFX } from '../utils/audio';
import { triggerShockwave } from '../utils/celebration';
import { useAppStore } from '../store/useAppStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { notificationService } from '../utils/notifications';
import { useUIStore } from '../store/useUIStore';
import { triggerHaptic } from '../utils/haptics';
import { calculateDynamicShopCost } from '../utils/level3Systems';
import { getTodayDateString } from '../utils/date';
import { useNarrativeCopy } from '../hooks/useNarrativeCopy';

type FilterTab = 'todos' | 'vida_real' | 'perks' | 'descanso' | 'talentos' | 'personalizados' | 'mochila';

export const RewardShop: React.FC = () => {
  const copy = useNarrativeCopy();
  const stats = usePlayerStore((s) => s.stats);
  const setStats = usePlayerStore((s) => s.setStats);
  const openLootBox = usePlayerStore((s) => s.openLootBox);
  const useInventoryItem = usePlayerStore((s) => s.useInventoryItem);
  const inventory = stats.inventory || [];
  const unopenedBoxes = stats.unopenedBoxes || 0;
  const coins = stats.coins || 0;
  const energia = stats.attributes?.energia || 10;
  const streakShields = stats.streakShields ?? 0;
  
  const rewards = useAppStore(state => state.shopRewards);
  const setShopRewards = useAppStore(state => state.setShopRewards);
  const skillTree = useAppStore(state => state.skillTree);
  const setSkillTree = useAppStore(state => state.setSkillTree);
  const triggerScreenFlash = useUIStore(state => state.triggerScreenFlash);

  // Filter State
  const [activeTab, setActiveTab] = useState<FilterTab>('todos');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState(150);
  const [icon, setIcon] = useState('🎁');
  const [category, setCategory] = useState<'ocio' | 'comida' | 'descanso' | 'perk'>('ocio');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAddModalOpen) {
        setIsAddModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddModalOpen]);

  useEffect(() => {
    if (!isAddModalOpen) return;
    document.body.classList.add('modal-open-hide-floating');
    return () => {
      document.body.classList.remove('modal-open-hide-floating');
    };
  }, [isAddModalOpen]);

  const getDiscountedCost = (reward: ShopReward) => {
    const scaledBase = calculateDynamicShopCost(reward.id, reward.cost, stats);
    if (reward.category === 'descanso') {
      const discount = Math.floor(energia / 10) * 0.05;
      return Math.max(1, Math.floor(scaledBase * (1 - discount)));
    }
    return scaledBase;
  };

  const handleRedeem = (reward: ShopReward) => {
    const todayStr = getTodayDateString();
    if (reward.id === 'kai-overcharge-contract' && stats.activeOverchargeContract?.date === todayStr && !stats.activeOverchargeContract?.settled) {
      soundFX.playClick();
      notificationService.triggerNotification(
        '⚡ Contrato de Sobrecarga ya activo hoy',
        'Completa ≥85% de tu jornada y sella el día en el Cierre Nocturno para reclamar +250 XP y recuperar tus 100🪙.',
        '⚡'
      );
      return;
    }

    // Cap de Escudos de Racha: máximo 3 activos simultáneamente
    if (reward.id === 'perk-streak-shield' && (stats.streakShields || 0) >= 3) {
      soundFX.playClick();
      notificationService.triggerNotification(
        '🛡️ Máximo de 3 Escudos de Racha activos alcanzado',
        'Ya dispones de 3 Escudos de Racha activos. Consúmelos antes de forjar más.',
        '🛡️'
      );
      return;
    }

    const finalCost = getDiscountedCost(reward);
    
    const success = usePlayerStore.getState().purchaseItem(finalCost, (prev) => {
      let extra: any = {};
      if (reward.id === 'perk-streak-shield') {
        extra = { streakShields: Math.min((prev.streakShields || 0) + 1, 3) };
      }
      if (reward.id === 'perk-focus-potion') {
        const now = Date.now();
        const currentExpires = prev.focusPotionExpiresAt || now;
        extra = { focusPotionExpiresAt: Math.max(now, currentExpires) + 3600000 };
      }
      if (reward.id === 'kai-freeze-capsule') {
        const inv = [...(prev.inventory || [])];
        const existingIdx = inv.findIndex(i => i.id === 'inv-freeze-capsule');
        if (existingIdx >= 0) {
          inv[existingIdx] = { ...inv[existingIdx], quantity: inv[existingIdx].quantity + 1 };
        } else {
          inv.push({
            id: 'inv-freeze-capsule',
            baseId: 'freeze_capsule',
            name: 'Cápsula Criogénica',
            description: 'Pausa un hábito por 3 días protegiendo su racha 21/66d.',
            icon: '❄️',
            rarity: 'raro',
            quantity: 1,
            effectType: 'streak_shield'
          });
        }
        extra = { inventory: inv };
      }
      if (reward.id === 'kai-synaptic-booster') {
        extra = { synapticBoosters: (prev.synapticBoosters || 0) + 1 };
      }
      if (reward.id === 'perk-tactical-energy-vial') {
        extra = { tacticalEnergyVials: (prev.tacticalEnergyVials || 0) + 3 };
      }
      if (reward.id === 'kai-overcharge-contract') {
        extra = {
          activeOverchargeContract: {
            date: todayStr,
            stakedCoins: finalCost,
            settled: false,
          },
        };
      }
      return extra;
    });

    if (!success) {
      soundFX.playClick();
      return;
    }

    if (reward.id === 'perk-focus-potion') {
      triggerScreenFlash('buff');
      triggerHaptic([50, 100, 50]);
      notificationService.triggerNotification('¡Estímulo de Foco Activo! 🧪', 'Durante la próxima hora, ganarás 50% más monedas y experiencia en todas tus tareas.', '🧪');
    } else if (reward.id === 'perk-streak-shield') {
      triggerHaptic([80, 80]);
      notificationService.triggerNotification('¡Escudo Forjado! 🛡️', 'Tu racha está protegida ante cualquier imprevisto.', '🛡️');
    } else if (reward.id === 'kai-freeze-capsule') {
      triggerScreenFlash('buff');
      triggerHaptic([80, 40]);
      notificationService.triggerNotification('¡Cápsula de Pausa Guardada! ❄️', 'Añadida a tu mochila para congelar un hábito si te lesionas o viajas sin perder tu racha.', '❄️');
    } else if (reward.id === 'kai-synaptic-booster') {
      triggerScreenFlash('buff');
      triggerHaptic([120]);
      notificationService.triggerNotification('¡Impulso de Consistencia Adquirido! ⚡', 'Tu próximo registro de hábito avanzará al doble hacia tus 21 y 66 días.', '⚡');
    } else if (reward.id === 'perk-tactical-energy-vial') {
      triggerScreenFlash('buff');
      triggerHaptic([50, 100, 50]);
      notificationService.triggerNotification('¡Vial de Energía Activo! ✨', '+3 Cargas añadidas: ganarás +50% XP y Monedas en tus próximas 3 acciones.', '✨');
    } else if (reward.id === 'kai-overcharge-contract') {
      triggerScreenFlash('buff');
      triggerHaptic([120, 60, 120]);
      notificationService.triggerNotification('¡Compromiso de Enfoque Sellado! 🎯', '100🪙 en juego: cierra hoy con ≥85% de tus tareas para ganar +250 XP y recuperar tus monedas.', '🎯');
    } else {
      triggerHaptic([40, 60, 40]);
      notificationService.triggerNotification(`¡Disfruta tu premio! ${reward.icon}`, `Has canjeado "${reward.title}". Te lo has ganado con disciplina.`, reward.icon);
    }

    // Update reward count
    setShopRewards((prev: ShopReward[]) => 
      prev.map(r => r.id === reward.id ? { ...r, unlockedCount: (r.unlockedCount || 0) + 1 } : r)
    );

    soundFX.playCoin();
    soundFX.playSubBassConfirm();
    triggerShockwave({ color: 'gold', intensity: 'medium' });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    soundFX.playClick();
    
    const newReward: ShopReward = {
      id: 'custom-' + Date.now(),
      title: title.trim(),
      description: description.trim() || 'Recompensa de la vida real ganada con esfuerzo.',
      cost: Number(cost) || 100,
      icon,
      category,
      unlockedCount: 0
    };

    setShopRewards((prev: ShopReward[]) => [newReward, ...prev]);

    setTitle('');
    setDescription('');
    setIsAddModalOpen(false);
  };

  const handleDeleteCustom = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    soundFX.playClick();
    setShopRewards((prev: ShopReward[]) => prev.filter(r => r.id !== id));
  };

  const handlePurchaseSkill = (skill: SkillNode) => {
    if (skill.isUnlocked || coins < skill.costCoins) return;

    if (soundFX.playSuccess) {
      soundFX.playSuccess();
    } else {
      soundFX.playClick();
    }
    triggerHaptic(50);
    triggerShockwave({ color: 'violet', intensity: 'medium' });

    setStats((prev) => ({
      ...prev,
      coins: Math.max(0, prev.coins - skill.costCoins),
      streakShields: skill.effectType === 'streak_shield' ? (prev.streakShields || 0) + 1 : prev.streakShields,
    }));

    const newTree = skillTree.map(s => s.id === skill.id ? { ...s, isUnlocked: true } : s);
    setSkillTree(newTree);
    notificationService.triggerNotification(`¡Talento Activo! ⚡`, skill.title, '⚡');
  };

  // Filter Logic
  const filteredRewards = useMemo(() => {
    return rewards.filter((r) => {
      const isCustom = r.id.startsWith('custom-');
      if (activeTab === 'todos') return true;
      if (activeTab === 'personalizados') return isCustom;
      if (activeTab === 'perks') return r.category === 'perk' || r.id.startsWith('kai-');
      if (activeTab === 'vida_real') return r.category === 'ocio' || r.category === 'comida' || isCustom;
      if (activeTab === 'descanso') return r.category === 'descanso';
      return true;
    });
  }, [rewards, activeTab]);

  return (
    <div className="space-y-4 font-sans tracking-wide pb-20 text-white">
      
      {/* ─── 1. BÓVEDA HEADER HUD (CANONICAL TABHEADER) ─── */}
      <TabHeader
        title={copy.shopTitle}
        subtitle={copy.shopSubtitle}
        icon={<ShoppingBag className="w-5 h-5" />}
        badge={
          <span className="text-[10px] px-2 py-0.5 rounded-full aura-bg-soft border aura-border-subtle uppercase font-mono hidden sm:inline">
            Canje Directo
          </span>
        }
        rightSlot={
          <>
            <div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#040814]/80 text-amber-300 font-bold font-mono text-xs sm:text-sm border border-amber-400/50"
              title="Monedas acumuladas"
            >
              <Coins className="w-4 h-4 text-amber-400 stroke-[2.5]" />
              <span className="font-mono tabular-nums">{coins}</span>
              <span className="text-[10px] font-sans font-bold text-amber-400/80 hidden sm:inline">Monedas</span>
            </div>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setIsAddModalOpen(true);
              }}
              className="chicle-btn aura-btn-gradient optic-active-card flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-anton text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0"
              title="Crear recompensa personalizada"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>{copy.shopCreateCta}</span>
            </button>
          </>
        }
      >
        {/* ─── 2. FAST FILTER TABS (MOXEN CHIP MENU GROUP) ─── */}
        <div
          className="mf-8-menu-chip-group mf-chip-group mf-chip-group--compact"
          role="listbox"
          aria-label="Filtro por categoría de tienda"
        >
          <button
            type="button"
            role="option"
            aria-selected={activeTab === 'todos'}
            onClick={() => { soundFX.playClick(); setActiveTab('todos'); }}
            className={`chicle-btn mf-8-menu-chip-group__chip mf-chip mf-chip--sm ${
              activeTab === 'todos' ? 'mf-8-menu-chip-group__chip--active mf-chip--active aura-bg-soft aura-border-primary aura-text-primary optic-active-card' : ''
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${activeTab === 'todos' ? 'aura-text-primary' : 'text-slate-300'}`} />
            <span>Todos</span>
            <span className="mf-chip__badge font-mono tabular-nums">{rewards.length}</span>
          </button>

          <button
            type="button"
            role="option"
            aria-selected={activeTab === 'vida_real'}
            onClick={() => { soundFX.playClick(); setActiveTab('vida_real'); }}
            className={`chicle-btn mf-8-menu-chip-group__chip mf-chip mf-chip--sm ${
              activeTab === 'vida_real' ? 'mf-8-menu-chip-group__chip--active mf-chip--active aura-bg-soft aura-border-primary aura-text-primary optic-active-card' : ''
            }`}
          >
            <Coffee className="w-3.5 h-3.5 text-amber-400" />
            <span>Vida Real</span>
          </button>

          <button
            type="button"
            role="option"
            aria-selected={activeTab === 'perks'}
            onClick={() => { soundFX.playClick(); setActiveTab('perks'); }}
            className={`chicle-btn mf-8-menu-chip-group__chip mf-chip mf-chip--sm ${
              activeTab === 'perks' ? 'mf-8-menu-chip-group__chip--active mf-chip--active aura-bg-soft aura-border-primary aura-text-primary optic-active-card' : ''
            }`}
          >
            <Shield className={`w-3.5 h-3.5 ${activeTab === 'perks' ? 'aura-text-primary' : 'aura-text-soft'}`} />
            <span>Hábitos & Enfoque</span>
          </button>

          <button
            type="button"
            role="option"
            aria-selected={activeTab === 'descanso'}
            onClick={() => { soundFX.playClick(); setActiveTab('descanso'); }}
            className={`chicle-btn mf-8-menu-chip-group__chip mf-chip mf-chip--sm ${
              activeTab === 'descanso' ? 'mf-8-menu-chip-group__chip--active mf-chip--active aura-bg-soft aura-border-primary aura-text-primary optic-active-card' : ''
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-emerald-400" />
            <span>Descanso</span>
          </button>

          <button
            type="button"
            role="option"
            aria-selected={activeTab === 'personalizados'}
            onClick={() => { soundFX.playClick(); setActiveTab('personalizados'); }}
            className={`chicle-btn mf-8-menu-chip-group__chip mf-chip mf-chip--sm ${
              activeTab === 'personalizados' ? 'mf-8-menu-chip-group__chip--active mf-chip--active aura-bg-soft aura-border-primary aura-text-primary optic-active-card' : ''
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Deseos</span>
          </button>

          <button
            type="button"
            role="option"
            aria-selected={activeTab === 'talentos'}
            onClick={() => { soundFX.playClick(); setActiveTab('talentos'); }}
            className={`chicle-btn mf-8-menu-chip-group__chip mf-chip mf-chip--sm ${
              activeTab === 'talentos' ? 'mf-8-menu-chip-group__chip--active mf-chip--active aura-bg-soft aura-border-primary aura-text-primary optic-active-card' : ''
            }`}
          >
            <BrainCircuit className={`w-3.5 h-3.5 ${activeTab === 'talentos' ? 'aura-text-primary' : 'aura-text-soft'}`} />
            <span>Talentos</span>
            <span className="mf-chip__badge font-mono tabular-nums">{skillTree.length}</span>
          </button>

          <button
            type="button"
            role="option"
            aria-selected={activeTab === 'mochila'}
            onClick={() => { soundFX.playClick(); setActiveTab('mochila'); }}
            className={`chicle-btn mf-8-menu-chip-group__chip mf-chip mf-chip--sm md:ml-auto ${
              activeTab === 'mochila' ? 'mf-8-menu-chip-group__chip--active mf-chip--active aura-bg-soft aura-border-primary aura-text-primary optic-active-card' : ''
            }`}
          >
            <Package className={`w-3.5 h-3.5 ${activeTab === 'mochila' ? 'aura-text-primary' : 'aura-text-soft'}`} />
            <span>Mochila</span>
            <span className="mf-chip__badge font-mono tabular-nums">{inventory.length + (unopenedBoxes > 0 ? 1 : 0)}</span>
          </button>
        </div>
      </TabHeader>

      {/* ─── 3. LOOT BOX ALERT (IF UNOPENED BOXES EXIST) ─── */}
      {unopenedBoxes > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative isolate p-3.5 rounded-2xl bg-[#040a1a]/[0.94] border border-amber-400/50 shadow-[0_8px_30px_rgba(245,158,11,0.18)] overflow-hidden flex items-center justify-between gap-3"
        >
          <span className="vi-grano opacity-5" aria-hidden="true" />
          <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-2xl animate-bounce shrink-0">
              🎁
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black font-anton text-amber-300 uppercase tracking-wide">
                ¡Tienes <span className="font-mono tabular-nums">{unopenedBoxes}</span> Cofre{unopenedBoxes !== 1 ? 's' : ''} de Botín!
              </h3>
              <p className="text-[11px] text-slate-300">
                Ganadas por consistencia. Ábrelas para reclamar ítems legendarios.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const { item, success } = openLootBox();
              if (success) {
                soundFX.playLevelUp();
                triggerHaptic([100, 100]);
                triggerShockwave({ color: 'gold', intensity: 'epic' });
                notificationService.triggerNotification(`¡Encontraste: ${item.name}!`, item.description, item.icon);
              }
            }}
            className="relative z-10 chicle-btn aura-btn-gradient optic-active-card px-4 py-2 rounded-xl font-anton text-xs uppercase tracking-wider cursor-pointer shrink-0"
          >
            Abrir
          </button>
        </motion.div>
      )}

      {/* ─── 4. TALENTOS & INVENTORY TABS ─── */}
      {activeTab === 'talentos' ? (
        <div className="space-y-4 animate-fade-in">
          <div className="relative isolate p-4 rounded-2xl bg-[#040a1a]/[0.94] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] flex items-center justify-between gap-3 overflow-hidden">
            <span className="vi-grano opacity-5" aria-hidden="true" />
            <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-anton uppercase tracking-wider text-white">Mejoras Pasivas Permanentes</h3>
                <p className="text-[11px] text-slate-400">Invierte tus monedas para activar talentos permanentes en tu perfil táctico.</p>
              </div>
            </div>
            <div className="relative z-10 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#040814]/80 border border-amber-400/30 text-amber-300 font-anton text-xs">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono tabular-nums">{coins}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skillTree.map((skill) => {
              const canAfford = coins >= skill.costCoins;
              return (
                <div
                  key={skill.id}
                  className={`relative isolate p-5 rounded-2xl bg-[#040a1a]/[0.94] border shadow-[0_8px_30px_rgba(0,0,0,0.45)] transition-all overflow-hidden flex flex-col justify-between ${
                    skill.isUnlocked
                      ? 'aura-border-primary aura-glow-subtle'
                      : 'border-white/10 hover:border-white/25'
                  }`}
                >
                  <span className="vi-grano opacity-5" aria-hidden="true" />
                  <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

                  <div>
                    <div className="flex items-start justify-between mb-3.5 relative z-10">
                      <div className={`p-3 rounded-2xl border ${
                        skill.isUnlocked
                          ? 'aura-bg-soft aura-border-primary aura-text-primary'
                          : 'bg-[#040814]/80 text-slate-400 border-white/10'
                      }`}>
                        {skill.effectType === 'streak_shield' ? <ShieldAlert className="w-5 h-5 text-amber-400" /> :
                         skill.effectType === 'xp_multiplier' ? <Zap className="w-5 h-5 aura-text-primary" /> :
                         <Activity className="w-5 h-5 aura-text-primary" />}
                      </div>
                      <div className="text-right">
                        {skill.isUnlocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-anton text-emerald-300 uppercase tracking-wider bg-emerald-500/15 px-2 py-0.5 rounded-lg border border-emerald-400/40">
                            <Unlock className="w-3 h-3" /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-anton text-slate-400 uppercase tracking-wider bg-[#040814]/80 px-2 py-0.5 rounded-lg border border-white/10">
                            <Lock className="w-3 h-3" /> Bloqueado
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="relative z-10">
                      <h4 className="text-sm font-anton uppercase tracking-wide mb-1 text-white">{skill.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed mb-4 min-h-[36px]">{skill.description}</p>
                    </div>
                  </div>

                  {!skill.isUnlocked ? (
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
                  ) : (
                    <div className="relative z-10 w-full py-2 rounded-xl text-xs font-anton text-center aura-bg-soft aura-border-subtle border uppercase tracking-wider optic-active-card text-slate-200">
                      Mejora Permanente Activa
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : activeTab === 'mochila' ? (
        <div className="space-y-3">
          {inventory.length === 0 ? (
            <div className="relative isolate p-8 rounded-2xl border border-white/10 bg-[#040a1a]/[0.94] shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden text-center space-y-2">
              <span className="vi-grano opacity-5" aria-hidden="true" />
              <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />
              <div className="relative z-10 space-y-2">
                <Package className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs font-anton text-slate-300 uppercase tracking-wider">Tu mochila está vacía</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Completa rachas perfectas o abre cajas de botín para almacenar pociones y pergaminos.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {inventory.map((item) => (
                <div 
                  key={item.id}
                  className="relative isolate p-3.5 rounded-2xl bg-[#040a1a]/[0.94] border border-white/10 hover:border-white/25 overflow-hidden flex flex-col items-center text-center gap-1.5 group transition-colors shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
                >
                  <span className="vi-grano opacity-5" aria-hidden="true" />
                  <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />
                  <span className="relative z-10 self-end text-[10px] font-mono font-bold bg-[#040814]/80 aura-text-primary px-2 py-0.5 rounded-full border border-white/10 tabular-nums">
                    x{item.quantity}
                  </span>
                  <div className="relative z-10 text-3xl my-1">{item.icon}</div>
                  <h4 className="relative z-10 text-xs font-semibold text-slate-100 uppercase tracking-wide truncate w-full">{item.name}</h4>
                  <p className="relative z-10 text-xs text-slate-400 leading-snug line-clamp-2">{item.description}</p>
                  <button
                    type="button"
                    onClick={() => {
                      const success = useInventoryItem(item.id);
                      if (success) {
                        soundFX.playLevelUp();
                        triggerHaptic([50, 100, 50]);
                        triggerScreenFlash('buff');
                        notificationService.triggerNotification(`¡Usaste ${item.name}!`, 'El efecto ha sido activado.', item.icon);
                      }
                    }}
                    className="relative z-10 chicle-btn aura-btn-gradient optic-active-card w-full mt-2 min-h-[36px] py-1.5 px-3 rounded-xl text-xs font-anton uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center"
                  >
                    Usar Ítem
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ─── 5. ORBITAL REWARDS GRID (CÁPSULAS OBSIDIAN GLASS + AURA) ─── */
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
        >
            {filteredRewards.map((reward) => {
              const discountedCost = getDiscountedCost(reward);
              const isShieldCapped = reward.id === 'perk-streak-shield' && streakShields >= 3;
              const canAfford = !isShieldCapped && coins >= discountedCost;
              const isCustom = reward.id.startsWith('custom-');

              // Categorization accent border (Obsidian Glass + Aura / semantic emerald for rest)
              let auraBorder = 'border-white/10 hover:border-white/25';
              let orbGlow = 'bg-[#040814]/80 aura-border-subtle aura-text-soft aura-glow-subtle';
              
              if (reward.category === 'kai' || reward.id.startsWith('kai-')) {
                auraBorder = 'aura-border-subtle hover:aura-border-primary';
                orbGlow = 'bg-[#040814]/80 aura-border-primary aura-text-primary aura-glow-subtle';
              } else if (reward.category === 'perk') {
                auraBorder = 'aura-border-subtle hover:aura-border-primary';
                orbGlow = 'bg-[#040814]/80 aura-border-subtle aura-text-primary aura-glow-subtle';
              } else if (reward.category === 'descanso') {
                auraBorder = 'border-emerald-500/35 hover:border-emerald-400';
                orbGlow = 'bg-[#040814]/80 border-emerald-400/50 text-emerald-200';
              } else if (reward.category === 'ocio' || isCustom) {
                auraBorder = 'border-amber-500/30 hover:border-amber-400/70';
                orbGlow = 'bg-[#040814]/80 border-amber-400/45 text-amber-200';
              }

              return (
                <div
                  key={reward.id}
                  className={`relative isolate p-3 rounded-2xl bg-[#040a1a]/[0.94] border shadow-[0_8px_24px_rgba(0,0,0,0.45)] flex flex-col items-center justify-between text-center overflow-hidden transition-all group ${
                    canAfford ? auraBorder : 'border-white/10 opacity-75'
                  }`}
                >
                  <span className="vi-grano opacity-5" aria-hidden="true" />
                  <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

                  {/* Top Badges: Unlocked Counter & Delete (if custom) */}
                  <div className="relative z-10 w-full flex items-center justify-between text-[10px] font-mono mb-1">
                    {reward.unlockedCount && reward.unlockedCount > 0 ? (
                      <span className="text-emerald-300 font-bold bg-emerald-500/15 border border-emerald-400/40 px-1.5 py-0.5 rounded-full tabular-nums">
                        ✓ {reward.unlockedCount}
                      </span>
                    ) : <span />}

                    {isCustom && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustom(e, reward.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
                        title="Eliminar deseo personalizado"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Glowing Central Orb (Obsidian Inset) */}
                  <div
                    className={`relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex items-center justify-center text-2xl sm:text-3xl my-1 cursor-pointer transition-transform duration-150 hover:scale-105 active:scale-95 ${orbGlow}`}
                    onClick={() => {
                      if (canAfford) handleRedeem(reward);
                      else soundFX.playClick();
                    }}
                    title={canAfford ? 'Toca para canjear de inmediato' : `Requiere ${discountedCost} Monedas`}
                  >
                    <span>{reward.icon}</span>
                  </div>

                  {/* Title & Micro-Description */}
                  <div className="relative z-10 w-full px-0.5 mt-1">
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wide truncate transition-colors">
                      {reward.title}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium line-clamp-1 mt-0.5 leading-tight">
                      {reward.description}
                    </p>
                  </div>

                  {/* 1-Tap Redemption Button */}
                  <button
                    type="button"
                    onClick={() => handleRedeem(reward)}
                    disabled={!canAfford}
                    className={`relative z-10 chicle-btn w-full mt-2.5 min-h-[36px] py-1.5 px-2 rounded-xl text-xs font-anton uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                      canAfford
                        ? 'aura-btn-gradient optic-active-card cursor-pointer'
                        : 'bg-black/40 border border-white/10 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? (
                      <>
                        <Coins className="w-3.5 h-3.5 shrink-0" />
                        <span className="tabular-nums font-mono font-bold">{discountedCost}</span>
                      </>
                    ) : isShieldCapped ? (
                      <>
                        <Shield className="w-3 h-3 text-slate-500" />
                        <span>Máx. 3</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 text-slate-500" />
                        <span className="tabular-nums font-mono text-amber-400/70">{discountedCost}</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
        </div>
      )}

      {/* ─── 6. MODAL PARA FORJAR DESEO PERSONALIZADO (PORTAL AISLADO) ─── */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isAddModalOpen && (
            <div 
              className="fixed inset-0 z-[170] portal-modal-root bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-sans"
              onClick={() => setIsAddModalOpen(false)}
            >
              <motion.div 
                role="dialog"
                aria-modal="true"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative isolate w-full max-w-sm bg-[#030712]/[0.98] border border-white/10 rounded-2xl sm:rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.75)] overflow-hidden text-left"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Micrograno táctil Moxen Vidrio */}
                <span className="vi-grano opacity-5" aria-hidden="true" />

                {/* Filamento especular superior */}
                <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#040814]/[0.96] relative z-10">
                  <h3 className="text-sm font-anton uppercase tracking-wider text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" /> {copy.shopModalCreateTitle}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="chicle-btn w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
                    title="Cerrar (Esc)"
                    aria-label="Cerrar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="p-4 sm:p-5 space-y-3.5 relative z-10">
                  <div>
                    <label className="block text-[11px] font-anton uppercase tracking-wider text-slate-300 mb-1">
                      Nombre del Premio
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={60}
                      placeholder="Ej. Tarde de videojuegos, postre..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-medium rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--aura-color-1,#00f0ff)] transition-all placeholder:text-slate-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-anton uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1">
                        Costo <Coins className="w-3.5 h-3.5 text-amber-400" />
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="5000"
                        value={cost}
                        onChange={(e) => setCost(Number(e.target.value))}
                        className="w-full px-3.5 py-2 text-xs font-mono tabular-nums font-bold rounded-xl bg-black/40 border border-white/10 text-amber-300 focus:outline-none focus:border-amber-400 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-anton uppercase tracking-wider text-slate-300 mb-1">
                        Icono
                      </label>
                      <select
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-medium rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--aura-color-1,#00f0ff)] transition-all cursor-pointer"
                      >
                        <option value="🎁">🎁 Regalo</option>
                        <option value="☕">☕ Café Especial</option>
                        <option value="🎮">🎮 Videojuegos</option>
                        <option value="🍿">🍿 Cine / Serie</option>
                        <option value="🍕">🍕 Comida Libre</option>
                        <option value="🛋️">🛋️ Siesta / Tarde Libre</option>
                        <option value="🎧">🎧 Música / Audio</option>
                        <option value="📚">📚 Lectura</option>
                        <option value="🏖️">🏖️ Día Libre</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-anton uppercase tracking-wider text-slate-300 mb-1">
                      Motivación / Detalle (Opcional)
                    </label>
                    <input
                      type="text"
                      maxLength={140}
                      placeholder="Ej. Premio merecido por 7 días de racha."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-medium rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[var(--aura-color-1,#00f0ff)] transition-all placeholder:text-slate-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="chicle-btn px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white text-xs font-anton uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="chicle-btn aura-btn-gradient optic-active-card flex-1 py-2.5 text-xs font-anton uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      Guardar Recompensa
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
};
