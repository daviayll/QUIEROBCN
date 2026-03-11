'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    throw new Error('No autorizado')
  }
  return { supabase, user }
}

export async function activateClient(
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await requireAdmin()

    const { error } = await supabase
      .from('clients')
      .update({ status: 'active', activated_at: new Date().toISOString() })
      .eq('id', clientId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/clientes')
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function deactivateClient(
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await requireAdmin()

    const { error } = await supabase
      .from('clients')
      .update({ status: 'inactive' })
      .eq('id', clientId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/clientes')
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function setPendingReview(
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await requireAdmin()

    const { error } = await supabase
      .from('clients')
      .update({ status: 'pending_review' })
      .eq('id', clientId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/clientes')
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

/**
 * Generates a signed URL for an admin to view a client document.
 * Logs the access in document_access_log for GDPR accountability (Art. 5.2).
 */
export async function getAdminDocumentUrl(
  clientId: string,
  documentId: string,
  filePath: string
): Promise<{ url: string | null; error?: string }> {
  try {
    const { supabase, user } = await requireAdmin()

    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600)

    if (error) return { url: null, error: error.message }

    // Log the access — GDPR Art. 5(2) accountability
    await supabase.from('document_access_log').insert({
      client_id: clientId,
      accessed_by: user.id,
      action: 'view',
    })

    return { url: data.signedUrl }
  } catch (e) {
    return { url: null, error: (e as Error).message }
  }
}

/**
 * Runs the match_building DB function and upserts results into matches table.
 */
export async function runMatchBuilding(
  buildingId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { supabase } = await requireAdmin()

    const { data, error } = await supabase.rpc('match_building', {
      p_building_id: buildingId,
    })

    if (error) return { success: false, error: error.message }

    // Upsert matches
    if (data && data.length > 0) {
      await supabase.from('matches').upsert(
        data.map((m: { client_id: string; building_id: string; score: number }) => ({
          client_id: m.client_id,
          building_id: m.building_id,
          score: m.score,
          status: 'pending' as const,
        })),
        { onConflict: 'client_id,building_id', ignoreDuplicates: true }
      )
    }

    revalidatePath(`/admin/pisos/${buildingId}`)
    return { success: true, count: data?.length ?? 0 }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

/**
 * GDPR Art. 17 — erases a client's personal data.
 * Must be followed by storage file deletion (handled by caller).
 */
export async function requestClientDeletion(
  userId: string
): Promise<{ success: boolean; filePaths?: string[]; error?: string }> {
  try {
    const { supabase } = await requireAdmin()

    const { data, error } = await supabase.rpc('request_gdpr_deletion', {
      p_user_id: userId,
    })

    if (error) return { success: false, error: error.message }

    const result = data as { success: boolean; error?: string; file_paths?: string[] }
    if (!result.success) return { success: false, error: result.error ?? 'Error desconocido' }

    // Delete storage files
    const filePaths: string[] = result.file_paths ?? []
    if (filePaths.length > 0) {
      await supabase.storage.from('documents').remove(filePaths)
    }

    // Delete auth user via service role
    const serviceClient = createServiceClient()
    await serviceClient.auth.admin.deleteUser(userId)

    revalidatePath('/admin/clientes')
    return { success: true, filePaths }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}
