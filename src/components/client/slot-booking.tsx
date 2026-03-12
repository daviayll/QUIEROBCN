'use client'

import { useTransition, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Clock } from 'lucide-react'
import type { Database } from '@/types/database'

interface Slot {
  id: string
  datetime: string
  duration_minutes: number
}

interface SlotBookingProps {
  slots: Slot[]
  clientId: string | null
  locale: string
  buildingSlug: string
  hasMatch: boolean
}

export default function SlotBooking({
  slots,
  clientId,
  locale,
  buildingSlug,
  hasMatch,
}: SlotBookingProps) {
  const [isPending, startTransition] = useTransition()
  const [bookedSlotId, setBookedSlotId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!clientId) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-muted-foreground">
          Para reservar una visita necesitas tener el perfil activo.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/${locale}/login`}>Iniciar sesión</Link>
        </Button>
      </div>
    )
  }

  if (clientId && !hasMatch) {
    return (
      <div className="space-y-2 text-center">
        <p className="text-sm text-muted-foreground">
          Los horarios de visita están disponibles solo para clientes que han recibido una propuesta de su agente. Si crees que es un error, contacta con tu agente.
        </p>
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <p className="text-sm text-center text-muted-foreground">
        No hay horarios disponibles en este momento.
      </p>
    )
  }

  if (bookedSlotId) {
    const slot = slots.find(s => s.id === bookedSlotId)
    const dt = slot ? new Date(slot.datetime) : null
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
        <p className="font-medium">¡Visita confirmada!</p>
        {dt && (
          <p className="text-sm text-muted-foreground">
            {dt.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            {' a las '}
            {dt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Encontrarás tu visita en la sección "Mis visitas".
        </p>
      </div>
    )
  }

  const handleBook = (slotId: string) => {
    setError(null)
    startTransition(async () => {
      const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data, error: rpcError } = await supabase.rpc('book_visit_slot', {
        p_slot_id: slotId,
        p_client_id: clientId,
      })

      const result = data as { success: boolean; error?: string } | null
      if (rpcError || !result?.success) {
        const msg = result?.error ?? rpcError?.message ?? 'Error al reservar'
        setError(
          msg === 'slot_taken' ? 'Este horario ya fue reservado. Elige otro.' : msg
        )
        return
      }

      setBookedSlotId(slotId)
    })
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
      )}
      {slots.map(slot => {
        const dt = new Date(slot.datetime)
        return (
          <button
            key={slot.id}
            onClick={() => handleBook(slot.id)}
            disabled={isPending}
            className="w-full rounded-md border p-3 text-left transition-colors hover:bg-muted disabled:opacity-50"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">
                  {dt.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {dt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  {' · '}{slot.duration_minutes} min
                </p>
              </div>
              <span className="text-xs text-primary font-medium">Reservar</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
