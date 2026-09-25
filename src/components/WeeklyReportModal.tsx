import React, { useState, useMemo } from 'react';
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
    md += `- **Misiones completadas**: ${reportData.completedTasks} de ${reportData.totalTasks} (${reportData.completionRate}% de efectividad)\n`;
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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#011420] border border-cyan-500/40 rounded-2xl sm:rounded-3xl shadow-[0_0_35px_rgba(0,240,255,0.2)] overflow-hidden flex flex-col max-h-[88dvh] sm:max-h-[84vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-cyan-500/30 flex items-center justify-between bg-[#000a14] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#001020] border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)]">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide font-anton uppercase">
                Exportar Resumen y Bitácora
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Genera tu reporte semanal para Notion, Obsidian o PDF en 1 clic
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Range Selector Controls */}
        <div className="p-4 border-b border-cyan-500/20 bg-[#000a14] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-[#001020] p-1 rounded-xl border border-cyan-500/30 text-xs">
            <button
              onClick={() => setSelectedRange('current_week')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                selectedRange === 'current_week'
                  ? 'bg-cyan-400 text-slate-950 font-anton uppercase shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Esta Semana
            </button>
            <button
              onClick={() => setSelectedRange('last_week')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                selectedRange === 'last_week'
                  ? 'bg-cyan-400 text-slate-950 font-anton uppercase shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semana Pasada
            </button>
            <button
              onClick={() => setSelectedRange('month')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                selectedRange === 'month'
                  ? 'bg-cyan-400 text-slate-950 font-anton uppercase shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Últimos 30 días
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-anton uppercase tracking-wider text-xs shadow-[0_0_10px_rgba(245,158,11,0.3)] transition cursor-pointer"
              title="Copiar Markdown formateado"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-950" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '¡Copiado!' : 'Copiar MD'}
            </button>
            <button
              onClick={handleDownloadFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 font-bold text-xs shadow-[0_0_10px_rgba(0,240,255,0.2)] transition cursor-pointer"
              title="Descargar archivo .md"
            >
              <FileDown className="w-3.5 h-3.5" />
              Descargar .md
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#001020] hover:bg-[#001830] text-slate-300 font-bold text-xs border border-cyan-500/30 transition cursor-pointer"
              title="Imprimir o Guardar en PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
          </div>
        </div>

        {/* Preview Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs font-mono">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#000a14] border border-cyan-500/30 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Completadas</span>
              <span className="text-lg font-black text-cyan-400 font-sans">
                {reportData.completedTasks} / {reportData.totalTasks}
              </span>
              <span className="text-[10px] text-emerald-400 font-sans block">{reportData.completionRate}% éxito</span>
            </div>
            <div className="bg-[#000a14] border border-cyan-500/30 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">XP Ganada</span>
              <span className="text-lg font-black text-cyan-300 font-sans">+{reportData.totalXp}</span>
              <span className="text-[10px] text-slate-400 font-sans block">Puntos héroe</span>
            </div>
            <div className="bg-[#000a14] border border-amber-500/30 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Monedas</span>
              <span className="text-lg font-black text-amber-400 font-sans">+{reportData.totalCoins}</span>
              <span className="text-[10px] text-slate-400 font-sans block">Para la tienda</span>
            </div>
            <div className="bg-[#000a14] border border-purple-500/30 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Sueño Promedio</span>
              <span className="text-lg font-black text-purple-300 font-sans">
                {reportData.avgSleep ? `${reportData.avgSleep}h` : '--'}
              </span>
              <span className="text-[10px] text-slate-400 font-sans block">
                {reportData.sleepLogDaysCount} noches reg.
              </span>
            </div>
          </div>

          {/* Markdown Code Preview */}
          <div className="bg-[#000a14] border border-cyan-500/20 rounded-xl p-4 text-cyan-100 text-xs leading-relaxed max-h-[280px] overflow-y-auto whitespace-pre-wrap select-all font-mono">
            {markdownText}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-cyan-500/20 bg-[#000a14] flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Compatible al 100% con Obsidian, Notion, Logseq y Markdown estándar.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#001020] hover:bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
