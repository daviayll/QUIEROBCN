import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import DocumentUploadCard from './document-upload-card'

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test' }, error: null }),
      })),
    },
  })),
}))

vi.mock('@/actions/documents', () => ({
  recordDocumentUpload: vi.fn().mockResolvedValue({ success: true }),
  deleteDocument: vi.fn().mockResolvedValue({ success: true }),
  getDocumentSignedUrl: vi.fn().mockResolvedValue({ url: 'https://example.com/signed' }),
}))

describe('DocumentUploadCard — no existing document', () => {
  it('renders Subir button', () => {
    render(<DocumentUploadCard docType="dni" label="DNI / NIE" userId="user-id" />)
    expect(screen.getByText(/subir/i)).toBeInTheDocument()
  })

  it('does not render Eye or Trash buttons when no doc', () => {
    render(<DocumentUploadCard docType="dni" label="DNI / NIE" userId="user-id" />)
    // Eye and Trash are only rendered when hasDoc is true
    expect(screen.queryByText(/reemplazar/i)).not.toBeInTheDocument()
  })
})

describe('DocumentUploadCard — file validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows error for non-PDF file', async () => {
    render(<DocumentUploadCard docType="dni" label="DNI / NIE" userId="user-id" />)
    const input = screen.getByTestId('file-input')
    const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' })
    fireEvent.change(input, { target: { files: [file] } })
    expect(await screen.findByText(/solo se aceptan archivos pdf/i)).toBeInTheDocument()
  })

  it('shows error for file over 10MB', async () => {
    render(<DocumentUploadCard docType="dni" label="DNI / NIE" userId="user-id" />)
    const input = screen.getByTestId('file-input')
    const bigFile = new File(['x'], 'big.pdf', { type: 'application/pdf' })
    Object.defineProperty(bigFile, 'size', { value: 11 * 1024 * 1024 })
    fireEvent.change(input, { target: { files: [bigFile] } })
    expect(await screen.findByText(/no puede superar los 10 mb/i)).toBeInTheDocument()
  })
})
