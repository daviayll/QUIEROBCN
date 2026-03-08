---
name: quierobcn-business
description: "Full business context for the QUIEROBCN real estate matching platform. Use when building features, designing DB schemas, writing copy, making UX decisions, or implementing business logic for this project. Covers: client profiles, document requirements, admin workflows, matching logic, WhatsApp automation, booking system, and design guidelines."
---

# QUIEROBCN — Full Business Context Skill

## Business Overview

**QUIEROBCN** ("Quiero Barcelona") is a real estate matching service based in Barcelona, Spain. A solo operator acts as an intermediary between:

1. **Apartment seekers (clients)** — people looking to rent an apartment in Barcelona
2. **Real estate developers/companies (promotoras)** — companies with available apartments who need qualified tenants

### The Old Manual Workflow (being replaced)
1. Clients contact her via WhatsApp
2. Clients fill a Google Form with personal info, budget, preferred zone, documents
3. Real estate companies contact her via WhatsApp with new buildings + available visit dates
4. She manually reads both sides and mentally matches clients to buildings
5. She manually contacts matched clients and schedules 10-15 minute visit slots
6. She manually compiles and sends client documents to companies when applying

### The New App Workflow
1. Clients self-register on the web app, choose their profile type, set preferences, upload required documents
2. Admin reviews uploaded documents and manually activates the client profile ("perfil activo")
3. Admin uploads a new building with photos, details, and visit time slots
4. With one click, AI matches building to active clients → auto-sends WhatsApp with booking link
5. Clients click link → view property page with photos + book a visit slot (real-time availability)
6. Once a slot is booked, it is unavailable to others
7. When a client decides to apply, admin exports all their docs as ZIP and submits to the company

---

## Client Profile Types

There are 4 profile types. Each has different required documents.

### 1. Empleado/a (Employed)
Required documents:
- DNI o NIE (identity document)
- Contrato de trabajo (work contract)
- 3 últimas nóminas (last 3 payslips)
- Vida laboral (work history from Social Security)

### 2. Estudiante (Student)
Required documents:
- DNI o NIE o Pasaporte
- Matrícula universitaria (university enrollment certificate)
- Comprobación de ahorros (proof of savings / bank statement)
- Contrato de trabajo (optional, if they work part-time)
- 3 últimas nóminas (optional, if they work part-time)

### 3. Autónomo/a (Self-employed / Freelancer)
Required documents:
- DNI o NIE
- Declaración de la renta (annual tax return / IRPF)
- Últimos 3 recibos de autónomo (last 3 self-employment social security receipts)
- Extracto bancario 3 meses (3-month bank statement)

### 4. Otro / Extranjero (Other / Foreign)
Required documents:
- Pasaporte
- Prueba de ingresos (proof of income — bank transfer records, remote work contract, etc.)
- Referencia de arrendador anterior (previous landlord reference, if available)

---

## Client Status Flow

```
Unverified → Documents Uploading → Pending Review → ACTIVE → Inactive
                                        ↑
                              Admin manually activates
```

- **Unverified:** Just registered, hasn't uploaded docs yet
- **Documents Uploading:** Some docs uploaded, profile incomplete
- **Pending Review:** All required docs uploaded, waiting for admin activation
- **ACTIVE:** Admin has verified and activated the profile → client receives WhatsApp notifications about matching buildings
- **Inactive:** Client or admin has deactivated (no longer looking, found apartment, etc.) → no more notifications

**Important rule:** Only admin can transition a client from "Pending Review" → "Active". Clients can only toggle themselves to "Inactive".

---

## Building / Property Data Model

When admin uploads a building, they provide:

| Field | Type | Description |
|-------|------|-------------|
| name | string | Internal reference name |
| address | string | Full address (shown after booking) |
| neighborhood | string | Barrio (Eixample, Gracia, Poble Sec, etc.) |
| price | number | Monthly rent in EUR |
| rooms | number | Number of bedrooms |
| bathrooms | number | Number of bathrooms |
| size_sqm | number | Size in square meters |
| floor | number | Floor number |
| has_elevator | boolean | Has elevator |
| furnished | boolean | Is furnished |
| min_income | number | Minimum monthly net income required |
| allowed_profiles | array | Which profile types can apply (empleado, estudiante, etc.) |
| min_solvency_ratio | number | Income/rent ratio required (typically 3x) |
| available_from | date | Available from date |
| photos | array | Photo URLs (stored in Supabase Storage) |
| description_es | text | Description in Spanish |
| description_en | text | Description in English |
| real_estate_company | string | Name of the promotora/company |
| company_contact | string | Contact info for the company |
| status | enum | draft / published / closed |

---

## Visit Slot System

Each building can have multiple visit slots (10-15 min each):

| Field | Type | Description |
|-------|------|-------------|
| building_id | uuid | Reference to building |
| datetime | timestamp | Date and time of the slot |
| duration_minutes | number | 10 or 15 minutes |
| booked_by_client_id | uuid | Null if available, client ID if booked |
| booked_at | timestamp | When it was booked |

**Rules:**
- A slot becomes immediately unavailable once booked (atomic Supabase transaction)
- Max 1 booking per client per building
- Client receives confirmation (WhatsApp or email) upon successful booking
- Admin can see all booked slots with client info

### Public Booking Page (`/visita/[building-slug]`)
This is a **public, shareable page** (no login required to view, login required to book):
- Shows: property photos (gallery), key details (price, rooms, neighborhood, size)
- Shows: available visit slots as bookable cards
- Clicking a slot requires login → redirects to login then back
- After booking: shows confirmation with the booked slot details

---

## AI Matching Logic

When admin uploads a building and clicks "Match & Notify", the system:

1. Queries all **active clients**
2. Filters by:
   - `client.max_rent >= building.price * 0.9` (within 10% of budget)
   - `client.preferred_neighborhoods` contains `building.neighborhood` OR client has "flexible" preference
   - `client.profile_type` is in `building.allowed_profiles`
   - `client.monthly_income >= building.min_income` (or >= building.price * building.min_solvency_ratio)
   - Client has NOT already booked a visit for this building
3. Scores matches (optional: add weight for zone preference, solvency, profile match)
4. Sends WhatsApp notification to all matched clients via n8n webhook

### Client Preferences (stored in `client.preferences` jsonb)
- `max_rent`: number (max monthly budget)
- `preferred_neighborhoods`: array of strings
- `min_rooms`: number
- `flexible_on_neighborhood`: boolean
- `move_in_date`: date (when they want to move)
- `has_pets`: boolean
- `smoker`: boolean

---

## WhatsApp Integration (via n8n)

The existing n8n instance at `davya.app.n8n.cloud` handles WhatsApp messaging.

### Notification triggers:
1. **Match found** → send client a WhatsApp with: property name, neighborhood, price, booking link
2. **Document missing reminder** → send client a WhatsApp if profile has been "Pending Review" for >3 days without activation
3. **Booking confirmation** → send client WhatsApp with slot details after booking
4. **Booking reminder** → 24h before visit, send reminder WhatsApp

### n8n webhook payload structure (to be defined):
```json
{
  "event": "match_found" | "booking_confirmed" | "doc_reminder",
  "client_phone": "+34XXXXXXXXX",
  "client_name": "Juan García",
  "building_name": "Eixample Center - Apt 3B",
  "building_price": 1200,
  "booking_url": "https://quierobcn.com/visita/eixample-center-3b",
  "slot_datetime": "2025-04-15T10:00:00Z"
}
```

---

## Database Schema (Supabase)

```sql
-- Clients
clients (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  full_name text,
  phone text,
  email text,
  profile_type text CHECK (profile_type IN ('empleado', 'estudiante', 'autonomo', 'otro')),
  status text DEFAULT 'unverified' CHECK (status IN ('unverified', 'uploading', 'pending_review', 'active', 'inactive')),
  preferences jsonb DEFAULT '{}',
  monthly_income numeric,
  activated_at timestamptz,
  activated_by uuid,
  created_at timestamptz DEFAULT now()
)

-- Documents
documents (
  id uuid PRIMARY KEY,
  client_id uuid REFERENCES clients,
  doc_type text,  -- 'dni', 'nomina_1', 'nomina_2', 'nomina_3', 'contrato', 'vida_laboral', etc.
  file_url text,
  file_name text,
  uploaded_at timestamptz DEFAULT now(),
  is_current boolean DEFAULT true
)

-- Buildings
buildings (
  id uuid PRIMARY KEY,
  slug text UNIQUE,
  name text,
  neighborhood text,
  price numeric,
  rooms integer,
  bathrooms integer,
  size_sqm numeric,
  photos text[],
  min_income numeric,
  allowed_profiles text[],
  preferences_match jsonb,  -- criteria for matching
  status text DEFAULT 'draft',
  real_estate_company text,
  available_from date,
  description_es text,
  description_en text,
  created_at timestamptz DEFAULT now()
)

-- Visit Slots
visit_slots (
  id uuid PRIMARY KEY,
  building_id uuid REFERENCES buildings,
  datetime timestamptz,
  duration_minutes integer DEFAULT 15,
  booked_by_client_id uuid REFERENCES clients,
  booked_at timestamptz
)

-- Matches
matches (
  id uuid PRIMARY KEY,
  client_id uuid REFERENCES clients,
  building_id uuid REFERENCES buildings,
  score numeric,
  notified_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'visited', 'applied', 'rejected'))
)
```

---

## UI/UX Guidelines

### Tone & Feel
- **Professional but warm** — this is a service that helps people find their home in Barcelona
- **Barcelona aesthetic** — Mediterranean warmth, clean lines, light and airy
- **Trust-building** — document upload feels secure and easy, not bureaucratic
- Language: Spanish primary, English secondary (toggle)

### Color Palette (suggestion)
- Primary: Deep warm terracotta or Barcelona red (#C94B32 or similar)
- Secondary: Sand/cream (#F5EDD6)
- Accent: Mediterranean blue (#2B6CB0)
- Background: Clean white / off-white
- Text: Dark charcoal, not pure black

### Admin Dashboard
- Clean data table with client list, status badges (colored), doc completeness bar
- Card view for buildings with photo thumbnail
- Match pipeline: Kanban or list view with stages

### Client Portal
- Step-by-step onboarding (profile type → preferences → document upload)
- Clear doc checklist with checkmarks per required document
- Status banner: "Tu perfil está pendiente de revisión" / "Tu perfil está activo ✓"

---

## Document Export (ZIP)
When admin clicks "Exportar documentos" for a client:
- System fetches all current documents from Supabase Storage
- Packages them into a ZIP file with naming convention: `[ClientName]_[doc_type].[ext]`
- Downloads ZIP directly in browser
- Use: JSZip library or Supabase Edge Function

---

## Roles & Access Control (Supabase RLS)
- **Admin role:** Full access to all tables
- **Client role:** Read/write own row in `clients`, own rows in `documents`; read `buildings` and `visit_slots`; write own booking in `visit_slots`; read own `matches`
- **Public (unauthenticated):** Read published `buildings` and available `visit_slots` (for the public booking page)
