import { useCallback, useState } from 'react'

export function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((current) => current !== id) : [...ids, id]
}

function readStorage(key: string): string[] {
  try {
    const value = localStorage.getItem(key)
    const parsed: unknown = value ? JSON.parse(value) : []
    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string') ? parsed : []
  } catch {
    return []
  }
}

export function usePersistentSet(key: string) {
  const [ids, setIds] = useState<string[]>(() => readStorage(key))

  const toggle = useCallback(
    (id: string) => {
      setIds((current) => {
        const next = toggleId(current, id)
        try {
          localStorage.setItem(key, JSON.stringify(next))
        } catch {
          // Keep the in-memory state when storage is unavailable.
        }
        return next
      })
    },
    [key],
  )

  return { ids, has: (id: string) => ids.includes(id), toggle }
}
