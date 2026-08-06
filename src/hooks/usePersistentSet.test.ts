import { describe, expect, it } from 'vitest'
import { toggleId } from './usePersistentSet'

describe('保存状態の切り替え', () => {
  it('お気に入り状態を追加・削除できる', () => {
    const added = toggleId([], 'b27')
    expect(added).toEqual(['b27'])
    expect(toggleId(added, 'b27')).toEqual([])
  })
  it('訪問済み状態を追加・削除できる', () => {
    const added = toggleId(['a01'], 'd44')
    expect(added).toEqual(['a01', 'd44'])
    expect(toggleId(added, 'd44')).toEqual(['a01'])
  })
})
