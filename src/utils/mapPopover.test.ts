import { describe, expect, it } from 'vitest'
import { calculateMapPopoverPosition, POPOVER_WIDTH } from './mapPopover'

const booth = { x: 40, y: 40, width: 10, height: 8 }

describe('calculateMapPopoverPosition', () => {
  it('マップ上端ではブースの下側へ表示する', () => {
    expect(calculateMapPopoverPosition({ ...booth, y: 1 }, 900, 700, 1).placement).toBe('below')
  })

  it('左右端で吹き出しをマップ内へ補正する', () => {
    const left = calculateMapPopoverPosition({ ...booth, x: 0 }, 900, 700, 1)
    const right = calculateMapPopoverPosition({ ...booth, x: 98 }, 900, 700, 1)
    expect(left.left).toBeGreaterThanOrEqual(8)
    expect(right.left + POPOVER_WIDTH).toBeLessThanOrEqual(900 - 8)
    expect(right.arrowLeft).toBeGreaterThan(POPOVER_WIDTH / 2)
  })

  it('倍率を反映してマップ内へ配置する', () => {
    const result = calculateMapPopoverPosition(booth, 900, 700, .5)
    expect(result.left + POPOVER_WIDTH).toBeLessThanOrEqual(450 - 8)
    expect(result.top).toBeGreaterThanOrEqual(8)
  })
})
