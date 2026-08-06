import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

  useEffect(() => {
    if (!initialized.current) { initialized.current = true; return }
    setSaveStatus('saving')
    const timer = window.setTimeout(() => {
      try {
        saveProjects(projects)
        saveLastProjectId(currentId)
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
    }, 250)
    return () => window.clearTimeout(timer)
  }, [projects, currentId])

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
