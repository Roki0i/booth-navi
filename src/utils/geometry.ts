import type { Booth } from '../types/booth'
import type { ResizeHandle } from '../types/editor'

export const MIN_BOOTH_SIZE = 2
export const MIN_GRID_SIZE = 0.25
export const MAX_GRID_SIZE = 25

export type Alignment =
  | 'left' | 'right' | 'top' | 'bottom'
  | 'horizontal' | 'vertical' | 'width' | 'height'

export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value))
}

export function clampBooth<T extends Pick<Booth, 'x' | 'y' | 'width' | 'height'>>(booth: T): T {
  const width = clamp(booth.width, MIN_BOOTH_SIZE, 100)
  const height = clamp(booth.height, MIN_BOOTH_SIZE, 100)
  return {
    ...booth,
    width,
    height,
    x: clamp(booth.x, 0, 100 - width),
    y: clamp(booth.y, 0, 100 - height),
  }
}

export function snap(value: number, gridSize: number, enabled: boolean): number {
  return enabled && gridSize > 0 ? Math.round(value / gridSize) * gridSize : value
}

const floorToGrid = (value: number, gridSize: number) =>
  Math.floor((value + Number.EPSILON) / gridSize) * gridSize

export function snapBooth<T extends Pick<Booth, 'x' | 'y' | 'width' | 'height'>>(
  booth: T,
  gridSize: number,
  enabled = true,
): T {
  if (!enabled || !Number.isFinite(gridSize) || gridSize <= 0) return clampBooth(booth)
  const minimum = Math.ceil(MIN_BOOTH_SIZE / gridSize) * gridSize
  const width = clamp(snap(booth.width, gridSize, true), minimum, floorToGrid(100, gridSize))
  const height = clamp(snap(booth.height, gridSize, true), minimum, floorToGrid(100, gridSize))
  return {
    ...booth,
    width,
    height,
    x: clamp(snap(booth.x, gridSize, true), 0, floorToGrid(100 - width, gridSize)),
    y: clamp(snap(booth.y, gridSize, true), 0, floorToGrid(100 - height, gridSize)),
  }
}

export const snapBooths = (booths: Booth[], gridSize: number): Booth[] =>
  booths.map((booth) => snapBooth(booth, gridSize))

export function moveBooth(booth: Booth, dx: number, dy: number, gridSize = 1, snapEnabled = false): Booth {
  const moved = {
    ...booth,
    x: booth.x + dx,
    y: booth.y + dy,
  }
  return snapEnabled ? snapBooth(moved, gridSize) : clampBooth(moved)
}

export function resizeBooth(
  booth: Booth,
  handle: ResizeHandle,
  dx: number,
  dy: number,
  gridSize = 1,
  snapEnabled = false,
): Booth {
  let { x, y, width, height } = booth
  if (handle.includes('e')) width += dx
  if (handle.includes('s')) height += dy
  if (handle.includes('w')) { x += dx; width -= dx }
  if (handle.includes('n')) { y += dy; height -= dy }
  if (handle === 'n' || handle === 's') width = booth.width
  if (handle === 'e' || handle === 'w') height = booth.height
  if (width < MIN_BOOTH_SIZE) {
    if (handle.includes('w')) x -= MIN_BOOTH_SIZE - width
    width = MIN_BOOTH_SIZE
  }
  if (height < MIN_BOOTH_SIZE) {
    if (handle.includes('n')) y -= MIN_BOOTH_SIZE - height
    height = MIN_BOOTH_SIZE
  }
  const resized = {
    ...booth,
    x,
    y,
    width,
    height,
  }
  return snapEnabled ? snapBooth(resized, gridSize) : clampBooth(resized)
}

export function alignBooths(booths: Booth[], selectedIds: string[], alignment: Alignment): Booth[] {
  const selected = booths.filter((booth) => selectedIds.includes(booth.id))
  if (selected.length < 2) return booths
  const left = Math.min(...selected.map((booth) => booth.x))
  const right = Math.max(...selected.map((booth) => booth.x + booth.width))
  const top = Math.min(...selected.map((booth) => booth.y))
  const bottom = Math.max(...selected.map((booth) => booth.y + booth.height))
  const reference = selected[0]
  const updates = new Map<string, Booth>()

  selected.forEach((booth) => {
    let next = booth
    if (alignment === 'left') next = { ...booth, x: left }
    if (alignment === 'right') next = { ...booth, x: right - booth.width }
    if (alignment === 'top') next = { ...booth, y: top }
    if (alignment === 'bottom') next = { ...booth, y: bottom - booth.height }
    if (alignment === 'width') next = { ...booth, width: reference.width }
    if (alignment === 'height') next = { ...booth, height: reference.height }
    updates.set(booth.id, clampBooth(next))
  })

  if (alignment === 'horizontal' || alignment === 'vertical') {
    const horizontal = alignment === 'horizontal'
    const ordered = [...selected].sort((a, b) => horizontal ? a.x - b.x : a.y - b.y)
    const start = horizontal ? left : top
    const end = horizontal ? right : bottom
    const totalSize = ordered.reduce((sum, booth) => sum + (horizontal ? booth.width : booth.height), 0)
    const gap = (end - start - totalSize) / (ordered.length - 1)
    let cursor = start
    ordered.forEach((booth) => {
      updates.set(booth.id, clampBooth(horizontal ? { ...booth, x: cursor } : { ...booth, y: cursor }))
      cursor += (horizontal ? booth.width : booth.height) + gap
    })
  }
  return booths.map((booth) => updates.get(booth.id) ?? booth)
}
