import { useEffect, useState } from 'react'

export const NARROW_DETAIL_QUERY = '(max-width: 850px)'

export function useNarrowLayout() {
  const [isNarrow, setIsNarrow] = useState(() => window.matchMedia(NARROW_DETAIL_QUERY).matches)

  useEffect(() => {
    const media = window.matchMedia(NARROW_DETAIL_QUERY)
    const update = () => setIsNarrow(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return isNarrow
}
