import type { EventProject } from '../types/event'
import { EVENT_SCHEMA_VERSION } from '../types/event'
import { normalizeBooth } from '../utils/boothMetadata'
import { normalizeTheme } from '../utils/eventValidation'

export const PROJECTS_KEY = 'booth-navi:event-projects'
export const LAST_PROJECT_KEY = 'booth-navi:last-event'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function loadProjects(storage: StorageLike = localStorage): EventProject[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(PROJECTS_KEY) ?? '[]')
    return Array.isArray(value) ? (value as EventProject[]).map((project) => ({
      ...project,
      schemaVersion: EVENT_SCHEMA_VERSION,
      theme: normalizeTheme(project.theme),
      booths: Array.isArray(project.booths) ? project.booths.map(normalizeBooth) : [],
    })) : []
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
