import { describe, expect, it } from 'vitest'
import { closeViewerSheet, isSheetCloseKey, selectViewerBooth } from './viewerSelection'

describe('閲覧モードのブース選択', () => {
  it.each(['マップ', '検索結果', 'お気に入り一覧'])('モバイルで%sから選択するとボトムシートを開く', () => {
    expect(selectViewerBooth('booth-b27', true)).toEqual({
      selectedId: 'booth-b27',
      isSheetOpen: true,
    })
  })

  it('閉じても選択中のブースを維持する', () => {
    expect(closeViewerSheet('booth-b27')).toEqual({
      selectedId: 'booth-b27',
      isSheetOpen: false,
    })
  })

  it('別ブースを選択すると開いたまま内容を切り替える', () => {
    const next = selectViewerBooth('booth-c12', true)
    expect(next.selectedId).toBe('booth-c12')
    expect(next.isSheetOpen).toBe(true)
  })

  it('Escapeキーだけを閉じる操作として扱う', () => {
    expect(isSheetCloseKey('Escape')).toBe(true)
    expect(isSheetCloseKey('Enter')).toBe(false)
  })

  it('PCではシートを開かず右側詳細パネルを維持する', () => {
    expect(selectViewerBooth('booth-b27', false).isSheetOpen).toBe(false)
  })
})
