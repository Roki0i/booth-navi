import { EVENT_SCHEMA_VERSION, type EventProject, type EventTheme } from '../types/event'
import type { Booth } from '../types/booth'
import { clampBooth } from './geometry'
import { normalizeBooth } from './boothMetadata'

export const isValidColor = (value: string): boolean =>
  /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value) ||
  /^rgb(a)?\(\s*\d+(\.\d+)?%?(\s*,\s*\d+(\.\d+)?%?){2}(\s*,\s*(0|1|0?\.\d+))?\s*\)$/i.test(value)

type Rgb = [number, number, number]

const parseColor = (value: string): Rgb | undefined => {
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1]
  if (hex) {
    const expanded = hex.length === 3 ? [...hex].map((digit) => digit + digit).join('') : hex
    return [0, 2, 4].map((offset) => Number.parseInt(expanded.slice(offset, offset + 2), 16)) as Rgb
  }
  const rgb = value.match(/^rgba?\(\s*(\d+(?:\.\d+)?%?)\s*,\s*(\d+(?:\.\d+)?%?)\s*,\s*(\d+(?:\.\d+)?%?)/i)
  if (!rgb) return undefined
  return rgb.slice(1, 4).map((channel) => channel.endsWith('%')
    ? Math.round(Number.parseFloat(channel) * 2.55)
    : Math.round(Number.parseFloat(channel))) as Rgb
}

const luminance = ([red, green, blue]: Rgb): number => {
  const [r, g, b] = [red, green, blue].map((channel) => {
    const value = channel / 255
    return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4
  })
  return .2126 * r + .7152 * g + .0722 * b
}

const contrastRatio = (first: Rgb, second: Rgb): number => {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a)
  return (lighter + .05) / (darker + .05)
}

const accessibleTextColor = (preferred: string, background: string, minimum = 4.5): string => {
  const foregroundRgb = parseColor(preferred)
  const backgroundRgb = parseColor(background)
  if (!foregroundRgb || !backgroundRgb || contrastRatio(foregroundRgb, backgroundRgb) >= minimum) return preferred
  const dark = '#25252a'
  const light = '#f4f3f7'
  return contrastRatio(parseColor(dark)!, backgroundRgb) >= contrastRatio(parseColor(light)!, backgroundRgb) ? dark : light
}

export function themeToCssVariables(theme: EventTheme): Record<string, string> {
  const textColor = accessibleTextColor(theme.textColor, theme.surfaceColor)
  const mutedTextColor = accessibleTextColor(theme.mutedTextColor, theme.surfaceColor)
  const candidates: Record<string, string> = {
    '--event-primary': theme.primaryColor,
    '--event-background': theme.backgroundColor,
    '--event-surface': theme.surfaceColor,
    '--event-text': textColor,
    '--event-muted': mutedTextColor,
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

export function validateProject(value: unknown): { valid: boolean; errors: string[]; project?: EventProject } {
  const errors: string[] = []
  if (!isRecord(value)) return { valid: false, errors: ['JSONのルートはオブジェクトである必要があります。'] }
  const project = value
  const stringField = (record: Record<string, unknown>, field: string, path: string, nonempty = false) => {
    const value = record[field]
    if (typeof value !== 'string' || (nonempty && !value.trim())) errors.push(`${path}は${nonempty ? '空でない' : ''}文字列である必要があります。`)
  }
  const imageReference = (value: unknown, path: string) => {
    if (value === undefined) return
    if (!isRecord(value)) { errors.push(`${path}は画像参照である必要があります。`); return }
    stringField(value, 'id', `${path}.id`, true)
    stringField(value, 'alt', `${path}.alt`)
  }
  const uniqueId = (record: Record<string, unknown>, ids: Set<string>, path: string) => {
    stringField(record, 'id', `${path}.id`, true)
    if (typeof record.id !== 'string') return
    if (ids.has(record.id)) errors.push(`${path}.idが重複しています。`)
    ids.add(record.id)
  }
  if (!Number.isInteger(project.schemaVersion) || (project.schemaVersion as number) < 1 || (project.schemaVersion as number) > EVENT_SCHEMA_VERSION) {
    errors.push(`schemaVersionは1〜${EVENT_SCHEMA_VERSION}の整数である必要があります。`)
  }
  for (const field of ['id', 'name', 'shortName', 'date', 'venue', 'description', 'createdAt', 'updatedAt']) {
    // 編集中の空欄は有効。識別子のみ空文字を許可しない。
    stringField(project, field, field, field === 'id')
  }
  if (!isRecord(project.assets)) errors.push('assetsはオブジェクトである必要があります。')
  else for (const field of ['logoImage', 'heroImage', 'pageBackgroundImage', 'mapImage']) imageReference(project.assets[field], `assets.${field}`)

  if (!isRecord(project.theme)) errors.push('themeはオブジェクトである必要があります。')
  else {
    const legacyDefaults = new Set(['mapBackgroundColor', 'mapSurfaceColor', 'mapTextColor'])
    for (const field of ['primaryColor', 'backgroundColor', 'surfaceColor', 'textColor', 'mutedTextColor', ...legacyDefaults]) {
      const color = project.theme[field]
      if (color === undefined && legacyDefaults.has(field)) continue
      if (typeof color !== 'string' || !isValidColor(color)) errors.push(`theme.${field}は有効な色である必要があります。`)
    }
    if (!['sans', 'serif', 'rounded'].includes(project.theme.fontStyle as string)) errors.push('theme.fontStyleが不正です。')
    if (project.theme.mapStyle !== undefined && !['light', 'dark', 'image'].includes(project.theme.mapStyle as string)) errors.push('theme.mapStyleが不正です。')
  }
  if (!isRecord(project.map)) errors.push('mapはオブジェクトである必要があります。')
  else {
    for (const field of ['width', 'height', 'gridSize']) {
      const number = project.map[field]
      if (!isFiniteNumber(number) || number <= 0) errors.push(`map.${field}は有限の正数である必要があります。`)
    }
    if (typeof project.map.showGrid !== 'boolean') errors.push('map.showGridは真偽値である必要があります。')
    imageReference(project.map.backgroundImage, 'map.backgroundImage')
  }
  if (!Array.isArray(project.booths)) errors.push('boothsは配列である必要があります。')
  else {
    const boothIds = new Set<string>()
    project.booths.forEach((booth: unknown, index) => {
      const path = `booths[${index}]`
      if (!isRecord(booth)) { errors.push(`${path}はオブジェクトである必要があります。`); return }
      uniqueId(booth, boothIds, path)
      for (const field of ['boothNumber', 'circleName', 'area', 'genre', 'description', 'xUrl', 'shopUrl']) stringField(booth, field, `${path}.${field}`)
      if ([booth.x, booth.y, booth.width, booth.height].some((number) => !isFiniteNumber(number))) errors.push(`${path}の座標が不正です。`)
      imageReference(booth.menuImage, `${path}.menuImage`)
      if (!Array.isArray(booth.items)) errors.push(`${path}.itemsは配列である必要があります。`)
      else {
        // 商品IDは、編集・削除が行われるブース内で一意にする。
        const itemIds = new Set<string>()
        booth.items.forEach((item: unknown, itemIndex) => {
          const itemPath = `${path}.items[${itemIndex}]`
          if (!isRecord(item)) { errors.push(`${itemPath}はオブジェクトである必要があります。`); return }
          uniqueId(item, itemIds, itemPath)
          for (const field of ['name', 'description']) stringField(item, field, `${itemPath}.${field}`)
          if (!isFiniteNumber(item.price) || item.price < 0) errors.push(`${itemPath}.priceは有限の非負数である必要があります。`)
          if (!['新刊', '既刊', 'グッズ'].includes(item.type as string)) errors.push(`${itemPath}.typeが不正です。`)
        })
      }
    })
  }
  if (errors.length) return { valid: false, errors }
  const normalized = structuredClone(project as unknown as EventProject)
  normalized.schemaVersion = EVENT_SCHEMA_VERSION
  normalized.theme = normalizeTheme(normalized.theme)
  normalized.booths = normalized.booths.map((booth) => clampBooth(normalizeBooth(booth)))
  return { valid: true, errors: [], project: normalized }
}
