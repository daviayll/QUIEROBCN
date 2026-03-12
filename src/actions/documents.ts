'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Called AFTER the client has uploaded the file to Supabase Storage directly.
 * Records the upload in the documents table.
 */
export async function recordDocumentUpload(
  doc_type: string,
  file_path: string,
  file_name: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { data: client } = await supabase
    .from('clients')
    .select('id, status')
    .eq('user_id', user.id)
    .single()

  if (!client) return { success: false, error: 'Perfil no encontrado' }

  // Mark previous version of same doc_type as not current
  await supabase
    .from('documents')
    .update({ is_current: false })
    .eq('client_id', client.id)
    .eq('doc_type', doc_type)
    .eq('is_current', true)

  // Insert new document record
  const { error } = await supabase.from('documents').insert({
    client_id: client.id,
    doc_type,
    file_path,
    file_name,
    is_current: true,
  })

  if (error) return { success: false, error: error.message }

  // Advance status from unverified → uploading on first upload
  if (client.status === 'unverified') {
    await supabase
      .from('clients')
      .update({ status: 'uploading' })
      .eq('id', client.id)
  }

  revalidatePath('/documentos')
  return { success: true }
}

/**
 * Marks a document as soft-deleted and removes it from storage.
 * DB record is updated first — if it fails (RLS rejects), storage is untouched.
 * Only the document's owner can delete it (enforced by RLS).
 */
export async function deleteDocument(
  documentId: string,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  // Soft delete in DB first (RLS enforces ownership — fails if not the user's document)
  const { error } = await supabase
    .from('documents')
    .update({
      deleted_at: new Date().toISOString(),
      file_path: '[DELETED]',
      file_name: '[DELETED]',
      is_current: false,
    })
    .eq('id', documentId)

  if (error) return { success: false, error: error.message }

  // Only delete from storage after DB record is confirmed soft-deleted
  await supabase.storage.from('documents').remove([filePath])

  revalidatePath('/documentos')
  return { success: true }
}

/**
 * Generates a short-lived signed URL for a document file.
 * Verifies ownership via RLS before issuing the URL.
 */
export async function getDocumentSignedUrl(
  filePath: string
): Promise<{ url: string | null; error?: string }> {
  const supabase = await createClient()

  // Verify the document belongs to the calling user (RLS-enforced)
  const { data: doc } = await supabase
    .from('documents')
    .select('id')
    .eq('file_path', filePath)
    .is('deleted_at', null)
    .single()

  if (!doc) return { url: null, error: 'Documento no encontrado' }

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 3600) // 1 hour

  if (error) return { url: null, error: error.message }
  return { url: data.signedUrl }
}
