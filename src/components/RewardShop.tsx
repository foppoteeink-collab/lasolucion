import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShopReward } from '../types';
import { Coins, Plus, X, Trash2, Shield, Flame, Star, Sparkles } from 'lucide-react';
import { soundFX } from '../utils/audio';
import { triggerShockwave } from '../utils/celebration';
import { ScrollReveal } from './common/ScrollReveal';

import { useAppStore } from '../store/useAppStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { notificationService } from '../utils/notifications';
import { useUIStore } from '../store/useUIStore';
import { triggerHaptic } from '../utils/haptics';

export const RewardShop: React.FC = () => {
  const { stats, setStats, heal, openLootBox, useInventoryItem } = usePlayerStore();
  const inventory = stats.inventory || [];
  const unopenedBoxes = stats.unopenedBoxes || 0;
  const coins = stats.coins;
  const energia = stats.attributes?.energia || 10;
  const streakShields = stats.streakShields ?? 0;
  
  const rewards = useAppStore(state => state.shopRewards);
  const setShopRewards = useAppStore(state => state.setShopRewards);
  const triggerScreenFlash = useUIStore(state => state.triggerScreenFlash);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState(50);
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
    const finalCost = getDiscountedCost(reward);
    
    const success = usePlayerStore.getState().purchaseItem(finalCost, (prev) => {
      let extra = {};
      if (reward.id === 'perk-healing-potion') {
        extra = { hp: Math.min(prev.maxHp || 100, (prev.hp ?? 100) + 30) };
      }
      if (reward.id === 'perk-streak-shield') {
        extra = { streakShields: (prev.streakShields || 0) + 1 };
      }
      if (reward.id === 'perk-focus-potion') {
        // 1 hour focus potion
        const now = Date.now();
        const currentExpires = prev.focusPotionExpiresAt || now;
        extra = { focusPotionExpiresAt: Math.max(now, currentExpires) + 3600000 };
      }
      if (reward.id === 'perk-reroll-dice') {
        extra = { reRollDice: (prev.reRollDice || 0) + 1 };
      }
      return extra;
    });

    if (!success) return;

    if (reward.id === 'perk-healing-potion') {
      triggerScreenFlash('heal');
      triggerHaptic([100]);
      notificationService.triggerNotification('¡HP Restaurado! 💖', 'Te has curado 30 puntos de vida usando una Poción de Curación Mayor.', '💖');
    } else if (reward.id === 'perk-focus-potion') {
      triggerScreenFlash('buff');
      triggerHaptic([50, 100, 50]);
      notificationService.triggerNotification('¡Poción de Enfoque Activa! 🧪', 'Durante la próxima hora, ganarás 50% más monedas y experiencia en todas tus tareas.', '🧪');
    } else if (reward.id === 'perk-reroll-dice') {
      triggerScreenFlash('buff');
      triggerHaptic([80, 80]);
      notificationService.triggerNotification('¡Dado del Destino Obtenido! 🎲', 'Puedes usarlo para cambiar una tarea no deseada del día.', '🎲');
    }

    // Update reward count
    setShopRewards((prev: ShopReward[]) => 
      prev.map(r => r.id === reward.id ? { ...r, unlockedCount: (r.unlockedCount || 0) + 1 } : r)
    );

    soundFX.playCoin();
    soundFX.playSubBassConfirm();
    triggerShockwave({ color: 'violet', intensity: 'medium' });
  };

  const buyStreakShield = () => {
    const success = usePlayerStore.getState().purchaseItem(100, (prev) => ({
      streakShields: (prev.streakShields || 0) + 1
    }));
    
    if (!success) return;

    soundFX.playLevelUp();
    triggerShockwave({ color: 'cyan', intensity: 'medium' });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    soundFX.playClick();
    
    const newReward: ShopReward = {
      id: 'custom-' + Date.now(),
      title: title.trim(),
      description: description.trim() || 'Recompensa personalizada ganada con esfuerzo.',
      cost: Number(cost) || 30,
      icon,
      category,
      unlockedCount: 0
    };

    setShopRewards((prev: ShopReward[]) => [...prev, newReward]);

    setTitle('');
    setDescription('');
    setIsAddModalOpen(false);
  };

  const handleDeleteCustom = (e: any, id: string) => {
    e.stopPropagation();
    soundFX.playClick();
    setShopRewards((prev: ShopReward[]) => prev.filter(r => r.id !== id));
  };

  const customRewards = rewards.filter(r => r.id.startsWith('custom-'));
  const baseRewards = rewards.filter(r => !r.id.startsWith('custom-'));

  return (
    <div className="space-y-6 font-sans tracking-wide pb-10">
      
      {/* Header Banner - RPG Style */}
      <div className="relative overflow-hidden rounded-2xl scifi-glass-panel p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
        {/* Background glow effects */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#04020e] border border-cyan-400/80 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(0,240,255,0.35)]">
            🏪
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-anton text-white tracking-wide uppercase flex items-center gap-2">
              Mercado de Aventuras <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/60 uppercase font-mono">Cyber-Boutique</span>
            </h2>
            <p className="text-sm text-cyan-300/80 mt-1 font-medium">
              El fruto de tu disciplina se canjea aquí.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#04020e] text-amber-300 font-black font-mono text-sm border border-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
            <Coins className="w-5 h-5 text-amber-400 stroke-[2.5]" />
            <span>{coins} Oro</span>
          </div>

          <button
            onClick={() => {
              soundFX.playClick();
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black font-anton text-sm uppercase border border-cyan-300 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:scale-105 active:scale-95 cursor-pointer"
            title="Crear premio"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span className="hidden sm:inline">Nueva Recompensa</span>
          </button>
        </div>
      </div>

      {/* Inventory & Loot Boxes */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pl-1">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Tus Objetos y Botín
        </h3>
        
        {/* Loot Boxes */}
        {unopenedBoxes > 0 && (
          <div className="p-5 rounded-2xl bg-[#04020e]/80 border-2 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)] flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-yellow-950 flex items-center justify-center text-4xl border border-yellow-500 animate-pulse">
                🎁
              </div>
              <div>
                <h4 className="text-lg font-black font-anton text-yellow-400 uppercase tracking-wide">
                  Tienes {unopenedBoxes} Caja{unopenedBoxes !== 1 ? 's' : ''} de Botín
                </h4>
                <p className="text-xs text-yellow-300/80">
                  Otorgada por cumplir objetivos o golpear rachas. ¡Ábrela para descubrir tu premio!
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const { item, success } = openLootBox();
                if (success) {
                  soundFX.playLevelUp();
                  triggerHaptic([100, 100]);
                  triggerShockwave({ color: 'gold', intensity: 'epic' });
                  notificationService.triggerNotification(`¡Encontraste: ${item.name}!`, item.description, item.icon);
                }
              }}
              className="px-6 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-black font-anton uppercase border border-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.5)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              Abrir Caja
            </button>
          </div>
        )}

        {/* Inventory Items */}
        {inventory.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {inventory.map((item, idx) => (
              <div key={item.id} className="p-4 rounded-xl bg-[#04020e] border border-cyan-500/30 flex flex-col items-center text-center gap-2 relative">
                <span className="absolute top-2 right-2 text-[10px] font-black bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/50">
                  x{item.quantity}
                </span>
                <div className="text-4xl">{item.icon}</div>
                <h4 className="text-xs font-black font-anton text-white uppercase">{item.name}</h4>
                <p className="text-[10px] text-slate-400 leading-tight">{item.description}</p>
                <button
                  onClick={() => {
                    const success = useInventoryItem(item.id);
                    if (success) {
                      soundFX.playLevelUp();
                      triggerHaptic([50, 100, 50]);
                      triggerScreenFlash('buff');
                      notificationService.triggerNotification(`¡Usaste ${item.name}!`, 'El efecto ha sido activado.', item.icon);
                    }
                  }}
                  className="w-full mt-2 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Usar Ahora
                </button>
              </div>
            ))}
          </div>
        ) : (
          unopenedBoxes === 0 && (
            <div className="p-6 rounded-2xl border border-slate-800 bg-black/40 text-center">
              <p className="text-sm font-black text-slate-500 uppercase tracking-widest">
                Tu mochila está vacía.
              </p>
              <p className="text-xs text-slate-600 mt-1">Completa días perfectos o rachas de hábitos para conseguir objetos.</p>
            </div>
          )
        )}
      </div>

      {/* Featured Shield Item */}
      <div className="relative overflow-hidden p-5 rounded-2xl scifi-glass-panel border-2 border-cyan-400/70 shadow-[0_0_30px_rgba(0,240,255,0.2)] flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center gap-4 z-10">
          <div className="relative shrink-0 w-16 h-16 rounded-2xl bg-[#04020e] border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.35)]">
            <Shield className="w-8 h-8 text-cyan-300 stroke-[1.8]" />
            <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-black text-xs font-black border border-black shadow-lg">
              x{streakShields}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black font-anton text-white tracking-wide uppercase">
                Escudo de Racha
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-500/60 text-[10px] font-black uppercase tracking-wider">
                Protección Mítica
              </span>
            </div>
            <p className="text-xs text-cyan-300/80 mt-1 max-w-md leading-relaxed">
              Evita que tu racha regrese a cero si fallas un día. Se consume un escudo automáticamente para salvar tu progreso.
            </p>
          </div>
        </div>

        <button
          onClick={buyStreakShield}
          className={`z-10 px-6 py-3 rounded-xl text-sm font-black font-anton uppercase transition-all border shrink-0 cursor-pointer flex items-center gap-2 ${
            coins >= 100
              ? 'bg-amber-400 hover:bg-amber-300 text-black border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95'
              : 'bg-black/60 text-slate-500 border-slate-800 cursor-not-allowed'
          }`}
        >
          <Coins className={`w-4 h-4 stroke-[2.5] ${coins >= 100 ? 'text-black' : ''}`} />
          {coins >= 100 ? 'Forjar Escudo (100 Oro)' : `Falta oro (${coins}/100)`}
        </button>
      </div>

      {/* Rewards Grid - Custom */}
      {customRewards.length > 0 && (
        <ScrollReveal className="space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pl-1">
            <Star className="w-4 h-4 text-amber-400" />
            Tus Deseos Personalizados
          </h3>
          <motion.div 
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {customRewards.map((reward, idx) => <RewardCard key={reward.id} reward={reward} coins={coins} onRedeem={handleRedeem} onDelete={handleDeleteCustom} discountedCost={getDiscountedCost(reward)} index={idx} />)}
          </motion.div>
        </ScrollReveal>
      )}

      {/* Rewards Grid - Base */}
      <ScrollReveal className="space-y-4">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pl-1 pt-4">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Mercancía del Gremio
        </h3>
        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {baseRewards.map((reward, idx) => <RewardCard key={reward.id} reward={reward} coins={coins} onRedeem={handleRedeem} discountedCost={getDiscountedCost(reward)} index={idx} />)}
        </motion.div>
      </ScrollReveal>

      {/* Add Custom Reward Modal */}
      {isAddModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#00040A]/80 backdrop-blur-md font-sans tracking-wide"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-[#0F172A] border border-indigo-500/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" /> Forjar Recompensa
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-300 mb-1.5">
                  TÍTULO DEL DESEO
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Tarde de videojuegos, cine..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm font-bold rounded-xl bg-slate-900/50 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-300 mb-1.5">
                  DESCRIPCIÓN MÍTICA (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Premio merecido por completar todas las quests."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm font-medium rounded-xl bg-slate-900/50 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1.5 flex items-center gap-1">
                    COSTO <Coins className="w-3 h-3 text-amber-400" />
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="5000"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-sm font-bold rounded-xl bg-slate-900/50 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1.5">
                    ICONO
                  </label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-medium rounded-xl bg-slate-900/50 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none"
                  >
                    <option value="🎁">🎁 Regalo</option>
                    <option value="🍿">🍿 Cine / Serie</option>
                    <option value="🎮">🎮 Videojuegos</option>
                    <option value="☕">☕ Café / Postre</option>
                    <option value="🍔">🍔 Comida Libre</option>
                    <option value="👟">👟 Ropa / Gym</option>
                    <option value="🎧">🎧 Música / Relax</option>
                    <option value="🏖️">🏖️ Día Libre</option>
                    <option value="📚">📚 Libro</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-sm font-black rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] transition-all cursor-pointer"
                >
                  Conjurar Recompensa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

interface RewardCardProps {
  reward: ShopReward;
  coins: number;
  onRedeem: (r: ShopReward) => void;
  onDelete?: (e: any, id: string) => void;
  discountedCost: number;
  index?: number;
}

const RewardCard: React.FC<RewardCardProps> = ({ reward, coins, onRedeem, onDelete, discountedCost, index = 0 }) => {
  const canAfford = coins >= discountedCost;

  return (
    <motion.div
      initial={{ opacity: 0, y: 35, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ 
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
        delay: Math.min((index % 6) * 0.08, 0.32) 
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="group relative p-4 rounded-2xl bg-[#04020e]/90 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.15)] flex flex-col justify-between hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(0,240,255,0.35)] transition-all overflow-hidden text-white"
    >
      {/* Decorative background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <motion.div 
            animate={{ y: [-2, 2, -2] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-12 h-12 rounded-xl bg-[#04020e] border border-cyan-500/40 flex items-center justify-center text-2xl shadow-inner group-hover:border-cyan-400 transition-colors"
          >
            {reward.icon}
          </motion.div>
          
          <div className="flex items-center gap-2">
            {onDelete && (
              <button 
                onClick={(e) => onDelete(e, reward.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Eliminar recompensa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <span className="flex items-center gap-1.5 text-xs font-black font-mono text-amber-300 bg-amber-950/60 px-3 py-1 rounded-lg border border-amber-500/40 shadow-sm">
              <Coins className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
              {discountedCost}
            </span>
          </div>
        </div>

        <h4 className="text-sm font-black font-anton uppercase text-white truncate tracking-wide group-hover:text-cyan-300 transition-colors">
          {reward?.title || 'Recompensa'}
        </h4>
        <p className="text-xs text-cyan-300/80 mt-1 line-clamp-2 leading-relaxed font-medium">
          {reward.description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-cyan-500/20 flex items-center justify-between z-10">
        <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">
          Canjeado: {reward.unlockedCount || 0}
        </span>

        <button
          onClick={() => onRedeem(reward)}
          disabled={!canAfford}
          className={`px-4 py-1.5 rounded-xl text-xs font-black font-anton uppercase transition-all border cursor-pointer ${
            canAfford
              ? 'bg-cyan-500 hover:bg-cyan-400 text-black border-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.4)] hover:scale-105 active:scale-95'
              : 'bg-black/80 text-slate-500 border-slate-800 cursor-not-allowed'
          }`}
        >
          {canAfford ? 'Reclamar' : 'Bloqueado'}
        </button>
      </div>
    </motion.div>
  );
};
