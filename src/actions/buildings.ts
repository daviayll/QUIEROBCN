'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    throw new Error('No autorizado')
  }
  return supabase
}

const buildingSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  slug: z.string().min(2, 'Slug requerido').regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  neighborhood: z.string().min(1, 'Barrio requerido'),
  address: z.string().optional(),
  price: z.coerce.number().min(1, 'Precio requerido'),
  rooms: z.coerce.number().min(1, 'Habitaciones requeridas'),
  bathrooms: z.coerce.number().min(0).optional(),
  size_sqm: z.coerce.number().min(0).optional(),
  floor: z.coerce.number().optional(),
  has_elevator: z.boolean().default(false),
  furnished: z.boolean().default(false),
  min_income: z.coerce.number().min(0).optional(),
  min_solvency_ratio: z.coerce.number().min(1).max(10).default(3),
  allowed_profiles: z.array(z.string()).default(['empleado', 'autonomo', 'otro']),
  available_from: z.string().optional(),
  description_es: z.string().optional(),
  description_en: z.string().optional(),
  real_estate_company: z.string().optional(),
  company_contact: z.string().optional(),
  status: z.enum(['draft', 'published', 'closed']).default('draft'),
})

export type ActionResult =
  | { success: true; slug: string; id: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export async function createBuilding(
  locale: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin()

    const raw = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      neighborhood: formData.get('neighborhood'),
      address: formData.get('address') || undefined,
      price: formData.get('price'),
      rooms: formData.get('rooms'),
      bathrooms: formData.get('bathrooms') || undefined,
      size_sqm: formData.get('size_sqm') || undefined,
      floor: formData.get('floor') || undefined,
      has_elevator: formData.get('has_elevator') === 'true',
      furnished: formData.get('furnished') === 'true',
      min_income: formData.get('min_income') || undefined,
      min_solvency_ratio: formData.get('min_solvency_ratio') || 3,
      allowed_profiles: formData.getAll('allowed_profiles'),
      available_from: formData.get('available_from') || undefined,
      description_es: formData.get('description_es') || undefined,
      description_en: formData.get('description_en') || undefined,
      real_estate_company: formData.get('real_estate_company') || undefined,
      company_contact: formData.get('company_contact') || undefined,
      status: formData.get('status') || 'draft',
    }

    const parsed = buildingSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        success: false,
        error: 'Por favor corrige los errores del formulario',
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const { error } = await supabase.from('buildings').insert({
      ...parsed.data,
      photos: [],
    })

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Ya existe un piso con ese slug.' }
      }
      return { success: false, error: error.message }
    }

    revalidatePath(`/${locale}/admin/pisos`)

    const { data: created } = await supabase
      .from('buildings')
      .select('id')
      .eq('slug', parsed.data.slug)
      .single()

    return { success: true, slug: parsed.data.slug, id: created?.id ?? '' }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function updateBuilding(
  buildingId: string,
  locale: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin()

    const raw = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      neighborhood: formData.get('neighborhood'),
      address: formData.get('address') || undefined,
      price: formData.get('price'),
      rooms: formData.get('rooms'),
      bathrooms: formData.get('bathrooms') || undefined,
      size_sqm: formData.get('size_sqm') || undefined,
      floor: formData.get('floor') || undefined,
      has_elevator: formData.get('has_elevator') === 'true',
      furnished: formData.get('furnished') === 'true',
      min_income: formData.get('min_income') || undefined,
      min_solvency_ratio: formData.get('min_solvency_ratio') || 3,
      allowed_profiles: formData.getAll('allowed_profiles'),
      available_from: formData.get('available_from') || undefined,
      description_es: formData.get('description_es') || undefined,
      description_en: formData.get('description_en') || undefined,
      real_estate_company: formData.get('real_estate_company') || undefined,
      company_contact: formData.get('company_contact') || undefined,
      status: formData.get('status') || 'draft',
    }

    const parsed = buildingSchema.safeParse(raw)
    if (!parsed.success) {
      return {
        success: false,
        error: 'Por favor corrige los errores del formulario',
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    // Fetch old slug to revalidate old paths if slug changed
    const { data: existing } = await supabase
      .from('buildings')
      .select('slug')
      .eq('id', buildingId)
      .single()

    const { error } = await supabase
      .from('buildings')
      .update({ ...parsed.data })
      .eq('id', buildingId)

    if (error) {
      if (error.code === '23505') {
        return {
          success: false,
          error: 'Ya existe un piso con ese slug.',
          fieldErrors: { slug: ['Este slug ya está en uso'] },
        }
      }
      return { success: false, error: error.message }
    }

    if (existing?.slug && existing.slug !== parsed.data.slug) {
      revalidatePath(`/${locale}/admin/pisos/${existing.slug}`)
      revalidatePath(`/${locale}/admin/pisos/${existing.slug}/editar`)
      revalidatePath(`/${locale}/visita/${existing.slug}`)
    }
    revalidatePath(`/${locale}/admin/pisos/${parsed.data.slug}`)
    revalidatePath(`/${locale}/admin/pisos`)
    revalidatePath(`/${locale}/visita/${parsed.data.slug}`)

    return { success: true, slug: parsed.data.slug, id: buildingId }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function updateBuildingStatus(
  buildingId: string,
  status: 'draft' | 'published' | 'closed'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await requireAdmin()

    const { error } = await supabase
      .from('buildings')
      .update({ status })
      .eq('id', buildingId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/pisos')
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function addBuildingPhoto(
  buildingId: string,
  buildingSlug: string,
  photoUrl: string
): Promise<{ error?: string }> {
  try {
    const supabase = await requireAdmin()

    const { data: building } = await supabase
      .from('buildings')
      .select('photos')
      .eq('id', buildingId)
      .single()

    if (!building) return { error: 'Piso no encontrado' }

    const photos = [...(building.photos ?? []), photoUrl]
    const { error } = await supabase
      .from('buildings')
      .update({ photos })
      .eq('id', buildingId)

    if (error) return { error: error.message }

    revalidatePath(`/admin/pisos/${buildingSlug}`)
    revalidatePath(`/visita/${buildingSlug}`)
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function removeBuildingPhoto(
  buildingId: string,
  buildingSlug: string,
  photoUrl: string
): Promise<{ error?: string }> {
  try {
    const supabase = await requireAdmin()

    const storagePath = photoUrl.split('/object/public/buildings/')[1]
    if (storagePath) {
      await supabase.storage.from('buildings').remove([storagePath])
    }

    const { data: building } = await supabase
      .from('buildings')
      .select('photos')
      .eq('id', buildingId)
      .single()

    if (!building) return { error: 'Piso no encontrado' }

    const photos = (building.photos ?? []).filter((p: string) => p !== photoUrl)
    const { error } = await supabase
      .from('buildings')
      .update({ photos })
      .eq('id', buildingId)

    if (error) return { error: error.message }

    revalidatePath(`/admin/pisos/${buildingSlug}`)
    revalidatePath(`/visita/${buildingSlug}`)
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function addVisitSlot(
  buildingId: string,
  datetime: string,
  duration_minutes = 15
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await requireAdmin()

    const { error } = await supabase.from('visit_slots').insert({
      building_id: buildingId,
      datetime,
      duration_minutes,
    })

    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/pisos')
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}
