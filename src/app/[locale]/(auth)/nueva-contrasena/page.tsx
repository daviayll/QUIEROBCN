import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UpdatePasswordForm } from '@/components/forms/update-password-form'

export default async function NuevaContrasenaPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/olvide-contrasena`)
  }

  return <UpdatePasswordForm locale={locale} />
}
