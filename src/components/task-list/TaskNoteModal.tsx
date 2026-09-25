import React from 'react';
import { FileText, X } from 'lucide-react';
import { TaskItem } from '../../types';

interface TaskNoteModalProps {
  task: TaskItem;
  noteText: string;
  onNoteChange: (text: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export const TaskNoteModal: React.FC<TaskNoteModalProps> = ({
  task,
  noteText,
  onNoteChange,
  onSave,
  onDelete,
  onClose,
}) => {
  if (!task) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[88dvh] sm:max-h-[84vh] flex flex-col bg-[#011420] border border-cyan-500/50 rounded-2xl sm:rounded-3xl shadow-[0_0_30px_rgba(0,240,255,0.25)] relative text-left overflow-hidden backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-cyan-500/30 bg-[#000a14] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#001020] border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.2)] shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-anton tracking-wide text-white uppercase truncate">
                Nota de Repaso & Bitácora
              </h3>
              <p className="text-[11px] text-cyan-300 font-mono truncate max-w-[220px] sm:max-w-xs">
                {task.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-cyan-950/40 cursor-pointer shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed">
            Anota qué trabajaste específicamente, qué tema cubriste o detalles clave para recordar en tu repaso diario:
          </p>

          <textarea
            autoFocus
            value={noteText}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Ej. Repasé 15 verbos irregulares; avancé diseño de vista de misiones; 4 series pesadas en press militar..."
            rows={4}
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-[#000a14] border border-cyan-500/40 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 resize-none leading-relaxed"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                onSave();
              }
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-2 p-3 sm:p-4 border-t border-cyan-500/30 bg-[#000a14] shrink-0">
          {noteText ? (
            <button
              type="button"
              onClick={onDelete}
              className="px-3.5 py-2 rounded-xl bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 text-xs font-bold border border-rose-500/40 cursor-pointer transition-colors min-h-[40px]"
            >
              Borrar Nota
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-[#001420] text-slate-300 hover:text-white hover:bg-cyan-950/40 text-xs font-bold border border-cyan-500/30 cursor-pointer min-h-[40px] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSave}
              className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-anton tracking-wider uppercase border border-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.4)] cursor-pointer transition-colors min-h-[40px]"
            >
              Guardar Nota
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
