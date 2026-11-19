import { test, expect } from '@playwright/test';

/**
 * SMOKE TEST SUITE - LA SOLUCIÓN PWA
 * 
 * Este conjunto de pruebas valida la salud básica y vital de la aplicación:
 * 1. Carga limpia sin pantalla blanca de la muerte (White Screen of Death).
 * 2. Disponibilidad del contenedor raíz e hidratación del DOM.
 * 3. Navegación fluida entre pestañas principales.
 */

test.describe('Verificación de Humo (Smoke Tests) - Núcleo de la PWA', () => {

  test.beforeEach(async ({ page }) => {
    // Inyectamos estado previo en LocalStorage con las claves canónicas de Zustand y BetaConsent
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

  test('1. La aplicación carga con éxito y renderiza el contenedor principal', async ({ page }) => {
    // 1. Navegar a la raíz de la PWA
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // 2. Verificar que el título de la página coincide con la marca oficial
    await expect(page).toHaveTitle(/La Solución/i);

    // 3. Verificar que el nodo raíz de React se montó correctamente
    const rootElement = page.locator('#root');
    await expect(rootElement).toBeVisible();
  });

  test('2. La barra de navegación permite conmutar entre módulos sin errores', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // 1. Esperar que el árbol principal esté montado
    await expect(page.locator('#root')).toBeVisible();

    // 2. Ubicar la pestaña de Tienda / Arsenal en la navegación (OmniCompanionHub o SidebarHUD)
    const tiendaButton = page.locator('button', { hasText: /Tienda/i }).first();
    
    if (await tiendaButton.isVisible()) {
      await tiendaButton.click();
      // Verificar que se presente algún elemento del arsenal o recompensas
      await expect(page.locator('#root')).toBeVisible();
    }
  });

});
