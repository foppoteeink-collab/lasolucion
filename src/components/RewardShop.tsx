import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShopReward } from '../types';
import { 
  Coins, 
  Plus, 
  X, 
  Trash2, 
  Shield, 
  Flame, 
  Sparkles, 
  Heart, 
  Zap, 
  Check, 
  Lock,
  Gift,
  Coffee,
  Gamepad2,
  Package,
  Layers,
  Bot
} from 'lucide-react';
import { soundFX } from '../utils/audio';
import { triggerShockwave } from '../utils/celebration';
import { useAppStore } from '../store/useAppStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { notificationService } from '../utils/notifications';
import { useUIStore } from '../store/useUIStore';
import { triggerHaptic } from '../utils/haptics';

type FilterTab = 'todos' | 'vida_real' | 'perks' | 'kai' | 'descanso' | 'personalizados' | 'mochila';

export const RewardShop: React.FC = () => {
  const { stats, openLootBox, useInventoryItem } = usePlayerStore();
  const inventory = stats.inventory || [];
  const unopenedBoxes = stats.unopenedBoxes || 0;
  const coins = stats.coins || 0;
  const energia = stats.attributes?.energia || 10;
  const streakShields = stats.streakShields ?? 0;
  
  const rewards = useAppStore(state => state.shopRewards);
  const setShopRewards = useAppStore(state => state.setShopRewards);
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

  const getDiscountedCost = (reward: ShopReward) => {
    if (reward.category === 'descanso') {
      const discount = Math.floor(energia / 10) * 0.05;
      return Math.max(1, Math.floor(reward.cost * (1 - discount)));
    }
    return reward.cost;
  };

  const handleRedeem = (reward: ShopReward) => {
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
      if (reward.id === 'perk-healing-potion') {
        extra = { hp: Math.min(prev.maxHp || 100, (prev.hp ?? 100) + 30) };
      }
      if (reward.id === 'perk-streak-shield') {
        extra = { streakShields: Math.min((prev.streakShields || 0) + 1, 3) };
      }
      if (reward.id === 'perk-focus-potion') {
        const now = Date.now();
        const currentExpires = prev.focusPotionExpiresAt || now;
        extra = { focusPotionExpiresAt: Math.max(now, currentExpires) + 3600000 };
      }
      if (reward.id === 'kai-neural-core') {
        extra = { kaiNeuralForgeCharges: (prev.kaiNeuralForgeCharges || 0) + 1 };
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
            description: 'Pausa un hábito por 3 días sin perder su racha de 21 o 66 días.',
            icon: '❄️',
            rarity: 'rare',
            quantity: 1,
            effectType: 'streak_shield'
          });
        }
        extra = { inventory: inv };
      }
      if (reward.id === 'kai-synaptic-booster') {
        extra = { synapticBoosters: (prev.synapticBoosters || 0) + 1 };
      }
      if (reward.id === 'kai-wings-cyber') {
        extra = { kaiParticleEffect: 'wings' };
      }
      if (reward.id === 'kai-particle-matrix') {
        extra = { kaiParticleEffect: 'matrix' };
      }
      if (reward.id === 'kai-particle-solar') {
        extra = { kaiParticleEffect: 'solar' };
      }
      return extra;
    });

    if (!success) {
      soundFX.playClick();
      return;
    }

    if (reward.id === 'perk-healing-potion') {
      triggerScreenFlash('heal');
      triggerHaptic([100]);
      notificationService.triggerNotification('¡HP Restaurado! 💖', 'Te has curado 30 puntos de vida usando una Poción de Curación Mayor.', '💖');
    } else if (reward.id === 'perk-focus-potion') {
      triggerScreenFlash('buff');
      triggerHaptic([50, 100, 50]);
      notificationService.triggerNotification('¡Poción de Enfoque Activa! 🧪', 'Durante la próxima hora, ganarás 50% más monedas y experiencia en todas tus tareas.', '🧪');
    } else if (reward.id === 'perk-streak-shield') {
      triggerHaptic([80, 80]);
      notificationService.triggerNotification('¡Escudo Forjado! 🛡️', 'Tu racha está protegida ante cualquier imprevisto.', '🛡️');
    } else if (reward.id === 'kai-neural-core') {
      triggerScreenFlash('buff');
      triggerHaptic([100, 50, 100]);
      notificationService.triggerNotification('¡Núcleo de Forja Activado! 📸', '+1 Carga obtenida para escanear cualquier objeto real con tu cámara en el Taller KAI.', '📸');
    } else if (reward.id === 'kai-freeze-capsule') {
      triggerScreenFlash('buff');
      triggerHaptic([80, 40]);
      notificationService.triggerNotification('¡Cápsula Criogénica Guardada! ❄️', 'Añadida a tu mochila para congelar un hábito si te lesionas o viajas sin perder tu racha.', '❄️');
    } else if (reward.id === 'kai-synaptic-booster') {
      triggerScreenFlash('buff');
      triggerHaptic([120]);
      notificationService.triggerNotification('¡Acelerador Sináptico Adquirido! ⚡', 'Tu próximo registro de hábito avanzará al doble hacia tus 21 y 66 días.', '⚡');
    } else if (reward.id.startsWith('kai-')) {
      triggerScreenFlash('buff');
      triggerHaptic([60, 60]);
      notificationService.triggerNotification('¡Módulo KAI Equipado! 💠', `Has equipado ${reward.title} en tu compañero.`, '💠');
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

  // Filter Logic
  const filteredRewards = useMemo(() => {
    return rewards.filter((r) => {
      const isCustom = r.id.startsWith('custom-');
      if (activeTab === 'todos') return true;
      if (activeTab === 'personalizados') return isCustom;
      if (activeTab === 'kai') return r.category === 'kai' || r.id.startsWith('kai-');
      if (activeTab === 'perks') return r.category === 'perk';
      if (activeTab === 'vida_real') return r.category === 'ocio' || r.category === 'comida' || isCustom;
      if (activeTab === 'descanso') return r.category === 'descanso';
      return true;
    });
  }, [rewards, activeTab]);

  return (
    <div className="space-y-4 font-sans tracking-wide pb-20 text-white">
      
      {/* ─── 1. BÓVEDA HEADER HUD (MINIMALISTA & CYBERPUNK) ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-[#030614]/95 border border-purple-500/35 p-3.5 sm:p-4.5 flex flex-wrap items-center justify-between gap-3 shadow-[0_0_30px_rgba(168,85,247,0.15)] backdrop-blur-md">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#090518] border border-purple-400/80 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(168,85,247,0.4)] shrink-0">
            💎
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black font-anton text-white tracking-wide uppercase flex items-center gap-2">
              Bóveda de Recompensas
              <span className="text-[10px] px-2 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-500/50 uppercase font-mono hidden sm:inline">
                Canje Directo
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-medium leading-none mt-1">
              Convierte tu disciplina en placeres tangibles de la vida real.
            </p>
          </div>
        </div>

        {/* Coins Pill + Add Custom Reward Button */}
        <div className="flex items-center gap-2 relative z-10 ml-auto">
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#08051a] text-amber-300 font-black font-mono text-xs sm:text-sm border border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
            title="Monedas acumuladas"
          >
            <Coins className="w-4 h-4 text-amber-400 stroke-[2.5]" />
            <span>{coins}</span>
            <span className="text-[10px] font-sans font-bold text-amber-400/80 hidden sm:inline">Monedas</span>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-anton text-xs uppercase tracking-wider border border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all active:scale-95 cursor-pointer shrink-0"
            title="Crear recompensa personalizada"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Crear Deseo</span>
          </button>
        </div>
      </div>

      {/* ─── 2. FAST FILTER TABS (CYBERPUNK PILLS) ─── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none font-mono text-[11px] sm:text-xs">
        <button
          type="button"
          onClick={() => { soundFX.playClick(); setActiveTab('todos'); }}
          className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'todos'
              ? 'bg-purple-500/25 border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.35)] font-bold'
              : 'bg-[#030614]/80 border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Todos ({rewards.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { soundFX.playClick(); setActiveTab('vida_real'); }}
          className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'vida_real'
              ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.35)] font-bold'
              : 'bg-[#030614]/80 border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          <Coffee className="w-3.5 h-3.5 text-amber-400" />
          <span>Vida Real</span>
        </button>

        <button
          type="button"
          onClick={() => { soundFX.playClick(); setActiveTab('perks'); }}
          className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'perks'
              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.35)] font-bold'
              : 'bg-[#030614]/80 border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>Potenciadores</span>
        </button>

        <button
          type="button"
          onClick={() => { soundFX.playClick(); setActiveTab('kai'); }}
          className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'kai'
              ? 'bg-fuchsia-500/25 border-fuchsia-400 text-fuchsia-200 shadow-[0_0_12px_rgba(217,70,239,0.35)] font-bold'
              : 'bg-[#030614]/80 border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-fuchsia-400" />
          <span>KAI & Hábitos</span>
        </button>

        <button
          type="button"
          onClick={() => { soundFX.playClick(); setActiveTab('descanso'); }}
          className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'descanso'
              ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.35)] font-bold'
              : 'bg-[#030614]/80 border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          <Heart className="w-3.5 h-3.5 text-emerald-400" />
          <span>Descanso</span>
        </button>

        <button
          type="button"
          onClick={() => { soundFX.playClick(); setActiveTab('personalizados'); }}
          className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'personalizados'
              ? 'bg-rose-500/25 border-rose-400 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.35)] font-bold'
              : 'bg-[#030614]/80 border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          <span>Deseos</span>
        </button>

        <button
          type="button"
          onClick={() => { soundFX.playClick(); setActiveTab('mochila'); }}
          className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ml-auto ${
            activeTab === 'mochila'
              ? 'bg-blue-500/25 border-blue-400 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.35)] font-bold'
              : 'bg-[#030614]/80 border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-3.5 h-3.5 text-blue-400" />
          <span>Mochila ({inventory.length + (unopenedBoxes > 0 ? 1 : 0)})</span>
        </button>
      </div>

      {/* ─── 3. LOOT BOX ALERT (IF UNOPENED BOXES EXIST) ─── */}
      {unopenedBoxes > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/70 to-yellow-950/40 border border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-2xl animate-bounce shrink-0">
              🎁
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black font-anton text-amber-300 uppercase tracking-wide">
                ¡Tienes {unopenedBoxes} Cofre{unopenedBoxes !== 1 ? 's' : ''} de Botín!
              </h4>
              <p className="text-[11px] text-amber-200/80">
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
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-anton text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.5)] active:scale-95 cursor-pointer shrink-0"
          >
            Abrir
          </button>
        </motion.div>
      )}

      {/* ─── 4. INVENTORY TAB (MOCHILA DE OBJETOS) ─── */}
      {activeTab === 'mochila' ? (
        <div className="space-y-3">
          {inventory.length === 0 ? (
            <div className="p-8 rounded-2xl border border-white/10 bg-[#030614]/70 text-center space-y-2">
              <Package className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-anton text-slate-400 uppercase tracking-wider">Tu mochila está vacía</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Completa rachas perfectas o abre cajas de botín para almacenar pociones y pergaminos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {inventory.map((item) => (
                <div 
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-[#060414]/90 border border-blue-500/30 flex flex-col items-center text-center gap-1.5 relative group hover:border-blue-400 transition-all shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                >
                  <span className="absolute top-2 right-2 text-[10px] font-mono font-bold bg-blue-950/80 text-blue-300 px-2 py-0.2 rounded-full border border-blue-500/40">
                    x{item.quantity}
                  </span>
                  <div className="text-3xl my-1">{item.icon}</div>
                  <h4 className="text-xs font-anton text-white uppercase tracking-wide truncate w-full">{item.name}</h4>
                  <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">{item.description}</p>
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
                    className="w-full mt-2 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/50 text-[10px] font-anton uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                  >
                    Usar Ítem
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ─── 5. ORBITAL REWARDS GRID (CÁPSULAS ORBITALES ESTILO KAI) ─── */
        <motion.div 
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredRewards.map((reward) => {
              const discountedCost = getDiscountedCost(reward);
              const isShieldCapped = reward.id === 'perk-streak-shield' && streakShields >= 3;
              const canAfford = !isShieldCapped && coins >= discountedCost;
              const isCustom = reward.id.startsWith('custom-');

              // Categorization theme
              let auraBorder = 'border-purple-500/35 hover:border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.12)]';
              let orbGlow = 'bg-purple-950/50 border-purple-500/40 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]';
              
              if (reward.category === 'kai' || reward.id.startsWith('kai-')) {
                auraBorder = 'border-fuchsia-500/40 hover:border-cyan-400 shadow-[0_0_18px_rgba(217,70,239,0.25)]';
                orbGlow = 'bg-gradient-to-br from-fuchsia-950/70 to-cyan-950/70 border-fuchsia-400/60 text-cyan-200 shadow-[0_0_18px_rgba(0,240,255,0.35)]';
              } else if (reward.category === 'perk') {
                auraBorder = 'border-cyan-500/35 hover:border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.12)]';
                orbGlow = 'bg-cyan-950/50 border-cyan-500/40 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.3)]';
              } else if (reward.category === 'descanso') {
                auraBorder = 'border-emerald-500/35 hover:border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.12)]';
                orbGlow = 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200 shadow-[0_0_15px_rgba(52,211,153,0.3)]';
              } else if (reward.category === 'ocio' || isCustom) {
                auraBorder = 'border-amber-500/35 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.12)]';
                orbGlow = 'bg-amber-950/50 border-amber-500/40 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
              }

              return (
                <motion.div
                  key={reward.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className={`relative p-3 rounded-2xl bg-[#060414]/90 border flex flex-col items-center justify-between text-center overflow-hidden transition-all group ${
                    canAfford ? auraBorder : 'border-white/10 opacity-75'
                  }`}
                >
                  {/* Top Badges: Unlocked Counter & Delete (if custom) */}
                  <div className="w-full flex items-center justify-between text-[10px] font-mono mb-1">
                    {reward.unlockedCount && reward.unlockedCount > 0 ? (
                      <span className="text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-500/30 px-1.5 py-0.2 rounded-full">
                        ✓ {reward.unlockedCount}
                      </span>
                    ) : <span />}

                    {isCustom && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustom(e, reward.id)}
                        className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Eliminar deseo personalizado"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Glowing Central Orb (Estilo Orbe de Kai) */}
                  <motion.div 
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex items-center justify-center text-2xl sm:text-3xl my-1 relative cursor-pointer ${orbGlow}`}
                    onClick={() => {
                      if (canAfford) handleRedeem(reward);
                      else soundFX.playClick();
                    }}
                    title={canAfford ? 'Toca para canjear de inmediato' : `Requiere ${discountedCost} Oro`}
                  >
                    <span>{reward.icon}</span>
                  </motion.div>

                  {/* Title & Micro-Description */}
                  <div className="w-full px-0.5 mt-1">
                    <h4 className="text-xs font-anton text-white uppercase tracking-wide truncate group-hover:text-cyan-300 transition-colors">
                      {reward.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium line-clamp-1 mt-0.5 leading-tight">
                      {reward.description}
                    </p>
                  </div>

                  {/* 1-Tap Redemption Button */}
                  <button
                    type="button"
                    onClick={() => handleRedeem(reward)}
                    disabled={!canAfford}
                    className={`w-full mt-2.5 py-1.5 rounded-xl text-xs font-anton uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      canAfford
                        ? 'bg-amber-400 hover:bg-amber-300 text-black font-black shadow-[0_0_12px_rgba(245,158,11,0.35)] active:scale-95'
                        : 'bg-black/60 border border-white/10 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? (
                      <>
                        <Coins className="w-3.5 h-3.5 fill-current text-black" />
                        <span>{discountedCost}</span>
                      </>
                    ) : isShieldCapped ? (
                      <>
                        <Shield className="w-3 h-3 text-slate-600" />
                        <span>Máx. 3 activos</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 text-slate-600" />
                        <span>{discountedCost}</span>
                      </>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ─── 6. MODAL PARA FORJAR DESEO PERSONALIZADO ─── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#00040A]/85 backdrop-blur-md"
            onClick={() => setIsAddModalOpen(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-[#0a071c] border border-purple-500/40 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.02]">
                <h3 className="text-sm font-anton uppercase tracking-wider text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" /> Forjar Nuevo Deseo
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1 font-mono">
                    Nombre del Premio
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Tarde de videojuegos, postre..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl bg-black/60 border border-slate-700 text-white focus:outline-none focus:border-purple-400 transition-all placeholder:text-slate-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1 font-mono flex items-center gap-1">
                      Costo <Coins className="w-3 h-3 text-amber-400" />
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="5000"
                      value={cost}
                      onChange={(e) => setCost(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-black/60 border border-slate-700 text-amber-300 focus:outline-none focus:border-amber-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1 font-mono">
                      Icono
                    </label>
                    <select
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl bg-black/60 border border-slate-700 text-white focus:outline-none focus:border-purple-400 transition-all"
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
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1 font-mono">
                    Motivación / Detalle (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Premio merecido por 7 días de racha."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl bg-black/60 border border-slate-700 text-white focus:outline-none focus:border-purple-400 transition-all placeholder:text-slate-600"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-anton uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all cursor-pointer active:scale-95"
                  >
                    Guardar Recompensa
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
