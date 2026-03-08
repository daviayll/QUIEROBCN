import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ClientStatusBadge } from '@/components/shared/status-badge'
import ClientActions from '@/components/admin/client-actions'
import DocumentViewer from '@/components/admin/document-viewer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { REQUIRED_DOCS, DOC_LABELS } from '@/types'
import type { ClientPreferences, ClientStatus, ProfileType, Document } from '@/types'

const profileLabels: Record<string, string> = {
  empleado: 'Empleado/a',
  estudiante: 'Estudiante',
  autonomo: 'Autónomo/a',
  otro: 'Otro / Extranjero',
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('*, user_id')
    .eq('id', id)
    .single()

  if (!client) notFound()

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('client_id', id)
    .eq('is_current', true)
    .is('deleted_at', null)
    .order('uploaded_at', { ascending: false })

  const prefs = (client.preferences ?? {}) as ClientPreferences
  const required = REQUIRED_DOCS[client.profile_type as ProfileType] ?? []
  const uploadedTypes = new Set((documents ?? []).map((d: Document) => d.doc_type))
  const missingDocs = required.filter(t => !uploadedTypes.has(t))
  const completedCount = required.length - missingDocs.length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${locale}/admin/clientes`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Clientes
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{client.full_name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <ClientStatusBadge status={client.status as ClientStatus} />
            <span className="text-sm text-muted-foreground">
              {profileLabels[client.profile_type] ?? client.profile_type}
            </span>
          </div>
        </div>
        <ClientActions
          clientId={client.id}
          userId={client.user_id!}
          status={client.status as ClientStatus}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Documents — main column */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Documentos ({completedCount}/{required.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DocumentViewer
                documents={(documents ?? []) as Document[]}
                clientId={client.id}
              />
              {missingDocs.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Documentos pendientes
                  </p>
                  <ul className="space-y-1">
                    {missingDocs.map(doc => (
                      <li key={doc} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                        {DOC_LABELS[doc] ?? doc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — client info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos de contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow label="Email" value={client.email} />
              <InfoRow label="Teléfono" value={client.phone ?? '—'} />
              <InfoRow
                label="Registro"
                value={new Date(client.created_at).toLocaleDateString('es-ES')}
              />
              {client.activated_at && (
                <InfoRow
                  label="Activado"
                  value={new Date(client.activated_at).toLocaleDateString('es-ES')}
                />
              )}
              {client.consent_given_at && (
                <InfoRow
                  label="Consentimiento"
                  value={new Date(client.consent_given_at).toLocaleDateString('es-ES')}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preferencias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {client.monthly_income && (
                <InfoRow
                  label="Ingresos/mes"
                  value={`${client.monthly_income.toLocaleString('es-ES')} €`}
                />
              )}
              {prefs.max_rent && (
                <InfoRow label="Renta máx." value={`${prefs.max_rent.toLocaleString('es-ES')} €`} />
              )}
              {prefs.min_rooms && (
                <InfoRow label="Habitaciones mín." value={String(prefs.min_rooms)} />
              )}
              {prefs.move_in_date && (
                <InfoRow
                  label="Entrada"
                  value={new Date(prefs.move_in_date).toLocaleDateString('es-ES')}
                />
              )}
              <InfoRow label="Mascotas" value={prefs.has_pets ? 'Sí' : 'No'} />
              {prefs.preferred_neighborhoods && prefs.preferred_neighborhoods.length > 0 && (
                <div>
                  <p className="text-muted-foreground">Barrios</p>
                  <p className="mt-0.5">{prefs.preferred_neighborhoods.join(', ')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
