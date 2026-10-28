import React from 'react';
import { FileText, Edit3, Trash2, Lock, Crown, Clock, Coins, CheckCircle2, ShieldAlert } from 'lucide-react';
import { TaskItem } from '../../types';
import { SlashText } from './SlashText';
import { useMoxenVidrio } from '../../hooks/useMoxenVidrio';

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
  if (!task || !task.title) return null;
  const isLocked = isDayEnded && !task.completed;

  const cardRef = useMoxenVidrio<HTMLDivElement>({
    inclina: 6,
    suavidad: 8,
    active: true,
  });

  const vidrioStyle: React.CSSProperties = {
    '--vi-vidrio': isLocked
      ? 'rgba(21, 5, 0, 0.75)'
      : task.completed
      ? 'rgba(1, 20, 32, 0.75)'
      : 'rgba(2, 14, 23, 0.75)',
    '--vi-borde': isLocked
      ? 'rgba(217, 119, 6, 0.45)'
      : task.completed
      ? 'rgba(0, 240, 255, 0.50)'
      : 'rgba(245, 158, 11, 0.65)',
    '--vi-luz': isLocked
      ? 'rgba(245, 158, 11, 0.22)'
      : task.completed
      ? 'rgba(0, 240, 255, 0.35)'
      : 'rgba(245, 158, 11, 0.45)',
    '--vi-filo': isLocked
      ? 'rgba(245, 158, 11, 0.60)'
      : task.completed
      ? 'rgba(0, 240, 255, 0.95)'
      : 'rgba(245, 158, 11, 0.95)',
    '--vi-reflejo': isLocked
      ? 'rgba(245, 158, 11, 0.10)'
      : task.completed
      ? 'rgba(0, 240, 255, 0.22)'
      : 'rgba(245, 158, 11, 0.25)',
    '--vi-desenfoque': '20px',
    '--vi-grano': '0.07',
  } as React.CSSProperties;

  return (
    <div
      ref={cardRef}
      style={vidrioStyle}
      onClick={() => {
        onOpenEditModal(task);
      }}
      className={`vi-tarjeta p-3.5 sm:p-4 rounded-2xl cursor-pointer relative overflow-hidden transition-shadow ${
        isLocked
          ? 'opacity-85 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
          : task.completed
          ? 'shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:border-cyan-400'
          : 'shadow-[0_0_25px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]'
      }`}
    >
      {/* Glow corner ambient effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Cybernetic Crown Glyph */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            isLocked
              ? 'bg-amber-950/60 border-amber-500/50 text-amber-400'
              : task.completed
              ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
              : 'bg-amber-950/80 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
          }`}>
            {isLocked ? (
              <Lock className="w-5 h-5 text-rose-400" />
            ) : (
              <Crown className="w-5 h-5 fill-amber-400/20" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-anton uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-400 text-black shadow-[0_0_8px_rgba(245,158,11,0.6)]">
                MISIÓN LEGENDARIA // 2x
              </span>
              {task.timeBlock && (
                <span className="text-[10px] font-mono font-bold text-cyan-300 bg-[#011420] px-2 py-0.5 rounded-md border border-cyan-500/40 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  {task.timeBlock}
                </span>
              )}
              {task.completed ? (
                <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-400/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400" /> Completada
                </span>
              ) : isLocked ? (
                <span className="text-[10px] font-mono font-bold text-rose-300 bg-rose-950/80 border border-rose-600 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Lock className="w-3 h-3 text-rose-400" /> Bloqueada
                </span>
              ) : null}
            </div>

            <h4 className="text-sm sm:text-base font-anton tracking-wide truncate mt-1">
              {task.completed ? (
                <SlashText
                  text={task.title}
                  isCompleted={true}
                  className="text-cyan-300"
                  slashColor="#00f0ff"
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
                <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span className="italic font-mono text-[11px] line-clamp-2">"{task.notes}"</span>
                <Edit3 className="w-3 h-3 text-amber-400/60 opacity-0 group-hover/note:opacity-100 ml-auto shrink-0 mt-0.5" />
              </div>
            )}
          </div>
        </div>

        {/* Action button & Rewards */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right hidden sm:flex flex-col items-end text-xs font-mono font-bold text-amber-300">
            <span className="text-cyan-300">+{task.xpReward} XP</span>
            <span className="flex items-center gap-1 text-yellow-400">
              <Coins className="w-3 h-3" /> +{task.coinReward}
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
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Bloqueada</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(task.id, e);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-black text-xs font-anton tracking-wider uppercase border border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.6)] active:scale-95 cursor-pointer min-h-[40px] flex items-center gap-1.5 hover:brightness-110 transition-all"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[3]" />
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
              className={`px-3 py-1.5 rounded-xl bg-[#011420] text-cyan-300 text-xs font-mono font-bold border border-cyan-500/40 min-h-[40px] flex items-center ${
                isDayEnded ? 'cursor-default opacity-80' : 'hover:border-cyan-400 hover:text-white cursor-pointer'
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
              className={`p-2 rounded-lg border transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center ${
                task.notes
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-amber-950/40 border-cyan-500/20 hover:border-amber-500/40'
              }`}
              title={task.notes ? 'Ver / Editar nota de repaso' : 'Agregar nota de repaso'}
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEditModal(task);
              }}
              className="p-2 text-cyan-400 hover:text-white rounded-lg hover:bg-cyan-950/40 border border-transparent hover:border-cyan-500/30 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer transition-colors"
              title="Editar"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTask(task.id);
              }}
              className="p-2 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegendaryBountyCard;
