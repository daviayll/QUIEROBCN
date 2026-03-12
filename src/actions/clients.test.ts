import { describe, it, expect, vi, beforeEach } from 'vitest'
import '../test/mocks/next-navigation'
import { mockSupabaseClient, mockFrom } from '../test/mocks/supabase'
import '../test/mocks/supabase'

// Import AFTER mocks are set up
import { loginAction, registerAction } from './clients'

const makeFormData = (data: Record<string, string | string[]>) => {
  const fd = new FormData()
  Object.entries(data).forEach(([key, val]) => {
    if (Array.isArray(val)) val.forEach(v => fd.append(key, v))
    else fd.set(key, val)
  })
  return fd
}

describe('loginAction — Zod validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns fieldErrors for invalid email', async () => {
    const result = await loginAction('es', null, makeFormData({ email: 'not-an-email', password: 'password123' }))
    expect(result.success).toBe(false)
    expect((result as any).fieldErrors?.email).toBeTruthy()
  })

  it('returns fieldErrors for password under 6 chars', async () => {
    const result = await loginAction('es', null, makeFormData({ email: 'test@test.com', password: '12345' }))
    expect(result.success).toBe(false)
    expect((result as any).fieldErrors?.password).toBeTruthy()
  })

  it('does NOT call signInWithPassword when validation fails', async () => {
    await loginAction('es', null, makeFormData({ email: 'bad', password: '123' }))
    expect(mockSupabaseClient.auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it('returns error when Supabase auth fails', async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' },
    })
    const result = await loginAction('es', null, makeFormData({ email: 'test@test.com', password: 'password123' }))
    expect(result.success).toBe(false)
    expect((result as any).error).toContain('incorrectos')
  })
})

describe('registerAction — Zod validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fails when gdpr_consent is not true', async () => {
    const result = await registerAction('es', null, makeFormData({
      email: 'test@test.com', password: 'password123', full_name: 'Test User',
      profile_type: 'empleado', gdpr_consent: 'false',
    }))
    expect(result.success).toBe(false)
    expect((result as any).fieldErrors?.gdpr_consent).toBeTruthy()
  })

  it('fails for invalid profile_type', async () => {
    const result = await registerAction('es', null, makeFormData({
      email: 'test@test.com', password: 'password123', full_name: 'Test User',
      profile_type: 'freelancer', gdpr_consent: 'true',
    }))
    expect(result.success).toBe(false)
  })

  it('fails when full_name is 1 character', async () => {
    const result = await registerAction('es', null, makeFormData({
      email: 'test@test.com', password: 'password123', full_name: 'A',
      profile_type: 'empleado', gdpr_consent: 'true',
    }))
    expect(result.success).toBe(false)
    expect((result as any).fieldErrors?.full_name).toBeTruthy()
  })

  it('returns error when email already registered', async () => {
    mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'User already registered' },
    })
    const result = await registerAction('es', null, makeFormData({
      email: 'existing@test.com', password: 'password123', full_name: 'Test User',
      profile_type: 'empleado', gdpr_consent: 'true',
    }))
    expect(result.success).toBe(false)
    expect((result as any).error).toContain('ya está registrado')
  })

  it('does NOT insert client when signUp fails', async () => {
    mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Some error' },
    })
    await registerAction('es', null, makeFormData({
      email: 'test@test.com', password: 'password123', full_name: 'Test User',
      profile_type: 'empleado', gdpr_consent: 'true',
    }))
    expect(mockFrom.insert).not.toHaveBeenCalled()
  })
})
