'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { addBuildingPhoto, removeBuildingPhoto } from '@/actions/buildings'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, X } from 'lucide-react'

interface BuildingPhotoUploadProps {
  buildingId: string
  buildingSlug: string
  initialPhotos: string[]
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

function sanitizeFilename(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.\-_]/g, '_')
}

export default function BuildingPhotoUpload({
  buildingId,
  buildingSlug,
  initialPhotos,
}: BuildingPhotoUploadProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)
    setUploading(true)

    const supabase = createClient()
    const newPhotos: string[] = []

    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Solo se aceptan imágenes JPEG, PNG o WebP.')
        setUploading(false)
        return
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError('Cada imagen debe pesar menos de 5 MB.')
        setUploading(false)
        return
      }

      const filePath = `${buildingId}/${Date.now()}_${sanitizeFilename(file.name)}`
      const { error: uploadError } = await supabase.storage
        .from('buildings')
        .upload(filePath, file, { upsert: false })

      if (uploadError) {
        setError(`Error al subir ${file.name}: ${uploadError.message}`)
        setUploading(false)
        return
      }

      const photoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/buildings/${filePath}`
      const { error: actionError } = await addBuildingPhoto(buildingId, buildingSlug, photoUrl)

      if (actionError) {
        setError(`Error al guardar foto: ${actionError}`)
        setUploading(false)
        return
      }

      newPhotos.push(photoUrl)
    }

    setPhotos(prev => [...prev, ...newPhotos])
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleDelete(photoUrl: string) {
    if (!confirm('¿Eliminar esta foto?')) return
    setError(null)
    setDeletingUrl(photoUrl)

    const { error: actionError } = await removeBuildingPhoto(buildingId, buildingSlug, photoUrl)

    if (actionError) {
      setError(`Error al eliminar foto: ${actionError}`)
    } else {
      setPhotos(prev => prev.filter(p => p !== photoUrl))
    }

    setDeletingUrl(null)
  }

  return (
    <div className="space-y-4">
      {photos.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Sube fotos para que los clientes puedan ver el piso.
        </p>
      )}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {photos.map(url => (
            <div key={url} className="relative aspect-video overflow-hidden rounded-md border bg-muted">
              <Image
                src={url}
                alt="Foto del piso"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 33vw, 200px"
              />
              <button
                onClick={() => handleDelete(url)}
                disabled={deletingUrl === url}
                className="absolute right-0 top-0 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-br-none rounded-tl-none rounded-md bg-black/60 text-white hover:bg-black/80 disabled:opacity-50"
                aria-label="Eliminar foto"
              >
                {deletingUrl === url ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Subiendo...
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Añadir fotos
          </>
        )}
      </Button>
    </div>
  )
}
