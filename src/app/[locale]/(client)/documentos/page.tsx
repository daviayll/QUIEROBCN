import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DocumentUploadCard from '@/components/client/document-upload-card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'
import { REQUIRED_DOCS, DOC_LABELS } from '@/types'
import type { ProfileType, Document } from '@/types'

export default async function DocumentosPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: client } = await supabase
    .from('clients')
    .select('id, full_name, profile_type, status')
    .eq('user_id', user.id)
    .single()

  if (!client) redirect(`/${locale}/login`)

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('client_id', client.id)
    .eq('is_current', true)
    .is('deleted_at', null)

  const required = REQUIRED_DOCS[client.profile_type as ProfileType] ?? []
  const uploadedTypes = new Set((documents ?? []).map((d: Document) => d.doc_type))
  const completedCount = required.filter(t => uploadedTypes.has(t)).length
  const progressPct = required.length > 0 ? Math.round((completedCount / required.length) * 100) : 0

  const docsByType: Record<string, Document> = {}
  ;(documents ?? []).forEach((d: Document) => { docsByType[d.doc_type] = d })

  const statusMessages: Record<string, { title: string; description: string }> = {
    unverified: {
      title: 'Sube tus documentos para empezar',
      description: 'Necesitamos verificar tu solvencia antes de poderte emparejar con pisos.',
    },
    uploading: {
      title: 'Completa tus documentos',
      description: 'Ya tienes algunos documentos. Sube los restantes para que podamos revisar tu expediente.',
    },
    pending_review: {
      title: 'Expediente en revisión',
      description: 'Hemos recibido tus documentos y los estamos revisando. Te avisaremos pronto.',
    },
    active: {
      title: '¡Perfil activo!',
      description: 'Tu expediente está verificado. Te avisaremos cuando encontremos un piso que se ajuste a tus preferencias.',
    },
    inactive: {
      title: 'Perfil inactivo',
      description: 'Tu perfil está pausado actualmente. Contacta con el agente si tienes dudas.',
    },
  }

  const msg = statusMessages[client.status]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Mis documentos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sube los documentos requeridos para tu búsqueda de piso.
        </p>
      </div>

      {msg && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>{msg.title}</strong> — {msg.description}
          </AlertDescription>
        </Alert>
      )}

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progreso de documentación</span>
          <span className="font-medium">{completedCount} / {required.length}</span>
        </div>
        <Progress value={progressPct} className="h-2" />
      </div>

      {/* Document list */}
      <div className="space-y-3">
        {required.map(docType => (
          <DocumentUploadCard
            key={docType}
            docType={docType}
            label={DOC_LABELS[docType] ?? docType}
            existingDoc={docsByType[docType]}
            userId={user.id}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Solo se aceptan archivos PDF de hasta 10 MB. Tus documentos están protegidos y solo
        son accesibles por el agente y las promotoras a las que apliques.
      </p>
    </div>
  )
}
