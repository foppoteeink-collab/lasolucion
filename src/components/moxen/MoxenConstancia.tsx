import React, { useEffect, useRef, useState, useMemo } from 'react';
import './moxen.css';
import { Check, Flame, Clock, Target, Sparkles, Award } from 'lucide-react';
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

const L = 340; // logical size
const MARGEN = 48;
const LT = L + 2 * MARGEN;
const GROSOR = 28;
const RADIOS = [142, 108, 74];

const RES = {
  anillo: { k: 78, c: 10 },
  pulso: { k: 130, c: 7 },
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
      nombre: 'Misiones Cumplidas',
      icon: <Target className="w-4 h-4 text-amber-400" />,
      meta: tasksGoal,
      val: selectedDay.tasksDone,
      unit: 'misiones',
      colorName: 'ambar',
      base: '#f59e0b',
      c0: '#b45309',
      c1: '#fbbf24'
    },
    {
      id: 'habits',
      nombre: 'Hábitos 21/66',
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
    const cx = LT / 2;
    const cy = LT / 2;
    const escala = 1;

    destello.current = { t: 0, cx, cy, e: escala };
    particles.current = [];

    METAS.forEach((m, i) => {
      for (let j = 0; j < 35; j++) {
        const a = azar() * 6.2832;
        const r = RADIOS[i] * escala;
        const v = (120 + azar() * 260) * escala;
        const tang = (azar() - 0.5) * 0.7 * v;
        particles.current.push({
          x: cx + Math.cos(a) * r,
          y: cy + Math.sin(a) * r,
          vx: Math.cos(a) * v - Math.sin(a) * tang,
          vy: Math.sin(a) * v + Math.cos(a) * tang,
          vida: 0,
          dura: 0.9 + azar() * 0.8,
          r: (1.5 + azar() * 2.5) * escala,
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

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const chispasCanvas = chispasRef.current;
    if (!canvas || !chispasCanvas) return;

    const g = canvas.getContext('2d');
    const cg = chispasCanvas.getContext('2d');
    if (!g || !cg) return;

    let raf = 0;
    let lastTime = performance.now();

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const k = L / L;
    const tam = LT * k;

    canvas.width = Math.round(tam * dpr);
    canvas.height = Math.round(tam * dpr);
    canvas.style.width = `${tam}px`;
    canvas.style.height = `${tam}px`;

    chispasCanvas.width = Math.round(tam * dpr);
    chispasCanvas.height = Math.round(tam * dpr);
    chispasCanvas.style.width = `${tam}px`;
    chispasCanvas.style.height = `${tam}px`;

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
      const C = LT / 2;
      g.setTransform(S, 0, 0, S, 0, 0);

      // Draw Rings
      for (let i = 0; i < 3; i++) {
        const r = RADIOS[i];
        const p = limita(springVals.current[i].x, 0, 1.15);
        const meta = METAS[i];

        // Track background
        g.lineWidth = GROSOR;
        g.lineCap = 'butt';
        g.strokeStyle = 'rgba(255, 255, 255, 0.05)';
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
        g.shadowBlur = (14 + gr.x * 12) * S;
        g.lineWidth = GROSOR;
        g.lineCap = 'butt';
        g.strokeStyle = grad;
        g.beginPath();
        g.arc(C, C, r, a0, f >= 0.9995 ? a0 + 6.2832 : a1);
        g.stroke();
        g.restore();

        // Round start cap
        g.fillStyle = meta.c0;
        g.beginPath();
        g.arc(C + r * Math.cos(a0), C + r * Math.sin(a0), GROSOR / 2, 0, 6.2832);
        g.fill();

        // Round head cap
        const hx = C + r * Math.cos(aCab);
        const hy = C + r * Math.sin(aCab);
        g.save();
        if (p > 0.94) {
          g.shadowColor = 'rgba(0, 0, 0, 0.7)';
          g.shadowBlur = 10 * S;
          g.shadowOffsetX = Math.cos(aCab + Math.PI / 2) * 4 * S;
          g.shadowOffsetY = Math.sin(aCab + Math.PI / 2) * 4 * S;
        } else {
          g.shadowColor = meta.base;
          g.shadowBlur = (10 + gr.x * 6) * S;
        }
        g.fillStyle = meta.c1;
        g.beginPath();
        g.arc(hx, hy, GROSOR / 2, 0, 6.2832);
        g.fill();
        g.restore();

        // Specular highlight on head
        g.fillStyle = 'rgba(255, 255, 255, 0.3)';
        g.beginPath();
        g.arc(hx - 2, hy - 3, GROSOR * 0.22, 0, 6.2832);
        g.fill();
      }

      // Render Chispas / Sparks Canvas
      cg.setTransform(1, 0, 0, 1, 0, 0);
      cg.clearRect(0, 0, chispasCanvas.width, chispasCanvas.height);
      cg.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (destello.current) {
        destello.current.t += dt / 0.85;
        if (destello.current.t >= 1) {
          destello.current = null;
        } else {
          const t = destello.current.t;
          const radial = cg.createRadialGradient(C, C, 0, C, C, 90 + t * 240);
          const alpha = Math.pow(1 - t, 2) * 0.55;
          radial.addColorStop(0, `rgba(0, 240, 255, ${alpha})`);
          radial.addColorStop(0.6, `rgba(168, 85, 247, ${alpha * 0.4})`);
          radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
          cg.fillStyle = radial;
          cg.fillRect(0, 0, LT, LT);

          // Expanding shockwave ring
          cg.lineWidth = Math.max(0.5, 3 * (1 - t));
          cg.strokeStyle = `rgba(255, 255, 255, ${0.7 * (1 - t)})`;
          cg.beginPath();
          cg.arc(C, C, 70 + t * 220, 0, 6.2832);
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

        if (p.estrella) {
          const s = p.r * 2.2;
          cg.beginPath();
          cg.arc(p.x, p.y, s, 0, 6.2832);
          cg.fill();
        } else {
          cg.beginPath();
          cg.arc(p.x, p.y, p.r, 0, 6.2832);
          cg.fill();
        }
      }
      cg.globalAlpha = 1;

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [METAS]);

  return (
    <div className="moxen-constancia-root p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#080e1e] to-[#02050e] border border-cyan-500/30 shadow-[0_10px_35px_rgba(0,240,255,0.1)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-40 bg-purple-600/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-widest">
            <Award className="w-4 h-4 text-cyan-400" />
            Consistencia Cuántica
          </div>
          <h3 className="text-base sm:text-lg font-anton uppercase tracking-wide text-white mt-0.5">
            Trío Diario de Alto Rendimiento
          </h3>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-mono text-slate-400">
            Día Seleccionado: <strong className="text-cyan-300">{selectedDay.name}</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 mb-6">
        {/* Canvas Rings */}
        <div className="lg:col-span-6 flex justify-center">
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
                  <span>Meta Diaria</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Goal Detail Cards */}
        <div className="lg:col-span-6 space-y-3">
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
                      {m.nombre}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {m.val} / {m.meta} {m.unit}
                    </span>
                  </div>

                  <div className="w-full h-2 bg-black/60 rounded-full mt-2 overflow-hidden border border-white/10">
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
                  <Check className="w-5 h-5 text-black stroke-[3]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Day Selector with Mini-Rings */}
      <div className="pt-4 border-t border-cyan-500/20 relative z-10 flex flex-col items-center">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3">
          Registro Semanal (Toca un día para inspeccionar sus anillos)
        </span>

        <div className="co-semana">
          {days.map((d, idx) => {
            const isSelected = selectedDayIdx === idx;
            const p1 = Math.min(1, d.focusMinutes / Math.max(1, focusGoal));
            const p2 = Math.min(1, d.tasksDone / Math.max(1, tasksGoal));
            const p3 = Math.min(1, d.habitsDone / Math.max(1, habitsGoal));

            // Circumferences for mini circles
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
                    {/* Ring 1 - Cyan */}
                    <circle cx="17" cy="17" r="13" stroke="#00f0ff" strokeOpacity="0.2" />
                    <circle
                      cx="17"
                      cy="17"
                      r="13"
                      stroke="#00f0ff"
                      strokeDasharray={c1}
                      strokeDashoffset={c1 * (1 - p1)}
                    />

                    {/* Ring 2 - Amber */}
                    <circle cx="17" cy="17" r="9.5" stroke="#f59e0b" strokeOpacity="0.2" />
                    <circle
                      cx="17"
                      cy="17"
                      r="9.5"
                      stroke="#f59e0b"
                      strokeDasharray={c2}
                      strokeDashoffset={c2 * (1 - p2)}
                    />

                    {/* Ring 3 - Purple */}
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
