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
  const candidateModels = Array.from(
    new Set([
      modelName || 'gemini-2.5-flash',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-flash-latest'
    ])
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
    1. CANTIDAD IDEAL: Genera entre 5 y ${maxBlocks} bloques en total para el día (máximo ${maxBlocks}).
    2. BLOQUES REALISTAS DE TRABAJO/ESTUDIO: Un bloque laboral o de estudio puede durar 4, 5, 6, 7 u 8 horas (ej. "09:00 - 17:00" o "08:30 - 16:30"). Si la jornada incluye pausa de almuerzo (ej. 13:00 - 14:00), estructura el trabajo en Turno Mañana ("09:00 - 13:00") y Turno Tarde ("14:00 - 17:00"), con el almuerzo en medio ("13:00 - 14:00").
    3. FORMATO DE HORA ESTRICTO "HH:mm - HH:mm" (24h, entre 06:00 y 23:45). Ejemplo: "07:30 - 08:30", "09:00 - 13:00", "13:00 - 14:00", "14:00 - 18:00", "18:30 - 19:45", "20:30 - 21:30", "23:00 - 23:30".
    4. CERO SOLAPAMIENTOS: Ningún bloque puede solaparse con otro en el mismo día. Sigue el flujo cronológico natural: mañana -> trabajo/estudio -> almuerzo -> turno tarde -> entrenamiento/creativo/hogar -> cena -> desconexión/descanso. La cena SIEMPRE va antes de la desconexión nocturna o descanso.
    5. TÍTULOS LIMPIOS Y EJECUTABLES: Prohibido usar textos como "(Consolidado)", "Tarea extra:", o "Horario Semanal Completo".
    6. DÍAS DE LA SEMANA EXACTOS: Si una actividad es de fin de semana (ej. "Clase de los sábados"), usa frequencyType: "specific_days" y specificDays: [6]. Si es de lunes a viernes, specificDays: [1,2,3,4,5]. Si es diaria (despertar, comidas, descanso nocturno), frequencyType: "daily" y specificDays: [0,1,2,3,4,5,6].
    7. PROHIBICIÓN TOTAL DE MICRO-HÁBITOS (beber agua, contar pasos, cepillado de dientes).
    8. CATEGORÍAS PERMITIDAS: "rutina", "entrenamiento", "comida", "intelecto", "limpieza", "creativo".

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
          styleTitle: 'ANIMACIÓN 3D DE CINE (PIXAR & DREAMWORKS)',
          keywordsEn: 'high-end 3D animated film character, Disney Pixar and Dreamworks movie render style, soft ambient occlusion, warm studio lighting, big glossy expressive eyes, soft tactile volume, cute friendly creature',
          promptBody: `
🎬 ESTILO MAESTRO: ANIMACIÓN 3D PIXAR Y DREAMWORKS
- Eres un Director de Arte y Modelado 3D de Pixar/DreamWorks.
- TÉCNICA: CERO o mínimo contorno negro. El volumen se esculpe mediante <radialGradient> y <linearGradient> suaves con oclusión ambiental (opacity="0.25" a "0.5") y luz cálida de estudio cinematográfico desde arriba a la izquierda.
- OJOS: Ojos 3D esféricos con iris radial detallado concéntrico y DOBLE catchlight blanco brillante que refleja los focos de estudio de cine.
- ANATOMÍA: Extremidades acolchonadas y suaves con volumen tangible, dedos redondeados y zapatitos con relieve tridimensional.
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
          styleTitle: 'DOODLE ART A MANO / STREET POSCA',
          keywordsEn: 'dynamic hand-drawn doodle art illustration, Keith Haring and Mr Doodle aesthetic, energetic organic black marker linework, selective vibrant Posca paint color accents, spontaneous action vibes',
          promptBody: `
✏️ ESTILO MAESTRO: DOODLE ART A MANO Y POSCA URBANO
- Eres un Artista Urbano de cuaderno de bocetos y muralismo (estilo Keith Haring, Mr. Doodle y marcadores Posca).
- TÉCNICA: Trazo orgánico de marcador acrílico negro grueso (stroke="#000000" stroke-width="3.6" a "4.8" con puntas redondeadas).
- COLOR: Blanco y negro dominante con rellenos selectivos planos de marcador Posca (1 o 2 acentos vivos). Sombreados mediante tramados de líneas paralelas (hatching).
- DETALLES: Pequeñas líneas de acción, garabatos, estrellitas o coronitas doodle flotando alrededor del personaje.
`,
        };

      case 'clay3d':
      default:
        return {
          styleTitle: 'CLAYMATION 3D / PLASTILINA STOP-MOTION',
          keywordsEn: 'handmade claymation stop-motion figure, Wallace and Gromit Aardman clay sculpture, tactile clay fingerprint texture, soft studio rim lighting, matte satin finish',
          promptBody: `
🏺 ESTILO MAESTRO: CLAYMATION 3D / PLASTILINA STOP-MOTION
- Eres un Maestro Escultor de plastilina de Aardman Studios (Wallace & Gromit).
- TÉCNICA: Bordes orgánicos redondeados de plastilina modelada a mano, textura satinada mate con <radialGradient> suaves y ligeras asimetrías de arcilla real.
- OJOS: Ojos de bolita de masa blanca con un puntito negro de plastilina como pupila y relieve en los párpados.
- ANATOMÍA: Brazos y piernas gruesos como rollitos de masa amasada a mano, dedos rechonchos y base sólida de escultura.
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


