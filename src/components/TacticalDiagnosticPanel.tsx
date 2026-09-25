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
    if (harmonyScore >= 90) return 'Sincronía Óptima (Sin Conflictos)';
    if (harmonyScore >= 65) return 'Sincronía Regular (Ajustes Recomendados)';
    return 'Alerta Crítica (Colisión de Tareas)';
  };

  return (
    <div className="bg-[#040913] border border-cyan-900/60 rounded-xl p-3.5 space-y-3 shadow-lg">
      {/* Header bar: Score & Hours */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-950 pb-2.5">
        <div className="flex items-center gap-2">
          <div className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 ${getScoreColor()}`}>
            <ShieldCheck className="w-4 h-4" />
            <span>Sincronía: {harmonyScore}%</span>
          </div>
          <span className="text-xs text-slate-300 font-mono hidden sm:inline">
            {getScoreLabel()}
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Total planificado: <strong className="text-cyan-300 font-bold">{totalScheduledHours}h</strong></span>
        </div>
      </div>

      {/* No issues state */}
      {conflicts.length === 0 && gaps.length === 0 && (
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-300/90 py-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Línea temporal despejada. Todos los bloques se suceden sin solapamientos ni huecos excesivos.</span>
        </div>
      )}

      {/* Conflicts section */}
      {conflicts.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-rose-300 font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Colisiones Detectadas ({conflicts.length}) — Solución en 1 Clic</span>
          </div>

          <div className="space-y-2">
            {conflicts.map((conflict, idx) => (
              <div 
                key={`${conflict.idA}-${conflict.idB}-${idx}`}
                className="bg-rose-950/30 border border-rose-500/30 rounded-lg p-2.5 space-y-2"
              >
                <div className="text-xs text-slate-200 leading-snug">
                  <span className="font-bold text-rose-300 font-mono">{conflict.timeA}</span>: Solapamiento entre{' '}
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
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95"
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
          <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ventanas de Tiempo Libre ({gaps.length})</span>
          </div>

          <div className="space-y-2">
            {gaps.slice(0, 3).map((gap) => (
              <div
                key={gap.id}
                className="bg-cyan-950/30 border border-cyan-500/20 rounded-lg p-2.5 space-y-2"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-cyan-200 font-mono font-bold">
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
                    className="px-2 py-1 bg-cyan-900/40 hover:bg-cyan-800/60 border border-cyan-500/30 text-cyan-200 rounded text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Coffee className="w-3 h-3 text-cyan-300" />
                    <span>Almuerzo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      onFillGap(gap, 'Sesión de Lectura / Estudio', 'intelecto', '📚');
                    }}
                    className="px-2 py-1 bg-cyan-900/40 hover:bg-cyan-800/60 border border-cyan-500/30 text-cyan-200 rounded text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <BookOpen className="w-3 h-3 text-cyan-300" />
                    <span>Estudio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      onFillGap(gap, 'Pausa Activa / Caminata', 'entrenamiento', '🚶');
                    }}
                    className="px-2 py-1 bg-cyan-900/40 hover:bg-cyan-800/60 border border-cyan-500/30 text-cyan-200 rounded text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Layers className="w-3 h-3 text-cyan-300" />
                    <span>Pausa Activa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick();
                      setActiveGapCustomId(activeGapCustomId === gap.id ? null : gap.id);
                      setCustomTitle('');
                    }}
                    className="px-2 py-1 bg-cyan-600/30 hover:bg-cyan-500/40 border border-cyan-400/40 text-cyan-200 rounded text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors font-bold ml-auto"
                  >
                    <span>✏️ Personalizar...</span>
                  </button>
                </div>

                {activeGapCustomId === gap.id && (
                  <div className="mt-2 pt-2 border-t border-cyan-900/50 space-y-2 bg-black/40 p-2.5 rounded-lg">
                    <div className="text-[11px] font-mono text-cyan-300 font-bold">Añadir actividad personalizada para {gap.startTime} - {gap.endTime}</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ej. Revisar correos urgentes..."
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        className="flex-1 bg-black border border-cyan-800 rounded px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                        autoFocus
                      />
                      <select
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value as any)}
                        className="bg-black border border-cyan-800 rounded px-2 py-1 text-xs text-cyan-200 font-mono focus:outline-none focus:border-cyan-500"
                      >
                        <option value="rutina">⚡ Rutina</option>
                        <option value="trabajo">💼 Trabajo</option>
                        <option value="estudio">📚 Estudio</option>
                        <option value="comida">🥗 Comida</option>
                        <option value="entrenamiento">🏋️ Entrenamiento</option>
                        <option value="limpieza">🧹 Limpieza</option>
                        <option value="creativo">🎨 Creativo</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveGapCustomId(null)}
                        className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-white font-mono cursor-pointer"
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
                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded text-[11px] font-mono font-bold cursor-pointer transition-all shadow"
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
  );
};
