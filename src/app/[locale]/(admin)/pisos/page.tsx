import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Plus, Users } from 'lucide-react'

const statusLabel: Record<string, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  closed: 'Cerrado',
}
const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'outline',
  published: 'default',
  closed: 'secondary',
}

export default async function PisosPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()

  const { data: buildings } = await supabase
    .from('buildings')
    .select('id, slug, name, neighborhood, price, rooms, status, created_at')
    .order('created_at', { ascending: false })

  // Count matches per building
  const { data: matchCounts } = await supabase
    .from('matches')
    .select('building_id')
    .in('status', ['pending', 'notified'])

  const matchByBuilding: Record<string, number> = {}
  ;(matchCounts ?? []).forEach(m => {
    matchByBuilding[m.building_id] = (matchByBuilding[m.building_id] ?? 0) + 1
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Pisos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {buildings?.length ?? 0} pisos registrados
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/admin/pisos/nuevo`}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo piso
          </Link>
        </Button>
      </div>

      {!buildings || buildings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No hay pisos todavía.</p>
            <Button asChild>
              <Link href={`/${locale}/admin/pisos/nuevo`}>Añadir primer piso</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {buildings.map(b => (
            <Link key={b.id} href={`/${locale}/admin/pisos/${b.slug}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-medium leading-tight">{b.name}</h2>
                    <Badge variant={statusVariant[b.status] ?? 'outline'}>
                      {statusLabel[b.status] ?? b.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{b.neighborhood}</span>
                    <span>·</span>
                    <span>{b.rooms} hab.</span>
                    <span>·</span>
                    <span>{b.price.toLocaleString('es-ES')} €/mes</span>
                  </div>
                  {matchByBuilding[b.id] > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-primary">
                      <Users className="h-3.5 w-3.5" />
                      {matchByBuilding[b.id]} clientes emparejados
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
