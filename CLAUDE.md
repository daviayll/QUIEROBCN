# QUIEROBCN — Project Context

## What This Is
A back-office web application for a solo real estate matching agent in Barcelona. She acts as an intermediary between apartment seekers and real estate developers/companies. The app replaces her current manual workflow (WhatsApp + Google Forms + mental matching) with an automated platform.

## The Business Problem
- **Clients** contact her via WhatsApp and fill a Google Form with personal info, budget, desired zone, and documents
- **Real estate companies** contact her via WhatsApp with new buildings and available visit slots
- She manually matches clients to buildings and schedules visits — entirely by hand, very time-consuming

## The App Solution
Replace all of this with a platform where:
1. Clients self-register, select their profile type, and upload required documents
2. Admin (her) reviews documents and manually activates client profiles
3. Admin uploads buildings with photos, details, and available visit time slots
4. AI auto-matches active clients to buildings → sends WhatsApp notification with booking link
5. Clients visit a property page and book a visit slot (slots become unavailable once booked)
6. Admin can export all client documents as ZIP to submit to real estate companies

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Database / Auth / Storage:** Supabase
- **Styling:** Tailwind CSS + shadcn/ui
- **Language:** Spanish (primary) + English
- **WhatsApp automation:** n8n (already configured at davya.app.n8n.cloud)
- **Deployment:** Vercel

## Key Entities
| Entity | Description |
|--------|-------------|
| `Client` | Apartment seeker. Has profile_type, status (active/inactive), preferences, documents |
| `Building` | Property listed by a real estate company. Has photos, price, rooms, neighborhood, criteria |
| `VisitSlot` | A bookable 10-15 min time slot for a specific building |
| `Match` | A client–building pair identified by the AI engine |
| `Document` | An uploaded file belonging to a client (predefined types per profile) |

## Client Profile Types & Required Documents
- **Empleado/a:** DNI/NIE, contrato de trabajo, 3 últimas nóminas, vida laboral
- **Estudiante:** Matrícula universitaria, comprobación de ahorros, contrato (opcional), 3 últimas nóminas (si las tiene)
- **Autónomo/a:** DNI/NIE, declaración de la renta, últimos 3 recibos de autónomo, extracto bancario 3 meses
- **Otro / Extranjero:** Pasaporte, prueba de ingresos, referencia de arrendador anterior

## Admin Capabilities
- Dashboard: all clients with status, doc completeness, and quick filters
- Manual profile activation (once all required docs are uploaded and verified)
- Upload buildings with full details + visit slots
- One-click matching → WhatsApp blast to matched active clients
- Export client docs as ZIP per client

## App Routes (planned)
- `/` — Landing / login
- `/registro` — Client registration
- `/cliente/*` — Client portal (profile, documents, visits)
- `/admin/*` — Admin dashboard (clients, buildings, matches)
- `/visita/[building-slug]` — Public property + booking page

## Dev Session Startup
Run `/quierobcn-dev` at the start of every coding session — it loads the complete dev context: business rules + stack decisions + DB schema + architecture patterns + anti-patterns.

For deep business-only context: `/quierobcn-business`

## Key Files (to be created)
- `src/app/` — Next.js App Router pages
- `src/components/` — Shared UI components
- `supabase/migrations/` — DB schema
- `src/lib/matching.ts` — AI matching logic
- `src/lib/whatsapp.ts` — n8n webhook triggers
