import type { EventProject } from '../types/event'
import { validateProject } from './eventValidation'

export function exportProject(project: EventProject): string {
  return JSON.stringify(project, null, 2)
}

export function importProject(text: string): { project?: EventProject; errors: string[] } {
  try {
    const result = validateProject(JSON.parse(text))
    return result.valid ? { project: result.project, errors: [] } : { errors: result.errors }
  } catch {
    return { errors: ['JSONの構文が不正です。'] }
  }
}

export function projectFileName(name: string): string {
  const safe = name.normalize('NFKC').replace(/[\\/:*?"<>|]+/g, '-').trim().replace(/\s+/g, '-')
  return `${safe || 'event-project'}.json`
}

export function downloadText(content: string, fileName: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}
