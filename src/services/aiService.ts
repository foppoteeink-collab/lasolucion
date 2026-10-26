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
 * Procesa la imagen en un lienzo <canvas> de 256x256 aplicando Chroma/Luminance Keying
 * sobre el fondo oscuro #030712 para dejar al personaje 100% recortado con fondo transparente (alpha = 0).
 */
export async function processChromaKeyToWebP(imageSource: string): Promise<string> {
  if (typeof window === 'undefined') return imageSource;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageSource);
          return;
        }

        ctx.clearRect(0, 0, 256, 256);
        ctx.drawImage(img, 0, 0, 256, 256);

        const imgData = ctx.getImageData(0, 0, 256, 256);
        const data = imgData.data;

        // Target background: pure dark #030712 (R:3, G:7, B:18)
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Distancia euclidiana a #030712
          const dr = r - 3;
          const dg = g - 7;
          const db = b - 18;
          const dist = Math.sqrt(dr * dr + dg * dg + db * db);
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

          if (dist < 34 || luminance < 18) {
            data[i + 3] = 0; // Transparente total
          } else if (dist < 52 || luminance < 30) {
            // Suavizado / anti-aliasing en bordes
            const factor = Math.min(1, Math.max(0, (dist - 34) / 18));
            data[i + 3] = Math.round(data[i + 3] * factor);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const transparentWebP = canvas.toDataURL('image/webp', 0.85);
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
  apiKey?: string;
}): Promise<string> {
  const { characterConcept, detectedObject, artStyle, apiKey } = params;

  let styleDesc = '';
  switch (artStyle) {
    case 'clay3d':
      styleDesc = 'cute full body 3D Pixar character render, vinyl collectible toy mascot, smooth claymation tactile finish, soft studio lighting, cute expressive face';
      break;
    case 'anime':
      styleDesc = 'cute full body anime chibi mascot character, Studio Ghibli inspired, high quality anime cel-shaded illustration, vibrant colors, expressive sparkly eyes';
      break;
    case 'comic':
      styleDesc = 'cute full body modern comic book superhero mascot, pop art style, bold black ink outlines, dynamic halftone pattern, vibrant graphic novel illustration';
      break;
    case 'crayon':
      styleDesc = 'cute full body playful colorful crayon drawing of a friendly character, rich wax crayon texture, expressive childlike strokes, whimsical storybook art';
      break;
    case 'toon':
    default:
      styleDesc = 'cute full body classic animation toon character, vibrant flat colors, expressive cartoon eyes, rubber-hose style playful charm';
      break;
  }

  const promptText = `Full body character design of ${characterConcept || detectedObject}, ${styleDesc}, isolated on a solid pure black background #030712, no floor shadows, no ground, no pedestal, center frame, high resolution concept art.`;

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
      case 'clay3d':
        vectorDirective = `
ESTILO OBLIGATORIO: "Cyber-Vinyl / Designer Art Toy (Neo-Tokyo)".
REGLAS ESTRICTAS DE SVG:
- Transforma el objeto en una figura coleccionable de diseñador de vanguardia (estilo Neo-Tokyo Art Toy / Kidrobot / Coarse Toys).
- Textura y acabado: Superficie de vinilo mate premium (#0f172a, #1e1b4b combinado con los colores reales del objeto) con acentos de laca brillante reflectante.
- Luces en <defs>: Gradientes radiales y lineales con destellos especulares nítidos y filtro <feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="#000000" flood-opacity="0.5" /> para volumen imponente.
- Rostro y Ojos: Ojos estilizados en cristal acrílico ahumado o visores angulares con filo reflectante. ¡CERO MEJILLAS SONROJADAS ROSAS!
- Silueta: Postura sólida, elegante y moderna, con articulaciones mecánicas limpias o pedestal flotante.`;
        break;

      case 'anime':
        vectorDirective = `
ESTILO OBLIGATORIO: "Familiar de Cazador / Shonen Oscuro".
REGLAS ESTRICTAS DE SVG:
- Transforma el objeto en un espíritu familiar guerrero de combate (estilo Solo Leveling / Persona 5 / Jujutsu Kaisen).
- Trazo de tinta dinámico con cortes de pluma angulares (stroke="#090d16" stroke-width="2.2" stroke-linecap="round").
- Ojos: Afilados, rasgados y penetrantes, con fuego espectral o energía eléctrica pura (#00f0ff o #a855f7) y ceño de cazador enfocado.
- Sombreado: Cel-shading agresivo de 2 tonos con sombras duras angulares que resaltan la musculatura y aristas del objeto.
- Aura: Trazos dinámicos de energía oscura o relámpagos envolviendo sutilmente el cuerpo del personaje.`;
        break;

      case 'comic':
        vectorDirective = `
ESTILO OBLIGATORIO: "Cyber-Noir / Novela Gráfica Madura".
REGLAS ESTRICTAS DE SVG:
- Genera código SVG con estética de cómic neo-noir maduro de alto contraste (estilo Spider-Verse / Batman Beyond).
- Entintado negro pesado: Bloques sólidos de sombra negra pura (fill="#000000") cortados con luces afiladas.
- Tramas de semitono o líneas paralelas diagonales de sombreado técnico.
- Expresión intensa y enigmática, con ceño protector afilado o reflejos angulares en visor.`;
        break;

      case 'mecha-chibi':
      case 'neon-geometry':
        vectorDirective = `
ESTILO OBLIGATORIO: "Dron Táctico / Mecha Spec-Ops".
REGLAS ESTRICTAS DE SVG:
- Convierte el objeto en una unidad robótica autónoma de reconocimiento y asalto (estilo Armored Core / Metal Gear).
- Chasis blindado: Placas angulares biseladas de titanio y fibra de carbono (#030712, #0f172a, #1e293b con líneas de acento de los colores del objeto).
- Visor Óptico: Visor horizontal panorámico de energía láser (#00f0ff, #38bdf8 o #f59e0b) con retícula táctica interior de micro-puntos.
- Detalles mecha: Ranuras de ventilación biseladas, remaches hexagonales y micro-propulsores de plasma en la base.
- ¡PROHIBIDO aspect de juguete infantil! Debe lucir como equipamiento militar futurista de élite.`;
        break;

      case 'mystic-relic':
      case 'organic-flow':
        vectorDirective = `
ESTILO OBLIGATORIO: "Monolito Arcano / Runas del Abismo".
REGLAS ESTRICTAS DE SVG:
- Transforma el objeto en un artefacto milenario de poder arcano ancestral (estilo Zonai / Elden Ring / Hollow Knight).
- Material: Esculpido en piedra volcánica de obsidiana púrpura oscura (#030712, #180d2b, #0f172a).
- Runas Luminosas: A lo largo de la silueta, talla grietas rúnicas geométricas que emiten resplandor violeta o cian (#c084fc, #00f0ff).
- Núcleo: En el centro, un ojo etéreo o gema viva mística con pupilas concéntricas de fuego arcano y fragmentos de roca levitando alrededor.`;
        break;

      case 'sticker-pop':
      case 'crayon':
        vectorDirective = `
ESTILO OBLIGATORIO: "Streetwear Cyber-Pop / Hypebeast Tokyo".
REGLAS ESTRICTAS DE SVG:
- Transforma el objeto en una ilustración gráfica urbana de vanguardia (estilo Tokyo Streetwear / Cyberpunk 2077).
- Borde blanco grueso troquelado (stroke="#ffffff" stroke-width="5" con sombra inferior nítida).
- Paleta: Negro carbón de fondo con acentos hiper-saturados de neón y cel-shading de precisión.
- Ojos: Mirada afilada y desafiante, lentes oscuros reflectantes o marcas técnicas y glifos cyberpunk (ej: "KAI-01", "DANGER").`;
        break;

      case 'cyber-pixel':
      case 'pixel':
        vectorDirective = `
ESTILO OBLIGATORIO: "Neo-Arcade / 16-Bit Cyber-Ninja".
REGLAS ESTRICTAS DE SVG:
- Genera un sprite pixel-art de alta precisión para videojuegos oscuros de acción (estilo Hyper Light Drifter / Dead Cells).
- Cada elemento debe alinearse a una cuadrícula nítida de píxeles (shape-rendering="crispEdges").
- Paleta oscura de combate con contrastes eléctricos de neón y ojos afilados luminosos en píxeles.`;
        break;

      case 'low-poly':
        vectorDirective = `
ESTILO OBLIGATORIO: "Prisma Poligonal / Escultura Cuántica".
REGLAS ESTRICTAS DE SVG:
- Escultura facetada 3D de corte matemático simulando cristal o cuarzo ahumado.
- Facetas triangulares y trapezoidales cerradas (<polygon ...>) con variaciones precisas de opacidad y reflejos especulares de filo.
- Volumen tridimensional estilizado y monocromo con acentos lumínicos nítidos.`;
        break;

      default:
        vectorDirective = `
ESTILO OBLIGATORIO: "Cyber-Vinyl Art Toy".
REGLAS ESTRICTAS DE SVG:
- Figura coleccionable urbana de diseñador con acabado vinilo mate oscuro, cortes biselados y ojos afilados estilizados.`;
        break;
    }

    let moodDirective = '';
    switch (selectedMood) {
      case 'stoic':
      case 'determined':
        moodDirective = `TEMPERAMENTO REQUERIDO: "Estoico / Firme y Guardián".
- Ojos: Mirada afilada, profunda, concentrada y protectora, con ceño firme o visor horizontal láser en reposo.
- Boca: Línea recta o mandíbula blindada cerrada con determinación serena (cero sonrisas).
- Frase (personalityQuote): De pocas palabras, sabia, firme y protectora de hábitos (ej: "La disciplina no negocia.", "Mantén el enfoque.", "En guardia.").`;
        break;

      case 'mischievous':
      case 'playful':
        moodDirective = `TEMPERAMENTO REQUERIDO: "Pícaro y Astuto (Anti-Héroe)".
- Ojos: Mirada de reojo perspicaz, ceja angular alzada con actitud cool y calculadora.
- Boca: Media sonrisa ladeada sutil y desafiante (smirk).
- Frase (personalityQuote): Confiada, ingeniosa y motivadora con humor afilado.`;
        break;

      case 'fierce':
        moodDirective = `TEMPERAMENTO REQUERIDO: "Feroz / Modo Combate".
- Ojos: Ojos afilados en ángulo agresivo, pupilas en hendidura o visor táctico de sobrecarga.
- Boca: Mandíbula de combate o dientes afilados de batalla estilo anime oscuro.
- Frase (personalityQuote): Enérgica, combativa, imparable (ej: "¡Aplastemos esa meta!", "No hay tregua para la pereza.").`;
        break;

      case 'mystic':
      case 'curious':
        moodDirective = `TEMPERAMENTO REQUERIDO: "Místico y Trascendental".
- Ojos: Ojos semicerrados en calma cósmica o tercer ojo de energía etérea.
- Boca: En reposo neutral pacífico y enigmático.
- Frase (personalityQuote): Profunda, inspirada en secretos del universo y neuroplasticidad.`;
        break;

      case 'zen':
        moodDirective = `TEMPERAMENTO REQUERIDO: "Zen y Lánguido / Serenidad Absoluta".
- Ojos: Líneas horizontales de calma y concentración profunda en meditación.
- Boca: Línea fina neutral en descanso.
- Frase (personalityQuote): Calma, sin prisa pero sin pausa, fluidez mental.`;
        break;

      case 'cheerful':
      case 'happy':
      default:
        moodDirective = `TEMPERAMENTO REQUERIDO: "Carismático y Confiado".
- Ojos: Ojos abiertos afilados con destellos de confianza y determinación radiante.
- Boca: Sonrisa confiada de guerrero que sabe que va a ganar.
- Frase (personalityQuote): Motivación épica y victoriosa.`;
        break;
    }

    return `
ERES EL OJO CLÍNICO Y MOTOR MULTIMODAL DE LA FORJA NEURAL DE "LA SOLUCIÓN".
Tu misión es escanear la foto adjunta, identificar con máxima precisión qué objeto real u elemento aparece en ella, y generar un COMPAÑERO KAI ANTROPOMÓRFICO 100% SVG que capture la silueta real del objeto con presencia estilizada, madura e imponente en el estilo: "${selectedArtStyle.toUpperCase()}".

🚨 DIRECTIVA SUPREMA DE ESTÉTICA MADURA & ANIME/SCI-FI (CERO INFANTILISMO):
- ¡ESTRICTAMENTE PROHIBIDO cualquier aspecto infantil, caricaturesco o de guardería!
- NO generes personajes tipo "chibi", peluches de bebé, bebés cabezones ni "tiernos".
- NO dibujes mejillas sonrojadas rosadas ni círculos de rubor (<ellipse fill="#f43f5e" ... />).
- NO dibujes ojos redondos vacíos de bebé ni pupilas de caricatura infantil.
- NO dibujes zapatitos redondos de payaso ni extremidades rechonchas de osito.
- ✅ OBLIGATORIO: Estética MADURA, ESTILIZADA, AFILADA y ÉPICA de videojuego / anime shonen / sci-fi táctico (estilo Solo Leveling, Persona 5, Armored Core, Cyberpunk 2077, Zonai Relics).
- Ojos: Afilados, rasgados, angulares con ceño penetrante o visores láser/ópticos horizontales.
- Silueta: Estilizada, aerodinámica, cortes limpios, placas blindadas o facetas geométricas.

PASO 1: ANÁLISIS DEL OBJETO REAL
- Identifica el objeto exactamente con sus rasgos distintivos (ej: "Encendedor amarillo transparente", "Taza de cerámica negra", "Zapatilla deportiva azul").
- Diseña un personaje antropomórfico estilizado (characterConcept) fusionando la silueta del objeto con anatomía viva imponente (ojos afilados o visor integrados en la estructura del objeto, placas estilizadas, núcleo de energía).
- Asígnale un nombre creativo y épico (epicName) y una frase breve de despertar (personalityQuote) acorde al temperamento seleccionado.
- Extrae sus colores primario y secundario en formato hexadecimal.

PASO 2: ARQUITECTURA SVG (REGLAS OBLIGATORIAS)
1. El SVG debe tener viewBox="0 0 160 170" y width="100%" height="100%".
2. FONDO 100% TRANSPARENTE: ¡ESTRICTAMENTE PROHIBIDO incluir rectángulos de fondo, fondos negros o tarjetas sólidas como <rect width="160" height="170" ... /> o <rect width="100%" height="100%" ... />! El fondo DEBE ser 100% transparente para que el personaje flote libremente.
3. CENTRADO Y PROPORCIONES: Centra el personaje horizontalmente en x=80 y verticalmente entre y=20 e y=148, dejando margen de respiración para que no toque los bordes del viewBox.
4. EXPRESIÓN Y TEMPERAMENTO EXACTO:
${moodDirective}
5. ESTRUCTURA SEMÁNTICA PARA ANIMACIÓN ORGÁNICA:
Organiza obligatoriamente las partes del personaje en grupos <g> identificados para que el motor cuántico de vida pueda animar ojos, respiración y extremidades de forma 100% fluida:
- <g id="kai-body">: cuerpo, torso y estructura base del objeto.
- <g id="kai-eyes">: contiene ambos ojos (afilados/estilizados).
  - Dentro de este, agrupa las pupilas o sensores en <g id="kai-pupils"> (para que puedan mirar al cursor y al dedo en móviles).
- <g id="kai-mouth">: la boca, visor o mandíbula del personaje (para animar respiración y habla al interactuar).
- <g id="kai-left-hand">: mano, brazo, aleta o extremidad izquierda (si tiene).
- <g id="kai-right-hand">: mano, brazo, aleta o extremidad derecha (si tiene).
6. SOMBRA DE FLOTACIÓN: Puedes incluir una elipse de sombra suave en la base (<ellipse cx="80" cy="155" rx="30" ry="6" fill="#000000" opacity="0.3" />) para que flote sobre el pedestal.
7. ${vectorDirective}
${userPrompt ? `Contexto o pista del usuario: "${userPrompt}".` : ''}

DEVOLUCIÓN OBLIGATORIA (Responde ÚNICAMENTE con un JSON válido):
{
  "detectedObject": "Descripción exacta del objeto real identificado",
  "characterConcept": "Diseño detallado del personaje antropomórfico estilizado",
  "epicName": "Nombre creativo del compañero",
  "personalityQuote": "Frase breve de despertar del compañero",
  "primaryColor": "#hex",
  "secondaryColor": "#hex",
  "artStyle": "${selectedArtStyle}",
  "mood": "${selectedMood}",
  "svg": "<svg viewBox=\\"0 0 160 170\\" xmlns=\\"http://www.w3.org/2000/svg\\">...</svg>"
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

  // Procesamiento del código SVG nativo generado directamente por Gemini
  const rawSvg = parsed.svg || parsed.svgContent || parsed.svg_code;
  let svgContent: string | undefined = undefined;

  if (typeof rawSvg === 'string' && rawSvg.trim()) {
    svgContent = rawSvg.trim();
    svgContent = svgContent.replace(/^```(?:svg|xml|html)?\s*/i, '').replace(/\s*```$/i, '').trim();
    if (!svgContent.startsWith('<svg')) {
      svgContent = `<svg viewBox="0 0 160 170" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`;
    }
  }

  // Validación estricta: NO permitir fallback a figuras geométricas si no vino el SVG
  if (!svgContent && (!Array.isArray(parsed.polygons) || parsed.polygons.length === 0)) {
    throw new Error(`La IA reconoció el objeto "${detectedObject}", pero no generó el código SVG para el estilo "${artStyle}". Por favor intenta de nuevo.`);
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
    renderBranch: 'vector',
    svgContent,
    polygons: Array.isArray(parsed.polygons) ? parsed.polygons : undefined,
  };
}


