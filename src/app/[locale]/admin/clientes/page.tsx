import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ClientStatusBadge } from '@/components/shared/status-badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ClientStatus } from '@/types'

const profileLabels: Record<string, string> = {
  empleado: 'Empleado/a',
  estudiante: 'Estudiante',
  autonomo: 'Autónomo/a',
  otro: 'Otro',
}

export default async function ClientesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const { locale } = await params
  const { status, q } = await searchParams
  // Whitelist-validate q to prevent operator injection via Supabase PostgREST filter strings
  const safeQ = q && /^[a-zA-Z0-9\s@.\-áéíóúüñÁÉÍÓÚÜÑ]*$/.test(q) ? q : ''
  const supabase = await createClient()

  let query = supabase
    .from('clients')
    .select('id, full_name, email, phone, profile_type, status, created_at, activated_at')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status as 'unverified' | 'uploading' | 'pending_review' | 'active' | 'inactive')
  }
  if (safeQ) {
    query = query.or(`full_name.ilike.%${safeQ}%,email.ilike.%${safeQ}%`)
  }

  const { data: clients } = await query

  const statuses: { value: string; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'pending_review', label: 'En revisión' },
    { value: 'active', label: 'Activos' },
    { value: 'uploading', label: 'Subiendo docs' },
    { value: 'unverified', label: 'Sin verificar' },
    { value: 'inactive', label: 'Inactivos' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {clients?.length ?? 0} clientes registrados
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form className="flex-1">
          <Label htmlFor="q" className="sr-only">Buscar clientes</Label>
          <Input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre o email…"
            className="max-w-xs"
          />
        </form>
        <div className="flex flex-wrap gap-1">
          {statuses.map(s => (
            <Link
              key={s.value}
              href={`/${locale}/admin/clientes?status=${s.value}${safeQ ? `&q=${encodeURIComponent(safeQ)}` : ''}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                (status ?? 'all') === s.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Registro</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!clients || clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No hay clientes con estos filtros.
                </TableCell>
              </TableRow>
            ) : (
              clients.map(client => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{client.email}</TableCell>
                  <TableCell className="text-sm">
                    {profileLabels[client.profile_type] ?? client.profile_type}
                  </TableCell>
                  <TableCell>
                    <ClientStatusBadge status={client.status as ClientStatus} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(client.created_at).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/${locale}/admin/clientes/${client.id}`}>Ver</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
