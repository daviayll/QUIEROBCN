import { RegistroForm } from '@/components/forms/registro-form'

export default async function RegistroPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <RegistroForm locale={locale} />
}
