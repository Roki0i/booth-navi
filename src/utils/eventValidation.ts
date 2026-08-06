import { EVENT_SCHEMA_VERSION, type EventProject, type EventTheme } from '../types/event'
import type { Booth } from '../types/booth'
import { clampBooth } from './geometry'

export const isValidColor = (value: string): boolean =>
  /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value) ||
  /^rgb(a)?\(\s*\d+(\.\d+)?%?(\s*,\s*\d+(\.\d+)?%?){2}(\s*,\s*(0|1|0?\.\d+))?\s*\)$/i.test(value)

export function themeToCssVariables(theme: EventTheme): Record<string, string> {
  const candidates: Record<string, string> = {
    '--event-primary': theme.primaryColor,
    '--event-background': theme.backgroundColor,
    '--event-surface': theme.surfaceColor,
    '--event-text': theme.textColor,
    '--event-muted': theme.mutedTextColor,
    '--event-map-background': theme.mapBackgroundColor,
    '--event-map-surface': theme.mapSurfaceColor,
    '--event-map-text': theme.mapTextColor,
  }
  return Object.fromEntries(Object.entries(candidates).filter(([, value]) => isValidColor(value)))
}

export const normalizeTheme = (theme: EventTheme): EventTheme => ({
  ...theme,
  mapBackgroundColor: theme.mapBackgroundColor ?? '#ece9df',
  mapSurfaceColor: theme.mapSurfaceColor ?? '#f8f6ef',
  mapTextColor: theme.mapTextColor ?? '#25252a',
  mapStyle: theme.mapStyle ?? 'light',
})

export function findDuplicateBoothNumbers(booths: Booth[]): string[] {
  const counts = new Map<string, number>()
  booths.forEach((booth) => counts.set(booth.boothNumber.trim().toUpperCase(), (counts.get(booth.boothNumber.trim().toUpperCase()) ?? 0) + 1))
  return [...counts].filter(([key, count]) => key && count > 1).map(([key]) => key)
}

export function validateProject(value: unknown): { valid: boolean; errors: string[]; project?: EventProject } {
  const errors: string[] = []
  if (!value || typeof value !== 'object') return { valid: false, errors: ['JSONのルートはオブジェクトである必要があります。'] }
  const project = value as Partial<EventProject>
  if (project.schemaVersion !== EVENT_SCHEMA_VERSION) errors.push(`schemaVersionは${EVENT_SCHEMA_VERSION}である必要があります。`)
  for (const field of ['id', 'name', 'shortName', 'date', 'venue', 'createdAt', 'updatedAt'] as const) {
    if (typeof project[field] !== 'string' || !project[field]) errors.push(`${field}は必須です。`)
  }
  if (!project.theme || typeof project.theme !== 'object') errors.push('themeは必須です。')
  if (!project.map || typeof project.map !== 'object') errors.push('mapは必須です。')
  if (!Array.isArray(project.booths)) errors.push('boothsは配列である必要があります。')
  if (Array.isArray(project.booths)) {
    project.booths.forEach((booth, index) => {
      if (!booth || typeof booth !== 'object' || !booth.id || !booth.boothNumber || !booth.circleName) errors.push(`booths[${index}]の必須項目が不足しています。`)
      else if ([booth.x, booth.y, booth.width, booth.height].some((number) => typeof number !== 'number' || !Number.isFinite(number))) errors.push(`booths[${index}]の座標が不正です。`)
    })
  }
  if (errors.length) return { valid: false, errors }
  const normalized = structuredClone(project as EventProject)
  normalized.theme = normalizeTheme(normalized.theme)
  normalized.booths = normalized.booths.map(clampBooth)
  return { valid: true, errors: [], project: normalized }
}
