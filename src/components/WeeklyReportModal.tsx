import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FileDown, 
  Copy, 
  Check, 
  Printer, 
  Calendar, 
  Sparkles, 
  X, 
  TrendingUp, 
  Moon, 
  Award, 
  CheckCircle2, 
  BookOpen,
  Share2
} from 'lucide-react';
import { TaskItem, PlayerStats, DailyReflection } from '../types';
import { soundFX } from '../utils/audio';
import { formatDateToLocal, getTodayDateString, addDaysToDateString, parseLocalDate } from '../utils/date';

interface WeeklyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasksByDate: Record<string, TaskItem[]>;
  stats: PlayerStats;
  currentDate: string;
}

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({
  isOpen,
  onClose,
  tasksByDate,
  stats,
  currentDate,
}) => {
  const [selectedRange, setSelectedRange] = useState<'current_week' | 'last_week' | 'month'>('current_week');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('modal-open-hide-floating');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('modal-open-hide-floating');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Compute dates in range
  const dateRange = useMemo(() => {
    const dates: string[] = [];
    const base = parseLocalDate(currentDate);

    if (selectedRange === 'current_week') {
      // Get Monday of current week
      const day = base.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const mondayStr = addDaysToDateString(currentDate, diffToMonday);
      for (let i = 0; i < 7; i++) {
        dates.push(addDaysToDateString(mondayStr, i));
      }
    } else if (selectedRange === 'last_week') {
      const day = base.getDay();
      const diffToLastMonday = (day === 0 ? -6 : 1 - day) - 7;
      const mondayStr = addDaysToDateString(currentDate, diffToLastMonday);
      for (let i = 0; i < 7; i++) {
        dates.push(addDaysToDateString(mondayStr, i));
      }
    } else {
      // Last 30 days
      const todayStr = getTodayDateString();
      for (let i = 29; i >= 0; i--) {
        dates.push(addDaysToDateString(todayStr, -i));
      }
    }
    return dates;
  }, [currentDate, selectedRange]);

  // Aggregate stats in dateRange
  const reportData = useMemo(() => {
    let completedTasks = 0;
    let totalTasks = 0;
    let totalXp = 0;
    let totalCoins = 0;
    const categoryCounts: Record<string, number> = {};
    const taskNotes: { date: string; taskTitle: string; note: string; category: string }[] = [];

    dateRange.forEach((date) => {
      const dayTasks = tasksByDate[date] || [];
      dayTasks.forEach((task) => {
        totalTasks++;
        if (task.completed) {
          completedTasks++;
          totalXp += task.xpReward || 0;
          totalCoins += task.coinReward || 0;
          categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1;
        }
        if (task.notes?.trim()) {
          taskNotes.push({
            date,
            taskTitle: task.title,
            note: task.notes.trim(),
            category: task.category,
          });
        }
      });
    });

    // Sleep analysis
    const sleepLogs = stats.sleepLogs || {};
    let totalSleepHours = 0;
    let sleepLogDaysCount = 0;
    dateRange.forEach((d) => {
      const log = sleepLogs[d];
      if (log?.sleepDurationHours) {
        totalSleepHours += log.sleepDurationHours;
        sleepLogDaysCount++;
      }
    });

    const avgSleep = sleepLogDaysCount > 0 ? (totalSleepHours / sleepLogDaysCount).toFixed(1) : null;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      completionRate,
      totalXp,
      totalCoins,
      categoryCounts,
      taskNotes,
      avgSleep,
      sleepLogDaysCount,
    };
  }, [dateRange, tasksByDate, stats.sleepLogs]);

  // Generate clean Markdown
  const markdownText = useMemo(() => {
    const rangeLabel =
      selectedRange === 'current_week'
        ? `Semana del ${dateRange[0]} al ${dateRange[dateRange.length - 1]}`
        : selectedRange === 'last_week'
        ? `Semana anterior (${dateRange[0]} al ${dateRange[dateRange.length - 1]})`
        : `Últimos 30 días (${dateRange[0]} al ${dateRange[dateRange.length - 1]})`;

    let md = `# 🛡️ La Solución: Resumen de Rendimiento Semanal\n`;
    md += `**Héroe**: ${stats.fullName || stats.username || 'Aventurero'} (Nivel ${stats.level} - ${stats.rankTitle})\n`;
    md += `**Período**: ${rangeLabel}\n`;
    md += `**Generado**: ${new Date().toLocaleString()}\n\n`;

    md += `## 📊 Métricas Clave\n`;
    md += `- **Tareas completadas**: ${reportData.completedTasks} de ${reportData.totalTasks} (${reportData.completionRate}% de efectividad)\n`;
    md += `- **XP Ganada**: +${reportData.totalXp} XP\n`;
    md += `- **Monedas acumuladas**: +${reportData.totalCoins} 🪙\n`;
    if (reportData.avgSleep) {
      md += `- **Sueño promedio**: ${reportData.avgSleep} horas / noche (registrado en ${reportData.sleepLogDaysCount} días)\n`;
    }
    md += `\n`;

    md += `## 🎯 Desglose por Categoría\n`;
    Object.entries(reportData.categoryCounts)
      .sort(([, a], [, b]) => Number(b) - Number(a))
      .forEach(([cat, count]) => {
        md += `- **${cat.toUpperCase()}**: ${count} misiones completadas\n`;
      });
    md += `\n`;

    if (reportData.taskNotes.length > 0) {
      md += `## 🧠 Bitácora de Aprendizaje y Notas de Repaso (${reportData.taskNotes.length})\n\n`;
      reportData.taskNotes.forEach((item) => {
        md += `### 📝 ${item.taskTitle} [${item.category}] (${item.date})\n`;
        md += `> ${item.note.replace(/\n/g, '\n> ')}\n\n`;
      });
    }

    md += `---\n*Exportado desde La Solución - Solo Leveling PWA*\n`;
    return md;
  }, [reportData, selectedRange, dateRange, stats]);

  if (!isOpen) return null;

  const handleCopyMarkdown = () => {
    soundFX.playClick();
    navigator.clipboard.writeText(markdownText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadFile = () => {
    soundFX.playSuccess();
    const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `La_Solucion_Resumen_${dateRange[0]}_a_${dateRange[dateRange.length - 1]}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    soundFX.playClick();
    window.print();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[170] portal-modal-root bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 select-none pointer-events-auto font-sans"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="weekly-report-modal-title"
        className="relative isolate w-full max-w-2xl bg-[#030712]/[0.98] border border-white/10 rounded-2xl sm:rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col max-h-[88dvh] sm:max-h-[84vh] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#040814]/[0.96] shrink-0 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl aura-bg-soft border aura-border-subtle flex items-center justify-center aura-text-primary aura-glow-subtle shrink-0">
              <FileDown className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="weekly-report-modal-title"
                className="text-base sm:text-lg font-anton uppercase tracking-wider text-white truncate"
              >
                Exportar Resumen y Bitácora
              </h2>
              <p className="text-xs text-slate-400 font-sans truncate">
                Genera tu reporte semanal para Notion, Obsidian o PDF en 1 clic
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar reporte semanal"
            className="chicle-btn w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Range Selector Controls */}
        <div className="p-4 border-b border-white/10 bg-[#040814]/[0.96] flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-1.5 bg-[#040814]/80 p-1 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setSelectedRange('current_week')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                selectedRange === 'current_week'
                  ? 'chicle-btn aura-btn-gradient optic-active-card font-anton uppercase tracking-wider'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              Esta Semana
            </button>
            <button
              type="button"
              onClick={() => setSelectedRange('last_week')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                selectedRange === 'last_week'
                  ? 'chicle-btn aura-btn-gradient optic-active-card font-anton uppercase tracking-wider'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              Semana Pasada
            </button>
            <button
              type="button"
              onClick={() => setSelectedRange('month')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                selectedRange === 'month'
                  ? 'chicle-btn aura-btn-gradient optic-active-card font-anton uppercase tracking-wider'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              Últimos 30 días
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className={`chicle-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-anton uppercase tracking-wider text-xs transition cursor-pointer optic-active-card ${
                copied
                  ? 'bg-emerald-500 text-slate-950 border border-emerald-400'
                  : 'aura-btn-gradient'
              }`}
              title="Copiar Markdown formateado"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '¡Copiado!' : 'Copiar MD'}
            </button>
            <button
              type="button"
              onClick={handleDownloadFile}
              className="chicle-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl aura-bg-soft border aura-border-subtle font-bold text-xs transition cursor-pointer"
              title="Descargar archivo .md"
            >
              <FileDown className="w-3.5 h-3.5" />
              Descargar .md
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="chicle-btn flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] text-slate-200 hover:text-white font-bold text-xs border border-white/15 transition cursor-pointer"
              title="Imprimir o Guardar en PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
          </div>
        </div>

        {/* Preview Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs font-mono relative z-10">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#040814]/80 border border-white/10 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Completadas</span>
              <span className="text-lg font-black aura-text-primary font-mono tabular-nums">
                {reportData.completedTasks} / {reportData.totalTasks}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono tabular-nums block">
                {reportData.completionRate}% éxito
              </span>
            </div>
            <div className="bg-[#040814]/80 border border-white/10 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">XP Ganada</span>
              <span className="text-lg font-black aura-text-soft font-mono tabular-nums">+{reportData.totalXp}</span>
              <span className="text-[10px] text-slate-400 font-sans block">Puntos héroe</span>
            </div>
            <div className="bg-[#040814]/80 border border-amber-500/25 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Monedas</span>
              <span className="text-lg font-black text-amber-400 font-mono tabular-nums">+{reportData.totalCoins}</span>
              <span className="text-[10px] text-slate-400 font-sans block">Para la tienda</span>
            </div>
            <div className="bg-[#040814]/80 border border-purple-500/25 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Sueño Promedio</span>
              <span className="text-lg font-black text-purple-300 font-mono tabular-nums">
                {reportData.avgSleep ? `${reportData.avgSleep}h` : '--'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono tabular-nums block">
                {reportData.sleepLogDaysCount} noches reg.
              </span>
            </div>
          </div>

          {/* Markdown Code Preview */}
          <div className="bg-[#040814]/80 border border-white/10 rounded-xl p-4 text-slate-200 text-xs leading-relaxed max-h-[280px] overflow-y-auto whitespace-pre-wrap select-all font-mono">
            {markdownText}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-[#040814]/[0.96] flex items-center justify-between gap-3 text-xs text-slate-400 relative z-10">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            Compatible al 100% con Obsidian, Notion, Logseq y Markdown estándar.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="chicle-btn px-4 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] text-slate-200 hover:text-white border border-white/15 font-anton uppercase tracking-wider text-xs transition cursor-pointer shrink-0"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
