import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { MapPin, Home, Bath, Square, CalendarDays, Building2 } from 'lucide-react'
import Image from 'next/image'
import SlotBooking from '@/components/client/slot-booking'

export default async function VisitaPublicPage({
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
    .eq('status', 'published')
    .single()

  if (!building) notFound()

  // Available (unbooked) slots in the future
  const { data: slots } = await supabase
    .from('visit_slots')
    .select('id, datetime, duration_minutes')
    .eq('building_id', building.id)
    .is('booked_by_client_id', null)
    .gte('datetime', new Date().toISOString())
    .order('datetime', { ascending: true })

  // Current user (may be null for unauthenticated visitors)
  const { data: { user } } = await supabase.auth.getUser()
  let clientId: string | null = null
  if (user) {
    const { data: client } = await supabase
      .from('clients')
      .select('id, status')
      .eq('user_id', user.id)
      .single()
    if (client?.status === 'active') {
      clientId = client.id
    }
  }

  let hasMatch = false
  if (clientId) {
    const { data: match } = await supabase
      .from('matches')
      .select('id')
      .eq('building_id', building.id)
      .eq('client_id', clientId)
      .maybeSingle()
    hasMatch = !!match
  }

  const description = locale === 'en' && building.description_en
    ? building.description_en
    : building.description_es

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-4 py-3">
        <div className="mx-auto max-w-4xl">
          <span className="font-display font-bold text-primary">QuieroBCN</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <h1 className="font-display text-3xl font-bold">{building.name}</h1>
            <div className="mt-2 flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{building.neighborhood}{building.address && ` · ${building.address}`}</span>
            </div>
          </div>

          {/* Photos */}
          {building.photos && building.photos.length > 0 ? (
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {building.photos.map((url, i) => (
                <div
                  key={url}
                  className={`relative overflow-hidden rounded-xl ${
                    i === 0 ? 'sm:col-span-2 sm:row-span-2 aspect-[4/3]' : 'aspect-[4/3]'
                  }`}
                >
                  <Image
                    src={url}
                    alt={`${building.name} — foto ${i + 1}`}
                    fill
                    priority={i === 0}
                    className="object-cover"
                    sizes={i === 0 ? '(max-width: 640px) 100vw, 66vw' : '(max-width: 640px) 100vw, 33vw'}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-xl bg-muted">
              <Building2 className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Details */}
            <div className="space-y-6 lg:col-span-2">
              {/* Key stats */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                  icon={<span className="text-lg font-bold text-primary">€</span>}
                  label="Renta mensual"
                  value={`${building.price.toLocaleString('es-ES')} €`}
                />
                <StatCard
                  icon={<Home className="h-5 w-5 text-muted-foreground" />}
                  label="Habitaciones"
                  value={String(building.rooms)}
                />
                {building.bathrooms && (
                  <StatCard
                    icon={<Bath className="h-5 w-5 text-muted-foreground" />}
                    label="Baños"
                    value={String(building.bathrooms)}
                  />
                )}
                {building.size_sqm && (
                  <StatCard
                    icon={<Square className="h-5 w-5 text-muted-foreground" />}
                    label="Superficie"
                    value={`${building.size_sqm} m²`}
                  />
                )}
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-2">
                {building.has_elevator && <Badge variant="secondary">Ascensor</Badge>}
                {building.furnished && <Badge variant="secondary">Amueblado</Badge>}
                {building.available_from && (
                  <Badge variant="outline">
                    Disponible {new Date(building.available_from).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-GB')}
                  </Badge>
                )}
              </div>

              {description && (
                <>
                  <Separator />
                  <div>
                    <h2 className="mb-2 font-semibold">Descripción</h2>
                    <p className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
                      {description}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Booking sidebar */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Reservar visita
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SlotBooking
                    slots={slots ?? []}
                    clientId={clientId}
                    locale={locale}
                    buildingSlug={slug}
                    hasMatch={hasMatch}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
