import { describe, expect, it } from 'vitest'
import { createSampleEvent } from '../data/sampleEvents'
import { alignBooths, clampBooth, MIN_BOOTH_SIZE, moveBooth, resizeBooth, snapBooth, snapBooths } from './geometry'

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
  it('xとyをグリッド間隔の倍数へ丸める', () => {
    const result = snapBooth({ ...booth, x: 11.3, y: 19.1 }, 2)
    expect(result.x).toBe(12); expect(result.y).toBe(20)
  })
  it('widthとheightをグリッド間隔の倍数へ丸める', () => {
    const result = snapBooth({ ...booth, width: 7.2, height: 5.1 }, 2)
    expect(result.width).toBe(8); expect(result.height).toBe(6)
  })
  it('ドラッグ後に位置をグリッドへ揃える', () => {
    const result = moveBooth({ ...booth, x: 10.3, y: 20.3 }, 1.1, 1.1, 2, true)
    expect(result.x % 2).toBe(0); expect(result.y % 2).toBe(0)
  })
  it('リサイズ後に位置とサイズをグリッドへ揃える', () => {
    const result = resizeBooth({ ...booth, x: 11, y: 19, width: 7, height: 5 }, 'se', .3, .3, 2, true)
    expect([result.x, result.y, result.width, result.height].every((value) => value % 2 === 0)).toBe(true)
  })
  it('新規追加位置をグリッドへ揃える', () => {
    const result = snapBooth({ ...booth, x: 13.3, y: 27.1, width: 8, height: 6 }, 2)
    expect(result.x).toBe(14); expect(result.y).toBe(28)
  })
  it('複製後の位置をグリッドへ揃える', () => {
    const result = moveBooth({ ...booth, x: 11.3, y: 19.1 }, 2, 2, 2, true)
    expect(result.x % 2).toBe(0); expect(result.y % 2).toBe(0)
  })
  it('グリッド補正後もマップ外へはみ出さない', () => {
    const result = snapBooth({ ...booth, x: 99, y: 99, width: 7.2, height: 5.1 }, 3)
    expect(result.x + result.width).toBeLessThanOrEqual(100); expect(result.y + result.height).toBeLessThanOrEqual(100)
  })
  it('グリッド補正後も最小サイズを下回らない', () => {
    const result = snapBooth({ ...booth, width: .1, height: .1 }, 1)
    expect(result.width).toBeGreaterThanOrEqual(MIN_BOOTH_SIZE); expect(result.height).toBeGreaterThanOrEqual(MIN_BOOTH_SIZE)
  })
  it('選択中のブースだけを一括補正できる', () => {
    const other = { ...booth, id: 'other', x: 3.1 }
    const result = [booth, other].map((item) => item.id === booth.id ? snapBooth(item, 2) : item)
    expect(result[0].x % 2).toBe(0); expect(result[1].x).toBe(3.1)
  })
  it('すべてのブースを一括補正できる', () => {
    expect(snapBooths([{ ...booth, x: 3.1 }, { ...booth, id: 'other', x: 5.1 }], 2).every((item) => item.x % 2 === 0)).toBe(true)
  })
  it('グリッド無効時は自由な座標を維持する', () => {
    expect(moveBooth({ ...booth, x: 10.1 }, .37, 0, 2, false).x).toBeCloseTo(10.47)
  })
})

describe('ブースの整列', () => {
  const base = createSampleEvent().booths.slice(0, 3).map((booth, index) => ({ ...booth, id: String(index), x: 10 + index * 15, y: 10 + index * 12, width: 6 + index, height: 4 + index }))
  it.each([
    ['left', (items: typeof base) => new Set(items.map((item) => item.x)).size],
    ['right', (items: typeof base) => new Set(items.map((item) => item.x + item.width)).size],
    ['top', (items: typeof base) => new Set(items.map((item) => item.y)).size],
    ['bottom', (items: typeof base) => new Set(items.map((item) => item.y + item.height)).size],
    ['width', (items: typeof base) => new Set(items.map((item) => item.width)).size],
    ['height', (items: typeof base) => new Set(items.map((item) => item.height)).size],
  ] as const)('%sへ揃える', (alignment, uniqueCount) => {
    expect(uniqueCount(alignBooths(base, base.map((item) => item.id), alignment))).toBe(1)
  })
  it.each(['horizontal', 'vertical'] as const)('%sへ等間隔に並べる', (alignment) => {
    const result = alignBooths(base, base.map((item) => item.id), alignment)
    const horizontal = alignment === 'horizontal'
    const gaps = result.slice(1).map((item, index) => (horizontal ? item.x - (result[index].x + result[index].width) : item.y - (result[index].y + result[index].height)))
    expect(gaps[0]).toBeCloseTo(gaps[1])
  })
})
