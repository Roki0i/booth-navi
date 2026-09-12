import { useCallback, useRef, useState } from 'react'

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
  const [state, setState] = useState(() => ({ key, ids: readStorage(key), saveStatus: 'saved' as 'saved' | 'error' }))
  const latest = useRef(state)
  const ids = state.key === key ? state.ids : readStorage(key)

  const toggle = useCallback((id: string) => {
    const current = latest.current.key === key ? latest.current.ids : readStorage(key)
    const next = toggleId(current, id)
    // state updaterは再実行されるため、同期保存は操作ごとに一度だけ行う。
    try {
      localStorage.setItem(key, JSON.stringify(next))
      latest.current = { key, ids: next, saveStatus: 'saved' }
    } catch {
      latest.current = { key, ids: current, saveStatus: 'error' }
    }
    setState(latest.current)
  }, [key])

  return { ids, has: (id: string) => ids.includes(id), toggle, saveStatus: state.key === key ? state.saveStatus : 'saved' }
}
