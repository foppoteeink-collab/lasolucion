import test from 'node:test';
import assert from 'node:assert/strict';
import { usePlayerStore } from '../store/usePlayerStore';
import { JUNG_ARCHETYPES, getArchetypeByName } from '../data/archetypes';

test('Fase 2 (10/10): completeAwakening grants identity, welcome streak shield, XP, and coins', () => {
  const store = usePlayerStore.getState();

  // Reset stats to baseline
  store.setStats((prev) => ({
    ...prev,
    hasCompletedAwakening: false,
    streakShields: 0,
    currentXp: 0,
    coins: 0,
    username: '',
    characterClass: '',
    mantra: ''
  }));

  // Perform Awakening with chosen archetype and username
  store.completeAwakening({
    username: 'CompañeroEstelar',
    fullName: 'Compañero Estelar',
    characterClass: 'Mente Creadora',
    mantra: 'Creando valor en cada acción de mi día.',
    kaiShape: 'prism'
  });

  const updated = usePlayerStore.getState().stats;

  assert.equal(updated.hasCompletedAwakening, true, 'Debe marcar el despertar como completado');
  assert.equal(updated.username, 'CompañeroEstelar', 'Debe persistir el nombre de usuario elegido');
  assert.equal(updated.characterClass, 'Mente Creadora', 'Debe persistir la clase de arquetipo elegida');
  assert.equal(updated.mantra, 'Creando valor en cada acción de mi día.', 'Debe persistir el mantra');
  assert.ok((updated.streakShields || 0) >= 1, 'Debe otorgar al menos 1 Escudo de Racha de bienvenida para retención D1-D7');
  assert.ok((updated.currentXp || 0) >= 50, 'Debe otorgar 50 XP por despertar');
  assert.ok((updated.coins || 0) >= 25, 'Debe otorgar 25 Monedas de recompensa');
});

test('Fase 2 (10/10): Todos los 12 Arquetipos Jungianos tienen atributos canónicos y citas válidas', () => {
  assert.equal(JUNG_ARCHETYPES.length, 12, 'Deben existir exactamente 12 arquetipos');

  for (const arch of JUNG_ARCHETYPES) {
    assert.ok(arch.id && arch.id.length > 0, `El arquetipo ${arch.id} debe tener un id`);
    assert.ok(arch.name && arch.name.length > 0, `El arquetipo ${arch.id} debe tener un nombre`);
    assert.ok(arch.desire && arch.desire.length > 5, `El arquetipo ${arch.id} debe tener un propósito`);
    assert.ok(arch.primaryStat, `El arquetipo ${arch.id} debe tener un atributo primario`);
    assert.ok(arch.statBonus, `El arquetipo ${arch.id} debe tener un bono de estadística`);
    assert.ok(Array.isArray(arch.quotes) && arch.quotes.length > 0, `El arquetipo ${arch.id} debe tener citas`);

    const lookup = getArchetypeByName(arch.id);
    assert.ok(lookup, `getArchetypeByName debe resolver el arquetipo ${arch.id}`);
    assert.equal(lookup?.id, arch.id);
  }
});
