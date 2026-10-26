import { getGenerativeModel } from 'firebase/ai';
import { firebaseAI, firebaseConfig } from '../firebase';
import { autoArrangeSchedule, cleanScheduleTitle } from '../utils/timeUtils';
import { generateProceduralSchedule, generateProceduralAnalysis } from '../utils/proceduralHeuristics';
import { KaiCustomForm, KaiMultiverseStyle } from '../types';

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
  onProgress?: (stage: 'vision' | 'generation', data?: { detectedObject?: string }) => void;
}): Promise<KaiCustomForm | null> {
  const { imageBase64, mimeType = 'image/jpeg', promptDescription = '', artStyle = 'clay3d', onProgress } = params;

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
  function buildMultiversePrompt(selectedArtStyle: KaiMultiverseStyle, userPrompt: string): string {
    let vectorDirective = '';
    switch (selectedArtStyle) {
      case 'clay3d':
        vectorDirective = `
ESTILO OBLIGATORIO: "3D Vinyl / Pixar".
REGLAS ESTRICTAS DE SVG:
- Genera código SVG con volumen 3D suave simulando una figura coleccionable de vinilo Pixar/Nintendo basada en la silueta y colores reales del objeto.
- En <defs>, incluye <radialGradient> y <linearGradient> con luces suaves y brillos especulares (highlights blancos con opacidad).
- Incluye <filter id="clayShadow"><feDropShadow dx="0" dy="5" stdDeviation="3.5" flood-color="#000000" flood-opacity="0.35" /></filter> para dar profundidad.
- Diseña grandes ojos brillantes estilo Pixar con destellos radiales y pupilas con doble reflejo blanco.
- Agrega zapatitos o extremidades tiernas de vinilo glossy y mejillas sonrojadas.`;
        break;

      case 'anime':
        vectorDirective = `
ESTILO OBLIGATORIO: "Anime / Chibi".
REGLAS ESTRICTAS DE SVG:
- Genera código SVG con técnica cel-shading manga: contornos limpios oscuros (stroke="#1e293b" stroke-width="1.8").
- Grandes ojos brillantes anime estilo kawaii/Ghibli con destellos circulares blancos múltiples.
- Mejillas sonrojadas (<ellipse opacity="0.5" fill="#f43f5e" />), colores planos vibrantes del objeto y expresión tierna.`;
        break;

      case 'comic':
        vectorDirective = `
ESTILO OBLIGATORIO: "Cómic Moderno (Pop Art)".
REGLAS ESTRICTAS DE SVG:
- Genera código SVG con entintado negro audaz (stroke="#000000" stroke-width="2.5" a "3").
- Colores primarios saturados, sombras gráficas dinámicas de corte duro y estética superheroica de novela gráfica moderna.
- Ojos expresivos con contorno negro marcado y cejas dinámicas.`;
        break;

      case 'crayon':
        vectorDirective = `
ESTILO OBLIGATORIO: "Crayón Infantil".
REGLAS ESTRICTAS DE SVG:
- Genera código SVG con trazos discontinuos (stroke-dasharray="3,3" o "4,2") y líneas orgánicas a mano alzada.
- Colores cera saturados y cálidos, expresión dulce y carismática estilo cuento ilustrado para niños.`;
        break;

      case 'toon':
        vectorDirective = `
ESTILO OBLIGATORIO: "Toon Clásico".
REGLAS ESTRICTAS DE SVG:
- Genera código SVG con estilo animación clásica rubber-hose: curvas elásticas, ojos cartoon grandes con pupilas recortadas, colores planos vivos, guantecitos blancos y botitas.`;
        break;

      case 'cyber-pixel':
      case 'pixel':
        vectorDirective = `
ESTILO OBLIGATORIO: "Cyber-Pixel (8-Bit)".
REGLAS ESTRICTAS DE SVG:
- Genera únicamente elementos <rect> alineados en una cuadrícula de 8x8px simulando pixel art retro.
- Cada elemento DEBE ser un <rect x="..." y="..." width="8" height="8" /> donde x e y son múltiplos de 8 (entre 16 y 144).
- Compón la silueta exacta del objeto detectado con sus colores reales y agrégale ojos grandes pixelados de 8x8 en el rostro.
- ¡ESTRICTAMENTE PROHIBIDO cualquier elemento que no sea <rect>!`;
        break;

      case 'organic-flow':
        vectorDirective = `
ESTILO OBLIGATORIO: "Flujo Orgánico".
REGLAS ESTRICTAS DE SVG:
- Genera exclusivamente curvas Bezier suaves (C y S en los paths) trazando la silueta del objeto detectado, sin ángulos rectos, stroke-width='2', fill='none'.
- Cada elemento DEBE ser un <path d="..." stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />.`;
        break;

      case 'low-poly':
        vectorDirective = `
ESTILO OBLIGATORIO: "Low Poly".
REGLAS ESTRICTAS DE SVG:
- Genera polígonos cerrados asignando a cada faceta un atributo fill-opacity entre 0.15 y 0.9 para simular volumen 3D del objeto detectado, stroke="none".
- Cada elemento DEBE ser un <polygon points="x1,y1 x2,y2 x3,y3 ..." fill-opacity="0.xx" stroke="none" />.`;
        break;

      case 'neon-geometry':
      default:
        vectorDirective = `
ESTILO OBLIGATORIO: "Geometría Neón".
REGLAS ESTRICTAS DE SVG:
- Genera <polygon> y <path> simétricos trazando la silueta reconocible del objeto detectado + ojos expresivos, stroke-width='2', fill='none'.
- Líneas rectas afiladas, limpias y simétricas respecto al eje central x = 80.`;
        break;
    }

    return `
ERES EL OJO CLÍNICO Y MOTOR MULTIMODAL DE LA FORJA NEURAL DE "LA SOLUCIÓN".
Tu misión es escanear la foto adjunta, identificar con máxima precisión qué objeto real u elemento aparece en ella, y generar un COMPAÑERO KAI ANTROPOMÓRFICO 100% SVG que capture la silueta real del objeto con rostro y ojos expresivos en el estilo: "${selectedArtStyle.toUpperCase()}".

PASO 1: ANÁLISIS DEL OBJETO REAL
- Identifica el objeto exactamente con sus rasgos distintivos (ej: "Encendedor amarillo transparente", "Taza de cerámica negra", "Zapatilla deportiva azul").
- Diseña un personaje antropomórfico (characterConcept) fusionando la silueta del objeto con anatomía viva (ojos expresivos integrados en la estructura del objeto, boca amigable, patitas o extremidades tiernas estilo Tamagotchi/Nintendo).
- Asígnale un nombre épico (epicName) y una frase breve y carismática de saludo (personalityQuote) acorde a su naturaleza.
- Extrae sus colores primario y secundario en formato hexadecimal.

PASO 2: ARQUITECTURA SVG
1. El SVG debe tener viewBox="0 0 160 170" y width="100%" height="100%".
2. ${vectorDirective}
${userPrompt ? `Contexto o pista del usuario: "${userPrompt}".` : ''}

DEVOLUCIÓN OBLIGATORIA (Responde ÚNICAMENTE con un JSON válido):
{
  "detectedObject": "Descripción exacta del objeto real identificado",
  "characterConcept": "Diseño detallado del personaje antropomórfico",
  "epicName": "Nombre creativo del compañero",
  "personalityQuote": "Frase breve de despertar del compañero",
  "primaryColor": "#hex",
  "secondaryColor": "#hex",
  "artStyle": "${selectedArtStyle}",
  "mood": "playful",
  "svg": "<svg viewBox=\\"0 0 160 170\\" xmlns=\\"http://www.w3.org/2000/svg\\">...</svg>"
}
`;
  }

  const systemInstructions = buildMultiversePrompt(artStyle, promptDescription);
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
            generationConfig: { temperature: 0.25, maxOutputTokens: 2048 },
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
            maxOutputTokens: 2048,
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
    mood: 'playful',
    renderBranch: 'vector',
    svgContent,
    polygons: Array.isArray(parsed.polygons) ? parsed.polygons : undefined,
  };
}


