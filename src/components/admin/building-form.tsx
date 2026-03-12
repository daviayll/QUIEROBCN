'use client'

import { useActionState, useState } from 'react'
import { createBuilding, type ActionResult } from '@/actions/buildings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BARCELONA_NEIGHBORHOODS } from '@/types'

const PROFILE_OPTIONS = [
  { value: 'empleado', label: 'Empleado/a' },
  { value: 'estudiante', label: 'Estudiante' },
  { value: 'autonomo', label: 'Autónomo/a' },
  { value: 'otro', label: 'Otro / Extranjero' },
]

export default function BuildingForm({ locale }: { locale: string }) {
  const boundAction = createBuilding.bind(null, locale)
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    boundAction,
    null
  )

  const [hasElevator, setHasElevator] = useState(false)
  const [furnished, setFurnished] = useState(false)
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>(['empleado', 'autonomo', 'otro'])

  const toggleProfile = (p: string) =>
    setSelectedProfiles(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )

  const slugify = (v: string) =>
    v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 60)

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
                placeholder="Eixample Luminoso 3BR"
                onChange={e => {
                  const slugInput = document.getElementById('slug') as HTMLInputElement | null
                  if (slugInput) slugInput.value = slugify(e.target.value)
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="eixample-luminoso-3br"
              />
              <p className="text-xs text-muted-foreground">Solo minúsculas, números y guiones</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="neighborhood">Barrio *</Label>
              <Select name="neighborhood">
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona barrio" />
                </SelectTrigger>
                <SelectContent>
                  {BARCELONA_NEIGHBORHOODS.map(n => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" placeholder="Carrer de Provença, 123" />
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
              <Input id="price" name="price" type="number" min="0" placeholder="1500" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rooms">Habitaciones *</Label>
              <Input id="rooms" name="rooms" type="number" min="1" placeholder="3" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bathrooms">Baños</Label>
              <Input id="bathrooms" name="bathrooms" type="number" min="0" placeholder="1" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="size_sqm">Superficie (m²)</Label>
              <Input id="size_sqm" name="size_sqm" type="number" min="0" placeholder="80" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="floor">Planta</Label>
              <Input id="floor" name="floor" type="number" min="0" placeholder="3" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="available_from">Disponible desde</Label>
              <Input id="available_from" name="available_from" type="date" />
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
              <Input id="min_income" name="min_income" type="number" min="0" placeholder="3000" />
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
                defaultValue="3"
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
              <Input id="real_estate_company" name="real_estate_company" placeholder="Promotora Barcelonesa SL" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company_contact">Contacto</Label>
              <Input id="company_contact" name="company_contact" placeholder="contacto@promotora.com" />
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
              placeholder="Piso luminoso en el corazón del Eixample..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description_en">Descripción (inglés)</Label>
            <Textarea
              id="description_en"
              name="description_en"
              rows={4}
              placeholder="Bright apartment in the heart of Eixample..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Select name="status" defaultValue="draft">
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Guardar como borrador</SelectItem>
            <SelectItem value="published">Publicar</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Crear piso'}
        </Button>
      </div>
    </form>
  )
}
