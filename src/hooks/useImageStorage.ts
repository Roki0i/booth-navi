import { useCallback, useEffect, useState } from 'react'
import type { ImageReference } from '../types/booth'
import { deleteImage, getImage, putImage } from '../storage/imageStorage'

export function useImageUrl(reference?: ImageReference) {
  const [loaded, setLoaded] = useState<{ id: string; url: string }>()
  useEffect(() => {
    let active = true
    let objectUrl: string | undefined
    if (!reference) return
    getImage(reference.id).then((blob) => {
      if (active && blob) { objectUrl = URL.createObjectURL(blob); setLoaded({ id: reference.id, url: objectUrl }) }
    }).catch(() => undefined)
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [reference])
  return reference && loaded?.id === reference.id ? loaded.url : undefined
}

export function useImageStorage() {
  const save = useCallback(async (file: File, alt: string): Promise<ImageReference> => {
    const reference = { id: crypto.randomUUID(), alt }
    await putImage(reference.id, file)
    return reference
  }, [])
  return { save, remove: deleteImage }
}
