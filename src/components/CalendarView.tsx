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
          FILA PRINCIPAL ZEN (ULTRA-COMPACTA: ~38px - 42px)
          ==================================================================== */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 relative z-10">
        {/* BLOQUE IZQUIERDO: Navegación de Fecha Rápida */}
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
          {/* Flecha Día Anterior */}
          <button 
            type="button"
            onClick={handlePrevDay} 
            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-cyan-950/50 border border-white/10 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-300 flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0"
            title="Día anterior"
            aria-label="Día anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Fecha Actual */}
          <div className="flex items-center gap-1.5 min-w-0 px-1.5 py-1 rounded-lg bg-black/40 border border-white/5">
            <span className="text-xs sm:text-sm font-anton uppercase tracking-wide text-white truncate">
              {dayNameShort} {dayNumber} {monthNameShort}
            </span>

            {isToday ? (
              <span className="px-1.5 py-0.2 rounded-md bg-cyan-400 text-black text-[9px] font-anton tracking-wider uppercase shadow-[0_0_8px_rgba(0,240,255,0.6)] shrink-0">
                Hoy
              </span>
            ) : (
              <button
                type="button"
                onClick={handleGoToday}
                className="px-1.5 py-0.2 rounded-md bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/50 text-cyan-300 text-[9px] font-anton tracking-wider uppercase transition-colors cursor-pointer shrink-0 flex items-center gap-0.5"
                title="Volver a la fecha de hoy"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Hoy</span>
              </button>
            )}
          </div>

          {/* Flecha Día Siguiente */}
          <button 
            type="button"
            onClick={handleNextDay} 
            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-cyan-950/50 border border-white/10 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-300 flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0"
            title="Día siguiente"
            aria-label="Día siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Alternador de Tira Semanal (7 Días) */}
          <button
            type="button"
            onClick={toggleWeekStrip}
            className={`px-1.5 py-1 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-90 shrink-0 ${
              showWeekStrip
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border-white/10'
            }`}
            title={showWeekStrip ? 'Ocultar tira semanal' : 'Ver semana en micro-píldoras'}
            aria-label="Alternar vista semanal"
          >
            <span>Sem</span>
            {showWeekStrip ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* BLOQUE DERECHO: Acciones Tácticas (Descanso, Datepicker, + Tarea) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
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
            className={`h-8 px-2 sm:px-2.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 active:scale-90 text-xs font-mono font-bold ${
              isCurrentDateRest
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400'
                : 'bg-white/[0.03] text-slate-400 border-white/10 hover:border-emerald-500/50 hover:text-emerald-300'
            }`}
            title={isCurrentDateRest ? 'Día de descanso activo: sin daño de HP y hábitos protegidos' : 'Activar día de descanso para esta fecha'}
          >
            <span className="text-sm leading-none">{isCurrentDateRest ? '🌿' : '🛡️'}</span>
            <span className="hidden md:inline text-[11px] font-anton uppercase tracking-wider">
              {isCurrentDateRest ? 'Descanso' : 'Pausa'}
            </span>
          </button>

          {/* Selector de Calendario Nativo (OS Date Picker) */}
          <div className="relative">
            <input
              type="date"
              value={currentDate}
              onChange={(e) => {
                if (e.target.value) {
                  soundFX.playClick();
                  onChangeDate(e.target.value);
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              aria-label="Elegir fecha específica"
            />
            <button 
              type="button"
              className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-cyan-950/50 border border-white/10 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-300 flex items-center justify-center transition-colors cursor-pointer"
              title="Abrir calendario completo"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Botón Añadir Tarea */}
          {onOpenAddModal && (
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onOpenAddModal();
              }}
              className="chicle-btn h-8 px-2.5 sm:px-3 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-anton text-xs uppercase tracking-wider flex items-center gap-1 shadow-[0_0_12px_rgba(0,240,255,0.4)] cursor-pointer"
              title="Nueva Tarea, Hábito o Planificación"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden sm:inline">Tarea</span>
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
                      isSelected && isDayToday
                        ? 'bg-cyan-500/30 border-cyan-400 text-white shadow-[0_0_10px_rgba(0,240,255,0.4)] ring-1 ring-cyan-400'
                        : isSelected
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                        : isDayToday
                        ? 'bg-yellow-400/10 border-yellow-400/50 text-yellow-300'
                        : isRest
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                        : 'bg-black/30 border-white/5 hover:border-white/20 text-slate-400 hover:text-white'
                    }`}
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
    </div>
  );
};

export default CalendarView;
