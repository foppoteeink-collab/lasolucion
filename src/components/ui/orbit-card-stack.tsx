import React, {
  type CSSProperties,
  type FocusEvent,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react';
import { useReducedMotion } from 'motion/react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Layers, Sparkles, Zap } from 'lucide-react';
import { soundFX } from '../../utils/audio';

export interface OrbitStackItem {
  id?: string;
  name: string;
  role: string;
  description: string;
  accent?: string;
  initials?: string;
  stat?: string;
  badge?: string;
  image?: string;
  avatarIcon?: string | React.ReactNode;
  desire?: string;
  fear?: string;
  actionLabel?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
  metadata?: Record<string, any>;
}

export interface OrbitCardStackProps {
  items: OrbitStackItem[];
  className?: string;
  cardClassName?: string;
  defaultActiveIndex?: number;
  spread?: number;
  lift?: number;
  onActiveChange?: (item: OrbitStackItem, index: number) => void;
  showControls?: boolean;
  variant?: 'cyan' | 'purple' | 'amber' | 'emerald';
}

function inRange(index: number, length: number) {
  if (length <= 0) return 0;
  return Math.min(Math.max(0, index), Math.max(0, length - 1));
}

function getInitials(item: OrbitStackItem) {
  if (item.initials) return item.initials;
  return item.name
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export const OrbitCardStack: React.FC<OrbitCardStackProps> = ({
  items,
  className = '',
  cardClassName = '',
  defaultActiveIndex = 0,
  spread,
  lift = 34,
  onActiveChange,
  showControls = true,
  variant = 'cyan',
}) => {
  const reduceMotion = useReducedMotion() ?? false;
  const cards = items && items.length > 0 ? items : [];
  const restingIndex = inRange(defaultActiveIndex, cards.length);

  const [activeIndex, setActiveIndex] = useState(restingIndex);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  // Responsive check
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const actualSpread = spread ?? (isMobile ? 115 : 160);
  const midpoint = (cards.length - 1) / 2;

  const layouts = useMemo(() => {
    return cards.map((_, index) => {
      const orbit = index - midpoint;
      const stack = index - restingIndex;
      return {
        open: {
          x: orbit * actualSpread,
          y: Math.abs(orbit) * (isMobile ? 18 : 26) + Math.max(0, Math.abs(orbit) - 1) * (isMobile ? 6 : 10),
          rotation: orbit * (isMobile ? 5.5 : 7.5),
        },
        closed: {
          x: stack * (isMobile ? 7 : 9),
          y: Math.abs(stack) * (isMobile ? 3 : 4),
          rotation: stack * 2.2,
        },
      };
    });
  }, [cards, midpoint, restingIndex, actualSpread, isMobile]);

  const activate = (index: number, playAudio = true) => {
    const next = inRange(index, cards.length);
    setOpen(true);
    setActiveIndex(next);
    if (playAudio) {
      try {
        soundFX.playClick();
      } catch {}
    }
    if (cards[next] && onActiveChange) {
      onActiveChange(cards[next], next);
    }
  };

  const close = () => {
    setOpen(false);
    setActiveIndex(restingIndex);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prevIndex = (activeIndex - 1 + cards.length) % cards.length;
    activate(prevIndex);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIndex = (activeIndex + 1) % cards.length;
    activate(nextIndex);
  };

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      soundFX.playClick();
    } catch {}
    if (open) {
      close();
    } else {
      setOpen(true);
    }
  };

  const leaveFocus = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      // Don't auto-close on mobile blur to preserve touch state
      if (!isMobile) close();
    }
  };

  if (!cards.length) return null;

  const activeCard = cards[activeIndex] || cards[0];
  const accentColor = activeCard?.accent || '#00f0ff';

  return (
    <div className={`relative flex flex-col items-center justify-center w-full select-none ${className}`}>
      {/* 3D Orbit Stage */}
      <div
        className="relative w-full h-[400px] sm:h-[450px] flex items-center justify-center overflow-hidden"
        onMouseLeave={() => {
          if (!isMobile) close();
        }}
        onBlur={leaveFocus}
        ref={stageRef}
        role="region"
        aria-label="Orbit card deck"
      >
        {cards.map((item, index) => {
          const position = open ? layouts[index]?.open : layouts[index]?.closed;
          if (!position) return null;

          const active = index === activeIndex;
          const cardAccent = item.accent || accentColor;

          const style: CSSProperties = {
            zIndex: active ? 80 : 50 - Math.abs(index - activeIndex),
            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${
              position.y - (open && active ? lift : 0)
            }px)) rotate(${position.rotation}deg) scale(${active ? 1.02 : open ? 0.96 : 0.94})`,
            transitionDuration: reduceMotion ? '0ms' : '400ms',
          };

          return (
            <article
              key={item.id ?? `${item.name}-${index}`}
              role="button"
              tabIndex={0}
              aria-current={active ? 'true' : undefined}
              className={`absolute left-1/2 top-1/2 w-[min(82vw,20.5rem)] origin-bottom cursor-pointer rounded-[22px] p-4 text-white outline-none transition-[transform,box-shadow,border-color] ease-[cubic-bezier(.2,.8,.2,1)] backdrop-blur-xl ${
                active
                  ? 'border-2 shadow-[0_0_30px_rgba(0,240,255,0.35)] ring-1 ring-cyan-400/40 bg-[#061220]/95'
                  : 'border border-cyan-500/30 hover:border-cyan-400/70 bg-[#040814]/90 hover:bg-[#061426]/90 shadow-[0_4px_20px_rgba(0,0,0,0.6)]'
              } ${cardClassName}`}
              style={{
                ...style,
                borderColor: active ? cardAccent : undefined,
                boxShadow: active ? `0 0 30px ${cardAccent}55` : undefined,
              }}
              onMouseEnter={() => {
                if (!isMobile) activate(index);
              }}
              onFocus={() => activate(index)}
              onClick={() => activate(index)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                  event.preventDefault();
                  activate((index + 1) % cards.length);
                }
                if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                  event.preventDefault();
                  activate((index - 1 + cards.length) % cards.length);
                }
                if (event.key === 'Escape') {
                  event.currentTarget.blur();
                  close();
                }
              }}
            >
              {/* Top Accent Strip */}
              <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-white/10">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-cyan-300 truncate">
                  {item.role}
                </span>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold shrink-0 border"
                  style={{
                    backgroundColor: `${cardAccent}22`,
                    borderColor: `${cardAccent}66`,
                    color: cardAccent,
                  }}
                >
                  {item.stat ?? item.badge ?? 'SISTEMA'}
                </span>
              </div>

              {/* Portrait / Visual Card Header */}
              <div className="relative aspect-[1.8] w-full overflow-hidden rounded-xl border border-white/10 bg-black/60 flex items-center justify-center mb-3">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-2">
                    <span className="text-4xl sm:text-5xl drop-shadow-[0_0_15px_rgba(0,240,255,0.6)]">
                      {item.avatarIcon ?? '💠'}
                    </span>
                  </div>
                )}

                {/* Cyberpunk Scanline overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                {/* Corner Tag */}
                <span
                  className="absolute bottom-2 right-2 rounded-lg px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider uppercase border"
                  style={{
                    backgroundColor: '#04020e',
                    borderColor: `${cardAccent}88`,
                    color: cardAccent,
                  }}
                >
                  {getInitials(item)}
                </span>
              </div>

              {/* Card Title & Content */}
              <div className="space-y-2">
                <h3 className="font-anton text-base sm:text-lg uppercase tracking-wide text-white truncate flex items-center gap-1.5">
                  <span>{item.name}</span>
                </h3>

                <p className="text-xs text-slate-300 font-sans leading-relaxed line-clamp-3 bg-black/40 p-2 rounded-xl border border-white/5">
                  {item.description}
                </p>

                {/* Desire / Fear if provided (Jungian archetypes) */}
                {item.desire && (
                  <div className="text-[10px] font-mono text-cyan-300 truncate bg-cyan-950/40 px-2 py-1 rounded-lg border border-cyan-500/20">
                    <span className="text-white font-bold">🎯 Deseo: </span>
                    {item.desire}
                  </div>
                )}
                {item.fear && (
                  <div className="text-[10px] font-mono text-rose-300 truncate bg-rose-950/30 px-2 py-1 rounded-lg border border-rose-500/20">
                    <span className="text-white font-bold">⚠️ Sombra: </span>
                    {item.fear}
                  </div>
                )}
              </div>

              {/* Action Button on Active Card */}
              {item.actionLabel && (
                <div className="mt-3 pt-2.5 border-t border-white/10">
                  <button
                    type="button"
                    disabled={item.actionDisabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.onAction) item.onAction();
                    }}
                    className={`w-full py-2 px-3 rounded-xl font-anton text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
                      item.actionDisabled
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        : 'text-black shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:brightness-110'
                    }`}
                    style={{
                      backgroundColor: item.actionDisabled ? undefined : cardAccent,
                    }}
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>{item.actionLabel}</span>
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Holographic Controls for Mobile & Desktop */}
      {showControls && (
        <div className="flex items-center justify-between w-full max-w-sm px-4 mt-2 z-30">
          <button
            type="button"
            onClick={handlePrev}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#040814] border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-300 transition-all flex items-center gap-1 text-xs font-mono font-bold cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.2)] active:scale-95"
            title="Carta anterior"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          {/* Indicator & Fan Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleOpen}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                open
                  ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                  : 'bg-[#040814] text-cyan-300 border-cyan-500/40 hover:border-cyan-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{open ? 'Apilar' : 'Desplegar'}</span>
            </button>
            <span className="text-[11px] font-mono text-slate-400">
              <strong className="text-cyan-300">{activeIndex + 1}</strong> / {cards.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#040814] border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-300 transition-all flex items-center gap-1 text-xs font-mono font-bold cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.2)] active:scale-95"
            title="Siguiente carta"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
