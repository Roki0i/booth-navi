import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createSampleEvent, SAMPLE_EVENT_ID } from '../data/sampleEvents'
import { EVENT_SCHEMA_VERSION, type EventProject } from '../types/event'
import { loadLastProjectId, loadProjects, saveLastProjectId, saveProjects } from '../storage/eventStorage'

export type SaveStatus = 'saved' | 'saving' | 'error'

export function createBlankProject(): EventProject {
  const now = new Date().toISOString()
  return {
    ...createSampleEvent(crypto.randomUUID()),
    schemaVersion: EVENT_SCHEMA_VERSION,
    name: '新しいイベント',
    shortName: 'NEW EVENT',
    date: now.slice(0, 10),
    venue: '',
    description: '',
    booths: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function duplicateProject(project: EventProject): EventProject {
  const now = new Date().toISOString()
  return {
    ...structuredClone(project),
    id: crypto.randomUUID(),
    name: `${project.name} のコピー`,
    booths: project.booths.map((booth) => ({ ...booth, id: crypto.randomUUID(), items: booth.items.map((item) => ({ ...item, id: crypto.randomUUID() })) })),
    createdAt: now,
    updatedAt: now,
  }
}

export function removeProject(projects: EventProject[], id: string): EventProject[] {
  return projects.filter((project) => project.id !== id)
}

export function selectProject(projects: EventProject[], id: string): EventProject | undefined {
  return projects.find((project) => project.id === id)
}

export function useEventProjects() {
  const initial = useMemo(() => {
    const saved = loadProjects()
    return saved.length ? saved : [createSampleEvent()]
  }, [])
  const [projects, setProjects] = useState(initial)
  const [currentId, setCurrentId] = useState(() => {
    const last = loadLastProjectId()
    return initial.some((project) => project.id === last) ? last! : initial[0].id
  })
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const initialized = useRef(false)
  const current = projects.find((project) => project.id === currentId) ?? projects[0]

  const pending = useRef<{ projects: EventProject[]; currentId: string } | null>(null)
  const flush = useCallback((notify = true) => {
    if (!pending.current) return
    try {
      saveProjects(pending.current.projects)
      saveLastProjectId(pending.current.currentId)
      pending.current = null
      if (notify) setSaveStatus('saved')
    } catch {
      // 失敗した変更は保持し、次の編集・終了通知で再試行する。
      if (notify) setSaveStatus('error')
    }
  }, [])

  useLayoutEffect(() => {
    if (!initialized.current) { initialized.current = true; return }
    pending.current = { projects, currentId }
    setSaveStatus('saving')
    const timer = window.setTimeout(() => flush(), 250)
    return () => window.clearTimeout(timer)
  }, [projects, currentId, flush])

  useEffect(() => {
    const onHide = () => flush()
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush() }
    window.addEventListener('pagehide', onHide)
    window.addEventListener('beforeunload', onHide)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', onHide)
      window.removeEventListener('beforeunload', onHide)
      document.removeEventListener('visibilitychange', onVisibility)
      flush(false)
    }
  }, [flush])

  const updateCurrent = useCallback((update: EventProject | ((project: EventProject) => EventProject)) => {
    setProjects((all) => all.map((project) => project.id === currentId
      ? { ...(typeof update === 'function' ? update(project) : update), updatedAt: new Date().toISOString() }
      : project))
  }, [currentId])

  const add = useCallback((project = createBlankProject()) => {
    setProjects((all) => [...all, project])
    setCurrentId(project.id)
  }, [])

  const duplicate = useCallback(() => {
    if (!current) return
    add(duplicateProject(current))
  }, [add, current])

  const remove = useCallback((id: string) => {
    setProjects((all) => {
      const next = removeProject(all, id)
      if (!next.length) {
        const sample = createSampleEvent()
        setCurrentId(sample.id)
        return [sample]
      }
      if (id === currentId) setCurrentId(next[0].id)
      return next
    })
  }, [currentId])

  const resetSample = useCallback(() => {
    const sample = createSampleEvent()
    setProjects((all) => all.some((project) => project.id === SAMPLE_EVENT_ID)
      ? all.map((project) => project.id === SAMPLE_EVENT_ID ? sample : project)
      : [...all, sample])
    setCurrentId(sample.id)
  }, [])

  return { projects, current, currentId, setCurrentId, updateCurrent, add, duplicate, remove, resetSample, saveStatus }
}
