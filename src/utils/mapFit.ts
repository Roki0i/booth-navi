export const MAP_FIT_PADDING = 40

export function calculateFitZoom(
  containerWidth: number,
  containerHeight: number,
  mapWidth: number,
  mapHeight: number,
  padding = MAP_FIT_PADDING,
): number {
  if ([containerWidth, containerHeight, mapWidth, mapHeight].some((value) => !Number.isFinite(value) || value <= 0)) return 1
  const availableWidth = Math.max(1, containerWidth - padding)
  const availableHeight = Math.max(1, containerHeight - padding)
  return Math.min(1, availableWidth / mapWidth, availableHeight / mapHeight)
}

interface BoothBounds {
  x: number
  y: number
  width: number
  height: number
}

export function calculateBoothScrollPosition(
  booth: BoothBounds,
  mapWidth: number,
  mapHeight: number,
  zoom: number,
  containerWidth: number,
  containerHeight: number,
) {
  const centerX = ((booth.x + booth.width / 2) / 100) * mapWidth * zoom
  const centerY = ((booth.y + booth.height / 2) / 100) * mapHeight * zoom
  return {
    left: Math.max(0, centerX - containerWidth / 2),
    top: Math.max(0, centerY - containerHeight / 2),
  }
}
