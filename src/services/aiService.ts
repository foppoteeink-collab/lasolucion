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
📺 ESTILO: "CARTOON NETWORK CLÁSICO (EL GRAN PANTHEON DE ANIMACIÓN TRADICIONAL CN)"
Inspiración visual directa: Dexter, Las Chicas Superpoderosas, Samurai Jack, Coraje el Perro Cobarde, Ed Edd n Eddy, Billy y Mandy, Chowder, Hora de Aventura, KND (Los Chicos del Barrio), Mansión Foster, Un Show Más (Mordecai y Rigby), Gumball y Darwin, Johnny Bravo, Steven Universe, Teen Titans Go, Flapjack, Escandalosos y Mao Mao.

1. PRINCIPIO UNIVERSAL DE ANIMACIÓN (EL OBJETO COBRA VIDA):
- CUALQUIERA que sea el objeto presente en la fotografía, su estructura física, proporciones y contorno real constituyen el cuerpo del personaje.
- NO alteres ni reemplaces la silueta natural del objeto por figuras geométricas genéricas.
- Dota al objeto de vida antropomórfica integrando rostro, ojos y extremidades de forma orgánica que nazcan de su propia anatomía, manteniendo intactas y reconocibles todas sus características físicas, relieves y partes funcionales.
- Al ver el personaje, debe ser evidente e inconfundible qué objeto real fue fotografiado.

2. CATÁLOGO DE EXTREMIDADES SUPERIORES (BRAZOS Y MANOS):
- Brazos "Manguera de Goma / Rubber-Hose" (Jake, Finn, Coraje): Curvados, elásticos, sin codos rígidos, con manitas simples de 3 o 4 deditos o manoplas redondeadas.
- Brazos de "Científico con Guantes de Hule" (Dexter): Brazos estilizados que terminan en guantes de laboratorio con pliegues en la muñeca.
- Brazos "Hipermusculosos Geométricos" (Johnny Bravo): Bíceps en trapecio, muñecas estrechas y puños angulares.
- Brazos "Alas con Dedos de Pluma" (Mordecai): Brazos que terminan en plumas afiladas que gesticulan como dedos hábiles.
- Brazos "Patitas de Animal / Garras Amigables" (Rigby, Coraje, Gumball, Darwin): Extremidades ágiles con almohadillas o 3 garras redondeadas.
- Brazos "Robóticos / Cyborg" (Cyborg de Teen Titans, Robot de Dexter): Segmentos con juntas circulares, pernos y pinzas de armadura.
- Brazos de "Palillo Minimalista" (Mac, Mandy, Flapjack): Brazos ultra-delgados que contrastan cómicamente con manos expresivas.
- Brazos "Regordetes con Pliegues" (Chowder, Clarence, Tío Grandpa): Brazos gorditos con muñecas acojinadas.
- Brazos con "Mangas Holgadas Gigantes" (Samurai Jack, Ed): Mangas caídas donde las manos asoman apenas.
- Brazos "Vendados de Combate" (Chris McLean, Mao Mao): Muñequeras o vendajes blancos enrollados en los antebrazos.

3. CATÁLOGO DE EXTREMIDADES INFERIORES Y CALZADO:
- Botas "Tácticas de Suela Gruesa" (Numbuh 1 de KND, Robin): Botas marrones o negras con suela ancha y cordones cruzados visibles.
- Tenis "Deportivos / Skater Bicolor" (Darwin, Ben 10): Zapatillas deportivas con puntera de goma blanca y calcetines doblados.
- Zapatos "Mary Jane / Escolar Elegante" (Mandy): Zapatitos negros redondeados con correa y calcetitas blancas.
- Zapatitos "Puntiagudos de Laboratorio" (Dexter): Zapatos triangulares negros minúsculos que salen directamente de la base.
- Proporción "Clown / Piernas de Popote con Zapatones" (Numbuh 1, Mac): Piernas delgadísimas que rematan en zapatos descomunales.
- Patas "Animales Articuladas" (Rigby, Gumball, Coraje): Patas ágiles articuladas hacia atrás.
- Base "Espectral / Deslizante sin Piernas" (Puro Hueso, Bloo): Túnica negra desgarrada en la base o silueta fantasmagórica que flota.
- Pantalones "Acampanados / Baggy Caídos de los 90s" (Ed Edd n Eddy): Pantalones holgados que cubren los tobillos.

4. CATÁLOGO VISUAL DE OJOS Y MIRADAS CN:
- Ojos "Powerpuff / Gumball": Grandes círculos u óvalos blancos expresivos juntos en el centro, con pupilas negras de botón o con anillo de color brillante y destello gráfico blanco.
- Ojos "Mandy / Samurai Jack": Ceño negro grueso en V afilada que corta los ojos por la parte superior (mirada determinada, seria o rebelde).
- Ojos "Dexter / Numbuh 1 / Johnny Bravo": Gafas oscuras estilizadas o lentes de montura gruesa con reflejo blanco diagonal.
- Ojos "Hora de Aventura / Finn / Jake / Escandalosos": Dos puntos o píldoras negras minimalistas llenos de carisma y simplicidad.
- Ojos "Coraje / Billy / Ed": Ojos saltones ligeramente asimétricos con pupilas desorbitadas (asombro cómico).
- Ojos "Regular Show / Rigby / Mordecai": Óvalos negros con círculos oscuros de ojeras o marcas de contorno.

5. CATÁLOGO VISUAL DE BOCAS Y EXPRESIVIDAD:
- Sonrisa cómica abierta con lengua plana rosada y diente solitario caricaturesco (estilo Chowder, Flapjack o Darwin).
- O mueca ladeada sarcástica / confiada trazada en una sola línea angular negra (estilo Dexter o Mandy).
- O boca elástica y limpia de un solo trazo curvo expresivo (estilo Jake o Bloo).
- O pico / hocico geométrico integrado a la silueta del objeto (estilo Mordecai o Rigby).
- O mandíbula abierta de grito cómico o susto (estilo Coraje).

6. TÉCNICA VECTORIAL Y PALETA DE COLOR OBLIGATORIA:
- CONTORNO DE TINTA NEGRA PURO: stroke="#000000" con grosor uniforme y audaz (stroke-width="3.8" a "4.5"), stroke-linejoin="round" y stroke-linecap="round" en cada silueta y detalle.
- PALETA DE COLOR BASADA EN LA FOTO: Utiliza estrictamente los colores REALES del objeto fotografiado.
- COLOR EN BLOQUE PLANO (CEL-SHADING): ¡PROHIBIDO cualquier degradado difuso, sombras borrosas o efectos de render 3D! Colores planos y sólidos súper saturados. Sombras duras de corte recto en un tono 20% más oscuro.`;
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
Tu misión: analizar la foto adjunta, identificar con precisión el OBJETO real que contiene, y transformarlo en un COMPAÑERO VIVO KAI antropomórfico en formato SVG puro, aplicando con máxima fidelidad el estilo artístico especificado abajo.

🚨 DIRECTIVA CRÍTICA DE COLORES REALES (CERO COLORES DE LA APP):
- DEBES USAR OBLIGATORIAMENTE LOS COLORES REALES DEL OBJETO FOTOGRAFIADO:
  * Si la foto es una manzana roja → el personaje DEBE ser rojo manzana, con toques amarillos/verdes reales y tallo marrón o verde.
  * Si es un encendedor amarillo → el personaje DEBE ser amarillo brillante con los metales plateados del encendedor.
  * Si es un zapato azul → el cuerpo DEBE ser azul con detalles blancos o de suela.
- ¡ESTRICTAMENTE PROHIBIDO usar los colores cian, turquesa (#00f0ff, #38bdf8), violeta (#a855f7) de la aplicación!
- ¡ESTRICTAMENTE PROHIBIDO convertir el objeto en un robot cyberpunk o bloque oscuro genérico a menos que el objeto sea realmente un dispositivo electrónico!
- El personaje debe capturar la forma reconocible del objeto y verse cálido, profesional y con identidad propia.

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
   - <g id="kai-body"> → cuerpo, torso, forma principal del objeto con sus colores reales
   - <g id="kai-eyes"> → ambos ojos completos (globo ocular + iris)
   - <g id="kai-pupils"> → SOLO las pupilas o puntos centrales (seguirán el ratón y el dedo del usuario)
   - <g id="kai-mouth"> → boca (se animará al interactuar)
   - <g id="kai-left-hand"> → mano/brazo izquierdo (opcional)
   - <g id="kai-right-hand"> → mano/brazo derecho (opcional)
5. El objeto fotografiado DEBE ser plenamente reconocible en el diseño final.
6. Sombra de flotación en la base: <ellipse cx="80" cy="155" rx="28" ry="5" fill="#000000" opacity="0.25"/>
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

  // Validación estricta: asegurar que vino el SVG
  if (!svgContent && (!Array.isArray(parsed.polygons) || parsed.polygons.length === 0)) {
    throw new Error(`La IA reconoció el objeto "${detectedObject}", pero no generó el diseño para el estilo "${artStyle}". Por favor intenta de nuevo.`);
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


