import { getGenerativeModel } from 'firebase/ai';
import { firebaseAI, firebaseConfig } from '../firebase';
import { autoArrangeSchedule, cleanScheduleTitle } from '../utils/timeUtils';
import { generateProceduralSchedule, generateProceduralAnalysis, getArchetypeProfile } from '../utils/proceduralHeuristics';
import { parseDays } from '../data/defaults';
import { KaiCustomForm, KaiMultiverseStyle, KaiTemperament } from '../types';

export function getEffectiveGeminiApiKey(): string | null {
  if (typeof window !== 'undefined') {
    const custom = window.localStorage.getItem('lasolucion_gemini_api_key');
    if (custom && custom.trim()) return custom.trim();
  }
  return null;
}

export function hasActiveGeminiKey(): boolean {
  return Boolean(getEffectiveGeminiApiKey());
}

export function saveGeminiApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    if (key && key.trim()) {
      window.localStorage.setItem('lasolucion_gemini_api_key', key.trim());
    } else {
      window.localStorage.removeItem('lasolucion_gemini_api_key');
    }
  }
}

export function removeGeminiApiKey(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('lasolucion_gemini_api_key');
  }
}

interface RateLimitState {
  lastCallTimestamp: number;
  countToday: number;
  dateKey: string;
}

const RATE_LIMIT_STORAGE_KEY = 'lasolucion_ai_ratelimit_v1';
const MIN_COOLDOWN_MS = 3000; // 3 seconds minimum between calls
const MAX_CALLS_PER_DAY = 35;

function checkAndConsumeRateLimit(): { allowed: boolean; reason?: string } {
  if (typeof window === 'undefined') return { allowed: true };
  try {
    const today = new Date().toISOString().slice(0, 10);
    const raw = window.localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    let state: RateLimitState = raw ? JSON.parse(raw) : { lastCallTimestamp: 0, countToday: 0, dateKey: today };

    if (state.dateKey !== today) {
      state = { lastCallTimestamp: 0, countToday: 0, dateKey: today };
    }

    const now = Date.now();
    const timeSinceLast = now - (state.lastCallTimestamp || 0);
    if (timeSinceLast < MIN_COOLDOWN_MS) {
      const waitSec = Math.ceil((MIN_COOLDOWN_MS - timeSinceLast) / 1000);
      return { allowed: false, reason: `Tiempo de espera activo: Espera ${waitSec}s antes de otra consulta.` };
    }

    if (state.countToday >= MAX_CALLS_PER_DAY) {
      return { allowed: false, reason: 'Límite diario alcanzado.' };
    }

    state.lastCallTimestamp = now;
    state.countToday += 1;
    window.localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(state));
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}


const withRetry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (err: any) {
    if (retries > 0 && (err.status === 500 || err.message?.includes('500'))) {
      console.warn(`[AI Service] Retrying due to 500 error. Retries left: ${retries}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw err;
  }
};

export interface GeminiRequestOptions {
  modelName?: string;
  systemInstruction?: string;
  jsonMode?: boolean;
  timeoutMs?: number;
  onChunk?: (chunkText: string, fullTextSoFar: string) => void;
}

async function parseSseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk?: (chunk: string, accumulated: string) => void
): Promise<string> {
  const decoder = new TextDecoder();
  let accumulated = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue;
      if (trimmed.startsWith('data:')) {
        const jsonStr = trimmed.replace(/^data:\s*/, '');
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const chunkText = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (chunkText) {
            accumulated += chunkText;
            onChunk?.(chunkText, accumulated);
          }
        } catch {}
      }
    }
  }

  if (buffer.trim().startsWith('data:')) {
    try {
      const parsed = JSON.parse(buffer.trim().replace(/^data:\s*/, ''));
      const chunkText = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
      if (chunkText) {
        accumulated += chunkText;
        onChunk?.(chunkText, accumulated);
      }
    } catch {}
  }

  return accumulated;
}

export async function fetchGeminiPrompt(
  promptText: string, 
  modelOrOptions?: string | GeminiRequestOptions
): Promise<string | null> {
  if (!promptText || typeof promptText !== 'string' || !promptText.trim()) {
    return null;
  }

  const options: GeminiRequestOptions = 
    typeof modelOrOptions === 'string' 
      ? { modelName: modelOrOptions } 
      : (modelOrOptions || {});

  const rateCheck = checkAndConsumeRateLimit();
  if (!rateCheck.allowed) {
    console.warn(`[AI Protection] ${rateCheck.reason}. Usando heurísticas locales.`);
    return null;
  }

  const sanitizedPrompt = promptText.trim().slice(0, 12000);
  const candidateModels = Array.from(
    new Set([
      options.modelName || 'gemini-3.1-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
      'gemini-flash-latest'
    ])
  );

  const generationConfig: Record<string, any> = {
    temperature: 0.25,
    maxOutputTokens: 8192,
  };
  if (options.jsonMode) {
    generationConfig.responseMimeType = 'application/json';
  }

  const isStreaming = typeof options.onChunk === 'function';

  // 1. Primary: Direct Gemini Developer API (using active key)
  const apiKeyToTry = getEffectiveGeminiApiKey();
  if (apiKeyToTry) {
    for (const modelToTry of candidateModels) {
      let shouldStopLoop = false;
      try {
        return await withRetry(async () => {
            const controller = new AbortController();
            const timeoutMs = options.timeoutMs ?? 18000;
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            
            const endpoint = isStreaming ? ':streamGenerateContent?alt=sse' : ':generateContent';
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}${endpoint}`;

            const requestBody: Record<string, any> = {
              contents: [{ role: 'user', parts: [{ text: sanitizedPrompt }] }],
              generationConfig,
            };

            if (options.systemInstruction) {
              requestBody.system_instruction = {
                parts: [{ text: options.systemInstruction }]
              };
            }

            const res = await fetch(url, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKeyToTry
              },
              body: JSON.stringify(requestBody),
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            
            if (!res.ok) {
                const errText = await res.text();
                if (res.status === 429 || res.status === 403) {
                  shouldStopLoop = true;
                  throw new Error(`CRITICAL_API_LIMIT_${res.status}: ${errText.slice(0, 200)}`);
                }
                throw new Error(`${res.status} ${errText}`);
            }

            if (isStreaming && res.body) {
              const reader = res.body.getReader();
              const streamedText = await parseSseStream(reader, options.onChunk);
              if (streamedText && streamedText.trim()) {
                console.log(`[Gemini API Stream] ✓ Stream completed from ${modelToTry}`);
                return streamedText;
              }
              throw new Error('Empty stream response');
            }

            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text && text.trim()) {
              console.log(`[Gemini API] ✓ Response from ${modelToTry}`);
              return text;
            }
            throw new Error('No text returned');
        });
      } catch (err: any) {
        console.warn(`[Gemini API] (${modelToTry}) failed:`, err?.message || err);
        if (shouldStopLoop || err?.message?.includes('CRITICAL_API_LIMIT')) {
          console.warn('[Gemini API] Aborting candidate model loop due to quota/permission limit.');
          break;
        }
      }
    }
  }

  // 2. Secondary: Official Firebase AI Logic SDK fallback
  if (firebaseAI) {
    for (const modelToTry of candidateModels) {
      try {
        return await withRetry(async () => {
            const modelConfig: Record<string, any> = {
              model: modelToTry,
              generationConfig,
            };
            if (options.systemInstruction) {
              modelConfig.systemInstruction = options.systemInstruction;
            }

            const model = getGenerativeModel(firebaseAI, modelConfig as any);

            if (isStreaming) {
              const streamResult = await model.generateContentStream(sanitizedPrompt);
              let accumulated = '';
              for await (const chunk of streamResult.stream) {
                const chunkText = chunk.text();
                accumulated += chunkText;
                options.onChunk?.(chunkText, accumulated);
              }
              if (accumulated.trim()) {
                console.log(`[Firebase AI Logic Stream] ✓ Streamed from ${modelToTry}`);
                return accumulated;
              }
            }

            const result = await model.generateContent(sanitizedPrompt);
            const text = result.response.text();
            if (text && text.trim()) {
              console.log(`[Firebase AI Logic] ✓ Response from ${modelToTry}`);
              return text;
            }
            throw new Error('No text returned');
        });
      } catch (err: any) {
        console.warn(`[Firebase AI Logic] (${modelToTry}) unavailable:`, err?.message || err);
      }
    }
  }

  return null;
}

export interface ScheduleDispatchOptions {
  forceRemoteAi?: boolean;
  forceLocalOnly?: boolean;
  isWeeklyDeepReview?: boolean;
}

/**
 * Despachador Heurístico Inteligente de KAI:
 * Permite forzar ejecución remota con Gemini IA (`forceRemoteAi`), ejecución 100% local (`forceLocalOnly`),
 * o despachar consultas cotidianas sin latencia de red.
 */
export function shouldRouteToRemoteAI(prompt: string, options?: ScheduleDispatchOptions): boolean {
  if (options?.forceLocalOnly) {
    return false;
  }
  if (options?.forceRemoteAi || options?.isWeeklyDeepReview) {
    return true;
  }

  const normalized = (prompt || '').toLowerCase().trim();

  // Peticiones explícitas de síntesis neural o análisis semanal profundo
  const deepKeywords = [
    'semanal profundo',
    'resumen semanal',
    'auditoría neural',
    'diagnóstico semanal',
    'análisis profundo',
    'red neuronal',
    'deep review',
    'gemini',
    'inteligencia artificial',
    'evaluación neural'
  ];

  return deepKeywords.some((kw) => normalized.includes(kw));
}

/**
 * Generador contextual táctico local: frases, directivas y citas de arquetipos
 * resueltas 100% en cliente sin llamadas a red.
 */
export function generateContextualTacticalQuote(
  userContext: any,
  moment: 'morning' | 'night' | 'focus' | 'boss' = 'focus'
): string {
  const profile = getArchetypeProfile(userContext?.characterClass || userContext?.class);
  if (moment === 'morning') {
    return `${profile.avatar} **Directiva Matutina**: ${profile.wisdom}`;
  }
  if (moment === 'night') {
    return `🌙 **Cierre Operativo**: Protege tu recuperación sináptica. "${profile.strategy}"`;
  }
  if (moment === 'boss') {
    return `⚔️ **Alerta Táctica**: Supera la fricción. Evita la trampa de "${profile.shadowTrap}".`;
  }
  return `${profile.avatar} "${profile.strategy}"`;
}

export async function generateScheduleFrontend(
  prompt: string,
  userContext: any,
  _existingHabits: any[],
  mode: 'master_blocks' | 'detailed' = 'master_blocks',
  dispatchOptions?: ScheduleDispatchOptions
): Promise<any> {
  if (!prompt) throw new Error("Falta el prompt del usuario.");

  const isMasterBlocks = mode === 'master_blocks';
  const maxBlocks = isMasterBlocks ? 12 : 20;

  // 1. FAST-PATH HEURÍSTICO LOCAL:
  // Si el usuario eligió Motor Local o la consulta no requiere IA remota, resolvemos sin consumo de cuota.
  if (!shouldRouteToRemoteAI(prompt, dispatchOptions)) {
    console.log("[KAI Dispatcher] ⚡ Consulta resuelta por Motor Heurístico Local.");
    const rawProcedural = generateProceduralSchedule(prompt, userContext, mode);
    return {
      habits: autoArrangeSchedule(rawProcedural, mode, maxBlocks),
      source: "heuristic_engine",
      notice: dispatchOptions?.forceLocalOnly
        ? null
        : "⚡ Agenda estructurada por el Motor Local."
    };
  }

  // 2. SLOW-PATH NEURAL (Gemini 3.1 Flash-Lite):
  // Reservado para peticiones que requieren razonamiento profundo de lenguaje natural.


  const modeDirective = isMasterBlocks
    ? `MODO ESTRATÉGICO: "BLOQUES MAESTROS" (Consolidación y Claridad)
       - Si el usuario pide diseñar un día desde cero sin horarios detallados, estructura entre 5 y 7 bloques claros.
       - Si el usuario proporciona su propia lista de actividades y horarios, respeta TODOS sus bloques sin omitir ninguno.`
    : `MODO ESTRATÉGICO: "DETALLADO" (Granularidad Ordenada)
       - Respeta cada actividad individual paso a paso sin choques de horario.`;

  const systemInstruction = `
    Eres KAI, el estratega táctico de rendimiento, organización y neuroplasticidad de La Solución.
    Tu misión es analizar la solicitud de cualquier operador y transformarla en una AGENDA DIARIA REALISTA, ESTRUCTURADA Y 100% LIBRE DE SOLAPAMIENTOS DE HORARIO.

    ${modeDirective}

    CONTEXTO DEL OPERADOR:
    - Ocupación: ${userContext?.profession || 'No especificada'}
    - Objetivo Principal: ${userContext?.mainGoal || 'No especificado'}
    - Perfil RPG: ${userContext?.class || 'Aventurero'} (Nivel ${userContext?.level || 1})

    DIRECTIVAS GENERALES DE PLANIFICACIÓN:
    1. FIDELIDAD TOTAL AL MENSAJE DEL USUARIO: Si el usuario proporciona horarios específicos para sus actividades, respeta sus horas exactas expresadas sin alterar sus bloques ni agregar tiempos vacíos no solicitados.
    2. ADAPTABILIDAD LIBRE DE BLOQUES: Genera la cantidad exacta de bloques que responda a lo solicitado por el operador (desde agendas sintéticas de 4 bloques hasta rutinas detalladas o semanales de 10+ bloques).
    3. FORMATO DE HORA ESTRICTO "HH:mm - HH:mm" (24h, entre 05:00 y 23:59). Cero solapamientos de tiempo en un mismo día.
    4. TÍTULOS ACCIONABLES Y NEUTROS: Conserva la esencia de la actividad descrita por el usuario. Prohibido usar muletillas como "(Consolidado)" o "Tarea extra".
    5. ASIGNACIÓN Y AGRUPACIÓN EXACTA DE DÍAS (0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado):
       - Si una misma actividad ocurre a la misma hora varios días (ej. Lunes a Viernes), agrúpala en UN SOLO objeto con frequencyType: "specific_days" y specificDays: [1, 2, 3, 4, 5].
       - Si una actividad varía según el día (ej. diferentes entrenamientos, limpiezas o proyectos en Lunes, Martes, Miércoles, Jueves, Viernes o Sábado), crea un objeto para cada variación con su día exacto en specificDays (ej. [1] para Lunes, [2] para Martes, [6] para Sábado).
       - Rutina Diaria (7 días): frequencyType: "daily", specificDays: [0, 1, 2, 3, 4, 5, 6].
    6. SIN MICRO-HÁBITOS TRIVIALES: Ignora micro-hábitos triviales como beber agua o lavarse los dientes.
    7. CATEGORÍAS PERMITIDAS: "rutina", "entrenamiento", "comida", "intelecto", "limpieza", "creativo".

    Devuelve ÚNICAMENTE un array JSON ESTRICTO sin formato Markdown. Ejemplo:
    [
      {
        "id": "hab-auto-1",
        "title": "Bloque de Trabajo Principal",
        "category": "rutina",
        "timeBlock": "09:00 - 12:30",
        "frequencyType": "specific_days",
        "specificDays": [1, 2, 3, 4, 5],
        "xpReward": 35,
        "coinReward": 15,
        "quickIcon": "💼",
        "isQuickHabit": false,
        "isTracked2166": false
      }
    ]
  `;

  let generatedText = "";
  const text = await fetchGeminiPrompt(prompt, {
    modelName: 'gemini-3.1-flash-lite',
    systemInstruction,
    jsonMode: true,
    timeoutMs: 30000,
  });
  if (text) {
    generatedText = text;
  }

  if (!generatedText) {
    console.log("[Generate-Schedule] Compiling schedule via Smart Heuristic Engine.");
    const rawProcedural = generateProceduralSchedule(prompt, userContext, mode);
    return {
      habits: autoArrangeSchedule(rawProcedural, mode, maxBlocks),
      source: "heuristic_engine",
      notice: hasActiveGeminiKey()
        ? "⚠️ Gemini IA no respondió a tiempo o hubo un límite temporal. Creamos tu agenda con el Motor Local."
        : "⚠️ No hay clave de Gemini activa; usamos el Motor Local para crear tu agenda."
    };
  }

  let habits = [];
  try {
    let cleanedJson = generatedText.trim();
    cleanedJson = cleanedJson.replace(/^\`\`\`(?:json)?\s*/i, '').replace(/\s*\`\`\`$/i, '').trim();
    const arrayStart = cleanedJson.indexOf('[');
    const arrayEnd = cleanedJson.lastIndexOf(']');
    if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
      cleanedJson = cleanedJson.substring(arrayStart, arrayEnd + 1);
    }
    habits = JSON.parse(cleanedJson);
  } catch (e) {
    console.error("Failed to parse Gemini output:", generatedText);
    const rawProcedural = generateProceduralSchedule(prompt, userContext, mode);
    return {
      habits: autoArrangeSchedule(rawProcedural, mode, maxBlocks),
      source: "heuristic_engine",
      notice: "Agenda estructurada en Bloques Maestros mediante el Motor Neural KAI."
    };
  }

  habits = (Array.isArray(habits) ? habits : []).map((h: any, idx: number) => {
    let parsedDays = h.specificDays !== undefined && h.specificDays !== null ? parseDays(h.specificDays) : [];
    if (parsedDays.length === 0) {
      parsedDays = (h.frequencyType === 'specific_days') ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6];
    }
    const isSpecific = parsedDays.length > 0 && parsedDays.length < 7;
    return {
      ...h,
      id: h.id || `hab-ai-${Date.now()}-${idx}`,
      title: cleanScheduleTitle(h.title) || h.title,
      frequencyType: isSpecific ? 'specific_days' : 'daily',
      isQuickHabit: false,
      isTracked2166: false,
      specificDays: parsedDays
    };
  });

  // Guarantee zero time collisions and clean daily arrangement before returning!
  const arrangedHabits = autoArrangeSchedule(habits, mode, maxBlocks);

  return {
    habits: arrangedHabits,
    source: "ai",
    notice: null
  };
}

export async function generateNeuralAnalysisAI(
  stats: any,
  archetypeClass: string,
  habitMastery: any,
  currentTasks: any[],
  reflections: any,
  tasksByDate: Record<string, any[]> = {}
): Promise<{ analysis: string; source: 'ai' | 'heuristics' }> {
  const pendingTasks = (currentTasks || []).filter((t: any) => !t.completed);
  const completedTasks = (currentTasks || []).filter((t: any) => t.completed);
  const habitEntries = Object.entries(habitMastery || {});

  // Extract tasks that have notes — these give the AI rich context about what the user actually did
  const tasksWithNotes = (currentTasks || []).filter((t: any) => t.notes && t.notes.trim());
  const taskNotesContext = tasksWithNotes.length > 0
    ? tasksWithNotes.map((t: any) => `  • [${t.completed ? '✓' : '⏳'}] ${t.title}: "${t.notes.trim()}"`).join('\n')
    : 'Sin notas de tareas registradas hoy.';

  // Build a 14-day historical context
  const todayStr = new Date().toISOString().split('T')[0];
  const sortedDates = Object.keys(tasksByDate).sort().filter((d: string) => d <= todayStr);
  const recentDates = sortedDates.slice(-14); // up to 14 days

  let historyContext = '';
  if (recentDates.length > 0) {
    recentDates.forEach((date: string) => {
      const dayTasks = tasksByDate[date] || [];
      const completed = dayTasks.filter((t: any) => t.completed).length;
      const pending = dayTasks.filter((t: any) => !t.completed).length;
      const sleep = stats?.sleepLogs?.[date];
      
      let sleepStr = '';
      if (sleep && sleep.bedtime && sleep.wakeTime) {
        sleepStr = ` | Sueño: de ${sleep.bedtime} a ${sleep.wakeTime}`;
      } else if (sleep && sleep.bedtime) {
        sleepStr = ` | Sueño incompleto`;
      }
      
      const notes = dayTasks.filter((t: any) => t.notes && t.notes.trim()).map((t: any) => `"${t.notes.trim()}"`).join(', ');
      const notesStr = notes ? ` | Notas: ${notes}` : '';

      historyContext += `  - ${date}: ${completed} completadas, ${pending} pendientes${sleepStr}${notesStr}\n`;
    });
  } else {
    historyContext = '  - Sin datos históricos suficientes.\n';
  }

  const prompt = `
 Eres KAI, el estratega táctico de alto rendimiento y neuroplasticidad de La Solución.
 Tu misión es analizar la jornada del usuario con precisión analítica, calidez motivacional y enfoque constructivo libre de culpa.
 Presenta conclusiones claras basadas en datos, destacando patrones de progreso y oportunidades de mejora sin generar ansiedad ni reproches.

 DATOS DEL OPERADOR:
 - Rol / Perfil: ${archetypeClass || 'Operador'}
 - Nivel Actual: ${stats?.level || 1} (${stats?.rankTitle || 'Principiante'})
 - Energía Vital (HP): ${stats?.hp || 100}/${stats?.maxHp || 100}
 - Monedas acumuladas: ${stats?.coins || 0}
 - Días de Racha Activa: ${stats?.streakDays || 0} (Días de gracia / Escudos: ${stats?.streakShields || 0})
 - Desglose de Atributos: Disciplina=${stats?.attributes?.disciplina || 0}, Fuerza=${stats?.attributes?.fuerza || 0}, Mente=${stats?.attributes?.mente || 0}, Energía=${stats?.attributes?.energia || 0}, Estudio=${stats?.attributes?.estudio || 0}
 - Tareas Completadas Hoy: ${completedTasks.length} | Tareas Pendientes Hoy: ${pendingTasks.length}
 - Lista de Tareas Pendientes: ${pendingTasks.map((t: any) => t.title).join(', ') || 'Ninguna'}
 - Hábitos en Seguimiento Activo: ${habitEntries.length}
 - Reflexiones Diarias Recientes: ${JSON.stringify(reflections || {})}

 BITÁCORA DE NOTAS Y OBSERVACIONES (HOY):
${taskNotesContext}

 HISTORIAL RECIENTE DE DESEMPEÑO (ÚLTIMOS 14 DÍAS):
${historyContext}

 ESTRUCTURA DEL INFORME REQUERIDO (Usa formato Markdown profesional, estructurado, limpio y sin emojis innecesarios):
 1. **RESUMEN DE ESTADO Y MÉTRICAS**
    - Evalúa de forma concisa el nivel de energía, estado de HP, racha actual y equilibrio de atributos basándote en el día de hoy y el historial reciente. Detecta patrones numéricos (ej. consistencia en completitud de tareas o deficiencia de sueño).
 2. **ANÁLISIS DE PATRONES Y CUELLOS DE BOTELLA**
    - Identifica áreas de eficiencia y áreas de fricción/entropía basándote en el historial de los últimos 14 días y la carga de trabajo pendiente.
 3. **PLAN DE ACCIÓN EJECUTIVO (3 PASOS CLAVE)**
    - Proporciona exactamente 3 acciones tácticas concretas y ejecutables que el cliente debe priorizar hoy para maximizar la productividad y mantener la trayectoria de crecimiento.
  `;

  const text = await fetchGeminiPrompt(prompt, 'gemini-3.1-flash-lite');
  if (text) {
    return { analysis: text, source: 'ai' };
  }

  const fallbackText = generateProceduralAnalysis(stats, archetypeClass, habitMastery, currentTasks);
  return { analysis: fallbackText, source: 'heuristics' };
}

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * 📸 FORJA NEURAL KAI // VECTORIZACIÓN MULTIMODAL GEMINI
 * Transforma una fotografía u objeto real en un compañero holográfico
 * geométrico simétrico (viewBox="0 0 120 120") con líneas neón y núcleo de luz.
 * ══════════════════════════════════════════════════════════════════════════════
 */


/**
 * ══════════════════════════════════════════════════════════════════════════════
 * 🏛️ FORJA NEURAL KAI // PIPELINE "IMAGE-TO-CHARACTER" NATIVO DE ESTUDIO
 * Célula de Expertos Interdisciplinaria:
 * - 1. Erradicación total de Pollinations (cero tiempos de espera o marcas de agua).
 * - 2. Algoritmo de Visión por Computadora: BFS Flood-Fill perimetral + 2px Defringe
 *      en lienzo Canvas de 384x384 para transparencia 100% pura y limpia.
 * - 3. Motor A: Generación Multimodal Nativa de Imagen (responseModalities: ["TEXT", "IMAGE"]).
 * - 4. Motor B (Failover): Escultura Vectorial SVG en Capas Anatómicas (viewBox="0 0 240 240")
 *      siguiendo la regla 80/20 (el chasis del objeto real ES el 80% del personaje).
 * ══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Procesa la imagen en un lienzo <canvas> aplicando Chroma Keying con BFS Flood-Fill
 * desde el perímetro exterior sobre el fondo neutro de estudio.
 * Protege al 100% cualquier elemento oscuro interno (pupilas, trazos negros o sombras del personaje).
 * Aplica un defringe/feathering de 2 píxeles para eliminar cualquier halo perimetral.
 */
export async function processChromaKeyToWebP(imageSource: string): Promise<string> {
  if (typeof window === 'undefined') return imageSource;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const W = 384;
        const H = 384;
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(imageSource);
          return;
        }

        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(img, 0, 0, W, H);

        const imgData = ctx.getImageData(0, 0, W, H);
        const data = imgData.data;

        // 1. Muestreo de las 4 esquinas exteriores para detectar el color base del fondo
        const corners = [0, W - 1, (H - 1) * W, (H - 1) * W + (W - 1)];
        let sumR = 0, sumG = 0, sumB = 0;
        for (const c of corners) {
          sumR += data[c * 4];
          sumG += data[c * 4 + 1];
          sumB += data[c * 4 + 2];
        }
        const bgR = Math.round(sumR / 4);
        const bgG = Math.round(sumG / 4);
        const bgB = Math.round(sumB / 4);
        const bgLum = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;

        // 2. BFS Flood-Fill desde el perímetro exterior
        const isBg = new Uint8Array(W * H);
        const queue = new Int32Array(W * H);
        let qHead = 0;
        let qTail = 0;

        const isSimilarToBg = (idx: number) => {
          const r = data[idx * 4];
          const g = data[idx * 4 + 1];
          const b = data[idx * 4 + 2];
          const dr = r - bgR;
          const dg = g - bgG;
          const db = b - bgB;
          const dist = Math.sqrt(dr * dr + dg * dg + db * db);
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (bgLum < 30) {
            return lum < 28 || dist < 36;
          }
          return dist < 38;
        };

        // Sembrar el perímetro exterior (los 4 bordes)
        for (let x = 0; x < W; x++) {
          const top = x;
          const btm = (H - 1) * W + x;
          if (isSimilarToBg(top) && !isBg[top]) { isBg[top] = 1; queue[qTail++] = top; }
          if (isSimilarToBg(btm) && !isBg[btm]) { isBg[btm] = 1; queue[qTail++] = btm; }
        }
        for (let y = 0; y < H; y++) {
          const lft = y * W;
          const rgt = y * W + (W - 1);
          if (isSimilarToBg(lft) && !isBg[lft]) { isBg[lft] = 1; queue[qTail++] = lft; }
          if (isSimilarToBg(rgt) && !isBg[rgt]) { isBg[rgt] = 1; queue[qTail++] = rgt; }
        }

        // Expansión BFS
        while (qHead < qTail) {
          const curr = queue[qHead++];
          const cx = curr % W;
          const cy = Math.floor(curr / W);

          if (cx > 0) {
            const left = curr - 1;
            if (!isBg[left] && isSimilarToBg(left)) { isBg[left] = 1; queue[qTail++] = left; }
          }
          if (cx < W - 1) {
            const right = curr + 1;
            if (!isBg[right] && isSimilarToBg(right)) { isBg[right] = 1; queue[qTail++] = right; }
          }
          if (cy > 0) {
            const up = curr - W;
            if (!isBg[up] && isSimilarToBg(up)) { isBg[up] = 1; queue[qTail++] = up; }
          }
          if (cy < H - 1) {
            const down = curr + W;
            if (!isBg[down] && isSimilarToBg(down)) { isBg[down] = 1; queue[qTail++] = down; }
          }
        }

        // 3. Defringe / Feathering (2 píxeles de suavizado de borde perimetral)
        const borderDist = new Uint8Array(W * H);
        for (let y = 1; y < H - 1; y++) {
          for (let x = 1; x < W - 1; x++) {
            const idx = y * W + x;
            if (!isBg[idx]) {
              if (isBg[idx - 1] || isBg[idx + 1] || isBg[idx - W] || isBg[idx + W]) {
                borderDist[idx] = 1;
              }
            }
          }
        }
        for (let y = 2; y < H - 2; y++) {
          for (let x = 2; x < W - 2; x++) {
            const idx = y * W + x;
            if (!isBg[idx] && borderDist[idx] === 0) {
              if (borderDist[idx - 1] === 1 || borderDist[idx + 1] === 1 || borderDist[idx - W] === 1 || borderDist[idx + W] === 1) {
                borderDist[idx] = 2;
              }
            }
          }
        }

        // 4. Asignación de canal Alpha (transparencia limpia + anti-aliasing)
        for (let i = 0; i < W * H; i++) {
          if (isBg[i]) {
            data[i * 4 + 3] = 0; // Fondo 100% transparente
          } else if (borderDist[i] === 1) {
            data[i * 4 + 3] = Math.round(data[i * 4 + 3] * 0.45);
          } else if (borderDist[i] === 2) {
            data[i * 4 + 3] = Math.round(data[i * 4 + 3] * 0.85);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/webp', 0.88));
      } catch (err) {
        console.warn('[processChromaKeyToWebP] Error procesando canvas:', err);
        resolve(imageSource);
      }
    };
    img.onerror = () => resolve(imageSource);
    img.src = imageSource;
  });
}

/**
 * Intenta generar la ilustración con Gemini en modalidad nativa de imagen (responseModalities: ["TEXT", "IMAGE"])
 */
export async function generateGeminiNativeImage(params: {
  cleanBase64: string;
  effectiveMime: string;
  illustrationPrompt: string;
}): Promise<string | null> {
  const apiKey = getEffectiveGeminiApiKey();
  if (!apiKey) return null;

  const IMAGE_MODELS = [
    'gemini-2.5-flash-image',
    'gemini-3.1-flash-image',
    'gemini-3.1-flash-lite-image',
    'gemini-3-pro-image-preview',
  ];

  for (const modelName of IMAGE_MODELS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: params.effectiveMime, data: params.cleanBase64 } },
                { text: params.illustrationPrompt },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            temperature: 0.3,
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        for (const p of parts) {
          const inline = p.inlineData || p.inline_data;
          if (inline?.data) {
            const rawDataUrl = `data:${inline.mimeType || inline.mime_type || 'image/png'};base64,${inline.data}`;
            return await processChromaKeyToWebP(rawDataUrl);
          }
        }
      }
    } catch {
      // Intentar siguiente modelo de imagen
    }
  }

  return null;
}

export async function forgeKaiFromImage(params: {
  imageBase64: string;
  mimeType?: string;
  promptDescription?: string;
  artStyle?: KaiMultiverseStyle;
  mood?: KaiTemperament;
  onProgress?: (stage: 'vision' | 'generation', data?: { detectedObject?: string }) => void;
}): Promise<KaiCustomForm | null> {
  const { imageBase64, mimeType = 'image/jpeg', promptDescription = '', artStyle = 'clay3d', mood = 'stoic', onProgress } = params;

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    throw new Error('Falta la imagen a procesar en la Forja Neural.');
  }

  // 1. Limpieza rigurosa del string base64 y extracción de MIME type
  let cleanBase64 = imageBase64;
  let effectiveMime = mimeType || 'image/jpeg';
  if (imageBase64.includes(',')) {
    const parts = imageBase64.split(',');
    const meta = parts[0];
    cleanBase64 = parts[1];
    const mimeMatch = meta.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64/);
    if (mimeMatch) {
      effectiveMime = mimeMatch[1];
    }
  }
  cleanBase64 = cleanBase64.trim().replace(/[\r\n\s]+/g, '');

  // 2. Directivas de estilo maestro: Catálogos completos de diseño para cada universo
  interface StyleMasterConfig {
    styleTitle: string;
    keywordsEn: string;
    promptBody: string;
  }

  function getStyleDirectives(selectedStyle: KaiMultiverseStyle): StyleMasterConfig {
    switch (selectedStyle) {
      case 'cartoon':
        return {
          styleTitle: 'CARTOON NETWORK (EL PANTHEON DORADO & MODERNO DE CN)',
          keywordsEn: 'classic 90s Cartoon Network character design, Dexter Laboratory, Samurai Jack, Powerpuff Girls aesthetic, bold ultra-thick black ink outlines, flat solid vibrant colors, quirky expressive face, dynamic animated stance',
          promptBody: `
📺 ESTILO MAESTRO: CARTOON NETWORK (EL PANTHEON DORADO & MODERNO DE CN)
Referencias visuales directas: Dexter, Las Chicas Superpoderosas, Samurai Jack, Coraje el Perro Cobarde, Ed Edd n Eddy, Billy & Mandy, Chowder, Hora de Aventura, KND: Los Chicos del Barrio, Mansión Foster, Regular Show (Un Show Más), Gumball y Darwin, Johnny Bravo, Steven Universe, Teen Titans Go, Flapjack y We Bare Bears.

1. PRINCIPIO SAGRADO DE LA SILUETA (EL OBJETO COBRA VIDA, NO SE DEFORMA):
- NO forces al objeto a ser un círculo o figura geométrica genérica.
- Analiza minuciosamente la silueta, piezas y contorno REAL de la fotografía:
  * El torso y cabeza ES el objeto real conservando su silueta reconocible.
  * Si tiene piezas mecánicas, tapas o ranuras se convierten en ojos, boca o detalles de su traje / armadura.
- La identidad del objeto debe ser 100% RECONOCIBLE a primer golpe de vista, pero convertido en un ser vivo con alma de caricatura de Cartoon Network.

2. CATÁLOGO VISUAL DE OJOS CN (ELIGE LA COMBINACIÓN QUE MEJOR QUEDE AL OBJETO):
Inspirándote en las referencias, dótalo de uno de los estilos de ojos icónicos de CN:
- Ojos "Powerpuff / Gumball": Dos óvalos blancos grandes juntos en el centro, con pupilas negras de botón o anillo de color brillante con destello blanco gráfico.
- Ojos "Mandy / Samurai Jack": Ceño grueso negro en V cortante que rebana los ojos por arriba, dándole actitud severa, determinada, rebelde o imponente.
- Ojos "Dexter / Numbuh 1 / Johnny Bravo": Gafas estilizadas negras o gafas de laboratorio azuladas que tapan los ojos y le dan misterio o genialidad con reflejo diagonal blanco.
- Ojos "Hora de Aventura / Jake / Finn": Dos puntos o píldoras negras minimalistas llenas de carisma y expresividad pura.
- Ojos "Coraje / Billy / Ed": Ojos saltones ligeramente asimétricos con pupilas desorbitadas que transmiten humor, curiosidad o sorpresa cómica.
- Ojos "Rigby / Mordecai": Óvalos negros con círculos oscuros de ojeras o plumas alrededor.

3. CATÁLOGO VISUAL DE BOCAS Y EXPRESIVIDAD CN:
- Sonrisa cómica de oreja a oreja abierta, con lengua rosa plana y diente solitario caricaturesco (estilo Chowder, Flapjack o Darwin).
- O mueca ladeada sarcástica / confiada en una sola línea angular negra (estilo Dexter o Mandy).
- O boca elástica simple de una sola curva expresiva que se ensancha con humor (estilo Jake o Bloo de Mansión Foster).
- O pico / hocico geométrico integrado a la forma del objeto (estilo Mordecai o Rigby).

4. EXTREMIDADES Y COMPLEMENTOS DE CARTOON NETWORK:
- Brazos y piernas con la física de Cartoon Network:
  * Brazos elásticos y dinámicos (estilo "manguera de goma" de Jake, Finn o Coraje) con manitas de 3 o 4 dedos enguantados (estilo Dexter).
  * O brazos musculosos geométricos si el objeto es robusto (estilo Johnny Bravo o Garnet).
- Calzado caricaturesco reconocible:
  * Botitas pesadas de caricatura con cordones (estilo Numbuh 1 o Edd de Ed Edd n Eddy).
  * Tenis planos bicolores (estilo Darwin o Ben 10).
  * O piececitos negros minimalistas de frijol (estilo Chicas Superpoderosas o Dexter).

5. TÉCNICA VECTORIAL Y PALETA DE COLOR OBLIGATORIA:
- CONTORNO DE TINTA NEGRA PURO: stroke="#000000" con grosor audaz (stroke-width="3.5" a "4.5"), stroke-linejoin="round" y stroke-linecap="round". Cada silueta y detalle debe tener este contorno definido como en los acetatos de animación tradicionales.
- PALETA DE COLOR BASADA EN LA FOTO: Usa estrictamente los colores REALES del objeto fotografiado (si es rojo, usa rojo puro y sombras carmesí; si es verde, verde brillante; etc.).
- COLOR EN BLOQUE PLANO: ¡CERO degradados difuminados, cero luces borrosas ni filtros 3D! Colores planos y sólidos súper vivos (cel-shading). Si agregas sombras, deben ser sombras duras de corte limpio en un tono 20% más oscuro.
`,
        };

      case 'anime':
        return {
          styleTitle: 'ANIME JAPONÉS SHONEN CLÁSICO Y MODERNO',
          keywordsEn: 'authentic 90s anime shonen character, Ken Sugimori Pokemon official lineart, Akira Toriyama Dragon Ball Z aesthetic, high-contrast cel-shaded lighting in 2 sharp tones, sharp ink contours, dynamic warrior stance, expressive eyes with specular highlights, heroic anime companion',
          promptBody: `
⚔️ ESTILO MAESTRO: ANIME JAPONÉS SHONEN CLÁSICO Y MODERNO (ILUSTRACIÓN VECTORIAL CEL-SHADED)
Referencias visuales directas: Ken Sugimori (Pokémon Oficial), Akira Toriyama (Dragon Ball Z), Akiyoshi Hongo (Digimon Tri), Naruto, One Piece, Demon Slayer (Kimetsu no Yaiba) y Jujutsu Kaisen.

1. PRINCIPIO UNIVERSAL DE ANIMACIÓN SHONEN (CERO CONDICIONAMIENTO):
- CUALQUIERA que sea el objeto presente en la fotografía, su estructura física, contorno real, volumen y partes constituyen la anatomía viva del personaje.
- NO alteres ni reemplaces la silueta natural del objeto por figuras geométricas genéricas ni lo encasilles en moldes predefinidos.
- Dota al objeto de vida orgánica integrando rostro, ojos expresivos y extremidades que nazcan armónicamente de su propia masa y proporciones físicas.
- Mantén intactas y reconocibles todas sus piezas, materiales y relieves originales: si tiene hendiduras, botones, tapas, ranuras o aristas, se respetan e integran con el trazo de tinta y sombreado cel-shaded del anime.
- Al ver el personaje, debe ser evidente e inconfundible qué objeto real fue fotografiado.

2. CATÁLOGO ROBUSTO DE EXTREMIDADES SUPERIORES (BRAZOS, GARRAS Y MANOS):
- Brazos "Guanteletes Shinobi / Marciales": Muñequeras de tela enrollada, guantes sin dedos con placas metálicas en el dorso y nudillos reforzados.
- Brazos "Garra Afilada de Bestia Ancestral": 3 o 4 garras curvadas de marfil o filo blanco cel-shaded, con almohadillas en las palmas o escamas triangulares.
- Brazos "Placas de Armadura Biselada / Cyborg": Hombreras angulares con remaches, juntas esféricas en codos y muñecas, y antebrazo blindado.
- Brazos "Manga Larga de Haori / Túnica Marcial": Mangas anchas tradicionales con dobladillo geométrico de donde solo asoman las puntas de los dedos o puños tensos.
- Brazos "Alas Cuchilla / Filos Aerodinámicos": Extremidades con plumas afiladas o membranas que actúan como alas y como brazos gesticulares ágiles.
- Brazos "Guantes de Boxeo / Impacto Redondeado": Guantes de cuero acolchados con costuras cruzadas y brillo especular de impacto.
- Brazos "Cañones de Muñeca / Gauntlet Mecánico": Antebrazo robusto que termina en cañón cilíndrico o garra hidráulica de tres puntas.
- Brazos "Vendajes Deshilachados de Entrenamiento": Tiras de tela elástica blanca que envuelven todo el antebrazo con extremos sueltos ondeando al viento.
- Brazos "Mano Abierta de Invocación / Postura de Energía": Dedos estilizados en arco listos para canalizar un ataque, con líneas de tensión anime.
- Brazos "Puños Tensos Cerrados con Nudillos Marcados": Puño cerrado con pulgar bloqueando los nudillos, trazos afilados de fuerza y líneas de esfuerzo estilizadas.
- Brazos "Mini-Garras Chibi Tiernas pero Temibles": Extremidades cortas y robustas rematadas en 3 garritas blancas que denotan ferocidad contenida.
- Brazos "Zarcillos / Filamentos de Energía": Lazos flexibles o zarcillos que fluyen desde los hombros como látigos de energía cel-shaded.

3. CATÁLOGO ROBUSTO DE EXTREMIDADES INFERIORES, PATAS Y CALZADO:
- Botas "De Combate Saiyan / Armadura Pesada": Botas altas blancas o contrastadas con punteras reforzadas, líneas elásticas verticales y suelas de amortiguación gruesa.
- Botas "Ninja / Shinobi": Calzado de tela ajustada con empeine descubierto, puntera dividida para los dedos o caña atada con cordones cruzados.
- Patas "Bípedas de Bestia / Dragón Digitígradas": Muslos musculosos, corvejones articulados hacia atrás y patas con 3 garras delanteras y 1 espolón trasero de equilibrio.
- Patas "Cuadrúpedas de Felino / Lobo de Batalla": Cuatro patas ágiles con pezuñas o garras retráctiles y mechones de pelaje afilado en los tobillos.
- Patas "Chibi Compactas de Gran Estabilidad": Patitas cortas, redondeadas y firmes, con almohadillas planas para poses sentadas o en cuclillas.
- Zapatillas "Sneakers Urbanas Estilo Shonen": Tenis de bota alta con suela de goma blanca gruesa, lengüeta gigante alzada y cordones sueltos dinámicos.
- Piernas con "Pantalón Gi Plisado / Hakama Marcial": Pantalón holgado de tela pesada recogido en los tobillos con polainas o cintas negras.
- Base "Vórtice de Energía / Nube Voladora / Flotación": El objeto levita sin piernas; su parte inferior se disuelve en una estela cónica de fuego, nube condensada o humo fantasmagórico cel-shaded.
- Patas "Insectoides / Exoesqueleto Quitinoso": Patas segmentadas delgadas pero firmes con espinas laterales y ganchos terminales afilados.
- Calzado "Sandalias Tradicionales Zori / Geta": Suela de madera o paja con correas en V de color vibrante y calcetines tabi blancos.

4. CATÁLOGO ROBUSTO DE OJOS Y MIRADAS ANIME SHONEN:
- Mirada "Determinada / Héroe Shonen": Párpado superior grueso y angulado en diagonal descendente hacia el centro, iris elíptico vertical con degradado bicolor interno (tono claro arriba, tono oscuro abajo) y un destello especular blanco circular nítido.
- Mirada "Ojos Rasgados Fieros / Saiyan / Rival": Líneas de ceño en V agresiva, sombra triangular dura debajo de las cejas, pupilas contraídas en pequeños puntos y párpado inferior tenso.
- Mirada "Ojos Chibi Gigantes / Gran Expresividad": Grandes globos oculares con iris enorme y doble reflejo circular blanco (uno grande arriba, uno pequeño abajo), pupilas negras profundas y brillo de determinación joven.
- Mirada "Pupila de Rendija / Ojo de Bestia": Iris dorado, carmesí o esmeralda con una pupila vertical fina como de reptil o felino despertado.
- Mirada "Ocular Místico / Patrones Concéntricos / Runas": Iris con círculos concéntricos, aspas geométricas o tomoes ninja de poder visual.
- Mirada "Ojos Entrecerrados / Sabio / Sonrisa Astuta": Dos arcos horizontales afilados con pestañas angulares que ocultan los ojos en una expresión de calma imperturbable.
- Mirada "Ojo Único / Sensor Ciclópeo": Un solo ojo central dominante o visor óptico horizontal con brillo de escaneo cel-shaded.
- Mirada "Gafas de Combate / Visor Táctico": Gafas de piloto sobre la frente o visor translúcido con reflejo diagonal blanco y montura técnica.
- Mirada "En Blanco / Furia Berserker": Ojos sin pupila, completamente blancos con contorno afilado y venas de energía en los bordes.

5. CATÁLOGO ROBUSTO DE BOCAS Y EXPRESIVIDAD SHONEN:
- Mueca "Smirk Confiado": Sonrisa ladeada en una sola comisura mostrando un colmillito blanco triangular superior (actitud de rival confiado).
- Sonrisa "Gran Protagonista Shonen": Boca amplia abierta en D horizontal, con hilera superior de dientes lisos y lengua plana de color coral.
- Boca "Grito de Batalla / Rugido": Boca abierta triangular o poligonal con mandíbula tensa, interior oscuro y colmillos superiores e inferiores afilados.
- Mueca "Línea Firme / Concentración Absoluta": Trazo recto horizontal con una pequeña muesca angular hacia abajo en el centro y una línea mínima bajo la boca indicando el labio inferior.
- Mandíbula "Dientes de Tiburón / Monstruo Feroz": Fila completa de dientes triangulares entrelazados como una sierra blanca continua.
- Mueca "Mordiendo una Paja / Hoja / Hilo": Boca cerrada con una ramita verde o hilo de combate asomando entre los labios.
- Boquita "Chibi Adorable en Forma de W (Gatuna / Bicho)": Línea curvada en forma de :3 o W invertida con mejillas sonrojadas.
- Máscara / Protector Facial de Tela: La boca está cubierta por una máscara ninja ajustada al rostro o cuello alto alzado hasta la nariz.

6. CATÁLOGO ROBUSTO DE RASGOS, CABELLO Y ACCESORIOS SHONEN:
- Mechones "Spiky / Cabello Picudo": 3 a 7 mechones triangulares afilados que desafían la gravedad, con sombras de corte recto cel-shaded en cada punta.
- Cuernos y Crestas: Un par de cuernos curvados hacia atrás (tipo dragón o demonio) o un cuerno central afilado de combate tipo escarabajo rinoceronte.
- Bandana / Cinta de la Frente: Tira de tela con placa metálica o broche grabado en el centro, y dos lazos largos flotando dinámicamente hacia atrás.
- Orejas Puntiagudas / Aletas: Orejas largas élficas, aletas laterales membranosas o alas auditivas de plumas.
- Marcas Faciales / Tatuajes de Batalla: Rayas horizontales de guerrero en las mejillas, marcas de maldición tribales, lágrimas o cicatrices finas cruzando un ojo.
- Cola Dinámica: Cola de lagarto gruesa, cola con punta de llama viva cel-shaded, cola peluda con punta blanca o cola segmentada con púas.
- Bufanda / Capa Larga Rasgada: Bufanda roja o negra ondeando dramáticamente hacia un costado, con bordes deshilachados.
- Joyería de Poder: Pendientes colgantes geométricos (estilo potara o hanafuda), cuentas de oración budistas gigantes o collares de garras.
- Aureola / Halo de Energía en Suspensión: Anillo circular u ovalado de energía flotando detrás de la cabeza o alrededor del cuello.
- Fragmentos de Aura / Chispas de Ki Cel-Shaded: 2 o 3 pequeños rombos o triángulos flotando alrededor del cuerpo con opacidad 0.7, simulando energía liberada.

7. TÉCNICA VECTORIAL Y PALETA OBLIGATORIA:
- CONTORNO DE TINTA ANIME: stroke="#111827" o "#0f172a", grosor controlado (stroke-width="2.5" a "3.5"), stroke-linejoin="round" y remates afilados.
- PALETA DE COLOR BASADA EN LA FOTO: Utiliza estrictamente los colores originales del objeto fotografiado como tono base.
- CEL-SHADING DE ALTO CONTRASTE (2 A 3 TONOS): Color base del objeto + sombra plana 25% más oscura cortada con aristas angulares afiladas (cero gradientes difusos ni blur).
- LUCES ESPECULARES AFILADAS: Pequeñas líneas blancas biseladas o triángulos de reflejo (opacity="0.75") en las crestas y bordes superiores.
`,
        };

      case 'pixar':
        return {
          styleTitle: 'ANIMACIÓN 3D DE CINE (PIXAR, DISNEY & DREAMWORKS)',
          keywordsEn: 'high-end 3D animated film character, Disney Pixar and DreamWorks official movie render aesthetic, soft studio lighting in 3 points with warm key light and bright rim light, zero black ink outlines, volumetric ambient occlusion, expressive glass eyes with dual circular catchlights, soft marshmallow tactile limbs, charming character with immense soul, Monsters Inc and Wall-E character design',
          promptBody: `
🎬 ESTILO MAESTRO: ANIMACIÓN 3D DE CINE (PIXAR, DISNEY & DREAMWORKS)
Referencias visuales directas: Toy Story, Monsters Inc (Mike Wazowski y Sulley), Wall-E y EVA, Cars (Rayo McQueen y Mate), Buscando a Nemo / Dory, Up (Carl Fredricksen, Russell y Dug), Ratatouille, Intensamente, Cómo entrenar a tu dragón (Chimuelo), Los Increíbles, Grandes Héroes (Baymax) y los cortometrajes de Pixar.

1. PRINCIPIO SAGRADO DE LA SILUETA (EL OBJETO COBRA VIDA CON ALMA CINEMATOGRÁFICA):
- ¡PROHIBIDO transformar al objeto en un muñeco humano genérico con ropa!
- Al igual que Wall-E es una compactadora viva, Rayo McQueen es un auto vivo, o la Lámpara Luxo Jr. es una lámpara viva:
  * El objeto fotografiado CONSERVA su silueta, masa, volumen, curvaturas y piezas mecánicas o materiales reales.
  * Son sus propias ranuras, botones, tapas, etiquetas o texturas las que se transforman en ojos, boca o detalles orgánicos.
  * Debe ser 100% reconocible el objeto real a primer vistazo, pero infundido con el carisma, la calidez y el alma de un protagonista de película animada de cine.

2. CERO LÍNEAS DE TINTA NEGRA (MODELADO 3D PURO MEDIANTE LUZ Y VOLUMEN):
- ¡PROHIBIDOS los contornos negros duros de cómic o plumón (stroke="#000000" o trazos oscuros gruesos)! En el cine de animación 3D, las líneas negras no existen.
- La tridimensionalidad y los bordes se definen exclusivamente mediante:
  * Iluminación de estudio en 3 puntos: Luz principal cálida desde arriba a la izquierda (<radialGradient> y <linearGradient>), luz de relleno suave, y contraluz (Rim Light brillante en las aristas superiores para despegar al personaje del fondo).
  * Oclusión ambiental suave: Sombras de contacto orgánicas en los pliegues (tonos profundos con opacity="0.2" a "0.45"), dando peso y masa tangible.
  * Sombras de contacto en el piso: Doble elipse bajo los pies/base (<ellipse cx="150" cy="275" rx="75" ry="12" fill="#000000" opacity="0.55"/> y núcleo interno <ellipse cx="150" cy="275" rx="45" ry="7" fill="#000000" opacity="0.8"/>).

3. CATÁLOGO MAESTRO DE OJOS Y MIRADAS PIXAR (EL ESPEJO DEL ALMA):
Inspirándote en las referencias, dótalo de uno de los sistemas oculares cinematográficos que mejor armonicen con el objeto:
- El Ojo de Cristal de Estudio (Doble Catchlight): Esferas de córnea translúcida con iris radial concéntrico en degradado luminoso (azul zafiro, ámbar miel, avellana o esmeralda) y DOS reflejos de foco blanco brillante (un destello circular principal arriba a la izquierda y un micro-destello secundario suave abajo a la derecha).
- Ojos de Cíclope Carismático (Estilo Mike Wazowski): Un único ojo colosal centrado en el torso/cabeza del objeto, con párpados carnosos redondeados, pupilas expresivas y mirada cómica de gran líder.
- Ojos Asimétricos Tiernos (Uno Grande y Uno Pequeño): Un ojo un 25% más grande que el otro o ligeramente desalineado, transmitiendo inocencia, ternura irresistible y curiosidad infantil (estilo criatura de Monsters Inc o Wall-E).
- Ojos en Antenas / Tallos Flexibles: Ojos de bolita brillante montados sobre tallitos carnosos móviles que emergen de la parte superior del objeto (estilo caracol, bicho o extraterrestre de Toy Story).
- Visor Óptico Binocular (Estilo Wall-E / Edna Mode): Lentes dobles de vidrio pulido con montura técnica o gafas de pasta gruesa redondeada con reflejos de luz de estudio diagonales.
- Ojos Digitales LED / Cyber-Clean (Estilo EVA / Baymax): Pantalla o visor negro brillante pulido con cápsulas de luz celeste o azul neón que forman miradas sonrientes o parpadeos suaves.

4. CATÁLOGO MAESTRO DE BOCAS, DIENTES Y GESTOS PIXAR:
- Diente Solitario / Mella Tierna (Estilo Mate / Monstruito Infantil): Sonrisa ancha con un solo dientecito blanco redondeado asomando tímidamente del labio inferior o superior.
- Lengua Colgante Ingenua (Estilo Dug el Perro): Boquita entreabierta con una lengüita rosada redondeada con brillo especular que cae relajada hacia un costado.
- Sonrisa Amplia con Hoyuelos Acolchonados: Comisuras profundas que empujan las mejillas carnosas hacia arriba creando relieve tridimensional.
- Dientes de Sierra Redondeados (Monstruo Suave): Hilera de pequeños dientecitos cónicos pero romos y blancos, que parecen gomitas de dulce, cero amenazantes.
- Mueca de Asombro "O" / Ceja Alzada Escéptica: Boca circular pequeña con labio inferior carnoso y una ceja curvada hacia arriba con actitud curiosa.
- Ranura Mecánica Expresiva: Si el objeto es un electrodoméstico o caja, su ranura se curva suavemente como una sonrisa metálica viva con esquinas redondeadas.

5. EXTREMIDADES, CALZADO Y DETALLES ANATÓMICOS:
- Brazos y Manitas Acolchonadas: Manoplas suaves de 4 dedos rechonchos como malvaviscos, sin articulaciones huesudas rígidas, con palmas acolchonadas.
- Piececitos de Gota / Patitas Chibi: Extremidades inferiores cortitas y cónicas que terminan en deditos redondeados con mini-uñitas suaves como perlas.
- Orugas, Ruedas o Levitación (Mecánica Viva): Si el objeto tiene ruedas, engranajes o propulsores, estos se flexionan elásticamente como zapatitos de goma.
- El Clásico "Parche de Pancita" (Belly Patch): Óvalo o gota en el abdomen de color pastel más claro que el resto del cuerpo, aportando volumen y calidez táctil.
- Cuernitos y Antenas Suaves: Cuernitos romos con brillo satinado (como plástico suave o arcilla pulida) o antenitas con puntas esféricas de luz.
`,
        };

      case 'pop':
        return {
          styleTitle: 'POP ART / VINYL DESIGNER TOY (EDICIÓN LIMITADA)',
          keywordsEn: 'exclusive designer vinyl art toy figure, Funko and Superplastic collectible aesthetic, smooth glossy vinyl finish with studio reflections, clean graphic button eyes, stylized proportions',
          promptBody: `
🎨 ESTILO MAESTRO: POP ART / VINYL TOY DE COLECCIÓN
- Eres un Diseñador Principal de Vinyl Art Toys de colección (estilo Superplastic, Funko, Kidrobot y KAWS).
- TÉCNICA: Trazos vectoriales limpios (stroke="#1e293b" stroke-width="2.2" a "2.6"). Reflejos curvados alargados de plástico brillante nuevo (<ellipse fill="#ffffff" opacity="0.55"/>) que simulan la luz de un estudio sobre vinilo pulido.
- OJOS: Ojos icónicos de diseñador: grandes botones circulares negros de vinilo con un único destello circular blanco nítido descentrado.
- ANATOMÍA: Silueta característica con proporciones coleccionables (cabeza/cuerpo dominante), manos moldeadas y pies planos sólidos de exhibición en repisa.
`,
        };

      case 'doodle':
        return {
          styleTitle: 'FOPPOTEE INK DOODLE ART / ARTE DE TINTA CÓSMICO Y PSICODÉLICO (GÉNESIS LA SOLUCIÓN)',
          keywordsEn: 'authentic Foppotee Ink psychedelic doodle art illustration, dynamic organic hand-drawn black ink contours, 1930s rubberhose vintage cartoon limbs, white cartoon gloves with dynamic gestures, oversized rounded cartoon boots, pie-cut eyes, comprehensive cartoon mouth and eye parameters, living monster morphology on the object, totemic creature design with tiered accordion neck, chest reactor emblem with concentric geometric ripples, optical checkerboards and cross-hatching, isolated character on transparent background',
          promptBody: `
🌀 ESTILO MAESTRO: FOPPOTEE INK DOODLE ART / ARTE DE TINTA CÓSMICO Y PSICODÉLICO (EL GÉNESIS DE LA SOLUCIÓN)
Referencias visuales directas: La obra original "La Solución" (Foppotee 16), el universo de tótems robot y criaturas cósmicas de Foppotee Ink, el códice de glifos modulares, la estética Rubberhose vintage de los años 30 (brazos de manguera, guantes blancos de 3 dedos, botitas gigantes), y el atlas enciclopédico de ojos, bocas, expresiones y morfología monstruosa.

1. PRINCIPIO SAGRADO DEL DOODLE VIVO (EL OBJETO MUTADO EN CRIATURA CENTRAL):
- ¡EL OBJETO ES EL ÚNICO PROTAGONISTA! NO añadas monstruitos ni mascotas secundarias flotando alrededor. Toda la energía, ojos, bocas y mutaciones monstruosas se concentran 100% EN EL PROPIO OBJETO.
- CUALQUIERA que sea el objeto fotografiado (una taza, un control, un casete, unas llaves, una fruta, un libro o una herramienta):
  * Sus contornos, ranuras, esquinas y curvaturas reales se convierten en la anatomía viva del personaje.
  * Su superficie se puebla con tramas de tinta fluidas, espirales, lunares, franjas cebra y patrones geométricos de Foppotee Ink.
  * Adopta rasgos de monstruo/tótem directamente en su cuerpo: cuernos que brotan de su corona, crestas o antenas.
  * Cobra vida con extremidades Rubberhose elásticas y gesticulación expresiva (camina, saluda o posa con actitud).
  * El objeto debe ser 100% RECONOCIBLE a primer golpe de vista, pero convertido en un ser cósmico de tinta pura.

2. REGLA SAGRADA DE ANCLAJE FACIAL Y COHESIÓN (¡CERO OJOS O BOCAS FLOTANDO O DISPERSOS!):
- COHESIÓN DEL ROSTRO: Los ojos y la boca DEBEN formar una unidad facial coherente, simétrica y reconocible sobre la "cara" frontal del objeto.
- ¡ESTRICTAMENTE PROHIBIDO poner los ojos en una esquina y la boca en otra parte lejana, en las piernas, o flotando en el aire fuera del cuerpo!
- COORDENADAS ANATÓMICAS DE REFERENCIA EN viewBox="0 0 300 300":
  * Eje central vertical del personaje: X ≈ 150.
  * Ojos: Situados juntos en la mitad superior del objeto (Y ≈ 110 - 135), separados equilibradamente del centro (X ≈ 130 y X ≈ 170, o un solo cíclope centrado en X = 150).
  * Boca: Situada INMEDIATAMENTE debajo de los ojos (Y ≈ 150 - 175), a solo 20 a 35 píxeles de distancia de los ojos, perfectamente alineada al centro X ≈ 150.
  * Ojos y boca deben estar dibujados directamente SOBRE la masa del objeto, formando un triángulo facial natural y carismático que se lee al instante.

3. ATLAS ENCICLOPÉDICO DE OJOS Y MIRADAS (SELECCIONA LA COMBINACIÓN MÁS EXPRESIVA PARA EL OBJETO):
- Ojos "Pie-Cut" Vintage (Animación Clásica 1930s): Grandes óvalos negros con un triángulo blanco rebanado ("corte de pastel") en la esquina superior, cejas arqueadas de plumilla y pestañas audaces.
- Ojos de Cíclope Colosal: Un único gran ojo esférico dominante centrado en el objeto con pupilas concéntricas o de ranura vertical mística.
- Ojos en Antenas Telescópicas / Cuernos: Dos globos oculares montados sobre tallitos o tentáculos elásticos que nacen de la parte superior del objeto.
- Ojos de Estrella Negra Sólida (★) o Diamante (💎): Pupilas con forma de estrellas negras o rombos celestiales con destellos gráficos.
- Ojos de Medialuna Creciente (🌙): Ojos con forma de medialuna horizontal o vertical, transmitiendo picardía, sueño o calma zen.
- Ojos de Espiral Hipnótica (Trance / Dizzy): Iris formados por espirales concéntricas continuas (@_@) que giran hacia el centro, denotando hiperfoco o trance creativo.
- Ojos de Símbolo de Dólar ($$) / Cruz de K.O. (X_X): Expresiones cómicas de riqueza mental o desconexión divertida.
- Ojos Múltiples de Tótem / Oruga: Fila de 3, 4 o 5 ojitos curiosos apilados vertical u horizontalmente en las hendiduras del objeto, mirando en distintas direcciones.
- Ojos con Gafas de Sol Negras / Wayfarer Retro: Gafas oscuras con reflejos blancos que le dan una actitud rebelde, audaz y ultra-cool.
- Ojos Somnolientos / Párpados Caídos: Ojos semicerrados con bolsas u ojeras de plumilla, cejas relajadas o mirada relajada/zen.
- Ojos de Asombro Exorbitado: Grandes cuencas circulares con pupilas flotantes diminutas y cejas disparadas hacia arriba en sorpresa absoluta.
- Ojos con Gafas / Monóculo Erudito: Gafas redondas de pasta gruesa o monóculo con cadenita colgante que le dan aire de científico loco o erudito cósmico.
- El Tercer Ojo del Prisma: Ojo almendrado central superior con rayos solares o pestañas triangulares, vigilando el cosmos.

3. ATLAS ENCICLOPÉDICO DE BOCAS, DIENTES Y LABIOS (SELECCIONA EL GESTO PERFECTO):
- Sonrisa de Rejilla Dentada (El Sello Legendario Foppotee): Boca rectangular o curva amplia con dientes planos en bloque continuo blanco divididos por líneas de tinta negra (estilo tótem sonriente o pantalla analógica).
- Boca de Media Luna Rubberhose Abierta: Enorme sonrisa arqueada abierta de par en par con interior negro sólido, lengüita curva rosada y comisuras marcadas.
- Mandíbula de Dientes de Tiburón / Sierra: Hilera de dientes triangulares afilados entrelazados en zigzag continuo (feroz pero caricaturesco).
- Dientes Mellados / Cómicos: Hilera con un diente solitario arriba, dos paletas de conejo separadas o colmillitos de vampiro en las comisuras.
- Boquita Kaomoji Gatuna (:3) o Puchero: Línea suave en forma de W con mejillas ruborizadas con tramas finas (///).
- Media Sonrisa Cómplice / Smirk Asimétrico: Curva lateral pícara con una ceja levantada, irradiando confianza y astucia.
- Boca de Dientes Apretados en Tensión: Línea horizontal tensa con cuadrícula de dientes cerrados, denotando concentración extrema o esfuerzo heroico.
- Boca con Puntadas / Costuras: Línea horizontal cerrada cosida con pequeñas puntadas verticales de hilo negro.
- Labios Gruesos Carnosos Psicodélicos: Labios prominentes redondeados estilo máscara africana o arte totémico, con sombra interior y muescas expresivas.
- Boquita de Silbido o Trompeta en "O": Pequeño círculo fruncido con arrugas radiales, silbando una melodía cósmica.
- Mandíbula Desencajada de Asombro (D:): Boca rectangular vertical abierta mostrando toda la cavidad oscura en un grito cómico de sorpresa.
- Lengua Desorbitada Lateral (Bleh / Pfff): Lengüita fucsia o roja que sale de lado con ojos traviesos o guiñando un ojo.

4. MORFOLOGÍA MONSTRUOSA INTEGRADA AL OBJETO (EL OBJETO ES LA CRIATURA):
- Cuernos y Crestas Vivas: Cuernos afilados de diablillo, cuernos curvados de carnero, aletas de pez abisal o crestas de dinosaurio que nacen directamente de la estructura del objeto.
- Antenas y Sensores: Antenas elásticas con esferas de señal, espirales de alambre o brotes vegetales que germinan de sus botones o esquinas.
- Texturas Cutáneas del Objeto: Parches de vendas estilo momia, escamas de reptil, espinas de cactus, o remaches de armadura cibernética grabados con tinta en su superficie.
- Cuello de Acordeón Escalonado: En la base o entre piezas articuladas, capas elásticas en fuelle que le dan movilidad de tótem alienígena.
- El Núcleo / Reactor en el Pecho: Un epicentro de energía grabado en su torso:
  * El Prisma Cuántico (triángulo con ojo o punto central, el símbolo de La Solución).
  * Diamante / Rombo concéntrico en capas multicolor.
  * Escudo hexagonal concéntrico o cruz solar geométrica.
  * Espiral concéntrica hipnótica de poder.

5. EXTREMIDADES RUBBERHOSE, GUANTES CLÁSICOS Y CALZADO:
- Brazos de Manguera Elástica: Trazos curvados negros continuos de tinta fluida (stroke="#0a0a0c" stroke-width="4.5" a "5.5") que se flexionan libremente sin articulaciones rígidas.
- Manitas Enguantadas de Caricatura (3 o 4 Dedos): Guantes blancos acolchados con las 3 líneas de costura negras características en el dorso:
  * Gesto de Triunfo: Puño cerrado en alto con fuerza.
  * Gesto de Paz / Victoria: Dos dedos en V extendidos (✌️).
  * Gesto de Rock / Energía: Mano con cuernos extendidos (🤘).
  * Gesto de Aprobación: Pulgar hacia arriba nítido (👍).
  * Gesto de Dirección: Dedo índice apuntando al frente con dinamismo.
  * Palmas Abiertas: Manitas flotantes gesticulando al caminar.
- Piernas y Botas Gigantes de Caricatura:
  * Piernitas de manguera negra con doblez elástico.
  * Zapatones gigantes redondeados estilo clown/vintage, con dobladillo acolchonado tipo "rosquilla" en los tobillos y suela ancha de apoyo que da firmeza y pose de animación clásica.

6. TRAMAS ÓPTICAS Y TÉCNICA VECTORIAL (FONDO LIMPIO Y TRANSPARENTE):
- Tramas Ópticas de Alto Contraste en el Cuerpo: Tableros de ajedrez curvos que se deforman hacia el horizonte, líneas de velocidad paralelas, tramas cruzadas (cross-hatching) y lunares orgánicos integrados en la piel del objeto.
- Códice de Glifos Modulares: Pequeñas baldosas o parches sobre el cuerpo del objeto con mini-laberintos, flores psicodélicas, ondas de señal Wi-Fi, soles y pirámides.
- LÍNEA DE TINTA NEGRA MAESTRA: stroke="#0a0a0c" con grosores orgánicos (contorno maestro stroke-width="3.2" a "4.5", tramas internas "1.4" a "2.0"), stroke-linejoin="round" y stroke-linecap="round".
- PALETA DE COLOR FOPPOTEE INK:
  * Base: Colores originales del objeto fotografiado.
  * Acentos Saturados: Amarillo cálido/sol (#facc15), magenta flúor (#ec4899), cian eléctrico (#06b6d4), verde lima (#84cc16) y naranja fuego (#f97316).
  * Blanco y Negro de Alto Impacto: Para guantes, calzado, ojos pie-cut y tramas de ajedrez óptico que hacen vibrar al personaje.
- 100% AISLADO EN FONDO TRANSPARENTE: El personaje es la única figura en el lienzo, con una sombra de contacto suave bajo las botas (<ellipse cx="150" cy="275" rx="72" ry="10" fill="#000000" opacity="0.45"/>). ¡CERO elementos parásitos ni mini-criaturas flotando alrededor!
`,
        };

      case 'clay3d':
      default:
        return {
          styleTitle: 'CLAYMATION 3D / PLASTILINA STOP-MOTION (AARDMAN & LAIKA STUDIOS)',
          keywordsEn: 'authentic handmade claymation stop-motion puppet, Aardman Wallace and Gromit plasticine sculpture, Shaun the Sheep and Morph aesthetic, soft satin matte clay volume, rolled clay arms and limbs, tactile squished dough eyes with tiny black bead pupils, sculpted replacement mouth with crooked teeth, studio tabletop contact shadow, zero black ink outlines',
          promptBody: `
🏺 ESTILO MAESTRO: CLAYMATION 3D / PLASTILINA STOP-MOTION (AARDMAN & LAIKA STUDIOS)
Referencias visuales directas: Wallace & Gromit (Aardman Studios), Shaun the Sheep (La Oveja Shaun), Morph (Peter Lord), Pollitos en Fuga (Chicken Run), Coraline (Laika Studios), The Neverhood y Celebrity Deathmatch.

1. PRINCIPIO DE LA ESCULTURA DE MASA (EL OBJETO MOLDEADO A MANO):
- Imagina que un maestro escultor de Aardman tomó una barra de plastilina sólida y esculpió con sus propias manos el objeto fotografiado:
  * El torso y cabeza CONSERVAN la silueta, masa y proporciones reales del objeto, pero con las esquinas suavizadas y redondeadas como masa maleable moldeada a mano.
  * Si el objeto tiene botones, tapas, piezas, hendiduras o bisagras, estas son pequeñas piezas de plastilina de color pegadas a mano con ligeras asimetrías orgánicas.
  * 100% LIBRE DE FONDO RECTANGULAR: El personaje flota en transparencia pura con una sombra de contacto suave de plastilina apoyada en el piso (<ellipse cx="150" cy="275" rx="72" ry="11" fill="#000000" opacity="0.6"/>).

2. CERO LÍNEAS DE TINTA (VOLUMEN ORGÁNICO DE ARCILLA SATINADA):
- ¡PROHIBIDO el contorno de tinta negra de dibujo animado o cómic (stroke="#000000")!
- El volumen tridimensional se logra con gradientes suaves (<radialGradient> y <linearGradient>) con acabado satinado mate (cero brillos hiper-reflejantes de plástico duro ni vidrio).
- Pliegues, hendiduras y ranuras moldeadas: Las uniones entre piezas parecen apretadas a mano con una espátula o con los pulgares.

3. CATÁLOGO MAESTRO DE OJOS DE PLASTILINA (AARDMAN EYE SYSTEM):
- Ojos de Bolita de Masa Aplastada: Dos esferas de plastilina blanca pegadas una junto a la otra sobre la cara, con una pequeña mota negra de plastilina aplastada como pupila ligeramente descentrada.
- Ojos con Párpados Pellizcados: Capuchas de plastilina del mismo color de la piel que cubren la parte superior de los ojos para dar expresiones de duda, sueño, picardía o calma (estilo Gromit o Shaun the Sheep).
- Ojos Asimétricos de Criatura (Estilo Morph / Neverhood): Una bolita de ojo ligeramente más grande que la otra, con pupilas desalineadas que dan un encanto ingenuo y divertido.
- Ojos Cíclope de Arcilla: Un único gran ojo esférico de masa blanca incrustado en el centro del objeto con párpados arrugados de plastilina.

4. CATÁLOGO MAESTRO DE BOCAS Y DIENTES DE STOP-MOTION:
- Sonrisa Wallace (Labio de Salchicha con Fila Dentada Cuadrada): Boca ancha estirada con labio superior redondeado y una hilera de dientes blancos planos esculpidos en bloque continuo.
- Boca de Hendidura con Espátula: Ranura profunda tallada directamente en la masa del objeto, con sombra interior oscura y comisuras hundidas.
- Boca con Dientecitos Chuecos Incrustados (Replacement Mouths): Boquita abierta de plastilina con 2 o 3 pequeños dientecitos irregulares de color beige/hueso saliendo en ángulos divertidos.
- Lengua de Gota de Plastilina: Lengüita rosada de masa húmeda asomando relajada entre los labios.
- Boquita de Agujero Sorprendido "O": Agujero cilíndrico hundido en la arcilla que denota sorpresa cómica.

5. EXTREMIDADES Y DETALLES DE MODELADO:
- Brazos de Rollito de Masa: Extremidades flexibles y gruesas como rollitos de arcilla amasada a mano, con manitas de 3 o 4 dedos gorditos de plastilina sin líneas de articulación mecánicas.
- Patas y Calzado de Escultura: Pies cilíndricos sólidos o zapatitos moldeados de plastilina negra/marrón con base plana para sostener al personaje de pie en la mesa de filmación.
- Nariz de Bolita / Botón de Plastilina: Pequeña esferita o cono redondeado pegado entre los ojos.
`,
        };
    }
  }

  const directives = getStyleDirectives(artStyle);
  const keywordsEn = directives.keywordsEn;

  // Modulador de temperamento / actitud facial
  let moodGuidance = 'Actitud estoica, noble, firme y confiable.';
  if (mood === 'mischievous' || mood === 'playful') {
    moodGuidance = 'Actitud pícara, traviesa y audaz (sonrisa de medio lado, ceja alzada con energía juguetona).';
  } else if (mood === 'fierce' || mood === 'determined') {
    moodGuidance = 'Actitud feroz, determinada e intensa (ceño fruncido con determinación de combate, mirada focalizada).';
  } else if (mood === 'zen' || mood === 'mystic') {
    moodGuidance = 'Actitud serena, mística y en paz (ojos entrecerrados o plácidos, sonrisa tranquila y sabia).';
  } else if (mood === 'cheerful' || mood === 'happy') {
    moodGuidance = 'Actitud alegre, optimista y festiva (ojos abiertos llenos de luz, sonrisa amplia y carismática).';
  }

  // 3. Prompt Maestro Multimodal "Object-As-Body" Dinámico por Estilo
  const systemInstructions = `
Transforma este objeto real fotografiado en un personaje legendario en código SVG puro (viewBox="0 0 300 300").

${directives.promptBody}

DIRECTIVAS GENERALES DE INTEGRACIÓN:
1. EXPRESIVIDAD Y ACTITUD:
   - ${moodGuidance}
   - ¡PROHIBIDAS LAS LÍNEAS DE ALAMBRE ("PALO Y BOLITA")! Las extremidades deben tener masa y volumen propio según el catálogo del estilo elegido.

2. COMPOSICIÓN Y TRANSPARENCIA:
   - Si el objeto emite fuego, energía, chispas o vapor (ej: encendedor, vape), añade una flama o efecto estilizado en la cúspide según el estilo.
   - Sombra de contacto suave en la base (<ellipse cy="275" ...>) para apoyarlo con presencia sólida en el suelo.
   - 100% libre de fondo exterior rectangular (el SVG debe ser transparente para flotar en la interfaz de la app).

3. ANCLAJE ANATÓMICO Y COHESIÓN FACIAL (¡REGLA OBLIGATORIA!):
   - El rostro completo (ojos, cejas y boca) DEBE estar ubicado DENTRO de la masa superior o frontal del objeto, formando un triángulo facial compacto, simétrico y centrado sobre el eje vertical X ≈ 150.
   - La boca debe situarse INMEDIATAMENTE debajo de los ojos (a solo 20 a 35px de distancia vertical), NUNCA separada en esquinas, en las piernas ni flotando fuera del cuerpo.
   - ¡CERO desconexión espacial! La cara debe ser una unidad armónica que se reconozca al primer vistazo.

${promptDescription ? `- Instrucción especial del operador: "${promptDescription}".` : ''}

ESTRUCTURA EXACTA DE TU RESPUESTA:
===METADATA===
OBJECT: Nombre exacto del objeto identificado en español
NAME: Nombre memorable del personaje (máx 24 caracteres)
QUOTE: Frase carismática corta del personaje acorde a su estilo y actitud
PRIMARY_COLOR: #hex
SECONDARY_COLOR: #hex
===SVG===
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="100%" height="100%">
...
</svg>
(IMPORTANTE: Tu respuesta concluye estrictamente en </svg>. NO añadas ===END=== ni ningún texto después de </svg>).
`;

  let rawResult: string | null = null;
  let lastErrorMessage = '';

  const CANDIDATE_MODELS = [
    'gemini-3-flash-preview',
    'gemini-3.5-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest',
  ];

  // 1. Análisis e Ilustración Multimodal Primaria con Gemini Developer API
  const apiKeyToTry = getEffectiveGeminiApiKey();
  if (apiKeyToTry) {
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKeyToTry}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { inlineData: { mimeType: effectiveMime, data: cleanBase64 } },
                  { text: systemInstructions },
                ],
              },
            ],
            generationConfig: { temperature: 0.65, maxOutputTokens: 8192 },
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.trim()) {
            rawResult = text.trim();
            console.log(`[Gemini API Multimodal] ✓ Personaje ilustrado con éxito usando ${modelName}`);
            break;
          }
        } else {
          const errData = await res.json().catch(() => null);
          lastErrorMessage = errData?.error?.message || `HTTP ${res.status}`;
        }
      } catch (fetchErr: any) {
        lastErrorMessage = fetchErr?.message || String(fetchErr);
      }
    }
  }

  // 2. Respaldo Firebase AI Logic si el directo no respondió
  if (!rawResult && firebaseAI) {
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = getGenerativeModel(firebaseAI, {
          model: modelName,
          generationConfig: {
            temperature: 0.65,
            maxOutputTokens: 8192,
          },
        });

        const imagePart = {
          inlineData: {
            data: cleanBase64,
            mimeType: effectiveMime,
          },
        };

        const result = await model.generateContent([systemInstructions, imagePart]);
        const text = result.response.text();
        if (text && text.trim()) {
          rawResult = text.trim();
          console.log(`[Firebase AI Logic] ✓ Personaje ilustrado con éxito usando ${modelName}`);
          break;
        }
      } catch (err: any) {
        lastErrorMessage = err?.message || String(err);
        console.warn(`[Firebase AI Logic Multimodal] (${modelName}) error:`, lastErrorMessage);
      }
    }
  }

  if (!rawResult) {
    throw new Error(
      lastErrorMessage
        ? `Error al analizar la imagen con KAI: ${lastErrorMessage}`
        : 'No se pudo conectar con el servicio visual de KAI para analizar la imagen. Por favor verifica tu conexión.'
    );
  }

  // 3. Extracción de Metadatos y Código SVG Puro
  let detectedObject = 'Objeto Escaneado';
  let epicName = promptDescription ? `KAI ${promptDescription.slice(0, 16)}` : 'KAI Legendario';
  let personalityQuote = `¡Con toda la energía y presencia del Multiverso!`;
  let primaryColor = '#FF4757';
  let secondaryColor = '#2ED573';
  let svgContent: string | undefined = undefined;

  // Si viene con el separador estructurado ===SVG===
  if (rawResult.includes('===SVG===')) {
    const parts = rawResult.split(/===SVG===/i);
    const metaBlock = parts[0] || '';
    const svgBlock = parts[1] || '';

    const objMatch = metaBlock.match(/OBJECT:\s*(.+)/i);
    if (objMatch) detectedObject = objMatch[1].trim();

    const nameMatch = metaBlock.match(/NAME:\s*(.+)/i);
    if (nameMatch) epicName = nameMatch[1].trim().slice(0, 28);

    const quoteMatch = metaBlock.match(/QUOTE:\s*(.+)/i);
    if (quoteMatch) personalityQuote = quoteMatch[1].trim();

    const pColorMatch = metaBlock.match(/PRIMARY_COLOR:\s*(#[0-9a-fA-F]{3,8})/i);
    if (pColorMatch) primaryColor = pColorMatch[1].trim();

    const sColorMatch = metaBlock.match(/SECONDARY_COLOR:\s*(#[0-9a-fA-F]{3,8})/i);
    if (sColorMatch) secondaryColor = sColorMatch[1].trim();

    svgContent = svgBlock.trim();
  } else {
    // Si no contiene el delimitador, buscar bloque <svg> directamente
    const svgMatch = rawResult.match(/<svg[\s\S]*<\/svg>/i);
    if (svgMatch) {
      svgContent = svgMatch[0].trim();
    } else if (rawResult.includes('<svg')) {
      const startIndex = rawResult.indexOf('<svg');
      svgContent = rawResult.substring(startIndex).trim();
    }
  }

  // Limpiar y aislar estrictamente el código SVG puro (eliminando cualquier ===END=== o texto residual)
  if (svgContent) {
    // Eliminar fences de markdown
    svgContent = svgContent.replace(/^```(?:svg|xml|html)?\s*/i, '').replace(/\s*```$/i, '').trim();

    // Recorte estricto de apertura <svg a cierre </svg>
    const openIdx = svgContent.indexOf('<svg');
    const closeIdx = svgContent.lastIndexOf('</svg>');

    if (openIdx !== -1 && closeIdx !== -1 && closeIdx > openIdx) {
      svgContent = svgContent.substring(openIdx, closeIdx + 6).trim();
    } else if (openIdx !== -1) {
      let trimmed = svgContent.substring(openIdx);
      trimmed = trimmed.replace(/={2,}\s*[a-zA-Z0-9_\-]+\s*={2,}[\s\S]*/g, '').trim();
      svgContent = trimmed.endsWith('</svg>') ? trimmed : `${trimmed}</svg>`;
    } else {
      let trimmed = svgContent.replace(/={2,}\s*[a-zA-Z0-9_\-]+\s*={2,}[\s\S]*/g, '').trim();
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="100%" height="100%">${trimmed}</svg>`;
    }

    // Purgar de raíz cualquier marcador delimitador residual (ej: ===END===)
    svgContent = svgContent.replace(/={2,}\s*[a-zA-Z0-9_\-]+\s*={2,}/g, '').trim();
  }

  // Si no se pudo extraer SVG, arrojar error descriptivo
  if (!svgContent) {
    throw new Error('La IA analizó el objeto pero no pudo completar el diseño vectorial. Intenta de nuevo.');
  }

  // Notificar progreso a la UI
  if (onProgress) {
    onProgress('vision', { detectedObject });
    onProgress('generation', { detectedObject });
  }

  // En modo vector puro, retornamos el SVG directamente a máxima velocidad
  const imageUrl: string | undefined = undefined;

  return {
    name: epicName,
    sourceType: 'image',
    createdAt: new Date().toISOString(),
    detectedObject,
    characterConcept: `${detectedObject} con vida propia`,
    artStyle,
    personalityQuote,
    primaryColor,
    secondaryColor,
    mood: mood || 'stoic',
    renderBranch: imageUrl ? 'illustration' : 'vector',
    imageUrl: imageUrl || undefined,
    svgContent: svgContent || undefined,
  };
}


