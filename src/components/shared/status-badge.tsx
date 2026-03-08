import { Badge } from '@/components/ui/badge'
import type { ClientStatus } from '@/types'

const labels: Record<ClientStatus, string> = {
  unverified: 'Sin verificar',
  uploading: 'Subiendo docs',
  pending_review: 'En revisión',
  active: 'Activo',
  inactive: 'Inactivo',
}

const variants: Record<ClientStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  unverified: 'outline',
  uploading: 'secondary',
  pending_review: 'secondary',
  active: 'default',
  inactive: 'destructive',
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return (
    <Badge variant={variants[status] ?? 'outline'}>
      {labels[status] ?? status}
    </Badge>
  )
}
