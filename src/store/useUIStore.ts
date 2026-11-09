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
  | 'isHunterCollapseOpen'
  | 'isDayRhythmOpen';

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

export type OpticMode = 'aurora' | 'noir' | 'eink' | 'cobalt';

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
  opticMode: OpticMode;
  navigationMode: NavigationMode;
  soundEnabled: boolean;
  screenFlash: 'damage' | 'heal' | 'buff' | null;
  isFocusModeActive: boolean; // INMUNIZADOR DE FLUJO
  zenMode: boolean; // MODO ZEN (REDUCCIÓN DE ESTÍMULOS / AHORRO BATERÍA)
  zenFont: string; // FONT PARA MODO ZEN
  timeFormat: '12h' | '24h';
  systemAura: SystemAuraData | null;
  handDominance: 'right' | 'left';
  glowIntensity: 'off' | 'tactical' | 'neon';
  
  // Modales
  isDailyRewardsOpen: boolean;
  isLevelUpOpen: boolean;
  isFinishDayOpen: boolean;
  isDayTemplatesOpen: boolean;
  isPomodoroOpen: boolean;
  isNightlyReflectionOpen: boolean;
  isSurpriseBossOpen: boolean;
  isHunterCollapseOpen: boolean;
  isDayRhythmOpen: boolean;
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
  setZenFont: (font: string) => void;
  setTimeFormat: (fmt: '12h' | '24h') => void;
  setOpticMode: (mode: OpticMode) => void;
  setSystemAura: (aura: SystemAuraData | null) => void;
  triggerTransition: (durationMs?: number) => void;
  setHandDominance: (dominance: 'right' | 'left') => void;
  toggleHandDominance: () => void;
  setGlowIntensity: (level: 'off' | 'tactical' | 'neon') => void;
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

/**
 * Calcula la luminancia percibida relativa sRGB (rango 0 a 1).
 * Usado para asegurar contraste y legibilidad en elementos interactivos.
 */
export const getHexLuminance = (hex: string): number => {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return 0.5;
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export interface DerivedAuraPalette {
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  uiAccent1: string;
  uiAccent2: string;
}

/**
 * Deriva una paleta armónica cuádruple para 2, 3 o 4 colores con protección de legibilidad.
 * - 2 colores: A -> B -> A -> B (ciclo bicromático puro)
 * - 3 colores: A -> B -> C -> A (ciclo tridimensional continuo)
 * - 4 colores: A -> B -> C -> D (espectro completo directo)
 * Además, garantiza que los acentos de interfaz (botones, textos, halos) usen tonos luminosos
 * incluso si el usuario seleccionó un nodo negro/sombra en la malla de fondo.
 */
export const deriveSystemAuraPalette = (colors: string[] = []): DerivedAuraPalette => {
  if (!colors || colors.length === 0) {
    return {
      c1: '#00f0ff',
      c2: '#8a2be2',
      c3: '#ff007f',
      c4: '#020d18',
      uiAccent1: '#00f0ff',
      uiAccent2: '#8a2be2',
    };
  }

  const count = colors.length;
  let c1: string;
  let c2: string;
  let c3: string;
  let c4: string;

  if (count === 2) {
    c1 = colors[0];
    c2 = colors[1];
    c3 = colors[0];
    c4 = colors[1];
  } else if (count === 3) {
    c1 = colors[0];
    c2 = colors[1];
    c3 = colors[2];
    c4 = colors[0];
  } else {
    c1 = colors[0];
    c2 = colors[1];
    c3 = colors[2];
    c4 = colors[3] || colors[0];
  }

  // Filtrar candidatos luminosos para botones y acentos de UI (luminancia >= 0.18)
  const luminous = colors.filter(c => getHexLuminance(c) >= 0.18);
  const uiAccent1 = luminous[0] || (getHexLuminance(c1) >= 0.12 ? c1 : '#38bdf8');
  let uiAccent2 = luminous.find(c => c !== uiAccent1) || (luminous.length > 1 ? luminous[1] : null);
  if (!uiAccent2) {
    uiAccent2 = uiAccent1 === '#38bdf8' ? '#818cf8' : uiAccent1;
  }

  return { c1, c2, c3, c4, uiAccent1, uiAccent2 };
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

  const { c1, c2, c3, c4, uiAccent1, uiAccent2 } = deriveSystemAuraPalette(aura.colors);

  root.style.setProperty('--aura-color-1', uiAccent1);
  root.style.setProperty('--aura-color-2', uiAccent2);
  root.style.setProperty('--aura-color-3', c3);
  root.style.setProperty('--aura-color-4', c4);
  root.style.setProperty('--aura-glow-rgb', hexToRgb(uiAccent1));
  root.style.setProperty('--aura-gradient', `linear-gradient(135deg, ${uiAccent1} 0%, ${uiAccent2} 100%)`);
};

export const syncRootTheme = (_mode?: ThemeMode) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.add('dark');
};

export const applyOpticMode = (mode: OpticMode) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('optic-aurora', 'optic-noir', 'optic-eink', 'optic-cobalt', 'noir-mode');
  
  if (mode === 'aurora') {
    root.classList.add('optic-aurora');
  } else if (mode === 'noir') {
    root.classList.add('optic-noir', 'noir-mode');
  } else if (mode === 'eink') {
    root.classList.add('optic-eink');
  } else if (mode === 'cobalt') {
    root.classList.add('optic-cobalt');
  }
};

const getSavedOpticMode = (): OpticMode => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('taskquest_optic_mode') as OpticMode;
      if (saved && ['aurora', 'noir', 'eink', 'cobalt'].includes(saved)) {
        applyOpticMode(saved);
        return saved;
      }
    } catch (e) {}
  }
  applyOpticMode('aurora');
  return 'aurora';
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
      const isZen = localStorage.getItem('taskquest_zen_mode') === 'true';
      if (isZen) {
        document.documentElement.classList.add('zen-mode');
      } else {
        document.documentElement.classList.remove('zen-mode');
      }
      return isZen;
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

export const applyGlowIntensity = (level: 'off' | 'tactical' | 'neon') => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-glow', level);
};

const getSavedGlowIntensity = (): 'off' | 'tactical' | 'neon' => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('taskquest_glow_intensity') as 'off' | 'tactical' | 'neon';
      if (['off', 'tactical', 'neon'].includes(saved)) {
        applyGlowIntensity(saved);
        return saved;
      }
    } catch (e) {}
  }
  applyGlowIntensity('tactical');
  return 'tactical';
};

const getSavedHandDominance = (): 'right' | 'left' => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('taskquest_hand_dominance') as 'right' | 'left';
      if (saved === 'right' || saved === 'left') return saved;
    } catch (e) {}
  }
  return 'right';
};

const getSavedTimeFormat = (): '12h' | '24h' => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('taskquest_time_format');
      if (saved === '12h' || saved === '24h') return saved;
    } catch (e) {}
  }
  return '12h';
};

let modalTransitionTimeout: ReturnType<typeof setTimeout> | null = null;

export const useUIStore = create<UIState>((set, get) => ({
  activeTab: 'dashboard',
  isTransitioning: false,
  themeMode: getSavedTheme(),
  opticMode: getSavedOpticMode(),
  navigationMode: getSavedNavMode(),
  soundEnabled: true,
  screenFlash: null,
  isFocusModeActive: false,
  zenMode: getSavedZenMode(),
  zenFont: 'Indie Flower',
  timeFormat: getSavedTimeFormat(),
  systemAura: getSavedSystemAura(),
  handDominance: getSavedHandDominance(),
  glowIntensity: getSavedGlowIntensity(),
  
  isDailyRewardsOpen: false,
  isLevelUpOpen: false,
  isFinishDayOpen: false,
  isDayTemplatesOpen: false,
  isPomodoroOpen: false,
  isNightlyReflectionOpen: false,
  isSurpriseBossOpen: false,
  isHunterCollapseOpen: false,
  isDayRhythmOpen: false,
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
    const currentTab = get().activeTab;
    if (currentTab === tab) return;
    set({ activeTab: tab, isTransitioning: true });
    setTimeout(() => {
      set({ isTransitioning: false });
    }, 450);
  },

  triggerTransition: (durationMs = 1200) => {
    set({ isTransitioning: true });
    setTimeout(() => {
      set({ isTransitioning: false });
    }, durationMs);
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
        if (next) {
          document.documentElement.classList.add('zen-mode');
        } else {
          document.documentElement.classList.remove('zen-mode');
        }
      } catch (e) {}
    }
    set({ zenMode: next });
  },

  setZenFont: (font: string) => {
    set({ zenFont: font });
  },

  setOpticMode: (mode) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('taskquest_optic_mode', mode);
      } catch (e) {}
    }
    applyOpticMode(mode);
    if (mode === 'aurora') {
      applyAuraCssTokens(get().systemAura);
    }
    set({ opticMode: mode });
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
      isDayRhythmOpen: false,
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
  })),

  setTimeFormat: (fmt) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('taskquest_time_format', fmt);
      } catch (e) {}
    }
    set({ timeFormat: fmt });
  },

  setHandDominance: (dominance) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('taskquest_hand_dominance', dominance);
      } catch (e) {}
    }
    set({ handDominance: dominance });
  },

  toggleHandDominance: () => {
    const next = get().handDominance === 'right' ? 'left' : 'right';
    get().setHandDominance(next);
  },

  setGlowIntensity: (level) => {
    applyGlowIntensity(level);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('taskquest_glow_intensity', level);
      } catch (e) {}
    }
    set({ glowIntensity: level });
  }
}));
