// @vitest-environment jsdom
import { act, useLayoutEffect, type ComponentProps } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EventEditor } from './EventEditor'
import type { MapEditor } from './MapEditor'
import { useEventProjects } from '../../hooks/useEventProjects'
import { createSampleEvent } from '../../data/sampleEvents'
import { saveProjects } from '../../storage/eventStorage'
import { putImage } from '../../storage/imageStorage'
import type { EventAssets } from '../../types/event'

// IndexedDB境界のみをメモリ化し、削除されたBlobは再取得できなくする。
const blobs = vi.hoisted(() => new Map<string, Blob>())
vi.mock('../../storage/imageStorage', () => ({
  putImage: vi.fn(async (id: string, blob: Blob) => { blobs.set(id, blob) }),
  getImage: vi.fn(async (id: string) => blobs.get(id)),
  deleteImage: vi.fn(async (id: string) => { blobs.delete(id) }),
}))
let editor: ComponentProps<typeof MapEditor>
vi.mock('./MapEditor', () => ({
  MapEditor: (props: ComponentProps<typeof MapEditor>) => { editor = props; return null },
}))
let manager: ReturnType<typeof useEventProjects>
function Harness() {
  const state = useEventProjects()
  useLayoutEffect(() => { manager = state })
  return <EventEditor key={state.current.id} project={state.current} onChange={state.updateCurrent} onAddProject={state.add} />
}

const fields: [keyof EventAssets, string][] = [
  ['logoImage', 'イベントロゴ'], ['heroImage', 'メインビジュアル'],
  ['pageBackgroundImage', 'ページ背景画像'], ['mapImage', '会場マップ画像'],
]

describe('H4: 保存中の編集と対象切り替え', () => {
  let root: Root
  let container: HTMLDivElement
  let complete: () => void
  const uploader = (label: string) => [...container.querySelectorAll('.image-uploader')].find((node) => node.querySelector('strong')?.textContent === label)!
  async function click(label: string) {
    await act(async () => [...container.querySelectorAll('button')].find((node) => node.textContent === label)!.click())
  }
  async function upload(label: string) {
    const input = uploader(label).querySelector('input[type=file]')!
    Object.defineProperty(input, 'files', { configurable: true, value: [new File(['image'], 'test.png', { type: 'image/png' })] })
    await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })) })
  }
  async function editAlt(label: string, text: string) {
    const input = uploader(label).querySelector('input:not([type=file])')!
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, text)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }
  beforeEach(async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    const storage = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => { storage.set(key, value) } })
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:image', revokeObjectURL: vi.fn() })
    vi.mocked(putImage).mockImplementation((id) => new Promise<IDBValidKey>((resolve) => { complete = () => resolve(id) }))
    const project = createSampleEvent('original')
    project.assets = {}
    project.booths = project.booths.slice(0, 2).map((booth, index) => ({ ...booth, menuImage: { id: `image-${index}`, alt: `alt-${index}` } }))
    saveProjects([project, { ...structuredClone(project), id: 'other', assets: { logoImage: { id: 'other-logo', alt: 'other alt' } } }])
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    await act(async () => root.render(<Harness />))
  })
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.unstubAllGlobals() })

  it.each(fields)('%sの保存完了が途中の編集を巻き戻さない', async (field, label) => {
    await click('画像')
    await upload(label)
    await act(async () => manager.updateCurrent((current) => ({ ...current, name: 'edited', map: { ...current.map, gridSize: 7 }, booths: current.booths.map((booth) => ({ ...booth, description: 'edited booth' })) })))
    await act(async () => complete())
    expect(manager.current.name).toBe('edited')
    expect(manager.current.map.gridSize).toBe(7)
    expect(manager.current.booths[0].description).toBe('edited booth')
    expect(manager.current.assets[field]?.id).toBeDefined()
    if (field === 'mapImage') expect(manager.current.map.backgroundImage).toEqual(manager.current.assets.mapImage)
  })
  it('お品書き保存は最新のブースを更新し、Undoでも途中の編集を保つ', async () => {
    const id = manager.current.booths[0].id
    await act(async () => editor.onSelect(id))
    await upload('ブースのお品書き')
    await act(async () => manager.updateCurrent((current) => ({ ...current, name: 'edited', booths: current.booths.map((booth) => ({ ...booth, description: 'edited booth' })) })))
    await editAlt('ブースのお品書き', 'new alt')
    await act(async () => complete())
    expect(manager.current.name).toBe('edited')
    expect(manager.current.booths[0].description).toBe('edited booth')
    expect(manager.current.booths[0].menuImage?.alt).toBe('new alt')
    await act(async () => editor.onUndo())
    expect(manager.current.booths[0].description).toBe('edited booth')
    expect(manager.current.booths[0].menuImage?.id).toBe('image-0')
  })
  it('ブース切り替えで代替テキストを切り替え、古い保存結果を混入させない', async () => {
    await act(async () => editor.onSelect(manager.current.booths[0].id))
    await upload('ブースのお品書き')
    await act(async () => editor.onSelect(manager.current.booths[1].id))
    expect((uploader('ブースのお品書き').querySelector('input:not([type=file])') as HTMLInputElement).value).toBe('alt-1')
    await act(async () => complete())
    expect(manager.current.booths[1].menuImage).toEqual({ id: 'image-1', alt: 'alt-1' })
  })
  it('保存中に画像を削除した場合、遅い保存完了で復活しない', async () => {
    await act(async () => editor.onSelect(manager.current.booths[0].id))
    await upload('ブースのお品書き')
    await click('画像を削除')
    await act(async () => complete())
    expect(manager.current.booths[0].menuImage).toBeUndefined()
    expect((uploader('ブースのお品書き').querySelector('input:not([type=file])') as HTMLInputElement).value).toBe('')
  })
  it('同じ対象への連続アップロードは最後に選んだ画像を保つ', async () => {
    await click('画像')
    await upload('イベントロゴ')
    const first = complete
    await upload('イベントロゴ')
    await act(async () => complete())
    const latest = manager.current.assets.logoImage
    await act(async () => first())
    expect(manager.current.assets.logoImage).toEqual(latest)
  })
  it('イベント切り替え後は古い保存結果や代替テキストを表示しない', async () => {
    await click('画像')
    await upload('イベントロゴ')
    await act(async () => manager.setCurrentId('other'))
    await click('画像')
    await act(async () => complete())
    expect(manager.current.assets.logoImage).toEqual({ id: 'other-logo', alt: 'other alt' })
    expect((uploader('イベントロゴ').querySelector('input:not([type=file])') as HTMLInputElement).value).toBe('other alt')
  })
})
