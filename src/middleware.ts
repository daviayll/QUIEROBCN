import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'
import { updateSession } from './lib/supabase/middleware'

const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static assets, API routes, and auth callback
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth/callback') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Refresh Supabase session and get user
  const { supabaseResponse, user } = await updateSession(request)

  // Determine if path is admin route (after locale prefix)
  const isAdminRoute = /^\/(es|en)\/(admin)/.test(pathname)
  const isClientRoute = /^\/(es|en)\/(perfil|documentos|visitas)/.test(pathname)
  const isAuthRoute = /^\/(es|en)\/(login|registro|verificar-email|olvide-contrasena)/.test(pathname)

  // Protect admin routes
  if (isAdminRoute) {
    if (!user) {
      const loginUrl = new URL(`/${pathname.split('/')[1]}/login`, request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
    const isAdmin = user.app_metadata?.role === 'admin'
    if (!isAdmin) {
      return NextResponse.redirect(new URL(`/${pathname.split('/')[1]}/login`, request.url))
    }
  }

  // Protect client routes
  if (isClientRoute && !user) {
    const loginUrl = new URL(`/${pathname.split('/')[1]}/login`, request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && user) {
    const isAdmin = user.app_metadata?.role === 'admin'
    const locale = pathname.split('/')[1]
    return NextResponse.redirect(
      new URL(isAdmin ? `/${locale}/admin` : `/${locale}/perfil`, request.url)
    )
  }

  // Apply intl middleware for locale routing
  const intlResponse = intlMiddleware(request)
  if (intlResponse) return intlResponse

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
