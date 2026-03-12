'use client'

import { useState, useActionState } from 'react'
import Link from 'next/link'
import { updateProfileAction, type ActionResult } from '@/actions/clients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'
import { BARCELONA_NEIGHBORHOODS } from '@/types'
import type { ClientPreferences, ProfileType } from '@/types'

const PROFILE_TYPES = [
  { value: 'empleado', label: 'Empleado/a' },
  { value: 'estudiante', label: 'Estudiante' },
  { value: 'autonomo', label: 'Autónomo/a' },
  { value: 'otro', label: 'Otro / Extranjero' },
]

interface EditProfileFormProps {
  locale: string
  defaultValues: {
    full_name: string
    email: string
    phone: string | null
    profile_type: ProfileType
    monthly_income: number | null
    status: string
    preferences: ClientPreferences
  }
}

export function EditProfileForm({ locale, defaultValues }: EditProfileFormProps) {
  const boundAction = updateProfileAction.bind(null, locale)
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    boundAction,
    null
  )

  const prefs = defaultValues.preferences

  const [profileType, setProfileType] = useState<string>(defaultValues.profile_type)
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>(
    prefs.preferred_neighborhoods ?? []
  )
  const [hasPets, setHasPets] = useState(prefs.has_pets ?? false)

  const toggleNeighborhood = (n: string) => {
    setSelectedNeighborhoods(prev =>
      prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]
    )
  }

  const profileTypeChanged = profileType !== defaultValues.profile_type
  const isVerifiedStatus = defaultValues.status === 'active' || defaultValues.status === 'inactive'
  const willTriggerReview = profileTypeChanged && isVerifiedStatus

  const vals = state && !state.success ? state.values : undefined

  return (
    <form action={action}>
      <div className="space-y-6">
        {state && !state.success && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        {willTriggerReview && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Al cambiar tu tipo de perfil, tu expediente volverá a estado{' '}
              <strong>En revisión</strong> para que el agente verifique tus nuevos documentos.
            </AlertDescription>
          </Alert>
        )}

        {/* Personal info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos personales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nombre completo *</Label>
              <Input
                id="full_name"
                name="full_name"
                required
                defaultValue={vals?.full_name ?? defaultValues.full_name}
                className={state && !state.success && state.fieldErrors?.full_name ? 'border-destructive' : ''}
              />
              {state && !state.success && state.fieldErrors?.full_name && (
                <p className="text-xs text-destructive">{state.fieldErrors.full_name[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Correo electrónico</Label>
              <Input value={defaultValues.email} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">
                El email no se puede cambiar desde aquí.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+34 612 345 678"
                defaultValue={vals?.phone ?? defaultValues.phone ?? ''}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Profile type & income */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Situación laboral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="profile_type">Tipo de perfil *</Label>
              <Select
                name="profile_type"
                required
                defaultValue={defaultValues.profile_type}
                onValueChange={setProfileType}
              >
                <SelectTrigger id="profile_type">
                  <SelectValue />
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

            <div className="space-y-1.5">
              <Label htmlFor="monthly_income">Ingresos mensuales netos (€)</Label>
              <Input
                id="monthly_income"
                name="monthly_income"
                type="number"
                min="0"
                step="50"
                placeholder="1800"
                defaultValue={vals?.monthly_income ?? defaultValues.monthly_income ?? ''}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preferencias de vivienda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  defaultValue={vals?.max_rent ?? prefs.max_rent ?? ''}
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
                  defaultValue={vals?.min_rooms ?? prefs.min_rooms ?? ''}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="move_in_date">Fecha de entrada deseada</Label>
              <Input
                id="move_in_date"
                name="move_in_date"
                type="date"
                defaultValue={vals?.move_in_date ?? prefs.move_in_date ?? ''}
              />
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
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button asChild variant="outline" type="button">
            <Link href={`/${locale}/perfil`}>Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </form>
  )
}
