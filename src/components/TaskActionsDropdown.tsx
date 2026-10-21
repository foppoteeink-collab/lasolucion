import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Timer, 
  FileText, 
  Edit3, 
  Trash2, 
  Sparkles,
  X,
  Clock
} from 'lucide-react';
import { TaskItem } from '../types';
import { soundFX } from '../utils/audio';
import { SatelliteKaiHub, SatelliteHubItem } from './SatelliteKaiHub';

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

  const handleSelectItem = (item: SatelliteHubItem) => {
    soundFX.playClick();
    handleClose();
    item.action();
  };

  // The 4 Orbital Satellite Actions matching Kai's orbital mechanics
  const wheelItems: SatelliteHubItem[] = useMemo(
    () => [
      {
        id: 'pomodoro',
        label: 'FOCO',
        categoryBadge: 'POMODORO',
        icon: <Timer className="w-5 h-5" />,
        accentColor: '#00f0ff',
        glowColor: 'rgba(0, 240, 255, 0.55)',
        liveStat: 'Iniciar sesión de foco',
        action: () => {
          soundFX.playPomodoroChime();
          onOpenPomodoro();
        },
      },
      {
        id: 'note',
        label: 'NOTA',
        categoryBadge: task.notes ? 'CON NOTAS' : 'SIN NOTAS',
        icon: <FileText className="w-5 h-5" />,
        accentColor: '#c084fc',
        glowColor: 'rgba(192, 132, 252, 0.55)',
        liveStat: task.notes ? 'Ver notas guardadas' : 'Escribir notas',
        hasBadge: Boolean(task.notes),
        action: () => {
          soundFX.playClick();
          onOpenNote();
        },
      },
      {
        id: 'edit',
        label: 'EDITAR',
        categoryBadge: 'CONFIGURAR',
        icon: <Edit3 className="w-5 h-5" />,
        accentColor: '#fbbf24',
        glowColor: 'rgba(251, 191, 36, 0.55)',
        liveStat: 'Editar título, horario y XP',
        action: () => {
          soundFX.playClick();
          onOpenEdit();
        },
      },
      {
        id: 'delete',
        label: 'BORRAR',
        categoryBadge: 'ELIMINAR',
        icon: <Trash2 className="w-5 h-5" />,
        accentColor: '#f43f5e',
        glowColor: 'rgba(244, 63, 94, 0.55)',
        liveStat: 'Eliminar esta tarea',
        action: () => {
          soundFX.playClick();
          onDelete();
        },
      },
    ],
    [task.notes, onOpenPomodoro, onOpenNote, onOpenEdit, onDelete]
  );

  return (
    <div className="relative flex items-center justify-center shrink-0 select-none">
      {/* Botón Disparador Orbital en la Tarjeta */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        onClick={handleToggle}
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer relative z-30 ${
          isMenuOpen
            ? 'bg-cyan-950 border border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.4)] rotate-90'
            : 'bg-[#080515] border border-cyan-500/30 text-cyan-400 hover:border-cyan-400 hover:text-cyan-200 hover:bg-[#0c0a20] shadow-[0_0_8px_rgba(0,240,255,0.1)]'
        }`}
        title={isMenuOpen ? 'Cerrar menú' : 'Acciones de Kai para tarea'}
        aria-label={`Acciones orbitales para: ${task.title}`}
      >
        {isMenuOpen ? (
          <X className="w-3.5 h-3.5 text-cyan-300 stroke-[2.5]" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        )}
      </motion.button>

      {/* Menú Desplegable Orbital Estilo Kai (Portal Global) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Telón de cierre global con desenfoque */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[75] bg-black/75 backdrop-blur-[3px] pointer-events-auto cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
              />

              {/* Contenedor Holográfico Orbital Centrado en Pantalla */}
              <div 
                className="fixed inset-0 z-[80] pointer-events-none flex items-center justify-center select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative flex flex-col items-center justify-center">
                  {/* Encabezado Holográfico HUD sobre la rueda */}
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.9 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="absolute -top-32 pointer-events-auto flex flex-col items-center text-center max-w-[280px] sm:max-w-sm px-4"
                  >
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-[9px] font-mono text-cyan-300 tracking-wider uppercase shadow-[0_0_10px_rgba(0,240,255,0.2)] mb-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      <span>{task.category || 'TAREA'}</span>
                      {task.timeBlock && (
                        <>
                          <span className="text-cyan-500/60">•</span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {task.timeBlock}
                          </span>
                        </>
                      )}
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-white tracking-wide truncate max-w-full drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                      {task.title}
                    </h4>
                  </motion.div>

                  {/* Núcleo Central y Órbita Satelital de Kai */}
                  <div className="relative pointer-events-auto flex items-center justify-center">
                    {/* Botón Central de Núcleo (Tocar para cerrar) */}
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      className="w-13 h-13 sm:w-14 sm:h-14 rounded-full border border-cyan-400/50 bg-[#070514]/90 backdrop-blur-md flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.35)] relative group cursor-pointer z-50"
                      onClick={() => {
                        soundFX.playClick();
                        handleClose();
                      }}
                      title="Toca para cerrar"
                    >
                      <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 animate-pulse pointer-events-none" />
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-300 group-hover:rotate-45 transition-transform duration-300" />
                      <span className="absolute -bottom-5 text-[8px] font-mono text-slate-400 tracking-widest uppercase opacity-75">
                        CERRAR
                      </span>
                    </motion.div>

                    {/* El Menú Satelital de Kai con las 4 acciones orbitales */}
                    <SatelliteKaiHub
                      items={wheelItems}
                      onClose={handleClose}
                      onSelect={handleSelectItem}
                      minOpacity={0.45}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
