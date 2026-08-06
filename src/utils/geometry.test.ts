import { describe, expect, it } from 'vitest'
import { createSampleEvent } from '../data/sampleEvents'
import { clampBooth, MIN_BOOTH_SIZE, moveBooth, resizeBooth } from './geometry'

describe('マップ座標', () => {
  const booth = createSampleEvent().booths[0]
  it('座標を0〜100内へ収める', () => {
    const result = clampBooth({ ...booth, x: -20, y: 110, width: 150, height: -1 })
    expect(result.x).toBeGreaterThanOrEqual(0); expect(result.y + result.height).toBeLessThanOrEqual(100)
  })
  it('ドラッグ時にマップ外へ出さない', () => {
    const result = moveBooth(booth, 1000, 1000)
    expect(result.x + result.width).toBeLessThanOrEqual(100); expect(result.y + result.height).toBeLessThanOrEqual(100)
  })
  it('リサイズ時に最小サイズを維持する', () => {
    const result = resizeBooth(booth, 'se', -100, -100)
    expect(result.width).toBe(MIN_BOOTH_SIZE); expect(result.height).toBe(MIN_BOOTH_SIZE)
  })
})
