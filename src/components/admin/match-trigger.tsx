'use client'

import { useTransition, useState } from 'react'
import { runMatchBuilding } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Zap } from 'lucide-react'

export default function MatchTrigger({ buildingId }: { buildingId: string }) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ count?: number; error?: string } | null>(null)

  const handleMatch = () => {
    startTransition(async () => {
      const res = await runMatchBuilding(buildingId)
      setResult({ count: res.count, error: res.error })
      setTimeout(() => setResult(null), 5000)
    })
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={handleMatch} disabled={isPending} variant="secondary">
        <Zap className="mr-1.5 h-4 w-4" />
        {isPending ? 'Emparejando...' : 'Ejecutar matching'}
      </Button>
      {result && (
        <p className="text-sm">
          {result.error ? (
            <span className="text-destructive">{result.error}</span>
          ) : (
            <span className="text-green-700">
              {result.count === 0 ? 'No se encontraron coincidencias.' : `${result.count} clientes emparejados.`}
            </span>
          )}
        </p>
      )}
    </div>
  )
}
