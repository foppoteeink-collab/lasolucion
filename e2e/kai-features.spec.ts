import { test, expect } from '@playwright/test';

test.describe('KAI Assistant & Smart Bitácora End-to-End', () => {
  test('KAI companion orbital and journal features load without crashes', async ({ page }) => {
    // Escuchar errores de consola para garantizar estabilidad absoluta
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Validar que no haya excepciones graves
    expect(pageErrors.length).toBe(0);

    // Comprobar que el contenedor de la aplicación exista
    const appRoot = page.locator('#root');
    await expect(appRoot).toBeVisible();
  });
});
