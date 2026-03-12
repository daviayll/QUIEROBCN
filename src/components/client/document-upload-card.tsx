'use client'

import { useRef, useState, useTransition } from 'react'
import { Upload, CheckCircle2, Clock, Trash2, Eye } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { recordDocumentUpload, deleteDocument, getDocumentSignedUrl } from '@/actions/documents'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { Database } from '@/types/database'
import type { Document } from '@/types'

interface DocumentUploadCardProps {
  docType: string
  label: string
  existingDoc?: Document
  userId: string
}

export default function DocumentUploadCard({
  docType,
  label,
  existingDoc,
  userId,
}: DocumentUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Solo se aceptan archivos PDF.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo no puede superar los 10 MB.')
      return
    }

    setError(null)
    setUploading(true)
    setUploadProgress(10)

    const timestamp = Date.now()
    const ext = 'pdf'
    const filePath = `${userId}/${docType}_${timestamp}.${ext}`

    // Upload directly to Supabase Storage (no file touches the server)
    const { error: storageError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, { contentType: 'application/pdf', upsert: false })

    if (storageError) {
      setError(`Error al subir: ${storageError.message}`)
      setUploading(false)
      return
    }

    setUploadProgress(70)

    // Record in DB via server action
    startTransition(async () => {
      const result = await recordDocumentUpload(docType, filePath, file.name)
      setUploading(false)
      setUploadProgress(0)
      if (!result.success) {
        setError(result.error ?? 'Error al registrar el documento.')
      }
    })
  }

  const handleDelete = () => {
    if (!existingDoc) return
    if (!confirm(`¿Eliminar "${label}"? Esta acción no se puede deshacer.`)) return
    startTransition(async () => {
      await deleteDocument(existingDoc.id, existingDoc.file_path)
    })
  }

  const handleView = () => {
    if (!existingDoc) return
    startTransition(async () => {
      const { url, error: urlError } = await getDocumentSignedUrl(existingDoc.file_path)
      if (urlError || !url) {
        setError('No se pudo generar el enlace de acceso.')
        return
      }
      window.open(url, '_blank')
    })
  }

  const hasDoc = !!existingDoc && !existingDoc.deleted_at
  const isLoading = uploading || isPending

  return (
    <Card className={`transition-colors ${hasDoc ? 'border-green-200 bg-green-50/30' : 'border-dashed'}`}>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="flex min-w-0 items-center gap-3">
          {hasDoc ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
          ) : (
            <Clock className="h-5 w-5 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{label}</p>
            {hasDoc && (
              <p className="truncate text-xs text-muted-foreground">{existingDoc.file_name}</p>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
            {uploading && (
              <Progress value={uploadProgress} className="mt-1 h-1.5 w-32" />
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {hasDoc && (
            <>
              <Button variant="ghost" size="sm" onClick={handleView} disabled={isLoading}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isLoading}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
          <Button
            variant={hasDoc ? 'outline' : 'default'}
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={isLoading}
          >
            <Upload className="mr-1.5 h-4 w-4" />
            {hasDoc ? 'Reemplazar' : 'Subir'}
          </Button>
        </div>
      </CardContent>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        data-testid="file-input"
        onChange={handleFileSelect}
      />
    </Card>
  )
}
