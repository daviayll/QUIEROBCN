import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logoutAction } from '@/actions/clients'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import MobileNav from '@/components/client/mobile-nav'

const statusLabel: Record<string, string> = {
  unverified: 'Sin verificar',
  uploading: 'Documentos pendientes',
  pending_review: 'En revisión',
  active: 'Activo',
  inactive: 'Inactivo',
}

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  unverified: 'outline',
  uploading: 'secondary',
  pending_review: 'secondary',
  active: 'default',
  inactive: 'destructive',
}

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: client } = await supabase
    .from('clients')
    .select('full_name, status')
    .eq('user_id', user.id)
    .single()

  const logoutWithLocale = logoutAction.bind(null, locale)

  const navLinks = [
    { href: `/${locale}/documentos`, label: 'Mis documentos' },
    { href: `/${locale}/perfil`, label: 'Mi perfil' },
    { href: `/${locale}/visitas`, label: 'Mis visitas' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <MobileNav navLinks={navLinks} />
            <Link href={`/${locale}/documentos`} className="font-display font-bold text-primary">
              QuieroBCN
            </Link>
            <nav className="hidden gap-4 sm:flex">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {client && (
              <Badge
                variant={statusVariant[client.status] ?? 'outline'}
                title={client.status === 'inactive' ? 'Tu perfil está pendiente de activación por la administradora' : undefined}
              >
                {statusLabel[client.status] ?? client.status}
              </Badge>
            )}
            <form action={logoutWithLocale}>
              <Button variant="ghost" size="sm" type="submit">
                Salir
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
