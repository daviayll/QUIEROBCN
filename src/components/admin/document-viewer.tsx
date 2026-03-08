'use client'

import { useTransition } from 'react'
import { getAdminDocumentUrl } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Eye, CheckCircle2, Clock } from 'lucide-react'
import type { Document } from '@/types'
import { DOC_LABELS } from '@/types'

interface DocumentViewerProps {
  documents: Document[]
  clientId: string
}

export default function DocumentViewer({ documents, clientId }: DocumentViewerProps) {
  const [isPending, startTransition] = useTransition()

  const openDocument = (doc: Document) => {
    startTransition(async () => {
      const { url, error } = await getAdminDocumentUrl(clientId, doc.id, doc.file_path)
      if (error || !url) {
        alert('No se pudo generar el enlace de acceso.')
        return
      }
      window.open(url, '_blank')
    })
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No hay documentos subidos todavía.</p>
    )
  }

  return (
    <div className="space-y-2">
      {documents.map(doc => (
        <div
          key={doc.id}
          className="flex items-center justify-between gap-3 rounded-md border p-3"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {DOC_LABELS[doc.doc_type] ?? doc.doc_type}
              </p>
              <p className="truncate text-xs text-muted-foreground">{doc.file_name}</p>
              <p className="text-xs text-muted-foreground">
                Subido {new Date(doc.uploaded_at).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDocument(doc)}
            disabled={isPending}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
