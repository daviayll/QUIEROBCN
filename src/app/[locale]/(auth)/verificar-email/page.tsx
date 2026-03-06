import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function VerificarEmailPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revisa tu correo</CardTitle>
        <CardDescription>
          Te hemos enviado un enlace de confirmación.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <div className="rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center mx-auto">
          <span className="text-3xl">✉️</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Hemos enviado un enlace de confirmación a tu correo electrónico.
          Haz clic en el enlace para activar tu cuenta y empezar a subir tus documentos.
        </p>
        <p className="text-xs text-muted-foreground">
          ¿No lo ves? Revisa la carpeta de spam.
        </p>
        <Button variant="outline" asChild className="w-full">
          <Link href={`/${locale}/login`}>Volver al inicio de sesión</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
