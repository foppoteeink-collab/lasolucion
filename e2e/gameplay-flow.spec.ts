import { test, expect } from '@playwright/test';

/**
 * E2E GAMEPLAY & PRODUCTIVITY JOURNEY - LA SOLUCIÓN PWA
 * 
 * Este conjunto de pruebas de extremo a extremo (E2E) valida el ciclo virtuoso completo
 * del usuario en la aplicación:
 * 1. Creación de una nueva tarea en el tablero diario (Desktop y Móvil).
 * 2. Marcado y completado de la tarea con verificación de retroalimentación visual accesible.
 * 3. Apertura del panel de finanzas y registro de un gasto con actualización contable.
 */

test.describe('Flujo de Jugabilidad y Productividad (Core Loop E2E)', () => {

  test.beforeEach(async ({ page }) => {
    // Inyectamos estado inicial en LocalStorage: consentimiento de beta y jugador nivel 5
    await page.addInitScript(() => {
      window.localStorage.setItem('la_solucion_beta_consent_v1', 'true');
      window.localStorage.setItem('quantum-os-player-stats', JSON.stringify({
        state: {
          stats: {
            hasCompletedAwakening: true,
            betaConsentAccepted: true,
            level: 5,
            totalXpEarned: 500,
            username: 'HeroeTester',
            fullName: 'Héroe de Prueba',
            coins: 100,
            streakDays: 3,
            characterClass: 'Espíritu Heroico',
          }
        },
        version: 0,
      }));
    });
  });

  test('1. Flujo completo: Crear una nueva tarea y verificar su persistencia en el tablero', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#root')).toBeVisible();

    // 1. Abrir modal de creación de tarea usando selector visible adaptable (Desktop y Móvil)
    const addTaskBtn = page.locator('button:visible[title*="Tarea"], button:visible:has-text("Tarea")').first();
    await expect(addTaskBtn).toBeVisible({ timeout: 10000 });
    await addTaskBtn.click();

    // 2. Localizar el formulario y llenar el título de la tarea
    const titleInput = page.locator('input[placeholder*="Ej. Enviar reporte"]').first();
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill('Misión Épica: Dominio E2E');

    // 3. Enviar el formulario para crear la tarea
    const submitBtn = page.locator('button[type="submit"]:has-text("Crear Tarea")');
    await submitBtn.click();

    // 4. Verificar que la tarea aparece listada en el tablero
    const createdTask = page.locator('text=Misión Épica: Dominio E2E').first();
    await expect(createdTask).toBeVisible({ timeout: 5000 });
  });

  test('2. Flujo completo: Crear y completar una tarea verificando retroalimentación visual', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#root')).toBeVisible();

    // 1. Crear la tarea a través de la UI para asegurar ciclo de vida real
    const addTaskBtn = page.locator('button:visible[title*="Tarea"], button:visible:has-text("Tarea")').first();
    await expect(addTaskBtn).toBeVisible({ timeout: 10000 });
    await addTaskBtn.click();

    const titleInput = page.locator('input[placeholder*="Ej. Enviar reporte"]').first();
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill('Entrenar Enfoque Cuántico');

    const submitBtn = page.locator('button[type="submit"]:has-text("Crear Tarea")');
    await submitBtn.click();

    // 2. Verificar que la tarea recién creada es visible en el tablero
    const taskTitle = page.locator('text=Entrenar Enfoque Cuántico').first();
    await expect(taskTitle).toBeVisible({ timeout: 5000 });

    // 3. Marcar la tarea como completada tocando su botón de acción accesible
    const completeBtn = page.locator('button[aria-label*="Completar tarea: Entrenar Enfoque Cuántico"]').first();
    await expect(completeBtn).toBeVisible({ timeout: 5000 });
    await completeBtn.click();

    // 4. Verificar que el botón conmuta a estado completado ("Desmarcar tarea")
    const uncompleteBtn = page.locator('button[aria-label*="Desmarcar tarea: Entrenar Enfoque Cuántico"]').first();
    await expect(uncompleteBtn).toBeVisible({ timeout: 5000 });
  });

  test('3. Flujo contable: Abrir panel de finanzas y registrar un gasto diario', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#root')).toBeVisible();

    // 1. Si estamos en modo Nexus, activar el orbe táctico de KAI para proyectar las herramientas satélite
    const kaiOrb = page.locator('[aria-label="Abrir menú táctico KAI"]:visible').first();
    if (await kaiOrb.isVisible()) {
      await kaiOrb.click();
    }

    // 2. Localizar y presionar la opción de Finanzas en el menú orbital de KAI
    const financeBtn = page.locator('[role="menuitem"]:visible, button:visible', { hasText: /Finanzas/i }).first();
    await expect(financeBtn).toBeVisible({ timeout: 10000 });
    await financeBtn.click();

    // 3. Verificar que el modal de finanzas está visible y editable
    const amountInput = page.locator('input[placeholder="0.00"]').first();
    await expect(amountInput).toBeVisible({ timeout: 5000 });

    // 4. Ingresar monto y concepto del gasto
    await amountInput.fill('45.50');
    const conceptInput = page.locator('input[placeholder*="Concepto"]').first();
    await conceptInput.fill('Café de Productividad');

    // 5. Registrar el gasto
    const submitExpenseBtn = page.locator('button[type="submit"]:has-text("Registrar Gasto")').first();
    await submitExpenseBtn.click();

    // 6. Verificar que el concepto registrado aparece en el historial del día
    const loggedExpense = page.locator('text=Café de Productividad').first();
    await expect(loggedExpense).toBeVisible({ timeout: 5000 });
  });

});
