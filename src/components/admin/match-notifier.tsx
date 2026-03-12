'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import { notifyMatchesWhatsApp } from '@/actions/admin'

interface Match {
  id: string
  score: number
  status: string
  notified_at: string | null
  client: { id: string; full_name: string; email: string } | null
}

interface MatchNotifierProps {
  matches: Match[]
  buildingId: string
  buildingSlug: string
  locale: string
}

export default function MatchNotifier({
  matches,
  buildingId,
  buildingSlug,
  locale,
}: MatchNotifierProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ notified: number; errors: string[] } | null>(null)

  const allSelected = matches.length > 0 && selectedIds.size === matches.length

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(matches.map(m => m.id)))
    }
  }

  function handleSend() {
    setResult(null)
    startTransition(async () => {
      const res = await notifyMatchesWhatsApp(
        Array.from(selectedIds),
        buildingId,
        buildingSlug,
        locale
      )
      setResult({ notified: res.notified, errors: res.errors })
      if (res.notified > 0) setSelectedIds(new Set())
    })
  }

  if (matches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Sin emparejamientos todavía. Ejecuta el matching para encontrar clientes compatibles.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={toggleAll}
          className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
        >
          {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
        </button>
        {selectedIds.size > 0 && (
          <span className="text-xs text-muted-foreground">{selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}</span>
        )}
      </div>

      <div className="space-y-2">
        {matches.map(m => {
          const isSelected = selectedIds.has(m.id)
          const isNotified = !!m.notified_at
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggleSelect(m.id)}
              className={`w-full rounded-md border p-3 text-left transition-all ${
                isSelected ? 'ring-2 ring-primary border-primary' : 'hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Link
                    href={`/${locale}/admin/clientes/${m.client?.id}`}
                    onClick={e => e.stopPropagation()}
                    className="text-sm font-medium hover:underline"
                  >
                    {m.client?.full_name ?? '—'}
                  </Link>
                  <p className="text-xs text-muted-foreground">{m.client?.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">Score: {m.score}</span>
                  {isNotified ? (
                    <Badge variant="secondary" className="text-xs">Notificado</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">{m.status}</Badge>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {result && (
        <div className={`rounded-md px-3 py-2 text-xs ${result.errors.length > 0 && result.notified === 0 ? 'bg-destructive/10 text-destructive' : 'bg-green-50 text-green-700'}`}>
          {result.notified > 0 && <p>{result.notified} cliente{result.notified !== 1 ? 's' : ''} notificado{result.notified !== 1 ? 's' : ''} por WhatsApp</p>}
          {result.errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}

      {selectedIds.size > 0 && (
        <Button
          onClick={handleSend}
          disabled={isPending}
          className="w-full"
          size="sm"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          {isPending ? 'Enviando...' : `Enviar WhatsApp (${selectedIds.size})`}
        </Button>
      )}
    </div>
  )
}
