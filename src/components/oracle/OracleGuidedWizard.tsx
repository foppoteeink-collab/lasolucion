import React, { useState } from 'react';
import { 
  Sun, Moon, Briefcase, Dumbbell, Utensils, Sparkles, 
  ChevronRight, ChevronLeft, Check, Clock, Calendar, CheckCircle2, Shield
} from 'lucide-react';
import { soundFX } from '../../utils/audio';
import { setGlobalDayStartHour } from '../../utils/date';
import { usePlayerStore } from '../../store/usePlayerStore';

interface OracleGuidedWizardProps {
  onComplete: (synthesizedPrompt: string) => void;
  onCancel: () => void;
}

export const OracleGuidedWizard: React.FC<OracleGuidedWizardProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Paso 1: Sueño y Despertar
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('23:00');

  // Paso 2: Actividad Principal (Trabajo / Estudio)
  const [workType, setWorkType] = useState<'continua' | 'partida' | 'estudio' | 'libre'>('continua');
  const [workTitle, setWorkTitle] = useState('Trabajo / Actividad Principal');
  const [shift1Start, setShift1Start] = useState('08:00');
  const [shift1End, setShift1End] = useState('13:00');
  const [shift2Start, setShift2Start] = useState('15:00');
  const [shift2End, setShift2End] = useState('18:00');
  const [continuousStart, setContinuousStart] = useState('09:00');
  const [continuousEnd, setContinuousEnd] = useState('17:00');
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);

  // Paso 3: Entrenamiento
  const [hasTraining, setHasTraining] = useState(true);
  const [trainStart, setTrainStart] = useState('18:00');
  const [trainEnd, setTrainEnd] = useState('19:00');
  const [trainingDays, setTrainingDays] = useState<number[]>([1, 3, 5]);
  const [trainingSplit, setTrainingSplit] = useState<'por_musculo' | 'funcional' | 'general'>('general');

  // Paso 4: Tareas de Soporte & Desconexión
  const [hasLunch, setHasLunch] = useState(true);
  const [lunchTime, setLunchTime] = useState('13:00 - 14:00');
  const [hasCleaning, setHasCleaning] = useState(true);
  const [cleaningTime, setCleaningTime] = useState('19:30 - 20:00');
  const [hasCreative, setHasCreative] = useState(true);
  const [creativeTime, setCreativeTime] = useState('20:30 - 21:30');
  const [hasSaturdayClass, setHasSaturdayClass] = useState(false);
  const [saturdayClassTime, setSaturdayClassTime] = useState('10:00 - 11:30');

  const toggleWorkDay = (day: number) => {
    soundFX.playClick();
    if (workDays.includes(day)) {
      if (workDays.length > 1) setWorkDays(workDays.filter(d => d !== day));
    } else {
      setWorkDays([...workDays, day].sort((a, b) => a - b));
    }
  };

  const toggleTrainDay = (day: number) => {
    soundFX.playClick();
    if (trainingDays.includes(day)) {
      if (trainingDays.length > 1) setTrainingDays(trainingDays.filter(d => d !== day));
    } else {
      setTrainingDays([...trainingDays, day].sort((a, b) => a - b));
    }
  };

  const dayLabels = [
    { num: 1, name: 'Lun' },
    { num: 2, name: 'Mar' },
    { num: 3, name: 'Mié' },
    { num: 4, name: 'Jue' },
    { num: 5, name: 'Vie' },
    { num: 6, name: 'Sáb' },
    { num: 0, name: 'Dom' }
  ];

  const formatDaysText = (days: number[]) => {
    if (days.length === 5 && !days.includes(0) && !days.includes(6)) return 'de lunes a viernes';
    if (days.length === 6 && !days.includes(0)) return 'de lunes a sábado';
    if (days.length === 7) return 'todos los días';
    if (days.length === 2 && days.includes(0) && days.includes(6)) return 'fines de semana';
    const names = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return `los días ${days.map(d => names[d]).join(', ')}`;
  };

  const handleFinish = () => {
    soundFX.playSubBassConfirm();

    // Sincronizar automáticamente el inicio de jornada con la hora de despertar seleccionada
    const wakeH = parseInt(wakeTime.split(':')[0], 10);
    if (!isNaN(wakeH) && wakeH >= 0 && wakeH <= 23) {
      setGlobalDayStartHour(wakeH);
      usePlayerStore.getState().setStats((prev) => ({
        ...prev,
        dayStartHour: wakeH,
      }));
    }

    // Compile into precise natural language lines (one block per line for 100% deterministic & AI accuracy)
    const parts: string[] = [];
    const daysText = formatDaysText(workDays);
    const trainDaysText = formatDaysText(trainingDays);

    // 1. Morning Activation
    parts.push(`Activación matutina y preparación a las ${wakeTime} ${daysText}.`);

    // 2. Work / Primary Activity
    if (workType === 'partida') {
      parts.push(`${workTitle} (Turno Mañana) de ${shift1Start} a ${shift1End} ${daysText}.`);
      parts.push(`${workTitle} (Turno Tarde) de ${shift2Start} a ${shift2End} ${daysText}.`);
    } else if (workType === 'continua') {
      parts.push(`${workTitle} de ${continuousStart} a ${continuousEnd} ${daysText}.`);
    } else if (workType === 'estudio') {
      parts.push(`Sesión de Estudio Intensivo (${workTitle}) de ${continuousStart} a ${continuousEnd} ${daysText}.`);
    } else if (workType === 'libre') {
      parts.push(`${workTitle} (Bloque Productivo Flexible) de ${continuousStart} a ${continuousEnd} ${daysText}.`);
    }

    // 3. Lunch
    if (hasLunch) {
      parts.push(`Almuerzo y Pausa de Recarga de ${lunchTime} ${daysText}.`);
    }

    // 4. Training
    if (hasTraining) {
      if (trainingSplit === 'por_musculo') {
        const muscleGroups = [
          'Tren Inferior & Pierna',
          'Espalda, Bíceps & Core',
          'Pecho, Hombro & Tríceps',
          'Glúteo, Isquios & Potencia',
          'Full Body & Acondicionamiento',
          'Cardio HIIT & Movilidad',
          'Recuperación Activa'
        ];
        const dayNamesFull = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        trainingDays.forEach((dNum, idx) => {
          const mg = muscleGroups[idx % muscleGroups.length];
          parts.push(`Entrenamiento: ${mg} de ${trainStart} a ${trainEnd} los ${dayNamesFull[dNum]}.`);
        });
      } else {
        parts.push(`Entrenamiento Físico y Deporte de ${trainStart} a ${trainEnd} ${trainDaysText}.`);
      }
    }

    // 5. Cleaning
    if (hasCleaning) {
      parts.push(`Limpieza y Orden del Espacio de ${cleaningTime} ${daysText}.`);
    }

    // 6. Creative / Reading
    if (hasCreative) {
      parts.push(`Bloque Creativo y Proyectos Personales de ${creativeTime} ${daysText}.`);
    }

    // 7. Saturday special
    if (hasSaturdayClass) {
      parts.push(`Clase Especial de Alto Impacto de ${saturdayClassTime} los sábados.`);
    }

    // 8. Nightly wind-down
    parts.push(`Desconexión nocturna y descanso a las ${sleepTime} ${daysText}.`);

    onComplete(parts.join('\n'));
  };

  return (
    <div className="space-y-4">
      {/* Step Progress Bar */}
      <div className="bg-[#040814]/80 border border-white/10 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold aura-text-soft uppercase tracking-wider flex items-center gap-1.5 tabular-nums">
            <Sparkles className="w-3.5 h-3.5 aura-text-primary" />
            Paso a paso · Pregunta {step} de 4
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map(s => (
            <div 
              key={s} 
              className={`h-2 rounded-full transition-all ${
                s === step 
                  ? 'w-6 aura-bg-primary aura-glow-subtle optic-active-card' 
                  : s < step 
                  ? 'w-3 bg-white/40' 
                  : 'w-3 bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* STEP 1: Ciclo de Energía */}
      {step === 1 && (
        <div className="bg-[#040814]/80 border border-white/10 rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl aura-bg-soft border aura-border-subtle flex items-center justify-center aura-text-primary shrink-0">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-anton uppercase tracking-wider text-white">1. ¿A qué hora te levantas y te acuestas?</h4>
              <p className="text-xs text-slate-400">Marca cuándo empieza y termina normalmente tu día.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2 bg-black/40 border border-white/10 p-3 rounded-xl">
              <label className="text-xs font-mono font-bold aura-text-soft flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                Hora de Despertar:
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="time" 
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="bg-black/60 border border-white/15 focus:aura-border-primary rounded-lg px-3 py-2 text-sm text-white font-mono tabular-nums outline-none w-full"
                />
              </div>
              <div className="flex gap-1.5 pt-1">
                {['05:00', '06:00', '07:00', '08:00'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setWakeTime(t)}
                    className={`chicle-btn flex-1 py-1 text-[11px] font-mono tabular-nums rounded-lg border transition-colors cursor-pointer ${
                      wakeTime === t ? 'aura-bg-primary font-bold aura-border-primary optic-active-card' : 'bg-white/[0.03] text-slate-300 border-white/10 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 bg-black/40 border border-white/10 p-3 rounded-xl">
              <label className="text-xs font-mono font-bold aura-text-soft flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                Hora de Dormir:
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="time" 
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  className="bg-black/60 border border-white/15 focus:aura-border-primary rounded-lg px-3 py-2 text-sm text-white font-mono tabular-nums outline-none w-full"
                />
              </div>
              <div className="flex gap-1.5 pt-1">
                {['22:00', '22:30', '23:00', '00:00'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSleepTime(t)}
                    className={`chicle-btn flex-1 py-1 text-[11px] font-mono tabular-nums rounded-lg border transition-colors cursor-pointer ${
                      sleepTime === t ? 'aura-bg-primary font-bold aura-border-primary optic-active-card' : 'bg-white/[0.03] text-slate-300 border-white/10 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Jornada Laboral o Estudio */}
      {step === 2 && (
        <div className="bg-[#040814]/80 border border-white/10 rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl aura-bg-soft border aura-border-subtle flex items-center justify-center aura-text-primary shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-anton uppercase tracking-wider text-white">2. Tu actividad principal (Trabajo o Estudio)</h4>
              <p className="text-xs text-slate-400">¿Qué horario ocupa la mayor parte de tu jornada?</p>
            </div>
          </div>

          {/* Tipo de jornada */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'partida', title: 'Turno Partido', desc: 'Mañana y Tarde' },
              { id: 'continua', title: 'Jornada Continua', desc: 'Horario corrido' },
              { id: 'estudio', title: 'Estudio / Opos.', desc: 'Bloques de enfoque' },
              { id: 'libre', title: 'Freelance / Libre', desc: 'Horario flexible' }
            ].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  setWorkType(t.id as any);
                }}
                className={`chicle-btn !flex-col !items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  workType === t.id 
                    ? 'aura-bg-soft aura-border-primary aura-glow-subtle optic-active-card' 
                    : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/20 hover:bg-white/[0.04]'
                }`}
              >
                <p className="text-xs font-bold font-mono text-white">{t.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>

          <div className="space-y-3 bg-black/40 border border-white/10 p-3.5 rounded-xl">
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Nombre o Título de la Actividad:</label>
              <input 
                type="text" 
                value={workTitle}
                onChange={(e) => setWorkTitle(e.target.value)}
                placeholder="Ej. Atención a Clientes, Desarrollo Web, Oficina..."
                className="w-full bg-black/60 border border-white/15 focus:aura-border-primary rounded-lg px-3 py-1.5 text-xs text-white font-sans outline-none"
              />
            </div>

            {workType === 'partida' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-mono aura-text-soft block mb-1">Primer Turno (Mañana):</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="time" 
                      value={shift1Start}
                      onChange={(e) => setShift1Start(e.target.value)}
                      className="bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-xs text-white font-mono tabular-nums flex-1"
                    />
                    <span className="text-slate-500 text-xs">a</span>
                    <input 
                      type="time" 
                      value={shift1End}
                      onChange={(e) => setShift1End(e.target.value)}
                      className="bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-xs text-white font-mono tabular-nums flex-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono aura-text-soft block mb-1">Segundo Turno (Tarde):</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="time" 
                      value={shift2Start}
                      onChange={(e) => setShift2Start(e.target.value)}
                      className="bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-xs text-white font-mono tabular-nums flex-1"
                    />
                    <span className="text-slate-500 text-xs">a</span>
                    <input 
                      type="time" 
                      value={shift2End}
                      onChange={(e) => setShift2End(e.target.value)}
                      className="bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-xs text-white font-mono tabular-nums flex-1"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-mono aura-text-soft block mb-1">Horario Laboral:</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="time" 
                    value={continuousStart}
                    onChange={(e) => setContinuousStart(e.target.value)}
                    className="bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-xs text-white font-mono tabular-nums flex-1"
                  />
                  <span className="text-slate-500 text-xs">a</span>
                  <input 
                    type="time" 
                    value={continuousEnd}
                    onChange={(e) => setContinuousEnd(e.target.value)}
                    className="bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-xs text-white font-mono tabular-nums flex-1"
                  />
                </div>
              </div>
            )}

            {/* Días laborales */}
            <div className="pt-2 border-t border-white/10">
              <label className="text-[11px] font-mono text-slate-400 block mb-1.5">Días en que aplica:</label>
              <div className="flex gap-1">
                {dayLabels.map(d => (
                  <button
                    key={d.num}
                    type="button"
                    onClick={() => toggleWorkDay(d.num)}
                    className={`chicle-btn flex-1 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                      workDays.includes(d.num)
                        ? 'aura-bg-primary optic-active-card'
                        : 'bg-white/[0.03] text-slate-400 border border-white/10 hover:text-white'
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Entrenamiento */}
      {step === 3 && (
        <div className="bg-[#040814]/80 border border-white/10 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl aura-bg-soft border aura-border-subtle flex items-center justify-center aura-text-primary shrink-0">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-anton uppercase tracking-wider text-white">3. Ejercicio o entrenamiento</h4>
                <p className="text-xs text-slate-400">¿Tienes algún bloque para gimnasio, deporte o moverte?</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setHasTraining(!hasTraining);
              }}
              className={`chicle-btn px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer shrink-0 ${
                hasTraining ? 'aura-bg-primary aura-border-primary optic-active-card' : 'bg-white/[0.03] text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              {hasTraining ? 'Activado' : 'No entreno'}
            </button>
          </div>

          {hasTraining && (
            <div className="space-y-3 bg-black/40 border border-white/10 p-3.5 rounded-xl">
              <div>
                <label className="text-[11px] font-mono aura-text-soft block mb-1">Horario de Entrenamiento:</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="time" 
                    value={trainStart}
                    onChange={(e) => setTrainStart(e.target.value)}
                    className="bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-xs text-white font-mono tabular-nums flex-1"
                  />
                  <span className="text-slate-500 text-xs">a</span>
                  <input 
                    type="time" 
                    value={trainEnd}
                    onChange={(e) => setTrainEnd(e.target.value)}
                    className="bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-xs text-white font-mono tabular-nums flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Días de Entrenamiento:</label>
                <div className="flex gap-1">
                  {dayLabels.map(d => (
                    <button
                      key={d.num}
                      type="button"
                      onClick={() => toggleTrainDay(d.num)}
                      className={`chicle-btn flex-1 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                        trainingDays.includes(d.num)
                          ? 'aura-bg-primary optic-active-card'
                          : 'bg-white/[0.03] text-slate-400 border border-white/10 hover:text-white'
                      }`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Estructura de la Rutina:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTrainingSplit('por_musculo')}
                    className={`chicle-btn !flex-col !items-start p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                      trainingSplit === 'por_musculo' ? 'aura-bg-soft aura-border-primary optic-active-card' : 'bg-white/[0.03] border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <p className="text-xs font-bold font-mono text-white">Por Grupo Muscular</p>
                    <p className="text-[10px] text-slate-400">Pierna, Espalda, Glúteo, Pecho diario</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTrainingSplit('funcional')}
                    className={`chicle-btn !flex-col !items-start p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                      trainingSplit === 'funcional' ? 'aura-bg-soft aura-border-primary optic-active-card' : 'bg-white/[0.03] border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <p className="text-xs font-bold font-mono text-white">Bloque Único General</p>
                    <p className="text-[10px] text-slate-400">Gimnasio / Cardio uniforme</p>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: Soporte y Desconexión */}
      {step === 4 && (
        <div className="bg-[#040814]/80 border border-white/10 rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl aura-bg-soft border aura-border-subtle flex items-center justify-center aura-text-primary shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-anton uppercase tracking-wider text-white">4. Comidas, orden y tiempo libre</h4>
              <p className="text-xs text-slate-400">Activa lo que quieras incluir automáticamente en tu horario.</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {/* Almuerzo */}
            <div className="flex items-center justify-between gap-2 p-2.5 bg-black/40 border border-white/10 rounded-xl">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={hasLunch} 
                  onChange={(e) => setHasLunch(e.target.checked)}
                  className="rounded border-white/20 focus:ring-0 cursor-pointer accent-cyan-400"
                />
                <span className="text-xs font-mono text-slate-200 font-bold">Almuerzo / Comida Principal</span>
              </div>
              <input 
                type="text" 
                value={lunchTime} 
                onChange={(e) => setLunchTime(e.target.value)}
                disabled={!hasLunch}
                className="bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-xs aura-text-soft font-mono tabular-nums w-36 text-center outline-none disabled:opacity-40"
              />
            </div>

            {/* Limpieza */}
            <div className="flex items-center justify-between gap-2 p-2.5 bg-black/40 border border-white/10 rounded-xl">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={hasCleaning} 
                  onChange={(e) => setHasCleaning(e.target.checked)}
                  className="rounded border-white/20 focus:ring-0 cursor-pointer accent-cyan-400"
                />
                <span className="text-xs font-mono text-slate-200 font-bold">Limpieza y Orden del Hogar</span>
              </div>
              <input 
                type="text" 
                value={cleaningTime} 
                onChange={(e) => setCleaningTime(e.target.value)}
                disabled={!hasCleaning}
                className="bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-xs aura-text-soft font-mono tabular-nums w-36 text-center outline-none disabled:opacity-40"
              />
            </div>

            {/* Bloque Creativo */}
            <div className="flex items-center justify-between gap-2 p-2.5 bg-black/40 border border-white/10 rounded-xl">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={hasCreative} 
                  onChange={(e) => setHasCreative(e.target.checked)}
                  className="rounded border-white/20 focus:ring-0 cursor-pointer accent-cyan-400"
                />
                <span className="text-xs font-mono text-slate-200 font-bold">Bloque Creativo / Lectura Nocturna</span>
              </div>
              <input 
                type="text" 
                value={creativeTime} 
                onChange={(e) => setCreativeTime(e.target.value)}
                disabled={!hasCreative}
                className="bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-xs aura-text-soft font-mono tabular-nums w-36 text-center outline-none disabled:opacity-40"
              />
            </div>

            {/* Sábado Especial */}
            <div className="flex items-center justify-between gap-2 p-2.5 bg-black/40 border border-white/10 rounded-xl">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={hasSaturdayClass} 
                  onChange={(e) => setHasSaturdayClass(e.target.checked)}
                  className="rounded border-white/20 focus:ring-0 cursor-pointer accent-cyan-400"
                />
                <span className="text-xs font-mono text-slate-200 font-bold">Sábado: Clase Especial o Tarea Grupal</span>
              </div>
              <input 
                type="text" 
                value={saturdayClassTime} 
                onChange={(e) => setSaturdayClassTime(e.target.value)}
                disabled={!hasSaturdayClass}
                className="bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-xs aura-text-soft font-mono tabular-nums w-36 text-center outline-none disabled:opacity-40"
              />
            </div>
          </div>
        </div>
      )}

      {/* Wizard Footer Navigation */}
      <div className="flex items-center justify-between pt-2">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setStep((step - 1) as any);
            }}
            className="chicle-btn px-3.5 py-2 bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className="chicle-btn px-3.5 py-2 bg-white/[0.05] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white rounded-xl text-xs font-mono cursor-pointer transition-colors"
          >
            Cancelar
          </button>
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setStep((step + 1) as any);
            }}
            className="chicle-btn aura-btn-gradient optic-active-card px-5 py-2 rounded-xl text-xs font-anton uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            <span>Siguiente</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            className="chicle-btn aura-btn-gradient optic-active-card px-6 py-2.5 rounded-xl text-xs font-anton uppercase tracking-wider flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Crear borrador de agenda</span>
          </button>
        )}
      </div>
    </div>
  );
};
