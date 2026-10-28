import React, { useEffect, useRef, useState, useMemo } from 'react';
import './moxen.css';
import { Dumbbell, Brain, BatteryCharging, ShieldAlert, BookOpen, Sparkles, Info } from 'lucide-react';
import { soundFX } from '../../utils/audio';

export interface AttributeItem {
  subject: string;
  level: number;
  fullMark?: number;
}

interface MoxenTelaranaProps {
  attributes: AttributeItem[];
  characterClass?: string;
  title?: string;
}

const ATTRIBUTE_ICONS: Record<string, React.ReactNode> = {
  Fuerza: <Dumbbell className="w-4 h-4 text-red-400" />,
  Mente: <Brain className="w-4 h-4 text-purple-400" />,
  Energía: <BatteryCharging className="w-4 h-4 text-yellow-400" />,
  Disciplina: <ShieldAlert className="w-4 h-4 text-cyan-400" />,
  Estudio: <BookOpen className="w-4 h-4 text-emerald-400" />
};

const ATTRIBUTE_GRADIENTS: Record<string, { start: string; end: string; desc: string }> = {
  Disciplina: { start: '#06b6d4', end: '#3b82f6', desc: 'Rutinas, hábitos y perseverancia' },
  Fuerza: { start: '#ef4444', end: '#f97316', desc: 'Entrenamiento físico y resistencia' },
  Mente: { start: '#a855f7', end: '#d946ef', desc: 'Foco profundo, creatividad y trabajo' },
  Energía: { start: '#eab308', end: '#f59e0b', desc: 'Descanso, nutrición y recuperación' },
  Estudio: { start: '#10b981', end: '#14b8a6', desc: 'Lectura, aprendizaje y expansión' }
};

export const MoxenTelarana: React.FC<MoxenTelaranaProps> = ({
  attributes,
  characterClass = 'Héroe del Sistema',
  title = 'Matriz de Poder Pentagonal'
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const formaRef = useRef<SVGPolygonElement | null>(null);
  const mediaRef = useRef<SVGPathElement | null>(null);
  const globoRef = useRef<HTMLDivElement | null>(null);

  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const [activePreset, setActivePreset] = useState<'actual' | 'balance' | 'elite'>('actual');

  // Expanded ViewBox dimensions: 500x500 to guarantee NO label clipping on mobile
  const C = 250;
  const R = 135;
  const n = attributes.length || 5;

  const maxAttrValue = useMemo(() => {
    const highest = Math.max(...attributes.map(a => a.level), 10);
    return Math.max(10, Math.ceil(highest / 10) * 10);
  }, [attributes]);

  const TOPE = maxAttrValue;

  const ang = (i: number) => -Math.PI / 2 + (i * Math.PI * 2) / n;
  const punto = (i: number, v: number): [number, number] => [
    C + Math.cos(ang(i)) * R * (v / TOPE),
    C + Math.sin(ang(i)) * R * (v / TOPE)
  ];

  // Presets definition
  const currentValues = useMemo(() => attributes.map(a => a.level), [attributes]);
  const averageValue = useMemo(() => {
    if (attributes.length === 0) return 0;
    return Math.round((currentValues.reduce((a, b) => a + b, 0) / attributes.length) * 10) / 10;
  }, [attributes, currentValues]);

  const presetValues = useMemo(() => {
    if (activePreset === 'balance') {
      return attributes.map(() => averageValue);
    }
    if (activePreset === 'elite') {
      return attributes.map(a => Math.min(TOPE, Math.round(Math.max(a.level * 1.3, TOPE * 0.75))));
    }
    return currentValues;
  }, [activePreset, attributes, averageValue, currentValues, TOPE]);

  // Animated vertex spring simulation
  const verticesRef = useRef<{ v: number; vel: number; meta: number; espera: number }[]>([]);

  useEffect(() => {
    verticesRef.current = attributes.map((_, i) => ({
      v: verticesRef.current[i]?.v ?? 0,
      vel: 0,
      meta: presetValues[i] || 0,
      espera: i * 0.05
    }));
  }, [attributes, presetValues]);

  useEffect(() => {
    let raf = 0;
    let previo = 0;

    const paso = (t: number) => {
      const dt = previo ? Math.min(0.04, (t - previo) / 1000) : 0;
      previo = t;

      if (!dt) {
        raf = requestAnimationFrame(paso);
        return;
      }

      let sigue = false;
      const vertices = verticesRef.current;

      vertices.forEach((v) => {
        if (v.espera > 0) {
          v.espera -= dt;
          sigue = true;
          return;
        }
        for (let h = dt; h > 0; ) {
          const s = Math.min(h, 1 / 240);
          v.vel += (-150 * (v.v - v.meta) - 13.5 * v.vel) * s;
          v.v += v.vel * s;
          h -= s;
        }
        if (Math.abs(v.v - v.meta) > 0.002 || Math.abs(v.vel) > 0.01) sigue = true;
      });

      const pts = vertices.map((v, i) => punto(i, Math.max(0, v.v)));

      if (formaRef.current) {
        formaRef.current.setAttribute(
          'points',
          pts.map(p => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')
        );
      }

      // Update interactive point dots
      if (svgRef.current) {
        const circles = svgRef.current.querySelectorAll('.tl-punto');
        circles.forEach((c, idx) => {
          if (pts[idx]) {
            c.setAttribute('cx', pts[idx][0].toFixed(2));
            c.setAttribute('cy', pts[idx][1].toFixed(2));
          }
        });
        const hitboxes = svgRef.current.querySelectorAll('.tl-blanco');
        hitboxes.forEach((hb, idx) => {
          if (pts[idx]) {
            hb.setAttribute('cx', pts[idx][0].toFixed(2));
            hb.setAttribute('cy', pts[idx][1].toFixed(2));
          }
        });
      }

      // Update floating globe position if active
      if (activeIdx >= 0 && pts[activeIdx] && globoRef.current && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const scale = rect.width / 500;
        globoRef.current.style.left = `${pts[activeIdx][0] * scale}px`;
        globoRef.current.style.top = `${pts[activeIdx][1] * scale}px`;
      }

      if (sigue) {
        raf = requestAnimationFrame(paso);
      }
    };

    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [activeIdx, presetValues, TOPE, n]);

  return (
    <div className="moxen-telarana-root p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#080e1e] to-[#02050e] border border-cyan-500/30 shadow-[0_10px_35px_rgba(0,240,255,0.1)] relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 relative z-10">
        <div>
          <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            {characterClass}
          </div>
          <h3 className="text-sm sm:text-base font-anton uppercase tracking-wide text-white mt-0.5">
            {title}
          </h3>
        </div>

        {/* Preset switcher buttons */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/60 border border-cyan-500/30 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setActivePreset('actual');
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
              activePreset === 'actual'
                ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,240,255,0.6)] font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Actual
          </button>
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setActivePreset('balance');
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
              activePreset === 'balance'
                ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.6)] font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Media ({averageValue})
          </button>
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setActivePreset('elite');
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
              activePreset === 'elite'
                ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.6)] font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Élite
          </button>
        </div>
      </div>

      {/* Guide explanation box */}
      <div className="p-2 sm:p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[10px] sm:text-[11px] text-slate-300 font-mono mb-3.5 flex items-start sm:items-center gap-2 relative z-10">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 sm:mt-0" />
        <span className="leading-tight">
          <strong>¿Cómo interpretarlo?</strong> Tu forma <strong className="text-cyan-300">cian</strong> refleja tu nivel actual. La línea punteada <strong className="text-purple-300">morada</strong> marca el equilibrio medio. Toca cualquier atributo para ver su desglose.
        </span>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5 items-center relative z-10">
        {/* Radar SVG Diagram (Fully centered with breathing room) */}
        <div className="w-full lg:col-span-6 flex justify-center py-2">
          <div className="tl-grafico">
            <svg
              ref={svgRef}
              viewBox="0 0 500 500"
              className="tl-svg"
              onPointerLeave={() => setActiveIdx(-1)}
            >
              {/* Concentric Web Rings (5 levels) */}
              <g className="tl-red">
                {[1, 2, 3, 4, 5].map((k) => (
                  <polygon
                    key={`ring-${k}`}
                    points={attributes
                      .map((_, i) => punto(i, (TOPE * k) / 5).map(x => x.toFixed(2)).join(','))
                      .join(' ')}
                  />
                ))}

                {/* Axis Radial Lines */}
                {attributes.map((_, i) => {
                  const [x, y] = punto(i, TOPE);
                  return (
                    <line
                      key={`rad-${i}`}
                      x1={C}
                      y1={C}
                      x2={x.toFixed(2)}
                      y2={y.toFixed(2)}
                      className={activeIdx === i ? 'is-activo' : ''}
                    />
                  );
                })}
              </g>

              {/* Reference Average Contour (dashed) */}
              <path
                ref={mediaRef}
                className="tl-media"
                d={`M${attributes.map((_, i) => punto(i, averageValue).map(x => x.toFixed(2)).join(' ')).join('L')}Z`}
              />

              {/* Dynamic Animated Polygon (Spring) */}
              <polygon ref={formaRef} className="tl-forma" />

              {/* Vertices and Hitboxes */}
              <g className="tl-puntos">
                {attributes.map((_, i) => (
                  <g key={`vert-${i}`}>
                    <circle
                      className="tl-punto"
                      r={activeIdx === i ? 7 : 4.5}
                      style={{
                        stroke: activeIdx === i ? '#ffffff' : '#030712'
                      }}
                    />
                    <circle
                      className="tl-blanco"
                      r={24}
                      onPointerEnter={() => {
                        soundFX.playClick();
                        setActiveIdx(i);
                      }}
                      onPointerLeave={() => setActiveIdx(-1)}
                    />
                  </g>
                ))}
              </g>

              {/* Axis Label Texts (Safely positioned with 70px outer padding) */}
              <g className="tl-rotulos">
                {attributes.map((attr, i) => {
                  const [x, y] = punto(i, TOPE * 1.22);
                  const c = Math.cos(ang(i));
                  const anchor = Math.abs(c) < 0.2 ? 'middle' : c > 0 ? 'start' : 'end';
                  return (
                    <text
                      key={`txt-${attr.subject}`}
                      x={x.toFixed(2)}
                      y={(y + 4).toFixed(2)}
                      textAnchor={anchor}
                      className={activeIdx === i ? 'is-activo' : ''}
                      onPointerEnter={() => setActiveIdx(i)}
                      onPointerLeave={() => setActiveIdx(-1)}
                    >
                      {attr.subject}
                    </text>
                  );
                })}
              </g>
            </svg>

            {/* Floating Glassmorphism Tooltip */}
            <div
              ref={globoRef}
              className={`tl-globo ${activeIdx >= 0 ? 'is-visible' : ''}`}
            >
              {activeIdx >= 0 && attributes[activeIdx] && (
                <>
                  <b>Nv.{presetValues[activeIdx]}</b>
                  <span> {attributes[activeIdx].subject} (Media: {averageValue})</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Synced Breakdown Bars & Interactive Legend (Mobile-optimised) */}
        <div className="w-full lg:col-span-6 flex flex-col justify-center space-y-1.5">
          <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-cyan-500/20 text-[10px] font-mono font-bold text-slate-400 uppercase">
            <span>Atributo & Significado</span>
            <span>Nivel</span>
          </div>

          <ul className="tl-ejes">
            {attributes.map((attr, idx) => {
              const conf = ATTRIBUTE_GRADIENTS[attr.subject] || { start: '#00f0ff', end: '#3b82f6', desc: '' };
              const icon = ATTRIBUTE_ICONS[attr.subject] || <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
              const ratio = Math.min(100, Math.round((presetValues[idx] / TOPE) * 100));
              const avgRatio = Math.min(100, Math.round((averageValue / TOPE) * 100));
              const isActive = activeIdx === idx;

              return (
                <li key={attr.subject}>
                  <button
                    type="button"
                    className={`tl-eje ${isActive ? 'is-activo' : ''}`}
                    onClick={() => {
                      soundFX.playClick();
                      setActiveIdx(activeIdx === idx ? -1 : idx);
                    }}
                    onPointerEnter={() => {
                      soundFX.playClick();
                      setActiveIdx(idx);
                    }}
                    onPointerLeave={() => setActiveIdx(-1)}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {icon}
                      <span className={isActive ? 'text-white' : ''}>{attr.subject}</span>
                    </span>

                    <span className="tl-barra">
                      <i
                        style={{
                          transform: `scaleX(${ratio / 100})`,
                          background: `linear-gradient(90deg, ${conf.start}, ${conf.end})`
                        }}
                      />
                      <b style={{ left: `${avgRatio}%` }} title={`Media: ${averageValue}`} />
                    </span>

                    <span style={{ color: conf.start }}>
                      Nv.{presetValues[idx]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between pt-2 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]" />
              Tu Matriz Activa
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-purple-400" />
              Línea de Equilibrio ({averageValue})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoxenTelarana;
