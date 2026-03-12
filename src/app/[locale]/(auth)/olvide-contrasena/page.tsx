import { ForgotPasswordForm } from '@/components/forms/forgot-password-form'

export default async function OlvideContrasenaPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <ForgotPasswordForm locale={locale} />
}
