import React from 'react';
import { 
  Landmark, 
  Camera, 
  Trash2, 
  Volume2, 
  Link, 
  Plus, 
  Flame, 
  Loader2, 
  Share2, 
  Check 
} from 'lucide-react';
import { KAICompanion } from '../KAICompanion';
import { useNarrativeCopy } from '../../hooks/useNarrativeCopy';
import { useUIStore } from '../../store/useUIStore';
import { KaiCustomForm, KaiShapeKey, KaiTemperament } from '../../types';

interface WorkshopVaultTabProps {
  vaultItems: KaiCustomForm[];
  currentShape: KaiShapeKey;
  customForm: KaiCustomForm | null | undefined;
  habitList: { id: string; title: string; streak: number }[];
  speakingRelicId: string | null;
  isSharingCard: string | null;
  onOpenForge: () => void;
  onRequestDeleteRelic: (relic: { id: string; name: string }) => void;
  onSpeakQuote: (quote: string, mood?: KaiTemperament, id?: string) => void;
  onLinkHabitToRelic: (relicId: string, habitId: string, habitTitle: string) => void;
  onShareTradingCard: (targetKai: KaiCustomForm, id?: string) => void;
  onEquipCustomForm: (relic: KaiCustomForm) => void;
  onClose: () => void;
}

export const WorkshopVaultTab: React.FC<WorkshopVaultTabProps> = ({
  vaultItems,
  currentShape,
  customForm,
  habitList,
  speakingRelicId,
  isSharingCard,
  onOpenForge,
  onRequestDeleteRelic,
  onSpeakQuote,
  onLinkHabitToRelic,
  onShareTradingCard,
  onEquipCustomForm,
  onClose,
}) => {
  const copy = useNarrativeCopy();

  return (
    <div className="space-y-5">
      {/* Cabecera del Museo */}
      <div className="p-4 rounded-2xl bg-[#040a1a]/[0.94] border border-emerald-500/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>{copy.workshopVaultTitle}</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {vaultItems.length}{' '}
                {vaultItems.length === 1 ? 'Reliquia' : 'Reliquias'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Tus compañeros creados. Vincula un KAI a cualquier hábito para protegerlo.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenForge}
          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 hover:text-black border border-emerald-400 text-emerald-200 text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Forjar Nuevo</span>
        </button>
      </div>

      {/* Si no hay reliquias aún */}
      {vaultItems.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] space-y-3 max-w-md mx-auto">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Landmark className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">Tu galería está vacía</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Crea tu primer asistente personalizado para vincularlo a tus hábitos diarios.
          </p>
          <button
            type="button"
            onClick={onOpenForge}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            {copy.workshopVaultEmptyCta}
          </button>
        </div>
      ) : (
        /* Grid de Reliquias */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vaultItems.map((relic, idx) => {
            const relicId = relic.id || `relic_${idx}`;
            const isEquipped =
              currentShape === 'custom' &&
              (customForm?.id === relicId || customForm?.name === relic.name);
            const linkedHabit = habitList.find(
              (h) => h.id === relic.habitIdLinked || h.title === relic.habitTitleLinked
            );

            return (
              <div
                key={relicId}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between group relative overflow-hidden ${
                  isEquipped
                    ? 'bg-[#040a1a]/[0.96] border-emerald-400/80 shadow-[0_0_25px_rgba(16,185,129,0.22),inset_0_1px_0_rgba(255,255,255,0.1)] optic-active-card'
                    : 'bg-[#040814]/80 border-white/10 hover:border-emerald-500/30 hover:bg-white/[0.04]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-16 h-16 shrink-0 relative flex items-center justify-center bg-black/70 rounded-2xl border border-white/10 p-1.5 overflow-hidden shadow-inner">
                      <KAICompanion
                        customForm={relic}
                        shapeId="custom"
                        size={60}
                        interactive={false}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-sm font-anton tracking-wide text-white truncate">
                          {relic.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() =>
                            onRequestDeleteRelic({ id: relicId, name: relic.name })
                          }
                          title="Retirar de la Bóveda"
                          aria-label={`Retirar ${relic.name} de la Bóveda`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 block truncate mt-0.5">
                        🎯 {relic.detectedObject || 'Objeto Forjado'}
                      </span>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-lg text-[9px] font-mono bg-white/5 border border-white/10 text-slate-300 uppercase">
                        {relic.artStyle || 'Multiverso'}
                      </span>
                    </div>
                  </div>

                  {/* Frase de Personalidad con Botón de Voz */}
                  {relic.personalityQuote && (
                    <div className="flex items-center gap-1.5 mb-3 bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/5">
                      <p className="text-[10px] text-slate-300 italic line-clamp-2 flex-1">
                        "{relic.personalityQuote}"
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          onSpeakQuote(relic.personalityQuote || '', relic.mood, relicId)
                        }
                        className="p-1 rounded-lg text-cyan-400 hover:text-white hover:bg-cyan-950/60 transition-colors shrink-0 cursor-pointer"
                        title="Escuchar voz de KAI"
                      >
                        <Volume2
                          className={`w-3.5 h-3.5 ${
                            speakingRelicId === relicId
                              ? 'animate-bounce text-cyan-300'
                              : ''
                          }`}
                        />
                      </button>
                    </div>
                  )}

                  {/* Selector de Hábito Custodiado */}
                  <div className="space-y-1 mb-3 pt-2.5 border-t border-white/5">
                    <label className="text-[9px] font-mono uppercase text-slate-400 flex items-center gap-1 font-bold">
                      <Link className="w-3 h-3 text-cyan-400" />
                      <span>Hábito que Custodia:</span>
                    </label>

                    {habitList.length > 0 ? (
                      <select
                        value={relic.habitIdLinked || ''}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const matched = habitList.find((h) => h.id === selectedId);
                          onLinkHabitToRelic(relicId, selectedId, matched?.title || '');
                        }}
                        aria-label={`Hábito vinculado a ${relic.name}`}
                        className="w-full bg-[#030712] border border-white/15 text-white rounded-xl px-2.5 py-1.5 text-[10px] font-mono focus:border-emerald-400 focus:outline-none cursor-pointer"
                      >
                        <option value="">(Sin vincular a hábito)</option>
                        {habitList.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.title} ({h.streak || 0}d racha)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="space-y-1.5 pt-0.5">
                        <span className="text-[10px] text-slate-400 font-mono block">
                          No tienes hábitos activos en tu rutina.
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            useUIStore.getState().openTaskForm('habit');
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500 hover:text-black font-anton text-[10px] uppercase tracking-wider transition-all w-fit cursor-pointer"
                        >
                          <Plus className="w-3 h-3 stroke-[3]" />
                          <span>Crear Hábito Kaizen</span>
                        </button>
                      </div>
                    )}

                    {linkedHabit && (
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 mt-1.5">
                        <Flame className="w-3 h-3 text-amber-400" />
                        <span>Racha protegida: {linkedHabit.streak || 0} días</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botón de Equipar & Ficha Coleccionable */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onShareTradingCard(relic, relicId)}
                    disabled={isSharingCard === relicId}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-200 hover:text-white font-anton text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Generar y compartir Carta Holográfica Coleccionable"
                  >
                    {isSharingCard === relicId ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5 text-purple-400" />
                    )}
                    <span>Ficha</span>
                  </button>

                  {isEquipped ? (
                    <span className="text-xs font-anton tracking-wider uppercase text-emerald-300 bg-emerald-950/80 border border-emerald-400/60 px-3.5 py-1.5 rounded-xl shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      Activo
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onEquipCustomForm(relic)}
                      className="chicle-btn px-4 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 hover:bg-emerald-400 hover:text-black font-anton text-xs uppercase tracking-wider text-emerald-200 transition-all cursor-pointer active:scale-95"
                    >
                      Equipar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
