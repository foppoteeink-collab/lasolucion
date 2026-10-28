import React, { useState, useRef, useMemo, useEffect } from 'react';
import './moxen.css';
import { Moon, Sparkles, Clock, CheckCircle2, ChevronRight, Sliders } from 'lucide-react';
import { soundFX } from '../../utils/audio';

interface MoxenSuenoProps {
  bedtime?: string;
  wakeTime?: string;
  sleepDurationHours?: number;
  quality?: string;
  dateStr?: string;
  onSaveSleep?: (data: { bedtime: string; wakeTime: string; durationHours: number; quality: string }) => void;
}

const NOMBRES_FASES: Record<string, { label: string; color: string; heightFraction: number }> = {
  d: { label: 'Despierto', color: '#f97316', heightFraction: 0.28 },
  l: { label: 'Ligero', color: '#38bdf8', heightFraction: 0.48 },
  p: { label: 'Profundo', color: '#6366f1', heightFraction: 0.95 },
  e: { label: 'REM / Ensueño', color: '#c084fc', heightFraction: 0.72 }
};

// 80 6-minute chunks default pattern (23:00 to 07:00)
const DEFAULT_NOCHE_PATTERN =
  'd' + 'lllll' + 'pppppppp' + 'lll' + 'ee' + 'd' + 'lll' + 'pppppp' + 'll' + 'eeee' + 'llll' +
  'ppp' + 'll' + 'eeeee' + 'lllllll' + 'eeeeee' + 'll' + 'd' + 'llll' + 'eeeeeee' + 'lll' + 'd';

export const MoxenSueno: React.FC<MoxenSuenoProps> = ({
  bedtime = '23:00',
  wakeTime = '07:00',
  sleepDurationHours = 8.0,
  quality = 'Excelente',
  dateStr,
  onSaveSleep
}) => {
  const [currentBedtime, setCurrentBedtime] = useState(bedtime);
  const [currentWakeTime, setCurrentWakeTime] = useState(wakeTime);
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Brush range: [startIdx, endIdx] (0 to 79)
  const [brushRange, setBrushRange] = useState<[number, number]>([0, 79]);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<'left' | 'right' | 'body' | null>(null);
  const dragStartXRef = useRef<number>(0);
  const initialRangeRef = useRef<[number, number]>([0, 79]);

  const totalBars = 80;
  const bars = useMemo(() => {
    return Array.from({ length: totalBars }).map((_, i) => {
      const char = DEFAULT_NOCHE_PATTERN[i % DEFAULT_NOCHE_PATTERN.length] || 'l';
      return {
        idx: i,
        phase: char,
        ...NOMBRES_FASES[char]
      };
    });
  }, [totalBars]);

  // Calculate stats based on brush range
  const statsInRange = useMemo(() => {
    const [start, end] = brushRange;
    const selectedBars = bars.slice(start, end + 1);
    const totalMinutes = selectedBars.length * 6;

    let awakeMinutes = 0;
    let deepMinutes = 0;
    let remMinutes = 0;
    let lightMinutes = 0;

    selectedBars.forEach(b => {
      if (b.phase === 'd') awakeMinutes += 6;
      else if (b.phase === 'p') deepMinutes += 6;
      else if (b.phase === 'e') remMinutes += 6;
      else lightMinutes += 6;
    });

    const sleepMinutes = totalMinutes - awakeMinutes;
    const hours = Math.floor(sleepMinutes / 60);
    const mins = sleepMinutes % 60;
    const durationHours = Math.round((sleepMinutes / 60) * 10) / 10;

    // Sleep score formula
    let score = Math.round((sleepMinutes / 480) * 60 + (deepMinutes / 90) * 25 + (remMinutes / 90) * 15);
    score = Math.min(100, Math.max(30, score));

    return {
      totalMinutes,
      sleepMinutes,
      awakeMinutes,
      deepMinutes,
      remMinutes,
      lightMinutes,
      hours,
      mins,
      durationHours,
      score
    };
  }, [bars, brushRange]);

  // Pointer drag events for brush
  const handlePointerDown = (type: 'left' | 'right' | 'body', e: React.PointerEvent) => {
    e.stopPropagation();
    isDraggingRef.current = type;
    dragStartXRef.current = e.clientX;
    initialRangeRef.current = [...brushRange];
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStartXRef.current;
    const deltaIdx = Math.round((deltaX / rect.width) * totalBars);

    const [initStart, initEnd] = initialRangeRef.current;

    if (isDraggingRef.current === 'left') {
      const newStart = Math.min(initEnd - 4, Math.max(0, initStart + deltaIdx));
      setBrushRange([newStart, initEnd]);
    } else if (isDraggingRef.current === 'right') {
      const newEnd = Math.max(initStart + 4, Math.min(totalBars - 1, initEnd + deltaIdx));
      setBrushRange([initStart, newEnd]);
    } else if (isDraggingRef.current === 'body') {
      const span = initEnd - initStart;
      let newStart = initStart + deltaIdx;
      let newEnd = newStart + span;

      if (newStart < 0) {
        newStart = 0;
        newEnd = span;
      }
      if (newEnd >= totalBars) {
        newEnd = totalBars - 1;
        newStart = newEnd - span;
      }
      setBrushRange([newStart, newEnd]);
    }
  };

  const handlePointerUp = () => {
    if (isDraggingRef.current) {
      soundFX.playClick();
      isDraggingRef.current = null;
    }
  };

  const handleSave = () => {
    soundFX.playClick();
    if (onSaveSleep) {
      const q = statsInRange.score >= 85 ? 'Excelente' : statsInRange.score >= 70 ? 'Buena' : 'Regular';
      onSaveSleep({
        bedtime: currentBedtime,
        wakeTime: currentWakeTime,
        durationHours: statsInRange.durationHours,
        quality: q
      });
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 3000);
    }
  };

  const startPercent = (brushRange[0] / totalBars) * 100;
  const widthPercent = ((brushRange[1] - brushRange[0] + 1) / totalBars) * 100;

  const handleApplyPreset = (start: number, end: number, bTime: string, wTime: string) => {
    soundFX.playClick();
    setBrushRange([start, end]);
    setCurrentBedtime(bTime);
    setCurrentWakeTime(wTime);
  };

  return (
    <div className="moxen-sueno-root p-3.5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#080e1e] to-[#02050e] border border-cyan-500/30 shadow-[0_10px_35px_rgba(0,240,255,0.1)] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-80 h-32 bg-indigo-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold uppercase tracking-widest">
            <Moon className="w-4 h-4 text-indigo-400" />
            Cronobiograma Cuántico
          </div>
          <h3 className="text-sm sm:text-lg font-anton uppercase tracking-wide text-white mt-0.5">
            Arquitectura del Sueño & Recuperación
          </h3>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 flex-wrap text-[9px] sm:text-[10px] font-mono">
          <span className="flex items-center gap-1 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-[#f97316]" /> Despierto
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8]" /> Ligero
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-[#6366f1]" /> Profundo
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-[#c084fc]" /> REM
          </span>
        </div>
      </div>

      {/* Guide explanation box */}
      <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[10px] sm:text-[11px] text-indigo-200 font-mono mb-3 flex items-start gap-2 relative z-10">
        <Sparkles className="w-4 h-4 text-indigo-300 shrink-0 mt-0.5" />
        <span className="leading-tight">
          <strong>¿Cómo leerlo?</strong> Cada barra representa 6 min de la noche. Arrastra las manijas cian del marco interactivo o toca un ajuste rápido para sincronizar tu descanso.
        </span>
      </div>

      {/* Quick Preset Buttons (Mobile-First Touch Chips) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-2 relative z-10 scrollbar-none">
        <button
          type="button"
          onClick={() => handleApplyPreset(0, 79, '23:00', '07:00')}
          className="px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-[10px] font-mono text-indigo-200 hover:text-white transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1"
        >
          <Moon className="w-3 h-3 text-indigo-400" />
          <span>🌙 Noche 8h (23:00-07:00)</span>
        </button>

        <button
          type="button"
          onClick={() => handleApplyPreset(10, 69, '00:00', '06:00')}
          className="px-2.5 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-[10px] font-mono text-purple-200 hover:text-white transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span>💤 Profundo 6h (00:00-06:00)</span>
        </button>

        <button
          type="button"
          onClick={() => handleApplyPreset(0, 7, '14:00', '14:45')}
          className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-[10px] font-mono text-cyan-200 hover:text-white transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1"
        >
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>⚡ Siesta 45m</span>
        </button>
      </div>

      {/* Interactive Sleep Hypnogram Canvas / Bars */}
      <div
        ref={containerRef}
        className="sn-grafica relative z-10 my-3"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Bars Container */}
        <div className="sn-pista">
          {bars.map((b) => {
            const inRange = b.idx >= brushRange[0] && b.idx <= brushRange[1];
            return (
              <div
                key={b.idx}
                className="sn-barra"
                style={{
                  height: `${b.heightFraction * 100}%`,
                  backgroundColor: b.color,
                  opacity: inRange ? 1 : 0.25,
                  boxShadow: inRange && (b.phase === 'p' || b.phase === 'e') ? `0 0 8px ${b.color}` : 'none'
                }}
                onPointerEnter={() => setHoveredIdx(b.idx)}
                onPointerLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </div>

        {/* Selection Brush */}
        <div
          className="sn-pincel"
          style={{
            left: `${startPercent}%`,
            width: `${widthPercent}%`
          }}
          onPointerDown={(e) => handlePointerDown('body', e)}
        >
          {/* Left Handle with expanded hit-target */}
          <div
            className="sn-asa sn-asa-izq"
            onPointerDown={(e) => handlePointerDown('left', e)}
          />
          {/* Right Handle with expanded hit-target */}
          <div
            className="sn-asa sn-asa-der"
            onPointerDown={(e) => handlePointerDown('right', e)}
          />
        </div>
      </div>

      {/* Timeline Hour Labels */}
      <div className="flex justify-between text-[9px] sm:text-[10px] font-mono text-slate-500 px-1 mb-4 relative z-10">
        <span>23:00</span>
        <span>01:00</span>
        <span>03:00</span>
        <span>05:00</span>
        <span>07:00</span>
      </div>

      {/* Sleep Metrics Cards (Ultra-compact 3 columns on mobile) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3.5 relative z-10 mb-4">
        <div className="p-2.5 sm:p-3.5 rounded-2xl bg-[#030712]/90 border border-indigo-500/30 flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-950/80 border border-indigo-400 flex items-center justify-center text-indigo-300 font-bold shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.3)]">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-300" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 truncate">Tiempo Dormido</p>
            <p className="text-xs sm:text-base font-black text-white font-mono truncate">
              {statsInRange.hours}h {statsInRange.mins}m
            </p>
          </div>
        </div>

        <div className="p-2.5 sm:p-3.5 rounded-2xl bg-[#030712]/90 border border-indigo-500/30 flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-950/80 border border-purple-400 flex items-center justify-center text-purple-300 font-bold shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-300" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 truncate">Biorritmo</p>
            <p className="text-xs sm:text-base font-black text-amber-300 font-mono truncate">
              {statsInRange.score}<span className="text-[9px] text-slate-400 font-sans">/100</span>
            </p>
          </div>
        </div>

        <div className="p-2.5 sm:p-3.5 rounded-2xl bg-[#030712]/90 border border-indigo-500/30 flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-cyan-950/80 border border-cyan-400 flex items-center justify-center text-cyan-300 font-bold shrink-0 shadow-[0_0_10px_rgba(0,240,255,0.3)]">
            <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 truncate">Profundo+REM</p>
            <p className="text-xs sm:text-base font-black text-cyan-300 font-mono truncate">
              {Math.floor((statsInRange.deepMinutes + statsInRange.remMinutes) / 60)}h {(statsInRange.deepMinutes + statsInRange.remMinutes) % 60}m
            </p>
          </div>
        </div>
      </div>

      {/* Manual Sleep Calibrator Form */}
      <div className="p-2.5 sm:p-3.5 rounded-2xl bg-[#040a18] border border-cyan-500/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 relative z-10">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-xs font-bold text-slate-200">Horario Exacto:</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-xl border border-white/10 flex-1 sm:flex-none">
            <span className="text-[9px] font-mono text-slate-400">Dormir:</span>
            <input
              type="time"
              value={currentBedtime}
              onChange={(e) => setCurrentBedtime(e.target.value)}
              className="bg-transparent text-xs font-mono text-white focus:outline-none w-16"
            />
          </div>

          <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-xl border border-white/10 flex-1 sm:flex-none">
            <span className="text-[9px] font-mono text-slate-400">Despertar:</span>
            <input
              type="time"
              value={currentWakeTime}
              onChange={(e) => setCurrentWakeTime(e.target.value)}
              className="bg-transparent text-xs font-mono text-white focus:outline-none w-16"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-all shadow-[0_0_12px_rgba(99,102,241,0.4)] cursor-pointer active:scale-95 text-center"
          >
            Guardar Noche
          </button>
        </div>
      </div>

      {savedFeedback && (
        <p className="text-[11px] font-mono text-emerald-400 text-center mt-2.5 animate-fadeIn">
          ✓ Registro de descanso actualizado y sincronizado en tu matriz cuántica.
        </p>
      )}
    </div>
  );
};

export default MoxenSueno;
