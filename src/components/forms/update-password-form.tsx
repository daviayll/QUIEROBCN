'use client'

import { useActionState } from 'react'
import { updatePasswordAction, type ActionResult } from '@/actions/clients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export function UpdatePasswordForm({ locale }: { locale: string }) {
  const boundAction = updatePasswordAction.bind(null, locale)
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    boundAction,
    null
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva contraseña</CardTitle>
        <CardDescription>Elige una contraseña segura de al menos 8 caracteres.</CardDescription>
      </CardHeader>

      <form action={action}>
        <CardContent className="space-y-4">
          {state && !state.success && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className={state && !state.success && state.fieldErrors?.password ? 'border-destructive' : ''}
            />
            {state && !state.success && state.fieldErrors?.password && (
              <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm_password">Confirmar contraseña</Label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className={state && !state.success && state.fieldErrors?.confirm_password ? 'border-destructive' : ''}
            />
            {state && !state.success && state.fieldErrors?.confirm_password && (
              <p className="text-xs text-destructive">{state.fieldErrors.confirm_password[0]}</p>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar nueva contraseña'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
