import { describe, expect, it } from 'vitest'
import { booths } from '../data/booths'
import { normalizeBooth, normalizePaymentMethods, shouldShowSourceFields, togglePaymentMethod } from './boothMetadata'

describe('ブースの作品・支払い情報', () => {
  it('支払い方法を複数選択・解除できる', () => {
    expect(togglePaymentMethod(togglePaymentMethod([], '現金'), '交通系IC')).toEqual(['現金', '交通系IC'])
    expect(togglePaymentMethod(['現金', '交通系IC'], '現金')).toEqual(['交通系IC'])
  })

  it('旧文字列形式を配列へ変換できる', () => {
    expect(normalizePaymentMethods('現金|交通系IC')).toEqual(['現金', '交通系IC'])
  })

  it('二次創作からオリジナルへ切り替えても原作情報を保持する', () => {
    const derivative = { ...booths[0], workCategory: 'derivative' as const, sourceMedia: 'manga' as const, sourceTitle: '月灯り物語' }
    const original = normalizeBooth({ ...derivative, workCategory: 'original' })
    expect(original).toMatchObject({ sourceMedia: 'manga', sourceTitle: '月灯り物語' })
  })

  it('オリジナルでは原作情報欄を表示しない', () => {
    expect(shouldShowSourceFields('original')).toBe(false)
    expect(shouldShowSourceFields('derivative')).toBe(true)
  })
})
