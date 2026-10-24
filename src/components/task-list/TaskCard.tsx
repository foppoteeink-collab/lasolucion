import React from 'react';
import { motion } from 'motion/react';
import { TaskItem, TaskCategory, HabitMasteryRecord } from '../../types';
import { 
  CheckCircle2, 
  Clock, 
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
  FileText,
  Timer
} from 'lucide-react';
import { soundFX } from '../../utils/audio';
import { SlashText } from './SlashText';
import { TaskActionsDropdown } from '../TaskActionsDropdown';
import { useUIStore } from '../../store/useUIStore';
import { getTodayDateString } from '../../utils/date';
import { getCategoryStyle } from '../../data/categoryColors';

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

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  index = 0,
  currentDate,
  isMenuOpen = false,
  onToggleMenu,
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

  const todayStr = getTodayDateString();
  const isFutureDay = Boolean(currentDate && currentDate > todayStr);

  const catStyle = getCategoryStyle(task.category);
  const rarity = getRarityBadge(task);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ 
        duration: 0.22,
        ease: [0.16, 1, 0.3, 1],
        delay: Math.min((index % 5) * 0.02, 0.1) 
      }}
      className={`relative p-2.5 sm:p-3 rounded-xl border transition-all duration-200 ${
        isMenuOpen ? 'z-30 ring-1 ring-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.15)]' : 'z-0'
      } ${
        isCompleted 
          ? 'bg-[#030712]/60 border-emerald-500/25 text-slate-400 opacity-60' 
          : 'bg-surface-card backdrop-blur-md border-white/10 hover:border-white/20 text-white shadow-sm'
      }`}
    >
      {/* Línea 1: Protagonista (Check + Título + Menú Orbital Kai) */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Checkbox / Completion Toggle */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.88 }}
            onClick={(e) => {
              soundFX.playClick();
              if (isFutureDay) {
                useUIStore.getState().addFloatingEffect({
                  x: e.clientX || (typeof window !== 'undefined' ? window.innerWidth / 2 : 200),
                  y: (e.clientY || 200) - 20,
                  text: '⏳ Día futuro: modo planificación',
                  type: 'streak'
                });
                return;
              }
              onToggle(task.id, e);
            }}
            disabled={isDayEnded}
            className={`relative touch-target-44 before:absolute before:-inset-3 before:content-[''] w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              isCompleted
                ? 'bg-emerald-500 border-emerald-400 text-black'
                : isFutureDay
                ? 'bg-white/[0.02] border-cyan-500/30 text-cyan-400/50'
                : 'bg-white/[0.03] border-white/20 hover:border-white/40 hover:bg-white/[0.06]'
            }`}
            title={
              isFutureDay 
                ? 'Día futuro: modo planificación' 
                : isCompleted 
                ? 'Desmarcar' 
                : 'Marcar como completada'
            }
            aria-label={isCompleted ? `Desmarcar tarea: ${task.title}` : `Completar tarea: ${task.title}`}
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
            {!isCompleted && isFutureDay && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60" />
            )}
          </motion.button>

          {/* Título de la Tarea (Clic directo abre modal de configuración) */}
          <h3 
            onClick={() => handleEdit && handleEdit(task)}
            className="text-xs sm:text-sm font-semibold tracking-normal transition-colors leading-snug truncate cursor-pointer hover:text-cyan-300 min-w-0"
            title={`${task.title} - Toca para configurar`}
          >
            <SlashText
              text={task.title}
              isCompleted={isCompleted}
              className={isCompleted ? 'text-slate-400' : 'text-slate-100'}
              slashColor={catStyle.slashColor}
            />
          </h3>
        </div>

        {/* Extremo Derecho: Disparador Orbital Satelital Estilo Kai */}
        <TaskActionsDropdown
          task={task}
          isOpen={isMenuOpen}
          onToggleOpen={onToggleMenu}
          onOpenNote={() => onOpenNoteModal && onOpenNoteModal(task)}
          onOpenPomodoro={() => onOpenPomodoro && onOpenPomodoro(task.title, task.category)}
          onOpenEdit={() => handleEdit && handleEdit(task)}
          onDelete={() => handleDelete && handleDelete(task.id)}
          isDayEnded={isDayEnded}
        />
      </div>

      {/* Línea 2: Metadatos Unificados (Horario • Categoría • Recompensa • Notas) */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[10px] font-mono text-slate-400 pl-[30px] mt-1">
        {/* Horario */}
        {task.timeBlock && (
          <span className={`px-1.5 py-0.2 rounded border flex items-center gap-1 ${catStyle.bgBadge}`}>
            <Clock className={`w-2.5 h-2.5 ${catStyle.textIcon}`} />
            <span>{task.timeBlock}</span>
          </span>
        )}

        {/* Categoría */}
        <span className={`px-1.5 py-0.2 rounded border uppercase tracking-wider flex items-center gap-1 ${catStyle.bgBadge}`}>
          {getCategoryIcon(task.category)}
          <span>{task.category || 'Tarea'}</span>
        </span>

        {/* Rarity Ley 21/66 */}
        {rarity.label && (
          <span className={`px-1.5 py-0.2 rounded border flex items-center gap-0.5 ${rarity.badgeStyle}`}>
            {rarity.icon}
            <span>{rarity.label}</span>
          </span>
        )}

        {/* Recompensa XP & Oro */}
        <span className="flex items-center gap-1 text-slate-400">
          <Zap className="w-2.5 h-2.5 text-cyan-400" />
          <span>+{task.xpReward || 10} XP</span>
        </span>
        {task.coinReward ? (
          <span className="flex items-center gap-1 text-amber-400">
            <Coins className="w-2.5 h-2.5 text-amber-400" />
            <span>+{task.coinReward}</span>
          </span>
        ) : null}

        {/* Indicador de Nota */}
        {task.notes && (
          <span 
            onClick={() => onOpenNoteModal && onOpenNoteModal(task)}
            className="flex items-center gap-1 text-purple-300 hover:text-purple-200 cursor-pointer bg-purple-950/60 border border-purple-500/40 px-1.5 py-0.2 rounded transition-colors"
            title={task.notes}
          >
            <FileText className="w-2.5 h-2.5 text-purple-400" />
            <span>Nota</span>
          </span>
        )}

        {/* Contador numérico de hábito si aplica */}
        {task.isHabit && task.targetCount && task.targetCount > 1 && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className={`font-bold ${catStyle.textIcon}`}>
              {task.currentCount || 0}/{task.targetCount} {task.unit || 'veces'}
            </span>
            {!isDayEnded && !isFutureDay && onIncrementHabit && (
              <button
                type="button"
                onClick={(e) => {
                  soundFX.playClick();
                  onIncrementHabit(task.id, e);
                }}
                className={`px-1.5 py-0.2 rounded text-black text-[9px] font-bold uppercase transition-all cursor-pointer active:scale-95 ${catStyle.checkboxBorder.split(' ')[0]}`}
                title="Sumar +1"
              >
                +1
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TaskCard;
