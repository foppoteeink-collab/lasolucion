import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PlayerStats } from '../types';
import { getRankForLevel } from '../data/defaults';
import { useUIStore } from './useUIStore';
import { getTodayDateString, getYesterdayDateString, calcSleepDuration, getSleepQuality } from '../utils/date';

interface PlayerState {
  stats: PlayerStats;
  setStats: (updater: PlayerStats | ((prev: PlayerStats) => PlayerStats)) => void;
  addXpAndCoins: (xp: number, coins: number) => void;
  takeDamage: (amount: number) => { died: boolean, xpLost: number, coinsLost: number };
  heal: (amount: number) => void;
  purchaseItem: (cost: number, logic?: (stats: PlayerStats) => Partial<PlayerStats>) => boolean;
  finalizeDay: (currentDate: string, bonusXp: number, bonusCoins: number, bedtime: string) => void;
  registerWakeUp: (currentDate: string, customWakeTime?: string) => void;
  triggerLevelUp: () => void;
  reopenDay: (dateStr: string) => void;
  triggerSurpriseBoss: (data?: { archetypeName?: string; buffName?: string; buffDescription?: string }) => void;
}

// Economía Algorítmica: Curva de nivelación infinita
const calculateRequiredXp = (level: number): number => {
  return Math.round(100 * Math.pow(level, 1.5));
};

const INITIAL_PLAYER_STATS: PlayerStats = {
  level: 1,
  currentXp: 0,
  requiredXp: calculateRequiredXp(1),
  totalXpEarned: 0,
  coins: 0,
  hp: 100,
  maxHp: 100,
  streakDays: 0,
  streakShields: 0,
  lastActiveDate: '',
  lastDailyRewardClaimedDate: '',
  rankTitle: 'Chispazo de Voluntad',
  avatarIcon: '🛡️',
  characterClass: 'El Héroe',
  attributes: {
    disciplina: 0,
    fuerza: 0,
    mente: 0,
    energia: 0,
    estudio: 0,
  },
};

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      stats: INITIAL_PLAYER_STATS,

      setStats: (updater) => set((state) => {
        const raw = typeof updater === 'function' ? updater(state.stats) : updater;
        const lvl = typeof raw.level === 'number' && raw.level > 0 ? raw.level : 1;
        const expectedRank = getRankForLevel(lvl).title;
        const rankTitle = raw.rankTitle && (lvl === 1 || raw.rankTitle !== 'Chispazo de Voluntad')
          ? (raw.rankTitle === 'Aventurero' ? expectedRank : raw.rankTitle)
          : expectedRank;

        const nextStats: PlayerStats = {
          ...raw,
          level: lvl,
          rankTitle,
          requiredXp: calculateRequiredXp(lvl)
        };
        return { stats: nextStats };
      }),

      addXpAndCoins: (baseXp, baseCoins) => set((state) => {
        let xp = baseXp;
        let coins = baseCoins;
        
        if (state.stats.focusPotionExpiresAt && state.stats.focusPotionExpiresAt > Date.now()) {
          xp = Math.ceil(xp * 1.5);
          coins = Math.ceil(coins * 1.5);
        }

        let nextXp = (state.stats.currentXp || 0) + xp;
        let nextLevel = state.stats.level || 1;
        let requiredXp = calculateRequiredXp(nextLevel);
        let didLevelUp = false;

        while (nextXp >= requiredXp) {
          nextXp -= requiredXp;
          nextLevel += 1;
          requiredXp = calculateRequiredXp(nextLevel);
          didLevelUp = true;
        }

        const rankTitle = getRankForLevel(nextLevel).title;
        const nextStats: PlayerStats = {
          ...state.stats,
          currentXp: nextXp,
          level: nextLevel,
          requiredXp: requiredXp,
          rankTitle: rankTitle,
          totalXpEarned: (state.stats.totalXpEarned || 0) + xp,
          coins: (state.stats.coins || 0) + coins
        };

        if (didLevelUp) {
          setTimeout(() => {
            try {
              if (nextLevel > 10) {
                useUIStore.getState().setModalState('isLevelUpOpen', true);
              } else {
                useUIStore.getState().addFloatingEffect({
                  x: typeof window !== 'undefined' ? window.innerWidth / 2 : 200,
                  y: 120,
                  text: `⚡ ¡Nivel ${nextLevel} Alcanzado!`,
                  type: 'xp'
                });
              }
            } catch (e) {}
          }, 100);
        }

        return { stats: nextStats };
      }),

      takeDamage: (amount) => {
        const state = get();
        let result = { died: false, xpLost: 0, coinsLost: 0 };
        
        let currentHp = state.stats.hp ?? 100;
        let newHp = Math.max(0, currentHp - amount);
        let statsUpdates: Partial<PlayerStats> = { hp: newHp };
        
        if (newHp <= 0) {
          result.died = true;
          result.xpLost = Math.min(state.stats.currentXp, 15);
          result.coinsLost = Math.min(state.stats.coins, 10);
          
          statsUpdates.hp = state.stats.maxHp || 100;
          statsUpdates.currentXp = Math.max(0, state.stats.currentXp - result.xpLost);
          statsUpdates.coins = Math.max(0, state.stats.coins - result.coinsLost);
        }
        
        set({ stats: { ...state.stats, ...statsUpdates } });
        return result;
      },

      heal: (amount) => set((state) => {
        const maxHp = state.stats.maxHp || 100;
        const currentHp = state.stats.hp ?? 100;
        return {
          stats: {
            ...state.stats,
            hp: Math.min(maxHp, currentHp + amount)
          }
        };
      }),

      purchaseItem: (cost, logic) => {
        const state = get();
        if ((state.stats.coins || 0) >= cost) {
          const updates = logic ? logic(state.stats) : {};
          set({
            stats: {
              ...state.stats,
              coins: (state.stats.coins || 0) - cost,
              ...updates
            }
          });
          return true;
        }
        return false;
      },

      finalizeDay: (currentDate, bonusXp, bonusCoins, bedtime) => {
        set((state) => {
          let nextXp = (state.stats.currentXp || 0) + bonusXp;
          let nextLevel = state.stats.level || 1;
          let requiredXp = calculateRequiredXp(nextLevel);
          let didLevelUp = false;

          while (nextXp >= requiredXp) {
            nextXp -= requiredXp;
            nextLevel += 1;
            requiredXp = calculateRequiredXp(nextLevel);
            didLevelUp = true;
          }

          const rankTitle = getRankForLevel(nextLevel).title;
          const existingSleep = state.stats.sleepLogs?.[currentDate] || {};

          const nextStats = {
            ...state.stats,
            currentXp: nextXp,
            level: nextLevel,
            requiredXp: requiredXp,
            rankTitle: rankTitle,
            totalXpEarned: (state.stats.totalXpEarned || 0) + bonusXp,
            coins: (state.stats.coins || 0) + bonusCoins,
            finalizedDays: {
              ...(state.stats.finalizedDays || {}),
              [currentDate]: {
                finalizedAt: new Date().toISOString(),
                bonusXp,
                bonusCoins,
                sleepStartTime: bedtime,
                isSleepActive: true
              }
            },
            sleepLogs: {
              ...(state.stats.sleepLogs || {}),
              [currentDate]: {
                ...existingSleep,
                bedtime,
                wakeTime: undefined,
                sleepDurationHours: undefined,
                quality: undefined,
                recordedAt: new Date().toISOString(),
                isTrackingActive: true
              }
            }
          };

          if (didLevelUp) {
            setTimeout(() => {
              try {
                useUIStore.getState().setModalState('isLevelUpOpen', true);
              } catch (e) {}
            }, 100);
          }

          return { stats: nextStats };
        });
      },

      registerWakeUp: (currentDate, customWakeTime) => {
        set((state) => {
          const sleepLogs = state.stats.sleepLogs || {};

          const today = getTodayDateString();
          const yesterday = getYesterdayDateString();
          const pendingDate = (() => {
            if (sleepLogs[currentDate]?.bedtime && !sleepLogs[currentDate]?.wakeTime) return currentDate;
            if (sleepLogs[today]?.bedtime && !sleepLogs[today]?.wakeTime) return today;
            if (sleepLogs[yesterday]?.bedtime && !sleepLogs[yesterday]?.wakeTime) return yesterday;
            return null;
          })();

          if (!pendingDate) return {};

          const now = new Date();
          const wakeTime = customWakeTime || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          const existingSleep = sleepLogs[pendingDate];
          const bedtime = existingSleep.bedtime;

          const duration = calcSleepDuration(bedtime, wakeTime);
          const quality = duration !== null ? getSleepQuality(duration) : undefined;

          return {
            stats: {
              ...state.stats,
              finalizedDays: {
                ...(state.stats.finalizedDays || {}),
                [pendingDate]: {
                  ...(state.stats.finalizedDays?.[pendingDate] || { finalizedAt: now.toISOString(), bonusXp: 0, bonusCoins: 0, sleepStartTime: bedtime }),
                  isSleepActive: false,
                  actualWakeTime: wakeTime
                }
              },
              sleepLogs: {
                ...sleepLogs,
                [pendingDate]: {
                  ...existingSleep,
                  wakeTime,
                  sleepDurationHours: duration ?? undefined,
                  quality,
                  completedAt: now.toISOString(),
                  isTrackingActive: false
                }
              }
            }
          };
        });
      },

      reopenDay: (dateStr) => {
        set((state) => {
          const stats = { ...state.stats };
          if (stats.finalizedDays) {
            delete stats.finalizedDays[dateStr];
          }
          if (stats.sleepLogs) {
            delete stats.sleepLogs[dateStr];
          }
          return { stats };
        });
      },

      triggerLevelUp: () => {
        useUIStore.getState().setModalState('isLevelUpOpen', true);
      },

      triggerSurpriseBoss: (data) => {
        const bossInfo = {
          archetypeName: data?.archetypeName || 'Comandante de la Procrastinación',
          buffName: data?.buffName || 'Incursión Táctica Indeseada',
          buffDescription: data?.buffDescription || 'Se ha detectado una fluctuación de rendimiento. Neutraliza tus tareas pendientes para evitar penalizaciones de HP.'
        };
        useUIStore.getState().openSurpriseBoss(bossInfo);
      }
    }),
    {
      name: 'quantum-os-player-stats',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
