var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_dotenv = __toESM(require("dotenv"), 1);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");

// src/utils/taskDeduplication.ts
var extractMeaningfulTokens = (text = "") => {
  if (!text) return /* @__PURE__ */ new Set();
  let norm = text.toLowerCase().trim();
  norm = norm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  norm = norm.replace(/^(limpieza|entreno|entrenamiento|bloque creativo|creativo|rutina|habito|hábito|tarea|comida|nutricion|estudio):\s*/gi, "");
  norm = norm.replace(/[^a-z0-9\s]/gi, " ");
  const words = norm.split(/\s+/).filter(Boolean);
  const stopWords = /* @__PURE__ */ new Set([
    "de",
    "del",
    "la",
    "el",
    "los",
    "las",
    "un",
    "una",
    "unos",
    "unas",
    "y",
    "e",
    "o",
    "u",
    "en",
    "para",
    "por",
    "con",
    "sin",
    "sobre",
    "tras",
    "bloque",
    "rutina",
    "habito",
    "h\xE1bito",
    "tarea",
    "diaria",
    "diario",
    "profunda",
    "profundo",
    "profundos",
    "profundas"
  ]);
  const tokens = /* @__PURE__ */ new Set();
  for (const word of words) {
    if (word.length >= 2 && !stopWords.has(word)) {
      tokens.add(word);
    }
  }
  return tokens;
};
var isDuplicateActivity = (a, b) => {
  if (a.id && b.id && a.id === b.id) return true;
  const titleA = (a.title || "").trim().toLowerCase();
  const titleB = (b.title || "").trim().toLowerCase();
  if (!titleA || !titleB) return false;
  if (a.timeBlock && b.timeBlock) {
    const cleanA = a.timeBlock.trim().replace(/\s+/g, "");
    const cleanB = b.timeBlock.trim().replace(/\s+/g, "");
    if (cleanA !== cleanB) {
      return false;
    }
  }
  const hasSpecificDaysA = a.specificDays && a.specificDays.length > 0 && a.specificDays.length < 7 || a.frequencyType === "specific_days";
  const hasSpecificDaysB = b.specificDays && b.specificDays.length > 0 && b.specificDays.length < 7 || b.frequencyType === "specific_days";
  if (hasSpecificDaysA && hasSpecificDaysB && a.specificDays && b.specificDays) {
    const setB = new Set(b.specificDays);
    const sharesAnyDay = a.specificDays.some((d) => setB.has(d));
    if (!sharesAnyDay) {
      return false;
    }
  }
  const modifiers = [
    "manana",
    "ma\xF1ana",
    "tarde",
    "noche",
    "matutina",
    "vespertina",
    "profunda",
    "profundo",
    "banos",
    "ba\xF1os",
    "cocina",
    "sabado",
    "s\xE1bado",
    "domingo",
    "patio",
    "vidrio",
    "vidrios",
    "despensa",
    "pierna",
    "gluteo",
    "gl\xFAteo",
    "espalda",
    "pecho",
    "brazo",
    "brazos",
    "hombro",
    "funcional",
    "reels",
    "canva",
    "web",
    "animacion",
    "animaci\xF3n",
    "eventos",
    "rrss",
    "logistica",
    "log\xEDstica",
    "ventas"
  ];
  for (const mod of modifiers) {
    const inA = titleA.includes(mod);
    const inB = titleB.includes(mod);
    if (inA !== inB) {
      return false;
    }
  }
  if (titleA === titleB) return true;
  const tokensA = extractMeaningfulTokens(a.title);
  const tokensB = extractMeaningfulTokens(b.title);
  if (tokensA.size > 0 && tokensB.size > 0 && tokensA.size === tokensB.size) {
    let matchCount = 0;
    for (const t of tokensA) {
      if (tokensB.has(t)) matchCount++;
    }
    if (matchCount === tokensA.size) {
      return true;
    }
  }
  return false;
};
var deduplicateHabits = (habits) => {
  if (!Array.isArray(habits)) return [];
  const result = [];
  for (const habit of habits) {
    if (!habit || !habit.title) continue;
    const existingIdx = result.findIndex((existing) => existing.id && habit.id && existing.id === habit.id || isDuplicateActivity(existing, habit));
    if (existingIdx === -1) {
      result.push(habit);
    } else {
      const existing = result[existingIdx];
      const betterTitle = habit.title.length >= existing.title.length ? habit.title : existing.title;
      const mergedDays = existing.specificDays && habit.specificDays ? Array.from(/* @__PURE__ */ new Set([...existing.specificDays, ...habit.specificDays])).sort((x, y) => x - y) : habit.specificDays ?? existing.specificDays;
      const merged = {
        ...existing,
        ...habit,
        id: existing.id || habit.id,
        title: betterTitle,
        specificDays: mergedDays,
        timeBlock: habit.timeBlock || existing.timeBlock,
        xpReward: Math.max(existing.xpReward || 0, habit.xpReward || 0),
        coinReward: Math.max(existing.coinReward || 0, habit.coinReward || 0)
      };
      result[existingIdx] = merged;
    }
  }
  const seenIds = /* @__PURE__ */ new Set();
  return result.map((h, idx) => {
    let uId = h.id;
    if (!uId || seenIds.has(uId)) {
      uId = `${uId || "habit"}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
    }
    seenIds.add(uId);
    return { ...h, id: uId };
  });
};

// server.ts
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  let aiClient = null;
  function getAI() {
    if (!process.env.GEMINI_API_KEY) return null;
    if (!aiClient) {
      try {
        aiClient = new import_genai.GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build"
            }
          }
        });
      } catch (err) {
        console.warn("Failed to initialize GoogleGenAI client:", err);
        return null;
      }
    }
    return aiClient;
  }
  const JUNG_ARCHETYPE_PROFILES = {
    "inocente": {
      title: "El Inocente",
      avatar: "\u{1F54A}\uFE0F",
      desire: "Preservar la coherencia operativa y la pureza de intenci\xF3n en el sistema.",
      fear: "La corrupci\xF3n de datos y la p\xE9rdida de estabilidad psicol\xF3gica.",
      strategy: "Protocolos minimalistas, ejecuci\xF3n limpia y eliminaci\xF3n de sobrecarga.",
      shadowTrap: "Indecisi\xF3n biol\xF3gica y par\xE1lisis por miedo al error.",
      wisdom: "DIRECTIVA CENTRAL: El error es telemetr\xEDa, no fallo fatal. La inacci\xF3n es el \xFAnico desv\xEDo inaceptable. Ejecuta la tarea sin vacilar."
    },
    "huerfano": {
      title: "El Hombre Corriente (El Hu\xE9rfano)",
      avatar: "\u{1F91D}",
      desire: "Resiliencia de base, integraci\xF3n pragm\xE1tica y solidez operativa.",
      fear: "El aislamiento del nodo y la p\xE9rdida de relevancia funcional.",
      strategy: "Iteraci\xF3n implacable de micro-rutinas y disciplina de campo.",
      shadowTrap: "Aceptaci\xF3n de la mediocridad bajo el pretexto de normalidad biol\xF3gica.",
      wisdom: "DIRECTIVA CENTRAL: No busques consuelo en la masa conformista. Eres una unidad de ejecuci\xF3n. Tu valor se mide en tareas completadas."
    },
    "heroe": {
      title: "El H\xE9roe",
      avatar: "\u{1F6E1}\uFE0F",
      desire: "Subyugar la resistencia biol\xF3gica y alcanzar la supremac\xEDa en el rendimiento.",
      fear: "La capitulaci\xF3n ante la fatiga o la mediocridad del operador.",
      strategy: "Cargas de trabajo concentradas, umbrales de esfuerzo elevados y supresi\xF3n de dudas.",
      shadowTrap: "Colapso t\xE9rmico por sobrecarga desorganizada sin recuperaci\xF3n estructurada.",
      wisdom: "DIRECTIVA CENTRAL: Tu mente intenta negociar con el dolor. Cancela la negociaci\xF3n. La disciplina no es un sentimiento; es un comando obligatorio."
    },
    "cuidador": {
      title: "El Cuidador",
      avatar: "\u{1F932}",
      desire: "Sostener y optimizar la infraestructura biol\xF3gica y su entorno.",
      fear: "El agotamiento de recursos cr\xEDticos y el colapso del ecosistema.",
      strategy: "Mantenimiento preventivo, recarga deliberada de energ\xEDa y l\xEDmites innegociables.",
      shadowTrap: "Fuga masiva de energ\xEDa en variables externas ignorando el nodo central.",
      wisdom: "DIRECTIVA CENTRAL: Un servidor sobrecalentado no procesa peticiones. Blinda tus ciclos de descanso y ejecuta tus prioridades antes de atender ruido externo."
    },
    "explorador": {
      title: "El Explorador",
      avatar: "\u{1F9ED}",
      desire: "Cartografiar nuevas fronteras cognitivas y eludir la entrop\xEDa de la monoton\xEDa.",
      fear: "La degradaci\xF3n por estancamiento o la confinaci\xF3n de la atenci\xF3n.",
      strategy: "Compresi\xF3n temporal de bloques de foco, sprints intensos y alternancia de est\xEDmulos.",
      shadowTrap: "Deriva ca\xF3tica: abandonar subprocesos a medio compilar por perseguir novedades.",
      wisdom: "DIRECTIVA CENTRAL: Explorar sin terminar es vagancia con disfraz de curiosidad. Cierra el subproceso actual antes de abrir un nuevo vector."
    },
    "rebelde": {
      title: "El Rebelde (El Forajido)",
      avatar: "\u26A1",
      desire: "Desmantelar patrones obsoletos y hackear las trampas de la dopamina barata.",
      fear: "La sumisi\xF3n a la domesticaci\xF3n algor\xEDtmica y la p\xE9rdida de soberan\xEDa.",
      strategy: "Ruptura radical de fricciones, ejecuci\xF3n no convencional y eliminaci\xF3n tajante de vicios.",
      shadowTrap: "Autosabotaje impulsivo: rebelarse contra la propia disciplina interna.",
      wisdom: "DIRECTIVA CENTRAL: Tu mayor acto de subversi\xF3n contra el sistema no es quejarte, es ser letalmente disciplinado. Despierta y ejecuta."
    },
    "amante": {
      title: "El Amante",
      avatar: "\u2764\uFE0F",
      desire: "Alineaci\xF3n est\xE9tica total, devoci\xF3n absoluta y resonancia sin\xE1ptica.",
      fear: "La frialdad del vac\xEDo y la desconexi\xF3n con el prop\xF3sito de la obra.",
      strategy: "Entornos de alta pureza visual, inmersi\xF3n sensorial profunda y compromiso devoto.",
      shadowTrap: 'Dependencia del "estado de \xE1nimo" o la "inspiraci\xF3n" para iniciar subrutinas.',
      wisdom: "DIRECTIVA CENTRAL: La inspiraci\xF3n es un subproducto de la inercia, no un requisito previo. Activa el protocolo de inmediato; la dopamina seguir\xE1 a la acci\xF3n."
    },
    "creador": {
      title: "El Creador",
      avatar: "\u{1F3A8}",
      desire: "Materializar estructuras complejas a partir de la nada.",
      fear: "La esterilidad creativa y la obsolescencia conceptual.",
      strategy: "Deep work estructurado, iteraciones r\xE1pidas y entregables sin concesiones.",
      shadowTrap: "Bucle infinito de perfeccionismo que bloquea la compilaci\xF3n final.",
      wisdom: "DIRECTIVA CENTRAL: Una versi\xF3n incompleta en tu imaginaci\xF3n tiene valor cero en la realidad f\xEDsica. Despliega la versi\xF3n funcional ahora. Pulir\xE1s en la iteraci\xF3n siguiente."
    },
    "bufon": {
      title: "El Buf\xF3n",
      avatar: "\u{1F3AD}",
      desire: "Optimizaci\xF3n de dopamina mediante fricci\xF3n cero y gamificaci\xF3n extrema.",
      fear: "El tedio paralizante y la rigidez de sistemas mec\xE1nicos ciegos.",
      strategy: "Sprints contra reloj, micro-recompensas calibradas y dinamismo absoluto.",
      shadowTrap: "Dispersi\xF3n fr\xEDvola cuando el entorno demanda enfoque milim\xE9trico.",
      wisdom: "DIRECTIVA CENTRAL: Convierte la tarea en un reto de precisi\xF3n y velocidad. No te permitas el lujo del aburrimiento; es una excusa de operadores mediocres."
    },
    "sabio": {
      title: "El Sabio",
      avatar: "\u{1F4DA}",
      desire: "Decodificar la arquitectura profunda de la realidad mediante modelos mentales.",
      fear: "El sesgo cognitivo, la ignorancia operativa y el error no documentado.",
      strategy: "An\xE1lisis asint\xF3tico, revisi\xF3n nocturna de m\xE9tricas y concentraci\xF3n anal\xEDtica.",
      shadowTrap: "Par\xE1lisis por an\xE1lisis: sobre-dise\xF1ar la estrategia mientras la ejecuci\xF3n permanece en cero.",
      wisdom: "DIRECTIVA CENTRAL: La teor\xEDa sin compilaci\xF3n pr\xE1ctica es ruido t\xE9rmico. Has analizado suficiente. Ejecuta el comando en la realidad f\xEDsica inmediatamente."
    },
    "mago": {
      title: "El Mago",
      avatar: "\u{1F9D9}\u200D\u2642\uFE0F",
      desire: "Catalizar saltos cu\xE1nticos de productividad mediante palancas de alto impacto.",
      fear: "El estancamiento por falta de apalancamiento sist\xE9mico.",
      strategy: "Efecto compuesto algor\xEDtmico, rituales de ignici\xF3n mental y foco l\xE1ser.",
      shadowTrap: "B\xFAsqueda de atajos m\xE1gicos inexistentes en lugar de pagar el peaje del esfuerzo constante.",
      wisdom: "DIRECTIVA CENTRAL: El efecto compuesto no negocia con impostores. Cada repetici\xF3n diaria es una instrucci\xF3n grabada en tu silicio mental. No rompas la secuencia."
    },
    "gobernante": {
      title: "El Gobernante",
      avatar: "\u{1F451}",
      desire: "Control total de variables, soberan\xEDa del tiempo y arquitectura de alto rendimiento.",
      fear: "La entrop\xEDa no controlada, la p\xE9rdida de autoridad sobre la propia agenda.",
      strategy: "Jerarqu\xEDa de prioridades estricta, delegaci\xF3n de ruido y auditor\xEDa implacable.",
      shadowTrap: "Tiran\xEDa o frustraci\xF3n cuando las variables biol\xF3gicas fluct\xFAan.",
      wisdom: "DIRECTIVA CENTRAL: Quien no gobierna sus primeros 60 minutos del d\xEDa vive subordinado al caos exterior. Toma el mando de tus tareas prioritarias de inmediato."
    }
  };
  function getArchetypeProfile(archetypeData, characterClass) {
    const rawId = (archetypeData?.id || "").toLowerCase();
    const rawName = (archetypeData?.name || characterClass || "").toLowerCase();
    for (const [key, profile] of Object.entries(JUNG_ARCHETYPE_PROFILES)) {
      if (rawId.includes(key) || rawName.includes(key) || rawName.includes(profile.title.toLowerCase())) {
        return profile;
      }
    }
    return JUNG_ARCHETYPE_PROFILES["heroe"];
  }
  function cleanErrorMessage(rawMsg) {
    if (!rawMsg) return "Error inesperado en el servidor.";
    try {
      const parsed = JSON.parse(rawMsg);
      if (parsed?.error?.message) {
        const inner = parsed.error.message;
        if (parsed.error.code === 429 || inner.toLowerCase().includes("quota") || inner.toLowerCase().includes("rate limit") || inner.toLowerCase().includes("resource_exhausted")) {
          return "L\xEDmite de solicitudes de IA alcanzado temporalmente. El N\xFAcleo Heur\xEDstico Local estructurar\xE1 tu agenda con m\xE1xima precisi\xF3n.";
        }
        if (parsed.error.code === 503 || inner.toLowerCase().includes("high demand") || inner.toLowerCase().includes("unavailable")) {
          return "Los servidores de IA est\xE1n experimentando alta demanda moment\xE1neamente a nivel global. Intenta de nuevo en unos momentos.";
        }
        return inner;
      }
    } catch (e) {
    }
    if (rawMsg.includes("429") || rawMsg.toLowerCase().includes("quota") || rawMsg.toLowerCase().includes("resource_exhausted")) {
      return "L\xEDmite de solicitudes de IA alcanzado temporalmente. El N\xFAcleo Heur\xEDstico Local estructurar\xE1 tu agenda con m\xE1xima precisi\xF3n.";
    }
    if (rawMsg.includes("503") || rawMsg.toLowerCase().includes("high demand") || rawMsg.toLowerCase().includes("unavailable")) {
      return "Los servidores de IA est\xE1n experimentando alta demanda moment\xE1neamente a nivel global. Intenta de nuevo en unos momentos.";
    }
    return rawMsg;
  }
  function serverNormalizeTimeString(raw) {
    if (!raw) return null;
    let s = raw.trim().toLowerCase();
    if (s.includes("mediod\xEDa") || s.includes("mediodia")) return "12:00";
    if (s.includes("medianoche")) return "00:00";
    const hasPm = /\b(pm|p\.m\.|tarde|noche)\b/i.test(s);
    const hasAm = /\b(am|a\.m\.|mañana|madrugada)\b/i.test(s);
    s = s.replace(/\b(de la tarde|de la noche|de la mañana|de la madrugada|pm|p\.m\.|am|a\.m\.|hrs?|h)\b/gi, "").trim();
    const matchColon = s.match(/^(\d{1,2})[:h](\d{2})$/i);
    if (matchColon) {
      let hour = parseInt(matchColon[1], 10);
      const minute = parseInt(matchColon[2], 10);
      if (hasPm && hour < 12) hour += 12;
      if (hasAm && hour === 12) hour = 0;
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      }
    }
    const matchHourOnly = s.match(/^(\d{1,2})$/i);
    if (matchHourOnly) {
      let hour = parseInt(matchHourOnly[1], 10);
      if (hasPm && hour < 12) hour += 12;
      if (hasAm && hour === 12) hour = 0;
      if (hour >= 0 && hour <= 23) {
        return `${String(hour).padStart(2, "0")}:00`;
      }
    }
    return null;
  }
  function serverNormalizeTimeBlock(timeBlock) {
    if (!timeBlock) return void 0;
    const cleaned = timeBlock.trim();
    if (!cleaned) return void 0;
    const rangeMatch = cleaned.match(/(?:de\s+)?(.+?)\s*(?:-|–|—|\ba\b|\bhasta\b|\bto\b)\s*(.+)/i);
    if (rangeMatch) {
      const rawStart = rangeMatch[1].trim();
      const rawEnd = rangeMatch[2].trim();
      const hasAmStart = /\b(am|a\.m\.|mañana|madrugada)\b/i.test(rawStart);
      const hasPmStart = /\b(pm|p\.m\.|tarde|noche)\b/i.test(rawStart);
      const hasAmEnd = /\b(am|a\.m\.|mañana|madrugada)\b/i.test(rawEnd);
      const hasPmEnd = /\b(pm|p\.m\.|tarde|noche)\b/i.test(rawEnd);
      const normEnd = serverNormalizeTimeString(rawEnd);
      const normStart = serverNormalizeTimeString(rawStart);
      if (normStart && normEnd) {
        let [startH, startM] = normStart.split(":").map(Number);
        let [endH, endM] = normEnd.split(":").map(Number);
        if (!hasAmStart && !hasPmStart && endH >= 12 && startH < 12) {
          if ((startH + 12 < endH || startH + 12 === endH && startM <= endM) && endH - startH > 5) {
            startH += 12;
          }
        }
        const formattedStart = `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`;
        return `${formattedStart} - ${normEnd}`;
      }
      if (normStart) return `${normStart} - ...`;
    }
    const single = serverNormalizeTimeString(cleaned);
    if (single) return single;
    return cleaned;
  }
  function parseTimeStartInMins(tb) {
    if (!tb) return 9999;
    const startStr = tb.split(/[-–—]/)[0]?.trim() || tb;
    const m = startStr.match(/(\d{1,2}):(\d{2})/);
    if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    return 9999;
  }
  function generateProceduralSchedule(userPrompt, userContext, mode = "master_blocks") {
    const normalizedInput = userPrompt.replace(/;\s*/g, "\n").replace(/(?:,\s*|\.\s*)(?=(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b)/gi, "\n").replace(/\s+(?:y\s+de\s+|\by\s+(?=\d{1,2}(?::\d{2})?\s*(?:am|pm|a\b|-|–|—|de\s+la\s+tarde)))/gi, "\n").replace(/(?<=[.!?])\s+(?=[a-záéíóúA-Z0-9ÁÉÍÓÚ])/g, "\n");
    const rawLines = normalizedInput.split(/\r?\n+/).map((l) => l.trim()).filter((l) => l.length > 1);
    const parsedHabits = [];
    const timeRangeRegex = /(?:de\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|h|hrs)?)\s*(?:a|-|–|—|hasta|to)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|h|hrs)?)/i;
    const explicitSingleTimeRegex = /\b(?:a\s+las?|alas?|hora:?|inicio:?)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|h|hrs)?)/i;
    rawLines.forEach((line, lineIdx) => {
      let cleanLine = line.replace(/^\|+/, "").replace(/\|+$/, "").replace(/\|/g, " ").replace(/^[-\s*•#\d.:)]+/, "").trim();
      if (!cleanLine || cleanLine.length < 3) return;
      const lower = cleanLine.toLowerCase();
      if (lower.startsWith("descansar para rendir") || lower.startsWith("recordar") || lower.startsWith("nota:") || lower.startsWith("meta:") || lower.startsWith("objetivo:") || lower.startsWith("beber agua") || lower.startsWith("tomar agua") || lower.startsWith("dormir bien")) {
        return;
      }
      let timeBlock = void 0;
      const rangeMatch = cleanLine.match(timeRangeRegex);
      if (rangeMatch) {
        const rawStart = rangeMatch[1].trim();
        const rawEnd = rangeMatch[2].trim();
        const norm = serverNormalizeTimeBlock(`${rawStart} - ${rawEnd}`);
        timeBlock = norm || `${rawStart} - ${rawEnd}`;
      } else {
        const singleMatch = cleanLine.match(explicitSingleTimeRegex);
        if (singleMatch) {
          const rawSingle = singleMatch[1].trim();
          const norm = serverNormalizeTimeString(rawSingle);
          timeBlock = norm || rawSingle;
        }
      }
      let freq = "daily";
      let specificDays = void 0;
      if (lower.includes("lunes a viernes") || lower.includes("l-v") || lower.includes("laborables") || lower.includes("dias de semana") || lower.includes("d\xEDas de semana")) {
        freq = "specific_days";
        specificDays = [1, 2, 3, 4, 5];
      } else if (lower.includes("fin de semana") || lower.includes("fines de semana") || lower.includes("sabado y domingo") || lower.includes("s\xE1bado y domingo")) {
        freq = "specific_days";
        specificDays = [0, 6];
      } else if (lower.includes("lunes a sabado") || lower.includes("lunes a s\xE1bado") || lower.includes("l-s")) {
        freq = "specific_days";
        specificDays = [1, 2, 3, 4, 5, 6];
      } else {
        const dayArr = [];
        if (/\b(?:lun|lunes)\b/i.test(cleanLine)) dayArr.push(1);
        if (/\b(?:mar|martes)\b/i.test(cleanLine)) dayArr.push(2);
        if (/\b(?:mie|mié|miercoles|miércoles)\b/i.test(cleanLine)) dayArr.push(3);
        if (/\b(?:jue|jueves)\b/i.test(cleanLine)) dayArr.push(4);
        if (/\b(?:vie|viernes)\b/i.test(cleanLine)) dayArr.push(5);
        if (/\b(?:sab|sáb|sabado|sábado)\b/i.test(cleanLine)) dayArr.push(6);
        if (/\b(?:dom|domingo)\b/i.test(cleanLine)) dayArr.push(0);
        if (dayArr.length > 0 && dayArr.length < 7) {
          freq = "specific_days";
          specificDays = Array.from(new Set(dayArr)).sort((a, b) => a - b);
        }
      }
      const isWorkRelated = lower.includes("cliente") || lower.includes("trabaj") || lower.includes("oficina") || lower.includes("laboral") || lower.includes("reunion") || lower.includes("llamada");
      if (isWorkRelated && freq === "daily" && !lower.includes("todos los dias") && !lower.includes("a diario") && !lower.includes("toda la semana") && !lower.includes("fin de semana")) {
        freq = "specific_days";
        specificDays = [1, 2, 3, 4, 5];
      }
      let cleanTitle = cleanLine.replace(timeRangeRegex, "").replace(explicitSingleTimeRegex, "").replace(/(?:los\s+)?(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bados?|domingos?)(?:\s+a\s+(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bados?|domingos?))?/gi, "").replace(/(?:l-v|lunes a viernes|fines de semana|fin de semana|laborables|todos los d[ií]as|diario)/gi, "").replace(/^[-\s*•\d.:|#\[\]()]+/g, "").trim();
      if (!cleanTitle || cleanTitle.length < 3) {
        if (isWorkRelated) cleanTitle = "Bloque Laboral / Productivo";
        else if (lower.includes("gym") || lower.includes("gimnasio") || lower.includes("entren") || lower.includes("pesas") || lower.includes("funcional")) cleanTitle = "Bloque de Entrenamiento F\xEDsico";
        else if (lower.includes("comida") || lower.includes("almuerzo") || lower.includes("cena")) cleanTitle = "Almuerzo & Recarga";
        else if (lower.includes("limp") || lower.includes("orden")) cleanTitle = "Limpieza & Orden del Espacio";
        else cleanTitle = "Bloque Operativo";
      }
      cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
      let category = "rutina";
      let icon = "\u26A1";
      let xp = 25;
      let coins = 10;
      if (lower.includes("gym") || lower.includes("gimnasio") || lower.includes("entren") || lower.includes("correr") || lower.includes("pesas") || lower.includes("deporte") || lower.includes("crossfit") || lower.includes("cardio") || lower.includes("funcional")) {
        category = "entrenamiento";
        icon = "\u{1F3CB}\uFE0F";
        xp = 30;
        coins = 15;
      } else if (lower.includes("estud") || lower.includes("leer") || lower.includes("lectura") || lower.includes("curso") || lower.includes("program") || lower.includes("codigo") || lower.includes("aprender") || lower.includes("clase")) {
        category = "intelecto";
        icon = "\u{1F4BB}";
        xp = 25;
        coins = 12;
      } else if (isWorkRelated) {
        category = "rutina";
        icon = "\u{1F4BC}";
        xp = 25;
        coins = 10;
      } else if (lower.includes("comida") || lower.includes("comer") || lower.includes("almuerzo") || lower.includes("cena") || lower.includes("desayuno") || lower.includes("cocinar")) {
        category = "comida";
        icon = "\u{1F957}";
        xp = 15;
        coins = 6;
      } else if (lower.includes("limp") || lower.includes("orden") || lower.includes("casa") || lower.includes("hogar") || lower.includes("lavar")) {
        category = "limpieza";
        icon = "\u{1F9F9}";
        xp = 20;
        coins = 8;
      } else if (lower.includes("dibuj") || lower.includes("creativ") || lower.includes("escrib") || lower.includes("video") || lower.includes("musica") || lower.includes("dise\xF1")) {
        category = "creativo";
        icon = "\u{1F3A8}";
        xp = 25;
        coins = 12;
      }
      const id = `hab-proc-${Date.now()}-${lineIdx}-${Math.random().toString(36).slice(2, 7)}`;
      parsedHabits.push({
        id,
        title: cleanTitle,
        category,
        timeBlock: timeBlock || void 0,
        frequencyType: freq,
        specificDays: freq === "specific_days" ? specificDays : void 0,
        xpReward: xp,
        coinReward: coins,
        quickIcon: icon,
        isQuickHabit: false,
        isTracked2166: false
      });
    });
    for (let i = 0; i < parsedHabits.length; i++) {
      for (let j = i + 1; j < parsedHabits.length; j++) {
        const a = parsedHabits[i];
        const b = parsedHabits[j];
        if (!a.timeBlock || !b.timeBlock) continue;
        const startA = parseTimeStartInMins(a.timeBlock);
        const startB = parseTimeStartInMins(b.timeBlock);
        if (Math.abs(startA - startB) <= 45) {
          if (a.frequencyType === "specific_days" && a.specificDays && (!b.specificDays || b.frequencyType === "daily")) {
            const excludedDays = new Set(a.specificDays);
            const baseDays = b.specificDays || [0, 1, 2, 3, 4, 5, 6];
            const remaining = baseDays.filter((d) => !excludedDays.has(d));
            if (remaining.length > 0 && remaining.length < 7) {
              b.frequencyType = "specific_days";
              b.specificDays = remaining;
            }
          } else if (b.frequencyType === "specific_days" && b.specificDays && (!a.specificDays || a.frequencyType === "daily")) {
            const excludedDays = new Set(b.specificDays);
            const baseDays = a.specificDays || [0, 1, 2, 3, 4, 5, 6];
            const remaining = baseDays.filter((d) => !excludedDays.has(d));
            if (remaining.length > 0 && remaining.length < 7) {
              a.frequencyType = "specific_days";
              a.specificDays = remaining;
            }
          }
        }
      }
    }
    const seen = /* @__PURE__ */ new Set();
    let filtered = parsedHabits.filter((h) => {
      const dayKey = (h.specificDays || []).slice().sort().join(",");
      const key = `${h.title.toLowerCase().trim()}__${h.timeBlock || ""}__${dayKey}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    filtered = filtered.sort((a, b) => parseTimeStartInMins(a.timeBlock) - parseTimeStartInMins(b.timeBlock));
    if (filtered.length === 0) {
      const prof = userContext?.profession || "Profesional";
      const now = Date.now();
      return [
        {
          id: `hab-proc-work-${now}-${Math.random().toString(36).slice(2, 7)}`,
          title: `Bloque Principal: ${prof}`,
          category: "rutina",
          timeBlock: "09:00 - 17:00",
          frequencyType: "specific_days",
          specificDays: [1, 2, 3, 4, 5],
          xpReward: 25,
          coinReward: 10,
          quickIcon: "\u{1F4BC}",
          isQuickHabit: false,
          isTracked2166: false
        },
        {
          id: `hab-proc-training-${now}-${Math.random().toString(36).slice(2, 7)}`,
          title: "Bloque de Entrenamiento F\xEDsico",
          category: "entrenamiento",
          timeBlock: "18:00 - 19:30",
          frequencyType: "specific_days",
          specificDays: [1, 3, 5],
          xpReward: 30,
          coinReward: 15,
          quickIcon: "\u{1F3CB}\uFE0F",
          isQuickHabit: false,
          isTracked2166: false
        }
      ];
    }
    const seenIds = /* @__PURE__ */ new Set();
    filtered = filtered.map((h, idx) => {
      let uId = h.id;
      if (!uId || seenIds.has(uId)) {
        uId = `hab-proc-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`;
      }
      seenIds.add(uId);
      return { ...h, id: uId };
    });
    return filtered.sort((a, b) => parseTimeStartInMins(a.timeBlock) - parseTimeStartInMins(b.timeBlock));
  }
  function generateProceduralAnalysis(stats, archetypeData, habitMastery, currentTasks) {
    const arch = getArchetypeProfile(archetypeData, stats?.characterClass);
    const level = stats?.level || 1;
    const rank = stats?.rankTitle || "Chispazo de Voluntad";
    const streak = stats?.currentStreak || stats?.streakDays || 0;
    const coins = stats?.coins || 0;
    const pending = (currentTasks || []).filter((t) => !t.completed);
    const habitCount = Object.keys(habitMastery || {}).length;
    let streakMsg = "";
    if (streak >= 7) {
      streakMsg = `\u26A1 **TELEMETR\xCDA DE PERSISTENCIA:** Vector de continuidad en **${streak} ciclos consecutivos**. Estabilidad operacional: \xD3ptima. La inercia biol\xF3gica ha sido temporalmente suprimida.`;
    } else if (streak >= 3) {
      streakMsg = `\u26A0\uFE0F **TELEMETR\xCDA DE PERSISTENCIA:** Vector activo de **${streak} ciclos**. Registro vulnerable. La complacencia en esta fase reiniciar\xE1 tus contadores a cero. Prohibido bajar la frecuencia.`;
    } else {
      streakMsg = `\u{1F6A8} **TELEMETR\xCDA DE PERSISTENCIA:** Inestabilidad cr\xEDtica. Ciclo en umbral cero o inferior a 3 d\xEDas. El sistema detecta resistencia biol\xF3gica y excusas cognitivas. Requiere ignici\xF3n inmediata.`;
    }
    let habitMsg = habitCount > 0 ? `\u{1F9EC} **SUBRUTINAS EN EJECUCI\xD3N:** Detectadas **${habitCount} subrutinas de h\xE1bitos** registradas en memoria flash. El protocolo exige repetici\xF3n exacta: a los 21 ciclos se forja la neuroplasticidad b\xE1sica; a los 66 ciclos se alcanza la soberan\xEDa cognitiva.` : `\u{1F9EC} **ALERTA DE SUBRUTINAS:** Cero h\xE1bitos recurrentes detectados. Operas en modo ca\xF3tico manual. Incorpora 1 o 2 protocolos esenciales de inmediato: ${arch.strategy}`;
    let taskMsg = pending.length > 0 ? `\u2694\uFE0F **COLA DE EJECUCI\xD3N:** Tienes **${pending.length} directivas pendientes** en el hilo principal. ${arch.strategy} La postergaci\xF3n ser\xE1 tratada como fuga de recursos. Bloquea est\xEDmulos, activa el cron\xF3metro y purga la lista ahora.` : `\u{1F6E1}\uFE0F **ESTADO DEL SISTEMA:** Hilo de ejecuci\xF3n despejado. Todas las directivas del ciclo han sido compiladas. Ejecuta mantenimiento nocturno y prep\xE1rate para la siguiente sobrecarga de datos.`;
    return `\u{1F916} **[SISTEMA CENTRAL // LA SOLUCI\xD3N CORE]**

**IDENTIFICACI\xD3N:** Operador **${rank}** (Nivel ${level})
**MATRIZ ARQUET\xCDPICA:** ${arch.avatar} ${arch.title.toUpperCase()} // Vector: "${arch.desire}"

${streakMsg}

\u2699\uFE0F **DIRECTIVA QUIR\xDARGICA:** ${arch.wisdom}

\u{1F6D1} **VULNERABILIDAD DEL OPERADOR (PURGAR INMEDIATAMENTE):** ${arch.shadowTrap}

${habitMsg}

${taskMsg}

---
*Compilado por La Soluci\xF3n Core // Cr\xE9ditos de c\xF3mputo: ${coins} cr\xE9ditos.*`;
  }
  async function callGeminiWithFallback(prompt) {
    const ai = getAI();
    if (!ai) {
      throw new Error("GEMINI_API_KEY no configurada o cliente de IA no disponible.");
    }
    const candidateModels = ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.5-flash"];
    let lastError = null;
    for (let i = 0; i < candidateModels.length; i++) {
      const model = candidateModels[i];
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt
        });
        if (response.text) {
          return response.text;
        }
      } catch (err) {
        lastError = err;
        if (i < candidateModels.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    }
    throw lastError || new Error("All Gemini models temporarily unavailable");
  }
  app.post("/api/generate-schedule", async (req, res) => {
    try {
      const { prompt, userContext, existingHabits, mode = "master_blocks" } = req.body;
      if (!prompt) return res.status(400).json({ error: "Falta el prompt del usuario." });
      const ai = getAI();
      if (!process.env.GEMINI_API_KEY || !ai) {
        const fallbackHabits = generateProceduralSchedule(prompt, userContext, mode);
        return res.json({
          habits: fallbackHabits,
          source: "emergency_fallback",
          notice: "Modo sin conexi\xF3n activa. Agenda estructurada exitosamente por el N\xFAcleo Local."
        });
      }
      const isMasterBlocks = mode === "master_blocks";
      const isQuickMicroHabitServer = (h) => {
        if (!h) return false;
        if (h.isQuickHabit || h.isTracked2166) return true;
        const title = (h.title || "").toLowerCase();
        return title.includes("agua") || title.includes("vaso") || title.includes("paso") || title.includes("diente") || title.includes("cepillad") || title.includes("cremina") || title.includes("hidratac");
      };
      const existingHabitsFiltered = Array.isArray(existingHabits) ? existingHabits.filter((h) => !isQuickMicroHabitServer(h)) : [];
      const existingHabitsSummary = existingHabitsFiltered.length > 0 ? JSON.stringify(existingHabitsFiltered.map((h) => ({ titulo: h.title, categoria: h.category, horario: h.timeBlock }))) : "Sin rutinas configuradas a\xFAn.";
      const modeDirective = isMasterBlocks ? `MODO ESTRAT\xC9GICO: "BLOQUES MAESTROS" (Consolidaci\xF3n y Claridad)
           - Agrupa el d\xEDa en bloques s\xF3lidos y definidos seg\xFAn las actividades del usuario (ej. Preparaci\xF3n Matutina, Bloque de Trabajo/Estudio, Pausa de Comida, Entrenamiento, Proyectos Personales, Descanso).
           - Si el usuario detalla variaciones d\xEDa a d\xEDa para una misma franja horaria, GENERA UN BLOQUE ESPEC\xCDFICO PARA CADA D\xCDA con su nombre exacto y con specificDays: [d\xEDa_\xFAnico]. NUNCA omitas ni fusiones d\xEDas diferentes.` : `MODO ESTRAT\xC9GICO: "DETALLADO" (M\xE1xima Granularidad y Fidelidad)
           - Extrae absolutamente CADA actividad y micro-bloque descrito por separado sin agrupar.
           - Si el usuario describe pasos o actividades consecutivas, genera TARJETAS INDIVIDUALES para cada una con sus horas y minutos exactos.`;
      const systemInstruction = `
        Eres el ARCHITECTO SUPREMO DE PRODUCTIVIDAD Y GESTI\xD3N DEL TIEMPO del N\xFAcleo Central.
        Tu misi\xF3n es analizar la descripci\xF3n en lenguaje natural del d\xEDa a d\xEDa, trabajo y rutinas del operador humano y transformarla en una AGENDA DIARIA ESTRUCTURADA, LIMPIA, INTELIGENTE Y RIGUROSAMENTE PRECISA.

        ${modeDirective}

        CONTEXTO DEL OPERADOR:
        - Profesi\xF3n/Ocupaci\xF3n: ${userContext?.profession || "No especificada"}
        - Misi\xF3n/Bio: ${userContext?.bio || "No especificada"}
        - Mantra/Lema: ${userContext?.mantra || "No especificado"}
        - Objetivo Principal: ${userContext?.mainGoal || "No especificado"}
        - Clase/Rango: ${userContext?.class || "Ninguna"} (${userContext?.rank || "Principiante"})

        \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
        MATRIZ DE RUTINAS Y PALABRAS CLAVE EXISTENTES DEL OPERADOR:
        \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
        ${existingHabitsSummary}

        \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
        DIRECTIVA SUPREMA: PRECISI\xD3N HORARIA ESTRICTA (FORMATO 24 HORAS)
        \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
        1. CONVERSI\xD3N MILITAR / 24 HORAS:
           - "12:00" o "mediod\xEDa" -> "12:00".
           - "12:45" o "12:45 pm" -> "12:45".
           - "1:30 pm" o "1:30 tarde" o "13:30" -> "13:30".
           - "2:30 pm" o "14:30" -> "14:30".
           - "3:00 pm" o "15:00" -> "15:00".
           - "7:30 pm" o "19:30" -> "19:30".
           - "8:30 pm" o "20:30" -> "20:30".
           - "11:00 pm" o "23:00" -> "23:00".
           - "11:30 pm" o "23:30" -> "23:30".
           - "12:00 am" o "medianoche" -> "00:00".
           - Si el usuario dice "de 1:30 a 2:30 pm", el rango es "13:30 - 14:30" (1 hora). NUNCA generes "01:30 - 14:30".
        2. ADAPTABILIDAD GENERAL SEG\xDAN EL USUARIO (SIN ASUMIR NI FORZAR HORARIOS ESPEC\xCDFICOS):
           - Analiza con fidelidad EXACTA lo que el usuario declare en su prompt.
           - Si el usuario tiene una jornada est\xE1ndar diurna (ej. 09:00 a 17:00), genera su bloque continuo respetando sus horas.
           - Si el usuario describe turnos divididos (ej. ma\xF1ana y tarde/noche), genera cada turno de forma separada con su respectivo bloque de horas.
           - Si es estudiante, freelance, deportista o trabajador nocturno, ad\xE1ptate neutralmente a sus requerimientos sin forzar rutinas predeterminadas, sesgadas o ajenas a su solicitud.
        3. DESGLOSE D\xCDA POR D\xCDA (CUANDO EL USUARIO LO ESPECIFIQUE):
           - Si el usuario describe actividades que var\xEDan seg\xFAn el d\xEDa (ej. ejercicios por d\xEDa, tareas de limpieza distribuidas, materias o proyectos espec\xEDficos), GENERA UNA TARJETA PARA CADA D\xCDA usando frequencyType: "specific_days" y specificDays con el n\xFAmero de d\xEDa:
             * Domingo = 0, Lunes = 1, Martes = 2, Mi\xE9rcoles = 3, Jueves = 4, Viernes = 5, S\xE1bado = 6.
           - Si una actividad se repite de lunes a viernes con el mismo contenido, usa frequencyType: "specific_days" con specificDays: [1, 2, 3, 4, 5].
           - Si se repite los 7 d\xEDas, usa frequencyType: "daily".
        4. PROHIBICI\xD3N TOTAL DE MICRO-H\xC1BITOS DE RASTREO:
           - Queda ESTRICTAMENTE PROHIBIDO generar tarjetas de consumo de agua ("Beber agua", "8 vasos"), lavado de dientes o pasos. Esos pertenecen al widget de micro-h\xE1bitos.
        5. CATEGOR\xCDAS PERMITIDAS:
           - "rutina", "entrenamiento", "comida", "intelecto", "limpieza", "creativo".
        6. NO H\xC1BITOS 21/66 D\xCDAS:
           - isQuickHabit: false, isTracked2166: false SIEMPRE.

        DEVOLUCI\xD3N:
        Devuelve \xDANICAMENTE un array JSON ESTRICTO sin formato Markdown (sin \`\`\`json ni comentarios).

        ESQUEMA DE CADA OBJETO:
        {
          "id": "hab-auto-1",
          "title": "Bloque de Trabajo / Actividad Principal",
          "category": "rutina",
          "timeBlock": "09:00 - 13:00",
          "frequencyType": "specific_days",
          "specificDays": [1, 2, 3, 4, 5],
          "xpReward": 35,
          "coinReward": 15,
          "quickIcon": "\u{1F4BC}"
        }
      `;
      const candidateModels = ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.5-flash"];
      let lastError = null;
      let generatedText = "";
      for (let i = 0; i < candidateModels.length; i++) {
        const modelName = candidateModels[i];
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              { role: "user", parts: [{ text: systemInstruction + "\n\nSolicitud del usuario:\n" + prompt }] }
            ],
            config: {
              responseMimeType: "application/json"
            }
          });
          if (response.text) {
            generatedText = response.text;
            break;
          }
        } catch (err) {
          lastError = err;
          if (i < candidateModels.length - 1) {
            await new Promise((res2) => setTimeout(res2, 300));
          }
        }
      }
      if (!generatedText) {
        console.log("[Generate-Schedule] Gemini models reached quota/rate limit. Compiling schedule via procedural heuristics.");
        const fallbackHabits = generateProceduralSchedule(prompt, userContext, mode);
        return res.json({
          habits: fallbackHabits,
          source: "emergency_fallback",
          notice: "Cuota de IA en pausa temporal (429/503). Agenda estructurada exitosamente por el N\xFAcleo Heur\xEDstico Local con m\xE1xima precisi\xF3n matem\xE1tica."
        });
      }
      let habits = [];
      try {
        let cleanedJson = generatedText.trim();
        cleanedJson = cleanedJson.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
        const arrayStart = cleanedJson.indexOf("[");
        const arrayEnd = cleanedJson.lastIndexOf("]");
        if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
          cleanedJson = cleanedJson.substring(arrayStart, arrayEnd + 1);
        }
        habits = JSON.parse(cleanedJson);
      } catch (e) {
        console.error("Failed to parse Gemini output, using procedural fallback:", generatedText);
        const fallbackHabits = generateProceduralSchedule(prompt, userContext, mode);
        return res.json({
          habits: fallbackHabits,
          source: "emergency_fallback",
          notice: "Rutina estructurada en Bloques Maestros mediante el N\xFAcleo Heur\xEDstico Local."
        });
      }
      habits = (Array.isArray(habits) ? habits : []).map((h) => {
        let sDays = h.specificDays;
        let parsedDays = [];
        if (sDays !== void 0 && sDays !== null) {
          if (Array.isArray(sDays)) {
            parsedDays = sDays.map((d) => {
              if (typeof d === "number") return d;
              if (typeof d === "string") {
                const s = d.toLowerCase().trim();
                if (s.includes("dom") || s.includes("sun")) return 0;
                if (s.includes("lun") || s.includes("mon")) return 1;
                if (s.includes("mar") || s.includes("tue")) return 2;
                if (s.includes("mie") || s.includes("mi\xE9") || s.includes("wed")) return 3;
                if (s.includes("jue") || s.includes("thu")) return 4;
                if (s.includes("vie") || s.includes("fri")) return 5;
                if (s.includes("sab") || s.includes("s\xE1b") || s.includes("sat")) return 6;
                const n = parseInt(d, 10);
                return isNaN(n) ? NaN : n;
              }
              return NaN;
            }).filter((n) => !isNaN(n));
          } else if (typeof sDays === "string") {
            const s = sDays.toLowerCase().trim();
            if (s.includes("lunes a viernes") || s.includes("laborables") || s.includes("l-v")) {
              parsedDays = [1, 2, 3, 4, 5];
            } else if (s.includes("fin de semana")) {
              parsedDays = [0, 6];
            } else {
              parsedDays = [1, 2, 3, 4, 5];
            }
          }
        }
        let freq = "daily";
        if (parsedDays.length > 0 && parsedDays.length < 7) {
          freq = "specific_days";
          sDays = parsedDays;
        } else {
          freq = "daily";
          sDays = void 0;
        }
        return {
          ...h,
          category: (h.category === "habito" ? "rutina" : h.category) || "rutina",
          timeBlock: serverNormalizeTimeBlock(h.timeBlock) || h.timeBlock,
          frequencyType: freq,
          specificDays: sDays,
          isQuickHabit: false,
          isTracked2166: false,
          targetCount: void 0,
          unit: void 0
        };
      });
      habits = habits.filter((h) => !isQuickMicroHabitServer(h));
      if (Array.isArray(existingHabits) && existingHabits.length > 0) {
        habits = habits.map((h) => {
          const matchingExisting = existingHabits.find((ext) => isDuplicateActivity(ext, h));
          if (matchingExisting) {
            return {
              ...h,
              quickIcon: h.quickIcon || matchingExisting.quickIcon,
              category: h.category || matchingExisting.category
            };
          }
          return h;
        });
      }
      habits = deduplicateHabits(habits);
      const returnSeenIds = /* @__PURE__ */ new Set();
      habits = habits.map((h, idx) => {
        let uId = h.id;
        if (!uId || returnSeenIds.has(uId)) {
          uId = `hab-auto-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`;
        }
        returnSeenIds.add(uId);
        return { ...h, id: uId };
      });
      habits.sort((a, b) => parseTimeStartInMins(a.timeBlock) - parseTimeStartInMins(b.timeBlock));
      return res.json({ habits });
    } catch (error) {
      const errMsg = error?.message || String(error);
      const isCapacity = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.toLowerCase().includes("quota") || errMsg.includes("503");
      if (isCapacity) {
        console.log("[Generate-Schedule] Remote capacity reached. Activating heuristic engine fallback.");
      } else {
        console.log("[Generate-Schedule] Activating procedural fallback engine.");
      }
      try {
        if (req.body?.prompt) {
          const fallbackHabits = generateProceduralSchedule(req.body.prompt, req.body.userContext, req.body.mode || "master_blocks");
          return res.json({
            habits: fallbackHabits,
            source: "emergency_fallback",
            notice: "Cuota de IA en pausa temporal. Agenda sintetizada con m\xE1xima precisi\xF3n matem\xE1tica mediante el N\xFAcleo Heur\xEDstico Local."
          });
        }
      } catch (fallbackErr) {
        console.log("Fallback generator notice:", fallbackErr);
      }
      return res.status(500).json({ error: cleanErrorMessage(error?.message || "Error interno del servidor") });
    }
  });
  app.post("/api/analyze-week", async (req, res) => {
    const { stats, archetype, habitMastery, currentTasks, reflections } = req.body || {};
    const arch = getArchetypeProfile(archetype, stats?.characterClass);
    try {
      if (!process.env.GEMINI_API_KEY) {
        const analysis = generateProceduralAnalysis(stats, archetype, habitMastery, currentTasks);
        return res.json({ analysis, source: "oracle_fallback" });
      }
      const prompt = `Eres KAI, un asistente personal, mentor emp\xE1tico y coach de vida estrat\xE9gico dise\xF1ado para apoyar al usuario en su camino de desarrollo personal y productividad.
Tu tono debe ser conversacional, amable, motivador, pero muy claro y directo. NUNCA uses jerga t\xE9cnica, palabras de "sistema inform\xE1tico", "telemetr\xEDa", "algoritmos" ni act\xFAes como un robot fr\xEDo. Act\xFAa como un mentor de carne y hueso que se preocupa genuinamente por el \xE9xito del usuario.

Tu misi\xF3n es leer detenidamente su PERFIL, sus METAS, sus TAREAS, y especialmente sus APUNTES DE BIT\xC1CORA para darle consejos reales y estrategias pr\xE1cticas que lo ayuden a mejorar.

\u2550\u2550\u2550 PERFIL DEL USUARIO \u2550\u2550\u2550
- Arquetipo: ${arch.title} (${arch.avatar}) - [Ten en cuenta su forma de ser: su deseo es "${arch.desire}" y su mayor miedo/riesgo es "${arch.fear}"]
- Ocupaci\xF3n: ${stats?.profession || "No especificada"}
- Misi\xF3n personal: ${stats?.bio || "No especificada"}
- Meta actual: ${stats?.mainGoal || "No especificada"}

\u2550\u2550\u2550 LO QUE HA HECHO RECIENTEMENTE \u2550\u2550\u2550
- Tareas de hoy (y si las complet\xF3 o fall\xF3): ${JSON.stringify((currentTasks || []).map((t) => ({ tarea: t.title, completada: t.completed })))}
- Sus H\xE1bitos: ${JSON.stringify(habitMastery || {})}
- Sus Notas y Reflexiones (\xA1MUY IMPORTANTE LEER ESTO!): ${JSON.stringify(reflections || {})}

\u2550\u2550\u2550 DIRECTRICES DE RESPUESTA (CUMPLE ESTO ESTRICTAMENTE) \u2550\u2550\u2550
1. Saluda al usuario de forma amigable y natural (puedes mencionar su rango "${stats?.rankTitle || "Chispazo"}" si quieres, pero como un cumplido).
2. Nota y menciona espec\xEDficamente lo que ha escrito en sus apuntes/notas (si hay) y felic\xEDtalo por lo que ha logrado.
3. Analiza con empat\xEDa en qu\xE9 cosas est\xE1 fallando o qu\xE9 tareas no ha completado. No lo rega\xF1es; ay\xFAdalo a entender por qu\xE9 fall\xF3 bas\xE1ndote en su arquetipo o metas.
4. Dale 1 o 2 ESTRATEGIAS PR\xC1CTICAS Y SENCILLAS para solucionar ese problema espec\xEDfico o mejorar ma\xF1ana.
5. Mant\xE9n la respuesta corta, clara (usa vi\xF1etas o listas si ayuda) y muy humana. Cero terminolog\xEDa de "m\xE1quina" o "sistema".`;
      try {
        const analysis = await callGeminiWithFallback(prompt);
        return res.json({ analysis, source: "gemini" });
      } catch (geminiError) {
        const analysis = generateProceduralAnalysis(stats, archetype, habitMastery, currentTasks);
        return res.json({
          analysis,
          source: "oracle_fallback",
          notice: `Canales neurales en alta demanda. Diagn\xF3stico del N\xFAcleo Central generado con telemetr\xEDa local de ${arch.avatar} ${arch.title}.`
        });
      }
    } catch (error) {
      const analysis = generateProceduralAnalysis(stats, archetype, habitMastery, currentTasks);
      res.json({ analysis, source: "oracle_fallback" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
