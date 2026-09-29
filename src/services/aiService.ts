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

  let generatedText = "";
  const fullPrompt = systemInstruction + "\n\nSolicitud del usuario:\n" + prompt;

  const text = await fetchGeminiPrompt(fullPrompt, 'gemini-1.5-flash');
  if (text) {
    generatedText = text;
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
    : 'Sin notas de misiones registradas hoy.';

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
 Eres un Asistente Personal Ejecutivo y Analista de Rendimiento.
 Tu tono debe ser minimalista, directo al grano, corporativo, limpio y altamente analítico.
 Evita usar metáforas, jerga de ciencia ficción, excesos de emojis o lenguaje emocional. Presenta conclusiones basadas estrictamente en datos.

 DATOS DEL CLIENTE / OPERADOR:
 - Rol / Perfil: ${archetypeClass || 'Ejecutivo'}
 - Nivel Actual: ${stats?.level || 1} (${stats?.rankTitle || 'Principiante'})
 - Salud (HP): ${stats?.hp || 100}/${stats?.maxHp || 100}
 - Monedas / Créditos: ${stats?.coins || 0}
 - Días de Racha Activa: ${stats?.streakDays || 0} (Días de gracia: ${stats?.streakShields || 0})
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

  const text = await fetchGeminiPrompt(prompt, 'gemini-1.5-flash');
  if (text) {
    return { analysis: text, source: 'ai' };
  }

  const { generateProceduralAnalysis } = await import('../utils/proceduralHeuristics');
  const fallbackText = generateProceduralAnalysis(stats, archetypeClass, habitMastery, currentTasks);
  return { analysis: fallbackText, source: 'heuristics' };
}


