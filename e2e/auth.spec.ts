import { test, expect } from '@playwright/test'

test.describe('Auth guards', () => {
  test('unauthenticated user is redirected from /es/admin to login', async ({ page }) => {
    await page.goto('/es/admin')
    await expect(page).toHaveURL(/\/es\/login/)
  })

  test('unauthenticated user is redirected from /es/perfil to login', async ({ page }) => {
    await page.goto('/es/perfil')
    await expect(page).toHaveURL(/\/es\/login/)
  })

  test('login page renders with email and password fields', async ({ page }) => {
    await page.goto('/es/login')
    await expect(page.getByLabel(/correo electrónico/i)).toBeVisible()
    await expect(page.getByLabel(/contraseña/i)).toBeVisible()
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/es/login')
    await page.getByLabel(/correo electrónico/i).fill('wrong@test.com')
    await page.getByLabel(/contraseña/i).fill('wrongpassword')
    await page.getByRole('button', { name: /iniciar sesión/i }).click()
    await expect(page.getByText(/incorrectos/i)).toBeVisible()
  })
})
