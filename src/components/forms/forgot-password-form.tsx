'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { forgotPasswordAction, type ActionResult } from '@/actions/clients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export function ForgotPasswordForm({ locale }: { locale: string }) {
  const boundAction = forgotPasswordAction.bind(null, locale)
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    boundAction,
    null
  )

  if (state?.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revisa tu correo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{state.message}</p>
        </CardContent>
        <CardFooter>
          <Link href={`/${locale}/login`} className="text-sm text-primary hover:underline">
            Volver a iniciar sesión
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>¿Olvidaste tu contraseña?</CardTitle>
        <CardDescription>
          Introduce tu email y te enviaremos un enlace para restablecerla.
        </CardDescription>
      </CardHeader>

      <form action={action}>
        <CardContent className="space-y-4">
          {state && !state.success && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="tu@email.com"
              className={state && !state.success && state.fieldErrors?.email ? 'border-destructive' : ''}
            />
            {state && !state.success && state.fieldErrors?.email && (
              <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Enviando...' : 'Enviar enlace'}
          </Button>
          <Link href={`/${locale}/login`} className="text-sm text-muted-foreground hover:underline">
            Volver a iniciar sesión
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
