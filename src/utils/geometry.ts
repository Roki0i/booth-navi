import type { Booth } from '../types/booth'
import type { ResizeHandle } from '../types/editor'

export const MIN_BOOTH_SIZE = 2

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

export function moveBooth(booth: Booth, dx: number, dy: number, gridSize = 1, snapEnabled = false): Booth {
  return clampBooth({
    ...booth,
    x: snap(booth.x + dx, gridSize, snapEnabled),
    y: snap(booth.y + dy, gridSize, snapEnabled),
  })
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
  return clampBooth({
    ...booth,
    x: snap(x, gridSize, snapEnabled),
    y: snap(y, gridSize, snapEnabled),
    width: snap(width, gridSize, snapEnabled),
    height: snap(height, gridSize, snapEnabled),
  })
}
