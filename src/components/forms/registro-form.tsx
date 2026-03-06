'use client'

import { useState, useActionState } from 'react'
import Link from 'next/link'
import { registerAction, type ActionResult } from '@/actions/clients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { BARCELONA_NEIGHBORHOODS } from '@/types'

const PROFILE_TYPES = [
  { value: 'empleado', label: 'Empleado/a' },
  { value: 'estudiante', label: 'Estudiante' },
  { value: 'autonomo', label: 'Autónomo/a' },
  { value: 'otro', label: 'Otro / Extranjero' },
]

export function RegistroForm({ locale }: { locale: string }) {
  const boundAction = registerAction.bind(null, locale)
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    boundAction,
    null
  )

  const [profileType, setProfileType] = useState('')
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([])
  const [hasPets, setHasPets] = useState(false)

  const toggleNeighborhood = (n: string) => {
    setSelectedNeighborhoods(prev =>
      prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear tu perfil</CardTitle>
        <CardDescription>
          Cuéntanos quién eres para encontrar tu piso ideal en Barcelona.
        </CardDescription>
      </CardHeader>

      <form action={action}>
        <CardContent className="space-y-6">
          {state && !state.success && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {/* Personal info */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nombre completo *</Label>
              <Input id="full_name" name="full_name" required placeholder="Ana García López" />
              {state && !state.success && state.fieldErrors?.full_name && (
                <p className="text-xs text-destructive">{state.fieldErrors.full_name[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico *</Label>
              <Input id="email" name="email" type="email" required placeholder="ana@email.com" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña *</Label>
              <Input id="password" name="password" type="password" required
                placeholder="Mínimo 8 caracteres" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" type="tel" placeholder="+34 612 345 678" />
            </div>
          </div>

          <Separator />

          {/* Profile type */}
          <div className="space-y-1.5">
            <Label htmlFor="profile_type">Situación laboral *</Label>
            <Select
              name="profile_type"
              required
              onValueChange={setProfileType}
            >
              <SelectTrigger id="profile_type">
                <SelectValue placeholder="Selecciona tu perfil" />
              </SelectTrigger>
              <SelectContent>
                {PROFILE_TYPES.map(p => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {profileType && (
            <div className="space-y-1.5">
              <Label htmlFor="monthly_income">Ingresos mensuales netos (€)</Label>
              <Input
                id="monthly_income"
                name="monthly_income"
                type="number"
                min="0"
                step="50"
                placeholder="1800"
              />
            </div>
          )}

          <Separator />

          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Preferencias de vivienda</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="max_rent">Presupuesto máximo (€/mes) *</Label>
                <Input
                  id="max_rent"
                  name="max_rent"
                  type="number"
                  min="0"
                  step="50"
                  placeholder="1200"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="min_rooms">Habitaciones mínimas</Label>
                <Input
                  id="min_rooms"
                  name="min_rooms"
                  type="number"
                  min="1"
                  max="6"
                  placeholder="2"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="move_in_date">Fecha de entrada deseada</Label>
              <Input id="move_in_date" name="move_in_date" type="date" />
            </div>

            <div className="space-y-2">
              <Label>Barrios preferidos</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-md border p-3">
                {BARCELONA_NEIGHBORHOODS.map(n => (
                  <div key={n} className="flex items-center gap-2">
                    <Checkbox
                      id={`n-${n}`}
                      checked={selectedNeighborhoods.includes(n)}
                      onCheckedChange={() => toggleNeighborhood(n)}
                    />
                    {/* Hidden inputs to send selected neighborhoods in FormData */}
                    {selectedNeighborhoods.includes(n) && (
                      <input type="hidden" name="preferred_neighborhoods" value={n} />
                    )}
                    <label htmlFor={`n-${n}`} className="text-sm cursor-pointer">
                      {n}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="has_pets"
                checked={hasPets}
                onCheckedChange={v => setHasPets(!!v)}
              />
              <input type="hidden" name="has_pets" value={hasPets ? 'true' : 'false'} />
              <label htmlFor="has_pets" className="text-sm cursor-pointer">
                Tengo mascotas
              </label>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Creando tu perfil...' : 'Crear mi perfil'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link href={`/${locale}/login`} className="text-primary hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
