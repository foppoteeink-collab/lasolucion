import React from 'react';
import { 
  Zap, 
  CheckCircle2, 
  Layers, 
  BookOpen, 
  Moon, 
  Flame, 
  Award,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { TaskItem } from '../types';
import { soundFX } from '../utils/audio';

interface DailyProgressWidgetProps {
  tasks: TaskItem[];
  currentDate: string;
  onOpenTemplates: () => void;
  onOpenJournal: () => void;
  onOpenFinishDay: () => void;
}

export const DailyProgressWidget: React.FC<DailyProgressWidgetProps> = ({
  tasks,
  currentDate,
  onOpenTemplates,
  onOpenJournal,
  onOpenFinishDay,
}) => {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  const xpEarned = tasks.filter(t => t.completed).reduce((sum, t) => sum + (t.xpReward || 0), 0);
  const xpTotal = tasks.reduce((sum, t) => sum + (t.xpReward || 0), 0);
  const notesCount = tasks.filter(t => t.notes?.trim()).length;

  return (
    <div className="p-4 sm:p-5 rounded-2xl scifi-glass-panel relative overflow-hidden text-left text-white">
      {/* Background Accent Glow */}
      <div 
        className="absolute -right-10 -bottom-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none transition-opacity duration-700" 
        style={{ opacity: percent > 50 ? 0.8 : 0.3 }}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        
        {/* Left Side: Energy & Percentage */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#000a14] border border-cyan-400/60 flex items-center justify-center text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.25)]">
                <Zap className="w-4 h-4 fill-cyan-400 text-cyan-400" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider block leading-tight font-anton">
                  Progreso del Día
                </span>
                <span className="text-[10px] text-cyan-300/80 font-mono">
                  {completed} de {total} ({percent}%)
                </span>
              </div>
            </div>

            {/* XP Pill */}
            <div className="px-2.5 py-1 rounded-xl bg-[#000a14] border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 shadow-[0_0_8px_rgba(0,240,255,0.2)]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>+{xpEarned} / {xpTotal} XP</span>
            </div>
          </div>

          {/* Glowing Energy Bar */}
          <div className="w-full h-3 sm:h-3.5 bg-black/60 rounded-full border border-cyan-500/30 p-0.5 overflow-hidden shadow-inner relative">
            <div 
              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-blue-500 via-cyan-500 to-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.6)]"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Right Side: Quick Action Pills */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 pt-1 md:pt-0 border-t md:border-t-0 border-cyan-500/20">
          {/* Day Templates */}
          <button
            type="button"
            onClick={() => { soundFX.playClick(); onOpenTemplates(); }}
            className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-[#000a14] hover:bg-cyan-950/40 text-cyan-300 hover:text-white border border-cyan-500/40 hover:border-cyan-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer min-h-[40px] active:scale-95"
            title="Abrir plantillas de día para cargar o guardar rutinas"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="whitespace-nowrap">Plantillas</span>
          </button>

          {/* Hero Journal */}
          <button
            type="button"
            onClick={() => { soundFX.playClick(); onOpenJournal(); }}
            className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-[#000a14] hover:bg-amber-950/40 text-amber-300 hover:text-white border border-amber-500/40 hover:border-amber-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer min-h-[40px] active:scale-95"
            title="Ver la bitácora semanal y apuntes de misiones"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="whitespace-nowrap">Bitácora ({notesCount})</span>
          </button>

          {/* Finish Day / Night disconnect */}
          <button
            type="button"
            onClick={() => { soundFX.playClick(); onOpenFinishDay(); }}
            className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-[#000a14] hover:bg-indigo-950/60 text-indigo-300 hover:text-white border border-indigo-500/40 hover:border-indigo-400 text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer min-h-[40px] active:scale-95"
            title="Cierre nocturno y desconexión"
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span className="whitespace-nowrap">Cierre Nocturno</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default DailyProgressWidget;
