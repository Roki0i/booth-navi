import { describe, expect, it } from 'vitest'
import { calculateBoothScrollPosition, calculateFitZoom } from './mapFit'

describe('calculateFitZoom', () => {
  it('横幅と縦幅のうち厳しい方へマップを収める', () => {
    expect(calculateFitZoom(700, 600, 900, 700)).toBeCloseTo(660 / 900)
    expect(calculateFitZoom(1200, 500, 900, 700)).toBeCloseTo(460 / 700)
  })

  it('マップを元のサイズより拡大しない', () => {
    expect(calculateFitZoom(1400, 1000, 900, 700)).toBe(1)
  })

  it('不正な寸法では安全な倍率を返す', () => {
    expect(calculateFitZoom(0, 600, 900, 700)).toBe(1)
  })

  it.each([
    [375, 440],
    [390, 440],
    [412, 440],
  ])('モバイル幅 %ipx でマップ全体が収まる', (width, height) => {
    const zoom = calculateFitZoom(width, height, 900, 700)
    expect(900 * zoom).toBeLessThanOrEqual(width - 40)
    expect(700 * zoom).toBeLessThanOrEqual(height - 40)
  })

  it('PC幅でもコンテナの高さに合わせて全体を収める', () => {
    const zoom = calculateFitZoom(780, 580, 900, 700)
    expect(zoom).toBeCloseTo(540 / 700)
  })

  it('リサイズ後のコンテナ寸法で倍率を再計算できる', () => {
    const portrait = calculateFitZoom(390, 440, 900, 700)
    const landscape = calculateFitZoom(844, 390, 900, 700)
    expect(landscape).not.toBe(portrait)
    expect(landscape).toBeCloseTo(350 / 700)
  })

  it('拡大後もフィット倍率を再計算して全体表示へ戻せる', () => {
    const fitZoom = calculateFitZoom(390, 440, 900, 700)
    const enlargedZoom = fitZoom + .25
    expect(enlargedZoom).toBeGreaterThan(fitZoom)
    expect(calculateFitZoom(390, 440, 900, 700)).toBe(fitZoom)
  })
})

describe('calculateBoothScrollPosition', () => {
  it('選択したブースの中心が表示領域の中心へ来る位置を返す', () => {
    expect(calculateBoothScrollPosition(
      { x: 80, y: 70, width: 10, height: 10 },
      900,
      700,
      1.5,
      390,
      440,
    )).toEqual({ left: 952.5, top: 567.5 })
  })
})
