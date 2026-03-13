import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, CalendarDays, Users, CheckCircle2, Clock, ImageIcon, Pencil } from 'lucide-react'
import MatchTrigger from '@/components/admin/match-trigger'
import AddSlotForm from '@/components/admin/add-slot-form'
import MatchNotifier from '@/components/admin/match-notifier'
import BuildingPhotoUpload from '@/components/admin/building-photo-upload'

const statusLabel: Record<string, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  closed: 'Cerrado',
}
const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  draft: 'outline',
  published: 'default',
  closed: 'secondary',
}

export default async function BuildingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const supabase = await createClient()

  const { data: building } = await supabase
    .from('buildings')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!building) notFound()

  const { data: slotsRaw } = await supabase
    .from('visit_slots')
    .select('id, datetime, duration_minutes, booked_by_client_id, booked_at')
    .eq('building_id', building.id)
    .order('datetime', { ascending: true })

  // Fetch client names for booked slots
  const bookedClientIds = (slotsRaw ?? [])
    .map(s => s.booked_by_client_id)
    .filter(Boolean) as string[]

  const { data: slotClients } = bookedClientIds.length > 0
    ? await supabase.from('clients').select('id, full_name, email').in('id', bookedClientIds)
    : { data: [] }

  const slotClientMap: Record<string, { full_name: string; email: string }> = {}
  ;(slotClients ?? []).forEach(c => { slotClientMap[c.id] = c })

  const slots = (slotsRaw ?? []).map(s => ({
    ...s,
    client: s.booked_by_client_id ? slotClientMap[s.booked_by_client_id] : null,
  }))

  const { data: matchesRaw } = await supabase
    .from('matches')
    .select('id, score, status, created_at, notified_at, client_id')
    .eq('building_id', building.id)
    .order('score', { ascending: false })

  // Fetch client data for matches
  const matchClientIds = (matchesRaw ?? []).map(m => m.client_id)
  const { data: matchClients } = matchClientIds.length > 0
    ? await supabase.from('clients').select('id, full_name, email, status').in('id', matchClientIds)
    : { data: [] }

  const matchClientMap: Record<string, { id: string; full_name: string; email: string; status: string }> = {}
  ;(matchClients ?? []).forEach(c => { matchClientMap[c.id] = c })

  const matches = (matchesRaw ?? []).map(m => ({
    ...m,
    client: matchClientMap[m.client_id] ?? null,
  }))

  const bookedCount = slots.filter(s => s.booked_by_client_id !== null).length
  const totalSlots = slots?.length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${locale}/admin/pisos`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Pisos
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">{building.name}</h1>
            <Badge variant={statusVariant[building.status] ?? 'outline'}>
              {statusLabel[building.status] ?? building.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {building.neighborhood}
            {building.address && ` · ${building.address}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/${locale}/admin/pisos/${building.slug}/editar`}>
              <Pencil className="mr-1 h-4 w-4" />
              Editar
            </Link>
          </Button>
          {building.status === 'published' ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/${locale}/visita/${building.slug}`} target="_blank">
                Ver página pública
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled
              title="Publica el piso para ver la página pública"
            >
              Ver página pública
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Fotos ({building.photos?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BuildingPhotoUpload
                buildingId={building.id}
                buildingSlug={building.slug}
                initialPhotos={building.photos ?? []}
              />
            </CardContent>
          </Card>

          {/* Matching */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Clientes emparejados ({matches?.length ?? 0})
                </CardTitle>
                <MatchTrigger buildingId={building.id} />
              </div>
            </CardHeader>
            <CardContent>
              <MatchNotifier
                matches={matches.map(m => ({
                  id: m.id,
                  score: m.score,
                  status: m.status,
                  notified_at: m.notified_at ?? null,
                  client: m.client ? { id: m.client.id, full_name: m.client.full_name, email: m.client.email } : null,
                }))}
                buildingId={building.id}
                buildingSlug={building.slug}
                locale={locale}
              />
            </CardContent>
          </Card>

          {/* Visit slots */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Slots de visita ({bookedCount}/{totalSlots} reservados)
                </CardTitle>
                <AddSlotForm buildingId={building.id} />
              </div>
            </CardHeader>
            <CardContent>
              {!slots || slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay slots todavía. Añade horarios para que los clientes puedan reservar visitas.
                </p>
              ) : (
                <div className="space-y-2">
                  {slots.map(slot => {
                    const dt = new Date(slot.datetime)
                    const bookedClient = slot.client
                    const isBooked = !!bookedClient
                    return (
                      <div
                        key={slot.id}
                        className={`flex items-center justify-between gap-3 rounded-md border p-3 ${
                          isBooked ? 'bg-muted/30' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isBooked ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-sm font-medium">
                              {dt.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                              {' '}
                              {dt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {isBooked && bookedClient && (
                              <p className="text-xs text-muted-foreground">
                                {bookedClient.full_name} · {bookedClient.email}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant={isBooked ? 'default' : 'outline'} className="text-xs">
                          {isBooked ? 'Reservado' : `${slot.duration_minutes} min`}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Detalles</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow label="Precio" value={`${building.price.toLocaleString('es-ES')} €/mes`} />
              <InfoRow label="Habitaciones" value={String(building.rooms)} />
              {building.bathrooms && <InfoRow label="Baños" value={String(building.bathrooms)} />}
              {building.size_sqm && <InfoRow label="Superficie" value={`${building.size_sqm} m²`} />}
              {building.floor !== null && <InfoRow label="Planta" value={String(building.floor)} />}
              <InfoRow label="Ascensor" value={building.has_elevator ? 'Sí' : 'No'} />
              <InfoRow label="Amueblado" value={building.furnished ? 'Sí' : 'No'} />
              {building.available_from && (
                <InfoRow
                  label="Disponible"
                  value={new Date(building.available_from).toLocaleDateString('es-ES')}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Solvencia</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {building.min_income && (
                <InfoRow label="Ingresos mín." value={`${building.min_income.toLocaleString('es-ES')} €/mes`} />
              )}
              <InfoRow label="Ratio solvencia" value={`x${building.min_solvency_ratio}`} />
              <div>
                <p className="text-muted-foreground">Perfiles</p>
                <p className="mt-0.5">
                  {(building.allowed_profiles ?? []).join(', ') || 'Todos'}
                </p>
              </div>
            </CardContent>
          </Card>

          {(building.real_estate_company || building.company_contact) && (
            <Card>
              <CardHeader><CardTitle className="text-base">Promotora</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {building.real_estate_company && (
                  <InfoRow label="Empresa" value={building.real_estate_company} />
                )}
                {building.company_contact && (
                  <InfoRow label="Contacto" value={building.company_contact} />
                )}
              </CardContent>
            </Card>
          )}
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
