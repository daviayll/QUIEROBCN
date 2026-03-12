import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import BuildingEditForm from '@/components/admin/building-edit-form'

export default async function EditBuildingPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    redirect(`/${locale}/login`)
  }

  const { data: building } = await supabase
    .from('buildings')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!building) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${locale}/admin/pisos/${slug}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver al piso
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="font-display text-2xl font-bold">Editar piso</h1>
        <p className="mt-1 text-sm text-muted-foreground">{building.name}</p>
      </div>

      <BuildingEditForm building={building} locale={locale} />
    </div>
  )
}
