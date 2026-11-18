import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, Clock, ArrowRight, Zap, Coffee, BookOpen, Layers } from 'lucide-react';
import { ScheduleDiagnostic, ScheduleConflict, ScheduleGap } from '../utils/timeUtils';
import { soundFX } from '../utils/audio';

interface TacticalDiagnosticPanelProps {
  diagnostic: ScheduleDiagnostic;
  onQuickFixConflict: (conflict: ScheduleConflict) => void;
  onFillGap: (gap: ScheduleGap, title: string, category: string, icon: string) => void;
}

export const TacticalDiagnosticPanel: React.FC<TacticalDiagnosticPanelProps> = ({
  diagnostic,
  onQuickFixConflict,
  onFillGap
}) => {
  const { conflicts, gaps, harmonyScore, totalScheduledHours } = diagnostic;
  const [activeGapCustomId, setActiveGapCustomId] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState<'rutina' | 'trabajo' | 'estudio' | 'comida' | 'entrenamiento' | 'limpieza' | 'creativo'>('rutina');

  const getScoreColor = () => {
    if (harmonyScore >= 90) return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40';
    if (harmonyScore >= 65) return 'text-amber-400 border-amber-500/40 bg-amber-950/40';
    return 'text-rose-400 border-rose-500/40 bg-rose-950/40';
  };

  const getScoreLabel = () => {
    if (harmonyScore >= 90) return 'Horario ordenado (sin choques)';
    if (harmonyScore >= 65) return 'Casi listo (requiere pequeños ajustes)';
    return 'Hay tareas que chocan a la misma hora';
  };

  return (
    <div className="relative isolate bg-[#040a1a]/[0.94] border border-white/10 rounded-2xl p-4 space-y-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden">
      <span className="vi-grano opacity-5" aria-hidden="true" />
      <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

      <div className="relative z-10 space-y-3.5">
        {/* Header bar: Score & Hours */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`px-2.5 py-1 rounded-xl border text-xs font-mono tabular-nums font-bold flex items-center gap-1.5 ${getScoreColor()}`}>
              <ShieldCheck className="w-4 h-4" />
              <span>Orden: {harmonyScore}%</span>
            </div>
            <span className="text-xs text-slate-300 font-sans hidden sm:inline">
              {getScoreLabel()}
            </span>
          </div>

          <div className="text-[11px] font-mono tabular-nums text-slate-400 flex items-center gap-1.5 bg-[#040814]/80 px-2.5 py-1 rounded-xl border border-white/10">
            <Clock className="w-3.5 h-3.5 aura-text-primary" />
            <span>Horas planificadas: <strong className="aura-text-soft font-bold">{totalScheduledHours}h</strong></span>
          </div>
        </div>

        {/* No issues state */}
        {conflicts.length === 0 && gaps.length === 0 && (
          <div className="flex items-center gap-2 text-xs font-sans text-emerald-300/90 py-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Todo en orden: ninguna tarea choca con otra en tus horarios.</span>
          </div>
        )}

        {/* Conflicts section */}
        {conflicts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-anton uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Horarios que chocan ({conflicts.length}) — Resolver en 1 clic</span>
            </h4>

            <div className="space-y-2">
              {conflicts.map((conflict, idx) => (
                <div
                  key={`${conflict.idA}-${conflict.idB}-${idx}`}
                  className="bg-rose-950/25 border border-rose-500/30 rounded-xl p-3 space-y-2"
                >
                  <div className="text-xs text-slate-200 leading-snug">
                    <span className="font-bold text-rose-300 font-mono tabular-nums">{conflict.timeA}</span>: Solapamiento entre{' '}
                    <strong className="text-white">"{conflict.titleA}"</strong> y{' '}
                    <strong className="text-white">"{conflict.titleB}"</strong>.
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        onQuickFixConflict(conflict);
                      }}
                      className="chicle-btn optic-active-card px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-anton uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow transition-all"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {conflict.suggestedAction === 'separate_days' ? (
                        <span>Separar días (Excluir coincidencia)</span>
                      ) : (
                        <span>Desplazar "{conflict.titleB.slice(0, 18)}..." a {conflict.suggestedNewTimeForB}</span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gaps section */}
        {gaps.length > 0 && (
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-anton uppercase tracking-wider aura-text-soft flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 aura-text-primary" />
              <span>Espacios libres disponibles ({gaps.length})</span>
            </h4>

            <div className="space-y-2">
              {gaps.slice(0, 3).map((gap) => (
                <div
                  key={gap.id}
                  className="bg-[#040814]/80 border border-white/10 rounded-xl p-3 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="aura-text-soft font-mono tabular-nums font-bold">
                      {gap.startTime} - {gap.endTime} ({gap.durationMinutes} min libres)
                    </span>
                    <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                      Entre {gap.afterTitle} y {gap.beforeTitle}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase mr-1">Rellenar:</span>

                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        onFillGap(gap, 'Almuerzo & Recarga Energética', 'comida', '🥗');
                      }}
                      className="chicle-btn px-2.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:aura-border-subtle text-slate-200 hover:text-white rounded-xl text-[11px] font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Coffee className="w-3.5 h-3.5 aura-text-primary" />
                      <span>Almuerzo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        onFillGap(gap, 'Sesión de Lectura / Estudio', 'intelecto', '📚');
                      }}
                      className="chicle-btn px-2.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:aura-border-subtle text-slate-200 hover:text-white rounded-xl text-[11px] font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5 aura-text-primary" />
                      <span>Estudio</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        onFillGap(gap, 'Pausa Activa / Caminata', 'entrenamiento', '🚶');
                      }}
                      className="chicle-btn px-2.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:aura-border-subtle text-slate-200 hover:text-white rounded-xl text-[11px] font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5 aura-text-primary" />
                      <span>Pausa Activa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playClick();
                        setActiveGapCustomId(activeGapCustomId === gap.id ? null : gap.id);
                        setCustomTitle('');
                      }}
                      className={`chicle-btn px-2.5 py-1.5 border rounded-xl text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors font-bold ml-auto ${
                        activeGapCustomId === gap.id
                          ? 'aura-bg-soft aura-border-primary aura-text-primary optic-active-card'
                          : 'aura-bg-soft aura-border-subtle aura-text-soft hover:text-white'
                      }`}
                    >
                      <span>✏️ Personalizar...</span>
                    </button>
                  </div>

                  {activeGapCustomId === gap.id && (
                    <div className="mt-2 pt-2.5 border-t border-white/10 space-y-2.5 bg-black/40 p-3 rounded-xl">
                      <div className="text-[11px] font-mono tabular-nums aura-text-soft font-bold">
                        Añadir actividad personalizada para {gap.startTime} - {gap.endTime}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="Ej. Revisar correos urgentes..."
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          className="flex-1 bg-[#030712]/90 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                          autoFocus
                        />
                        <select
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value as any)}
                          className="bg-[#030712]/90 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
                        >
                          <option value="rutina" className="bg-[#030712] text-white">⚡ Rutina</option>
                          <option value="trabajo" className="bg-[#030712] text-white">💼 Trabajo</option>
                          <option value="estudio" className="bg-[#030712] text-white">📚 Estudio</option>
                          <option value="comida" className="bg-[#030712] text-white">🥗 Comida</option>
                          <option value="entrenamiento" className="bg-[#030712] text-white">🏋️ Entrenamiento</option>
                          <option value="limpieza" className="bg-[#030712] text-white">🧹 Limpieza</option>
                          <option value="creativo" className="bg-[#030712] text-white">🎨 Creativo</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveGapCustomId(null)}
                          className="chicle-btn px-3 py-1.5 text-[11px] bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white rounded-xl font-mono cursor-pointer transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!customTitle.trim()) return;
                            soundFX.playClick();
                            const iconsMap: Record<string, string> = {
                              rutina: '⚡',
                              trabajo: '💼',
                              estudio: '📚',
                              comida: '🥗',
                              entrenamiento: '🏋️',
                              limpieza: '🧹',
                              creativo: '🎨'
                            };
                            onFillGap(gap, customTitle.trim(), customCategory, iconsMap[customCategory] || '⚡');
                            setActiveGapCustomId(null);
                            setCustomTitle('');
                          }}
                          disabled={!customTitle.trim()}
                          className="chicle-btn aura-btn-gradient optic-active-card px-3.5 py-1.5 disabled:opacity-50 rounded-xl text-[11px] font-anton uppercase tracking-wider cursor-pointer transition-all"
                        >
                          Añadir al Bloque
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
