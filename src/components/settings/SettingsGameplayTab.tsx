import React from 'react';
import { 
  Type, 
  Sparkles, 
  Activity, 
  ShieldAlert, 
  Palette, 
  RefreshCw, 
  FlaskConical, 
  Cpu 
} from 'lucide-react';
import { GameSettings } from '../../types';
import { useUIStore } from '../../store/useUIStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useNarrativeCopy } from '../../hooks/useNarrativeCopy';
import { useSystemPalette } from '../../utils/systemPalette';
import { KAI_VOICE_TONE_CONFIG, KaiVoiceTone } from '../../data/kaiVoiceMatrix';
import { KAI_OFFICIAL_SHAPES } from '../../data/kaiShapes';
import { KaiVectorGraphics } from '../KaiVectorGraphics';
import { ChicleToggle } from '../ChicleToggle';
import { soundFX } from '../../utils/audio';
import { notificationService } from '../../utils/notifications';
import { NARRATIVE_MODE_OPTIONS } from '../../data/narrativeCopy';

interface SettingsGameplayTabProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onOpenKaiWorkshop?: () => void;
  onOpenOnboarding?: () => void;
  onOpenOracle: () => void;
  onOpenSimulator: () => void;
}

export const SettingsGameplayTab: React.FC<SettingsGameplayTabProps> = ({
  settings,
  onUpdateSettings,
  onOpenKaiWorkshop,
  onOpenOnboarding,
  onOpenOracle,
  onOpenSimulator,
}) => {
  const { narrativeMode, setNarrativeMode } = useUIStore();
  const stats = usePlayerStore((s) => s.stats);
  const copy = useNarrativeCopy();
  const palette = useSystemPalette();

  const toggleSetting = (key: keyof GameSettings) => {
    soundFX.playClick();
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* SELECTOR DE DENSIDAD NARRATIVA */}
      <div className="w-full relative isolate rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] p-5 sm:p-6 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden space-y-4">
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 relative z-10">
          <div>
            <div className="flex items-center gap-2 aura-text-primary text-xs font-mono font-bold uppercase tracking-widest mb-1">
              <Type className="w-4 h-4 aura-text-primary" /> Lenguaje y Claridad de Interfaz
            </div>
            <h3 className="text-sm sm:text-base font-anton uppercase tracking-wide text-white">
              Selector de Densidad Narrativa
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold aura-bg-soft border aura-border-subtle px-2.5 py-0.5 rounded-full self-start sm:self-auto">
            Activo: {NARRATIVE_MODE_OPTIONS[narrativeMode].shortLabel}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed relative z-10">
          Elige si prefieres una narrativa inmersiva tipo juego o un lenguaje directo enfocado al 100% en hábitos, estudio y enfoque sin jerga de ficción.
        </p>

        <div
          role="radiogroup"
          aria-label="Selector de Densidad Narrativa"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10"
        >
          {(['tactical', 'minimal'] as const).map((modeKey) => {
            const opt = NARRATIVE_MODE_OPTIONS[modeKey];
            const isSelected = narrativeMode === modeKey;
            return (
              <button
                key={modeKey}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  soundFX.playClick();
                  setNarrativeMode(modeKey);
                }}
                className={`chicle-btn p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'aura-bg-soft aura-border-primary aura-glow-subtle ring-1 optic-active-card'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.06]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-anton tracking-wider uppercase text-white font-bold">
                      {opt.label}
                    </span>
                    <span
                      className={`text-[9.5px] font-mono px-2 py-0.5 rounded-full border shrink-0 font-bold ${
                        isSelected
                          ? 'aura-bg-primary aura-border-primary'
                          : 'bg-white/[0.05] text-slate-400 border-white/10'
                      }`}
                    >
                      {isSelected ? 'Activo' : opt.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {opt.description}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-white/[0.08] flex flex-wrap gap-1.5">
                  {opt.examples.map((ex) => (
                    <span
                      key={ex}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[#040814]/80 border border-white/10 aura-text-soft"
                    >
                      {ex}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* GUÍA DE BIENVENIDA & INDUCCIÓN DE KAI */}
      <div className="w-full relative isolate rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] p-5 sm:p-6 border aura-border-subtle shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden space-y-3">
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 aura-text-primary text-xs font-mono font-bold uppercase tracking-widest">
              <Sparkles className="w-4 h-4 aura-text-primary" /> Inducción y Bienvenida
            </div>
            <h3 className="text-sm sm:text-base font-anton uppercase tracking-wide text-white">
              Guía de Bienvenida KAI
            </h3>
            <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
              Recalibra tu nombre, tu ritmo de jornada (24h), tu arquetipo de energía y tu propósito principal en cualquier momento sin perder tu nivel ni progreso.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              if (onOpenOnboarding) {
                onOpenOnboarding();
              } else {
                window.dispatchEvent(new CustomEvent('lasolucion:open-onboarding'));
              }
            }}
            className="chicle-btn aura-btn-gradient optic-active-card px-4 py-2.5 rounded-xl font-anton text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shrink-0 self-start sm:self-auto font-bold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Abrir Guía KAI</span>
          </button>
        </div>
      </div>

      {/* PERSONALIDAD & VOZ DE KAI */}
      <div className="w-full relative isolate rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] p-5 sm:p-6 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden space-y-4">
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

        <div className="flex items-center justify-between relative z-10">
          <h3 className="text-xs font-anton aura-text-primary uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 aura-text-primary" /> Personalidad de KAI (Copiloto)
          </h3>
          <span className="text-[11px] font-mono text-slate-400">8-12 palabras por aviso</span>
        </div>

        <p className="text-xs text-slate-300 relative z-10">
          Elige cómo se comunica KAI contigo. Mensajes breves, directos y adaptados a tu estilo de crecimiento personal.
        </p>

        {/* Selector de Tonos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 relative z-10">
          {(Object.entries(KAI_VOICE_TONE_CONFIG) as [KaiVoiceTone, typeof KAI_VOICE_TONE_CONFIG[KaiVoiceTone]][]).map(
            ([toneKey, config]) => {
              const isSelected = (stats.kaiVoiceTone || 'coach') === toneKey;
              return (
                <button
                  key={toneKey}
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    usePlayerStore.getState().setStats((prev) => ({ ...prev, kaiVoiceTone: toneKey }));
                  }}
                  className={`chicle-btn p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'aura-bg-soft aura-border-primary aura-glow-subtle ring-1 optic-active-card'
                      : 'bg-[#040814]/80 border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-anton tracking-wider uppercase text-white font-bold flex items-center gap-1.5">
                        <span>{config.icon}</span>
                        <span>{config.label}</span>
                      </span>
                      {isSelected && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full aura-bg-primary aura-text-primary font-bold">
                          Activo
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {config.description}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-white/[0.08] text-[10px] font-mono text-slate-300 italic">
                    "{config.preview}"
                  </div>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* TOGGLES DE JUGABILIDAD */}
      <div className="w-full relative isolate rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] p-5 sm:p-6 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden space-y-4">
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

        <h3 className="text-xs font-anton aura-text-primary uppercase tracking-wider flex items-center gap-2 relative z-10">
          <Activity className="w-4 h-4" /> Mecánicas de Productividad Gamificada
        </h3>

        {/* Tareas Sugeridas */}
        <div className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.08] relative z-10">
          <div>
            <h4 className="text-sm font-anton tracking-wider uppercase text-white flex items-center gap-2 mb-0.5">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Tareas Sugeridas (Misiones Dinámicas)
            </h4>
            <p className="text-xs text-slate-400">
              Sugerencias automáticas para ganar puntos extra en hábitos rezagados.
            </p>
          </div>
          <ChicleToggle
            checked={!!settings.enableDynamicQuests}
            onChange={() => toggleSetting('enableDynamicQuests')}
            color="cyan"
            size="md"
            ariaLabel="Alternar Tareas Sugeridas"
          />
        </div>

        {/* Asistente KAI en pantalla */}
        <div className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.08] relative z-10">
          <div>
            <h4 className="text-sm font-anton tracking-wider uppercase text-white flex items-center gap-2 mb-0.5">
              <Activity className="w-4 h-4 text-purple-400" /> Asistente KAI en Pantalla
            </h4>
            <p className="text-xs text-slate-400">
              Muestra el orbe flotante de KAI para consultas rápidas.
            </p>
          </div>
          <ChicleToggle
            checked={!!settings.enableCompanion}
            onChange={() => toggleSetting('enableCompanion')}
            color="purple"
            size="md"
            ariaLabel="Alternar Asistente KAI"
          />
        </div>

        {/* Modo Exigente */}
        <div className="flex items-center justify-between gap-4 py-2 relative z-10">
          <div>
            <h4 className="text-sm font-anton tracking-wider uppercase text-white flex items-center gap-2 mb-0.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" /> Modo Exigente
            </h4>
            <p className="text-xs text-slate-400">
              Aplica mayor descuento de puntos si dejas hábitos pendientes.
            </p>
          </div>
          <ChicleToggle
            checked={!!settings.strictMode}
            onChange={() => toggleSetting('strictMode')}
            color="red"
            size="md"
            ariaLabel="Alternar Modo Exigente"
          />
        </div>
      </div>

      {/* COMPAÑERO CUÁNTICO KAI: SELECCIÓN Y FORJA */}
      <div className="w-full relative isolate rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] p-5 sm:p-6 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden space-y-4">
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 aura-text-primary" />
            <h3 className="text-xs font-anton aura-text-primary uppercase tracking-wider">
              Compañero Holográfico KAI
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold aura-bg-soft border aura-border-subtle px-2 py-0.5 rounded-full">
            {stats.kaiShape === 'custom' ? copy.settingsAiEquippedTag : '6 Formas Día 0'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-[#040814]/80 border border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div
              data-preserve-optic="true"
              className="w-14 h-14 rounded-xl bg-black/40 border aura-border-subtle p-1 flex items-center justify-center shrink-0"
            >
              <KaiVectorGraphics
                shapeId={stats.kaiShape || 'prism'}
                activeColor={palette.c1}
                secondaryColor={palette.c2}
                customForm={stats.kaiCustomForm}
              />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Figura Equipada:</span>
              <strong className="text-sm font-anton text-white tracking-wider uppercase">
                {stats.kaiShape === 'custom'
                  ? stats.kaiCustomForm?.name || copy.workshopCustomFallback
                  : KAI_OFFICIAL_SHAPES.find((s) => s.id === stats.kaiShape)?.name || 'El Prisma'}
              </strong>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {stats.kaiShape === 'custom'
                  ? copy.settingsAiCustomDesc
                  : 'Diseño geométrico disponible desde el día 0'}
              </span>
            </div>
          </div>

          {onOpenKaiWorkshop && (
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onOpenKaiWorkshop();
              }}
              className="chicle-btn aura-btn-gradient optic-active-card px-4 py-2.5 rounded-xl font-anton text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>{copy.settingsWorkshopBtn}</span>
            </button>
          )}
        </div>
      </div>

      {/* TUTORIAL GUIADO & RESTABLECER AVISOS */}
      <div className="w-full relative isolate rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] p-5 sm:p-6 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden space-y-4">
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 aura-text-primary" />
            <h3 className="text-xs font-anton aura-text-primary uppercase tracking-wider">
              Bienvenida y Tutorial Guiado de KAI
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold aura-bg-soft border aura-border-subtle px-2 py-0.5 rounded-full">
            5 Pasos
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed relative z-10">
          Repasa cómo funciona la app, dónde están las pestañas, cómo crear y marcar tareas y cómo aprovechar la Inteligencia Artificial de KAI.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1 relative z-10">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              useUIStore.getState().openTacticalGuide(1);
            }}
            className="chicle-btn aura-btn-gradient optic-active-card px-4 py-2 rounded-xl font-anton text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Repasar Tutorial de KAI</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              usePlayerStore.getState().resetTutorialGuides();
              notificationService.triggerNotification(
                'Avisos Restablecidos 🔄',
                'Los avisos contextuales de KAI volverán a mostrarse cuando explores la app.',
                '🔄'
              );
            }}
            className="chicle-btn px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white font-anton uppercase text-xs tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 aura-text-primary" />
            <span>Restablecer Avisos</span>
          </button>
        </div>
      </div>

      {/* LABORATORIO & HERRAMIENTAS TÁCTICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Simulador */}
        <div className="w-full relative isolate rounded-2xl bg-[#040a1a]/[0.94] border border-white/10 p-5 space-y-3 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden flex flex-col justify-between">
          <span className="vi-grano opacity-5" aria-hidden="true" />
          <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />
          <div className="space-y-2 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-anton text-fuchsia-400 uppercase tracking-wider flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4 text-fuchsia-400" /> Simulador Táctico
              </span>
              <span className="text-[10px] font-mono text-fuchsia-300 bg-fuchsia-500/15 border border-fuchsia-400/40 px-2 py-0.5 rounded-full uppercase">
                Modo Prueba
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Experimenta proyecciones de nivel, evolución de rachas y batallas sin alterar tus datos reales de juego.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onOpenSimulator();
            }}
            className="relative z-10 chicle-btn w-full py-2.5 px-4 bg-fuchsia-500/15 hover:bg-fuchsia-500/25 border border-fuchsia-400/50 text-fuchsia-200 rounded-xl text-xs font-anton uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <FlaskConical className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Abrir Simulador</span>
          </button>
        </div>

        {/* Oráculo IA */}
        <div className="w-full relative isolate rounded-2xl bg-[#040a1a]/[0.94] border border-white/10 p-5 space-y-3 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden flex flex-col justify-between">
          <span className="vi-grano opacity-5" aria-hidden="true" />
          <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />
          <div className="space-y-2 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-anton aura-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 aura-text-primary animate-pulse" /> Oráculo IA
              </span>
              <span className="text-[10px] font-mono aura-bg-soft border aura-border-subtle px-2 py-0.5 rounded-full uppercase">
                KAI
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Asistente neural inteligente para balancear tus bloques maestros, sugerir hábitos y optimizar tu rutina.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onOpenOracle();
            }}
            className="relative z-10 chicle-btn w-full py-2.5 px-4 aura-bg-soft hover:brightness-110 border aura-border-subtle rounded-xl text-xs font-anton uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 aura-text-primary" />
            <span>Consultar Oráculo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
