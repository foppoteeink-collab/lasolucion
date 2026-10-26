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
        body: JSON.stringify({ prompt: promptText, model: preferredModel }),
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
/**
 * Procesa la imagen en un lienzo <canvas> aplicando Chroma Keying con BFS Flood-Fill
 * desde el perímetro exterior sobre el fondo oscuro #030712.
 * Esto garantiza que el fondo exterior se vuelva 100% transparente (alpha = 0),
 * pero CUALQUIER elemento oscuro INTERNO (pupilas, trazos negros de cartoon o sombras)
 * se mantenga 100% intacto y nítido.
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
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageSource);
          return;
        }

        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(img, 0, 0, W, H);

        const imgData = ctx.getImageData(0, 0, W, H);
        const data = imgData.data;

        // BFS Flood-fill desde el perímetro exterior
        const isBg = new Uint8Array(W * H);
        const queue: number[] = [];

        const checkBgColor = (idx: number) => {
          const r = data[idx * 4];
          const g = data[idx * 4 + 1];
          const b = data[idx * 4 + 2];
          const dr = r - 3;
          const dg = g - 7;
          const db = b - 18;
          const dist = Math.sqrt(dr * dr + dg * dg + db * db);
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          return dist < 45 || lum < 24;
        };

        // Sembrar píxeles de los 4 bordes exteriores
        for (let x = 0; x < W; x++) {
          const topIdx = x;
          const btmIdx = (H - 1) * W + x;
          if (checkBgColor(topIdx) && !isBg[topIdx]) { isBg[topIdx] = 1; queue.push(topIdx); }
          if (checkBgColor(btmIdx) && !isBg[btmIdx]) { isBg[btmIdx] = 1; queue.push(btmIdx); }
        }
        for (let y = 0; y < H; y++) {
          const lftIdx = y * W;
          const rgtIdx = y * W + (W - 1);
          if (checkBgColor(lftIdx) && !isBg[lftIdx]) { isBg[lftIdx] = 1; queue.push(lftIdx); }
          if (checkBgColor(rgtIdx) && !isBg[rgtIdx]) { isBg[rgtIdx] = 1; queue.push(rgtIdx); }
        }

        // Propagación BFS
        let qHead = 0;
        while (qHead < queue.length) {
          const curr = queue[qHead++];
          const cx = curr % W;
          const cy = Math.floor(curr / W);

          const neighbors = [
            cx > 0 ? curr - 1 : -1,
            cx < W - 1 ? curr + 1 : -1,
            cy > 0 ? curr - W : -1,
            cy < H - 1 ? curr + W : -1,
          ];

          for (const n of neighbors) {
            if (n >= 0 && !isBg[n] && checkBgColor(n)) {
              isBg[n] = 1;
              queue.push(n);
            }
          }
        }

        // Aplicar transparencia total a los píxeles alcanzados por el fondo
        for (let i = 0; i < W * H; i++) {
          if (isBg[i]) {
            data[i * 4 + 3] = 0;
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const transparentWebP = canvas.toDataURL('image/webp', 0.9);
        resolve(transparentWebP);
      } catch (err) {
        console.warn('[Forja Neural] Error procesando Chroma Key en canvas:', err);
        resolve(imageSource);
      }
    };
    img.onerror = () => {
      console.warn('[Forja Neural] Error cargando imagen para Chroma Key, preservando fuente');
      resolve(imageSource);
    };
    img.src = imageSource;
  });
}

/**
 * Genera la ilustración del personaje según su estilo utilizando Imagen 3 o motor de alta resolución
 */
async function generateKaiIllustration(params: {
  characterConcept: string;
  detectedObject: string;
  artStyle: KaiMultiverseStyle;
  mood?: KaiTemperament;
  apiKey?: string;
}): Promise<string> {
  const { characterConcept, detectedObject, artStyle, mood = 'stoic', apiKey } = params;

  let styleDesc = '';
  switch (artStyle) {
    case 'pixar':
      styleDesc = 'adorable full body 3D Pixar character render, DreamWorks animated movie hero, rich tactile subsurface scattering, soft studio rim lighting, big soulful expressive eyes with bright catchlights, warm ambient occlusion, cute friendly face, ultra high resolution 3D render';
      break;
    case 'cartoon':
      styleDesc = 'classic 90s Cartoon Network 2D character, Dexter laboratory and Samurai Jack inspired, bold black ink outlines, flat vibrant saturated colors, exaggerated geometric cartoon anatomy, expressive humorous face, retro 2D cartoon cel animation';
      break;
    case 'anime':
      styleDesc = 'authentic Japanese anime mascot companion creature, Studio Trigger and Pokemon anime style, clean vibrant cel-shaded illustration, detailed anime eyes with glossy reflection highlights, spiky dynamic action features, vibrant rich colors';
      break;
    case 'pop':
      styleDesc = 'exclusive designer vinyl art toy collectible, Funko Pop and Superplastic style, glossy vinyl shine reflections, bold pop culture aesthetic, iconic oversized head, button eyes with shine, vibrant saturated pop art colors';
      break;
    case 'doodle':
      styleDesc = 'authentic hand-drawn ink doodle art character, Mr Doodle and Keith Haring sketchbook style, organic black marker contours, manual cross-hatching shade lines, colorful Posca marker accent splashes, quirky whimsical doodles floating';
      break;
    case 'clay3d':
    default:
      styleDesc = 'adorable claymation 3D stop-motion character, Wallace & Gromit and Aardman Studios style, soft tactile handmade modeling clay texture, gentle studio rim lighting, thumbprint clay details, cute clay ball eyes';
      break;
  }

  let moodDesc = '';
  switch (mood) {
    case 'stoic':
      moodDesc = 'serious stoic expression, focused confident gaze, closed determined mouth';
      break;
    case 'mischievous':
      moodDesc = 'playful mischievous smirk, one eye winking or sideways glance, witty confident charm';
      break;
    case 'fierce':
      moodDesc = 'fierce combat warrior stance, intense energetic gaze, battle ready expression';
      break;
    case 'mystic':
      moodDesc = 'mystical tranquil expression, serene half-closed eyes, wise cosmic aura';
      break;
    case 'zen':
      moodDesc = 'peaceful relaxed zen face, sleepy calm eyes, meditative serenity';
      break;
    case 'cheerful':
    default:
      moodDesc = 'radiant cheerful smile, wide happy sparkling eyes, enthusiastic joyful expression';
      break;
  }

  const promptText = `Full body character design of an anthropomorphic ${detectedObject} alive as a companion, ${characterConcept}, ${styleDesc}, ${moodDesc}, solid pure dark background #030712, no floor, no ground, no pedestal, center frame, character floating, high resolution concept art, sharp focus.`;

  // 1. Intentar endpoint Imagen 3 si hay API Key disponible
  if (apiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 16000);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: promptText }],
          parameters: { sampleCount: 1, aspectRatio: '1:1' },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const base64Bytes = data.predictions?.[0]?.bytesBase64Encoded;
        if (base64Bytes) {
          const rawDataUrl = `data:image/jpeg;base64,${base64Bytes}`;
          return await processChromaKeyToWebP(rawDataUrl);
        }
      }
    } catch (imagenErr) {
      console.warn('[Forja Neural] Imagen 3 API unavailable, utilizando motor de ilustración alternativo:', imagenErr);
    }
  }

  // 2. Motor de ilustración de alta resolución con seed único (Pollinations / Flux)
  const seed = Math.floor(Math.random() * 999999);
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptText)}?width=512&height=512&seed=${seed}&nologo=true`;

  return await processChromaKeyToWebP(pollinationsUrl);
}

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * 📸 FORJA NEURAL KAI // PIPELINE MULTIMODAL HÍBRIDO (OPCIÓN C)
 * Paso 1: Reconocimiento exacto del objeto con Gemini Vision (2026).
 * Paso 2: Según el estilo elegido:
 *   - Rama Ilustración Real (3D Vinyl, Anime, Cómic, Crayón): Generación + Chroma Key WebP.
 *   - Rama Vectorial (Geometría Neón, Cyber-Pixel, Flujo, Low Poly): SVG nativo estructurado.
 * ══════════════════════════════════════════════════════════════════════════════
 */
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

  // 2. Construcción de directiva del prompt unificado 100% SVG
  function buildMultiversePrompt(selectedArtStyle: KaiMultiverseStyle, userPrompt: string, selectedMood: KaiTemperament = 'stoic'): string {
    let vectorDirective = '';
    switch (selectedArtStyle) {

      case 'pixar':
        vectorDirective = `
🎬 ESTILO: "ANIMACIÓN 3D ESTILO PIXAR / DREAMWORKS (PELÍCULA DE ALTO PRESUPUESTO)"
- ILUMINACIÓN 3D: Usa múltiples <radialGradient> y <linearGradient> en <defs> para simular volumen esférico real con oclusión ambiental (sombra oscura suave debajo) y reflejo de luz de estudio en la parte superior izquierda.
- OJOS EXPRESIVOS: Grandes y llenos de vida. Globo ocular con elipse blanca/crema, iris con gradiente vibrante interno, pupila negra, y DOS destellos de luz circulares blancos (catchlights) en cada ojo. Los ojos deben transmitir EMOCIÓN auténtica.
- BOCA: Curvada, expresiva, con labios que tienen profundidad 3D y sombra interna.
- SILUETA: Formas redondeadas, orgánicas, amigables y llenas de calidez cinematográfica. Nada angular ni rígido.
- CALIDAD: Debe parecer un personaje de película de animación real. Usa gradientes suaves ricos para el cuerpo principal del objeto.`;
        break;

      case 'cartoon':
        vectorDirective = `
📺 ESTILO: "CARTOON NETWORK CLÁSICO (DEXTER / SAMURAI JACK / HORA DE AVENTURA / CHICAS SUPERPODEROSAS)"
- LÍNEAS: Contorno negro MUY GRUESO y marcado en TODOS los elementos (stroke="#050505" stroke-width="3.5" a "5" stroke-linejoin="round" stroke-linecap="round"). Las líneas son el ADN de este estilo.
- COLOR: Zonas de color PLANO, súper saturadas y vibrantes (sin degradados difusos). Usa fill de color sólido puro para el cuerpo, con una sombra dura de corte limpio en color más oscuro (estilo cel-shading en bloque).
- GEOMETRÍA: Exagerada, dinámica y caricaturesca. Siluetas con formas geométricas marcadas, proporciones exageradas de caricatura (cabeza grande si tiene cabeza, cuerpo compacto).
- EXPRESIÓN: Cejas gruesas flotantes, ojos caricaturescos grandes y audaces, sonrisas o muecas muy expresivas llenas de carisma cómico o actitud.`;
        break;

      case 'anime':
        vectorDirective = `
⚔️ ESTILO: "ANIME JAPONÉS SHONEN AUTÉNTICO (POKÉMON / DIGIMON / DRAGON BALL / STUDIO TRIGGER)"
- TRAZO: Tinta estilizada y limpia (stroke="#111827" stroke-width="2" con puntas afiladas naturales).
- OJOS DE ANIME AUTÉNTICOS: Contorno superior rasgado y GRUESO, pestañas o marcas superiores marcadas. Iris elíptico vertical con degradado interno (color brillante en la parte superior, más oscuro abajo). Destello blanco especular grande en el iris. Son ojos de anime reconocibles, NO ojos realistas ni de caricatura occidental.
- RASGOS CARACTERÍSTICOS: Mechones, cuernos o crestas de energía afiladas en puntas (*spiky*), opcional: cola, orejas de criatura o marcas de energía.
- SOMBREADO: Cel-shading clásico japonés de DOS tonos nítidos: el color base del objeto y un color de sombra más oscuro con borde anguloso afilado.
- ACTITUD: Criatura compañera adorable pero con carácter. Personalidad visible en la postura.`;
        break;

      case 'pop':
        vectorDirective = `
🎨 ESTILO: "POP ART / VINYL ART TOY (FUNKO POP / SUPERPLASTIC / ANDY WARHOL / KIDROBOT)"
- SILUETA: Estilo figura coleccionable de vinilo pop icónica. Cabeza característica y grande, cuerpo compacto y estilizado con proporciones de juguete pop.
- ACABADO VINILO: Brillo de vinilo brillante en la cabeza y hombros: usa destellos alargados blancos en la parte superior del cuerpo (stroke="white" opacity="0.7" en arcos o elipses).
- OJOS: Ojos negros redondos de botón con brillo pop (pequeño círculo blanco de reflejo). Limpios, gráficos e icónicos.
- COLORES: Paleta viva y contrastada de colores primarios o neón muy saturados. Sombras de corte limpio tipo póster pop, sin degradados difusos.
- ACTITUD: Aspecto de juguete exclusivo de diseñador de edición limitada que cualquier coleccionista querría tener.`;
        break;

      case 'doodle':
        vectorDirective = `
✏️ ESTILO: "DOODLE ART / BOCETO DIBUJADO A MANO CON TINTA (MR. DOODLE / KEITH HARING / SKETCHBOOK POSCA)"
- TRAZO ARTESANAL: Estilo pluma o marcador negro ORGÁNICO dibujado a mano (stroke="#0f172a" stroke-width="2.4" a "3" con variaciones irregulares orgánicas en grosor, esquinas redondeadas naturales).
- CROSS-HATCHING: Usa líneas paralelas diagonales o cruzadas para sombras manuales (<line> paralelas muy juntas con opacidad 0.4-0.6) en las zonas de sombra del cuerpo.
- GARABATOS: Pequeñas líneas de acción espontáneas, estrellas dibujadas a mano, flechas, mini patrones o símbolos orbitando alrededor del personaje (como garabatos de cuaderno).
- COLOR: Predominio de trazo negro sobre fondo transparente, con TOQUES SELECTIVOS de color como si estuvieran pintados con marcador Posca o acuarela selectiva (no todo el cuerpo coloreado, solo acentos).
- ACTITUD: Divertido, espontáneo, creativo y lleno de energía de boceto vivo.`;
        break;

      case 'clay3d':
      default:
        vectorDirective = `
🏺 ESTILO: "3D CLAYMATION / ESCULTURA DE PLASTILINA (WALLACE & GROMIT / AARDMAN STUDIOS / CLAYMATION)"
- TEXTURA PLASTILINA: El personaje DEBE parecer modelado a mano en plastilina real. Bordes suaves, redondeados, orgánicos y con ligeras imperfecciones artesanales (nada perfectamente simétrico).
- ILUMINACIÓN CLAY: Sombras suaves y difusas como de arcilla real bajo luz de estudio. Usa <radialGradient> con transición suave de color claro a oscuro para simular la curvatura de la masa de plastilina. Brillo satinado MATE (no brillante) en la superficie.
- RASGOS: Ojos tipo bolita de plastilina (esferas con reflejo blanco pequeño), boca como hendidura tallada en la masa, extremidades tubulares y redondeadas. Dedos gorditos si tiene manos.
- IMPERFECCIONES: Ligeras huellas dactilares simuladas, bordes no perfectamente lisos, sensación táctil ARTESANAL única.
- COLORES: Colores de plastilina vibrantes pero satinados, ligeramente más opacos que el plástico puro.`;
        break;

      // Legacy compatibility
      case 'mecha-chibi':
      case 'neon-geometry':
        vectorDirective = `ESTILO: "MECHA SPEC-OPS". Convierte el objeto en una unidad robótica de combate compacta con placas angulares biseladas, visor de energía panorámico y chasis blindado oscuro.`;
        break;
      case 'mystic-relic':
      case 'organic-flow':
        vectorDirective = `ESTILO: "MONOLITO ARCANO". Transforma el objeto en un artefacto de obsidiana con runas luminosas talladas y un ojo etéreo en el centro.`;
        break;
      case 'sticker-pop':
      case 'crayon':
        vectorDirective = `ESTILO: "STREETWEAR POP". Genera una ilustración gráfica urbana con borde troquelado blanco grueso, paleta neón saturada y actitud urbana.`;
        break;
      case 'cyber-pixel':
      case 'pixel':
        vectorDirective = `ESTILO: "PIXEL ART". Genera un sprite de pixel art sobre cuadrícula nítida (shape-rendering="crispEdges") con paleta de combate oscura y contrastes eléctricos.`;
        break;
      case 'comic':
        vectorDirective = `ESTILO: "CÓMIC NEO-NOIR". Tinta negra pesada, contrastes extremos, sombras agresivas en bloque oscuro y estética de novela gráfica madura.`;
        break;
      case 'low-poly':
        vectorDirective = `ESTILO: "LOW POLY CRYSTAL". Escultura poligonal facetada de cristal con polígonos cerrados (<polygon>) y reflejos especulares de filo.`;
        break;
    }

    let moodDirective = '';
    switch (selectedMood) {
      case 'stoic':
      case 'determined':
        moodDirective = `EXPRESIÓN FACIAL REQUERIDA — "Estoico / Serio y Firme":
- Ojos: Mirada directa, seria y concentrada. Ceño ligeramente fruncido o firme pero tranquilo.
- Boca: Línea recta o mandíbula cerrada con determinación serena. Sin sonrisas.
- Frase (personalityQuote): Breve, sabia, firme (ej: "La disciplina no negocia.", "En guardia.", "Enfocado.").`;
        break;

      case 'mischievous':
      case 'playful':
        moodDirective = `EXPRESIÓN FACIAL REQUERIDA — "Pícaro / Astuto y Travieso":
- Ojos: Uno ligeramente más cerrado (guiño o mirada de reojo), ceja levantada con actitud cool.
- Boca: Media sonrisa ladeada astuta (smirk). Solo en un lado de la boca.
- Frase (personalityQuote): Ingeniosa, confiada y con humor (ej: "¿Me buscabas?", "Nadie me para.", "Sigamos.").`;
        break;

      case 'fierce':
        moodDirective = `EXPRESIÓN FACIAL REQUERIDA — "Feroz / Modo Batalla":
- Ojos: Ojos muy abiertos o muy entrecerrados en ángulo agresivo, con energía de combate.
- Boca: Abierta mostrando dientes (anime), mandíbula de batalla o grito de guerra.
- Frase (personalityQuote): Enérgica e imparable (ej: "¡Aplastemos esa meta!", "¡Sin rendirse!", "¡Modo bestia!").`;
        break;

      case 'mystic':
      case 'curious':
        moodDirective = `EXPRESIÓN FACIAL REQUERIDA — "Místico / Enigmático y Sabio":
- Ojos: Ojos semicerrados en calma profunda o uno de los ojos es un orbe de energía etérea.
- Boca: Neutral, serena, ligeramente curvada en una sonrisa enigmática y pacífica.
- Frase (personalityQuote): Profunda y misteriosa (ej: "El camino se revela solo.", "Observa. Aprende. Trasciende.").`;
        break;

      case 'zen':
        moodDirective = `EXPRESIÓN FACIAL REQUERIDA — "Zen / Lánguido y Pacífico":
- Ojos: Párpados caídos a la mitad, expresión de calma absoluta y meditación profunda.
- Boca: Línea fina neutral, completamente en reposo.
- Frase (personalityQuote): Serena y sin prisa (ej: "Fluye.", "Respira.", "El momento es ahora.").`;
        break;

      case 'cheerful':
      case 'happy':
      default:
        moodDirective = `EXPRESIÓN FACIAL REQUERIDA — "Alegre / Radiante y Confiado":
- Ojos: Bien abiertos y brillantes, llenos de vida y entusiasmo. Destellos de luz vivos.
- Boca: Sonrisa amplia y genuina, llena de energía positiva.
- Frase (personalityQuote): Motivadora y victoriosa (ej: "¡Hoy es nuestro día!", "¡Vamos a lograrlo!", "¡Imparable!").`;
        break;
    }

    return `
ERES UN DIRECTOR DE ARTE DE ÉLITE Y MAESTRO EN GENERACIÓN VECTORIAL SVG.
Tu tarea: analizar la foto adjunta, identificar con precisión el OBJETO que contiene, y transmutarlo en un COMPAÑERO VIVO KAI en formato SVG puro, con el estilo artístico especificado abajo. El resultado DEBE verse radicalmente diferente según el estilo.

=======================================================
🎨 DIRECTIVA DE ESTILO (APLICA ESTE ESTILO CON MÁXIMA FIDELIDAD):
=======================================================
${vectorDirective}

=======================================================
🎭 EXPRESIÓN Y ACTITUD DEL PERSONAJE:
=======================================================
${moodDirective}

=======================================================
📐 ARQUITECTURA SVG OBLIGATORIA:
=======================================================
1. viewBox="0 0 160 170" y width="100%" height="100%".
2. FONDO 100% TRANSPARENTE: ¡PROHIBIDO cualquier <rect> de fondo sólido o negro! El personaje FLOTA libremente.
3. Centra el personaje en x=80, entre y=20 e y=148, con margen libre en bordes.
4. GRUPOS SEMÁNTICOS PARA ANIMACIÓN VIVA (OBLIGATORIO - el motor de animación los necesita):
   - <g id="kai-body"> → cuerpo, torso, forma principal del objeto
   - <g id="kai-eyes"> → ambos ojos completos (globo + iris)
   - <g id="kai-pupils"> → SOLO las pupilas o puntos centrales (seguirán el ratón y el dedo del usuario)
   - <g id="kai-mouth"> → boca (se animará al interactuar)
   - <g id="kai-left-hand"> → mano/brazo izquierdo (opcional)
   - <g id="kai-right-hand"> → mano/brazo derecho (opcional)
5. El objeto fotografiado DEBE ser reconocible en el diseño final: sus colores, forma y textura se integran en el personaje.
6. Sombra de flotación opcional: <ellipse cx="80" cy="155" rx="28" ry="5" fill="#000" opacity="0.25"/>
${userPrompt ? `7. Contexto del usuario: "${userPrompt}".` : ''}

=======================================================
📦 RESPONDE ÚNICAMENTE CON ESTE JSON VÁLIDO (SIN NADA MÁS):
=======================================================
{
  "detectedObject": "Nombre del objeto identificado en español",
  "characterConcept": "Descripción creativa de cómo el objeto se fusionó con el estilo",
  "epicName": "Nombre memorable del compañero (máx 24 caracteres)",
  "personalityQuote": "Frase corta característica de su personalidad y expresión",
  "primaryColor": "#hexColorPrincipalDelObjeto",
  "secondaryColor": "#hexColorSecundario",
  "artStyle": "${selectedArtStyle}",
  "mood": "${selectedMood}",
  "svg": "<svg viewBox=\"0 0 160 170\" xmlns=\"http://www.w3.org/2000/svg\">...</svg>"
}
`;
  }

  const systemInstructions = buildMultiversePrompt(artStyle, promptDescription, mood);
  let jsonResult: string | null = null;
  let lastErrorMessage = '';

  // Cadena de modelos multimodales activos vigentes (2026) con timeout de 25000ms
  const CANDIDATE_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];

  // 1. Intento primario: Direct Gemini Developer API (utiliza la clave autorizada para generativelanguage)
  const apiKeyToTry = getEffectiveGeminiApiKey();
  if (apiKeyToTry) {
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);
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
            generationConfig: { temperature: 0.25, maxOutputTokens: 8192 },
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.trim()) {
            jsonResult = text.trim();
            console.log(`[Gemini API Multimodal] ✓ Respuesta exitosa con ${modelName}`);
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

  // 2. Intento secundario: Firebase AI Logic SDK si el directo no respondió
  if (!jsonResult && firebaseAI) {
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = getGenerativeModel(firebaseAI, {
          model: modelName,
          generationConfig: {
            temperature: 0.25,
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
          jsonResult = text.trim();
          console.log(`[Firebase AI Logic] ✓ Objeto analizado con éxito usando ${modelName}`);
          break;
        }
      } catch (err: any) {
        lastErrorMessage = err?.message || String(err);
        console.warn(`[Firebase AI Logic Multimodal] (${modelName}) error:`, lastErrorMessage);
      }
    }
  }

  // Si la IA no respondió o falló, mostrar el error real para depuración (NO fallback ciego silencioso)
  if (!jsonResult) {
    throw new Error(
      lastErrorMessage
        ? `Error en Gemini Vision: ${lastErrorMessage}`
        : 'No se pudo conectar con Gemini Vision para analizar la imagen. Por favor verifica tu conexión o clave de API.'
    );
  }

  // 3. Procesar respuesta JSON de la IA
  let parsed: any = null;
  try {
    let rawJson = jsonResult;
    const fenceMatch = rawJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) {
      rawJson = fenceMatch[1];
    }
    const firstBrace = rawJson.indexOf('{');
    const lastBrace = rawJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      rawJson = rawJson.substring(firstBrace, lastBrace + 1);
    }
    parsed = JSON.parse(rawJson.trim());
  } catch (parseErr) {
    throw new Error('La IA reconoció el objeto pero devolvió un formato no válido. Intenta nuevamente.');
  }

  const detectedObject = parsed.detectedObject ? String(parsed.detectedObject).trim() : 'Objeto Escaneado';
  const characterConcept = parsed.characterConcept ? String(parsed.characterConcept).trim() : `${detectedObject} con vida propia`;
  const epicName = (parsed.epicName || parsed.name || (promptDescription ? `KAI ${promptDescription.slice(0, 16)}` : `KAI ${detectedObject.slice(0, 16)}`)).slice(0, 32);
  const personalityQuote = parsed.personalityQuote || `¡He despertado del mundo real en el Multiverso bajo el estilo ${artStyle.toUpperCase()}!`;
  const primaryColor = parsed.primaryColor || '#00f0ff';
  const secondaryColor = parsed.secondaryColor || '#ec4899';

  // Notificar al cliente que el Paso 1 (Visión) culminó exitosamente con el objeto detectado
  if (onProgress) {
    onProgress('vision', { detectedObject });
    onProgress('generation', { detectedObject });
  }

  // Procesamiento del código SVG nativo (como respaldo estructural)
  const rawSvg = parsed.svg || parsed.svgContent || parsed.svg_code;
  let svgContent: string | undefined = undefined;

  if (typeof rawSvg === 'string' && rawSvg.trim()) {
    svgContent = rawSvg.trim();
    svgContent = svgContent.replace(/^```(?:svg|xml|html)?\s*/i, '').replace(/\s*```$/i, '').trim();
    if (!svgContent.startsWith('<svg')) {
      svgContent = `<svg viewBox="0 0 160 170" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`;
    }
  }

  // 4. Paso 2: Generar la ilustración de alta fidelidad con el motor de imagen (Imagen 3 / Flux)
  let finalImageUrl: string | undefined = undefined;
  try {
    const rawIllustration = await generateKaiIllustration({
      characterConcept,
      detectedObject,
      artStyle,
      mood: (parsed.mood as KaiTemperament) || mood || 'stoic',
      apiKey: apiKeyToTry,
    });
    if (rawIllustration) {
      finalImageUrl = rawIllustration;
      console.log(`[Forja Neural] ✓ Ilustración artística generada con éxito (${artStyle})`);
    }
  } catch (illusErr) {
    console.warn('[Forja Neural] Aviso generando ilustración, usando SVG como fallback:', illusErr);
  }

  // Guardar en localStorage si es data URL para no saturar Firestore
  if (finalImageUrl && finalImageUrl.startsWith('data:') && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('kai_custom_avatar_data', finalImageUrl);
    } catch (e) {
      console.warn('[Forja Neural] Storage aviso:', e);
    }
  }

  return {
    name: epicName,
    sourceType: 'image',
    createdAt: new Date().toISOString(),
    detectedObject,
    characterConcept,
    artStyle,
    personalityQuote,
    primaryColor,
    secondaryColor,
    mood: (parsed.mood as KaiTemperament) || mood || 'stoic',
    renderBranch: finalImageUrl ? 'illustration' : 'vector',
    imageUrl: finalImageUrl,
    storageRef: finalImageUrl && finalImageUrl.startsWith('data:') ? 'local:kai_custom_avatar_data' : undefined,
    svgContent,
    polygons: Array.isArray(parsed.polygons) ? parsed.polygons : undefined,
  };
}


