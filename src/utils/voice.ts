import { KaiTemperament } from '../types';

let cachedSpanishVoice: SpeechSynthesisVoice | null = null;
let voicesListenerAttached = false;

/**
 * Limpia markdown, emojis y símbolos decorativos para que el sintetizador
 * no lea literalmente palabras como "fuego", "destellos" o "micrófono".
 */
export function sanitizeTextForSpeech(text: string): string {
  return (text || '')
    .replace(/[*_#`~]/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0E}\u{FE0F}\u{200D}]/gu, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function pickBestSpanishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;
  const spanishVoices = voices.filter(
    (v) => v.lang?.toLowerCase().startsWith('es') || v.name?.toLowerCase().includes('spanish')
  );
  if (spanishVoices.length === 0) return null;

  // Priorizar voces naturales / locales en español latinoamericano o de España
  const priorityOrder = [
    (v: SpeechSynthesisVoice) => /es-mx|es-419/i.test(v.lang) && /natural|premium|enhanced|paulina|monica|google/i.test(v.name),
    (v: SpeechSynthesisVoice) => /es-mx|es-419/i.test(v.lang),
    (v: SpeechSynthesisVoice) => /es-us|es-es/i.test(v.lang) && /natural|premium|enhanced|monica|google/i.test(v.name),
    (v: SpeechSynthesisVoice) => /es-us|es-es/i.test(v.lang),
    () => true,
  ];

  for (const matcher of priorityOrder) {
    const found = spanishVoices.find(matcher);
    if (found) return found;
  }
  return spanishVoices[0];
}

function refreshCachedSpanishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  try {
    const synth = window.speechSynthesis;
    const voices = synth.getVoices ? synth.getVoices() : [];
    const best = pickBestSpanishVoice(voices);
    if (best) cachedSpanishVoice = best;

    if (!voicesListenerAttached && typeof synth.addEventListener === 'function') {
      voicesListenerAttached = true;
      synth.addEventListener('voiceschanged', () => {
        const updated = pickBestSpanishVoice(synth.getVoices());
        if (updated) cachedSpanishVoice = updated;
      });
    }
  } catch {}
  return cachedSpanishVoice;
}

// Precargar voces tan pronto se importa el módulo en navegador
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshCachedSpanishVoice();
}

/**
 * Síntesis de voz nativa (Web Speech API) para el compañero KAI.
 * 100% en el dispositivo del usuario, sin latencia de red y con 0 costo de API.
 */
export function speakKaiDialogue(
  text: string,
  mood: KaiTemperament = 'stoic',
  onEnd?: () => void
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return false;
  }

  try {
    const synth = window.speechSynthesis;
    synth.cancel();

    const cleanText = sanitizeTextForSpeech(text);
    if (!cleanText) {
      if (onEnd) onEnd();
      return false;
    }

    const doSpeak = (voice: SpeechSynthesisVoice | null) => {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (voice) {
        utterance.voice = voice;
      }
      utterance.lang = voice?.lang || 'es-MX';

      // Modulación según el temperamento de KAI
      switch (mood) {
        case 'cheerful':
        case 'happy':
        case 'playful':
          utterance.pitch = 1.18;
          utterance.rate = 1.06;
          break;
        case 'fierce':
        case 'determined':
          utterance.pitch = 0.92;
          utterance.rate = 1.08;
          break;
        case 'mischievous':
          utterance.pitch = 0.9;
          utterance.rate = 1.08;
          break;
        case 'curious':
          utterance.pitch = 1.08;
          utterance.rate = 1.04;
          break;
        case 'mystic':
          utterance.pitch = 1.04;
          utterance.rate = 0.9;
          break;
        case 'zen':
          utterance.pitch = 0.94;
          utterance.rate = 0.88;
          break;
        case 'stoic':
        default:
          utterance.pitch = 0.96;
          utterance.rate = 0.97;
          break;
      }

      if (onEnd) {
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
      }

      synth.speak(utterance);
    };

    const spanishVoice = cachedSpanishVoice || refreshCachedSpanishVoice();
    if (spanishVoice) {
      doSpeak(spanishVoice);
      return true;
    }

    // Si el navegador aún no ha poblado getVoices() en el primer toque, esperar brevemente a voiceschanged
    let spoken = false;
    const triggerOnce = () => {
      if (spoken) return;
      spoken = true;
      doSpeak(refreshCachedSpanishVoice());
    };

    if (typeof synth.addEventListener === 'function') {
      const onVoices = () => {
        synth.removeEventListener('voiceschanged', onVoices);
        triggerOnce();
      };
      synth.addEventListener('voiceschanged', onVoices);
      setTimeout(() => {
        synth.removeEventListener('voiceschanged', onVoices);
        triggerOnce();
      }, 180);
    } else {
      doSpeak(null);
    }

    return true;
  } catch (err) {
    console.warn('[Voz KAI] Error al sintetizar voz:', err);
    if (onEnd) onEnd();
    return false;
  }
}

/**
 * Detiene cualquier voz activa de KAI.
 */
export function stopKaiDialogue(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}
