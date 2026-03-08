---
name: quierobcn-dev
description: "Complete development context for the QUIEROBCN real estate matching platform. Load at the START of every coding session. Combines business rules, technical architecture, stack decisions, folder structure, DB schema, and anti-patterns into a single reference. Use when: building any feature, writing DB schemas, creating components, implementing auth, designing APIs, or making architectural decisions for this project."
---

# QUIEROBCN — Complete Dev Context

## Business in 60 Seconds

A Barcelona real estate **matching platform** for a solo agent (admin). She bridges:
- **Clients** (apartment seekers) — register, upload docs, get matched to buildings
- **Promotoras** (real estate companies) — provide buildings + visit slots

**Core flow:**
1. Client registers → chooses profile type → uploads required docs
2. Admin reviews docs → manually activates client profile
3. Admin uploads building + visit slots → clicks "Match & Notify"
4. System auto-matches active clients → sends WhatsApp with booking link
5. Client visits `/visita/[slug]` → books a visit slot (atomic, no double-booking)
6. When client applies → admin exports their docs as ZIP → sends to promotora

---

## Client Profile Types & Required Documents

| Profile | Required Documents |
|---------|-------------------|
| **empleado** | DNI/NIE, contrato de trabajo, 3 nóminas, vida laboral |
| **estudiante** | DNI/NIE/Pasaporte, matrícula universitaria, comprobación de ahorros |
| **autonomo** | DNI/NIE, declaración de la renta, 3 recibos autónomo, extracto bancario 3 meses |
| **otro** | Pasaporte, prueba de ingresos, referencia arrendador anterior |

**Client status flow:** `unverified → uploading → pending_review → active → inactive`
- Only admin can activate (pending_review → active)
- Client or admin can deactivate (active → inactive)

---

## Tech Stack — Non-Negotiable Choices

| Layer | Technology | Key constraint |
|-------|------------|----------------|
| Framework | **Next.js 15** App Router | Server Components by default |
| Database/Auth/Storage | **Supabase** | Cookie-based auth, RLS for reads |
| Styling | **Tailwind v4** + **shadcn/ui** | CSS `@theme` blocks, not tailwind.config.ts |
| Forms | **react-hook-form** + **Zod** | Zod for ALL validation |
| i18n | **next-intl** | Spanish (`es`) primary, English (`en`) secondary |
| Email | **Resend** + React Email | Transactional only |
| WhatsApp | **n8n** webhook | At `davya.app.n8n.cloud` |
| Deployment | **Vercel** | Domain TBD |
| Testing | **Playwright** (E2E) + **Vitest** (unit) | |

---

## Folder Structure

```
src/
  app/
    [locale]/
      layout.tsx              # IntlProvider, auth check
      (auth)/
        login/page.tsx
        registro/page.tsx
        verificar-email/page.tsx
      (client)/
        layout.tsx            # Client-only layout + nav
        perfil/page.tsx       # Profile + preferences
        documentos/page.tsx   # Upload + manage docs
        visitas/page.tsx      # Booked visits
      (admin)/
        layout.tsx            # Admin layout + nav (protected)
        page.tsx              # Dashboard overview
        clientes/
          page.tsx            # Client list
          [id]/page.tsx       # Client detail + doc review
        pisos/
          page.tsx            # Building list
          nuevo/page.tsx      # Add building + slots
          [slug]/page.tsx     # Building detail + matches
      visita/
        [slug]/page.tsx       # PUBLIC — no auth needed
  components/
    ui/                       # shadcn/ui (never modify directly)
    forms/                    # All forms (react-hook-form + zod)
    admin/                    # Admin-only components
    client/                   # Client portal components
    shared/                   # Used in both portals
  lib/
    supabase/
      server.ts               # createServerClient (Server Components)
      client.ts               # createBrowserClient (Client Components)
      middleware.ts           # Auth middleware helper
    matching.ts               # Building ↔ client matching algorithm
    whatsapp.ts               # n8n webhook triggers
    zip-export.ts             # JSZip document export
    email/                    # Resend + React Email templates
  actions/                    # All Server Actions (grouped by domain)
    clients.ts
    buildings.ts
    bookings.ts
    documents.ts
  types/
    database.ts               # Auto-generated: `supabase gen types`
    index.ts                  # App-level types
  middleware.ts               # Auth + i18n middleware
messages/
  es.json                     # Spanish translations (primary)
  en.json                     # English translations
supabase/
  migrations/                 # All DB migrations
  seed.sql                    # Dev seed data
```

---

## Database Schema

```sql
-- CLIENTS
clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users UNIQUE,
  full_name text NOT NULL,
  phone text,
  email text NOT NULL,
  profile_type text NOT NULL CHECK (profile_type IN ('empleado','estudiante','autonomo','otro')),
  status text DEFAULT 'unverified' CHECK (status IN ('unverified','uploading','pending_review','active','inactive')),
  monthly_income numeric,
  preferences jsonb DEFAULT '{}'::jsonb,
  -- preferences keys: max_rent, min_rooms, preferred_neighborhoods[], flexible_on_neighborhood, move_in_date, has_pets
  activated_at timestamptz,
  created_at timestamptz DEFAULT now()
)

-- DOCUMENTS
documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients NOT NULL,
  doc_type text NOT NULL, -- 'dni', 'contrato', 'nomina_1', 'nomina_2', 'nomina_3', 'vida_laboral', 'matricula', 'ahorros', 'renta', 'recibo_autonomo_1', etc.
  file_path text NOT NULL, -- Supabase Storage path
  file_name text NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  is_current boolean DEFAULT true -- latest version of this doc type
)

-- BUILDINGS
buildings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  neighborhood text NOT NULL,
  address text, -- revealed after booking
  price numeric NOT NULL,
  rooms integer NOT NULL,
  bathrooms integer,
  size_sqm numeric,
  floor integer,
  has_elevator boolean DEFAULT false,
  furnished boolean DEFAULT false,
  photos text[] DEFAULT '{}', -- Supabase Storage paths
  min_income numeric,
  allowed_profiles text[] DEFAULT '{empleado,estudiante,autonomo,otro}',
  min_solvency_ratio numeric DEFAULT 3, -- income must be X times rent
  available_from date,
  description_es text,
  description_en text,
  real_estate_company text,
  company_contact text,
  status text DEFAULT 'draft' CHECK (status IN ('draft','published','closed')),
  created_at timestamptz DEFAULT now()
)

-- VISIT SLOTS
visit_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid REFERENCES buildings NOT NULL,
  datetime timestamptz NOT NULL,
  duration_minutes integer DEFAULT 15,
  booked_by_client_id uuid REFERENCES clients, -- NULL = available
  booked_at timestamptz,
  UNIQUE(building_id, datetime) -- no duplicate slots
)

-- MATCHES
matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients NOT NULL,
  building_id uuid REFERENCES buildings NOT NULL,
  score numeric DEFAULT 0,
  notified_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending','notified','visited','applied','rejected')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(client_id, building_id)
)
```

### Supabase Storage Buckets

| Bucket | Access | Used for |
|--------|--------|----------|
| `documents` | **Private** — signed URLs only | Client documents (DNI, nóminas, etc.) |
| `buildings` | **Public** | Building photos shown in booking page |

### RLS Policies (summary)

```sql
-- clients: users see/edit only their own row; admin sees all
-- documents: users see/upload only their own; admin sees all
-- buildings: public can read published; admin can do all
-- visit_slots: public can read (for booking page); authenticated can book their own
-- matches: clients see their own; admin sees all
```

---

## Authentication Rules

- **Method:** Supabase email + password (`@supabase/ssr` with cookies)
- **Admin role:** `user_metadata.role = 'admin'` set manually in Supabase Dashboard
- **Client role:** any authenticated user without admin role
- **Public access:** `/visita/[slug]` page is fully public (no login to view)
- **Booking:** requires login — redirect to login then back to booking page

```typescript
// Middleware protects /[locale]/(admin)/* routes
// Checks: session exists AND user_metadata.role === 'admin'
```

---

## Matching Algorithm (PostgreSQL function)

Scoring factors (all must pass the hard filters to be included):
1. **Hard filter — budget:** `client.preferences.max_rent >= building.price * 0.9`
2. **Hard filter — profile:** `building.allowed_profiles @> ARRAY[client.profile_type]`
3. **Hard filter — solvency:** `client.monthly_income >= building.price * building.min_solvency_ratio`
4. **Score boost +2:** client's preferred neighborhoods contains building neighborhood
5. **Score boost +1:** client has no conflicting constraints (pets, smoker)
6. **Exclude:** client already has a booking for this building

Returns ranked list → triggers WhatsApp notifications via n8n.

---

## WhatsApp Notification (n8n)

Server Action calls n8n webhook when a match batch is triggered:
```typescript
// actions/buildings.ts
"use server"
export async function matchAndNotify(buildingId: string) {
  const matches = await runMatchingQuery(buildingId)
  await fetch(process.env.N8N_WHATSAPP_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'match_found',
      matches: matches.map(m => ({
        client_phone: m.phone,
        client_name: m.full_name,
        building_name: m.building_name,
        building_price: m.building_price,
        booking_url: `${process.env.NEXT_PUBLIC_APP_URL}/visita/${m.building_slug}`
      }))
    })
  })
}
```

---

## Email Templates (Resend)

Use React Email for all templates. Templates live in `src/lib/email/`:
- `welcome.tsx` — after registration
- `profile-activated.tsx` — when admin activates client
- `booking-confirmation.tsx` — after booking a visit slot
- `booking-reminder.tsx` — 24h before visit

---

## Slot Booking — Atomic Transaction

CRITICAL: Slot booking must be atomic to prevent double-booking:
```typescript
// Use Supabase RPC function for atomic booking
const { data, error } = await supabase.rpc('book_visit_slot', {
  p_slot_id: slotId,
  p_client_id: clientId
})
// PostgreSQL function uses SELECT FOR UPDATE to lock the row
```

---

## Document Export (ZIP)

Route Handler at `/api/export/[clientId]`:
1. Fetch all current documents for client from `documents` table
2. For each document, generate a signed URL from Supabase Storage
3. Download each file, add to JSZip with filename `[ClientName]_[doc_type].[ext]`
4. Return ZIP as stream with `Content-Disposition: attachment`

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # Server-only, NEVER expose to client

# App
NEXT_PUBLIC_APP_URL=https://[domain]

# n8n
N8N_WHATSAPP_WEBHOOK_URL=    # Server-only

# Resend
RESEND_API_KEY=               # Server-only
```

---

## STRICT RULES — Never Break These

1. **Never** use `localStorage` for auth state — use Supabase cookie session
2. **Never** use `SUPABASE_SERVICE_ROLE_KEY` in client-side code or Client Components
3. **Never** make the slot booking without an atomic DB transaction (double-booking risk)
4. **Never** expose building address until a visit is booked (privacy)
5. **Never** skip RLS on `documents` or `clients` tables
6. **Always** use `await params` in Next.js 15 (params is a Promise)
7. **Always** validate form inputs with Zod before hitting DB
8. **Always** use `next/image` for building photos — never raw `<img>`
9. **Always** use Server Actions for mutations — not API routes
10. **Always** generate Supabase types: `supabase gen types typescript > src/types/database.ts`

---

## Design Tokens (Barcelona Aesthetic)

```css
/* Primary: warm terracotta */
--color-primary: oklch(55% 0.18 28);
/* Secondary: sand/cream */
--color-secondary: oklch(94% 0.03 75);
/* Accent: Mediterranean blue */
--color-accent: oklch(45% 0.15 240);
/* Background: warm white */
--color-background: oklch(99% 0.01 75);
```

Typography: **Inter** (UI) + **Playfair Display** (headings — premium feel)

Tone: Professional and warm. This helps people find their home in Barcelona.
Copy in Spanish should be direct, reassuring, and human. Avoid bureaucratic language.

---

## Skills Available in This Project

| Skill | Command | Use for |
|-------|---------|---------|
| Business context (full) | `/quierobcn-business` | Deep business logic questions |
| Next.js App Router | `/nextjs-app-router` | Routing, SSR, file structure |
| React Server Components | `/react-server-components` | RSC decisions, composition |
| TypeScript Best Practices | `/typescript-best-practices` | Types, Zod, strict patterns |
| UI/UX Pro Max | `/ui-ux-pro-max` | Design system, colors, components |
