import React, { useEffect, useRef, useState, useMemo } from 'react';
import './moxen.css';
import { Check, Flame, Clock, Target, Award, Info } from 'lucide-react';
import { soundFX } from '../../utils/audio';

export interface DayPerformance {
  dayLabel: string;
  fullDate: string;
  name: string;
  focusMinutes: number;
  tasksDone: number;
  habitsDone: number;
  isToday?: boolean;
}

interface MoxenConstanciaProps {
  days: DayPerformance[];
  focusGoal?: number;
  tasksGoal?: number;
  habitsGoal?: number;
}

const L_LOGICAL = 260; // Base logical ring diameter
const MARGEN = 36;
const LT_LOGICAL = L_LOGICAL + 2 * MARGEN;
const GROSOR_LOGICAL = 22;
const RADIOS_LOGICAL = [112, 85, 58];

const RES = {
  anillo: { k: 78, c: 10 },
  glow: { k: 60, c: 9 }
};

const mulberry32 = (s: number) => () => {
  s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const limita = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export const MoxenConstancia: React.FC<MoxenConstanciaProps> = ({
  days,
  focusGoal = 60,
  tasksGoal = 5,
  habitsGoal = 3
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chispasRef = useRef<HTMLCanvasElement | null>(null);

  // Find index of today or default to last day
  const todayIdx = useMemo(() => {
    const idx = days.findIndex(d => d.isToday);
    return idx >= 0 ? idx : Math.max(0, days.length - 1);
  }, [days]);

  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(todayIdx);

  const selectedDay = days[selectedDayIdx] || days[0] || {
    dayLabel: 'H',
    fullDate: '',
    name: 'Hoy',
    focusMinutes: 0,
    tasksDone: 0,
    habitsDone: 0
  };

  const METAS = useMemo(() => [
    {
      id: 'focus',
      nombre: 'Minutos Foco',
      desc: 'Tiempo en concentración profunda',
      icon: <Clock className="w-4 h-4 text-cyan-400" />,
      meta: focusGoal,
      val: selectedDay.focusMinutes,
      unit: 'min',
      colorName: 'cyan',
      base: '#00f0ff',
      c0: '#0284c7',
      c1: '#38bdf8'
    },
    {
      id: 'tasks',
      nombre: 'Tareas Cumplidas',
      desc: 'Tareas diarias finalizadas',
      icon: <Target className="w-4 h-4 text-amber-400" />,
      meta: tasksGoal,
      val: selectedDay.tasksDone,
      unit: 'tareas',
      colorName: 'ambar',
      base: '#f59e0b',
      c0: '#b45309',
      c1: '#fbbf24'
    },
    {
      id: 'habits',
      nombre: 'Hábitos 21/66',
      desc: 'Rutinas de neuroplasticidad',
      icon: <Flame className="w-4 h-4 text-purple-400" />,
      meta: habitsGoal,
      val: selectedDay.habitsDone,
      unit: 'hábitos',
      colorName: 'purpura',
      base: '#a855f7',
      c0: '#6b21a8',
      c1: '#c084fc'
    }
  ], [selectedDay, focusGoal, tasksGoal, habitsGoal]);

  const allThreeClosed = METAS.every(m => m.val >= m.meta);

  // Overall average percent
  const overallPercent = useMemo(() => {
    const p1 = Math.min(1, selectedDay.focusMinutes / Math.max(1, focusGoal));
    const p2 = Math.min(1, selectedDay.tasksDone / Math.max(1, tasksGoal));
    const p3 = Math.min(1, selectedDay.habitsDone / Math.max(1, habitsGoal));
    return Math.round(((p1 + p2 + p3) / 3) * 100);
  }, [selectedDay, focusGoal, tasksGoal, habitsGoal]);

  // Spring states for rings
  const springVals = useRef<{ x: number; v: number; meta: number }[]>([
    { x: 0, v: 0, meta: 0 },
    { x: 0, v: 0, meta: 0 },
    { x: 0, v: 0, meta: 0 }
  ]);
  const glowSpring = useRef<{ x: number; v: number; meta: number }>({ x: 0, v: 0, meta: 0 });

  // Spark particles simulation
  const particles = useRef<any[]>([]);
  const destello = useRef<{ t: number; cx: number; cy: number; e: number } | null>(null);

  const triggerCelebration = () => {
    soundFX.playLevelUp?.();
    const azar = mulberry32(Date.now());
    const cx = LT_LOGICAL / 2;
    const cy = LT_LOGICAL / 2;
    const escala = 1;

    destello.current = { t: 0, cx, cy, e: escala };
    particles.current = [];

    METAS.forEach((m, i) => {
      for (let j = 0; j < 30; j++) {
        const a = azar() * 6.2832;
        const r = RADIOS_LOGICAL[i] * escala;
        const v = (100 + azar() * 220) * escala;
        const tang = (azar() - 0.5) * 0.7 * v;
        particles.current.push({
          x: cx + Math.cos(a) * r,
          y: cy + Math.sin(a) * r,
          vx: Math.cos(a) * v - Math.sin(a) * tang,
          vy: Math.sin(a) * v + Math.cos(a) * tang,
          vida: 0,
          dura: 0.8 + azar() * 0.7,
          r: (1.4 + azar() * 2.2) * escala,
          c: azar() < 0.25 ? '#ffffff' : azar() < 0.5 ? m.c1 : m.base,
          estrella: azar() < 0.2
        });
      }
    });
  };

  useEffect(() => {
    METAS.forEach((m, i) => {
      springVals.current[i].meta = Math.min(1.12, m.val / Math.max(1, m.meta));
    });
    if (allThreeClosed) {
      glowSpring.current.meta = 1;
      triggerCelebration();
    } else {
      glowSpring.current.meta = 0;
    }
  }, [selectedDayIdx, METAS, allThreeClosed]);

  // Main Canvas Render Loop with True Dynamic Responsive Sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    const chispasCanvas = chispasRef.current;
    const container = containerRef.current;
    if (!canvas || !chispasCanvas || !container) return;

    const g = canvas.getContext('2d');
    const cg = chispasCanvas.getContext('2d');
    if (!g || !cg) return;

    let raf = 0;
    let lastTime = performance.now();

    const dpr = Math.min(2, window.devicePixelRatio || 1);

    // Responsive scaling based on container clientWidth
    const measureAndResize = () => {
      const containerWidth = Math.min(300, Math.max(220, container.clientWidth || L_LOGICAL));
      const k = containerWidth / L_LOGICAL;
      const displaySize = LT_LOGICAL * k;

      canvas.width = Math.round(displaySize * dpr);
      canvas.height = Math.round(displaySize * dpr);
      canvas.style.width = `${displaySize}px`;
      canvas.style.height = `${displaySize}px`;

      chispasCanvas.width = Math.round(displaySize * dpr);
      chispasCanvas.height = Math.round(displaySize * dpr);
      chispasCanvas.style.width = `${displaySize}px`;
      chispasCanvas.style.height = `${displaySize}px`;

      return { k, displaySize };
    };

    let { k } = measureAndResize();

    const render = (now: number) => {
      const dt = Math.min(0.04, (now - lastTime) / 1000);
      lastTime = now;

      // Update springs
      springVals.current.forEach(r => {
        r.v += (RES.anillo.k * (r.meta - r.x) - RES.anillo.c * r.v) * dt;
        r.x += r.v * dt;
      });
      const gr = glowSpring.current;
      gr.v += (RES.glow.k * (gr.meta - gr.x) - RES.glow.c * gr.v) * dt;
      gr.x += gr.v * dt;

      // Clear main canvas
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, canvas.width, canvas.height);

      const S = dpr * k;
      const C = LT_LOGICAL / 2;
      g.setTransform(S, 0, 0, S, 0, 0);

      // Draw Rings
      for (let i = 0; i < 3; i++) {
        const r = RADIOS_LOGICAL[i];
        const p = limita(springVals.current[i].x, 0, 1.15);
        const meta = METAS[i];

        // Track background
        g.lineWidth = GROSOR_LOGICAL;
        g.lineCap = 'butt';
        g.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        g.beginPath();
        g.arc(C, C, r, 0, 6.2832);
        g.stroke();

        if (p < 0.003) continue;

        const a0 = -Math.PI / 2;
        const f = Math.min(p, 1);
        const a1 = a0 + 6.2832 * f;
        const aCab = a0 + 6.2832 * p;

        // Conic gradient arc
        const grad = g.createConicGradient(a0, C, C);
        grad.addColorStop(0, meta.c0);
        grad.addColorStop(Math.max(0.002, Math.min(0.999, f)), meta.c1);
        grad.addColorStop(1, meta.c1);

        g.save();
        g.shadowColor = meta.base;
        g.shadowBlur = (12 + gr.x * 10) * S;
        g.lineWidth = GROSOR_LOGICAL;
        g.lineCap = 'butt';
        g.strokeStyle = grad;
        g.beginPath();
        g.arc(C, C, r, a0, f >= 0.9995 ? a0 + 6.2832 : a1);
        g.stroke();
        g.restore();

        // Round start cap
        g.fillStyle = meta.c0;
        g.beginPath();
        g.arc(C + r * Math.cos(a0), C + r * Math.sin(a0), GROSOR_LOGICAL / 2, 0, 6.2832);
        g.fill();

        // Round head cap
        const hx = C + r * Math.cos(aCab);
        const hy = C + r * Math.sin(aCab);
        g.save();
        if (p > 0.94) {
          g.shadowColor = 'rgba(0, 0, 0, 0.7)';
          g.shadowBlur = 8 * S;
          g.shadowOffsetX = Math.cos(aCab + Math.PI / 2) * 3 * S;
          g.shadowOffsetY = Math.sin(aCab + Math.PI / 2) * 3 * S;
        } else {
          g.shadowColor = meta.base;
          g.shadowBlur = (8 + gr.x * 6) * S;
        }
        g.fillStyle = meta.c1;
        g.beginPath();
        g.arc(hx, hy, GROSOR_LOGICAL / 2, 0, 6.2832);
        g.fill();
        g.restore();

        // Specular highlight on head
        g.fillStyle = 'rgba(255, 255, 255, 0.28)';
        g.beginPath();
        g.arc(hx - 2, hy - 2, GROSOR_LOGICAL * 0.22, 0, 6.2832);
        g.fill();
      }

      // Render Chispas / Sparks Canvas
      cg.setTransform(1, 0, 0, 1, 0, 0);
      cg.clearRect(0, 0, chispasCanvas.width, chispasCanvas.height);
      cg.setTransform(dpr * k, 0, 0, dpr * k, 0, 0);

      if (destello.current) {
        destello.current.t += dt / 0.85;
        if (destello.current.t >= 1) {
          destello.current = null;
        } else {
          const t = destello.current.t;
          const radial = cg.createRadialGradient(C, C, 0, C, C, 80 + t * 200);
          const alpha = Math.pow(1 - t, 2) * 0.5;
          radial.addColorStop(0, `rgba(0, 240, 255, ${alpha})`);
          radial.addColorStop(0.6, `rgba(168, 85, 247, ${alpha * 0.3})`);
          radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
          cg.fillStyle = radial;
          cg.fillRect(0, 0, LT_LOGICAL, LT_LOGICAL);

          // Expanding shockwave ring
          cg.lineWidth = Math.max(0.5, 2.5 * (1 - t));
          cg.strokeStyle = `rgba(255, 255, 255, ${0.7 * (1 - t)})`;
          cg.beginPath();
          cg.arc(C, C, 60 + t * 180, 0, 6.2832);
          cg.stroke();
        }
      }

      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.vida += dt;
        if (p.vida >= p.dura) {
          particles.current.splice(i, 1);
          continue;
        }
        p.vx *= 1 - 1.2 * dt;
        p.vy = p.vy * (1 - 1.2 * dt) + 120 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const a = Math.pow(1 - p.vida / p.dura, 1.2);
        cg.globalAlpha = a;
        cg.fillStyle = p.c;

        cg.beginPath();
        cg.arc(p.x, p.y, p.r, 0, 6.2832);
        cg.fill();
      }
      cg.globalAlpha = 1;

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [METAS]);

  return (
    <div className="moxen-constancia-root p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#080e1e] to-[#02050e] border border-cyan-500/30 shadow-[0_10px_35px_rgba(0,240,255,0.1)] relative overflow-hidden">
      {/* Header with clear explanatory context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 relative z-10">
        <div>
          <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest">
            <Award className="w-3.5 h-3.5 text-cyan-400" />
            Consistencia Diaria
          </div>
          <h3 className="text-sm sm:text-base font-anton uppercase tracking-wide text-white mt-0.5">
            Los 3 Anillos de Rendimiento
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
            Día: <strong className="text-cyan-300">{selectedDay.name}</strong>
          </span>
        </div>
      </div>

      {/* Guide explanation box */}
      <div className="p-2 sm:p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[10px] sm:text-[11px] text-slate-300 font-mono mb-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="leading-tight">
            <strong>¿Cómo leer tus 3 anillos?</strong> Cada anillo representa una dimensión de tu constancia diaria:
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-[9px] sm:text-[10px] flex-wrap">
          <span className="flex items-center gap-1 text-cyan-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]" /> Foco (Ext.)
          </span>
          <span className="flex items-center gap-1 text-amber-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" /> Tareas (Med.)
          </span>
          <span className="flex items-center gap-1 text-purple-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_6px_#a855f7]" /> Hábitos (Int.)
          </span>
        </div>
      </div>

      <div className="flex flex-col md:grid md:grid-cols-12 gap-5 items-center relative z-10 mb-4">
        {/* Canvas Rings Center */}
        <div className="w-full md:col-span-6 flex justify-center items-center py-1">
          <div ref={containerRef} className="co-anillos">
            <canvas ref={canvasRef} className="co-lienzo" />
            <canvas ref={chispasRef} className="co-chispas" />

            <div className="co-centro">
              <div className="co-pct">
                <span>{overallPercent}</span>
                <b>%</b>
              </div>
              <div className="co-cap">
                {allThreeClosed ? (
                  <span className="text-amber-400 font-bold animate-pulse">
                    ✨ ¡Trío Cerrado!
                  </span>
                ) : (
                  <span>Meta de Hoy</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Goal Detail Cards with explicit color legend */}
        <div className="w-full md:col-span-6 space-y-2">
          {METAS.map((m) => {
            const isCompleted = m.val >= m.meta;
            const pct = Math.min(100, Math.round((m.val / Math.max(1, m.meta)) * 100));

            return (
              <div
                key={m.id}
                className={`co-fila ${isCompleted ? 'is-ok' : ''}`}
                style={{
                  ['--c' as any]: m.base,
                  ['--c0' as any]: m.c0,
                  ['--c1' as any]: m.c1
                }}
              >
                <div className="co-punto" />

                <div className="co-fila-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      {m.icon}
                      <span>{m.nombre}</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      {m.val} / {m.meta} {m.unit}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{m.desc}</p>

                  <div className="w-full h-1.5 bg-black/60 rounded-full mt-1.5 overflow-hidden border border-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${m.c0}, ${m.c1})`,
                        boxShadow: `0 0 10px ${m.base}`
                      }}
                    />
                  </div>
                </div>

                <div className="co-ok">
                  <Check className="w-4 h-4 text-black stroke-[3]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Day Selector with Mini-Rings (Fluid on mobile) */}
      <div className="pt-3 border-t border-cyan-500/20 relative z-10 flex flex-col items-center">
        <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-2.5 text-center">
          Historial de la Semana (Toca un día para inspeccionar)
        </span>

        <div className="co-semana">
          {days.map((d, idx) => {
            const isSelected = selectedDayIdx === idx;
            const p1 = Math.min(1, d.focusMinutes / Math.max(1, focusGoal));
            const p2 = Math.min(1, d.tasksDone / Math.max(1, tasksGoal));
            const p3 = Math.min(1, d.habitsDone / Math.max(1, habitsGoal));

            const c1 = 2 * Math.PI * 13;
            const c2 = 2 * Math.PI * 9.5;
            const c3 = 2 * Math.PI * 6;

            return (
              <button
                key={d.fullDate || `day-${idx}`}
                type="button"
                className="co-dia"
                aria-selected={isSelected}
                onClick={() => {
                  soundFX.playClick();
                  setSelectedDayIdx(idx);
                }}
              >
                <div className="co-mini">
                  <svg viewBox="0 0 34 34">
                    <circle cx="17" cy="17" r="13" stroke="#00f0ff" strokeOpacity="0.2" />
                    <circle
                      cx="17"
                      cy="17"
                      r="13"
                      stroke="#00f0ff"
                      strokeDasharray={c1}
                      strokeDashoffset={c1 * (1 - p1)}
                    />

                    <circle cx="17" cy="17" r="9.5" stroke="#f59e0b" strokeOpacity="0.2" />
                    <circle
                      cx="17"
                      cy="17"
                      r="9.5"
                      stroke="#f59e0b"
                      strokeDasharray={c2}
                      strokeDashoffset={c2 * (1 - p2)}
                    />

                    <circle cx="17" cy="17" r="6" stroke="#a855f7" strokeOpacity="0.2" />
                    <circle
                      cx="17"
                      cy="17"
                      r="6"
                      stroke="#a855f7"
                      strokeDasharray={c3}
                      strokeDashoffset={c3 * (1 - p3)}
                    />
                  </svg>
                </div>

                <span className="co-dia-l">{d.dayLabel}</span>
                {d.isToday && <span className="co-dia-h" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MoxenConstancia;
