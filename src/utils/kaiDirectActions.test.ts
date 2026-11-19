import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectVoiceDirectAction } from './speechRecognition';

test('KAI Direct Actions: detect complete_task accurately', () => {
  const tasks = [
    { id: 't1', title: 'Entrenamiento en gimnasio', completed: false },
    { id: 't2', title: 'Revisión con clientes', completed: false }
  ];

  const action = detectVoiceDirectAction('Marca como completada la tarea de gimnasio', tasks);
  assert.ok(action !== null);
  assert.strictEqual(action.type, 'complete_task');
  assert.strictEqual(action.matchedTaskId, 't1');
  assert.strictEqual(action.matchedTaskTitle, 'Entrenamiento en gimnasio');
});

test('KAI Direct Actions: detect delete_task accurately', () => {
  const tasks = [
    { id: 't1', title: 'Llamar al banco', completed: false },
    { id: 't2', title: 'Comprar insumos', completed: false }
  ];

  const action = detectVoiceDirectAction('Elimina la tarea de llamar al banco', tasks);
  assert.ok(action !== null);
  assert.strictEqual(action.type, 'delete_task');
  assert.strictEqual(action.matchedTaskId, 't1');
  assert.strictEqual(action.matchedTaskTitle, 'Llamar al banco');
});

test('KAI Direct Actions: detect reschedule_task with new time accurately', () => {
  const tasks = [
    { id: 't1', title: 'Reunión con clientes', timeBlock: '10:00 - 11:00', completed: false }
  ];

  const action = detectVoiceDirectAction('Mueve la reunión con clientes para las 4pm', tasks);
  assert.ok(action !== null);
  assert.strictEqual(action.type, 'reschedule_task');
  assert.strictEqual(action.matchedTaskId, 't1');
  assert.strictEqual(action.newTimeBlock, '4pm');
});
