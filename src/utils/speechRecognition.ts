import { HabitEnergyType, PriorityLevel, TaskCategory } from '../types';
import { detectHabitEnergy, HABIT_ENERGY_DETAILS } from './habitEnergyDetector';
import { FINANCE_EXPENSE_CATEGORIES, FINANCE_INCOME_CATEGORIES } from './finance';

export interface ParsedVoiceItem {
  id: string;
  kind: 'task' | 'habit';
  title: string;
  category: TaskCategory;
  timeBlock?: string;
  targetDateOffset: number; // 0 = fecha actual vista, 1 = mañana, etc.
  frequency: 'once' | 'daily' | 'specific_days';
  specificDays?: number[]; // 0=Dom .. 6=Sab
  targetCount?: number;
  unit?: string;
  priority: PriorityLevel;
  xpReward: number;
  coinReward: number;
  quickIcon: string;
  habitEnergyType?: HabitEnergyType;
  notes?: string;
}

export interface VoiceParseResult {
  items: ParsedVoiceItem[];
  kaiReply: string;
  usedRemoteAI: boolean;
}

export interface VoiceRecognizerCallbacks {
  onInterim?: (transcript: string) => void;
  onFinal?: (finalTranscript: string) => void;
  onError?: (friendlyError: string) => void;
  onEnd?: () => void;
}

export interface VoiceRecognizerController {
  start: () => void;
  stop: () => void;
  abort: () => void;
}

function getSpeechRecognitionCtor(): any | null {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported(): boolean {
  return Boolean(getSpeechRecognitionCtor());
}

/**
 * Crea un controlador de reconocimiento de voz nativo en español usando Web Speech API.
 * Acumula resultados finales y emite resultados parciales en vivo.
 */
export function createVoiceRecognizer(callbacks: VoiceRecognizerCallbacks): VoiceRecognizerController | null {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.lang = (typeof navigator !== 'undefined' && navigator.language?.startsWith('es'))
    ? navigator.language
    : 'es-MX';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let accumulatedFinal = '';

  recognition.onresult = (event: any) => {
    let interimText = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const res = event.results[i];
      const text = res?.[0]?.transcript || '';
      if (res.isFinal) {
        accumulatedFinal = `${accumulatedFinal} ${text}`.trim();
      } else {
        interimText = `${interimText} ${text}`.trim();
      }
    }
    const combined = `${accumulatedFinal} ${interimText}`.trim();
    if (combined) {
      callbacks.onInterim?.(combined);
    }
    if (accumulatedFinal) {
      callbacks.onFinal?.(accumulatedFinal);
    }
  };

  recognition.onerror = (event: any) => {
    const code = event?.error || 'unknown';
    let friendly = 'No se pudo procesar el audio. Intenta de nuevo o escribe tu dictado.';
    if (code === 'not-allowed' || code === 'service-not-allowed') {
      friendly = 'Permiso de micrófono bloqueado. Actívalo en tu navegador o escribe tu dictado abajo.';
    } else if (code === 'no-speech') {
      friendly = 'No detecté voz. Acércate al micrófono e intenta de nuevo.';
    } else if (code === 'audio-capture') {
      friendly = 'No se detectó un micrófono disponible en tu dispositivo.';
    } else if (code === 'network') {
      friendly = 'Sin conexión para reconocimiento de voz. Puedes escribir tus tareas aquí mismo y KAI las estructurará.';
    } else if (code === 'aborted') {
      return;
    }
    callbacks.onError?.(friendly);
  };

  recognition.onend = () => {
    callbacks.onEnd?.();
  };

  return {
    start: () => {
      accumulatedFinal = '';
      try {
        recognition.start();
      } catch (err) {
        console.warn('[SpeechRecognition] Error starting:', err);
        callbacks.onError?.('El micrófono ya está activo o no pudo inicializarse.');
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch {}
    },
    abort: () => {
      try {
        recognition.abort();
      } catch {}
    },
  };
}

// ─── Motor Heurístico Local (Fallback Instantáneo y Determinista Offline) ─────

const VALID_CATEGORIES: TaskCategory[] = [
  'clientes',
  'limpieza',
  'entrenamiento',
  'comida',
  'creativo',
  'habito',
  'estudio',
  'pomodoro',
  'trabajo',
  'rutina',
];

export function normalizeCategory(raw?: string, title = ''): TaskCategory {
  if (raw && VALID_CATEGORIES.includes(raw as TaskCategory)) {
    return raw as TaskCategory;
  }
  const t = `${raw || ''} ${title}`.toLowerCase();
  if (/cliente|junta|reuni[oó]n|venta|cotizaci|llamada|propuesta|correo|email/.test(t)) return 'clientes';
  if (/gym|gimnasio|entrenar|pierna|espalda|pecho|brazo|correr|trotar|cardio|pesas|ejercicio|flexion|abdominal|caminar|bici/.test(t)) return 'entrenamiento';
  if (/limpiar|ordenar|lavar|barrer|cuarto|cocina|baño|ropa|trastes|casa/.test(t)) return 'limpieza';
  if (/comer|desayun|almuerz|cenar|cocinar|agua|vaso|dieta|prote[ií]na|fruta|verdura|vitamina|hidrat/.test(t)) return 'comida';
  if (/diseñ|dibuj|escrib|m[uú]sica|editar|video|foto|arte|crear|creativ|guion|pintar/.test(t)) return 'creativo';
  if (/estudiar|leer|lectura|curso|libro|clase|examen|tarea|aprender|ingl[eé]s|programar|pr[aá]ctica/.test(t)) return 'estudio';
  if (/pomodoro|enfoque|concentra|deep work|foco/.test(t)) return 'pomodoro';
  if (/trabajo|proyecto|reporte|factura|banco|pagar|finanzas|oficina|entregar|enviar|revisar/.test(t)) return 'trabajo';
  if (/meditar|respirar|agradecer|dormir|despertar|dientes|estirar|h[aá]bito/.test(t)) return 'habito';
  return 'rutina';
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function extractTimeBlock(segment: string): { timeBlock?: string; cleaned: string } {
  let cleaned = segment;

  // Rango explícito: "de 9 a 11", "de 9:30 a 10:30", "14:00 - 15:00"
  const rangeMatch = cleaned.match(
    /(?:de\s+(?:las?\s+)?)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\s*(?:a|hasta|-)\s*(?:las?\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.|de la mañana|de la tarde|de la noche)?/i
  );
  if (rangeMatch) {
    let h1 = parseInt(rangeMatch[1], 10);
    const m1 = parseInt(rangeMatch[2] || '0', 10);
    const p1 = (rangeMatch[3] || '').toLowerCase();
    let h2 = parseInt(rangeMatch[4], 10);
    const m2 = parseInt(rangeMatch[5] || '0', 10);
    const p2 = (rangeMatch[6] || '').toLowerCase();

    const isPm2 = /pm|p\.m\.|tarde|noche/.test(p2);
    const isPm1 = /pm|p\.m\./.test(p1) || (isPm2 && h1 <= h2 && h1 < 12 && !/am|a\.m\./.test(p1));
    if (isPm1 && h1 < 12) h1 += 12;
    if (isPm2 && h2 < 12) h2 += 12;
    if (/am|a\.m\.|mañana/.test(p1) && h1 === 12) h1 = 0;

    if (h1 >= 0 && h1 <= 23 && h2 >= 0 && h2 <= 23 && m1 < 60 && m2 < 60) {
      cleaned = cleaned.replace(rangeMatch[0], ' ').trim();
      return { timeBlock: `${pad2(h1)}:${pad2(m1)} - ${pad2(h2)}:${pad2(m2)}`, cleaned };
    }
  }

  // Hora puntual: "a las 7", "a las 7:30 pm", "a la 1 de la tarde", "18:00"
  const singleMatch = cleaned.match(
    /(?:a\s+las?\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.|de la mañana|de la tarde|de la noche|hrs|horas)?\b/i
  );
  if (singleMatch) {
    const hasTimeIndicator =
      /^a\s+las?/i.test(singleMatch[0]) ||
      Boolean(singleMatch[2]) ||
      Boolean(singleMatch[3]);
    if (hasTimeIndicator) {
      let h = parseInt(singleMatch[1], 10);
      const m = parseInt(singleMatch[2] || '0', 10);
      const period = (singleMatch[3] || '').toLowerCase();
      if (/pm|p\.m\.|tarde|noche/.test(period) && h < 12) h += 12;
      if (/am|a\.m\.|mañana/.test(period) && h === 12) h = 0;
      if (h >= 0 && h <= 23 && m < 60) {
        const endH = (h + 1) % 24;
        cleaned = cleaned.replace(singleMatch[0], ' ').trim();
        return { timeBlock: `${pad2(h)}:${pad2(m)} - ${pad2(endH)}:${pad2(m)}`, cleaned };
      }
    }
  }

  return { cleaned };
}

function extractHabitQuantity(segment: string): { targetCount?: number; unit?: string } {
  const match = segment.match(
    /(\d+)\s*(vasos?|litros?|minutos?|min|horas?|p[aá]ginas?|cap[ií]tulos?|veces|km|kil[oó]metros?|pasos|series|reps|repeticiones|comidas?)/i
  );
  if (!match) return {};
  const count = Math.max(1, Math.min(999, parseInt(match[1], 10)));
  const rawUnit = match[2].toLowerCase();
  const unitMap: Record<string, string> = {
    minuto: 'min',
    minutos: 'min',
    min: 'min',
    hora: 'hrs',
    horas: 'hrs',
    vaso: 'vasos',
    vasos: 'vasos',
    litro: 'litros',
    litros: 'litros',
    pagina: 'páginas',
    página: 'páginas',
    paginas: 'páginas',
    páginas: 'páginas',
    vez: 'veces',
    veces: 'veces',
    comida: 'comidas',
    comidas: 'comidas',
  };
  return { targetCount: count, unit: unitMap[rawUnit] || rawUnit };
}

function extractSpecificDays(segment: string): number[] | undefined {
  const lower = segment.toLowerCase();
  const dayMap: Array<[RegExp, number]> = [
    [/\bdomingos?\b/, 0],
    [/\blunes\b/, 1],
    [/\bmartes\b/, 2],
    [/\bmi[eé]rcoles\b/, 3],
    [/\bjueves\b/, 4],
    [/\bviernes\b/, 5],
    [/\bs[aá]bados?\b/, 6],
  ];
  const found: number[] = [];
  for (const [rx, idx] of dayMap) {
    if (rx.test(lower)) found.push(idx);
  }
  return found.length > 0 ? found.sort() : undefined;
}

function cleanItemTitle(raw: string): string {
  let s = raw
    .replace(/^(?:kai\s*,?\s*|oye\s+kai\s*,?\s*|por\s+favor\s*,?\s*)/i, '')
    .replace(/^(?:quiero\s+|necesito\s+|tengo\s+que\s+|debo\s+|agrega(?:me)?\s+|a[ñn]ade(?:me)?\s+|crea(?:me)?\s+|pon(?:me)?\s+|recordar(?:me)?\s+|recu[eé]rdame\s+)/i, '')
    .replace(/^(?:el\s+h[aá]bito\s+de\s+|un\s+h[aá]bito\s+de\s+|una\s+tarea\s+de\s+|la\s+tarea\s+de\s+|h[aá]bito\s*:?\s*|tarea\s*:?\s*)/i, '')
    .replace(/\b(?:todos\s+los\s+d[ií]as|cada\s+d[ií]a|diariamente|diario|para\s+mañana|mañana|para\s+hoy|hoy|pasado\s+mañana)\b/gi, ' ')
    .replace(/\b(?:todos\s+los\s+(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bados|domingos))\b/gi, ' ')
    .replace(/^[,.\-:\s]+|[,.\-:\s]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!s) return raw.trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const CATEGORY_ICONS: Record<TaskCategory, string> = {
  clientes: '🤝',
  limpieza: '🧹',
  entrenamiento: '🏋️',
  comida: '🥗',
  creativo: '🎨',
  habito: '⚡',
  estudio: '📖',
  pomodoro: '⏱️',
  trabajo: '💼',
  rutina: '🎯',
};

/**
 * Parser heurístico 100% local en español para dictados de voz.
 * Divide múltiples intenciones, detecta horarios, fecha (hoy/mañana), hábitos 21/66,
 * cantidades, prioridad y categoría.
 */
export function parseVoiceTranscriptLocally(transcript: string): VoiceParseResult {
  const cleanText = (transcript || '').trim();
  if (!cleanText) {
    return {
      items: [],
      kaiReply: 'No recibí texto para analizar. ¡Háblame o escribe tus objetivos!',
      usedRemoteAI: false,
    };
  }

  // Detectar si toda la frase empieza con un modificador global de día ("Mañana tengo que...")
  const globalTomorrow = /^\s*(?:para\s+)?mañana\b/i.test(cleanText);
  const globalDayAfter = /^\s*(?:para\s+)?pasado\s+mañana\b/i.test(cleanText);

  // Separar cláusulas por saltos de línea, punto y coma, comas o conectores naturales
  const rawSegments = cleanText
    .split(/(?:\n+|;+|\.\s+|,\s*(?:y\s+|luego\s+|despu[eé]s\s+|tambi[eé]n\s+)?|\s+(?:y\s+tambi[eé]n|y\s+luego|y\s+despu[eé]s|adem[aá]s|tambi[eé]n|despu[eé]s|luego)\s+|\s+y\s+(?=(?:a\s+las?|tomar|beber|leer|hacer|ir|entrenar|llamar|enviar|revisar|estudiar|meditar|limpiar|cocinar|comprar|pagar|crear|terminar|escribir|ver|sacar|trabajar|junta|reuni[oó]n|cita|el\s+h[aá]bito|un\s+h[aá]bito|quiero|necesito|tengo|recordar)))/i)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3);

  const segments = rawSegments.length > 0 ? rawSegments : [cleanText];
  const nowId = Date.now();

  const items: ParsedVoiceItem[] = segments.map((seg, idx) => {
    const lower = seg.toLowerCase();

    const isDayAfter = /\bpasado\s+mañana\b/i.test(lower) || (globalDayAfter && !/\bhoy\b/i.test(lower));
    const isTomorrow = !isDayAfter && (/\bmañana\b/i.test(lower) || (globalTomorrow && !/\bhoy\b/i.test(lower)));
    const targetDateOffset = isDayAfter ? 2 : isTomorrow ? 1 : 0;

    const specificDays = extractSpecificDays(seg);
    const hasHabitTrigger =
      /\b(?:h[aá]bito|todos\s+los\s+d[ií]as|cada\s+d[ií]a|diariamente|diario|rutina\s+diaria)\b/i.test(lower) ||
      Boolean(specificDays && /\btodos\s+los\b/i.test(lower));

    const { timeBlock, cleaned: afterTime } = extractTimeBlock(seg);
    const { targetCount, unit } = extractHabitQuantity(seg);
    const title = cleanItemTitle(afterTime);
    const category = normalizeCategory(undefined, title);

    const isUrgent = /\b(?:urgente|importante|prioridad|cr[ií]tic[oa]|[eé]pic[oa]|obligatori[oa]|indispensable)\b/i.test(lower);
    const priority: PriorityLevel = isUrgent ? 'alta' : 'media';

    const kind: 'task' | 'habit' = hasHabitTrigger ? 'habit' : 'task';
    const frequency: 'once' | 'daily' | 'specific_days' =
      kind === 'habit'
        ? (specificDays ? 'specific_days' : 'daily')
        : (specificDays ? 'specific_days' : 'once');

    const habitEnergyType = kind === 'habit' ? detectHabitEnergy(title, category) : undefined;
    const quickIcon = habitEnergyType
      ? HABIT_ENERGY_DETAILS[habitEnergyType].icon
      : (CATEGORY_ICONS[category] || '⚡');

    const xpReward = isUrgent ? 35 : kind === 'habit' ? 20 : 25;
    const coinReward = isUrgent ? 15 : kind === 'habit' ? 8 : 10;

    return {
      id: `voice-${nowId}-${idx}`,
      kind,
      title: title || seg,
      category,
      timeBlock,
      targetDateOffset: kind === 'habit' ? 0 : targetDateOffset,
      frequency,
      specificDays,
      targetCount: kind === 'habit' ? (targetCount || 1) : undefined,
      unit: kind === 'habit' ? (unit || 'vez') : undefined,
      priority,
      xpReward,
      coinReward,
      quickIcon,
      habitEnergyType,
    };
  });

  const taskCount = items.filter((i) => i.kind === 'task').length;
  const habitCount = items.filter((i) => i.kind === 'habit').length;
  const parts: string[] = [];
  if (taskCount > 0) parts.push(`${taskCount} ${taskCount === 1 ? 'misión' : 'misiones'}`);
  if (habitCount > 0) parts.push(`${habitCount} ${habitCount === 1 ? 'hábito 21/66' : 'hábitos 21/66'}`);

  return {
    items,
    kaiReply: `¡Entendido! Estructuré ${parts.join(' y ')} listas para entrar a tu agenda.`,
    usedRemoteAI: false,
  };
}

// ─── FASE 3A: Finanzas por Voz (Parser Local Resiliente) ────────────────────

export interface ParsedVoiceFinanceEntry {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
}

export interface VoiceFinanceParseResult {
  entries: ParsedVoiceFinanceEntry[];
  kaiReply: string;
  usedRemoteAI: boolean;
}

export function normalizeFinanceCategory(type: 'income' | 'expense', rawCategory?: string, description = ''): string {
  const validList = type === 'income' ? FINANCE_INCOME_CATEGORIES : FINANCE_EXPENSE_CATEGORIES;
  if (rawCategory && validList.includes(rawCategory)) return rawCategory;

  const text = `${rawCategory || ''} ${description}`.toLowerCase();
  if (type === 'income') {
    if (/cliente|proyecto|diseñ|consult|servicio|freelance|honorario/.test(text)) return 'Trabajo / Clientes';
    if (/venta|vend[ií]|producto|tienda|pedido|mercanc/.test(text)) return 'Ventas';
    if (/n[oó]mina|salario|sueldo|quincena|pago mensual/.test(text)) return 'Nómina / Salario';
    if (/inversi[oó]n|dividendo|inter[eé]s|rendimiento|cripto|bolsa/.test(text)) return 'Inversiones / Rendimiento';
    return 'Otros Ingresos';
  }

  if (/comida|almuerz|desayun|cena|caf[eé]|restaurante|taco|pizza|super|mercado|despensa|agua|snack|fruta|pan/.test(text)) {
    return 'Alimentación / Comida';
  }
  if (/renta|alquiler|luz|agua|internet|tel[eé]fono|gas\b|servicio|casa|departamento|electricidad/.test(text)) {
    return 'Vivienda / Servicios';
  }
  if (/software|app|curso|libro|herramienta|equipo|computadora|hosting|dominio|suscripci[oó]n|ia|licencia/.test(text)) {
    return 'Inversión / Herramientas';
  }
  if (/uber|taxi|gasolina|transporte|camión|metro|autobus|pasaje|estacionamiento|caseta|env[ií]o|paqueter/.test(text)) {
    return 'Operaciones / Transporte';
  }
  if (/farmacia|doctor|m[eé]dico|medicina|gym|gimnasio|salud|terapia|dentista|suplemento|prote[ií]na/.test(text)) {
    return 'Salud / Bienestar';
  }
  if (/cine|salida|fiesta|regalo|ropa|tenis|juego|netflix|spotify|bar|ocio|viaje/.test(text)) {
    return 'Ocio / Personal';
  }
  return 'Otros Gastos';
}

function parseLocalizedNumber(rawNum: string): number {
  const cleaned = rawNum.replace(/[$€₡£\s]/g, '').trim();
  if (!cleaned) return NaN;
  // Si tiene coma y punto: 1,500.50 -> 1500.50
  if (cleaned.includes(',') && cleaned.includes('.')) {
    return parseFloat(cleaned.replace(/,/g, ''));
  }
  // Si solo tiene coma y termina en 3 dígitos (1,500) -> miles
  if (/^\d{1,3}(,\d{3})+$/.test(cleaned)) {
    return parseFloat(cleaned.replace(/,/g, ''));
  }
  return parseFloat(cleaned.replace(',', '.'));
}

/**
 * Detecta y extrae uno o múltiples ingresos/gastos desde lenguaje natural en español.
 * Ej: "Gasté 180 en comida y recibí 1500 de un cliente"
 */
export function parseVoiceFinanceLocally(transcript: string): VoiceFinanceParseResult {
  const cleanText = (transcript || '').trim();
  if (!cleanText) {
    return {
      entries: [],
      kaiReply: 'Dicta un gasto o ingreso con monto, por ejemplo: "Gasté 180 en comida".',
      usedRemoteAI: false,
    };
  }

  const rawSegments = cleanText
    .split(/(?:\n+|;+|\.\s+|,\s+(?:y\s+|tambi[eé]n\s+)?|\s+(?:y\s+tambi[eé]n|adem[aá]s|tambi[eé]n)\s+|\s+y\s+(?=(?:gast[eé]|pagu[eé]|compr[eé]|me\s+cost[oó]|cost[oó]|recib[ií]|cobr[eé]|gan[eé]|me\s+pagaron|ingres[eé]|vend[ií]|tuve|fueron|\$?\d)))/i)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);

  const segments = rawSegments.length > 0 ? rawSegments : [cleanText];
  const entries: ParsedVoiceFinanceEntry[] = [];
  const nowId = Date.now();
  let lastDetectedType: 'income' | 'expense' = 'expense';

  segments.forEach((seg, idx) => {
    const lower = seg.toLowerCase();

    const isIncomeVerb = /(?:^|[\s,.;:])(recib[ií]|cobr[eé]|gan[eé]|me\s+pagaron|ingres[eé]|ingreso|vend[ií]|venta|dep[oó]sito|me\s+depositaron|me\s+transfirieron|n[oó]mina|salario|sueldo)(?=$|[\s,.;:])/i.test(lower);
    const isExpenseVerb = /(?:^|[\s,.;:])(gast[eé]|gasto|pagu[eé]|pago|compr[eé]|compra|cost[oó]|invert[ií]|saqu[eé]|di|dej[eé])(?=$|[\s,.;:])/i.test(lower);

    const type: 'income' | 'expense' = isIncomeVerb
      ? 'income'
      : isExpenseVerb
        ? 'expense'
        : lastDetectedType;
    lastDetectedType = type;

    // Extraer monto numérico (evitando confundir horas como "8:00")
    const amountMatch = seg.match(/(?:[$€₡£]\s*)?(\d{1,3}(?:,\d{3})+|\d+(?:[.,]\d{1,2})?)\s*(?:pesos|mxn|d[oó]lares|usd|euros|colones|soles|mil)?(?!\s*:)/i);
    if (!amountMatch) return;

    let amount = parseLocalizedNumber(amountMatch[1]);
    if (/\bmil\b/i.test(amountMatch[0]) && amount < 1000) {
      amount *= 1000;
    }
    if (!Number.isFinite(amount) || amount <= 0) return;

    // Limpiar descripción quitando el verbo financiero y el monto
    let desc = seg
      .replace(amountMatch[0], ' ')
      .replace(/(?:^|[\s,.;:])(?:gast[eé]|gasto|pagu[eé]|pago|compr[eé]|compra|me\s+cost[oó]|cost[oó]|recib[ií]|cobr[eé]|gan[eé]|me\s+pagaron|ingres[eé]|ingreso|vend[ií]|me\s+depositaron|me\s+transfirieron)(?=$|[\s,.;:])/gi, ' ')
      .replace(/^\s*(?:en|de|por|para|del|de\s+un|de\s+una|de\s+la|de\s+el|un|una|el|la|los|las)\s+/i, '')
      .replace(/\s+(?:en|de|por)\s*$/i, '')
      .replace(/^[,.\-:\s]+|[,.\-:\s]+$/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (!desc) {
      desc = type === 'income' ? 'Ingreso por voz' : 'Gasto por voz';
    } else {
      desc = desc.charAt(0).toUpperCase() + desc.slice(1);
    }

    const category = normalizeFinanceCategory(type, undefined, desc);

    entries.push({
      id: `vfin-${nowId}-${idx}`,
      type,
      amount: Math.round(amount * 100) / 100,
      description: desc,
      category,
    });
  });

  if (entries.length === 0) {
    return {
      entries: [],
      kaiReply: 'No detecté un monto claro. Intenta decir por ejemplo: "Gasté 150 en gasolina".',
      usedRemoteAI: false,
    };
  }

  return {
    entries,
    kaiReply:
      entries.length === 1
        ? `Registré 1 ${entries[0].type === 'income' ? 'ingreso' : 'gasto'} listo para confirmar.`
        : `Separé ${entries.length} movimientos financieros listos para guardar.`,
    usedRemoteAI: false,
  };
}

// ─── FASE 3B: Intención de Foco / Pomodoro por Voz ──────────────────────────

export interface ParsedVoiceFocusIntent {
  title: string;
  durationMinutes: number;
  category: TaskCategory;
}

/**
 * Detecta si el usuario pidió iniciar un bloque de enfoque / Pomodoro por voz.
 * Ej: "Pon un foco de 25 minutos para diseñar el logo" o "Pomodoro de 15 min para leer"
 */
export function detectVoiceFocusIntent(transcript: string): ParsedVoiceFocusIntent | null {
  const cleanText = (transcript || '').trim();
  if (!cleanText) return null;

  const hasFocusKeyword = /\b(?:pomodoro|temporizador|timer|sesi[oó]n\s+de\s+foco|bloque\s+de\s+foco|pon(?:me)?\s+(?:un\s+)?foco|inicia(?:r)?\s+(?:un\s+)?foco|activar?\s+foco|enfocarme|concentrarme)\b/i.test(cleanText);
  if (!hasFocusKeyword) return null;

  const durMatch = cleanText.match(/(\d{1,3})\s*(?:minutos?|min|m\b)/i);
  const durationMinutes = durMatch ? Math.max(5, Math.min(90, parseInt(durMatch[1], 10))) : 25;

  const topicMatch = cleanText.match(/(?:para|en|de\s+trabajo\s+en|sobre|con)\s+(.+)$/i);
  let title = topicMatch ? topicMatch[1].trim() : '';
  title = title
    .replace(/^(?:la\s+tarea\s+de\s+|el\s+proyecto\s+de\s+)/i, '')
    .replace(/[.!?]+$/, '')
    .trim();

  if (!title || title.length < 2) {
    title = 'Sesión de Enfoque Profundo';
  } else {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  return {
    title,
    durationMinutes,
    category: normalizeCategory(undefined, title),
  };
}

// ─── FASE 3C: Extracción de Pendientes para Mañana desde Reflexión Nocturna ─

export interface NightlyReflectionAnalysis {
  kaiFeedback: string;
  tomorrowTasks: ParsedVoiceItem[];
  usedRemoteAI: boolean;
}

/**
 * Extrae pendientes con intención futura desde una reflexión nocturna (offline).
 * Ej: "Hoy avancé mucho. Mañana tengo que llamar al contador y a las 9 enviar la propuesta."
 */
export function extractTomorrowTasksFromReflection(
  reflection: string,
  completionRate = 0
): NightlyReflectionAnalysis {
  const text = (reflection || '').trim();
  if (!text) {
    return {
      kaiFeedback: 'Cuéntame brevemente cómo te fue hoy para cerrar tu jornada con claridad.',
      tomorrowTasks: [],
      usedRemoteAI: false,
    };
  }

  // Buscar oraciones que mencionen pendientes para mañana
  const sentences = text
    .split(/(?:[.!?\n]+|;\s*)/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 6);

  const tomorrowClauses = sentences.filter((s) =>
    /\b(?:mañana|no\s+olvidar|no\s+se\s+me\s+olvide|pendiente|quedo\s+pendiente|qued[oó]\s+pendiente|tengo\s+que|debo\s+|falta\s+|recordar)\b/i.test(s)
  );

  const tomorrowTasks: ParsedVoiceItem[] = [];
  if (tomorrowClauses.length > 0) {
    const parsed = parseVoiceTranscriptLocally(tomorrowClauses.join('. '));
    parsed.items.forEach((item, idx) => {
      if (item.title.trim().length >= 3) {
        tomorrowTasks.push({
          ...item,
          id: `nightly-tmrw-${Date.now()}-${idx}`,
          kind: 'task',
          frequency: 'once',
          targetDateOffset: 1,
        });
      }
    });
  }

  let kaiFeedback = '';
  if (completionRate >= 80) {
    kaiFeedback = tomorrowTasks.length > 0
      ? `¡Jornada brutal (${completionRate}%)! Guardé tu reflexión y ya dejé listos ${tomorrowTasks.length} pendientes para mañana.`
      : `¡Excelente cierre con ${completionRate}% de avance! Descansa con la mente tranquila, hoy cumpliste.`;
  } else if (completionRate >= 45) {
    kaiFeedback = tomorrowTasks.length > 0
      ? `Buen avance hoy. Anoté tu reflexión y preparé ${tomorrowTasks.length} tareas para atacarlas mañana fresco.`
      : `Cada paso suma y hoy moviste la aguja. Descansa bien para llegar con energía mañana.`;
  } else {
    kaiFeedback = tomorrowTasks.length > 0
      ? `Gracias por reflexionar con honestidad. Dejemos ${tomorrowTasks.length} objetivos claros para reiniciar fuerte mañana.`
      : `Cerrar el día con conciencia ya es una victoria. Descansa, mañana empezamos con tablero limpio.`;
  }

  return {
    kaiFeedback,
    tomorrowTasks: tomorrowTasks.slice(0, 5),
    usedRemoteAI: false,
  };
}

/**
 * Separa un dictado mixto que combina gastos/ingresos con tareas/hábitos en la misma frase.
 * Ej: "Gasté 200 en gasolina y a las 6 entrenar espalda"
 * -> financeText: "Gasté 200 en gasolina"
 * -> taskText: "a las 6 entrenar espalda"
 */
export function splitMixedVoiceDictation(transcript: string): {
  financeText: string;
  taskText: string;
} {
  const cleanText = (transcript || '').trim();
  if (!cleanText) return { financeText: '', taskText: '' };

  const clauses = cleanText
    .split(/(?:\n+|;+|\.\s+|,\s+(?:y\s+|luego\s+|despu[eé]s\s+|tambi[eé]n\s+)?|\s+(?:y\s+tambi[eé]n|y\s+luego|y\s+despu[eé]s|adem[aá]s|tambi[eé]n)\s+|\s+y\s+(?=(?:a\s+las?|de\s+\d|gast[eé]|pagu[eé]|compr[eé]|cost[oó]|recib[ií]|cobr[eé]|gan[eé]|ingres[eé]|vend[ií]|me\s+pagaron|tomar|beber|leer|hacer|ir|entrenar|llamar|enviar|revisar|estudiar|meditar|limpiar|cocinar|crear|terminar|escribir|trabajar|junta|reuni[oó]n|cita|el\s+h[aá]bito|un\s+h[aá]bito|quiero|necesito|tengo|recordar)))/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const financeClauses: string[] = [];
  const taskClauses: string[] = [];

  const financeVerbRx = /(?:^|[\s,.;:])(?:gast[eé]|gasto|pagu[eé]|pago|compr[eé]|compra|cost[oó]|recib[ií]|cobr[eé]|gan[eé]|ingres[eé]|ingreso|vend[ií]|venta|me\s+pagaron|me\s+depositaron|me\s+transfirieron|n[oó]mina|salario|sueldo)(?=$|[\s,.;:])/i;
  const nonTimeAmountRx = /(?:[$€₡£]\s*)?(?:\d{1,3}(?:,\d{3})+|\d+(?:[.,]\d{1,2})?)(?!\s*:\d{2})/;

  for (const clause of clauses) {
    const looksFinancial = financeVerbRx.test(clause) && nonTimeAmountRx.test(clause);
    if (looksFinancial) {
      financeClauses.push(clause);
    } else {
      taskClauses.push(clause);
    }
  }

  return {
    financeText: financeClauses.join(', '),
    taskText: taskClauses.join(', '),
  };
}

// ─── Router Unificado de Intenciones para "Háblame" ──────────────────────────

export type VoiceIntentRoute =
  | 'focus'
  | 'diagnostic'
  | 'planner'
  | 'conversation'
  | 'mixed_actions';

/**
 * Clasifica la intención principal de lo que el usuario le dice a KAI en "Háblame":
 * - 'focus': pidió un Pomodoro / bloque de concentración
 * - 'diagnostic': pidió diagnóstico, análisis de progreso, racha o rendimiento
 * - 'planner': pidió armar un horario completo o ver plantillas de rutina
 * - 'conversation': pregunta abierta, consejo, motivación o charla con KAI
 * - 'mixed_actions': crear tareas, hábitos 21/66 o registrar finanzas
 */
export function classifyVoiceIntent(transcript: string): VoiceIntentRoute {
  const clean = (transcript || '').trim();
  if (!clean) return 'conversation';

  // 1. Intención directa de Pomodoro / Foco
  if (detectVoiceFocusIntent(clean)) {
    return 'focus';
  }

  const lower = clean.toLowerCase();

  // 2. Diagnóstico personal / análisis de progreso
  const isDiagnostic =
    /(?:^|[\s,.;:¿?])(?:diagn[oó]stico|anal[ií]za(?:me)?|an[aá]lisis|c[oó]mo\s+voy|c[oó]mo\s+est[aá]\s+mi\s+(?:semana|progreso|racha|rendimiento|avance)|eval[uú]a(?:me)?|resumen\s+de\s+mi\s+(?:progreso|semana|desempe[ñn]o)|qu[eé]\s+patrones|cu[eé]ntame\s+c[oó]mo\s+voy)(?=$|[\s,.;:?])/i.test(
      lower
    );
  if (isDiagnostic) {
    return 'diagnostic';
  }

  // 3. Planificador masivo de horario / plantillas de rutina
  const isPlanner =
    /(?:^|[\s,.;:¿?])(?:plantillas?(?:\s+de\s+rutina)?|arma(?:me)?\s+(?:un\s+|mi\s+)?horario\s+completo|organiza(?:me)?\s+(?:todo\s+)?mi\s+d[ií]a|planifica(?:me)?\s+(?:todo\s+)?(?:el|mi)\s+d[ií]a|abrir?\s+(?:el\s+)?or[aá]culo|planificador\s+visual)(?=$|[\s,.;:?])/i.test(
      lower
    );
  if (isPlanner) {
    return 'planner';
  }

  // 4. Si tiene acción explícita de finanzas, horario concreto, hábito o verbo imperativo de crear -> acciones
  const { financeText } = splitMixedVoiceDictation(clean);
  if (financeText) {
    return 'mixed_actions';
  }

  const hasExplicitActionCue =
    /(?:^|[\s,.;:])(?:agrega(?:me)?|a[ñn]ade(?:me)?|crea(?:me)?|pon(?:me)?|recu[eé]rdame|recordar|tengo\s+que|debo|necesito|todos\s+los\s+d[ií]as|cada\s+d[ií]a|diariamente|diario|h[aá]bito|a\s+las?\s+\d|de\s+\d{1,2}\s+a\s+\d{1,2}|mañana\s+a\s+las?)(?=$|[\s,.;:])/i.test(
      lower
    );
  if (hasExplicitActionCue) {
    return 'mixed_actions';
  }

  // 5. Pregunta abierta, saludo, consejo, motivación o duda -> conversación viva con KAI
  const isConversational =
    /[?¿]/.test(clean) ||
    /(?:^|[\s,.;:¡!])(?:hola|buenos\s+d[ií]as|buenas\s+tardes|buenas\s+noches|qu[eé]\s+me\s+recomiendas|por\s+qu[eé]\s+tarea|cu[aá]l\s+(?:debo|hago|empiezo)|dame\s+(?:motivaci[oó]n|un\s+consejo|ánimo|animo)|estoy\s+(?:cansado|bloqueado|estresado|desmotivado|perdido)|ay[uú]dame|c[oó]mo\s+(?:puedo|hago|empiezo)|qu[eé]\s+opinas|qu[eé]\s+hago|gracias|qui[eé]n\s+eres)(?=$|[\s,.;:!?])/i.test(
      lower
    );
  if (isConversational) {
    return 'conversation';
  }

  return 'mixed_actions';
}
