import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { UiThemeSwitch } from './UiThemeSwitch'

describe('UiThemeSwitch', () => {
  it('ライト時はダークテーマへの切り替えを示す', () => {
    const markup = renderToStaticMarkup(<UiThemeSwitch theme="light" onToggle={vi.fn()} />)

    expect(markup).toContain('role="switch"')
    expect(markup).toContain('aria-checked="false"')
    expect(markup).toContain('aria-label="ダークテーマへ切り替える"')
  })

  it('ダーク時はライトテーマへの切り替えを示す', () => {
    const markup = renderToStaticMarkup(<UiThemeSwitch theme="dark" onToggle={vi.fn()} />)

    expect(markup).toContain('aria-checked="true"')
    expect(markup).toContain('aria-label="ライトテーマへ切り替える"')
  })
})
