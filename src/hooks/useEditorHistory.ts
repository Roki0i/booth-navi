import { useCallback, useState } from 'react'

export function historyUndo<T>(past: T[], present: T, future: T[]) {
  if (!past.length) return { past, present, future }
  const previous = past[past.length - 1]
  return { past: past.slice(0, -1), present: previous, future: [present, ...future] }
}

export function historyRedo<T>(past: T[], present: T, future: T[]) {
  if (!future.length) return { past, present, future }
  const next = future[0]
  return { past: [...past, present], present: next, future: future.slice(1) }
}

export function useEditorHistory<T>(value: T, onChange: (value: T) => void) {
  const [past, setPast] = useState<T[]>([])
  const [future, setFuture] = useState<T[]>([])
  const commit = useCallback((next: T) => {
    setPast((values) => [...values.slice(-49), structuredClone(value)])
    setFuture([])
    onChange(next)
  }, [onChange, value])
  const undo = useCallback(() => {
    const state = historyUndo(past, value, future)
    setPast(state.past); setFuture(state.future); onChange(state.present)
  }, [future, onChange, past, value])
  const redo = useCallback(() => {
    const state = historyRedo(past, value, future)
    setPast(state.past); setFuture(state.future); onChange(state.present)
  }, [future, onChange, past, value])
  return { commit, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0 }
}
