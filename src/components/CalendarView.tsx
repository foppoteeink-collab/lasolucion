import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronDown, 
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { soundFX } from '../utils/audio';
import { addDaysToDateString, getTodayDateString, parseLocalDate } from '../utils/date';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTaskStore } from '../store/useTaskStore';
import { MonthlyCalendarModal } from './MonthlyCalendarModal';

interface CalendarViewProps {
  currentDate: string;
  onChangeDate: (date: string) => void;
  onOpenAddModal?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  currentDate, 
  onChangeDate, 
  onOpenAddModal 
}) => {
  const restDays = usePlayerStore((s) => s.stats.restDays);
  const toggleRestDay = usePlayerStore((s) => s.toggleRestDay);
  const isCurrentDateRest = Boolean(currentDate && restDays?.[currentDate]);
  const tasksByDate = useTaskStore((s) => s.tasksByDate);

  const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false);

  // Persisted state for optional weekly micro-strip
  const [showWeekStrip, setShowWeekStrip] = useState<boolean>(() => {
    try {
      return localStorage.getItem('taskquest_show_week_strip') === 'true';
    } catch {
      return false;
    }
  });

  const todayStr = getTodayDateString();
  const isToday = currentDate === todayStr;

  const toggleWeekStrip = () => {
    soundFX.playClick();
    const next = !showWeekStrip;
    setShowWeekStrip(next);
    try {
      localStorage.setItem('taskquest_show_week_strip', String(next));
    } catch {
      // ignore
    }
  };

  const weekDays = useMemo(() => {
    const days = [];
    // -3 to +3 keeps currentDate centered in the 7-day strip
    for (let i = -3; i <= 3; i++) {
      days.push(addDaysToDateString(currentDate, i));
    }
    return days;
  }, [currentDate]);

  const handlePrevDay = () => {
    soundFX.playClick();
    onChangeDate(addDaysToDateString(currentDate, -1));
  };

  const handleNextDay = () => {
    soundFX.playClick();
    onChangeDate(addDaysToDateString(currentDate, 1));
  };

  const handleGoToday = () => {
    soundFX.playClick();
    onChangeDate(todayStr);
  };

  const dateObj = parseLocalDate(currentDate);
  const dayNameShort = dateObj.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
  const dayNumber = dateObj.getDate();
  const monthNameShort = dateObj.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');

  return (
    <div className="relative isolate rounded-2xl bg-surface-card border border-white/10 backdrop-blur-xl p-2 sm:p-2.5 mb-3 text-white transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      {/* Grano esmerilado táctil */}
      <span className="vi-grano opacity-5" aria-hidden="true" />

      {/* ====================================================================
          FILA PRINCIPAL RESPONSIVE (MÓVIL EN 2 NIVELES / DESKTOP EN 1 LÍNEA)
          ==================================================================== */}
      {/* 1. MODO ESCRITORIO / TABLET (>= 640px): BARRA ZEN EN UNA SOLA LÍNEA */}
      <div className="hidden sm:flex items-center justify-between gap-2 relative z-10">
        {/* BLOQUE IZQUIERDO: Navegación de Fecha Rápida */}
        <div className="flex items-center gap-1.5 min-w-0">
          <button 
            type="button"
            onClick={handlePrevDay} 
            className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-cyan-950/50 border border-white/10 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-300 flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0"
            title="Día anterior"
            aria-label="Día anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Fecha Actual */}
          <div className="flex items-center gap-2 min-w-0 px-2.5 py-1 rounded-xl bg-black/40 border border-white/10">
            <span className="text-sm font-anton uppercase tracking-wide text-white truncate capitalize">
              {dayNameShort}, {dayNumber} {monthNameShort}
            </span>

            {isToday ? (
              <span 
                className="px-1.5 py-0.5 rounded-md text-[9px] font-anton tracking-wider uppercase font-bold shrink-0"
                style={{
                  background: 'var(--aura-color-1, #00f0ff)',
                  color: '#030712',
                  boxShadow: '0 0 8px rgba(var(--aura-glow-rgb, 0, 240, 255), 0.6)'
                }}
              >
                Hoy
              </span>
            ) : (
              <button
                type="button"
                onClick={handleGoToday}
                className="px-1.5 py-0.5 rounded-md bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/50 text-cyan-300 text-[9px] font-anton tracking-wider uppercase transition-colors cursor-pointer shrink-0 flex items-center gap-0.5"
                title="Volver a la fecha de hoy"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Hoy</span>
              </button>
            )}
          </div>

          <button 
            type="button"
            onClick={handleNextDay} 
            className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-cyan-950/50 border border-white/10 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-300 flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0"
            title="Día siguiente"
            aria-label="Día siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Alternador de Tira Semanal (7 Días) */}
          <button
            type="button"
            onClick={toggleWeekStrip}
            className={`px-2 py-1 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-90 shrink-0 ${
              showWeekStrip
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border-white/10'
            }`}
            title={showWeekStrip ? 'Ocultar tira semanal' : 'Ver semana en micro-píldoras'}
            aria-label="Alternar vista semanal"
          >
            <span>Semana</span>
            {showWeekStrip ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* BLOQUE DERECHO: Acciones Tácticas (Descanso, Datepicker, + Tarea) */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {/* Modo Descanso */}
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              const wasActivated = toggleRestDay(currentDate);
              if (wasActivated) {
                soundFX.playItemEquip();
              }
            }}
            data-tour="rest-mode-btn"
            className={`h-8 px-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 active:scale-90 text-xs font-mono font-bold ${
              isCurrentDateRest
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400'
                : 'bg-white/[0.03] text-slate-400 border-white/10 hover:border-emerald-500/50 hover:text-emerald-300'
            }`}
            title={isCurrentDateRest ? 'Día de descanso activo: sin daño de HP y hábitos protegidos' : 'Activar día de descanso para esta fecha'}
          >
            <span className="text-sm leading-none">{isCurrentDateRest ? '🌿' : '🛡️'}</span>
            <span className="text-[11px] font-anton uppercase tracking-wider">
              {isCurrentDateRest ? 'En Descanso' : 'Pausa'}
            </span>
          </button>

          {/* Botón de Planificador & Calendario Mensual */}
          <button 
            type="button"
            onClick={() => {
              soundFX.playClick();
              setIsMonthlyModalOpen(true);
            }}
            className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-cyan-950/50 border border-white/10 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-300 flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title="Abrir Planificador Mensual Completo"
            aria-label="Abrir Planificador Mensual"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-cyan-300" />
          </button>

          {/* Botón Añadir Tarea */}
          {onOpenAddModal && (
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onOpenAddModal();
              }}
              className="btn-neon-hunter h-8 px-3 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1 shadow-lg cursor-pointer"
              title="Nueva Tarea, Hábito o Planificación"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Tarea</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. MODO MÓVIL (< 640px): BARRA COMPACTA EN UNA SOLA LÍNEA */}
      <div className="flex sm:hidden items-center justify-between gap-1.5 relative z-10">
        {/* BLOQUE IZQUIERDO: Navegación de Fecha Rápida */}
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <button 
            type="button"
            onClick={handlePrevDay} 
            className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-cyan-950/50 border border-white/10 text-slate-300 flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0"
            title="Día anterior"
            aria-label="Día anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Fecha Actual */}
          <div className="flex-1 flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-lg bg-black/50 border border-white/10 min-w-0">
            <span className="text-[11px] font-anton uppercase tracking-wide text-white truncate capitalize">
              {dayNameShort}, {dayNumber} {monthNameShort}
            </span>

            {isToday ? (
              <span 
                className="px-1 py-0.2 rounded text-[8px] font-anton tracking-wider uppercase font-bold shrink-0"
                style={{
                  background: 'var(--aura-color-1, #00f0ff)',
                  color: '#030712'
                }}
              >
                Hoy
              </span>
            ) : (
              <button
                type="button"
                onClick={handleGoToday}
                className="px-1 py-0.2 rounded bg-cyan-950 border border-cyan-400/50 text-cyan-300 text-[8px] font-anton uppercase tracking-wider cursor-pointer shrink-0"
                title="Volver a la fecha de hoy"
              >
                Hoy
              </button>
            )}
          </div>

          <button 
            type="button"
            onClick={handleNextDay} 
            className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-cyan-950/50 border border-white/10 text-slate-300 flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0"
            title="Día siguiente"
            aria-label="Día siguiente"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ACCIONES COMPACTAS: Pausa, Mes, + Tarea */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              const wasActivated = toggleRestDay(currentDate);
              if (wasActivated) soundFX.playItemEquip();
            }}
            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
              isCurrentDateRest
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-400'
                : 'bg-white/[0.03] text-slate-400 border-white/10'
            }`}
            title={isCurrentDateRest ? 'En Descanso' : 'Pausa / Descanso'}
            aria-label="Día de descanso"
          >
            <span className="text-xs">{isCurrentDateRest ? '🌿' : '🛡️'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setIsMonthlyModalOpen(true);
            }}
            className="w-7 h-7 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-slate-300 flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title="Calendario Mensual"
            aria-label="Abrir calendario mensual"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-cyan-300" />
          </button>

          {/* Botón Añadir Tarea Móvil */}
          {onOpenAddModal && (
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onOpenAddModal();
              }}
              className="btn-neon-hunter h-7 px-2 rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md cursor-pointer shrink-0"
              title="Nueva Tarea o Hábito"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span>Tarea</span>
            </button>
          )}
        </div>
      </div>

      {/* ====================================================================
          TIRA SEMANAL COLAPSABLE EN MICRO-PÍLDORAS (SOLO SI SE ACTIVA: ~32px)
          ==================================================================== */}
      <AnimatePresence>
        {showWeekStrip && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 pt-1 border-t border-white/10">
              {weekDays.map((dateStr) => {
                const isSelected = dateStr === currentDate;
                const isDayToday = dateStr === todayStr;
                const isRest = Boolean(dateStr && restDays?.[dateStr]);
                const d = parseLocalDate(dateStr);
                const dName = d.toLocaleDateString('es-ES', { weekday: 'narrow' }).toUpperCase();
                const dNum = d.getDate();

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      onChangeDate(dateStr);
                    }}
                    className={`relative py-1 px-0.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[34px] ${
                      isSelected
                        ? 'text-white'
                        : isDayToday
                        ? 'bg-yellow-400/10 border-yellow-400/50 text-yellow-300'
                        : isRest
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                        : 'bg-black/30 border-white/5 hover:border-white/20 text-slate-400 hover:text-white'
                    }`}
                    style={isSelected ? {
                      background: 'color-mix(in srgb, var(--aura-color-1, #00f0ff) 25%, transparent)',
                      borderColor: 'var(--aura-color-1, #00f0ff)',
                      boxShadow: '0 0 10px rgba(var(--aura-glow-rgb, 0, 240, 255), 0.45)'
                    } : undefined}
                  >
                    <span className="text-[9px] font-mono leading-none opacity-80">
                      {dName}
                    </span>
                    <span className="text-xs font-anton leading-tight mt-0.5">
                      {dNum}
                    </span>
                    {isDayToday && !isSelected && (
                      <span className="w-1 h-1 rounded-full bg-yellow-400 absolute bottom-0.5" />
                    )}
                    {isRest && (
                      <span className="text-[7px] leading-none absolute -top-1 right-0.5">🌿</span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Planificador & Calendario Mensual Completo en Modal Sci-Fi */}
      <MonthlyCalendarModal
        isOpen={isMonthlyModalOpen}
        onClose={() => setIsMonthlyModalOpen(false)}
        currentDate={currentDate}
        tasksByDate={tasksByDate}
        onChangeDate={onChangeDate}
      />
    </div>
  );
};

export default CalendarView;
