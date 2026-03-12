import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { EditProfileForm } from '@/components/forms/edit-profile-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { ClientPreferences, ProfileType } from '@/types'

export default async function EditarPerfilPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!client) redirect(`/${locale}/login`)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${locale}/perfil`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Mi perfil
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="font-display text-2xl font-bold">Editar perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Actualiza tu información y preferencias de búsqueda.
        </p>
      </div>

      <EditProfileForm
        locale={locale}
        defaultValues={{
          full_name: client.full_name,
          email: client.email,
          phone: client.phone ?? null,
          profile_type: client.profile_type as ProfileType,
          monthly_income: client.monthly_income ?? null,
          status: client.status,
          preferences: (client.preferences ?? {}) as ClientPreferences,
        }}
      />
    </div>
  )
}
