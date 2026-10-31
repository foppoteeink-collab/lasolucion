import { create } from 'zustand';
import { ActiveTab, ThemeMode, NavigationMode, FloatingReward, TaskItem } from '../types';

export type ModalName = 
  | 'isDailyRewardsOpen' 
  | 'isLevelUpOpen' 
  | 'isFinishDayOpen' 
  | 'isDayTemplatesOpen' 
  | 'isPomodoroOpen' 
  | 'isNightlyReflectionOpen'
  | 'isSurpriseBossOpen'
  | 'isHunterCollapseOpen';

export interface QueuedModalItem {
  id: string;
  modalName: ModalName;
  data?: any;
}

export interface FloatingEffect {
  id: string;
  x: number;
  y: number;
  text: string;
  type: 'xp' | 'coins' | 'critical' | 'streak' | 'combo' | 'custom' | 'boss' | 'heal';
  colorClass?: string;
  isCrit?: boolean;
}

export interface SystemAuraData {
  name: string;
  backgroundColor: string;
  backgroundImage: string;
  colors?: string[]; // [c1, c2, c3, c4]
}

interface UIState {
  activeTab: ActiveTab;
  isTransitioning: boolean;
  themeMode: ThemeMode;
  navigationMode: NavigationMode;
  soundEnabled: boolean;
  screenFlash: 'damage' | 'heal' | 'buff' | null;
  isFocusModeActive: boolean; // INMUNIZADOR DE FLUJO
  zenMode: boolean; // MODO ZEN (REDUCCIÓN DE ESTÍMULOS / AHORRO BATERÍA)
  systemAura: SystemAuraData | null;
  
  // Modales
  isDailyRewardsOpen: boolean;
  isLevelUpOpen: boolean;
  isFinishDayOpen: boolean;
  isDayTemplatesOpen: boolean;
  isPomodoroOpen: boolean;
  isNightlyReflectionOpen: boolean;
  isSurpriseBossOpen: boolean;
  isHunterCollapseOpen: boolean;
  isTaskFormOpen: boolean;
  taskFormInitialTab: 'task' | 'habit' | 'oracle';
  isTacticalGuideOpen: boolean;
  tacticalGuideInitialStep: number;
  surpriseBossData: { archetypeName: string; buffName: string; buffDescription: string } | null;
  deleteConfirmTask: TaskItem | null;

  // Orquestador FIFO de Modales
  activeModal: ModalName | null;
  modalQueue: QueuedModalItem[];
  
  // Efectos Visuales
  floatingEffects: FloatingEffect[];
  floatingRewards: FloatingReward[];

  // Acciones
  setActiveTab: (tab: ActiveTab) => void;
  setFocusModeActive: (active: boolean) => void;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleSound: () => void;
  openTaskForm: (tab?: 'task' | 'habit' | 'oracle') => void;
  closeTaskForm: () => void;
  openTacticalGuide: (step?: number) => void;
  closeTacticalGuide: () => void;
  openSurpriseBoss: (data: { archetypeName: string; buffName: string; buffDescription: string }) => void;
  setModalState: (modalName: ModalName, isOpen: boolean, data?: any) => void;
  dismissCurrentModal: (modalName?: ModalName) => void;
  clearModalQueue: () => void;
  setDeleteConfirmTask: (task: TaskItem | null) => void;
  triggerScreenFlash: (type: 'damage' | 'heal' | 'buff') => void;
  addFloatingEffect: (effect: Omit<FloatingEffect, 'id'>) => void;
  removeFloatingEffect: (id: string) => void;
  addFloatingReward: (reward: Omit<FloatingReward, 'id'>) => void;
  removeFloatingReward: (id: string) => void;
  setNavigationMode: (mode: NavigationMode) => void;
  toggleNavigationMode: () => void;
  toggleZenMode: () => void;
  setSystemAura: (aura: SystemAuraData | null) => void;
}

// Convierte un color HEX a RGB numérico para sombras/glows
export const hexToRgb = (hex: string): string => {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return '0, 240, 255';
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r}, ${g}, ${b}`;
};

export const applyAuraCssTokens = (aura: SystemAuraData | null) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (!aura || !aura.colors || aura.colors.length === 0) {
    // Restablecer valores por defecto (Cian cuántico original)
    root.style.removeProperty('--aura-color-1');
    root.style.removeProperty('--aura-color-2');
    root.style.removeProperty('--aura-color-3');
    root.style.removeProperty('--aura-color-4');
    root.style.removeProperty('--aura-glow-rgb');
    root.style.removeProperty('--aura-gradient');
    return;
  }

  const c1 = aura.colors[0] || '#00f0ff';
  const c2 = aura.colors[1] || aura.colors[0] || '#8a2be2';
  const c3 = aura.colors[2] || c2;
  const c4 = aura.colors[3] || '#020d18';

  root.style.setProperty('--aura-color-1', c1);
  root.style.setProperty('--aura-color-2', c2);
  root.style.setProperty('--aura-color-3', c3);
  root.style.setProperty('--aura-color-4', c4);
  root.style.setProperty('--aura-glow-rgb', hexToRgb(c1));
  root.style.setProperty('--aura-gradient', `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`);
};

export const syncRootTheme = (_mode?: ThemeMode) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.add('dark');
};

const getSavedTheme = (): ThemeMode => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('taskquest_theme', 'dark');
      localStorage.setItem('taskquest_theme_preference', 'dark');
    } catch (e) {}
  }
  syncRootTheme('dark');
  return 'dark';
};

const getSavedNavMode = (): NavigationMode => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('taskquest_nav_mode') as NavigationMode;
      if (saved === 'nexus' || saved === 'classic') return saved;
    } catch (e) {}
  }
  return 'nexus'; // Default to ultra-clean Kai Nexus mode (no bottom bar)
};

const getSavedZenMode = (): boolean => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('taskquest_zen_mode') === 'true';
    } catch (e) {}
  }
  return false;
};

const getSavedSystemAura = (): SystemAuraData | null => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('taskquest_system_aura');
      if (raw) {
        const parsed = JSON.parse(raw);
        applyAuraCssTokens(parsed);
        return parsed;
      }
    } catch (e) {}
  }
  return null;
};

let modalTransitionTimeout: ReturnType<typeof setTimeout> | null = null;

export const useUIStore = create<UIState>((set, get) => ({
  activeTab: 'dashboard',
  isTransitioning: false,
  themeMode: getSavedTheme(),
  navigationMode: getSavedNavMode(),
  soundEnabled: true,
  screenFlash: null,
  isFocusModeActive: false,
  zenMode: getSavedZenMode(),
  systemAura: getSavedSystemAura(),
  
  isDailyRewardsOpen: false,
  isLevelUpOpen: false,
  isFinishDayOpen: false,
  isDayTemplatesOpen: false,
  isPomodoroOpen: false,
  isNightlyReflectionOpen: false,
  isSurpriseBossOpen: false,
  isHunterCollapseOpen: false,
  isTaskFormOpen: false,
  taskFormInitialTab: 'task',
  isTacticalGuideOpen: false,
  tacticalGuideInitialStep: 1,
  surpriseBossData: null,
  deleteConfirmTask: null,

  openTaskForm: (tab = 'task') => set({ isTaskFormOpen: true, taskFormInitialTab: tab }),
  closeTaskForm: () => set({ isTaskFormOpen: false }),
  openTacticalGuide: (step = 1) => set({ isTacticalGuideOpen: true, tacticalGuideInitialStep: step }),
  closeTacticalGuide: () => set({ isTacticalGuideOpen: false }),

  // FIFO Modal Queue State
  activeModal: null,
  modalQueue: [],
  
  floatingEffects: [],
  floatingRewards: [],

  setActiveTab: (tab) => {
    set({ activeTab: tab, isTransitioning: false });
  },

  setFocusModeActive: (active) => {
    set({ isFocusModeActive: active });
    if (!active) {
      // Drenar cola de modales pendientes si se desactiva el Focus Mode
      const state = get();
      if (state.modalQueue.length > 0 && !state.activeModal) {
        const [nextModal, ...remainingQueue] = state.modalQueue;
        set({
          modalQueue: remainingQueue,
          activeModal: nextModal.modalName,
          [nextModal.modalName]: true,
          ...(nextModal.data && nextModal.modalName === 'isSurpriseBossOpen' ? { surpriseBossData: nextModal.data } : {})
        } as any);
      }
    }
  },

  toggleTheme: () => {
    syncRootTheme('dark');
    return { themeMode: 'dark' };
  },

  setThemeMode: (_mode) => {
    syncRootTheme('dark');
    set({ themeMode: 'dark' });
  },

  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  setNavigationMode: (mode: NavigationMode) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('taskquest_nav_mode', mode);
      } catch (e) {}
    }
    set({ navigationMode: mode });
  },

  toggleNavigationMode: () => {
    const current = get().navigationMode;
    const next: NavigationMode = current === 'nexus' ? 'classic' : 'nexus';
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('taskquest_nav_mode', next);
      } catch (e) {}
    }
    set({ navigationMode: next });
  },

  toggleZenMode: () => {
    const next = !get().zenMode;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('taskquest_zen_mode', String(next));
      } catch (e) {}
    }
    set({ zenMode: next });
  },

  setSystemAura: (aura) => {
    if (typeof window !== 'undefined') {
      try {
        if (aura) {
          localStorage.setItem('taskquest_system_aura', JSON.stringify(aura));
        } else {
          localStorage.removeItem('taskquest_system_aura');
        }
      } catch (e) {}
    }
    applyAuraCssTokens(aura);
    set({ systemAura: aura });
  },

  // Enqueue or open modal through FIFO orchestrator
  setModalState: (modalName, isOpen, data) => {
    const state = get();

    if (isOpen) {
      // If modal is already active, do nothing
      if (state.activeModal === modalName) {
        if (data && modalName === 'isSurpriseBossOpen') {
          set({ surpriseBossData: data });
        }
        return;
      }

      // If another modal is currently active, enqueue this one without stomping
      // BLOQUEADOR POR FOCUS MODE (except for isPomodoroOpen which is the focus mode UI itself!)
      if ((state.isFocusModeActive && modalName !== 'isPomodoroOpen') || (state.activeModal !== null && state.activeModal !== modalName)) {
        const alreadyInQueue = state.modalQueue.some(item => item.modalName === modalName);
        if (!alreadyInQueue) {
          set((prev) => ({
            modalQueue: [...prev.modalQueue, {
              id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              modalName,
              data
            }]
          }));
        }
        return;
      }

      // No modal is currently active: open immediately
      set({
        activeModal: modalName,
        [modalName]: true,
        ...(data && modalName === 'isSurpriseBossOpen' ? { surpriseBossData: data } : {})
      } as any);
    } else {
      // Closing a modal
      if (modalTransitionTimeout) {
        clearTimeout(modalTransitionTimeout);
        modalTransitionTimeout = null;
      }

      const updates: Partial<UIState> = {
        [modalName]: false,
      } as any;

      if (state.activeModal === modalName) {
        updates.activeModal = null;
      }

      set(updates);

      // Check if there is another modal waiting in the queue
      const currentQueue = get().modalQueue;
      if (currentQueue.length > 0 && !get().isFocusModeActive) {
        const [nextModal, ...remainingQueue] = currentQueue;
        
        // Wait 250ms for previous modal exit animation to finish smoothly
        modalTransitionTimeout = setTimeout(() => {
          set({
            modalQueue: remainingQueue,
            activeModal: nextModal.modalName,
            [nextModal.modalName]: true,
            ...(nextModal.data && nextModal.modalName === 'isSurpriseBossOpen' ? { surpriseBossData: nextModal.data } : {})
          } as any);
          modalTransitionTimeout = null;
        }, 250);
      }
    }
  },

  dismissCurrentModal: (modalName) => {
    const state = get();
    const target = modalName || state.activeModal;
    if (target) {
      state.setModalState(target, false);
    }
  },

  clearModalQueue: () => {
    if (modalTransitionTimeout) {
      clearTimeout(modalTransitionTimeout);
      modalTransitionTimeout = null;
    }
    set({
      modalQueue: [],
      activeModal: null,
      isDailyRewardsOpen: false,
      isLevelUpOpen: false,
      isFinishDayOpen: false,
      isDayTemplatesOpen: false,
      isPomodoroOpen: false,
      isNightlyReflectionOpen: false,
      isSurpriseBossOpen: false,
      isHunterCollapseOpen: false,
    });
  },

  setDeleteConfirmTask: (task) => set({ deleteConfirmTask: task }),
  
  openSurpriseBoss: (data) => {
    get().setModalState('isSurpriseBossOpen', true, data);
  },

  triggerScreenFlash: (type) => {
    set({ screenFlash: type });
    setTimeout(() => {
      set({ screenFlash: null });
    }, 500);
  },

  addFloatingEffect: (effect) => {
    const id = `${Date.now()}-${Math.random()}`;
    set((state) => {
      // Keep maximum 12 concurrent effects to maintain high frame-rates
      const pruned = state.floatingEffects.slice(-11);
      return { floatingEffects: [...pruned, { ...effect, id }] };
    });
    setTimeout(() => {
      set((state) => ({ floatingEffects: state.floatingEffects.filter(e => e.id !== id) }));
    }, 900);
  },

  removeFloatingEffect: (id) => set((state) => ({
    floatingEffects: state.floatingEffects.filter(e => e.id !== id)
  })),

  addFloatingReward: (reward) => {
    const id = `${Date.now()}-${Math.random()}`;
    set((state) => {
      // Keep maximum 3 concurrent major reward banners
      const pruned = state.floatingRewards.slice(-2);
      return { floatingRewards: [...pruned, { ...reward, id }] };
    });
    setTimeout(() => {
      set((state) => ({ floatingRewards: state.floatingRewards.filter(r => r.id !== id) }));
    }, 2400);
  },

  removeFloatingReward: (id) => set((state) => ({
    floatingRewards: state.floatingRewards.filter(r => r.id !== id)
  }))
}));
