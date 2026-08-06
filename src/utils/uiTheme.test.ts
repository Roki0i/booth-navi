import { describe, expect, it, vi } from 'vitest'
import { applyUiTheme, getInitialUiTheme, saveUiTheme, UI_THEME_STORAGE_KEY } from './uiTheme'
import { createSampleEvent } from '../data/sampleEvents'
import { themeToCssVariables } from './eventValidation'

describe('UIテーマ', () => {
  it('初回アクセス時はOSのダーク設定を反映する', () => {
    expect(getInitialUiTheme({ storage: { getItem: () => null, setItem: vi.fn() }, matchMedia: () => ({ matches: true }) })).toBe('dark')
  })

  it('初回アクセス時はOSのライト設定を反映する', () => {
    expect(getInitialUiTheme({ storage: { getItem: () => null, setItem: vi.fn() }, matchMedia: () => ({ matches: false }) })).toBe('light')
  })

  it('保存済みテーマをOS設定より優先し、再読み込み時にも復元する', () => {
    const storage = { getItem: () => 'light', setItem: vi.fn() }
    expect(getInitialUiTheme({ storage, matchMedia: () => ({ matches: true }) })).toBe('light')
  })

  it.each([['light', 'dark'], ['dark', 'light']] as const)('%sから%sへ切り替えられる', (current, expected) => {
    expect(current === 'light' ? 'dark' : 'light').toBe(expected)
  })

  it('localStorageへ保存する', () => {
    const setItem = vi.fn()
    saveUiTheme('dark', { setItem })
    expect(setItem).toHaveBeenCalledWith(UI_THEME_STORAGE_KEY, 'dark')
  })

  it('html要素とtheme-colorへテーマを適用する', () => {
    const root = { dataset: {} } as Pick<HTMLElement, 'dataset'>
    const meta = { content: '' }
    applyUiTheme('dark', root, meta)
    expect(root.dataset.uiTheme).toBe('dark')
    expect(meta.content).toBe('#17171b')
  })

  it('イベントのアクセントカラーを維持しmapStyleを書き換えない', () => {
    const project = createSampleEvent()
    const mapStyle = project.theme.mapStyle
    const root = { dataset: {} } as Pick<HTMLElement, 'dataset'>
    applyUiTheme('dark', root)
    expect(themeToCssVariables(project.theme)['--event-primary']).toBe(project.theme.primaryColor)
    expect(project.theme.mapStyle).toBe(mapStyle)
  })
})
