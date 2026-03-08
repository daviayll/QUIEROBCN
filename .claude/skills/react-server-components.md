---
name: react-server-components
description: "React Server Components (RSC) mental model and patterns for Next.js 15. Use when deciding where to put logic, choosing between server and client rendering, composing RSC with Client Components, handling data in components, or debugging hydration errors. Covers: RSC vs Client boundary decisions, composition patterns, data flow, streaming, common mistakes."
---

# React Server Components — Mental Model for Next.js 15

## The Fundamental Rule

**Server Components run on the server. Client Components run on both server (SSR) and browser.**

```
Server Component         Client Component
─────────────────        ─────────────────
async/await ✅           useState ✅
Direct DB access ✅       useEffect ✅
No bundle size ✅         onClick, onChange ✅
No interactivity ❌       Browser APIs ✅
No hooks ❌               Can import server comp ❌
```

---

## Decision Tree: Server or Client?

```
Does it need useState or useReducer?          → Client
Does it need useEffect?                       → Client
Does it listen to browser events?             → Client
Does it use browser-only APIs?                → Client
Does it use a client-only library?            → Client
Does it need to fetch data or hit the DB?     → Server
Does it just render UI from props?            → Server (default)
```

When in doubt: **start Server, move to Client only if blocked**.

---

## The Boundary Pattern

Never import a Server Component inside a Client Component. Instead, **pass it as children (or props)**:

```typescript
// ❌ WRONG — breaks RSC
"use client"
import ServerComponent from './ServerComponent' // Error!

// ✅ CORRECT — composition via children
"use client"
export function ClientWrapper({ children }) {
  const [open, setOpen] = useState(false)
  return <div onClick={() => setOpen(!open)}>{children}</div>
}

// Then in a Server Component parent:
<ClientWrapper>
  <ServerComponent /> {/* This works! */}
</ClientWrapper>
```

---

## Data Fetching Patterns

### Pattern 1: Fetch at the top, pass down (avoid waterfall)
```typescript
// page.tsx (Server Component)
export default async function ClientesPage() {
  // Parallel fetching — not sequential
  const [clients, stats] = await Promise.all([
    getClients(),
    getStats()
  ])
  return (
    <>
      <StatsBar stats={stats} />
      <ClientTable clients={clients} />
    </>
  )
}
```

### Pattern 2: Colocation with Suspense (streaming)
```typescript
// page.tsx
export default function Page() {
  return (
    <>
      <Header /> {/* Renders immediately */}
      <Suspense fallback={<Skeleton />}>
        <SlowDataComponent /> {/* Streams in when ready */}
      </Suspense>
    </>
  )
}

// SlowDataComponent.tsx (Server Component)
async function SlowDataComponent() {
  const data = await fetchSlowData() // Doesn't block the page
  return <div>{data}</div>
}
```

### Pattern 3: Client Component with Server-fetched initial data
```typescript
// Server Component passes data as props to Client Component
export default async function BuildingPage() {
  const building = await getBuilding(slug)
  return <BookingCalendar building={building} /> // Client Component
}

// BookingCalendar.tsx
"use client"
export function BookingCalendar({ building }) {
  const [selectedSlot, setSelectedSlot] = useState(null)
  // Interactive booking UI
}
```

---

## Common Mistakes to Avoid

### 1. Serialization errors
Only serializable data can be passed from Server to Client Components:
```typescript
// ❌ Can't pass functions, class instances, Date objects directly
<ClientComponent onClick={serverFunction} /> // Error

// ✅ Pass primitives and plain objects
<ClientComponent data={JSON.parse(JSON.stringify(complexObj))} />
// Or use Server Actions for callbacks
<ClientComponent onSubmit={serverAction} /> // Server Actions are OK
```

### 2. Context in Server Components
React Context doesn't work in Server Components:
```typescript
// ❌ Won't work
const theme = useContext(ThemeContext) // In a Server Component

// ✅ Use cookies/headers for server-side "context"
const theme = (await cookies()).get('theme')?.value
```

### 3. The "use client" blast radius
Marking a component `"use client"` makes ALL its imports client-side too:
```typescript
// ❌ This pulls the entire tree into the client bundle
"use client"
import HeavyChart from './HeavyChart' // Also becomes client-side!

// ✅ Use dynamic import for heavy client-only components
import dynamic from 'next/dynamic'
const HeavyChart = dynamic(() => import('./HeavyChart'), { ssr: false })
```

### 4. Async Client Components
Client Components cannot be async:
```typescript
// ❌ Not allowed
"use client"
export async function ClientComponent() { ... }

// ✅ Use useEffect or React Query for client-side async
"use client"
export function ClientComponent() {
  const { data } = useQuery({ queryKey: ['data'], queryFn: fetchData })
}
```

---

## Supabase in RSC Context

```typescript
// lib/supabase/server.ts — for Server Components & Server Actions
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options))
        }
      }
    }
  )
}

// lib/supabase/client.ts — for Client Components only
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Rule:** Never use the browser client in a Server Component. Never use the server client in a Client Component.

---

## When to Use Each Pattern in QUIEROBCN

| Feature | Pattern |
|---------|---------|
| Admin client list page | Server Component with async fetch |
| Client profile form | Client Component (useState + react-hook-form) |
| Document upload | Client Component (File API) |
| Building gallery | Server Component (images from Supabase) |
| Booking calendar | Client Component (interactive slot selection) |
| Match & notify button | Server Action (mutation + n8n webhook) |
| Document export | Route Handler (file download stream) |
| Stats dashboard | Server Component with parallel Promise.all |
| Auth session check | Middleware + Server Component |

---

## Streaming & Partial Rendering

For pages with slow data (e.g., admin dashboard with complex stats):
```typescript
export default function AdminDashboard() {
  return (
    <div>
      {/* Fast — renders immediately */}
      <DashboardHeader />

      {/* Slow — streams in */}
      <Suspense fallback={<StatsSkeleton />}>
        <MatchStats /> {/* Counts matches, complex query */}
      </Suspense>

      <Suspense fallback={<ClientListSkeleton />}>
        <RecentClients /> {/* Latest signups */}
      </Suspense>
    </div>
  )
}
```

This gives users something to see immediately while slow data loads.
