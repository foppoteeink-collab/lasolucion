import React from 'react';
import { TaskItem, TaskCategory, HabitMasteryRecord } from '../../types';
import { soundFX } from '../../utils/audio';
import { SlashText } from './SlashText';
import { TaskActionsDropdown } from '../TaskActionsDropdown';
import { useUIStore } from '../../store/useUIStore';
import { getTodayDateString } from '../../utils/date';
import { getCategoryStyle } from '../../data/categoryColors';
import { Icon } from '../common/Icon';

const getRarityBadge = (task: TaskItem) => {
  const isLegendary = task.isTracked2166 || task.isLegendaryBounty;
  if (isLegendary) {
    return {
      badgeStyle: 'text-amber-400 font-mono font-medium',
      label: '21/66',
      icon: <Icon name="sparkles" className="w-2.5 h-2.5 text-amber-400 shrink-0" />
    };
  }
  return { badgeStyle: '', label: '', icon: null };
};

const getCategoryIcon = (category?: string, colorHex?: string) => {
  const style: React.CSSProperties = { ...(colorHex ? { color: colorHex } : {}) };
  const cls = 'w-4 h-4 shrink-0';
  const name = (category?.toLowerCase() === 'entrenamiento' ? 'dumbbell' :
                category?.toLowerCase() === 'estudio' || category?.toLowerCase() === 'intelecto' ? 'bookOpen' :
                category?.toLowerCase() === 'trabajo' || category?.toLowerCase() === 'rutina' ? 'briefcase' :
                category?.toLowerCase() === 'limpieza' ? 'sparkles' :
                category?.toLowerCase() === 'comida' ? 'apple' :
                category?.toLowerCase() === 'creativo' ? 'palette' :
                category?.toLowerCase() === 'clientes' ? 'users' :
                category?.toLowerCase() === 'habito' ? 'zap' :
                category?.toLowerCase() === 'pomodoro' ? 'timer' : 'target');
  return <Icon name={name} className={cls} style={style} />;
};

function formatSingle24To12(hhmm: string): { time: string; period: string } {
  const match = hhmm.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return { time: hhmm.trim(), period: '' };
  let h = parseInt(match[1], 10);
  const m = match[2];
  const period = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return { time: String(h).padStart(2, '0') + ":" + m, period };
}

function parseScheduleTimeColumns(timeBlock: string | undefined, timeFormat: '12h' | '24h'): { mainTime: string; subPeriod: string; rangeSubtitle: string | null; } {
  if (!timeBlock || !timeBlock.trim()) return { mainTime: '--:--', subPeriod: 'LIBRE', rangeSubtitle: null };
  const parts = timeBlock.split(/[-–—]/).map(s => s.trim()).filter(Boolean);
  const startRaw = parts[0] || '';
  const endRaw = parts[1] || '';
  const startMatch = startRaw.match(/^(\d{1,2}):(\d{2})/);
  if (!startMatch) return { mainTime: startRaw.slice(0, 5) || '--:--', subPeriod: endRaw ? "a " + endRaw.slice(0, 5) : 'HORA', rangeSubtitle: timeBlock };
  const start24 = String(parseInt(startMatch[1], 10)).padStart(2, '0') + ":" + startMatch[2];
  const endMatch = endRaw.match(/^(\d{1,2}):(\d{2})/);
  const end24 = endMatch ? String(parseInt(endMatch[1], 10)).padStart(2, '0') + ":" + endMatch[2] : '';
  if (timeFormat === '12h') {
    const s12 = formatSingle24To12(start24);
    const e12 = end24 ? formatSingle24To12(end24) : null;
    return { mainTime: s12.time, subPeriod: s12.period, rangeSubtitle: e12 ? s12.time + " " + s12.period + " - " + e12.time + " " + e12.period : s12.time + " " + s12.period };
  }
  return { mainTime: start24, subPeriod: end24 ? "a " + end24 : '24H', rangeSubtitle: end24 ? start24 + " - " + end24 : start24 };
}

interface TaskCardProps {
  task: TaskItem;
  index?: number;
  currentDate?: string;
  isMenuOpen?: boolean;
  onToggleMenu?: (id: string | null) => void;
  onToggle: (taskId: string, e?: React.MouseEvent) => void;
  onIncrementHabit?: (taskId: string, e?: React.MouseEvent) => void;
  onEdit?: (task: TaskItem) => void;
  onOpenEditModal?: (task: TaskItem) => void;
  onDelete?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onOpenPomodoro?: (title: string, category: TaskCategory) => void;
  onOpenNoteModal?: (task: TaskItem) => void;
  onOpenSleepModal?: (task: TaskItem) => void;
  isDayEnded?: boolean;
  habitMastery?: Record<string, HabitMasteryRecord>;
}

const TaskCardComponent: React.FC<TaskCardProps> = (props) => {
  const { task, index = 0, currentDate, isMenuOpen = false, onToggleMenu, onToggle, onIncrementHabit, onEdit, onOpenEditModal, onDelete, onDeleteTask, onOpenPomodoro, onOpenNoteModal, isDayEnded = false } = props;
  if (!task || !task.title) return null;
  const isTogglingRef = React.useRef(false);
  const timeFormat = useUIStore(state => state.timeFormat);
  const isCompleted = task.completed;
  const handleEdit = onEdit || onOpenEditModal;
  const handleDelete = onDelete || onDeleteTask;
  const todayStr = getTodayDateString();
  const isFutureDay = Boolean(currentDate && currentDate > todayStr);
  const catStyle = getCategoryStyle(task.category);
  const rarity = getRarityBadge(task);
  const { mainTime, subPeriod, rangeSubtitle } = parseScheduleTimeColumns(task.timeBlock, timeFormat);
  const isCounterHabit = Boolean((task.isHabit || task.category === 'habito' || task.isQuickHabit || task.isTracked2166 || (task.targetCount && task.targetCount > 1)) && task.targetCount && task.targetCount > 1);
  const hexToRgba = (hex: string, alpha: number): string => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
  };
  const activeLineColor = isCompleted ? '#10b981' : catStyle.color;
  const lineStyle: React.CSSProperties = { background: "linear-gradient(180deg, " + activeLineColor + ", " + hexToRgba(activeLineColor, 0.55) + ")", boxShadow: "0 0 12px " + hexToRgba(activeLineColor, isCompleted ? 0.55 : 0.45) };
  const infoBoxStyle: React.CSSProperties = isCompleted
    ? { background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.10) 0%, rgba(22, 38, 52, 0.65) 50%, rgba(8, 17, 27, 0.90) 100%)', borderColor: 'rgba(16, 185, 129, 0.32)', boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 4px 14px -4px rgba(0, 0, 0, 0.45)' }
    : { background: "linear-gradient(135deg, " + hexToRgba(catStyle.color, 0.11) + " 0%, rgba(34, 56, 74, 0.62) 45%, rgba(8, 17, 27, 0.92) 100%)", borderColor: hexToRgba(catStyle.color, 0.32), boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.10), 0 6px 20px -8px rgba(0, 0, 0, 0.55)' };

  return (
    <div
      className="flex items-stretch gap-2.5 sm:gap-3.5 group transition-transform duration-200 ease-out hover:translate-x-0.5 relative z-0"
    >
      <div 
        role="button"
        tabIndex={0}
        onClick={() => handleEdit && handleEdit(task)} 
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleEdit && handleEdit(task);
          }
        }}
        className="les-time w-[58px] sm:w-[68px] text-right flex flex-col items-end justify-center shrink-0 select-none cursor-pointer py-0.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 rounded-lg" 
        title="Asignar horario"
        aria-label={`Asignar horario a: ${task.title}`}
      >
        <span className={isCompleted ? "font-bold text-[11px] sm:text-[12px] leading-tight tracking-tight font-mono transition-colors text-emerald-400/90" : "font-bold text-[11px] sm:text-[12px] leading-tight tracking-tight font-mono transition-colors text-[#f1f5f9] group-hover:text-cyan-300"}>
          {mainTime} {subPeriod}
        </span>
        {rangeSubtitle && rangeSubtitle.includes('-') && (
          <span className="les-range text-[#94a3b8] text-[9px] sm:text-[10px] font-semibold tracking-wider font-mono mt-0.5">
            {rangeSubtitle.split('-')[1].trim()}
          </span>
        )}
      </div>
      <div style={lineStyle} className="les-line w-[3.5px] rounded-full shrink-0 my-0.5 transition-all duration-300" />
      <div style={infoBoxStyle} className={"flex-1 min-w-0 px-2.5 py-2 sm:px-3.5 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3 relative isolate rounded-xl border backdrop-blur-xl group-hover:brightness-110 " + (isMenuOpen ? "ring-1 ring-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.25)] " : "") + (isCompleted ? "opacity-90" : "")}>
        <span className="vi-grano" aria-hidden="true" />
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={(e) => {
              if (isTogglingRef.current) return;
              isTogglingRef.current = true;
              setTimeout(() => { isTogglingRef.current = false; }, 350);
              soundFX.playClick();
              if (isFutureDay) {
                useUIStore.getState().addFloatingEffect({ x: e.clientX || 200, y: (e.clientY || 200) - 20, text: '⏳ Día futuro: modo planificación', type: 'streak' });
                return;
              }
              if (isCounterHabit && onIncrementHabit) {
                onIncrementHabit(task.id, e);
              } else {
                onToggle(task.id, e);
              }
            }}
            disabled={isDayEnded}
            style={isCompleted ? undefined : { borderColor: hexToRgba(activeLineColor, 0.40), boxShadow: '0 0 10px ' + hexToRgba(activeLineColor, 0.18) }}
            className={"w-9 h-9 sm:w-10 sm:h-10 border flex items-center justify-center transition-all cursor-pointer shrink-0 relative select-none " + (isCompleted ? "bg-gradient-to-br from-emerald-400 to-emerald-500 border-emerald-300 text-slate-950 shadow-[0_0_14px_rgba(16,185,129,0.55)] rounded-xl" : isFutureDay ? "bg-black/40 text-cyan-400/60 hover:bg-white/[0.04] rounded-xl" : "bg-black/45 text-white hover:bg-black/30 rounded-xl")}
            title={isFutureDay ? 'Día futuro: modo planificación' : isCounterHabit ? (isCompleted ? `${task.title} - Completado hoy` : `${task.title} - Toca para sumar +1 (${task.currentCount || 0}/${task.targetCount})`) : isCompleted ? 'Desmarcar tarea' : 'Marcar como completada'}
            aria-label={isCompleted ? "Desmarcar tarea: " + task.title : isCounterHabit ? "Sumar +1 a " + task.title : "Completar tarea: " + task.title}
          >
            {isCompleted ? (
              <div className="transition-transform duration-150 scale-100">
                <Icon name="check" className="w-5 h-5 stroke-[3] text-black" />
              </div>
            ) : isCounterHabit ? (
              <div className="flex flex-col items-center justify-center leading-none">
                <span className="text-[11px] font-mono font-black text-cyan-300">{task.currentCount || 0}</span>
                <span className="text-[8px] font-mono text-cyan-400/60 leading-none">/{task.targetCount}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                {getCategoryIcon(task.category, activeLineColor)}
                {isFutureDay && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-black" />}
              </div>
            )}
          </button>
          <div className="min-w-0 flex-1">
            <h4 
              role="button"
              tabIndex={0}
              onClick={(e) => {
                if (isCounterHabit && onIncrementHabit && !isCompleted) {
                  if (isTogglingRef.current) return;
                  isTogglingRef.current = true;
                  setTimeout(() => { isTogglingRef.current = false; }, 350);
                  soundFX.playClick();
                  onIncrementHabit(task.id, e);
                } else if (!isCounterHabit && handleEdit) {
                  handleEdit(task);
                }
              }} 
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (isCounterHabit && onIncrementHabit && !isCompleted) {
                    if (isTogglingRef.current) return;
                    isTogglingRef.current = true;
                    setTimeout(() => { isTogglingRef.current = false; }, 350);
                    soundFX.playClick();
                    onIncrementHabit(task.id);
                  } else if (!isCounterHabit && handleEdit) {
                    handleEdit(task);
                  }
                }
              }}
              aria-label={isCounterHabit ? (isCompleted ? `${task.title} (completado)` : `Sumar +1 a ${task.title}`) : `Configurar tarea ${task.title}`}
              className={"text-[14px] sm:text-[15.5px] font-semibold leading-snug truncate m-0 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 rounded " + (isCounterHabit && !isCompleted ? "cursor-pointer hover:text-cyan-300" : isCounterHabit ? "text-slate-300" : "cursor-pointer hover:text-cyan-300 text-[#f1f5f9]")} 
              title={isCounterHabit ? (isCompleted ? `${task.title} - Completado hoy` : `${task.title} - Toca para sumar +1 (${task.currentCount || 0}/${task.targetCount})`) : `${task.title} - Toca para configurar`}
            >
              <SlashText text={task.title} isCompleted={isCompleted} className={isCompleted ? 'text-slate-300' : 'text-[#f1f5f9]'} slashColor={catStyle.slashColor} />
            </h4>
            <div className="text-[#94a3b8] text-[10.5px] sm:text-[11.5px] mt-0.5 flex items-center gap-1.5 flex-nowrap overflow-x-auto no-scrollbar leading-tight">
              <span style={{ color: catStyle.textColor }} className="font-medium capitalize shrink-0">{task.category || 'Rutina'}</span>
              <span className="text-slate-600 shrink-0">&bull;</span>
              {isCompleted && task.completedAt && (
                <>
                  <span className="inline-flex items-center gap-0.5 font-mono text-emerald-400 shrink-0">{new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-slate-600 shrink-0">&bull;</span>
                </>
              )}
              <span className="inline-flex items-center gap-0.5 font-mono text-cyan-300/90 shrink-0"><Icon name="zap" className="w-2.5 h-2.5 text-cyan-400" />+{task.xpReward || 10} XP</span>
              {task.coinReward && (
                <>
                  <span className="text-slate-600 shrink-0">&bull;</span>
                  <span className="inline-flex items-center gap-0.5 font-mono text-amber-400 shrink-0"><Icon name="coins" className="w-2.5 h-2.5 text-amber-400" />+{task.coinReward}</span>
                </>
              )}
              {rarity.label && (
                <>
                  <span className="text-slate-600 shrink-0" aria-hidden="true">&bull;</span>
                  <span className={"inline-flex items-center gap-0.5 shrink-0 " + rarity.badgeStyle}>{rarity.icon}<span>{rarity.label}</span></span>
                </>
              )}
              {task.notes && (
                <>
                  <span className="text-slate-600 shrink-0" aria-hidden="true">&bull;</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); if (onOpenNoteModal) onOpenNoteModal(task); }} className="inline-flex items-center gap-1 text-purple-300 hover:text-purple-200 cursor-pointer font-mono text-[10.5px] transition-colors shrink-0" title={task.notes}><Icon name="fileText" className="w-2.5 h-2.5 text-purple-400" /><span>Nota</span></button>
                </>
              )}
              {isCounterHabit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isDayEnded && !isFutureDay && onIncrementHabit) {
                      soundFX.playClick();
                      onIncrementHabit(task.id, e);
                    }
                  }}
                  disabled={isDayEnded || isFutureDay}
                  className={"inline-flex items-center gap-1.5 ml-1 shrink-0 px-2 py-0.5 rounded-md border font-mono text-[10.5px] font-bold transition-all cursor-pointer active:scale-95 " + (isCompleted ? "bg-emerald-950/70 border-emerald-500/40 text-emerald-300" : "bg-[#040e1b] border-cyan-500/40 text-cyan-200 hover:border-cyan-300 hover:bg-cyan-950/80 shadow-[0_0_8px_rgba(0,240,255,0.15)]")}
                  title={isCompleted ? "Meta cumplida hoy" : "Toca para sumar +1"}
                >
                  <span className={catStyle.textIcon}>{task.currentCount || 0}/{task.targetCount} {task.unit || 'veces'}</span>
                  {!isDayEnded && !isFutureDay && !isCompleted && onIncrementHabit && (
                    <span className={"px-1 py-0.2 rounded text-black text-[9px] font-bold uppercase " + catStyle.checkboxBorder.split(' ')[0]}>+1</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        <TaskActionsDropdown task={task} isOpen={isMenuOpen} onToggleOpen={onToggleMenu} onOpenNote={() => onOpenNoteModal && onOpenNoteModal(task)} onOpenPomodoro={() => onOpenPomodoro && onOpenPomodoro(task.title, task.category)} onOpenEdit={() => handleEdit && handleEdit(task)} onDelete={() => handleDelete && handleDelete(task.id)} isDayEnded={isDayEnded} color={activeLineColor} />
      </div>
    </div>
  );
};

export const TaskCard = React.memo(TaskCardComponent);
export default TaskCard;
