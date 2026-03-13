import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, MapPin, Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function VisitasPage({
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
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!client) redirect(`/${locale}/login`)

  const now = new Date().toISOString()

  const [{ data: upcomingRaw }, { data: pastRaw }] = await Promise.all([
    supabase
      .from('visit_slots')
      .select('id, datetime, duration_minutes, building_id')
      .eq('booked_by_client_id', client.id)
      .gte('datetime', now)
      .order('datetime', { ascending: true }),
    supabase
      .from('visit_slots')
      .select('id, datetime, duration_minutes, building_id')
      .eq('booked_by_client_id', client.id)
      .lt('datetime', now)
      .order('datetime', { ascending: false })
      .limit(5),
  ])

  const allBuildingIds = [
    ...(upcomingRaw ?? []).map(s => s.building_id),
    ...(pastRaw ?? []).map(s => s.building_id),
  ]
  const uniqueBuildingIds = [...new Set(allBuildingIds)]
  const { data: buildings } = uniqueBuildingIds.length > 0
    ? await supabase.from('buildings').select('id, slug, name, neighborhood, address').in('id', uniqueBuildingIds)
    : { data: [] }

  const buildingMap: Record<string, { slug: string; name: string; neighborhood: string; address: string | null }> = {}
  ;(buildings ?? []).forEach(b => { buildingMap[b.id] = b })

  const slots = (upcomingRaw ?? []).map(s => ({ ...s, building: buildingMap[s.building_id] ?? null }))
  const pastSlots = (pastRaw ?? []).map(s => ({ ...s, building: buildingMap[s.building_id] ?? null }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Mis visitas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visitas confirmadas a pisos.
        </p>
      </div>

      {/* Upcoming */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Próximas visitas
        </h2>
        {!slots || slots.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No tienes visitas programadas. El agente te notificará cuando haya un piso disponible.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {slots.map(slot => {
              const building = slot.building
              const dt = new Date(slot.datetime)
              return (
                <Card key={slot.id}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{building?.name ?? 'Piso'}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {dt.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {dt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          {' '}({slot.duration_minutes} min)
                        </span>
                        {building?.neighborhood && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {building.neighborhood}
                          </span>
                        )}
                      </div>
                      {building?.address && (
                        <p className="text-xs text-muted-foreground">{building.address}</p>
                      )}
                    </div>
                    <Badge className="w-fit">Confirmada</Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Past visits */}
      {pastSlots && pastSlots.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Visitas realizadas
          </h2>
          <div className="space-y-3">
            {pastSlots.map(slot => {
              const building = slot.building
              const dt = new Date(slot.datetime)
              return (
                <Card key={slot.id} className="opacity-60">
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div>
                      <p className="text-sm font-medium">{building?.name ?? 'Piso'}</p>
                      <p className="text-xs text-muted-foreground">
                        {dt.toLocaleDateString('es-ES')} · {building?.neighborhood}
                      </p>
                    </div>
                    <Badge variant="outline">Realizada</Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Mostrando las últimas 5 visitas realizadas.</p>
        </section>
      )}
    </div>
  )
}
