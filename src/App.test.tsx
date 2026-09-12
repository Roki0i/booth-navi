// @vitest-environment jsdom
import { act, type ComponentProps } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { MapEditor } from './components/editor/MapEditor'
import { createSampleEvent } from './data/sampleEvents'
import { saveLastProjectId, saveProjects } from './storage/eventStorage'

let editor: ComponentProps<typeof MapEditor>
vi.mock('./components/editor/MapEditor', () => ({
  MapEditor: (props: ComponentProps<typeof MapEditor>) => { editor = props; return null },
}))
vi.mock('./components/editor/EventSettingsPanel', () => ({ EventSettingsPanel: () => null }))
vi.mock('./components/editor/BoothEditorPanel', () => ({ BoothEditorPanel: () => null }))
vi.mock('./components/VenueMap', () => ({ VenueMap: () => null }))
vi.mock('./hooks/useImageStorage', () => ({ useImageUrl: () => undefined }))

describe('イベント切り替え時の編集履歴', () => {
  let root: Root
  let container: HTMLDivElement
  const eventA = createSampleEvent('event-a')
  const eventB = createSampleEvent('event-b')
  eventA.booths = eventA.booths.slice(0, 1)
  eventB.booths = eventB.booths.slice(0, 1)
  eventA.name = 'イベントA'
  eventB.name = 'イベントB'
  eventB.booths = eventB.booths.map((booth) => ({ ...booth, id: `b-${booth.id}` }))

  function click(text: string) {
    const button = [...container.querySelectorAll('button')].find((element) => element.textContent?.includes(text))
    expect(button).toBeDefined()
    act(() => button!.click())
  }

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    const storage = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value) },
      clear: () => storage.clear(),
    })
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    localStorage.clear()
    saveProjects([eventA, eventB])
    saveLastProjectId(eventA.id)
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    act(() => root.render(<App />))
    click('編集モード')
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it.each(['Undo', 'Redo'] as const)('Aを編集してBへ切り替えた後の%sでBのブースを上書きしない', (operation) => {
    const edited = eventA.booths.map((booth) => ({ ...booth, circleName: `${booth.circleName} 編集済み` }))
    act(() => editor.onCommit(edited))
    expect(editor.canUndo).toBe(true)
    if (operation === 'Redo') {
      act(() => editor.onUndo())
      expect(editor.canRedo).toBe(true)
    }

    act(() => container.querySelector<HTMLButtonElement>('.brand-button')!.click())
    click('イベントB')
    expect(editor.booths).toEqual(eventB.booths)
    // 無効なボタン経由に限定せず、履歴コールバックを呼んでも別イベントを壊さない。
    act(() => operation === 'Undo' ? editor.onUndo() : editor.onRedo())
    expect(editor.booths).toEqual(eventB.booths)
    expect(editor.canUndo).toBe(false)
    expect(editor.canRedo).toBe(false)
  })

  it('同じイベント内では編集後にUndoとRedoができる', () => {
    const edited = eventA.booths.map((booth) => ({ ...booth, circleName: `${booth.circleName} 編集済み` }))
    act(() => editor.onCommit(edited))
    expect(editor.booths).toEqual(edited)
    act(() => editor.onUndo())
    expect(editor.booths).toEqual(eventA.booths)
    act(() => editor.onRedo())
    expect(editor.booths).toEqual(edited)
  })
})
