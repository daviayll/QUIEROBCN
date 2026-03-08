---
name: nextjs-app-router
description: "Next.js 15 App Router patterns, architecture rules, and best practices. Use when: creating new pages/layouts/routes, deciding Server vs Client components, implementing data fetching, setting up middleware, handling forms with Server Actions, configuring i18n with next-intl, or reviewing route structure. Covers: file-system routing, parallel routes, intercepting routes, Suspense, error boundaries, loading states, route handlers, and deployment to Vercel."
---

# Next.js 15 App Router — Patterns & Best Practices

## Core Mental Model

**Default to Server Components.** Only add `"use client"` when you need:
- Browser APIs (`window`, `localStorage`, `navigator`)
- React hooks (`useState`, `useEffect`, `useRef`)
- Event listeners (`onClick`, `onChange`, etc.)
- Third-party client-only libraries

Everything else stays on the server: data fetching, auth checks, DB queries, heavy logic.

---

## File-System Routing Conventions

```
app/
  layout.tsx          # Root layout (html, body tags here)
  page.tsx            # Home page (/)
  loading.tsx         # Suspense fallback for this segment
  error.tsx           # Error boundary ("use client" required)
  not-found.tsx       # 404 for this segment

  [locale]/           # Dynamic segment → next-intl locale param
    layout.tsx        # Locale layout (IntlProvider)
    (auth)/           # Route group — no URL segment
      login/page.tsx  # → /es/login
      registro/page.tsx
    (client)/
      perfil/page.tsx
      documentos/page.tsx
    (admin)/
      page.tsx        # Admin dashboard
      clientes/page.tsx
      pisos/page.tsx
    visita/
      [slug]/
        page.tsx      # Public booking page
```

### Route Groups `(name)`
- Group routes without affecting URL
- Apply different layouts to different sections
- Use for: `(auth)`, `(client)`, `(admin)`, `(public)`

### Dynamic Segments `[param]`
- Access via `params` prop: `{ params: { slug: string } }`
- In Next.js 15, `params` is a Promise: `const { slug } = await params`

---

## Data Fetching Rules

### In Server Components (preferred)
```typescript
// Direct async/await in the component — no useEffect, no useState
export default async function ClientesPage() {
  const supabase = await createServerClient()
  const { data: clients } = await supabase.from('clients').select('*')
  return <ClientTable clients={clients} />
}
```

### Server Actions (forms and mutations)
```typescript
// actions.ts — mark with "use server"
"use server"
import { revalidatePath } from 'next/cache'

export async function activateClient(clientId: string) {
  const supabase = await createServerClient()
  await supabase.from('clients').update({ status: 'active' }).eq('id', clientId)
  revalidatePath('/admin/clientes')
}
```

### Client-side data (when needed)
Use `@tanstack/react-query` for client-side fetching. Avoid `useEffect` + `fetch` directly.

---

## Suspense & Loading States

Always wrap async Server Components in Suspense for better UX:
```typescript
// page.tsx
import { Suspense } from 'react'
import { ClientTableSkeleton } from '@/components/skeletons'

export default function Page() {
  return (
    <Suspense fallback={<ClientTableSkeleton />}>
      <ClientList /> {/* async Server Component */}
    </Suspense>
  )
}
```

Use `loading.tsx` for route-level loading UI (automatic Suspense wrapping).

---

## Middleware (Auth & i18n)

```typescript
// middleware.ts — runs on EVERY request before rendering
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'

export async function middleware(request: NextRequest) {
  // 1. Handle i18n routing first
  const intlResponse = intlMiddleware(request)

  // 2. Protect /admin routes
  if (request.nextUrl.pathname.includes('/admin')) {
    const supabase = createServerClient(/* ... */)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.redirect(new URL('/login', request.url))
    // Check admin role
    const isAdmin = session.user.user_metadata?.role === 'admin'
    if (!isAdmin) return NextResponse.redirect(new URL('/', request.url))
  }

  return intlResponse
}

export const config = {
  matcher: ['/((?!_next|api|favicon).*)']
}
```

---

## Route Handlers (API endpoints)

```typescript
// app/api/export/[clientId]/route.ts
import { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  // Generate ZIP, return as stream
  return new Response(zipStream, {
    headers: { 'Content-Type': 'application/zip' }
  })
}
```

Use Route Handlers for: file downloads, webhooks, third-party callbacks.
Use Server Actions for: form submissions, mutations, button clicks.

---

## next-intl Setup (i18n)

```typescript
// i18n/routing.ts
import { defineRouting } from 'next-intl/routing'
export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es'
})
```

Message files:
```
messages/
  es.json   # Spanish (primary)
  en.json   # English
```

Usage in Server Components:
```typescript
import { getTranslations } from 'next-intl/server'
const t = await getTranslations('ClientProfile')
```

Usage in Client Components:
```typescript
import { useTranslations } from 'next-intl'
const t = useTranslations('ClientProfile')
```

---

## Error Handling

```typescript
// error.tsx — must be "use client"
"use client"
export default function Error({ error, reset }) {
  return (
    <div>
      <p>Algo salió mal.</p>
      <button onClick={() => reset()}>Intentar de nuevo</button>
    </div>
  )
}
```

---

## Next.js 15 — Key Changes from v14

- `params` and `searchParams` are now **Promises** → always `await params`
- `fetch` caching is **opt-in** (no default caching — add `{ cache: 'force-cache' }` when needed)
- `next/dynamic` with SSR disabled is the proper pattern for client-only libs
- React 19 is the default — use new `use()` hook for promise unwrapping when appropriate

---

## Performance Rules

- Colocate Server Components to avoid prop-drilling
- Use `generateStaticParams` for known dynamic routes (e.g., `/visita/[slug]`)
- Add `export const dynamic = 'force-static'` to purely static pages
- Use `next/image` for ALL images (auto-optimization, WebP, lazy loading)
- Keep Client Component trees shallow — push `"use client"` as far down the tree as possible

---

## Folder Conventions for This Project

```
src/
  app/[locale]/
    (auth)/login/page.tsx
    (auth)/registro/page.tsx
    (client)/perfil/page.tsx
    (client)/documentos/page.tsx
    (client)/visitas/page.tsx
    (admin)/page.tsx              # dashboard
    (admin)/clientes/page.tsx
    (admin)/clientes/[id]/page.tsx
    (admin)/pisos/page.tsx
    (admin)/pisos/nuevo/page.tsx
    visita/[slug]/page.tsx        # PUBLIC — no auth
  components/
    ui/          # shadcn/ui (never modify directly)
    forms/       # react-hook-form + zod forms
    admin/       # admin-specific components
    client/      # client portal components
    shared/      # used in both portals
  lib/
    supabase/    # client.ts, server.ts, middleware.ts helpers
  actions/       # all Server Actions grouped by domain
    clients.ts
    buildings.ts
    bookings.ts
  types/
    database.ts  # generated from Supabase (supabase gen types)
```
