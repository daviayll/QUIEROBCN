'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ProfileType } from '@/types'

// ── Zod schemas ────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  full_name: z.string().min(2, 'Nombre demasiado corto'),
  phone: z.string().optional(),
  profile_type: z.enum(['empleado', 'estudiante', 'autonomo', 'otro']),
  monthly_income: z.coerce.number().min(0).optional(),
  max_rent: z.coerce.number().min(0).optional(),
  min_rooms: z.coerce.number().min(1).optional(),
  preferred_neighborhoods: z.array(z.string()).optional(),
  move_in_date: z.string().optional(),
  has_pets: z.boolean().optional(),
  // GDPR Art. 7 — explicit consent is mandatory
  gdpr_consent: z.string().refine(v => v === 'true', {
    message: 'Debes aceptar el tratamiento de datos para continuar.',
  }),
})

// ── Types ─────────────────────────────────────────────────────────────────

export type ActionResult =
  | { success: true; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]>; values?: Record<string, string> }

// ── Login ─────────────────────────────────────────────────────────────────

export async function loginAction(
  locale: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Datos inválidos',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      values: { email: raw.email as string ?? '' },
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { success: false, error: 'Email o contraseña incorrectos.', values: { email: parsed.data.email } }
  }

  const isAdmin = data.user?.app_metadata?.role === 'admin'
  redirect(isAdmin ? `/${locale}/admin` : `/${locale}/perfil`)
}

// ── Register ──────────────────────────────────────────────────────────────

export async function registerAction(
  locale: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
    full_name: formData.get('full_name'),
    phone: formData.get('phone') || undefined,
    profile_type: formData.get('profile_type'),
    monthly_income: formData.get('monthly_income') || undefined,
    max_rent: formData.get('max_rent') || undefined,
    min_rooms: formData.get('min_rooms') || undefined,
    preferred_neighborhoods: formData.getAll('preferred_neighborhoods'),
    move_in_date: formData.get('move_in_date') || undefined,
    has_pets: formData.get('has_pets') === 'true',
    gdpr_consent: formData.get('gdpr_consent') as string,
  }

  const safeValues = {
    email: String(raw.email ?? ''),
    full_name: String(raw.full_name ?? ''),
    phone: String(raw.phone ?? ''),
    profile_type: String(raw.profile_type ?? ''),
    monthly_income: String(raw.monthly_income ?? ''),
    max_rent: String(raw.max_rent ?? ''),
    min_rooms: String(raw.min_rooms ?? ''),
    move_in_date: String(raw.move_in_date ?? ''),
  }

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Por favor corrige los errores del formulario',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      values: safeValues,
    }
  }

  const {
    email,
    password,
    full_name,
    phone,
    profile_type,
    monthly_income,
    max_rent,
    min_rooms,
    preferred_neighborhoods,
    move_in_date,
    has_pets,
    gdpr_consent,
  } = parsed.data

  const supabase = await createClient()

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/verificar-email`,
    },
  })

  if (authError || !authData.user) {
    if (authError?.message?.includes('already registered')) {
      return { success: false, error: 'Este email ya está registrado.', values: safeValues }
    }
    return { success: false, error: authError?.message ?? 'Error al crear la cuenta.', values: safeValues }
  }

  // 2. Insert client profile (consent_given_at = now, as user just accepted)
  const { error: clientError } = await supabase.from('clients').insert({
    user_id: authData.user.id,
    full_name,
    phone: phone ?? null,
    email,
    profile_type: profile_type as ProfileType,
    monthly_income: monthly_income ?? null,
    status: 'unverified',
    consent_given_at: gdpr_consent === 'true' ? new Date().toISOString() : null,
    preferences: {
      max_rent: max_rent ?? null,
      min_rooms: min_rooms ?? null,
      preferred_neighborhoods: preferred_neighborhoods ?? [],
      move_in_date: move_in_date ?? null,
      has_pets: has_pets ?? false,
    },
  })

  if (clientError) {
    return { success: false, error: 'Error al guardar el perfil. Inténtalo de nuevo.', values: safeValues }
  }

  redirect(`/${locale}/verificar-email`)
}

// ── Logout ────────────────────────────────────────────────────────────────

export async function logoutAction(locale: string) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect(`/${locale}/login`)
}
