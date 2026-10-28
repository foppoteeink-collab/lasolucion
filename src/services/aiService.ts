import { getGenerativeModel } from 'firebase/ai';
import { firebaseAI, firebaseConfig } from '../firebase';
import { autoArrangeSchedule, cleanScheduleTitle } from '../utils/timeUtils';
import { generateProceduralSchedule, generateProceduralAnalysis } from '../utils/proceduralHeuristics';
import { KaiCustomForm, KaiMultiverseStyle, KaiTemperament } from '../types';

export function getEffectiveGeminiApiKey(): string | null {
  if (typeof window !== 'undefined') {
    const custom = window.localStorage.getItem('lasolucion_gemini_api_key');
    if (custom && custom.trim()) return custom.trim();
  }
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY;
  if (envKey && String(envKey).trim()) return String(envKey).trim();
  return null;
}

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

async function fetchGeminiPrompt(promptText: string, modelName: string = 'gemini-2.5-flash'): Promise<string | null> {
  if (!promptText || typeof promptText !== 'string' || !promptText.trim()) {
    return null;
  }

  const rateCheck = checkAndConsumeRateLimit();
  if (!rateCheck.allowed) {
    console.warn(`[AI Protection] ${rateCheck.reason}. Usando heurísticas locales.`);
    return null;
  }

  const sanitizedPrompt = promptText.trim().slice(0, 4000);
  const preferredModel =
    modelName && !['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'].includes(modelName)
      ? modelName
      : 'gemini-3.5-flash-lite';

  const candidateModels = Array.from(
    new Set([preferredModel, 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'])
  );

  // 1. Primary: Direct Gemini Developer API (using active key)
  const apiKeyToTry = getEffectiveGeminiApiKey();
  if (apiKeyToTry) {
    for (const modelToTry of candidateModels) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}:generateContent?key=${apiKeyToTry}`;
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
            console.log(`[Gemini API] ✓ Response from ${modelToTry}`);
            return text;
          }
        }
      } catch (err) {
        // try next model
      }
    }
  }

  // 2. Secondary: Official Firebase AI Logic SDK fallback
  if (firebaseAI) {
    for (const modelToTry of candidateModels) {
      try {
        const model = getGenerativeModel(firebaseAI, {
          model: modelToTry,
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 8192,
          },
        });
        const result = await model.generateContent(sanitizedPrompt);
        const text = result.response.text();
        if (text && text.trim()) {
          console.log(`[Firebase AI Logic] ✓ Response from ${modelToTry}`);
          return text;
        }
      } catch (err: any) {
        console.warn(`[Firebase AI Logic] (${modelToTry}) unavailable:`, err?.message || err);
      }
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

  const text = await fetchGeminiPrompt(fullPrompt, 'gemini-2.5-flash');
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

  const text = await fetchGeminiPrompt(prompt, 'gemini-2.5-flash');
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

  // 2. Directivas de estilo estricto para el diseño del personaje
  function getStyleDirectives(selectedStyle: KaiMultiverseStyle): { keywordsEn: string; vectorRulesEs: string } {
    switch (selectedStyle) {
      case 'anime':
        return {
          keywordsEn: 'authentic 90s anime shonen character, Ken Sugimori Pokemon official watercolor lineart and Akira Toriyama Dragon Ball Z aesthetic, high-contrast cel-shaded lighting in 2 sharp tones, sharp ink contours, dynamic warrior stance, expressive eyes with specular highlights, heroic anime companion',
          vectorRulesEs: 'ANIME SHONEN CLÁSICO (Toriyama / Sugimori): Contornos de tinta negra afilada (stroke="#111827" stroke-width="2.5"), cel-shading de 2 tonos contrastados con sombras angulares de corte recto, ojos rasgados de guerrero con iris degradado y destello blanco, cabello o cresta picuda (spiky) en la parte superior del objeto.',
        };
      case 'cartoon':
        return {
          keywordsEn: 'classic 90s Cartoon Network character design, Dexter Laboratory, Samurai Jack and Powerpuff Girls aesthetic, bold ultra-thick black ink outlines, flat solid vibrant colors, quirky expressive face, dynamic animated stance',
          vectorRulesEs: 'CARTOON NETWORK CLÁSICO (Años 90/2000): Tinta negra ultra gruesa y audaz (stroke="#000000" stroke-width="4.2"), colores planos supersaturados sin degradados borrosos, ojos grandes y expresivos juntos en el centro, y extremidades dinámicas con volumen elástico.',
        };
      case 'pixar':
        return {
          keywordsEn: 'high-end 3D animated film character, Disney Pixar and Dreamworks movie render style, soft ambient occlusion, warm studio lighting, big glossy expressive eyes, soft tactile volume, cute friendly creature',
          vectorRulesEs: 'ANIMACIÓN 3D PIXAR: Modelado con múltiples <radialGradient> y <linearGradient> que simulan volumen esférico con luz de estudio y sombras de oclusión suaves, ojos grandes y cálidos con doble catchlight blanco.',
        };
      case 'pop':
        return {
          keywordsEn: 'exclusive designer vinyl art toy figure, Funko and Superplastic collectible aesthetic, smooth glossy vinyl finish with studio reflections, clean graphic button eyes, stylized proportions',
          vectorRulesEs: 'POP ART / VINYL TOY: Figura coleccionable de vinilo pulido, cabeza característica con proporciones de juguete de diseñador, destellos blancos alargados que simulan brillo de plástico y ojos negros de botón.',
        };
      case 'doodle':
        return {
          keywordsEn: 'dynamic hand-drawn doodle art illustration, Keith Haring and Mr Doodle aesthetic, energetic organic black marker linework, selective vibrant Posca paint color accents, spontaneous action vibes',
          vectorRulesEs: 'DOODLE ART POSCA: Trazos orgánicos de marcador negro grueso con pequeñas líneas de acción alrededor, relleno selectivo de color vibrante y garabatos espontáneos llenos de energía.',
        };
      case 'clay3d':
      default:
        return {
          keywordsEn: 'handmade claymation stop-motion figure, Wallace and Gromit Aardman clay sculpture, tactile clay fingerprint texture, soft studio rim lighting, matte satin finish',
          vectorRulesEs: 'CLAYMATION 3D: Escultura de plastilina modelada a mano, bordes orgánicos ligeramente asimétricos, sombras suaves difusas de arcilla real y acabado satinado mate.',
        };
    }
  }

  const { keywordsEn, vectorRulesEs } = getStyleDirectives(artStyle);

  // 3. Prompt Maestro Multimodal "Object-As-Body" de Alta Definición
  const systemInstructions = `
ERES UN ILUSTRADOR Y DISEÑADOR DE PERSONAJES SENIOR DE NINTENDO Y CARTOON NETWORK.
Transforma este objeto real fotografiado en un personaje legendario en código SVG puro (viewBox="0 0 300 300").

REGLAS ARTÍSTICAS VITALES (NIVEL ESTUDIO):
1. EL OBJETO ES EL CUERPO (80/20):
   - Identifica el objeto fotografiado (su chasis, boquilla, tapas, botones, logotipos, colores y textos exactos).
   - El torso y cabeza ES el objeto real con volumen 3D (<linearGradient> o <radialGradient> para simular relieve cilíndrico o prismático).
   - Sus piezas superiores (boquillas metálicas, tapas, ruedas o botones) conforman su casco cromado, corona o armadura mecánica.
   - Replica con fidelidad los textos, estampados o marcas visibles en el objeto (como el lema serigrafiado, franjas o logotipos).
2. ROSTRO HEROICO CON ALMA:
   - Ojos grandes y expresivos estilo Nintendo/Anime con esclerótica blanca, iris degradado de color vivo, pupila oscura y destellos blancos especulares (<circle fill="#ffffff"/>).
   - Cejas con actitud y boca pícara o sonrisa con dientecito/lengua cartoon.
3. EXTREMIDADES CON VOLUMEN REAL:
   - ¡PROHIBIDAS LAS LÍNEAS DE ALAMBRE ("PALO Y BOLITA")!
   - Brazos y piernas con masa anatómica y sombreado cel-shading en 2 tonos.
   - Guantes blancos gruesos de acción (estilo Mario / Sonic / Cuphead) con muñequeras y nudillos.
   - Zapatillas o botas deportivas estilizadas con suela blanca en la base.
4. ILUMINACIÓN Y FLOTACIÓN:
   - Si es un objeto de fuego o energía (encendedor, vape), añade una flama viva o penacho brillante estilizado en la cúspide.
   - Sombra de contacto suave en la base (<ellipse cy="275" ...>) para flotar con presencia sólida.
   - 100% libre de <rect> de fondo sólido exterior (debe ser transparente).

${promptDescription ? `- Detalle especial del operador: "${promptDescription}".` : ''}

ESTRUCTURA EXACTA DE TU RESPUESTA:
===METADATA===
OBJECT: Nombre exacto del objeto identificado en español
NAME: Nombre memorable del personaje (máx 24 caracteres)
QUOTE: Frase carismática corta del personaje
PRIMARY_COLOR: #hex
SECONDARY_COLOR: #hex
===SVG===
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="100%" height="100%">
...
</svg>
`;

  let rawResult: string | null = null;
  let lastErrorMessage = '';

  const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];

  // 1. Análisis e Ilustración Multimodal Primaria con Gemini Developer API
  const apiKeyToTry = getEffectiveGeminiApiKey();
  if (apiKeyToTry) {
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 35000);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKeyToTry}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { inline_data: { mime_type: effectiveMime, data: cleanBase64 } },
                  { text: systemInstructions },
                ],
              },
            ],
            generationConfig: { temperature: 0.65, maxOutputTokens: 16384 },
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
            maxOutputTokens: 16384,
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
        ? `Error en Gemini Vision: ${lastErrorMessage}`
        : 'No se pudo conectar con Gemini Vision para analizar la imagen. Por favor verifica tu conexión.'
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
      if (!svgContent.endsWith('</svg>')) {
        svgContent += '</svg>';
      }
    }
  }

  // Limpiar cercas de markdown si quedaron residuos
  if (svgContent) {
    svgContent = svgContent.replace(/^```(?:svg|xml|html)?\s*/i, '').replace(/\s*```$/i, '').trim();
    if (!svgContent.startsWith('<svg')) {
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="100%" height="100%">${svgContent}</svg>`;
    }
    if (!svgContent.endsWith('</svg>')) {
      svgContent += '</svg>';
    }
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

  // 4. Intento de Generación Nativa de Imagen con Gemini (Motor A opcional para cuando haya facturación)
  let imageUrl: string | undefined = undefined;
  try {
    const illustrationPrompt = `Masterpiece character of ${detectedObject}, ${keywordsEn}, full body, isolated on solid pure black background #000000`;
    const nativeImg = await generateGeminiNativeImage({
      cleanBase64,
      effectiveMime,
      illustrationPrompt,
    });
    if (nativeImg) {
      imageUrl = nativeImg;
      console.log('[Forja Neural] ✓ Imagen nativa generada y recortada exitosamente.');
    }
  } catch {
    // Si no hay cuota de imagen, sigue con el SVG sin interrumpir
  }

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


