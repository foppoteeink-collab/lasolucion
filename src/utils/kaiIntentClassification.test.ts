import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  classifyVoiceIntent,
  detectVoiceBitacoraIntent,
  detectVoiceHabitIntent,
  detectVoiceDirectAction,
} from './speechRecognition';

describe('KAI Semantic Intent Classification (Executive NLU)', () => {
  it('1. Casual human speech, rapport and celebration defaults to conversation (ZERO forced tasks)', () => {
    const text = 'Pues sí aquí estoy muy contento de estar utilizando esta inteligencia artificial que acaba de integrarse lo acabamos de hacer';
    const intent = classifyVoiceIntent(text);
    assert.strictEqual(intent, 'conversation');
  });

  it('2. Bitacora / Diario intent is detected accurately with cleaned reflection text', () => {
    const text = 'Anota en mi bitácora que hoy cerramos la venta con el cliente y me siento muy aliviado';
    const intent = classifyVoiceIntent(text);
    assert.strictEqual(intent, 'bitacora');

    const bitacora = detectVoiceBitacoraIntent(text);
    assert.ok(bitacora);
    assert.ok(bitacora.text.includes('cerramos la venta con el cliente'));
  });

  it('3. Habit logging is detected accurately', () => {
    const text = 'Marca mi hábito de meditar';
    const intent = classifyVoiceIntent(text);
    assert.strictEqual(intent, 'habit');

    const habitAction = detectVoiceHabitIntent(text);
    assert.ok(habitAction);
    assert.strictEqual(habitAction.action, 'complete_habit');
    assert.ok(habitAction.habitTitle.includes('meditar'));
  });

  it('4. Habit creation is detected accurately', () => {
    const text = 'Crea un nuevo hábito de leer 20 minutos todos los días';
    const intent = classifyVoiceIntent(text);
    assert.strictEqual(intent, 'habit');

    const habitAction = detectVoiceHabitIntent(text);
    assert.ok(habitAction);
    assert.strictEqual(habitAction.action, 'create_habit');
    assert.ok(habitAction.habitTitle.includes('leer 20 minutos'));
  });

  it('5. Explicit task creation cue routes to mixed_actions', () => {
    const text = 'Agrega una tarea de llamar al contador mañana a las 10 am';
    const intent = classifyVoiceIntent(text);
    assert.strictEqual(intent, 'mixed_actions');
  });

  it('6. Direct action on existing task routes to direct_action', () => {
    const text = 'Marca como completada la tarea de gimnasio';
    const intent = classifyVoiceIntent(text);
    assert.strictEqual(intent, 'direct_action');
  });
});
