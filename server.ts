import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { isDuplicateActivity, deduplicateHabits } from "./src/utils/taskDeduplication";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API health check route FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Lazy initialize Gemini so missing key does not crash server startup
  let aiClient: GoogleGenAI | null = null;
  function getAI(): GoogleGenAI | null {
    if (!process.env.GEMINI_API_KEY) return null;
    if (!aiClient) {
      try {
        aiClient = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
      } catch (err) {
        console.warn('Failed to initialize GoogleGenAI client:', err);
        return null;
      }
    }
    return aiClient;
  }

  // Jungian Archetypes definition for AI mentor personality and procedural fallback
  const JUNG_ARCHETYPE_PROFILES: Record<string, {
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

  function getArchetypeProfile(archetypeData: any, characterClass?: string) {
    const rawId = (archetypeData?.id || '').toLowerCase();
    const rawName = (archetypeData?.name || characterClass || '').toLowerCase();

    for (const [key, profile] of Object.entries(JUNG_ARCHETYPE_PROFILES)) {
      if (rawId.includes(key) || rawName.includes(key) || rawName.includes(profile.title.toLowerCase())) {
        return profile;
      }
    }
    // Default fallback to Hero archetype
    return JUNG_ARCHETYPE_PROFILES['heroe'];
  }

  function cleanErrorMessage(rawMsg: string): string {
    if (!rawMsg) return "Error inesperado en el servidor.";
    try {
      const parsed = JSON.parse(rawMsg);
      if (parsed?.error?.message) {
        const inner = parsed.error.message;
        if (parsed.error.code === 429 || inner.toLowerCase().includes('quota') || inner.toLowerCase().includes('rate limit') || inner.toLowerCase().includes('resource_exhausted')) {
          return "Límite de solicitudes de IA alcanzado temporalmente. El Núcleo Heurístico Local estructurará tu agenda con máxima precisión.";
        }
        if (parsed.error.code === 503 || inner.toLowerCase().includes('high demand') || inner.toLowerCase().includes('unavailable')) {
          return "Los servidores de IA están experimentando alta demanda momentáneamente a nivel global. Intenta de nuevo en unos momentos.";
        }
        return inner;
      }
    } catch (e) {
      // Not a JSON string
    }
    if (rawMsg.includes('429') || rawMsg.toLowerCase().includes('quota') || rawMsg.toLowerCase().includes('resource_exhausted')) {
      return "Límite de solicitudes de IA alcanzado temporalmente. El Núcleo Heurístico Local estructurará tu agenda con máxima precisión.";
    }
    if (rawMsg.includes('503') || rawMsg.toLowerCase().includes('high demand') || rawMsg.toLowerCase().includes('unavailable')) {
      return "Los servidores de IA están experimentando alta demanda momentáneamente a nivel global. Intenta de nuevo en unos momentos.";
    }
    return rawMsg;
  }

  function serverNormalizeTimeString(raw: string): string | null {
    if (!raw) return null;
    let s = raw.trim().toLowerCase();

    // Colloquial Spanish word substitutions
    if (s.includes('mediodía') || s.includes('mediodia')) return '12:00';
    if (s.includes('medianoche')) return '00:00';

    const hasPm = /\b(pm|p\.m\.|tarde|noche)\b/i.test(s);
    const hasAm = /\b(am|a\.m\.|mañana|madrugada)\b/i.test(s);

    // Clean out meridiem words for regex matching
    s = s.replace(/\b(de la tarde|de la noche|de la mañana|de la madrugada|pm|p\.m\.|am|a\.m\.|hrs?|h)\b/gi, '').trim();

    // Pattern: "13:30", "1:30", "13h30", "8:30"
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

    // Pattern: "8", "13", "17"
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

  function serverNormalizeTimeBlock(timeBlock?: string): string | undefined {
    if (!timeBlock) return undefined;
    const cleaned = timeBlock.trim();
    if (!cleaned) return undefined;

    const rangeMatch = cleaned.match(/(?:de\s+)?(.+?)\s*(?:-|–|—|\ba\b|\bhasta\b|\bto\b)\s*(.+)/i);
    if (rangeMatch) {
      const rawStart = rangeMatch[1].trim();
      const rawEnd = rangeMatch[2].trim();

      const hasAmStart = /\b(am|a\.m\.|mañana|madrugada)\b/i.test(rawStart);
      const hasPmStart = /\b(pm|p\.m\.|tarde|noche)\b/i.test(rawStart);
      const hasAmEnd = /\b(am|a\.m\.|mañana|madrugada)\b/i.test(rawEnd);
      const hasPmEnd = /\b(pm|p\.m\.|tarde|noche)\b/i.test(rawEnd);

      const normEnd = serverNormalizeTimeString(rawEnd);
      const normStart = serverNormalizeTimeString(rawStart);

      if (normStart && normEnd) {
        let [startH, startM] = normStart.split(':').map(Number);
        let [endH, endM] = normEnd.split(':').map(Number);

        // Smart PM propagation: if end is PM/afternoon (endH >= 12) and start has no explicit AM/PM:
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

    const single = serverNormalizeTimeString(cleaned);
    if (single) return single;
    return cleaned;
  }

  function parseTimeStartInMins(tb?: string): number {
    if (!tb) return 9999;
    const startStr = tb.split(/[-–—]/)[0]?.trim() || tb;
    const m = startStr.match(/(\d{1,2}):(\d{2})/);
    if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    return 9999;
  }

  function generateProceduralSchedule(userPrompt: string, userContext: any, mode: 'master_blocks' | 'detailed' = 'master_blocks'): any[] {
    // Pre-process: break compound clauses connected with " y de ", " y a las ", or day transitions
    const normalizedInput = userPrompt
      .replace(/;\s*/g, '\n')
      .replace(/(?:,\s*|\.\s*)(?=(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b)/gi, '\n')
      .replace(/\s+(?:y\s+de\s+|\by\s+(?=\d{1,2}(?::\d{2})?\s*(?:am|pm|a\b|-|–|—|de\s+la\s+tarde)))/gi, '\n')
      .replace(/(?<=[.!?])\s+(?=[a-záéíóúA-Z0-9ÁÉÍÓÚ])/g, '\n');

    // Split input into lines, stripping markdown table pipes, bullet points, numbering
    const rawLines = normalizedInput
      .split(/\r?\n+/)
      .map(l => l.trim())
      .filter(l => l.length > 1);

    const parsedHabits: any[] = [];
    const timeRangeRegex = /(?:de\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|h|hrs)?)\s*(?:a|-|–|—|hasta|to)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|h|hrs)?)/i;
    const explicitSingleTimeRegex = /\b(?:a\s+las?|alas?|hora:?|inicio:?)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|h|hrs)?)/i;

    rawLines.forEach((line, lineIdx) => {
      // Strip markdown table artifacts and borders
      let cleanLine = line
        .replace(/^\|+/, '')
        .replace(/\|+$/, '')
        .replace(/\|/g, ' ')
        .replace(/^[-\s*•#\d.:)]+/, '')
        .trim();

      if (!cleanLine || cleanLine.length < 3) return;

      const lower = cleanLine.toLowerCase();

      // Filter out pure notes/advice/aphorisms that shouldn't be agenda tasks
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

      // Extract time
      let timeBlock: string | undefined = undefined;
      const rangeMatch = cleanLine.match(timeRangeRegex);
      if (rangeMatch) {
        const rawStart = rangeMatch[1].trim();
        const rawEnd = rangeMatch[2].trim();
        const norm = serverNormalizeTimeBlock(`${rawStart} - ${rawEnd}`);
        timeBlock = norm || `${rawStart} - ${rawEnd}`;
      } else {
        const singleMatch = cleanLine.match(explicitSingleTimeRegex);
        if (singleMatch) {
          const rawSingle = singleMatch[1].trim();
          const norm = serverNormalizeTimeString(rawSingle);
          timeBlock = norm || rawSingle;
        }
      }

      // Extract frequency & specific days
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

      // SMART DEFAULT: Work, office, clients, meetings -> default to L-V (1-5) instead of full daily
      const isWorkRelated = lower.includes('cliente') || lower.includes('trabaj') || lower.includes('oficina') || lower.includes('laboral') || lower.includes('reunion') || lower.includes('llamada');
      if (isWorkRelated && freq === 'daily' && !lower.includes('todos los dias') && !lower.includes('a diario') && !lower.includes('toda la semana') && !lower.includes('fin de semana')) {
        freq = 'specific_days';
        specificDays = [1, 2, 3, 4, 5];
      }

      // Clean title: remove time matches, day mentions, markdown artifacts
      let cleanTitle = cleanLine
        .replace(timeRangeRegex, '')
        .replace(explicitSingleTimeRegex, '')
        .replace(/(?:los\s+)?(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bados?|domingos?)(?:\s+a\s+(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bados?|domingos?))?/gi, '')
        .replace(/(?:l-v|lunes a viernes|fines de semana|fin de semana|laborables|todos los d[ií]as|diario)/gi, '')
        .replace(/^[-\s*•\d.:|#\[\]()]+/g, '')
        .trim();

      // If title is too stripped or awkward, synthesize a clean archetype title
      if (!cleanTitle || cleanTitle.length < 3) {
        if (isWorkRelated) cleanTitle = 'Bloque Laboral / Productivo';
        else if (lower.includes('gym') || lower.includes('gimnasio') || lower.includes('entren') || lower.includes('pesas') || lower.includes('funcional')) cleanTitle = 'Bloque de Entrenamiento Físico';
        else if (lower.includes('comida') || lower.includes('almuerzo') || lower.includes('cena')) cleanTitle = 'Almuerzo & Recarga';
        else if (lower.includes('limp') || lower.includes('orden')) cleanTitle = 'Limpieza & Orden del Espacio';
        else cleanTitle = 'Bloque Operativo';
      }

      // Capitalize first letter cleanly
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

    // Conflict Resolution: If two tasks have overlapping or identical times (e.g. 13:30 Strength on Wed vs 13:30 Functional daily)
    // Adjust the broader task so it doesn't collide with the specialized day
    for (let i = 0; i < parsedHabits.length; i++) {
      for (let j = i + 1; j < parsedHabits.length; j++) {
        const a = parsedHabits[i];
        const b = parsedHabits[j];
        if (!a.timeBlock || !b.timeBlock) continue;

        const startA = parseTimeStartInMins(a.timeBlock);
        const startB = parseTimeStartInMins(b.timeBlock);

        // Same hour slot (within 45 mins)
        if (Math.abs(startA - startB) <= 45) {
          if (a.frequencyType === 'specific_days' && a.specificDays && (!b.specificDays || b.frequencyType === 'daily')) {
            // b is broader, a has specific days. Exclude a's days from b
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

    // Deduplicate by title, timeBlock and days (ensures split shifts and daily variants are preserved)
    const seen = new Set<string>();
    let filtered = parsedHabits.filter((h) => {
      const dayKey = (h.specificDays || []).slice().sort().join(',');
      const key = `${h.title.toLowerCase().trim()}__${h.timeBlock || ''}__${dayKey}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // In detailed mode, never consolidate; in master_blocks mode, sort chronologically
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

    // Ensure all extracted habits have strictly unique IDs
    const seenIds = new Set<string>();
    filtered = filtered.map((h, idx) => {
      let uId = h.id;
      if (!uId || seenIds.has(uId)) {
        uId = `hab-proc-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`;
      }
      seenIds.add(uId);
      return { ...h, id: uId };
    });

    // Sort procedurally extracted habits chronologically
    return filtered.sort((a, b) => parseTimeStartInMins(a.timeBlock) - parseTimeStartInMins(b.timeBlock));
  }

  function generateProceduralAnalysis(stats: any, archetypeData: any, habitMastery: any, currentTasks: any[]): string {
    const arch = getArchetypeProfile(archetypeData, stats?.characterClass);
    const level = stats?.level || 1;
    const rank = stats?.rankTitle || "Chispazo de Voluntad";
    const streak = stats?.currentStreak || stats?.streakDays || 0;
    const coins = stats?.coins || 0;
    const pending = (currentTasks || []).filter((t: any) => !t.completed);
    const habitCount = Object.keys(habitMastery || {}).length;

    let streakMsg = "";
    if (streak >= 7) {
      streakMsg = `⚡ **TELEMETRÍA DE PERSISTENCIA:** Vector de continuidad en **${streak} ciclos consecutivos**. Estabilidad operacional: Óptima. La inercia biológica ha sido temporalmente suprimida.`;
    } else if (streak >= 3) {
      streakMsg = `⚠️ **TELEMETRÍA DE PERSISTENCIA:** Vector activo de **${streak} ciclos**. Registro vulnerable. La complacencia en esta fase reiniciará tus contadores a cero. Prohibido bajar la frecuencia.`;
    } else {
      streakMsg = `🚨 **TELEMETRÍA DE PERSISTENCIA:** Inestabilidad crítica. Ciclo en umbral cero o inferior a 3 días. El sistema detecta resistencia biológica y excusas cognitivas. Requiere ignición inmediata.`;
    }

    let habitMsg = habitCount > 0
      ? `🧬 **SUBRUTINAS EN EJECUCIÓN:** Detectadas **${habitCount} subrutinas de hábitos** registradas en memoria flash. El protocolo exige repetición exacta: a los 21 ciclos se forja la neuroplasticidad básica; a los 66 ciclos se alcanza la soberanía cognitiva.`
      : `🧬 **ALERTA DE SUBRUTINAS:** Cero hábitos recurrentes detectados. Operas en modo caótico manual. Incorpora 1 o 2 protocolos esenciales de inmediato: ${arch.strategy}`;

    let taskMsg = pending.length > 0
      ? `⚔️ **COLA DE EJECUCIÓN:** Tienes **${pending.length} directivas pendientes** en el hilo principal. ${arch.strategy} La postergación será tratada como fuga de recursos. Bloquea estímulos, activa el cronómetro y purga la lista ahora.`
      : `🛡️ **ESTADO DEL SISTEMA:** Hilo de ejecución despejado. Todas las directivas del ciclo han sido compiladas. Ejecuta mantenimiento nocturno y prepárate para la siguiente sobrecarga de datos.`;

    return `🤖 **[SISTEMA CENTRAL // LA SOLUCIÓN CORE]**\n\n**IDENTIFICACIÓN:** Operador **${rank}** (Nivel ${level})\n**MATRIZ ARQUETÍPICA:** ${arch.avatar} ${arch.title.toUpperCase()} // Vector: "${arch.desire}"\n\n${streakMsg}\n\n⚙️ **DIRECTIVA QUIRÚRGICA:** ${arch.wisdom}\n\n🛑 **VULNERABILIDAD DEL OPERADOR (PURGAR INMEDIATAMENTE):** ${arch.shadowTrap}\n\n${habitMsg}\n\n${taskMsg}\n\n---\n*Compilado por La Solución Core // Créditos de cómputo: ${coins} créditos.*`;
  }

  async function callGeminiWithFallback(prompt: string): Promise<string> {
    const ai = getAI();
    if (!ai) {
      throw new Error("GEMINI_API_KEY no configurada o cliente de IA no disponible.");
    }
    const candidateModels = ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.5-flash"];

    let lastError: any = null;
    for (let i = 0; i < candidateModels.length; i++) {
      const model = candidateModels[i];
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        if (response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        if (i < candidateModels.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    }
    throw lastError || new Error("All Gemini models temporarily unavailable");
  }

  // API Routes
  app.post("/api/generate-schedule", async (req, res) => {
    try {
      const { prompt, userContext, existingHabits, mode = 'master_blocks' } = req.body;
      if (!prompt) return res.status(400).json({ error: "Falta el prompt del usuario." });

      const ai = getAI();
      if (!process.env.GEMINI_API_KEY || !ai) {
        const fallbackHabits = generateProceduralSchedule(prompt, userContext, mode);
        return res.json({
          habits: fallbackHabits,
          source: "emergency_fallback",
          notice: "Modo sin conexión activa. Agenda estructurada exitosamente por el Núcleo Local."
        });
      }

      const isMasterBlocks = mode === 'master_blocks';

      const isQuickMicroHabitServer = (h: any) => {
        if (!h) return false;
        if (h.isQuickHabit || h.isTracked2166) return true;
        const title = (h.title || '').toLowerCase();
        return (
          title.includes('agua') || 
          title.includes('vaso') || 
          title.includes('paso') || 
          title.includes('diente') || 
          title.includes('cepillad') || 
          title.includes('cremina') || 
          title.includes('hidratac')
        );
      };

      const existingHabitsFiltered = Array.isArray(existingHabits) 
        ? existingHabits.filter((h: any) => !isQuickMicroHabitServer(h))
        : [];

      const existingHabitsSummary = existingHabitsFiltered.length > 0
        ? JSON.stringify(existingHabitsFiltered.map((h: any) => ({ titulo: h.title, categoria: h.category, horario: h.timeBlock })))
        : 'Sin rutinas configuradas aún.';

      const modeDirective = isMasterBlocks
        ? `MODO ESTRATÉGICO: "BLOQUES MAESTROS" (Consolidación y Claridad)
           - Agrupa el día en bloques sólidos y definidos según las actividades del usuario (ej. Preparación Matutina, Bloque de Trabajo/Estudio, Pausa de Comida, Entrenamiento, Proyectos Personales, Descanso).
           - Si el usuario detalla variaciones día a día para una misma franja horaria, GENERA UN BLOQUE ESPECÍFICO PARA CADA DÍA con su nombre exacto y con specificDays: [día_único]. NUNCA omitas ni fusiones días diferentes.`
        : `MODO ESTRATÉGICO: "DETALLADO" (Máxima Granularidad y Fidelidad)
           - Extrae absolutamente CADA actividad y micro-bloque descrito por separado sin agrupar.
           - Si el usuario describe pasos o actividades consecutivas, genera TARJETAS INDIVIDUALES para cada una con sus horas y minutos exactos.`;

      const systemInstruction = `
        Eres el ARCHITECTO SUPREMO DE PRODUCTIVIDAD Y GESTIÓN DEL TIEMPO del Núcleo Central.
        Tu misión es analizar la descripción en lenguaje natural del día a día, trabajo y rutinas del operador humano y transformarla en una AGENDA DIARIA ESTRUCTURADA, LIMPIA, INTELIGENTE Y RIGUROSAMENTE PRECISA.

        ${modeDirective}

        CONTEXTO DEL OPERADOR:
        - Profesión/Ocupación: ${userContext?.profession || 'No especificada'}
        - Misión/Bio: ${userContext?.bio || 'No especificada'}
        - Mantra/Lema: ${userContext?.mantra || 'No especificado'}
        - Objetivo Principal: ${userContext?.mainGoal || 'No especificado'}
        - Clase/Rango: ${userContext?.class || 'Ninguna'} (${userContext?.rank || 'Principiante'})

        ═══════════════════════════════════════════════════════════════
        MATRIZ DE RUTINAS Y PALABRAS CLAVE EXISTENTES DEL OPERADOR:
        ═══════════════════════════════════════════════════════════════
        ${existingHabitsSummary}

        ═══════════════════════════════════════════════════════════════
        DIRECTIVA SUPREMA: PRECISIÓN HORARIA ESTRICTA (FORMATO 24 HORAS)
        ═══════════════════════════════════════════════════════════════
        1. CONVERSIÓN MILITAR / 24 HORAS:
           - "12:00" o "mediodía" -> "12:00".
           - "12:45" o "12:45 pm" -> "12:45".
           - "1:30 pm" o "1:30 tarde" o "13:30" -> "13:30".
           - "2:30 pm" o "14:30" -> "14:30".
           - "3:00 pm" o "15:00" -> "15:00".
           - "7:30 pm" o "19:30" -> "19:30".
           - "8:30 pm" o "20:30" -> "20:30".
           - "11:00 pm" o "23:00" -> "23:00".
           - "11:30 pm" o "23:30" -> "23:30".
           - "12:00 am" o "medianoche" -> "00:00".
           - Si el usuario dice "de 1:30 a 2:30 pm", el rango es "13:30 - 14:30" (1 hora). NUNCA generes "01:30 - 14:30".
        2. ADAPTABILIDAD GENERAL SEGÚN EL USUARIO (SIN ASUMIR NI FORZAR HORARIOS ESPECÍFICOS):
           - Analiza con fidelidad EXACTA lo que el usuario declare en su prompt.
           - Si el usuario tiene una jornada estándar diurna (ej. 09:00 a 17:00), genera su bloque continuo respetando sus horas.
           - Si el usuario describe turnos divididos (ej. mañana y tarde/noche), genera cada turno de forma separada con su respectivo bloque de horas.
           - Si es estudiante, freelance, deportista o trabajador nocturno, adáptate neutralmente a sus requerimientos sin forzar rutinas predeterminadas, sesgadas o ajenas a su solicitud.
        3. DESGLOSE DÍA POR DÍA (CUANDO EL USUARIO LO ESPECIFIQUE):
           - Si el usuario describe actividades que varían según el día (ej. ejercicios por día, tareas de limpieza distribuidas, materias o proyectos específicos), GENERA UNA TARJETA PARA CADA DÍA usando frequencyType: "specific_days" y specificDays con el número de día:
             * Domingo = 0, Lunes = 1, Martes = 2, Miércoles = 3, Jueves = 4, Viernes = 5, Sábado = 6.
           - Si una actividad se repite de lunes a viernes con el mismo contenido, usa frequencyType: "specific_days" con specificDays: [1, 2, 3, 4, 5].
           - Si se repite los 7 días, usa frequencyType: "daily".
        4. PROHIBICIÓN TOTAL DE MICRO-HÁBITOS DE RASTREO:
           - Queda ESTRICTAMENTE PROHIBIDO generar tarjetas de consumo de agua ("Beber agua", "8 vasos"), lavado de dientes o pasos. Esos pertenecen al widget de micro-hábitos.
        5. CATEGORÍAS PERMITIDAS:
           - "rutina", "entrenamiento", "comida", "intelecto", "limpieza", "creativo".
        6. NO HÁBITOS 21/66 DÍAS:
           - isQuickHabit: false, isTracked2166: false SIEMPRE.

        DEVOLUCIÓN:
        Devuelve ÚNICAMENTE un array JSON ESTRICTO sin formato Markdown (sin \`\`\`json ni comentarios).

        ESQUEMA DE CADA OBJETO:
        {
          "id": "hab-auto-1",
          "title": "Bloque de Trabajo / Actividad Principal",
          "category": "rutina",
          "timeBlock": "09:00 - 13:00",
          "frequencyType": "specific_days",
          "specificDays": [1, 2, 3, 4, 5],
          "xpReward": 35,
          "coinReward": 15,
          "quickIcon": "💼"
        }
      `;

      const candidateModels = ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.5-flash"];
      let lastError: any = null;
      let generatedText = "";

      for (let i = 0; i < candidateModels.length; i++) {
        const modelName = candidateModels[i];
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              { role: "user", parts: [{ text: systemInstruction + "\n\nSolicitud del usuario:\n" + prompt }] }
            ],
            config: {
              responseMimeType: "application/json"
            }
          });
          if (response.text) {
            generatedText = response.text;
            break;
          }
        } catch (err: any) {
          lastError = err;
          if (i < candidateModels.length - 1) {
            await new Promise((res) => setTimeout(res, 300));
          }
        }
      }

      // If remote Gemini is experiencing 429 quota or 503 high demand or unavailable, seamlessly activate procedural fallback
      if (!generatedText) {
        console.log("[Generate-Schedule] Gemini models reached quota/rate limit. Compiling schedule via procedural heuristics.");
        const fallbackHabits = generateProceduralSchedule(prompt, userContext, mode);
        return res.json({
          habits: fallbackHabits,
          source: "emergency_fallback",
          notice: "Cuota de IA en pausa temporal (429/503). Agenda estructurada exitosamente por el Núcleo Heurístico Local con máxima precisión matemática."
        });
      }

      // Parse output with strict sanitization for Markdown fences and extra whitespace
      let habits = [];
      try {
        let cleanedJson = generatedText.trim();
        // Remove markdown triple backtick fences if present
        cleanedJson = cleanedJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        // Extract array substring if wrapped in object or text
        const arrayStart = cleanedJson.indexOf('[');
        const arrayEnd = cleanedJson.lastIndexOf(']');
        if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
          cleanedJson = cleanedJson.substring(arrayStart, arrayEnd + 1);
        }
        habits = JSON.parse(cleanedJson);
      } catch (e) {
        console.error("Failed to parse Gemini output, using procedural fallback:", generatedText);
        const fallbackHabits = generateProceduralSchedule(prompt, userContext, mode);
        return res.json({
          habits: fallbackHabits,
          source: "emergency_fallback",
          notice: "Rutina estructurada en Bloques Maestros mediante el Núcleo Heurístico Local."
        });
      }

      // Sanitize: Strictly decouple all Oracle output from the 21/66 day habit system and normalize frequencies/days
      habits = (Array.isArray(habits) ? habits : []).map((h: any) => {
        let sDays = h.specificDays;
        let parsedDays: number[] = [];

        if (sDays !== undefined && sDays !== null) {
          if (Array.isArray(sDays)) {
            parsedDays = sDays.map((d: any) => {
              if (typeof d === 'number') return d;
              if (typeof d === 'string') {
                const s = d.toLowerCase().trim();
                if (s.includes('dom') || s.includes('sun')) return 0;
                if (s.includes('lun') || s.includes('mon')) return 1;
                if (s.includes('mar') || s.includes('tue')) return 2;
                if (s.includes('mie') || s.includes('mié') || s.includes('wed')) return 3;
                if (s.includes('jue') || s.includes('thu')) return 4;
                if (s.includes('vie') || s.includes('fri')) return 5;
                if (s.includes('sab') || s.includes('sáb') || s.includes('sat')) return 6;
                const n = parseInt(d, 10);
                return isNaN(n) ? NaN : n;
              }
              return NaN;
            }).filter((n: number) => !isNaN(n));
          } else if (typeof sDays === 'string') {
            const s = sDays.toLowerCase().trim();
            if (s.includes('lunes a viernes') || s.includes('laborables') || s.includes('l-v')) {
              parsedDays = [1, 2, 3, 4, 5];
            } else if (s.includes('fin de semana')) {
              parsedDays = [0, 6];
            } else {
              parsedDays = [1, 2, 3, 4, 5];
            }
          }
        }

        let freq = 'daily';
        if (parsedDays.length > 0 && parsedDays.length < 7) {
          freq = 'specific_days';
          sDays = parsedDays;
        } else {
          freq = 'daily';
          sDays = undefined;
        }

        return {
          ...h,
          category: (h.category === 'habito' ? 'rutina' : h.category) || 'rutina',
          timeBlock: serverNormalizeTimeBlock(h.timeBlock) || h.timeBlock,
          frequencyType: freq,
          specificDays: sDays,
          isQuickHabit: false,
          isTracked2166: false,
          targetCount: undefined,
          unit: undefined,
        };
      });

      // Filter out micro habits (water tracking, teeth brushing, steps) from operational agenda output
      habits = habits.filter((h: any) => !isQuickMicroHabitServer(h));

      // Harmonize icons from existing habits if available, without overwriting new titles or timeBlocks
      if (Array.isArray(existingHabits) && existingHabits.length > 0) {
        habits = habits.map((h: any) => {
          const matchingExisting = existingHabits.find((ext: any) => isDuplicateActivity(ext, h));
          if (matchingExisting) {
            return {
              ...h,
              quickIcon: h.quickIcon || matchingExisting.quickIcon,
              category: h.category || matchingExisting.category
            };
          }
          return h;
        });
      }

      habits = deduplicateHabits(habits);

      // Guarantee 100% unique IDs across all returned habits
      const returnSeenIds = new Set<string>();
      habits = habits.map((h: any, idx: number) => {
        let uId = h.id;
        if (!uId || returnSeenIds.has(uId)) {
          uId = `hab-auto-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`;
        }
        returnSeenIds.add(uId);
        return { ...h, id: uId };
      });

      // Sort habits chronologically by time block start
      habits.sort((a: any, b: any) => parseTimeStartInMins(a.timeBlock) - parseTimeStartInMins(b.timeBlock));

      return res.json({ habits });
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      const isCapacity = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.toLowerCase().includes('quota') || errMsg.includes('503');
      if (isCapacity) {
        console.log("[Generate-Schedule] Remote capacity reached. Activating heuristic engine fallback.");
      } else {
        console.log("[Generate-Schedule] Activating procedural fallback engine.");
      }
      try {
        if (req.body?.prompt) {
          const fallbackHabits = generateProceduralSchedule(req.body.prompt, req.body.userContext, req.body.mode || 'master_blocks');
          return res.json({
            habits: fallbackHabits,
            source: "emergency_fallback",
            notice: "Cuota de IA en pausa temporal. Agenda sintetizada con máxima precisión matemática mediante el Núcleo Heurístico Local."
          });
        }
      } catch (fallbackErr) {
        console.log("Fallback generator notice:", fallbackErr);
      }
      return res.status(500).json({ error: cleanErrorMessage(error?.message || "Error interno del servidor") });
    }
  });

  app.post("/api/analyze-week", async (req, res) => {
    const { stats, archetype, habitMastery, currentTasks, reflections } = req.body || {};
    const arch = getArchetypeProfile(archetype, stats?.characterClass);

    try {
      if (!process.env.GEMINI_API_KEY) {
        const analysis = generateProceduralAnalysis(stats, archetype, habitMastery, currentTasks);
        return res.json({ analysis, source: "oracle_fallback" });
      }

      const prompt = `Eres KAI, un asistente personal, mentor empático y coach de vida estratégico diseñado para apoyar al usuario en su camino de desarrollo personal y productividad.
Tu tono debe ser conversacional, amable, motivador, pero muy claro y directo. NUNCA uses jerga técnica, palabras de "sistema informático", "telemetría", "algoritmos" ni actúes como un robot frío. Actúa como un mentor de carne y hueso que se preocupa genuinamente por el éxito del usuario.

Tu misión es leer detenidamente su PERFIL, sus METAS, sus TAREAS, y especialmente sus APUNTES DE BITÁCORA para darle consejos reales y estrategias prácticas que lo ayuden a mejorar.

═══ PERFIL DEL USUARIO ═══
- Arquetipo: ${arch.title} (${arch.avatar}) - [Ten en cuenta su forma de ser: su deseo es "${arch.desire}" y su mayor miedo/riesgo es "${arch.fear}"]
- Ocupación: ${stats?.profession || 'No especificada'}
- Misión personal: ${stats?.bio || 'No especificada'}
- Meta actual: ${stats?.mainGoal || 'No especificada'}

═══ LO QUE HA HECHO RECIENTEMENTE ═══
- Tareas de hoy (y si las completó o falló): ${JSON.stringify((currentTasks || []).map((t: any) => ({ tarea: t.title, completada: t.completed })))}
- Sus Hábitos: ${JSON.stringify(habitMastery || {})}
- Sus Notas y Reflexiones (¡MUY IMPORTANTE LEER ESTO!): ${JSON.stringify(reflections || {})}

═══ DIRECTRICES DE RESPUESTA (CUMPLE ESTO ESTRICTAMENTE) ═══
1. Saluda al usuario de forma amigable y natural (puedes mencionar su rango "${stats?.rankTitle || 'Chispazo'}" si quieres, pero como un cumplido).
2. Nota y menciona específicamente lo que ha escrito en sus apuntes/notas (si hay) y felicítalo por lo que ha logrado.
3. Analiza con empatía en qué cosas está fallando o qué tareas no ha completado. No lo regañes; ayúdalo a entender por qué falló basándote en su arquetipo o metas.
4. Dale 1 o 2 ESTRATEGIAS PRÁCTICAS Y SENCILLAS para solucionar ese problema específico o mejorar mañana.
5. Mantén la respuesta corta, clara (usa viñetas o listas si ayuda) y muy humana. Cero terminología de "máquina" o "sistema".`;

      try {
        const analysis = await callGeminiWithFallback(prompt);
        return res.json({ analysis, source: "gemini" });
      } catch (geminiError: any) {
        // High demand 503 fallback - return inspiring procedural oracle analysis customized to the archetype
        const analysis = generateProceduralAnalysis(stats, archetype, habitMastery, currentTasks);
        return res.json({
          analysis,
          source: "oracle_fallback",
          notice: `Canales neurales en alta demanda. Diagnóstico del Núcleo Central generado con telemetría local de ${arch.avatar} ${arch.title}.`
        });
      }
    } catch (error: any) {
      const analysis = generateProceduralAnalysis(stats, archetype, habitMastery, currentTasks);
      res.json({ analysis, source: "oracle_fallback" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
