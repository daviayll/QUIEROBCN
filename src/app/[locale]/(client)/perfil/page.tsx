import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Pencil } from 'lucide-react'
import { BARCELONA_NEIGHBORHOODS, DOC_LABELS, REQUIRED_DOCS } from '@/types'
import type { ClientPreferences, ProfileType } from '@/types'

const profileLabels: Record<ProfileType, string> = {
  empleado: 'Empleado/a',
  estudiante: 'Estudiante',
  autonomo: 'Autónomo/a',
  otro: 'Otro / Extranjero',
}

const statusLabel: Record<string, string> = {
  unverified: 'Sin verificar',
  uploading: 'Documentos pendientes',
  pending_review: 'En revisión',
  active: 'Activo',
  inactive: 'Inactivo',
}

export default async function PerfilPage({
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
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!client) redirect(`/${locale}/login`)

  const prefs = (client.preferences ?? {}) as ClientPreferences
  const required = REQUIRED_DOCS[client.profile_type as ProfileType] ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Mi perfil</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tu información y preferencias de búsqueda.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/${locale}/perfil/editar`}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Editar perfil
          </Link>
        </Button>
      </div>

      {/* Personal data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos personales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estado</span>
            <Badge variant="outline">{statusLabel[client.status] ?? client.status}</Badge>
          </div>
          <Separator />
          <Row label="Nombre" value={client.full_name} />
          <Row label="Email" value={client.email} />
          <Row label="Teléfono" value={client.phone ?? '—'} />
          <Row label="Tipo de perfil" value={profileLabels[client.profile_type as ProfileType] ?? client.profile_type} />
          {client.monthly_income && (
            <Row label="Ingresos mensuales" value={`${client.monthly_income.toLocaleString('es-ES')} €`} />
          )}
          {client.consent_given_at && (
            <Row
              label="Consentimiento GDPR"
              value={`Aceptado el ${new Date(client.consent_given_at).toLocaleDateString('es-ES')}`}
            />
          )}
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferencias de búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {prefs.max_rent && (
            <Row label="Renta máxima" value={`${prefs.max_rent.toLocaleString('es-ES')} €/mes`} />
          )}
          {prefs.min_rooms && (
            <Row label="Habitaciones mínimas" value={String(prefs.min_rooms)} />
          )}
          {prefs.move_in_date && (
            <Row
              label="Fecha de entrada"
              value={new Date(prefs.move_in_date).toLocaleDateString('es-ES')}
            />
          )}
          <Row label="Mascotas" value={prefs.has_pets ? 'Sí' : 'No'} />
          {prefs.preferred_neighborhoods && prefs.preferred_neighborhoods.length > 0 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <span className="min-w-40 text-sm text-muted-foreground">Barrios preferidos</span>
              <div className="flex flex-wrap gap-1">
                {prefs.preferred_neighborhoods.map(n => (
                  <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Required documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documentos requeridos para tu perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {required.map(doc => (
              <li key={doc} className="text-sm text-muted-foreground">
                · {DOC_LABELS[doc] ?? doc}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}
