import React from 'react';
import { Sparkles, Briefcase, GraduationCap, Laptop, Moon, Dumbbell, Zap } from 'lucide-react';
import { soundFX } from '../../utils/audio';

interface OracleTemplatesProps {
  onSelectTemplate: (prompt: string, title: string) => void;
}

export const OracleTemplates: React.FC<OracleTemplatesProps> = ({ onSelectTemplate }) => {
  const templates = [
    {
      id: 'productividad-integral',
      title: 'Productividad Integral & Bienestar',
      icon: <Briefcase className="w-4 h-4 text-cyan-400" />,
      tag: 'Equilibrado',
      desc: 'Jornada laboral diurna balanceada con hábitos de salud, bloque de almuerzo, actividad física y descanso reparador.',
      prompt: 'De lunes a viernes despertar a las 07:00. Desayuno y preparación de 07:30 a 08:30. Bloque laboral o productivo de 09:00 a 17:00 con almuerzo de 13:00 a 14:00. Ejercicio y entrenamiento de 18:00 a 19:15. Cena saludable y tiempo libre de 20:00 a 22:00. Desconexión y dormir a las 23:00.'
    },
    {
      id: 'oficina-corporativo',
      title: 'Oficina / Corporativo 9 a 17',
      icon: <Laptop className="w-4 h-4 text-indigo-400" />,
      tag: 'Estándar',
      desc: 'Jornada continua de oficina, pausa de almuerzo saludable, gimnasio vespertino y desconexión.',
      prompt: 'De lunes a viernes despertar a las 06:30. Desayuno y preparación de 07:00 a 08:00. Trabajo y oficina de 08:30 a 17:30 con almuerzo de 13:00 a 14:00. Gimnasio y entrenamiento de 18:30 a 19:45. Cena y descanso de 20:30 a 21:30. Dormir a las 23:00.'
    },
    {
      id: 'estudiante-opositor',
      title: 'Estudiante & Oposiciones',
      icon: <GraduationCap className="w-4 h-4 text-emerald-400" />,
      tag: 'Alto Enfoque',
      desc: 'Bloques matutinos de estudio profundo, repaso vespertino, despeje físico y lectura.',
      prompt: 'De lunes a sábado despertar a las 06:00. Bloque 1 de estudio intensivo de 07:00 a 12:30. Almuerzo y descanso de 12:30 a 14:00. Bloque 2 de simulacros y repaso de 14:30 a 18:00. Deporte y despeje de 18:30 a 19:30. Cena y lectura ligera de 20:30 a 22:00. Dormir a las 22:30.'
    },
    {
      id: 'freelance-creador',
      title: 'Freelance & Creador Digital',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      tag: 'Creativo',
      desc: 'Deep work sin distracciones en la mañana, gestión de clientes por la tarde y producción creativa.',
      prompt: 'De lunes a viernes despertar a las 07:30. Deep Work de creación de 08:30 a 12:30. Almuerzo de 12:30 a 13:30. Reuniones, emails y entrega de proyectos de 14:00 a 17:30. Entrenamiento funcional de 18:00 a 19:00. Producción de contenido y edición de 20:00 a 22:00.'
    },
    {
      id: 'turno-nocturno',
      title: 'Turno Nocturno / Rotativo',
      icon: <Moon className="w-4 h-4 text-purple-400" />,
      tag: 'Nocturno',
      desc: 'Rutina adaptada con sueño matutino, entreno diurno y bloque laboral nocturno.',
      prompt: 'Despertar a las 14:00 y almuerzo de 14:30 a 15:30. Entrenamiento y activación de 16:00 a 17:30. Cena y preparación de 18:30 a 19:30. Jornada laboral nocturna de 22:00 a 06:00. Llegada a casa y descanso/sueño de 07:00 a 14:00.'
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          Plantillas Rápidas por Arquetipo
        </span>
        <span className="text-[11px] text-slate-500 font-mono">1 Clic para Cargar</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {templates.map(tpl => (
          <div
            key={tpl.id}
            onClick={() => {
              soundFX.playClick();
              onSelectTemplate(tpl.prompt, tpl.title);
            }}
            className="p-3 bg-[#07111c] hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition-all cursor-pointer group flex flex-col justify-between gap-2 shadow-sm active:scale-[0.98]"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-mono font-bold text-xs text-slate-200 group-hover:text-cyan-300 transition-colors">
                  {tpl.icon}
                  <span>{tpl.title}</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/60 border border-slate-800 text-slate-400 uppercase font-semibold">
                  {tpl.tag}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-snug line-clamp-2">
                {tpl.desc}
              </p>
            </div>
            
            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-cyan-400">
              <span>Cargar en el Oráculo →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
