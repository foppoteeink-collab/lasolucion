import React from 'react';
import { motion } from 'motion/react';
import { TaskItem, TaskCategory, HabitMasteryRecord } from '../../types';
import { 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Edit3, 
  Timer, 
  Sparkles, 
  Zap, 
  Dumbbell, 
  BookOpen, 
  Briefcase, 
  Apple, 
  Palette, 
  Users, 
  Target,
  Coins,
  Dices,
  FileText
} from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { soundFX } from '../../utils/audio';
import { SlashText } from './SlashText';

interface TaskCardProps {
  task: TaskItem;
  index?: number;
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

interface CategoryStyle {
  border: string;
  bgBadge: string;
  textIcon: string;
  slashColor: string;
  checkboxBorder: string;
}

const getCategoryStyle = (category?: string): CategoryStyle => {
  switch (category?.toLowerCase()) {
    case 'trabajo':
      return {
        border: 'border-orange-500/20 hover:border-orange-500/40',
        bgBadge: 'bg-orange-500/10 border-orange-500/20 text-orange-300',
        textIcon: 'text-orange-400',
        slashColor: '#f97316',
        checkboxBorder: 'bg-orange-500 border-orange-400 text-black'
      };
    case 'clientes':
      return {
        border: 'border-blue-500/20 hover:border-blue-500/40',
        bgBadge: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
        textIcon: 'text-blue-400',
        slashColor: '#3b82f6',
        checkboxBorder: 'bg-blue-500 border-blue-400 text-black'
      };
    case 'entrenamiento':
      return {
        border: 'border-cyan-500/20 hover:border-cyan-500/40',
        bgBadge: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300',
        textIcon: 'text-cyan-400',
        slashColor: '#06b6d4',
        checkboxBorder: 'bg-cyan-500 border-cyan-400 text-black'
      };
    case 'estudio':
      return {
        border: 'border-purple-500/20 hover:border-purple-500/40',
        bgBadge: 'bg-purple-500/10 border-purple-500/20 text-purple-300',
        textIcon: 'text-purple-400',
        slashColor: '#a855f7',
        checkboxBorder: 'bg-purple-500 border-purple-400 text-black'
      };
    case 'creativo':
      return {
        border: 'border-fuchsia-500/20 hover:border-fuchsia-500/40',
        bgBadge: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-300',
        textIcon: 'text-fuchsia-400',
        slashColor: '#d946ef',
        checkboxBorder: 'bg-fuchsia-500 border-fuchsia-400 text-black'
      };
    case 'limpieza':
    case 'rutina':
      return {
        border: 'border-emerald-500/20 hover:border-emerald-500/40',
        bgBadge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
        textIcon: 'text-emerald-400',
        slashColor: '#10b981',
        checkboxBorder: 'bg-emerald-500 border-emerald-400 text-black'
      };
    case 'habito':
    case 'comida':
      return {
        border: 'border-amber-500/20 hover:border-amber-500/40',
        bgBadge: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
        textIcon: 'text-amber-400',
        slashColor: '#f59e0b',
        checkboxBorder: 'bg-amber-500 border-amber-400 text-black'
      };
    case 'pomodoro':
      return {
        border: 'border-rose-500/20 hover:border-rose-500/40',
        bgBadge: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
        textIcon: 'text-rose-400',
        slashColor: '#f43f5e',
        checkboxBorder: 'bg-rose-500 border-rose-400 text-black'
      };
    default:
      return {
        border: 'border-white/10 hover:border-white/20',
        bgBadge: 'bg-white/5 border-white/10 text-slate-300',
        textIcon: 'text-cyan-400',
        slashColor: '#00f0ff',
        checkboxBorder: 'bg-cyan-500 border-cyan-400 text-black'
      };
  }
};

const getRarityBadge = (task: TaskItem) => {
  const isLegendary = task.isTracked2166 || task.isLegendaryBounty;

  if (isLegendary) {
    return {
      badgeStyle: 'bg-amber-500/15 border-amber-500/30 text-amber-300 font-semibold',
      label: '21/66',
      icon: <Sparkles className="w-2.5 h-2.5 text-amber-400" />
    };
  }
  return {
    badgeStyle: '',
    label: '',
    icon: null
  };
};

const getCategoryIcon = (category?: string) => {
  const catStyle = getCategoryStyle(category);
  const cls = `w-3 h-3 ${catStyle.textIcon}`;
  switch (category?.toLowerCase()) {
    case 'entrenamiento':
      return <Dumbbell className={cls} />;
    case 'estudio':
      return <BookOpen className={cls} />;
    case 'trabajo':
      return <Briefcase className={cls} />;
    case 'limpieza':
      return <Sparkles className={cls} />;
    case 'comida':
      return <Apple className={cls} />;
    case 'creativo':
      return <Palette className={cls} />;
    case 'clientes':
      return <Users className={cls} />;
    case 'habito':
      return <Zap className={cls} />;
    case 'pomodoro':
      return <Timer className={cls} />;
    default:
      return <Target className={cls} />;
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  index = 0,
  onToggle,
  onIncrementHabit,
  onEdit,
  onOpenEditModal,
  onDelete,
  onDeleteTask,
  onOpenPomodoro,
  onOpenNoteModal,
  isDayEnded = false
}) => {
  if (!task || !task.title) return null;
  const isCompleted = task.completed;
  const handleEdit = onEdit || onOpenEditModal;
  const handleDelete = onDelete || onDeleteTask;

  const catStyle = getCategoryStyle(task.category);
  const rarity = getRarityBadge(task);
  const playerStats = usePlayerStore(s => s.stats);
  const reRollDice = playerStats.reRollDice || 0;
  
  const handleReRoll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (reRollDice <= 0) return;
    
    usePlayerStore.getState().setStats({
      ...playerStats,
      reRollDice: reRollDice - 1
    });

    soundFX.playClick();
    if (handleEdit) handleEdit(task);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ 
        duration: 0.25,
        ease: [0.16, 1, 0.3, 1],
        delay: Math.min((index % 5) * 0.03, 0.15) 
      }}
      className={`relative p-3.5 sm:p-4 rounded-xl border transition-all duration-200 ${
        isCompleted 
          ? 'bg-[#060a10]/50 border-white/5 text-slate-400 opacity-60' 
          : `bg-[#0b121e]/80 ${catStyle.border} text-white shadow-sm hover:border-white/20`
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox / Completion Toggle */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          onClick={(e) => {
            soundFX.playClick();
            onToggle(task.id, e);
          }}
          disabled={isDayEnded}
          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer mt-0.5 shrink-0 ${
            isCompleted
              ? 'bg-emerald-500 border-emerald-400 text-black'
              : 'bg-white/[0.03] border-white/20 hover:border-white/40 hover:bg-white/[0.06]'
          }`}
          title={isCompleted ? 'Desmarcar' : 'Marcar como completada'}
        >
          {isCompleted && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
            </motion.div>
          )}
        </motion.button>

        {/* Task Details */}
        <div className="flex-1 min-w-0">
          {/* Header Row: Category, Time, Rarity, and XP/Coins */}
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {task.timeBlock && (
                <span className={`px-2 py-0.5 rounded-md border text-[11px] font-mono font-medium flex items-center gap-1 ${catStyle.bgBadge}`}>
                  <Clock className={`w-3 h-3 ${catStyle.textIcon}`} />
                  {task.timeBlock}
                </span>
              )}
              <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 ${catStyle.bgBadge}`}>
                {getCategoryIcon(task.category)}
                <span>{task.category || 'Tarea'}</span>
              </span>
              {rarity.label && (
                <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono flex items-center gap-1 ${rarity.badgeStyle}`}>
                  {rarity.icon}
                  <span>{rarity.label}</span>
                </span>
              )}
            </div>

            {/* Clean XP & Coins metrics inline */}
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1 text-slate-400">
                <Zap className="w-3 h-3 text-cyan-400" />
                +{task.xpReward || 10} XP
              </span>
              {task.coinReward ? (
                <span className="flex items-center gap-1 text-amber-400">
                  <Coins className="w-3 h-3 text-amber-400" />
                  +{task.coinReward}
                </span>
              ) : null}
            </div>
          </div>

          <h3 className="text-sm sm:text-base font-semibold tracking-normal transition-colors leading-snug">
            <SlashText
              text={task.title}
              isCompleted={isCompleted}
              className={isCompleted ? 'text-slate-400' : 'text-slate-100'}
              slashColor={catStyle.slashColor}
            />
          </h3>

          {task.notes && !task.notes.includes('Directiva del Oráculo') && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 font-mono">
              {task.notes}
            </p>
          )}

          {/* Habit Progress if applicable */}
          {task.isHabit && task.targetCount && (
            <div className="mt-2.5 flex items-center gap-3">
              <div className="flex-1 bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/10">
                <div 
                  className={`h-full transition-all duration-300 ${catStyle.checkboxBorder.split(' ')[0]}`}
                  style={{ width: `${Math.min(100, ((task.currentCount || 0) / task.targetCount) * 100)}%` }}
                />
              </div>
              <span className={`text-xs font-mono font-medium ${catStyle.textIcon}`}>
                {task.currentCount || 0} / {task.targetCount} {task.unit || 'veces'}
              </span>
              {!isDayEnded && onIncrementHabit && (
                <button
                  type="button"
                  onClick={(e) => {
                    soundFX.playClick();
                    onIncrementHabit(task.id, e);
                  }}
                  className={`px-2 py-0.5 rounded text-black text-xs font-bold uppercase transition-all cursor-pointer active:scale-95 ${catStyle.checkboxBorder.split(' ')[0]}`}
                >
                  +1
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {/* Note button */}
          {onOpenNoteModal && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                soundFX.playClick();
                onOpenNoteModal(task);
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
                task.notes
                  ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white border-white/5'
              }`}
              title={task.notes ? 'Ver / Editar nota' : 'Agregar nota'}
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
          )}
          {!isDayEnded && (
            <>
              {onOpenPomodoro && (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    onOpenPomodoro(task.title, task.category);
                  }}
                  className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/5"
                  title="Iniciar Pomodoro"
                >
                  <Timer className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              )}
              {reRollDice > 0 && !task.completed && (
                <button
                  type="button"
                  onClick={handleReRoll}
                  className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-white transition-colors cursor-pointer border border-amber-500/20"
                  title={`Cambiar tarea (${reRollDice} disponibles)`}
                >
                  <Dices className="w-3.5 h-3.5" />
                </button>
              )}
              {handleEdit && (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    handleEdit(task);
                  }}
                  className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/5"
                  title="Editar tarea"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
              {handleDelete && (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    handleDelete(task.id);
                  }}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer border border-rose-500/20"
                  title="Eliminar tarea"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;
