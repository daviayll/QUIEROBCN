import Link from 'next/link'
import { Button } from '@/components/ui/button'
import BuildingForm from '@/components/admin/building-form'
import { ArrowLeft } from 'lucide-react'

export default async function NuevoPisoPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/${locale}/admin/pisos`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Pisos
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="font-display text-2xl font-bold">Nuevo piso</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Añade un piso para empezar a emparejar clientes.
        </p>
      </div>

      <BuildingForm locale={locale} />
    </div>
  )
}
