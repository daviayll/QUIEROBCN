import { LoginForm } from '@/components/forms/login-form'

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <LoginForm locale={locale} />
}
