'use client'

import { useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { activateClient, deactivateClient, setPendingReview, requestClientDeletion } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import type { ClientStatus } from '@/types'

interface ClientActionsProps {
  clientId: string
  userId: string
  status: ClientStatus
}

export default function ClientActions({ clientId, userId, status }: ClientActionsProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const handle = (fn: () => Promise<{ success: boolean; error?: string }>) => {
    startTransition(async () => {
      const result = await fn()
      if (!result.success) alert(result.error ?? 'Error desconocido')
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'pending_review' && (
        <Button
          size="sm"
          onClick={() => handle(() => activateClient(clientId))}
          disabled={isPending}
        >
          Activar cliente
        </Button>
      )}
      {(status === 'uploading' || status === 'unverified') && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handle(() => setPendingReview(clientId))}
          disabled={isPending}
        >
          Marcar en revisión
        </Button>
      )}
      {status === 'active' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handle(() => deactivateClient(clientId))}
          disabled={isPending}
        >
          Desactivar
        </Button>
      )}
      {status === 'inactive' && (
        <Button
          size="sm"
          onClick={() => handle(() => activateClient(clientId))}
          disabled={isPending}
        >
          Reactivar
        </Button>
      )}
      <Button
        size="sm"
        variant="destructive"
        disabled={isPending}
        onClick={() => {
          if (!confirm('¿Eliminar todos los datos de este cliente? Esta acción es irreversible (GDPR Art. 17).')) return
          startTransition(async () => {
            const result = await requestClientDeletion(userId)
            if (!result.success) {
              alert(result.error ?? 'Error desconocido')
            } else {
              router.push(`/${locale}/admin/clientes`)
            }
          })
        }}
      >
        Eliminar datos (GDPR)
      </Button>
    </div>
  )
}
