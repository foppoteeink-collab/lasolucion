import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  BellRing, 
  Bell, 
  BellOff, 
  Timer, 
  Sun, 
  Moon, 
  Zap, 
  Flame, 
  Clock, 
  Settings, 
  Headphones,
  Smartphone 
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useNarrativeCopy } from '../../hooks/useNarrativeCopy';
import { ChicleToggle } from '../ChicleToggle';
import { QuantumSoundscapeConsole } from '../QuantumSoundscapeConsole';
import { soundFX } from '../../utils/audio';
import { hapticPresets } from '../../utils/haptics';
import { notificationService } from '../../utils/notifications';
import { 
  getNotificationSettings, 
  saveNotificationSettings, 
  scheduleAll, 
  type NotificationSettings 
} from '../../utils/notificationScheduler';
import { formatHourToHuman } from '../../utils/timeUtils';
import { getTodayDateString, getGlobalDayStartHour } from '../../utils/date';

const EMPTY_TASK_LIST: any[] = [];

export const SettingsPreferencesTab: React.FC = () => {
  const { 
    soundEnabled, 
    toggleSound, 
    masterVolume,
    setMasterVolume,
    hapticEnabled,
    toggleHaptics,
    timeFormat, 
    setTimeFormat, 
    setModalState 
  } = useUIStore();

  const stats = usePlayerStore((s) => s.stats);
  const streakDays = stats.streakDays;
  const copy = useNarrativeCopy();

  const todayTasks = useTaskStore((s) => s.tasksByDate[getTodayDateString()] ?? EMPTY_TASK_LIST);

  const [audioTesting, setAudioTesting] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    () => notificationService.getPermission()
  );
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(getNotificationSettings);
  const [notifTestFeedback, setNotifTestFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    notificationService.syncPermissionAsync().then((perm) => {
      if (active) setNotificationPermission(perm);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleTestAudio = () => {
    setAudioTesting(true);
    soundFX.playLevelUp();
    setTimeout(() => setAudioTesting(false), 900);
  };

  const handleRequestNotifications = async () => {
    soundFX.playClick();
    const granted = await notificationService.requestPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
    if (granted) {
      notificationService.triggerNotification(
        '¡Notificaciones Activadas!',
        'La Solución te recordará tus hábitos y misiones importantes.',
        '🔔'
      );
      scheduleAll({ tasks: todayTasks, streakDays });
      setNotifTestFeedback('✓ Notificaciones activadas con éxito.');
      setTimeout(() => setNotifTestFeedback(null), 3500);
    }
  };

  const handleToggleNotifSetting = (key: keyof NotificationSettings, value?: boolean | number) => {
    soundFX.playClick();
    const updated = {
      ...notifSettings,
      [key]: value !== undefined ? value : !notifSettings[key],
    };
    setNotifSettings(updated);
    saveNotificationSettings(updated);
    if (notificationPermission === 'granted') {
      scheduleAll({ tasks: todayTasks, streakDays });
    }
  };

  const handleTestNotification = async () => {
    soundFX.playClick();
    if (notificationPermission !== 'granted') {
      notificationService.sendTestNotification();
      setNotifTestFeedback(
        '⚠️ Notificación en pantalla emitida. Para recibir notificaciones del sistema operativo, activa los permisos.'
      );
      setTimeout(() => setNotifTestFeedback(null), 4000);
      return;
    }
    notificationService.sendTestNotification();
    setNotifTestFeedback('✓ Notificación de prueba enviada (Sistema Operativo y Alerta en Pantalla)');
    setTimeout(() => setNotifTestFeedback(null), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* AUDIO & FEEDBACK TÁCTICO */}
      <div className="w-full relative isolate rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] p-5 sm:p-6 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden space-y-5">
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

        <h3 className="text-xs font-anton aura-text-primary uppercase tracking-wider flex items-center gap-2 relative z-10">
          <Volume2 className="w-4 h-4" /> Audio & Efectos del Sistema
        </h3>

        {/* SONIDO */}
        <div className="flex items-center justify-between gap-4 relative z-10">
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-2 mb-1">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 aura-text-primary" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
              Efectos Sonoros Sintéticos
            </h4>
            <p className="text-xs text-slate-400">
              {copy.settingsSoundDescription}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleTestAudio}
              disabled={!soundEnabled}
              className={`chicle-btn px-3.5 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all border ${
                !soundEnabled
                  ? 'opacity-40 cursor-not-allowed border-white/10 text-slate-500'
                  : audioTesting
                  ? 'aura-btn-gradient optic-active-card'
                  : 'bg-white/[0.04] border-white/15 aura-text-soft hover:bg-white/10 hover:text-white cursor-pointer'
              }`}
              title="Probar sonido"
            >
              {audioTesting ? 'Sonando...' : 'Probar'}
            </button>
            <ChicleToggle
              checked={soundEnabled}
              onChange={() => toggleSound()}
              color="cyan"
              size="md"
              ariaLabel="Alternar efectos sonoros"
            />
          </div>
        </div>

        {/* CONTROL DE VOLUMEN MASTER */}
        {soundEnabled && (
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2 relative z-10 animate-fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Volumen de Efectos</span>
              <span className="font-mono font-bold aura-text-primary tabular-nums">{Math.round(masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={masterVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setMasterVolume(val);
              }}
              className="w-full accent-[var(--aura-color-1,#00f0ff)] cursor-pointer h-1.5 bg-white/10 rounded-lg"
              aria-label="Control de volumen de efectos sonoros"
            />
          </div>
        )}

        {/* RESPUESTA HÁPTICA / VIBRACIÓN TÁCTIL */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-4 relative z-10">
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-2 mb-1">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              Respuesta Háptica (Vibración)
            </h4>
            <p className="text-xs text-slate-400">
              Vibración de confirmación al marcar hábitos, completar tareas o subir de nivel.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                hapticPresets.taskComplete();
              }}
              disabled={!hapticEnabled}
              className={`chicle-btn px-3.5 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all border ${
                !hapticEnabled
                  ? 'opacity-40 cursor-not-allowed border-white/10 text-slate-500'
                  : 'bg-white/[0.04] border-white/15 text-emerald-300 hover:bg-white/10 hover:text-white cursor-pointer'
              }`}
              title="Probar vibración táctil"
            >
              Probar
            </button>
            <ChicleToggle
              checked={hapticEnabled}
              onChange={() => toggleHaptics()}
              color="emerald"
              size="md"
              ariaLabel="Alternar vibración háptica"
            />
          </div>
        </div>

        {/* ═══ CENTRO DE NOTIFICACIONES KAI ═══ */}
        <div className="pt-4 border-t border-white/10 space-y-4 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-anton tracking-wider uppercase text-white flex items-center gap-2 mb-1">
                <BellRing className="w-4 h-4 text-emerald-400" /> Centro de Notificaciones — La Solución
              </h4>
              <p className="text-xs text-slate-400">
                Recordatorios inteligentes basados en tu horario y estado del juego.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <span
                className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-lg border ${
                  notificationPermission === 'granted'
                    ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/50'
                    : notificationPermission === 'denied'
                    ? 'text-rose-400 border-rose-500/40 bg-rose-950/50'
                    : 'text-amber-400 border-amber-500/40 bg-amber-950/50'
                }`}
              >
                {notificationPermission === 'granted'
                  ? '● Activas'
                  : notificationPermission === 'denied'
                  ? '✕ Bloqueadas'
                  : '○ Pendiente'}
              </span>

              {notificationPermission !== 'granted' && (
                <button
                  type="button"
                  onClick={handleRequestNotifications}
                  disabled={!notificationService.isSupported()}
                  className={`chicle-btn px-3 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all border ${
                    !notificationService.isSupported()
                      ? 'opacity-40 cursor-not-allowed border-white/10 text-slate-500'
                      : 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/25 hover:text-white cursor-pointer'
                  }`}
                >
                  <Bell className="w-3 h-3 inline mr-1" /> Activar Permisos
                </button>
              )}

              {notificationPermission === 'granted' && (
                <button
                  type="button"
                  onClick={handleTestNotification}
                  className="chicle-btn px-3 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all border bg-white/[0.04] border-white/15 aura-text-soft hover:bg-white/10 cursor-pointer"
                >
                  <BellRing className="w-3 h-3 inline mr-1" /> Probar
                </button>
              )}
            </div>
          </div>

          {notifTestFeedback && (
            <div className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-3 py-2 animate-fade-in">
              {notifTestFeedback}
            </div>
          )}

          {!notificationService.isSupported() && (
            <div className="text-xs text-amber-400 bg-amber-950/30 border border-amber-500/30 rounded-xl px-3 py-2 flex items-center gap-2">
              <BellOff className="w-3.5 h-3.5 shrink-0" />
              Tu navegador no soporta notificaciones push. Instala la app como PWA para activarlas.
            </div>
          )}

          {notificationPermission === 'granted' && (
            <div className="space-y-2 bg-[#040814]/80 rounded-2xl p-3 border border-white/10">
              <p className="text-[10px] font-anton text-slate-400 uppercase tracking-widest mb-3">
                Tipos de Recordatorio
              </p>

              {/* Recordatorios por hora */}
              <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Timer className="w-3.5 h-3.5 aura-text-primary shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">Recordatorios por hora</p>
                    <p className="text-[10px] text-slate-400">Avisa 2 min antes de cada tarea con horario</p>
                  </div>
                </div>
                <ChicleToggle
                  checked={!!notifSettings.habitReminders}
                  onChange={() => handleToggleNotifSetting('habitReminders')}
                  color="cyan"
                  size="sm"
                  ariaLabel="Alternar recordatorios por hora"
                />
              </div>

              {/* Briefing matutino */}
              <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">Briefing matutino</p>
                    <p className="text-[10px] text-slate-400">Resumen 15 min antes de tu primera tarea del día</p>
                  </div>
                </div>
                <ChicleToggle
                  checked={!!notifSettings.morningBriefing}
                  onChange={() => handleToggleNotifSetting('morningBriefing')}
                  color="amber"
                  size="sm"
                  ariaLabel="Alternar briefing matutino"
                />
              </div>

              {/* Reflexión nocturna */}
              <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">Reflexión nocturna</p>
                    <p className="text-[10px] text-slate-400">Recordatorio para cerrar el día</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {notifSettings.nightlyReflection && (
                    <select
                      value={notifSettings.nightlyHour}
                      onChange={(e) => handleToggleNotifSetting('nightlyHour', parseInt(e.target.value))}
                      className="bg-[#040814]/80 border border-white/15 text-indigo-300 text-[10px] font-mono tabular-nums rounded-xl px-2 py-1 cursor-pointer focus:outline-none focus:border-indigo-400"
                    >
                      {[19, 20, 21, 22, 23].map((h) => (
                        <option key={h} value={h}>
                          {String(h).padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                  )}
                  <ChicleToggle
                    checked={!!notifSettings.nightlyReflection}
                    onChange={() => handleToggleNotifSetting('nightlyReflection')}
                    color="indigo"
                    size="sm"
                    ariaLabel="Alternar reflexión nocturna"
                  />
                </div>
              </div>

              {/* Alerta de Objetivo Prioritario */}
              <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">Objetivo Prioritario</p>
                    <p className="text-[10px] text-slate-400">
                      Avisa a las 20:00 si tu tarea principal del día sigue pendiente
                    </p>
                  </div>
                </div>
                <ChicleToggle
                  checked={!!notifSettings.bossAlert}
                  onChange={() => handleToggleNotifSetting('bossAlert')}
                  color="amber"
                  size="sm"
                  ariaLabel="Alternar alerta de objetivo prioritario"
                />
              </div>

              {/* Racha en peligro */}
              <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">Racha en peligro</p>
                    <p className="text-[10px] text-slate-400">
                      Alerta si llevas horas sin completar ninguna misión
                    </p>
                  </div>
                </div>
                <ChicleToggle
                  checked={!!notifSettings.streakAlert}
                  onChange={() => handleToggleNotifSetting('streakAlert')}
                  color="amber"
                  size="sm"
                  ariaLabel="Alternar alerta de racha en peligro"
                />
              </div>

              {/* Pomodoro completado */}
              <div className="flex items-center justify-between gap-3 py-2">
                <div className="flex items-center gap-2">
                  <Timer className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">Pomodoro completado</p>
                    <p className="text-[10px] text-slate-400">
                      Notificación al finalizar cada sesión de foco
                    </p>
                  </div>
                </div>
                <ChicleToggle
                  checked={!!notifSettings.pomodoroComplete}
                  onChange={() => handleToggleNotifSetting('pomodoroComplete')}
                  color="emerald"
                  size="sm"
                  ariaLabel="Alternar alerta de pomodoro completado"
                />
              </div>
            </div>
          )}
        </div>

        {/* RITMO DE JORNADA Y CICLO DIARIO */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <h4 className="text-sm font-anton tracking-wider uppercase text-white flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 aura-text-primary" /> Ritmo de Jornada y Ciclo Diario
            </h4>
            <p className="text-xs text-slate-400 max-w-md">
              Hora de inicio de tus 24h de actividades (
              <span className="font-mono tabular-nums">
                {formatHourToHuman(
                  stats.dayStartHour !== undefined ? stats.dayStartHour : getGlobalDayStartHour()
                )}
              </span>
              ). Mantiene tus tareas unidas sin dividirse en turnos nocturnos, vespertinos o diurnos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setModalState('isDayRhythmOpen', true);
            }}
            className="chicle-btn px-3.5 py-2 rounded-xl aura-bg-soft hover:brightness-110 border aura-border-subtle text-xs font-anton uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <Settings className="w-3.5 h-3.5 aura-text-primary" />
            <span>Calibrar Horario</span>
          </button>
        </div>

        {/* FORMATO DE HORA EN AGENDA */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <h4 className="text-sm font-anton tracking-wider uppercase text-white flex items-center gap-2 mb-1">
              <Timer className="w-4 h-4 aura-text-primary" /> Formato de Hora en Agenda
            </h4>
            <p className="text-xs text-slate-400">
              Elige cómo visualizar la columna de horarios de tus tareas (12h con AM/PM o 24h).
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-[#040814]/80 p-1 rounded-2xl border border-white/10 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setTimeFormat('12h');
              }}
              className={`chicle-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all cursor-pointer ${
                timeFormat === '12h'
                  ? 'aura-btn-gradient optic-active-card font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>12 Horas (AM/PM)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setTimeFormat('24h');
              }}
              className={`chicle-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-anton tracking-wider uppercase transition-all cursor-pointer ${
                timeFormat === '24h'
                  ? 'aura-btn-gradient optic-active-card font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>24 Horas (14:00)</span>
            </button>
          </div>
        </div>
      </div>

      {/* LABORATORIO ACÚSTICO */}
      <div className="w-full relative isolate rounded-2xl sm:rounded-3xl bg-[#040a1a]/[0.94] p-5 sm:p-6 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)] overflow-hidden space-y-4">
        <span className="vi-grano opacity-5" aria-hidden="true" />
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none aura-top-filament" aria-hidden="true" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-anton uppercase tracking-wider text-white flex items-center gap-2">
                Laboratorio Acústico & Frecuencias
              </h3>
              <p className="text-xs text-slate-400">
                Paisajes sonoros generativos, ondas binaurales (Alpha/Beta), ruido marrón y frecuencias orgánicas.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-2 border-t border-white/10">
          <QuantumSoundscapeConsole compact={false} />
        </div>
      </div>
    </div>
  );
};
