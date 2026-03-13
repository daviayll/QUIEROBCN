'use client'

import { useTransition, useState } from 'react'
import { addVisitSlot } from '@/actions/buildings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'

export default function AddSlotForm({ buildingId }: { buildingId: string }) {
  const [isPending, startTransition] = useTransition()
  const [datetime, setDatetime] = useState('')
  const [duration, setDuration] = useState('15')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!datetime) return
    setError(null)
    startTransition(async () => {
      const res = await addVisitSlot(buildingId, datetime, Number(duration))
      if (!res.success) setError(res.error ?? 'Error al añadir slot')
      else setDatetime('')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="slot_datetime">Fecha y hora</Label>
        <Input
          id="slot_datetime"
          type="datetime-local"
          value={datetime}
          onChange={e => setDatetime(e.target.value)}
          required
          className="w-full sm:w-52"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="slot_duration">Duración (min)</Label>
        <Input
          id="slot_duration"
          type="number"
          min="5"
          max="60"
          value={duration}
          onChange={e => setDuration(e.target.value)}
          className="w-full sm:w-24"
        />
      </div>
      <Button type="submit" disabled={isPending || !datetime} variant="outline">
        <Plus className="mr-1.5 h-4 w-4" />
        Añadir slot
      </Button>
      {error && <p className="w-full text-xs text-destructive">{error}</p>}
    </form>
  )
}
