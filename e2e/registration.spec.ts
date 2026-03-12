import { test, expect } from '@playwright/test'

test.describe('Registration', () => {
  test('submit button is disabled without GDPR consent', async ({ page }) => {
    await page.goto('/es/registro')
    await page.getByLabel(/nombre completo/i).fill('Test User')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/contraseña/i).fill('password123')
    // Do NOT check GDPR checkbox
    await expect(page.getByRole('button', { name: /crear cuenta/i })).toBeDisabled()
  })

  test('GDPR consent checkbox enables submit', async ({ page }) => {
    await page.goto('/es/registro')
    await page.getByLabel(/acepto/i).check()
    await expect(page.getByRole('button', { name: /crear cuenta/i })).not.toBeDisabled()
  })

  test('privacy policy link is present on registration page', async ({ page }) => {
    await page.goto('/es/registro')
    await expect(page.getByRole('link', { name: /política de privacidad/i })).toBeVisible()
  })
})
