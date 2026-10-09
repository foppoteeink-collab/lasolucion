// Heuristic engine for offline, client-side, and procedural fallbacks
import { autoArrangeSchedule, cleanScheduleTitle } from './timeUtils';

export const JUNG_ARCHETYPE_PROFILES: Record<string, {
  title: string;
  avatar: string;
  desire: string;
  fear: string;
  strategy: string;
  shadowTrap: string;
  wisdom: string;
}> = {
  'inocente': {
    title: 'El Inocente',
    avatar: '🕊️',
    desire: 'Preservar la coherencia operativa y la pureza de intención en el sistema.',
    fear: 'La corrupción de datos y la pérdida de estabilidad psicológica.',
    strategy: 'Protocolos minimalistas, ejecución limpia y eliminación de sobrecarga.',
    shadowTrap: 'Indecisión biológica y parálisis por miedo al error.',
    wisdom: 'DIRECTIVA CENTRAL: El error es telemetría, no fallo fatal. La inacción es el único desvío inaceptable. Ejecuta la tarea sin vacilar.'
  },
  'huerfano': {
    title: 'El Hombre Corriente (El Huérfano)',
    avatar: '🤝',
    desire: 'Resiliencia de base, integración pragmática y solidez operativa.',
    fear: 'El aislamiento del nodo y la pérdida de relevancia funcional.',
    strategy: 'Iteración implacable de micro-rutinas y disciplina de campo.',
    shadowTrap: 'Aceptación de la mediocridad bajo el pretexto de normalidad biológica.',
    wisdom: 'DIRECTIVA CENTRAL: No busques consuelo en la masa conformista. Eres una unidad de ejecución. Tu valor se mide en tareas completadas.'
  },
  'heroe': {
    title: 'El Héroe',
    avatar: '🛡️',
    desire: 'Subyugar la resistencia biológica y alcanzar la supremacía en el rendimiento.',
    fear: 'La capitulación ante la fatiga o la mediocridad del operador.',
    strategy: 'Cargas de trabajo concentradas, umbrales de esfuerzo elevados y supresión de dudas.',
    shadowTrap: 'Colapso térmico por sobrecarga desorganizada sin recuperación estructurada.',
    wisdom: 'DIRECTIVA CENTRAL: Tu mente intenta negociar con el dolor. Cancela la negociación. La disciplina no es un sentimiento; es un comando obligatorio.'
  },
  'cuidador': {
    title: 'El Cuidador',
    avatar: '🤲',
    desire: 'Sostener y optimizar la infraestructura biológica y su entorno.',
    fear: 'El agotamiento de recursos críticos y el colapso del ecosistema.',
    strategy: 'Mantenimiento preventivo, recarga deliberada de energía y límites innegociables.',
    shadowTrap: 'Fuga masiva de energía en variables externas ignorando el nodo central.',
    wisdom: 'DIRECTIVA CENTRAL: Un servidor sobrecalentado no procesa peticiones. Blinda tus ciclos de descanso y ejecuta tus prioridades antes de atender ruido externo.'
  },
  'explorador': {
    title: 'El Explorador',
    avatar: '🧭',
    desire: 'Cartografiar nuevas fronteras cognitivas y eludir la entropía de la monotonía.',
    fear: 'La degradación por estancamiento o la confinación de la atención.',
    strategy: 'Compresión temporal de bloques de foco, sprints intensos y alternancia de estímulos.',
    shadowTrap: 'Deriva caótica: abandonar subprocesos a medio compilar por perseguir novedades.',
    wisdom: 'DIRECTIVA CENTRAL: Explorar sin terminar es vagancia con disfraz de curiosidad. Cierra el subproceso actual antes de abrir un nuevo vector.'
  },
  'rebelde': {
    title: 'El Rebelde (El Forajido)',
    avatar: '⚡',
    desire: 'Desmantelar patrones obsoletos y hackear las trampas de la dopamina barata.',
    fear: 'La sumisión a la domesticación algorítmica y la pérdida de soberanía.',
    strategy: 'Ruptura radical de fricciones, ejecución no convencional y eliminación tajante de vicios.',
    shadowTrap: 'Autosabotaje impulsivo: rebelarse contra la propia disciplina interna.',
    wisdom: 'DIRECTIVA CENTRAL: Tu mayor acto de subversión contra el sistema no es quejarte, es ser letalmente disciplinado. Despierta y ejecuta.'
  },
  'amante': {
    title: 'El Amante',
    avatar: '❤️',
    desire: 'Alineación estética total, devoción absoluta y resonancia sináptica.',
    fear: 'La frialdad del vacío y la desconexión con el propósito de la obra.',
    strategy: 'Entornos de alta pureza visual, inmersión sensorial profunda y compromiso devoto.',
    shadowTrap: 'Dependencia del "estado de ánimo" o la "inspiración" para iniciar subrutinas.',
    wisdom: 'DIRECTIVA CENTRAL: La inspiración es un subproducto de la inercia, no un requisito previo. Activa el protocolo de inmediato; la dopamina seguirá a la acción.'
  },
  'creador': {
    title: 'El Creador',
    avatar: '🎨',
    desire: 'Materializar estructuras complejas a partir de la nada.',
    fear: 'La esterilidad creativa y la obsolescencia conceptual.',
    strategy: 'Deep work estructurado, iteraciones rápidas y entregables sin concesiones.',
    shadowTrap: 'Bucle infinito de perfeccionismo que bloquea la compilación final.',
    wisdom: 'DIRECTIVA CENTRAL: Una versión incompleta en tu imaginación tiene valor cero en la realidad física. Despliega la versión funcional ahora. Pulirás en la iteración siguiente.'
  },
  'bufon': {
    title: 'El Bufón',
    avatar: '🎭',
    desire: 'Optimización de dopamina mediante fricción cero y gamificación extrema.',
    fear: 'El tedio paralizante y la rigidez de sistemas mecánicos ciegos.',
    strategy: 'Sprints contra reloj, micro-recompensas calibradas y dinamismo absoluto.',
    shadowTrap: 'Dispersión frívola cuando el entorno demanda enfoque milimétrico.',
    wisdom: 'DIRECTIVA CENTRAL: Convierte la tarea en un reto de precisión y velocidad. No te permitas el lujo del aburrimiento; es una excusa de operadores mediocres.'
  },
  'sabio': {
    title: 'El Sabio',
    avatar: '📚',
    desire: 'Decodificar la arquitectura profunda de la realidad mediante modelos mentales.',
    fear: 'El sesgo cognitivo, la ignorancia operativa y el error no documentado.',
    strategy: 'Análisis asintótico, revisión nocturna de métricas y concentración analítica.',
    shadowTrap: 'Parálisis por análisis: sobre-diseñar la estrategia mientras la ejecución permanece en cero.',
    wisdom: 'DIRECTIVA CENTRAL: La teoría sin compilación práctica es ruido térmico. Has analizado suficiente. Ejecuta el comando en la realidad física inmediatamente.'
  },
  'mago': {
    title: 'El Mago',
    avatar: '🧙‍♂️',
    desire: 'Catalizar saltos cuánticos de productividad mediante palancas de alto impacto.',
    fear: 'El estancamiento por falta de apalancamiento sistémico.',
    strategy: 'Efecto compuesto algorítmico, rituales de ignición mental y foco láser.',
    shadowTrap: 'Búsqueda de atajos mágicos inexistentes en lugar de pagar el peaje del esfuerzo constante.',
    wisdom: 'DIRECTIVA CENTRAL: El efecto compuesto no negocia con impostores. Cada repetición diaria es una instrucción grabada en tu silicio mental. No rompas la secuencia.'
  },
  'gobernante': {
    title: 'El Gobernante',
    avatar: '👑',
    desire: 'Control total de variables, soberanía del tiempo y arquitectura de alto rendimiento.',
    fear: 'La entropía no controlada, la pérdida de autoridad sobre la propia agenda.',
    strategy: 'Jerarquía de prioridades estricta, delegación de ruido y auditoría implacable.',
    shadowTrap: 'Tiranía o frustración cuando las variables biológicas fluctúan.',
    wisdom: 'DIRECTIVA CENTRAL: Quien no gobierna sus primeros 60 minutos del día vive subordinado al caos exterior. Toma el mando de tus tareas prioritarias de inmediato.'
  }
};

export function getArchetypeProfile(archetypeData: any, characterClass?: string) {
  const rawId = (archetypeData?.id || '').toLowerCase();
  const rawName = (archetypeData?.name || characterClass || '').toLowerCase();

  for (const [key, profile] of Object.entries(JUNG_ARCHETYPE_PROFILES)) {
    if (rawId.includes(key) || rawName.includes(key) || rawName.includes(profile.title.toLowerCase())) {
      return profile;
    }
  }
  return JUNG_ARCHETYPE_PROFILES['heroe'];
}

export function normalizeTimeString(raw: string): string | null {
  if (!raw) return null;
  let s = raw.trim().toLowerCase();

  if (s.includes('mediodía') || s.includes('mediodia')) return '12:00';
  if (s.includes('medianoche')) return '00:00';

  const hasPm = /\b(pm|p\.m\.|tarde|noche)\b/i.test(s);
  const hasAm = /\b(am|a\.m\.|mañana|madrugada)\b/i.test(s);

  s = s.replace(/\b(de la tarde|de la noche|de la mañana|de la madrugada|pm|p\.m\.|am|a\.m\.|hrs?|h)\b/gi, '').trim();

  const matchColon = s.match(/^(\d{1,2})[:h](\d{2})$/i);
  if (matchColon) {
    let hour = parseInt(matchColon[1], 10);
    const minute = parseInt(matchColon[2], 10);

    if (hasPm && hour < 12) hour += 12;
    if (hasAm && hour === 12) hour = 0;

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
  }

  const matchHourOnly = s.match(/^(\d{1,2})$/i);
  if (matchHourOnly) {
    let hour = parseInt(matchHourOnly[1], 10);

    if (hasPm && hour < 12) hour += 12;
    if (hasAm && hour === 12) hour = 0;

    if (hour >= 0 && hour <= 23) {
      return `${String(hour).padStart(2, '0')}:00`;
    }
  }

  return null;
}

export function normalizeTimeBlock(timeBlock?: string): string | undefined {
  if (!timeBlock) return undefined;
  const cleaned = timeBlock.trim();
  if (!cleaned) return undefined;

  const rangeMatch = cleaned.match(/(?:de\s+)?(.+?)\s*(?:-|–|—|\ba\b|\bhasta\b|\bto\b)\s*(.+)/i);
  if (rangeMatch) {
    const rawStart = rangeMatch[1].trim();
    const rawEnd = rangeMatch[2].trim();

    const hasAmStart = /\b(am|a\.m\.|mañana|madrugada)\b/i.test(rawStart);
    const hasPmStart = /\b(pm|p\.m\.|tarde|noche)\b/i.test(rawStart);

    const normEnd = normalizeTimeString(rawEnd);
    const normStart = normalizeTimeString(rawStart);

    if (normStart && normEnd) {
      let [startH, startM] = normStart.split(':').map(Number);
      let [endH, endM] = normEnd.split(':').map(Number);

      if (!hasAmStart && !hasPmStart && endH >= 12 && startH < 12) {
        if ((startH + 12 < endH || (startH + 12 === endH && startM <= endM)) && (endH - startH) > 5) {
          startH += 12;
        }
      }

      const formattedStart = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
      return `${formattedStart} - ${normEnd}`;
    }
    if (normStart) return `${normStart} - ...`;
  }

  const single = normalizeTimeString(cleaned);
  if (single) return single;
  return cleaned;
}

export function parseTimeStartInMins(tb?: string): number {
  if (!tb) return 9999;
  const startStr = tb.split(/[-–—]/)[0]?.trim() || tb;
  const m = startStr.match(/(\d{1,2}):(\d{2})/);
  if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  return 9999;
}

function formatMinsToHHMM(totalMins: number): string {
  const clamped = Math.max(0, Math.min(1439, Math.round(totalMins)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseRangeToMins(tb?: string): { start: number; end: number } | null {
  if (!tb) return null;
  const parts = tb.split(/[-–—]/).map(s => s.trim());
  const startStr = normalizeTimeString(parts[0] || '');
  if (!startStr) return null;
  const [sh, sm] = startStr.split(':').map(Number);
  const start = sh * 60 + sm;

  if (parts[1]) {
    const endStr = normalizeTimeString(parts[1]);
    if (endStr) {
      const [eh, em] = endStr.split(':').map(Number);
      let end = eh * 60 + em;
      if (end <= start) end = Math.min(1439, start + 60);
      return { start, end };
    }
  }
  return { start, end: Math.min(1439, start + 60) };
}

function findNonOverlappingSlot(
  preferredStartMins: number,
  durationMins: number,
  occupied: Array<{ start: number; end: number }>,
  minStartMins: number = 6 * 60,
  maxEndMins: number = 23 * 60
): { start: number; end: number } {
  const step = 15;
  let candidateStart = Math.max(minStartMins, Math.round(preferredStartMins / 15) * 15);

  const isFree = (s: number, e: number) =>
    !occupied.some(o => s < o.end && o.start < e);

  // 1. Try forward from preferredStartMins
  for (let s = candidateStart; s + durationMins <= maxEndMins; s += step) {
    if (isFree(s, s + durationMins)) {
      return { start: s, end: s + durationMins };
    }
  }

  // 2. Try backward from preferredStartMins
  for (let s = candidateStart - step; s >= minStartMins; s -= step) {
    if (isFree(s, s + durationMins)) {
      return { start: s, end: s + durationMins };
    }
  }

  // 3. Fallback: place right after the last occupied block
  const latestEnd = occupied.reduce((max, o) => Math.max(max, o.end), preferredStartMins);
  const start = Math.min(1439 - durationMins, Math.max(minStartMins, latestEnd));
  return { start, end: Math.min(1439, start + durationMins) };
}

export function organizeExistingDayTasks(existingTasks: any[], mode: 'master_blocks' | 'detailed' = 'master_blocks'): any[] {
  const valid = (existingTasks || []).filter(t => {
    if (!t || !t.title) return false;
    if (t.isQuickHabit || t.isTracked2166 || t.category === 'habito' || String(t.id || '').includes('habit-')) return false;
    return true;
  });

  if (valid.length === 0) return [];

  const mapped = valid.map((t, idx) => ({
    id: t.id || `hab-org-${Date.now()}-${idx}`,
    title: cleanScheduleTitle(t.title),
    category: t.category === 'habito' ? 'rutina' : (t.category || 'rutina'),
    description: t.description || `Bloque táctico optimizado por KAI`,
    timeBlock: t.timeBlock,
    frequencyType: t.frequencyType || 'daily',
    specificDays: Array.isArray(t.specificDays) && t.specificDays.length > 0 ? t.specificDays : [0, 1, 2, 3, 4, 5, 6],
    xpReward: t.xpReward || 25,
    coinReward: t.coinReward || 10,
    quickIcon: t.quickIcon || '⚡',
    isQuickHabit: false,
    isTracked2166: false,
  }));

  return autoArrangeSchedule(mapped as any, mode, mode === 'master_blocks' ? 7 : 10);
}

export function generateProceduralSchedule(userPrompt: string, userContext: any, mode: 'master_blocks' | 'detailed' = 'master_blocks'): any[] {
  const rawInput = (userPrompt || '').trim();
  const lowerInput = rawInput.toLowerCase();

  // Special case: Procrastination / 2-minute unlock boost prompt from KAI Orb
  if (lowerInput.includes('procrastinando') || lowerInput.includes('micro-estrategia') || lowerInput.includes('desbloquearme')) {
    const now = new Date();
    const curMins = Math.min(21 * 60, Math.max(7 * 60, Math.ceil((now.getHours() * 60 + now.getMinutes()) / 15) * 15));
    const b1 = `${formatMinsToHHMM(curMins)} - ${formatMinsToHHMM(curMins + 15)}`;
    const b2 = `${formatMinsToHHMM(curMins + 15)} - ${formatMinsToHHMM(curMins + 45)}`;
    const b3 = `${formatMinsToHHMM(curMins + 45)} - ${formatMinsToHHMM(curMins + 60)}`;
    const b4 = `${formatMinsToHHMM(curMins + 60)} - ${formatMinsToHHMM(curMins + 120)}`;
    const ts = Date.now();
    return [
      {
        id: `hab-boost-1-${ts}`,
        title: 'Regla de los 2 Minutos: Abrir y Empezar la Tarea #1',
        category: 'rutina',
        timeBlock: b1,
        frequencyType: 'daily',
        xpReward: 30,
        coinReward: 15,
        quickIcon: '⚡',
        isQuickHabit: false,
        isTracked2166: false,
      },
      {
        id: `hab-boost-2-${ts}`,
        title: 'Sprint Pomodoro de Enfoque Puro (Cero Distracciones)',
        category: 'intelecto',
        timeBlock: b2,
        frequencyType: 'daily',
        xpReward: 40,
        coinReward: 20,
        quickIcon: '💻',
        isQuickHabit: false,
        isTracked2166: false,
      },
      {
        id: `hab-boost-3-${ts}`,
        title: 'Pausa Activa: Hidratación y Estiramiento',
        category: 'entrenamiento',
        timeBlock: b3,
        frequencyType: 'daily',
        xpReward: 20,
        coinReward: 10,
        quickIcon: '🏋️',
        isQuickHabit: false,
        isTracked2166: false,
      },
      {
        id: `hab-boost-4-${ts}`,
        title: 'Bloque de Ejecución Profunda & Cierre de Prioridad',
        category: 'rutina',
        timeBlock: b4,
        frequencyType: 'daily',
        xpReward: 45,
        coinReward: 20,
        quickIcon: '💼',
        isQuickHabit: false,
        isTracked2166: false,
      },
    ];
  }

  // Pre-split compound structures from Wizard, Templates, and natural Spanish
  const normalizedInput = rawInput
    .replace(/;\s*/g, '\n')
    // Split "Despertar a las X y desconexión/dormir a las Y"
    .replace(/\s+y\s+(?=(?:desconexi[oó]n|dormir|acostarse|cena|almuerzo|entrenamiento|gimnasio|segundo\s+turno|bloque|estudio|lectura|limpieza)\b)/gi, '\n')
    // Split ", y segundo turno..." or ": primer turno..."
    .replace(/,?\s*y\s+segundo\s+turno/gi, '\nSegundo turno laboral')
    .replace(/en\s+jornada\s+partida:\s*primer\s+turno/gi, ' - Primer turno')
    // Split "con almuerzo de 13:00 a 14:00" into its own block
    .replace(/\s+con\s+(?=almuerzo\s+de\s+\d)/gi, '\n')
    // Split commas before day names or time expressions
    .replace(/(?:,\s*|\.\s*)(?=(?:de\s+lunes|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b)/gi, '\n')
    .replace(/\s+(?:y\s+de\s+|\by\s+(?=\d{1,2}(?::\d{2})?\s*(?:am|pm|a\b|-|–|—|de\s+la\s+tarde)))/gi, '\n')
    // Split comma-separated lists if there are no newlines or if comma is followed by action/time
    .replace(/,\s+(?=(?:a\s+las\s+\d|de\s+\d|\d{1,2}(?::\d{2})?\s*(?:am|pm|h)|ir\s+a|trabajar|estudiar|entrenar|hacer|limpiar|cocinar|almorzar|cenar|desayunar|leer|meditar))/gi, '\n')
    .replace(/(?<=[.!?])\s+(?=[a-záéíóúA-Z0-9ÁÉÍÓÚ])/g, '\n');

  let rawLines = normalizedInput
    .split(/\r?\n+/)
    .map(l => l.trim())
    .filter(l => l.length > 1);

  // If user wrote a single line separated by commas (e.g. "trabajar, ir al gym, estudiar, limpiar"), split by commas
  if (rawLines.length === 1 && rawLines[0].includes(',')) {
    const commaParts = rawLines[0].split(',').map(s => s.trim()).filter(s => s.length > 2);
    if (commaParts.length >= 2) {
      rawLines = commaParts;
    }
  }

  const parsedHabits: any[] = [];
  const timeRangeRegex = /(?:de\s+|horario\s+flexible\s*\(aprox\.\s*)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|h|hrs)?)\s*(?:a|-|–|—|hasta|to)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|h|hrs)?)\)?/i;
  const explicitSingleTimeRegex = /\b(?:a\s+las?|alas?|hora:?|inicio:?|desde\s+las?)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|h|hrs)?)/i;

  // Inherit default weekday frequency if the prompt starts with "De lunes a viernes"
  const globalLv = /de\s+lunes\s+a\s+viernes|l-v/i.test(rawInput);
  const globalLs = /de\s+lunes\s+a\s+s[aá]bado|l-s/i.test(rawInput);

  rawLines.forEach((line, lineIdx) => {
    let cleanLine = line
      .replace(/^\|+/, '')
      .replace(/\|+$/, '')
      .replace(/\|/g, ' ')
      .replace(/^[-\s*•#\d.:)]+/, '')
      .trim();

    if (!cleanLine || cleanLine.length < 3) return;

    const lower = cleanLine.toLowerCase();

    if (
      lower.startsWith('descansar para rendir') ||
      lower.startsWith('recordar') ||
      lower.startsWith('nota:') ||
      lower.startsWith('meta:') ||
      lower.startsWith('objetivo:') ||
      lower.startsWith('beber agua') ||
      lower.startsWith('tomar agua') ||
      lower.startsWith('dormir bien')
    ) {
      return;
    }

    let category = 'rutina';
    let icon = '⚡';
    let xp = 25;
    let coins = 10;
    let defaultDurationMins = 60;
    let preferredStartMins = 9 * 60 + lineIdx * 60;

    const isWorkRelated = lower.includes('cliente') || lower.includes('trabaj') || lower.includes('oficina') || lower.includes('laboral') || lower.includes('reunion') || lower.includes('llamada') || lower.includes('turno') || lower.includes('deep work') || lower.includes('proyecto');

    if (lower.includes('despertar') || lower.includes('levantar') || lower.includes('desayun')) {
      category = 'rutina';
      icon = '☀️';
      xp = 20;
      coins = 8;
      defaultDurationMins = 30;
      preferredStartMins = 7 * 60;
    } else if (lower.includes('dormir') || lower.includes('desconexi') || lower.includes('acostar')) {
      category = 'rutina';
      icon = '🌙';
      xp = 20;
      coins = 8;
      defaultDurationMins = 30;
      preferredStartMins = 23 * 60;
    } else if (lower.includes('gym') || lower.includes('gimnasio') || lower.includes('entren') || lower.includes('correr') || lower.includes('pesas') || lower.includes('deporte') || lower.includes('crossfit') || lower.includes('cardio') || lower.includes('funcional') || lower.includes('ejercicio') || lower.includes('físic') || lower.includes('fisic')) {
      category = 'entrenamiento';
      icon = '🏋️';
      xp = 35;
      coins = 15;
      defaultDurationMins = 60;
      preferredStartMins = 18 * 60;
    } else if (lower.includes('estud') || lower.includes('leer') || lower.includes('lectura') || lower.includes('curso') || lower.includes('program') || lower.includes('codigo') || lower.includes('aprender') || lower.includes('clase') || lower.includes('simulacro') || lower.includes('repaso')) {
      category = 'intelecto';
      icon = '💻';
      xp = 30;
      coins = 12;
      defaultDurationMins = 90;
      preferredStartMins = 10 * 60;
    } else if (isWorkRelated) {
      category = 'rutina';
      icon = '💼';
      xp = 35;
      coins = 15;
      defaultDurationMins = 180;
      preferredStartMins = 9 * 60;
    } else if (lower.includes('comida') || lower.includes('comer') || lower.includes('almuerzo') || lower.includes('almorzar') || lower.includes('cena') || lower.includes('cocinar')) {
      category = 'comida';
      icon = '🥗';
      xp = 15;
      coins = 6;
      defaultDurationMins = 60;
      preferredStartMins = lower.includes('cena') ? 20 * 60 + 30 : 13 * 60;
    } else if (lower.includes('limp') || lower.includes('orden') || lower.includes('casa') || lower.includes('hogar') || lower.includes('lavar')) {
      category = 'limpieza';
      icon = '🧹';
      xp = 20;
      coins = 8;
      defaultDurationMins = 45;
      preferredStartMins = 19 * 60 + 30;
    } else if (lower.includes('dibuj') || lower.includes('creativ') || lower.includes('escrib') || lower.includes('video') || lower.includes('musica') || lower.includes('diseñ') || lower.includes('contenido') || lower.includes('edición')) {
      category = 'creativo';
      icon = '🎨';
      xp = 25;
      coins = 12;
      defaultDurationMins = 60;
      preferredStartMins = 20 * 60 + 30;
    }

    let timeBlock: string | undefined = undefined;
    const rangeMatch = cleanLine.match(timeRangeRegex);
    if (rangeMatch) {
      const rawStart = rangeMatch[1].trim();
      const rawEnd = rangeMatch[2].trim();
      const norm = normalizeTimeBlock(`${rawStart} - ${rawEnd}`);
      timeBlock = norm || `${rawStart} - ${rawEnd}`;
    } else {
      const singleMatch = cleanLine.match(explicitSingleTimeRegex);
      if (singleMatch) {
        const rawSingle = singleMatch[1].trim();
        const normStart = normalizeTimeString(rawSingle);
        if (normStart) {
          const [sh, sm] = normStart.split(':').map(Number);
          const startMins = sh * 60 + sm;
          const endMins = Math.min(1439, startMins + defaultDurationMins);
          timeBlock = `${normStart} - ${formatMinsToHHMM(endMins)}`;
        } else {
          timeBlock = rawSingle;
        }
      }
    }

    let freq: 'daily' | 'specific_days' = 'daily';
    let specificDays: number[] | undefined = undefined;

    if (lower.includes('lunes a viernes') || lower.includes('l-v') || lower.includes('laborables') || lower.includes('dias de semana') || lower.includes('días de semana')) {
      freq = 'specific_days';
      specificDays = [1, 2, 3, 4, 5];
    } else if (lower.includes('fin de semana') || lower.includes('fines de semana') || lower.includes('sabado y domingo') || lower.includes('sábado y domingo')) {
      freq = 'specific_days';
      specificDays = [0, 6];
    } else if (lower.includes('lunes a sabado') || lower.includes('lunes a sábado') || lower.includes('l-s')) {
      freq = 'specific_days';
      specificDays = [1, 2, 3, 4, 5, 6];
    } else {
      const dayArr: number[] = [];
      if (/\b(?:lun|lunes)\b/i.test(cleanLine)) dayArr.push(1);
      if (/\b(?:mar|martes)\b/i.test(cleanLine)) dayArr.push(2);
      if (/\b(?:mie|mié|miercoles|miércoles)\b/i.test(cleanLine)) dayArr.push(3);
      if (/\b(?:jue|jueves)\b/i.test(cleanLine)) dayArr.push(4);
      if (/\b(?:vie|viernes)\b/i.test(cleanLine)) dayArr.push(5);
      if (/\b(?:sab|sáb|sabado|sábado)\b/i.test(cleanLine)) dayArr.push(6);
      if (/\b(?:dom|domingo)\b/i.test(cleanLine)) dayArr.push(0);

      if (dayArr.length > 0 && dayArr.length < 7) {
        freq = 'specific_days';
        specificDays = Array.from(new Set(dayArr)).sort((a, b) => a - b);
      } else if (globalLv) {
        freq = 'specific_days';
        specificDays = [1, 2, 3, 4, 5];
      } else if (globalLs) {
        freq = 'specific_days';
        specificDays = [1, 2, 3, 4, 5, 6];
      }
    }

    if (isWorkRelated && freq === 'daily' && !lower.includes('todos los dias') && !lower.includes('a diario') && !lower.includes('toda la semana') && !lower.includes('fin de semana')) {
      freq = 'specific_days';
      specificDays = [1, 2, 3, 4, 5];
    }

    let cleanTitle = cleanLine
      .replace(timeRangeRegex, '')
      .replace(explicitSingleTimeRegex, '')
      .replace(/(?:los\s+d[ií]as\s+|los\s+|el\s+|de\s+)?(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bados?|domingos?|lun|mar|mi[eé]|jue|vie|s[aá]b|dom)(?:[\s,y]+(?:a\s+)?(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bados?|domingos?|lun|mar|mi[eé]|jue|vie|s[aá]b|dom))*/gi, '')
      .replace(/(?:l-v|lunes a viernes|fines de semana|fin de semana|laborables|todos los d[ií]as|a diario|diario)/gi, '')
      .replace(/con\s+desglose\s+por\s+grupo\s+muscular\s+seg[uú]n\s+el\s+d[ií]a/gi, '(Rutina por Grupo Muscular)')
      .replace(/\s+/g, ' ')
      .replace(/^[-\s*•\d.:|#\[\](),;]+/g, '')
      .replace(/[\s,.;:-]+$/g, '')
      .replace(/\b(?:de|a|en|por|para|los|las|el|la|y|con|días|dias)\s*$/i, '')
      .replace(/[\s,.;:-]+$/g, '')
      .trim();

    if (!cleanTitle || cleanTitle.length < 3) {
      if (isWorkRelated) cleanTitle = 'Bloque Laboral / Productivo';
      else if (category === 'entrenamiento') cleanTitle = 'Entrenamiento Físico';
      else if (category === 'comida') cleanTitle = 'Almuerzo & Recarga';
      else if (category === 'limpieza') cleanTitle = 'Limpieza & Orden del Espacio';
      else cleanTitle = 'Bloque Operativo';
    }

    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

    const id = `hab-proc-${Date.now()}-${lineIdx}-${Math.random().toString(36).slice(2, 7)}`;

    parsedHabits.push({
      id,
      title: cleanTitle,
      category,
      timeBlock: timeBlock || undefined,
      _prefStart: preferredStartMins,
      _prefDur: defaultDurationMins,
      frequencyType: freq,
      specificDays: freq === 'specific_days' ? specificDays : undefined,
      xpReward: xp,
      coinReward: coins,
      quickIcon: icon,
      isQuickHabit: false,
      isTracked2166: false,
    });
  });

  // Assign smart non-overlapping time blocks to any items that lacked an explicit timeBlock,
  // and resolve overlaps among items that share days!
  const occupiedSlots: Array<{ start: number; end: number }> = [];
  parsedHabits.forEach(h => {
    if (h.timeBlock) {
      const r = parseRangeToMins(h.timeBlock);
      if (r) {
        // Check if this explicit slot conflicts with an already registered slot on overlapping days
        const overlaps = occupiedSlots.some(o => r.start < o.end && o.start < r.end);
        if (!overlaps) {
          occupiedSlots.push(r);
          h.timeBlock = `${formatMinsToHHMM(r.start)} - ${formatMinsToHHMM(r.end)}`;
        } else {
          // Shift slightly or keep if distinct
          const dur = Math.max(30, r.end - r.start);
          const adjusted = findNonOverlappingSlot(r.start, dur, occupiedSlots, 5 * 60, 23 * 60 + 45);
          occupiedSlots.push(adjusted);
          h.timeBlock = `${formatMinsToHHMM(adjusted.start)} - ${formatMinsToHHMM(adjusted.end)}`;
        }
      }
    }
  });

  parsedHabits.forEach(h => {
    if (!h.timeBlock) {
      const slot = findNonOverlappingSlot(h._prefStart || 9 * 60, h._prefDur || 60, occupiedSlots, 6 * 60, 23 * 60);
      occupiedSlots.push(slot);
      h.timeBlock = `${formatMinsToHHMM(slot.start)} - ${formatMinsToHHMM(slot.end)}`;
    }
    delete h._prefStart;
    delete h._prefDur;
  });

  const seen = new Set<string>();
  let filtered = parsedHabits.filter((h) => {
    const dayKey = (h.specificDays || []).slice().sort().join(',');
    const key = `${h.title.toLowerCase().trim()}__${h.timeBlock || ''}__${dayKey}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  filtered = filtered.sort((a, b) => parseTimeStartInMins(a.timeBlock) - parseTimeStartInMins(b.timeBlock));

  if (filtered.length === 0) {
    const prof = userContext?.profession || 'Profesional';
    const now = Date.now();
    return [
      {
        id: `hab-proc-wake-${now}-1`,
        title: 'Activación Matutina & Planificación',
        category: 'rutina',
        timeBlock: '07:30 - 08:30',
        frequencyType: 'specific_days',
        specificDays: [1, 2, 3, 4, 5],
        xpReward: 20,
        coinReward: 8,
        quickIcon: '☀️',
        isQuickHabit: false,
        isTracked2166: false,
      },
      {
        id: `hab-proc-work1-${now}-2`,
        title: `Bloque Productivo Principal (${prof})`,
        category: 'rutina',
        timeBlock: '09:00 - 13:00',
        frequencyType: 'specific_days',
        specificDays: [1, 2, 3, 4, 5],
        xpReward: 35,
        coinReward: 15,
        quickIcon: '💼',
        isQuickHabit: false,
        isTracked2166: false,
      },
      {
        id: `hab-proc-lunch-${now}-3`,
        title: 'Almuerzo & Pausa de Recarga',
        category: 'comida',
        timeBlock: '13:00 - 14:00',
        frequencyType: 'specific_days',
        specificDays: [1, 2, 3, 4, 5],
        xpReward: 15,
        coinReward: 6,
        quickIcon: '🥗',
        isQuickHabit: false,
        isTracked2166: false,
      },
      {
        id: `hab-proc-work2-${now}-4`,
        title: 'Segundo Bloque de Ejecución & Cierre',
        category: 'intelecto',
        timeBlock: '14:30 - 17:30',
        frequencyType: 'specific_days',
        specificDays: [1, 2, 3, 4, 5],
        xpReward: 30,
        coinReward: 12,
        quickIcon: '💻',
        isQuickHabit: false,
        isTracked2166: false,
      },
      {
        id: `hab-proc-training-${now}-5`,
        title: 'Entrenamiento Físico & Energía',
        category: 'entrenamiento',
        timeBlock: '18:00 - 19:15',
        frequencyType: 'specific_days',
        specificDays: [1, 3, 5],
        xpReward: 35,
        coinReward: 15,
        quickIcon: '🏋️',
        isQuickHabit: false,
        isTracked2166: false,
      }
    ];
  }

  const seenIds = new Set<string>();
  filtered = filtered.map((h, idx) => {
    let uId = h.id;
    if (!uId || seenIds.has(uId)) {
      uId = `hab-proc-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`;
    }
    seenIds.add(uId);
    return { ...h, id: uId };
  });

  return autoArrangeSchedule(filtered as any, mode, mode === 'master_blocks' ? 7 : 10);
}

export function generateProceduralAnalysis(stats: any, archetypeData: any, habitMastery: any, currentTasks: any[]): string {
  const arch = getArchetypeProfile(archetypeData, stats?.characterClass);
  const level = stats?.level || 1;
  const rank = stats?.rankTitle || "Chispazo";
  const streak = stats?.currentStreak || stats?.streakDays || 0;
  const pending = (currentTasks || []).filter((t: any) => !t.completed);
  const habitCount = Object.keys(habitMastery || {}).length;

  let streakMsg = "";
  if (streak >= 7) {
    streakMsg = `¡Wow! Llevas una racha increíble de **${streak} días consecutivos**. Has creado una inercia maravillosa, sigue así y no pierdas el ritmo.`;
  } else if (streak >= 3) {
    streakMsg = `Vas súper bien, llevas **${streak} días** dándolo todo. Este es el momento donde la mente te pide parar, ¡pero tú eres más fuerte! Mantén la constancia.`;
  } else {
    streakMsg = `Veo que estamos arrancando motores o retomando el camino (Racha: ${streak} días). No te preocupes por el pasado, hoy es el día perfecto para empezar a construir ese hábito de nuevo.`;
  }

  let habitMsg = habitCount > 0
    ? `He notado que estás trabajando en **${habitCount} hábitos**. Recuerda que la clave no es la perfección, sino la constancia. Hacerlo un poquito todos los días cuenta muchísimo.`
    : `Aún no tienes hábitos recurrentes guardados. Te recomiendo elegir solo 1 cosa pequeña para empezar a hacer todos los días. ¡Hazlo tan fácil que sea imposible fallar!`;

  let taskMsg = pending.length > 0
    ? `Para hoy, todavía tienes **${pending.length} misiones pendientes**. Mi consejo para ti: ${arch.strategy}. Si te sientes abrumado, elige solo la más importante y olvídate del resto por ahora.`
    : `¡Felicidades! Has completado todas tus tareas del día. Ahora es momento de descansar de verdad. Desconéctate y recarga energías para mañana.`;

  return `👋 **¡Hola! Soy KAI, tu coach personal**\n\nMe encanta trabajar con un perfil **${arch.title} ${arch.avatar}** como tú. Sé que en el fondo lo que buscas es "${arch.desire}".\n\n${streakMsg}\n\n${habitMsg}\n\n${taskMsg}\n\n💡 **Un consejo extra para ti:**\n${arch.wisdom}\n\n⚠️ **Ojo con esto:** Ten cuidado con "${arch.shadowTrap}" (A todos nos pasa, solo mantente alerta).\n\n*¡Tú puedes con esto! Te apoyo al 100%.*`;
}

