// Heuristic engine for offline, client-side, and procedural fallbacks

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

export function generateProceduralSchedule(userPrompt: string, userContext: any, mode: 'master_blocks' | 'detailed' = 'master_blocks'): any[] {
  const normalizedInput = (userPrompt || '')
    .replace(/;\s*/g, '\n')
    .replace(/(?:,\s*|\.\s*)(?=(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b)/gi, '\n')
    .replace(/\s+(?:y\s+de\s+|\by\s+(?=\d{1,2}(?::\d{2})?\s*(?:am|pm|a\b|-|–|—|de\s+la\s+tarde)))/gi, '\n')
    .replace(/(?<=[.!?])\s+(?=[a-záéíóúA-Z0-9ÁÉÍÓÚ])/g, '\n');

  const rawLines = normalizedInput
    .split(/\r?\n+/)
    .map(l => l.trim())
    .filter(l => l.length > 1);

  const parsedHabits: any[] = [];
  const timeRangeRegex = /(?:de\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|h|hrs)?)\s*(?:a|-|–|—|hasta|to)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|h|hrs)?)/i;
  const explicitSingleTimeRegex = /\b(?:a\s+las?|alas?|hora:?|inicio:?)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|h|hrs)?)/i;

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
        const norm = normalizeTimeString(rawSingle);
        timeBlock = norm || rawSingle;
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
      }
    }

    const isWorkRelated = lower.includes('cliente') || lower.includes('trabaj') || lower.includes('oficina') || lower.includes('laboral') || lower.includes('reunion') || lower.includes('llamada');
    if (isWorkRelated && freq === 'daily' && !lower.includes('todos los dias') && !lower.includes('a diario') && !lower.includes('toda la semana') && !lower.includes('fin de semana')) {
      freq = 'specific_days';
      specificDays = [1, 2, 3, 4, 5];
    }

    let cleanTitle = cleanLine
      .replace(timeRangeRegex, '')
      .replace(explicitSingleTimeRegex, '')
      .replace(/(?:los\s+)?(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bados?|domingos?)(?:\s+a\s+(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bados?|domingos?))?/gi, '')
      .replace(/(?:l-v|lunes a viernes|fines de semana|fin de semana|laborables|todos los d[ií]as|diario)/gi, '')
      .replace(/^[-\s*•\d.:|#\[\]()]+/g, '')
      .trim();

    if (!cleanTitle || cleanTitle.length < 3) {
      if (isWorkRelated) cleanTitle = 'Bloque Laboral / Productivo';
      else if (lower.includes('gym') || lower.includes('gimnasio') || lower.includes('entren') || lower.includes('pesas') || lower.includes('funcional')) cleanTitle = 'Bloque de Entrenamiento Físico';
      else if (lower.includes('comida') || lower.includes('almuerzo') || lower.includes('cena')) cleanTitle = 'Almuerzo & Recarga';
      else if (lower.includes('limp') || lower.includes('orden')) cleanTitle = 'Limpieza & Orden del Espacio';
      else cleanTitle = 'Bloque Operativo';
    }

    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

    let category = 'rutina';
    let icon = '⚡';
    let xp = 25;
    let coins = 10;

    if (lower.includes('gym') || lower.includes('gimnasio') || lower.includes('entren') || lower.includes('correr') || lower.includes('pesas') || lower.includes('deporte') || lower.includes('crossfit') || lower.includes('cardio') || lower.includes('funcional')) {
      category = 'entrenamiento';
      icon = '🏋️';
      xp = 30;
      coins = 15;
    } else if (lower.includes('estud') || lower.includes('leer') || lower.includes('lectura') || lower.includes('curso') || lower.includes('program') || lower.includes('codigo') || lower.includes('aprender') || lower.includes('clase')) {
      category = 'intelecto';
      icon = '💻';
      xp = 25;
      coins = 12;
    } else if (isWorkRelated) {
      category = 'rutina';
      icon = '💼';
      xp = 25;
      coins = 10;
    } else if (lower.includes('comida') || lower.includes('comer') || lower.includes('almuerzo') || lower.includes('cena') || lower.includes('desayuno') || lower.includes('cocinar')) {
      category = 'comida';
      icon = '🥗';
      xp = 15;
      coins = 6;
    } else if (lower.includes('limp') || lower.includes('orden') || lower.includes('casa') || lower.includes('hogar') || lower.includes('lavar')) {
      category = 'limpieza';
      icon = '🧹';
      xp = 20;
      coins = 8;
    } else if (lower.includes('dibuj') || lower.includes('creativ') || lower.includes('escrib') || lower.includes('video') || lower.includes('musica') || lower.includes('diseñ')) {
      category = 'creativo';
      icon = '🎨';
      xp = 25;
      coins = 12;
    }

    const id = `hab-proc-${Date.now()}-${lineIdx}-${Math.random().toString(36).slice(2, 7)}`;

    parsedHabits.push({
      id,
      title: cleanTitle,
      category,
      timeBlock: timeBlock || undefined,
      frequencyType: freq,
      specificDays: freq === 'specific_days' ? specificDays : undefined,
      xpReward: xp,
      coinReward: coins,
      quickIcon: icon,
      isQuickHabit: false,
      isTracked2166: false,
    });
  });

  for (let i = 0; i < parsedHabits.length; i++) {
    for (let j = i + 1; j < parsedHabits.length; j++) {
      const a = parsedHabits[i];
      const b = parsedHabits[j];
      if (!a.timeBlock || !b.timeBlock) continue;

      const startA = parseTimeStartInMins(a.timeBlock);
      const startB = parseTimeStartInMins(b.timeBlock);

      if (Math.abs(startA - startB) <= 45) {
        if (a.frequencyType === 'specific_days' && a.specificDays && (!b.specificDays || b.frequencyType === 'daily')) {
          const excludedDays = new Set(a.specificDays);
          const baseDays = b.specificDays || [0, 1, 2, 3, 4, 5, 6];
          const remaining = baseDays.filter((d: number) => !excludedDays.has(d));
          if (remaining.length > 0 && remaining.length < 7) {
            b.frequencyType = 'specific_days';
            b.specificDays = remaining;
          }
        } else if (b.frequencyType === 'specific_days' && b.specificDays && (!a.specificDays || a.frequencyType === 'daily')) {
          const excludedDays = new Set(b.specificDays);
          const baseDays = a.specificDays || [0, 1, 2, 3, 4, 5, 6];
          const remaining = baseDays.filter((d: number) => !excludedDays.has(d));
          if (remaining.length > 0 && remaining.length < 7) {
            a.frequencyType = 'specific_days';
            a.specificDays = remaining;
          }
        }
      }
    }
  }

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
        id: `hab-proc-work-${now}-${Math.random().toString(36).slice(2, 7)}`,
        title: `Bloque Principal: ${prof}`,
        category: 'rutina',
        timeBlock: '09:00 - 17:00',
        frequencyType: 'specific_days',
        specificDays: [1, 2, 3, 4, 5],
        xpReward: 25,
        coinReward: 10,
        quickIcon: '💼',
        isQuickHabit: false,
        isTracked2166: false,
      },
      {
        id: `hab-proc-training-${now}-${Math.random().toString(36).slice(2, 7)}`,
        title: 'Bloque de Entrenamiento Físico',
        category: 'entrenamiento',
        timeBlock: '18:00 - 19:30',
        frequencyType: 'specific_days',
        specificDays: [1, 3, 5],
        xpReward: 30,
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

  return filtered.sort((a, b) => parseTimeStartInMins(a.timeBlock) - parseTimeStartInMins(b.timeBlock));
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

