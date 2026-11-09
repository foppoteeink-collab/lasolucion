import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon, IconName } from './common/Icon';
import { HoloCompanion, CompanionAuraState } from './HoloCompanion';
import { useUIStore } from '../store/useUIStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTaskStore } from '../store/useTaskStore';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';
import { getRankForLevel } from '../data/defaults';
import { getArchetypeDisplayName } from '../data/archetypes';
import { getTodayDateString } from '../utils/date';
import { soundFX } from '../utils/audio';
import { useDayCycle } from '../hooks/useDayCycle';
import { useNarrativeCopy } from '../hooks/useNarrativeCopy';

interface SidebarHUDProps {
  onOpenOracleWithPrompt?: (promptText?: string) => void;
  onOpenKaiWorkshop?: () => void;
  onOpenFinance?: () => void;
  archetype?: string;
  onDesktopExpandChange?: (expanded: boolean) => void;
}

interface SidebarNavItem {
  id: string;
  label: string;
  icon: IconName;
  accentColor: string;
  badgeText?: React.ReactNode;
  type: 'page' | 'gadget';
  isActive?: boolean;
  onClick: () => void;
}

const LivePomodoroBadge: React.FC = () => {
  const { isRunning, formattedTime } = useTimer();
  if (!isRunning) return null;
  return <span className="tabular-nums">{formattedTime}</span>;
};

export const SidebarHUD: React.FC<SidebarHUDProps> = ({
  onOpenOracleWithPrompt,
  onOpenKaiWorkshop,
  onOpenFinance,
  archetype = 'sabio',
  onDesktopExpandChange,
}) => {
  // Atomic selectors for UIStore
  const activeTab = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const setModalState = useUIStore((s) => s.setModalState);
  const isPomodoroOpen = useUIStore((s) => s.isPomodoroOpen);
  const openTaskForm = useUIStore((s) => s.openTaskForm);
  const handDominance = useUIStore((s) => s.handDominance);

  // Atomic selectors for PlayerStore
  const level = usePlayerStore((s) => s.stats.level || 1);
  const currentXp = usePlayerStore((s) => s.stats.currentXp || 0);
  const requiredXp = usePlayerStore((s) => s.stats.requiredXp || 100);
  const hp = usePlayerStore((s) => s.stats.hp ?? 100);
  const maxHp = usePlayerStore((s) => s.stats.maxHp || 100);
  const coins = usePlayerStore((s) => s.stats.coins || 0);
  const streakDays = usePlayerStore((s) => s.stats.streakDays || 0);
  const characterClass = usePlayerStore((s) => s.stats.characterClass);
  const rawFullName = usePlayerStore((s) => s.stats.fullName);
  const rawUsername = usePlayerStore((s) => s.stats.username);

  const stats = useMemo(() => ({
    level,
    currentXp,
    requiredXp,
    hp,
    maxHp,
    coins,
    streakDays,
    characterClass,
    fullName: rawFullName,
    username: rawUsername,
  }), [level, currentXp, requiredXp, hp, maxHp, coins, streakDays, characterClass, rawFullName, rawUsername]);

  // Atomic selectors for TaskStore: Select count primitives instead of the entire tasksByDate dictionary
  const todayStr = getTodayDateString();
  const completedTodayTasks = useTaskStore((s) => (s.tasksByDate[todayStr] || []).filter(t => t.completed).length);
  const pendingTodayTasks = useTaskStore((s) => (s.tasksByDate[todayStr] || []).filter(t => !t.completed).length);

  const { user } = useAuth();
  // Timer isRunning only: DO NOT consume formattedTime here to prevent 1 Hz re-renders of this 900-line HUD!
  const { isRunning: isTimerRunning } = useTimer();
  const { dayStatus, startDay, finishDay } = useDayCycle();
  const copy = useNarrativeCopy();

  const [isDesktopHovered, setIsDesktopHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Posición vertical libre en toda la barra izquierda + modo "oculto/replegado" para cuando estorbe
  const [tabY, setTabY] = useState<number>(() => {
    if (typeof window === 'undefined') return 340;
    const saved = Number(localStorage.getItem('lasolucion_sidebar_tab_y'));
    if (!Number.isNaN(saved) && saved >= 60) {
      return Math.min(saved, Math.max(64, window.innerHeight - 100));
    }
    return Math.max(260, Math.min(420, Math.round(window.innerHeight * 0.52)));
  });
  const [isTabTucked, setIsTabTucked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('lasolucion_sidebar_tab_tucked') === 'true';
  });
  const [isDraggingTab, setIsDraggingTab] = useState(false);
  const dragStateRef = useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
    startTabY: number;
    moved: boolean;
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    startTabY: 96,
    moved: false,
  });

  useEffect(() => {
    const onResize = () => {
      setTabY((prev) => Math.max(12, Math.min(prev, window.innerHeight - 68)));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleTabPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startTabY: tabY,
      moved: false,
    };
    setIsDraggingTab(true);
  };

  const handleTabPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current.pointerId !== e.pointerId) return;
    const dx = e.clientX - dragStateRef.current.startX;
    const dy = e.clientY - dragStateRef.current.startY;

    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      dragStateRef.current.moved = true;
    }

    if (Math.abs(dy) > 2) {
      const maxTop = typeof window !== 'undefined' ? window.innerHeight - 68 : 700;
      const nextY = Math.max(12, Math.min(maxTop, dragStateRef.current.startTabY + dy));
      setTabY(nextY);
    }
  };

  const finishTabPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current.pointerId !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const dx = e.clientX - dragStateRef.current.startX;
    const wasMoved = dragStateRef.current.moved;
    dragStateRef.current.pointerId = null;
    setIsDraggingTab(false);

    localStorage.setItem('lasolucion_sidebar_tab_y', String(Math.round(tabY)));

    const isRight = handDominance === 'right';

    // Deslizar hacia el borde exterior repliega la pestaña al borde para que no estorbe
    if (isRight ? (!isTabTucked && dx > 24) : (!isTabTucked && dx < -24)) {
      soundFX.playClick();
      setIsTabTucked(true);
      localStorage.setItem('lasolucion_sidebar_tab_tucked', 'true');
      return;
    }

    // Deslizar hacia el interior la vuelve a desplegar
    if (isRight ? (isTabTucked && dx < -18) : (isTabTucked && dx > 18)) {
      soundFX.playClick();
      setIsTabTucked(false);
      localStorage.setItem('lasolucion_sidebar_tab_tucked', 'false');
      return;
    }

    // Si fue un toque limpio sin arrastrar
    if (!wasMoved) {
      soundFX.playClick();
      if (isTabTucked) {
        setIsTabTucked(false);
        localStorage.setItem('lasolucion_sidebar_tab_tucked', 'false');
      } else {
        setIsMobileOpen(true);
      }
    }
  };

  const isExpanded = isDesktopHovered || isMobileOpen;

  useEffect(() => {
    onDesktopExpandChange?.(isDesktopHovered);
  }, [isDesktopHovered, onDesktopExpandChange]);

  // Cerrar con Escape en móvil/tablet
  useEffect(() => {
    if (!isMobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobileOpen]);

  const auraState: CompanionAuraState = useMemo(() => {
    if (isPomodoroOpen || isTimerRunning) return 'focus_trance';
    const currentHour = new Date().getHours();
    if (currentHour >= 18 && completedTodayTasks === 0 && pendingTodayTasks > 0) {
      return 'warning_amber';
    }
    return 'normal';
  }, [isPomodoroOpen, isTimerRunning, completedTodayTasks, pendingTodayTasks]);

  const cleanFullName = stats.fullName?.trim() && stats.fullName.trim().toLowerCase() !== 'cazador' ? stats.fullName.trim() : '';
  const cleanUsername = stats.username?.trim() && stats.username.trim().toLowerCase() !== 'cazador' && stats.username.trim() !== 'CazadorDelSistema' ? stats.username.trim() : '';
  const rawName = cleanFullName || cleanUsername || user?.displayName?.trim() || 'Usuario';
  const heroName = (rawName.split(' ')[0] || rawName).toUpperCase();
  const currentRank = getRankForLevel(stats.level || 1);
  const displayRankTitle = currentRank.title;
  const archetypeTitle = getArchetypeDisplayName(stats.characterClass);

  const xpPercent = Math.min(
    100,
    Math.max(0, ((stats.currentXp || 0) / Math.max(1, stats.requiredXp || 100)) * 100)
  );
  const hpPercent = Math.min(
    100,
    Math.max(0, ((stats.hp || 100) / Math.max(1, stats.maxHp || 100)) * 100)
  );

  const pageItems: SidebarNavItem[] = useMemo(
    () => [
      {
        id: 'stats',
        label: 'Perfil',
        icon: 'barChart',
        accentColor: '#06b6d4',
        badgeText: `NV.${stats.level || 1}`,
        type: 'page',
        isActive: activeTab === 'stats',
        onClick: () => {
          soundFX.playClick();
          setActiveTab('stats');
          setIsMobileOpen(false);
        },
      },
      {
        id: 'dashboard',
        label: 'Tareas',
        icon: 'checkCircle',
        accentColor: '#00f0ff',
        badgeText: pendingTodayTasks > 0 ? `${pendingTodayTasks}` : undefined,
        type: 'page',
        isActive: activeTab === 'dashboard',
        onClick: () => {
          soundFX.playClick();
          setActiveTab('dashboard');
          setIsMobileOpen(false);
        },
      },
      {
        id: 'journal',
        label: 'Bitácora',
        icon: 'bookOpen',
        accentColor: '#38bdf8',
        type: 'page',
        isActive: activeTab === 'journal',
        onClick: () => {
          soundFX.playClick();
          setActiveTab('journal');
          setIsMobileOpen(false);
        },
      },
      {
        id: 'shop',
        label: 'Tienda',
        icon: 'shoppingBag',
        accentColor: '#10b981',
        badgeText: `${stats.coins || 0}`,
        type: 'page',
        isActive: activeTab === 'shop',
        onClick: () => {
          soundFX.playClick();
          setActiveTab('shop');
          setIsMobileOpen(false);
        },
      },
      {
        id: 'skills',
        label: 'Lab',
        icon: 'flask',
        accentColor: '#8b5cf6',
        type: 'page',
        isActive: activeTab === 'skills',
        onClick: () => {
          soundFX.playClick();
          setActiveTab('skills');
          setIsMobileOpen(false);
        },
      },
      {
        id: 'settings',
        label: 'Ajustes',
        icon: 'settings',
        accentColor: '#ec4899',
        type: 'page',
        isActive: activeTab === 'settings',
        onClick: () => {
          soundFX.playClick();
          setActiveTab('settings');
          setIsMobileOpen(false);
        },
      },
    ],
    [activeTab, pendingTodayTasks, stats.coins, stats.level, setActiveTab]
  );

  const gadgetItems: SidebarNavItem[] = useMemo(
    () => [
      {
        id: 'pomodoro',
        label: 'Foco',
        icon: 'timer',
        accentColor: '#f43f5e',
        badgeText: isTimerRunning ? <LivePomodoroBadge /> : undefined,
        type: 'gadget',
        onClick: () => {
          soundFX.playClick();
          setModalState('isPomodoroOpen', true);
          setIsMobileOpen(false);
        },
      },
      {
        id: 'oracle',
        label: 'Oráculo',
        icon: 'sparkles',
        accentColor: '#eab308',
        type: 'gadget',
        onClick: () => {
          soundFX.playClick();
          if (onOpenOracleWithPrompt) {
            onOpenOracleWithPrompt();
          }
          setIsMobileOpen(false);
        },
      },
      {
        id: 'finance',
        label: 'Finanzas',
        icon: 'wallet',
        accentColor: '#10b981',
        type: 'gadget',
        onClick: () => {
          soundFX.playClick();
          onOpenFinance?.();
          setIsMobileOpen(false);
        },
      },
      {
        id: 'workshop',
        label: 'Taller KAI',
        icon: 'palette',
        accentColor: '#d946ef',
        type: 'gadget',
        onClick: () => {
          soundFX.playClick();
          onOpenKaiWorkshop?.();
          setIsMobileOpen(false);
        },
      },
    ],
    [
      isTimerRunning,
      setModalState,
      onOpenOracleWithPrompt,
      openTaskForm,
      onOpenFinance,
      onOpenKaiWorkshop,
    ]
  );

  return (
    <>
      {/* ================================================================== */}
      {/* ORBE / ESCUDO TÁCTICO DE KAI EN MÓVIL Y TABLET (< 1024px)          */}
      {/* Opción A: +20px, fondo sólido sin texto "MENÚ", arrastrable        */}
      {/* Adaptativo: Se ancla a la izquierda o derecha según ergonomía HUD  */}
      {/* + Botón inteligente de Jornada acoplado justo debajo de KAI        */}
      {/* ================================================================== */}
      <div
        className={`lg:hidden fixed ${handDominance === 'right' ? 'right-0 items-end' : 'left-0 items-start'} z-[82] flex flex-col gap-1 select-none ${
          isMobileOpen
            ? handDominance === 'right'
              ? 'translate-x-full opacity-0 pointer-events-none'
              : '-translate-x-full opacity-0 pointer-events-none'
            : 'translate-x-0 opacity-100'
        }`}
        style={{
          top: `${tabY}px`,
          touchAction: 'none',
          transition: isDraggingTab
            ? 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease'
            : 'top 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
        }}
      >
        {isTabTucked ? (
          /* Modo Guardado en el Borde: Línea de luz de 6px ultra-discreta */
          <div
            className={`group flex items-center justify-center w-2.5 h-14 ${
              handDominance === 'right' ? 'rounded-l-full border-r-0' : 'rounded-r-full border-l-0'
            } bg-[#040814]/98 backdrop-blur-2xl border transition-all hover:w-3.5 cursor-pointer`}
            style={{
              borderColor: 'rgba(var(--aura-glow-rgb, 0, 240, 255), 0.5)',
              boxShadow:
                '0 4px 16px rgba(0,0,0,0.85), 0 0 12px rgba(var(--aura-glow-rgb, 0, 240, 255), 0.28)',
            }}
            onPointerDown={handleTabPointerDown}
            onPointerMove={handleTabPointerMove}
            onPointerUp={finishTabPointer}
            onPointerCancel={finishTabPointer}
          >
            <div
              className="w-[3px] h-8 rounded-full"
              style={{
                background: 'var(--aura-color-1, #00f0ff)',
                boxShadow: '0 0 8px rgba(var(--aura-glow-rgb, 0, 240, 255), 0.8)',
              }}
            />
          </div>
        ) : (
          /* Opción A: Escudo Semicircular de KAI (+20px, fondo #040814 sólido, sin palabra MENÚ) */
          <div
            className={`relative flex items-center justify-center h-[56px] ${
              handDominance === 'right'
                ? 'pl-3.5 pr-2 rounded-l-full border-r-0'
                : 'pl-2 pr-3.5 rounded-r-full border-l-0'
            } bg-[#040814]/[0.97] backdrop-blur-2xl border transition-all cursor-grab active:cursor-grabbing`}
            style={{
              borderColor: 'rgba(var(--aura-glow-rgb, 0, 240, 255), 0.42)',
              boxShadow:
                '0 8px 26px rgba(0,0,0,0.92), 0 0 16px rgba(var(--aura-glow-rgb, 0, 240, 255), 0.18), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
            role="button"
            tabIndex={0}
            onPointerDown={handleTabPointerDown}
            onPointerMove={handleTabPointerMove}
            onPointerUp={finishTabPointer}
            onPointerCancel={finishTabPointer}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                soundFX.playClick();
                setIsMobileOpen(true);
              }
            }}
            title={
              handDominance === 'right'
                ? 'Toca a KAI para abrir menú • Arrastra arriba/abajo • Desliza a la derecha para guardar en el borde'
                : 'Toca a KAI para abrir menú • Arrastra arriba/abajo • Desliza a la izquierda para guardar en el borde'
            }
            aria-label="Abrir menú lateral de KAI"
          >
            {handDominance === 'right' ? (
              <>
                <div className="relative w-[44px] h-[44px] flex items-center justify-center shrink-0 pointer-events-none">
                  <HoloCompanion
                    archetype={archetype}
                    auraState={auraState}
                    size={27}
                    interactive={false}
                  />
                </div>
                <div
                  className="w-[2.5px] h-5 rounded-full ml-1.5 opacity-65 pointer-events-none"
                  style={{ background: 'var(--aura-color-1, #00f0ff)' }}
                />
              </>
            ) : (
              <>
                <div
                  className="w-[2.5px] h-5 rounded-full mr-1.5 opacity-65 pointer-events-none"
                  style={{ background: 'var(--aura-color-1, #00f0ff)' }}
                />
                <div className="relative w-[44px] h-[44px] flex items-center justify-center shrink-0 pointer-events-none">
                  <HoloCompanion
                    archetype={archetype}
                    auraState={auraState}
                    size={27}
                    interactive={false}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Botón Inteligente de Jornada acoplado JUSTO DEBAJO de KAI en el borde flotante */}
        <AnimatePresence mode="wait">
          {!isTabTucked && (dayStatus === 'idle' || dayStatus === 'ready_to_close') && (
            <motion.button
              key={dayStatus}
              type="button"
              initial={{ opacity: 0, x: handDominance === 'right' ? 16 : -16, scale: 0.92 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
                boxShadow:
                  dayStatus === 'idle'
                    ? [
                        '0 0 12px rgba(0,240,255,0.55), 0 0 24px rgba(214,244,33,0.35), inset 0 0 8px rgba(255,255,255,0.4)',
                        '0 0 24px rgba(0,240,255,0.95), 0 0 42px rgba(214,244,33,0.65), inset 0 0 14px rgba(255,255,255,0.75)',
                        '0 0 12px rgba(0,240,255,0.55), 0 0 24px rgba(214,244,33,0.35), inset 0 0 8px rgba(255,255,255,0.4)',
                      ]
                    : [
                        '0 0 12px rgba(245,158,11,0.55), 0 0 24px rgba(253,224,71,0.35), inset 0 0 8px rgba(255,255,255,0.4)',
                        '0 0 24px rgba(245,158,11,0.95), 0 0 42px rgba(253,224,71,0.65), inset 0 0 14px rgba(255,255,255,0.75)',
                        '0 0 12px rgba(245,158,11,0.55), 0 0 24px rgba(253,224,71,0.35), inset 0 0 8px rgba(255,255,255,0.4)',
                      ],
              }}
              exit={{ opacity: 0, x: handDominance === 'right' ? 20 : -20, scale: 0.85, transition: { duration: 0.15 } }}
              transition={{
                opacity: { duration: 0.2 },
                x: { duration: 0.2 },
                scale: { duration: 0.2 },
                boxShadow: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                soundFX.playClick();
                if (dayStatus === 'idle') {
                  startDay();
                } else {
                  finishDay();
                }
              }}
              title={
                dayStatus === 'idle'
                  ? 'Activar jornada oficial e iniciar el día'
                  : 'Cerrar jornada y registrar inicio de descanso'
              }
              className={`btn-neon-hunter relative ml-1 mt-1 px-3.5 py-2 text-[11px] sm:text-xs font-black tracking-wider flex items-center gap-2 cursor-pointer whitespace-nowrap rounded-r-2xl border-2 border-l-0 shrink-0 select-none active:scale-95 ${
                dayStatus === 'idle'
                  ? 'bg-gradient-to-r from-cyan-400 via-[#d6f421] to-cyan-300 text-[#020617] border-cyan-100 ring-2 ring-cyan-400/60'
                  : 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-300 text-[#020617] border-amber-100 ring-2 ring-amber-400/60'
              }`}
            >
              {/* Baliza de atención animada tipo radar */}
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-80 ${
                    dayStatus === 'idle' ? 'bg-cyan-700' : 'bg-amber-700'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    dayStatus === 'idle' ? 'bg-cyan-950' : 'bg-amber-950'
                  }`}
                />
              </span>

              <Icon
                name={dayStatus === 'idle' ? 'sun' : 'moon'}
                className="w-3.5 h-3.5 shrink-0 text-[#020617]"
              />
              <span className="font-extrabold uppercase tracking-wider">
                {dayStatus === 'idle' ? copy.startDayFull : copy.closeDayFull}
              </span>
              <Icon name="arrowRight" className="w-3 h-3 text-[#020617] shrink-0 animate-bounce-x" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Velo oscuro táctil cuando la barra está abierta en Móvil/Tablet */}
      {isMobileOpen && (
        <div
          onClick={() => {
            soundFX.playClick();
            setIsMobileOpen(false);
          }}
          className="lg:hidden fixed inset-0 z-[84] bg-black/70 backdrop-blur-sm transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* ================================================================== */}
      {/* BARRA LATERAL EXPANDIBLE HUD (.sidebar adaptada a La Solución)     */}
      {/* ================================================================== */}
      <aside
        onMouseEnter={() => setIsDesktopHovered(true)}
        onMouseLeave={() => setIsDesktopHovered(false)}
        style={{
          width: isExpanded ? 268 : 78,
          transition:
            'width 0.38s cubic-bezier(0.16, 1, 0.3, 1), transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`fixed ${
          handDominance === 'right'
            ? 'right-0 border-l shadow-[-12px_0_40px_rgba(0,0,0,0.75)]'
            : 'left-0 border-r shadow-[12px_0_40px_rgba(0,0,0,0.75)]'
        } top-0 bottom-0 z-[86] flex flex-col bg-[#060919]/95 backdrop-blur-2xl border-white/10 select-none overflow-hidden py-3 px-3 ${
          isMobileOpen
            ? 'translate-x-0'
            : handDominance === 'right'
              ? 'translate-x-full lg:translate-x-0'
              : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Filamento vertical luminoso hacia el contenido */}
        <div
          className={`absolute top-0 bottom-0 ${handDominance === 'right' ? 'left-0' : 'right-0'} w-px pointer-events-none`}
          style={{
            background:
              'linear-gradient(180deg, transparent, rgba(var(--aura-glow-rgb, 0, 240, 255), 0.45), transparent)',
          }}
        />

        {/* Botón cerrar en móvil/tablet */}
        {isMobileOpen && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              soundFX.playClick();
              setIsMobileOpen(false);
            }}
            aria-label="Cerrar menú lateral"
            className={`lg:hidden absolute top-5 ${handDominance === 'right' ? 'left-5' : 'right-5'} z-20 w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer`}
          >
            <Icon name="x" className="w-3.5 h-3.5" />
          </button>
        )}

        {/* ================================================================ */}
        {/* 1. CABECERA (.logo-details): KAI VIVO + PERFIL DEL USUARIO       */}
        {/* ================================================================ */}
        <div
          onClick={() => {
            soundFX.playClick();
            setActiveTab('stats');
            setIsMobileOpen(false);
          }}
          title="Ver Perfil y Rango del Usuario"
          className={`logo-details group relative rounded-2xl border transition-all duration-300 cursor-pointer shrink-0 ${
            isExpanded
              ? 'p-2.5 bg-gradient-to-br from-[#0b132b]/90 via-[#050b1a]/95 to-[#030712] border-cyan-500/30 shadow-[0_8px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]'
              : 'py-2 px-0 bg-transparent border-transparent flex flex-col items-center justify-center'
          }`}
        >
          <div className="flex items-center gap-3">
            {/* Holograma Vivo de KAI: Crece cuando el menú se despliega */}
            <div
              className="relative flex items-center justify-center shrink-0 transition-all duration-300"
              style={{
                width: isExpanded ? 58 : 50,
                height: isExpanded ? 58 : 50,
              }}
            >
              <div
                className="absolute inset-0 rounded-2xl transition-opacity duration-300 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle, rgba(0,240,255,0.22) 0%, transparent 72%)',
                  opacity: isExpanded ? 1 : 0.65,
                }}
              />
              <HoloCompanion
                archetype={archetype}
                auraState={auraState}
                size={isExpanded ? 32 : 26}
                interactive={false}
              />

            </div>

            {/* Datos del Usuario (.logo_name evolucionado): visibles al expandir */}
            <div
              className={`min-w-0 flex-1 transition-all duration-300 ${
                isExpanded
                  ? 'opacity-100 translate-x-0 pointer-events-auto'
                  : 'opacity-0 -translate-x-3 pointer-events-none w-0 overflow-hidden'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-anton text-sm tracking-wider text-white truncate group-hover:text-cyan-300 transition-colors">
                  {heroName}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-400/40 text-amber-300 text-[9px] font-mono font-bold shrink-0">
                  {stats.streakDays || 0}d
                </span>
              </div>

              <div className="text-[10.5px] font-medium text-cyan-300/95 truncate mt-0.5">
                {displayRankTitle}
              </div>

              <div className="text-[9.5px] font-mono text-slate-400 truncate">
                {archetypeTitle}
              </div>
            </div>
          </div>

          {/* Barras rápidas de EXP y HP cuando la barra está desplegada */}
          <div
            className={`transition-all duration-300 overflow-hidden ${
              isExpanded ? 'max-h-20 opacity-100 mt-2.5 pt-2 border-t border-white/10' : 'max-h-0 opacity-0 mt-0 pt-0'
            }`}
          >
            {/* EXP */}
            <div className="flex items-center gap-2 text-[9px] font-mono tabular-nums mb-1">
              <span className="text-cyan-400 font-bold w-6 shrink-0">EXP</span>
              <div className="flex-1 h-1.5 bg-black/80 rounded-full border border-cyan-500/30 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-500"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <span className="text-cyan-200 w-7 text-right shrink-0">{Math.round(xpPercent)}%</span>
            </div>

            {/* HP */}
            <div className="flex items-center gap-2 text-[9px] font-mono tabular-nums">
              <span className="text-rose-400 font-bold w-6 shrink-0">HP</span>
              <div className="flex-1 h-1.5 bg-black/80 rounded-full border border-rose-500/30 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-600 to-red-400 transition-all duration-500"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
              <span className="text-rose-200 w-7 text-right shrink-0">{Math.round(hpPercent)}%</span>
            </div>
          </div>
        </div>

        {/* Botón Inteligente de Jornada acoplado justo debajo de KAI dentro de la barra lateral con borde resplandeciente dinámico */}
        <AnimatePresence mode="wait">
          {dayStatus === 'idle' && (
            <motion.button
              key="sidebar-start-day"
              type="button"
              initial={{ opacity: 0, scale: 0.9, y: -6 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                boxShadow: [
                  '0 0 12px rgba(214,244,33,0.55), 0 0 24px rgba(0,240,255,0.45), inset 0 0 8px rgba(255,255,255,0.45)',
                  '0 0 24px rgba(214,244,33,0.95), 0 0 42px rgba(0,240,255,0.85), inset 0 0 14px rgba(255,255,255,0.8)',
                  '0 0 12px rgba(214,244,33,0.55), 0 0 24px rgba(0,240,255,0.45), inset 0 0 8px rgba(255,255,255,0.45)',
                ],
              }}
              exit={{ opacity: 0, scale: 0.85, y: -6, transition: { duration: 0.15 } }}
              transition={{
                opacity: { duration: 0.18 },
                scale: { duration: 0.18 },
                boxShadow: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                soundFX.playClick();
                startDay();
                setIsMobileOpen(false);
              }}
              title={copy.startDayTooltip}
              className={`btn-neon-hunter mt-1.5 w-full flex items-center justify-center gap-1.5 cursor-pointer shrink-0 rounded-full border-2 border-cyan-200 ring-2 ring-cyan-400/70 transition-transform active:scale-95 bg-gradient-to-r from-[#d6f421] via-cyan-300 to-[#d6f421] text-[#020617] ${
                isExpanded ? 'px-4 py-2 text-[11px] font-black tracking-wider uppercase' : 'p-2'
              }`}
            >
              <Icon name="sun" className="w-3.5 h-3.5 text-[#020617] shrink-0" />
              {isExpanded && (
                <>
                  <span className="whitespace-nowrap font-black">{copy.startDayFull}</span>
                  <Icon name="arrowRight" className="w-3 h-3 text-[#020617] shrink-0 animate-bounce-x" />
                </>
              )}
            </motion.button>
          )}

          {dayStatus === 'ready_to_close' && (
            <motion.button
              key="sidebar-close-day"
              type="button"
              initial={{ opacity: 0, scale: 0.9, y: -6 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                boxShadow: [
                  '0 0 12px rgba(253,224,71,0.55), 0 0 24px rgba(245,158,11,0.45), inset 0 0 8px rgba(255,255,255,0.45)',
                  '0 0 24px rgba(253,224,71,0.95), 0 0 42px rgba(245,158,11,0.85), inset 0 0 14px rgba(255,255,255,0.8)',
                  '0 0 12px rgba(253,224,71,0.55), 0 0 24px rgba(245,158,11,0.45), inset 0 0 8px rgba(255,255,255,0.45)',
                ],
              }}
              exit={{ opacity: 0, scale: 0.85, y: -6, transition: { duration: 0.15 } }}
              transition={{
                opacity: { duration: 0.18 },
                scale: { duration: 0.18 },
                boxShadow: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                soundFX.playClick();
                finishDay();
                setIsMobileOpen(false);
              }}
              title={copy.closeDayTooltip}
              className={`btn-neon-hunter mt-1.5 w-full flex items-center justify-center gap-1.5 cursor-pointer shrink-0 rounded-full border-2 border-amber-100 ring-2 ring-amber-400/70 transition-transform active:scale-95 bg-gradient-to-r from-[#fde047] via-amber-300 to-[#fde047] text-[#020617] ${
                isExpanded ? 'px-4 py-2 text-[11px] font-black tracking-wider uppercase' : 'p-2'
              }`}
            >
              <Icon name="moon" className="w-3.5 h-3.5 text-[#020617] shrink-0" />
              {isExpanded && (
                <>
                  <span className="whitespace-nowrap font-black">{copy.closeDayFull}</span>
                  <Icon name="arrowRight" className="w-3 h-3 text-[#020617] shrink-0 animate-bounce-x" />
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>

        {/* ================================================================ */}
        {/* 2. LISTA DE NAVEGACIÓN (.nav-list): 6 PESTAÑAS + 4 GADGETS       */}
        {/* ================================================================ */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none mt-3 space-y-1">
          {/* Etiqueta de sección sutil al expandir */}
          <div
            className={`px-2.5 text-[9px] font-mono uppercase tracking-[0.2em] text-slate-400 transition-opacity duration-200 ${
              isExpanded ? 'opacity-80 mb-1' : 'opacity-0 h-0 overflow-hidden'
            }`}
          >
            Navegación
          </div>

          <ul className="nav-list space-y-1">
            {pageItems.map((item) => {
              const active = Boolean(item.isActive);
              return (
                <li key={item.id} className="relative">
                  <button
                    type="button"
                    onClick={item.onClick}
                    title={!isExpanded ? item.label : undefined}
                    className={`group w-full h-[44px] rounded-xl flex items-center transition-all duration-200 cursor-pointer relative overflow-hidden ${
                      active
                        ? 'bg-white text-[#060919] font-bold shadow-[0_0_20px_rgba(0,240,255,0.35)]'
                        : 'bg-transparent text-slate-300 hover:bg-white hover:text-[#060919]'
                    }`}
                  >
                    {/* Contenedor fijo de 52px para que el icono esté siempre centrado en modo compacto (78px - 24px padding = 54px) */}
                    <span
                      className="w-[52px] shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                      style={{
                        color: active ? '#060919' : undefined,
                      }}
                    >
                      <Icon
                        name={item.icon}
                        className={`w-5 h-5 transition-colors duration-200 ${
                          active
                            ? 'text-[#060919]'
                            : 'text-slate-200 group-hover:text-[#060919]'
                        }`}
                      />
                    </span>

                    {/* Nombre del enlace (.links_name) */}
                    <span
                      className={`links_name text-[14px] font-semibold tracking-wide whitespace-nowrap transition-all duration-200 ${
                        isExpanded
                          ? 'opacity-100 translate-x-0'
                          : 'opacity-0 -translate-x-2 pointer-events-none'
                      }`}
                    >
                      {item.label}
                    </span>

                    {/* Indicador numérico limpio a la derecha cuando está expandido */}
                    {item.badgeText && isExpanded && (
                      <span
                        className={`ml-auto mr-3 text-[10px] font-mono tabular-nums font-bold transition-colors ${
                          active
                            ? 'text-[#060919]/80'
                            : 'text-cyan-300 group-hover:text-[#060919]/80'
                        }`}
                      >
                        {item.badgeText}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Divisor luminoso entre Pestañas y Gadgets */}
          <div className="my-2.5 px-2">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          </div>

          <div
            className={`px-2.5 text-[9px] font-mono uppercase tracking-[0.2em] text-fuchsia-300/80 transition-opacity duration-200 ${
              isExpanded ? 'opacity-90 mb-1' : 'opacity-0 h-0 overflow-hidden'
            }`}
          >
            Gadgets KAI
          </div>

          <ul className="nav-list space-y-1">
            {gadgetItems.map((item) => (
              <li key={item.id} className="relative">
                <button
                  type="button"
                  onClick={item.onClick}
                  title={!isExpanded ? item.label : undefined}
                  className="group w-full h-[42px] rounded-xl flex items-center text-slate-300 hover:bg-white hover:text-[#060919] transition-all duration-200 cursor-pointer relative overflow-hidden"
                >
                  <span
                    className="w-[52px] shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                    style={{ color: item.accentColor }}
                  >
                    <Icon
                      name={item.icon}
                      className="w-5 h-5 transition-colors duration-200 group-hover:text-[#060919]"
                    />
                  </span>

                  <span
                    className={`links_name text-[13.5px] font-medium tracking-wide whitespace-nowrap transition-all duration-200 ${
                      isExpanded
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 -translate-x-2 pointer-events-none'
                    }`}
                  >
                    {item.label}
                  </span>

                  {item.badgeText && isExpanded && (
                    <span className="ml-auto mr-3 text-[10px] font-mono tabular-nums font-bold text-rose-400 group-hover:text-[#060919]">
                      {item.badgeText}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
};

export default SidebarHUD;
