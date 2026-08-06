import { describe, expect, it } from 'vitest'
import { UI_TEXT } from './uiText'

describe('主要な日本語表示', () => {
  it('検索方法を自然な表記で案内する', () => {
    expect(UI_TEXT.searchHint).toBe('ハイフン・空白・全角／半角を区別せず検索できます。')
  })
  it('ブース追加とリンクの表記を統一する', () => {
    expect(UI_TEXT.addBoothGuide).toContain('空いている場所')
    expect(UI_TEXT.xLinkLabel).toBe('Xのリンク')
    expect(UI_TEXT.shopLinkLabel).toBe('通販ページのリンク')
  })
})
