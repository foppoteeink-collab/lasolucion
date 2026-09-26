import { generateProceduralSchedule } from '../utils/proceduralHeuristics';

// SECURITY: NEVER add VITE_ prefixed keys here — Vite embeds them in the public JS bundle.
// All Gemini calls go through the server-side Netlify function /.netlify/functions/oraculo
// which reads GEMINI_API_KEY from the secure server environment.

async function fetchGeminiPrompt(promptText: string, modelName: string = 'gemini-3.6-flash'): Promise<string | null> {
  // Route ALL requests through the Netlify server function (API key stays server-side)
  try {
    const res = await fetch('/.netlify/functions/oraculo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptText, model: modelName })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.log(`[Gemini] ✓ Response via Netlify function (model: ${modelName})`);
        return data.candidates[0].content.parts[0].text;
      }
    } else {
      const errBody = await res.text();
      console.warn(`[Netlify/oraculo] HTTP ${res.status}:`, errBody);
    }
  } catch (err) {
    console.warn('[Netlify/oraculo] Function unavailable:', err);
  }

  // No client-side API key fallback — would expose the key in the JS bundle.
  // If running locally without Netlify CLI, use: netlify dev
  return null;
}

export async function generateScheduleFrontend(
  prompt: string,
  userContext: any,
  existingHabits: any[],
  mode: 'master_blocks' | 'detailed' = 'master_blocks'
): Promise<any> {
  if (!prompt) throw new Error("Falta el prompt del usuario.");

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
       - Agrupa el día en bloques sólidos y definidos según las actividades del usuario.
       - Si el usuario detalla variaciones día a día para una misma franja horaria, GENERA UN BLOQUE ESPECÍFICO PARA CADA DÍA.`
    : `MODO ESTRATÉGICO: "DETALLADO" (Máxima Granularidad y Fidelidad)
       - Extrae absolutamente CADA actividad y micro-bloque descrito por separado sin agrupar.`;

  const systemInstruction = `
    Eres el ARCHITECTO SUPREMO DE PRODUCTIVIDAD Y GESTIÓN DEL TIEMPO del Núcleo Central.
    Tu misión es analizar la descripción en lenguaje natural del día a día, trabajo y rutinas del operador humano y transformarla en una AGENDA DIARIA ESTRUCTURADA.

    ${modeDirective}

    CONTEXTO DEL OPERADOR:
    - Profesión/Ocupación: ${userContext?.profession || 'No especificada'}
    - Misión/Bio: ${userContext?.bio || 'No especificada'}
    - Mantra/Lema: ${userContext?.mantra || 'No especificado'}
    - Objetivo Principal: ${userContext?.mainGoal || 'No especificado'}
    - Clase/Rango: ${userContext?.class || 'Ninguna'} (${userContext?.rank || 'Principiante'})

    MATRIZ DE RUTINAS Y PALABRAS CLAVE EXISTENTES DEL OPERADOR:
    ${existingHabitsSummary}

    DIRECTIVA SUPREMA: PRECISIÓN HORARIA ESTRICTA (FORMATO 24 HORAS)
    1. CONVERSIÓN MILITAR / 24 HORAS (e.g., 1:30 pm -> 13:30).
    2. ADAPTABILIDAD GENERAL SEGÚN EL USUARIO.
    3. DESGLOSE DÍA POR DÍA (CUANDO EL USUARIO LO ESPECIFIQUE): usa frequencyType: "specific_days" y specificDays con el número de día (Dom=0, Lun=1...). L-V es [1,2,3,4,5].
    4. PROHIBICIÓN TOTAL DE MICRO-HÁBITOS DE RASTREO (agua, pasos, etc.).
    5. CATEGORÍAS PERMITIDAS: "rutina", "entrenamiento", "comida", "intelecto", "limpieza", "creativo".
    6. NO HÁBITOS 21/66 DÍAS: isQuickHabit: false, isTracked2166: false SIEMPRE.

    Devuelve ÚNICAMENTE un array JSON ESTRICTO sin formato Markdown. Ejemplo:
    [
      {
        "id": "hab-auto-1",
        "title": "Bloque de Trabajo",
        "category": "rutina",
        "timeBlock": "09:00 - 13:00",
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

  const candidateModels = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-2.5-flash", "gemini-3.5-flash"];
  let generatedText = "";
  const fullPrompt = systemInstruction + "\n\nSolicitud del usuario:\n" + prompt;

  for (const modelName of candidateModels) {
    const text = await fetchGeminiPrompt(fullPrompt, modelName);
    if (text) {
      generatedText = text;
      break;
    }
  }

  if (!generatedText) {
    console.log("[Generate-Schedule] AI failed. Compiling schedule via procedural heuristics.");
    return {
      habits: generateProceduralSchedule(prompt, userContext, mode),
      source: "emergency_fallback",
      notice: "Cuota de IA en pausa temporal o modelo no encontrado. Agenda estructurada exitosamente por el Núcleo Heurístico Local."
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
    return {
      habits: generateProceduralSchedule(prompt, userContext, mode),
      source: "emergency_fallback",
      notice: "Rutina estructurada en Bloques Maestros mediante el Núcleo Heurístico Local debido a formato de IA inesperado."
    };
  }

  habits = (Array.isArray(habits) ? habits : []).map((h: any) => {
    let sDays = h.specificDays;
    if (sDays === undefined || sDays === null) {
      sDays = (h.frequencyType === 'specific_days') ? [1,2,3,4,5] : [0,1,2,3,4,5,6];
    } else if (!Array.isArray(sDays)) {
      sDays = [sDays];
    }
    return {
      ...h,
      isQuickHabit: false,
      isTracked2166: false,
      specificDays: sDays
    };
  });

  return {
    habits,
    source: "ai"
  };
}

export async function generateNeuralAnalysisAI(
  stats: any,
  archetypeClass: string,
  habitMastery: any,
  currentTasks: any[],
  reflections: any
): Promise<{ analysis: string; source: 'ai' | 'heuristics' }> {
  const pendingTasks = (currentTasks || []).filter((t: any) => !t.completed);
  const completedTasks = (currentTasks || []).filter((t: any) => t.completed);
  const habitEntries = Object.entries(habitMastery || {});

  const prompt = `
 Eres el MOTOR DE DIAGNÓSTICO NEURAL SUPREMO (Quantum OS Neural Compiler).
 Realiza un Diagnóstico Neural Integral, Biológico y Táctico de 360 grados para el Operador Humano.

 TELEMETRÍA ACTUAL DEL OPERADOR:
 - Clase / Arquetipo: ${archetypeClass || 'El Héroe'}
 - Nivel: ${stats?.level || 1} (${stats?.rankTitle || 'Chispazo de Voluntad'})
 - Salud (HP): ${stats?.hp || 100}/${stats?.maxHp || 100}
 - Monedas / Créditos: ${stats?.coins || 0}
 - Racha Actual: ${stats?.streakDays || 0} días (Escudos: ${stats?.streakShields || 0})
 - Atributos: Disciplina=${stats?.attributes?.disciplina || 0}, Fuerza=${stats?.attributes?.fuerza || 0}, Mente=${stats?.attributes?.mente || 0}, Energía=${stats?.attributes?.energia || 0}, Estudio=${stats?.attributes?.estudio || 0}
 - Misiones Completadas Hoy: ${completedTasks.length} | Pendientes: ${pendingTasks.length}
 - Tareas Pendientes Lista: ${pendingTasks.map((t: any) => t.title).join(', ') || 'Ninguna'}
 - Hábitos en Dominio (Maltz): ${habitEntries.length} hábitos en seguimiento
 - Reflexiones Recientes: ${JSON.stringify(reflections || {})}

 ESTRUCTURA DEL INFORME REQUERIDO (Usa Markdown Sci-Fi Cyberpunk elegante con emojis de la terminal):
 1. 🌐 **TELEMETRÍA GENERAL Y ESTADO BIOLÓGICO**
    - Evalúa el nivel de energía, nivel de HP, racha actual y equilibrio de atributos.
 2. 🧠 **ANÁLISIS DE PATRONES Y VULNERABILIDADES NEURONALES**
    - Identifica los puntos fuertes del operador y los posibles cuellos de botella / entropía según su arquetipo (${archetypeClass}) y tareas pendientes.
 3. ⚡ **DIRECTIVA TÁCTICA DE OPTIMIZACIÓN (3 ACCIONES CIRÚRGICAS)**
    - Da 3 órdenes o pasos concretos e inmediatos que el operador debe ejecutar hoy para desbloquear el máximo rendimiento y subir de nivel.
  `;

  const candidateModels = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-2.5-flash", "gemini-3.5-flash"];
  for (const modelName of candidateModels) {
    const text = await fetchGeminiPrompt(prompt, modelName);
    if (text) {
      return { analysis: text, source: 'ai' };
    }
  }

  const { generateProceduralAnalysis } = await import('../utils/proceduralHeuristics');
  const fallbackText = generateProceduralAnalysis(stats, archetypeClass, habitMastery, currentTasks);
  return { analysis: fallbackText, source: 'heuristics' };
}


