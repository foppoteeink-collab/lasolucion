import React, { useState } from 'react';
import { 
  Sun, Moon, Briefcase, Dumbbell, Utensils, Sparkles, 
  ChevronRight, ChevronLeft, Check, Clock, Calendar, CheckCircle2, Shield
} from 'lucide-react';
import { soundFX } from '../../utils/audio';

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

    // Compile into precise natural language prompt
    const parts: string[] = [];

    // Wake / sleep cycle
    parts.push(`Despertar a las ${wakeTime} y desconexión/dormir a las ${sleepTime}.`);

    // Work / Primary
    if (workType === 'partida') {
      parts.push(`${formatDaysText(workDays)} ${workTitle} en jornada partida: primer turno de ${shift1Start} a ${shift1End}, y segundo turno de ${shift2Start} a ${shift2End}.`);
    } else if (workType === 'continua') {
      parts.push(`${formatDaysText(workDays)} ${workTitle} de ${continuousStart} a ${continuousEnd}.`);
    } else if (workType === 'estudio') {
      parts.push(`${formatDaysText(workDays)} sesión de estudio intensivo de ${continuousStart} a ${continuousEnd}.`);
    }

    // Support habits
    if (hasCleaning) {
      parts.push(`Limpieza y orden del espacio de ${cleaningTime} ${formatDaysText(workDays)}.`);
    }
    if (hasLunch) {
      parts.push(`Almuerzo y pausa de comida de ${lunchTime} ${formatDaysText(workDays)}.`);
    }

    // Training
    if (hasTraining) {
      if (trainingSplit === 'por_musculo') {
        parts.push(`Entrenamiento de fuerza y acondicionamiento de ${trainStart} a ${trainEnd} los ${trainingDays.map(d => dayLabels.find(l => l.num === d)?.name).join(', ')} con desglose por grupo muscular según el día.`);
      } else {
        parts.push(`Entrenamiento físico de ${trainStart} a ${trainEnd} ${formatDaysText(trainingDays)}.`);
      }
    }

    // Creative / night
    if (hasCreative) {
      parts.push(`Bloque creativo / proyectos personales de ${creativeTime} ${formatDaysText(workDays)}.`);
    }

    // Saturday special
    if (hasSaturdayClass) {
      parts.push(`Sábado de ${saturdayClassTime} clase especial o sesión de alto impacto.`);
    }

    onComplete(parts.join(' '));
  };

  return (
    <div className="space-y-4">
      {/* Step Progress Bar */}
      <div className="bg-[#040d1a] border border-cyan-900/60 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Asistente Guiado // Paso {step} de 4
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map(s => (
            <div 
              key={s} 
              className={`h-2 rounded-full transition-all ${
                s === step 
                  ? 'w-6 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]' 
                  : s < step 
                  ? 'w-3 bg-cyan-600' 
                  : 'w-3 bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* STEP 1: Ciclo de Energía */}
      {step === 1 && (
        <div className="bg-[#07111c] border border-cyan-900/50 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide font-mono">1. Ciclo Biológico & Energía</h4>
              <p className="text-xs text-slate-400">Define tus franjas de inicio y conclusión de actividad.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2 bg-black/40 border border-slate-800/80 p-3 rounded-xl">
              <label className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                Hora de Despertar:
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="time" 
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="bg-[#03070d] border border-cyan-800 focus:border-cyan-400 rounded-lg px-3 py-2 text-sm text-cyan-200 font-mono outline-none w-full"
                />
              </div>
              <div className="flex gap-1.5 pt-1">
                {['05:00', '06:00', '07:00', '08:00'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setWakeTime(t)}
                    className={`flex-1 py-1 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                      wakeTime === t ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400' : 'bg-black/40 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 bg-black/40 border border-slate-800/80 p-3 rounded-xl">
              <label className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                Hora de Dormir:
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="time" 
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  className="bg-[#03070d] border border-cyan-800 focus:border-cyan-400 rounded-lg px-3 py-2 text-sm text-cyan-200 font-mono outline-none w-full"
                />
              </div>
              <div className="flex gap-1.5 pt-1">
                {['22:00', '22:30', '23:00', '00:00'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSleepTime(t)}
                    className={`flex-1 py-1 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                      sleepTime === t ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400' : 'bg-black/40 text-slate-400 border-slate-800 hover:text-white'
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
        <div className="bg-[#07111c] border border-cyan-900/50 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide font-mono">2. Actividad Principal (Trabajo / Estudio)</h4>
              <p className="text-xs text-slate-400">¿Cómo se estructura tu jornada productiva principal?</p>
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
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  workType === t.id 
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]' 
                    : 'bg-black/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <p className="text-xs font-bold font-mono text-slate-200">{t.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>

          <div className="space-y-3 bg-black/40 border border-slate-800/80 p-3.5 rounded-xl">
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Nombre o Título de la Actividad:</label>
              <input 
                type="text" 
                value={workTitle}
                onChange={(e) => setWorkTitle(e.target.value)}
                placeholder="Ej. Atención a Clientes, Desarrollo Web, Oficina..."
                className="w-full bg-[#03070d] border border-cyan-800 focus:border-cyan-400 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-sans outline-none"
              />
            </div>

            {workType === 'partida' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-mono text-cyan-300 block mb-1">Primer Turno (Mañana):</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="time" 
                      value={shift1Start}
                      onChange={(e) => setShift1Start(e.target.value)}
                      className="bg-[#03070d] border border-cyan-800 rounded-lg px-2 py-1 text-xs text-cyan-200 font-mono flex-1"
                    />
                    <span className="text-slate-500 text-xs">a</span>
                    <input 
                      type="time" 
                      value={shift1End}
                      onChange={(e) => setShift1End(e.target.value)}
                      className="bg-[#03070d] border border-cyan-800 rounded-lg px-2 py-1 text-xs text-cyan-200 font-mono flex-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-cyan-300 block mb-1">Segundo Turno (Tarde):</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="time" 
                      value={shift2Start}
                      onChange={(e) => setShift2Start(e.target.value)}
                      className="bg-[#03070d] border border-cyan-800 rounded-lg px-2 py-1 text-xs text-cyan-200 font-mono flex-1"
                    />
                    <span className="text-slate-500 text-xs">a</span>
                    <input 
                      type="time" 
                      value={shift2End}
                      onChange={(e) => setShift2End(e.target.value)}
                      className="bg-[#03070d] border border-cyan-800 rounded-lg px-2 py-1 text-xs text-cyan-200 font-mono flex-1"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-mono text-cyan-300 block mb-1">Horario Laboral:</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="time" 
                    value={continuousStart}
                    onChange={(e) => setContinuousStart(e.target.value)}
                    className="bg-[#03070d] border border-cyan-800 rounded-lg px-2 py-1 text-xs text-cyan-200 font-mono flex-1"
                  />
                  <span className="text-slate-500 text-xs">a</span>
                  <input 
                    type="time" 
                    value={continuousEnd}
                    onChange={(e) => setContinuousEnd(e.target.value)}
                    className="bg-[#03070d] border border-cyan-800 rounded-lg px-2 py-1 text-xs text-cyan-200 font-mono flex-1"
                  />
                </div>
              </div>
            )}

            {/* Días laborales */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="text-[11px] font-mono text-slate-400 block mb-1.5">Días en que aplica:</label>
              <div className="flex gap-1">
                {dayLabels.map(d => (
                  <button
                    key={d.num}
                    type="button"
                    onClick={() => toggleWorkDay(d.num)}
                    className={`flex-1 py-1 rounded text-xs font-mono font-bold cursor-pointer transition-colors ${
                      workDays.includes(d.num)
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-black/60 text-slate-500 border border-slate-800'
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
        <div className="bg-[#07111c] border border-cyan-900/50 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide font-mono">3. Entrenamiento Físico</h4>
                <p className="text-xs text-slate-400">¿Tienes bloque de deporte, gimnasio o actividad física?</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setHasTraining(!hasTraining);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                hasTraining ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-black/60 text-slate-500 border-slate-800'
              }`}
            >
              {hasTraining ? 'Activado' : 'No entreno'}
            </button>
          </div>

          {hasTraining && (
            <div className="space-y-3 bg-black/40 border border-slate-800/80 p-3.5 rounded-xl">
              <div>
                <label className="text-[11px] font-mono text-cyan-300 block mb-1">Horario de Entrenamiento:</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="time" 
                    value={trainStart}
                    onChange={(e) => setTrainStart(e.target.value)}
                    className="bg-[#03070d] border border-cyan-800 rounded-lg px-2 py-1 text-xs text-cyan-200 font-mono flex-1"
                  />
                  <span className="text-slate-500 text-xs">a</span>
                  <input 
                    type="time" 
                    value={trainEnd}
                    onChange={(e) => setTrainEnd(e.target.value)}
                    className="bg-[#03070d] border border-cyan-800 rounded-lg px-2 py-1 text-xs text-cyan-200 font-mono flex-1"
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
                      className={`flex-1 py-1 rounded text-xs font-mono font-bold cursor-pointer transition-colors ${
                        trainingDays.includes(d.num)
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-black/60 text-slate-500 border border-slate-800'
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
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                      trainingSplit === 'por_musculo' ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200' : 'bg-black/50 border-slate-800 text-slate-400'
                    }`}
                  >
                    <p className="text-xs font-bold font-mono">Por Grupo Muscular</p>
                    <p className="text-[10px] text-slate-400">Pierna, Espalda, Glúteo, Pecho diario</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTrainingSplit('funcional')}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                      trainingSplit === 'funcional' ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200' : 'bg-black/50 border-slate-800 text-slate-400'
                    }`}
                  >
                    <p className="text-xs font-bold font-mono">Bloque Único General</p>
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
        <div className="bg-[#07111c] border border-cyan-900/50 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide font-mono">4. Tareas de Soporte & Desconexión</h4>
              <p className="text-xs text-slate-400">Pausas biológicas, comida y proyectos personales.</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {/* Almuerzo */}
            <div className="flex items-center justify-between p-2.5 bg-black/40 border border-slate-800/80 rounded-xl">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={hasLunch} 
                  onChange={(e) => setHasLunch(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-200 font-bold">Almuerzo / Comida Principal</span>
              </div>
              <input 
                type="text" 
                value={lunchTime} 
                onChange={(e) => setLunchTime(e.target.value)}
                disabled={!hasLunch}
                className="bg-[#03070d] border border-cyan-900 rounded px-2 py-1 text-xs text-cyan-300 font-mono w-36 text-center outline-none disabled:opacity-40"
              />
            </div>

            {/* Limpieza */}
            <div className="flex items-center justify-between p-2.5 bg-black/40 border border-slate-800/80 rounded-xl">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={hasCleaning} 
                  onChange={(e) => setHasCleaning(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-200 font-bold">Limpieza y Orden del Hogar</span>
              </div>
              <input 
                type="text" 
                value={cleaningTime} 
                onChange={(e) => setCleaningTime(e.target.value)}
                disabled={!hasCleaning}
                className="bg-[#03070d] border border-cyan-900 rounded px-2 py-1 text-xs text-cyan-300 font-mono w-36 text-center outline-none disabled:opacity-40"
              />
            </div>

            {/* Bloque Creativo */}
            <div className="flex items-center justify-between p-2.5 bg-black/40 border border-slate-800/80 rounded-xl">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={hasCreative} 
                  onChange={(e) => setHasCreative(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-200 font-bold">Bloque Creativo / Lectura Nocturna</span>
              </div>
              <input 
                type="text" 
                value={creativeTime} 
                onChange={(e) => setCreativeTime(e.target.value)}
                disabled={!hasCreative}
                className="bg-[#03070d] border border-cyan-900 rounded px-2 py-1 text-xs text-cyan-300 font-mono w-36 text-center outline-none disabled:opacity-40"
              />
            </div>

            {/* Sábado Especial */}
            <div className="flex items-center justify-between p-2.5 bg-black/40 border border-slate-800/80 rounded-xl">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={hasSaturdayClass} 
                  onChange={(e) => setHasSaturdayClass(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-200 font-bold">Sábado: Clase Especial o Tarea Grupal</span>
              </div>
              <input 
                type="text" 
                value={saturdayClassTime} 
                onChange={(e) => setSaturdayClassTime(e.target.value)}
                disabled={!hasSaturdayClass}
                className="bg-[#03070d] border border-cyan-900 rounded px-2 py-1 text-xs text-cyan-300 font-mono w-36 text-center outline-none disabled:opacity-40"
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
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 bg-transparent hover:bg-white/5 text-slate-400 hover:text-white rounded-lg text-xs font-mono cursor-pointer transition-colors"
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
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-lg text-xs font-mono font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all active:scale-95"
          >
            <span>Siguiente</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 rounded-xl text-xs font-mono font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Sintetizar con el Oráculo</span>
          </button>
        )}
      </div>
    </div>
  );
};
