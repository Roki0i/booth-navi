import type { EventProject } from '../types/event'
import { validateProject } from '../utils/eventValidation'

export const PROJECTS_KEY = 'booth-navi:event-projects'
export const LAST_PROJECT_KEY = 'booth-navi:last-event'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function loadProjects(storage: StorageLike = localStorage): EventProject[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(PROJECTS_KEY) ?? '[]')
    if (!Array.isArray(value)) return []
    return value.flatMap((entry: unknown) => {
      const result = validateProject(entry)
      return result.valid && result.project ? [result.project] : []
    })
  } catch {
    return []
  }
}

export function saveProjects(projects: EventProject[], storage: StorageLike = localStorage): void {
  storage.setItem(PROJECTS_KEY, JSON.stringify(projects))
}

export function loadLastProjectId(storage: StorageLike = localStorage): string | null {
  try { return storage.getItem(LAST_PROJECT_KEY) } catch { return null }
}

export function saveLastProjectId(id: string, storage: StorageLike = localStorage): void {
  storage.setItem(LAST_PROJECT_KEY, id)
}
