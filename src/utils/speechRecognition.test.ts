import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseVoiceTranscriptLocally,
  parseVoiceFinanceLocally,
  detectVoiceFocusIntent,
  extractTomorrowTasksFromReflection,
} from './speechRecognition';

test('parseVoiceTranscriptLocally splits multi-intent Spanish dictation into tasks and habits', () => {
  const result = parseVoiceTranscriptLocally(
    'A las 7 entrenar pierna, a las 10 junta con el cliente y tomar 8 vasos de agua todos los días'
  );

  assert.equal(result.usedRemoteAI, false);
  assert.equal(result.items.length, 3);

  const [gym, meeting, water] = result.items;
  assert.equal(gym.kind, 'task');
  assert.equal(gym.category, 'entrenamiento');
  assert.equal(gym.timeBlock, '07:00 - 08:00');

  assert.equal(meeting.kind, 'task');
  assert.equal(meeting.category, 'clientes');
  assert.equal(meeting.timeBlock, '10:00 - 11:00');

  assert.equal(water.kind, 'habit');
  assert.equal(water.frequency, 'daily');
  assert.equal(water.targetCount, 8);
  assert.equal(water.unit, 'vasos');
  assert.equal(water.habitEnergyType, 'purification');
});

test('parseVoiceTranscriptLocally detects tomorrow offset, PM hours, and urgent priority', () => {
  const result = parseVoiceTranscriptLocally(
    'Mañana a las 4 pm entregar reporte urgente y a las 6:30 pm salir a correr'
  );

  assert.equal(result.items.length, 2);
  const [report, run] = result.items;

  assert.equal(report.targetDateOffset, 1);
  assert.equal(report.timeBlock, '16:00 - 17:00');
  assert.equal(report.priority, 'alta');
  assert.equal(report.category, 'trabajo');

  assert.equal(run.targetDateOffset, 1);
  assert.equal(run.timeBlock, '18:30 - 19:30');
  assert.equal(run.category, 'entrenamiento');
});

test('parseVoiceTranscriptLocally detects explicit time ranges and specific days habits', () => {
  const result = parseVoiceTranscriptLocally(
    'De 9 a 11 estudiar inglés, y todos los lunes y miércoles meditar 15 minutos'
  );

  assert.equal(result.items.length, 2);
  const [study, meditate] = result.items;

  assert.equal(study.kind, 'task');
  assert.equal(study.timeBlock, '09:00 - 11:00');
  assert.equal(study.category, 'estudio');

  assert.equal(meditate.kind, 'habit');
  assert.equal(meditate.frequency, 'specific_days');
  assert.deepEqual(meditate.specificDays, [1, 3]);
  assert.equal(meditate.targetCount, 15);
  assert.equal(meditate.unit, 'min');
});

test('parseVoiceTranscriptLocally returns empty items safely on blank transcript', () => {
  const result = parseVoiceTranscriptLocally('   ');
  assert.equal(result.items.length, 0);
  assert.ok(result.kaiReply.length > 0);
});

test('parseVoiceFinanceLocally extracts mixed income and expense entries with categories', () => {
  const result = parseVoiceFinanceLocally(
    'Gasté 180 en comida y recibí 1,500 de un cliente, también pagué 450 de gasolina'
  );

  assert.equal(result.entries.length, 3);
  const [food, client, gas] = result.entries;

  assert.equal(food.type, 'expense');
  assert.equal(food.amount, 180);
  assert.equal(food.category, 'Alimentación / Comida');

  assert.equal(client.type, 'income');
  assert.equal(client.amount, 1500);
  assert.equal(client.category, 'Trabajo / Clientes');

  assert.equal(gas.type, 'expense');
  assert.equal(gas.amount, 450);
  assert.equal(gas.category, 'Operaciones / Transporte');
});

test('detectVoiceFocusIntent parses Pomodoro duration, title, and category', () => {
  const intent = detectVoiceFocusIntent('Pon un foco de 30 minutos para diseñar el logo del cliente');
  assert.ok(intent);
  assert.equal(intent.durationMinutes, 30);
  assert.equal(intent.title, 'Diseñar el logo del cliente');
  assert.equal(intent.category, 'clientes');

  const noIntent = detectVoiceFocusIntent('Comprar pan y leche hoy');
  assert.equal(noIntent, null);
});

test('extractTomorrowTasksFromReflection pulls tomorrow action items and gives warm feedback', () => {
  const res = extractTomorrowTasksFromReflection(
    'Hoy avancé súper bien con el proyecto. Mañana a las 9 tengo que llamar al contador y no olvidar enviar la propuesta.',
    85
  );

  assert.ok(res.kaiFeedback.includes('85%'));
  assert.ok(res.tomorrowTasks.length >= 1);
  assert.equal(res.tomorrowTasks[0].targetDateOffset, 1);
});
