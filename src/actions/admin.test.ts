import { describe, it, expect, vi, beforeEach } from 'vitest'
import '../test/mocks/next-navigation'
import { mockSupabaseClient, mockFrom } from '../test/mocks/supabase'
import '../test/mocks/supabase'

import { activateClient, getAdminDocumentUrl } from './admin'

const adminUser = { id: 'admin-id', app_metadata: { role: 'admin' }, user_metadata: {} }

describe('[SEC] requireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns No autorizado when user is null', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({ data: { user: null } })
    const result = await activateClient('some-id')
    expect(result.success).toBe(false)
    expect(result.error).toBe('No autorizado')
  })

  it('[SEC-01] rejects user with user_metadata.role=admin but no app_metadata.role', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'bad-actor', app_metadata: {}, user_metadata: { role: 'admin' } } }
    })
    const result = await activateClient('some-id')
    expect(result.success).toBe(false)
    expect(result.error).toBe('No autorizado')
  })

  it('allows user with app_metadata.role=admin', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({ data: { user: adminUser } })
    const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    mockSupabaseClient.from.mockReturnValueOnce({ ...mockFrom, update: mockUpdate })
    const result = await activateClient('some-id')
    expect(result.success).toBe(true)
  })
})

describe('getAdminDocumentUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: adminUser } })
  })

  it('returns signed URL on success', async () => {
    const result = await getAdminDocumentUrl('client-id', 'doc-id', 'documents/path/file.pdf')
    expect(result.url).toBe('https://example.com/signed')
  })

  it('returns error when storage fails', async () => {
    mockSupabaseClient.storage.from.mockReturnValueOnce({
      createSignedUrl: vi.fn().mockResolvedValue({ data: null, error: { message: 'Storage error' } }),
    })
    const result = await getAdminDocumentUrl('client-id', 'doc-id', 'path/file.pdf')
    expect(result.url).toBeNull()
    expect(result.error).toBeTruthy()
  })
})
