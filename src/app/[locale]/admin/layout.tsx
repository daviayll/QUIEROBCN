import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logoutAction } from '@/actions/clients'
import { Button } from '@/components/ui/button'
import { Users, Building2, LayoutDashboard } from 'lucide-react'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    redirect(`/${locale}/login`)
  }

  const logoutWithLocale = logoutAction.bind(null, locale)

  const navLinks = [
    { href: `/${locale}/admin/clientes`, label: 'Clientes', icon: Users },
    { href: `/${locale}/admin/pisos`, label: 'Pisos', icon: Building2 },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href={`/${locale}/admin/clientes`} className="font-display font-bold text-primary">
              QuieroBCN <span className="text-xs font-normal text-muted-foreground">Admin</span>
            </Link>
            <nav className="flex gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <form action={logoutWithLocale}>
            <Button variant="ghost" size="sm" type="submit">
              Salir
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  )
}
