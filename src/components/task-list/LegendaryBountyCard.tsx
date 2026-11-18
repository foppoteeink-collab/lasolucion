import React from 'react';
import { Icon } from '../common/Icon';
import { TaskItem } from '../../types';
import { SlashText } from './SlashText';
import { useMoxenVidrio } from '../../hooks/useMoxenVidrio';
import { useUIStore } from '../../store/useUIStore';

interface LegendaryBountyCardProps {
  task: TaskItem;
  onToggle: (taskId: string, e: React.MouseEvent) => void;
  onOpenEditModal: (task: TaskItem) => void;
  onOpenNoteModal: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  isDayEnded?: boolean;
}

export const LegendaryBountyCard: React.FC<LegendaryBountyCardProps> = ({
  task,
  onToggle,
  onOpenEditModal,
  onOpenNoteModal,
  onDeleteTask,
  isDayEnded = false,
}) => {
  const zenMode = useUIStore((s) => s.zenMode);
  const cardRef = useMoxenVidrio<HTMLDivElement>({
    inclina: 6,
    suavidad: 8,
    active: !zenMode,
  });

  if (!task || !task.title) return null;
  const isLocked = isDayEnded && !task.completed;

  const vidrioStyle: React.CSSProperties = {
    '--vi-vidrio': isLocked
      ? 'rgba(18, 8, 12, 0.90)'
      : task.completed
      ? 'rgba(4, 10, 26, 0.94)'
      : 'rgba(4, 10, 26, 0.94)',
    '--vi-borde': isLocked
      ? 'rgba(244, 63, 94, 0.45)'
      : task.completed
      ? 'rgba(var(--aura-glow-rgb, 0, 240, 255), 0.50)'
      : 'rgba(245, 158, 11, 0.55)',
    '--vi-luz': isLocked
      ? 'rgba(244, 63, 94, 0.18)'
      : task.completed
      ? 'rgba(var(--aura-glow-rgb, 0, 240, 255), 0.30)'
      : 'rgba(245, 158, 11, 0.38)',
    '--vi-filo': isLocked
      ? 'rgba(244, 63, 94, 0.55)'
      : task.completed
      ? 'rgba(var(--aura-glow-rgb, 0, 240, 255), 0.90)'
      : 'rgba(245, 158, 11, 0.90)',
    '--vi-reflejo': isLocked
      ? 'rgba(244, 63, 94, 0.10)'
      : task.completed
      ? 'rgba(var(--aura-glow-rgb, 0, 240, 255), 0.20)'
      : 'rgba(245, 158, 11, 0.22)',
    '--vi-desenfoque': '20px',
    '--vi-grano': '0.06',
  } as React.CSSProperties;

  return (
    <div
      ref={cardRef}
      style={vidrioStyle}
      role="region"
      aria-label="Misión legendaria del día"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        onOpenEditModal(task);
      }}
      className={`vi-tarjeta isolate p-3.5 sm:p-4 rounded-2xl cursor-pointer relative overflow-hidden transition-shadow ${
        isLocked
          ? 'opacity-85 shadow-[0_8px_24px_rgba(0,0,0,0.45)]'
          : task.completed
          ? 'aura-glow-subtle hover:aura-border-primary'
          : 'shadow-[0_10px_28px_rgba(245,158,11,0.22)] hover:shadow-[0_12px_32px_rgba(245,158,11,0.34)]'
      }`}
    >
      {/* Glow corner ambient effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" data-ambient-glow="true" />
      <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Cybernetic Crown Glyph */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            isLocked
              ? 'bg-rose-950/60 border-rose-500/50 text-rose-400'
              : task.completed
              ? 'aura-bg-soft aura-border-primary aura-text-primary aura-glow-subtle optic-active-card'
              : 'bg-amber-950/80 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.45)]'
          }`}>
            {isLocked ? (
              <Icon name="lock" className="w-5 h-5 text-rose-400" />
            ) : (
              <Icon name="crown" className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="optic-active-card text-[10.5px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-400 text-black shadow-sm">
                MISIÓN LEGENDARIA · 2X
              </span>
              {task.timeBlock && (
                <span className="text-[10px] font-mono font-bold aura-text-primary bg-[#040814]/90 px-2 py-0.5 rounded-md border aura-border-subtle flex items-center gap-1 tabular-nums">
                  <Icon name="timer" className="w-3 h-3 aura-text-primary" />
                  {task.timeBlock}
                </span>
              )}
              {task.completed ? (
                <span className="optic-active-card text-[10px] font-mono font-bold aura-text-primary aura-bg-soft border aura-border-primary px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Icon name="checkCircle" className="w-3 h-3 aura-text-primary" /> Completada
                </span>
              ) : isLocked ? (
                <span className="text-[10px] font-mono font-bold text-rose-300 bg-rose-950/80 border border-rose-600 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Icon name="lock" className="w-3 h-3 text-rose-400" /> Bloqueada
                </span>
              ) : null}
            </div>

            <h4 
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onOpenEditModal(task);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpenEditModal(task);
                }
              }}
              aria-label={`Editar misión legendaria: ${task.title}`}
              className="text-sm sm:text-base font-anton tracking-wide truncate mt-1 cursor-pointer hover:aura-text-primary transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--aura-color-1,#00f0ff)] rounded"
            >
              {task.completed ? (
                <SlashText
                  text={task.title}
                  isCompleted={true}
                  className="aura-text-primary"
                />
              ) : (
                <span className={isLocked ? 'line-through text-slate-400 opacity-70 decoration-rose-500/50' : 'text-white'}>
                  {task.title}
                </span>
              )}
            </h4>

            {task.notes && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenNoteModal(task);
                }}
                className="mt-1.5 px-2.5 py-1 rounded-lg bg-black/40 hover:bg-black/60 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-1.5 transition-colors cursor-pointer group/note"
                title="Clic para ver o editar nota de repaso"
              >
                <Icon name="fileText" className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span className="italic font-mono text-[11px] line-clamp-2">"{task.notes}"</span>
                <Icon name="edit" className="w-3 h-3 text-amber-400/60 opacity-0 group-hover/note:opacity-100 ml-auto shrink-0 mt-0.5" />
              </div>
            )}
          </div>
        </div>

        {/* Action button & Rewards */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right hidden sm:flex flex-col items-end text-xs font-mono font-bold tabular-nums text-amber-300">
            <span className="aura-text-primary">+{task.xpReward ?? 20} XP</span>
            <span className="flex items-center gap-1 text-amber-400">
              <Icon name="coins" className="w-3 h-3" /> +{task.coinReward ?? 8}
            </span>
          </div>

          {!task.completed ? (
            isLocked ? (
              <button
                type="button"
                disabled
                className="px-3.5 py-2 rounded-xl bg-rose-950/60 text-rose-300 border border-rose-800/60 text-xs font-mono font-bold cursor-not-allowed min-h-[40px] flex items-center gap-1.5 opacity-85"
                title="Misión no completada: bloqueada tras finalizar el día"
              >
                <Icon name="lock" className="w-3.5 h-3.5 text-rose-400" />
                <span>Bloqueada</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(task.id, e);
                }}
                className="chicle-btn optic-active-card px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-black text-xs font-anton tracking-wider uppercase border border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)] cursor-pointer min-h-[40px] flex items-center gap-1.5 hover:brightness-110 transition-all"
              >
                <Icon name="checkCircle" className="w-4 h-4 stroke-[3]" />
                <span>Completar</span>
              </button>
            )
          ) : (
            <button
              type="button"
              disabled={isDayEnded}
              onClick={(e) => {
                if (isDayEnded) return;
                e.stopPropagation();
                onToggle(task.id, e);
              }}
              className={`chicle-btn px-3 py-1.5 rounded-xl bg-[#040814]/90 aura-text-primary text-xs font-mono font-bold border aura-border-subtle min-h-[40px] flex items-center ${
                isDayEnded ? 'cursor-default opacity-80' : 'hover:aura-border-primary hover:text-white cursor-pointer'
              }`}
              title={isDayEnded ? 'Completada (Día finalizado)' : 'Desmarcar'}
            >
              {isDayEnded ? 'Completada' : 'Desmarcar'}
            </button>
          )}

          <div className="flex gap-1 ml-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenNoteModal(task);
              }}
              className={`chicle-btn p-2 rounded-xl border transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center ${
                task.notes
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.3)] optic-active-card'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-amber-950/40 border-white/10 hover:border-amber-500/40'
              }`}
              title={task.notes ? 'Ver / Editar nota de repaso' : 'Agregar nota de repaso'}
            >
              <Icon name="fileText" className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEditModal(task);
              }}
              className="chicle-btn p-2 aura-text-primary hover:text-white rounded-xl hover:bg-white/[0.08] border border-transparent hover:border-white/15 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer transition-colors"
              title="Editar"
            >
              <Icon name="edit" className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTask(task.id);
              }}
              className="chicle-btn p-2 text-rose-400 hover:text-rose-300 rounded-xl hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer transition-colors"
              title="Eliminar"
            >
              <Icon name="trash" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegendaryBountyCard;
