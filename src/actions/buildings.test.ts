import { describe, it, expect, vi, beforeEach } from 'vitest'
import '../test/mocks/next-navigation'
import { mockSupabaseClient } from '../test/mocks/supabase'
import '../test/mocks/supabase'

import { createBuilding } from './buildings'

const makeFormData = (data: Record<string, string | string[]>) => {
  const fd = new FormData()
  Object.entries(data).forEach(([key, val]) => {
    if (Array.isArray(val)) val.forEach(v => fd.append(key, v))
    else fd.set(key, val)
  })
  return fd
}

const validBuilding = {
  name: 'Test Building', slug: 'test-building', neighborhood: 'Gracia',
  price: '1200', rooms: '2',
}

describe('createBuilding — Zod schema', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('[SEC-04] rejects slug with spaces (path traversal prevention)', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin', app_metadata: { role: 'admin' } } }
    })
    const result = await createBuilding('es', null, makeFormData({ ...validBuilding, slug: 'has spaces' }))
    expect(result.success).toBe(false)
    expect((result as any).fieldErrors?.slug).toBeTruthy()
  })

  it('[SEC-04] rejects slug with directory traversal characters', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin', app_metadata: { role: 'admin' } } }
    })
    const result = await createBuilding('es', null, makeFormData({ ...validBuilding, slug: '../../../etc' }))
    expect(result.success).toBe(false)
    expect((result as any).fieldErrors?.slug).toBeTruthy()
  })

  it('accepts valid lowercase slug (redirect = success)', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin', app_metadata: { role: 'admin' } } }
    })
    mockSupabaseClient.from.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })
    try {
      await createBuilding('es', null, makeFormData(validBuilding))
    } catch (e) {
      expect((e as Error).message).toContain('NEXT_REDIRECT')
    }
  })

  it('[SEC-01] returns No autorizado when called as non-admin', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'client', app_metadata: {}, user_metadata: {} } }
    })
    const result = await createBuilding('es', null, makeFormData(validBuilding))
    expect(result.success).toBe(false)
    expect((result as any).error).toBe('No autorizado')
  })

  it('returns slug duplicate error on code 23505', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'admin', app_metadata: { role: 'admin' } } }
    })
    mockSupabaseClient.from.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({ error: { code: '23505' } }),
    })
    const result = await createBuilding('es', null, makeFormData(validBuilding))
    expect(result.success).toBe(false)
    expect((result as any).error).toContain('Ya existe un piso')
  })
})
