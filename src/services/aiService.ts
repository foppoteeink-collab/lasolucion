import { getGenerativeModel } from 'firebase/ai';
import { firebaseAI, firebaseConfig } from '../firebase';
import { generateProceduralSchedule, generateProceduralAnalysis } from '../utils/proceduralHeuristics';
import { autoArrangeSchedule, cleanScheduleTitle } from '../utils/timeUtils';
import { KaiCustomForm } from '../types';

interface RateLimitState {
  lastCallTimestamp: number;
  countToday: number;
  dateKey: string;
}

const RATE_LIMIT_STORAGE_KEY = 'lasolucion_ai_ratelimit_v1';
const MIN_COOLDOWN_MS = 8000; // 8 seconds minimum between calls
const MAX_CALLS_PER_DAY = 20;

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
      return { allowed: false, reason: `Cooldown activo: Espera ${waitSec}s antes de otra consulta.` };
    }

    if (state.countToday >= MAX_CALLS_PER_DAY) {
      return { allowed: false, reason: 'Límite diario alcanzado (20 consultas/día).' };
    }

    state.lastCallTimestamp = now;
    state.countToday += 1;
    window.localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(state));
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

async function fetchGeminiPrompt(promptText: string, modelName: string = 'gemini-3.8-flash'): Promise<string | null> {
  if (!promptText || typeof promptText !== 'string' || !promptText.trim()) {
    return null;
  }

  const rateCheck = checkAndConsumeRateLimit();
  if (!rateCheck.allowed) {
    console.warn(`[AI Protection] ${rateCheck.reason}. Usando heurísticas locales.`);
    return null;
  }

  const sanitizedPrompt = promptText.trim().slice(0, 4000);
  const targetModel =
    modelName.includes('1.5') || modelName.includes('2.0') || modelName.includes('2.5') || modelName.includes('3.6')
      ? 'gemini-3.8-flash'
      : modelName;

  // 1. Primary: Official Firebase AI Logic SDK (GoogleAIBackend -> gemini-3.8-flash)
  if (firebaseAI) {
    try {
      const model = getGenerativeModel(firebaseAI, {
        model: targetModel,
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 8192,
        },
      });
      const result = await model.generateContent(sanitizedPrompt);
      const text = result.response.text();
      if (text && text.trim()) {
        console.log(`[Firebase AI Logic] ✓ Response from ${targetModel}`);
        return text;
      }
    } catch (err: any) {
      console.warn(`[Firebase AI Logic] (${targetModel}) unavailable:`, err?.message || err);
    }
  }

  // 2. Secondary: Direct Gemini Developer API (if custom key or gen-lang-client key is active)
  const customKey =
    typeof window !== 'undefined' ? window.localStorage.getItem('lasolucion_gemini_api_key') : null;
  const apiKeyToTry = customKey || firebaseConfig?.apiKey;
  if (apiKeyToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKeyToTry}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: sanitizedPrompt }] }],
          generationConfig: { temperature: 0.35, maxOutputTokens: 8192 },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) {
          console.log(`[Gemini API] ✓ Response from ${targetModel}`);
          return text;
        }
      }
    } catch (err) {
      // Ignore and proceed to fallback
    }
  }

  // 3. Only if hosted on Netlify, try local Netlify function with short timeout
  const isNetlifyHost =
    typeof window !== 'undefined' && window.location.hostname.includes('netlify.app');
  if (isNetlifyHost) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch('/.netlify/functions/oraculo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, model: targetModel }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }
      }
    } catch {
      // Ignore
    }
  }

  return null;
}

export async function generateScheduleFrontend(
  prompt: string,
  userContext: any,
  _existingHabits: any[],
  mode: 'master_blocks' | 'detailed' = 'master_blocks'
): Promise<any> {
  if (!prompt) throw new Error("Falta el prompt del usuario.");

  const isMasterBlocks = mode === 'master_blocks';
  const maxBlocks = isMasterBlocks ? 7 : 10;

  const modeDirective = isMasterBlocks
    ? `MODO ESTRATÉGICO: "BLOQUES MAESTROS" (Consolidación y Claridad)
       - Sintetiza el día en un máximo de 5 a 7 bloques maestros claros, equilibrados y sin saturar la agenda.
       - Si hay varias micro-tareas similares, agrúpalas en un solo bloque coherente con un título limpio (NUNCA uses la palabra "(Consolidado)").`
    : `MODO ESTRATÉGICO: "DETALLADO" (Granularidad Ordenada)
       - Estructura el día en un máximo de 7 a 10 bloques bien distribuidos sin choques de horario.`;

  const systemInstruction = `
    Eres KAI, el estratega táctico de alto rendimiento y neuroplasticidad de La Solución.
    Tu misión es analizar la solicitud del usuario y transformarla en una AGENDA DIARIA LIMPIA, EQUILIBRADA Y 100% LIBRE DE CHOQUES DE HORARIO.
    Comunícate con claridad, calidez motivacional y enfoque constructivo libre de culpa, respetando los tiempos de descanso y optimizando la energía mental.

    ${modeDirective}

    CONTEXTO DEL OPERADOR:
    - Profesión/Ocupación: ${userContext?.profession || 'No especificada'}
    - Objetivo Principal: ${userContext?.mainGoal || 'No especificado'}
    - Clase/Rango: ${userContext?.class || 'Ninguna'} (${userContext?.rank || 'Principiante'})

    REGLAS OBLIGATORIAS DE HORARIO Y ESTRUCTURA:
    1. CANTIDAD IDEAL: Genera entre 5 y ${maxBlocks} bloques en total para el día (máximo ${maxBlocks}). NUNCA generes más de ${maxBlocks} bloques ni superes las 11 horas planificadas por día.
    2. FORMATO DE HORA ESTRICTO "HH:mm - HH:mm" (24h, entre 06:30 y 22:45). Ejemplo: "08:00 - 09:30", "13:00 - 14:00", "18:00 - 19:00". NUNCA pongas horas como "20:30 - 23:59" ni bloques que terminen a las 23:59.
    3. CERO SOLAPAMIENTOS: Ningún bloque puede solaparse con otro en el mismo día. Deja transiciones lógicas (mañana -> almuerzo -> tarde -> entrenamiento/creativo -> descanso).
    4. TÍTULOS LIMPIOS Y EJECUTABLES: Prohibido usar textos como "(Consolidado)", "Tarea extra:", o "Horario Semanal Completo".
    5. DÍAS DE LA SEMANA: usa frequencyType: "specific_days" y specificDays (Dom=0, Lun=1, Mar=2, Mié=3, Jue=4, Vie=5, Sáb=6) cuando aplique a días concretos (ej. L-V es [1,2,3,4,5]), o frequencyType: "daily" y specificDays: [0,1,2,3,4,5,6] si aplica a toda la semana.
    6. PROHIBICIÓN TOTAL DE MICRO-HÁBITOS (agua, pasos, cepillado de dientes).
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
  const fullPrompt = systemInstruction + "\n\nSolicitud del usuario:\n" + prompt;

  const text = await fetchGeminiPrompt(fullPrompt, 'gemini-3.8-flash');
  if (text) {
    generatedText = text;
  }

  if (!generatedText) {
    console.log("[Generate-Schedule] Compiling schedule via Smart Heuristic Engine.");
    const rawProcedural = generateProceduralSchedule(prompt, userContext, mode);
    return {
      habits: autoArrangeSchedule(rawProcedural, mode, maxBlocks),
      source: "heuristic_engine",
      notice: "Agenda optimizada y libre de choques generada por el Motor Neural KAI."
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
    let sDays = h.specificDays;
    if (sDays === undefined || sDays === null) {
      sDays = (h.frequencyType === 'specific_days') ? [1,2,3,4,5] : [0,1,2,3,4,5,6];
    } else if (!Array.isArray(sDays)) {
      sDays = [sDays];
    }
    return {
      ...h,
      id: h.id || `hab-ai-${Date.now()}-${idx}`,
      title: cleanScheduleTitle(h.title) || h.title,
      isQuickHabit: false,
      isTracked2166: false,
      specificDays: sDays
    };
  });

  // Guarantee zero time collisions and clean daily cap before returning!
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

  const text = await fetchGeminiPrompt(prompt, 'gemini-3.8-flash');
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
export async function forgeKaiFromImage(params: {
  imageBase64: string;
  mimeType?: string;
  promptDescription?: string;
}): Promise<KaiCustomForm | null> {
  const { imageBase64, mimeType = 'image/jpeg', promptDescription = '' } = params;

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return null;
  }

  // Limpiar encabezado data:image/... si está presente
  const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

  const systemInstructions = `
Eres el Motor Neural de Vectorización Geométrica de "La Solución".
Tu misión es transformar el objeto o sujeto principal de la imagen en un compañero holográfico Cyber-Origami / Wireframe poligonal simétrico sobre el eje central x=60 dentro de un lienzo SVG viewBox="0 0 120 120".

REGLAS DE VECTORIZACIÓN ESTRICTAS:
1. Toda la figura debe estar contenida entre x: 14 y 106, y entre y: 16 y 104.
2. Simetría bilateral rigurosa respecto al eje central x=60. Si un punto está en (60 - dx, y), su contraparte debe estar en (60 + dx, y).
3. Todas las líneas deben ser segmentos rectos poligonales (mínimo 10, máximo 24 líneas representativas de la silueta).
4. El núcleo o sensor visual debe ubicarse en el centro de atención 'coreEye' { cx: 60, cy: número entre 45 y 70, r: 6 }.
5. Dale un nombre épico al compañero (ej. "Cyber-Titan Auricular", "Lobo Cuántico", "Orbe Solar de Acero").
${promptDescription ? `Contexto del usuario: "${promptDescription}".` : ''}

DEVOLUCIÓN OBLIGATORIA:
Responde ÚNICAMENTE con un objeto JSON sin formato markdown, sin texto antes ni después:
{
  "name": "Nombre Épico",
  "lines": [
    { "x1": 60, "y1": 20, "x2": 36, "y2": 52 },
    { "x1": 60, "y1": 20, "x2": 84, "y2": 52 }
  ],
  "polygons": [
    { "points": "60,20 36,52 60,78" },
    { "points": "60,20 84,52 60,78" }
  ],
  "coreEye": { "cx": 60, "cy": 60, "r": 6 }
}
`;

  let jsonResult: string | null = null;

  // 1. Firebase AI Logic SDK (Multimodal)
  if (firebaseAI) {
    try {
      const model = getGenerativeModel(firebaseAI, {
        model: 'gemini-3.8-flash',
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 2048,
        },
      });

      const imagePart = {
        inlineData: {
          data: cleanBase64,
          mimeType,
        },
      };

      const result = await model.generateContent([imagePart, { text: systemInstructions }]);
      const text = result.response.text();
      if (text && text.trim()) {
        jsonResult = text.trim();
        console.log('[Firebase AI Logic] ✓ Forja Neural procesada con éxito');
      }
    } catch (err: any) {
      console.warn('[Firebase AI Logic Multimodal] Error:', err?.message || err);
    }
  }

  // 2. Secondary: Direct Gemini Developer API
  if (!jsonResult) {
    const customKey =
      typeof window !== 'undefined' ? window.localStorage.getItem('lasolucion_gemini_api_key') : null;
    const apiKeyToTry = customKey || firebaseConfig?.apiKey;

    if (apiKeyToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKeyToTry}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { inline_data: { mime_type: mimeType, data: cleanBase64 } },
                  { text: systemInstructions },
                ],
              },
            ],
            generationConfig: { temperature: 0.25, maxOutputTokens: 2048 },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.trim()) {
            jsonResult = text.trim();
          }
        }
      } catch (err) {
        console.warn('[Gemini Multimodal API] Error:', err);
      }
    }
  }

  // Parsear y sanitizar JSON devuelto
  if (jsonResult) {
    try {
      const cleaned = jsonResult.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (parsed && Array.isArray(parsed.lines) && parsed.lines.length >= 4) {
        // Validación de límites seguros (0 a 120)
        const safeLines = parsed.lines
          .filter((l: any) => typeof l.x1 === 'number' && typeof l.y1 === 'number' && typeof l.x2 === 'number' && typeof l.y2 === 'number')
          .map((l: any) => ({
            x1: Math.max(10, Math.min(110, Math.round(l.x1))),
            y1: Math.max(12, Math.min(106, Math.round(l.y1))),
            x2: Math.max(10, Math.min(110, Math.round(l.x2))),
            y2: Math.max(12, Math.min(106, Math.round(l.y2))),
          }));

        return {
          name: (parsed.name || 'Compañero Forja Neural').slice(0, 32),
          sourceType: 'image',
          createdAt: new Date().toISOString(),
          lines: safeLines,
          polygons: Array.isArray(parsed.polygons) ? parsed.polygons : undefined,
          coreEye: parsed.coreEye && typeof parsed.coreEye.cx === 'number'
            ? {
                cx: Math.max(20, Math.min(100, Math.round(parsed.coreEye.cx))),
                cy: Math.max(30, Math.min(90, Math.round(parsed.coreEye.cy))),
                r: Math.max(4, Math.min(12, Math.round(parsed.coreEye.r || 6))),
              }
            : { cx: 60, cy: 60, r: 6 },
        };
      }
    } catch (parseErr) {
      console.warn('[Forja Neural] Error parseando JSON de Gemini:', parseErr);
    }
  }

  // 3. Procedural Fallback de Respaldo (Garantía de que nunca falla)
  console.log('[Forja Neural] Activando generador procedural simétrico de respaldo');
  return {
    name: promptDescription ? `Tótem ${promptDescription.slice(0, 16)}` : 'Holo-Artefacto Cuántico',
    sourceType: 'image',
    createdAt: new Date().toISOString(),
    lines: [
      { x1: 60, y1: 20, x2: 32, y2: 48 },
      { x1: 60, y1: 20, x2: 88, y2: 48 },
      { x1: 32, y1: 48, x2: 24, y2: 74 },
      { x1: 88, y1: 48, x2: 96, y2: 74 },
      { x1: 24, y1: 74, x2: 60, y2: 98 },
      { x1: 96, y1: 74, x2: 60, y2: 98 },
      { x1: 60, y1: 20, x2: 60, y2: 98 },
      { x1: 32, y1: 48, x2: 60, y2: 60 },
      { x1: 88, y1: 48, x2: 60, y2: 60 },
      { x1: 24, y1: 74, x2: 60, y2: 60 },
      { x1: 96, y1: 74, x2: 60, y2: 60 },
    ],
    polygons: [
      { points: '60,20 32,48 60,60' },
      { points: '60,20 88,48 60,60' },
      { points: '32,48 24,74 60,60' },
      { points: '88,48 96,74 60,60' },
      { points: '24,74 60,98 60,60' },
      { points: '96,74 60,98 60,60' },
    ],
    coreEye: { cx: 60, cy: 60, r: 7 },
  };
}


