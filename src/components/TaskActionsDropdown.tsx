import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Timer, 
  FileText, 
  Edit3, 
  Trash2, 
  Sparkles,
  X 
} from 'lucide-react';
import { TaskItem } from '../types';
import { soundFX } from '../utils/audio';

interface TaskActionsDropdownProps {
  task: TaskItem;
  isOpen?: boolean;
  onToggleOpen?: (id: string | null) => void;
  onClose?: () => void;
  onOpenNote: () => void;
  onOpenPomodoro: () => void;
  onOpenEdit: () => void;
  onDelete: () => void;
  isDayEnded?: boolean;
}

export const TaskActionsDropdown: React.FC<TaskActionsDropdownProps> = ({
  task,
  isOpen = false,
  onToggleOpen,
  onClose,
  onOpenNote,
  onOpenPomodoro,
  onOpenEdit,
  onDelete,
  isDayEnded = false,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);

  const isMenuOpen = onToggleOpen ? isOpen : internalOpen;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFX.playClick();
    if (onToggleOpen) {
      onToggleOpen(isMenuOpen ? null : task.id);
    } else {
      setInternalOpen(!internalOpen);
    }
  };

  const handleClose = () => {
    if (onToggleOpen) {
      onToggleOpen(null);
    } else {
      setInternalOpen(false);
    }
    if (onClose) onClose();
  };

  const actions = [
    {
      id: 'pomodoro',
      label: 'Foco / Pomodoro',
      icon: <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
      color: '#00f0ff',
      glow: 'shadow-[0_0_12px_rgba(0,240,255,0.55)]',
      border: 'border-cyan-400/80 hover:border-cyan-300',
      bg: 'bg-[#031522] hover:bg-[#062438]',
      text: 'text-cyan-300 hover:text-cyan-100',
      action: () => {
        soundFX.playPomodoroChime();
        handleClose();
        onOpenPomodoro();
      },
    },
    {
      id: 'note',
      label: task.notes ? 'Ver notas guardadas' : 'Escribir nota',
      icon: <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
      color: '#c084fc',
      glow: 'shadow-[0_0_12px_rgba(192,132,252,0.55)]',
      border: 'border-purple-400/80 hover:border-purple-300',
      bg: 'bg-[#150726] hover:bg-[#230c3d]',
      text: 'text-purple-300 hover:text-purple-100',
      hasBadge: Boolean(task.notes),
      action: () => {
        soundFX.playClick();
        handleClose();
        onOpenNote();
      },
    },
    {
      id: 'edit',
      label: 'Editar tarea',
      icon: <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
      color: '#fbbf24',
      glow: 'shadow-[0_0_12px_rgba(251,191,36,0.55)]',
      border: 'border-amber-400/80 hover:border-amber-300',
      bg: 'bg-[#1e1103] hover:bg-[#2d1b06]',
      text: 'text-amber-300 hover:text-amber-100',
      action: () => {
        soundFX.playClick();
        handleClose();
        onOpenEdit();
      },
    },
    {
      id: 'delete',
      label: 'Eliminar tarea',
      icon: <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
      color: '#f43f5e',
      glow: 'shadow-[0_0_12px_rgba(244,63,94,0.55)]',
      border: 'border-rose-400/80 hover:border-rose-300',
      bg: 'bg-[#20050c] hover:bg-[#340813]',
      text: 'text-rose-300 hover:text-rose-100',
      action: () => {
        soundFX.playClick();
        handleClose();
        onDelete();
      },
    },
  ];

  return (
    <div className="relative flex items-center justify-end shrink-0 select-none">
      {/* Click-outside Backdrop invisible */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-30 cursor-default"
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
        />
      )}

      {/* Cápsula de Acciones Desplegada "A la Pura Par" a la izquierda del botón */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 380 }}
            className="absolute right-9 top-1/2 -translate-y-1/2 z-40 flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#070514]/95 border border-cyan-500/40 backdrop-blur-xl shadow-[0_0_22px_rgba(0,0,0,0.9),0_0_14px_rgba(0,240,255,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            {actions.map((act, idx) => (
              <motion.button
                key={act.id}
                type="button"
                initial={{ opacity: 0, scale: 0.5, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 450,
                  damping: 24,
                  delay: idx * 0.025,
                }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  act.action();
                }}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer relative ${act.bg} ${act.border} ${act.text} ${act.glow}`}
                title={act.label}
                aria-label={act.label}
              >
                {act.icon}

                {/* Badge indicador si tiene notas */}
                {act.hasBadge && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-black shadow-[0_0_6px_rgba(0,240,255,0.9)]" />
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón Disparador Central / Cerrar */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        onClick={handleToggle}
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer relative z-40 ${
          isMenuOpen
            ? 'bg-cyan-950 border border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.4)] rotate-90'
            : 'bg-[#080515] border border-cyan-500/30 text-cyan-400 hover:border-cyan-400 hover:text-cyan-200 hover:bg-[#0c0a20] shadow-[0_0_8px_rgba(0,240,255,0.1)]'
        }`}
        title={isMenuOpen ? 'Cerrar acciones' : 'Acciones de tarea'}
        aria-label={isMenuOpen ? 'Cerrar acciones' : `Acciones para: ${task.title}`}
      >
        {isMenuOpen ? (
          <X className="w-3.5 h-3.5 text-cyan-300 stroke-[2.5]" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        )}
      </motion.button>
    </div>
  );
};

export default TaskActionsDropdown;
