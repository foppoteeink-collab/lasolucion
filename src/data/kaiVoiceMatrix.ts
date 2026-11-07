export type KaiVoiceTone = 'coach' | 'disciplinado' | 'ordenado';

export type KaiTriggerEvent =
  | 'DAY_START'
  | 'STREAK_WARNING'
  | 'EPIC_TASK_CLEARED'
  | 'NIGHTLY_CLOSE_SUCCESS'
  | 'NIGHTLY_CLOSE_HARD'
  | 'MASTERY_21';

export const KAI_VOICE_TONE_CONFIG: Record<
  KaiVoiceTone,
  { label: string; description: string; preview: string; icon: string }
> = {
  coach: {
    label: 'Coach de Vida',
    description: 'Empático, motivador y constructivo. Cree en ti y te anima sin rodeos.',
    preview: 'Nuevo día para avanzar. Da ese primer paso con confianza.',
    icon: 'heart',
  },
  disciplinado: {
    label: 'Disciplinado',
    description: 'Firme, directo y sin excusas. Enfocado 100% en constancia y metas.',
    preview: 'El plan está trazado. Menos dudas y más ejecución hoy.',
    icon: 'shield',
  },
  ordenado: {
    label: 'Ordenado / Metódico',
    description: 'Tranquilo, claro y priorizado. Enfoque paso a paso sin saturación.',
    preview: 'Día organizado. Vamos a resolver una sola prioridad a la vez.',
    icon: 'layers',
  },
};

export const KAI_VOICE_MATRIX: Record<KaiTriggerEvent, Record<KaiVoiceTone, string>> = {
  DAY_START: {
    coach: 'Nuevo día para avanzar. Da ese primer paso con confianza.', // 10 palabras
    disciplinado: 'El plan está trazado. Menos dudas y más ejecución hoy.', // 10 palabras
    ordenado: 'Día organizado. Vamos a resolver una sola prioridad a la vez.', // 11 palabras
  },
  STREAK_WARNING: {
    coach: 'Tu racha vale mucho esfuerzo. Haz una tarea y protégela.', // 10 palabras
    disciplinado: 'No tires tu racha por pereza. Cumple aunque cueste hoy.', // 10 palabras
    ordenado: 'La tarde se acaba. Completa un pendiente y mantén el orden.', // 11 palabras
  },
  EPIC_TASK_CLEARED: {
    coach: '¡Gran victoria hoy! Demostraste de qué estás hecho con esa tarea.', // 11 palabras
    disciplinado: 'Misión difícil completada. Así es como se construye la verdadera disciplina.', // 11 palabras
    ordenado: 'Objetivo principal resuelto. Has liberado el bloque más pesado del día.', // 11 palabras
  },
  NIGHTLY_CLOSE_SUCCESS: {
    coach: 'Día completado con éxito. Descansa con orgullo por tu gran esfuerzo.', // 11 palabras
    disciplinado: 'Cuota diaria cumplida. Descanso merecido, mañana mantenemos este mismo ritmo.', // 10 palabras
    ordenado: 'Jornada en orden. Todas las prioridades cubiertas, hora de desconectar.', // 10 palabras
  },
  NIGHTLY_CLOSE_HARD: {
    coach: 'Hoy fue retador. Descansa bien, mañana volvemos con más fuerza.', // 10 palabras
    disciplinado: 'Faltó empuje hoy. Duerme temprano y mañana corregimos el rumbo.', // 10 palabras
    ordenado: 'Día cerrado. Deja todo anotado, desconéctate y recarga energía hoy.', // 10 palabras
  },
  MASTERY_21: {
    coach: '¡21 días continuos de racha! Esto ya es parte de ti.', // 10 palabras
    disciplinado: '21 días de disciplina ininterrumpida. Has forjado un hábito sólido.', // 10 palabras
    ordenado: '21 ciclos completados. La constancia ha creado una rutina automática impecable.', // 10 palabras
  },
};

export function getKaiPhrase(event: KaiTriggerEvent, tone: KaiVoiceTone = 'coach'): string {
  return KAI_VOICE_MATRIX[event]?.[tone] || KAI_VOICE_MATRIX[event]?.coach;
}
