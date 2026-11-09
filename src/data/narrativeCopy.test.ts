import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTH_SECURITY_MICROCOPY,
  WELCOME_UVP,
  NARRATIVE_MODE_OPTIONS,
  NARRATIVE_COPY,
  getNarrativeCopy,
} from './narrativeCopy';
import { useUIStore } from '../store/useUIStore';

test('AUTH_SECURITY_MICROCOPY matches exact conversion & privacy copy', () => {
  assert.equal(
    AUTH_SECURITY_MICROCOPY,
    '🔒 Privacidad blindada. Datos sincronizados con cifrado de extremo a extremo y soporte 100% offline'
  );
});

test('WELCOME_UVP provides explicit value proposition and friction-reducing microcopy', () => {
  assert.ok(WELCOME_UVP.headline.length >= 20);
  assert.ok(WELCOME_UVP.description.length >= 40);
  assert.equal(WELCOME_UVP.primaryCta, 'Crear mi sistema de enfoque');
  assert.ok(
    WELCOME_UVP.frictionPills.some((p) => p.toLowerCase().includes('sin tarjeta')),
    'Debe incluir microcopia sin tarjeta de crédito'
  );
  assert.ok(
    WELCOME_UVP.frictionPills.some((p) => p.toLowerCase().includes('local')),
    'Debe aclarar almacenamiento local y privado'
  );
  assert.ok(
    WELCOME_UVP.frictionPills.some((p) => p.toLowerCase().includes('cero venta')),
    'Debe aclarar cero venta de datos personales'
  );
});

test('NARRATIVE_MODE_OPTIONS exposes exact tactical and minimal selector labels', () => {
  assert.equal(NARRATIVE_MODE_OPTIONS.tactical.label, 'Modo Táctico / Lore Completo');
  assert.equal(NARRATIVE_MODE_OPTIONS.minimal.label, 'Modo Productividad Minimalista');
});

test('Minimalist productivity mode eliminates lore jargon and connects CTAs to tangible benefits', () => {
  const minimal = getNarrativeCopy('minimal');
  const forbiddenInMinimal = [
    'Protocolo de Blindaje',
    'Ceremonia del Despertar',
    'Asimilar',
    'Forja Neural',
    'Moxen',
    'Entropía',
  ];

  for (const [key, value] of Object.entries(minimal)) {
    for (const term of forbiddenInMinimal) {
      assert.equal(
        value.toLowerCase().includes(term.toLowerCase()),
        false,
        `Key "${key}" en modo minimalista no debe contener "${term}" (valor: "${value}")`
      );
    }
  }

  assert.equal(minimal.onboardingWelcomeCta, 'Crear mi sistema de enfoque');
  assert.equal(minimal.awakeningSubmitCta, 'Crear mi sistema de enfoque');
  assert.equal(minimal.levelUpCta, 'Reclamar recompensa');
  assert.equal(minimal.nightlyConsolidatePrefix, 'Cerrar Día y Analizar Progreso');
});

test('Tactical mode retains full RPG personality without leaking internal library names', () => {
  const tactical = getNarrativeCopy('tactical');
  const libraryLeaks = ['Moxen Inercia', 'Moxen Vidrio', 'Protocolo de Blindaje'];

  for (const [key, value] of Object.entries(tactical)) {
    for (const term of libraryLeaks) {
      assert.equal(
        value.toLowerCase().includes(term.toLowerCase()),
        false,
        `Key "${key}" en modo táctico no debe filtrar librería interna "${term}"`
      );
    }
  }

  assert.equal(Object.keys(NARRATIVE_COPY.tactical).length, Object.keys(NARRATIVE_COPY.minimal).length);
});

test('useUIStore updates narrativeMode reactively between tactical and minimal', () => {
  const store = useUIStore.getState();
  const initial = store.narrativeMode;

  store.setNarrativeMode('minimal');
  assert.equal(useUIStore.getState().narrativeMode, 'minimal');

  store.setNarrativeMode('tactical');
  assert.equal(useUIStore.getState().narrativeMode, 'tactical');

  store.setNarrativeMode(initial);
});
