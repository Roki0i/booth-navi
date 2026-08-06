import type { Booth } from '../types/booth'

export const POPOVER_WIDTH = 236
export const POPOVER_HEIGHT = 120
const GAP = 14
const EDGE_GAP = 8

export interface MapPopoverPosition {
  left: number
  top: number
  arrowLeft: number
  placement: 'above' | 'below'
}

export function calculateMapPopoverPosition(
  booth: Pick<Booth, 'x' | 'y' | 'width' | 'height'>,
  mapWidth: number,
  mapHeight: number,
  zoom: number,
): MapPopoverPosition {
  const width = mapWidth * zoom
  const height = mapHeight * zoom
  const boothLeft = booth.x / 100 * width
  const boothTop = booth.y / 100 * height
  const boothWidth = booth.width / 100 * width
  const boothHeight = booth.height / 100 * height
  const anchorX = boothLeft + boothWidth / 2
  const placement = boothTop >= POPOVER_HEIGHT + GAP + EDGE_GAP ? 'above' : 'below'
  const maxLeft = Math.max(EDGE_GAP, width - POPOVER_WIDTH - EDGE_GAP)
  const left = Math.min(Math.max(anchorX - POPOVER_WIDTH / 2, EDGE_GAP), maxLeft)
  const top = placement === 'above'
    ? boothTop - POPOVER_HEIGHT - GAP
    : Math.min(boothTop + boothHeight + GAP, Math.max(EDGE_GAP, height - POPOVER_HEIGHT - EDGE_GAP))
  const arrowLeft = Math.min(Math.max(anchorX - left, 18), POPOVER_WIDTH - 18)

  return { left, top, arrowLeft, placement }
}
