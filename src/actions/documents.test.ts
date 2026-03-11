import { describe, it, expect, vi, beforeEach } from 'vitest'
import '../test/mocks/next-navigation'
import { mockSupabaseClient, mockFrom } from '../test/mocks/supabase'
import '../test/mocks/supabase'

import { getDocumentSignedUrl, deleteDocument, recordDocumentUpload } from './documents'

const mockUser = { id: 'user-id', app_metadata: {}, user_metadata: {} }

describe('[SEC-02] getDocumentSignedUrl — ownership check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
  })

  it('returns error when document not found for user (RLS blocks)', async () => {
    mockFrom.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } })
    const result = await getDocumentSignedUrl('documents/other-user/private.pdf')
    expect(result.url).toBeNull()
    expect(result.error).toBe('Documento no encontrado')
  })

  it('returns signed URL when document belongs to user', async () => {
    mockFrom.single.mockResolvedValueOnce({ data: { id: 'doc-id' }, error: null })
    const result = await getDocumentSignedUrl('documents/user-id/myfile.pdf')
    expect(result.url).toBe('https://example.com/signed')
  })

  it('does not call storage when DB returns no document', async () => {
    mockFrom.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } })
    await getDocumentSignedUrl('documents/other/file.pdf')
    expect(mockSupabaseClient.storage.from).not.toHaveBeenCalled()
  })
})

describe('[SEC-03] deleteDocument — DB before storage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
  })

  it('returns error without touching storage when DB update fails', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: { message: 'RLS violation' } })
    mockSupabaseClient.from.mockReturnValueOnce({
      update: vi.fn().mockReturnValue({ eq: eqMock }),
    })

    const result = await deleteDocument('doc-id', 'documents/user-id/file.pdf')
    expect(result.success).toBe(false)
    expect(mockSupabaseClient.storage.from).not.toHaveBeenCalled()
  })

  it('calls storage.remove only after successful DB update', async () => {
    const removeMock = vi.fn().mockResolvedValue({ data: [], error: null })
    mockSupabaseClient.storage.from.mockReturnValue({ remove: removeMock })

    const eqMock = vi.fn().mockResolvedValue({ error: null })
    mockSupabaseClient.from.mockReturnValueOnce({
      update: vi.fn().mockReturnValue({ eq: eqMock }),
    })

    await deleteDocument('doc-id', 'documents/user-id/file.pdf')
    expect(removeMock).toHaveBeenCalledWith(['documents/user-id/file.pdf'])
  })
})

describe('recordDocumentUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
  })

  it('returns No autenticado when user is null', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({ data: { user: null } })
    const result = await recordDocumentUpload('dni', 'path/file.pdf', 'file.pdf')
    expect(result.success).toBe(false)
    expect(result.error).toBe('No autenticado')
  })

  it('returns Perfil no encontrado when client lookup returns null', async () => {
    mockFrom.single.mockResolvedValueOnce({ data: null, error: null })
    const result = await recordDocumentUpload('dni', 'path/file.pdf', 'file.pdf')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Perfil no encontrado')
  })
})
