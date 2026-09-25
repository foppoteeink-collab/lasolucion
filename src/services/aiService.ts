import { generateProceduralSchedule } from '../utils/proceduralHeuristics';

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

  // Gemini recommended models
  const candidateModels = ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];
  let generatedText = "";
  let lastError: any = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const modelName = candidateModels[i];
    try {
      const res = await fetch('/.netlify/functions/oraculo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: systemInstruction + "\n\nSolicitud del usuario:\n" + prompt,
          model: modelName
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        generatedText = data.candidates[0].content.parts[0].text;
        break;
      }
    } catch (err: any) {
      lastError = err;
      if (i < candidateModels.length - 1) {
        await new Promise(r => setTimeout(r, 300));
      }
    }
  }

  if (!generatedText) {
    console.log("[Generate-Schedule] AI failed. Compiling schedule via procedural heuristics.", lastError);
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
// Trigger rebuild for Netlify env vars
