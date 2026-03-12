'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateBuilding, type ActionResult } from '@/actions/buildings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Save } from 'lucide-react'
import { BARCELONA_NEIGHBORHOODS } from '@/types'
import { useEffect } from 'react'

const PROFILE_OPTIONS = [
  { value: 'empleado', label: 'Empleado/a' },
  { value: 'estudiante', label: 'Estudiante' },
  { value: 'autonomo', label: 'Autónomo/a' },
  { value: 'otro', label: 'Otro / Extranjero' },
]

interface Building {
  id: string
  name: string
  slug: string
  neighborhood: string
  address?: string | null
  price: number
  rooms: number
  bathrooms?: number | null
  size_sqm?: number | null
  floor?: number | null
  has_elevator: boolean
  furnished: boolean
  min_income?: number | null
  min_solvency_ratio: number
  allowed_profiles: string[]
  available_from?: string | null
  description_es?: string | null
  description_en?: string | null
  real_estate_company?: string | null
  company_contact?: string | null
  status: string
}

export default function BuildingEditForm({
  building,
  locale,
}: {
  building: Building
  locale: string
}) {
  const router = useRouter()
  const boundAction = updateBuilding.bind(null, building.id, locale)
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    boundAction,
    null
  )

  const [hasElevator, setHasElevator] = useState(building.has_elevator)
  const [furnished, setFurnished] = useState(building.furnished)
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>(
    building.allowed_profiles ?? []
  )

  const toggleProfile = (p: string) =>
    setSelectedProfiles(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )

  // Redirect to new slug on success
  useEffect(() => {
    if (state?.success) {
      router.push(`/${locale}/admin/pisos/${state.slug}`)
    }
  }, [state, locale, router])

  const availableFromValue = building.available_from
    ? building.available_from.substring(0, 10)
    : ''

  return (
    <form action={action} className="space-y-6">
      {state && !state.success && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Información básica</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre del piso *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={building.name}
                className={state?.success === false && state.fieldErrors?.name ? 'border-destructive' : ''}
              />
              {state?.success === false && state.fieldErrors?.name && (
                <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={building.slug}
                className={state?.success === false && state.fieldErrors?.slug ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground">Solo minúsculas, números y guiones</p>
              {state?.success === false && state.fieldErrors?.slug && (
                <p className="text-xs text-destructive">{state.fieldErrors.slug[0]}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="neighborhood">Barrio *</Label>
              <Select name="neighborhood" defaultValue={building.neighborhood}>
                <SelectTrigger className={state?.success === false && state.fieldErrors?.neighborhood ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecciona barrio" />
                </SelectTrigger>
                <SelectContent>
                  {BARCELONA_NEIGHBORHOODS.map(n => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state?.success === false && state.fieldErrors?.neighborhood && (
                <p className="text-xs text-destructive">{state.fieldErrors.neighborhood[0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" defaultValue={building.address ?? ''} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Detalles del piso</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">Precio (€/mes) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                defaultValue={building.price}
                className={state?.success === false && state.fieldErrors?.price ? 'border-destructive' : ''}
              />
              {state?.success === false && state.fieldErrors?.price && (
                <p className="text-xs text-destructive">{state.fieldErrors.price[0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rooms">Habitaciones *</Label>
              <Input
                id="rooms"
                name="rooms"
                type="number"
                min="1"
                defaultValue={building.rooms}
                className={state?.success === false && state.fieldErrors?.rooms ? 'border-destructive' : ''}
              />
              {state?.success === false && state.fieldErrors?.rooms && (
                <p className="text-xs text-destructive">{state.fieldErrors.rooms[0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bathrooms">Baños</Label>
              <Input id="bathrooms" name="bathrooms" type="number" min="0" defaultValue={building.bathrooms ?? ''} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="size_sqm">Superficie (m²)</Label>
              <Input id="size_sqm" name="size_sqm" type="number" min="0" defaultValue={building.size_sqm ?? ''} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="floor">Planta</Label>
              <Input id="floor" name="floor" type="number" min="0" defaultValue={building.floor ?? ''} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="available_from">Disponible desde</Label>
              <Input id="available_from" name="available_from" type="date" defaultValue={availableFromValue} />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="has_elevator"
                checked={hasElevator}
                onCheckedChange={v => setHasElevator(!!v)}
              />
              <input type="hidden" name="has_elevator" value={hasElevator ? 'true' : 'false'} />
              <Label htmlFor="has_elevator">Ascensor</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="furnished"
                checked={furnished}
                onCheckedChange={v => setFurnished(!!v)}
              />
              <input type="hidden" name="furnished" value={furnished ? 'true' : 'false'} />
              <Label htmlFor="furnished">Amueblado</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Requisitos de solvencia</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="min_income">Ingresos mínimos (€/mes)</Label>
              <Input id="min_income" name="min_income" type="number" min="0" defaultValue={building.min_income ?? ''} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="min_solvency_ratio">Ratio de solvencia mínimo</Label>
              <Input
                id="min_solvency_ratio"
                name="min_solvency_ratio"
                type="number"
                min="1"
                max="10"
                step="0.5"
                defaultValue={building.min_solvency_ratio}
              />
              <p className="text-xs text-muted-foreground">Ingresos / precio alquiler (3 = estándar)</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Perfiles aceptados</Label>
            <div className="flex flex-wrap gap-4">
              {PROFILE_OPTIONS.map(p => (
                <div key={p.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`profile_${p.value}`}
                    checked={selectedProfiles.includes(p.value)}
                    onCheckedChange={() => toggleProfile(p.value)}
                  />
                  {selectedProfiles.includes(p.value) && (
                    <input type="hidden" name="allowed_profiles" value={p.value} />
                  )}
                  <Label htmlFor={`profile_${p.value}`}>{p.label}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Promotora inmobiliaria</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="real_estate_company">Empresa</Label>
              <Input id="real_estate_company" name="real_estate_company" defaultValue={building.real_estate_company ?? ''} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company_contact">Contacto</Label>
              <Input id="company_contact" name="company_contact" defaultValue={building.company_contact ?? ''} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Descripción</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="description_es">Descripción (español)</Label>
            <Textarea
              id="description_es"
              name="description_es"
              rows={4}
              defaultValue={building.description_es ?? ''}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description_en">Descripción (inglés)</Label>
            <Textarea
              id="description_en"
              name="description_en"
              rows={4}
              defaultValue={building.description_en ?? ''}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Select name="status" defaultValue={building.status}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Borrador</SelectItem>
            <SelectItem value="published">Publicado</SelectItem>
            <SelectItem value="closed">Cerrado</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={isPending}>
          <Save className="mr-1.5 h-4 w-4" />
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}
