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
  Coins
} from 'lucide-react';
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
  glow: string;
  bgBadge: string;
  textIcon: string;
  slashColor: string;
  checkboxBorder: string;
}

const getCategoryStyle = (category?: string): CategoryStyle => {
  switch (category?.toLowerCase()) {
    case 'trabajo':
      return {
        border: 'border-orange-500/35 hover:border-orange-400/70',
        glow: 'shadow-[0_4px_20px_rgba(249,115,22,0.12)] hover:shadow-[0_0_22px_rgba(249,115,22,0.28)]',
        bgBadge: 'bg-orange-950/70 border-orange-500/40 text-orange-300',
        textIcon: 'text-orange-400',
        slashColor: '#f97316',
        checkboxBorder: 'bg-orange-400 border-orange-300 text-black shadow-[0_0_10px_rgba(249,115,22,0.6)]'
      };
    case 'clientes':
      return {
        border: 'border-blue-500/35 hover:border-blue-400/70',
        glow: 'shadow-[0_4px_20px_rgba(59,130,246,0.12)] hover:shadow-[0_0_22px_rgba(59,130,246,0.28)]',
        bgBadge: 'bg-blue-950/70 border-blue-500/40 text-blue-300',
        textIcon: 'text-blue-400',
        slashColor: '#3b82f6',
        checkboxBorder: 'bg-blue-400 border-blue-300 text-black shadow-[0_0_10px_rgba(59,130,246,0.6)]'
      };
    case 'entrenamiento':
      return {
        border: 'border-cyan-500/35 hover:border-cyan-400/70',
        glow: 'shadow-[0_4px_20px_rgba(6,182,212,0.12)] hover:shadow-[0_0_22px_rgba(6,182,212,0.28)]',
        bgBadge: 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300',
        textIcon: 'text-cyan-400',
        slashColor: '#06b6d4',
        checkboxBorder: 'bg-cyan-400 border-cyan-300 text-black shadow-[0_0_10px_rgba(6,182,212,0.6)]'
      };
    case 'estudio':
      return {
        border: 'border-purple-500/35 hover:border-purple-400/70',
        glow: 'shadow-[0_4px_20px_rgba(168,85,247,0.12)] hover:shadow-[0_0_22px_rgba(168,85,247,0.28)]',
        bgBadge: 'bg-purple-950/70 border-purple-500/40 text-purple-300',
        textIcon: 'text-purple-400',
        slashColor: '#a855f7',
        checkboxBorder: 'bg-purple-400 border-purple-300 text-black shadow-[0_0_10px_rgba(168,85,247,0.6)]'
      };
    case 'creativo':
      return {
        border: 'border-fuchsia-500/35 hover:border-fuchsia-400/70',
        glow: 'shadow-[0_4px_20px_rgba(217,70,239,0.12)] hover:shadow-[0_0_22px_rgba(217,70,239,0.28)]',
        bgBadge: 'bg-fuchsia-950/70 border-fuchsia-500/40 text-fuchsia-300',
        textIcon: 'text-fuchsia-400',
        slashColor: '#d946ef',
        checkboxBorder: 'bg-fuchsia-400 border-fuchsia-300 text-black shadow-[0_0_10px_rgba(217,70,239,0.6)]'
      };
    case 'limpieza':
    case 'rutina':
      return {
        border: 'border-emerald-500/35 hover:border-emerald-400/70',
        glow: 'shadow-[0_4px_20px_rgba(16,185,129,0.12)] hover:shadow-[0_0_22px_rgba(16,185,129,0.28)]',
        bgBadge: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
        textIcon: 'text-emerald-400',
        slashColor: '#10b981',
        checkboxBorder: 'bg-emerald-400 border-emerald-300 text-black shadow-[0_0_10px_rgba(16,185,129,0.6)]'
      };
    case 'habito':
    case 'comida':
      return {
        border: 'border-amber-500/35 hover:border-amber-400/70',
        glow: 'shadow-[0_4px_20px_rgba(245,158,11,0.12)] hover:shadow-[0_0_22px_rgba(245,158,11,0.28)]',
        bgBadge: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
        textIcon: 'text-amber-400',
        slashColor: '#f59e0b',
        checkboxBorder: 'bg-amber-400 border-amber-300 text-black shadow-[0_0_10px_rgba(245,158,11,0.6)]'
      };
    case 'pomodoro':
      return {
        border: 'border-rose-500/35 hover:border-rose-400/70',
        glow: 'shadow-[0_4px_20px_rgba(244,63,94,0.12)] hover:shadow-[0_0_22px_rgba(244,63,94,0.28)]',
        bgBadge: 'bg-rose-950/70 border-rose-500/40 text-rose-300',
        textIcon: 'text-rose-400',
        slashColor: '#f43f5e',
        checkboxBorder: 'bg-rose-400 border-rose-300 text-black shadow-[0_0_10px_rgba(244,63,94,0.6)]'
      };
    default:
      return {
        border: 'border-cyan-500/35 hover:border-cyan-400/70',
        glow: 'shadow-[0_4px_20px_rgba(0,240,255,0.12)] hover:shadow-[0_0_22px_rgba(0,240,255,0.28)]',
        bgBadge: 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300',
        textIcon: 'text-cyan-400',
        slashColor: '#00f0ff',
        checkboxBorder: 'bg-cyan-400 border-cyan-300 text-black shadow-[0_0_10px_rgba(0,240,255,0.6)]'
      };
  }
};

const getRarityBadge = (task: TaskItem) => {
  const xp = task.xpReward || 10;
  const coins = task.coinReward || 0;
  const isLegendary = task.isTracked2166 || task.isLegendaryBounty || xp >= 40;
  const isEpic = !isLegendary && (xp >= 25 || coins >= 15);
  const isRare = !isLegendary && !isEpic && xp >= 15;

  if (isLegendary) {
    return {
      badgeStyle: 'bg-[#1c1200] border-amber-400/90 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)] font-extrabold',
      label: '👑 LEGENDARIA',
      icon: <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-spin" />
    };
  }
  if (isEpic) {
    return {
      badgeStyle: 'bg-[#160228] border-purple-400/80 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.5)] font-bold',
      label: '🔮 ÉPICA',
      icon: <Zap className="w-2.5 h-2.5 text-purple-300" />
    };
  }
  if (isRare) {
    return {
      badgeStyle: 'bg-[#02132b] border-blue-400/70 text-blue-300 shadow-[0_0_8px_rgba(59,130,246,0.4)] font-bold',
      label: '⚔️ RARA',
      icon: <Zap className="w-2.5 h-2.5 text-blue-300" />
    };
  }
  return {
    badgeStyle: 'bg-[#010a12] border-cyan-500/40 text-cyan-300 shadow-[0_0_6px_rgba(0,240,255,0.2)] font-semibold',
    label: '',
    icon: <Zap className="w-2.5 h-2.5 text-cyan-400" />
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
  isDayEnded = false
}) => {
  if (!task || !task.title) return null;
  const isCompleted = task.completed;
  const handleEdit = onEdit || onOpenEditModal;
  const handleDelete = onDelete || onDeleteTask;

  const catStyle = getCategoryStyle(task.category);
  const rarity = getRarityBadge(task);

  return (
    <motion.div
      initial={{ opacity: 0, y: 25, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
        delay: Math.min((index % 5) * 0.05, 0.2) 
      }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className={`relative p-3.5 sm:p-4 rounded-2xl backdrop-blur-xl border transition-all duration-300 ${
        isCompleted 
          ? 'bg-[#01111a]/70 border-slate-700/40 text-slate-400 shadow-none opacity-80' 
          : `bg-[#011420]/90 ${catStyle.border} text-white ${catStyle.glow}`
      }`}
    >
      {/* Ambient Floating Reward & Rarity Badge */}
      <div className={`absolute -top-2.5 right-3 px-2 py-0.5 rounded-full border text-[10px] font-mono flex items-center gap-1.5 transition-all ${rarity.badgeStyle}`}>
        {rarity.label ? (
          <span className="flex items-center gap-1">
            {rarity.icon}
            <span>{rarity.label}</span>
          </span>
        ) : (
          <span className="flex items-center gap-0.5">
            {rarity.icon}
            +{task.xpReward || 10} XP
          </span>
        )}

        {task.coinReward ? (
          <span className="flex items-center gap-0.5 text-amber-300 border-l border-white/20 pl-1.5">
            <Coins className="w-2.5 h-2.5 text-amber-400" />
            +{task.coinReward}
          </span>
        ) : null}
      </div>

      <div className="flex items-start gap-3.5">
        {/* Checkbox / Completion Toggle */}
        <button
          type="button"
          onClick={(e) => {
            soundFX.playClick();
            onToggle(task.id, e);
          }}
          disabled={isDayEnded}
          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer mt-0.5 shrink-0 ${
            isCompleted
              ? catStyle.checkboxBorder
              : 'bg-[#000a14] border-white/20 hover:border-white/50 hover:bg-white/5'
          }`}
          title={isCompleted ? 'Desmarcar' : 'Marcar como completada'}
        >
          {isCompleted && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
        </button>

        {/* Task Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {task.timeBlock && (
              <span className={`px-2 py-0.5 rounded-md border text-[11px] font-mono font-bold flex items-center gap-1 ${catStyle.bgBadge}`}>
                <Clock className={`w-3 h-3 ${catStyle.textIcon}`} />
                {task.timeBlock}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 ${catStyle.bgBadge}`}>
              {getCategoryIcon(task.category)}
              <span>{task.category || 'Misión'}</span>
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-bold tracking-wide transition-colors">
            <SlashText
              text={task.title}
              isCompleted={isCompleted}
              className={isCompleted ? 'text-slate-400 line-through' : 'text-white'}
              slashColor={catStyle.slashColor}
            />
          </h3>

          {task.notes && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 font-mono">
              {task.notes}
            </p>
          )}

          {/* Habit Progress if applicable */}
          {task.isHabit && task.targetCount && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 bg-black/60 rounded-full h-2 overflow-hidden border border-white/10">
                <div 
                  className={`h-full transition-all duration-500 ${catStyle.checkboxBorder.split(' ')[0]}`}
                  style={{ width: `${Math.min(100, ((task.currentCount || 0) / task.targetCount) * 100)}%` }}
                />
              </div>
              <span className={`text-xs font-mono font-bold ${catStyle.textIcon}`}>
                {task.currentCount || 0} / {task.targetCount} {task.unit || 'veces'}
              </span>
              {!isDayEnded && onIncrementHabit && (
                <button
                  type="button"
                  onClick={(e) => {
                    soundFX.playClick();
                    onIncrementHabit(task.id, e);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-black text-xs font-anton tracking-wider uppercase transition-all cursor-pointer shadow-md active:scale-95 ${catStyle.checkboxBorder.split(' ')[0]}`}
                >
                  +1
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {!isDayEnded && (
            <>
              {onOpenPomodoro && (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    onOpenPomodoro(task.title, task.category);
                  }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/10"
                  title="Iniciar Pomodoro"
                >
                  <Timer className="w-4 h-4 text-cyan-400" />
                </button>
              )}
              {handleEdit && (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    handleEdit(task);
                  }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/10"
                  title="Editar Misión"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
              {handleDelete && (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    handleDelete(task.id);
                  }}
                  className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-200 transition-colors cursor-pointer border border-rose-500/30"
                  title="Eliminar Misión"
                >
                  <Trash2 className="w-4 h-4" />
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
