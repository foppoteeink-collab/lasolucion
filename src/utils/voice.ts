import { KaiTemperament } from '../types';

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
    return false;
  }

  try {
    const synth = window.speechSynthesis;
    // Detener cualquier locución previa
    synth.cancel();

    const cleanText = text.replace(/[*_#`~]/g, '').trim();
    if (!cleanText) return false;

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Buscar voces en español disponibles
    const voices = synth.getVoices ? synth.getVoices() : [];
    const spanishVoice = voices.find(
      (v) => v.lang.startsWith('es') || v.lang.includes('Spanish')
    );
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }
    utterance.lang = spanishVoice?.lang || 'es-MX';

    // Modulación según el temperamento de KAI
    switch (mood) {
      case 'cheerful':
      case 'happy':
      case 'playful':
        utterance.pitch = 1.25;
        utterance.rate = 1.08;
        break;
      case 'fierce':
      case 'determined':
        utterance.pitch = 0.9;
        utterance.rate = 1.12;
        break;
      case 'mischievous':
        utterance.pitch = 0.88;
        utterance.rate = 1.1;
        break;
      case 'curious':
        utterance.pitch = 1.08;
        utterance.rate = 1.05;
        break;
      case 'mystic':
        utterance.pitch = 1.05;
        utterance.rate = 0.88;
        break;
      case 'zen':
        utterance.pitch = 0.92;
        utterance.rate = 0.85;
        break;
      case 'stoic':
      default:
        utterance.pitch = 0.95;
        utterance.rate = 0.96;
        break;
    }

    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }

    synth.speak(utterance);
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
    } catch (_) {}
  }
}
